import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("wallet_address", wallet)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ history: data || [] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
