// tag-critical-warnswallow.mjs
// Run from repo root: node tag-critical-warnswallow.mjs
// Adds "important" as third arg to warnSwallow calls in critical-path files.
// DRY RUN by default — prints what it would change. Pass --apply to write.

import { readFileSync, writeFileSync, existsSync } from "fs";

const apply = process.argv.includes("--apply");

// Critical file labels — these are the warnSwallow string tags, NOT file paths.
// We search the ENTIRE repo for warnSwallow calls containing these labels.
const CRITICAL_LABELS = [
  "api/identity.js",
  "api/attempts.js",
  "ui/ui-ai-logics/attempt-policy.js",
  "features/my-words/store.js",
  "features/recorder/index.js",
  "features/recorder/media.js",
  "features/recorder/audio-inspector.js",
  "features/recorder/audio-mode-core.js",
  "features/streaming/auth-bridge.js",
  "features/streaming/transport/realtime-webrtc.js",
  "features/streaming/transport/realtime-webrtc/connection-lifecycle.js",
  "features/streaming/transport/realtime-webrtc/message-handler.js",
  "features/streaming/transport/transport-controller.js",
  "features/streaming/app.js",
  "features/streaming/setup/app.js",
  "features/streaming/audio/mode.push-to-talk.js",
  "features/harvard/modal-favs.js",
  "features/harvard/modal-actions.js",
  "features/life/storage.js",
  "features/next-activity/next-practice.js",
  "features/next-activity/next-activity.js",
  "features/progress/wordcloud/state-store.js",
  "features/progress/attempt-detail/derive.js",
  "features/progress/render/dashboard/attempt-utils.js",
  "features/progress/rollups/rollupsUtils.js",
  "features/convo/convo-turn.js",
  "features/convo/convo-recording.js",
  "features/convo/convo-knobs.js",
  "features/convo/convo-state.js",
  "src/main.js",
];

// Build a Set for fast lookup
const labelSet = new Set(CRITICAL_LABELS);

// We need to find the ACTUAL files that contain these warnSwallow calls.
// The label string inside warnSwallow() tells us the file path.
// Most labels match their actual file path, but we search broadly to be safe.

import { execSync } from "child_process";

// Find all JS files that contain warnSwallow
const allFiles = execSync('git ls-files "*.js"', { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let totalChanged = 0;
let filesChanged = 0;

for (const filePath of allFiles) {
  if (!existsSync(filePath)) continue;
  const original = readFileSync(filePath, "utf8");

  // Match pattern: warnSwallow("label", err) or warnSwallow("label", err);
  // but NOT already having a third argument
  let modified = original;
  let fileHits = 0;

  for (const label of CRITICAL_LABELS) {
    // Escape dots and slashes for regex
    const escaped = label.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");

    // Match: warnSwallow("label", err) — no third arg present
    // Negative lookahead ensures we don't double-tag
    const regex = new RegExp(
      `warnSwallow\\("${escaped}",\\s*(err)\\)(?!\\s*;?\\s*\\/\\/ already tagged)`,
      "g"
    );

    modified = modified.replace(regex, (match, errVar) => {
      // Only replace if there's no third argument already
      if (match.includes('"important"')) return match;
      fileHits++;
      return match.replace(`, ${errVar})`, `, ${errVar}, "important")`);
    });
  }

  if (fileHits > 0) {
    filesChanged++;
    totalChanged += fileHits;
    console.log(`  ${apply ? "✅" : "🔍"} ${filePath} — ${fileHits} call(s)`);
    if (apply) {
      writeFileSync(filePath, modified, "utf8");
    }
  }
}

console.log("");
console.log(`${apply ? "APPLIED" : "DRY RUN"}: ${totalChanged} warnSwallow calls in ${filesChanged} files`);
if (!apply) {
  console.log('Run with --apply to write changes: node tag-critical-warnswallow.mjs --apply');
}
