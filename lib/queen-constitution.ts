import type { RedQueenAgentResponse } from "./red-queen-agent";

export const QUEEN_CONSTITUTION_VERSION = "2026-09-27-v1";

export interface QueenEvidence {
  fact: string;
  sourceUrl: string;
  observedAt: string;
  current?: boolean;
}

function equipmentKey(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, " ").trim().replace(/\b(flashlights|torches)\b/g, "flashlight").replace(/\btorch\b/g, "flashlight");
  return normalized.replace(/\s+/g, " ");
}

/** Server-owned evidence and inventory win over model-generated claims. */
export function enforceQueenConstitution(
  response: RedQueenAgentResponse,
  input: { evidence: QueenEvidence[]; ownedEquipment: string[] },
): RedQueenAgentResponse {
  const fictional = response.threat.classification === "FICTIONAL" || response.grounding === "SCENARIO_SIMULATION";
  const validEvidence = fictional ? [] : input.evidence.filter((item) =>
    item.current !== false && Boolean(item.fact.trim()) && /^https?:\/\//i.test(item.sourceUrl)
    && Number.isFinite(Date.parse(item.observedAt)) && Date.parse(item.observedAt) <= Date.now() + 300_000
  );
  const usesLiveContext = !fictional && response.usesLiveContext && validEvidence.length > 0;
  const ownedKeys = new Set(input.ownedEquipment.map(equipmentKey).filter(Boolean));
  let loadout = response.loadout;
  if (loadout && ownedKeys.size) {
    const duplicates = loadout.missing.filter((item) => ownedKeys.has(equipmentKey(item.item)));
    const missing = loadout.missing.filter((item) => !ownedKeys.has(equipmentKey(item.item)));
    loadout = {
      ...loadout,
      needed: missing.length > 0 && loadout.needed,
      owned: Array.from(new Set([...loadout.owned, ...duplicates.map((item) => item.item)])).slice(0, 12),
      missing,
      doNotBuy: Array.from(new Set([...loadout.doNotBuy, ...duplicates.map((item) => `Already owned: ${item.item}`)])).slice(0, 8),
    };
  }

  const optionalAction = response.optionalAction.type === "NONE"
    ? { ...response.optionalAction, requiresApproval: false }
    : { ...response.optionalAction, requiresApproval: true };
  return {
    ...response,
    grounding: fictional ? "SCENARIO_SIMULATION" : usesLiveContext ? "VERIFIED_LIVE" : "GENERAL_KNOWLEDGE",
    usesLiveContext,
    facts: usesLiveContext ? validEvidence.slice(0, 4).map((item) => item.fact.slice(0, 260)) : [],
    procurement: loadout && !loadout.needed ? null : response.procurement,
    loadout,
    optionalAction: loadout && !loadout.needed && optionalAction.type === "BUILD_CART"
      ? { type: "NONE", label: "No purchase needed", reason: "Check the equipment you already own first.", requiresApproval: false }
      : optionalAction,
  };
}
