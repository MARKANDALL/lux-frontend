// features/harvard/modal-data.js

export async function loadHarvardListRecords({
  listEl,
  ensureHarvardPassages,
  passages,
  pad2,
  harvardKey,
} = {}) {
  if (listEl) listEl.textContent = "Loading Harvard lists…";

  try {
    await ensureHarvardPassages?.();
  } catch (err) {
    console.error("[Harvard] ensureHarvardPassages failed", err);
    if (listEl) listEl.textContent = "Could not load Harvard lists.";
    return [];
  }

  const next = [];
  for (let n = 1; n <= 72; n++) {
    const key = harvardKey(n);
    const p = passages?.[key];
    const parts = Array.isArray(p?.parts) ? p.parts.slice(0, 10) : null;
    if (!parts || parts.length === 0) continue;
    next.push({
      n,
      key,
      name: p?.name || `Harvard List ${pad2(n)}`,
      parts,
      first: parts[0] || "",
      searchText: parts.join(" ").toLowerCase(),
    });
  }

  return next;
}

export function loadPassageRecords({ passages, isHarvardKey } = {}) {
  const next = [];
  const allKeys = Object.keys(passages || {});
  for (const key of allKeys) {
    if (isHarvardKey(key)) continue;
    const p = passages?.[key];
    const parts = Array.isArray(p?.parts) ? p.parts.slice() : null;
    if (!parts || parts.length === 0) continue;

    next.push({
      key,
      name: p?.name || String(key),
      parts,
      first: parts[0] || "",
      searchText: parts.join(" ").toLowerCase(),
    });
  }

  next.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return next;
}
