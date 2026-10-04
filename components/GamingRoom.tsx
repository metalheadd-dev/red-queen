"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSavedGames } from "@/components/useSavedGames";
import { catalogTags, steamStoreUrl, SURVIVAL_GAMES, type SurvivalGame, type SurvivalLane } from "@/lib/gaming/catalog";

type Lane = "ALL" | SurvivalLane;
const LANES: Array<{ id: Lane; label: string }> = [
  { id: "ALL", label: "ALL SIGNALS" },
  { id: "HARDCORE", label: "HARDCORE" },
  { id: "CO-OP", label: "CO-OP" },
  { id: "EXPLORATION", label: "EXPLORATION" },
  { id: "HORROR", label: "HORROR" },
  { id: "WASTELAND", label: "WASTELAND" },
];

function liveLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? "Live count unavailable" : `${value.toLocaleString()} playing now`;
}

export default function GamingRoom() {
  const [lane, setLane] = useState<Lane>("ALL");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [catalog, setCatalog] = useState<SurvivalGame[]>([...SURVIVAL_GAMES]);
  const [tag, setTag] = useState("ALL");
  const [liveCounts, setLiveCounts] = useState<Record<number, number | null>>({});
  const [shownCount, setShownCount] = useState(24);
  const [compare, setCompare] = useState<number[]>([]);
  const { saved, loaded, notice, toggleSaved } = useSavedGames();

  const tags = useMemo(() => [...new Set(catalog.flatMap(game => catalogTags(game)))].sort(), [catalog]);
  const visible = useMemo(() => catalog.filter((game) =>
    (lane === "ALL" || game.lane === lane)
    && (tag === "ALL" || catalogTags(game).includes(tag))
    && (!savedOnly || saved.includes(game.id))
    && `${game.title} ${game.studio} ${game.setting} ${game.genre || ""} ${catalogTags(game).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [catalog, lane, tag, query, savedOnly, saved]);
  const shown = useMemo(() => visible.slice(0, shownCount), [visible, shownCount]);
  const missingLiveIds = shown.filter(game => !Object.hasOwn(liveCounts, game.id)).slice(0, 24).map(game => game.id).join(",");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gaming/catalog").then(response => response.json()).then(data => {
      if (!cancelled && Array.isArray(data.games)) setCatalog(data.games);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!missingLiveIds) return;
    let cancelled = false;
    fetch(`/api/gaming/steam/current-players?ids=${missingLiveIds}`).then(response => response.json()).then(data => {
      if (cancelled || !Array.isArray(data.counts)) return;
      setLiveCounts(current => ({ ...current, ...Object.fromEntries(data.counts.map((item: { appId: number; players: number | null }) => [item.appId, item.players])) }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [missingLiveIds]);

  function toggleCompare(id: number) {
    setCompare(current => current.includes(id) ? current.filter(value => value !== id) : [...current.slice(-1), id]);
  }

  const compared = compare.map(id => catalog.find(game => game.id === id)).filter(game => game !== undefined);

  return <div className="gaming-page">
    <nav className="gaming-local-nav" aria-label="Gaming Room navigation"><div className="gaming-wrap"><Link href="/gaming" aria-current="page">ROOM HOME</Link><a href="#gaming-catalog">ALL GAMES</a><Link href="/gaming/queen">ASK THE QUEEN</Link><Link href="/gaming/contests">COMPETITIONS</Link><Link href="/gaming/profile">MY STATION</Link></div></nav>
    <section className="gaming-mobile-room gaming-wrap" aria-label="Gaming Room quick start"><div><span className="gaming-kicker">QUEEN + ROOK</span><h1>Gaming Room.</h1><p>Find a game. Plan your next run.</p></div><Image src="/art/gaming-rook-canon-v1.png" alt="ROOK, our mechanical raven mascot" width={80} height={90} /><div className="gaming-mobile-room-actions"><Link href="/gaming/queen" className="gaming-button gaming-button-primary">Gaming Queen →</Link><Link href="/gaming/profile" className="gaming-button gaming-button-outline">My Steam ↗</Link></div></section>
    <header className="gaming-hero">
      <Image src="/art/gaming-room-hero-v2.png" alt="" fill sizes="100vw" className="gaming-hero-art" />
      <div className="gaming-hero-overlay" />
      <Image src="/art/gaming-rook-canon-v1.png" alt="" width={460} height={460} className="gaming-hero-rook-mobile" aria-hidden="true" />
      <div className="gaming-wrap gaming-hero-content">
        <span className="gaming-eyebrow"><i /> RQ CORP / SURVIVAL CULTURE</span>
        <h1>THE GAMING<br /><em>ROOM.</em></h1>
        <p>Worlds worth surviving. Games worth discovering. A new place for the RQ community to play, compete and follow what comes next.</p>
        <div className="gaming-actions"><a href="#gaming-catalog" className="gaming-button gaming-button-primary">EXPLORE THE GAMES <span>↘</span></a><Link href="/gaming/contests" className="gaming-button gaming-button-outline">VIEW COMPETITIONS <span>↗</span></Link></div>
      </div>
      <div className="gaming-hero-index gaming-wrap"><a href="#gaming-catalog">01 / CURATED SURVIVAL</a><a href="#gaming-original">02 / RQ ORIGINALS</a><Link href="/gaming/contests">03 / SEASON BOARD</Link><Link href="/gaming/profile">04 / STEAM CONNECTION</Link></div>
    </header>

    <div className="gaming-wrap gaming-content">
      <section className="gaming-intro" aria-label="Gaming room overview"><span className="gaming-kicker">THE SIGNAL</span><p>Every game here asks the same question in a different way: <strong>what do you do when the plan fails?</strong> We curate survival titles independently, build our own worlds and open competitions when results can be verified.</p></section>

      <section id="gaming-original" className="gaming-original" aria-labelledby="gaming-original-title">
        <div className="gaming-original-copy"><span className="gaming-kicker">RQ ORIGINALS / IN DEVELOPMENT</span><h2 id="gaming-original-title">BLACKSITE<span> / </span>THE FIRST FIELD TEST</h2><p>Red Queen runs the site. ROOK watches the perimeter. You make the decisions that keep the crew alive. Our original survival game is being built for browser, mobile and desktop.</p><div className="gaming-original-foot"><span>BUILD STATUS <b>IN DEVELOPMENT</b></span><Link href="/gaming/contests">HOW THE FIRST SEASON WILL WORK ↗</Link></div></div>
        <div className="gaming-original-art"><Image src="/art/rook-red-queen-v1.png" alt="ROOK, the raven mascot of RED QUEEN" fill sizes="(max-width: 850px) 100vw, 44vw" /></div>
      </section>

      <section className="gaming-queen-entry" aria-labelledby="gaming-queen-entry-title"><div><span className="gaming-kicker">RED QUEEN / YOUR NEXT MOVE</span><h2 id="gaming-queen-entry-title">Every run has a lesson.</h2><p>Find a survival game that fits your night. Plan a first session without spoilers. Tell Queen what went wrong and decide what to try next.</p></div><Link href="/gaming/queen" className="gaming-button gaming-button-primary">ASK THE QUEEN →</Link></section>

      <section id="gaming-catalog" className="gaming-catalog" aria-labelledby="gaming-catalog-title">
        <div className="gaming-section-heading"><div><span className="gaming-kicker">01 / FIELD LIBRARY</span><h2 id="gaming-catalog-title">SURVIVAL, SELECTED.</h2></div><p>Independent picks from Steam. Follow the official store page for current prices, availability and wishlists.</p></div>
        <div className="gaming-steam-public-note"><strong>STEAM LIVE SIGNAL</strong><span>Current players are a Steam snapshot, refreshed about every 15 minutes. This is not sales or ownership data.</span></div>
        {compared.length > 0 && <div className="gaming-compare"><div><span className="gaming-kicker">COMPARE / UP TO 2</span><h3>THE FIELD, SIDE BY SIDE.</h3></div><div className="gaming-compare-games">{compared.map(game => <div key={game.id}><strong>{game.title}</strong><span>{liveLabel(liveCounts[game.id])}</span><span>{game.signal}</span><button type="button" onClick={() => toggleCompare(game.id)}>REMOVE ×</button></div>)}</div></div>}
        <div className="gaming-toolbar"><div className="gaming-filters" role="group" aria-label="Filter survival games">{LANES.map((item) => <button type="button" key={item.id} onClick={() => { setLane(item.id); setShownCount(24); }} aria-pressed={lane === item.id} className={lane === item.id ? "active" : ""}>{item.label}</button>)}</div><label className="gaming-search"><input aria-label="Search survival games" value={query} onChange={(event) => { setQuery(event.target.value); setShownCount(24); }} placeholder="SEARCH THE ROOM..." maxLength={80} /><span aria-hidden="true">⌕</span></label></div>
        <div className="gaming-tag-filter"><label>TAG <select value={tag} onChange={event => { setTag(event.target.value); setShownCount(24); }}><option value="ALL">ALL TAGS</option>{tags.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
        <div className="gaming-catalog-status"><span aria-live="polite">{visible.length} / {catalog.length} GAMES · SHOWING {shown.length}</span><button type="button" aria-pressed={savedOnly} disabled={!loaded} onClick={() => { setSavedOnly(!savedOnly); setShownCount(24); }}>SAVED ONLY ({saved.length})</button><Link href="/gaming/profile">MANAGE SAVED GAMES ↗</Link></div>
        {notice && <p className="gaming-profile-feedback" role="status">{notice}</p>}
        <div className="gaming-grid">{shown.map((game, index) => <article className="gaming-card" key={game.id} style={{ "--game-accent": game.accent } as React.CSSProperties}>
          <div className="gaming-card-art"><span className="gaming-card-number">RQ FILE / {String(index + 1).padStart(2, "0")}</span><span className="gaming-card-horizon" /><strong>{game.setting}</strong></div>
          <div className="gaming-card-info"><span>{game.signal} <i>·</i> {game.studio}</span><h3><Link href={`/gaming/games/${game.id}`}>{game.title}</Link></h3><p>{game.note}</p><div className="gaming-card-tags"><b>{game.genre || game.lane}</b>{catalogTags(game).slice(0, 3).map(value => <b key={value}>{value}</b>)}</div><div className="gaming-card-live">{liveCounts[game.id] === undefined ? "STEAM LIVE / LOADING" : liveCounts[game.id] === null ? "STEAM LIVE / UNAVAILABLE" : `● ${liveLabel(liveCounts[game.id]).toUpperCase()} ON STEAM`}</div><div className="gaming-card-actions"><Link href={`/gaming/games/${game.id}`} aria-label={`View ${game.title} details`}>GAME FILE ↗</Link><button type="button" aria-label={`${saved.includes(game.id) ? "Unsave" : "Save"} ${game.title}`} disabled={!loaded} aria-pressed={loaded && saved.includes(game.id)} onClick={() => toggleSaved(game.id)}>{loaded && saved.includes(game.id) ? "SAVED ✓" : "SAVE +"}</button><button type="button" aria-label={`${compare.includes(game.id) ? "Remove" : "Compare"} ${game.title}`} aria-pressed={compare.includes(game.id)} onClick={() => toggleCompare(game.id)}>{compare.includes(game.id) ? "COMPARING ✓" : "COMPARE +"}</button></div><Link className="gaming-card-queen" href={`/gaming/queen?game=${game.id}`} aria-label={`Ask Queen about ${game.title}`}>PLAN A RUN WITH QUEEN →</Link></div>
          </article>)}</div>
        {shown.length < visible.length && <div className="gaming-actions"><button type="button" className="gaming-button gaming-button-outline" onClick={() => setShownCount(count => count + 24)}>LOAD MORE GAMES ({visible.length - shown.length} LEFT) ↓</button></div>}
        {visible.length === 0 && <div className="gaming-empty"><p>{savedOnly && saved.length === 0 ? "YOUR SAVED LIST IS EMPTY." : "NO MATCHING GAMES."}</p><button type="button" className="gaming-button gaming-button-outline" onClick={() => { setLane("ALL"); setTag("ALL"); setQuery(""); setSavedOnly(false); }}>SHOW ALL GAMES ↗</button></div>}
        <p className="gaming-editorial-note">Games are selected with RED QUEEN survival tags and admin review. RED QUEEN is independent of Steam and these studios; no discounts or partnerships are implied. Saved games stay in this browser and are separate from Steam wishlists.</p>
      </section>

      <section className="gaming-next" aria-label="More from the gaming room"><Link href="/gaming/contests"><span className="gaming-kicker">02 / COMPETITIONS</span><strong>THE SEASON BOARD</strong><p>Rules first. Scores only when we can verify them.</p><b>ENTER THE BOARD ↗</b></Link><Link href="/gaming/profile"><span className="gaming-kicker">03 / YOUR STATION</span><strong>CONNECT YOUR STEAM</strong><p>Link a Steam identity to your RQ account and review your saved games.</p><b>OPEN MY STATION ↗</b></Link></section>
      <div className="gaming-chain"><div><span className="gaming-kicker">04 / SOLANA</span><h2>PROOF AFTER PLAY.</h2><p>Our intended onchain role is a small, verifiable record of finalized season results. Playing and browsing never require a wallet. $THREAT will not buy a higher score.</p></div><Link href="/proofs" className="gaming-button gaming-button-outline">EXPLORE RQ PROOF PROTOCOL ↗</Link></div>
    </div>
  </div>;
}
