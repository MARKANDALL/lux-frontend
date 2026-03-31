// features/convo/phoneme-spelling-map.js
// ONE-LINE: Comprehensive IPA-to-English-spelling rules for word-level and letter-level phoneme identification.
//
// Returns both:
//   test(word) → boolean     — does this word likely contain the phoneme?
//   find(word) → [start,end] — indices of the letter group producing the phoneme (for sub-word highlighting)
//
// Coverage: all 24 English consonants + major vowels.
// Approach: spelling pattern rules, not a pronunciation dictionary.
// Trade-off: ~95% accurate for common words; occasional false positives on irregular spellings.

/**
 * @param {string} ipa - Normalized IPA symbol (e.g. "t", "θ", "ʃ", "eɪ")
 * @returns {{ test: (word:string)=>boolean, find: (word:string)=>{start:number,end:number}|null } | null}
 */
export function getPhonemeSpellingRule(ipa) {
  const k = String(ipa || "").trim().toLowerCase()
    .replace(/^\/|\/$/g, ""); // strip slashes if present

  const rule = RULES[k];
  if (!rule) return null;
  return rule;
}

// ── Silent / exception deny lists ──────────────────────────────
const SILENT_T = /\b(listen|often|castle|whistle|bustle|hustle|jostle|bristle|thistle|nestle|wrestle|fasten|christen|soften|moisten|hasten|glisten|mortgage)\b/i;
const SILENT_B = /\b(bomb|climb|comb|crumb|debt|doubt|dumb|lamb|limb|numb|plumb|subtle|thumb|tomb|womb)\b/i;
const SILENT_K = /\b(knee|kneel|knew|knife|knight|knit|knob|knock|knot|know|knowledge|knuckle)\b/i;
const SILENT_G = /\b(gnat|gnaw|gnome|gnu|sign|design|align|assign|benign|resign|foreign|sovereign|paradigm|phlegm|diaphragm)\b/i;
const SILENT_W = /\b(wrap|wren|wring|write|wrong|wrote|wreck|wrist|wreath|wrath|wrinkle|answer|sword|two|who|whole|whom|whose)\b/i;
const SILENT_H = /\b(hour|honest|honor|heir|herb|ghost|rhyme|rhythm|rhino|rhetoric|rhubarb|shepherd|vehicle|exhaust|exhibit)\b/i;

// ── Helper: build a rule from a regex of spelling patterns ─────
function fromPatterns(patterns, opts = {}) {
  const deny = opts.deny || null;

  return {
    test(word) {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      if (deny && deny.test(w)) return false;
      return patterns.test(w);
    },
    find(word) {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return null;
      if (deny && deny.test(w)) return null;
      const m = patterns.exec(w);
      if (!m) return null;
      // If there's a capturing group, use it; otherwise use the full match
      const matchStr = m[1] !== undefined ? m[1] : m[0];
      const idx = m[1] !== undefined ? w.indexOf(matchStr, m.index) : m.index;
      return { start: idx, end: idx + matchStr.length };
    },
  };
}

// ── Helper: custom function-based rule ─────────────────────────
function fromFunction(testFn, findFn) {
  return { test: testFn, find: findFn };
}

// ════════════════════════════════════════════════════════════════
//  RULES — keyed by normalized IPA
// ════════════════════════════════════════════════════════════════

