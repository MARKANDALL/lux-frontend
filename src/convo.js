// src/convo.js
import { ensureUID } from "../api/identity.js";

import { bootConvo } from "../features/convo/index.js";
import { initAudioSink } from "../app-core/audio-sink.js";
import { bootTTS } from "../features/features/tts/boot-tts.js";
import { initConvoProgress } from "../features/convo/progress.js";
import { initAuthUI } from "../ui/auth-dom.js";

// 0. Initialize UID (single source of truth)
ensureUID();

// 1. Initialize the global audio handler
initAudioSink();

// 2. Load the sliding "peekaboo" logic
// This script looks for the #playbackAudio element we added to HTML
import "../features/features/08-selfpb-peekaboo.js";

// 3. Boot TTS
// This looks for #tts-controls and attaches the highlight-to-speak logic
bootTTS();

// 4. Boot Save Progress / Login button (top-right)
initAuthUI();

// 5. Start the AI Conversation app
bootConvo();
initConvoProgress();
