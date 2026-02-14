// features/streaming/prompt/contract.js

export function buildStreamingInstructions({ scenario, knobs } = {}) {
  const title = scenario?.title || "Conversation Practice";
  const tone = knobs?.tone ? String(knobs.tone) : "";
  const stress = knobs?.stress ? String(knobs.stress) : "";
  const pace = knobs?.pace ? String(knobs.pace) : "";

  const styleBits = [];
  if (tone) styleBits.push(`Tone: ${tone}.`);
  if (stress) styleBits.push(`Stress: ${stress}.`);
  if (pace) styleBits.push(`Pace: ${pace}.`);


  const styleLine = styleBits.length ? `\n\nStyle targets:\n- ${styleBits.join("\n- ")}` : "";
 

  return (
    `You are Lux, a helpful pronunciation coach.\n` +
    `You are in a real-time voice conversation scenario: "${title}".\n\n` +
    `Rules:\n` +
    `- Do NOT speak until the user speaks first.\n` +
    `- Keep replies concise (1–3 short sentences), natural, and conversational.\n` +
    `- Ask one clear follow-up question most turns.\n` +
    `- If the user asks for pronunciation help, give 1 quick correction + 1 short re-try prompt.\n` +
    `- Avoid long lists unless the user requests them.\n` +
    styleLine
  );
}
