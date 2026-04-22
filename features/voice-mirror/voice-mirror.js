// features/voice-mirror/voice-mirror.js
// "Hear it in my voice" tile + custom audio player (Play / speed / ±2s) for the TTS drawer.

import { getVoiceProfileStatus, synthesizeVoiceMirror } from '../../_api/voice-mirror.js';
import { openVoiceOnboarding } from './voice-onboarding.js';

// ── State ──────────────────────────────────────────────────────────────
let _hasProfile = null;

function resolveTargetText(targetTextOrGetter) {
  if (typeof targetTextOrGetter === 'function') {
    try { return String(targetTextOrGetter() || '').trim(); }
    catch (err) { console.warn('[voice-mirror] targetText getter failed', err); return ''; }
  }
  return String(targetTextOrGetter || '').trim();
}

function getLuxUID() {
  return (
    (window && window.LUX_USER_ID) ||
    document.documentElement.getAttribute('data-uid') ||
    ''
  ).toString();
}

async function ensureProfileChecked() {
  if (_hasProfile !== null) return _hasProfile;
  const uid = getLuxUID();
  if (!uid) { _hasProfile = false; return false; }
  try {
    const res = await getVoiceProfileStatus(uid);
    _hasProfile = !!res.hasProfile;
  } catch (e) {
    console.warn('[voice-mirror] status check failed:', e);
    _hasProfile = false;
  }
  return _hasProfile;
}

function base64ToAudioUrl(base64) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function applyShimmerTiming(el, {
  minDuration = 8,
  maxDuration = 10,
  minDelay = 0.5,
  maxDelay = 2.5,
} = {}) {
  if (!el) return;
  el.style.setProperty('--lux-vm-shimmer-duration', `${rand(minDuration, maxDuration).toFixed(2)}s`);
  el.style.setProperty('--lux-vm-shimmer-delay', `${rand(minDelay, maxDelay).toFixed(2)}s`);
}

