import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { generateApocalypticName } from "@/lib/names";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const identity = await getAuthIdentifier(req);
  if (!identity) return Response.json({ error: "Verified session required" }, { status: 401 });
  if (!supabase) return Response.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.visible !== "boolean") {
    return Response.json({ error: "visible must be a boolean" }, { status: 400 });
  }

  const hashedWallet = getHashedWallet(identity);
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("apocalyptic_name, chosen_scenarios, community_joined_at")
    .eq("wallet_address", hashedWallet)
    .maybeSingle();

  if (existingError && (existingError.code === "42703" || /community_/i.test(existingError.message || ""))) {
    return Response.json({ error: "Community migration is not applied yet." }, { status: 503 });
  }
  if (existingError) return Response.json({ error: "Could not load community preference." }, { status: 500 });

  const { data, error } = await supabase
    .from("users")
    .upsert({
      wallet_address: hashedWallet,
      apocalyptic_name: existing?.apocalyptic_name || generateApocalypticName(hashedWallet),
      chosen_scenarios: existing?.chosen_scenarios || [],
      community_visible: body.visible,
      community_joined_at: body.visible
        ? existing?.community_joined_at || new Date().toISOString()
        : existing?.community_joined_at || null,
    }, { onConflict: "wallet_address" })
    .select("community_visible, community_joined_at")
    .single();

  if (error) {
    const migrationMissing = error.code === "42703" || /community_/i.test(error.message || "");
    return Response.json(
      { error: migrationMissing ? "Community migration is not applied yet." : "Could not update community preference." },
      { status: migrationMissing ? 503 : 500 },
    );
  }

  return Response.json({ membership: data });
}
