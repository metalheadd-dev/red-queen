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
            <strong>Last Updated: August 2026</strong>
          </p>
          <p style={{ marginTop: "16px" }}>
            Solvival Corp is committed to protecting the integrity of user data. This Privacy Policy describes the data processed when you choose to use Red Queen account, wallet, AI, and readiness features.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>1. INFORMATION WE PROCESS</h2>
          <p>
            Depending on the features you use, Red Queen may process:
            <br />• Account information such as your email address.
            <br />• Your public Solana address when you connect a wallet. Private keys and seed phrases are never requested.
            <br />• The broad region, preparedness priorities, and prompts you choose to provide. An exact home address is not required.
            <br />• Readiness metrics, BIO-SCORE evidence, and AI conversation history associated with your account.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>2. PURPOSE OF DATA UTILIZATION</h2>
          <p>
            Your collected data is used exclusively to:
            <br />• Establish and restore your Red Queen conversation history.
            <br />• Calculate and update readiness evidence when you complete an evaluated action or decision drill.
            <br />• Adapt preparedness guidance to the context you provide.
            <br />• Protect the platform, prevent abuse, and maintain service reliability.
          </p>

          <h2 style={{ color: "#fff", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>3. NO THIRD-PARTY SALE</h2>
          <p>
            Solvival Corp does not sell or rent personal identity data, wallet addresses, or AI conversation content to commercial data brokers.
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
