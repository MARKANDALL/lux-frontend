// features/features/selfpb/ui-sync.js

export function makeUISync({ ui, api, audio, refAudio, st }) {
  // --- Logic helpers ---
  const showToast = (msg, duration = 2000) => {
    ui.toast.textContent = msg;
    ui.toast.style.display = "inline-block";
    ui.host.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 200 }
    );
    setTimeout(() => {
      ui.toast.style.display = "none";
    }, duration);
  };

  const showLoopHint = () => {
    if (localStorage.getItem("spb-hint-seen") !== "true") {
      ui.loopTip.classList.add("visible");
      setTimeout(() => {
        ui.loopTip.classList.remove("visible");
        localStorage.setItem("spb-hint-seen", "true");
      }, 4000);
    }
  };

  const syncButtons = () => {
    ui.mainBtn.textContent = st.playing ? "⏸ Pause" : "▶ Play";

    if (st.a == null) {
      ui.loopAction.textContent = "⟳ Set Loop A";
      ui.loopAction.classList.remove("active");
      ui.abLabel.textContent = "Loop: Off";
    } else if (st.b == null) {
      ui.loopAction.textContent = "⟳ Set Loop B";
      ui.loopAction.classList.add("active");
      ui.abLabel.textContent = `A: ${api.fmt(st.a)} …`;
    } else {
      ui.loopAction.textContent = "× Clear Loop";
      ui.loopAction.classList.remove("active");
      ui.abLabel.textContent = `A: ${api.fmt(st.a)}  B: ${api.fmt(st.b)}`;
    }
  };

  const syncTime = () => {
    ui.timeLab.textContent = `${api.fmt(audio.currentTime || 0)} / ${api.fmt(
      audio.duration || 0
    )}`;
  };

  const syncScrub = () => {
    if (!st.scrubbing) {
      const dur = audio.duration || 0;
      const p = dur ? Math.floor((audio.currentTime / dur) * 1000) : 0;
      ui.scrub.value = String(api.clamp(p, 0, 1000));
    }
  };

  const syncRateUI = () => {
    ui.rateVal.textContent = `${Number(audio.playbackRate).toFixed(2)}×`;
    ui.rate.value = String(audio.playbackRate || 1);
  };

  const syncRefUI = () => {
    const ready = !!refAudio.src;
    const r = refAudio.playbackRate || 1;
    const d = isFinite(refAudio.duration) ? api.fmt(refAudio.duration) : "—:—";
    const meta = api.getRefMeta();
    const v = meta && (meta.voice || meta.style) ? ` ${meta.voice || ""}` : "";
    ui.refLabel.textContent = ready ? `Ref: ${r.toFixed(2)}× · ${d}${v}` : "Ref: —";
  };

  return { showToast, showLoopHint, syncButtons, syncTime, syncScrub, syncRateUI, syncRefUI };
}
