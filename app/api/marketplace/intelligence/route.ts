import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let p2pActiveCount = 0;
    let p2pSoldCount = 0;
    
    if (supabase) {
      const { count: active } = await supabase
        .from("marketplace_items")
        .select("*", { count: "exact", head: true })
        .eq("listing_status", "ACTIVE");
      
      const { count: sold } = await supabase
        .from("marketplace_items")
        .select("*", { count: "exact", head: true })
        .eq("listing_status", "SOLD");
        
      p2pActiveCount = active || 0;
      p2pSoldCount = sold || 0;
    }

    // Build the aggregated market intelligence report
    const intelligence = {
      timestamp: new Date().toISOString(),
      trendingEquipment: [
        { name: "Standard Issue Assault Rifle", category: "Weapons", activeListings: p2pActiveCount + 2, trend: "STABLE" },
        { name: "Stealth Recon Cloak", category: "Armor", activeListings: p2pActiveCount + 1, trend: "UP" }
      ],
      trendingResources: [
        { name: "Deuterium Power Cell", category: "Materials", demandIndex: 85, trend: "UP" },
        { name: "Medical Supplies", category: "Materials", demandIndex: 94, trend: "UP" }
      ],
      supply: "Electronics supply is decreasing. Weapons inventory remains stable.",
      demand: "Medical Supplies demand has spiked by 18% over the past 24 hours.",
      recentSalesCount: p2pSoldCount + 4,
      redQueenAdvisory: "AGGREGATING MARKET TELEMETRY: $THREAT token exchange utility is online at 50% Credits equivalent value. Direct procurement via Red Queen Logistics is advised for medical stabilization assets.",
      recommendation: "Acquire Components before regional containment breach increases manufacturing costs."
    };

    return NextResponse.json({ success: true, data: intelligence });
  } catch (err: any) {
    console.error("Intelligence route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
