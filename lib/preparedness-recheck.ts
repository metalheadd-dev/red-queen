import { z } from "zod";
import { isSurvivalFocus, type SurvivalFocus } from "@/lib/survival-context";
import type { PreparednessRecheckInput } from "@/lib/intelligence-reports";

const RecheckSchema = z.object({
  title: z.string().trim().min(2).max(100),
  area: z.string().trim().max(80).default(""),
  focus: z.string().trim().max(80),
  updatedAt: z.string().datetime(),
  reviewAt: z.string().datetime(),
  completedSteps: z.number().int().min(0).max(8),
  totalSteps: z.number().int().min(2).max(8),
  remainingSteps: z.array(z.string().trim().min(1).max(220)).max(8),
}).strict();

export function parsePreparednessRecheck(value: unknown): PreparednessRecheckInput | null {
  const parsed = RecheckSchema.safeParse(value);
  if (!parsed.success || !isSurvivalFocus(parsed.data.focus)) return null;
  if (parsed.data.completedSteps > parsed.data.totalSteps) return null;
  const now = Date.now();
  const updatedAt = Date.parse(parsed.data.updatedAt);
  if (!Number.isFinite(updatedAt) || updatedAt > now + 300_000 || updatedAt < now - 365 * 86_400_000) return null;
  return { ...parsed.data, focus: parsed.data.focus as SurvivalFocus };
}
