import { supabase } from "@/lib/supabase";
import { calculateBioScore, getClearanceLevel, getStatsFromScenarios } from "@/lib/progression";
import { generateApocalypticName } from "@/lib/names";

export const dynamic = "force-dynamic";

function activeBand(value?: string | null) {
  if (!value) return "NO RECENT EVIDENCE";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "ACTIVITY UNKNOWN";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "ACTIVE TODAY";
  if (days <= 7) return "ACTIVE THIS WEEK";
  if (days <= 30) return "ACTIVE THIS MONTH";
  return "ARCHIVED SIGNAL";
}

export async function GET() {
  if (!supabase) {
    return Response.json({
      available: false,
      leaderboard: [],
      message: "SOLvivor Network is awaiting database connection.",
    });
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("wallet_address, apocalyptic_name, last_bio_score, chosen_scenarios, last_interaction")
    .eq("community_visible", true)
    .limit(100);

  if (error) {
    const migrationMissing = error.code === "42703" || /community_visible/i.test(error.message || "");
    if (migrationMissing) {
      return Response.json({
        available: false,
        leaderboard: [],
        message: "SOLvivor Network is awaiting its release migration.",
      });
    }
    return Response.json({ error: "SOLvivor Network is temporarily unavailable." }, { status: 500 });
  }

  const ranked = (users || [])
    .map((user) => {
      const stats = getStatsFromScenarios(user.chosen_scenarios);
      const bioScore = calculateBioScore(stats) || Number(user.last_bio_score || 0);
      return {
        display_name: user.apocalyptic_name || generateApocalypticName(user.wallet_address),
        points: Math.max(0, stats.xp || 0),
        level: Math.max(1, stats.level || 1),
        bio_score: Math.min(100, Math.max(0, bioScore)),
        clearance: getClearanceLevel(bioScore).label,
        activity: activeBand(user.last_interaction),
      };
    })
    .sort((a, b) => b.points - a.points || b.bio_score - a.bio_score || b.level - a.level)
    .slice(0, 25)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return Response.json({
    available: true,
    leaderboard: ranked,
    scoring: {
      points: "Earned through evaluated drills and readiness evidence.",
      bio: "Evidence-based readiness. Holdings never create BIO-SCORE.",
    },
  });
}
