// features/voice-mirror/voice-mirror.js
// One-line: "Hear it in my voice" button + inline audio player for TTS drawer.

import { getVoiceProfileStatus, synthesizeVoiceMirror } from '../../api/voice-mirror.js';
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

// ── Glass shimmer keyframes (injected once) ───────────────────────────
let _shimmerInjected = false;
function ensureShimmerCSS() {
  if (_shimmerInjected) return;
  _shimmerInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lux-glass-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .lux-vm-shimmer {
      position: relative;
      overflow: hidden;
    }
    .lux-vm-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        120deg,
        transparent 25%,
        rgba(255, 255, 255, 0.25) 40%,
        rgba(255, 255, 255, 0.4) 50%,
        rgba(255, 255, 255, 0.25) 60%,
        transparent 75%
      );
      background-size: 200% 100%;
      animation: lux-glass-shimmer 3s ease-in-out infinite;
      pointer-events: none;
      border-radius: inherit;
    }
  `;
  document.head.appendChild(style);
}

// ── Build the Voice Mirror button ─────────────────────────────────────
function createMirrorButton(targetTextOrGetter) {
  ensureShimmerCSS();

  const btn = document.createElement('button');
  btn.className = 'lux-voice-mirror-btn lux-vm-shimmer';
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
  ].join(';');

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-1px)';
    btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
  });

  btn.addEventListener('click', async () => {
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
    // Pause shimmer while generating
    btn.classList.remove('lux-vm-shimmer');

    try {
      const result = await synthesizeVoiceMirror({ uid, targetText });

      if (!result.ok || !result.audioBase64) {
        throw new Error(result.error || 'No audio returned');
      }

      const audioUrl = base64ToAudioUrl(result.audioBase64);
      showPlayer(btn, audioUrl);

      // ── FIX: Reset button text after successful generation ──
      spanEl.textContent = origText;
    } catch (err) {
      console.error('[voice-mirror] synthesis failed:', err);
      spanEl.textContent = 'Error — tap to retry';
      setTimeout(() => { spanEl.textContent = origText; }, 3000);
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.classList.add('lux-vm-shimmer');
    }
  });

  return btn;
}

// ── Show the audio player after synthesis ──────────────────────────────
function showPlayer(anchorEl, audioUrl) {
  // Remove any existing player
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
  ].join(';');

  // Clean player: just the audio controls, no quote text, no close button
  player.innerHTML = `
    <audio controls autoplay style="width:100%; border-radius:8px; height:36px;" src="${audioUrl}"></audio>
  `;

  anchorEl.insertAdjacentElement('afterend', player);
}

// ── Public: inject Voice Mirror button into a container ────────────────
export async function mountVoiceMirrorButton(container, targetTextOrGetter) {
  if (!container) return;

  // Remove any previous elements
  const old = container.querySelector('.lux-voice-mirror-shell');
  if (old) old.remove();
  const oldBtn = container.querySelector('.lux-voice-mirror-btn');
  if (oldBtn) oldBtn.remove();
  const oldPlayer = container.querySelector('.lux-voice-mirror-player');
  if (oldPlayer) oldPlayer.remove();

  const hasProfile = await ensureProfileChecked();

  if (!hasProfile) {
    // Show setup prompt instead of silently hiding
    ensureShimmerCSS();
    const shell = document.createElement('div');
    shell.className = 'lux-voice-mirror-shell lux-vm-shimmer';
    shell.style.cssText = [
      'margin: 12px 0 0 0',
      'padding: 12px',
      'background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.08))',
      'border: 1px solid rgba(99, 102, 241, 0.15)',
      'border-radius: 12px',
      'width: 100%',
      'box-sizing: border-box',
      'position: relative',
    ].join(';');
    shell.innerHTML = `
      <div style="margin:0 0 8px 0; font-weight:700; color:#4f46e5; font-size:0.9rem;">🪞 Voice Mirror</div>
      <div style="margin:0 0 10px 0; color:#64748b; font-size:0.8rem; line-height:1.4;">
        Hear practice lines in your own corrected voice. Record 5 short samples to get started.
      </div>
    `;
    const setupBtn = document.createElement('button');
    setupBtn.className = 'lux-voice-mirror-btn lux-vm-shimmer';
    setupBtn.type = 'button';
    setupBtn.innerHTML = '🎙 <span>Set Up My Voice</span>';
    setupBtn.style.cssText = [
      'display: inline-flex', 'align-items: center', 'gap: 8px',
      'padding: 10px 18px', 'margin: 0', 'width: 100%', 'justify-content: center',
      'background: linear-gradient(135deg, #6366f1, #8b5cf6)', 'color: #fff',
      'border: none', 'border-radius: 10px', 'font-size: 0.95rem', 'font-weight: 600',
      'cursor: pointer', 'transition: all 0.15s ease',
      'box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3)', 'position: relative',
    ].join(';');
    setupBtn.addEventListener('click', () => {
      openVoiceOnboarding((voiceId) => {
        // Re-mount with the real button after successful clone
        mountVoiceMirrorButton(container, targetTextOrGetter);
      });
    });
    shell.appendChild(setupBtn);
    container.appendChild(shell);
    return;
  }

  ensureShimmerCSS();

  const btn = createMirrorButton(targetTextOrGetter);

  const shell = document.createElement('div');
  shell.className = 'lux-voice-mirror-shell lux-vm-shimmer';
  shell.style.cssText = [
    'margin: 12px 0 0 0',
    'padding: 12px',
    'background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.08))',
    'border: 1px solid rgba(99, 102, 241, 0.15)',
    'border-radius: 12px',
    'width: 100%',
    'box-sizing: border-box',
    'position: relative',
  ].join(';');

  shell.innerHTML = `
    <div style="margin:0 0 8px 0; font-weight:700; color:#4f46e5; font-size:0.9rem;">🪞 Voice Mirror</div>
    <div style="margin:0 0 10px 0; color:#64748b; font-size:0.8rem; line-height:1.4;">
      Hear this practice line in your own corrected voice.
    </div>
  `;
  shell.appendChild(btn);
  container.appendChild(shell);
}

export function resetVoiceMirrorCache() {
  _hasProfile = null;
}