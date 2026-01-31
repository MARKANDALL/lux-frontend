// features/life/deck.js
export const LIFE_EVENTS = [
  {
    id: "job_offer",
    title: "A new job offer",
    blurb: "A recruiter calls with an offer — but the details are complicated.",
    npcRole: "Recruiter",
    setting: "Phone call",
    goal: "Ask clear questions about salary, schedule, and benefits.",
    wordBank: ["offer", "salary", "schedule", "benefits", "commute"],
    choices: [
      { id: "accept", label: "Sound excited and accept (with 1 question)" },
      { id: "negotiate", label: "Negotiate politely (2 questions)" },
      { id: "decline", label: "Decline professionally" },
    ],
  },

  {
    id: "apartment_issue",
    title: "Apartment problem",
    blurb: "Something is broken at home and you need a repair timeline.",
    npcRole: "Landlord",
    setting: "Text / phone",
    goal: "Explain the issue, ask when it will be fixed, stay polite.",
    wordBank: ["repair", "leak", "schedule", "appointment", "urgent"],
    choices: [
      { id: "polite", label: "Polite request (firm but calm)" },
      { id: "urgent", label: "Make it urgent (but respectful)" },
      { id: "followup", label: "Follow up on a previous request" },
    ],
  },

  {
    id: "doctor_followup",
    title: "Follow-up appointment",
    blurb: "You need to describe symptoms and confirm instructions clearly.",
    npcRole: "Nurse",
    setting: "Clinic desk",
    goal: "Explain symptoms, confirm dosage, ask one follow-up question.",
    wordBank: ["symptoms", "prescription", "dosage", "side effects", "follow-up"],
    choices: [
      { id: "describe", label: "Describe symptoms clearly" },
      { id: "confirm", label: "Confirm instructions + dosage" },
      { id: "question", label: "Ask about side effects" },
    ],
  },

  {
    id: "promotion",
    title: "Promotion conversation",
    blurb: "Your manager hints at a promotion — but wants to discuss expectations.",
    npcRole: "Manager",
    setting: "Office",
    goal: "Clarify responsibilities, timeline, and what success looks like.",
    wordBank: ["promotion", "responsibilities", "timeline", "expectations", "performance"],
    choices: [
      { id: "yes", label: "Say yes confidently" },
      { id: "clarify", label: "Ask for clarity before accepting" },
      { id: "later", label: "Request time to think" },
    ],
  },

  {
    id: "school_meeting",
    title: "School meeting",
    blurb: "You meet an advisor to plan classes and goals.",
    npcRole: "Advisor",
    setting: "Campus office",
    goal: "Explain your goal, ask about requirements, confirm next steps.",
    wordBank: ["requirements", "credits", "schedule", "goal", "next steps"],
    choices: [
      { id: "goal", label: "Explain your goal first" },
      { id: "requirements", label: "Ask about requirements" },
      { id: "schedule", label: "Ask about schedule options" },
    ],
  },
];
