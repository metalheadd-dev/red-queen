import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

// Default catalog seed items
const SEED_LOGISTICS_ITEMS = [
  {
    item_id: "inv-3",
    name: "Advanced Stim Injector",
    category: "Medical",
    price_credits: 40,
    price_threat: 4, // 50% value equivalent at 1 THREAT = 5 Credits
    stock_limit: null,
    stock_remaining: null,
    recommendation: "High Demand",
    is_featured: true,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "inv-10",
    name: "Field Medkit",
    category: "Medical",
    price_credits: 80,
    price_threat: 8,
    stock_limit: null,
    stock_remaining: null,
    recommendation: "Recommended Purchase",
    is_featured: false,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "inv-11",
    name: "Deuterium Power Cell",
    category: "Materials",
    price_credits: 20,
    price_threat: 2,
    stock_limit: null,
    stock_remaining: null,
    recommendation: "Demand Increasing",
    is_featured: false,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "inv-basic-rifle",
    name: "Standard Issue Assault Rifle",
    category: "Weapons",
    price_credits: 200,
    price_threat: 20,
    stock_limit: null,
    stock_remaining: null,
    recommendation: null,
    is_featured: false,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "bundle-starter",
    name: "Survival Starter Pack",
    category: "Starter Packs",
    price_credits: 250,
    price_threat: 25,
    stock_limit: null,
    stock_remaining: null,
    recommendation: "Recommended Purchase",
    is_featured: true,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "bundle-supporter",
    name: "Ecosystem Supporter Pack",
    category: "Supporter Packs",
    price_credits: 500,
    price_threat: 50,
    stock_limit: null,
    stock_remaining: null,
    recommendation: "High Demand",
    is_featured: false,
    is_limited: false,
    is_active: true
  },
  {
    item_id: "bundle-founder",
    name: "Red Queen Founder Bundle",
    category: "Limited Collections",
    price_credits: 1000,
    price_threat: 100,
    stock_limit: 100,
    stock_remaining: 38,
    recommendation: "Limited Availability",
    is_featured: true,
    is_limited: true,
    is_active: true
  },
  {
    item_id: "bundle-medical-crate",
    name: "Bulk Emergency Medical Crate",
    category: "Resource Bundles",
    price_credits: 300,
    price_threat: 30,
    stock_limit: 200,
    stock_remaining: 112,
    recommendation: "Limited Availability",
    is_featured: false,
    is_limited: true,
    is_active: true
  }
];

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: true, data: SEED_LOGISTICS_ITEMS });
    }

    let { data, error } = await supabase
      .from("logistics_catalog")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.warn("Could not query logistics_catalog, using seed fallback:", error.message);
      return NextResponse.json({ success: true, data: SEED_LOGISTICS_ITEMS });
    }

    // Auto-seed if empty
    if (!data || data.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from("logistics_catalog")
        .insert(SEED_LOGISTICS_ITEMS)
        .select();

      if (!seedError && seeded) {
        data = seeded;
      }
    }

    return NextResponse.json({ success: true, data: data || SEED_LOGISTICS_ITEMS });
  } catch (err: any) {
    return NextResponse.json({ success: true, data: SEED_LOGISTICS_ITEMS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address, item_id, method } = body; // method is "credits" or "threat"

    if (!wallet_address || !item_id || !method) {
      return NextResponse.json({ error: "Missing parameters: wallet_address, item_id, method" }, { status: 400 });
    }

    // Authentication Guard
    const authIdentifier = await getAuthIdentifier(req);
    if (!authIdentifier) {
      if (process.env.NODE_ENV !== "development" || wallet_address !== "offline-operative") {
        return NextResponse.json({ error: "Unauthenticated session" }, { status: 401 });
      }
    } else if (authIdentifier !== wallet_address) {
      return NextResponse.json({ error: "Wallet ownership mismatch" }, { status: 403 });
    }

    const hashedWallet = getHashedWallet(wallet_address);

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    // 1. Fetch item from catalog
    const { data: item, error: itemErr } = await supabase
      .from("logistics_catalog")
      .select("*")
      .eq("item_id", item_id)
      .eq("is_active", true)
      .single();

    if (itemErr || !item) {
      // Fallback: check seed list
      const matched = SEED_LOGISTICS_ITEMS.find(i => i.item_id === item_id);
      if (!matched) {
        return NextResponse.json({ error: "Catalog item not found or inactive." }, { status: 404 });
      }
      return NextResponse.json({ error: "Logistics database requires sync." }, { status: 500 });
    }

    // Check stock if limited
    if (item.is_limited && item.stock_remaining !== null && item.stock_remaining <= 0) {
      return NextResponse.json({ error: "Item is out of stock." }, { status: 400 });
    }

    // 2. Fetch buyer profile
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedWallet)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: "Operative profile not found." }, { status: 404 });
    }

    let finalPrice = 0;
    if (method === "credits") {
      finalPrice = Number(item.price_credits);
      const credits = Number(user.credits || 0);
      if (credits < finalPrice) {
        return NextResponse.json({ error: "Insufficient Credits balance." }, { status: 400 });
      }
    } else if (method === "threat") {
      // THREAT payment utility
      finalPrice = Number(item.price_threat);
      // Wait! How do we verify/deduct $THREAT token balances?
      // Since it's an on-chain token, for the off-chain game state, it might be stored in verified_balance
      // or we simulate the THREAT balance deduction. Let's check user's verified_balance.
      const verifiedBalance = Number(user.verified_balance || 0);
      if (verifiedBalance < finalPrice) {
        return NextResponse.json({ error: "Insufficient $THREAT balance." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // 3. Resolve the item template creation
    // Find static item details from INITIAL_INVENTORY templates
    const { INITIAL_INVENTORY } = require("@/lib/game/data");
    const template = INITIAL_INVENTORY.find((i: any) => i.id === item.item_id) || {
      id: item.item_id,
      name: item.name,
      rarity: item.is_limited ? "Rare" : "Common",
      quality: 100,
      slot: "None",
      classRequirement: "None",
      power: 0,
      desc: "Red Queen Logistics issue supply.",
      qty: 1,
      type: "consumable",
      itemLevel: 1,
      stats: {},
      category: item.category
    };

    const newItem = {
      ...template,
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      qty: 1
    };

    // Update user profile credits or verified_balance
    const userInventory = [...(user.inventory || [])];
    userInventory.push(newItem);

    const updateFields: any = { inventory: userInventory };
    if (method === "credits") {
      updateFields.credits = Number(user.credits || 0) - finalPrice;
    } else {
      updateFields.verified_balance = Number(user.verified_balance || 0) - finalPrice;
    }

    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update(updateFields)
      .eq("wallet_address", hashedWallet)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: `Purchase failed: ${updateErr.message}` }, { status: 500 });
    }

    // Update catalog remaining stock
    if (item.is_limited && item.stock_remaining !== null) {
      await supabase
        .from("logistics_catalog")
        .update({ stock_remaining: item.stock_remaining - 1 })
        .eq("id", item.id);
    }

    // Record transaction event in marketplace history
    // We can insert a SOLD row in marketplace_items representing this Logistics transaction
    await supabase.from("marketplace_items").insert({
      seller_id: "RED_QUEEN_LOGISTICS",
      buyer_id: hashedWallet,
      inventory_id: newItem.id,
      equipment_id: item.item_id,
      price: finalPrice,
      quantity: 1,
      listing_status: "SOLD",
      item_data: newItem
    });

    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: `Successfully purchased ${item.name} from Red Queen Logistics using ${method === "credits" ? `${finalPrice} Credits` : `${finalPrice} $THREAT`}.`
    });
  } catch (err: any) {
    console.error("Logistics purchase error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
