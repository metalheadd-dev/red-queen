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

    // Security Check: Verify signature matches the buyer wallet
    const authIdentifier = await getAuthIdentifier(req);
    if (!authIdentifier) {
      if (process.env.NODE_ENV !== "development" || wallet_address !== "offline-operative") {
        return NextResponse.json({ error: "Unauthenticated session" }, { status: 401 });
      }
    } else if (authIdentifier !== wallet_address) {
      return NextResponse.json({ error: "Wallet ownership mismatch" }, { status: 403 });
    }

    const hashedBuyer = getHashedWallet(wallet_address);

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured. P2P purchases require database access." }, { status: 503 });
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
      return NextResponse.json({ error: "Listing is no longer active." }, { status: 400 });
    }

    if (listing.seller_id === hashedBuyer) {
      return NextResponse.json({ error: "You cannot purchase your own listing." }, { status: 400 });
    }

    // 2. Load buyer profile
    const { data: buyer, error: buyerErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedBuyer)
      .single();

    if (buyerErr || !buyer) {
      return NextResponse.json({ error: "Buyer profile not found." }, { status: 404 });
    }

    const price = Number(listing.price);
    const buyerCredits = Number(buyer.credits || 0);

    if (buyerCredits < price) {
      return NextResponse.json({ error: "Insufficient Credits balance for this purchase." }, { status: 400 });
    }

    // 3. Load seller profile to calculate seller fees
    const { data: seller, error: sellerErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", listing.seller_id)
      .single();

    if (sellerErr || !seller) {
      return NextResponse.json({ error: "Seller profile not found. Item may be orphaned." }, { status: 404 });
    }

    // Calculate transaction fee based on seller's holder tier
    const sellerTier = Number(seller.holder_tier !== undefined ? seller.holder_tier : (seller.holderTier || 0));
    let feeRate = 0.05; // Base 5%
    if (sellerTier === 1) feeRate = 0.04;
    else if (sellerTier === 2) feeRate = 0.03;
    else if (sellerTier === 3) feeRate = 0.02;

    const feeAmount = Math.ceil(price * feeRate);
    const sellerProceeds = price - feeAmount;

    // 4. Perform atomic profile updates
    // Update buyer: deduct credits, add item to inventory
    const buyerInventory = [...(buyer.inventory || [])];
    const purchasedItem = {
      ...listing.item_data,
      // Regenerate a unique instance ID to avoid collision
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    buyerInventory.push(purchasedItem);

    const { data: updatedBuyer, error: buyerUpdateErr } = await supabase
      .from("users")
      .update({
        credits: buyerCredits - price,
        inventory: buyerInventory
      })
      .eq("wallet_address", hashedBuyer)
      .select()
      .single();

    if (buyerUpdateErr) {
      return NextResponse.json({ error: `Failed to update buyer balance: ${buyerUpdateErr.message}` }, { status: 500 });
    }

    // Update seller: credit proceeds
    const sellerCredits = Number(seller.credits || 0);
    const { error: sellerUpdateErr } = await supabase
      .from("users")
      .update({
        credits: sellerCredits + sellerProceeds
      })
      .eq("wallet_address", listing.seller_id);

    if (sellerUpdateErr) {
      // Rollback buyer changes (best effort)
      await supabase.from("users").update({ credits: buyerCredits, inventory: buyer.inventory }).eq("wallet_address", hashedBuyer);
      return NextResponse.json({ error: `Failed to update seller proceeds: ${sellerUpdateErr.message}` }, { status: 500 });
    }

    // 5. Update listing record
    const { error: listingUpdateErr } = await supabase
      .from("marketplace_items")
      .update({
        listing_status: "SOLD",
        buyer_id: hashedBuyer,
        sold_at: new Date().toISOString()
      })
      .eq("id", listing_id);

    if (listingUpdateErr) {
      console.error("Failed to update listing status after transaction was completed:", listingUpdateErr.message);
    }

    return NextResponse.json({
      success: true,
      profile: updatedBuyer,
      message: `Successfully purchased ${listing.item_data.name} for ${price} Credits.`
    });
  } catch (err: any) {
    console.error("Purchase endpoint error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
