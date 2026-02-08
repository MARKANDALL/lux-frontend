// features/features/tts/player-core.js
import { API_BASE, getAdminToken } from "../../../api/util.js";

// Core: networking, constants, voice caps (no DOM writes)
export const TTS_URL = `${API_BASE}/api/tts`;

export const VOICES = [
  { id: "en-US-AriaNeural", label: "US — Aria" },
  { id: "en-US-AvaNeural", label: "US — Ava" },
  { id: "en-US-JennyNeural", label: "US — Jenny" },
  { id: "en-US-GuyNeural", label: "US — Guy" },
  { id: "en-US-DavisNeural", label: "US — Davis" },
  { id: "en-US-SaraNeural", label: "US — Sara" },
  { id: "en-US-NancyNeural", label: "US — Nancy" },
  { id: "en-US-MichelleNeural", label: "US — Michelle" },
  { id: "en-US-ChristopherNeural", label: "US — Christopher" },
  { id: "en-US-TonyNeural", label: "US — Tony" },
  { id: "en-US-JennyMultilingualNeural", label: "US — Jenny (Multilingual)" },
  { id: "en-US-EmmaMultilingualNeural", label: "US — Emma (Multilingual)" },
];

export const DEFAULT_SPEED = 1.0;
export const DEFAULT_PITCH_ST = 0;

// ---- Voice capabilities (US-only) ----
export async function getVoiceCaps() {
  try {
    // If we don't have a token, skip the caps call entirely (avoid noisy 401s on mount)
    const token = getAdminToken({ promptIfMissing: false });
    if (!token) return {};

    const res = await fetch(`${TTS_URL}?voices=1`, {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const out = {};
    for (const v of data.voices || []) {
      if (!String(v.ShortName).startsWith("en-US-")) continue;
      out[v.ShortName] = {
        styles: Array.isArray(v.StyleList) ? v.StyleList : [],
      };
    }
    return out;
  } catch {
    return {};
  }
}

// ---- TTS synthesis (returns Blob with _meta) ----
export async function synthesize(payload) {
  const doFetch = (token) =>
    fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-admin-token": token } : {}),
      },
      body: JSON.stringify(payload),
    });

  // Only prompt when the user actually tries to synthesize.
  let token = getAdminToken({
    promptIfMissing: true,
    promptLabel: "Admin Token required for TTS",
  });

  let res = await doFetch(token);

  // If token was missing/expired/wrong, allow one reprompt + retry.
  if (res.status === 401) {
    token = getAdminToken({
      promptIfMissing: true,
      promptLabel: "TTS token rejected (401). Paste a valid Admin Token",
    });
    if (token) res = await doFetch(token);
  }

  const hdr = (k) => res.headers.get(k) || "";
  const meta = {
    styleUsed: hdr("X-Style-Used"),
    styleRequested: hdr("X-Style-Requested"),
    fallback: hdr("X-Style-Fallback"),
    message: hdr("X-Style-Message"),
    region: hdr("X-Azure-Region"),
  };
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    const err = new Error(`TTS ${res.status}: ${detail || "synthesis failed"}`);
    err.meta = meta;
    throw err;
  }
  const blob = await res.blob();
  blob._meta = meta;
  return blob;
}
