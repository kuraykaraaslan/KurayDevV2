import fs from 'fs';
import path from 'path';

type Dict = Record<string, any>;

// Helper to recursively get all keys from an object, with dot notation for nested keys
function getAllKeys(obj: Dict, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        keys = keys.concat(getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}


const dictionariesDir = path.join(__dirname, '../dictionaries');
const baseLang = 'en.json';
const files = fs.readdirSync(dictionariesDir).filter(f => f.endsWith('.json'));

const baseData: Dict = JSON.parse(fs.readFileSync(path.join(dictionariesDir, baseLang), 'utf8'));
const baseKeys = getAllKeys(baseData);

// CLI arg: node check-missing-dictionary-keys.ts tr
const argLang = process.argv[2]; // e.g. 'tr'
let checkFiles: string[];
if (argLang) {
  const fileName = argLang.endsWith('.json') ? argLang : argLang + '.json';
  if (!files.includes(fileName)) {
    console.error(`Language file not found: ${fileName}`);
    process.exit(1);
  }
  checkFiles = [fileName];
} else {
  checkFiles = files.filter(file => file !== baseLang);
}


checkFiles.forEach(file => {
  const filePath = path.join(dictionariesDir, file);
  const data: Dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const keys = getAllKeys(data);
  const missing = baseKeys.filter(k => !keys.includes(k));
  const extra = keys.filter(k => !baseKeys.includes(k));

  if (missing.length > 0) {
    console.log(`\nMissing keys in ${file}:`);
    missing.forEach(k => console.log('  ' + k));
  } else {
    console.log(`\nNo missing keys in ${file}.`);
  }

  if (extra.length > 0) {
    console.log(`Extra keys in ${file}:`);
    extra.forEach(k => console.log('  ' + k));
  } else {
    console.log(`No extra keys in ${file}.`);
  }
});

console.log('\nCheck complete.');
