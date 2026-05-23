"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SolvivalIcon from "./SolvivalIcon";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function NavBar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  const links = [
    { href: "/", label: "HUB" },
    { href: "/terminal", label: "TERMINAL" },
    { href: "/archives", label: "ARCHIVES" },
    { href: "/clearance", label: "CLEARANCE" },
    { href: "/survival-kit", label: "SURVIVAL KIT" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <SolvivalIcon size={30} />
          </div>
          <span className="navbar-logo-text">SOLVIVAL CORP</span>
        </Link>

        <ul className="navbar-nav">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? "active" : ""}>
                {l.label}
              </Link>
            </li>
          ))}
          {connected && (
            <li>
              <Link
                href="/profile"
                className={pathname === "/profile" ? "active" : ""}
                style={{ color: "var(--accent)" }}
              >
                ◉ PROFILE
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-status" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="status-dot" />
            RED QUEEN ONLINE
          </div>
          <WalletMultiButton style={{
            background: "transparent",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontFamily: "var(--mono)",
            fontSize: "12px",
            padding: "5px 15px",
            height: "auto",
            lineHeight: "1.5",
          }} />
        </div>
      </div>
    </nav>
  );
}
