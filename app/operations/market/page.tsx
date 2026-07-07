"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { loadProfile } from "@/lib/game/service";
import { OperativeProfile } from "@/lib/game/types";
import { HOLDER_TIERS_MAP } from "@/lib/game/config";
import { mainframeAudio } from "@/lib/game/audio";

export default function MarketHome() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  const [report, setReport] = useState<any>(null);

  const identifier = publicKey ? publicKey.toBase58() : "offline-operative";

  useEffect(() => {
    setProfile(loadProfile(identifier));

    // Fetch market intelligence report summary
    fetch("/api/marketplace/intelligence")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setReport(json.data);
        }
      })
      .catch(err => console.error("Failed to load market report:", err));
  }, [identifier]);

  const triggerSweep = () => {
    try {
      mainframeAudio.playSweep();
    } catch (e) {}
  };

  // Compute active benefits based on current profile holder tier
  const currentTier = profile?.holderTier !== undefined ? profile.holderTier : 0;
  const tierConfig = (HOLDER_TIERS_MAP as any)[currentTier] || HOLDER_TIERS_MAP[0];
  
  let feePercentage = "5%";
  if (currentTier === 1) feePercentage = "4%";
  else if (currentTier === 2) feePercentage = "3%";
  else if (currentTier === 3) feePercentage = "2%";

  // Dummy placeholder items to populate large visual cards
  const collections = {
    featured: [
      { id: "inv-basic-rifle", name: "Standard Issue Assault Rifle", category: "Weapons", power: 25, rarity: "Common", asset: "/images/wpn_rifle.png" },
      { id: "inv-3", name: "Advanced Stim Injector", category: "Medical", power: 25, rarity: "Uncommon", asset: "/images/med_stim.png" }
    ],
    recommended: [
      { id: "inv-10", name: "Field Medkit", category: "Medical", power: 40, rarity: "Rare", asset: "/images/med_kit.png" }
    ],
    newest: [
      { id: "inv-11", name: "Deuterium Power Cell", category: "Materials", power: 0, rarity: "Rare", asset: "/images/mat_cell.png" }
    ],
    limited: [
      { id: "bundle-founder", name: "Red Queen Founder Bundle", category: "Limited Collections", power: 120, rarity: "Legendary", remaining: 38, asset: "/images/pack_founder.png" },
      { id: "bundle-medical-crate", name: "Emergency Medical Crate", category: "Resource Bundles", power: 0, rarity: "Rare", remaining: 112, asset: "/images/pack_med.png" }
    ],
    trending: [
      { id: "inv-basic-vest", name: "Tactical Plate Vest", category: "Armor", power: 20, rarity: "Common", asset: "/images/arm_vest.png" }
    ]
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
      {/* Left Column: Visual Categories & Carousels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Daily Market Report Widget */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 77, 77, 0.08) 0%, rgba(8, 8, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 77, 77, 0.3)",
          boxShadow: "0 4px 12px rgba(255, 77, 77, 0.05)",
          borderRadius: "6px",
          padding: "20px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "rgba(255, 77, 77, 0.15)",
            color: "var(--accent, #ff4d4d)",
            fontSize: "9px",
            padding: "4px 8px",
            borderBottomLeftRadius: "4px",
            fontWeight: "bold",
            letterSpacing: "1px"
          }}>
            TACTICAL FEED
          </div>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "var(--accent, #ff4d4d)", letterSpacing: "1px" }}>
            DAILY MARKET REPORT
          </h3>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#ddd" }}>
            {report ? (
              <>
                Today's Report: <span style={{ color: "#fff", fontWeight: "bold" }}>{report.demand}</span> {report.supply}
                <br />
                <span style={{ color: "var(--accent, #ff4d4d)", fontWeight: "bold", marginTop: "8px", display: "inline-block" }}>
                  Advisory Recommendation: {report.recommendation}
                </span>
              </>
            ) : (
              "CONNECTING TO RED QUEEN AUDIT LOGS... AGGREGATING TELEMETRY..."
            )}
          </p>
        </div>

        {/* Home featured segments */}
        {Object.entries(collections).map(([key, items]) => (
          <div key={key}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: "8px",
              marginBottom: "16px"
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "18px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "#fff"
              }}>
                {key} COLLECTIONS
              </h2>
              <Link href="/operations/market/supply">
                <span onClick={triggerSweep} style={{ fontSize: "12px", color: "var(--accent, #ff4d4d)", cursor: "pointer" }}>VIEW ALL ➔</span>
              </Link>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px"
            }}>
              {items.map((item: any) => (
                <div key={item.id} style={{
                  background: "#0d0e14",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "6px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "all 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 77, 77, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "none";
                }}
                >
                  {/* Artwork Placeholder Box */}
                  <div style={{
                    width: "100%",
                    height: "140px",
                    background: "rgba(255, 77, 77, 0.03)",
                    border: "1px dashed rgba(255, 77, 77, 0.15)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: "12px",
                    textTransform: "uppercase"
                  }}>
                    [ {item.category.slice(0, -1)} ARTWORK ]
                  </div>

                  {item.remaining !== undefined && (
                    <div style={{
                      position: "absolute",
                      top: "24px",
                      left: "24px",
                      background: "#ff4d4d",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "2px"
                    }}>
                      {item.remaining} REMAINING
                    </div>
                  )}

                  <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.name}
                  </h3>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#8c8c94"
                  }}>
                    <span>{item.rarity.toUpperCase()}</span>
                    <span>POWER: {item.power}</span>
                  </div>

                  <Link href={`/operations/market/item/${item.id}`} className="stretched-link" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onClick={triggerSweep} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right Column: Active Benefits Panel & Future Modules */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Holder Benefits Panel */}
        <div style={{
          background: "#0c0d12",
          border: "1px solid rgba(255, 77, 77, 0.3)",
          padding: "20px",
          borderRadius: "6px",
          boxShadow: "0 0 10px rgba(255,77,77,0.05)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", letterSpacing: "1px", color: "#ff4d4d", borderBottom: "1px solid rgba(255,77,77,0.2)", paddingBottom: "8px" }}>
            HOLDER BENEFITS
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>CURRENT HOLDER TIER</div>
              <div style={{ color: "#fff", fontSize: "16px", fontWeight: "bold", marginTop: "2px" }}>{tierConfig.name.toUpperCase()}</div>
            </div>
            
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>DAILY OPERATIONS</div>
              <div style={{ color: "#00f0ff", fontWeight: "bold", marginTop: "2px" }}>
                +{tierConfig.extraDeployments} ALLOCATION
              </div>
            </div>

            <div>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>DAILY COMBAT SIMULATIONS</div>
              <div style={{ color: "#00f0ff", fontWeight: "bold", marginTop: "2px" }}>
                +{tierConfig.extraDeployments > 0 ? tierConfig.extraDeployments : 0} SIMS
              </div>
            </div>

            <div>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>XP BONUS</div>
              <div style={{ color: "#00f0ff", fontWeight: "bold", marginTop: "2px" }}>
                +{Math.round(tierConfig.xpBoost * 100)}% MULTIPLIER
              </div>
            </div>

            <div>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>MARKETPLACE FEE</div>
              <div style={{ color: "#ffc83b", fontWeight: "bold", marginTop: "2px" }}>
                {feePercentage} FLAT TAX
              </div>
            </div>

            <div>
              <div style={{ color: "#8c8c94", fontSize: "10px" }}>THREAT UTILITY STATUS</div>
              <div style={{ color: "#ff4d4d", fontWeight: "bold", marginTop: "2px" }}>
                ACTIVE - 50% EQUIVALENT VALUE
              </div>
            </div>
          </div>
        </div>

        {/* Future Modules "Coming Soon" */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: "0", fontSize: "14px", letterSpacing: "1px", color: "#888", textTransform: "uppercase" }}>
            FUTURE WORKSTATIONS
          </h3>
          
          {[
            "Buy Orders",
            "Auctions",
            "Crafting",
            "On-chain Assets",
            "Holder Exclusive Collections"
          ].map(module => (
            <div key={module} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "4px",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#666" }}>{module.toUpperCase()}</span>
              <span style={{
                fontSize: "9px",
                background: "rgba(255, 77, 77, 0.08)",
                color: "#ff4d4d",
                padding: "2px 6px",
                borderRadius: "2px",
                border: "1px solid rgba(255, 77, 77, 0.2)"
              }}>COMING SOON</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
