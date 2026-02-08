// features/harvard/modal-dom-helpers.js

export function clearNode(el) {
  while (el && el.firstChild) el.removeChild(el.firstChild);
}

export function renderLines(target, parts) {
  clearNode(target);
  (parts || []).forEach((line) => {
    const div = document.createElement("div");
    div.className = "lux-harvard-line";
    div.textContent = line;
    target.appendChild(div);
  });
}
