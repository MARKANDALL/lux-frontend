// ui/interactions/utils.js
export function safePlay(node, src, opts) {
  const f = window.safePlayVideo;
  if (typeof f === "function") return f(node, src, opts || {});
  try {
    if (src && node.src !== src) node.src = src;
    if (opts && "muted" in opts) node.muted = !!opts.muted;
    if (opts && opts.restart) {
      try {
        node.currentTime = 0;
      } catch (_) {}
    }
    return node.play?.().catch?.(() => {});
  } catch (_) {}
}

export function playWithGesture(
  vid,
  { restart = true, wantSound = true } = {}
) {
  if (!vid) return;
  try {
    vid.loop = false;
  } catch (_) {}
  if (restart) {
    try {
      vid.currentTime = 0;
    } catch (_) {}
  }
  vid.muted = !wantSound;
  return vid.play().catch(() => {
    vid.muted = true;
    return vid
      .play()
      .then(() => {
        if (wantSound)
          setTimeout(() => {
            try {
              vid.muted = false;
            } catch (_) {}
          }, 50);
      })
      .catch(() => {
        try {
          vid.pause();
        } catch (_) {}
      });
  });
}

export function prepareVideo(v) {
  if (!v) return;
  v.setAttribute("preload", "metadata");
  v.setAttribute("playsinline", "");
  v.playsInline = true;
  v.controls = false;
  v.loop = false;
  v.muted = true;
}
