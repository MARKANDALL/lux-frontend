// helpers/body-scroll-lock.js
let _count = 0;

export function lockBodyScroll() {
  _count++;
  if (typeof document === "undefined") return;
  try { document.body.style.overflow = "hidden"; }
  catch (err) { globalThis.warnSwallow("helpers/body-scroll-lock.js", err); }
}

export function unlockBodyScroll() {
  _count = Math.max(0, _count - 1);
  if (typeof document === "undefined") return;
  if (_count !== 0) return;
  try { document.body.style.overflow = ""; }
  catch (err) { globalThis.warnSwallow("helpers/body-scroll-lock.js", err); }
}