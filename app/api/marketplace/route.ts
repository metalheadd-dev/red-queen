import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Mock P2P active listings for offline-operative/local fallback development
let MOCK_P2P_LISTINGS = [
  {
    id: "list-mock-1",
    seller_id: "mock-seller-1",
    buyer_id: null,
    inventory_id: "inv-mock-rif-1",
    equipment_id: "inv-basic-rifle",
    price: 150,
    quantity: 1,
    listing_status: "ACTIVE",
    item_data: {
      id: "inv-mock-rif-1",
      name: "Standard Issue Assault Rifle",
      rarity: "Common",
      quality: 100,
      slot: "Weapon",
      classRequirement: "None",
      power: 25,
      desc: "Reliable kinetic carbine standard issue for recruit security forces.",
      qty: 1,
      type: "weapon",
      itemLevel: 1,
      stats: { DPS: 20 },
      category: "Weapons",
      weight: 3.2,
      durability: 100,
      maxDurability: 100
    },
    listed_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "list-mock-2",
    seller_id: "mock-seller-2",
    buyer_id: null,
    inventory_id: "inv-mock-st-1",
    equipment_id: "inv-3",
    price: 25,
    quantity: 3,
    listing_status: "ACTIVE",
    item_data: {
      id: "inv-mock-st-1",
      name: "Advanced Stim Injector",
      rarity: "Uncommon",
      quality: 100,
      slot: "Medkit",
      classRequirement: "Medic",
      power: 25,
      desc: "Rapidly neutralizes biological toxins and restores 30 HP.",
      qty: 3,
      type: "consumable",
      itemLevel: 5,
      stats: { Heal: "+30 HP", Speed: "+15%" },
      category: "Medical",
      weight: 0.2,
      durability: 100,
      maxDurability: 100
    },
    listed_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "list-mock-3",
    seller_id: "mock-seller-3",
    buyer_id: null,
    inventory_id: "inv-mock-core-1",
    equipment_id: "inv-4",
    price: 1200,
    quantity: 1,
    listing_status: "ACTIVE",
    item_data: {
      id: "inv-mock-core-1",
      name: "Volumetric Shield Core",
      rarity: "Legendary",
      quality: 100,
      slot: "Armor",
      classRequirement: "Scientist",
      factionRequirement: "citadel",
      factionStandingRequirement: 30,
      power: 90,
      desc: "Projects a gravity displacement barrier to deflect analog projectiles.",
      qty: 1,
      type: "armor",
      itemLevel: 25,
      stats: { Shield: "+150", Mitigation: "20%" },
      category: "Armor",
      weight: 5.2,
      durability: 100,
      maxDurability: 100,
      upgradeSlots: 0,
      maxUpgradeSlots: 4
    },
    listed_at: new Date(Date.now() - 10800000).toISOString()
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");
    const search = searchParams.get("search");

    if (!supabase) {
      // Fallback: serve filtered mock listings
      let listings = [...MOCK_P2P_LISTINGS];
      if (category) {
        listings = listings.filter(l => l.item_data.category?.toLowerCase() === category.toLowerCase());
      }
      if (rarity) {
        listings = listings.filter(l => l.item_data.rarity?.toLowerCase() === rarity.toLowerCase());
      }
      if (search) {
        listings = listings.filter(l => l.item_data.name.toLowerCase().includes(search.toLowerCase()));
      }
      return NextResponse.json({ success: true, data: listings });
    }

    let query = supabase
      .from("marketplace_items")
      .select("*")
      .eq("listing_status", "ACTIVE");

    const { data, error } = await query;
    if (error) {
      console.warn("Supabase marketplace fetch warning, falling back to mock:", error.message);
      throw error;
    }

    let listings = data || [];
    if (category) {
      listings = listings.filter((l: any) => l.item_data?.category?.toLowerCase() === category.toLowerCase());
    }
    if (rarity) {
      listings = listings.filter((l: any) => l.item_data?.rarity?.toLowerCase() === rarity.toLowerCase());
    }
    if (search) {
      listings = listings.filter((l: any) => l.item_data?.name?.toLowerCase().includes(search.toLowerCase()));
    }

    return NextResponse.json({ success: true, data: listings });
  } catch (err: any) {
    // Graceful fallback to mock data on table missing or fetch errors
    let listings = [...MOCK_P2P_LISTINGS];
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");
    const search = searchParams.get("search");

    if (category) {
      listings = listings.filter(l => l.item_data.category?.toLowerCase() === category.toLowerCase());
    }
    if (rarity) {
      listings = listings.filter(l => l.item_data.rarity?.toLowerCase() === rarity.toLowerCase());
    }
    if (search) {
      listings = listings.filter(l => l.item_data.name.toLowerCase().includes(search.toLowerCase()));
    }
    return NextResponse.json({ success: true, data: listings });
  }
}
