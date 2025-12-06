// ui/interactions/ph-chips.js
import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import { phonemeDetailsByIPA } from "../../src/data/phonemes/details.js";

/**
 * Builds/refreshes tooltip content for each phoneme chip.
 * FIX APPLIED: Removed auto-play logic to prevent network flood.
 */
export async function initPhonemeChipBehavior(
  containerSelector = "#prettyResult"
) {
  const root = document.querySelector(containerSelector);
  if (!root) return;

  const CHIP_SEL = [
    "#resultBody td:nth-child(4) .phoneme-chip.tooltip",
    "#prettyResult .phoneme-chip.tooltip",
  ].join(",");

  const chips = [...root.querySelectorAll(CHIP_SEL)];
  if (!chips.length) return;

  for (const chip of chips) {
    const currentMark = chip.getAttribute("data-hydrated-ipa") || "";

    const ipa = deriveIPA(chip);
    if (!ipa) continue;
    if (currentMark === ipa) continue;

    // IMPORTANT: cache the true IPA on the chip for future passes
    chip.setAttribute("data-ipa", ipa);

    const asset = getPhonemeAssetByIPA(ipa);
    const details = phonemeDetailsByIPA[norm(ipa)] || phonemeDetailsByIPA[ipa];

    // Ensure tooltip container exists
    let tip = chip.querySelector(".tooltiptext");
    if (!tip) {
      tip = document.createElement("span");
      tip.className = "tooltiptext";
      chip.appendChild(tip);
    }

    // FIX: preload="none" prevents browser from fetching 500 videos at once
    tip.innerHTML = `
      <div class="ph-tooltip" style="max-width:560px;max-height:420px;overflow:auto">
        <div class="ph-head" style="padding:8px 10px;font:600 14px system-ui">
          <span class="ph-ipa" style="font-weight:700">${ipa}</span>
          ${
            details?.ipa
              ? `<span style="opacity:.7;margin-left:8px">${details.ipa}</span>`
              : ""
          }
        </div>
        ${
          details?.tip
            ? `<div class="ph-tip" style="padding:0 10px 8px">${escapeHTML(
                details.tip
              )}</div>`
            : ""
        }
        ${
          asset?.video
            ? `<video class="ph-video" playsinline muted preload="none" style="display:block;width:100%;height:auto"></video>`
            : `<div style="padding:10px;color:#b00">No demo video available for ${ipa}</div>`
        }
      </div>
    `;

    const vid = tip.querySelector(".ph-video");
    if (vid && asset?.video) {
      vid.src = asset.video;
      vid.poster = asset.poster || "";
      // 🛑 DELETED: The auto-play/pause logic was here. 
      // Removing it stops the network flood.
    }

    chip.setAttribute("data-hydrated-ipa", ipa);
  }
}

// Phones we actually support (canonical IPA + common Azure/ASCII)
const KNOWN_PHONES = new Set([
  "p","b","t","d","k","g","m","n","f","v","s","z","h","l","ɹ","r","w","j","ŋ",
  "θ","ð","ʃ","ʒ","tʃ","dʒ","ɾ","ʔ","ʍ",
  "i","ɪ","e","ɛ","æ","ɑ","ɔ","o","ʊ","u","ʌ","ə","ɚ","ɝ",
  "eɪ","aɪ","ɔɪ","aʊ","oʊ",
  "iy","ih","eh","ae","aa","ao","ah","ax","axr","er","uw","uh","ey","ay","aw","ow","oy",
  "th","dh","sh","zh","ch","jh","dx","ng","hh","wh","q","y"
]);

const PHONE_RX =
  /\b([a-zɪɛæɑɔʊəɝɚʃʒŋɾʔ]{1,2}|tʃ|dʒ|eɪ|aɪ|ɔɪ|aʊ|oʊ)\b/i;

function deriveIPA(chip) {
  // 1) Prefer explicit attributes
  const explicitRaw =
    chip.getAttribute("data-ipa") ||
    chip.dataset?.ipa ||
    chip.getAttribute("data-phoneme") ||
    chip.dataset?.phoneme ||
    "";

  if (explicitRaw) {
    const normed = norm(explicitRaw);
    if (KNOWN_PHONES.has(normed)) return normed;

    const mExp = String(explicitRaw).match(PHONE_RX);
    if (mExp) {
      const candidate = norm(mExp[1]);
      if (KNOWN_PHONES.has(candidate)) return candidate;
    }
    return "";
  }

  // 2) Fallback: look at chip label
  const labelNode = [...chip.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
  );
  const labelText = (labelNode?.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!labelText) return "";

  const mTxt = labelText.match(PHONE_RX);
  if (!mTxt) return "";

  const candidate = norm(mTxt[1]);
  return KNOWN_PHONES.has(candidate) ? candidate : "";
}

function escapeHTML(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}