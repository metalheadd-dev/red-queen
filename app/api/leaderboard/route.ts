import { supabase } from "@/lib/supabase";
import { getStatsFromScenarios, calculateBioScore } from "@/lib/progression";
import { generateApocalypticName } from "@/lib/names";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) {
    return Response.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("wallet_address, apocalyptic_name, last_bio_score, chosen_scenarios, last_interaction");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!users) {
      return Response.json({ leaderboard: [] });
    }

    // Process and deserialize each user's stats
    const processed = users.map((user) => {
      const stats = getStatsFromScenarios(user.chosen_scenarios);
      const computedBioScore = calculateBioScore(stats);
      
      // Fallback to last_bio_score if stats calculation is 0 but db column holds a value
      const bioScore = computedBioScore || user.last_bio_score || 0;
      const displayName = user.apocalyptic_name || generateApocalypticName(user.wallet_address);

      return {
        wallet_address: user.wallet_address,
        apocalyptic_name: displayName,
        xp: stats.xp || 0,
        level: stats.level || 1,
        bio_score: bioScore,
        last_interaction: user.last_interaction,
      };
    });

    // Sort by: 1. XP (descending), 2. Bio Score (descending), 3. Level (descending)
    processed.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.bio_score !== a.bio_score) return b.bio_score - a.bio_score;
      return b.level - a.level;
    });

    // Assign 1-indexed ranks
    const leaderboard = processed.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return Response.json({ leaderboard });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to retrieve leaderboard." }, { status: 500 });
  }
}
