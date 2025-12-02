// api/wix.js
import { dbg, jsonOrThrow } from "./util.js";

// feature flag (matches original behavior)
export const ENABLE_WIX_SAVE = false;

function isProdHost() {
  try {
    return location.hostname.endsWith("luxurylanguagelearninglab.com");
  } catch {
    return false;
  }
}

function wixFunctionsBase() {
  const host = (typeof location !== "undefined" && location.hostname) || "";
  return host.includes("wix-editor")
    ? "https://www.luxurylanguagelearninglab.com/_functions-dev"
    : "https://www.luxurylanguagelearninglab.com/_functions";
}

export async function savePronunciationResult({
  userId = null,
  passageKey,
  partIndex,
  text,
  azureResult,
}) {
  const url = `${wixFunctionsBase()}/pronunciationResults`;

  if (!(ENABLE_WIX_SAVE && isProdHost())) {
    console.info("Skipping Wix save (disabled or not on prod host).");
    return { skipped: true };
  }

  const body = { userId, passageKey, partIndex, text, azureResult };
  dbg("POST", url, { passageKey, partIndex });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(resp);
}

export function saveToWix(payload) {
  return savePronunciationResult(payload);
}

export function canSaveToWix() {
  return ENABLE_WIX_SAVE && isProdHost();
}
