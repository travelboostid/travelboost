import { select } from '@inquirer/prompts';
import { spawn } from 'child_process';
import process from 'process';

const actions = [
  {
    name: 'Initialize development environment',
    value: 'dev:init',
    desc: 'Install dependencies and set up .env',
  },
  {
    name: 'Start fullstack development servers (Vite + Laravel + Queue + Reverb)',
    value: 'dev:full',
    desc: 'Run full dev stack (web, queue worker, websocket, vite)',
  },
  {
    name: 'Start minimal development servers (Vite + Laravel)',
    value: 'dev:min',
    desc: 'Run only web server and frontend',
  },
  {
    name: 'Set environment preset',
    value: 'dev:setenv',
    desc: 'Choose .env.preset.* and apply to .env',
  },
  {
    name: 'Deploy to dev server',
    value: 'dev:deploy',
    desc: 'Run deployment script for development environment',
  },
  {
    name: 'Extract i18n messages',
    value: 'i18n:extract',
    desc: 'Scan code and generate translation keys',
  },
  {
    name: 'Diff i18n messages',
    value: 'i18n:diff',
    desc: 'Compare current i18n messages with previous version',
  },
  {
    name: 'Merge i18n messages',
    value: 'i18n:merge',
    desc: 'Merge new messages into existing translation files',
  },
  {
    name: 'Lint & format',
    value: 'lint',
    desc: 'Run eslint and prettier autofix',
  },
];

function runScript(script) {
  const child = spawn('pnpm', [script], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}

const selected = await select({
  message: 'Select action',
  pageSize: 10,
  choices: actions.map((a) => ({
    name: `${a.name}\n   ${a.desc}`,
    value: a.value,
  })),
});

runScript(selected);
