// features/onboarding/onboarding-steps.js

export const SEEN_KEY = "LUX_ONBOARD_V1_SEEN";

export const STEPS = [
  {
    key: "welcome",
    stepLabel: "Welcome",
    title: "Welcome to Lux",
    bodyHtml: `
      <div>Master your pronunciation with 60-second sprints. Your progress saves automatically.</div>
    `,
    primary: { label: "Start setup" },
    secondary: { label: "Skip tour", kind: "link" },
  },
  {
    key: "mic",
    stepLabel: "Mic",
    title: "Enable your mic",
    bodyHtml: `
      <div>Tap below, then select <b>Allow</b> when your browser asks.</div>
      <div class="lux-onb-tip">
        <span class="lux-onb-tip-dot">i</span>
        <span><b>Tip:</b> quiet room + <b>good mic</b> = best scores</span>
      </div>
      <div class="lux-onb-meter" aria-label="Mic level meter"><span></span></div>
      <div id="luxOnbMicMsg" style="margin-top:10px; font-size:14px; color: rgba(31,41,55,0.62);"></div>
    `,
    primary: { label: "Allow microphone access", action: "requestMic" },
    secondary: { label: "Skip tour", kind: "link" },
  },
  {
    key: "try",
    stepLabel: "Try",
    title: "Your first recording",
    bodyHtml: `
      <div>Pick a short phrase and hit <b>Record</b>. We'll analyze your speech and show results.</div>
    `,
    primary: { label: "● Try a sample phrase", action: "samplePhrase" },
    secondary: { label: "Browse all lessons", action: "browseLessons", kind: "link" },
  },
  {
    key: "finish",
    stepLabel: "Finish",
    title: "See your growth",
    bodyHtml: `
      <div>After each session, you'll get:</div>
      <ul class="lux-onb-bullets">
        <li><b>Scores</b>: Accuracy, Fluency, and Prosody</li>
        <li><b>Visuals</b>: mouth-shape videos for your trouble sounds</li>
      </ul>
    `,
    primary: { label: "Start practicing", action: "startPracticing" },
  },
];