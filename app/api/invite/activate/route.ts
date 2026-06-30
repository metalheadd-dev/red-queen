import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const authIdentifier = await getAuthIdentifier(req);
  if (!authIdentifier) {
    return Response.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return Response.json({ error: "Code parameter is required" }, { status: 400 });
  }

  const cleanedCode = code.trim();
  const hashedWallet = getHashedWallet(authIdentifier);

  try {
    // 1. Fetch invite code record from Supabase
    const { data: invite, error: fetchErr } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", cleanedCode)
      .single();

    if (fetchErr || !invite) {
      return Response.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // 2. Perform validations
    if (invite.status !== "ACTIVE") {
      return Response.json({ error: `Invite code is inactive (Status: ${invite.status})` }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      // Auto-update status to EXPIRED
      await supabase
        .from("invite_codes")
        .update({ status: "EXPIRED" })
        .eq("id", invite.id);
      return Response.json({ error: "Invite code has expired" }, { status: 400 });
    }

    if (invite.current_uses >= invite.max_uses) {
      // Auto-update status to USED
      await supabase
        .from("invite_codes")
        .update({ status: "USED" })
        .eq("id", invite.id);
      return Response.json({ error: "Invite code has already been fully used" }, { status: 400 });
    }

    // 3. Update invite usages count
    const nextUses = invite.current_uses + 1;
    const nextStatus = nextUses >= invite.max_uses ? "USED" : "ACTIVE";

    const { error: inviteUpdateErr } = await supabase
      .from("invite_codes")
      .update({
        current_uses: nextUses,
        status: nextStatus
      })
      .eq("id", invite.id);

    if (inviteUpdateErr) {
      return Response.json({ error: inviteUpdateErr.message }, { status: 500 });
    }

    // 4. Log usage in invite_usage
    await supabase
      .from("invite_usage")
      .insert({
        code_id: invite.id,
        used_by: authIdentifier
      });

    const { error: userUpdateErr } = await supabase
      .from("users")
      .upsert(
        {
          wallet_address: hashedWallet,
          access_type: "Invite"
        },
        { onConflict: "wallet_address" }
      );

    if (userUpdateErr) {
      return Response.json({ error: userUpdateErr.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      access_type: "Invite"
    });
  } catch (err: any) {
    console.error("Invite code activation failed:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
