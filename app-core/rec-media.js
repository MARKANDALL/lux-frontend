// app-core/rec-media.js
// Wraps the browser's MediaRecorder API.

import { logError } from "./lux-utils.js";

let mediaRecorder = null;
let recordedChunks = [];

/**
 * Request mic access and start recording.
 * @param {Function} onStopCallback - called with (audioBlob) when stopped
 */
export async function startMic(onStopCallback) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      // Kill the stream tracks (turn off the red dot in tab)
      stream.getTracks().forEach(t => t.stop());
      
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      if (onStopCallback) onStopCallback(blob);
    };

    mediaRecorder.start();
    return true;

  } catch (err) {
    logError("Mic access failed", err);
    return false;
  }
}

export function stopMic() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
}