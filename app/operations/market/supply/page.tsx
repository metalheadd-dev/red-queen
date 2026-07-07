"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import { loadProfile, saveProfile } from "@/lib/game/service";
import { OperativeProfile } from "@/lib/game/types";
import { mainframeAudio } from "@/lib/game/audio";

interface CatalogItem {
  id: string;
  item_id: string;
  name: string;
  category: string;
  price_credits: number;
  price_threat: number;
  stock_limit: number | null;
  stock_remaining: number | null;
  recommendation: string | null;
  is_featured: boolean;
  is_limited: boolean;
}

export default function RedQueenLogistics() {
  const { publicKey } = useWallet();
  const { session } = useAuth();
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [purchaseMethod, setPurchaseMethod] = useState<"credits" | "threat">("credits");
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const identifier = publicKey ? publicKey.toBase58() : "offline-operative";

  useEffect(() => {
    setProfile(loadProfile(identifier));

    // Fetch official logistics catalog
    fetch("/api/marketplace/logistics")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCatalog(json.data);
        }
      })
      .catch(err => console.error("Failed to load logistics catalog:", err));
  }, [identifier]);

  const handlePurchase = async () => {
    if (!selectedItem || !profile) return;
    setIsBuying(true);
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

      const res = await fetch("/api/marketplace/logistics/purchase", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: identifier,
          item_id: selectedItem.item_id,
          method: purchaseMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete purchase.");
      }

      // Play success audio
      try { mainframeAudio.playSuccess(); } catch (e) {}

      // Save and update local profile
      saveProfile(identifier, data.profile);
      setProfile(data.profile);
      setMessage(data.message);

      // Refresh catalog stock
      const updatedCatalog = catalog.map(item => {
        if (item.item_id === selectedItem.item_id && item.stock_remaining !== null) {
          return { ...item, stock_remaining: item.stock_remaining - 1 };
        }
        return item;
      });
      setCatalog(updatedCatalog);
      setSelectedItem(null);
    } catch (err: any) {
      try { mainframeAudio.playWarning(); } catch (e) {}
      setMessage(`ERROR: ${err.message}`);
    } finally {
      setIsBuying(false);
    }
  };

  const selectItemForPurchase = (item: CatalogItem) => {
    try { mainframeAudio.playTick(); } catch (e) {}
    setSelectedItem(item);
    setPurchaseMethod("credits");
    setMessage(null);
  };

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Red Queen Logistics Terminal
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#8c8c94", fontSize: "12px" }}>
          Authorized military supply network. Use Credits/USDC value or dynamic $THREAT payment utility.
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

      {/* Catalog Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px"
      }}>
        {catalog.map(item => (
          <div key={item.id} style={{
            background: "#0c0d12",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            transition: "all 0.2s"
          }}>
            {/* Visual Tags */}
            {item.recommendation && (
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
                fontWeight: "bold",
                letterSpacing: "1px"
              }}>
                {item.recommendation.toUpperCase()}
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
              [ {item.category.toUpperCase()} ARTWORK ]
            </div>

            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#fff" }}>{item.name}</h3>
            <span style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "16px" }}>
              CATEGORY: {item.category}
            </span>

            {/* Stock Limit Display */}
            {item.is_limited && (
              <div style={{
                fontSize: "12px",
                color: "#ff4d4d",
                fontWeight: "bold",
                marginBottom: "12px"
              }}>
                {item.stock_remaining} / {item.stock_limit} REMAINING IN RESERVE
              </div>
            )}

            {/* Dual Pricing Display */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.02)",
              padding: "10px 12px",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "13px"
            }}>
              <div>
                CREDITS: <span style={{ color: "#ffc83b", fontWeight: "bold" }}>{item.price_credits}</span>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.1)", height: "18px" }}></div>
              <div>
                THREAT EQ: <span style={{ color: "#00f0ff", fontWeight: "bold" }}>{item.price_threat} THREAT</span>
              </div>
            </div>

            <button
              onClick={() => selectItemForPurchase(item)}
              disabled={item.is_limited && item.stock_remaining !== null && item.stock_remaining <= 0}
              style={{
                width: "100%",
                background: "var(--accent, #ff4d4d)",
                color: "#fff",
                border: "none",
                padding: "10px",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ff3333"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent, #ff4d4d)"; }}
            >
              {item.is_limited && item.stock_remaining !== null && item.stock_remaining <= 0 ? "SOLD OUT" : "INITIALIZE PROCUREMENT"}
            </button>
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {selectedItem && (
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
            width: "440px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.8)",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "var(--accent, #ff4d4d)" }}>
              CONFIRM PROCUREMENT
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#ddd" }}>
              Requesting authorization parameters to deploy item <span style={{ color: "#fff", fontWeight: "bold" }}>{selectedItem.name}</span>.
            </p>

            {/* Selector Method */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", color: "#8c8c94", marginBottom: "8px", letterSpacing: "1px" }}>SELECT METHOD</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { try { mainframeAudio.playTick(); } catch (e){} setPurchaseMethod("credits"); }}
                  style={{
                    flex: 1,
                    background: purchaseMethod === "credits" ? "rgba(255, 77, 77, 0.1)" : "none",
                    color: purchaseMethod === "credits" ? "var(--accent, #ff4d4d)" : "#888",
                    border: "1px solid " + (purchaseMethod === "credits" ? "rgba(255, 77, 77, 0.4)" : "rgba(255,255,255,0.1)"),
                    padding: "10px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  CREDITS ({selectedItem.price_credits})
                </button>
                <button
                  onClick={() => { try { mainframeAudio.playTick(); } catch (e){} setPurchaseMethod("threat"); }}
                  style={{
                    flex: 1,
                    background: purchaseMethod === "threat" ? "rgba(0, 240, 255, 0.08)" : "none",
                    color: purchaseMethod === "threat" ? "#00f0ff" : "#888",
                    border: "1px solid " + (purchaseMethod === "threat" ? "rgba(0, 240, 255, 0.4)" : "rgba(255,255,255,0.1)"),
                    padding: "10px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  THREAT EQ ({selectedItem.price_threat})
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                disabled={isBuying}
                onClick={handlePurchase}
                style={{
                  flex: 1,
                  background: purchaseMethod === "credits" ? "var(--accent, #ff4d4d)" : "#00f0ff",
                  color: purchaseMethod === "credits" ? "#fff" : "#08080a",
                  border: "none",
                  padding: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {isBuying ? "RESOLVING..." : "EXECUTE"}
              </button>
              <button
                disabled={isBuying}
                onClick={() => { try { mainframeAudio.playTick(); } catch(e){} setSelectedItem(null); }}
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
