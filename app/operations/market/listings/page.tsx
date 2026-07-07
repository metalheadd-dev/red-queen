"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import { loadProfile, saveProfile } from "@/lib/game/service";
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
  sold_at: string | null;
}

export default function MyListings() {
  const { publicKey } = useWallet();
  const { session } = useAuth();
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  const [myListings, setMyListings] = useState<P2PListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const identifier = publicKey ? publicKey.toBase58() : "offline-operative";

  useEffect(() => {
    setProfile(loadProfile(identifier));
    fetchMyListings();
  }, [identifier]);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      // In development / fallback mode, we fetch mock listings
      const res = await fetch("/api/marketplace");
      const json = await res.json();
      if (json.success) {
        // Filter where seller is me. 
        // In local mock mode, we hash the identifier to compare.
        const { getHashedWallet } = require("@/lib/crypto");
        const hashedMe = getHashedWallet(identifier);
        
        // Let's check listing.seller_id matches hashedMe or "mock-seller-1" (for display fallback)
        let filtered = json.data.filter((l: any) => l.seller_id === hashedMe || l.seller_id === "mock-seller-1" || l.seller_id === identifier);
        
        // Also load sold/cancelled listings from history endpoint to populate other states
        const histRes = await fetch("/api/marketplace/history");
        const histJson = await histRes.json();
        if (histJson.success) {
          const myHist = histJson.data.filter((l: any) => l.seller_id === hashedMe || l.seller_id === identifier);
          filtered = [...filtered, ...myHist];
        }

        setMyListings(filtered);
      }
    } catch (e) {
      console.error("Failed to load my listings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (listingId: string) => {
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

      const res = await fetch("/api/marketplace/cancel", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: identifier,
          listing_id: listingId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel listing.");
      }

      try { mainframeAudio.playSuccess(); } catch (e) {}
      setMessage(data.message);
      saveProfile(identifier, data.profile);
      setProfile(data.profile);
      fetchMyListings();
    } catch (err: any) {
      try { mainframeAudio.playWarning(); } catch (e) {}
      setMessage(`ERROR: ${err.message}`);
    }
  };

  const triggerTick = () => {
    try { mainframeAudio.playTick(); } catch (e) {}
  };

  const activeListings = myListings.filter(l => l.listing_status === "ACTIVE");
  const soldListings = myListings.filter(l => l.listing_status === "SOLD");
  const expiredListings = myListings.filter(l => l.listing_status === "EXPIRED");
  const cancelledListings = myListings.filter(l => l.listing_status === "CANCELLED");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
          My Listings Manager
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#8c8c94", fontSize: "12px" }}>
          Manage your active sale parameters, view completed transactions, and review expired/cancelled items.
        </p>
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

      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>SCANNING RETRIEVAL GRID...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Active Listings */}
          <div>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px", color: "#ff4d4d", letterSpacing: "1px" }}>
              ACTIVE LISTINGS ({activeListings.length})
            </h3>
            {activeListings.length === 0 ? (
              <div style={{ color: "#555", fontSize: "12px", padding: "12px 0" }}>NO ACTIVE LISTINGS POSTED.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {activeListings.map(l => (
                  <div key={l.id} style={{ background: "#0c0d12", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "6px", position: "relative" }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>{l.item_data.name}</h4>
                    <div style={{ fontSize: "12px", color: "#8c8c94", marginBottom: "12px" }}>
                      PRICE: <span style={{ color: "#ffc83b", fontWeight: "bold" }}>{l.price} Credits</span>
                    </div>
                    <button
                      onClick={() => { triggerTick(); handleCancel(l.id); }}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "1px solid rgba(255, 77, 77, 0.5)",
                        color: "#ff4d4d",
                        padding: "8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      CANCEL LISTING
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sold Listings */}
          <div>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px", color: "#00f0ff", letterSpacing: "1px" }}>
              SOLD LISTINGS ({soldListings.length})
            </h3>
            {soldListings.length === 0 ? (
              <div style={{ color: "#555", fontSize: "12px", padding: "12px 0" }}>NO SOLD LISTINGS RECORDED.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {soldListings.map(l => (
                  <div key={l.id} style={{ background: "#0c0d12", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "6px", opacity: 0.8 }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#aaa" }}>{l.item_data.name}</h4>
                    <div style={{ fontSize: "12px", color: "#8c8c94" }}>
                      PRICE: <span style={{ color: "#ffc83b" }}>{l.price} Credits</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                      SOLD AT: {l.sold_at ? new Date(l.sold_at).toLocaleString() : "UNKNOWN"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancelled Listings */}
          <div>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px", color: "#888", letterSpacing: "1px" }}>
              CANCELLED LISTINGS ({cancelledListings.length})
            </h3>
            {cancelledListings.length === 0 ? (
              <div style={{ color: "#555", fontSize: "12px", padding: "12px 0" }}>NO CANCELLED LISTINGS RECORDED.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {cancelledListings.map(l => (
                  <div key={l.id} style={{ background: "#0c0d12", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "6px", opacity: 0.6 }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#666" }}>{l.item_data.name}</h4>
                    <div style={{ fontSize: "11px", color: "#555" }}>
                      ORIGINAL PRICE: {l.price} Credits
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expired Listings */}
          <div>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px", color: "#888", letterSpacing: "1px" }}>
              EXPIRED LISTINGS ({expiredListings.length})
            </h3>
            {expiredListings.length === 0 ? (
              <div style={{ color: "#555", fontSize: "12px", padding: "12px 0" }}>NO EXPIRED LISTINGS RECORDED.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {expiredListings.map(l => (
                  <div key={l.id} style={{ background: "#0c0d12", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "6px", opacity: 0.6 }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#666" }}>{l.item_data.name}</h4>
                    <div style={{ fontSize: "11px", color: "#555" }}>
                      ORIGINAL PRICE: {l.price} Credits
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
