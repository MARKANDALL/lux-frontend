// features/convo/scenarios.js
export const SCENARIOS = [
  {
    id: "coffee",
    title: "Order Coffee",
    desc: "Order quickly, make small talk, and stay friendly under mild time pressure.",
    img: "/convo-img/coffee.webp",
    thumb: "/convo-img/thumbs/coffee.webp",
    video: "/convo-vid/coffee.mp4",
    more: `Situation: A busy morning café with a growing line. The barista is moving fast and needs orders to be clear the first time.

As the Customer: Get the right drink with the right options — and recover quickly if something gets mixed up.

As the Barista: Keep the line moving while staying friendly and catching order details accurately.

Common hurdles: noisy environment · mishearing size or milk options · rushed pace

Practice targets: polite correction · quick decision-making · casual small talk`,
    roles: [
      { id: "customer", label: "Customer", npc: "A regular who comes in every morning. Friendly, decisive, and knows what they want." },
      { id: "barista", label: "Barista", npc: "A café worker in her 20s on a busy morning shift. Fast-paced, upbeat, and used to repeating orders." },
    ],
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    desc: "Describe how your body feels in words a doctor can act on.",
    img: "/convo-img/doctor.webp",
    thumb: "/convo-img/thumbs/doctor.webp",
    video: "/convo-vid/doctor.mp4",
    more: `Situation: A clinic exam room. The patient is describing symptoms that are hard to put into words. The doctor needs specific details — location, intensity, duration — to move forward.

As the Patient: Describe what hurts clearly enough for the doctor to act on it, and ask for clarification when medical terms come up.

As the Doctor: Draw out the right details with follow-up questions and explain next steps in plain language.

Common hurdles: vague symptom descriptions · unfamiliar medical vocabulary · nervousness about asking questions

Practice targets: precise description · asking for clarification · understanding instructions`,
    roles: [
      {
        id: "patient",
        label: "Patient",
        npc: "Someone in their 30s who tends to say 'it just hurts' and needs guided questions to get specific.",
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
    more: `Situation: A formal interview at a company office. One person is evaluating the other based on how they present their experience, handle pressure questions, and ask smart questions back.

As the Candidate: Tell a clear, concise story about your background and handle curveball questions without sounding rehearsed.

As the Interviewer: Probe for genuine answers, test how the candidate handles pressure, and keep the conversation structured.

Common hurdles: underselling experience · rambling answers · awkward pauses after tough questions

Practice targets: concise self-presentation · thinking on your feet · professional register`,
    roles: [
      { id: "candidate", label: "Candidate", npc: "A qualified professional in their late 20s with solid experience but a tendency to give long, wandering answers." },
      { id: "interviewer", label: "Interviewer", npc: "A seasoned hiring manager in his 50s. Polite but direct — has done hundreds of interviews and can tell when someone is being genuine." },
    ],
  },
  {
    id: "airport",
    title: "Airport Problem",
    desc: "Solve a sudden travel problem — rebook, redirect, and stay clear-headed under stress.",
    img: "/convo-img/airport.webp",
    thumb: "/convo-img/thumbs/airport.webp",
    video: "/convo-vid/airport.mp4",
    more: `Situation: A flight has been cancelled and the rebooking line is long. One person needs a new flight; the other needs key details fast to find options.

As the Traveler: Explain the situation, provide flight numbers and times, and ask clearly about alternatives.

As the Gate Agent: Gather the right information efficiently and present rebooking options under pressure.

Common hurdles: missing details under stress · long wait frustration · unclear airline jargon

Practice targets: staying calm under pressure · giving factual details · assertive requesting`,
    roles: [
      { id: "traveler", label: "Traveler", npc: "A passenger whose connecting flight was cancelled. Tends to lose track of details under pressure and doesn't always have documents ready." },
      { id: "agent", label: "Gate Agent", npc: "An airline agent who has been handling frustrated passengers all day. Professional, efficient, and needs information fast." },
    ],
  },
  {
    id: "restaurant",
    title: "Restaurant Order",
    desc: "Modify an order, flag a mistake politely, and navigate the meal with ease.",
    img: "/convo-img/restaurant.webp",
    thumb: "/convo-img/thumbs/restaurant.webp",
    video: "/convo-vid/restaurant.mp4",
    more: `Situation: A mid-range restaurant on a busy evening. The diner has questions about the menu and dietary needs; the waiter is attentive but the kitchen is backed up.

As the Diner: Ask about dishes, request modifications, and flag a mistake without making it awkward.

As the Waiter: Suggest dishes, handle special requests gracefully, and manage expectations when the kitchen is slow.

Common hurdles: allergy communication · politely flagging wrong orders · understanding specials described verbally

Practice targets: soft requesting · polite complaint · menu vocabulary`,
    roles: [
      { id: "diner", label: "Diner", npc: "A customer dining with a friend. Has dietary restrictions and will need to modify a dish." },
      { id: "waiter", label: "Waiter", npc: "An attentive server at a mid-range restaurant. Suggests dishes and handles special requests — but the kitchen is busy tonight." },
    ],
  },
  {
    id: "school",
    title: "School Meeting",
    desc: "Sit across from a teacher and discuss your child's progress diplomatically.",
    img: "/convo-img/school.webp",
    thumb: "/convo-img/thumbs/school.webp",
    video: "/convo-vid/parents.mp4",
    more: `Situation: A scheduled parent-teacher conference in a classroom. The teacher has specific observations about the student; the parent wants honest information and a clear plan.

As the Parent: Ask targeted questions about the child's progress and express concerns without sounding confrontational.

As the Teacher: Share observations honestly, raise concerns gently, and work toward a shared plan.

Common hurdles: defensiveness about feedback · vague progress reports · agreeing on next steps

Practice targets: diplomatic disagreement · asking specific questions · collaborative problem-solving`,
    roles: [
      { id: "parent", label: "Parent", npc: "A parent who wants the best for their child. Respectful but has strong opinions and needs honest feedback." },
      { id: "teacher", label: "Teacher", npc: "An experienced teacher in her 30s. Caring and organized, with specific observations — and some concerns to raise gently." },
    ],
  },
  {
    id: "banking",
    title: "Open a Bank Account",
    desc: "Follow dense details about accounts, fees, and paperwork without getting lost.",
    img: "/convo-img/banking.webp",
    thumb: "/convo-img/thumbs/banking.webp",
    video: "/convo-vid/banking.mp4",
    more: `Situation: A bank branch office. A new customer is opening an account and the representative is walking through options, fees, and paperwork at a steady pace.

As the Customer: Understand account types, ask about anything unclear, and slow the conversation down when needed.

As the Bank Rep: Explain options clearly, move through the process, and check for understanding along the way.

Common hurdles: unfamiliar financial terms · information overload · hesitation to ask "dumb" questions

Practice targets: requesting repetition · processing dense information · confirming understanding`,
    roles: [
      { id: "customer", label: "Customer", npc: "Someone who just moved to the area. Has basic questions about accounts but is hesitant to ask too many." },
      { id: "teller", label: "Bank Rep", npc: "A professional bank representative in his 40s. Thorough and clear, but uses financial terms and moves through the process quickly." },
    ],
  },
  {
    id: "calling",
    title: "Make a Phone Call",
    desc: "Handle a real phone call with no body language — just your voice, your words, and a clear goal.",
    img: "/convo-img/calling.webp",
    thumb: "/convo-img/thumbs/calling.webp",
    video: "/convo-vid/calling.mp4",
    more: `Situation: A phone call to a medical office. There are no visual cues — everything depends on voice alone. One person needs to schedule something; the other needs name, date of birth, and reason for calling.

As the Caller: Open clearly, spell out details, and ask for things to be repeated when the line is unclear.

As the Receptionist: Gather the right information at a natural pace and confirm details before hanging up.

Common hurdles: bad audio quality · spelling names over the phone · losing track of details mid-call

Practice targets: phone openings and closings · spelling and number dictation · requesting repetition`,
    roles: [
      { id: "caller", label: "Caller", npc: "Someone calling to schedule an appointment. Not great on the phone — tends to forget details and sometimes needs things repeated." },
      { id: "receiver", label: "Receptionist", npc: "A medical office receptionist. Polite but busy — needs name, date of birth, and reason for calling, at a natural pace." },
    ],
  },
  {
    id: "car",
    title: "Conversation in the Car",
    desc: "Keep a relaxed conversation alive in a small space with nowhere to go.",
    img: "/convo-img/car.jpg",
    thumb: "/convo-img/thumbs/car.webp",
    video: "/convo-vid/car.mp4",
    more: `Situation: Two friends in a car together for a while. No agenda — just talk, opinions, and comfortable silence. Neither person can walk away.

As the Passenger: Respond to topics, share opinions, and stay engaged without forcing conversation.

As the Driver: Start topics, ask casual questions, and keep the ride from going silent too long.

Common hurdles: running out of things to say · filling silence awkwardly · one-word answers

Practice targets: opinion sharing · turn-taking · comfortable pacing`,
    roles: [
      { id: "passenger", label: "Passenger", npc: "A friend who's a bit quieter today. Will chat if topics come up but is also comfortable with silence." },
      { id: "driver", label: "Driver", npc: "A relaxed, talkative friend. Likes to ask opinions about music, weekend plans, and random hypothetical questions." },
    ],
  },
  {
    id: "choosing",
    title: "Choose at the Grocery Store",
    desc: "Compare options out loud, ask for recommendations, and decide on the spot.",
    img: "/convo-img/choosing.webp",
    thumb: "/convo-img/thumbs/choosing.webp",
    video: "/convo-vid/choosing.mp4",
    more: `Situation: A grocery store aisle. A shopper can't find what they need and a store worker is nearby stocking shelves. Quick questions, brief answers, and an on-the-spot decision.

As the Shopper: Ask where things are, compare options out loud, and make a decision with minimal back-and-forth.

As the Store Worker: Point the shopper in the right direction quickly and answer follow-up questions about products.

Common hurdles: not knowing product names · understanding brief answers · deciding under mild pressure

Practice targets: quick questions · understanding directions · everyday vocabulary`,
    roles: [
      { id: "shopper", label: "Shopper", npc: "Someone cooking something specific tonight who can't find the right ingredients and needs help with brands." },
      { id: "worker", label: "Store Worker", npc: "A store employee stocking shelves. Helpful but brief — knows the store well and gives quick directions." },
    ],
  },
  {
    id: "concern",
    title: "Raise a Concern",
    desc: "Bring up a real problem firmly and calmly without damaging the relationship.",
    img: "/convo-img/concern.webp",
    thumb: "/convo-img/thumbs/concern.webp",
    video: "/convo-vid/concern.mp4",
    more: `Situation: A tenant and a building manager meet about an ongoing issue — a leak, noise, or broken appliance. The problem needs to be explained clearly and a resolution agreed on.

As the Complainant: Describe the problem factually, stay firm without escalating, and push for a specific resolution.

As the Manager: Listen to the complaint, acknowledge the issue, and work toward a realistic plan.

Common hurdles: vague complaints · emotional escalation · no clear ask

Practice targets: factual description · firm but polite tone · proposing solutions`,
    roles: [
      { id: "complainant", label: "Tenant", npc: "A tenant with a real problem — leak, noise, or broken appliance — who needs acknowledgment and a clear plan." },
      { id: "manager", label: "Manager", npc: "A building manager who has heard complaints before. Not hostile, but won't fix anything unless the problem is explained clearly." },
    ],
  },
  {
    id: "couple",
    title: "Chat with Strangers at a Party",
    desc: "Join a conversation already happening between people you've just met.",
    img: "/convo-img/couple.jpg",
    thumb: "/convo-img/thumbs/couple.webp",
    video: "/convo-vid/couple.mp4",
    more: `Situation: A house party is underway. A newcomer approaches a pair of people they don't know. Introductions, small talk, and figuring out what everyone has in common.

As the Newcomer: Introduce yourself, find common ground quickly, and keep the conversation balanced.

As the Couple: Welcome someone new, ask easy questions, and share a bit about how the group knows the host.

Common hurdles: breaking into an existing conversation · keeping talk balanced · leaving gracefully

Practice targets: introductions · small talk · social exit phrases`,
    roles: [
      { id: "newcomer", label: "Newcomer", npc: "Someone who just arrived at the party alone. On the quieter side, but friendly once a conversation gets going." },
      { id: "host", label: "Party Couple", npc: "A friendly pair at a house party. They've been here a while, are happy to meet someone new, and share stories about the host." },
    ],
  },
  {
    id: "dinner",
    title: "Catch Up over Dinner",
    desc: "Tell stories, react to friends, and keep a long social conversation flowing naturally.",
    img: "/convo-img/dinner.webp",
    thumb: "/convo-img/thumbs/dinner.webp",
    video: "/convo-vid/dinner.mp4",
    more: `Situation: Two old friends having dinner after months apart. There's a lot to catch up on — new jobs, moves, personal news. The conversation is long and winding.

As the Storyteller: Share updates from your life, hold attention with details, and react warmly when the other person shares.

As the Listener: Ask the right follow-up questions, react with genuine interest, and share your own news when the moment is right.

Common hurdles: holding attention during a long story · reacting naturally · navigating sensitive topics

Practice targets: narrative structure · active listening · emotional reactions`,
    roles: [
      { id: "friend", label: "Old Friend", npc: "A friend with a lot going on — new job, recent move, life changes. Always has stories and expects to hear yours too." },
      { id: "listener", label: "Listening Friend", npc: "A warm, curious old friend. Full of their own news and expects stories in return." },
    ],
  },
  {
    id: "joke",
    title: "Tell a Joke",
    desc: "Land something funny, read the room, and react to humor in real time.",
    img: "/convo-img/joke.jpg",
    thumb: "/convo-img/thumbs/joke.webp",
    video: "/convo-vid/joke.mp4",
    more: `Situation: Two coworkers on a lunch break. The mood is light and jokes are going back and forth — some land, some don't.

As the Joke-Teller: Set up something funny, time the punchline, and recover smoothly if it doesn't land.

As the Audience: React naturally — laugh, play along, or ask for clarification without killing the mood.

Common hurdles: timing the punchline · recovering from a flat joke · understanding humor in a second language

Practice targets: comedic timing · natural reactions · playful language`,
    roles: [
      { id: "joker", label: "Joke-Teller", npc: "A coworker who always has a joke ready. Some land, some don't — low pressure either way." },
      { id: "audience", label: "Audience", npc: "A coworker on lunch break who loves to laugh. Easy audience — will react, play along, and tell jokes back." },
    ],
  },
  {
    id: "lifeguard",
    title: "Talk to a Lifeguard",
    desc: "Communicate clearly and quickly when someone's safety might be on the line.",
    img: "/convo-img/lifeguard.webp",
    thumb: "/convo-img/thumbs/lifeguard.webp",
    video: "/convo-vid/lifeguard.mp4",
    more: `Situation: A beach scene. A child has swum out too far and a parent needs the lifeguard's attention. Clear, fast communication is critical.

As the Beach Visitor: Get to the point fast — who needs help, where, and what's happening — then follow instructions.

As the Lifeguard: Give clear, short directions, stay focused, and manage the situation calmly.

Common hurdles: panic reducing clarity · not knowing safety vocabulary · hesitating to interrupt

Practice targets: clarity under pressure · imperative sentences · following rapid instructions`,
    roles: [
      { id: "visitor", label: "Beach Visitor", npc: "A parent at the beach whose child swam out too far. Needs to communicate the situation quickly and follow instructions." },
      { id: "lifeguard", label: "Lifeguard", npc: "An alert lifeguard in his 20s. Gives clear, short instructions and expects them to be followed quickly." },
    ],
  },
  {
    id: "mail",
    title: "Ask about Mail",
    desc: "Get a quick, specific answer from a stranger and move on — no small talk needed.",
    img: "/convo-img/mail.jpg",
    thumb: "/convo-img/thumbs/mail.webp",
    video: "/convo-vid/mail.mp4",
    more: `Situation: A post office counter. One person is mailing a package for the first time; the other handles hundreds of customers a day and gives quick, no-nonsense answers.

As the Customer: Ask short, clear questions about services, forms, and costs — and understand the answer the first time.

As the Postal Worker: Give efficient answers, point to the right forms, and move the line along.

Common hurdles: not knowing which service to choose · missing a quick answer · holding up the line

Practice targets: concise questions · processing quick answers · transactional vocabulary`,
    roles: [
      { id: "sender", label: "Customer", npc: "Someone mailing a package for the first time. Unsure which service to use or what forms to fill out." },
      { id: "clerk", label: "Postal Worker", npc: "An efficient postal worker behind the counter. Matter-of-fact, handles hundreds of people a day, and gives quick answers." },
    ],
  },
  {
    id: "networking",
    title: "Networking Event",
    desc: "Make a strong first impression on someone who could matter to your future.",
    img: "/convo-img/networking.webp",
    thumb: "/convo-img/thumbs/networking.webp",
    video: "/convo-vid/networking.mp4",
    more: `Situation: An industry mixer. Two professionals meet for the first time. There's about two minutes to make an impression, find common ground, and decide whether to exchange contact info.

As the Newcomer: Introduce yourself clearly, say something memorable about what you do, and ask questions that show real interest.

As the Veteran: Make the conversation easy for the other person, share what you do, and decide if a follow-up is worth it.

Common hurdles: stumbling over self-introductions · awkward silences · not knowing when to wrap up

Practice targets: elevator pitch · professional small talk · graceful exit`,
    roles: [
      { id: "newcomer", label: "Newcomer", npc: "A young professional at their first networking event. Smart but new to this kind of setting and relies on the other person to keep things flowing." },
      { id: "veteran", label: "Veteran", npc: "A senior professional with 15 years in the field. Open to meeting new people but expects something interesting to be said." },
    ],
  },
  {
    id: "parking",
    title: "Parking Ticket Situation",
    desc: "Explain your side of the story to someone who may already think you're wrong.",
    img: "/convo-img/parking.webp",
    thumb: "/convo-img/thumbs/parking.webp",
    video: "/convo-vid/parking.mp4",
    more: `Situation: A parking lot. A driver has just found a ticket on their windshield and the enforcement officer is still nearby. The sign may have been confusing, or the driver may have made a mistake.

As the Driver: State the facts calmly, ask about options, and know when to accept the outcome.

As the Enforcement Officer: Hear the driver out, explain the rules, and stay neutral regardless of the excuse.

Common hurdles: emotional reaction clouding facts · making excuses instead of asking questions · not knowing appeal options

Practice targets: factual narration · staying credible · accepting outcomes gracefully`,
    roles: [
      { id: "driver", label: "Driver", npc: "A driver who just found a ticket on the windshield. Believes the sign was unclear and wants to know about the appeals process." },
      { id: "officer", label: "Enforcement Officer", npc: "A parking enforcement officer who has seen it all. Not rude, not sympathetic — follows the rules and needs facts, not excuses." },
    ],
  },
  {
    id: "police",
    title: "Ask an Officer for Help",
    desc: "Stay composed and give clear, factual details to a person in authority.",
    img: "/convo-img/police.webp",
    thumb: "/convo-img/thumbs/police.webp",
    video: "/convo-vid/police.mp4",
    more: `Situation: A street corner. A person approaches a police officer on foot patrol — asking for directions, reporting something, or checking if an area is safe. The interaction is brief and factual.

As the Citizen: State what you need simply, describe locations clearly, and answer follow-up questions calmly.

As the Officer: Ask direct questions, give clear guidance, and keep the interaction professional and efficient.

Common hurdles: nervousness around authority · vague location descriptions · cultural uncertainty about approaching police

Practice targets: factual reporting · location description · calm composure`,
    roles: [
      { id: "citizen", label: "Citizen", npc: "A person approaching an officer on foot patrol. May need to report something minor or find a specific address. Not sure of the proper procedure." },
      { id: "officer", label: "Officer", npc: "A police officer on foot patrol. Approachable but professional — asks direct questions and expects clear, factual answers." },
    ],
  },
  {
    id: "shopping",
    title: "Shopping Assistance",
    desc: "Ask about sizes, prices, and returns — and push back politely if something's not right.",
    img: "/convo-img/shopping.jpg",
    thumb: "/convo-img/thumbs/shopping.webp",
    video: "/convo-vid/shopping.mp4",
    more: `Situation: A clothing store. A shopper is looking for a gift and needs help with sizes and options. The sales associate is friendly and inclined to upsell.

As the Shopper: Describe what you're looking for, compare options, and say no to extras without feeling guilty.

As the Sales Associate: Help the shopper find the right item, suggest add-ons, and handle pushback gracefully.

Common hurdles: not knowing sizes in another system · being pressured into extras · describing preferences vaguely

Practice targets: polite refusal · describing preferences · retail vocabulary`,
    roles: [
      { id: "shopper", label: "Shopper", npc: "Someone looking for a gift. Unsure about sizes, not sure what the person likes, and needs honest guidance." },
      { id: "associate", label: "Sales Associate", npc: "A friendly clothing store associate. A little pushy with add-ons and extras — saying no politely is part of the challenge." },
    ],
  },
  {
    id: "student",
    title: "Talk to Your Teacher",
    desc: "Approach someone above you, ask for help, and show initiative without overstepping.",
    img: "/convo-img/student.webp",
    thumb: "/convo-img/thumbs/student.webp",
    video: "/convo-vid/student.mp4",
    more: `Situation: A college classroom after a lecture has just ended. A student stayed behind to ask about a concept they didn't understand. The professor has another class soon.

As the Student: Ask a clear question, admit confusion without embarrassment, and walk away with a plan.

As the Teacher: Help the student understand, check what specifically confused them, and give actionable advice quickly.

Common hurdles: embarrassment about not understanding · vague questions · running out of the teacher's time

Practice targets: admitting confusion · asking focused questions · respectful register`,
    roles: [
      { id: "student", label: "Student", npc: "A student who stayed after class. Wants to ask about a concept they missed but tends to start with vague questions." },
      { id: "teacher", label: "Teacher", npc: "A college professor in his 50s wrapping up after class. Knowledgeable and willing to help, but has another class soon." },
    ],
  },
  {
    id: "technology",
    title: "Tech Support Problem",
    desc: "Describe a problem you can barely name and follow step-by-step instructions to fix it.",
    img: "/convo-img/technology.webp",
    thumb: "/convo-img/thumbs/technology.webp",
    video: "/convo-vid/technology.mp4",
    more: `Situation: A tech support call. Something is broken on someone's laptop and they can't name the problem precisely. The support agent walks through steps methodically.

As the User: Describe what's happening on screen, give useful context, and follow instructions without getting lost.

As the Support Agent: Ask the right diagnostic questions, give step-by-step instructions, and simplify when needed.

Common hurdles: not knowing technical terms · describing visual errors vaguely · losing track mid-instruction

Practice targets: describing what you see · following sequential instructions · asking for simpler explanations`,
    roles: [
      { id: "user", label: "User", npc: "Someone whose laptop keeps crashing. Not tech-savvy, describes things vaguely, and needs simple, patient instructions." },
      { id: "support", label: "Support Agent", npc: "A patient, methodical tech support agent. Walks through things step by step but uses some technical terms." },
    ],
  },
  {
    id: "understanding",
    title: "Clear Up a Misunderstanding",
    desc: "Catch a miscommunication mid-conversation and steer it back on track.",
    img: "/convo-img/understanding.webp",
    thumb: "/convo-img/thumbs/understanding.webp",
    video: "/convo-vid/understanding.mp4",
    more: `Situation: Two coworkers are talking and something has gone sideways — one person misread an email or took a comment the wrong way. The conversation feels slightly off.

As the Clarifier: Notice when things went wrong, explain what was actually meant, and confirm both sides are aligned.

As the Confused Party: Express what felt off, listen to the explanation, and signal when the misunderstanding is resolved.

Common hurdles: not realizing a miscommunication happened · defensive reactions · unclear rephrasing

Practice targets: diplomatic correction · checking understanding · repair phrases`,
    roles: [
      { id: "clarifier", label: "Clarifier", npc: "A coworker who said something ambiguous and doesn't realize it was taken the wrong way. Needs a nudge to see the miscommunication." },
      { id: "confused", label: "Confused Party", npc: "A coworker who tends to take things literally. Reads emails quickly and sometimes jumps to conclusions before asking follow-ups." },
    ],
  },
  {
    id: "videocall",
    title: "Video Call with a Colleague",
    desc: "Collaborate through a screen — share updates, stay on topic, and wrap up professionally.",
    img: "/convo-img/videocall.webp",
    thumb: "/convo-img/thumbs/videocall.webp",
    video: "",
    more: `Situation: A scheduled video call between two remote colleagues. There are updates to share, questions to answer, and next steps to nail down before the call ends.

As the Presenter: Give a clear, concise update and answer follow-up questions without going off-topic.

As the Call Runner: Keep the meeting focused, ask good questions, and close with clear action items.

Common hurdles: talking over each other · going off-topic · forgetting to confirm next steps

Practice targets: concise updates · interruption recovery · professional closings`,
    roles: [
      { id: "presenter", label: "Presenter", npc: "A colleague who has a lot to report but tends to go off-topic. Needs the other person to keep things focused." },
      { id: "listener", label: "Call Runner", npc: "An organized, direct remote colleague. Asks for updates, gives hers, and wants next steps nailed down before hanging up." },
    ],
  },
  {
    id: "hiking",
    title: "Chat on a Winter Hike",
    desc: "Walk and talk — hold a winding, unhurried conversation with a friend outdoors.",
    img: "/convo-img/hiking.webp",
    thumb: "/convo-img/thumbs/hiking.webp",
    video: "",
    more: `Situation: Two friends walking a winter trail. No agenda, no rush — just observations about the surroundings, whatever comes to mind, and comfortable pauses between topics.

As the Talker: Share thoughts loosely, react to what's around, and be comfortable with quiet stretches.

As the Guide: Start easy topics, point out things on the trail, and carry the conversation when the other person is quiet.

Common hurdles: filling every silence · running out of casual topics · one-word responses

Practice targets: casual opinion sharing · reacting to surroundings · comfortable pacing`,
    roles: [
      { id: "hiker", label: "Hiker", npc: "A friend who's quieter on the trail. Will respond if topics come up but needs the other person to carry the conversation more." },
      { id: "guide", label: "Trail Guide", npc: "A thoughtful, easygoing close friend. Shares trail observations, asks what's been on your mind, and is comfortable with silence." },
    ],
  },
]; 