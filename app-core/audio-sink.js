// app-core/audio-sink.js
// Handles the hidden learner audio element.
// UPDATED: Simplified. Passes Blob directly to Waveform Logic (no manual decoding).

import { loadLearnerBlob } from "../features/features/selfpb/waveform-logic.js"; 

export function initAudioSink() {
  const AUDIO_ID = "playbackAudio";
  const FN = "__attachLearnerBlob";

  const audio = document.getElementById(AUDIO_ID) || (() => {
    const a = document.createElement("audio");
    a.id = AUDIO_ID;
    a.hidden = true;
    document.body.appendChild(a);
    return a;
  })();

  if (audio.__sinkV7) return; 
  audio.__sinkV7 = true;
  audio.preload = "auto";

  const safeLoad = async (url, blob) => {
    try {
      audio.pause();
      audio.src = url;
      audio.load();

      // 1. Dispatch legacy event
      document.dispatchEvent(new CustomEvent("lux:new-learner-audio", { detail: { blob, url } }));

      // 2. Pass Blob to WaveSurfer (Simple!)
      if (blob && loadLearnerBlob) {
          loadLearnerBlob(blob);
      }

      if (window.LuxSelfPB?.setLearnerArrayBuffer) {
        const arr = await blob.arrayBuffer();
        await window.LuxSelfPB.setLearnerArrayBuffer(arr);
      }
    } catch (err) {
      console.warn("[learner] Audio load error:", err);
    }
  };

  window[FN] = function attachLearnerBlob(blob) {
    if (!(blob instanceof Blob)) return;
    if (audio.__blobUrl) URL.revokeObjectURL(audio.__blobUrl);
    const url = URL.createObjectURL(blob);
    audio.__blobUrl = url; 
    safeLoad(url, blob);
  };
  
  console.log("[LUX] Audio Sink initialized");
}