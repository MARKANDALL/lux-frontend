// tag-medium-warnswallow.mjs
// Run from repo root: node tag-medium-warnswallow.mjs
// Adds "important" as third arg to warnSwallow calls in medium-priority files.
// DRY RUN by default — prints what it would change. Pass --apply to write.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const apply = process.argv.includes("--apply");

const MEDIUM_LABELS = [
  "features/convo/convo-modes.js",
  "features/convo/convo-picker-system.js",
  "features/convo/convo-tts-context.js",
  "features/convo/picker-deck/deck-card.js",
  "features/features/tts/player-ui.js",
  "features/features/tts/player-dom.js",
  "features/features/tts/boot-tts.js",
  "features/features/tts/player-core.js",
  "features/features/tts/player-ui/karaoke.js",
  "features/features/selfpb/karaoke.js",
  "features/features/selfpb/dom.js",
  "features/features/selfpb/ui.js",
  "features/features/selfpb/ui-sync.js",
  "features/features/selfpb/core.js",
  "features/features/selfpb/controls.js",
  "features/features/08-selfpb-peekaboo.js",
  "features/interactions/metric-modal/events.js",
  "features/my-words/panel.js",
  "features/my-words/library-modal-controller.js",
  "features/my-words/launcher.js",
  "features/my-words/index.js",
  "features/harvard/index.js",
  "features/harvard/modal-render-list.js",
  "features/progress/attempt-detail/modal-shell.js",
  "features/progress/attempt-detail/chip-explainers.js",
  "features/progress/attempt-detail-modal.js",
  "features/results/deps.js",
  "features/results/syllables/alt-meaning.js",
  "features/results/header-modern.js",
  "features/results/render-core.js",
  "features/results/syllables/cmu-stress.js",
  "features/onboarding/onboarding-mic.js",
  "features/onboarding/onboarding-actions.js",
  "vite.config.js",
];

const allFiles = execSync('git ls-files "*.js"', { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let totalChanged = 0;
let filesChanged = 0;

for (const filePath of allFiles) {
  if (!existsSync(filePath)) continue;
  const original = readFileSync(filePath, "utf8");

  let modified = original;
  let fileHits = 0;

  for (const label of MEDIUM_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");

    const regex = new RegExp(
      `warnSwallow\\("${escaped}",\\s*(err)\\)`,
      "g"
    );

    modified = modified.replace(regex, (match, errVar) => {
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
  console.log('Run with --apply to write changes: node tag-medium-warnswallow.mjs --apply');
}
