"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ padding: "100px 24px 80px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="tag tag-red" style={{ marginBottom: "16px" }}>SOLVIVAL CORP — LEGAL</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)", marginBottom: "32px", fontFamily: "var(--mono)" }}>
          PRIVACY POLICY
        </h1>

        <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "24px" }}>
          <p>
            <strong>Last Updated: January 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            Solvival Corp is committed to protecting the integrity of survivor data. This Privacy Policy details how we collect, store, and analyze the data processed through the Red Queen terminal.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. INFORMATION WE LOG</h2>
          <p>
            To perform accurate threat calculations and maintain neural link status, we collect:
            <br />• **Wallet Credentials**: Your Solana public address (required for authorization).
            <br />• **Operative Dossier**: Your custom username and chosen survival scenarios.
            <br />• **Transmission logs**: Complete message history between you and the Red Queen AI.
            <br />• **Survival metrics**: Your calculated bio-score ratings and interaction history.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. PURPOSE OF DATA UTILIZATION</h2>
          <p>
            Your collected data is used exclusively to:
            <br />• Establish and restore your terminal chat history.
            <br />• Calculate and update your bio-score assessment.
            <br />• Filter your classified daily briefings.
            <br />• Monitor terminal security and identify exploit attempts.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. NO THIRD-PARTY SALE</h2>
          <p>
            Solvival Corp does not sell, rent, or distribute personal identity logs, wallet addresses, or transmission transcripts to any commercial entities.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>4. KEY SECURITY PROTOCOLS</h2>
          <p>
            All communications are encrypted in transit and logged in a secure database infrastructure. Solvival Corp does NOT collect, prompt, or store your private key or seed phrase; all wallet signatures are executed client-side.
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
