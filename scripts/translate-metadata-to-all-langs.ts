// scripts/translate-metadata-to-all-langs.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // IMPORTANT: must run BEFORE importing OpenAIService

type Json = Record<string, any>;

function isPlainObject(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNumericSegment(s: string) {
  return /^[0-9]+$/.test(s);
}

function readJson(filePath: string): Json {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath: string): Json {
  if (!fs.existsSync(filePath)) return {};
  return readJson(filePath);
}

function ensureJsonExt(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

function fileToLang(file: string) {
  return file.replace(".json", "");
}

function listLanguageJsonFiles(dictionariesDir: string): string[] {
  if (!fs.existsSync(dictionariesDir)) return [];
  return fs
    .readdirSync(dictionariesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

function getNested(obj: Json, dotPath: string): any {
  const parts = dotPath.split(".");
  let cur: any = obj;

  for (const p of parts) {
    if (cur == null) return undefined;

    if (Array.isArray(cur) && isNumericSegment(p)) {
      cur = cur[Number(p)];
    } else {
      cur = cur[p];
    }
  }
  return cur;
}

function setNested(obj: Json, dotPath: string, value: any) {
  const parts = dotPath.split(".");
  let cur: any = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    const nextIsIndex = isNumericSegment(next);

    if (Array.isArray(cur)) {
      // current is array, p must be numeric index
      const idx = Number(p);
      if (cur[idx] == null) cur[idx] = nextIsIndex ? [] : {};
      cur = cur[idx];
      continue;
    }

    // current is object
    if (cur[p] == null) cur[p] = nextIsIndex ? [] : {};
    cur = cur[p];
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(cur) && isNumericSegment(last)) cur[Number(last)] = value;
  else cur[last] = value;
}

/**
 * Collect all leaf dot-paths that lead to:
 * - non-empty strings
 * - OR non-empty string items inside arrays (metadata.home.keywords.0, ...)
 * - supports nested arrays/objects
 */
function getLeafStringKeysUnder(node: any, prefix = ""): string[] {
  const out: string[] = [];

  if (typeof node === "string" && node.trim().length > 0) {
    if (prefix) out.push(prefix);
    return out;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      const fullKey = prefix ? `${prefix}.${i}` : String(i);

      if (typeof v === "string" && v.trim().length > 0) out.push(fullKey);
      else if (isPlainObject(v) || Array.isArray(v)) out.push(...getLeafStringKeysUnder(v, fullKey));
    }
    return out;
  }

  if (isPlainObject(node)) {
    for (const key of Object.keys(node)) {
      const v = node[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof v === "string" && v.trim().length > 0) out.push(fullKey);
      else if (isPlainObject(v) || Array.isArray(v)) out.push(...getLeafStringKeysUnder(v, fullKey));
    }
  }

  return out;
}

/**
 * Finds dot-paths of all nodes named "metadata" (object), if --deep is enabled.
 * Example return: ["metadata", "pages.home.metadata", ...]
 */
function findMetadataObjectPaths(obj: any, prefix = ""): string[] {
  if (!isPlainObject(obj)) return [];
  const out: string[] = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (key === "metadata" && isPlainObject(value)) out.push(fullKey);
    if (isPlainObject(value) || Array.isArray(value)) out.push(...findMetadataObjectPaths(value, fullKey));
  }
  return out;
}

function parseArgs(argv: string[]) {
  let baseFile = "en.json";
  let dryRun = false;
  let batchSize = 40;
  let model = "gpt-4o";
  let langsCsv: string | null = null; // "tr,de,fr"
  let deep = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") baseFile = ensureJsonExt(argv[i + 1] || "en");
    if (a === "--dry-run") dryRun = true;
    if (a === "--batch") batchSize = parseInt(argv[i + 1] || "40", 10);
    if (a === "--model") model = argv[i + 1] || "gpt-4o";
    if (a === "--langs") langsCsv = argv[i + 1] || null;
    if (a === "--deep") deep = true;
  }

  return { baseFile, dryRun, batchSize, model, langsCsv, deep };
}

