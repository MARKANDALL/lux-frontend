// app-core/audio-sink.js
// Handles the hidden learner audio element, race-condition-free loading,
// and hydration of the Self-Playback feature.

import { loadLearnerAudio } from "../features/features/selfpb/waveform-logic.js"; // <--- NEW IMPORT for Phase C

export function initAudioSink() {
  const AUDIO_ID = "playbackAudio";
  const FN = "__attachLearnerBlob";

  // 1. Get or Create Audio Element
  const audio = document.getElementById(AUDIO_ID) || (() => {
    const a = document.createElement("audio");
    a.id = AUDIO_ID;
    a.hidden = true;
    document.body.appendChild(a);
    return a;
  })();

  if (audio.__sinkV7) return; // Prevent double-init
  audio.__sinkV7 = true;
  audio.preload = "auto";
  audio.muted = false;
  audio.volume = 1;
  audio.hidden = false;

  // 2. Robust Loader
  let pendingSrc = null;
  let isLoading = false;

  const safeLoad = async (url, blob) => {
    // If already loading, queue this url as the next pending one
    if (isLoading) {
      console.log("[learner] Load in progress, queueing next...");
      pendingSrc = { url, blob };
      return;
    }

    isLoading = true;

    try {
      // Reset state
      audio.pause();
      audio.src = url;
      audio.load();

      // Wait for metadata to ensure engine is ready
      await new Promise((resolve, reject) => {
        const onMeta = () => { cleanup(); resolve(); };
        const onError = (e) => { cleanup(); reject(e); };
        const cleanup = () => {
          audio.removeEventListener('loadedmetadata', onMeta);
          audio.removeEventListener('error', onError);
        };
        audio.addEventListener('loadedmetadata', onMeta, { once: true });
        audio.addEventListener('error', onError, { once: true });
      });

      // Hydrate Self-Playback
      document.dispatchEvent(new CustomEvent("lux:new-learner-audio", { detail: { blob, url } }));

      // --- DECODE AUDIO AND PASS TO WAVEFORM LOGIC ---
      const arr = await blob.arrayBuffer();
      
      if (window.AudioContext && window.AudioContext.prototype.decodeAudioData && loadLearnerAudio) {
          try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              // Pass a copy (slice(0)) to prevent decodeAudioData from corrupting the original buffer
              const buffer = await audioContext.decodeAudioData(arr.slice(0)); 
              loadLearnerAudio(buffer);
          } catch (e) {
              console.warn("[learner] Failed to decode audio for waveform:", e);
          }
      }
      // --- END WAVEFORM LOGIC ---

      if (window.LuxSelfPB?.setLearnerArrayBuffer) {
        await window.LuxSelfPB.setLearnerArrayBuffer(arr);
      }

    } catch (err) {
      console.warn("[learner] Audio load interruption or error:", err);
    } finally {
      isLoading = false;
      // If a new request came in while we were loading, process it now
      if (pendingSrc) {
        const next = pendingSrc;
        pendingSrc = null;
        safeLoad(next.url, next.blob);
      }
    }
  };

  // 3. Expose Global Hook (compatibility with recording.js)
  window[FN] = function attachLearnerBlob(blob) {
    if (!(blob instanceof Blob)) return;

    // Cleanup old URL to prevent memory leaks
    if (audio.__blobUrl) URL.revokeObjectURL(audio.__blobUrl);

    const url = URL.createObjectURL(blob);
    audio.__blobUrl = url; // Store for cleanup next time

    safeLoad(url, blob);
  };
  
  console.log("[LUX] Audio Sink initialized");
}