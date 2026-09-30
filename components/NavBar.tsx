"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";
import RqWordmark from "./RqWordmark";
import { RQ_WELCOME_EVENT } from "@/lib/rq-experience";

const primaryLinks = [
  { href: "/red-queen", label: "Ask Red Queen", subtitle: "Your AI survival agent", icon: "✦" },
  { href: "/pulse", label: "Live threats", subtitle: "Map and verified sources", icon: "◎" },
  { href: "/prepare", label: "My plan", subtitle: "Your next steps and checklists", icon: "✓" },
  { href: "/shop", label: "Loadout", subtitle: "Build a kit and find real gear", icon: "◇" },
];
const exploreLinks = [
  { href: "/threat-graph", label: "Threat Graph", subtitle: "Source → event → possible impact → next action" },
  { href: "/reports", label: "x402 intelligence", subtitle: "10 paid operations settled in USDC on Solana" },
  { href: "/proofs", label: "RQ Proof Protocol", subtitle: "Anchor and verify private artifact hashes on Solana" },
  { href: "/agents", label: "Agent Studio", subtitle: "Design bounded agents under Queen oversight" },
  { href: "/library", label: "Threat library", subtitle: "Learn about real and fictional threats" },
  { href: "/community", label: "The world of RQ", subtitle: "Lore, community and the Queen's story" },
  { href: "/gaming", label: "Gaming Room", subtitle: "Survival games, RQ originals and competitions" },
  { href: "/network-clearance", label: "Wallet & $THREAT", subtitle: "Your wallet, benefits and agent identity" },
  { href: "/for-agents", label: "For developers & agents", subtitle: "Connect your agent to RQ" },
  { href: "/docs", label: "How RQ works", subtitle: "A quick guide to getting started" },
];
function MobileNavIcon({ name }: { name: "home" | "queen" | "pulse" | "plan" | "profile" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    queen: <><path d="m4 7 4 4 4-7 4 7 4-4-2 12H6Z" /><path d="M8 15h8" /></>,
    pulse: <><circle cx="12" cy="12" r="9" /><path d="M3 12h5l2-4 4 8 2-4h5" /></>,
    plan: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9ZM9 13l2 2 4-4" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  };
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const main = document.getElementById("rq-main");
    const footer = document.querySelector<HTMLElement>(".rq-footer");
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-toggle")?.focus(); } };
    const resize = () => { if (window.innerWidth >= 1180) setMenuOpen(false); };
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", resize);
    return () => { if (main) main.inert = false; if (footer) footer.inert = false; document.removeEventListener("keydown", escape); window.removeEventListener("resize", resize); };
  }, [menuOpen]);
  function active(href: string) {
    if (href === "/red-queen") return pathname === "/red-queen" || pathname === "/terminal";
    if (href === "/prepare") return pathname === "/prepare" || pathname === "/survival-kit";
    if (href === "/profile") return pathname === "/profile" || pathname === "/operative";
    return pathname === href || (href === "/gaming" && pathname.startsWith("/gaming/"));
  }
  const account = user ? "/profile" : "/login";
  const quickLinks = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/red-queen", label: "Queen", icon: "queen" },
    { href: "/pulse", label: "Pulse", icon: "pulse" },
    { href: "/prepare", label: "Plan", icon: "plan" },
    { href: account, label: "Profile", icon: "profile" },
  ] as const;
  return <>
    <a className="rq-skip-link" href="#rq-main">Skip to content</a>
    <nav className="navbar rq-navbar" aria-label="Primary navigation"><div className="navbar-inner">
      <Link href="/" className="navbar-logo" aria-label="RQ Corp home"><RqWordmark corp /><span className="rq-brand-descriptor">SURVIVAL ECOSYSTEM<br />BUILT ON SOLANA</span></Link>
      <Link href="/reports" className="rq-nav-protocol desktop-only" aria-label="Open x402 intelligence reports"><i /><span><b>x402</b> / SOLANA USDC</span></Link>
      <ul className="navbar-nav desktop-only">{primaryLinks.map(link => <li key={link.href}><Link href={link.href} className={active(link.href) ? "active" : ""} aria-current={active(link.href) ? "page" : undefined}>{link.label}</Link></li>)}<li className="nav-more-wrap"><details><summary>Explore <span>+</span></summary><div className="nav-more-menu">{exploreLinks.map(link => <Link key={link.href} href={link.href} onClick={e => e.currentTarget.closest("details")?.removeAttribute("open")}><strong>{link.label}</strong><small>{link.subtitle}</small></Link>)}<button className="rq-menu-personalise" onClick={e => { e.currentTarget.closest("details")?.removeAttribute("open"); window.dispatchEvent(new Event(RQ_WELCOME_EVENT)); }}>Personalise my RQ ↗</button></div></details></li></ul>
      <div className="navbar-actions desktop-only"><ThemeToggle compact /><Link className="navbar-account" href={account}>{user ? "My profile" : "Sign in"}</Link></div>
      <div className="navbar-mobile-state"><ThemeToggle compact /><button className={`mobile-menu-toggle${menuOpen ? " is-open" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-controls="rq-mobile-menu" aria-expanded={menuOpen}><b /><b /><b /></button></div>
    </div></nav>
    <div id="rq-mobile-menu" className={`rq-mobile-menu${menuOpen ? " is-open" : ""}`} hidden={!menuOpen}>
      <nav aria-label="All pages">{[...primaryLinks, ...exploreLinks].map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}><strong>{link.label}</strong><small>{link.subtitle}</small><span>↗</span></Link>)}</nav>
      <div className="rq-mobile-menu-foot"><button onClick={() => { setMenuOpen(false); window.dispatchEvent(new Event(RQ_WELCOME_EVENT)); }}>Personalise my RQ</button><Link href={account} onClick={() => setMenuOpen(false)}>{user ? "My profile" : "Sign in"}</Link><Link href="/offline.html">Offline card</Link><Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link><Link href="/terms" onClick={() => setMenuOpen(false)}>Terms</Link>{user && <button onClick={() => { void logout(); setMenuOpen(false); }}>Sign out</button>}</div>
    </div>
    <nav className="mobile-bottom-nav rq-bottom-nav" aria-label="Quick navigation">{quickLinks.map(link => <Link key={link.href} href={link.href} className={active(link.href) ? "active" : ""} aria-current={active(link.href) ? "page" : undefined} onClick={() => setMenuOpen(false)}><MobileNavIcon name={link.icon} /><span>{link.label}</span></Link>)}</nav>
  </>;
}
