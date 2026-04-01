// api/voice-mirror.js
// One-line: API helpers for Voice Mirror (clone status, create, synthesize).

import { API_BASE, apiFetch } from './util.js';

const CLONE_URL = `${API_BASE}/api/router?route=voice-clone`;
const MIRROR_URL = `${API_BASE}/api/router?route=voice-mirror`;

/** Check if the current user has an active voice profile. */
export async function getVoiceProfileStatus(uid) {
  return apiFetch(CLONE_URL, {
    method: 'POST',
    body: JSON.stringify({ uid, action: 'status' }),
  });
}

/** Create a voice clone from base64-encoded audio. */
export async function createVoiceClone({ uid, audioBase64, userName }) {
  return apiFetch(CLONE_URL, {
    method: 'POST',
    body: JSON.stringify({ uid, audioBase64, userName }),
  });
}

/** Delete the user's voice profile. */
export async function deleteVoiceProfile(uid) {
  return apiFetch(CLONE_URL, {
    method: 'POST',
    body: JSON.stringify({ uid, action: 'delete' }),
  });
}

/** Synthesize corrected text in the user's cloned voice. Returns { ok, audioBase64, contentType }. */
export async function synthesizeVoiceMirror({ uid, targetText }) {
  return apiFetch(MIRROR_URL, {
    method: 'POST',
    body: JSON.stringify({ uid, targetText }),
  });
}