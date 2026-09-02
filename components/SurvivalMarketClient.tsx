"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { SURVIVAL_FOCUS_OPTIONS, SurvivalFocus } from "@/lib/survival-context";
import { purchaseX402Output, X402Delivery } from "@/lib/x402-client";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

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
    sp3nd: { name: string; url: string; rail: string };
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
  images?: string[];
  image_url?: string;
  variants?: Array<{ variant_id?: string; id?: string; name?: string; label?: string }>;
};

type MarketSearchState = {
  busy?: boolean;
  error?: string;
  results?: MarketListing[];
  boundary?: string;
};

type SelectedOffer = { offer: MarketListing; quantity: number; variantId?: string };

type DeliveryDestination = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  deliveryNotes: string;
};

type PhysicalQuote = {
  checkoutId: string;
  sessionId: string;
  cart: any;
  checkout: any;
  authorizationUrl?: string;
  payment?: { asset?: string; network?: string; approval?: string };
  privacy?: string;
};

function listingId(offer: MarketListing) {
  return typeof offer.listing_id === "string" ? offer.listing_id : "";
}

function displayTotal(quote: PhysicalQuote | null) {
  if (!quote) return "";
  const values = [
    quote.checkout?.grand_total,
    quote.checkout?.total,
    quote.checkout?.totals?.grand_total,
    quote.checkout?.receipt?.grand_total,
    quote.cart?.grand_total,
    quote.cart?.total,
    quote.cart?.totals?.grand_total,
  ];
  const value = values.find((entry) => entry !== undefined && entry !== null);
  if (value && typeof value === "object") {
    const amount = value.amount ?? value.value;
    return amount !== undefined ? `${amount} ${value.currency || "PYUSD"}` : "EXACT TOTAL IN WALLET";
  }
  return value !== undefined ? `${value} PYUSD` : "EXACT TOTAL IN WALLET";
}

