import { supabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth-helpers";
import { Connection, PublicKey } from "@solana/web3.js";
import { isValidSolanaPublicKey, getWorkingConnection } from "@/lib/solana";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { getStatsFromScenarios, updateStatsInScenarios, applyStatGains, calculateBioScore } from "@/lib/progression";

const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump");

async function getThreatBalance(walletAddress: string): Promise<number> {
  if (!walletAddress || !isValidSolanaPublicKey(walletAddress)) {
    return 0;
  }
  try {
    const connection = await getWorkingConnection(false);
    const pubkey = new PublicKey(walletAddress);
    const threatATA = await getAssociatedTokenAddress(THREAT_MINT, pubkey);
    
    try {
      const tokenBalance = await connection.getTokenAccountBalance(threatATA);
      return tokenBalance.value.uiAmount || 0;
    } catch (e: any) {
      if (e.message?.includes("could not find account") || e.message?.includes("does not exist") || e.message?.includes("Invalid param")) {
        return 0;
      }
      throw e;
    }
  } catch (err) {
    console.error("Failed to query $THREAT balance in API:", err);
    return 0;
  }
}

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const { submissionId, action } = await req.json();
    if (!submissionId || !action || !["approve", "reject"].includes(action)) {
      return Response.json({ error: "submissionId and action ('approve'|'reject') are required" }, { status: 400 });
    }

    // 1. Fetch user quest record
    const { data: quest, error: fetchErr } = await supabase
      .from("user_quests")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    if (quest.status !== "pending") {
      return Response.json({ error: `Quest is not in pending state. Current status: ${quest.status}` }, { status: 400 });
    }

    // 2. Handle Rejection
    if (action === "reject") {
      const { data, error: updateErr } = await supabase
        .from("user_quests")
        .update({ status: "rejected" })
        .eq("id", submissionId)
        .select()
        .single();

      if (updateErr) throw new Error(updateErr.message);
      return Response.json({ success: true, quest: data });
    }

    // 3. Handle Approval
    let xpAwarded: number | null = null;

    if (quest.type === "task") {
      // Load task details
      const { data: task, error: taskErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", quest.target_id)
        .single();

      if (taskErr) throw new Error(taskErr.message);

      const baseXp = task.reward_xp || 0;

      // Load user profile details
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", quest.wallet_address)
        .single();

      if (userErr) throw new Error(userErr.message);

      const currentStats = getStatsFromScenarios(user.chosen_scenarios);

      // Determine address for $THREAT token multiplier
      const addressToCheck = quest.raw_wallet || user.linked_wallet_address || "";
      let tokenMultiplier = 1.0;
      if (addressToCheck) {
        const balance = await getThreatBalance(addressToCheck);
        if (balance > 0) {
          tokenMultiplier = 2.0;
        }
      }

      // Determine clearance level multiplier
      const level = currentStats.level || 1;
      const clearanceMultiplier = level >= 5 ? 2.0 : 
                                  level >= 4 ? 1.75 : 
                                  level >= 3 ? 1.5 : 
                                  level >= 2 ? 1.25 : 1.0;

      const totalMultiplier = tokenMultiplier * clearanceMultiplier;
      xpAwarded = Math.round(baseXp * totalMultiplier);

      // Award dynamic stat boost (e.g. +2 to operational discipline for completing community operations)
      const gains = { operational_discipline: 2 };

      const updatedStats = applyStatGains(currentStats, xpAwarded, gains, user.last_interaction);
      const newBioScore = calculateBioScore(updatedStats);
      const updatedScenarios = updateStatsInScenarios(user.chosen_scenarios, updatedStats);

      // Save user profile progress
      const { error: userUpdateErr } = await supabase
        .from("users")
        .update({
          chosen_scenarios: updatedScenarios,
          last_bio_score: newBioScore,
          last_interaction: new Date().toISOString()
        })
        .eq("wallet_address", quest.wallet_address);

      if (userUpdateErr) throw new Error(userUpdateErr.message);
    } else {
      // Bounty approvals: rewards are SOL-based
      const { data: bounty, error: bountyErr } = await supabase
        .from("bounties")
        .select("reward_sol")
        .eq("id", quest.target_id)
        .single();
      
      if (bountyErr) throw new Error(bountyErr.message);
      // We log the SOL reward logged on the quest record
    }

    // Update the quest status to completed
    const { data: updatedQuest, error: questUpdateErr } = await supabase
      .from("user_quests")
      .update({
        status: "completed",
        ...(xpAwarded !== null && { xp_awarded: xpAwarded })
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (questUpdateErr) throw new Error(questUpdateErr.message);

    return Response.json({ success: true, quest: updatedQuest });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
