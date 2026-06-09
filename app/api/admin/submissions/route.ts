import { supabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    // 1. Fetch pending user quests
    const { data: submissions, error: err } = await supabase
      .from("user_quests")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });

    if (err) throw new Error(err.message);

    if (submissions.length === 0) {
      return Response.json({ submissions: [] });
    }

    // 2. Fetch associated tasks and bounties
    const taskIds = submissions.filter(s => s.type === "task").map(s => s.target_id);
    const bountyIds = submissions.filter(s => s.type === "bounty").map(s => s.target_id);

    let tasks: any[] = [];
    let bounties: any[] = [];

    if (taskIds.length > 0) {
      const { data } = await supabase.from("tasks").select("*").in("id", taskIds);
      if (data) tasks = data;
    }

    if (bountyIds.length > 0) {
      const { data } = await supabase.from("bounties").select("*").in("id", bountyIds);
      if (data) bounties = data;
    }

    // 3. Fetch user profiles to display human-readable info
    const wallets = submissions.map(s => s.wallet_address);
    let userProfiles: any[] = [];
    if (wallets.length > 0) {
      const { data } = await supabase.from("users").select("wallet_address, apoptotic_name, email, linked_wallet_address").in("wallet_address", wallets);
      if (data) userProfiles = data;
    }

    // 4. Enrich submissions
    const enriched = submissions.map(s => {
      const details = s.type === "task"
        ? tasks.find(t => t.id === s.target_id)
        : bounties.find(b => b.id === s.target_id);

      const user = userProfiles.find(u => u.wallet_address === s.wallet_address) || null;

      return {
        ...s,
        details: details || null,
        user: user || null
      };
    });

    return Response.json({ submissions: enriched });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
