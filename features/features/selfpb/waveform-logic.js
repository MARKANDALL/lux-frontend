// features/features/selfpb/waveform-logic.js
// LOGIC: Normalizes audio data to ensure visible "Mountains"
// Renders static waveforms and moves a CSS playhead.

let uiElements = {}; 
let rafHandle = null;

// --- 1. The "Mountain" Drawer ---
function drawWaveform(canvas, buffer, color) {
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;

    // Get Data
    const data = buffer.getChannelData(0); 
    const step = Math.ceil(data.length / w);
    const amp = h / 2;
    
    // --- NORMALIZE (The Fix) ---
    // Find absolute max peak to scale everything relative to it
    let maxPeak = 0;
    for (let i = 0; i < data.length; i += 10) { // Scan sample
        if (Math.abs(data[i]) > maxPeak) maxPeak = Math.abs(data[i]);
    }
    // If maxPeak is tiny (silence), don't scale up noise. 
    // If it's normal, scale it so maxPeak hits 1.0 height.
    const multiplier = maxPeak > 0.05 ? (1 / maxPeak) : 1; 

    // Draw
    for (let i = 0; i < w; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        // Scale values
        min *= multiplier;
        max *= multiplier;

        // Draw vertical bar for this pixel slice
        // Math.max(1, ...) ensures we always see at least 1px line
        const barH = Math.max(1, (max - min) * amp);
        const y = (1 - max) * amp;
        
        ctx.fillRect(i, y, 1, barH);
    }
}

// --- 2. The Playhead Loop ---
function syncLoop() {
    const audioEl = document.getElementById("playbackAudio");
    if (audioEl && uiElements.playhead && audioEl.duration) {
        const pct = (audioEl.currentTime / audioEl.duration) * 100;
        // Move the CSS line instead of redrawing canvas (Performance win)
        uiElements.playhead.style.left = `${pct}%`; 
    }
    rafHandle = requestAnimationFrame(syncLoop);
}

// --- Exports ---

export function initWaveformVisualizer(uiRefs) {
    uiElements = uiRefs;
    // Start the motion loop
    if (rafHandle) cancelAnimationFrame(rafHandle);
    rafHandle = requestAnimationFrame(syncLoop);
}

export function loadLearnerAudio(audioBuffer) {
    // Draw Top Wave (Blue)
    drawWaveform(uiElements.waveLearner, audioBuffer, '#2563eb'); 
}

export function loadReferenceAudio(audioBuffer) {
    // Draw Bottom Wave (Gray)
    drawWaveform(uiElements.waveRef, audioBuffer, '#475569');
}