import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getAuthIdentifier(request);
  if (!identity) return Response.json({ error: "A verified session is required." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Achievement ledger is not configured." }, { status: 503 });
  const { data, error } = await supabase
    .from("onchain_achievements")
    .select("achievement_id, transaction_signature, protocol_xp, metadata, created_at")
    .eq("wallet_address", getHashedWallet(identity))
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    const migrationMissing = error.code === "42P01" || /onchain_achievements/i.test(error.message || "");
    return Response.json({ error: migrationMissing ? "On-chain achievement migration is not applied yet." : "Achievement ledger is temporarily unavailable." }, { status: migrationMissing ? 503 : 500 });
  }
  return Response.json({
    achievements: data || [],
    protocolXp: (data || []).reduce((total, item) => total + Number(item.protocol_xp || 0), 0),
    scoringBoundary: "Protocol XP records verified Solana participation. It never changes BIO-SCORE, readiness domains or survival leaderboard XP.",
  });
}
