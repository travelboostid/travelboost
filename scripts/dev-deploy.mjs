import { execSync } from 'child_process';
import fs from 'fs';
import process from 'process';

// CONFIGS
const DEV_CONFIG = {
    branch: 'dev',
    sshUser: 'travelboost',
    sshHost: '103.127.138.76',
    remotePath: '~/travelboost',
    buildPath: 'public/build',
};

const MAIN_CONFIG = {
    branch: 'main',
    sshUser: 'travelboost',
    sshHost: '103.93.163.174',
    remotePath: '~/travelboost',
    buildPath: 'public/build',
};

function showHelp() {
    console.log(`
Usage:
  node deploy.mjs -c <dev|main>
  node deploy.mjs --config <dev|main>

Options:
  -c, --config   Deployment target
  -h, --help     Show this help
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

    switch (configName) {
        case 'dev':
            return DEV_CONFIG;

        case 'main':
            return MAIN_CONFIG;

        default:
            console.error(
                `❌ Invalid config "${configName}". Expected "dev" or "main".`,
            );
            process.exit(1);
    }
}

const CONFIG = parseArgs();

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
    console.log('🚀 Deploying...');

    const { branch, remotePath, buildPath, sshUser, sshHost } = CONFIG;

    // --- 0. Pre-checks ---
    const env = fs.readFileSync('.env', 'utf-8');

    assert(env.includes('APP_ENV=development'), 'APP_ENV must be development');

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
    run(
        ssh(
            `cd ${remotePath} && ` +
                `git pull origin ${branch} && ` +
                `composer install --no-dev --optimize-autoloader && ` +
                `php artisan migrate --force && ` +
                `php artisan optimize:clear && ` +
                `sudo supervisorctl restart all`,
        ),
    );

    // --- 4. Build frontend ---
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

    console.log('\n✅ Deploy successful');
} catch (err) {
    console.error('\n❌ Deploy failed', err);
    process.exit(1);
}
