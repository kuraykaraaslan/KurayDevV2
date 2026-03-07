# Scripts Guide

This directory contains utility scripts for managing the project's i18n system and other tasks.

## Available Scripts

### 1️⃣ Translation Management

#### `translate-and-add-missing-keys.ts`
Automatically fills missing translation keys using AI.

**Usage:**
```bash
npm run translate              # Translate all languages
npx tsx scripts/translate-and-add-missing-keys.ts all
npx tsx scripts/translate-and-add-missing-keys.ts tr  # Specific language
```

**What it does:**
- Compares all language files against `en.json` (base language)
- Finds missing keys in target languages
- Uses AI to translate missing keys
- Updates dictionary files automatically

---

#### `remove-unused-dictionary-keys.ts`
Removes unused translation keys from dictionary files.

**Usage:**
```bash
npm run translate:clean        # Clean all languages
npm run translate:clean all    # Clean all languages (explicit)
npm run translate:clean tr     # Clean specific language
npm run translate:clean en tr es  # Clean multiple languages
```

**What it does:**
- Scans all dictionary keys
- Searches codebase (`app/`, `components/`, `views/`, `helpers/`) for key usage
- Identifies unused keys
- Removes unused keys from dictionary files
- Shows progress and summary

**Example output:**
```
🔍 Scanning for unused dictionary keys...

📄 Processing: en.json
   Total keys: 1061
   Checking usage in codebase...
   Progress: 1061/1061
   🗑️  Found 15 unused keys:
      - admin.old_feature.title
      - common.deprecated_button
      - auth.legacy_flow.message
      ... and 12 more
   ✅ Removed 15 unused keys
   📊 Remaining: 1046 keys

✨ Cleanup complete!
```

**⚠️ Important Notes:**
- **Backup your files before running!** The script modifies dictionary files directly.
- The script uses grep to search for key usage, so it checks actual usage patterns.
- Keys used in dynamic contexts (e.g., computed keys) might be marked as unused — review the list before accepting removals.
- It's recommended to run this after major refactoring or feature removal.

---

#### `check-missing-dictionary-keys.ts`
Checks which keys are missing in target languages compared to English.

**Usage:**
```bash
npx tsx scripts/check-missing-dictionary-keys.ts     # Check all languages
npx tsx scripts/check-missing-dictionary-keys.ts tr  # Check specific language
```

**What it does:**
- Compares target language against `en.json`
- Lists missing keys (doesn't modify files)
- Shows count of missing keys per language

---

#### `translate-metadata-to-all-langs.ts`
Translates metadata (SEO titles, descriptions, keywords) to all languages.

**Usage:**
```bash
npx tsx scripts/translate-metadata-to-all-langs.ts
```

---

### 2️⃣ User Management

#### `user-create.ts`
Creates a new user account from CLI.

**Usage:**
```bash
npm run user:create
npx tsx scripts/user-create.ts
```

---

## Workflow Recommendations

### After Code Refactoring
1. **Clean unused keys:**
   ```bash
   npm run translate:clean all
   ```

2. **Check for missing keys:**
   ```bash
   npx tsx scripts/check-missing-dictionary-keys.ts
   ```

3. **Fill missing keys:**
   ```bash
   npm run translate
   ```

### Before Deployment
1. **Always run translate in prebuild:**
   - This is already configured in `package.json` as `prebuild` hook
   - Ensures all languages have complete translations

### Monthly Maintenance
1. Clean unused keys to keep dictionaries lean
2. Review removed keys list to ensure no false positives
3. Commit cleaned dictionaries

---

## Technical Details

### Key Search Algorithm
The cleanup script searches for keys using multiple patterns:
- Full key path: `admin.posts.title`
- Last segment: `title`
- Last two segments: `posts.title`

This ensures keys like `t('admin.posts.title')`, `dict.posts.title`, or `"title"` are all detected.

### Directory Structure
```
dictionaries/
├── en.json          # Base language (source of truth)
├── tr.json          # Turkish
├── ar.json          # Arabic
└── ... (26 languages total)
```

---

## Safety Features

- ✅ Progress indicators for long operations
- ✅ Dry-run verification (shows what will be removed before actual removal)
- ✅ Preserves JSON formatting (2-space indentation)
- ✅ Error handling for file operations
- ✅ UTF-8 encoding support for all languages

---

## Contributing

When adding new scripts:
1. Use TypeScript (`.ts`)
2. Add executable shebang: `#!/usr/bin/env tsx`
3. Include proper error handling
4. Update this README
5. Add npm script alias in `package.json`

---

*Last updated: March 2026*
