// C:\dev\LUX_GEMINI\api\alt-meaning.js
// One-line: Frontend helper that calls backend /api/router?route=alt-meaning and returns JSON.

const ALT_MEANING_URL = `/api/router?route=alt-meaning`;
const ADMIN_TOKEN = (import.meta?.env?.VITE_ADMIN_TOKEN || "").toString().trim();

export async function fetchAltMeanings(payload = {}) {
  const r = await fetch(ALT_MEANING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_TOKEN ? { "x-admin-token": ADMIN_TOKEN } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const text = await r.text();

  if (!r.ok) {
    throw new Error(`alt-meaning ${r.status}: ${text || "No body"}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(
      `alt-meaning bad json: ${String(e?.message || e)} :: ${text.slice(0, 120)}`
    );
  }
}
