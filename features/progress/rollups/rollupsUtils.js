// features/progress/rollups/rollupsUtils.js
// Helper utilities extracted from rollups.js (surgical copy/paste)

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function pickAzure(attempt) {
  return (
    attempt?.azureResult ||
    attempt?.azure_result ||
    attempt?.azure ||
    attempt?.result ||
    null
  );
}

function pickSummary(attempt) {
  return attempt?.summary || attempt?.summary_json || attempt?.sum || null;
}

function pickPassageKey(attempt) {
  return attempt?.passage_key || attempt?.passageKey || attempt?.passage || "";
}

function pickSessionId(attempt) {
  return attempt?.session_id || attempt?.sessionId || "";
}

function pickTS(attempt) {
  return (
    attempt?.ts ||
    attempt?.created_at ||
    attempt?.createdAt ||
    attempt?.time ||
    Date.now()
  );
}

function localDayKey(ts) {
  const d = new Date(ts);
  // "en-CA" gives YYYY-MM-DD in most browsers
  try {
    return d.toLocaleDateString("en-CA");
  } catch (_) {}
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function daysAgoFrom(tsNum) {
  if (!tsNum) return 999;
  const d = Math.floor((Date.now() - tsNum) / (24 * 60 * 60 * 1000));
  return Number.isFinite(d) ? Math.max(0, d) : 999;
}

// Constitutional priority: error_rate × exposure × persistence × recency
function priorityFromFull({ avg, count, daysSeen, lastTS }) {
  const a = Number.isFinite(avg) ? avg : 0;
  const c = Number.isFinite(count) ? count : 0;
  const ds = Number.isFinite(daysSeen) ? daysSeen : 0;

  const errorRate = Math.max(0, Math.min(1, (100 - a) / 100)); // 0..1
  const exposure = Math.log1p(Math.max(0, c)); // grows slowly
  const persistence = Math.min(1, ds / 5); // 1.0 at 5 days
  const recency = 0.3 + 0.7 * Math.exp(-daysAgoFrom(lastTS) / 14); // never hits 0

  return errorRate * exposure * persistence * recency;
}

export function getAttemptScore(attempt) {
  const sum = pickSummary(attempt);
  if (sum && sum.pron != null) {
    const v = num(sum.pron);
    if (v != null) return v;
  }
  const az = pickAzure(attempt);
  const v = num(az?.NBest?.[0]?.PronScore);
  return v != null ? v : 0;
}

export {
  num,
  pickAzure,
  pickSummary,
  pickPassageKey,
  pickSessionId,
  pickTS,
  localDayKey,
  daysAgoFrom,
  priorityFromFull,
};
