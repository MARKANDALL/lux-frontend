// Core: networking, constants, voice caps (no DOM writes)
export const TTS_URL = "https://luxury-language-api.vercel.app/api/tts";

export const VOICES = [
  { id: "en-US-AvaNeural", label: "US — Ava" },
  { id: "en-US-JennyNeural", label: "US — Jenny" },
  { id: "en-US-AriaNeural", label: "US — Aria" },
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
    const res = await fetch(`${TTS_URL}?voices=1`);
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
  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
