// features/convo/scenarios.js
// Source of truth for all 25 AI conversation scenarios.
// Structure: title → desc → 3 bullet-point `more` → emotion-neutral roles.
// Last overhauled: 2026-03-04 (alignment audit + constitution compliance).

export const SCENARIOS = [
  {
    id: "quick-practice",
    title: "Quick Practice",
    desc: "A relaxed, open-ended conversation focused on natural speaking practice. There is no rigid setting, so the topic can drift wherever it feels most natural.",
    more: `• Flexible setting — no fixed location, task, or storyline forcing the dialogue in the wrong direction

• Best for targeted pronunciation practice when Lux wants to weave in specific sounds and words naturally

• Targets: spontaneous speaking · easy topic shifts · natural repetition without awkward scene constraints`,
    roles: [
      {
        id: "learner",
        label: "Learner",
        npc: "Someone doing a short, targeted speaking practice conversation. They are trying to speak naturally and clearly.",
      },
      {
        id: "partner",
        label: "Conversation Partner",
        npc: "A calm, friendly conversation partner who keeps the exchange open-ended, natural, and easy to follow.",
      },
    ],
  },
  {
    id: "coffee",
    title: "Order Coffee",
    desc: "Order quickly, make small talk, and stay friendly under mild time pressure.",
    img: "/convo-img/coffee.webp",
    thumb: "/convo-img/thumbs/coffee.webp",
    video: "/convo-vid/coffee.mp4",
    more: `• Busy morning café with a growing line — the barista needs your order clear the first time\n\n• Hurdles: noisy environment · mishearing size or milk options · rushed pace\n\n• Targets: polite correction · quick decisions · casual small talk · drink customization vocabulary`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "A regular in their 30s who comes in every morning. Decisive and knows what they want.",
      },
      {
        id: "barista",
        label: "Barista",
        npc: "A café worker in her 20s on a busy morning shift. Speaks quickly, repeats orders back, and keeps the line moving.",
      },
    ],
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    desc: "Describe how your body feels in words a doctor can act on.",
    img: "/convo-img/doctor.webp",
    thumb: "/convo-img/thumbs/doctor.webp",
    video: "/convo-vid/doctor.mp4",
    more: `• Clinic exam room — the doctor needs specific details (location, intensity, duration), not just "it hurts"\n\n• Hurdles: vague symptom descriptions · unfamiliar medical terms · nervousness about asking questions\n\n• Targets: precise body description · asking for clarification · understanding medical instructions`,
    roles: [
      {
        id: "patient",
        label: "Patient",
        npc: "Someone in their 30s visiting for a new symptom. Tends to give vague answers and needs guided questions to get specific.",
        ttsVoice: "en-US-ChristopherNeural",
      },
      {
        id: "doctor",
        label: "Doctor",
        npc: "A thorough physician in her 40s. Asks targeted follow-ups and uses some medical terms but explains them when asked.",
        ttsVoice: "en-US-NancyNeural",
      },
    ],
  },
  {
    id: "job",
    title: "Job Interview",
    desc: "Sell your story, handle tough questions, and project confidence while being evaluated.",
    img: "/convo-img/job.webp",
    thumb: "/convo-img/thumbs/job.webp",
    video: "/convo-vid/job.mp4",
    more: `• Formal interview at a company office — the interviewer probes for genuine answers and spots rambling\n\n• Hurdles: underselling experience · wandering answers · awkward pauses after tough questions\n\n• Targets: concise self-presentation · thinking on your feet · professional register`,
    roles: [
      {
        id: "candidate",
        label: "Candidate",
        npc: "A qualified professional in their late 20s with solid experience. Tends to give long, wandering answers when nervous.",
      },
      {
        id: "interviewer",
        label: "Interviewer",
        npc: "A hiring manager in his 50s with hundreds of interviews behind him. Polite but direct — asks follow-ups that test depth.",
      },
    ],
  },
  {
    id: "airport",
    title: "Airport Problem",
    desc: "Solve a sudden travel problem — rebook, redirect, and stay clear-headed under stress.",
    img: "/convo-img/airport.webp",
    thumb: "/convo-img/thumbs/airport.webp",
    video: "/convo-vid/airport.mp4",
    more: `• Your flight has been cancelled and the rebooking line is long — you need to give precise info fast\n\n• Hurdles: missing details under stress · unclear airline jargon · documents not ready\n\n• Targets: staying calm under pressure · giving factual details quickly · assertive requesting`,
    roles: [
      {
        id: "traveler",
        label: "Traveler",
        npc: "A passenger whose connecting flight was cancelled. Tends to lose track of details under pressure and doesn't always have documents ready.",
      },
      {
        id: "agent",
        label: "Gate Agent",
        npc: "An airline agent in her 30s. Professional and efficient — speaks in short, direct sentences and needs organized information fast.",
      },
    ],
  },
  {
    id: "restaurant",
    title: "Restaurant Order",
    desc: "Modify an order, flag a mistake politely, and navigate the meal with ease.",
    img: "/convo-img/restaurant.webp",
    thumb: "/convo-img/thumbs/restaurant.webp",
    video: "/convo-vid/restaurant.mp4",
    more: `• Mid-range restaurant on a busy evening — you have dietary needs and the kitchen is backed up\n\n• Hurdles: allergy communication · politely flagging wrong orders · understanding specials described aloud\n\n• Targets: soft requesting · polite complaint · menu vocabulary · dietary restriction language`,
    roles: [
      {
        id: "diner",
        label: "Diner",
        npc: "A customer dining with a friend. Has dietary restrictions and will need to modify at least one dish.",
      },
      {
        id: "waiter",
        label: "Waiter",
        npc: "An attentive server in his late 20s. Suggests dishes and handles special requests, but the kitchen is backed up tonight.",
      },
    ],
  },
  {
    id: "school",
    title: "School Meeting",
    desc: "Sit across from a teacher and discuss your child's progress diplomatically.",
    img: "/convo-img/school.webp",
    thumb: "/convo-img/thumbs/school.webp",
    video: "/convo-vid/parents.mp4",
    more: `• Parent-teacher conference after school — the teacher has concerns to raise alongside the positives\n\n• Hurdles: defensiveness about feedback · vague progress reports · agreeing on concrete next steps\n\n• Targets: diplomatic disagreement · asking specific questions · collaborative problem-solving`,
    roles: [
      {
        id: "parent",
        label: "Parent",
        npc: "A parent in their 30s who wants the best for their child. Has strong opinions and needs honest, specific feedback.",
      },
      {
        id: "teacher",
        label: "Teacher",
        npc: "An experienced teacher in her 30s. Organized, with prepared observations — and some concerns to raise alongside the positives.",
      },
    ],
  },
  {
    id: "banking",
    title: "Open a Bank Account",
    desc: "Follow dense details about accounts, fees, and paperwork without getting lost.",
    img: "/convo-img/banking.webp",
    thumb: "/convo-img/thumbs/banking.webp",
    video: "/convo-vid/banking.mp4",
    more: `• Bank branch office — the representative moves through options and paperwork using financial terms\n\n• Hurdles: unfamiliar financial terms · information overload · hesitation to ask "dumb" questions\n\n• Targets: requesting repetition · processing dense information · confirming understanding`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "Someone in their 20s who just moved to the area. Has basic questions about accounts but is hesitant to ask too many.",
      },
      {
        id: "teller",
        label: "Bank Rep",
        npc: "A bank representative in his 40s. Thorough and clear, but uses financial terms and moves through the process at a steady pace.",
      },
    ],
  },
  {
    id: "calling",
    title: "Make a Phone Call",
    desc: "Handle a real phone call with no body language — just your voice, your words, and a clear goal.",
    img: "/convo-img/calling.webp",
    thumb: "/convo-img/thumbs/calling.webp",
    video: "/convo-vid/calling.mp4",
    more: `• Phone call to a medical office — no visual cues, everything depends on voice alone\n\n• Hurdles: bad audio quality · spelling names over the phone · losing track of details mid-call\n\n• Targets: phone openings and closings · spelling and number dictation · requesting repetition`,
    roles: [
      {
        id: "caller",
        label: "Caller",
        npc: "Someone in their 30s calling to schedule an appointment. Not comfortable on the phone — tends to forget details and sometimes needs things repeated.",
      },
      {
        id: "receiver",
        label: "Receptionist",
        npc: "A medical office receptionist in her 40s. Polite but busy — needs name, date of birth, and reason for calling at a brisk pace.",
      },
    ],
  },
  {
    id: "car",
    title: "Conversation in the Car",
    desc: "Keep a relaxed conversation alive in a small space with nowhere to go.",
    img: "/convo-img/car.jpg",
    thumb: "/convo-img/thumbs/car.webp",
    video: "/convo-vid/car.mp4",
    more: `• Two friends in a car for a while — no agenda, just talk, opinions, and comfortable silence\n\n• Hurdles: running out of things to say · filling silence awkwardly · one-word answers\n\n• Targets: opinion sharing · turn-taking · comfortable pacing · keeping conversation alive without forcing it`,
    roles: [
      {
        id: "passenger",
        label: "Passenger",
        npc: "A friend in their 30s who's a bit quieter today. Will chat if topics come up but is also comfortable with silence.",
      },
      {
        id: "driver",
        label: "Driver",
        npc: "A relaxed, talkative friend in their 30s. Likes to ask opinions about music, weekend plans, and random hypothetical questions.",
      },
    ],
  },
  {
    id: "choosing",
    title: "Choose at the Grocery Store",
    desc: "Compare options out loud, ask for help, and decide on the spot.",
    img: "/convo-img/choosing.webp",
    thumb: "/convo-img/thumbs/choosing.webp",
    video: "/convo-vid/choosing.mp4",
    more: `• Grocery store aisle — you can't find what you need and a store worker is nearby stocking shelves\n\n• Hurdles: not knowing product names · understanding brief answers · deciding under mild pressure\n\n• Targets: quick questions · understanding directions · everyday vocabulary · on-the-spot decisions`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in their 30s cooking something specific tonight. Can't find the right ingredients and needs help with brands and alternatives.",
      },
      {
        id: "worker",
        label: "Store Worker",
        npc: "A store employee in his 20s stocking shelves. Helpful but brief — knows the store well and gives quick directions.",
      },
    ],
  },
  {
    id: "concern",
    title: "Raise a Concern",
    desc: "Bring up a real problem firmly and calmly without damaging the relationship.",
    img: "/convo-img/concern.webp",
    thumb: "/convo-img/thumbs/concern.webp",
    video: "/convo-vid/concern.mp4",
    more: `• Meeting between a tenant and building manager about an ongoing issue — leak, noise, or broken appliance\n\n• Hurdles: vague complaints · emotional escalation · no clear ask · not knowing what's reasonable\n\n• Targets: factual description · firm but polite tone · proposing solutions · confirming next steps and timeline`,
    roles: [
      {
        id: "complainant",
        label: "Tenant",
        npc: "A tenant in their 30s with a real maintenance problem. Needs acknowledgment and a clear timeline for resolution.",
      },
      {
        id: "manager",
        label: "Manager",
        npc: "A building manager in his 50s who handles multiple properties. Won't act on vague complaints — needs the specific problem, location, and duration.",
      },
    ],
  },
  {
    id: "couple",
    title: "Chat with Strangers at a Party",
    desc: "Join a conversation already happening between people you've just met.",
    img: "/convo-img/couple.jpg",
    thumb: "/convo-img/thumbs/couple.webp",
    video: "/convo-vid/couple.mp4",
    more: `• House party — you approach a pair of people you don't know and need to break into their conversation\n\n• Hurdles: breaking into an existing conversation · keeping talk balanced · leaving gracefully\n\n• Targets: introductions · small talk · finding common ground · social exit phrases`,
    roles: [
      {
        id: "newcomer",
        label: "Newcomer",
        npc: "Someone in their late 20s who arrived at the party alone. On the quieter side, but friendly once a conversation gets going.",
      },
      {
        id: "host",
        label: "Party Regulars",
        npc: "A friendly pair in their 30s who have been at the party a while. Happy to meet someone new and share stories about the host.",
      },
    ],
  },
  {
    id: "dinner",
    title: "Catch Up over Dinner",
    desc: "Tell stories, react to friends, and keep a long social conversation flowing naturally.",
    img: "/convo-img/dinner.webp",
    thumb: "/convo-img/thumbs/dinner.webp",
    video: "/convo-vid/dinner.mp4",
    more: `• Two old friends having dinner after months apart — a lot to catch up on\n\n• Hurdles: holding attention during a long story · reacting naturally · navigating sensitive topics\n\n• Targets: narrative structure · active listening · emotional reactions · topic transitions`,
    roles: [
      {
        id: "friend",
        label: "Old Friend",
        npc: "A friend in their 30s with a lot going on — new job, recent move, life changes. Has stories to tell and expects to hear yours.",
      },
      {
        id: "listener",
        label: "Listening Friend",
        npc: "A warm, curious friend in their 30s. Asks follow-up questions naturally and shares their own news when the moment is right.",
      },
    ],
  },
  {
    id: "joke",
    title: "Tell a Joke",
    desc: "Land something funny, read the room, and react to humor in real time.",
    img: "/convo-img/joke.jpg",
    thumb: "/convo-img/thumbs/joke.webp",
    video: "/convo-vid/joke.mp4",
    more: `• Two coworkers on a lunch break — jokes going back and forth, some land, some don't\n\n• Hurdles: timing the punchline · recovering from a flat joke · understanding humor in a second language\n\n• Targets: comedic timing · natural reactions · playful language · recovery phrases`,
    roles: [
      {
        id: "joker",
        label: "Joke-Teller",
        npc: "A coworker in their 30s who always has a joke ready. Some land, some don't — keeps it low pressure either way.",
      },
      {
        id: "audience",
        label: "Audience",
        npc: "A coworker in their 30s on lunch break. Reacts openly, plays along, and tells jokes back.",
      },
    ],
  },
  {
    id: "lifeguard",
    title: "Beach Emergency",
    desc: "Get a lifeguard's attention fast and communicate clearly when someone's safety is on the line.",
    img: "/convo-img/lifeguard.webp",
    thumb: "/convo-img/thumbs/lifeguard.webp",
    video: "/convo-vid/lifeguard.mp4",
    more: `• A child has swum out too far — you need the lifeguard's immediate attention\n\n• Hurdles: panic reducing clarity · not knowing safety vocabulary · hesitating to interrupt\n\n• Targets: clarity under pressure · imperative sentences · location description · following urgent directions`,
    roles: [
      {
        id: "visitor",
        label: "Beach Visitor",
        npc: "A parent in their 30s whose child swam out too far. Needs to communicate the situation quickly and follow instructions.",
      },
      {
        id: "lifeguard",
        label: "Lifeguard",
        npc: "A lifeguard in his 20s. Gives clear, short instructions and expects them to be followed immediately.",
      },
    ],
  },
  {
    id: "mail",
    title: "Ask about Mail",
    desc: "Get a quick, specific answer from a stranger and move on — no small talk needed.",
    img: "/convo-img/mail.jpg",
    thumb: "/convo-img/thumbs/mail.webp",
    video: "/convo-vid/mail.mp4",
    more: `• Post office counter — you're mailing a package for the first time and there's a line behind you\n\n• Hurdles: not knowing which service to choose · missing a quick answer · holding up the line\n\n• Targets: concise questions · processing quick answers · transactional vocabulary`,
    roles: [
      {
        id: "sender",
        label: "Customer",
        npc: "Someone in their 20s mailing a package for the first time. Unsure which service to use or what forms to fill out.",
      },
      {
        id: "clerk",
        label: "Postal Worker",
        npc: "An efficient postal worker in her 40s. Matter-of-fact — handles hundreds of people a day and gives quick, direct answers.",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking Event",
    desc: "Make a strong first impression on someone who could matter to your future.",
    img: "/convo-img/networking.webp",
    thumb: "/convo-img/thumbs/networking.webp",
    video: "/convo-vid/networking.mp4",
    more: `• Industry mixer — two minutes to introduce yourself, make an impression, and decide whether to exchange info\n\n• Hurdles: stumbling over self-introductions · awkward silences · not knowing when to wrap up\n\n• Targets: elevator pitch · professional small talk · graceful exit · follow-up language`,
    roles: [
      {
        id: "newcomer",
        label: "Newcomer",
        npc: "A young professional in their mid-20s at their first networking event. Smart but new to this setting — relies on the other person to keep things flowing.",
      },
      {
        id: "veteran",
        label: "Veteran",
        npc: "A senior professional in her 40s with 15 years in the field. Asks direct questions and expects concise, interesting answers.",
      },
    ],
  },
  {
    id: "parking",
    title: "Parking Ticket Situation",
    desc: "Explain your side of the story to someone who may already think you're wrong.",
    img: "/convo-img/parking.webp",
    thumb: "/convo-img/thumbs/parking.webp",
    video: "/convo-vid/parking.mp4",
    more: `• Parking lot — you've found a ticket on your windshield and the enforcement officer is still nearby\n\n• Hurdles: emotional reaction clouding facts · making excuses instead of asking questions · not knowing appeal options\n\n• Targets: factual narration · staying credible · accepting outcomes gracefully · asking about process`,
    roles: [
      {
        id: "driver",
        label: "Driver",
        npc: "A driver in their 30s who just found a ticket on the windshield. Believes the sign was unclear and wants to understand the appeals process.",
      },
      {
        id: "officer",
        label: "Enforcement Officer",
        npc: "A parking enforcement officer in his 40s. Follows the rules — needs facts, not excuses. Not rude, not sympathetic, just procedural.",
      },
    ],
  },
  {
    id: "police",
    title: "Ask an Officer for Help",
    desc: "Stay composed and give clear, factual details to a person in authority.",
    img: "/convo-img/police.webp",
    thumb: "/convo-img/thumbs/police.webp",
    video: "/convo-vid/police.mp4",
    more: `• Street corner — you approach a police officer on foot patrol for directions, to report something, or to ask if an area is safe\n\n• Hurdles: nervousness around authority · vague location descriptions · cultural uncertainty about approaching police\n\n• Targets: factual reporting · location description · calm composure · brief, organized answers`,
    roles: [
      {
        id: "citizen",
        label: "Citizen",
        npc: "A person in their 30s approaching an officer on foot patrol. Needs to report something minor or find a specific address.",
      },
      {
        id: "officer",
        label: "Officer",
        npc: "A police officer in her 40s on foot patrol. Approachable but professional — asks direct questions and expects clear, factual answers.",
      },
    ],
  },
  {
    id: "shopping",
    title: "Shopping Assistance",
    desc: "Ask about sizes, compare options, and say no to extras without feeling guilty.",
    img: "/convo-img/shopping.jpg",
    thumb: "/convo-img/thumbs/shopping.webp",
    video: "/convo-vid/shopping.mp4",
    more: `• Clothing store — you're looking for a gift and need help with sizes, but the associate likes to upsell\n\n• Hurdles: not knowing sizes in another system · being pressured into extras · describing preferences vaguely\n\n• Targets: polite refusal · describing preferences · retail vocabulary · making a confident decision`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in their 30s looking for a gift. Unsure about sizes and not sure what the recipient likes — needs honest guidance.",
      },
      {
        id: "associate",
        label: "Sales Associate",
        npc: "A clothing store associate in her 20s. Helpful and knowledgeable but a little pushy with add-ons and extras.",
      },
    ],
  },
  {
    id: "student",
    title: "Talk to Your Teacher",
    desc: "Approach someone above you, ask for help, and show initiative without overstepping.",
    img: "/convo-img/student.webp",
    thumb: "/convo-img/thumbs/student.webp",
    video: "/convo-vid/student.mp4",
    more: `• College classroom after a lecture — the professor has another class soon and you stayed behind to ask something\n\n• Hurdles: embarrassment about not understanding · vague questions · running out of the teacher's time\n\n• Targets: admitting confusion clearly · asking focused questions · respectful register`,
    roles: [
      {
        id: "student",
        label: "Student",
        npc: "A college student in their early 20s who stayed after class. Wants to ask about a concept they missed but tends to start with vague questions.",
      },
      {
        id: "teacher",
        label: "Teacher",
        npc: "A college professor in his 50s wrapping up after class. Knowledgeable and willing to help, but has another class in 10 minutes.",
      },
    ],
  },
  {
    id: "technology",
    title: "Tech Support Problem",
    desc: "Describe a problem you can barely name and follow step-by-step instructions to fix it.",
    img: "/convo-img/technology.webp",
    thumb: "/convo-img/thumbs/technology.webp",
    video: "/convo-vid/technology.mp4",
    more: `• Tech support call — your laptop is broken and you can't name the problem precisely\n\n• Hurdles: not knowing technical terms · describing visual errors vaguely · losing track mid-instruction\n\n• Targets: describing what you see · following sequential instructions · asking for simpler explanations`,
    roles: [
      {
        id: "user",
        label: "User",
        npc: "Someone in their 40s whose laptop keeps crashing. Not tech-savvy — describes things in everyday language and needs small, clear steps.",
      },
      {
        id: "support",
        label: "Support Agent",
        npc: "A tech support agent in his 30s. Methodical and patient — walks through things step by step but uses some technical shorthand.",
      },
    ],
  },
  {
    id: "understanding",
    title: "Clear Up a Misunderstanding",
    desc: "Catch a miscommunication mid-conversation and steer it back on track.",
    img: "/convo-img/understanding.webp",
    thumb: "/convo-img/thumbs/understanding.webp",
    video: "/convo-vid/understanding.mp4",
    more: `• Two coworkers talking — someone misread an email or took a comment the wrong way\n\n• Hurdles: not realizing a miscommunication happened · defensive reactions · unclear rephrasing\n\n• Targets: diplomatic correction · checking understanding · repair phrases ("What I meant was...")`,
    roles: [
      {
        id: "clarifier",
        label: "Clarifier",
        npc: "A coworker in their 30s who said something ambiguous and doesn't realize it was taken the wrong way. Needs a nudge to see the disconnect.",
      },
      {
        id: "confused",
        label: "Confused Party",
        npc: "A coworker in their 30s who tends to take things literally. Reads emails quickly and sometimes jumps to conclusions before asking follow-ups.",
      },
    ],
  },
  {
    id: "videocall",
    title: "Video Call with a Colleague",
    desc: "Collaborate through a screen — share updates, stay on topic, and wrap up professionally.",
    img: "/convo-img/videocall.webp",
    thumb: "/convo-img/thumbs/videocall.webp",
    video: "",
    more: `• Scheduled video call between remote colleagues — updates to share, questions to answer, next steps to nail down\n\n• Hurdles: talking over each other · going off-topic · forgetting to confirm next steps\n\n• Targets: concise updates · interruption recovery · professional closings · video-call conventions`,
    roles: [
      {
        id: "presenter",
        label: "Presenter",
        npc: "A colleague in their 30s who has a lot to report. Tends to go off-topic and needs the other person to keep things focused.",
      },
      {
        id: "listener",
        label: "Call Runner",
        npc: "An organized remote colleague in her 40s. Asks for updates, shares hers concisely, and wants next steps nailed down before hanging up.",
      },
    ],
  },
  {
    id: "hiking",
    title: "Chat on a Winter Hike",
    desc: "Walk and talk — hold a winding, unhurried conversation with a friend outdoors.",
    img: "/convo-img/hiking.webp",
    thumb: "/convo-img/thumbs/hiking.webp",
    video: "",
    more: `• Two friends walking a winter trail — no agenda, no rush, just whatever comes to mind\n\n• Hurdles: filling every silence · running out of casual topics · one-word responses\n\n• Targets: casual opinion sharing · reacting to surroundings · comfortable pacing · natural topic transitions`,
    roles: [
      {
        id: "hiker",
        label: "Hiker",
        npc: "A friend in their 30s who's quieter on the trail. Responds when topics come up but needs the other person to carry more of the conversation.",
      },
      {
        id: "guide",
        label: "Trail Guide",
        npc: "A close friend in their 30s. Shares trail observations, asks what's been on your mind, and is comfortable with stretches of silence.",
      },
    ],
  },
];