"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "./AuthProvider";
import SolvivalIcon from "./SolvivalIcon";

type NavIconName = "pulse" | "map" | "queen" | "prepare" | "me";

const primaryLinks = [
  { href: "/", label: "PULSE", subtitle: "Your daily intelligence brief", match: "pulse" },
  { href: "/#live-map", label: "MAP", subtitle: "Verified signals on the live field", match: "map" },
  { href: "/terminal", label: "QUEEN", subtitle: "Ask, analyze, prepare or simulate", match: "terminal" },
  { href: "/survival-kit", label: "PREPARE", subtitle: "Build practical readiness", match: "prepare" },
  { href: "/threat-vector", label: "LIBRARY", subtitle: "Open the threat intelligence archive", match: "library" },
  { href: "/docs", label: "GUIDE", subtitle: "Understand scores, utility and every page", match: "guide" },
  { href: "/community", label: "COMMUNITY", subtitle: "Lore, field notes and Queen transmissions", match: "community" },
  { href: "/network-clearance", label: "ONCHAIN", subtitle: "Live Solana proof and $THREAT utility", match: "onchain" },
] as const;

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "pulse") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>;
  }
  if (name === "map") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2Z" /><path d="M8 4v13M16 7v13" /></svg>;
  }
  if (name === "queen") {
    return <span className="mobile-queen-core"><i /></span>;
  }
  if (name === "prepare") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7Z" /><path d="m9 12 2 2 4-5" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
}

export default function NavBar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (match: string) => {
    if (match === "pulse") return pathname === "/" && hash !== "#live-map";
    if (match === "map") return pathname === "/" && hash === "#live-map";
    if (match === "library") return pathname.startsWith("/threat-vector");
    if (match === "guide") return pathname.startsWith("/docs");
    if (match === "terminal") return pathname.startsWith("/terminal");
    if (match === "prepare") return pathname.startsWith("/survival-kit");
    if (match === "community") return pathname.startsWith("/community") || pathname.startsWith("/solvivors");
    if (match === "onchain") return pathname.startsWith("/network-clearance") || pathname.startsWith("/clearance");
    return false;
  };

  const accountHref = user ? "/operative" : "/login";
  const accountLabel = user ? "MY READINESS" : connected ? "FINISH SIGN-IN" : "SIGN IN";

  return (
    <>
      <nav className="navbar" aria-label="Primary navigation">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" aria-label="Red Queen home">
            <span className="navbar-logo-icon"><SolvivalIcon size={30} /></span>
            <span className="navbar-logo-copy">
              <strong>RED QUEEN</strong>
              <small>SURVIVAL INTELLIGENCE</small>
            </span>
          </Link>

          <ul className="navbar-nav desktop-only">
            {primaryLinks.map((link) => {
              const active = isActive(link.match);
              return (
                <li key={link.match} className="nav-item-wrap">
                  <Link href={link.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                    {link.label}
                  </Link>
                  <div className="nav-item-tooltip">{link.subtitle}</div>
                </li>
              );
            })}
          </ul>

          <div className="navbar-actions desktop-only">
            <span className="navbar-online" aria-label="Red Queen is online"><i />ONLINE</span>
            <Link href={accountHref} className={`navbar-account${user ? " is-authenticated" : ""}`}>
              {accountLabel}
            </Link>
          </div>

          <div className="navbar-mobile-state">
            <span><i /> QUEEN ONLINE</span>
            <button
              className={`mobile-menu-toggle${menuOpen ? " is-open" : ""}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <b /><b /><b />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-drawer${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-heading">
          <span>PLATFORM INDEX</span>
          <strong>Everything you need, without the noise.</strong>
        </div>

        <nav aria-label="Mobile expanded navigation" className="mobile-drawer-links">
          {primaryLinks.map((link, index) => (
            <Link key={link.match} href={link.href} tabIndex={menuOpen ? 0 : -1}>
              <span>0{index + 1}</span>
              <div><strong>{link.label}</strong><small>{link.subtitle}</small></div>
            </Link>
          ))}
          <Link href={accountHref} tabIndex={menuOpen ? 0 : -1}>
            <span>0{primaryLinks.length + 1}</span>
            <div><strong>{accountLabel}</strong><small>Save context, readiness and clearance</small></div>
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          <div>
            <Link href="/privacy" tabIndex={menuOpen ? 0 : -1}>PRIVACY</Link>
            <Link href="/terms" tabIndex={menuOpen ? 0 : -1}>TERMS</Link>
            <Link href="/license" tabIndex={menuOpen ? 0 : -1}>LICENSE</Link>
          </div>
          {user && (
            <button onClick={() => { void logout(); setMenuOpen(false); }} tabIndex={menuOpen ? 0 : -1}>
              SIGN OUT
            </button>
          )}
          <p>Public intelligence is available without an account. A wallet is optional until you verify $THREAT clearance.</p>
        </div>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Core product navigation">
        <Link href="/" className={isActive("pulse") ? "active" : ""} aria-current={isActive("pulse") ? "page" : undefined}>
          <NavIcon name="pulse" /><span>PULSE</span>
        </Link>
        <Link href="/#live-map" className={isActive("map") ? "active" : ""} aria-current={isActive("map") ? "page" : undefined}>
          <NavIcon name="map" /><span>MAP</span>
        </Link>
        <Link href="/terminal" className={`mobile-queen-link${isActive("terminal") ? " active" : ""}`} aria-current={isActive("terminal") ? "page" : undefined}>
          <NavIcon name="queen" /><span>QUEEN</span>
        </Link>
        <Link href="/survival-kit" className={isActive("prepare") ? "active" : ""} aria-current={isActive("prepare") ? "page" : undefined}>
          <NavIcon name="prepare" /><span>PREPARE</span>
        </Link>
        <Link href={accountHref} className={pathname === "/operative" || pathname === "/login" ? "active" : ""} aria-current={pathname === "/operative" ? "page" : undefined}>
          <NavIcon name="me" /><span>ME</span>
        </Link>
      </nav>
    </>
  );
}
