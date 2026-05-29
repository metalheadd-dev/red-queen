import { supabase } from "@/lib/supabase";
import { getHashedWallet } from "@/lib/crypto";
import { getCleanScenarios, getStatsFromScenarios } from "@/lib/progression";

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

  if (data) {
    const cleanScenarios = getCleanScenarios(data.chosen_scenarios);
    const stats = getStatsFromScenarios(data.chosen_scenarios);
    return Response.json({
      profile: {
        ...data,
        chosen_scenarios: cleanScenarios,
        stats: stats
      }
    });
  }

  return Response.json({ profile: null });
}

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const body = await req.json();
  const { wallet_address, apocalyptic_name, chosen_scenarios } = body;
  if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

  const hashedWallet = getHashedWallet(wallet_address);

  // Preserve progression stats by fetching existing stats string first
  let existingStatsString = "";
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("chosen_scenarios")
      .eq("wallet_address", hashedWallet)
      .single();
    if (existingUser && existingUser.chosen_scenarios) {
      const found = existingUser.chosen_scenarios.find((s: string) => s.startsWith("__STATS__:"));
      if (found) existingStatsString = found;
    }
  } catch (e) {
    console.error("Failed to fetch existing scenarios during profile update", e);
  }

  const updatedScenarios = chosen_scenarios 
    ? [...chosen_scenarios.filter((s: string) => !s.startsWith("__STATS__:")), existingStatsString].filter(Boolean) 
    : [existingStatsString].filter(Boolean);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: hashedWallet,
        apocalyptic_name: apocalyptic_name || null,
        chosen_scenarios: updatedScenarios,
        last_interaction: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (data) {
    const cleanScenarios = getCleanScenarios(data.chosen_scenarios);
    const stats = getStatsFromScenarios(data.chosen_scenarios);
    return Response.json({
      profile: {
        ...data,
        chosen_scenarios: cleanScenarios,
        stats: stats
      }
    });
  }

  return Response.json({ profile: data });
}
