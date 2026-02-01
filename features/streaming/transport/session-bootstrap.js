import { API_BASE } from "../../../api/util.js";

function clampNumber(v, fallback, min, max) {
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampInt(v, fallback, min, max) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ✅ 1. ROBUST TOKEN GETTER
function getClientToken() {
  if (typeof window === "undefined") return "";
  
  // Try storage first
  let t = sessionStorage.getItem("lux_admin_token") || localStorage.getItem("lux_admin_token");
  
  // If missing, ASK the user and save it
  if (!t) {
    t = prompt("⚠️ Admin Token required for Streaming. Please paste it here:");
    if (t) {
      t = t.trim();
      sessionStorage.setItem("lux_admin_token", t); // Save for this session
      localStorage.setItem("lux_admin_token", t);   // Save forever
    }
  }
  return t || "";
}

export async function getWebRTCAnswerSDP(offerSDP, opts = {}) {
  // Primary: explicit opts (future-proof when transport is passed a route object).
  // Fallback: URL query params (so stream.html?... immediately works today).
  const qs = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const model =
    String(opts.model ?? qs.get("model") ?? "gpt-realtime-mini").trim() ||
    "gpt-realtime-mini";
  const voice = String(opts.voice ?? qs.get("voice") ?? "marin").trim() || "marin";

  // Realtime speed is numeric 0.25–1.5 and only updates between turns.
  const speed = clampNumber(opts.speed ?? qs.get("speed"), 0.85, 0.25, 1.5);

  const maxOutputTokens = clampInt(
    opts.maxOutputTokens ??
      opts.max_output_tokens ??
      qs.get("max_output_tokens") ?? 
      qs.get("maxOutputTokens"),
    250,
    1,
    4096
  );

  const params = new URLSearchParams();
  params.set("model", model);
  params.set("voice", voice);
  params.set("speed", String(speed));
  params.set("max_output_tokens", String(maxOutputTokens));

  const url = `${API_BASE}/api/realtime/webrtc/session?${params.toString()}`;

  // ✅ 2. CALL GETTER
  const token = getClientToken();

  if (!token) {
    throw new Error("No Admin Token provided. Cannot connect.");
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/sdp",
      "x-admin-token": token 
    },
    body: offerSDP,
  });

  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(
      `Realtime SDP exchange failed (${resp.status}). Body: ${text.slice(0, 300)}`
    );
  }

  return text;
}
