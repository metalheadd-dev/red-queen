"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SolvivalIcon from "./SolvivalIcon";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "./AuthProvider";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function NavBar() {
  const pathname = usePathname();
  const { connected, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleChangeWallet = async () => {
    try {
      await disconnect();
      setVisible(true);
    } catch (err) {
      console.error("Failed to change wallet:", err);
    }
  };

  const links = [
    { href: "/", label: "HUB", subtitle: "Central Command Center & Cyber Threat Map" },
    { href: "/terminal", label: "TERMINAL", subtitle: "Direct communication channel with RED QUEEN AI" },
    { href: "/threat-vector", label: "THREAT VECTORS", subtitle: "Interactive database of monitored digital and societal threats" },
    { href: "/solvivors", label: "SOLVIVORS", subtitle: "Classified news, operational briefs, bounties, and media archives" },
    { href: "/survival-kit", label: "SURVIVAL KIT", subtitle: "Digital survival documentation and threat response protocols" },
  ];

  const legalLinks = [
    { href: "/license", label: "LICENSE" },
    { href: "/copyright", label: "COPYRIGHT" },
    { href: "/privacy", label: "PRIVACY POLICY" },
    { href: "/terms", label: "TERMS OF SERVICE" },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
            <div className="navbar-logo-icon">
              <SolvivalIcon size={30} />
            </div>
            <span className="navbar-logo-text">SOLVIVAL CORP</span>
          </Link>

          {/* Desktop Links */}
          <ul className="navbar-nav desktop-only">
            {links.map((l) => (
              <li key={l.href} className="nav-item-wrap">
                <Link href={l.href} className={pathname === l.href ? "active" : ""}>
                  {l.label}
                </Link>
                <div className="nav-item-tooltip">
                  {l.subtitle}
                </div>
              </li>
            ))}
            {(connected || user) && (
              <li className="nav-item-wrap">
                <Link
                  href="/operative"
                  className={pathname === "/operative" ? "active" : ""}
                  style={{ color: "var(--accent)" }}
                >
                  ◉ PROFILE
                </Link>
                <div className="nav-item-tooltip">
                  Your AI-generated survival identity
                </div>
              </li>
            )}
          </ul>

          <div className="navbar-status desktop-only" style={{ display: "flex", alignItems: "center", gap: "15px", flexShrink: 0, whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, whiteSpace: "nowrap" }}>
              <span className="status-dot" />
              <span className="navbar-status-text">RED QUEEN ONLINE</span>
            </div>
            
            {!user && !connected ? (
              <Link 
                href="/login" 
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                  padding: "6px 14px",
                  textDecoration: "none",
                  borderRadius: "2px",
                  fontWeight: "bold",
                  letterSpacing: "0.08em",
                  boxShadow: "0 0 10px rgba(255, 77, 77, 0.15)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                [ ACCESS PORTAL ]
              </Link>
            ) : (
              <>


                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  <WalletMultiButton style={{
                    background: "transparent",
                    border: connected ? "1px solid var(--accent)" : "1px dashed rgba(255,255,255,0.2)",
                    color: connected ? "var(--accent)" : "var(--text-dim)",
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    padding: "5px 15px",
                    height: "auto",
                    lineHeight: "1.5",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }} />
                  {wallet && !connected && (
                    <button
                      onClick={handleChangeWallet}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-dim)",
                        textDecoration: "underline",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "var(--mono)",
                        padding: 0,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      [CHANGE]
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              display: "none",
              flexDirection: "column",
              gap: "6px",
              padding: "8px",
              zIndex: 200,
            }}
          >
            <span style={{ width: "24px", height: "2px", backgroundColor: "var(--accent)", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(5px, 6px)" : "none" }} />
            <span style={{ width: "24px", height: "2px", backgroundColor: "var(--accent)", transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: "24px", height: "2px", backgroundColor: "var(--accent)", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(5px, -6px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div className="mobile-drawer" style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 5, 5, 0.98)",
          zIndex: 150,
          padding: "100px 24px 40px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
              <span className="tag tag-red">OPERATIVE NAV UPLINK</span>
            </div>
            
            {/* Nav Links */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {links.map((l) => (
                <li key={l.href} style={{ borderBottom: "1px dashed rgba(255, 0, 51, 0.1)", paddingBottom: "12px" }}>
                  <Link 
                    href={l.href} 
                    onClick={() => setMenuOpen(false)}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: pathname === l.href ? "var(--accent)" : "var(--text)",
                      textDecoration: "none",
                      letterSpacing: "0.1em",
                      display: "block",
                    }}
                  >
                    {pathname === l.href ? "▶ " : ""}{l.label}
                  </Link>
                  <div style={{
                    fontFamily: "var(--sans)",
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "4px",
                    lineHeight: "1.4",
                    textTransform: "none",
                    fontWeight: "normal",
                    letterSpacing: "normal"
                  }}>
                    {l.subtitle}
                  </div>
                </li>
              ))}
              {(connected || user) && (
                <li style={{ borderBottom: "1px dashed rgba(255, 0, 51, 0.1)", paddingBottom: "12px" }}>
                  <Link 
                    href="/operative" 
                    onClick={() => setMenuOpen(false)}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      textDecoration: "none",
                      letterSpacing: "0.1em",
                      display: "block",
                    }}
                  >
                    {pathname === "/operative" ? "▶ " : ""}◉ PROFILE
                  </Link>
                  <div style={{
                    fontFamily: "var(--sans)",
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "4px",
                    lineHeight: "1.4",
                    textTransform: "none",
                    fontWeight: "normal",
                    letterSpacing: "normal"
                  }}>
                    Your AI-generated survival identity
                  </div>
                </li>
              )}
            </ul>

            <div style={{ borderBottom: "1px solid var(--border)", margin: "16px 0" }} />

            {/* Legal Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em" }}>CLASSIFIED PROTOCOLS</span>
              {legalLinks.map((l) => (
                <Link 
                  key={l.href} 
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    letterSpacing: "0.08em",
                    display: "block",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer of Mobile Drawer */}
          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {!user && !connected ? (
              <Link 
                href="/login" 
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "13px",
                  padding: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  letterSpacing: "0.1em"
                }}
              >
                ACCESS PORTAL
              </Link>
            ) : (
              <>
                {user && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", border: "1px dashed rgba(255, 77, 77, 0.2)", padding: "12px", background: "rgba(255, 77, 77, 0.02)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", wordBreak: "break-all" }}>OPERATIVE: {user.email}</span>
                    <button 
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--accent)",
                        color: "var(--accent)",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderRadius: "2px",
                        width: "100%",
                        textAlign: "center"
                      }}
                    >
                      LOGOUT UPLINK
                    </button>
                  </div>
                )}

                <WalletMultiButton style={{
                  width: "100%",
                  justifyContent: "center",
                  background: connected ? "var(--accent)" : "rgba(255,255,255,0.05)",
                  border: connected ? "none" : "1px dashed rgba(255,255,255,0.2)",
                  color: connected ? "#000" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "13px",
                  padding: "12px",
                  height: "auto",
                  lineHeight: "1.5",
                  fontWeight: "bold",
                }} />
                {wallet && !connected && (
                  <button 
                    onClick={handleChangeWallet}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-dim)",
                      textDecoration: "underline",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "var(--mono)",
                      textAlign: "center",
                    }}
                  >
                    [CHANGE WALLET]
                  </button>
                )}
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
              <span className="status-dot" />
              RED QUEEN CONNECTION SECURED
            </div>
          </div>
        </div>
      )}
    </>
  );
}
