import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getAuthIdentifier, checkAdmin } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { normalizeAgentReport } from "@/lib/agent-feedback";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const salt = process.env.WALLET_SALT || randomBytes(32).toString("hex");
const headers = { "Cache-Control": "private, no-store" };

export async function POST(req: Request) {
  let report;
  try { report = normalizeAgentReport(await req.json()); }
  catch { return Response.json({ error: "Invalid report." }, { status: 400, headers }); }
  if (!report) return Response.json({ error: "Choose a reason and include the reply." }, { status: 400, headers });
  if (!supabase) return Response.json({ error: "Reports are unavailable right now. Your report has not been submitted." }, { status: 503, headers });
  const owner = await getAuthIdentifier(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const reporterKey = owner ? getHashedWallet(owner) : createHash("sha256").update(`report:${salt}:${ip}`).digest("hex");
  const { count, error: countError } = await supabase.from("agent_content_reports")
    .select("id", { head: true, count: "exact" }).eq("reporter_key", reporterKey)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if (countError) return Response.json({ error: "Reports are unavailable right now. Your report has not been submitted." }, { status: 503, headers });
  if ((count || 0) >= 10) return Response.json({ error: "Report limit reached. Please try again tomorrow." }, { status: 429, headers });
  const id = randomUUID();
  const { error } = await supabase.from("agent_content_reports").insert({
    id, reporter_key: reporterKey, authenticated: Boolean(owner), generation_id: report.generationId,
    surface: report.surface, reason: report.reason, prompt: report.prompt, reported_reply: report.reply,
    detail: report.detail, evidence_source: "USER_SUBMITTED",
  });
  if (error) return Response.json({ error: "Your report could not be saved. Please try again." }, { status: 503, headers });
  return Response.json({ received: true, reportId: id }, { headers });
}

/** Private moderation queue. A user-submitted report is not a certified model record. */
export async function GET(req: Request) {
  if (!await checkAdmin(req)) return Response.json({ error: "Access denied." }, { status: 403, headers });
  if (!supabase) return Response.json({ error: "Reports unavailable." }, { status: 503, headers });
  const { data, error } = await supabase.from("agent_content_reports")
    .select("id, generation_id, surface, reason, prompt, reported_reply, detail, evidence_source, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Reports unavailable." }, { status: 503, headers });
  return Response.json({ reports: data || [] }, { headers });
}
