// features/features/tts/player-ui/karaoke.js
// Logic: Karaoke/word-sync helpers for TTS playback timing + refresh events.

// ------------------------------------------------------------
// Karaoke / Word Sync (TTS): simple word timings (even spacing)
// ------------------------------------------------------------
function splitWords(text = "") {
  const s = String(text || "").trim();
  if (!s) return [];
  // keep it simple + readable (works fine for English passages)
  return s.match(/[A-Za-z0-9']+/g) || [];
}

function buildWordTimings(text, durSec) {
  const words = splitWords(text);
  const dur = Number(durSec) || 0;
  if (!words.length || !(dur > 0)) return [];

  function syllableCount(w) {
    const s = String(w || "").toLowerCase();
    const m = s.match(/[aeiouy]+/g);
    return Math.max(1, m ? m.length : 1);
  }

  function weightForWord(w) {
    const raw = String(w || "");
    const letters = raw.replace(/[^a-z]/gi, "");
    const len = letters.length;
    let wt = syllableCount(letters) + Math.min(2, len / 8);
    if (len <= 2) wt *= 0.6;
    else if (len <= 3) wt *= 0.75;
    return Math.max(0.6, Math.min(3.5, wt));
  }

  const weights = words.map(weightForWord);
  const total = weights.reduce((a, b) => a + b, 0) || words.length;

  const out = [];
  let t = 0;
  for (let i = 0; i < words.length; i++) {
    const span = dur * (weights[i] / total);
    const start = t;
    t += span;
    const end = t;
    out.push({ word: words[i], start, end });
  }
  if (out.length) out[out.length - 1].end = dur;
  return out;
}

function buildWordTimingsFromBoundaries(boundaries, durSec) {
  const items = Array.isArray(boundaries) ? boundaries : [];
  if (!items.length) return [];

  const ticksToSec = (t) => (Number(t) || 0) / 1e7;

  const out = [];
  for (const b of items) {
    const w = String(b?.text || b?.word || "").trim();
    const start = ticksToSec(
      b?.audioOffset ?? b?.audioOffsetTicks ?? b?.offset ?? 0
    );
    const durTicks = Number(b?.duration ?? b?.durationTicks ?? 0) || 0;
    if (!w || !(start >= 0)) continue;
    const end = durTicks > 0 ? start + ticksToSec(durTicks) : 0;
    out.push({ word: w, start, end });
  }

  // Ensure monotonic + fill missing/zero end times from the next start
  for (let i = 0; i < out.length - 1; i++) {
    if (!(out[i].end > out[i].start)) out[i].end = out[i + 1].start;
    if (out[i].end < out[i].start) out[i].end = out[i].start;
  }

  const dur = Number(durSec) || 0;
  if (out.length && dur > 0) out[out.length - 1].end = dur;

  return out.filter((x) => isFinite(x.start) && isFinite(x.end) && x.end >= x.start);
}

function publishKaraoke(source, timings) {
  try {
    window.LuxKaraokeSource = String(source || "learner");
    window.LuxKaraokeTimings = Array.isArray(timings) ? timings : [];
    if (window.LuxKaraokeSource === "tts") {
      window.LuxTTSWordTimings = window.LuxKaraokeTimings;
    }
    window.dispatchEvent(
      new CustomEvent("lux:karaokeRefresh", {
        detail: {
          source: window.LuxKaraokeSource,
          timings: window.LuxKaraokeTimings,
        },
      })
    );
  } catch {}
}

export { buildWordTimings, buildWordTimingsFromBoundaries, publishKaraoke };
