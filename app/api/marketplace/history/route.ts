import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MOCK_TRADE_HISTORY = [
  {
    id: "hist-mock-1",
    seller_id: "RED_QUEEN_LOGISTICS",
    buyer_id: "mock-buyer-1",
    inventory_id: "inv-mock-st-1",
    equipment_id: "inv-3",
    price: 4,
    quantity: 1,
    listing_status: "SOLD",
    item_data: { name: "Advanced Stim Injector", rarity: "Uncommon" },
    sold_at: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: "hist-mock-2",
    seller_id: "mock-seller-2",
    buyer_id: "mock-buyer-2",
    inventory_id: "inv-mock-rif-2",
    equipment_id: "inv-basic-rifle",
    price: 150,
    quantity: 1,
    listing_status: "SOLD",
    item_data: { name: "Standard Issue Assault Rifle", rarity: "Common" },
    sold_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "hist-mock-3",
    seller_id: "RED_QUEEN_LOGISTICS",
    buyer_id: "mock-buyer-3",
    inventory_id: "inv-mock-core-3",
    equipment_id: "bundle-founder",
    price: 100,
    quantity: 1,
    listing_status: "SOLD",
    item_data: { name: "Red Queen Founder Bundle", rarity: "Legendary" },
    sold_at: new Date(Date.now() - 5400000).toISOString()
  }
];

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: true, data: MOCK_TRADE_HISTORY });
    }

    const { data, error } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("listing_status", "SOLD")
      .order("sold_at", { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: data || MOCK_TRADE_HISTORY });
  } catch (err: any) {
    console.warn("Trade history query failed, using mock data fallback:", err.message);
    return NextResponse.json({ success: true, data: MOCK_TRADE_HISTORY });
  }
}
