// scripts/check-absolute-imports.mjs
// Fails if any JS/TS file imports from "/src/" or "/api/" (absolute-from-root imports).

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "ui", "features", "app-core", "core", "helpers", "api"];
const EXT_OK = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (st.isFile() && EXT_OK.has(path.extname(name))) out.push(p);
  }
  return out;
}

const files = TARGET_DIRS
  .map((d) => path.join(ROOT, d))
  .filter((p) => {
    try { return statSync(p).isDirectory(); } catch { return false; }
  })
  .flatMap((p) => walk(p));

const offenders = [];

for (const f of files) {
  const txt = readFileSync(f, "utf8");
  const lines = txt.split(/\r?\n/);
  lines.forEach((line, i) => {
    // import ... from "/src/..."  OR  import ... from "/api/..."
    if (/from\s+["']\/(src|api)\//.test(line)) {
      offenders.push(`${path.relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (offenders.length) {
  console.error("\n❌ Absolute imports detected (must not start with /src/ or /api/):\n");
  for (const o of offenders) console.error("  " + o);
  console.error("\nFix: change to relative imports (../../...) or an alias.\n");
  process.exit(1);
}

console.log("✅ No forbidden absolute imports found.");
