import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address, inventory_id, price, quantity = 1 } = body;

    if (!wallet_address || !inventory_id || !price) {
      return NextResponse.json({ error: "Missing required fields: wallet_address, inventory_id, price" }, { status: 400 });
    }

    // Security Check: Verify wallet signature ownership
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
      // Offline fallback: database not configured
      return NextResponse.json({ error: "Database not configured. P2P listing operations require database access." }, { status: 503 });
    }

    // Retrieve player profile from DB
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("inventory")
      .eq("wallet_address", hashedWallet)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User profile not found in database." }, { status: 404 });
    }

    const inventory: any[] = user.inventory || [];
    const itemIndex = inventory.findIndex(item => item.id === inventory_id);

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in your inventory." }, { status: 400 });
    }

    const targetItem = inventory[itemIndex];

    if (targetItem.equipped) {
      return NextResponse.json({ error: "Cannot list equipped gear. Unequip it first." }, { status: 400 });
    }

    if ((targetItem.qty || 1) < quantity) {
      return NextResponse.json({ error: "Insufficient item quantity in inventory." }, { status: 400 });
    }

    // Clone item details for the listing record
    const listedItemData = {
      ...targetItem,
      qty: quantity
    };

    // Update player inventory array: decrement quantity or remove item
    let updatedInventory = [...inventory];
    if ((targetItem.qty || 1) === quantity) {
      updatedInventory.splice(itemIndex, 1);
    } else {
      updatedInventory[itemIndex] = {
        ...targetItem,
        qty: targetItem.qty - quantity
      };
    }

    // Create a new listing row
    const { data: listing, error: listingError } = await supabase
      .from("marketplace_items")
      .insert({
        seller_id: hashedWallet,
        buyer_id: null,
        inventory_id: inventory_id,
        equipment_id: targetItem.id || targetItem.equipment_id || "unknown",
        price: Number(price),
        quantity: Number(quantity),
        listing_status: "ACTIVE",
        item_data: listedItemData
      })
      .select()
      .single();

    if (listingError) {
      return NextResponse.json({ error: `Failed to create listing: ${listingError.message}` }, { status: 500 });
    }

    // Update user profile in database
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ inventory: updatedInventory })
      .eq("wallet_address", hashedWallet)
      .select()
      .single();

    if (updateError) {
      // rollback listing if inventory update fails
      await supabase.from("marketplace_items").delete().eq("id", listing.id);
      return NextResponse.json({ error: `Failed to update inventory: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listing,
      profile: updatedUser
    });
  } catch (err: any) {
    console.error("Create listing endpoint error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
