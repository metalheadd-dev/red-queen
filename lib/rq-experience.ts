import type { AgentMode, SurvivalFocus } from "@/lib/survival-context";

export const RQ_PROFILE_KEY = "rq-welcome-v1";
export const RQ_WELCOME_EVENT = "rq-open-welcome";
export const RQ_PROFILE_EVENT = "rq-profile-updated";
export const RQ_CHAT_DRAFT_KEY = "rq-chat-draft-v1";

export type RqProfile = {
  name: string; city: string; country: string; people: number;
  interest: "real" | "fiction" | "both";
  favorite: string; goal: "prepare" | "understand" | "practice"; completedAt: string;
};

export const RQ_SCENARIOS: Array<{ id: string; label: string; title: string; line: string; prompt: string; mode: AgentMode; focus: SurvivalFocus; fictional?: boolean }> = [
  { id: "blackout", label: "Blackout", title: "The lights go out.", line: "Start with light, water and a way to stay in touch. We can work from there.", prompt: "Help me prepare for a 72-hour blackout. Ask what you need to know about my household, then build a practical plan and suggest useful supplies.", mode: "PREPARE", focus: "BLACKOUT" },
  { id: "wildfire", label: "Wildfire", title: "Smoke on the horizon.", line: "Your first move is to check local instructions. Your next is to get the essentials ready.", prompt: "Help me prepare my household for wildfire and smoke. Ask about my circumstances and help build a useful kit, grounded in official guidance.", mode: "PREPARE", focus: "LOCAL_THREATS" },
  { id: "wallet", label: "Wallet security", title: "Something feels off.", line: "Before you sign anything, let us understand what you are being asked to approve.", prompt: "Help me check my Solana wallet security. Ask what happened and give me a safe first step without asking for any private keys.", mode: "ANALYZE", focus: "DIGITAL_SECURITY" },
  { id: "zombies", label: "Zombie outbreak", title: "The dead have terrible timing.", line: "A fictional outbreak. Very real lessons in supplies, shelter and keeping your head.", prompt: "Run a fictional zombie outbreak scenario, one decision at a time. Then help me translate the lessons into a practical household survival kit.", mode: "SIMULATE", focus: "HOUSEHOLD", fictional: true },
];

export function readRqProfile(storage: Pick<Storage, "getItem">): RqProfile | null {
  try {
    const p = JSON.parse(storage.getItem(RQ_PROFILE_KEY) || "null");
    if (!p || typeof p.completedAt !== "string") return null;
    return {
      name: typeof p.name === "string" ? p.name.slice(0, 40) : "",
      city: typeof p.city === "string" ? p.city.slice(0, 60) : "",
      country: typeof p.country === "string" ? p.country.slice(0, 60) : "",
      people: Math.max(1, Math.min(12, Math.round(Number(p.people) || 1))),
      interest: ["real", "fiction", "both"].includes(p.interest) ? p.interest : "both",
      favorite: typeof p.favorite === "string" ? p.favorite.slice(0, 100) : "",
      goal: ["prepare", "understand", "practice"].includes(p.goal) ? p.goal : "prepare",
      completedAt: p.completedAt,
    };
  } catch { return null; }
}

export function profilePrompt(profile: RqProfile) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const goal = profile.goal === "practice"
    ? "Give me one survival decision scenario and wait for my answer. Clearly label fictional scenarios."
    : profile.goal === "understand"
      ? "Help me understand which threats are relevant to me. Separate verified live information from general advice."
      : "Help me take my first useful preparedness step and build a simple plan.";
  return [goal, profile.name && `Call me ${profile.name}.`, location && `My broad area is ${location}.`, `My household has ${profile.people} ${profile.people === 1 ? "person" : "people"}.`, `I am interested in ${profile.interest === "both" ? "real threats and fictional survival scenarios" : profile.interest === "real" ? "real threats" : "fictional survival scenarios"}.`, profile.favorite && `A survival film or game I enjoy is ${profile.favorite}; use it only as fictional inspiration.`].filter(Boolean).join(" ");
}

export function draftQueenQuestion(prompt: string, mode: AgentMode = "ANALYZE", focus: SurvivalFocus = "HOUSEHOLD") {
  try { sessionStorage.setItem(RQ_CHAT_DRAFT_KEY, JSON.stringify({ prompt: prompt.slice(0, 2000), mode, focus, createdAt: Date.now() })); } catch { /* Queen remains accessible if browser storage is blocked. */ }
  return "/red-queen";
}
