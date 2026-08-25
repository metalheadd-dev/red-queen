"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CoreLoopGuide from "@/components/CoreLoopGuide";
import { CATEGORIES, Threat } from "@/lib/threats";

const CATEGORY_CONTENT: Record<string, {
  label: string;
  eyebrow: string;
  description: string;
  itemLabel: string;
}> = {
  realistic: {
    label: "Real-world preparedness",
    eyebrow: "REFERENCE SCENARIOS",
    description: "Practical scenario files for hazards that can occur. They are not current alerts or probability forecasts.",
    itemLabel: "PREPAREDNESS REFERENCE",
  },
  algorithmic: {
    label: "Digital & Solana security",
    eyebrow: "DIGITAL DEFENSE",
    description: "Wallet, identity, phishing and information-security scenarios for defensive planning.",
    itemLabel: "DIGITAL SECURITY SCENARIO",
  },
  fictional: {
    label: "Survival simulations",
    eyebrow: "FICTIONAL TRAINING",
    description: "Fictional scenarios for decision practice, stress testing and RED QUEEN worldbuilding.",
    itemLabel: "FICTIONAL SIMULATION",
  },
  satirical: {
    label: "Satirical archive",
    eyebrow: "WORLD BUILDING",
    description: "Humor and cultural scenarios. Entertainment content is always separated from real intelligence.",
    itemLabel: "SATIRICAL / LORE",
  },
};

export default function ThreatVectorPage() {
  const [activeCategory, setActiveCategory] = useState("realistic");
  const [query, setQuery] = useState("");

  const category = CATEGORIES.find((item) => item.key === activeCategory) || CATEGORIES[0];
  const categoryContent = CATEGORY_CONTENT[category.key];
  const filteredThreats = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return category.threats;
    return category.threats.filter((threat) =>
      [threat.name, threat.classification, threat.origin, threat.id]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [category, query]);

  function queenHref(threat: Threat) {
    const mode = category.key === "fictional" || category.key === "satirical" ? "SIMULATE" : "ANALYZE";
    const focus = category.key === "algorithmic" ? "DIGITAL_SECURITY" : "LOCAL_THREATS";
    const prompt = category.key === "fictional" || category.key === "satirical"
      ? `Run a clearly labeled fictional decision scenario based on ${threat.name}. Give me one decision at a time and wait for my answer.`
      : `Analyze the ${threat.name} reference scenario for my situation. Separate verified live facts from general preparedness, state uncertainty, and give me one safe action.`;
    return `/red-queen?${new URLSearchParams({ mode, focus, prompt }).toString()}`;
  }

  return (
    <div className="library-page">
      <header className="library-hero">
        <Image
          className="library-hero-art"
          src="/art/library-queen-memory-v1.png"
          alt=""
          fill
          sizes="100vw"
          priority
          aria-hidden="true"
        />
        <div className="library-hero-shade" aria-hidden="true" />
        <div className="container">
          <span className="pulse-eyebrow">RED QUEEN // MEMORY OF THE SYSTEM</span>
          <h1>She remembers the patterns.<br /><em>You learn before they repeat.</em></h1>
          <p>The Queen&apos;s structured memory for real hazards, digital defense and fictional simulations. Every lane is labeled so lore never masquerades as live intelligence.</p>
          <div className="library-trust-banner">
            <div><span>LIBRARY</span><strong>Reference material</strong></div>
            <b>≠</b>
            <div><span>LIVE MAP</span><strong>Current verified signals</strong></div>
            <Link href="/pulse#live-map">OPEN LIVE MAP →</Link>
          </div>
        </div>
      </header>

      <main className="container library-main">
        <CoreLoopGuide
          eyebrow="LIBRARY // USE THIS TOOL"
          title="Choose one scenario. Ask one focused question."
          description="Library files are reference material, not live alerts. Open a dossier, then send it to RED QUEEN for your context."
          actionHref="#library-files"
          actionLabel="CHOOSE A DOSSIER"
          accessNote="PUBLIC · LIVE CONDITIONS ALWAYS COME FROM PULSE AND PRIMARY SOURCES"
        />
        <section className="library-lanes" aria-label="Library lanes">
          <button type="button" className={activeCategory === "realistic" ? "active" : ""} onClick={() => setActiveCategory("realistic")}>
            <span>ACT</span><strong>Prepare for real hazards</strong><p>Open practical reference scenarios. Check the Live Map before treating anything as current.</p>
          </button>
          <button type="button" className={activeCategory === "algorithmic" ? "active" : ""} onClick={() => setActiveCategory("algorithmic")}>
            <span>DEFEND</span><strong>Protect wallet and identity</strong><p>Explore defensive digital scenarios without sharing private keys or seed phrases.</p>
          </button>
          <button type="button" className={activeCategory === "fictional" || activeCategory === "satirical" ? "active" : ""} onClick={() => setActiveCategory("fictional")}>
            <span>SIMULATE</span><strong>Train through fiction</strong><p>Practice decisions and explore the apocalypse world without confusing it with reality.</p>
          </button>
        </section>

        <section className="library-controls">
          <div className="library-tabs" role="tablist" aria-label="Threat library category">
            {CATEGORIES.map((item) => {
              const copy = CATEGORY_CONTENT[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === item.key}
                  className={activeCategory === item.key ? "active" : ""}
                  onClick={() => setActiveCategory(item.key)}
                >
                  <span>{copy.eyebrow}</span>
                  <strong>{copy.label}</strong>
                  <small>{item.threats.length} files</small>
                </button>
              );
            })}
          </div>

          <label className="library-search">
            <span>SEARCH CURRENT LANE</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Blackout, phishing, pandemic..." />
          </label>
        </section>

        <section id="library-files" className="library-results">
          <div className="library-results-heading">
            <div>
              <span>{categoryContent.eyebrow}</span>
              <h2>{categoryContent.label}</h2>
              <p>{categoryContent.description}</p>
            </div>
            <strong>{filteredThreats.length} DOSSIERS</strong>
          </div>

          {filteredThreats.length === 0 ? (
            <div className="library-empty">No dossiers match this search in the selected lane.</div>
          ) : (
            <div className="library-grid">
              {filteredThreats.map((threat) => (
                <article key={threat.id} className="library-card" style={{ "--library-color": category.color } as React.CSSProperties}>
                  <div className="library-card-meta">
                    <span>{categoryContent.itemLabel}</span>
                    <b>{threat.id}</b>
                  </div>
                  <h3>{threat.name}</h3>
                  <p>{threat.classification} · {threat.origin}</p>
                  <div className="library-severity">
                    <span>SCENARIO SEVERITY</span><strong>{threat.level}/100</strong>
                    <i><b style={{ width: `${threat.level}%` }} /></i>
                  </div>
                  <small>
                    {category.key === "realistic"
                      ? "Reference scenario. Verify current conditions with official sources."
                      : category.key === "algorithmic"
                        ? "Defensive analysis only. Never share recovery secrets."
                        : "Clearly labeled simulation and worldbuilding content."}
                  </small>
                  <div className="library-card-actions">
                    <Link href={`/library/${threat.id}`}>OPEN DOSSIER</Link>
                    <Link href={queenHref(threat)}>ASK RED QUEEN →</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
