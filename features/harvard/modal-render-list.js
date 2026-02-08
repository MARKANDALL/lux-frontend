// features/harvard/modal-render-list.js
// Renders the left list UI (Harvard / Passages) based on current modal state.
// This is a surgical move-out of the big renderList() body from modal.js.

export async function renderHarvardModalList(ctx = {}) {
  const {
    // state (read)
    activeTab,
    searchQ,
    activePh,
    focusMode,
    selectedN,
    selectedKey,

    // data
    ensureLists,
    ensurePassages,
    favs,
    favKeys,

    // dom
    listEl,

    // helpers / metrics
    clearNode,
    pad2,
    getHarvardMeta,
    metaForKey,
    countForHarvard,
    totalForHarvard,
    countForKey,
    totalForKey,

    // callbacks
    updateFilterUI,
    setFilterPh,
    setSelected,
    setSelectedPassage,
    showHoverHarvard,
    showHoverPassage,
    hideHover,
    saveFavs,

    // rerender hook (so buttons inside rows can re-render)
    renderList,
  } = ctx;

  const isHarvard = activeTab === "harvard";
  const data = isHarvard ? await ensureLists() : await ensurePassages();

  clearNode(listEl);

  let rows = data.slice();

  if (searchQ) {
    rows = rows.filter((rec) => rec.searchText?.includes(searchQ));
  }

  if (activePh) {
    const scored = rows.map((rec) => {
      const score = isHarvard
        ? countForHarvard(rec.n, activePh)
        : countForKey(rec.key, activePh);

      const total = isHarvard ? totalForHarvard(rec.n) : totalForKey(rec.key);

      const pct = total ? score / total : 0;

      return { rec, score, pct };
    });

    const filtered = focusMode === "only" ? scored.filter((x) => x.score > 0) : scored;

    rows = filtered
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.pct !== a.pct) return b.pct - a.pct;
        return isHarvard
          ? a.rec.n - b.rec.n
          : String(a.rec.name).localeCompare(String(b.rec.name));
      })
      .map((x) => x.rec);
  }

  // Favorites: pin to top (preserve existing order within each group)
  if (isHarvard) {
    if (favs && favs.size) {
      const favRows = rows.filter((r) => favs.has(r.n));
      const otherRows = rows.filter((r) => !favs.has(r.n));
      rows = favRows.concat(otherRows);
    }
  } else {
    if (favKeys && favKeys.size) {
      const favRows = rows.filter((r) => favKeys.has(r.key));
      const otherRows = rows.filter((r) => !favKeys.has(r.key));
      rows = favRows.concat(otherRows);
    }
  }

  updateFilterUI();

  rows.forEach((rec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lux-harvard-item";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", "false");

    if (isHarvard) {
      btn.dataset.n = String(rec.n);

      const num = document.createElement("span");
      num.className = "lux-harvard-item-num";
      num.textContent = pad2(rec.n);

      const first = document.createElement("span");
      first.className = "lux-harvard-item-first";
      first.textContent = rec.first;

      btn.appendChild(num);
      btn.appendChild(first);

      // Favorite star (doesn't trigger selection)
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "lux-harvard-fav";
      favBtn.textContent = favs.has(rec.n) ? "★" : "☆";
      favBtn.title = favs.has(rec.n) ? "Unfavorite" : "Favorite";
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (favs.has(rec.n)) favs.delete(rec.n);
        else favs.add(rec.n);
        saveFavs(favs, favKeys);
        renderList();
      });
      btn.appendChild(favBtn);

      // Focus score (count + %), shown when a phoneme is selected
      if (activePh) {
        const c = countForHarvard(rec.n, activePh);
        const t = totalForHarvard(rec.n);
        const pct = t ? c / t : 0;

        const badge = document.createElement("span");
        badge.className = "lux-harvard-focusbadge" + (c ? "" : " is-zero");
        badge.textContent = c
          ? t
            ? `${c} • ${(pct * 100).toFixed(1)}%`
            : `${c}`
          : "—";
        badge.title = c
          ? `${activePh} appears ${c} times in this list`
          : `${activePh} not present`;
        btn.appendChild(badge);
      }

      // phoneme chips (top 3 distinctive)
      const chipWrap = document.createElement("div");
      chipWrap.className = "lux-harvard-item-chips";
      const top3 = getHarvardMeta(rec.n)?.top3 || [];
      top3.forEach((p) => {
        const chip = document.createElement("span");
        chip.className =
          "lux-harvard-item-chip" + (activePh === p.ph ? " is-active" : "");
        chip.textContent = p.ph;
        chip.title = `×${Number(p.lift || 0).toFixed(2)} • ${(
          Number(p.pct || 0) * 100
        ).toFixed(1)}%`;
        chip.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          setFilterPh(p.ph);
        });
        chipWrap.appendChild(chip);
      });
      btn.appendChild(chipWrap);

      btn.classList.toggle("is-selected", Number(rec.n) === Number(selectedN));
      btn.setAttribute(
        "aria-selected",
        Number(rec.n) === Number(selectedN) ? "true" : "false"
      );

      btn.addEventListener("mouseenter", () => showHoverHarvard(rec.n, btn));
      btn.addEventListener("mouseleave", hideHover);
      btn.addEventListener("click", () => setSelected(rec.n));
    } else {
      btn.dataset.key = String(rec.key);

      const first = document.createElement("span");
      first.className = "lux-harvard-item-first";
      first.textContent = rec.name;
      btn.appendChild(first);

      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "lux-harvard-fav";
      favBtn.textContent = favKeys.has(rec.key) ? "★" : "☆";
      favBtn.title = favKeys.has(rec.key) ? "Unfavorite" : "Favorite";
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (favKeys.has(rec.key)) favKeys.delete(rec.key);
        else favKeys.add(rec.key);
        saveFavs(favs, favKeys);
        renderList();
      });
      btn.appendChild(favBtn);

      if (activePh) {
        const c = countForKey(rec.key, activePh);
        const t = totalForKey(rec.key);
        const pct = t ? c / t : 0;

        const badge = document.createElement("span");
        badge.className = "lux-harvard-focusbadge" + (c ? "" : " is-zero");
        badge.textContent = c ? `${c} • ${(pct * 100).toFixed(1)}%` : "—";
        badge.title = c
          ? `${activePh} appears ${c} times in this passage`
          : `${activePh} not present`;
        btn.appendChild(badge);
      }

      const chipWrap = document.createElement("div");
      chipWrap.className = "lux-harvard-item-chips";

      const m = metaForKey(rec.key);
      const counts = m?.counts;
      if (counts && typeof counts === "object") {
        const top = Object.entries(counts)
          .map(([ph, c]) => ({
            ph: String(ph).toUpperCase(),
            c: Number(c || 0),
          }))
          .filter((x) => x.c > 0)
          .sort((a, b) => b.c - a.c)
          .slice(0, 3);

        top.forEach((p) => {
          const chip = document.createElement("span");
          chip.className =
            "lux-harvard-item-chip" + (activePh === p.ph ? " is-active" : "");
          chip.textContent = p.ph;
          chip.title = `${p.c} occurrences`;
          chip.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilterPh(p.ph);
          });
          chipWrap.appendChild(chip);
        });
      }
      btn.appendChild(chipWrap);

      btn.classList.toggle("is-selected", String(rec.key) === String(selectedKey));
      btn.setAttribute(
        "aria-selected",
        String(rec.key) === String(selectedKey) ? "true" : "false"
      );

      btn.addEventListener("mouseenter", () => showHoverPassage(rec.key, btn));
      btn.addEventListener("mouseleave", hideHover);
      btn.addEventListener("click", () => setSelectedPassage(rec.key));
    }

    listEl.appendChild(btn);
  });

  // pre-select last used, but don't auto-practice
  if (isHarvard) {
    try {
      const last = localStorage.getItem("LUX_HARVARD_LAST");
      const n = last ? Number.parseInt(last, 10) : null;
      if (n && n >= 1 && n <= 72) setSelected(n);
    } catch {}
  } else {
    try {
      const last = localStorage.getItem("LUX_PASSAGES_LAST");
      const key = last ? String(last) : "";
      if (key && data?.some?.((r) => String(r.key) === String(key))) setSelectedPassage(key);
    } catch {}
  }
}
