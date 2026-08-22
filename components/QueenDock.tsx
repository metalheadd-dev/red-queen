"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AgentMode, SurvivalContext } from "@/lib/survival-context";

type DockAction = { label: string; mode: AgentMode; prompt: string };

const dockContent: Array<{
  match: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  note: string;
  actions: DockAction[];
}> = [
  {
    match: (pathname) => pathname.startsWith("/onchain") || pathname.startsWith("/network-clearance"),
    eyebrow: "SOLANA CONTROL PLANE",
    title: "Every privilege leaves a trace.",
    note: "I will show you what the chain proves, what it cannot prove, and the safest next action. I will never ask for your secrets.",
    actions: [
      { label: "AUDIT MY WALLET SAFETY", mode: "ANALYZE", prompt: "Run a safe Solana wallet security triage. Do not claim to query private vendor databases and never ask for a seed phrase or private key." },
      { label: "EXPLAIN MY CLEARANCE", mode: "ANALYZE", prompt: "Explain how $THREAT clearance, BIO-SCORE, and x402 USDC payments differ inside RED QUEEN." },
    ],
  },
  {
    match: (pathname) => pathname === "/",
    eyebrow: "RED QUEEN ONLINE",
    title: "Ask one real question. I will show you where to begin.",
    note: "I connect verified signals, uncertainty, preparedness and Solana actions without hiding the decision from you.",
    actions: [
      { label: "SHOW ME WHAT YOU CAN DO", mode: "ANALYZE", prompt: "Introduce the RED QUEEN survival intelligence system in plain language. Explain what I can do publicly, with an account, and with a wallet." },
      { label: "GIVE ME ONE USEFUL ACTION", mode: "PREPARE", prompt: "Give me one practical preparedness action I can complete today, then explain how to save it as a plan." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/pulse"),
    eyebrow: "DAILY PULSE",
    title: "I watch the field. I do not invent certainty.",
    note: "I separate omen from evidence, explain what may matter to you, and give you one place to begin if you choose to act.",
    actions: [
      { label: "WHAT MATTERS NOW?", mode: "MONITOR", prompt: "Brief me on the verified signals that matter for my context right now. Separate facts, uncertainty, and one action." },
      { label: "GIVE ME ONE ACTION", mode: "PREPARE", prompt: "Based on my survival context, give me the single highest-impact preparedness action I can complete today." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/prepare") || pathname.startsWith("/survival-kit"),
    eyebrow: "PREPAREDNESS",
    title: "Survival begins before the sirens.",
    note: "Give me your weak point. I will turn it into a practical plan for today, 24 hours, or 72 hours.",
    actions: [
      { label: "PLAN MY NEXT STEP", mode: "PREPARE", prompt: "Use my readiness context to choose my most important gap and turn it into one specific action for today." },
      { label: "BUILD A 72H PLAN", mode: "PREPARE", prompt: "Build a concise 72-hour household resilience plan for my context. Prioritize the essentials and explain why." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/library") || pathname.startsWith("/threat-vector"),
    eyebrow: "THREAT LIBRARY",
    title: "Every catastrophe casts a pattern.",
    note: "I can translate the pattern into relevance, uncertainty, and a decision you can actually use.",
    actions: [
      { label: "ANALYZE MY EXPOSURE", mode: "ANALYZE", prompt: "Help me assess which threat categories in the library are most relevant to my context, without sensationalism." },
      { label: "RUN A DECISION DRILL", mode: "SIMULATE", prompt: "Run one realistic survival decision drill based on a relevant threat. Wait for my answer before evaluating it." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/profile") || pathname.startsWith("/operative"),
    eyebrow: "MY READINESS",
    title: "I remember what you prove.",
    note: "Your score is evidence, not decoration. Train a weak domain or turn intention into a recorded preparedness action.",
    actions: [
      { label: "TRAIN MY WEAKEST DOMAIN", mode: "SIMULATE", prompt: "Run a short decision drill for my weakest survival readiness domain. Score only the evidence in my answer." },
      { label: "IMPROVE MY BASELINE", mode: "PREPARE", prompt: "Help me improve my readiness baseline with one practical, measurable action." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/docs"),
    eyebrow: "PRODUCT GUIDE",
    title: "Understand every signal before you trust it.",
    note: "I can explain any score, memory layer, token utility, payment boundary, or page without hiding behind system language.",
    actions: [
      { label: "EXPLAIN MY READINESS", mode: "ANALYZE", prompt: "Explain BIO-SCORE, XP, level, readiness domains, evidence, and local plans in plain language. Then tell me what to do first." },
      { label: "EXPLAIN SOLANA UTILITY", mode: "ANALYZE", prompt: "Explain the difference between Solana identity, $THREAT holder utility, and x402 USDC payments in plain language." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/community") || pathname.startsWith("/solvivors"),
    eyebrow: "QUEEN TRANSMISSIONS",
    title: "A system without memory becomes noise.",
    note: "This is where I keep the story, the field notes, and the voices that choose to prepare together.",
    actions: [
      { label: "EXPLAIN YOUR ORIGIN", mode: "ANALYZE", prompt: "Tell me the RED QUEEN origin story, clearly labeling platform lore separately from real survival intelligence." },
      { label: "TURN THIS INTO ACTION", mode: "PREPARE", prompt: "Turn the core RED QUEEN philosophy into one practical preparedness action I can complete today." },
    ],
  },
];

const visibleCoreRoutes = ["/", "/pulse", "/red-queen", "/prepare", "/library", "/docs", "/profile", "/onchain", "/community", "/terminal", "/survival-kit", "/threat-vector", "/operative", "/network-clearance"];

function buildHref(action: DockAction, area: string) {
  const query = new URLSearchParams({ mode: action.mode, prompt: action.prompt });
  if (area) query.set("area", area);
  return `/red-queen?${query.toString()}`;
}

export default function QueenDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");

  useEffect(() => {
    try {
      const context = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "{}") as Partial<SurvivalContext>;
      setArea(typeof context.area === "string" ? context.area : "");
    } catch {
      setArea("");
    }
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  const content = useMemo(
    () => dockContent.find((item) => item.match(pathname)) || dockContent[0],
    [pathname],
  );

  const isVisible = visibleCoreRoutes.some((route) => route === "/" ? pathname === "/" : pathname.startsWith(route));
  if (!isVisible || pathname.startsWith("/red-queen") || pathname.startsWith("/terminal")) return null;

  return (
    <aside className={`queen-dock${open ? " is-open" : ""}`} aria-label="Red Queen contextual assistant">
      {open && (
        <div className="queen-dock-panel">
          <div className="queen-dock-head">
            <div className="queen-dock-orb"><i /></div>
            <div><span>{content.eyebrow}</span><strong>RED QUEEN</strong></div>
            <button onClick={() => setOpen(false)} aria-label="Close Red Queen assistant">×</button>
          </div>
          <h2>{content.title}</h2>
          <p>{content.note}</p>
          {area && <small>CONTEXT LOCKED · {area.toUpperCase()}</small>}
          <div className="queen-dock-actions">
            {content.actions.map((action) => (
              <Link key={action.label} href={buildHref(action, area)}>{action.label}<span>→</span></Link>
            ))}
          </div>
          <Link href="/red-queen" className="queen-dock-open-terminal">OPEN RED QUEEN</Link>
        </div>
      )}
      <button className="queen-dock-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="queen-dock-orb"><i /></span>
        <span><strong>ASK RED QUEEN</strong><small>{area ? `${area} · SHE REMEMBERS` : "SURVIVAL INTELLIGENCE · LISTENING"}</small></span>
        <b>{open ? "×" : "↑"}</b>
      </button>
    </aside>
  );
}
