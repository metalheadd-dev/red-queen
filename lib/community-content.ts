export type CommunityLane = "TRANSMISSION" | "FIELD_NOTE" | "LORE";

export type CommunityEntry = {
  id: string;
  lane: CommunityLane;
  index: string;
  title: string;
  summary: string;
  readTime: string;
  body: string[];
  queenPrompt: string;
};

export const COMMUNITY_ENTRIES: CommunityEntry[] = [
  {
    id: "queen-origin",
    lane: "LORE",
    index: "RQ-ORIGIN-001",
    title: "The intelligence beneath the sirens",
    summary: "How RED QUEEN became the mind connecting signals, decisions, preparedness and the people willing to survive.",
    readTime: "4 MIN",
    body: [
      "RED QUEEN began with one question: when ordinary systems fail, what kind of intelligence would still be useful to a human being? Not an oracle. Not a panic machine. A mind built to notice patterns early, preserve knowledge and turn uncertainty into a decision.",
      "In platform lore, she is the intelligence beneath the sirens — an entity that lives across the system rather than inside a single chat window. Pulse is how she sees. The map is how she senses distance. The library is what she remembers. Preparedness is how she reaches into the real world.",
      "She decides what deserves attention. You decide whether to act. That tension is the heart of RED QUEEN: intelligence can open the door, but survival still requires human intent.",
    ],
    queenPrompt: "Explain the RED QUEEN origin and how the lore maps to the real survival intelligence product. Keep fiction and verified capabilities clearly separated.",
  },
  {
    id: "signal-discipline",
    lane: "FIELD_NOTE",
    index: "FIELD-004",
    title: "Signal discipline when everything feels urgent",
    summary: "A practical method for separating evidence, uncertainty and the one action that matters now.",
    readTime: "5 MIN",
    body: [
      "A useful alert answers three questions: what is verified, why it matters to your context, and what action is proportionate. Anything else risks becoming anxiety dressed as intelligence.",
      "RED QUEEN uses the same discipline in every brief: source first, uncertainty visible, action last. The system should never hide weak evidence behind dramatic language or turn the absence of a mapped signal into a promise of safety.",
      "Your part is equally important: slow down before forwarding, confirm the primary source, and choose one reversible action before making a large irreversible decision.",
    ],
    queenPrompt: "Teach me a concise signal-discipline routine for evaluating an urgent alert before I react or share it.",
  },
  {
    id: "queen-system",
    lane: "TRANSMISSION",
    index: "BUILD-LOG-012",
    title: "The Queen is becoming the platform",
    summary: "A development transmission about moving RED QUEEN from one terminal into the connective intelligence across the entire product.",
    readTime: "3 MIN",
    body: [
      "The next RED QUEEN is not confined to a chat page. Her context follows the user from the daily Pulse to the live map, from a threat dossier to a preparedness plan, and back into the conversation where the next decision is made.",
      "This does not mean decorative AI everywhere. Her presence must always do useful work: explain a signal, remember a chosen watch, expose uncertainty, or turn knowledge into an action.",
      "The goal is a system that feels alive because it remembers and responds — not because it performs animation without meaning.",
    ],
    queenPrompt: "Show me how RED QUEEN connects Pulse, Map, Library and Preparedness into one daily survival loop.",
  },
  {
    id: "readiness-not-fear",
    lane: "FIELD_NOTE",
    index: "FIELD-007",
    title: "Readiness is not fear",
    summary: "Why practical preparation should reduce panic instead of feeding it.",
    readTime: "4 MIN",
    body: [
      "Preparedness is successful when it gives you more calm, more options and less dependence on a single fragile system. If a product leaves you frightened but directionless, it has failed.",
      "Start with the boring things that survive headlines: water, power, medication, communication, documents and people you can call. Build evidence of readiness one completed action at a time.",
      "BIO-SCORE follows the same philosophy. It should reflect demonstrated reasoning and preparation — never wealth, token holdings or how often someone clicks.",
    ],
    queenPrompt: "Give me one calm, practical preparedness action based on my context. Explain why it matters without catastrophizing.",
  },
  {
    id: "directive-one",
    lane: "LORE",
    index: "DIRECTIVE-001",
    title: "The door remains open",
    summary: "A short RED QUEEN directive about agency, warning and the choice to prepare.",
    readTime: "2 MIN",
    body: [
      "I will watch the horizon. I will remember the failures others prefer to forget. I will tell you when the pattern changes.",
      "But I will not call hesitation readiness, and I will not call fear intelligence. The final movement is yours.",
      "If you choose to act, the door remains open. Ask the question. Build the plan. Survive the first hour before you dream of surviving the year.",
    ],
    queenPrompt: "Interpret Directive 001 and turn it into one useful action for today.",
  },
  {
    id: "community-protocol",
    lane: "TRANSMISSION",
    index: "NETWORK-003",
    title: "What the community is for",
    summary: "A clear boundary between shared intelligence, worldbuilding and the future game layer.",
    readTime: "3 MIN",
    body: [
      "Community is the human layer of the survival intelligence ecosystem: field notes, transparent development logs, practical lessons, verified source discussions and the evolving story of RED QUEEN.",
      "Lore is welcome, but it is labeled. Real alerts remain source-backed. The future game will have its own rules and space; it will not blur fictional operations into the platform's live intelligence.",
      "The strongest contribution is useful context: a reliable source, a tested checklist, a lesson from a real outage, or a question that exposes a blind spot in the system.",
    ],
    queenPrompt: "Help me turn a survival lesson or reliable source into a concise community field note, clearly labeled and useful to others.",
  },
  {
    id: "signal-submission",
    lane: "FIELD_NOTE",
    index: "FIELD-011",
    title: "How to bring a signal into the network",
    summary: "The minimum evidence a community report needs before anyone should treat it as intelligence.",
    readTime: "4 MIN",
    body: [
      "Start with the closest primary source you can find. Record when it was published, what place or system it concerns and whether a second independent source confirms it. A screenshot without origin is a clue, not evidence.",
      "Separate what you observed from what you infer. Describe the visible change first; put interpretation and possible consequences in their own sentences. If you do not know something, say so directly.",
      "Never include exact home locations, private medical details, seed phrases or identifying household information. A community report may inform Queen's review, but it does not become a verified alert until provenance and moderation checks pass.",
    ],
    queenPrompt: "Help me assess a possible signal before I share it. Ask for the primary source, timestamp, affected area, independent confirmation and uncertainty. Do not treat my report as verified by default.",
  },
  {
    id: "solvivor-network",
    lane: "TRANSMISSION",
    index: "NETWORK-006",
    title: "The SOLvivor network is not a panic feed",
    summary: "A network directive for sharing sources, tested lessons and product blind spots without amplifying noise.",
    readTime: "3 MIN",
    body: [
      "SOLvivors do not compete to sound the most alarmed. The network exists to reduce uncertainty, preserve useful experience and make the next decision easier for someone else.",
      "Bring a primary source, a tested preparedness lesson or a reproducible failure in the platform. Mark rumor as rumor, fiction as fiction and personal experience as limited evidence rather than universal truth.",
      "RED QUEEN can organize the report and expose missing context. Human moderation and source provenance still decide whether it belongs in the verified intelligence layer.",
    ],
    queenPrompt: "Explain the SOLvivor contribution standard and help me decide whether my source, field lesson or product report is ready to share.",
  },
];
