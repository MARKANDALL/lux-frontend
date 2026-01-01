// ui/warp-nav.js — intercept same-origin <a> navigations + warp them
import { warpGo, warpInIfNeeded, ensureWarpOverlay } from "./warp-core.js";

ensureWarpOverlay();
warpInIfNeeded();

document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;

  // Let modified clicks / new tabs behave normally
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== "_self") return;
  if (a.hasAttribute("download")) return;

  // Same-origin only
  let url;
  try { url = new URL(a.href, window.location.href); } catch { return; }
  if (url.origin !== window.location.origin) return;

  // Don’t warp pure hash jumps
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return;

  e.preventDefault();
  warpGo(url.href);
}, true);
