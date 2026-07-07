"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import { loadProfile, saveProfile, loadInventory, saveInventory } from "@/lib/game/service";
import { INITIAL_INVENTORY } from "@/lib/game/data";
import { OperativeProfile, InventoryItem } from "@/lib/game/types";
import { mainframeAudio } from "@/lib/game/audio";

interface P2PListing {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  inventory_id: string;
  equipment_id: string;
  price: number;
  quantity: number;
  listing_status: string;
  item_data: InventoryItem;
  listed_at: string;
}

export default function SOLvivorExchange() {
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [listings, setListings] = useState<P2PListing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [rarity, setRarity] = useState("");
  
  // Drawer/Modal States
  const [showListDrawer, setShowListDrawer] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const identifier = publicKey ? publicKey.toBase58() : "offline-operative";

  useEffect(() => {
    setProfile(loadProfile(identifier));
    setInventory(loadInventory(identifier, INITIAL_INVENTORY));
    fetchListings();
  }, [identifier, search, category, rarity]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (category) q.set("category", category);
      if (rarity) q.set("rarity", rarity);

      const res = await fetch(`/api/marketplace?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setListings(json.data);
      }
    } catch (e) {
      console.error("Failed to load listings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listingId: string) => {
    if (!profile) return;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      } else if (publicKey) {
        const savedSig = localStorage.getItem(`rq_sol_sig:${identifier}`);
        if (savedSig) {
          const { signature, message } = JSON.parse(savedSig);
          headers["X-Solana-PublicKey"] = identifier;
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        }
      }

      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: identifier,
          listing_id: listingId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Purchase failed.");
      }

      try { mainframeAudio.playSuccess(); } catch (e) {}
      setMessage(data.message);
      saveProfile(identifier, data.profile);
      setProfile(data.profile);
      fetchListings();
    } catch (err: any) {
      try { mainframeAudio.playWarning(); } catch (e) {}
      setMessage(`ERROR: ${err.message}`);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedInventoryItem || !listPrice || !profile) return;
    setIsSubmittingList(true);
    setMessage(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      } else if (publicKey) {
        const savedSig = localStorage.getItem(`rq_sol_sig:${identifier}`);
        if (savedSig) {
          const { signature, message } = JSON.parse(savedSig);
          headers["X-Solana-PublicKey"] = identifier;
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        }
      }

      const res = await fetch("/api/marketplace/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: identifier,
          inventory_id: selectedInventoryItem.id,
          price: Number(listPrice),
          quantity: 1
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create listing.");
      }

      try { mainframeAudio.playSuccess(); } catch (e) {}
      setMessage(`LISTING SECURED: ${selectedInventoryItem.name} listed for ${listPrice} Credits.`);
      saveProfile(identifier, data.profile);
      setProfile(data.profile);
      if (data.profile.inventory) {
        saveInventory(identifier, data.profile.inventory);
        setInventory(data.profile.inventory);
      }
      setSelectedInventoryItem(null);
      setListPrice("");
      setShowListDrawer(false);
      fetchListings();
    } catch (err: any) {
      try { mainframeAudio.playWarning(); } catch (e) {}
      setMessage(`ERROR: ${err.message}`);
    } finally {
      setIsSubmittingList(false);
    }
  };

  const triggerTick = () => {
    try { mainframeAudio.playTick(); } catch (e) {}
  };

  // Unequipped items available to list
  const listableItems = inventory.filter((i: InventoryItem) => !i.equipped);

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
            SOLvivor Exchange (P2P)
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#8c8c94", fontSize: "12px" }}>
            Trade equipment and resources directly with other operatives. Transactions settle in Credits.
          </p>
        </div>
        <button
          onClick={() => { triggerTick(); setShowListDrawer(true); }}
          style={{
            background: "var(--accent, #ff4d4d)",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            fontSize: "12px",
            fontWeight: "bold",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          CREATE NEW LISTING
        </button>
      </div>

      {message && (
        <div style={{
          background: message.startsWith("ERROR") ? "rgba(255, 77, 77, 0.1)" : "rgba(0, 240, 255, 0.1)",
          border: "1px solid " + (message.startsWith("ERROR") ? "rgba(255, 77, 77, 0.4)" : "rgba(0, 240, 255, 0.4)"),
          color: message.startsWith("ERROR") ? "#ff4d4d" : "#00f0ff",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "20px",
          fontSize: "13px"
        }}>
          {message.toUpperCase()}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
        background: "#0c0d12",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH ITEM NAME..."
          style={{
            background: "#08080a",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 12px",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "inherit",
            flex: 1
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            background: "#08080a",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 12px",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "inherit",
            width: "160px"
          }}
        >
          <option value="">ALL CATEGORIES</option>
          <option value="Weapons">WEAPONS</option>
          <option value="Armor">ARMOR</option>
          <option value="Medical">MEDICAL</option>
          <option value="Tools">TOOLS</option>
          <option value="Materials">MATERIALS</option>
        </select>

        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          style={{
            background: "#08080a",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 12px",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "inherit",
            width: "160px"
          }}
        >
          <option value="">ALL RARITIES</option>
          <option value="Common">COMMON</option>
          <option value="Uncommon">UNCOMMON</option>
          <option value="Rare">RARE</option>
          <option value="Epic">EPIC</option>
          <option value="Legendary">LEGENDARY</option>
        </select>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>SCANNING RETRIEVAL GRID...</div>
      ) : listings.length === 0 ? (
        <div style={{ color: "#555", textAlign: "center", padding: "40px" }}>NO ACTIVE P2P LISTINGS FOUND MATCHING PARAMETERS.</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px"
        }}>
          {listings.map(l => (
            <div key={l.id} style={{
              background: "#0c0d12",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              position: "relative"
            }}>
              {/* Dynamic recommendation tag */}
              {l.price < 50 && (
                <span style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  fontSize: "9px",
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  color: "#00f0ff",
                  padding: "2px 6px",
                  borderRadius: "2px",
                  fontWeight: "bold"
                }}>
                  PRICE BELOW AVERAGE
                </span>
              )}

              {/* Artwork Box */}
              <div style={{
                width: "100%",
                height: "140px",
                background: "rgba(255, 77, 77, 0.02)",
                border: "1px dashed rgba(255, 77, 77, 0.12)",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                color: "rgba(255, 255, 255, 0.15)",
                fontSize: "12px",
                textTransform: "uppercase"
              }}>
                [ {l.item_data.category?.toUpperCase() || "ITEM"} ARTWORK ]
              </div>

              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#fff" }}>{l.item_data.name}</h3>
              <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "16px" }}>
                SELLER: {l.seller_id.slice(0, 10)}... // {l.item_data.rarity}
              </span>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <span style={{ fontSize: "12px", color: "#8c8c94" }}>PRICE:</span>
                <span style={{ fontSize: "18px", color: "#ffc83b", fontWeight: "bold" }}>{l.price} CREDITS</span>
              </div>

              <button
                onClick={() => handlePurchase(l.id)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "1px solid var(--accent, #ff4d4d)",
                  color: "var(--accent, #ff4d4d)",
                  padding: "10px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,77,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                EXECUTE PURCHASE
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Drawer/Modal */}
      {showListDrawer && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(8, 8, 10, 0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#0c0d12",
            border: "1px solid rgba(255, 77, 77, 0.4)",
            borderRadius: "6px",
            padding: "24px",
            width: "480px",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.8)",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "var(--accent, #ff4d4d)" }}>
              CREATE EXCHANGE LISTING
            </h3>

            {/* Choose item */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", color: "#8c8c94", marginBottom: "8px", letterSpacing: "1px" }}>SELECT UNEQUIPPED ITEM</div>
              <div style={{
                maxHeight: "180px",
                overflowY: "auto",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                background: "#08080a"
              }}>
                {listableItems.length === 0 ? (
                  <div style={{ padding: "12px", color: "#555", fontSize: "12px" }}>NO UNEQUIPPED GEAR AVAILABLE.</div>
                ) : (
                  listableItems.map((item: InventoryItem) => (
                    <div
                      key={item.id}
                      onClick={() => { triggerTick(); setSelectedInventoryItem(item); }}
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        background: selectedInventoryItem?.id === item.id ? "rgba(255, 77, 77, 0.08)" : "none",
                        color: selectedInventoryItem?.id === item.id ? "var(--accent, #ff4d4d)" : "#fff",
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{item.name} ({item.rarity})</span>
                      <span>QTY: {item.qty}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedInventoryItem && (
              <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "20px",
                fontSize: "12px"
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>SELECTED: {selectedInventoryItem.name}</div>
                <div style={{ color: "#888" }}>{selectedInventoryItem.desc}</div>
              </div>
            )}

            {/* Price input */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "10px", color: "#8c8c94", marginBottom: "8px", letterSpacing: "1px" }}>
                PRICE (CREDITS)
              </label>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="ENTER VALUE IN CREDITS..."
                style={{
                  width: "100%",
                  background: "#08080a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "10px 12px",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                disabled={isSubmittingList || !selectedInventoryItem || !listPrice}
                onClick={handleCreateListing}
                style={{
                  flex: 1,
                  background: "var(--accent, #ff4d4d)",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {isSubmittingList ? "SECURING..." : "PUBLISH OFFER"}
              </button>
              <button
                disabled={isSubmittingList}
                onClick={() => { triggerTick(); setShowListDrawer(false); setSelectedInventoryItem(null); setListPrice(""); }}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#aaa",
                  padding: "12px 16px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
