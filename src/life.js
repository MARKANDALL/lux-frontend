// src/life.js (placeholder)
import { ensureUID } from "../api/identity.js";
import { initAuthUI } from "../ui/auth-dom.js";

ensureUID();
initAuthUI();

const root = document.getElementById("lux-life-root");
if (root) {
  root.innerHTML = `
    <div style="min-height:100vh;padding:22px;box-sizing:border-box;font-family:system-ui">
      <div style="max-width:880px;margin:0 auto;background:rgba(255,255,255,0.82);border:1px solid rgba(0,0,0,0.08);border-radius:18px;padding:18px;box-shadow:0 12px 28px rgba(0,0,0,0.08)">
        <div style="font-family:Montserrat,system-ui;font-weight:900;font-size:18px">Life Journey</div>
        <div style="margin-top:6px;color:rgba(0,0,0,0.62);font-size:13px">
          Placeholder page is live. Next step is the board + spin + event cards + mission launch.
        </div>

        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="./convo.html" style="text-decoration:none;padding:10px 12px;border-radius:999px;border:1px solid rgba(0,0,0,0.10);background:rgba(255,255,255,0.92);font-weight:900;color:rgba(0,0,0,0.72)">AI Hub</a>
          <a href="./index.html" style="text-decoration:none;padding:10px 12px;border-radius:999px;border:1px solid rgba(0,0,0,0.10);background:rgba(255,255,255,0.92);font-weight:900;color:rgba(0,0,0,0.72)">Practice Skills</a>
        </div>
      </div>
    </div>
  `;
}
