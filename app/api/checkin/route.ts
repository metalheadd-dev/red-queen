import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { getStatsFromScenarios, applyStatGains, updateStatsInScenarios, getXpMultiplier, calculateBioScore } from "@/lib/progression";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { isValidSolanaPublicKey, getWorkingConnection } from "@/lib/solana";

const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump");

export const dynamic = "force-dynamic";

async function fetchThreatBalance(walletAddress: string): Promise<number> {
  if (!walletAddress || !isValidSolanaPublicKey(walletAddress)) {
    return 0;
  }
  try {
    const connection = await getWorkingConnection(false);
    const pubkey = new PublicKey(walletAddress);
    const threatATA = await getAssociatedTokenAddress(THREAT_MINT, pubkey);
    const tokenBalance = await connection.getTokenAccountBalance(threatATA);
    return tokenBalance.value.uiAmount || 0;
  } catch (e) {
    return 0;
  }
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { wallet_address } = body;
    if (!wallet_address) {
      return NextResponse.json({ error: "wallet_address required" }, { status: 400 });
    }

    // 1. Resolve user using the Bearer token / signature identifier
    const authIdentifier = await getAuthIdentifier(req);
    if (!authIdentifier) {
      if (process.env.NODE_ENV !== "development" || wallet_address !== "offline-operative") {
        return NextResponse.json({ error: "Access Denied: Unauthenticated session" }, { status: 401 });
      }
    } else if (authIdentifier !== wallet_address) {
      return NextResponse.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
    }

    const activeIdentifier = authIdentifier || wallet_address;
    const hashedWallet = getHashedWallet(activeIdentifier);

    // Fetch user profile row
    const { data: userProfile, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedWallet)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch Containment Breach system state
    let breachActive = false;
    let breachUntilStr = "";
    try {
      const { data: breachRow } = await supabase
        .from("system_state")
        .select("value")
        .eq("key", "containment_breach")
        .single();
      
      const breachVal = breachRow?.value as any;
      if (breachVal && breachVal.active) {
        const untilTime = new Date(breachVal.until);
        if (untilTime > new Date()) {
          breachActive = true;
          breachUntilStr = breachVal.until;
        }
      }
    } catch (e) {
      console.warn("Failed to query system_state containment_breach:", e);
    }

    const lastCheckinStr = userProfile.last_checkin_at;
    const lastCheckin = lastCheckinStr ? new Date(lastCheckinStr) : null;
    const now = new Date();

    let newStreak = Number(userProfile.streak_count) || 0;
    const oldHighestTier = Number(userProfile.highest_pulse_tier_reached) || 0;
    const oldLongestStreak = Number(userProfile.longest_streak) || 0;

    let chainBroken = false;

    if (lastCheckin) {
      const hoursSinceLast = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

      // Enforce 20 hours minimum between signals
      if (hoursSinceLast < 20) {
        return NextResponse.json({
          error: "Pulse already sent. Minimum 20 hours between transmissions required.",
          last_checkin_at: lastCheckinStr,
          streak_count: newStreak
        }, { status: 400 });
      }

      // Compute check-in window: normally 48 hours; if breach active, window is limited to (breachUntil - lastCheckin)
      let checkinWindowHours = 48.0;
      if (breachActive && breachUntilStr) {
        const breachUntil = new Date(breachUntilStr);
        const timeLimitMs = breachUntil.getTime() - lastCheckin.getTime();
        if (timeLimitMs > 0) {
          checkinWindowHours = timeLimitMs / (1000 * 60 * 60);
        }
      }

      if (hoursSinceLast > checkinWindowHours) {
        newStreak = 1;
        chainBroken = true;
      } else {
        newStreak += 1;
      }
    } else {
      // First checkin
      newStreak = 1;
    }

    const newLongestStreak = Math.max(oldLongestStreak, newStreak);

    // Compute raw pulse tier from new streak count
    let computedPulseTier = 0;
    if (newStreak >= 100) computedPulseTier = 3;
    else if (newStreak >= 30) computedPulseTier = 2;
    else if (newStreak >= 7) computedPulseTier = 1;

    const newHighestPulseTier = Math.max(oldHighestTier, computedPulseTier);

    // Soft landing on chain break
    let activePulseTier = computedPulseTier;
    if (chainBroken) {
      if (newHighestPulseTier >= 2) {
        activePulseTier = newHighestPulseTier - 1; // Land at 1 tier down
      } else {
        activePulseTier = 0;
      }
    }

    // 3. Query Solana $THREAT balance for multipliers
    const addressToCheck = activeIdentifier.startsWith("email-auth:")
      ? userProfile.linked_wallet_address
      : activeIdentifier;

    let balance = 0;
    if (addressToCheck) {
      balance = await fetchThreatBalance(addressToCheck);
    }

    // 4. Award XP and operational_discipline stat gains
    const currentStats = getStatsFromScenarios(userProfile.chosen_scenarios);
    const level = currentStats.level || 1;
    const baseCheckinXp = 5;

    const { total: totalMultiplier } = getXpMultiplier({
      tokenBalance: balance,
      level,
      pulseTier: activePulseTier
    });

    const boostedXp = Math.round(baseCheckinXp * totalMultiplier);

    const updatedStats = applyStatGains(
      currentStats,
      boostedXp,
      { operational_discipline: 3 }, // 3 operational_discipline points awarded
      userProfile.last_interaction
    );

    const newBioScore = calculateBioScore(updatedStats);
    const updatedScenarios = updateStatsInScenarios(userProfile.chosen_scenarios, updatedStats);

    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update({
        chosen_scenarios: updatedScenarios,
        streak_count: newStreak,
        longest_streak: newLongestStreak,
        last_checkin_at: now.toISOString(),
        last_interaction: now.toISOString(),
        pulse_tier: activePulseTier,
        highest_pulse_tier_reached: newHighestPulseTier,
        last_bio_score: newBioScore,
        total_checkins: (userProfile.total_checkins || 0) + 1
      })
      .eq("wallet_address", hashedWallet)
      .select("*")
      .single();

    if (updateErr || !updatedUser) {
      return NextResponse.json({ error: "Failed to update profile checkin state" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      streak_count: newStreak,
      longest_streak: newLongestStreak,
      last_checkin_at: now.toISOString(),
      xp_awarded: boostedXp,
      pulse_tier: activePulseTier,
      highest_pulse_tier_reached: newHighestPulseTier,
      profile: {
        ...updatedUser,
        stats: updatedStats
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process checkin" }, { status: 500 });
  }
}
