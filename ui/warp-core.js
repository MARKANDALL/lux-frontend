// ui/warp-core.js — core warp overlay helpers (tiny + reusable)
import { K_UI_WARP_NEXT, sessionGet, sessionSet, sessionRemove } from "../app-core/lux-storage.js";

const KEY = K_UI_WARP_NEXT;

function reducedMotion(){
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ensureWarpOverlay(){
  if (document.getElementById("lux-warp")) return;
  const el = document.createElement("div");
  el.id = "lux-warp";
  document.body.appendChild(el);
}

function show(cls){
  const el = document.getElementById("lux-warp");
  el.classList.remove("is-in", "is-out");
  el.classList.add("is-on", cls);
  el.style.opacity = ""; // let animation run
  el.style.display = "block";
}

function hide(){
  const el = document.getElementById("lux-warp");
  el.classList.remove("is-on", "is-in", "is-out");
  el.style.display = "none";
  el.style.opacity = "0";
}

export function warpOut(outMs = 220){
  ensureWarpOverlay();
  if (reducedMotion()) return Promise.resolve();
  show("is-out");
  return new Promise((r) => setTimeout(r, outMs));
}

export function warpIn(inMs = 260){
  ensureWarpOverlay();
  if (reducedMotion()) { hide(); return Promise.resolve(); }
  show("is-in");
  return new Promise((r) => setTimeout(() => { hide(); r(); }, inMs));
}

export async function warpSwap(fn, { outMs = 220, inMs = 260 } = {}){
  await warpOut(outMs);
  fn();
  await warpIn(inMs);
}

export async function warpGo(url, { outMs = 220 } = {}){
  sessionSet(KEY, "1");
  await warpOut(outMs);
  window.location.href = url;
}

export function warpInIfNeeded({ inMs = 260 } = {}){
  ensureWarpOverlay();
  const should = sessionGet(KEY) === "1";
  if (should) sessionRemove(KEY);
  if (should) warpIn(inMs);
}
