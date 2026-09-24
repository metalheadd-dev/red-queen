import { z } from "zod";
import { sanitizeArea } from "./survival-context";

export const SURVIVAL_PROFILE_STORAGE_KEY = "rq-survival-context-v1";
export const SURVIVAL_PROFILE_EVENT = "rq-survival-profile-updated";

const shortText = (max: number) => z.string().transform((value) =>
  value.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, max),
);

export const SURVIVAL_PROFILE_SCHEMA = z.object({
  area: z.string().transform(sanitizeArea),
  people: z.number().int().min(1).max(12),
  budget: shortText(120),
  constraints: shortText(320),
  existingEquipment: z.array(shortText(100)).max(24).transform((items) =>
    Array.from(new Set(items.filter(Boolean))),
  ),
});

export type SurvivalProfile = z.infer<typeof SURVIVAL_PROFILE_SCHEMA>;

export const EMPTY_SURVIVAL_PROFILE: SurvivalProfile = {
  area: "",
  people: 1,
  budget: "",
  constraints: "",
  existingEquipment: [],
};

export function parseSurvivalProfile(value: unknown): SurvivalProfile | null {
  const result = SURVIVAL_PROFILE_SCHEMA.safeParse(value);
  return result.success ? result.data : null;
}

export function readLocalSurvivalProfile(storage: Pick<Storage, "getItem">): SurvivalProfile {
  try {
    const saved = JSON.parse(storage.getItem(SURVIVAL_PROFILE_STORAGE_KEY) || "{}");
    const input = saved && typeof saved === "object" ? saved as Record<string, unknown> : {};
    return parseSurvivalProfile({
      area: typeof input.area === "string" ? input.area : "",
      people: Number.isInteger(input.people) && Number(input.people) >= 1 && Number(input.people) <= 12 ? input.people : 1,
      budget: typeof input.budget === "string" ? input.budget : "",
      constraints: typeof input.constraints === "string" ? input.constraints : "",
      existingEquipment: Array.isArray(input.existingEquipment) ? input.existingEquipment : [],
    }) || EMPTY_SURVIVAL_PROFILE;
  } catch {
    return EMPTY_SURVIVAL_PROFILE;
  }
}

export function readLocalSurvivalProfileUpdatedAt(storage: Pick<Storage, "getItem">): number {
  try {
    const saved = JSON.parse(storage.getItem(SURVIVAL_PROFILE_STORAGE_KEY) || "{}");
    const timestamp = Date.parse(saved?.profileUpdatedAt || "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  } catch {
    return 0;
  }
}

export function saveLocalSurvivalProfile(
  storage: Pick<Storage, "getItem" | "setItem">,
  profile: SurvivalProfile,
  updatedAt = new Date().toISOString(),
) {
  let previous: Record<string, unknown> = {};
  try {
    const saved = JSON.parse(storage.getItem(SURVIVAL_PROFILE_STORAGE_KEY) || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) previous = saved;
  } catch { /* An invalid old preference must not block a new save. */ }
  const previousArea = typeof previous.area === "string" ? sanitizeArea(previous.area) : "";
  storage.setItem(SURVIVAL_PROFILE_STORAGE_KEY, JSON.stringify({
    ...previous,
    ...profile,
    profileUpdatedAt: updatedAt,
    location: previousArea === profile.area ? previous.location : undefined,
  }));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SURVIVAL_PROFILE_EVENT));
}
