// features/features/selfpb/controls.js

export function initControls({
  ui,
  api,
  audio,
  st,
  showToast,
  showLoopHint,
  syncButtons,
  syncTime,
  syncScrub,
  syncRateUI,
  isExpandedOpen,
  karaoke,
}) {
  const handlePlayAction = async (isRestart = false) => {
    if (!audio.currentSrc && !audio.src) {
      showToast("No recording yet!");
      return;
    }
    if (audio.duration === 0 || isNaN(audio.duration)) {
      showToast("Audio empty/loading...");
      return;
    }

    try {
      if (isRestart) {
        audio.currentTime = st.looping && st.a != null ? st.a : 0;
        if (!st.playing) await api.play();
      } else {
        if (st.playing) {
          api.pause();
        } else {
          if (st.looping && st.a != null && st.b != null && st.b > st.a) {
            if (audio.currentTime < st.a || audio.currentTime > st.b)
              audio.currentTime = st.a;
          }
          await api.play();
        }
      }
    } catch (err) {
      console.warn("[selfpb] Play failed", err);
      showToast("Playback failed");
    } finally {
      syncButtons();
    }
  };

  const handleLoopClick = () => {
    if (!audio.duration) {
      showToast("No audio to loop!");
      return;
    }

    if (st.a == null) {
      st.a = audio.currentTime || 0;
      st.looping = false;
      showLoopHint();
    } else if (st.b == null) {
      st.b = audio.currentTime || 0;
      if (st.b < st.a) {
        const t = st.a;
        st.a = st.b;
        st.b = t;
      }
      st.looping = true;
      audio.currentTime = st.a;
      if (!st.playing) api.play();
    } else {
      api.clearAB();
    }

    syncButtons();
  };

  ui.mainBtn.addEventListener("click", (e) => {
    if (e.detail !== 2) handlePlayAction(false);
  });

  ui.mainBtn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    handlePlayAction(true);
  });

  // 2.0 seconds skip
  ui.backBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) - 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  ui.fwdBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) + 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  // ✅ If user grabs scrubber while playing -> PAUSE (pro behavior)
  ui.scrub.addEventListener("pointerdown", () => {
    if (!audio.paused) {
      audio.pause();
    }
  });

  ui.scrub.addEventListener("input", () => {
    api._setScrubbingOn();
    const p = Number(ui.scrub.value) / 1000;
    audio.currentTime = api.clamp(p * (audio.duration || 0), 0, audio.duration || 0);
    syncTime();

    karaoke.update(audio.currentTime || 0);
  });

  ui.scrub.addEventListener("change", () => api._setScrubbingOff());

  ui.rate.addEventListener("input", () => {
    const v = api.clamp(Number(ui.rate.value) || 1, 0.5, 1.5);
    api.setRate(v);
    syncRateUI();
  });

  ui.loopAction.addEventListener("click", handleLoopClick);

  audio.addEventListener("timeupdate", () => {
    syncTime();
    syncScrub();
    karaoke.update(audio.currentTime || 0);
  });
  audio.addEventListener("play", () => {
    st.playing = true;
    syncButtons();
  });
  audio.addEventListener("pause", () => {
    st.playing = false;
    syncButtons();
  });
  audio.addEventListener("loadedmetadata", () => {
    syncTime();
    syncScrub();
  });
  audio.addEventListener("ratechange", syncRateUI);
  audio.addEventListener("ended", () => {
    st.playing = false;
    syncButtons();
  });
}
