// helpers/index.js (optional barrel)
export {
  LUX_USER_ID,
  scoreClass,
  buildYouglishUrl,
  isCorrupt,
  encouragingLine,
  mdToHtml,
} from "./core.js";
export { speechDetected } from "./assess.js";
export {
  bringInputToTop,
  initUnderlineObserver,
  showClickHint,
  initScoreErrorCollapse,
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