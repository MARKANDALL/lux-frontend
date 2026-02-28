// scripts/no-silent-catches.mjs
// Fails if the repo contains empty catch blocks: `catch {}` or `catch (_) {}`
// (mechanical guardrail to prevent regressions)

import { execSync } from "node:child_process";

function rgCount(pattern, extraArgs = []) {
  try {
    // -g !... excludes common noise folders
    const cmd = [
      "rg",
      "--count-matches",
      pattern,
      ".",
      "-g",
      "!node_modules/**",
      "-g",
      "!.git/**",
      "-g",
      "!dist/**",
      "-g",
      "!build/**",
      "-g",
      "!coverage/**",
      "-g",
      "!*.min.js",
      ...extraArgs,
    ].join(" ");

    const out = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();

    // ripgrep emits one number per file; sum them
    if (!out) return 0;
    return out
      .split("\n")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
      .reduce((a, b) => a + b, 0);
  } catch (err) {
    // rg exits non-zero when no matches; treat as 0
    return 0;
  }
}

const emptyCatch = rgCount(String.raw`catch\s*\{\s*\}`);
const underscoreCatch = rgCount(String.raw`catch\s*\(\s*_\s*\)\s*\{\s*\}`);

if (emptyCatch === 0 && underscoreCatch === 0) {
  console.log("[hygiene] ✅ No silent catch blocks found.");
  process.exit(0);
}

console.error("[hygiene] ❌ Silent catch blocks found.");
if (emptyCatch) console.error(`  - empty catch {} matches: ${emptyCatch}`);
if (underscoreCatch) console.error(`  - catch (_) {} matches: ${underscoreCatch}`);

console.error("\nFix: replace with catch (err) { globalThis.warnSwallow('path', err); } (browser) or console.warn(...) (node).");
process.exit(1);
