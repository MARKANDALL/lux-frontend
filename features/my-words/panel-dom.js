// features/my-words/panel-dom.js

export function createMyWordsPanelDOM({
  mountTo,
  asModal,
  isLibrary,
  esc,
} = {}) {
  // ------------------------------------------------------------
  // Root panel
  // ------------------------------------------------------------
  const root = document.createElement("div");
  root.className = "lux-mw-panel" + (asModal ? " is-modal" : "");
  mountTo.appendChild(root);

  // Mode-specific title
  const titleText = isLibrary ? "Library" : "My Words";

  // Composer only exists in compact sidecar
  const composerHTML = !isLibrary
    ? `
      <div class="lux-mw-add" data-zone="composer">
        <div class="lux-mw-addLabel">Add words/phrases (one per line)</div>
        <textarea class="lux-mw-addBox" rows="3" spellcheck="false"></textarea>

        <div class="lux-mw-addRow">
          <button class="lux-mw-addBtn" type="button">Add</button>
          <div class="lux-mw-hint">Tip: Tap <b>Send</b> to push into the input instantly.</div>
        </div>
      </div>
    `
    : "";

  root.innerHTML = `
    <div class="${asModal ? "lux-mw-modalHead" : "lux-mw-head"}">
      <div class="lux-mw-title">${esc(titleText)}</div>

      <div class="lux-mw-headRight">
        <input class="lux-mw-search" type="text" placeholder="Search…" />
        <button class="lux-mw-iconBtn" data-act="close" type="button" title="Close">×</button>
      </div>
    </div>

    <div class="lux-mw-body">
      ${composerHTML}
      <div class="lux-mw-list"></div>
    </div>
  `;

  const elTitle = root.querySelector(".lux-mw-title");
  const elSearch = root.querySelector(".lux-mw-search");
  const elClose = root.querySelector('button[data-act="close"]');
  const elTa = root.querySelector(".lux-mw-addBox");
  const elAdd = root.querySelector(".lux-mw-addBtn");
  const elList = root.querySelector(".lux-mw-list");
  const elComposerZone = root.querySelector('[data-zone="composer"]');

  return {
    root,
    elTitle,
    elSearch,
    elClose,
    elTa,
    elAdd,
    elList,
    elComposerZone,
  };
}
