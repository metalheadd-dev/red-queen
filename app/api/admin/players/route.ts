import { supabase } from "@/lib/supabase";
import { checkAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    // 1. Fetch all players
    const { data: players, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .order("last_interaction", { ascending: false });

    if (fetchErr) {
      return Response.json({ error: fetchErr.message }, { status: 500 });
    }

    // 2. Compute ecosystem analytics
    const totalCount = players?.length || 0;
    let inviteCount = 0;
    let holderCount = 0;
    let founderCount = 0;
    let totalBioScore = 0;
    let totalCampaignCompletion = 0;

    // Track operation occurrences
    const operationCounts: Record<string, { title: string; count: number }> = {};

    (players || []).forEach((p) => {
      if (p.access_type === "Invite") inviteCount++;
      if (p.access_type === "Holder") holderCount++;
      if (p.holder_tier === 3) founderCount++;

      const bio = Number(p.last_bio_score || p.bio_score || 0);
      totalBioScore += bio;

      // Extract campaign stats / secured sectors
      const secured = Number(p.campaign_stats?.sectorsSecured || 0);
      const totalSectors = 7; // sec-alpha to sec-eta
      const completion = totalSectors > 0 ? Math.min(100, Math.round((secured / totalSectors) * 100)) : 0;
      totalCampaignCompletion += completion;

      // Parse mission history to find popular operations
      const history = Array.isArray(p.mission_history) ? p.mission_history : [];
      history.forEach((h: any) => {
        if (h && h.missionId) {
          const key = h.missionId;
          if (!operationCounts[key]) {
            operationCounts[key] = {
              title: h.missionTitle || h.missionId.replace("op-", "").replace(/-/g, " ").toUpperCase(),
              count: 0
            };
          }
          operationCounts[key].count++;
        }
      });
    });

    const avgBioScore = totalCount > 0 ? Math.round(totalBioScore / totalCount) : 0;
    const avgCampaignCompletion = totalCount > 0 ? Math.round(totalCampaignCompletion / totalCount) : 0;

    // Sort popular operations
    const popularOperations = Object.values(operationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analytics = {
      totalCount,
      inviteCount,
      holderCount,
      founderCount,
      avgBioScore,
      avgCampaignCompletion,
      popularOperations
    };

    return Response.json({
      success: true,
      players: players || [],
      analytics
    });
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

  try {
    const { wallet_address, access_type } = await req.json();
    if (!wallet_address || !access_type) {
      return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ access_type })
      .eq("wallet_address", wallet_address)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, player: data });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
