import { execSync } from 'child_process';
import fs from 'fs';
import process from 'process';

// CONFIGS
const DEV_CONFIG = {
    env: 'development',
    branch: 'dev',
    sshUser: 'travelboost',
    sshHost: '103.127.138.76',
    remotePath: '~/travelboost',
    buildPath: 'public/build',
};

const MAIN_CONFIG = {
    env: 'production',
    branch: 'main',
    sshUser: 'travelboost',
    sshHost: '103.93.163.174',
    remotePath: '~/travelboost',
    buildPath: 'public/build',
};

function showHelp() {
    console.log(`
Usage:
  node scripts/dev-deploy.mjs -c <dev|main> [options]
  pnpm dev:deploy -- -c <dev|main> [options]

Options:
  -c, --config              Deployment target (default: dev)
  --frontend-only           Only build frontend and upload assets
  --skip-composer           Skip remote composer install
  --skip-migrate            Skip remote php artisan migrate
  --skip-supervisor         Skip remote supervisorctl restart
  --skip-frontend-build     Skip local pnpm install/build and asset upload
  -h, --help                Show this help
`);
}

function parseArgs() {
    const args = process.argv.slice(2);

    if (args.includes('-h') || args.includes('--help')) {
        showHelp();
        process.exit(0);
    }

    let configName = 'dev';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-c' || args[i] === '--config') {
            configName = args[i + 1];
            break;
        }
    }

    const frontendOnly = args.includes('--frontend-only');

    const skips = {
        composer: args.includes('--skip-composer'),
        migrate: args.includes('--skip-migrate'),
        supervisor: args.includes('--skip-supervisor'),
        frontendBuild: args.includes('--skip-frontend-build'),
    };

    if (frontendOnly && skips.frontendBuild) {
        console.error(
            '❌ --frontend-only cannot be used with --skip-frontend-build.',
        );
        process.exit(1);
    }

    let config;

    switch (configName) {
        case 'dev':
            config = DEV_CONFIG;
            break;

        case 'main':
            config = MAIN_CONFIG;
            break;

        default:
            console.error(
                `❌ Invalid config "${configName}". Expected "dev" or "main".`,
            );
            process.exit(1);
    }

    return { config, skips, frontendOnly };
}

const { config: CONFIG, skips: SKIP, frontendOnly: FRONTEND_ONLY } =
    parseArgs();

// HELPERS
function run(cmd, options = {}) {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', ...options });
}

function getOutput(cmd) {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function assert(condition, message) {
    if (!condition) {
        console.error(`\n❌ ${message}`);
        process.exit(1);
    }
}

function ssh(cmd) {
    const { sshUser, sshHost } = CONFIG;

    return `ssh ${sshUser}@${sshHost} "${cmd}"`;
}

// DEPLOY
try {
    const { env, branch, remotePath, buildPath, sshUser, sshHost } = CONFIG;

    const skippedSteps = Object.entries(SKIP)
        .filter(([, skipped]) => skipped)
        .map(([step]) => step);

    console.log(`🚀 Deploying ${env}${FRONTEND_ONLY ? ' (frontend only)' : ''}...`);

    if (!FRONTEND_ONLY && skippedSteps.length > 0) {
        console.log(`⏭️  Skipping: ${skippedSteps.join(', ')}`);
    }

    // --- 0. Pre-checks ---
    const envFile = fs.readFileSync('.env', 'utf-8');

    assert(envFile.includes(`APP_ENV=${env}`), `APP_ENV must be ${env}`);

    if (!FRONTEND_ONLY) {
        // --- 1. Git safety checks ---
        const currentBranch = getOutput('git rev-parse --abbrev-ref HEAD');

        assert(
            currentBranch === branch,
            `Current branch is "${currentBranch}", must be "${branch}"`,
        );

        const status = getOutput('git status --porcelain');

        assert(status === '', 'You have uncommitted changes');

        run('git fetch origin');

        const local = getOutput('git rev-parse HEAD');
        const remote = getOutput(`git rev-parse origin/${branch}`);

        assert(
            local === remote,
            `Local branch is not up-to-date with origin/${branch}`,
        );

        // --- 2. Upload .env ---
        run(`scp .env ${sshUser}@${sshHost}:${remotePath}/.env`);

        // --- 3. Update VPS backend ---
        const remoteSteps = [`cd ${remotePath}`, `git pull origin ${branch}`];

        if (!SKIP.composer) {
            remoteSteps.push('composer install --no-dev --optimize-autoloader');
        }

        if (!SKIP.migrate) {
            remoteSteps.push('php artisan migrate --force');
        }

        remoteSteps.push('php artisan optimize:clear');

        if (!SKIP.supervisor) {
            remoteSteps.push('sudo supervisorctl restart all');
        }

        run(ssh(remoteSteps.join(' && ')));
    }

    // --- 4. Build frontend ---
    if (FRONTEND_ONLY || !SKIP.frontendBuild) {
        run('pnpm install --frozen-lockfile');
        run('pnpm build');

        // --- 5. Upload assets ---
        const remoteBuildPath = `${sshUser}@${sshHost}:${remotePath}/${buildPath}`;

        try {
            run(`rsync -avz --delete ${buildPath}/ ${remoteBuildPath}/`);
        } catch {
            console.log('⚠️ rsync not found, fallback to scp...');
            run(`scp -r ${buildPath}/* ${remoteBuildPath}/`);
        }
    }

    console.log('\n✅ Deploy successful');
} catch (err) {
    console.error('\n❌ Deploy failed', err);
    process.exit(1);
}