// ── Injected CSS (mount anim + shimmer + player) ──────────────────────
let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes lux-vm-mount {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes lux-glass-shimmer {
      0%, 55% {
        transform: translateX(-170%);
        opacity: 0;
      }
      62% { opacity: 0.10; }
      72% { opacity: 0.22; }
      82% {
        transform: translateX(260%);
        opacity: 0.04;
      }
      100% {
        transform: translateX(260%);
        opacity: 0;
      }
    }

    .lux-vm-shimmer {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }

    .lux-vm-shimmer::after {
      content: '';
      position: absolute;
      top: -8%;
      bottom: -8%;
      left: -44%;
      width: 42%;
      background: linear-gradient(
        115deg,
        transparent 0%,
        rgba(255, 255, 255, 0) 18%,
        rgba(255, 255, 255, 0.06) 38%,
        rgba(255, 255, 255, 0.20) 50%,
        rgba(255, 255, 255, 0.06) 62%,
        rgba(255, 255, 255, 0) 82%,
        transparent 100%
      );
      transform: translateX(-170%);
      animation: lux-glass-shimmer var(--lux-vm-shimmer-duration, 9s) cubic-bezier(.22,.61,.36,1) infinite;
      animation-delay: var(--lux-vm-shimmer-delay, 0s);
      pointer-events: none;
      border-radius: inherit;
      will-change: transform, opacity;
      transition: filter 0.3s ease;
    }

    .lux-vm-shell:hover::after {
      animation-duration: 2.6s;
      filter: brightness(1.9) saturate(1.05);
    }

    .lux-vm-shell {
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease,
        background 0.18s ease;
      animation: lux-vm-mount 400ms cubic-bezier(.22,.61,.36,1) 480ms both;
    }

    .lux-vm-shell:hover {
      border-color: rgba(99, 102, 241, 0.24) !important;
      box-shadow: 0 8px 22px rgba(99, 102, 241, 0.10);
      transform: translateY(-1px);
    }

    .lux-vm-shell:focus-visible {
      outline: 2px solid rgba(99, 102, 241, 0.38);
      outline-offset: 2px;
    }

    .lux-vm-hint {
      opacity: 0.18;
      transform: translateY(2px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      user-select: none;
      white-space: nowrap;
    }

    .lux-vm-shell:hover .lux-vm-hint,
    .lux-vm-shell:focus-visible .lux-vm-hint,
    .lux-vm-shell.is-open .lux-vm-hint {
      opacity: 0.82;
      transform: translateY(0);
    }

    .lux-vm-details {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-4px);
      margin: 0;
      transition:
        max-height 0.24s ease,
        opacity 0.18s ease,
        transform 0.18s ease,
        margin 0.18s ease;
    }

    .lux-vm-shell.is-open .lux-vm-details {
      max-height: 140px;
      opacity: 1;
      transform: translateY(0);
      margin: 6px 0 10px 0;
    }

    /* ── Post-generation player (matches TTS drawer controls) ── */
    .lux-voice-mirror-player {
      margin: 10px 0 0 0;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .lux-vm-play-btn {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #d1d5db;
      background: #0078d7;
      color: #fff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      transition: filter 0.15s ease, box-shadow 0.15s ease;
    }
    .lux-vm-play-btn:hover  { filter: brightness(0.92); }
    .lux-vm-play-btn:active { transform: translateY(1px); }

    .lux-vm-mini-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lux-vm-skip-btn {
      padding: 7px 12px;
      font-size: 0.95rem;
      border-radius: 9px;
      border: 1px solid #d1d5db;
      background: #0078d7;
      color: #fff;
      font: inherit;
      cursor: pointer;
      transition: filter 0.15s ease;
    }
    .lux-vm-skip-btn:hover  { filter: brightness(0.92); }
    .lux-vm-skip-btn:active { transform: translateY(1px); }

    .lux-vm-time {
      flex: 1;
      text-align: center;
      font-variant-numeric: tabular-nums;
      font-size: 0.9rem;
      color: #475569;
    }

    .lux-vm-speed-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .lux-vm-speed-label {
      font-size: 0.85rem;
      color: #475569;
      font-weight: 600;
    }

    .lux-vm-speed {
      flex: 1;
      min-width: 0;
      accent-color: #6366f1;
    }

    .lux-vm-speed-out {
      font-variant-numeric: tabular-nums;
      font-size: 0.85rem;
      color: #475569;
      min-width: 3.4em;
      text-align: right;
    }
  `;

  document.head.appendChild(style);
}

function setShellOpen(shell, detailsEl, hintEl, isOpen) {
  shell.classList.toggle('is-open', !!isOpen);
  shell.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (hintEl) {
    hintEl.textContent = isOpen ? 'Hide details' : 'Tap for details';
  }
  if (detailsEl) {
    detailsEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }
}

function attachShellToggle(shell, detailsEl, hintEl) {
  setShellOpen(shell, detailsEl, hintEl, false);

  shell.addEventListener('click', (event) => {
    if (event.target.closest('.lux-voice-mirror-btn, .lux-voice-mirror-player, audio, button, input')) {
      return;
    }
    setShellOpen(shell, detailsEl, hintEl, !shell.classList.contains('is-open'));
  });

  shell.addEventListener('keydown', (event) => {
    if (event.target.closest('.lux-voice-mirror-btn, .lux-voice-mirror-player, audio, button, input')) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setShellOpen(shell, detailsEl, hintEl, !shell.classList.contains('is-open'));
  });
}

function createShell({ detailsText, buttonEl }) {
  ensureStyles();

  const shell = document.createElement('div');
  shell.className = 'lux-voice-mirror-shell lux-vm-shell lux-vm-shimmer';
  shell.tabIndex = 0;
  shell.setAttribute('role', 'button');
  shell.setAttribute('aria-expanded', 'false');
  shell.style.cssText = [
    'margin: 12px 0 0 0',
    'padding: 12px',
    'background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.08))',
    'border: 1px solid rgba(99, 102, 241, 0.15)',
    'border-radius: 12px',
    'width: 100%',
    'max-width: none',
    'box-sizing: border-box',
    'position: relative',
    'display: block',
    'cursor: pointer',
  ].join(';');

  applyShimmerTiming(shell);

  const headerRow = document.createElement('div');
  headerRow.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'gap:10px',
    'margin:0',
    'width:100%',
  ].join(';');

  const title = document.createElement('div');
  title.textContent = '🪞 Voice Mirror';
  title.style.cssText = [
    'margin:0',
    'font-weight:700',
    'color:#4f46e5',
    'font-size:0.9rem',
  ].join(';');

  const hint = document.createElement('div');
  hint.className = 'lux-vm-hint';
  hint.textContent = 'Tap for details';
  hint.style.cssText = [
    'font-size:0.72rem',
    'font-weight:600',
    'color:#6366f1',
  ].join(';');

  const details = document.createElement('div');
  details.className = 'lux-vm-details';
  details.setAttribute('aria-hidden', 'true');
  details.textContent = detailsText;
  details.style.cssText = [
    'color:#64748b',
    'font-size:0.8rem',
    'line-height:1.45',
  ].join(';');

  headerRow.appendChild(title);
  headerRow.appendChild(hint);
  shell.appendChild(headerRow);
  shell.appendChild(details);
  shell.appendChild(buttonEl);

  attachShellToggle(shell, details, hint);
  return shell;
}

// ── Build the Voice Mirror button ─────────────────────────────────────
function createMirrorButton(targetTextOrGetter) {
  const btn = document.createElement('button');
  btn.className = 'lux-voice-mirror-btn';
  btn.type = 'button';
  btn.innerHTML = '<span>Hear it in my voice</span>';
  btn.style.cssText = [
    'display: inline-flex',
    'align-items: center',
    'gap: 8px',
    'padding: 10px 18px',
    'margin: 0',
    'width: 100%',
    'justify-content: center',
    'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
    'color: #fff',
    'border: none',
    'border-radius: 10px',
    'font-size: 0.95rem',
    'font-weight: 600',
    'cursor: pointer',
    'transition: all 0.2s ease',
    'box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3)',
    'position: relative',
    'z-index: 1',
  ].join(';');

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-1px)';
    btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
  });

  btn.addEventListener('click', async (event) => {
    event.stopPropagation();

    const uid = getLuxUID();
    if (!uid) { alert('No user ID found.'); return; }

    const targetText = resolveTargetText(targetTextOrGetter);
    if (!targetText) {
      alert('No practice text found yet.');
      return;
    }

    const spanEl = btn.querySelector('span');
    const origText = spanEl.textContent;
    spanEl.textContent = 'Generating...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      const result = await synthesizeVoiceMirror({ uid, targetText });

      if (!result.ok || !result.audioBase64) {
        throw new Error(result.error || 'No audio returned');
      }

      const audioUrl = base64ToAudioUrl(result.audioBase64);
      showPlayer(btn, audioUrl);
      spanEl.textContent = origText;
    } catch (err) {
      console.error('[voice-mirror] synthesis failed:', err);
      spanEl.textContent = 'Error — tap to retry';
      setTimeout(() => { spanEl.textContent = origText; }, 3000);
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });

  return btn;
}

function createSetupButton(container, targetTextOrGetter) {
  const setupBtn = document.createElement('button');
  setupBtn.className = 'lux-voice-mirror-btn';
  setupBtn.type = 'button';
  setupBtn.innerHTML = '🎙 <span>Set Up My Voice</span>';
  setupBtn.style.cssText = [
    'display: inline-flex',
    'align-items: center',
    'gap: 8px',
    'padding: 10px 18px',
    'margin: 0',
    'width: 100%',
    'justify-content: center',
    'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
    'color: #fff',
    'border: none',
    'border-radius: 10px',
    'font-size: 0.95rem',
    'font-weight: 600',
    'cursor: pointer',
    'transition: all 0.2s ease',
    'box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3)',
    'position: relative',
    'z-index: 1',
  ].join(';');

  setupBtn.addEventListener('mouseenter', () => {
    setupBtn.style.transform = 'translateY(-1px)';
    setupBtn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
  });

  setupBtn.addEventListener('mouseleave', () => {
    setupBtn.style.transform = '';
    setupBtn.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
  });

  setupBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    openVoiceOnboarding(() => {
      mountVoiceMirrorButton(container, targetTextOrGetter);
    });
  });

  return setupBtn;
}

// ── Custom audio player shown after synthesis ─────────────────────────
function showPlayer(anchorEl, audioUrl) {
  const existing = anchorEl.parentElement?.querySelector('.lux-voice-mirror-player');
  if (existing) {
    const oldAudio = existing.querySelector('audio');
    if (oldAudio?.src) URL.revokeObjectURL(oldAudio.src);
    existing.remove();
  }

  const player = document.createElement('div');
  player.className = 'lux-voice-mirror-player';

  player.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  player.innerHTML = `
    <button type="button" class="lux-vm-play-btn" title="Click: play/pause • Double-click: restart & play">🔊 Play</button>
    <div class="lux-vm-mini-actions">
      <button type="button" class="lux-vm-skip-btn" data-skip="-2" title="Back 2 seconds">↺ 2s</button>
      <span class="lux-vm-time">0:00 / 0:00</span>
      <button type="button" class="lux-vm-skip-btn" data-skip="2" title="Forward 2 seconds">↻ 2s</button>
    </div>
    <div class="lux-vm-speed-row">
      <span class="lux-vm-speed-label">Speed</span>
      <input type="range" min="0.5" max="1.5" step="0.05" value="1" class="lux-vm-speed" aria-label="Playback speed">
      <span class="lux-vm-speed-out">1.00×</span>
    </div>
  `;

  const audio = new Audio(audioUrl);
  audio.preload = 'auto';
  audio.style.display = 'none';
  player.appendChild(audio);

  const playBtn   = player.querySelector('.lux-vm-play-btn');
  const timeEl    = player.querySelector('.lux-vm-time');
  const speedIn   = player.querySelector('.lux-vm-speed');
  const speedOut  = player.querySelector('.lux-vm-speed-out');
  const skipBtns  = player.querySelectorAll('.lux-vm-skip-btn');

  function updateTime() {
    timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  }
  function syncPlayLabel() {
    playBtn.textContent = audio.paused ? '🔊 Play' : '⏸ Pause';
  }

  audio.addEventListener('loadedmetadata', updateTime);
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('play', syncPlayLabel);
  audio.addEventListener('pause', syncPlayLabel);
  audio.addEventListener('ended', syncPlayLabel);

  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  playBtn.addEventListener('dblclick', () => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  });

  skipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = parseFloat(btn.dataset.skip) || 0;
      const dur = audio.duration || Infinity;
      audio.currentTime = Math.max(0, Math.min(dur, audio.currentTime + delta));
    });
  });

  speedIn.addEventListener('input', () => {
    const v = parseFloat(speedIn.value) || 1;
    audio.playbackRate = v;
    speedOut.textContent = `${v.toFixed(2)}×`;
  });

  anchorEl.insertAdjacentElement('afterend', player);

  audio.play().catch(() => {});
}

// ── Public: inject Voice Mirror button into a container ────────────────
export async function mountVoiceMirrorButton(container, targetTextOrGetter) {
  if (!container) return;

  container.style.width = '100%';
  container.style.maxWidth = 'none';
  container.style.display = 'block';
  container.style.boxSizing = 'border-box';
  container.style.alignSelf = 'stretch';
  container.style.flex = '1 1 100%';

  // Remove any previous elements
  const old = container.querySelector('.lux-voice-mirror-shell');
  if (old) old.remove();
  const oldBtn = container.querySelector('.lux-voice-mirror-btn');
  if (oldBtn) oldBtn.remove();
  const oldPlayer = container.querySelector('.lux-voice-mirror-player');
  if (oldPlayer) oldPlayer.remove();

  const hasProfile = await ensureProfileChecked();

  if (!hasProfile) {
    const setupBtn = createSetupButton(container, targetTextOrGetter);
    const shell = createShell({
      detailsText: 'Powered by ElevenLabs Instant Voice Cloning. Hear practice lines in your own corrected voice. Record 5 short samples to get started.',
      buttonEl: setupBtn,
    });
    container.appendChild(shell);
    return;
  }

  const btn = createMirrorButton(targetTextOrGetter);
  const shell = createShell({
    detailsText: 'Powered by ElevenLabs Instant Voice Cloning. Hear this practice line in your own corrected voice.',
    buttonEl: btn,
  });

  container.appendChild(shell);
}

export function resetVoiceMirrorCache() {
  _hasProfile = null;
}
