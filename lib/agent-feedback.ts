export const AGENT_REPORT_REASONS = ["UNSAFE", "OFFENSIVE", "INCORRECT", "SPOILER", "OTHER"] as const;
export type AgentReportReason = typeof AGENT_REPORT_REASONS[number];

export function normalizeAgentReport(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (!AGENT_REPORT_REASONS.includes(input.reason as AgentReportReason)
    || typeof input.reply !== "string" || !input.reply.trim()) return null;
  const text = (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";
  return {
    reason: input.reason as AgentReportReason,
    surface: input.surface === "GAMING" ? "GAMING" : "CORE",
    generationId: typeof input.generationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.generationId) ? input.generationId : null,
    prompt: text(input.prompt, 4000), reply: text(input.reply, 6000), detail: text(input.detail, 1000),
  };
}
