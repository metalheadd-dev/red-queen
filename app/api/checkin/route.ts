import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { getStatsFromScenarios, applyStatGains, updateStatsInScenarios } from "@/lib/progression";

export const dynamic = "force-dynamic";

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

    const authIdentifier = await getAuthIdentifier(req);
    if (!authIdentifier) {
      if (process.env.NODE_ENV !== "development" || wallet_address !== "offline-operative") {
        return NextResponse.json({ error: "Access Denied: Unauthenticated session" }, { status: 401 });
      }
    } else if (authIdentifier !== wallet_address) {
      return NextResponse.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
    }

    const hashedWallet = getHashedWallet(wallet_address);

    // 1. Fetch user row
    const { data: userRow, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedWallet)
      .single();

    if (fetchErr || !userRow) {
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

    const lastCheckinStr = userRow.last_checkin_at;
    const lastCheckin = lastCheckinStr ? new Date(lastCheckinStr) : null;
    const now = new Date();

    let newStreak = Number(userRow.streak_count) || 0;

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

      // Check if they missed a Containment Breach window
      let missedBreach = false;
      if (breachUntilStr && !breachActive) {
        const breachUntil = new Date(breachUntilStr);
        if (lastCheckin < breachUntil && now > breachUntil) {
          missedBreach = true;
        }
      }

      // Reset to 1 if >48 hours gap or missed a breach window
      if (hoursSinceLast > 48 || missedBreach) {
        newStreak = 1;
      } else {
        newStreak += 1;
      }
    } else {
      // First checkin
      newStreak = 1;
    }

    // 3. Award XP using progression helpers
    const stats = getStatsFromScenarios(userRow.chosen_scenarios);
    const xpReward = 50; // Standard daily signal award
    const updatedStats = applyStatGains(stats, xpReward, {});
    const updatedScenarios = updateStatsInScenarios(userRow.chosen_scenarios, updatedStats);

    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update({
        chosen_scenarios: updatedScenarios,
        streak_count: newStreak,
        last_checkin_at: now.toISOString(),
        last_interaction: now.toISOString()
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
      last_checkin_at: now.toISOString(),
      xp_awarded: xpReward,
      profile: {
        ...updatedUser,
        stats: updatedStats
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process checkin" }, { status: 500 });
  }
}
