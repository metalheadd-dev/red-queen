"use client";

import React, { useEffect, useState } from "react";
import { mainframeAudio } from "@/lib/game/audio";

interface IntelData {
  trendingEquipment: { name: string; category: string; activeListings: number; trend: string }[];
  trendingResources: { name: string; category: string; demandIndex: number; trend: string }[];
  supply: string;
  demand: string;
  recentSalesCount: number;
  redQueenAdvisory: string;
  recommendation: string;
}

export default function MarketIntelligence() {
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/intelligence")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setIntel(json.data);
        }
      })
      .catch(e => console.error("Failed to load intelligence metrics:", e))
      .finally(() => setLoading(false));
  }, []);

  const triggerTick = () => {
    try { mainframeAudio.playTick(); } catch (e) {}
  };

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Market Intelligence Board
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#8c8c94", fontSize: "12px" }}>
          Aggregates marketplace activity and generates tactical market intelligence via Red Queen analysis filters.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>AGGREGATING DATA GRID...</div>
      ) : !intel ? (
        <div style={{ color: "#555", textAlign: "center", padding: "40px" }}>INTELLIGENCE STREAM OFFLINE.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Left Column: Advisories & Demand Analysis */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Red Queen Tactical Advisory */}
            <div style={{
              background: "rgba(255, 77, 77, 0.04)",
              border: "1px solid rgba(255, 77, 77, 0.3)",
              padding: "20px",
              borderRadius: "6px"
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--accent, #ff4d4d)", letterSpacing: "1px" }}>
                RED QUEEN TACTICAL ADVISORY
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", lineHeight: "1.6", color: "#ddd", fontStyle: "italic" }}>
                "{intel.redQueenAdvisory}"
              </p>
              <div style={{
                background: "rgba(0, 240, 255, 0.05)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#00f0ff"
              }}>
                <strong>STRATEGIC COMMAND:</strong> {intel.recommendation.toUpperCase()}
              </div>
            </div>

            {/* Supply & Demand Aggregation */}
            <div style={{
              background: "#0c0d12",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "20px",
              borderRadius: "6px"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#fff", letterSpacing: "1px" }}>
                SUPPLY & DEMAND AGGREGATION
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#8c8c94", marginBottom: "4px" }}>REGIONAL INVENTORY SUPPLY</div>
                  <div style={{ fontSize: "13px", color: "#ddd" }}>{intel.supply}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#8c8c94", marginBottom: "4px" }}>REGIONAL DEPLOYMENT DEMAND</div>
                  <div style={{ fontSize: "13px", color: "#ddd" }}>{intel.demand}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Trending Lists */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Trending Equipment */}
            <div style={{
              background: "#0c0d12",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "20px",
              borderRadius: "6px"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#fff", letterSpacing: "1px" }}>
                TRENDING EQUIPMENT
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {intel.trendingEquipment.map((eq, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "4px",
                    fontSize: "13px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{eq.name}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>{eq.category.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "#ff4d4d" }}>{eq.trend}</div>
                      <div style={{ fontSize: "10px", color: "#888" }}>{eq.activeListings} LISTINGS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Resources */}
            <div style={{
              background: "#0c0d12",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "20px",
              borderRadius: "6px"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#fff", letterSpacing: "1px" }}>
                TRENDING RESOURCES
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {intel.trendingResources.map((res, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "4px",
                    fontSize: "13px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{res.name}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>{res.category.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "#00f0ff" }}>DEMAND: {res.demandIndex}</div>
                      <div style={{ fontSize: "10px", color: "#ff4d4d" }}>{res.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
