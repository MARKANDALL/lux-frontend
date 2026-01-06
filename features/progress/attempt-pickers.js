// features/progress/attempt-pickers.js
// Field pickers for attempt objects (handles schema drift).

export function pickTS(a) {
  return a?.ts || a?.created_at || a?.createdAt || a?.time || a?.localTime || null;
}

export function pickPassageKey(a) {
  return a?.passage_key || a?.passageKey || a?.passage || "";
}

export function pickSessionId(a) {
  return a?.session_id || a?.sessionId || "";
}

export function pickSummary(a) {
  return a?.summary || a?.summary_json || a?.sum || null;
}

export function pickAzure(a) {
  return a?.azureResult || a?.azure_result || a?.azure || a?.result || null;
}
