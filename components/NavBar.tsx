"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "./AuthProvider";
import SolvivalIcon from "./SolvivalIcon";

type NavIconName = "home" | "pulse" | "queen" | "prepare" | "onchain" | "me";

const primaryLinks = [
  { href: "/red-queen", label: "RED QUEEN", subtitle: "Ask, analyze, prepare or simulate", match: "terminal" },
  { href: "/pulse", label: "PULSE", subtitle: "Your daily intelligence brief", match: "pulse" },
  { href: "/onchain", label: "ONCHAIN", subtitle: "Agent payments, wallet intelligence and $THREAT", match: "onchain" },
  { href: "/prepare", label: "PREPARE", subtitle: "Build practical readiness", match: "prepare" },
  { href: "/pulse#live-map", label: "MAP", subtitle: "Verified signals on the live field", match: "map" },
  { href: "/library", label: "LIBRARY", subtitle: "Open the threat intelligence archive", match: "library" },
  { href: "/community", label: "COMMUNITY", subtitle: "Lore, field notes and Queen transmissions", match: "community" },
  { href: "/docs", label: "GUIDE", subtitle: "Understand scores, utility and every page", match: "guide" },
] as const;

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "home") {
    return <svg className="mobile-home-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20h-6v-6H9v6H3Z" /></svg>;
  }
  if (name === "pulse") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>;
  }
  if (name === "onchain") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h8a4 4 0 0 1 0 8h-3" /><path d="M16 17H8a4 4 0 0 1 0-8h3" /><path d="M9 12h6" /></svg>;
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
    if (match === "pulse") return pathname === "/pulse" && hash !== "#live-map";
    if (match === "map") return pathname === "/pulse" && hash === "#live-map";
    if (match === "library") return pathname.startsWith("/library") || pathname.startsWith("/threat-vector");
    if (match === "guide") return pathname.startsWith("/docs");
    if (match === "terminal") return pathname.startsWith("/red-queen") || pathname.startsWith("/terminal");
    if (match === "prepare") return pathname.startsWith("/prepare") || pathname.startsWith("/survival-kit");
    if (match === "community") return pathname.startsWith("/community") || pathname.startsWith("/solvivors");
    if (match === "onchain") return pathname.startsWith("/onchain") || pathname.startsWith("/network-clearance") || pathname.startsWith("/clearance");
    return false;
  };

  const accountHref = user ? "/profile" : "/login";
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
        <Link href="/" className={pathname === "/" ? "active" : ""} aria-current={pathname === "/" ? "page" : undefined}>
          <NavIcon name="home" /><span>HOME</span>
        </Link>
        <Link href="/pulse" className={isActive("pulse") ? "active" : ""} aria-current={isActive("pulse") ? "page" : undefined}>
          <NavIcon name="pulse" /><span>PULSE</span>
        </Link>
        <Link href="/red-queen" className={`mobile-queen-link${isActive("terminal") ? " active" : ""}`} aria-current={isActive("terminal") ? "page" : undefined}>
          <NavIcon name="queen" /><span>RED QUEEN</span>
        </Link>
        <Link href="/prepare" className={isActive("prepare") ? "active" : ""} aria-current={isActive("prepare") ? "page" : undefined}>
          <NavIcon name="prepare" /><span>PREPARE</span>
        </Link>
        <Link href={accountHref} className={pathname === "/profile" || pathname === "/operative" || pathname === "/login" ? "active" : ""} aria-current={pathname === "/profile" || pathname === "/operative" ? "page" : undefined}>
          <NavIcon name="me" /><span>ME</span>
        </Link>
      </nav>
    </>
  );
}
