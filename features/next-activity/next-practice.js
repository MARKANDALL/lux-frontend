// features/next-activity/next-practice.js
import { fetchHistory } from "../../api/attempts.js";
import { computeRollups } from "../progress/rollups.js";
import { getAuthedUID } from "../my-words/service.js";
import { getCodesForIPA } from "../../src/data/phonemes/core.js";
import { PASSAGE_PHONEME_META } from "../../src/data/index.js";
import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { loadHarvardList } from "../harvard/index.js";

function pickFocusPhFromRollups(rollups) {
  const top = rollups?.troublePhonemes?.[0];
  const ipa = top?.ipa || "";
  if (!ipa) return { ipa: "", code: "" };

  const codes = getCodesForIPA(ipa) || [];
  const code = (codes[0] || "").toUpperCase();
  return { ipa, code };
}

function scoreKeyForPh(key, ph) {
  if (!key || !ph) return 0;
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  const c = m?.counts?.[String(ph).toUpperCase()];
  return Number(c || 0);
}

function bestHarvardForPh(ph) {
  let bestN = 0;
  let bestScore = -1;

  for (let n = 1; n <= 72; n++) {
    const key = `harvard${String(n).padStart(2, "0")}`;
    const s = scoreKeyForPh(key, ph);
    if (s > bestScore) {
      bestScore = s;
      bestN = n;
    }
  }
  return { n: bestN, score: Math.max(0, bestScore) };
}

function bestNonHarvardForPh(ph) {
  const deny = new Set(["write-own", "clear", "custom", ""]);
  let bestKey = "";
  let bestScore = -1;

  const keys = Object.keys(PASSAGE_PHONEME_META || {});
  for (const k of keys) {
    const key = String(k);
    if (key.startsWith("harvard")) continue;
    if (deny.has(key)) continue;

    const s = scoreKeyForPh(key, ph);
    if (s > bestScore) {
      bestScore = s;
      bestKey = key;
    }
  }
  return { key: bestKey, score: Math.max(0, bestScore) };
}

function labelForPassageKey(key) {
  try {
    const sel = document.getElementById("passageSelect");
    const opt = sel?.querySelector?.(`option[value="${CSS.escape(key)}"]`);
    const txt = opt?.textContent?.trim();
    return txt || key;
  } catch {
    return key;
  }
}

function renderOut(outEl, plan) {
  if (!outEl) return;

  if (!plan?.focusPh) {
    outEl.textContent = "Not enough progress yet to generate a recommendation.";
    return;
  }

  const passageLabel = plan.passageKey ? labelForPassageKey(plan.passageKey) : "(none)";
  outEl.innerHTML = `
    <div style="font-weight:800;">
      Focus phoneme: <span style="font-weight:900;">${plan.focusPh}</span>
      ${plan.focusIpa ? `<span style="opacity:0.7;">(from /${plan.focusIpa}/)</span>` : ""}
    </div>
    <div style="margin-top:6px;">
      Best Harvard: <strong>${plan.harvardN ? `List ${String(plan.harvardN).padStart(2,"0")}` : "(none)"}</strong>
      <span style="opacity:0.75;">(${plan.harvardScore || 0})</span>
    </div>
    <div style="margin-top:4px;">
      Best Passage/Drill: <strong>${passageLabel}</strong>
      <span style="opacity:0.75;">(${plan.passageScore || 0})</span>
    </div>
    <div class="lux-nextpractice-actions">
      <button type="button" data-act="load-harvard">Load Harvard</button>
      <button type="button" data-act="load-passage">Load Passage/Drill</button>
    </div>
  `;

  const harvBtn = outEl.querySelector(`button[data-act="load-harvard"]`);
  const passBtn = outEl.querySelector(`button[data-act="load-passage"]`);

  if (harvBtn) {
    harvBtn.disabled = !plan.harvardN;
  }
  if (passBtn) {
    passBtn.disabled = !plan.passageKey;
  }
}

export function wireGenerateNextPractice() {
  const btn = document.getElementById("luxNextPracticeBtn");
  const out = document.getElementById("luxNextPracticeOut");
  if (!btn || btn.dataset.wired === "1") return;

  btn.dataset.wired = "1";

  btn.addEventListener("click", async () => {
    try {
      btn.disabled = true;
      btn.textContent = "Generating…";
      if (out) out.textContent = "Checking your progress…";

      const uid = await getAuthedUID();
      if (!uid) {
        if (out) out.textContent = "Please sign in (Save Progress) to generate recommendations from your history.";
        return;
      }

      const attempts = await fetchHistory(uid);
      const rollups = computeRollups(attempts || []);
      const { ipa, code } = pickFocusPhFromRollups(rollups);

      if (!code) {
        if (out) out.textContent = "Not enough progress yet to generate a recommendation.";
        return;
      }

      const harv = bestHarvardForPh(code);
      const pass = bestNonHarvardForPh(code);

      const plan = {
        focusIpa: ipa,
        focusPh: code,
        harvardN: harv.n,
        harvardScore: harv.score,
        passageKey: pass.key,
        passageScore: pass.score
      };

      renderOut(out, plan);

      // Wire action buttons
      const harvBtn = out?.querySelector?.(`button[data-act="load-harvard"]`);
      const passBtn = out?.querySelector?.(`button[data-act="load-passage"]`);

      if (harvBtn) {
        harvBtn.onclick = async () => {
          if (!plan.harvardN) return;
          await loadHarvardList(plan.harvardN);
          try { document.getElementById("referenceText")?.focus(); } catch {}
        };
      }

      if (passBtn) {
        passBtn.onclick = async () => {
          if (!plan.passageKey) return;
          // Keep dropdown visually in sync
          const sel = document.getElementById("passageSelect");
          if (sel) sel.value = plan.passageKey;

          setPassage(plan.passageKey, { clearInputForCustom: false });
          updatePartsInfoTip();
          try { document.getElementById("referenceText")?.focus(); } catch {}
        };
      }
    } catch (e) {
      console.error("[NextPractice] failed:", e);
      if (out) out.textContent = "Couldn’t generate a recommendation (see console).";
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate my next practice";
    }
  });
}
