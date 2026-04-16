// api/alt-meaning.js
// Frontend helper that calls backend /api/router?route=alt-meaning and returns JSON.

import { apiFetch } from "./util.js";

const ALT_MEANING_URL = `/_api/router?route=alt-meaning`;

export async function fetchAltMeanings(payload = {}) {
  return apiFetch(ALT_MEANING_URL, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}