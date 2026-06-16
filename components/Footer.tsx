import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        <span>[ RED QUEEN v7.4.1 ]</span> &nbsp;|&nbsp;
        SOLVIVAL CORP ADVANCED INTELLIGENCE DIVISION &nbsp;|&nbsp;
        <span>[ CLASSIFICATION: LEVEL 5 RESTRICTED ]</span>
      </p>
      <p style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", fontSize: "10px" }}>
        <Link href="/license">LICENSE</Link>
        <Link href="/copyright">COPYRIGHT</Link>
        <Link href="/privacy">PRIVACY POLICY</Link>
        <Link href="/terms">TERMS OF SERVICE</Link>
        <Link href="/roadmap">ROADMAP</Link>
      </p>
      <p style={{ marginTop: "12px", fontSize: "10px" }}>
        ALL SURVIVOR DATA IS LOGGED AND ANALYZED. UNAUTHORIZED ACCESS IS PUNISHABLE BY IMMEDIATE CONTAINMENT.
      </p>
    </footer>
  );
}
