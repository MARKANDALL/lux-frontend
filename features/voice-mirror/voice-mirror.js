// features/voice-mirror/voice-mirror.js
// One-line: "Hear it in my voice" button + dual playback UI for results views.

import { getVoiceProfileStatus, synthesizeVoiceMirror } from '../../api/voice-mirror.js';

// ── State ──────────────────────────────────────────────────────────────
let _hasProfile = null; // null = unchecked, true/false after first check

// ── Get UID (mirrors summary-shell.js pattern) ────────────────────────
function getLuxUID() {
  return (
    (window && window.LUX_USER_ID) ||
    document.documentElement.getAttribute('data-uid') ||
    ''
  ).toString();
}

// ── Check profile status (cached per page load) ───────────────────────
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

// ── Create audio element from base64 MP3 ──────────────────────────────
function base64ToAudioUrl(base64) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

// ── Build the Voice Mirror button ─────────────────────────────────────
function createMirrorButton(targetText) {
  const btn = document.createElement('button');
  btn.className = 'lux-voice-mirror-btn';
  btn.type = 'button';
  btn.innerHTML = '🪞 <span>Hear it in my voice</span>';
  btn.style.cssText = [
    'display: inline-flex',
    'align-items: center',
    'gap: 8px',
    'padding: 10px 18px',
    'margin: 16px 0',
    'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
    'color: #fff',
    'border: none',
    'border-radius: 12px',
    'font-size: 0.95rem',
    'font-weight: 600',
    'cursor: pointer',
    'transition: all 0.2s ease',
    'box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3)',
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
      showPlayer(btn, audioUrl, targetText);
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

// ── Show the audio player after synthesis ──────────────────────────────
function showPlayer(anchorEl, audioUrl, text) {
  // Remove any existing player
  const existing = anchorEl.parentElement?.querySelector('.lux-voice-mirror-player');
  if (existing) existing.remove();

  const player = document.createElement('div');
  player.className = 'lux-voice-mirror-player';
  player.style.cssText = [
    'margin: 12px 0',
    'padding: 16px',
    'background: #f8f7ff',
    'border: 1px solid #e0dbff',
    'border-radius: 12px',
  ].join(';');

  player.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
      <span style="font-size:1.2em;">🪞</span>
      <strong style="color:#4f46e5; font-size:0.95rem;">Voice Mirror</strong>
    </div>
    <div style="color:#64748b; font-size:0.85rem; margin-bottom:12px; font-style:italic;">
      "${text.length > 80 ? text.slice(0, 80) + '…' : text}"
    </div>
    <audio controls autoplay style="width:100%; border-radius:8px;" src="${audioUrl}"></audio>
    <div style="margin-top:8px; text-align:right;">
      <button type="button" class="lux-vm-close" style="
        background:none; border:none; color:#94a3b8; cursor:pointer;
        font-size:0.8rem; text-decoration:underline;
      ">Close</button>
    </div>
  `;

  player.querySelector('.lux-vm-close').addEventListener('click', () => {
    URL.revokeObjectURL(audioUrl);
    player.remove();
  });

  anchorEl.insertAdjacentElement('afterend', player);
}

// ── Public: inject Voice Mirror button into a container ────────────────
// Call this after results are rendered. Pass the target text (what the
// user was supposed to say) and a DOM container to inject into.
export async function mountVoiceMirrorButton(container, targetText) {
  if (!container || !targetText) return;

  // Remove any previous button in this container
  const old = container.querySelector('.lux-voice-mirror-btn');
  if (old) old.remove();
  const oldPlayer = container.querySelector('.lux-voice-mirror-player');
  if (oldPlayer) oldPlayer.remove();

  const hasProfile = await ensureProfileChecked();
  if (!hasProfile) return; // Silently skip if no voice profile exists yet

  const btn = createMirrorButton(targetText);
  container.appendChild(btn);
}

// ── Public: reset cached profile status (call after creating a profile) ──
export function resetVoiceMirrorCache() {
  _hasProfile = null;
}