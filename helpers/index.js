// helpers/index.js (optional barrel)
export {
  LUX_USER_ID,
  buildYouglishUrl,
  isCorrupt,
  encouragingLine,
  mdToHtml,
} from "./core.js";
export { speechDetected } from "./assess.js";
export {
  bringInputToTop,
  bringBoxBottomToViewport,
  initUnderlineObserver,
  showClickHint,
  keepTooltipInView,
} from "./dom.js";

/*
export {
  setupYGHover,
  setupPhHeaderHover,
  initPhonemeAudio,
  initPhonemeClickPlay,
} from "./media.js";
*/