async function main() {
  // sanity check: env gerçekten var mı?
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing. Make sure it exists in .env or shell env.");
    process.exit(1);
  }

  // IMPORTANT: import AFTER dotenv.config()
  const { default: OpenAIService } = await import("../services/OpenAIService");

  const { baseFile, dryRun, batchSize, model, langsCsv, deep } = parseArgs(process.argv);

  const dictionariesDir = path.resolve(__dirname, "../dictionaries");
  const basePath = path.join(dictionariesDir, baseFile);

  if (!fs.existsSync(basePath)) {
    console.error(`Base dictionary not found: ${basePath}`);
    process.exit(1);
  }

  const baseData = readJson(basePath);
  const sourceLang = fileToLang(baseFile);

  // Determine which metadata subtree paths to translate
  const metadataPaths = deep
    ? Array.from(new Set(findMetadataObjectPaths(baseData))).sort()
    : isPlainObject(baseData.metadata)
      ? ["metadata"]
      : [];

  if (metadataPaths.length === 0) {
    console.log(`No metadata object found in ${baseFile} (deep=${deep}). Nothing to do.`);
    return;
  }

  // Collect all leaf string keys under those metadata paths (dot paths)
  const leafDotKeys: string[] = [];
  for (const mp of metadataPaths) {
    const node = getNested(baseData, mp);
    const leafs = getLeafStringKeysUnder(node, mp);
    leafDotKeys.push(...leafs);
  }

  const uniqueLeafKeys = Array.from(new Set(leafDotKeys)).sort();
  const items = uniqueLeafKeys
    .map((key) => ({ key, text: getNested(baseData, key) }))
    .filter((x) => typeof x.text === "string" && x.text.trim().length > 0) as {
    key: string;
    text: string;
  }[];

  if (items.length === 0) {
    console.log("No translatable string leaves found under metadata.");
    return;
  }

  // Determine target language files
  const allJsonFiles = listLanguageJsonFiles(dictionariesDir);
  const requestedLangs = langsCsv
    ? langsCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const targetFiles = (requestedLangs
    ? requestedLangs.map(ensureJsonExt)
    : allJsonFiles.filter((f) => f !== baseFile)
  ).filter((f) => f !== baseFile);

  if (targetFiles.length === 0) {
    console.log("No target language files found.");
    return;
  }

  console.log(`Base:   ${baseFile} (${sourceLang})`);
  console.log(`Mode:   translate metadata (deep=${deep}) and OVERWRITE target metadata keys (includes string arrays)`);
  console.log(`Keys:   ${items.length} metadata string leaves`);
  console.log(`Targets (${targetFiles.length}): ${targetFiles.join(", ")}`);
  console.log(`Model:  ${model} | Batch: ${batchSize} | Dry: ${dryRun}`);

  for (const targetFile of targetFiles) {
    const targetLang = fileToLang(targetFile);
    const targetPath = path.join(dictionariesDir, targetFile);

    const targetData = readJsonIfExists(targetPath);

    const translations = await OpenAIService.translateMultipleKeys(items, targetLang, sourceLang, {
      batchSize,
      model,
    });

    let applied = 0;
    let missed = 0;

    // OVERWRITE only for metadata leaf keys
    for (const { key } of items) {
      const tr = translations[key];
      if (typeof tr === "string" && tr.trim().length > 0) {
        setNested(targetData, key, tr);
        applied++;
      } else {
        missed++;
        console.warn(`[${targetLang}] No translation returned for: ${key}`);
      }
    }

    if (dryRun) {
      console.log(
        `[dry-run][${targetLang}] Would write: ${targetPath} | Applied: ${applied}, Missed: ${missed}`
      );
      continue;
    }

    fs.mkdirSync(dictionariesDir, { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2) + "\n", "utf8");

    console.log(`[${targetLang}] Done. Applied: ${applied}, Missed: ${missed} | Updated: ${targetPath}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});