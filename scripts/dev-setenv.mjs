import { select } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import process from 'process';

const cwd = process.cwd();

// 1. Scan preset files
const files = fs.readdirSync(cwd).filter((f) => f.startsWith('.env.preset.'));

if (files.length === 0) {
    console.error('No .env.preset.* files found');
    process.exit(1);
}

// 2. Extract top comment as description
function getDescription(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0]?.trim();

    if (firstLine?.startsWith('#')) {
        return firstLine.replace(/^#\s*/, '');
    }

    return 'No description';
}

const choices = files.map((file) => {
    const fullPath = path.join(cwd, file);
    const desc = getDescription(fullPath);

    return {
        name: `${file}\n    ${desc}`,
        value: file,
    };
});

// 3. Ask user to select
const selected = await select({
    message: 'Select env preset:',
    pageSize: 10,
    choices,
});

const selectedPath = path.join(cwd, selected);
const envPath = path.join(cwd, '.env');

// 4. Replace .env
fs.copyFileSync(selectedPath, envPath);

console.log(`✔ .env replaced with ${selected}`);
