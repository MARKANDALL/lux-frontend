// src/data/harvard.js
// Adapter: builds a passages map from harvard-lists.js exports (no manual 72 edits)

import * as lists from "./harvard-lists.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export const harvardPassages = Object.fromEntries(
  Object.entries(lists)
    .filter(([name, val]) => /^harvardList\d{2}Parts$/.test(name) && Array.isArray(val))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, parts]) => {
      const m = name.match(/^harvardList(\d{2})Parts$/);
      const n = m ? m[1] : "??";

      // Keys become: harvard01, harvard02, ... (matches wireHarvardPicker())
      const key = `harvard${n}`;

      // Shape matches your passages.js objects: { name, parts }
      return [key, { name: `Harvard List ${n}`, parts: parts.slice(0, 10) }];
    })
);
