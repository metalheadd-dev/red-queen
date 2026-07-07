"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INITIAL_INVENTORY } from "@/lib/game/data";
import { InventoryItem } from "@/lib/game/types";
import { mainframeAudio } from "@/lib/game/audio";

export default function ItemDetailView() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);

  const itemId = params.id as string;

  useEffect(() => {
    // Find static item details from the template inventory in data.ts
    // If it's a bundle or pack, we mock its stats
    const matched = INITIAL_INVENTORY.find(i => i.id === itemId);
    if (matched) {
      setItem(matched);
    } else {
      // Mock details for bundles/crates
      const mockBundle: Record<string, any> = {
        "bundle-starter": {
          id: "bundle-starter",
          name: "Survival Starter Pack",
          rarity: "Rare",
          quality: 100,
          slot: "None",
          classRequirement: "None",
          power: 45,
          desc: "Excellent starting loadout package containing basic survival gear and initial stim sets.",
          qty: 1,
          type: "consumable",
          itemLevel: 1,
          stats: { Contents: "Basic vest + Basic rifle + 2x Stim Injector" },
          category: "Starter Packs",
          weight: 5.0
        },
        "bundle-supporter": {
          id: "bundle-supporter",
          name: "Ecosystem Supporter Pack",
          rarity: "Epic",
          quality: 100,
          slot: "None",
          classRequirement: "None",
          power: 75,
          desc: "Special collector pack reinforcing your operative status inside the Red Queen network.",
          qty: 1,
          type: "quest",
          itemLevel: 1,
          stats: { Reputation: "+50", ContaminationFilter: "+15%" },
          category: "Supporter Packs",
          weight: 2.0
        },
        "bundle-founder": {
          id: "bundle-founder",
          name: "Red Queen Founder Bundle",
          rarity: "Legendary",
          quality: 100,
          slot: "None",
          classRequirement: "None",
          power: 120,
          desc: "Limited allocation commander crate containing elite prototype shield cores and advanced telemetry scanners.",
          qty: 1,
          type: "quest",
          itemLevel: 1,
          stats: { ShieldCharge: "+200", OperationalStanding: "+100" },
          category: "Limited Collections",
          weight: 8.5
        },
        "bundle-medical-crate": {
          id: "bundle-medical-crate",
          name: "Bulk Emergency Medical Crate",
          rarity: "Rare",
          quality: 100,
          slot: "None",
          classRequirement: "None",
          power: 50,
          desc: "Crate packed with medical consumables including Stims, Medkits and Pathogen strain indicators.",
          qty: 1,
          type: "consumable",
          itemLevel: 1,
          stats: { HealthRestoration: "+150 HP total", PathogenResistance: "+30%" },
          category: "Resource Bundles",
          weight: 4.5
        }
      };

      if (mockBundle[itemId]) {
        setItem(mockBundle[itemId]);
      }
    }
  }, [itemId]);

  const triggerTick = () => {
    try { mainframeAudio.playTick(); } catch (e) {}
  };

  if (!item) {
    return (
      <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>
        LOCATING ITEM METADATA PARAMETERS...
      </div>
    );
  }

  // Recommended tag matches
  const recommendationTags = ["High Demand", "Recommended Purchase", "Price Below Average", "Limited Availability", "Demand Increasing"];
  const selectedTag = recommendationTags[Math.floor((item.name.length + item.power) % recommendationTags.length)];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        
        {/* Left: Graphic Artwork Placeholder */}
        <div style={{
          flex: "0 0 300px",
          height: "300px",
          background: "rgba(255, 77, 77, 0.02)",
          border: "1px dashed rgba(255, 77, 77, 0.2)",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255, 255, 255, 0.2)",
          fontSize: "14px",
          textTransform: "uppercase",
          position: "relative"
        }}>
          [ {item.category?.toUpperCase() || "ITEM"} IMAGING ]

          {/* Recommendation tag floating */}
          <span style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(0, 240, 255, 0.1)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            color: "#00f0ff",
            fontSize: "10px",
            fontWeight: "bold",
            padding: "4px 8px",
            borderRadius: "2px",
            letterSpacing: "1px"
          }}>
            {selectedTag.toUpperCase()}
          </span>
        </div>

        {/* Right: Technical Specifications */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <span style={{
              fontSize: "10px",
              background: "rgba(255,255,255,0.06)",
              padding: "2px 6px",
              borderRadius: "2px",
              color: "#8c8c94"
            }}>{item.category?.toUpperCase()}</span>
            
            <h2 style={{ margin: "8px 0 4px 0", fontSize: "24px", color: "#fff" }}>
              {item.name}
            </h2>
            
            <div style={{ fontSize: "12px", color: "#666" }}>
              TEMPLATE ID: {item.id} // RARITY: {item.rarity.toUpperCase()}
            </div>
          </div>

          <div style={{
            background: "#0c0d12",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "16px",
            borderRadius: "6px",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#ddd"
          }}>
            {item.desc}
          </div>

          {/* Stats breakdown */}
          <div style={{
            background: "#0c0d12",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "16px",
            borderRadius: "6px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--accent, #ff4d4d)", letterSpacing: "1px" }}>
              TACTICAL PARAMETERS
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "#666" }}>SLOT:</span> <span style={{ color: "#fff" }}>{item.slot || "None"}</span>
              </div>
              <div>
                <span style={{ color: "#666" }}>POWER RATING:</span> <span style={{ color: "#00f0ff", fontWeight: "bold" }}>{item.power}</span>
              </div>
              <div>
                <span style={{ color: "#666" }}>WEIGHT:</span> <span style={{ color: "#fff" }}>{item.weight || 0} kg</span>
              </div>
              <div>
                <span style={{ color: "#666" }}>CLASS REQUIREMENT:</span> <span style={{ color: "#fff" }}>{item.classRequirement || "None"}</span>
              </div>

              {/* Loop dynamic stats */}
              {Object.entries(item.stats || {}).map(([sKey, sVal]) => (
                <div key={sKey} style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ color: "#666", textTransform: "uppercase" }}>{sKey}:</span> <span style={{ color: "#ffc83b", fontWeight: "bold" }}>{sVal}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <Link href="/operations/market/supply" style={{ flex: 1 }}>
              <button
                onClick={triggerTick}
                style={{
                  width: "100%",
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
                PROCURE FROM LOGISTICS
              </button>
            </Link>
            
            <button
              onClick={() => { triggerTick(); router.back(); }}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#aaa",
                padding: "12px 20px",
                fontSize: "12px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              GO BACK
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
