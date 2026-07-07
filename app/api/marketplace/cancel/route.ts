import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address, listing_id } = body;

    if (!wallet_address || !listing_id) {
      return NextResponse.json({ error: "Missing required fields: wallet_address, listing_id" }, { status: 400 });
    }

    // Security Check: Verify signature matches the seller wallet
    const authIdentifier = await getAuthIdentifier(req);
    if (!authIdentifier) {
      if (process.env.NODE_ENV !== "development" || wallet_address !== "offline-operative") {
        return NextResponse.json({ error: "Unauthenticated session" }, { status: 401 });
      }
    } else if (authIdentifier !== wallet_address) {
      return NextResponse.json({ error: "Wallet ownership mismatch" }, { status: 403 });
    }

    const hashedSeller = getHashedWallet(wallet_address);

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured. P2P cancellations require database access." }, { status: 503 });
    }

    // 1. Retrieve the listing
    const { data: listing, error: listingErr } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.listing_status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not active and cannot be cancelled." }, { status: 400 });
    }

    if (listing.seller_id !== hashedSeller) {
      return NextResponse.json({ error: "Access Denied: You do not own this listing." }, { status: 403 });
    }

    // 2. Load seller profile to return the item
    const { data: seller, error: sellerErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedSeller)
      .single();

    if (sellerErr || !seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const inventory = [...(seller.inventory || [])];
    const restoredItem = {
      ...listing.item_data,
      equipped: false // make sure it's unequipped on return
    };
    inventory.push(restoredItem);

    // 3. Perform profile update
    const { data: updatedSeller, error: updateErr } = await supabase
      .from("users")
      .update({ inventory })
      .eq("wallet_address", hashedSeller)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: `Failed to restore item to inventory: ${updateErr.message}` }, { status: 500 });
    }

    // 4. Update listing status to CANCELLED
    const { error: listingUpdateErr } = await supabase
      .from("marketplace_items")
      .update({ listing_status: "CANCELLED" })
      .eq("id", listing_id);

    if (listingUpdateErr) {
      console.error("Failed to mark listing as CANCELLED after inventory restore:", listingUpdateErr.message);
    }

    return NextResponse.json({
      success: true,
      profile: updatedSeller,
      message: "Successfully cancelled listing and restored item to inventory."
    });
  } catch (err: any) {
    console.error("Cancellation endpoint error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
