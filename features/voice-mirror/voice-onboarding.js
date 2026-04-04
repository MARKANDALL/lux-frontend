// features/voice-mirror/voice-onboarding.js
// One-line: Multi-step guided recording modal for creating a high-quality voice clone.

import { createVoiceClone } from '../../_api/voice-mirror.js';
import { resetVoiceMirrorCache } from './voice-mirror.js';

// ── Recording prompts (designed for natural, consistent speech) ───────
const PROMPTS = [
  {
    label: 'Warm-up',
    instruction: 'Read this naturally, as if talking to a friend.',
    text: 'The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.',
  },
  {
    label: 'Conversational',
    instruction: 'Keep the same relaxed, natural tone.',
    text: 'I went to the store yesterday to pick up a few things. The weather was nice, so I decided to walk instead of drive. It took about twenty minutes, but I didn\'t mind at all.',
  },
  {
    label: 'Descriptive',
    instruction: 'Same voice, same pace. You\'re doing great.',
    text: 'The old house stood at the end of a quiet street. Its windows were tall and narrow, and the front door was painted a deep shade of blue. A small garden grew beside the path.',
  },
  {
    label: 'Instructional',
    instruction: 'Clear and steady, like explaining something to someone.',
    text: 'First, you need to gather all the ingredients. Then, mix the dry ones together in a large bowl. After that, add the wet ingredients slowly while stirring. The key is to keep everything smooth.',
  },
  {
    label: 'Expressive',
    instruction: 'A little more energy here, but still natural.',
    text: 'Can you believe it? After all that work, we finally finished the project. Everyone was so relieved. We went out to celebrate, and honestly, it was one of the best nights I can remember.',
  },
];

