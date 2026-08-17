"use client";

import { useEffect, useState } from "react";

type Health = {
  available: boolean;
  network: string;
  facilitator: string;
  checkedAt: string;
  reason?: string | null;
};

export default function X402HealthBadge() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/x402/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({
        available: false,
        network: "SOLANA MAINNET",
        facilitator: "UNREACHABLE",
        checkedAt: new Date().toISOString(),
        reason: "Health endpoint unavailable.",
      }));
  }, []);

  return (
    <div className={`x402-health ${health?.available ? "is-online" : health ? "is-offline" : "is-checking"}`}>
      <i />
      <div>
        <span>SETTLEMENT RAIL</span>
        <strong>{!health ? "CHECKING FACILITATOR…" : health.available ? "x402 v2 EXACT SVM AVAILABLE" : "PAYMENT UI DISABLED"}</strong>
        <small>{health ? `${health.facilitator} · ${health.network}${health.reason ? ` · ${health.reason}` : ""}` : "No wallet action requested."}</small>
      </div>
    </div>
  );
}
