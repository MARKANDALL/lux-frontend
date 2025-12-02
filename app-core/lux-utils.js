// app-core/lux-utils.js

const PREFIX = "[LUX]";

export function logStatus(message, data) {
  if (data !== undefined) {
    console.log(`${PREFIX} ${message}`, data);
  } else {
    console.log(`${PREFIX} ${message}`);
  }
}

export function logError(message, detail) {
  if (detail !== undefined) {
    console.error(`${PREFIX} error: ${message}`, detail);
  } else {
    console.error(`${PREFIX} error: ${message}`);
  }
}

export function debug(message, data) {
  if (data !== undefined) {
    console.debug(`${PREFIX} ${message}`, data);
  } else {
    console.debug(`${PREFIX} ${message}`);
  }
}

// Lightweight DOM helpers (only used by recording-related code)
export function qs(selector) {
  return document.querySelector(selector);
}

export function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

export function setVisible(el, show) {
  if (!el) return;
  el.style.display = show ? "" : "none";
}
