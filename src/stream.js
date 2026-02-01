import { ensureUID } from "../api/identity.js";
import { initAuthUI } from "../ui/auth-dom.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

import { mountStreamingApp } from "../features/streaming/app.js";

// 0) UID is still the single source of truth (guest or authed)
ensureUID();

// 1) Auth UI (top-right Save Progress)
initAuthUI();

// 2) Mount the streaming feature into its isolated root
mountStreamingApp({ rootId: "lux-stream-root" });

// 3) Optional: ripple polish for buttons marked with data-lux-ripple
bootRippleButtons();

// 4) Mode Toggle for Tap vs Auto
document.addEventListener("DOMContentLoaded", function() {
  const modeToggle = document.getElementById('modeToggle'); // Tap vs Auto
  const getReplyBtn = document.getElementById('getReplyBtn'); // The "Tap" button

  if (modeToggle) {
    modeToggle.addEventListener('change', () => {
      const isTapMode = modeToggle.value === 'tap';

      // 1. Update the UI state
      getReplyBtn.disabled = !isTapMode;
      getReplyBtn.classList.toggle('opacity-50', !isTapMode);

      // 2. Update the AI via the transport controller
      // We assume 'transport' is your instance of StreamingTransport
      if (transport && transport.isConnected) {
        transport.updateSession({
          turn_detection: {
            type: "server_vad",
            create_response: !isTapMode // false for Tap mode
          }
        });
      }
    });
  }

  if (getReplyBtn) {
    // 5) Handle the "Get Reply" Action
    getReplyBtn.addEventListener('click', () => {
      if (transport && transport.isConnected) {
        // Manually trigger a response from the model
        transport.sendEvent({
          type: "response.create",
          response: {
            instructions: "Please respond to my last statement."
          }
        });
      }
    });
  }
});
