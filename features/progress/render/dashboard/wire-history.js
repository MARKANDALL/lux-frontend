// features/progress/render/dashboard/wire-history.js
// Wires History session buttons (👉) to open the Attempt Details modal.

import { openDetailsModal } from "../../attempt-detail-modal.js";
import { pickTS } from "./attempt-utils.js";
import { attemptOverallScore, attemptDateStr } from "./attempt-display.js";

export function wireHistoryButtons(host, bySession, sessions) {
  host.querySelectorAll(".lux-hbtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sid = btn.getAttribute("data-sid") || "";
      if (!sid) return;

      const list = (bySession.get(sid) || [])
        .slice()
        .sort((a, b) => {
          const ta = new Date(pickTS(a) || 0).getTime();
          const tb = new Date(pickTS(b) || 0).getTime();
          return tb - ta;
        });

      const a = list[0];
      if (!a) {
        console.warn("[progress] No attempts found for sid:", sid);
        return;
      }

      const sess = (sessions || []).find((x) => String(x.sessionId) === String(sid)) || null;

      openDetailsModal(a, attemptOverallScore(a), attemptDateStr(a), {
        sid,
        list,
        session: sess,
      });
    });
  });
}
