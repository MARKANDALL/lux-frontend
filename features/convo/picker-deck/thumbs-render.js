// features/convo/picker-deck/thumbs-render.js
// ONE-LINE: Renders the thumbnail button strip for scenarios and wires click-to-pick behavior.

export function renderThumbs({ thumbs, list, state, el, scenarioThumbUrl, onPickIndex }){
  if (!thumbs) return;

  thumbs.innerHTML = "";

  list.forEach((s, i) => {
    const isActive = i === state.scenarioIdx;
    const b = el("button", "lux-thumb" + (isActive ? " is-active" : ""));
    b.type = "button";
    b.title = s?.title || `Scenario ${i + 1}`;

    // accessibility + "active" marker
    b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-current", isActive ? "true" : "false");

    const thumb = scenarioThumbUrl(s);
    if (thumb) {
      b.dataset.thumbSrc = thumb;     // store only
      b.classList.add("has-img");
      b.textContent = "";
      // DO NOT set backgroundImage here
    } else {
      // fallback (keeps your “color dots” behavior if a scenario has no image)
      const hue = (i * 37) % 360;
      b.style.backgroundImage = `linear-gradient(135deg, hsl(${hue} 55% 70%), hsl(${(hue+18)%360} 55% 62%))`;
      b.textContent = (s?.title || "?").trim().slice(0, 1).toUpperCase();
    }

    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPickIndex?.(i);
    });

    thumbs.append(b);
  });
}