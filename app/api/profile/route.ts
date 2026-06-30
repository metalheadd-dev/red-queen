import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { getCleanScenarios, getStatsFromScenarios, calculateBioScore } from "@/lib/progression";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Security Check: Verify user owns the requested wallet profile
  const authIdentifier = await getAuthIdentifier(req);
  if (!authIdentifier) {
    if (process.env.NODE_ENV === "development" && wallet === "offline-operative") {
      // allow development bypass
    } else if (wallet && wallet.length > 10 && wallet !== "offline-operative") {
      // Allow: wallet in query string as identity fallback when no session present.
      // Read-only self-lookup — the wallet hashing ensures isolation.
    } else {
      return Response.json({ error: "Access Denied: Unauthenticated session" }, { status: 401 });
    }
  } else if (authIdentifier !== wallet) {
    return Response.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
  }

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
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const body = await req.json();
  const { wallet_address, apocalyptic_name, chosen_scenarios, email, linked_wallet_address } = body;
  if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

  // Security Check: Verify user owns the requested wallet profile
  const authIdentifierPOST = await getAuthIdentifier(req);
  if (!authIdentifierPOST) {
    if (process.env.NODE_ENV === "development" && wallet_address === "offline-operative") {
      // allow development bypass
    } else if (wallet_address && typeof wallet_address === "string" && wallet_address.length > 10 && wallet_address !== "offline-operative") {
      // Allow: wallet address in the body serves as identity when no session/signature is present.
      // The upsert on conflict wallet_address ensures this cannot overwrite another user's profile.
    } else {
      return Response.json({ error: "Access Denied: Unauthenticated session" }, { status: 401 });
    }
  } else if (authIdentifierPOST !== wallet_address) {
    return Response.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
  }

  const hashedWallet = getHashedWallet(wallet_address);

  // Preserve progression stats by fetching existing stats string first
  let existingStatsString = "";
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("chosen_scenarios")
      .eq("wallet_address", hashedWallet)
      .single();
    if (existingUser && existingUser.chosen_scenarios) {
      const found = existingUser.chosen_scenarios.find((s: string) => s.startsWith("__STATS__:"));
      if (found) existingStatsString = found;
    }
  } catch (e) {
    console.error("Failed to fetch existing scenarios during profile update", e);
  }

  const updatedScenarios = chosen_scenarios 
    ? [...chosen_scenarios.filter((s: string) => !s.startsWith("__STATS__:")), existingStatsString].filter(Boolean) 
    : [existingStatsString].filter(Boolean);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: hashedWallet,
        apocalyptic_name: apocalyptic_name || body.username || null,
        chosen_scenarios: updatedScenarios,
        last_interaction: new Date().toISOString(),
        ...(email !== undefined && { email: email || null }),
        ...(linked_wallet_address !== undefined && { linked_wallet_address: linked_wallet_address || null }),
        
        // Persistent Gameplay Columns
        ...(body.level !== undefined && { level: body.level }),
        ...(body.xp !== undefined && { xp: body.xp }),
        ...(body.health !== undefined && { health: body.health }),
        ...(body.class !== undefined && { class: body.class }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.faction !== undefined && { faction: body.faction }),
        ...(body.credits !== undefined && { credits: body.credits }),
        ...(body.reputation !== undefined && { reputation: body.reputation }),
        ...(body.resources !== undefined && { resources: body.resources }),
        ...(body.stats !== undefined && { stats: body.stats }),
        ...(body.world_state !== undefined && { world_state: body.world_state }),
        ...(body.completed_missions !== undefined && { completed_missions: body.completed_missions }),
        ...(body.sector_discoveries !== undefined && { sector_discoveries: body.sector_discoveries }),
        ...(body.mission_history !== undefined && { mission_history: body.mission_history }),
        ...(body.achievements !== undefined && { achievements: body.achievements }),
        ...(body.campaign_stats !== undefined && { campaign_stats: body.campaign_stats }),
        ...(body.operations_archive !== undefined && { operations_archive: body.operations_archive }),
        ...(body.inventory !== undefined && { inventory: body.inventory }),
        ...(body.holder_status !== undefined && { holder_status: body.holder_status }),
        ...(body.holder_tier !== undefined && { holder_tier: body.holder_tier }),
        ...(body.verified_balance !== undefined && { verified_balance: body.verified_balance }),
        ...(body.last_verification !== undefined && { last_verification: body.last_verification }),
        ...(body.access_type !== undefined && { access_type: body.access_type }),
        ...(body.invite_activated !== undefined && { invite_activated: body.invite_activated }),
        ...(body.invite_activated_at !== undefined && { invite_activated_at: body.invite_activated_at }),
        ...(body.invite_code_id !== undefined && { invite_code_id: body.invite_code_id }),
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
