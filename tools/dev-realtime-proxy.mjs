// tools/dev-realtime-proxy.mjs
// Local dev proxy for OpenAI Realtime WebRTC SDP exchange.
// Run:  $env:OPENAI_API_KEY="..." ; node tools/dev-realtime-proxy.mjs
// Then set: $env:VITE_API_BASE="http://localhost:8787" (restart vite)

import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in env.");
  process.exit(1);
}

// Keep this minimal for the spike. You can session.update later from the client.
const sessionConfig = {
  type: "realtime",
  model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
  audio: { output: { voice: process.env.OPENAI_REALTIME_VOICE || "marin" } },
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...headers,
  });
  res.end(body);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.method === "POST" && (req.url === "/realtime/webrtc/session" || req.url === "/api/realtime/webrtc/session")) {
    try {
      const offerSdp = await readBody(req);

      const fd = new FormData();
      fd.set("sdp", offerSdp);
      fd.set("session", JSON.stringify(sessionConfig));

      const r = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: fd,
      });

      const answerSdp = await r.text();

      if (!r.ok) {
        return send(
          res,
          r.status,
          answerSdp || JSON.stringify({ error: "OpenAI realtime/calls failed" }),
          { "Content-Type": "text/plain; charset=utf-8" }
        );
      }

      return send(res, 200, answerSdp, {
        "Content-Type": "application/sdp; charset=utf-8",
      });
    } catch (err) {
      console.error(err);
      return send(res, 500, "Proxy error");
    }
  }

  send(res, 404, "Not found");
});

server.listen(PORT, () => {
  console.log(`[dev-realtime-proxy] listening on http://localhost:${PORT}`);
});
