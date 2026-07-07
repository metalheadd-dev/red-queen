"use client";

import React, { useEffect, useState } from "react";

interface TradeRecord {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  price: number;
  quantity: number;
  listing_status: string;
  item_data: {
    name: string;
    rarity: string;
  };
  sold_at: string;
}

export default function TradeHistory() {
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/history")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setHistory(json.data);
        }
      })
      .catch(e => console.error("Failed to load trade logs:", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
          P2P and Red Queen Logistics Transactions
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#8c8c94", fontSize: "12px" }}>
          Ecosystem-wide transaction audit log. Monitor direct player-to-player operations and logistics supply events.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>RETRIEVING TRANSACTION LEDGER...</div>
      ) : (
        <div style={{
          background: "#0c0d12",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "6px",
          overflow: "hidden"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            textAlign: "left"
          }}>
            <thead>
              <tr style={{
                background: "rgba(255, 77, 77, 0.06)",
                borderBottom: "1px solid rgba(255, 77, 77, 0.2)"
              }}>
                <th style={{ padding: "14px 16px", color: "var(--accent, #ff4d4d)" }}>TIMESTAMP</th>
                <th style={{ padding: "14px 16px", color: "var(--accent, #ff4d4d)" }}>TRANSACTION DETAILS</th>
                <th style={{ padding: "14px 16px", color: "var(--accent, #ff4d4d)" }}>SELLER ID</th>
                <th style={{ padding: "14px 16px", color: "var(--accent, #ff4d4d)" }}>BUYER ID</th>
                <th style={{ padding: "14px 16px", color: "var(--accent, #ff4d4d)", textAlign: "right" }}>VALUE</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const isLogistics = record.seller_id === "RED_QUEEN_LOGISTICS";
                return (
                  <tr key={record.id} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: isLogistics ? "rgba(0, 240, 255, 0.01)" : "none"
                  }}>
                    <td style={{ padding: "14px 16px", color: "#666" }}>
                      {new Date(record.sold_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "bold" }}>
                      {isLogistics ? (
                        <span style={{ color: "#00f0ff" }}>PROCURED: {record.item_data.name}</span>
                      ) : (
                        <span style={{ color: "#fff" }}>EXCHANGED: {record.item_data.name}</span>
                      )}
                      <span style={{
                        fontSize: "9px",
                        marginLeft: "8px",
                        padding: "1px 4px",
                        borderRadius: "2px",
                        background: record.item_data.rarity === "Rare" ? "rgba(0,100,255,0.2)" : (record.item_data.rarity === "Legendary" ? "rgba(255,200,0,0.2)" : "rgba(255,255,255,0.05)"),
                        color: record.item_data.rarity === "Rare" ? "#00a0ff" : (record.item_data.rarity === "Legendary" ? "#ffc83b" : "#aaa")
                      }}>
                        {record.item_data.rarity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: isLogistics ? "#00f0ff" : "#8c8c94", fontSize: "12px" }}>
                      {isLogistics ? "RED QUEEN LOGISTICS" : `${record.seller_id.slice(0, 12)}...`}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#8c8c94", fontSize: "12px" }}>
                      {record.buyer_id ? `${record.buyer_id.slice(0, 12)}...` : "ORPHANED"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: "bold", color: isLogistics ? "#00f0ff" : "#ffc83b" }}>
                      {record.price} {isLogistics ? "THREAT" : "CREDITS"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
