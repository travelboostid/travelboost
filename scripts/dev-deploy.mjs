import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { $ } from 'execa';
import path from 'path';
import process from 'process';

const root = path.resolve(import.meta.dirname, '..');
const buildPath = 'public/build';

const fail = (ok, msg) => {
    if (!ok) {
        throw new Error(msg);
    }
};

async function deploy() {
    // CLI
    const opts = new Command()
        .name('dev-deploy')
        .description('Deploy backend and frontend to VPS via SSH')
        .option(
            '-e, --env <name>',
            'preset env file (.env.preset.<name>)',
            'dev',
        )
        .option(
            '--skip-backend',
            'skip VPS backend (git pull, .env upload, composer, migrate)',
        )
        .option(
            '--skip-frontend',
            'skip local pnpm build and public/build upload',
        )
        .option(
            '--skip-composer',
            'skip remote composer install --no-dev',
        )
        .option('--skip-migrate', 'skip remote php artisan migrate --force')
        .option(
            '--skip-supervisor',
            'skip remote supervisorctl restart all',
        )
        .option(
            '--skip-optimize',
            'skip remote php artisan optimize:clear',
        )
        .option(
            '--skip-local-branch',
            'skip check that local git branch matches DEPLOY_BRANCH',
        )
        .option(
            '--skip-remote-branch',
            'skip check that VPS git branch matches DEPLOY_BRANCH',
        )
        .parse()
        .opts();

    // Load preset env (supports ${VAR} expansion)
    const envFile = path.join(root, `.env.preset.${opts.env}`);
    const loaded = dotenv.config({ path: envFile });
    if (loaded.error) {
        throw new Error(`Failed to read ${envFile}: ${loaded.error.message}`);
    }
    dotenvExpand.expand(loaded);

    const {
        DEPLOY_BRANCH,
        DEPLOY_SSH_USER,
        DEPLOY_SSH_HOST,
        DEPLOY_TARGET_PATH,
    } = process.env;

    // Shell helpers
    const target = `${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}`;
    const exec = async (cmd) =>
        (await $({ shell: true })`${cmd}`).stdout.trim();
    const ssh = async (cmd) => (await $`ssh ${target} ${cmd}`).stdout.trim();
    const scp = (from, to) => exec(`scp ${from} ${target}:${to}`);

    // Prechecks: local git state + remote branch
    if (!opts.skipLocalBranch) {
        const current = await exec('git branch --show-current');
        fail(
            current === DEPLOY_BRANCH,
            `Current branch is "${current}", must be "${DEPLOY_BRANCH}"`,
        );
    }

    fail(
        !(await exec('git status --porcelain')),
        'You have uncommitted changes',
    );

    if (!opts.skipRemoteBranch) {
        const remoteBranch = await ssh(
            `git -C ${DEPLOY_TARGET_PATH} rev-parse --abbrev-ref HEAD`,
        );
        fail(
            remoteBranch === DEPLOY_BRANCH,
            `Remote branch is "${remoteBranch}", must be "${DEPLOY_BRANCH}"`,
        );
    }

    // Backend: pull code, upload env, run remote steps
    if (!opts.skipBackend) {
        await ssh(`git -C ${DEPLOY_TARGET_PATH} pull origin ${DEPLOY_BRANCH}`);
        await scp(envFile, `${DEPLOY_TARGET_PATH}/.env`);

        const steps = [`cd ${DEPLOY_TARGET_PATH}`];

        if (!opts.skipComposer) {
            steps.push('composer install --no-dev --optimize-autoloader');
        }
        if (!opts.skipMigrate) {
            steps.push('php artisan migrate --force');
        }
        if (!opts.skipOptimize) {
            steps.push('php artisan optimize:clear');
        }
        if (!opts.skipSupervisor) {
            steps.push('sudo supervisorctl restart all');
        }

        await ssh(steps.join(' && '));
    }

    // Frontend: build locally, upload public/build to VPS
    if (!opts.skipFrontend) {
        await exec('pnpm install --frozen-lockfile');
        await exec('pnpm build');

        const remoteBuild = `${DEPLOY_TARGET_PATH}/${buildPath}`;

        try {
            await exec(
                `rsync -avz --delete ${buildPath}/ ${target}:${remoteBuild}/`,
            );
        } catch {
            await exec(`scp -r ${buildPath}/* ${target}:${remoteBuild}/`);
        }
    }

    console.log('\n✅ Deploy successful');
}

$.verbose = true;

try {
    await deploy();
} catch (err) {
    console.error('\n❌ Deploy failed:', err.message ?? err);
    process.exit(1);
}
