"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { purchaseX402Output } from "@/lib/x402-client";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type Destination = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
};

type Sp3ndGate = {
  paymentReady?: boolean;
  quoteCurrent?: boolean;
  shippingSelected?: boolean;
  payable?: boolean;
};

type Sp3ndOrder = Record<string, any>;

function orderTotal(order: Sp3ndOrder | null) {
  if (!order) return "SERVER QUOTE PENDING";
  const amount = order.total_amount ?? order.grand_total ?? order.total ?? order.amount;
  const value = amount && typeof amount === "object" ? amount.amount ?? amount.value : amount;
  const currency = amount && typeof amount === "object" ? amount.currency : order.currency;
  return value !== undefined && value !== null ? `${value} ${currency || "USDC"}` : "SERVER QUOTE PENDING";
}

function cleanProductLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
}

export default function Sp3ndCheckoutClient() {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const [products, setProducts] = useState("");
  const [destination, setDestination] = useState<Destination>({
    name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", email: "", phone: "",
  });
  const [consent, setConsent] = useState(false);
  const [paymentConsent, setPaymentConsent] = useState(false);
  const [providerReady, setProviderReady] = useState<boolean | null>(null);
  const [checkoutKey, setCheckoutKey] = useState("");
  const [cartId, setCartId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Sp3ndOrder | null>(null);
  const [gate, setGate] = useState<Sp3ndGate>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const productUrls = useMemo(() => cleanProductLines(products), [products]);
  const shippingOptions = Array.isArray(order?.shipping_options) ? order.shipping_options : [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("sp3ndProduct");
    if (product?.startsWith("https://")) setProducts(product.slice(0, 1_000));
    setCheckoutKey(`rq-sp3nd-${crypto.randomUUID()}`);
    void fetch("/api/market/sp3nd/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setProviderReady(payload.ready === true))
      .catch(() => setProviderReady(false));
  }, []);

  function resetQuote() {
    setCartId("");
    setOrderId("");
    setOrder(null);
    setGate({});
    setPaymentConsent(false);
    setCheckoutKey(`rq-sp3nd-${crypto.randomUUID()}`);
  }

  function changeDestination(field: keyof Destination, value: string) {
    setDestination((current) => ({ ...current, [field]: value }));
    resetQuote();
  }

  async function prepareOrder() {
    if (!publicKey || !consent || productUrls.length === 0) return;
    setBusy(true);
    setError("");
    setStatus("SP3ND IS RESOLVING PRODUCT AND DELIVERY PRICES…");
    try {
      let activeCartId = cartId;
      if (!activeCartId) {
        const cartResponse = await fetch("/api/market/sp3nd/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: productUrls.map((productUrl) => ({ productUrl, quantity: 1 })),
            userWallet: publicKey.toBase58(),
            country: destination.country,
            postalCode: destination.postalCode,
            ownerAuthorizedDestinationDisclosure: true,
          }),
        });
        const cartPayload = await cartResponse.json();
        if (!cartResponse.ok) throw new Error(cartPayload.error || "SP3ND could not create the server-priced cart.");
        activeCartId = cartPayload.cartId;
        setCartId(activeCartId);
      }

      const orderResponse = await fetch("/api/market/sp3nd/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: activeCartId,
          checkoutKey,
          userWallet: publicKey.toBase58(),
          destination,
          ownerAuthorizedDestinationDisclosure: true,
        }),
      });
      const orderPayload = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderPayload.error || "SP3ND could not create the order quote.");
      setOrderId(orderPayload.orderId);
      setOrder(orderPayload.order);
      setGate(orderPayload.gate || {});
      setStatus(orderPayload.gate?.payable ? "READY FOR OWNER-APPROVED USDC PAYMENT" : "AWAITING SP3ND REVIEW OR SHIPPING SELECTION");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "SP3ND checkout is unavailable.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function refreshOrder() {
    if (!orderId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/market/sp3nd/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "SP3ND order status is unavailable.");
      setOrder(payload.order);
      setGate(payload.gate || {});
      setStatus(payload.gate?.payable ? "READY FOR OWNER-APPROVED USDC PAYMENT" : `ORDER STATUS · ${payload.order?.status || payload.order?.pricing_status || "REVIEW"}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "SP3ND order status is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function selectShipping(shippingOptionId: string) {
    if (!orderId || !shippingOptionId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/market/sp3nd/orders/${encodeURIComponent(orderId)}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingOptionId, ownerAuthorizedShippingSelection: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "SP3ND rejected the shipping choice.");
      setOrder(payload.order);
      setGate(payload.gate || {});
      setStatus(payload.gate?.payable ? "SHIPPING LOCKED · READY FOR PAYMENT" : "SHIPPING SAVED · QUOTE REFRESHING");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "SP3ND shipping selection is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function payOrder() {
    if (!orderId || !gate.payable || !paymentConsent || !publicKey || !signTransaction) return;
    setBusy(true);
    setError("");
    try {
      await purchaseX402Output({
        endpoint: `/api/market/sp3nd/orders/${encodeURIComponent(orderId)}/pay`,
        method: "POST",
        body: {},
        publicKey,
        connection,
        allowedAssets: [USDC_MINT],
        signTransaction: async (transaction) => await signTransaction(transaction) as VersionedTransaction,
        onStatus: setStatus,
      });
      setStatus("PAYMENT ACCEPTED · SP3ND ORDER ENTERED FULFILLMENT");
      await refreshOrder();
    } catch (reason) {
      setError(reason instanceof Error ? `${reason.message} Refresh the order before any retry.` : "SP3ND payment was not confirmed. Refresh before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="sp3nd-checkout" id="sp3nd-checkout" aria-label="SP3ND Amazon and eBay USDC checkout">
    <header>
      <div><span>03 // SP3ND PHYSICAL COMMERCE</span><h2>Amazon and eBay. Paid in Solana USDC.</h2><p>Paste exact product pages—or arrive from a Queen product card. SP3ND verifies the listing, calculates the real delivered total and fulfills only after your separate wallet approval.</p></div>
      <strong>{providerReady === null ? "CHECKING RAIL" : providerReady ? "PRODUCTION RAIL READY" : "PARTNER KEY REQUIRED"}</strong>
    </header>
    <div className="sp3nd-checkout-grid">
      <div className="sp3nd-checkout-products">
        <label><b>EXACT PRODUCT URLS · ONE PER LINE</b><textarea value={products} onChange={(event) => { setProducts(event.target.value.slice(0, 12_000)); resetQuote(); }} placeholder="https://www.amazon.es/dp/…" /></label>
        <div className="sp3nd-provider-strip"><span>AMAZON + EBAY</span><span>SERVER-PRICED</span><span>USDC · SOLANA</span><span>NO SUBSCRIPTION</span></div>
        <small>{productUrls.length} PRODUCT{productUrls.length === 1 ? "" : "S"} · QUANTITY 1 EACH · SP3ND, NOT THE USER, DEFINES PRICE AND AVAILABILITY</small>
      </div>
      <div className="sp3nd-checkout-destination">
        <div className="physical-checkout-fields">
          <label><span>RECIPIENT NAME</span><input value={destination.name} onChange={(event) => changeDestination("name", event.target.value)} autoComplete="name" /></label>
          <label className="is-wide"><span>ADDRESS LINE 1</span><input value={destination.line1} onChange={(event) => changeDestination("line1", event.target.value)} autoComplete="address-line1" /></label>
          <label className="is-wide"><span>ADDRESS LINE 2 · OPTIONAL</span><input value={destination.line2} onChange={(event) => changeDestination("line2", event.target.value)} autoComplete="address-line2" /></label>
          <label><span>CITY</span><input value={destination.city} onChange={(event) => changeDestination("city", event.target.value)} autoComplete="address-level2" /></label>
          <label><span>STATE / REGION</span><input value={destination.state} onChange={(event) => changeDestination("state", event.target.value)} autoComplete="address-level1" /></label>
          <label><span>POSTAL CODE</span><input value={destination.postalCode} onChange={(event) => changeDestination("postalCode", event.target.value)} autoComplete="postal-code" /></label>
          <label><span>COUNTRY CODE</span><input value={destination.country} onChange={(event) => changeDestination("country", event.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="ES" /></label>
          <label><span>EMAIL</span><input type="email" value={destination.email} onChange={(event) => changeDestination("email", event.target.value)} autoComplete="email" /></label>
          <label><span>PHONE · OPTIONAL</span><input value={destination.phone} onChange={(event) => changeDestination("phone", event.target.value)} autoComplete="tel" /></label>
        </div>
        {!connected ? <div className="physical-checkout-wallet"><p>Connect the wallet that will receive order attribution and approve the exact USDC payment.</p><WalletMultiButton /></div> : <>
          <label className="physical-checkout-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I authorize RED QUEEN to send these product URLs, my public wallet and this delivery destination to SP3ND solely for pricing and fulfillment.</span></label>
          <button className="physical-checkout-review" type="button" onClick={() => void prepareOrder()} disabled={busy || providerReady !== true || !checkoutKey || !consent || productUrls.length === 0}>{busy ? status || "CONTACTING SP3ND…" : providerReady === false ? "ADD SP3ND PARTNER CREDENTIALS" : "CREATE SERVER-PRICED ORDER"}</button>
        </>}
      </div>
    </div>
    {providerReady === false && <div className="sp3nd-setup-note"><strong>ACTIVATION REQUIRED</strong><p>Register RED QUEEN in the SP3ND partner dashboard, then add <code>SP3ND_API_KEY</code> and <code>SP3ND_API_SECRET</code> to Vercel. Product planning and Amazon links continue to work meanwhile.</p><a href="https://www.sp3nd.shop/partner-api/dashboard" target="_blank" rel="noreferrer">OPEN SP3ND PARTNER DASHBOARD ↗</a></div>}
    {order && <div className="sp3nd-order-panel">
      <div><span>SP3ND ORDER</span><strong>{order.order_number || orderId}</strong><p>{order.status || "Created"} · {order.pricing_status || "pricing pending"}</p></div>
      <div><span>DELIVERED TOTAL</span><strong>{orderTotal(order)}</strong><p>{gate.payable ? "PAYMENT READY" : "PAYMENT LOCKED UNTIL QUOTE IS READY"}</p></div>
      {shippingOptions.length > 0 && !gate.shippingSelected && <label><span>SELECT CURRENT SHIPPING QUOTE</span><select defaultValue="" onChange={(event) => void selectShipping(event.target.value)}><option value="">SELECT SHIPPING</option>{shippingOptions.map((option: any) => <option key={option.shipping_option_id} value={option.shipping_option_id}>{option.label || option.shipping_option_id} · {option.total_amount || option.shipping_amount || "SERVER TOTAL"} {option.currency || "USDC"}</option>)}</select></label>}
      <button type="button" onClick={() => void refreshOrder()} disabled={busy}>REFRESH ORDER</button>
      {gate.payable && <div className="sp3nd-payment-gate"><label className="physical-checkout-consent"><input type="checkbox" checked={paymentConsent} onChange={(event) => setPaymentConsent(event.target.checked)} /><span>I reviewed the current products, shipping, expiry and server total. I authorize exactly this one USDC payment.</span></label><button className="physical-checkout-pay" type="button" disabled={!paymentConsent || busy || !signTransaction} onClick={() => void payOrder()}>APPROVE &amp; PAY {orderTotal(order)}</button></div>}
    </div>}
    {status && <p className="physical-checkout-status">{status}</p>}
    {error && <div className="physical-checkout-error"><strong>SP3ND CHECKOUT PAUSED</strong><p>{error}</p></div>}
    <footer>NO PAYMENT DURING PRODUCT SEARCH · NO PAYMENT WHILE AWAITING REVIEW · NO SECOND PAYMENT AFTER AN UNCERTAIN SETTLEMENT</footer>
  </section>;
}
