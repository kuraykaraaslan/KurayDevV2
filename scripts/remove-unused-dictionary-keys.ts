#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Dict = Record<string, any>;

// Get all keys from a dictionary object recursively
function getAllKeys(obj: Dict, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys = keys.concat(getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

// Check if a key is used in the codebase
function isKeyUsed(key: string): boolean {
  const searchDirs = ['app', 'components', 'views', 'helpers'];
  
  try {
    // Search for the key in the codebase
    // Look for patterns like: t('key'), dict.key, "key", 'key'
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Split key into parts for partial matching (e.g., "admin.posts.title" -> check "posts.title", "title" too)
    const keyParts = key.split('.');
    const searchPatterns: string[] = [];
    
    // Full key
    searchPatterns.push(escapedKey);
    
    // Last part only (most common usage)
    if (keyParts.length > 1) {
      searchPatterns.push(keyParts[keyParts.length - 1]);
    }
    
    // Last two parts
    if (keyParts.length > 2) {
      searchPatterns.push(`${keyParts[keyParts.length - 2]}.${keyParts[keyParts.length - 1]}`);
    }
    
    for (const pattern of searchPatterns) {
      for (const dir of searchDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) continue;
        
        try {
          // Use grep to search for the pattern
          const grepCmd = `grep -r -l "${pattern}" ${dirPath} 2>/dev/null || true`;
          const result = execSync(grepCmd, { encoding: 'utf8' });
          
          if (result.trim().length > 0) {
            return true; // Key is used
          }
        } catch (err) {
          // Continue checking other patterns
        }
      }
    }
    
    return false; // Key not found anywhere
  } catch (err) {
    console.error(`Error checking key "${key}":`, err);
    return true; // Assume it's used to be safe
  }
}

// Remove unused keys from a dictionary object
function removeUnusedKeys(obj: Dict, unusedKeys: Set<string>, prefix = ''): Dict {
  const result: Dict = {};
  
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      const nestedResult = removeUnusedKeys(value, unusedKeys, fullKey);
      // Only include if it has keys
      if (Object.keys(nestedResult).length > 0) {
        result[key] = nestedResult;
      }
    } else {
      // Check if this key is in the unused set
      if (!unusedKeys.has(fullKey)) {
        result[key] = value;
      }
    }
  }
  
  return result;
}

// Main execution
async function main() {
  const dictionariesDir = path.join(__dirname, '../dictionaries');
  
  // Get target languages from CLI args
  const args = process.argv.slice(2);
  let targetFiles: string[] = [];
  
  if (args.length === 0 || args[0] === 'all') {
    // Process all language files
    targetFiles = fs.readdirSync(dictionariesDir).filter(f => f.endsWith('.json'));
  } else {
    // Process specific language files
    targetFiles = args.map(lang => lang.endsWith('.json') ? lang : `${lang}.json`);
  }
  
  console.log('🔍 Scanning for unused dictionary keys...\n');
  
  for (const file of targetFiles) {
    const filePath = path.join(dictionariesDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${file}`);
      continue;
    }
    
    console.log(`📄 Processing: ${file}`);
    
    const data: Dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const allKeys = getAllKeys(data);
    
    console.log(`   Total keys: ${allKeys.length}`);
    console.log(`   Checking usage in codebase...`);
    
    const unusedKeys = new Set<string>();
    let checkedCount = 0;
    
    for (const key of allKeys) {
      checkedCount++;
      if (checkedCount % 50 === 0) {
        process.stdout.write(`\r   Progress: ${checkedCount}/${allKeys.length}`);
      }
      
      if (!isKeyUsed(key)) {
        unusedKeys.add(key);
      }
    }
    
    process.stdout.write(`\r   Progress: ${allKeys.length}/${allKeys.length}\n`);
    
    if (unusedKeys.size === 0) {
      console.log(`   ✅ No unused keys found!\n`);
      continue;
    }
    
    console.log(`   🗑️  Found ${unusedKeys.size} unused keys:`);
    Array.from(unusedKeys).slice(0, 10).forEach(key => {
      console.log(`      - ${key}`);
    });
    if (unusedKeys.size > 10) {
      console.log(`      ... and ${unusedKeys.size - 10} more`);
    }
    
    // Remove unused keys
    const cleanedData = removeUnusedKeys(data, unusedKeys);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2) + '\n', 'utf8');
    
    const removedCount = unusedKeys.size;
    const remainingCount = allKeys.length - removedCount;
    
    console.log(`   ✅ Removed ${removedCount} unused keys`);
    console.log(`   📊 Remaining: ${remainingCount} keys\n`);
  }
  
  console.log('✨ Cleanup complete!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
