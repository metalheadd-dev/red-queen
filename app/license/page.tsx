"use client";
import Link from "next/link";

export default function LicensePage() {
  return (
    <div style={{ padding: "100px 24px 80px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="tag tag-red" style={{ marginBottom: "16px" }}>SOLVIVAL CORP — LEGAL</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)", marginBottom: "32px", fontFamily: "var(--mono)" }}>
          SOFTWARE LICENSE AGREEMENT
        </h1>

        <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "24px" }}>
          <p>
            <strong>Last Updated: January 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            The Red Queen is a proprietary tactical survival evaluation and artificial intelligence platform owned by Solvival Corp. This license agreement governs your access and use of the Red Queen terminal, database archives, and related services.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. GRANT OF LICENSE</h2>
          <p>
            Solvival Corp grants you a limited, non-exclusive, non-transferable, revocable license to access the Red Queen interface and terminal system strictly for personal, non-commercial survival assessment purposes in accordance with these terms.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. PERMITTED OPERATIONS</h2>
          <p>
            Subject to your compliance with this agreement, you are authorized to:
            <br />• Connect your Solana wallet to authenticate your operative identity.
            <br />• Initiate neural link and query the Red Queen AI terminal.
            <br />• Query and display threat reports in the archives database.
            <br />• Save and customize your survival scenario preferences.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. RIGID RESTRICTIONS</h2>
          <p>
            You are strictly prohibited from:
            <br />• Attempting to reverse engineer, decompile, or bypass the Red Queen AI core logic.
            <br />• Utilizing automated bots, scripts, or client-side tools to manipulate threat evaluations or bio-score ratings.
            <br />• Sublicensing, renting, or leasing terminal access to unauthorized third parties.
            <br />• Removing any proprietary notices, classification watermarks, or company copyrights.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>4. INTELLECTUAL PROPERTY & DECENTRALIZED DATA</h2>
          <p>
            The Red Queen terminal, model configuration, and database structures are the exclusive property of Solvival Corp. Solana smart contracts utilized for access verifications, wallet authorization, and token checks are verifiable on-chain, but the underlying server infrastructure remains proprietary.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>5. TERMINATION OF ACCESS</h2>
          <p>
            Your access clearance may be suspended or terminated immediately without notice if you fail to comply with these terms or if your actions present a threat to system security or containment protocol.
          </p>

          <div style={{ marginTop: "48px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
            <Link href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
              ← RETURN TO HUB
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
