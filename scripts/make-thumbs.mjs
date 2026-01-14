import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "public", "convo-img");
const OUT_DIR = path.join(SRC_DIR, "thumbs");

// Thumb tuning
const MAX_W = 280;     // 200–320 ideal
const QUALITY = 60;    // 50–70 typical
const EFFORT = 4;

const OK_EXT = new Set([".webp", ".jpg", ".jpeg", ".png"]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function isThumbPath(p) {
  return p.includes(`${path.sep}thumbs${path.sep}`);
}

function outThumbPath(inPath) {
  // Preserve relative folder structure, but always output .webp
  const rel = path.relative(SRC_DIR, inPath);
  const parsed = path.parse(rel); // { dir, name, ext }
  return path.join(OUT_DIR, parsed.dir, `${parsed.name}.webp`);
}

if (!fs.existsSync(SRC_DIR)) {
  console.error(`[thumbs] missing folder: ${SRC_DIR}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = walk(SRC_DIR)
  .filter((p) => !isThumbPath(p))
  .filter((p) => OK_EXT.has(path.extname(p).toLowerCase()));

let made = 0;

for (const inPath of files) {
  const outPath = outThumbPath(inPath);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Skip if output exists and is newer/equal
  if (fs.existsSync(outPath)) {
    const inStat = fs.statSync(inPath);
    const outStat = fs.statSync(outPath);
    if (outStat.mtimeMs >= inStat.mtimeMs) continue;
  }

  await sharp(inPath)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: EFFORT })
    .toFile(outPath);

  made++;
}

console.log(`[thumbs] done. generated/updated: ${made}`);
console.log(`[thumbs] output dir: ${OUT_DIR}`);
