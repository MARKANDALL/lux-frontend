// ui/ui-click-ripple.js  (v6 — final push)
// ─────────────────────────────────────────────────────────────
// Water-surface ripple via canvas pixel displacement.
//
// KEY FIX from v5: the real button is HIDDEN (visibility:hidden)
// while the canvas overlay plays, so you never see doubled text.
// The canvas draws a replica of the button (bg + text), applies
// concentric-wave displacement frame-by-frame, then removes
// itself and un-hides the real button.
// ─────────────────────────────────────────────────────────────

// ── Tuning ──
const MAP_SIZE       = 256;
const WAVE_COUNT     = 5;       // concentric rings in displacement map
const WAVE_AMPLITUDE = 0.55;    // wave strength in the map (0–1)
const WAVE_FALLOFF   = 0.55;    // outer-ring fade exponent (lower = slower fade)

const ANIM_DURATION  = 900;     // ms total
const DISPLACE_PEAK  = 18;      // max pixel shift at t=0
const EXPAND_START   = 0.15;    // ripple sampling window at t=0 (fraction)
const EXPAND_END     = 2.2;     // ripple sampling window at t=1

const OVERSHOOT_PX   = 70;      // visible ring extension past button

/* ══════════════════════════════════════════════════════════════
   Displacement map (generated once, cached)
   Float32Array of [dx, dy] pairs, values in -1..+1
   ══════════════════════════════════════════════════════════════ */
let _map = null;

function getMap() {
  if (_map) return _map;
  const S = MAP_SIZE;
  const cx = S / 2, cy = S / 2, maxR = S / 2;
  const m = new Float32Array(S * S * 2);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const norm = dist / maxR;
      const idx = (y * S + x) * 2;

      if (norm > 1) { m[idx] = 0; m[idx + 1] = 0; continue; }

      const wave = Math.sin(norm * Math.PI * 2 * WAVE_COUNT);
      const envelope = Math.pow(1 - norm, WAVE_FALLOFF);
      const mag = wave * envelope * WAVE_AMPLITUDE;
      const dLen = dist > 0.5 ? 1 / dist : 0;

      m[idx]     = mag * dx * dLen;  // radial X
      m[idx + 1] = mag * dy * dLen;  // radial Y
    }
  }
  _map = m;
  return m;
}

/* ── Easing ── */
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ── Portal for visible ring beyond button ── */
function ensurePortal() {
  let p = document.getElementById("luxRipplePortal");
  if (p) return p;
  p = document.createElement("div");
  p.id = "luxRipplePortal";
  Object.assign(p.style, {
    position: "fixed", inset: "0",
    pointerEvents: "none", zIndex: "9998", overflow: "visible",
  });
  document.body.appendChild(p);
  return p;
}

/* ── Rounded rect helper ── */
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ══════════════════════════════════════════════════════════════
   Snapshot the button to a canvas
   ══════════════════════════════════════════════════════════════ */
