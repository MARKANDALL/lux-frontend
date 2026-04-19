// helpers/index.js (optional barrel)
export {
  LUX_USER_ID,
  buildYouglishUrl,
  isCorrupt,
  encouragingLine,
  clamp,
  shuffleInPlace,
} from "./core.js";
export { mdToHtmlFull as mdToHtml } from "./md-to-html.js";
export { speechDetected } from "./assess.js";
export {
  bringInputToTop,
  bringBoxBottomToViewport,
  initUnderlineObserver,
  showClickHint,
} from "./dom.js";

/*
export {
  setupYGHover,
  setupPhHeaderHover,
  initPhonemeAudio,
  initPhonemeClickPlay,
} from "./media.js";
*/