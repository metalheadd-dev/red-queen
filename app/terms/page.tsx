"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ padding: "100px 24px 80px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="tag tag-red" style={{ marginBottom: "16px" }}>SOLVIVAL CORP — LEGAL</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)", marginBottom: "32px", fontFamily: "var(--mono)" }}>
          TERMS OF SERVICE
        </h1>

        <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "24px" }}>
          <p>
            <strong>Last Updated: August 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            Welcome to the Red Queen terminal. By accessing our services, connecting your wallet, or interacting with the AI system, you agree to be bound by these Terms of Service.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. USER ELIGIBILITY</h2>
          <p>
            You must be at least 18 years of age to access the Red Queen interface. By establishing connection, you verify that your access complies with all local regulations.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. TOKEN GATING AND VERIFICATION</h2>
          <p>
            Red Queen may use the $THREAT token on Solana to unlock higher AI depth, usage allowances, and holder-specific intelligence features. Token holdings are verified on-chain and never increase BIO-SCORE or claim that a holder is more prepared.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. LIABILITY LIMITATIONS & RISK WARNING</h2>
          <p style={{ color: "var(--accent)", background: "rgba(255, 77, 77, 0.05)", padding: "16px", border: "1px solid rgba(255, 77, 77, 0.2)", borderRadius: "2px" }}>
            <strong>IMPORTANT:</strong> Red Queen provides informational threat analysis and preparedness guidance. It is not a substitute for emergency services, official alerts, medical care, legal advice, or professional financial advice. Verify critical decisions with authoritative local sources. Digital assets and cryptographic transactions involve risk.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>4. SYSTEM MODIFICATIONS</h2>
          <p>
            Solvival Corp reserves the right to modify, adjust, update, or discontinue any aspect of the Red Queen platform, AI settings, or token integrations at any time without prior notification.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>5. GOVERNING LAW</h2>
          <p>
            These terms are governed by standard commercial frameworks, and any unresolved disputes shall be submitted to standard binding arbitration.
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
