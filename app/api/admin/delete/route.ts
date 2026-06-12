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
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
      return Response.json({ success: true });

    } else {
      const { error } = await supabase
        .from("bounties")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
      return Response.json({ success: true });
    }

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
