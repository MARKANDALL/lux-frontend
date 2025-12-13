// features/features/selfpb/waveform-logic.js
// WRAPPER: Uses WaveSurfer.js to guarantee "Mountain" waveforms.

let wsLearner = null;
let wsRef = null;
let mainAudioEl = null;

export function initWaveSurfer({ learnerContainer, refContainer, masterAudio }) {
    if (!window.WaveSurfer) {
        console.warn("[Waveform] WaveSurfer.js not loaded. Check index.html.");
        return;
    }

    mainAudioEl = masterAudio;

    // 1. Learner Instance (Blue)
    wsLearner = WaveSurfer.create({
        container: learnerContainer,
        waveColor: '#2d6cdf',
        progressColor: '#ef4444',
        cursorColor: '#ef4444', // Red cursor
        cursorWidth: 2,
        height: 50,
        barWidth: 3,
        barGap: 1,
        barRadius: 3,
        normalize: true, 
        interact: false, 
        fillParent: true
    });

    // 2. Reference Instance (Gray) -> NOW WITH CURSOR
    wsRef = WaveSurfer.create({
        container: refContainer,
        waveColor: '#9ca3af',
        progressColor: '#4b5563',
        cursorColor: '#ef4444', // ADDED: Red cursor (matches learner)
        cursorWidth: 2,         // ADDED: Visible width
        height: 50,
        barWidth: 3,
        barGap: 1,
        barRadius: 3,
        normalize: true,
        interact: false,
        fillParent: true
    });

    // 3. Sync Visualizer to Audio Element
    if (mainAudioEl) {
        mainAudioEl.addEventListener('timeupdate', () => {
            const dur = mainAudioEl.duration;
            if (dur > 0) {
                const progress = mainAudioEl.currentTime / dur;
                if (wsLearner) wsLearner.seekTo(progress);
                if (wsRef) wsRef.seekTo(progress);
            }
        });
    }
    
    console.log("[Waveform] WaveSurfer initialized.");
}

// Pass the raw Blob directly to WaveSurfer
export function loadLearnerBlob(blob) {
    if (wsLearner && blob) {
        console.log("[Waveform] Loading Learner Blob...");
        wsLearner.loadBlob(blob);
    }
}

// Pass the raw Blob directly to WaveSurfer
export function loadReferenceBlob(blob) {
     if (wsRef && blob) {
        console.log("[Waveform] Loading Reference Blob...");
        wsRef.loadBlob(blob);
    }
}