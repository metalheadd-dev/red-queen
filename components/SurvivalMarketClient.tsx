"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SURVIVAL_FOCUS_OPTIONS, SurvivalFocus } from "@/lib/survival-context";

type KitItem = {
  id: string;
  category: string;
  name: string;
  quantity: string;
  priority: "ESSENTIAL" | "CONTEXTUAL";
  why: string;
  searchQuery: string;
  cautions?: string;
};

type SurvivalKit = {
  title: string;
  generatedAt: string;
  area: string;
  focus: string;
  people: number;
  constraints: string;
  items: KitItem[];
  suppliers: {
    x402Market: { name: string; url: string; rail: string };
    amazon: { name: string; url: string; rail: string };
  };
  checkoutStatus: string;
  checkoutBoundary: string;
};

type MarketListing = {
  listing_id?: string;
  title?: string;
  description?: string;
  price?: { amount?: string; currency?: string };
  availability?: { status?: string; quantity?: number | null };
  seller?: { name?: string; verified?: boolean };
};

type MarketSearchState = {
  busy?: boolean;
  error?: string;
  results?: MarketListing[];
  boundary?: string;
};

function amazonSearch(baseUrl: string, query: string) {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("k", query);
    return url.toString();
  } catch {
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  }
}

export default function SurvivalMarketClient() {
  const [area, setArea] = useState("");
  const [focus, setFocus] = useState<SurvivalFocus>("HOUSEHOLD");
  const [people, setPeople] = useState(1);
  const [constraints, setConstraints] = useState("");
  const [kit, setKit] = useState<SurvivalKit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [marketSearches, setMarketSearches] = useState<Record<string, MarketSearchState>>({});

  useEffect(() => {
    try {
      const context = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "null");
      if (typeof context?.area === "string") setArea(context.area.slice(0, 80));
      if (typeof context?.focus === "string" && SURVIVAL_FOCUS_OPTIONS.some((option) => option.id === context.focus)) setFocus(context.focus);
    } catch {}
  }, []);

  async function buildKit() {
    setBusy(true);
    setError("");
    setKit(null);
    try {
      const response = await fetch("/api/market/survival-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, focus, people, constraints }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "RED QUEEN could not prepare the cart.");
      setKit(payload.kit);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "RED QUEEN could not prepare the cart.");
    } finally {
      setBusy(false);
    }
  }

  async function copyKit() {
    if (!kit) return;
    const lines = [kit.title, ...kit.items.map((entry) => `[${entry.priority}] ${entry.name} · ${entry.quantity} · ${entry.why}`), "", kit.checkoutBoundary];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  async function searchAgentMarket(entry: KitItem) {
    setMarketSearches((current) => ({ ...current, [entry.id]: { busy: true } }));
    try {
      const response = await fetch("/api/market/catalog-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: entry.searchQuery }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Agent-market search failed.");
      setMarketSearches((current) => ({ ...current, [entry.id]: {
        results: Array.isArray(payload.results) ? payload.results : [],
        boundary: payload.checkoutBoundary,
      } }));
    } catch (reason) {
      setMarketSearches((current) => ({ ...current, [entry.id]: {
        error: reason instanceof Error ? reason.message : "Agent-market search failed.",
      } }));
    }
  }

  const chatPrompt = `Build a survival cart for ${people} ${people === 1 ? "person" : "people"}${area.trim() ? ` in ${area.trim()}` : ""}. Threat focus: ${focus}.${constraints.trim() ? ` Constraints: ${constraints.trim()}` : ""} Explain every item and give me Amazon search links.`;
  const chatHref = `/red-queen?${new URLSearchParams({ mode: "PREPARE", focus, prompt: chatPrompt }).toString()}`;

  return <section className="survival-market" id="survival-market">
    <div className="onchain-section-head commerce-desk-head">
      <span>02 // SURVIVAL GEAR</span>
      <h2>Describe the threat. Build the cart.</h2>
      <p>Queen sizes essential supplies for your real context, explains every item and prepares live Amazon or agent-market searches. The cart is free; checkout is always separate.</p>
    </div>
    <div className={`survival-market-grid${kit ? " has-kit" : " is-configuring"}`}>
      <div className="survival-market-form">
        <div className="survival-market-form-head"><span>BUILD THE MANIFEST</span><strong>FREE CART</strong></div>
        <div className="survival-market-providers"><div><strong>AMAZON SEARCH</strong><span>Real product search · external checkout</span></div><div><strong>x402 AGENT MARKET</strong><span>Machine listings · availability checked on demand</span></div></div>
        <label><b>BROAD CITY OR REGION</b><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
        <div className="survival-market-form-row">
          <label><b>FOCUS</b><select value={focus} onChange={(event) => setFocus(event.target.value as SurvivalFocus)}>{SURVIVAL_FOCUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><b>PEOPLE</b><input type="number" min="1" max="12" value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label>
        </div>
        <label><b>DEPENDENTS OR CONSTRAINTS</b><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Child, pet, limited storage, accessibility needs…" maxLength={320} /></label>
        <button type="button" className="survival-market-build" onClick={() => void buildKit()} disabled={busy || area.trim().length < 2}>{busy ? "COMPILING CART…" : "PREPARE MY 72-HOUR KIT"}</button>
        <Link className="survival-market-chat" href={chatHref}>BUILD IT WITH RED QUEEN IN CHAT →</Link>
        {error && <p className="survival-market-error">{error}</p>}
        <small>NO WALLET REQUIRED · NO ORDER IS PLACED · AMAZON OPENS IN A NEW TAB</small>
      </div>
      {kit && <div className="survival-market-output has-kit">
        <>
          <header><span>CART READY</span><strong>{kit.items.length} ITEMS · {kit.people} SOLVIVOR{kit.people === 1 ? "" : "S"}</strong></header>
          <div className="survival-market-items">{kit.items.map((entry, index) => {
            const search = marketSearches[entry.id];
            return <article key={entry.id}>
            <div><span>{String(index + 1).padStart(2, "0")} · {entry.category}</span><em>{entry.priority}</em></div>
            <h3>{entry.name}</h3><strong>{entry.quantity}</strong><p>{entry.why}</p>
            {entry.cautions && <small>{entry.cautions}</small>}
            <div className="survival-market-item-actions">
              <button type="button" onClick={() => void searchAgentMarket(entry)} disabled={search?.busy}>{search?.busy ? "SEARCHING…" : "FIND x402 OFFER"}</button>
              <a href={amazonSearch(kit.suppliers.amazon.url, entry.searchQuery)} target="_blank" rel="noreferrer">SEARCH ON AMAZON ↗</a>
            </div>
            {search?.error && <p className="survival-market-search-note is-error">{search.error}</p>}
            {search?.results && search.results.length === 0 && <p className="survival-market-search-note">NO VERIFIED AGENT-MARKET OFFER YET · RETAILER FALLBACK AVAILABLE</p>}
            {search?.results && search.results.length > 0 && <div className="survival-market-offers">{search.results.map((offer) => <a key={offer.listing_id || offer.title} href={`${kit.suppliers.x402Market.url.replace(/\/shop\/?$/, "")}/api/v1/listings/${encodeURIComponent(offer.listing_id || "")}`} target="_blank" rel="noreferrer">
              <strong>{offer.title || "MARKET OFFER"}</strong>
              <span>{offer.price?.amount || "QUOTE"} {offer.price?.currency || ""} · {offer.availability?.status || "CHECK STOCK"}</span>
            </a>)}</div>}
          </article>})}</div>
          <div className="survival-market-actions">
            <button type="button" onClick={() => void copyKit()}>{copied ? "COPIED" : "COPY CART"}</button>
            <a href={kit.suppliers.x402Market.url} target="_blank" rel="noreferrer">OPEN AGENT MARKET ↗</a>
          </div>
          <div className="survival-market-boundary"><strong>AMAZON SEARCH · EXTERNAL CHECKOUT</strong><p>RED QUEEN prepares product searches, not orders. Confirm the exact product, price, stock, delivery and checkout yourself on Amazon. {kit.checkoutBoundary}</p></div>
        </>
      </div>}
    </div>
  </section>;
}
