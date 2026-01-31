// features/convo/convo-nav.js

export function wireConvoNav({ state, guidedBtn, scenBtn, setMode, warpSwap }) {
  function warpToPicker() {
    // intro -> picker gets the warp treatment
    if (state.mode !== "intro") return setMode("picker");
    warpSwap(() => setMode("picker"), { outMs: 200, inMs: 240 });
  }

  // Hub: Guided button => picker
  guidedBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    warpToPicker();
  });

  // Chat header buttons
  scenBtn.addEventListener("click", () =>
    warpSwap(() => setMode("picker"), { outMs: 170, inMs: 220 })
  );
}
