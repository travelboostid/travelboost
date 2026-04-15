import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lang = process.argv[2];

if (!lang) {
  console.error('Usage: node i18n-merge.mjs <lang>');
  process.exit(1);
}

// ✅ Inertia correct path
const basePath = path.join(__dirname, '../resources/js/lang');

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

const target = readJson(targetFile);
const diff = readJson(diffFile);

// 🔍 debug (VERY important for your case)
console.log('[i18n merge] target keys:', Object.keys(target).length);
console.log('[i18n merge] diff keys:', Object.keys(diff).length);

const merged = { ...target };

let added = 0;

for (const key of Object.keys(diff)) {
  if (!(key in merged)) {
    merged[key] = diff[key];
    added++;
  }
}

// stable output (important for git + Inertia reload)
const sorted = Object.keys(merged)
  .sort()
  .reduce((acc, key) => {
    acc[key] = merged[key];
    return acc;
  }, {});

fs.writeFileSync(targetFile, JSON.stringify(sorted, null, 2));

console.log(`✔ Merged into: ${targetFile}`);
console.log(`✔ Added keys: ${added}`);

if (fs.existsSync(diffFile)) {
  fs.unlinkSync(diffFile);
  console.log(`✔ Diff removed`);
}
