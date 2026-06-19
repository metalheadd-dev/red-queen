"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";

// Client-side SHA-256 generator to display the Hashed Passport matching server index
async function generateHashedPassport(pubkey: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pubkey + "red-queen-cyber-salt-2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function StandaloneLeaderboardPage() {
  const { publicKey } = useWallet();
  const { authIdentifier } = useAuth();
  const [hashedWallet, setHashedWallet] = useState<string | null>(null);

  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  useEffect(() => {
    if (wallet) {
      generateHashedPassport(wallet).then((hash) => setHashedWallet(hash));
    } else {
      setHashedWallet(null);
    }
  }, [wallet]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#050505",
      backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
      backgroundSize: "100% 4px, 6px 100%",
      padding: "40px 20px",
      boxSizing: "border-box"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Navigation & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="glow-text" style={{ 
              fontFamily: "var(--title-font)", 
              fontSize: "clamp(24px, 4vw, 36px)", 
              margin: 0, 
              color: "var(--text)", 
              letterSpacing: "0.05em" 
            }}>
              LEADERBOARD OF SOLVIVORS
            </h1>
            <p style={{ fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: "11px", margin: "6px 0 0 0", letterSpacing: "0.1em" }}>
              TACTICAL AGENT COGNITIVE STANDINGS & BIO-REPUTATION INDEX
            </p>
          </div>
          
          {/* Navigation Controls */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/operative" style={{ textDecoration: "none" }}>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                [ OPERATIVE_PROFILE ]
              </button>
            </Link>
            <Link href="/solvivors" style={{ textDecoration: "none" }}>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                [ SOLVIVORS_HUB ]
              </button>
            </Link>
            <Link href="/terminal" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                [ CHAT_TERMINAL ]
              </button>
            </Link>
          </div>
        </div>

        {/* Reusable Leaderboard Feed */}
        <Leaderboard currentHashedWallet={hashedWallet} />
        
      </div>
    </main>
  );
}
