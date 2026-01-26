// features/features/selfpb/media-events.js

export function initMediaEvents({ audio, refAudio, syncTime, syncScrub, syncButtons, syncRefUI }) {
  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  function initialSync() {
    syncTime();
    syncScrub();
    syncButtons();
    syncRefUI();
  }

  return { initialSync };
}
