import { execSync } from 'child_process';
import process from 'process';

// CONFIGS
const CONFIG = {
  branch: 'dev',
  sshUser: 'travelboost',
  sshHost: '103.127.138.76',
  remotePath: '~/travelboost-dev',
  buildPath: 'public/build',
};

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

  const { branch, remotePath, buildPath } = CONFIG;

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

  // --- 2. Update VPS backend ---
  run(
    ssh(
      `cd ${remotePath} && ` +
        `git pull origin ${branch} && ` +
        `composer install --no-dev --optimize-autoloader && ` +
        `php artisan migrate --force`,
    ),
  );

  // --- 3. Build frontend ---
  run('pnpm install --frozen-lockfile');
  run('pnpm build');

  // --- 4. Upload assets ---
  const remoteBuildPath = `${CONFIG.sshUser}@${CONFIG.sshHost}:${remotePath}/${buildPath}`;

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
