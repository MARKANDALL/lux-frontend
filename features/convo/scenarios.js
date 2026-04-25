// features/convo/scenarios.js
// Source of truth for all AI conversation scenarios (25 scene-based + 1 open practice).
// Structure: title → desc → 3 bullet-point `more` → roles.
// Last overhauled: 2026-04-24 (full alignment sweep — desc/role/more rewrite for image accuracy, dispositional language removal, B1 vocabulary ceiling, gender tagging).
// Axes: length-neutral · emotion-neutral · CEFR-neutral · perspective-neutral.
// NPC principle: identity + scene function only — no conversational method scripting.

export const SCENARIOS = [
  {
    id: "quick-practice",
    title: "Quick Practice",
    desc: "A conversation built around the sounds and words you need to practice most — relaxed, open-ended, and shaped by your pronunciation history.",
    more: `• Built around your pronunciation data — Lux weaves in the specific sounds and words you've had the most trouble with

• Flexible setting — no fixed location, task, or storyline, so the topic can go wherever it feels most natural

• Objectives: spontaneous speaking · easy topic shifts · natural repetition of problem sounds and words`,
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
    desc: "A stop at the café — a few options on the board, a barista at the counter, and an order to place.",
    img: "/convo-img/coffee.webp",
    thumb: "/convo-img/thumbs/coffee.webp",
    video: "/convo-vid/coffee.mp4",
    more: `• The kind of quick, routine interaction where confidence matters — one chance to order clearly before the line moves

• Difficulties: noisy environment · words specific to café menus · choosing from new options

• Objectives: polite correction · quick decisions · casual small talk · knowing how to name drink options`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "A regular in his 30s who comes in every morning.",
      },
      {
        id: "barista",
        label: "Barista",
        npc: "A café worker in her 20s on a morning shift.",
      },
    ],
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    desc: "A clinic visit — symptoms to describe, questions to ask, and a plan to follow.",
    img: "/convo-img/doctor.webp",
    thumb: "/convo-img/thumbs/doctor.webp",
    video: "/convo-vid/doctor.mp4",
    more: `• Clinic exam room — the doctor asks questions to understand what's going on

• Difficulties: medical words and phrases · unsure of what to ask · feeling embarrassed when describing personal health problems

• Objectives: explaining pain or how the body feels · asking questions when something is not clear · following what comes next`,
    roles: [
      {
        id: "patient",
        label: "Patient",
        npc: "Someone in his 30s visiting for a new symptom. Not sure how to describe what's going on.",
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
    desc: "A job interview where experience meets questions and first impressions count.",
    img: "/convo-img/job.webp",
    thumb: "/convo-img/thumbs/job.webp",
    video: "/convo-vid/job.mp4",
    more: `• Formal interview at a company office — the interviewer asks careful questions and wants honest, focused answers

• Difficulties: saying too much or too little about experience · losing focus mid-answer · pausing after difficult questions

• Objectives: presenting yourself well · handling follow-up questions · professional way of speaking`,
    roles: [
      {
        id: "candidate",
        label: "Candidate",
        npc: "A qualified professional in her late 20s with solid experience.",
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
    desc: "A cancelled flight, a crowded terminal, and a connection to save.",
    img: "/convo-img/airport.webp",
    thumb: "/convo-img/thumbs/airport.webp",
    video: "/convo-vid/airport.mp4",
    more: `• A cancelled flight and a crowded terminal — the right information needs to be ready

• Difficulties: finding your way in a busy airport · airline rules they don't know · documents not ready

• Objectives: giving the right details · making clear requests · finding your way in a new situation`,
    roles: [
      {
        id: "traveler",
        label: "Traveler",
        npc: "A man in his 50s whose connecting flight was cancelled. Doesn't always have documents ready or know what's needed.",
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
    title: "Work Lunch",
    desc: "Two coworkers at lunch — a shared meal and a conversation that needs the right tone.",
    img: "/convo-img/restaurant.webp",
    thumb: "/convo-img/thumbs/restaurant.webp",
    video: "/convo-vid/restaurant.mp4",
    more: `• Two coworkers at a restaurant during a work lunch — a social setting with its own rules

• Difficulties: noticing how the other person reacts · dealing with a disagreement · knowing what is OK to talk about at work

• Objectives: sharing opinions · reacting to stories · agreeing and disagreeing · taking turns in the conversation`,
    roles: [
      {
        id: "diner",
        label: "Coworker A",
        npc: "A coworker in her 30s with something to share over lunch.",
      },
      {
        id: "waiter",
        label: "Coworker B",
        npc: "A coworker in her 30s on a lunch break.",
      },
    ],
  },
  {
    id: "school",
    title: "School Meeting",
    desc: "A parent-teacher conference where both sides discuss progress, expectations, and a plan going forward.",
    img: "/convo-img/school.webp",
    thumb: "/convo-img/thumbs/school.webp",
    video: "/convo-vid/parents.mp4",
    more: `• A classroom after hours — the teacher has notes, the parents have questions, and the child's future feels like it's on the table

• Difficulties: receiving mixed feedback · unclear progress reports · agreeing on a clear plan

• Objectives: responding to feedback · asking specific questions · solving problems together`,
    roles: [
      {
        id: "parent",
        label: "Parents",
        npc: "Parents in their 30s who want the best for their child. The mother is speaking.",
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
    more: `• Bank branch office — the visit involves questions, paperwork, and terms that may be new

• Difficulties: banking words and expressions · lots of options to compare · difficult paperwork and legal terms

• Objectives: asking questions when something is not clear · comparing options · confirming everything makes sense`,
    roles: [
      {
        id: "customer",
        label: "Customer",
        npc: "Someone in her 20s who just moved to the area. Has questions about accounts.",
      },
      {
        id: "teller",
        label: "Bank Rep",
        npc: "A bank representative in his 60s who explains the account options.",
      },
    ],
  },
  {
    id: "calling",
    title: "Make a Phone Call",
    desc: "A phone call about someone who isn't feeling well — details to pass along and a plan to figure out.",
    img: "/convo-img/calling.webp",
    thumb: "/convo-img/thumbs/calling.webp",
    video: "/convo-vid/calling.mp4",
    more: `• A phone call about a family member who is unwell — medical information to share and what to do next

• Difficulties: describing symptoms for someone else · understanding medical terms · keeping track of what needs to be said

• Objectives: sharing information step by step · asking the right questions · learning medical words and phrases · using the right tone for a serious situation`,
    roles: [
      {
        id: "caller",
        label: "Caller",
        npc: "A man in his 30s calling about a family member who isn't feeling well.",
      },
      {
        id: "receiver",
        label: "Family Member",
        npc: "A woman in her 40s asking about a family member's health over the phone.",
      },
    ],
  },
  {
    id: "car",
    title: "Conversation in the Car",
    desc: "Two people sharing a ride — small talk, opinions, and whatever comes up along the way.",
    img: "/convo-img/car.jpg",
    thumb: "/convo-img/thumbs/car.webp",
    video: "/convo-vid/car.mp4",
    more: `• On the way to a weekend market — no agenda, just whatever comes to mind, with comfortable silence between topics

• Difficulties: finding new topics when conversation slows down · filling silence · paying attention to both the road and the conversation

• Objectives: sharing opinions · taking turns speaking · going at a comfortable speed · keeping conversation alive without forcing it`,
    roles: [
      {
        id: "passenger",
        label: "Passenger",
        npc: "A man in his 30s along for the ride.",
      },
      {
        id: "driver",
        label: "Driver",
        npc: "A man in his 40s driving the vehicle.",
      },
    ],
  },
  {
    id: "choosing",
    title: "Choose at the Grocery Store",
    desc: "A grocery store aisle, a missing ingredient, and a store worker nearby to help.",
    img: "/convo-img/choosing.webp",
    thumb: "/convo-img/thumbs/choosing.webp",
    video: "/convo-vid/choosing.mp4",
    more: `• A quick exchange with a stranger who knows the products — the kind of everyday help that takes confidence to ask for

• Difficulties: not knowing product names · seeing the differences between similar products · making a decision quickly

• Objectives: asking for help · following recommendations · names for ingredients and cooking methods · comparing products`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in her 30s cooking something specific tonight. Can't find the right ingredients and needs help with brands and alternatives.",
      },
      {
        id: "worker",
        label: "Store Worker",
        npc: "A store employee in his 40s stocking shelves. Knows the store well and can point people in the right direction.",
      },
    ],
  },
  {
    id: "concern",
    title: "Raise a Concern",
    desc: "A real maintenance problem — a leak in the ceiling, a phone call to the landlord, and a solution to agree on.",
    img: "/convo-img/concern.webp",
    thumb: "/convo-img/thumbs/concern.webp",
    video: "/convo-vid/concern.mp4",
    more: `• Phone call between a tenant and building manager about an ongoing issue — leak, noise, or broken appliance

• Difficulties: unclear complaints or responses · not making a clear request · not knowing what is reasonable · keeping a respectful tone when one person has more power

• Objectives: describing the facts · staying focused · suggesting solutions · confirming the plan and timeline`,
    roles: [
      {
        id: "complainant",
        label: "Tenants",
        npc: "Tenants in their 30s with a real maintenance problem that hasn't been fixed. The woman is on the phone.",
      },
      {
        id: "manager",
        label: "Manager",
        npc: "A building manager in her 50s who handles multiple properties.",
      },
    ],
  },
  {
    id: "party",
    title: "Chat with Strangers at a Party",
    desc: "A party where two people start a conversation for the first time.",
    img: "/convo-img/party.jpg",
    thumb: "/convo-img/thumbs/party.webp",
    video: "/convo-vid/party.mp4",
    more: `• The kind of social moment that tests every skill at once — opening, keeping it going, reading the other person, and knowing when to move on

• Difficulties: starting a conversation with someone new · keeping the conversation going for both people · knowing when to leave

• Objectives: introductions · small talk · finding common interests · polite ways to end a conversation · avoiding sensitive topics`,
    roles: [
      {
        id: "newcomer",
        label: "Newcomer",
        npc: "A woman in her late 20s who arrived at the party alone.",
      },
      {
        id: "host",
        label: "Party Regular",
        npc: "A man in his 20s who has been at the party a while.",
      },
    ],
  },
  {
    id: "dinner",
    title: "Catch Up over Dinner",
    desc: "Two old friends catching up over dinner — stories to tell and news to share.",
    img: "/convo-img/dinner.webp",
    thumb: "/convo-img/thumbs/dinner.webp",
    video: "/convo-vid/dinner.mp4",
    more: `• Months have passed since the last time — the conversation goes deeper than usual, and knowing how to listen matters as much as knowing how to talk

• Difficulties: holding attention during a long story · reacting naturally · topics that are more personal than small talk

• Objectives: telling a story in order · showing you are listening · emotionally appropriate reactions · changing the subject naturally`,
    roles: [
      {
        id: "friend",
        label: "Old Friend",
        npc: "A friend in her 60s with a lot of recent changes — recently retired, spending more time with grandchildren, adjusting to a new routine.",
      },
      {
        id: "listener",
        label: "Younger Friend",
        npc: "A friend in her 30s catching up over dinner.",
      },
    ],
  },
  {
    id: "joke",
    title: "Tell a Joke",
    desc: "Jokes back and forth — some are funny, some aren't, and the real skill is knowing how to react in a classroom.",
    img: "/convo-img/joke.jpg",
    thumb: "/convo-img/thumbs/joke.webp",
    video: "/convo-vid/joke.mp4",
    more: `• Two classmates and friends sharing humor between assignments in their English class

• Difficulties: timing when telling jokes · moving on when a joke doesn't work · understanding humor in a second language

• Objectives: knowing when to deliver the funny part · natural reactions · playful language · phrases for when a joke doesn't work`,
    roles: [
      {
        id: "joker",
        label: "Classmate A",
        npc: "A classmate in his 20s who always has a joke ready. Some are funny, some aren't.",
      },
      {
        id: "audience",
        label: "Classmate B",
        npc: "A classmate in his 20s sharing in the humor between classes.",
      },
    ],
  },
  {
    id: "lifeguard",
    title: "Beach Emergency",
    desc: "An injury on the beach — someone got hurt, a lifeguard is on the scene, and the situation needs attention.",
    img: "/convo-img/lifeguard.webp",
    thumb: "/convo-img/thumbs/lifeguard.webp",
    video: "/convo-vid/lifeguard.mp4",
    more: `• On the beach — someone has a leg injury and the lifeguard has come over to help

• Difficulties: talking about a medical issue · following instructions about what to do next · speaking clearly when time matters

• Objectives: sharing or getting the right information · describing what happened · first-aid terms and how injuries are described`,
    roles: [
      {
        id: "visitor",
        label: "Injured Swimmer",
        npc: "A young man in his 20s who got hurt in the water.",
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
    desc: "A neighborhood sidewalk — a mail carrier delivering mail and a resident with a question about a delivery.",
    img: "/convo-img/mail.jpg",
    thumb: "/convo-img/thumbs/mail.webp",
    video: "/convo-vid/mail.mp4",
    more: `• A brief exchange with someone on the job — the kind of short, polite interaction that happens every day but still takes the right words

• Difficulties: knowing how to ask clear questions · postal terms they don't know · being polite and respectful with a service worker

• Objectives: focused questions · short and polite exchanges · postal and shipping words · the right level of formal or casual speech`,
    roles: [
      {
        id: "sender",
        label: "Resident",
        npc: "A woman in her 60s with a question about a delivery.",
      },
      {
        id: "clerk",
        label: "Mail Carrier",
        npc: "A mail carrier in her 40s on her regular route.",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking Event",
    desc: "A professional event where meeting new people can lead to real opportunities.",
    img: "/convo-img/networking.webp",
    thumb: "/convo-img/thumbs/networking.webp",
    video: "/convo-vid/networking.mp4",
    more: `• Professional event — introductions, first impressions, and a decision about whether to share contact information

• Difficulties: having trouble with self-introductions · gaps in the conversation · not knowing when to wrap up · being friendly while staying professional

• Objectives: a short self-introduction · professional small talk · a polite ending · phrases for staying in touch · work-related words and phrases`,
    roles: [
      {
        id: "newcomer",
        label: "Young Professional",
        npc: "A young professional in her mid-20s at her first networking event.",
      },
      {
        id: "veteran",
        label: "Veteran",
        npc: "A senior professional in his 40s with 15 years in the field.",
      },
    ],
  },
  {
    id: "parking",
    title: "Parking Ticket Situation",
    desc: "A parking ticket, an officer still nearby, and two different sides of the same story.",
    img: "/convo-img/parking.webp",
    thumb: "/convo-img/thumbs/parking.webp",
    video: "/convo-vid/parking.mp4",
    more: `• Parking spot — a ticket on the windshield, the enforcement officer still nearby

• Difficulties: sticking to the facts · using excuses instead of questions · not knowing how to challenge the ticket

• Objectives: telling what happened · being believable · accepting the result · asking what happens next · keeping the right tone`,
    roles: [
      {
        id: "driver",
        label: "Driver",
        npc: "A driver in her 30s who just found a ticket on the windshield. Wants to understand the appeals process.",
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
    title: "Police Officer Interaction",
    desc: "A car pulled over on the side of the road — an officer at the window and questions on both sides.",
    img: "/convo-img/police.webp",
    thumb: "/convo-img/thumbs/police.webp",
    video: "/convo-vid/police.mp4",
    more: `• A high-pressure moment where saying the right thing matters — the interaction is formal, fast, and unfamiliar

• Difficulties: understanding the reason for the stop · sticking to the facts under pressure · legal and official words they don't know

• Objectives: giving direct answers · asking when something is not clear · following instructions`,
    roles: [
      {
        id: "citizen",
        label: "Driver",
        npc: "A woman in her 30s who is stopped at the side of the road.",
      },
      {
        id: "officer",
        label: "Officer",
        npc: "A police officer in his 40s at the side of the road.",
      },
    ],
  },
  {
    id: "shopping",
    title: "Shopping Assistance",
    desc: "A clothing store visit where sizes, style choices, and extra offers are all part of the conversation.",
    img: "/convo-img/shopping.jpg",
    thumb: "/convo-img/thumbs/shopping.webp",
    video: "/convo-vid/shopping.mp4",
    more: `• Clothing store — a gift to buy, sizes to figure out, and an associate with suggestions

• Difficulties: not knowing sizes in another system · responding to extra offers · describing what they want

• Objectives: saying no to offers · describing what they like · clothing, fabric, and store terms · making a decision`,
    roles: [
      {
        id: "shopper",
        label: "Shopper",
        npc: "Someone in her 30s looking for a gift. Unsure about sizes or what the recipient would like.",
      },
      {
        id: "associate",
        label: "Sales Associate",
        npc: "A clothing store associate in his 50s who knows the product line well.",
      },
    ],
  },
  {
    id: "student",
    title: "Talk to Your Teacher",
    desc: "An after-class conversation between a student who stayed behind and a professor with limited time.",
    img: "/convo-img/student.webp",
    thumb: "/convo-img/thumbs/student.webp",
    video: "/convo-vid/student.mp4",
    more: `• A quick window to get help — the clock is ticking, and the question needs to be clear enough to get a useful answer

• Difficulties: not knowing how to ask the right question · unclear questions · limited time

• Objectives: explaining what is not clear · asking focused questions · the right level of formal or casual speech`,
    roles: [
      {
        id: "student",
        label: "Student",
        npc: "A college student in his early 20s who stayed after class. Wants to ask about a concept he missed.",
      },
      {
        id: "teacher",
        label: "Teacher",
        npc: "A college professor in her 50s wrapping up after class. Available for a few minutes between classes.",
      },
    ],
  },
  {
    id: "technology",
    title: "Tech Support Problem",
    desc: "A tech store visit — a device that isn't working correctly and a store employee ready to help fix the problem.",
    img: "/convo-img/technology.webp",
    thumb: "/convo-img/thumbs/technology.webp",
    video: "/convo-vid/technology.mp4",
    more: `• Electronics store — a customer brings in a device that is broken and a store employee explains the options

• Difficulties: describing the problem in detail · product names they don't know · following step-by-step instructions

• Objectives: describing what's happening · making sense of advice · asking when something is not clear`,
    roles: [
      {
        id: "user",
        label: "Customer",
        npc: "A woman in her 50s whose tablet isn't working right.",
      },
      {
        id: "support",
        label: "Store Employee",
        npc: "A store employee in her 20s who knows the product line.",
      },
    ],
  },
  {
    id: "understanding",
    title: "Clear Up a Misunderstanding",
    desc: "A bus ride, a question for the driver, and an answer that wasn't understood the first time.",
    img: "/convo-img/understanding.webp",
    thumb: "/convo-img/thumbs/understanding.webp",
    video: "/convo-vid/understanding.mp4",
    more: `• On a city bus — a passenger approaches the driver with a question about the route

• Difficulties: road noise · stop names they don't know · following directions the first time

• Objectives: asking for repetition · confirming a destination · following spoken directions`,
    roles: [
      {
        id: "clarifier",
        label: "Bus Driver",
        npc: "A bus driver in her 40s on a regular shift.",
      },
      {
        id: "confused",
        label: "Passenger",
        npc: "A woman in her 30s on an unfamiliar bus route.",
      },
    ],
  },
  {
    id: "videocall",
    title: "Video Call with a Colleague",
    desc: "A scheduled video call between remote colleagues — updates to share, questions to answer, and next steps to confirm.",
    img: "/convo-img/videocall.webp",
    thumb: "/convo-img/thumbs/videocall.webp",
    video: "",
    more: `• A professional conversation where the technology adds its own layer of difficulty — lag, interruptions, and the missing energy of being in the same room

• Difficulties: talking over each other · going off-topic · forgetting to confirm next steps · talking through a screen instead of face-to-face

• Objectives: giving clear updates · getting back on track after an interruption · professional ways to end the call · knowing how video calls work`,
    roles: [
      {
        id: "presenter",
        label: "Presenter",
        npc: "A colleague in her 20s with a lot to report.",
      },
      {
        id: "listener",
        label: "Colleague",
        npc: "A remote colleague in her 40s running the call.",
      },
    ],
  },
  {
    id: "hiking",
    title: "Chat on a Winter Hike",
    desc: "Walk and talk — a slow, easy conversation between friends on a winter trail.",
    img: "/convo-img/hiking.webp",
    thumb: "/convo-img/thumbs/hiking.webp",
    video: "",
    more: `• Two friends walking a winter trail — no agenda, no rush, just whatever comes to mind

• Difficulties: filling silence · having nothing left to talk about · one-word responses

• Objectives: sharing casual opinions · talking about what's around them · going at a comfortable speed · changing the subject naturally`,
    roles: [
      {
        id: "hiker",
        label: "Hiker",
        npc: "A friend in his 30s on the trail.",
      },
      {
        id: "guide",
        label: "Trail Guide",
        npc: "A close friend in her 30s on a familiar trail.",
      },
    ],
  },
];