import { supabase } from "@/lib/supabase";
import { checkAdmin, getAuthIdentifier } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Helper to generate a random 8-character uppercase invite code
function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "RQ-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Access denied: admin credentials required" }, { status: 403 });
  }

  try {
    const { data: invites, error: fetchErr } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchErr) {
      return Response.json({ error: fetchErr.message }, { status: 500 });
    }

    // Load usage logs
    const { data: usages, error: usagesErr } = await supabase
      .from("invite_usage")
      .select("*")
      .order("used_at", { ascending: false });

    const inviteList = (invites || []).map((code) => {
      const history = (usages || []).filter((u) => u.code_id === code.id);
      return {
        ...code,
        history
      };
    });

    return Response.json({ success: true, invites: inviteList });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const adminIdentifier = await getAuthIdentifier(req) || "Admin";

  try {
    const { code, max_uses, expires_at, notes, invite_type } = await req.json();
    const finalCode = code && code.trim() ? code.trim().toUpperCase() : generateRandomCode();
    const finalMaxUses = Number(max_uses) || 1;
    const finalExpires = expires_at ? new Date(expires_at).toISOString() : null;
    const finalNotes = notes || "";
    const finalType = invite_type || "Single-use";

    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code: finalCode,
        created_by: adminIdentifier,
        expires_at: finalExpires,
        max_uses: finalMaxUses,
        current_uses: 0,
        status: "ACTIVE",
        notes: finalNotes,
        invite_type: finalType
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, invite: data });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, invite: data });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing ID parameter" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
