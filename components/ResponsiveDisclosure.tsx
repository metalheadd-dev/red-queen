"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Details remain available; only the initial mobile presentation is compact. */
export default function ResponsiveDisclosure({ summary, children, className = "", revealHash }: { summary: ReactNode; children: ReactNode; className?: string; revealHash?: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const compact = window.matchMedia("(max-width:700px)");
    const sync = () => setOpen(!compact.matches || Boolean(revealHash && window.location.hash === revealHash));
    const reveal = () => { if (revealHash && window.location.hash === revealHash) setOpen(true); };
    sync(); compact.addEventListener("change", sync);
    window.addEventListener("hashchange", reveal);
    return () => { compact.removeEventListener("change", sync); window.removeEventListener("hashchange", reveal); };
  }, [revealHash]);
  return <details className={`rq-responsive-disclosure ${className}`} open={open} onToggle={event => setOpen(event.currentTarget.open)}><summary>{summary}</summary>{children}</details>;
}