function deliveredOrderIds(delivery: X402Delivery | null) {
  const data = delivery?.data;
  const direct = Array.isArray(data?.order_ids) ? data.order_ids : Array.isArray(data?.orderIds) ? data.orderIds : [];
  const fromOrders = Array.isArray(data?.orders) ? data.orders.map((order: any) => order?.order_id || order?.id) : [];
  return [...direct, ...fromOrders].filter((value): value is string => typeof value === "string" && value.length > 0);
}

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
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const [area, setArea] = useState("");
  const [focus, setFocus] = useState<SurvivalFocus>("HOUSEHOLD");
  const [people, setPeople] = useState(1);
  const [constraints, setConstraints] = useState("");
  const [kit, setKit] = useState<SurvivalKit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [marketSearches, setMarketSearches] = useState<Record<string, MarketSearchState>>({});
  const [selectedOffers, setSelectedOffers] = useState<Record<string, SelectedOffer>>({});
  const [destination, setDestination] = useState<DeliveryDestination>({
    name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", email: "", phone: "", deliveryNotes: "",
  });
  const [addressConsent, setAddressConsent] = useState(false);
  const [paymentConsent, setPaymentConsent] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [physicalQuote, setPhysicalQuote] = useState<PhysicalQuote | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [kycLink, setKycLink] = useState("");
  const [orderDelivery, setOrderDelivery] = useState<X402Delivery | null>(null);

  const selectedEntries = useMemo(() => Object.entries(selectedOffers), [selectedOffers]);
  const orderIds = useMemo(() => deliveredOrderIds(orderDelivery), [orderDelivery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedArea = params.get("area");
    const requestedFocus = params.get("focus");
    const requestedPeople = Number(params.get("people"));
    if (requestedArea) setArea(requestedArea.slice(0, 80));
    if (requestedFocus && SURVIVAL_FOCUS_OPTIONS.some((option) => option.id === requestedFocus)) setFocus(requestedFocus as SurvivalFocus);
    if (Number.isInteger(requestedPeople) && requestedPeople >= 1 && requestedPeople <= 12) setPeople(requestedPeople);
    try {
      const context = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "null");
      if (!requestedArea && typeof context?.area === "string") setArea(context.area.slice(0, 80));
      if (!requestedFocus && typeof context?.focus === "string" && SURVIVAL_FOCUS_OPTIONS.some((option) => option.id === context.focus)) setFocus(context.focus);
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
      setSelectedOffers({});
      setPhysicalQuote(null);
      setOrderDelivery(null);
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

  function selectOffer(itemId: string, offer: MarketListing) {
    const id = listingId(offer);
    if (!id) return;
    setSelectedOffers((current) => {
      const next = { ...current };
      if (next[itemId]?.offer.listing_id === id) delete next[itemId];
      else next[itemId] = { offer, quantity: 1, variantId: offer.variants?.length === 1 ? offer.variants[0]?.variant_id || offer.variants[0]?.id : undefined };
      return next;
    });
    setPhysicalQuote(null);
    setOrderDelivery(null);
    setPaymentConsent(false);
    setCheckoutError("");
  }

  function updateSelected(itemId: string, patch: Partial<SelectedOffer>) {
    setSelectedOffers((current) => current[itemId]
      ? { ...current, [itemId]: { ...current[itemId], ...patch } }
      : current);
    setPhysicalQuote(null);
    setPaymentConsent(false);
  }

  function updateDestination(field: keyof DeliveryDestination, value: string) {
    setDestination((current) => ({ ...current, [field]: value }));
    setPhysicalQuote(null);
    setPaymentConsent(false);
  }

  async function reviewPhysicalCheckout() {
    if (!addressConsent || selectedEntries.length === 0) return;
    setQuoteBusy(true);
    setCheckoutError("");
    setKycLink("");
    setPhysicalQuote(null);
    setOrderDelivery(null);
    try {
      const response = await fetch("/api/market/cart-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedEntries.map(([, selection]) => ({
            listingId: listingId(selection.offer),
            variantId: selection.variantId,
            quantity: selection.quantity,
          })),
          destination,
          ownerAuthorizedDestinationDisclosure: true,
        }),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        if (typeof payload.kycLink === "string") setKycLink(payload.kycLink);
        throw new Error(payload.error || "The physical checkout quote is unavailable.");
      }
      setPhysicalQuote(payload);
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : "The physical checkout quote is unavailable.");
    } finally {
      setQuoteBusy(false);
    }
  }

  async function confirmPhysicalCheckout() {
    if (!physicalQuote || !paymentConsent || !publicKey || !signTransaction) return;
    setCheckoutBusy(true);
    setCheckoutError("");
    setCheckoutStatus("");
    try {
      const delivery = await purchaseX402Output({
        endpoint: `/api/market/cart-checkout/${encodeURIComponent(physicalQuote.checkoutId)}/confirm`,
        method: "POST",
        body: {},
        publicKey,
        connection,
        allowedAssets: [PYUSD_MINT],
        signTransaction: async (transaction) => await signTransaction(transaction) as VersionedTransaction,
        onStatus: setCheckoutStatus,
      });
      setOrderDelivery(delivery);
      setCheckoutStatus("ORDER CONFIRMED · RECEIPT DELIVERED");
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : "The x402 order was not confirmed.");
      setCheckoutStatus("");
    } finally {
      setCheckoutBusy(false);
    }
  }

  const chatPrompt = `Build a survival cart for ${people} ${people === 1 ? "person" : "people"}${area.trim() ? ` in ${area.trim()}` : ""}. Threat focus: ${focus}.${constraints.trim() ? ` Constraints: ${constraints.trim()}` : ""} Explain every item and find purchasable x402 offers when available.`;
  const chatHref = `/red-queen?${new URLSearchParams({ mode: "PREPARE", focus, prompt: chatPrompt }).toString()}`;

  return <section className="survival-market" id="survival-market">
    <div className="onchain-section-head commerce-desk-head">
      <span>02 // SURVIVAL GEAR</span>
      <h2>Describe the threat. Build the cart.</h2>
      <p>Queen sizes essential supplies and searches live agent inventory. Exact Amazon or eBay product pages can continue into the SP3ND USDC checkout below; x402 Market remains a second physical rail.</p>
    </div>
    <div className={`survival-market-grid${kit ? " has-kit" : " is-configuring"}`}>
      <div className="survival-market-form">
        <div className="survival-market-form-head"><span>BUILD THE MANIFEST</span><strong>FREE CART</strong></div>
        <div className="survival-market-providers"><div><strong>SP3ND FULFILLMENT</strong><span>Amazon/eBay · USDC on Solana</span></div><div><strong>x402 MARKET</strong><span>Agent inventory · PYUSD on Solana</span></div></div>
        <label><b>BROAD CITY OR REGION</b><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
        <div className="survival-market-form-row">
          <label><b>FOCUS</b><select value={focus} onChange={(event) => setFocus(event.target.value as SurvivalFocus)}>{SURVIVAL_FOCUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><b>PEOPLE</b><input type="number" min="1" max="12" value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label>
        </div>
        <label><b>DEPENDENTS OR CONSTRAINTS</b><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Child, pet, limited storage, accessibility needs…" maxLength={320} /></label>
        <button type="button" className="survival-market-build" onClick={() => void buildKit()} disabled={busy || area.trim().length < 2}>{busy ? "COMPILING CART…" : "PREPARE MY 72-HOUR KIT"}</button>
        <Link className="survival-market-chat" href={chatHref}>BUILD IT WITH RED QUEEN IN CHAT →</Link>
        {error && <p className="survival-market-error">{error}</p>}
        <small>BUILDING IS FREE · ADDRESS SHARING AND PAYMENT EACH REQUIRE A SEPARATE APPROVAL</small>
      </div>
      {kit && <div className="survival-market-output has-kit">
        <>
          <header><span>CART READY</span><strong>{kit.items.length} ITEMS · {kit.people} SOLVIVOR{kit.people === 1 ? "" : "S"}</strong></header>
          <div className="survival-market-items">{kit.items.map((entry, index) => {
            const search = marketSearches[entry.id];
            const selected = selectedOffers[entry.id];
            return <article key={entry.id}>
            <div><span>{String(index + 1).padStart(2, "0")} · {entry.category}</span><em>{entry.priority}</em></div>
            <h3>{entry.name}</h3><strong>{entry.quantity}</strong><p>{entry.why}</p>
            {entry.cautions && <small>{entry.cautions}</small>}
            <div className="survival-market-item-actions">
              <button type="button" onClick={() => void searchAgentMarket(entry)} disabled={search?.busy}>{search?.busy ? "SEARCHING…" : "FIND x402 OFFER"}</button>
              <a href={amazonSearch(kit.suppliers.amazon.url, entry.searchQuery)} target="_blank" rel="noreferrer">SEARCH ON AMAZON ↗</a>
            </div>
            {search?.error && <p className="survival-market-search-note is-error">{search.error}</p>}
            {search?.results && search.results.length === 0 && <p className="survival-market-search-note">x402 MARKET CHECKED · 0 LIVE OFFERS · USE AN EXACT AMAZON/EBAY PRODUCT URL IN THE SP3ND USDC DESK BELOW</p>}
            {search?.results && search.results.length > 0 && <div className="survival-market-offers">{search.results.map((offer) => {
              const id = listingId(offer);
              const isSelected = selected?.offer.listing_id === id;
              return <div className={`survival-market-offer${isSelected ? " is-selected" : ""}`} key={id || offer.title}>
                <div><strong>{offer.title || "MARKET OFFER"}</strong><span>{offer.price?.amount || "QUOTE"} {offer.price?.currency || "PYUSD"} · {offer.availability?.status || "CHECK STOCK"}</span><small>{offer.seller?.name || "x402 MARKET SELLER"}{offer.seller?.verified ? " · VERIFIED" : ""}</small></div>
                <div><button type="button" onClick={() => selectOffer(entry.id, offer)} disabled={!id}>{isSelected ? "REMOVE" : "ADD TO x402 CART"}</button><a href={`${kit.suppliers.x402Market.url.replace(/\/shop\/?$/, "")}/p/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">DETAILS ↗</a></div>
                {isSelected && <div className="survival-market-offer-controls">
                  <label><span>ORDER QUANTITY</span><input type="number" min="1" max="12" value={selected.quantity} onChange={(event) => updateSelected(entry.id, { quantity: Math.min(12, Math.max(1, Number(event.target.value) || 1)) })} /></label>
                  {offer.variants && offer.variants.length > 0 && <label><span>VARIANT</span><select value={selected.variantId || ""} onChange={(event) => updateSelected(entry.id, { variantId: event.target.value || undefined })}><option value="">SELECT</option>{offer.variants.map((variant) => <option key={variant.variant_id || variant.id} value={variant.variant_id || variant.id}>{variant.name || variant.label || variant.variant_id || variant.id}</option>)}</select></label>}
                </div>}
              </div>;
            })}</div>}
          </article>})}</div>
          <div className="survival-market-actions">
            <button type="button" onClick={() => void copyKit()}>{copied ? "COPIED" : "COPY CART"}</button>
            <a href={kit.suppliers.x402Market.url} target="_blank" rel="noreferrer">OPEN AGENT MARKET ↗</a>
          </div>
          <div className="survival-market-boundary"><strong>PHYSICAL CHECKOUT IS OWNER-CONTROLLED</strong><p>x402 Market offers use PYUSD. Exact Amazon/eBay pages can be server-priced and fulfilled through SP3ND in USDC below. Both require separate destination disclosure and wallet approval.</p></div>
        </>
      </div>}
    </div>
    {selectedEntries.length > 0 && <section className="physical-checkout" aria-label="Owner-approved x402 physical checkout">
      <header><div><span>03 // QUEEN PHYSICAL BUYER</span><h3>Review destination. Authorize the order.</h3><p>{selectedEntries.length} selected offer{selectedEntries.length === 1 ? "" : "s"}. RED QUEEN will create one held marketplace cart and one payable receipt.</p></div><strong>PYUSD · SOLANA</strong></header>
      {!orderDelivery ? <div className="physical-checkout-grid">
        <div className="physical-checkout-destination">
          <div className="physical-checkout-step"><b>01</b><span>DELIVERY DESTINATION</span><small>NOT STORED BY RED QUEEN</small></div>
          <div className="physical-checkout-fields">
            <label><span>RECIPIENT NAME</span><input value={destination.name} onChange={(event) => updateDestination("name", event.target.value)} autoComplete="name" /></label>
            <label className="is-wide"><span>ADDRESS LINE 1</span><input value={destination.line1} onChange={(event) => updateDestination("line1", event.target.value)} autoComplete="address-line1" /></label>
            <label className="is-wide"><span>ADDRESS LINE 2 · OPTIONAL</span><input value={destination.line2} onChange={(event) => updateDestination("line2", event.target.value)} autoComplete="address-line2" /></label>
            <label><span>CITY</span><input value={destination.city} onChange={(event) => updateDestination("city", event.target.value)} autoComplete="address-level2" /></label>
            <label><span>STATE / REGION</span><input value={destination.state} onChange={(event) => updateDestination("state", event.target.value)} autoComplete="address-level1" /></label>
            <label><span>POSTAL CODE</span><input value={destination.postalCode} onChange={(event) => updateDestination("postalCode", event.target.value)} autoComplete="postal-code" /></label>
            <label><span>COUNTRY CODE</span><input value={destination.country} onChange={(event) => updateDestination("country", event.target.value.toUpperCase().slice(0, 2))} placeholder="ES" maxLength={2} autoComplete="country" /></label>
            <label><span>EMAIL</span><input type="email" value={destination.email} onChange={(event) => updateDestination("email", event.target.value)} autoComplete="email" /></label>
            <label><span>PHONE · ALTERNATIVE</span><input value={destination.phone} onChange={(event) => updateDestination("phone", event.target.value)} autoComplete="tel" /></label>
            <label className="is-wide"><span>DELIVERY NOTES · OPTIONAL</span><input value={destination.deliveryNotes} onChange={(event) => updateDestination("deliveryNotes", event.target.value)} /></label>
          </div>
          <label className="physical-checkout-consent"><input type="checkbox" checked={addressConsent} onChange={(event) => setAddressConsent(event.target.checked)} /><span>I authorize RED QUEEN to relay this destination to x402 Market and the selected sellers solely for this quote and fulfillment.</span></label>
          <button className="physical-checkout-review" type="button" onClick={() => void reviewPhysicalCheckout()} disabled={!addressConsent || quoteBusy}>{quoteBusy ? "HOLDING INVENTORY…" : "REVIEW SHIPPING, TAX & TOTAL"}</button>
        </div>
        <div className="physical-checkout-authorization">
          <div className="physical-checkout-step"><b>02</b><span>OWNER AUTHORIZATION</span><small>SEPARATE WALLET APPROVAL</small></div>
          {!physicalQuote ? <div className="physical-checkout-awaiting"><strong>NO PAYMENT PREPARED</strong><p>Submit the destination to receive a seller-bound receipt with inventory, shipping, taxes, marketplace fee and exact total.</p></div> : <>
            <div className="physical-checkout-quote"><span>HELD CHECKOUT</span><strong>{displayTotal(physicalQuote)}</strong><p>Checkout {physicalQuote.checkoutId}</p><small>{physicalQuote.payment?.approval}</small>{physicalQuote.authorizationUrl && <a href={physicalQuote.authorizationUrl} target="_blank" rel="noreferrer">OPEN HUMAN RECEIPT ↗</a>}</div>
            {!connected ? <div className="physical-checkout-wallet"><p>Connect the wallet that will approve the exact PYUSD payment.</p><WalletMultiButton /></div> : <>
              <label className="physical-checkout-consent"><input type="checkbox" checked={paymentConsent} onChange={(event) => setPaymentConsent(event.target.checked)} /><span>I reviewed the selected products, seller allocation, delivery total and understand this signature creates a real physical order.</span></label>
              <button className="physical-checkout-pay" type="button" onClick={() => void confirmPhysicalCheckout()} disabled={!paymentConsent || checkoutBusy || !signTransaction}>{checkoutBusy ? checkoutStatus || "AWAITING WALLET…" : `APPROVE & PAY ${displayTotal(physicalQuote)}`}</button>
            </>}
          </>}
          {checkoutStatus && !checkoutBusy && <p className="physical-checkout-status">{checkoutStatus}</p>}
          {checkoutError && <div className="physical-checkout-error"><strong>ORDER NOT CONFIRMED</strong><p>{checkoutError}</p>{kycLink && <a href={kycLink} target="_blank" rel="noreferrer">COMPLETE OWNER VERIFICATION ↗</a>}</div>}
        </div>
      </div> : <div className="physical-checkout-success"><span>ORDER CONFIRMED</span><h3>RED QUEEN completed the x402 purchase.</h3><p>The marketplace accepted the payment and created the physical order. Keep the receipt and use the tracking links below.</p><div>{orderIds.map((orderId) => <a key={orderId} href={`/api/market/orders/${encodeURIComponent(orderId)}/tracking`} target="_blank" rel="noreferrer">TRACK {orderId} ↗</a>)}</div><small>PAYMENT TX · {orderDelivery.transactionSignature || "SEE MARKETPLACE RECEIPT"}</small></div>}
    </section>}
  </section>;
}
