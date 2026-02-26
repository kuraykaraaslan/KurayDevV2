import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

type Json = Record<string, any>;

function isPlainObject(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Leaf keys (dot notation) under a given object */
function getLeafKeys(obj: any, prefix = ""): string[] {
  if (!isPlainObject(obj)) return [];
  const out: string[] = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) out.push(...getLeafKeys(value, fullKey));
    else out.push(fullKey);
  }
  return out;
}

function getNested(obj: Json, dotPath: string): any {
  const parts = dotPath.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setNested(obj: Json, dotPath: string, value: any) {
  const parts = dotPath.split(".");
  let cur: any = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!isPlainObject(cur[p])) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function readJson(filePath: string): Json {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: Json) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function ensureJsonExt(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

function listDictionaryFiles(dictionariesDir: string): string[] {
  return fs
    .readdirSync(dictionariesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dictionariesDir, f));
}

function parseArgs(argv: string[]) {
  // usage:
  //   node dist/scripts/translate-metadata-in-all-languages.js
  // options:
  //   --base en.json
  //   --only tr.json (single file)
  //   --dry-run
  //   --batch 40
  //   --model gpt-4o
  //   --overwrite (force overwrite even if already translated)
  const baseIndex = argv.indexOf("--base");
  const baseFile = ensureJsonExt(baseIndex !== -1 ? argv[baseIndex + 1] || "en" : "en");

  const onlyIndex = argv.indexOf("--only");
  const onlyFile = onlyIndex !== -1 ? ensureJsonExt(argv[onlyIndex + 1] || "") : null;

  const dryRun = argv.includes("--dry-run");
  const overwrite = argv.includes("--overwrite");

  const batchIndex = argv.indexOf("--batch");
  const batchSize = batchIndex !== -1 ? parseInt(argv[batchIndex + 1] || "40", 10) : 40;

  const modelIndex = argv.indexOf("--model");
  const model = modelIndex !== -1 ? argv[modelIndex + 1] || "gpt-4o" : "gpt-4o";

  return { baseFile, onlyFile, dryRun, overwrite, batchSize, model };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing. Put it in .env or your shell env.");
    process.exit(1);
  }

  // IMPORTANT: import AFTER dotenv.config()
  const { default: OpenAIService } = await import("../services/OpenAIService");

  const { baseFile, onlyFile, dryRun, overwrite, batchSize, model } = parseArgs(process.argv);

  const dictionariesDir = path.resolve(__dirname, "../dictionaries");
  const basePath = path.join(dictionariesDir, baseFile);

  if (!fs.existsSync(basePath)) {
    console.error(`Base dictionary not found: ${basePath}`);
    process.exit(1);
  }

  const baseData = readJson(basePath);
  const baseLang = baseFile.replace(".json", "");

  const baseMetadata = baseData?.metadata;
  if (!isPlainObject(baseMetadata)) {
    console.error(`Base file "${baseFile}" has no "metadata" object.`);
    process.exit(1);
  }

  const baseMetadataLeafKeys = getLeafKeys(baseMetadata).sort();

  const allFiles = listDictionaryFiles(dictionariesDir);
  const targetFiles = onlyFile
    ? allFiles.filter((fp) => path.basename(fp) === onlyFile)
    : allFiles.filter((fp) => path.basename(fp) !== baseFile); // skip base itself

  if (targetFiles.length === 0) {
    console.log("No target dictionary files found.");
    return;
  }

  console.log(`Base: ${baseFile} (${baseLang})`);
  console.log(`Targets: ${targetFiles.length} file(s)`);
  console.log(`Mode: ${overwrite ? "overwrite" : "fill missing / English leftovers only"}`);

  for (const filePath of targetFiles) {
    const fileName = path.basename(filePath);
    const targetLang = fileName.replace(".json", "");

    const targetData = readJson(filePath);
    if (!isPlainObject(targetData.metadata)) targetData.metadata = {};

    // Build items to translate based on base metadata English strings
    const items: { key: string; text: string }[] = [];

    for (const leafKey of baseMetadataLeafKeys) {
      const baseVal = getNested(baseMetadata, leafKey);
      if (typeof baseVal !== "string" || baseVal.trim().length === 0) continue;

      const targetVal = getNested(targetData.metadata, leafKey);

      // Decide whether to translate this leaf:
      // - overwrite: always translate
      // - otherwise: translate if missing OR exactly equals base english (still English bug)
      const shouldTranslate =
        overwrite ||
        typeof targetVal !== "string" ||
        targetVal.trim().length === 0 ||
        targetVal === baseVal;

      if (shouldTranslate) {
        items.push({
          key: `metadata.${leafKey}`, // full path for apply step
          text: baseVal, // English source
        });
      }
    }

    if (items.length === 0) {
      console.log(`- ${fileName}: metadata ok (nothing to translate)`);
      continue;
    }

    console.log(`- ${fileName}: translating ${items.length} metadata key(s) (${baseLang} -> ${targetLang})`);

    const translations = await OpenAIService.translateMultipleKeys(items, targetLang, baseLang, {
      batchSize,
      model,
    });

    let applied = 0;
    let missed = 0;

    for (const item of items) {
      const tr = translations[item.key];
      if (typeof tr === "string" && tr.trim().length > 0) {
        // item.key is "metadata.x.y"
        setNested(targetData, item.key, tr);
        applied++;
      } else {
        missed++;
        console.warn(`  ! No translation for: ${item.key} in ${fileName}`);
      }
    }

    if (dryRun) {
      console.log(`  [dry-run] Would write ${fileName} | Applied: ${applied}, Missed: ${missed}`);
    } else {
      writeJson(filePath, targetData);
      console.log(`  Updated ${fileName} | Applied: ${applied}, Missed: ${missed}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});