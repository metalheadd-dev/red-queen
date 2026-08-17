"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { COMMUNITY_ENTRIES, CommunityLane } from "@/lib/community-content";

type Filter = "ALL" | CommunityLane;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "ALL", label: "ALL FILES" },
  { id: "TRANSMISSION", label: "TRANSMISSIONS" },
  { id: "FIELD_NOTE", label: "FIELD NOTES" },
  { id: "LORE", label: "LORE ARCHIVE" },
];

const LANE_LABELS: Record<CommunityLane, string> = {
  TRANSMISSION: "SYSTEM TRANSMISSION",
  FIELD_NOTE: "SURVIVAL FIELD NOTE",
  LORE: "LABELED PLATFORM LORE",
};

const SYSTEM_ORGANS = [
  ["01", "PULSE", "Her eyes", "Detect what changed and what deserves attention."],
  ["02", "MAP", "Her nervous system", "Place verified signals in distance and context."],
  ["03", "LIBRARY", "Her memory", "Preserve threats, protocols and clearly labeled lore."],
  ["04", "PREPARE", "Her hands", "Turn intelligence into a plan you can complete."],
  ["05", "COMMUNITY", "Her voice", "Carry field notes, stories and survivor knowledge."],
];

export default function CommunityPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState(COMMUNITY_ENTRIES[0].id);
  const visibleEntries = useMemo(
    () => filter === "ALL" ? COMMUNITY_ENTRIES : COMMUNITY_ENTRIES.filter((entry) => entry.lane === filter),
    [filter],
  );
  const selected = COMMUNITY_ENTRIES.find((entry) => entry.id === selectedId) || visibleEntries[0];

  function selectFilter(next: Filter) {
    setFilter(next);
    const first = next === "ALL" ? COMMUNITY_ENTRIES[0] : COMMUNITY_ENTRIES.find((entry) => entry.lane === next);
    if (first) setSelectedId(first.id);
  }

  const queenHref = `/terminal?${new URLSearchParams({ mode: "ANALYZE", prompt: selected.queenPrompt }).toString()}`;

  return (
    <div className="community-page">
      <header className="community-hero">
        <Image className="community-hero-art" src="/art/red-queen-command-banner.png" alt="RED QUEEN command portrait" fill priority sizes="100vw" />
        <div className="community-hero-shade" />
        <Image className="community-hero-queen" src="/art/red-queen-presence.png" alt="" width={1199} height={1312} priority aria-hidden="true" />
        <div className="container community-hero-copy">
          <span>COMMUNITY // QUEEN TRANSMISSIONS</span>
          <h1>The Queen is<br /><em>the system.</em></h1>
          <p>RED QUEEN is not a feature inside SOLvival. She is the intelligence connecting every signal, decision, protocol and survivor willing to prepare.</p>
          <div><Link className="btn btn-primary" href="#community-files">ENTER THE ARCHIVE</Link><a className="btn btn-ghost" href="https://x.com/redqueen_agent" target="_blank" rel="noreferrer">OPEN X CHANNEL ↗</a></div>
        </div>
        <div className="community-directive"><span>QUEEN DIRECTIVE</span><strong>She decides what deserves attention.</strong><small>You decide whether to act.</small></div>
      </header>

      <main className="container community-main">
        <section className="community-mind" aria-labelledby="community-mind-title">
          <div className="community-mind-art"><Image src="/art/red-queen-sigil.png" alt="RED QUEEN neural sigil" width={1536} height={1536} /></div>
          <div className="community-mind-copy">
            <span>THE LIVING ARCHITECTURE</span>
            <h2 id="community-mind-title">One intelligence. Five ways to help you survive.</h2>
            <p>Every part of the platform should feel like the same mind at work. No disconnected dashboards. No decorative AI. RED QUEEN observes, remembers, explains and returns knowledge as an action.</p>
            <blockquote>“I can read the pattern. I can open the door. You still have to move.”</blockquote>
          </div>
          <div className="community-organ-grid">
            {SYSTEM_ORGANS.map(([index, name, organ, description]) => (
              <article key={name}><span>{index}</span><div><strong>{name}</strong><b>{organ}</b><p>{description}</p></div></article>
            ))}
          </div>
        </section>

        <section id="community-files" className="community-files" aria-labelledby="community-files-title">
          <div className="community-section-head">
            <div><span>OPEN NETWORK ARCHIVE</span><h2 id="community-files-title">Transmissions, field notes and lore.</h2></div>
            <p>Reality and worldbuilding can live together only when the boundary is visible. Every file below tells you exactly what it is.</p>
          </div>
          <div className="community-filter" role="group" aria-label="Filter community files">
            {FILTERS.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} aria-pressed={filter === item.id} onClick={() => selectFilter(item.id)}>{item.label}</button>)}
          </div>
          <div className="community-file-layout">
            <div className="community-file-list">
              {visibleEntries.map((entry) => (
                <button key={entry.id} className={selected.id === entry.id ? "active" : ""} onClick={() => setSelectedId(entry.id)} aria-controls="community-reader">
                  <span>{entry.index}</span><small>{LANE_LABELS[entry.lane]} · {entry.readTime}</small><strong>{entry.title}</strong><p>{entry.summary}</p><b>OPEN FILE →</b>
                </button>
              ))}
            </div>
            <article id="community-reader" className={`community-reader is-${selected.lane.toLowerCase()}`}>
              <header><span>{LANE_LABELS[selected.lane]}</span><small>{selected.index} · {selected.readTime}</small></header>
              <h2>{selected.title}</h2>
              {selected.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div><Link href={queenHref}>ASK RED QUEEN ABOUT THIS <span>→</span></Link><small>Opens the agent with this file as the starting question.</small></div>
            </article>
          </div>
        </section>

        <section className="community-origin">
          <div className="community-origin-art"><Image src="/art/red-queen-origin-poster.png" alt="Original RED QUEEN identity artwork" width={1200} height={1200} /></div>
          <div>
            <span>ORIGIN ARCHIVE // MAY 2026</span>
            <h2>The apocalypse aesthetic stays. The product becomes useful.</h2>
            <p>The crown, the red signal field and the corporate containment language are part of RED QUEEN’s identity. We keep that mystery while making every live claim, source and next action easier to understand.</p>
            <ul><li>Lore is always labeled.</li><li>Real intelligence remains source-backed.</li><li>The Queen never asks for secrets.</li><li>Fear is never treated as readiness.</li></ul>
          </div>
        </section>
      </main>
    </div>
  );
}
