import { supabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, id } = body;
    if (!type || !id || !["task", "bounty"].includes(type)) {
      return Response.json({ error: "type ('task'|'bounty') and id are required" }, { status: 400 });
    }

    if (type === "task") {
      const { title, description, reward_xp, recurrence, image_url } = body;
      if (!title || !description || reward_xp === undefined) {
        return Response.json({ error: "title, description, and reward_xp are required for tasks" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          reward_xp: parseInt(reward_xp) || 0,
          recurrence: recurrence || "one-time",
          image_url: image_url || null
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return Response.json({ success: true, item: data });

    } else {
      const { title, description, reward_sol, winners_count, deadline, image_url } = body;
      if (!title || !description || reward_sol === undefined || !deadline) {
        return Response.json({ error: "title, description, reward_sol, and deadline are required for bounties" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("bounties")
        .update({
          title,
          description,
          reward_sol: parseFloat(reward_sol) || 0,
          winners_count: parseInt(winners_count) || 1,
          deadline: new Date(deadline).toISOString(),
          image_url: image_url || null
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return Response.json({ success: true, item: data });
    }

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