function snapshotButton(el, w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const cs = getComputedStyle(el);

  // Background
  const br = parseFloat(cs.borderRadius) || 11;
  rrect(ctx, 0, 0, w, h, br);
  ctx.fillStyle = cs.backgroundColor || "#dc2626";
  ctx.fill();

  // Text — match browser rendering as closely as possible
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const padT = parseFloat(cs.paddingTop) || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;

  ctx.fillStyle = cs.color || "#fff";
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Center text in the padded content area
  const textX = padL + (w - padL - padR) / 2;
  const textY = padT + (h - padT - padB) / 2;
  ctx.fillText(el.textContent.trim(), textX, textY);

  return ctx.getImageData(0, 0, w, h);
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC: attachClickRipple(el)
   ══════════════════════════════════════════════════════════════ */
export function attachClickRipple(el) {
  const map = getMap();
  const S = MAP_SIZE;
  let activeOverlay = null;
  let raf = 0;

  function spawnRipple(clientX, clientY) {
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 2 || h < 2) return;

    // Click origin as fraction of button
    const hasCoords = (clientX !== 0 || clientY !== 0);
    const fracX = hasCoords ? (clientX - rect.left) / rect.width  : 0.5;
    const fracY = hasCoords ? (clientY - rect.top)  / rect.height : 0.5;

    // ── Snapshot the button BEFORE hiding it ──
    const srcData = snapshotButton(el, w, h);
    const src = srcData.data;

    // ── Hide the real button (prevents text doubling) ──
    el.style.visibility = "hidden";

    // ── Clean up any previous overlay ──
    if (activeOverlay) {
      activeOverlay.remove();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    // ── Create overlay canvas exactly over the button ──
    const overlay = document.createElement("canvas");
    overlay.width = w;
    overlay.height = h;
    Object.assign(overlay.style, {
      position: "fixed",
      left:   `${rect.left}px`,
      top:    `${rect.top}px`,
      width:  `${w}px`,
      height: `${h}px`,
      pointerEvents: "none",
      zIndex: "9999",
      borderRadius: getComputedStyle(el).borderRadius || "0.7rem",
    });
    document.body.appendChild(overlay);
    activeOverlay = overlay;

    const ctx = overlay.getContext("2d");
    const t0 = performance.now();

    // Pre-allocate output buffer
    const outData = ctx.createImageData(w, h);
    const out = outData.data;

    const tick = (now) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / ANIM_DURATION);
      const ease = easeOut(t);

      // Ripple radius grows; intensity fades
      const rippleR = EXPAND_START + (EXPAND_END - EXPAND_START) * ease;
      const intensity = DISPLACE_PEAK * (1 - ease) * (1 - ease); // quadratic fade

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          // Position relative to click, normalized to ripple radius
          // We scale Y by aspect ratio so the ripple is circular, not elliptical
          const aspect = w / h;
          const relX = (px / w - fracX) / rippleR;
          const relY = ((py / h - fracY) * aspect) / rippleR;

          // Map to displacement texture coords
          const mapX = ((relX * 0.5 + 0.5) * S) | 0;
          const mapY = ((relY * 0.5 + 0.5) * S) | 0;

          let shiftX = 0, shiftY = 0;

          if (mapX >= 0 && mapX < S && mapY >= 0 && mapY < S) {
            const mi = (mapY * S + mapX) * 2;
            shiftX = map[mi]     * intensity;
            shiftY = map[mi + 1] * intensity;
          }

          // Sample source with displacement
          const sx = Math.max(0, Math.min(w - 1, (px + shiftX + 0.5) | 0));
          const sy = Math.max(0, Math.min(h - 1, (py + shiftY + 0.5) | 0));

          const si = (sy * w + sx) * 4;
          const di = (py * w + px) * 4;
          out[di]     = src[si];
          out[di + 1] = src[si + 1];
          out[di + 2] = src[si + 2];
          out[di + 3] = src[si + 3];
        }
      }

      ctx.putImageData(outData, 0, 0);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // ── Done: restore real button, remove overlay ──
        overlay.remove();
        activeOverlay = null;
        el.style.visibility = "";
        raf = 0;
      }
    };

    raf = requestAnimationFrame(tick);

    // ── Visible ring in portal (extends past button) ──
    spawnRing(clientX, clientY, rect);
  }

  function spawnRing(cx, cy, rect) {
    const portal = ensurePortal();
    const hasC = (cx !== 0 || cy !== 0);
    const ox = hasC ? cx : rect.left + rect.width / 2;
    const oy = hasC ? cy : rect.top  + rect.height / 2;
    const md = Math.sqrt(
      Math.max(ox - rect.left, rect.right  - ox) ** 2 +
      Math.max(oy - rect.top,  rect.bottom - oy) ** 2
    );
    const r = md + OVERSHOOT_PX;
    const ring = document.createElement("span");
    ring.className = "lux-water-ring";
    Object.assign(ring.style, {
      width: `${r * 2}px`, height: `${r * 2}px`,
      left: `${ox - r}px`, top: `${oy - r}px`,
    });
    portal.appendChild(ring);
    ring.addEventListener("animationend", () => ring.remove());
  }

  // ── Events ──
  el.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    spawnRipple(e.clientX, e.clientY);
  });
  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (t) spawnRipple(t.clientX, t.clientY);
  }, { passive: true });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") spawnRipple(0, 0);
  });
}