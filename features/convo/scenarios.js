// features/convo/scenarios.js
// Source of truth for all 25 AI conversation scenarios.
// Structure: title → desc → 3 bullet-point `more` → roles.
// Last overhauled: 2026-04-03 (Step 2 stricter NPC pass — behavioral steering removal).
// Axes: length-neutral · emotion-neutral · CEFR-neutral · perspective-neutral.
// NPC principle: identity + scene function only — no conversational method scripting.

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
        npc: "Someone doing a focused speaking practice conversation. Trying to speak naturally and clearly.",
      },
      {
        id: "partner",
        label: "Conversation Partner",
        npc: "A conversation partner. No fixed role or agenda.",
      },
    ],
  },
  {
    id: "coffee",
    title: "Order Coffee",
    desc: "A morning rush, a café line that won't wait, and an order to get right the first time.",
    img: "/convo-img/coffee.webp",
    thumb: "/convo-img/thumbs/coffee.webp",
    video: "/convo-vid/coffee.mp4",
    more: `• Busy morning café with a growing line — the order needs to be clear the first time

• Hurdles: noisy environment · mishearing size or milk options · a growing line

• Targets: polite correction · on-the-spot decisions · casual small talk · drink customization vocabulary`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "A regular in their 30s who comes in every morning. Decisive and knows what they want.",
      },
      {
        id: "barista",
        label: "Barista",
        npc: "A café worker in her 20s on a busy morning shift. Repeats orders back to confirm.",
      },
    ],
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    desc: "A clinic visit — symptoms to describe, questions to ask, and next steps to follow.",
    img: "/convo-img/doctor.webp",
    thumb: "/convo-img/thumbs/doctor.webp",
    video: "/convo-vid/doctor.mp4",
    more: `• Clinic exam room — the doctor asks follow-up questions to understand what's going on

• Hurdles: describing symptoms clearly · vocabulary gaps · hesitating to ask questions

• Targets: describing symptoms · asking for clarification · understanding next steps`,
    roles: [
      {
        id: "patient",
        label: "Patient",
        npc: "Someone in their 30s visiting for a new symptom. Not sure how to describe what's going on.",
        ttsVoice: "en-US-ChristopherNeural",
      },
      {
        id: "doctor",
        label: "Doctor",
        npc: "A physician in her 40s.",
        ttsVoice: "en-US-NancyNeural",
      },
    ],
  },
  {
    id: "job",
    title: "Job Interview",
    desc: "A formal job interview where experience meets tough questions and first impressions count.",
    img: "/convo-img/job.webp",
    thumb: "/convo-img/thumbs/job.webp",
    video: "/convo-vid/job.mp4",
    more: `• Formal interview at a company office — the interviewer probes for genuine answers and values focus

• Hurdles: underselling experience · losing focus mid-answer · pausing after tough questions

• Targets: focused self-presentation · handling follow-up questions · professional register`,
    roles: [
      {
        id: "candidate",
        label: "Candidate",
        npc: "A qualified professional in their late 20s with solid experience. Can lose focus mid-answer when the question is tough.",
      },
      {
        id: "interviewer",
        label: "Interviewer",
        npc: "A hiring manager in his 50s with hundreds of interviews behind him.",
      },
    ],
  },
  {
    id: "airport",
    title: "Airport Problem",
    desc: "A cancelled flight, a long rebooking line, and a connection to save.",
    img: "/convo-img/airport.webp",
    thumb: "/convo-img/thumbs/airport.webp",
    video: "/convo-vid/airport.mp4",
    more: `• A cancelled flight and a long rebooking line — the right information needs to be ready

• Hurdles: missing details when it matters · unfamiliar airline procedures · documents not ready

• Targets: giving factual details clearly · assertive requesting · navigating an unfamiliar process`,
    roles: [
      {
        id: "traveler",
        label: "Traveler",
        npc: "A passenger whose connecting flight was cancelled. Tends to lose track of details and doesn't always have documents ready.",
      },
      {
        id: "agent",
        label: "Gate Agent",
        npc: "An airline agent in her 30s handling rebookings at the gate.",
      },
    ],
  },
  {
    id: "restaurant",
    title: "Restaurant Order",
    desc: "A busy restaurant meal where dietary needs, wrong orders, and specials all come into play.",
    img: "/convo-img/restaurant.webp",
    thumb: "/convo-img/thumbs/restaurant.webp",
    video: "/convo-vid/restaurant.mp4",
    more: `• Mid-range restaurant on a busy evening — dietary needs on the table and the kitchen running behind

• Hurdles: communicating allergies · flagging a wrong order · understanding specials described aloud

• Targets: making requests · addressing mistakes · menu vocabulary · dietary restriction language`,
    roles: [
      {
        id: "diner",
        label: "Diner",
        npc: "A customer dining with a friend. Has dietary restrictions and will need to modify at least one dish.",
      },
      {
        id: "waiter",
        label: "Waiter",
        npc: "A server in his late 20s. The kitchen is backed up tonight.",
      },
    ],
  },
  {
    id: "school",
    title: "School Meeting",
    desc: "A parent-teacher conference where both sides discuss progress, expectations, and next steps.",
    img: "/convo-img/school.webp",
    thumb: "/convo-img/thumbs/school.webp",
    video: "/convo-vid/parents.mp4",
    more: `• Parent-teacher conference after school — both sides have observations to share

• Hurdles: hearing mixed feedback · vague progress reports · agreeing on concrete next steps

• Targets: responding to feedback · asking specific questions · collaborative problem-solving`,
    roles: [
      {
        id: "parent",
        label: "Parent",
        npc: "A parent in their 30s who wants the best for their child. Has strong opinions.",
      },
      {
        id: "teacher",
        label: "Teacher",
        npc: "An experienced teacher in her 30s with prepared observations.",
      },
    ],
  },
  {
    id: "banking",
    title: "Open a Bank Account",
    desc: "A bank branch visit — account options to sort through, fees to understand, and paperwork to complete.",
    img: "/convo-img/banking.webp",
    thumb: "/convo-img/thumbs/banking.webp",
    video: "/convo-vid/banking.mp4",
    more: `• Bank branch office — the account-opening process involves options, paperwork, and new terms

• Hurdles: new vocabulary · lots of options to compare · hesitation to ask questions

• Targets: requesting repetition · comparing options · confirming understanding`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "Someone in their 20s who just moved to the area. Has questions about accounts but tends to hold back rather than ask.",
      },
      {
        id: "teller",
        label: "Bank Rep",
        npc: "A bank representative in his 40s who walks customers through the account-opening process.",
      },
    ],
  },
  {
    id: "calling",
    title: "Make a Phone Call",
    desc: "A phone call with no body language — just voices, words, and a clear goal.",
    img: "/convo-img/calling.webp",
    thumb: "/convo-img/thumbs/calling.webp",
    video: "/convo-vid/calling.mp4",
    more: `• Phone call to a medical office — no visual cues, everything depends on voice alone

• Hurdles: bad audio quality · spelling names over the phone · losing track of details mid-call

• Targets: phone openings and closings · spelling and number dictation · requesting repetition`,
    roles: [
      {
        id: "caller",
        label: "Caller",
        npc: "Someone in their 30s calling to schedule an appointment. Tends to forget details and sometimes needs things repeated.",
      },
      {
        id: "receiver",
        label: "Receptionist",
        npc: "A medical office receptionist in her 40s scheduling appointments.",
      },
    ],
  },
  {
    id: "car",
    title: "Conversation in the Car",
    desc: "A relaxed conversation in a small space with nowhere to go and no agenda.",
    img: "/convo-img/car.jpg",
    thumb: "/convo-img/thumbs/car.webp",
    video: "/convo-vid/car.mp4",
    more: `• Two friends in a car for a while — no agenda, just talk, opinions, and comfortable silence

• Hurdles: running out of things to say · filling silence · one-word answers

• Targets: opinion sharing · turn-taking · comfortable pacing · keeping conversation alive without forcing it`,
    roles: [
      {
        id: "passenger",
        label: "Passenger",
        npc: "A friend in their 30s who's a bit quieter today. Will chat if topics come up but is also comfortable with silence.",
      },
      {
        id: "driver",
        label: "Driver",
        npc: "A talkative friend in their 30s who likes asking opinions and bringing up random topics.",
      },
    ],
  },
  {
    id: "choosing",
    title: "Choose at the Grocery Store",
    desc: "A grocery store aisle, a missing ingredient, and a decision to make on the spot.",
    img: "/convo-img/choosing.webp",
    thumb: "/convo-img/thumbs/choosing.webp",
    video: "/convo-vid/choosing.mp4",
    more: `• Grocery store aisle — a missing ingredient and a store worker nearby stocking shelves

• Hurdles: not knowing product names · catching what's said · deciding on the spot

• Targets: asking for help · understanding directions · everyday vocabulary · on-the-spot decisions`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in their 30s cooking something specific tonight. Can't find the right ingredients and needs help with brands and alternatives.",
      },
      {
        id: "worker",
        label: "Store Worker",
        npc: "A store employee in his 20s stocking shelves. Knows the store well and can point people in the right direction.",
      },
    ],
  },
  {
    id: "concern",
    title: "Raise a Concern",
    desc: "A real maintenance problem, a face-to-face meeting, and a resolution to negotiate.",
    img: "/convo-img/concern.webp",
    thumb: "/convo-img/thumbs/concern.webp",
    video: "/convo-vid/concern.mp4",
    more: `• Meeting between a tenant and building manager about an ongoing issue — leak, noise, or broken appliance

• Hurdles: vague complaints · losing focus · no clear ask · not knowing what's reasonable

• Targets: factual description · staying on point · proposing solutions · confirming next steps and timeline`,
    roles: [
      {
        id: "complainant",
        label: "Tenant",
        npc: "A tenant in their 30s with a real maintenance problem that hasn't been fixed.",
      },
      {
        id: "manager",
        label: "Manager",
        npc: "A building manager in his 50s who handles multiple properties.",
      },
    ],
  },
  {
    id: "couple",
    title: "Chat with Strangers at a Party",
    desc: "A house party where someone new joins a conversation already in progress.",
    img: "/convo-img/couple.jpg",
    thumb: "/convo-img/thumbs/couple.webp",
    video: "/convo-vid/couple.mp4",
    more: `• House party — a newcomer approaches a pair already mid-conversation

• Hurdles: breaking into an existing conversation · keeping talk balanced · leaving gracefully

• Targets: introductions · small talk · finding common ground · social exit phrases`,
    roles: [
      {
        id: "newcomer",
        label: "Newcomer",
        npc: "Someone in their late 20s who arrived at the party alone. Takes a moment to warm up once a conversation gets going.",
      },
      {
        id: "host",
        label: "Party Regulars",
        npc: "A pair in their 30s who have been at the party a while.",
      },
    ],
  },
  {
    id: "dinner",
    title: "Catch Up over Dinner",
    desc: "Two old friends catching up over dinner — stories to tell, news to share, and a long evening ahead.",
    img: "/convo-img/dinner.webp",
    thumb: "/convo-img/thumbs/dinner.webp",
    video: "/convo-vid/dinner.mp4",
    more: `• Two old friends having dinner after months apart — a lot to catch up on

• Hurdles: holding attention during a long story · reacting naturally · topics that go deeper than small talk

• Targets: narrative structure · active listening · emotional reactions · topic transitions`,
    roles: [
      {
        id: "friend",
        label: "Old Friend",
        npc: "A friend in their 30s with a lot going on — new job, recent move, life changes.",
      },
      {
        id: "listener",
        label: "Listening Friend",
        npc: "A friend in their 30s catching up over dinner.",
      },
    ],
  },
  {
    id: "joke",
    title: "Tell a Joke",
    desc: "Jokes flying back and forth — some land, some don't, and the real skill is reacting in the moment.",
    img: "/convo-img/joke.jpg",
    thumb: "/convo-img/thumbs/joke.webp",
    video: "/convo-vid/joke.mp4",
    more: `• Two coworkers on a lunch break — jokes going back and forth, some land, some don't

• Hurdles: timing the punchline · recovering from a flat joke · understanding humor in a second language

• Targets: comedic timing · natural reactions · playful language · recovery phrases`,
    roles: [
      {
        id: "joker",
        label: "Joke-Teller",
        npc: "A coworker in their 30s who always has a joke ready. Some land, some don't.",
      },
      {
        id: "audience",
        label: "Audience",
        npc: "A coworker in their 30s on lunch break.",
      },
    ],
  },
  {
    id: "lifeguard",
    title: "Beach Emergency",
    desc: "A beach emergency where a child has gone too far out and someone needs to act.",
    img: "/convo-img/lifeguard.webp",
    thumb: "/convo-img/thumbs/lifeguard.webp",
    video: "/convo-vid/lifeguard.mp4",
    more: `• A child has swum out too far — the lifeguard's attention is needed now

• Hurdles: losing clarity in the moment · not knowing safety vocabulary · hesitating to interrupt

• Targets: giving clear information · describing a location · following directions · getting to the point`,
    roles: [
      {
        id: "visitor",
        label: "Beach Visitor",
        npc: "A parent in their 30s whose child swam out too far.",
      },
      {
        id: "lifeguard",
        label: "Lifeguard",
        npc: "A lifeguard in his 20s on duty.",
      },
    ],
  },
  {
    id: "mail",
    title: "Ask about Mail",
    desc: "A post office counter, a first-time package, and a transaction to get through.",
    img: "/convo-img/mail.jpg",
    thumb: "/convo-img/thumbs/mail.webp",
    video: "/convo-vid/mail.mp4",
    more: `• Post office counter — a first-time package to mail and a line that keeps growing

• Hurdles: not knowing which service to choose · catching an answer the first time · keeping the interaction moving

• Targets: focused questions · understanding answers on the first pass · transactional vocabulary`,
    roles: [
      {
        id: "sender",
        label: "Customer",
        npc: "Someone in their 20s mailing a package for the first time. Unsure which service to use or what forms to fill out.",
      },
      {
        id: "clerk",
        label: "Postal Worker",
        npc: "A postal worker in her 40s who handles hundreds of people a day. Knows the services and options well.",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking Event",
    desc: "An industry mixer where introductions that make an impression lead to real opportunities.",
    img: "/convo-img/networking.webp",
    thumb: "/convo-img/thumbs/networking.webp",
    video: "/convo-vid/networking.mp4",
    more: `• Industry mixer — introductions, first impressions, and a decision about whether to exchange info

• Hurdles: stumbling over self-introductions · gaps in the conversation · not knowing when to wrap up

• Targets: elevator pitch · professional small talk · graceful exit · follow-up language`,
    roles: [
      {
        id: "newcomer",
        label: "Newcomer",
        npc: "A young professional in their mid-20s at their first networking event.",
      },
      {
        id: "veteran",
        label: "Veteran",
        npc: "A senior professional in her 40s with 15 years in the field.",
      },
    ],
  },
  {
    id: "parking",
    title: "Parking Ticket Situation",
    desc: "A parking ticket, an officer still nearby, and two sides of the story.",
    img: "/convo-img/parking.webp",
    thumb: "/convo-img/thumbs/parking.webp",
    video: "/convo-vid/parking.mp4",
    more: `• Parking lot — a ticket on the windshield, the enforcement officer still nearby

• Hurdles: staying factual · defaulting to excuses instead of questions · not knowing appeal options

• Targets: factual narration · staying credible · accepting outcomes · asking about process`,
    roles: [
      {
        id: "driver",
        label: "Driver",
        npc: "A driver in their 30s who just found a ticket on the windshield. Believes the sign was unclear and wants to understand the appeals process.",
      },
      {
        id: "officer",
        label: "Enforcement Officer",
        npc: "A parking enforcement officer in his 40s.",
      },
    ],
  },
  {
    id: "police",
    title: "Ask an Officer for Help",
    desc: "A street-corner interaction between a citizen and a police officer on foot patrol.",
    img: "/convo-img/police.webp",
    thumb: "/convo-img/thumbs/police.webp",
    video: "/convo-vid/police.mp4",
    more: `• Street corner — someone approaches a police officer on foot patrol for directions, a report, or a safety question

• Hurdles: unfamiliarity with the interaction · vague location descriptions · cultural differences in approaching authority

• Targets: factual reporting · location description · organized answers · appropriate register`,
    roles: [
      {
        id: "citizen",
        label: "Citizen",
        npc: "A person in their 30s approaching an officer on foot patrol. Needs to report something minor or find a specific address.",
      },
      {
        id: "officer",
        label: "Officer",
        npc: "A police officer in her 40s on foot patrol.",
      },
    ],
  },
  {
    id: "shopping",
    title: "Shopping Assistance",
    desc: "A clothing store visit where sizes, preferences, and add-on offers all come into play.",
    img: "/convo-img/shopping.jpg",
    thumb: "/convo-img/thumbs/shopping.webp",
    video: "/convo-vid/shopping.mp4",
    more: `• Clothing store — a gift to buy, sizes to figure out, and an associate with suggestions

• Hurdles: not knowing sizes in another system · navigating add-on offers · describing preferences clearly

• Targets: declining offers · describing preferences · retail vocabulary · making a decision`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in their 30s looking for a gift. Unsure about sizes and not sure what the recipient likes.",
      },
      {
        id: "associate",
        label: "Sales Associate",
        npc: "A clothing store associate in her 20s who knows the product line well.",
      },
    ],
  },
  {
    id: "student",
    title: "Talk to Your Teacher",
    desc: "A post-lecture conversation between a student who stayed behind and a professor with limited time.",
    img: "/convo-img/student.webp",
    thumb: "/convo-img/thumbs/student.webp",
    video: "/convo-vid/student.mp4",
    more: `• College classroom after a lecture — the professor has another class soon and the student stayed behind to ask something

• Hurdles: not knowing how to phrase a question · vague questions · limited time

• Targets: admitting confusion clearly · asking focused questions · appropriate register`,
    roles: [
      {
        id: "student",
        label: "Student",
        npc: "A college student in their early 20s who stayed after class. Wants to ask about a concept they missed but tends to start with vague questions.",
      },
      {
        id: "teacher",
        label: "Teacher",
        npc: "A college professor in his 50s wrapping up after class. Available for a few minutes between classes.",
      },
    ],
  },
  {
    id: "technology",
    title: "Tech Support Problem",
    desc: "A tech support call where a broken laptop meets step-by-step troubleshooting.",
    img: "/convo-img/technology.webp",
    thumb: "/convo-img/thumbs/technology.webp",
    video: "/convo-vid/technology.mp4",
    more: `• Tech support call — a broken laptop and a diagnosis to work through together

• Hurdles: vocabulary gaps · describing what's on screen · losing track mid-instruction

• Targets: describing what's happening · following sequential instructions · asking for clarification`,
    roles: [
      {
        id: "user",
        label: "User",
        npc: "Someone in their 40s whose laptop keeps crashing. Describes what's happening in their own words.",
      },
      {
        id: "support",
        label: "Support Agent",
        npc: "A tech support agent in his 30s.",
      },
    ],
  },
  {
    id: "understanding",
    title: "Clear Up a Misunderstanding",
    desc: "A miscommunication mid-conversation — someone took something the wrong way and the conversation needs steering back.",
    img: "/convo-img/understanding.webp",
    thumb: "/convo-img/thumbs/understanding.webp",
    video: "/convo-vid/understanding.mp4",
    more: `• Two coworkers talking — someone misread an email or took a comment the wrong way

• Hurdles: not realizing a miscommunication happened · misreading intent · unclear rephrasing

• Targets: diplomatic correction · checking understanding · repair phrases ("What I meant was...")`,
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
    desc: "A scheduled video call between remote colleagues — updates to share, questions to answer, and next steps to lock down.",
    img: "/convo-img/videocall.webp",
    thumb: "/convo-img/thumbs/videocall.webp",
    video: "",
    more: `• Scheduled video call between remote colleagues — updates to share, questions to answer, next steps to nail down

• Hurdles: talking over each other · going off-topic · forgetting to confirm next steps

• Targets: clear updates · interruption recovery · professional closings · video-call conventions`,
    roles: [
      {
        id: "presenter",
        label: "Presenter",
        npc: "A colleague in their 30s who has a lot to report and tends to go off-topic.",
      },
      {
        id: "listener",
        label: "Call Runner",
        npc: "A remote colleague in her 40s running the call.",
      },
    ],
  },
  {
    id: "hiking",
    title: "Chat on a Winter Hike",
    desc: "Walk and talk — a winding, unhurried conversation between friends on a winter trail.",
    img: "/convo-img/hiking.webp",
    thumb: "/convo-img/thumbs/hiking.webp",
    video: "",
    more: `• Two friends walking a winter trail — no agenda, no rush, just whatever comes to mind

• Hurdles: filling silence · running out of casual topics · one-word responses

• Targets: casual opinion sharing · reacting to surroundings · comfortable pacing · natural topic transitions`,
    roles: [
      {
        id: "hiker",
        label: "Hiker",
        npc: "A friend in their 30s who's quieter on the trail.",
      },
      {
        id: "guide",
        label: "Trail Guide",
        npc: "A close friend in their 30s on a familiar trail.",
      },
    ],
  },
];