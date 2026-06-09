import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  try {
    // 1. Fetch all tasks and bounties
    const { data: tasks, error: tasksErr } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksErr) throw new Error(tasksErr.message);

    const { data: bounties, error: bountiesErr } = await supabase
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false });

    if (bountiesErr) throw new Error(bountiesErr.message);

    // 2. Fetch user status if logged in
    let userQuests: any[] = [];
    const authId = await getAuthIdentifier(req);
    if (authId) {
      const hashedWallet = getHashedWallet(authId);
      const { data, error } = await supabase
        .from("user_quests")
        .select("*")
        .eq("wallet_address", hashedWallet);
      
      if (!error && data) {
        userQuests = data;
      }
    }

    return Response.json({
      tasks: tasks || [],
      bounties: bounties || [],
      userQuests: userQuests || []
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
