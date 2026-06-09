import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const authId = await getAuthIdentifier(req);
  if (!authId) {
    return Response.json({ error: "Unauthorized: Active session required" }, { status: 401 });
  }

  const hashedWallet = getHashedWallet(authId);

  try {
    // Fetch all user quests
    const { data: userQuests, error: userQuestsErr } = await supabase
      .from("user_quests")
      .select("*")
      .eq("wallet_address", hashedWallet)
      .order("created_at", { ascending: false });

    if (userQuestsErr) throw new Error(userQuestsErr.message);

    // Fetch details of all associated tasks and bounties
    const taskIds = userQuests.filter(q => q.type === "task").map(q => q.target_id);
    const bountyIds = userQuests.filter(q => q.type === "bounty").map(q => q.target_id);

    let tasksList: any[] = [];
    let bountiesList: any[] = [];

    if (taskIds.length > 0) {
      const { data, error } = await supabase.from("tasks").select("*").in("id", taskIds);
      if (!error && data) tasksList = data;
    }

    if (bountyIds.length > 0) {
      const { data, error } = await supabase.from("bounties").select("*").in("id", bountyIds);
      if (!error && data) bountiesList = data;
    }

    // Combine tracking status with content details
    const enrichedQuests = userQuests.map(uq => {
      const target = uq.type === "task" 
        ? tasksList.find(t => t.id === uq.target_id)
        : bountiesList.find(b => b.id === uq.target_id);

      return {
        ...uq,
        details: target || null
      };
    });

    return Response.json({ userQuests: enrichedQuests });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
