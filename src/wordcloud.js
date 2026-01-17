// src/wordcloud.js
import { ensureUID } from "../api/identity.js";
import { initWordCloudPage } from "../features/progress/wordcloud/index.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

ensureUID();
initWordCloudPage();
bootRippleButtons();
