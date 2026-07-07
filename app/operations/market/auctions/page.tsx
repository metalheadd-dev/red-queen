"use client";

import React from "react";

export default function AuctionsPlaceholder() {
  return (
    <div style={{
      background: "#0c0d12",
      border: "1px solid rgba(255, 77, 77, 0.2)",
      borderRadius: "6px",
      padding: "40px",
      textAlign: "center",
      color: "#888",
      fontFamily: "var(--mono, monospace)"
    }}>
      <h3 style={{ color: "var(--accent, #ff4d4d)", margin: "0 0 12px 0", letterSpacing: "1px" }}>
        AUCTION WORKSTATION LOCK
      </h3>
      <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#ddd" }}>
        DECRYPTION PARAMETERS PENDING. THE RED QUEEN AUCTION CONTRACT IS CURRENTLY LOCKED.
      </p>
      <div style={{ fontSize: "11px", color: "#555" }}>
        STATUS: STANDBY // HIGH-FREQUENCY BIDDING PIPELINES COMING SOON
      </div>
    </div>
  );
}
