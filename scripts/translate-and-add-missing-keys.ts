// scripts/translate-and-add-missing-keys.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // IMPORTANT: must run BEFORE importing OpenAIService (and thus OpenAI client)

type Json = Record<string, any>;

function isPlainObject(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function ensureJsonExt(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
}

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

function readJsonIfExists(filePath: string): Json {
  if (!fs.existsSync(filePath)) return {};
  return readJson(filePath);
}

function parseArgs(argv: string[]) {
  // usage:
  //   node ... all
  //   node ... tr
  //   node ... tr --base en --dry-run --batch 40 --model gpt-4o
  const targetArg = argv[2] || "tr";
  const isAll = targetArg.toLowerCase() === "all";
  const targetFile = isAll ? null : ensureJsonExt(targetArg);

  let baseFile = "en.json";
  let dryRun = false;
  let batchSize = 40;
  let model = "gpt-4o";

  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") baseFile = ensureJsonExt(argv[i + 1] || "en");
    if (a === "--dry-run") dryRun = true;
    if (a === "--batch") batchSize = parseInt(argv[i + 1] || "40", 10);
    if (a === "--model") model = argv[i + 1] || "gpt-4o";
  }

  return { isAll, targetFile, baseFile, dryRun, batchSize, model };
}

async function translateOne(
  OpenAIService: any,
  dictionariesDir: string,
  baseFile: string,
  targetFile: string,
  opts: { dryRun: boolean; batchSize: number; model: string }
) {
  const basePath = path.join(dictionariesDir, baseFile);
  const targetPath = path.join(dictionariesDir, targetFile);

  if (!fs.existsSync(basePath)) {
    console.error(`Base dictionary not found: ${basePath}`);
    process.exit(1);
  }

  const baseData = readJson(basePath);
  const targetData = readJsonIfExists(targetPath);

  const baseKeys = getLeafKeys(baseData).sort();
  const targetKeys = new Set(getLeafKeys(targetData));

  const missingKeys = baseKeys.filter((k) => !targetKeys.has(k));
  if (missingKeys.length === 0) {
    console.log(`[${targetFile}] No missing keys to translate.`);
    return;
  }

  const sourceLang = baseFile.replace(".json", "");
  const targetLang = targetFile.replace(".json", "");

  const items = missingKeys
    .map((key) => ({ key, text: getNested(baseData, key) }))
    .filter((x) => typeof x.text === "string" && x.text.trim().length > 0) as {
    key: string;
    text: string;
  }[];

  console.log(`\nTarget: ${targetFile} (${targetLang})`);
  console.log(`Base:   ${baseFile} (${sourceLang})`);
  console.log(`Missing keys total: ${missingKeys.length}`);
  console.log(`Translating string keys: ${items.length}`);

  if (items.length === 0) {
    console.log("Nothing to translate (no missing string values).");
    return;
  }

  const translations = await OpenAIService.translateMultipleKeys(items, targetLang, sourceLang, {
    batchSize: opts.batchSize,
    model: opts.model,
  });

  let applied = 0;
  let missed = 0;

  for (const { key } of items) {
    const tr = translations[key];
    if (typeof tr === "string" && tr.trim().length > 0) {
      setNested(targetData, key, tr);
      applied++;
    } else {
      missed++;
      console.warn(`No translation returned for: ${key}`);
    }
  }

  if (opts.dryRun) {
    console.log(`[dry-run] Would write: ${targetPath}`);
    console.log(`[dry-run] Applied: ${applied}, Missed: ${missed}`);
    return;
  }

  fs.mkdirSync(dictionariesDir, { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2) + "\n", "utf8");

  console.log(`Done. Applied: ${applied}, Missed: ${missed}`);
  console.log(`Updated: ${targetPath}`);
}

async function main() {
  // sanity check: env gerçekten var mı?
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing. Make sure it exists in .env or shell env.");
    process.exit(1);
  }

  // IMPORTANT: import AFTER dotenv.config()
  const { default: OpenAIService } = await import("../services/OpenAIService");

  const { isAll, targetFile, baseFile, dryRun, batchSize, model } = parseArgs(process.argv);

  const dictionariesDir = path.resolve(__dirname, "../dictionaries");

  if (!isAll) {
    // single target (old behavior)
    await translateOne(OpenAIService, dictionariesDir, baseFile, targetFile!, { dryRun, batchSize, model });
    return;
  }

  // ALL mode: translate to every *.json in dictionariesDir except baseFile
  const files = listJsonFiles(dictionariesDir).filter((f) => f !== baseFile);

  if (files.length === 0) {
    console.log(`No target json files found in: ${dictionariesDir} (base=${baseFile})`);
    return;
  }

  console.log(`ALL mode enabled.`);
  console.log(`Base: ${baseFile}`);
  console.log(`Targets (${files.length}): ${files.join(", ")}`);

  for (const f of files) {
    await translateOne(OpenAIService, dictionariesDir, baseFile, f, { dryRun, batchSize, model });
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});