// ── Shimmer + modal CSS (injected once) ───────────────────────────────
let _cssInjected = false;
function ensureCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const style = document.createElement('style');
  style.id = 'lux-voice-onboarding-css';
  style.textContent = `
    .lux-vo-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: lux-vo-fadeIn 0.2s ease;
    }
    @keyframes lux-vo-fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    .lux-vo-modal {
      background: #fff; border-radius: 16px; padding: 28px;
      max-width: 440px; width: 90vw; max-height: 85vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      position: relative;
    }
    .lux-vo-close {
      position: absolute; top: 12px; right: 14px;
      background: none; border: none; font-size: 1.3rem;
      color: #94a3b8; cursor: pointer; line-height: 1;
    }
    .lux-vo-close:hover { color: #475569; }
    .lux-vo-title {
      font-size: 1.25rem; font-weight: 800; color: #1e293b;
      margin: 0 0 4px 0;
    }
    .lux-vo-subtitle {
      font-size: 0.85rem; color: #64748b; margin: 0 0 20px 0; line-height: 1.5;
    }
    .lux-vo-step-label {
      font-size: 0.75rem; font-weight: 700; color: #8b5cf6;
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;
    }
    .lux-vo-instruction {
      font-size: 0.85rem; color: #64748b; margin: 0 0 10px 0; font-style: italic;
    }
    .lux-vo-script {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 14px 16px; font-size: 0.95rem; line-height: 1.6;
      color: #1e293b; margin: 0 0 16px 0;
    }
    .lux-vo-progress {
      display: flex; gap: 6px; margin: 0 0 20px 0;
    }
    .lux-vo-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #e2e8f0; transition: background 0.2s;
    }
    .lux-vo-dot.done { background: #22c55e; }
    .lux-vo-dot.active { background: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
    .lux-vo-dot.recording { background: #ef4444; animation: lux-vo-pulse 1s infinite; }
    @keyframes lux-vo-pulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
      50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.3); }
    }
    .lux-vo-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 24px; border: none; border-radius: 10px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
      transition: all 0.15s ease; width: 100%;
    }
    .lux-vo-btn-record {
      background: #ef4444; color: #fff;
      box-shadow: 0 2px 8px rgba(239,68,68,0.3);
    }
    .lux-vo-btn-record:hover { background: #dc2626; }
    .lux-vo-btn-record.recording {
      background: #991b1b; animation: lux-vo-pulse 1s infinite;
    }
    .lux-vo-btn-next {
      background: #8b5cf6; color: #fff; margin-top: 8px;
      box-shadow: 0 2px 8px rgba(139,92,246,0.3);
    }
    .lux-vo-btn-next:hover { background: #7c3aed; }
    .lux-vo-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
    .lux-vo-btn-create {
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
      margin-top: 8px; font-size: 1rem;
      box-shadow: 0 2px 12px rgba(99,102,241,0.4);
    }
    .lux-vo-btn-create:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.5); }
    .lux-vo-btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
    .lux-vo-check {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; color: #16a34a; margin: 8px 0 0 0;
    }
    .lux-vo-consent {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 0.8rem; color: #64748b; margin: 16px 0 0 0;
      line-height: 1.4;
    }
    .lux-vo-consent input { margin-top: 2px; flex-shrink: 0; }
    .lux-vo-timer {
      font-size: 0.8rem; color: #94a3b8; text-align: center; margin: 4px 0 0 0;
    }
    .lux-vo-status {
      text-align: center; padding: 20px; color: #64748b;
    }
    .lux-vo-status .spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid #e2e8f0; border-top-color: #8b5cf6;
      border-radius: 50%; animation: lux-vo-spin 0.8s linear infinite;
      margin: 0 0 12px 0;
    }
    @keyframes lux-vo-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// ── Get UID ───────────────────────────────────────────────────────────
function getLuxUID() {
  return (
    (window && window.LUX_USER_ID) ||
    document.documentElement.getAttribute('data-uid') ||
    ''
  ).toString();
}

// ── MediaRecorder helpers ─────────────────────────────────────────────
function startRecording() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve(blob);
        };
        recorder.onerror = e => reject(e);
        recorder.start();
        resolve({ recorder, stream });
      })
      .catch(reject);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Main: open the onboarding modal ───────────────────────────────────
export function openVoiceOnboarding(onComplete) {
  ensureCSS();

  const recordings = []; // base64 strings
  let currentStep = 0;
  let mediaRecorder = null;
  let recordingStream = null;
  let recordingChunks = [];
  let isRecording = false;
  let timerInterval = null;
  let recordSeconds = 0;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'lux-vo-overlay';

  const modal = document.createElement('div');
  modal.className = 'lux-vo-modal';
  overlay.appendChild(modal);

  // Close on overlay click (not modal click)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });

  function cleanup() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(t => t.stop());
    }
    if (timerInterval) clearInterval(timerInterval);
    overlay.remove();
  }

  function render() {
    const prompt = PROMPTS[currentStep];
    const isLastStep = currentStep === PROMPTS.length - 1;
    const hasRecording = recordings[currentStep] != null;

    modal.innerHTML = `
      <button class="lux-vo-close" type="button" title="Close">✕</button>
      <h2 class="lux-vo-title">🪞 Set Up Voice Mirror</h2>
      <p class="lux-vo-subtitle">
        Record ${PROMPTS.length} short samples so we can learn your voice.
        Read each script naturally — same voice, same pace throughout.
      </p>

      <div class="lux-vo-progress">
        ${PROMPTS.map((_, i) => {
          let cls = 'lux-vo-dot';
          if (recordings[i] != null) cls += ' done';
          else if (i === currentStep && isRecording) cls += ' recording';
          else if (i === currentStep) cls += ' active';
          return `<div class="${cls}"></div>`;
        }).join('')}
      </div>

      <div class="lux-vo-step-label">
        Sample ${currentStep + 1} of ${PROMPTS.length} — ${prompt.label}
      </div>
      <p class="lux-vo-instruction">${prompt.instruction}</p>
      <div class="lux-vo-script">${prompt.text}</div>

      ${hasRecording ? `
        <div class="lux-vo-check">✅ Recorded</div>
      ` : ''}

      <div id="lux-vo-timer" class="lux-vo-timer" style="display:${isRecording ? 'block' : 'none'}">
        Recording: ${recordSeconds}s
      </div>

      <button id="lux-vo-rec" class="lux-vo-btn lux-vo-btn-record ${isRecording ? 'recording' : ''}" type="button">
        ${isRecording ? '⏹ Stop Recording' : (hasRecording ? '🔄 Re-record' : '🎙 Start Recording')}
      </button>

      ${hasRecording && !isLastStep ? `
        <button id="lux-vo-next" class="lux-vo-btn lux-vo-btn-next" type="button">
          Next Sample →
        </button>
      ` : ''}

      ${hasRecording && isLastStep ? `
        <div class="lux-vo-consent">
          <input type="checkbox" id="lux-vo-consent-check" />
          <label for="lux-vo-consent-check">
            I confirm these recordings are my own voice and I consent to
            creating a synthetic voice model for pronunciation practice.
          </label>
        </div>
        <button id="lux-vo-create" class="lux-vo-btn lux-vo-btn-create" type="button" disabled>
          🪞 Create My Voice
        </button>
      ` : ''}
    `;

    // Wire close
    modal.querySelector('.lux-vo-close').addEventListener('click', cleanup);

    // Wire record button
    const recBtn = modal.querySelector('#lux-vo-rec');
    recBtn.addEventListener('click', () => {
      if (isRecording) {
        stopRecording();
      } else {
        beginRecording();
      }
    });

    // Wire next button
    const nextBtn = modal.querySelector('#lux-vo-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentStep++;
        render();
      });
    }

    // Wire consent + create
    const consentCheck = modal.querySelector('#lux-vo-consent-check');
    const createBtn = modal.querySelector('#lux-vo-create');
    if (consentCheck && createBtn) {
      consentCheck.addEventListener('change', () => {
        createBtn.disabled = !consentCheck.checked;
      });
      createBtn.addEventListener('click', () => {
        if (!consentCheck.checked) return;
        submitClone();
      });
    }
  }

  async function beginRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream = stream;
      recordingChunks = [];

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        recordingStream?.getTracks().forEach(t => t.stop());
        recordingStream = null;
        isRecording = false;
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

        const blob = new Blob(recordingChunks, { type: 'audio/webm' });
        const b64 = await blobToBase64(blob);
        recordings[currentStep] = b64;
        recordSeconds = 0;
        render();
      };

      mediaRecorder.start();
      isRecording = true;
      recordSeconds = 0;

      timerInterval = setInterval(() => {
        recordSeconds++;
        const timerEl = modal.querySelector('#lux-vo-timer');
        if (timerEl) {
          timerEl.style.display = 'block';
          timerEl.textContent = `Recording: ${recordSeconds}s`;
        }
        // Auto-stop at 30 seconds
        if (recordSeconds >= 30) stopRecording();
      }, 1000);

      render();
    } catch (err) {
      console.error('[voice-onboarding] mic access failed:', err);
      alert('Microphone access is required. Please allow mic access and try again.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  async function submitClone() {
    const uid = getLuxUID();
    if (!uid) { alert('No user ID found.'); return; }

    // Show creating state
    modal.innerHTML = `
      <div class="lux-vo-status">
        <div class="spinner"></div>
        <h3 style="margin:0 0 8px; color:#1e293b;">Creating Your Voice...</h3>
        <p style="margin:0; font-size:0.85rem;">
          This takes about 10–15 seconds. We're sending ${recordings.length} samples
          to build your personalized voice model.
        </p>
      </div>
    `;

    try {
      const result = await createVoiceClone({
        uid,
        audioBase64: recordings.filter(Boolean),
        userName: 'User',
      });

      if (!result.ok) throw new Error(result.error || 'Clone creation failed');

      // Success!
      resetVoiceMirrorCache();

      modal.innerHTML = `
        <div class="lux-vo-status">
          <div style="font-size:3rem; margin:0 0 12px;">🪞</div>
          <h3 style="margin:0 0 8px; color:#1e293b;">Voice Mirror is Ready!</h3>
          <p style="margin:0 0 16px; font-size:0.85rem; color:#64748b;">
            Your voice has been cloned from ${recordings.length} samples.
            You can now hear any practice text in your own corrected voice.
          </p>
          <button class="lux-vo-btn lux-vo-btn-next" type="button" id="lux-vo-done">
            Start Using Voice Mirror
          </button>
        </div>
      `;

      modal.querySelector('#lux-vo-done').addEventListener('click', () => {
        cleanup();
        if (typeof onComplete === 'function') onComplete(result.voiceId);
      });

    } catch (err) {
      console.error('[voice-onboarding] clone failed:', err);
      modal.innerHTML = `
        <div class="lux-vo-status">
          <div style="font-size:2rem; margin:0 0 12px;">⚠️</div>
          <h3 style="margin:0 0 8px; color:#dc2626;">Something went wrong</h3>
          <p style="margin:0 0 16px; font-size:0.85rem; color:#64748b;">
            ${err.message || 'Voice creation failed. Please try again.'}
          </p>
          <button class="lux-vo-btn lux-vo-btn-next" type="button" id="lux-vo-retry">
            Try Again
          </button>
        </div>
      `;
      modal.querySelector('#lux-vo-retry').addEventListener('click', () => {
        currentStep = 0;
        render();
      });
    }
  }

  // Initial render
  render();
  document.body.appendChild(overlay);
}