// features/my-words/launcher.js

export function mountMyWordsCornerLauncher({ onClick } = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lux-mw-corner";
  btn.title = "My Words";
  btn.setAttribute("aria-label", "My Words");

  btn.innerHTML = `
    <span class="lux-mw-corner-ink">📝</span>
  `;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.();
  });

  document.body.appendChild(btn);
  return btn;
}
