// features/progress/render/dashboard/attempt-utils.js
// Helper functions for dashboard attempt parsing and session grouping.

export function pickAzure(a) {
  return a?.azureResult || a?.azure_result || a?.azure || a?.result || null;
}
export function pickSummary(a) {
  return a?.summary || a?.summary_json || a?.sum || null;
}
export function pickSessionId(a) {
  return a?.session_id || a?.sessionId || "";
}
export function pickTS(a) {
  return a?.ts || a?.created_at || a?.createdAt || a?.time || a?.localTime || null;
}

// Pre-group attempts by session for History drill-in.
function localDayKey(ts) {
  const d = new Date(ts);
  try {
    return d.toLocaleDateString("en-CA");
  } catch (_) {}
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function sessionKeyForAttempt(a) {
  const sid = pickSessionId(a);
  if (sid) return sid;

  const ts = pickTS(a);
  if (!ts) return "";
  return `nosess:${localDayKey(ts)}`;
}

export function buildAttemptsBySession(attempts) {
  const bySession = new Map();
  for (const a of attempts || []) {
    const sid = sessionKeyForAttempt(a);
    if (!sid) continue;
    const arr = bySession.get(sid) || [];
    arr.push(a);
    bySession.set(sid, arr);
  }
  return bySession;
}
