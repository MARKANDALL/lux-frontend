// features/streaming/transport/session-bootstrap.js

import { API_BASE } from "../../../api/util.js";

export async function getWebRTCAnswerSDP(offerSDP) {
const url = `${API_BASE}/api/realtime/webrtc/session`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
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
