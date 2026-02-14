// lux-popover.js
(() => {
  const KEY = "LUX_USER_ID";
  const uid = window.LUX_USER_ID || localStorage.getItem(KEY) || "";

  // Show UID
  const $uid = document.getElementById("lux-uid");
  if ($uid) $uid.textContent = uid || "not found";

  // Copy button
  const $copy = document.getElementById("lux-copy");
  const $copied = document.getElementById("lux-copied");
  if ($copy) {
    $copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(uid);
        if ($copied) {
          $copied.textContent = "Copied!";
          setTimeout(() => ($copied.textContent = ""), 1400);
        }
      } catch {
        if ($copied) $copied.textContent = "Copy failed";
      }
    });
  }

  // Build absolute admin links (last 14 days)
  const base = "https://luxury-language-api.vercel.app/admin";
  const passages = "grandfather,rainbow,sentences,wordList";
  const fmt = (d) => d.toISOString().slice(0, 10);
  const to = fmt(new Date());
  const from = fmt(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));

  const links = {
    "lux-link-progress": `${base}/?uid=${encodeURIComponent(
      uid
    )}&from=${from}&to=${to}&smooth=7&passages=${encodeURIComponent(
      passages
    )}&limit=500`,
    "lux-link-attempts": `${base}/user.html?uid=${encodeURIComponent(
      uid
    )}&from=${from}&to=${to}&passages=${encodeURIComponent(
      passages
    )}&limit=500`,
    "lux-link-cohort": `${base}/overview.html?from=${from}&to=${to}&sort=last&limit=10000&passages=${encodeURIComponent(
      passages
    )}&quick=14`,
  };

  Object.entries(links).forEach(([id, href]) => {
    const a = document.getElementById(id);
    if (!a) return;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Keep aria state tidy (also helps hover/focus behaviour)
  const cta = document.querySelector(".lux-cta");
  if (cta) {
    const set = (v) => cta.setAttribute("aria-expanded", v);
    cta.addEventListener("mouseenter", () => set("true"));
    cta.addEventListener("mouseleave", () => set("false"));
    cta.addEventListener("focusin", () => set("true"));
    cta.addEventListener("focusout", () => set("false"));
  }
})();
/* --- Pill hover preview (muted) + click toggle (sound/pause) --- */
(function () {
  const PILL_SELECTOR = ".pill, .word-pill, .phoneme-pill"; // adjust to your classes
  const CONTAINER = document.body; // event delegation root

  function ensureHoverPlayer() {
    let v = document.getElementById("hoverPlayer");
    if (v) return v;
    v = document.createElement("video");
    v.id = "hoverPlayer";
    v.playsInline = true;
    v.preload = "auto";
    v.muted = true; // previews must start muted
    document.body.appendChild(v); // CSS handles its look/position
    return v;
  }

  function sameSrc(el, src) {
    try {
      return (
        el.currentSrc === new URL(src, location.href).href || el.src === src
      );
    } catch {
      return el.src === src;
    }
  }

  function getPill(e) {
    return e.target && e.target.closest
      ? e.target.closest(PILL_SELECTOR)
      : null;
  }

  function getVideoSrcForPill(pill) {
    // Self Playback UI uses .pill for its own labels (Ref/Time/etc).
    // Do NOT treat those as hover-preview targets.
    if (pill?.closest?.("#selfpb-lite")) return null;
    // Primary: explicit data attribute
    if (pill?.dataset?.video) return pill.dataset.video;

    // Fallback: derive from text/IPA (optional; change to your path/pattern)
    const kind = pill?.classList?.contains("phoneme") ? "phoneme" : "word";
    const key = (pill.dataset.key || pill.dataset.ipa || pill.textContent || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    if (!key) return null;
    return `/clips/${kind}-${key}.mp4`; // <-- adjust base path if needed
  }

  document.addEventListener("DOMContentLoaded", () => {
    const player = ensureHoverPlayer();
    let currentPill = null;

    function showFor(pill) {
      const src = getVideoSrcForPill(pill);
      if (!src) return;
      if (!sameSrc(player, src)) {
        player.src = src;
        player.currentTime = 0;
      }
      player.muted = true; // hover preview is ALWAYS muted
      player.play().catch(() => {});
      player.style.opacity = 1;
    }

    function hide() {
      player.pause();
      player.currentTime = 0;
      player.style.opacity = 0;
      // remain muted until a click explicitly unmutes
    }

    // Hover preview: only pills count (not headers/wrappers)
    CONTAINER.addEventListener("mouseover", (e) => {
      const pill = getPill(e);
      if (!pill || pill === currentPill) return;
      currentPill = pill;
      showFor(pill);
    });

    CONTAINER.addEventListener("mouseout", (e) => {
      const from = getPill(e);
      if (!from || from !== currentPill) return;
      const to =
        e.relatedTarget &&
        e.relatedTarget.closest &&
        e.relatedTarget.closest(PILL_SELECTOR);
      if (to === currentPill) return; // still inside same pill
      currentPill = null;
      hide();
    });

    // Click: toggle sound/pause for that pill
    CONTAINER.addEventListener("click", async (e) => {
      const pill = getPill(e);
      if (!pill) return;
      const src = getVideoSrcForPill(pill);
      if (!src) return;

      if (!sameSrc(player, src)) {
        // Clicking a different pill: switch, unmute, and play
        player.src = src;
        player.currentTime = 0;
        player.muted = false;
        try {
          await player.play();
          player.style.opacity = 1;
        } catch {}
        return;
      }

      // Same pill:
      if (player.paused) {
        player.muted = false;
        try {
          await player.play();
          player.style.opacity = 1;
        } catch {}
      } else if (player.muted) {
        player.muted = false;
        try {
          await player.play();
        } catch {}
      } else {
        player.pause(); // second click pauses
      }
    });

    // A11y parity for keyboard users
    CONTAINER.addEventListener("focusin", (e) => {
      const pill = getPill(e);
      if (!pill) return;
      currentPill = pill;
      showFor(pill);
    });
    CONTAINER.addEventListener("focusout", (e) => {
      const pill = getPill(e);
      if (!pill) return;
      if (
        document.activeElement &&
        document.activeElement.closest(PILL_SELECTOR) === pill
      )
        return;
      currentPill = null;
      hide();
    });
    CONTAINER.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const pill = getPill(e);
      if (!pill) return;
      e.preventDefault();
      pill.click(); // reuse click logic
    });
  });
})();
