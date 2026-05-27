import { supabase } from "@/lib/supabase";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const hashedWallet = getHashedWallet(wallet);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", hashedWallet)
    .single();

  if (error && error.code !== "PGRST116") {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ profile: data || null });
}

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const body = await req.json();
  const { wallet_address, apocalyptic_name, chosen_scenarios } = body;
  if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

  const hashedWallet = getHashedWallet(wallet_address);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: hashedWallet,
        apocalyptic_name: apocalyptic_name || null,
        chosen_scenarios: chosen_scenarios || [],
        last_interaction: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ profile: data });
}
