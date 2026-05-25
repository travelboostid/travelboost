import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lang = process.argv[2];

if (!lang) {
    console.error('Usage: node i18n-diff.mjs <lang>');
    process.exit(1);
}

const basePath = path.join(__dirname, '../resources/js/lang');

const enFile = path.join(basePath, 'en.json');
const targetFile = path.join(basePath, `${lang}.json`);
const diffFile = path.join(basePath, `${lang}.diff.json`);

const readJson = (file) => {
    try {
        if (!fs.existsSync(file)) return {};
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return {};
    }
};

const en = readJson(enFile);
const target = readJson(targetFile);

const diff = {};
let missing = 0;

for (const key of Object.keys(en)) {
    if (!(key in target)) {
        // 🔥 copy ENGLISH default value
        diff[key] = en[key];
        missing++;
    }
}

fs.writeFileSync(diffFile, JSON.stringify(diff, null, 2));

console.log(`✔ Diff generated: ${diffFile}`);
console.log(`✔ Missing keys: ${missing}`);