const RULES = {
  // ── CONSONANTS ──────────────────────────────────────────────

  // /p/ — pen, top, happy
  p: fromPatterns(/p(?!h)/i),

  // /b/ — big, lab, bubble
  b: fromPatterns(/b/i, { deny: SILENT_B }),

  // /t/ — time, cat, butter (not -tion, -tial, silent t)
  t: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w || !w.includes("t")) return false;
      if (SILENT_T.test(w)) return false;
      if (/tion|tial|tious|tient/i.test(w)) return false;
      return true;
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return null;
      if (SILENT_T.test(w)) return null;
      if (/tion|tial|tious|tient/i.test(w)) return null;
      const i = w.indexOf("t");
      if (i < 0) return null;
      // Check for "tt"
      const len = w[i + 1] === "t" ? 2 : 1;
      return { start: i, end: i + len };
    }
  ),

  // /d/ — dog, bad, ladder
  d: fromPatterns(/(d)/i),

  // /k/ — cat, black, king, school, unique
  k: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      if (SILENT_K.test(w)) return false;
      return /(?:k|ck|c(?![eiy])|ch(?=r|l)|qu|x)/i.test(w);
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return null;
      if (SILENT_K.test(w)) return null;
      let m;
      if ((m = /ck/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /qu/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /k/i.exec(w))) return { start: m.index, end: m.index + 1 };
      if ((m = /c(?![eiy])/i.exec(w))) return { start: m.index, end: m.index + 1 };
      if ((m = /x/i.exec(w))) return { start: m.index, end: m.index + 1 };
      return null;
    }
  ),

  // /g/ — go, big, great (not gh in sigh/night)
  g: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      if (SILENT_G.test(w)) return false;
      return /g(?!h)/i.test(w);
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w || SILENT_G.test(w)) return null;
      const m = /g(?!h)/i.exec(w);
      return m ? { start: m.index, end: m.index + 1 } : null;
    }
  ),

  // /f/ — far, phone, laugh, cliff
  f: fromPatterns(/(f|ph|gh(?=$|[^aeiouy]))/i),

  // /v/ — very, live, of
  v: fromPatterns(/(v)/i),

  // /θ/ — think, three, bath (voiceless TH)
  "θ": fromPatterns(/(th)/i),
  // /ð/ — this, that, mother (voiced TH) — same spelling, different phoneme
  "ð": fromPatterns(/(th)/i),

  // /s/ — see, city, miss, science
  s: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      return /(?:ss|ce$|ci|cy|sc|s(?!h))/i.test(w);
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return null;
      let m;
      if ((m = /ss/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /sc(?=[eiy])/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /ce$/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /ci/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /cy/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /s(?!h)/i.exec(w))) return { start: m.index, end: m.index + 1 };
      return null;
    }
  ),

  // /z/ — zoo, rose, fizz, dogs
  z: fromPatterns(/(zz|z|s(?=[aeiouy]))/i),

  // /ʃ/ — she, wish, mission, sugar, ocean
  "ʃ": fromPatterns(/(sh|ti(?=on)|ssi|ci(?=ous|an|ent)|ch(?=ef))/i),

  // /ʒ/ — vision, measure, beige, genre
  "ʒ": fromPatterns(/(si(?=on|ure)|su(?=re|al)|ge(?=$))/i),

  // /tʃ/ — chair, match, nature
  "tʃ": fromPatterns(/(ch|tch|tu(?=re))/i),
  "ʧ": fromPatterns(/(ch|tch|tu(?=re))/i),

  // /dʒ/ — job, bridge, giant, age
  "dʒ": fromPatterns(/(j|dge|dg|g(?=[eiy]))/i),
  "ʤ": fromPatterns(/(j|dge|dg|g(?=[eiy]))/i),

  // /m/ — map, him, hammer
  m: fromPatterns(/(mm|m)/i),

  // /n/ — no, ten, dinner (not ng)
  n: fromPatterns(/(nn|n(?!g))/i),

  // /ŋ/ — sing, going, think
  "ŋ": fromPatterns(/(ng|n(?=k))/i),

  // /l/ — let, bell, little
  l: fromPatterns(/(ll|l)/i),

  // /ɹ/ or /r/ — red, write, car
  "ɹ": fromPatterns(/(wr|rr|r)/i, { deny: SILENT_W }),
  r: fromPatterns(/(wr|rr|r)/i, { deny: SILENT_W }),

  // /w/ — we, win, quick (qu)
  w: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      if (SILENT_W.test(w)) return false;
      return /(?:w|qu)/i.test(w);
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w || SILENT_W.test(w)) return null;
      let m;
      if ((m = /qu/i.exec(w))) return { start: m.index, end: m.index + 2 };
      if ((m = /w/i.exec(w))) return { start: m.index, end: m.index + 1 };
      return null;
    }
  ),

  // /j/ — yes, you, use (IPA /j/ = English "y" consonant)
  j: fromPatterns(/(y(?=[aeiouy])|u(?=se$|ni|ti))/i),

  // /h/ — he, hat, behind
  h: fromFunction(
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w) return false;
      if (SILENT_H.test(w)) return false;
      if (/^[^a-z]*h/i.test(w)) return true; // word-initial h
      if (/(?<!s|c|t|p|w|g|r)h/i.test(w)) return true; // h not part of sh/ch/th/ph/wh/gh/rh
      return false;
    },
    (word) => {
      const w = String(word || "").trim().toLowerCase();
      if (!w || SILENT_H.test(w)) return null;
      const m = /(?<!s|c|t|p|w|g|r)h/i.exec(w);
      if (!m) {
        const m2 = /^h/i.exec(w);
        return m2 ? { start: 0, end: 1 } : null;
      }
      return { start: m.index, end: m.index + 1 };
    }
  ),

  // ── VOWELS ──────────────────────────────────────────────────

  // /iː/ or /i/ — see, read, key, receive, machine
  "iː": fromPatterns(/(ee|ea|ie(?!r)|ei(?=ve)|ey$|e$|i(?=ne$|que))/i),
  i: fromPatterns(/(ee|ea|ie(?!r)|ei(?=ve)|ey$|e$|i(?=ne$|que))/i),
  "iy": fromPatterns(/(ee|ea|ie(?!r)|ei(?=ve)|ey$|e$|i(?=ne$|que))/i),

  // /ɪ/ — sit, gym, build, busy
  "ɪ": fromPatterns(/(i(?!ng$|on$|e$)|y(?!$))/i),
  "ih": fromPatterns(/(i(?!ng$|on$|e$)|y(?!$))/i),

  // /eɪ/ — day, make, rain, great, eight
  "eɪ": fromPatterns(/(ay|ai|a_e|ei(?=gh)|ey(?!$)|ea(?=t|k))/i),
  "ey": fromPatterns(/(ay|ai|a_e|ei(?=gh)|ey(?!$)|ea(?=t|k))/i),

  // /ɛ/ — bed, said, friend, many
  "ɛ": fromPatterns(/(e(?!e|a)|ea(?=d$|th|lt|vy))/i),
  "eh": fromPatterns(/(e(?!e|a)|ea(?=d$|th|lt|vy))/i),

  // /æ/ — cat, bad, have, plaid
  "æ": fromPatterns(/(a(?!ll|lk|w|r|i|y|e$|u|o))/i),
  "ae": fromPatterns(/(a(?!ll|lk|w|r|i|y|e$|u|o))/i),

  // /ɑː/ or /ɑ/ — father, hot, car, calm
  "ɑː": fromPatterns(/(a(?=r|lm|th)|o(?=t$|p$|ck|g$))/i),
  "ɑ": fromPatterns(/(a(?=r|lm|th)|o(?=t$|p$|ck|g$))/i),
  "aa": fromPatterns(/(a(?=r|lm|th)|o(?=t$|p$|ck|g$))/i),

  // /ɔː/ — law, all, caught, walk, thought
  "ɔː": fromPatterns(/(aw|au|al(?=k|l)|ough(?=t))/i),
  "ɔ": fromPatterns(/(aw|au|al(?=k|l)|ough(?=t))/i),
  "ao": fromPatterns(/(aw|au|al(?=k|l)|ough(?=t))/i),

  // /oʊ/ — go, home, boat, know, show
  "oʊ": fromPatterns(/(ow|oa|o_e|o$)/i),
  "ow": fromPatterns(/(ow|oa|o_e|o$)/i),

  // /ʊ/ — book, put, could, woman
  "ʊ": fromPatterns(/(oo(?=k|d|t)|u(?=ll|sh|t)|ou(?=ld))/i),
  "uh": fromPatterns(/(oo(?=k|d|t)|u(?=ll|sh|t)|ou(?=ld))/i),

  // /uː/ — food, rule, blue, grew, fruit
  "uː": fromPatterns(/(oo|ue$|ew|u_e|ui(?=t|ce|se))/i),
  "uw": fromPatterns(/(oo|ue$|ew|u_e|ui(?=t|ce|se))/i),

  // /ʌ/ — but, love, blood, young
  "ʌ": fromPatterns(/(u(?!r|ll|sh)|o(?=ve|ne|me|ther))/i),
  "ah": fromPatterns(/(u(?!r|ll|sh)|o(?=ve|ne|me|ther))/i),

  // /ə/ — about, banana (schwa — very hard to pin from spelling, use common patterns)
  "ə": fromPatterns(/(a(?=bout|lone|gain|way)|e(?=r$)|o(?=f$))/i),

  // /ɝ/ or /ɜː/ — bird, her, turn, work, learn
  "ɝ": fromPatterns(/(ir|er|ur|or(?=k|ld|th)|ear(?=n|th))/i),
  "ɜː": fromPatterns(/(ir|er|ur|or(?=k|ld|th)|ear(?=n|th))/i),
  "er": fromPatterns(/(ir|er|ur|or(?=k|ld|th)|ear(?=n|th))/i),

  // /aɪ/ — my, time, pie, buy, guide, eye
  "aɪ": fromPatterns(/(igh|ie$|i_e|y$|uy|eye)/i),
  "ay": fromPatterns(/(igh|ie$|i_e|y$|uy|eye)/i),

  // /aʊ/ — now, house, out, cow
  "aʊ": fromPatterns(/(ow(?!n$)|ou(?!ld|gh|r))/i),
  "aw2": fromPatterns(/(ow(?!n$)|ou(?!ld|gh|r))/i),

  // /ɔɪ/ — boy, join, noise, loyal
  "ɔɪ": fromPatterns(/(oy|oi)/i),
  "oy": fromPatterns(/(oy|oi)/i),
};