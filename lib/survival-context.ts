export type AgentMode = "MONITOR" | "ANALYZE" | "PREPARE" | "SIMULATE";

export type SurvivalFocus =
  | "LOCAL_THREATS"
  | "BLACKOUT"
  | "HOUSEHOLD"
  | "DIGITAL_SECURITY"
  | "HEALTH";

export interface SurvivalContext {
  area: string;
  focus: SurvivalFocus;
  mode: AgentMode;
  people?: number;
  budget?: string;
  existingEquipment?: string[];
  constraints?: string;
  signalId?: string;
  signalIds?: string[];
  location?: {
    lat: number;
    lng: number;
    label: string;
  };
}

export const AGENT_MODES: Array<{ id: AgentMode; label: string; description: string }> = [
  { id: "MONITOR", label: "What’s happening", description: "Explore live threats" },
  { id: "ANALYZE", label: "Help me understand", description: "Make sense of a concern" },
  { id: "PREPARE", label: "Make a plan", description: "Steps and supplies" },
  { id: "SIMULATE", label: "Test my instincts", description: "One decision at a time" },
];

export const READINESS_BASELINE_PROMPT =
  "Run a short survival readiness baseline. Give me one realistic decision scenario at a time, wait for my answer, then score only the evidence in my decision.";

export const MODE_STARTERS: Record<AgentMode, string[]> = {
  MONITOR: ["What threats should I know about?", "What changed near me?", "Help me understand a news story"],
  ANALYZE: ["Where should I start?", "What am I missing in my preparation?", "Help me check my wallet security"],
  PREPARE: ["Build a 72-hour blackout plan", "Audit my emergency kit", "Create one action for today"],
  SIMULATE: ["Test my survival instincts, one decision at a time", "Put me in a fictional zombie outbreak", "Run a blackout decision drill"],
};

export const SURVIVAL_FOCUS_OPTIONS: Array<{
  id: SurvivalFocus;
  label: string;
  description: string;
  mode: AgentMode;
}> = [
  { id: "LOCAL_THREATS", label: "Threats near me", description: "Relevant live signals and what changed", mode: "MONITOR" },
  { id: "BLACKOUT", label: "Blackout & infrastructure", description: "Power, water, communications and cash", mode: "PREPARE" },
  { id: "HOUSEHOLD", label: "Household readiness", description: "A practical 72-hour resilience plan", mode: "PREPARE" },
  { id: "DIGITAL_SECURITY", label: "Wallet & digital security", description: "Device, wallet and recovery exposure", mode: "ANALYZE" },
  { id: "HEALTH", label: "Health & outbreaks", description: "Preparedness without sensational claims", mode: "ANALYZE" },
];

export function getFocusOption(focus: SurvivalFocus) {
  return SURVIVAL_FOCUS_OPTIONS.find((option) => option.id === focus) || SURVIVAL_FOCUS_OPTIONS[0];
}

export function sanitizeArea(value: string) {
  return value.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function sanitizeSignalId(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return /^(usgs|nasa|gdacs|noaa|cisa|who|solana-status)-[A-Za-z0-9._:%-]{1,220}$/.test(normalized) ? normalized : undefined;
}

export function sanitizeSignalIds(value: unknown) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string" ? value.split(",") : [];
  return Array.from(new Set(candidates.map(sanitizeSignalId).filter((id): id is string => Boolean(id)))).slice(0, 6);
}

export function isSurvivalFocus(value: string | null | undefined): value is SurvivalFocus {
  return SURVIVAL_FOCUS_OPTIONS.some((option) => option.id === value);
}

export function isAgentMode(value: string | null | undefined): value is AgentMode {
  return AGENT_MODES.some((mode) => mode.id === value);
}

export function buildFirstContactPrompt(context: SurvivalContext) {
  const area = context.area ? ` for ${context.area}` : "";
  switch (context.focus) {
    case "LOCAL_THREATS":
      return `What verified threats or disruptions matter${area} right now? Separate confirmed facts from uncertainty and give me one action.`;
    case "BLACKOUT":
      return `Build my first 72-hour blackout and infrastructure plan${area}. Start with the highest-impact gap and one action I can complete today.`;
    case "HOUSEHOLD":
      return `Help me establish a practical household readiness baseline${area}. Prioritize one action for the next 24 hours.`;
    case "DIGITAL_SECURITY":
      return `Give me a digital and Solana wallet exposure triage${area}. Do not request private keys or sensitive identifiers. Start with one safe action.`;
    case "HEALTH":
      return `Give me a source-grounded outbreak preparedness baseline${area}. Separate general guidance from any verified live signal and give me one action.`;
  }
}
