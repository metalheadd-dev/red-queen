import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from("system_state")
      .select("value")
      .eq("key", "containment_breach")
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      breach: data?.value || { active: false, until: null }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const { active, until } = await req.json();

    const { data, error } = await supabase
      .from("system_state")
      .upsert({
        key: "containment_breach",
        value: { active: !!active, until: until || null },
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      breach: data.value
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
