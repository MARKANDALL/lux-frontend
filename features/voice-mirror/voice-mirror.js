// features/voice-mirror/voice-mirror.js
// One-line: "Hear it in my voice" button + inline audio player for TTS drawer.

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

function applyShimmerTiming(el, {
  minDuration = 11,
  maxDuration = 18,
  minDelay = 0.8,
  maxDelay = 4.5,
} = {}) {
  if (!el) return;
  el.style.setProperty('--lux-vm-shimmer-duration', `${rand(minDuration, maxDuration).toFixed(2)}s`);
  el.style.setProperty('--lux-vm-shimmer-delay', `${rand(minDelay, maxDelay).toFixed(2)}s`);
}

// ── Glass shimmer keyframes (injected once) ───────────────────────────
let _shimmerInjected = false;
function ensureShimmerCSS() {
  if (_shimmerInjected) return;
  _shimmerInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes lux-glass-shimmer {
      0%, 64% {
        transform: translateX(-170%);
        opacity: 0;
      }
      69% {
        opacity: 0.16;
      }
      75% {
        opacity: 0.34;
      }
      83% {
        transform: translateX(260%);
        opacity: 0.06;
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
        rgba(255, 255, 255, 0.08) 38%,
        rgba(255, 255, 255, 0.24) 50%,
        rgba(255, 255, 255, 0.08) 62%,
        rgba(255, 255, 255, 0) 82%,
        transparent 100%
      );
      transform: translateX(-170%);
      animation: lux-glass-shimmer var(--lux-vm-shimmer-duration, 13s) cubic-bezier(.22,.61,.36,1) infinite;
      animation-delay: var(--lux-vm-shimmer-delay, 0s);
      pointer-events: none;
      border-radius: inherit;
      will-change: transform, opacity;
    }

    .lux-vm-shell {
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease,
        background 0.18s ease;
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
      max-height: 96px;
      opacity: 1;
      transform: translateY(0);
      margin: 6px 0 10px 0;
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
    if (event.target.closest('.lux-voice-mirror-btn, .lux-voice-mirror-player, audio, button')) {
      return;
    }
    setShellOpen(shell, detailsEl, hintEl, !shell.classList.contains('is-open'));
  });

  shell.addEventListener('keydown', (event) => {
    if (event.target.closest('.lux-voice-mirror-btn, .lux-voice-mirror-player, audio, button')) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setShellOpen(shell, detailsEl, hintEl, !shell.classList.contains('is-open'));
  });
}

function createShell({ detailsText, buttonEl }) {
  ensureShimmerCSS();

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
  btn.innerHTML = '🪞 <span>Hear it in my voice</span>';
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

// ── Show the audio player after synthesis ──────────────────────────────
function showPlayer(anchorEl, audioUrl) {
  const existing = anchorEl.parentElement?.querySelector('.lux-voice-mirror-player');
  if (existing) {
    const oldSrc = existing.querySelector('audio')?.src;
    if (oldSrc) URL.revokeObjectURL(oldSrc);
    existing.remove();
  }

  const player = document.createElement('div');
  player.className = 'lux-voice-mirror-player';
  player.style.cssText = [
    'margin: 8px 0 0 0',
    'width: 100%',
    'position: relative',
    'z-index: 1',
  ].join(';');

  player.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  player.innerHTML = `
    <audio controls autoplay style="width:100%; border-radius:8px; height:36px;" src="${audioUrl}"></audio>
  `;

  anchorEl.insertAdjacentElement('afterend', player);
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
      detailsText: 'Hear practice lines in your own corrected voice. Record 5 short samples to get started.',
      buttonEl: setupBtn,
    });
    container.appendChild(shell);
    return;
  }

  const btn = createMirrorButton(targetTextOrGetter);
  const shell = createShell({
    detailsText: 'Hear this practice line in your own corrected voice.',
    buttonEl: btn,
  });

  container.appendChild(shell);
}

export function resetVoiceMirrorCache() {
  _hasProfile = null;
}