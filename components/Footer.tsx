import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        <span>[ RED QUEEN // ONLINE ]</span> &nbsp;|&nbsp;
        SURVIVAL INTELLIGENCE ECOSYSTEM ON SOLANA
      </p>
      <p style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", fontSize: "10px" }}>
        <Link href="/license">LICENSE</Link>
        <Link href="/copyright">COPYRIGHT</Link>
        <Link href="/privacy">PRIVACY POLICY</Link>
        <Link href="/terms">TERMS OF SERVICE</Link>
      </p>
      <p style={{ marginTop: "12px", fontSize: "10px" }}>
        PUBLIC SIGNALS ARE INFORMATIONAL. RED QUEEN SEPARATES VERIFIED FACTS, ASSESSMENT AND UNCERTAINTY — YOU KEEP CONTROL OF YOUR DATA AND DECISIONS.
      </p>
    </footer>
  );
}
