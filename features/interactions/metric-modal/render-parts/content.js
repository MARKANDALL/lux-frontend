// features/interactions/metric-modal/render-parts/content.js
// One-line: Shared content blocks (note/explain/interpret/help) for metric modal.

import { esc } from "./meta.js";

function bullets(items = []) {
  return `<ul class="lux-metricBullets">${(items || [])
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>`;
}

function noteBlock() {
  return `
    <div class="lux-metricNote">
      <div class="lux-metricNoteTitle">Note</div>
      <div class="lux-metricNoteBody">
        This attempt was saved without raw word/phoneme detail, so Lux can show the score + explanation,
        but not the deeper per-word/per-phoneme breakdown here.
      </div>
    </div>
  `;
}

function explainMetric(metricKey) {
  const map = {
    Overall: {
      simple: [
        "A quick combined snapshot of all five categories.",
        "Not a separate measurement — it’s just a simple blend.",
        "Use it to track progress, then click a tile for specifics.",
      ],
      advanced:
        "Lux currently computes Overall as an equal-weight mean of Accuracy, Fluency, Completeness, Prosody, and Pronunciation.",
    },
    Pronunciation: {
      simple: [
        "A big-picture score of how close your sounds were overall.",
        "More global than Accuracy (which is phoneme-by-phoneme).",
        "Great for tracking improvement across attempts.",
      ],
      advanced:
        "Pronunciation summarizes overall sound quality and is often influenced by both segment accuracy and prosodic naturalness.",
    },
    Accuracy: {
      simple: [
        "How correct each sound (phoneme) was compared to the target.",
        "Sensitive to substitutions, deletions, and insertions.",
        "Best metric for pinpointing specific sound errors.",
      ],
      advanced: "Accuracy reflects closeness to expected target phonemes and is the most “microscopic” score of the five.",
    },
    Fluency: {
      simple: [
        "Smoothness: pauses, stops, and interruptions between words.",
        "Fluency is NOT about speaking fast — it’s about flow.",
        "A few long pauses can drop this score quickly.",
      ],
      advanced: "Fluency primarily reflects silent breaks and disfluency patterns across the utterance.",
    },
    Completeness: {
      simple: [
        "Did you say all expected words in the reference text?",
        "Skipping small words (the / a / to) can lower this a lot.",
        "Most improved by slowing down and reading fully.",
      ],
      advanced: "Completeness is essentially a reference-match ratio: spoken words vs expected words.",
    },
    Prosody: {
      simple: [
        "How natural your speech sounds as a whole.",
        "Includes stress, rhythm, intonation, and pacing.",
        "You can have great sounds but low prosody (robotic rhythm).",
      ],
      advanced: "Prosody relates to timing patterns, emphasis, and pitch movement — not just correctness of phonemes.",
    },
  };

  const info = map[metricKey] || map.Overall;
  return `
    ${bullets(info.simple)}
    <details class="lux-metricDetails">
        <summary class="lux-metricDetailsTitle">
          <span class="lux-metricSummaryTitle">More technical</span>
          <span class="lux-metricSummaryHint" aria-hidden="true">Click to expand</span>
          <span class="lux-metricSummaryCaret" aria-hidden="true">▸</span>
        </summary>
      <div class="lux-metricDetailsBody">${esc(info.advanced)}</div>
    </details>
  `;
}

function interpretMetric(metricKey, pack) {
  void pack; // pack may be used later for more personalized tips

  const tips = {
    Overall: [
      "Click the lowest tile — that’s what pulled the overall down most.",
      "Big gaps between tiles = uneven skill profile (totally normal).",
    ],
    Pronunciation: [
      "High Pronunciation + low Prosody usually means clear sounds but “flat” rhythm.",
      "High Prosody + low Accuracy usually means good flow but wrong consonants/vowels.",
    ],
    Accuracy: [
      "If Accuracy is low, focus on 1–2 sounds at a time (not everything).",
      "Look for patterns: vowels vs consonants vs voicing.",
    ],
    Fluency: [
      "A few long pauses hurt more than many tiny pauses.",
      "Try chunking phrases (meaning groups) instead of word-by-word starts.",
    ],
    Completeness: [
      "If Completeness is low, slow down and prioritize saying every word.",
      "Function words matter: the / a / to / of / in.",
    ],
    Prosody: [
      "Prosody improves fastest when you imitate short phrases with rhythm.",
      "Aim for natural emphasis, not perfect speed.",
    ],
  };

  return bullets(tips[metricKey] || tips.Overall);
}

function helpCta(metricKey) {
  const topic = String(metricKey || "").toLowerCase();
  return `
    <button class="lux-helpBtn" type="button"
      onclick="window.openLuxHelp ? window.openLuxHelp('${esc(topic)}') : alert('Lux Help is coming soon.')">
      Ask Lux Help about ${esc(metricKey)} →
    </button>
  `;
}

export { noteBlock, explainMetric, interpretMetric, helpCta };
