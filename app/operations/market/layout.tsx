"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import AccessGuard from "@/components/AccessGuard";
import { mainframeAudio } from "@/lib/game/audio";
import { loadProfile } from "@/lib/game/service";
import { OperativeProfile } from "@/lib/game/types";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [profile, setProfile] = useState<OperativeProfile | null>(null);

  const identifier = publicKey ? publicKey.toBase58() : "offline-operative";

  useEffect(() => {
    // Load local profile for quick display of balances
    const p = loadProfile(identifier);
    setProfile(p);
  }, [identifier, pathname]);

  const triggerSweep = () => {
    try {
      mainframeAudio.playSweep();
    } catch (e) {}
  };

  const navItems = [
    { label: "WORKSTATION HUB", path: "/operations/market" },
    { label: "RED QUEEN LOGISTICS", path: "/operations/market/supply" },
    { label: "SOLVIVOR EXCHANGE", path: "/operations/market/exchange" },
    { label: "MY LISTINGS", path: "/operations/market/listings" },
    { label: "TRADE HISTORY", path: "/operations/market/history" },
    { label: "MARKET INTELLIGENCE", path: "/operations/market/intelligence" },
  ];

  return (
    <AccessGuard>
      <div style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#ffffff",
        fontFamily: "var(--mono, monospace)",
        padding: "24px",
        boxSizing: "border-box",
        border: "1px solid rgba(255, 77, 77, 0.15)",
        margin: "12px",
        borderRadius: "8px",
        position: "relative"
      }}>
        {/* Bloomberg-style Ticker Tape */}
        <div style={{
          background: "#0c0d12",
          border: "1px solid rgba(255, 77, 77, 0.25)",
          padding: "6px 12px",
          marginBottom: "20px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          fontSize: "12px",
          color: "#00f0ff",
          textShadow: "0 0 4px rgba(0, 240, 255, 0.3)",
          position: "relative"
        }}>
          <div style={{
            display: "inline-block",
            animation: "marquee 35s linear infinite"
          }}>
            [SYSTEM ALERT] RED QUEEN LOGISTICS CHANNELS FULLY OPERATIONAL ... [P2P EXCHANGE] KINETIC CARBINE V3 TRANSFERRED FOR 150 CREDITS ... [LOGISTICS] ADVANCED STIM INJECTOR SECURED FOR 4 THREAT ... [TELEMETRY] DEUTERIUM CELL SCARCITY DETECTED IN QUADRANT 4 ... [RLS] TRANSACTION VAULTS ENGAGED SECURELY ...
          </div>
          <style jsx>{`
            @keyframes marquee {
              0% { transform: translate3d(100%, 0, 0); }
              100% { transform: translate3d(-100%, 0, 0); }
            }
          `}</style>
        </div>

        {/* Top Header Panel */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid rgba(255, 77, 77, 0.3)",
          paddingBottom: "16px",
          marginBottom: "24px"
        }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--accent, #ff4d4d)", fontWeight: "bold", letterSpacing: "2px" }}>
              COMMAND NODE SYSTEM // WORKSTATION // MARKETPLACE
            </div>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", letterSpacing: "-0.5px", textTransform: "uppercase", textShadow: "0 0 8px rgba(255,77,77,0.2)" }}>
              Red Queen Trade Terminal
            </h1>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Wallet & Balance Display */}
            {profile && (
              <div style={{
                background: "rgba(255, 77, 77, 0.04)",
                border: "1px solid rgba(255, 77, 77, 0.2)",
                padding: "8px 16px",
                borderRadius: "4px",
                textAlign: "right",
                fontSize: "12px"
              }}>
                <div style={{ color: "#888", fontSize: "10px" }}>ACTIVE OPERATIVE ACCOUNT</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <div>
                    CREDITS: <span style={{ color: "#ffc83b", fontWeight: "bold" }}>{profile.credits || 0}</span>
                  </div>
                  <div>
                    THREAT: <span style={{ color: "#00f0ff", fontWeight: "bold" }}>{profile.verifiedBalance || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <Link href="/operations">
              <button 
                onClick={triggerSweep}
                style={{
                  background: "none",
                  border: "1px solid var(--accent, #ff4d4d)",
                  color: "var(--accent, #ff4d4d)",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 77, 77, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                RETURN TO MAINBOARD
              </button>
            </Link>
          </div>
        </div>

        {/* Workstation Tab Navigation */}
        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "12px"
        }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link href={item.path} key={item.path}>
                <button
                  onClick={triggerSweep}
                  style={{
                    background: isActive ? "rgba(255, 77, 77, 0.1)" : "none",
                    color: isActive ? "#ff4d4d" : "#88888c",
                    border: "1px solid " + (isActive ? "rgba(255, 77, 77, 0.4)" : "rgba(255, 255, 255, 0.1)"),
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#88888c";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                >
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Workstation Child Screens */}
        <div style={{
          minHeight: "500px"
        }}>
          {children}
        </div>
      </div>
    </AccessGuard>
  );
}
