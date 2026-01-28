// features/streaming/auth-bridge.js
// Minimal glue to existing Lux identity/auth.
// Streaming should NOT invent a new auth flow.

import { getCanonicalUID } from "../../src/supabase.js";
import { getUID } from "../../api/identity.js";

/**
 * Best-effort: returns authenticated UID if available, else guest UID.
 * Never throws; returns null only if we truly can't get anything.
 */
export async function getStreamingUID() {
  try {
    const uid = await getCanonicalUID();
    if (uid) return uid;
  } catch (_) {}

  try {
    const guest = getUID();
    if (guest) return guest;
  } catch (_) {}

  return null;
}
