import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { getCleanScenarios, getStatsFromScenarios, calculateBioScore } from "@/lib/progression";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });

  // Security Check: Verify user owns the requested wallet profile
  const authIdentifier = await getAuthIdentifier(req);
  if (!authIdentifier) {
    if (process.env.NODE_ENV === "development" && wallet === "offline-operative") {
      // allow development bypass
    } else {
      return Response.json({ error: "Verified session required" }, { status: 401 });
    }
  } else if (authIdentifier !== wallet) {
    return Response.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
  }
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const hashedWallet = getHashedWallet(wallet);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", hashedWallet)
    .single();

  if (error && error.code !== "PGRST116") {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    const cleanScenarios = getCleanScenarios(data.chosen_scenarios);
    const stats = getStatsFromScenarios(data.chosen_scenarios);

    // Calculate user's current leaderboard ranks (both XP and Bio-Score)
    let xpRank = null;
    let bioScoreRank = null;
    try {
      const { data: allUsers } = await supabase
        .from("users")
        .select("wallet_address, chosen_scenarios, last_bio_score");
      
      if (allUsers) {
        const processed = allUsers.map((u) => {
          const s = getStatsFromScenarios(u.chosen_scenarios);
          const computedBio = calculateBioScore(s);
          return {
            wallet_address: u.wallet_address,
            xp: s.xp || 0,
            bio_score: computedBio || u.last_bio_score || 0,
            level: s.level || 1,
          };
        });

        // 1. Sort by XP (primary) -> Bio Score -> Level
        const xpSorted = [...processed].sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.bio_score !== a.bio_score) return b.bio_score - a.bio_score;
          return b.level - a.level;
        });
        const xpIndex = xpSorted.findIndex((u) => u.wallet_address === hashedWallet);
        if (xpIndex !== -1) {
          xpRank = xpIndex + 1;
        }

        // 2. Sort by Bio-Score (primary) -> XP -> Level
        const bioSorted = [...processed].sort((a, b) => {
          if (b.bio_score !== a.bio_score) return b.bio_score - a.bio_score;
          if (b.xp !== a.xp) return b.xp - a.xp;
          return b.level - a.level;
        });
        const bioIndex = bioSorted.findIndex((u) => u.wallet_address === hashedWallet);
        if (bioIndex !== -1) {
          bioScoreRank = bioIndex + 1;
        }
      }
    } catch (e) {
      console.error("Failed to compute profile ranks:", e);
    }

    return Response.json({
      profile: {
        ...data,
        chosen_scenarios: cleanScenarios,
        stats: stats,
        xp_rank: xpRank,
        bio_score_rank: bioScoreRank
      }
    });
  }

  return Response.json({ profile: null });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { wallet_address, apocalyptic_name, chosen_scenarios } = body;
  if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

  // Security Check: Verify user owns the requested wallet profile
  const authIdentifierPOST = await getAuthIdentifier(req);
  if (!authIdentifierPOST) {
    if (process.env.NODE_ENV === "development" && wallet_address === "offline-operative") {
      // allow development bypass
    } else {
      return Response.json({ error: "Verified session required" }, { status: 401 });
    }
  } else if (authIdentifierPOST !== wallet_address) {
    return Response.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
  }
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const hashedWallet = getHashedWallet(wallet_address);

  // Preserve progression stats by fetching existing stats string first
  let existingUser: { apocalyptic_name?: string | null; chosen_scenarios?: string[] | null } | null = null;
  let existingStatsString = "";
  try {
    const { data } = await supabase
      .from("users")
      .select("apocalyptic_name, chosen_scenarios")
      .eq("wallet_address", hashedWallet)
      .single();
    existingUser = data;
    if (existingUser && existingUser.chosen_scenarios) {
      const found = existingUser.chosen_scenarios.find((s: string) => s.startsWith("__STATS__:"));
      if (found) existingStatsString = found;
    }
  } catch (e) {
    console.error("Failed to fetch existing scenarios during profile update", e);
  }

  const safeScenarios = Array.isArray(chosen_scenarios)
    ? chosen_scenarios.filter((scenario): scenario is string => typeof scenario === "string").slice(0, 24)
    : null;
  const scenarioSource = safeScenarios ?? getCleanScenarios(existingUser?.chosen_scenarios || []);
  const updatedScenarios = [
    ...scenarioSource.filter((s: string) => !s.startsWith("__STATS__:")),
    existingStatsString,
  ].filter(Boolean);
  const nextName = typeof apocalyptic_name === "string"
    ? apocalyptic_name.trim().slice(0, 48)
    : existingUser?.apocalyptic_name || null;

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: hashedWallet,
        apocalyptic_name: nextName,
        chosen_scenarios: updatedScenarios,
        last_interaction: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (data) {
    const cleanScenarios = getCleanScenarios(data.chosen_scenarios);
    const stats = getStatsFromScenarios(data.chosen_scenarios);
    return Response.json({
      profile: {
        ...data,
        chosen_scenarios: cleanScenarios,
        stats: stats
      }
    });
  }

  return Response.json({ profile: data });
}
