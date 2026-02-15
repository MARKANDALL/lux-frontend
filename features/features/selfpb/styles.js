// features/features/selfpb/styles.js
// Injected CSS for Self Playback mini drawer + Expanded float layout rules (waveform sizing, placeholders, etc.).

import { MINI_CSS } from "./styles/mini.js";
import { KARAOKE_CSS } from "./styles/karaoke.js";
import { FLOAT_CSS } from "./styles/float.js";
import { EXPANDED_CSS } from "./styles/expanded.js";
import { WIDGETS_CSS } from "./styles/widgets.js";

export function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement("style");
  s.id = STYLE_ID;

  s.textContent =
    MINI_CSS +
    WIDGETS_CSS +
    EXPANDED_CSS +
    FLOAT_CSS +
    KARAOKE_CSS;

  document.head.appendChild(s);
}
