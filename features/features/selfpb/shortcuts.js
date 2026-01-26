// features/features/selfpb/shortcuts.js

export function initShortcuts({ ui, api, audio, syncRateUI }) {
  // Shortcuts logic (unchanged)
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.code === "Space") {
        e.preventDefault();
        ui.mainBtn.click();
      } else if (e.key === ",") {
        e.preventDefault();
        ui.backBtn.click();
      } else if (e.key === ".") {
        e.preventDefault();
        ui.fwdBtn.click();
      } else if (e.key === "[") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key === "]") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.loopAction.click();
      }
    },
    { passive: false }
  );
}
