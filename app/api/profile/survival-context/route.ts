import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { parseSurvivalProfile } from "@/lib/survival-profile";

export const dynamic = "force-dynamic";

async function getAccount(req: Request) {
  const identifier = await getAuthIdentifier(req);
  return identifier ? getHashedWallet(identifier) : null;
}

export async function GET(req: Request) {
  const account = await getAccount(req);
  if (!account) return Response.json({ error: "Verified session required" }, { status: 401 });
  if (!supabase) return Response.json({ error: "Profile storage is unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_survival_profiles")
    .select("area, people, budget, constraints, existing_equipment, updated_at")
    .eq("wallet_address", account)
    .maybeSingle();
  if (error) {
    console.error("Failed to read private survival profile:", error);
    return Response.json({ error: "Private profile could not be loaded" }, { status: 503 });
  }
  return Response.json({ profile: data ? {
    area: data.area,
    people: data.people,
    budget: data.budget,
    constraints: data.constraints,
    existingEquipment: data.existing_equipment,
    updatedAt: data.updated_at,
  } : null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: Request) {
  const account = await getAccount(req);
  if (!account) return Response.json({ error: "Verified session required" }, { status: 401 });
  if (!supabase) return Response.json({ error: "Profile storage is unavailable" }, { status: 503 });

  const profile = parseSurvivalProfile(await req.json().catch(() => null));
  if (!profile) return Response.json({ error: "Invalid survival profile" }, { status: 400 });

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("user_survival_profiles").upsert({
    wallet_address: account,
    area: profile.area,
    people: profile.people,
    budget: profile.budget,
    constraints: profile.constraints,
    existing_equipment: profile.existingEquipment,
    updated_at: updatedAt,
  }, { onConflict: "wallet_address" });
  if (error) {
    console.error("Failed to save private survival profile:", error);
    return Response.json({ error: "Private profile could not be saved" }, { status: 503 });
  }
  return Response.json({ profile, updatedAt }, { headers: { "Cache-Control": "private, no-store" } });
}
