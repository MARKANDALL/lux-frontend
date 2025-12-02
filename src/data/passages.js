// passages.js
// Centralized passage arrays extracted from the original data.js

/* ---------- PASSAGES / PART ARRAYS ---------- */
export const rainbowParts = [
  "When the sunlight strikes raindrops in the air,",
  "they act like a prism and form a rainbow.",
  "The rainbow is a division of white light into many beautiful colors.",
  "These take the shape of a long, round arch,",
  "with its path high above, and its two ends apparently beyond the horizon.",
  "There is, according to legend, a boiling pot of gold at one end.",
  "People look, but no one ever finds it.",
  "When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.",
  "Others have tried to explain the phenomenon physically.",
  "Aristotle thought that the rainbow was caused by reflection of the sun's rays by the rain.",
  "Since then, physicists have found that it is not reflection, but refraction by the raindrops,",
  "which causes the rainbows.",
];

export const grandfatherParts = [
  "You wish to know all about my grandfather.",
  "Well, he is nearly ninety-three years old, yet he still thinks as swiftly as ever.",
  "He dresses himself in an old black frock coat, usually with several buttons missing.",
  "A long beard clings to his chin, giving those who observe him a pronounced feeling of respect.",
  "When he speaks, his voice is just a bit cracked and quivers a trifle.",
  "Twice each day, he plays skillfully and with zest upon a small organ.",
  "Except in the winter, when the snow or ice prevents, he slowly takes a short walk in the open air each day.",
  "We have often urged him to walk more and smoke less, but he always answers, No, you see, I am quite well.",
  "He likes to eat simple, wholesome food.",
  "He enjoys his pipe and his daily walks.",
  "Grandfather is a wonderful man.",
];

/* Minimal-pair sets */
export const minLRParts = [
  "light",
  "right",
  "glass",
  "grass",
  "collect",
  "correct",
];
export const minEEIHParts = ["sheep", "ship", "beat", "bit", "leave", "live"];
export const minAUAHParts = ["cap", "cup", "bat", "but", "bag", "bug"];

/* Targeted word list */
export const wordListParts = [
  "three",
  "think",
  "this",
  "street",
  "spring",
  "milk",
  "world",
  "advice",
  "leaves",
  "buzz",
];

/* Controlled sentences */
export const sentenceParts = [
  "Larry rarely reads really large red books.",
  "Three thin thieves thought they thrilled the throne.",
  "Sue saw six slippery snakes sliding south.",
];

/* Short paragraph */
export const shortStoryParts = [
  "Last Friday, Larry and Ruth went to a little park.",
  "They saw three red birds, six green frogs, and a group of small sheep.",
  "Larry thought the birds were really pretty, but Ruth liked the frogs best.",
  "They laughed and talked until it got dark.",
];

/* ---------- MASTER LOOKUP ---------- */
export const passages = {
  rainbow: { name: "Rainbow Passage", parts: rainbowParts },
  grandfather: { name: "Grandfather Passage", parts: grandfatherParts },

  /* tests */
  minLR: { name: "Phoneme Test: L vs R", parts: minLRParts },
  minEEIH: { name: "Phoneme Test: EE vs IH", parts: minEEIHParts },
  minAUAH: { name: "Phoneme Test: A vs U", parts: minAUAHParts },
  wordList: { name: "Challenging Word List", parts: wordListParts },
  sentences: { name: "Challenging Sentences", parts: sentenceParts },
  shortStory: { name: "Short Story Practice", parts: shortStoryParts },
};
