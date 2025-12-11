// features/balloon/index.js
import { updateVisuals, popAnimation } from "./ui.js";

export function updateBalloon(count, max) {
  updateVisuals(count, max);
}

export function popBalloon() {
  popAnimation();
}