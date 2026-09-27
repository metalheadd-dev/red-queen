"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useAuth } from "@/components/AuthProvider";
import {
  PREPAREDNESS_PLANS_EVENT,
  PreparednessPlan,
  readPreparednessPlans,
  savePreparednessPlan,
  updatePreparednessPlanCheckpoint,
} from "@/lib/preparedness-plan";
import { SURVIVAL_FOCUS_OPTIONS, SurvivalFocus, sanitizeSignalId } from "@/lib/survival-context";
import { purchaseX402Output, X402Delivery } from "@/lib/x402-client";
import { commerceAvailability } from "@/lib/commerce-readiness";
import quoteStyles from "./IncidentQuote.module.css";

interface IncidentQuote {
  available: boolean;
  price: string;
  reason: string | null;
  checkedAt: string;
  includes: string[];
  signal: { name: string; sourceUrl: string; observedAt: string; updatedAt: string } | null;
}

interface RecheckQuote {
  available: boolean;
  price?: string;
  headline?: string;
  reason?: string | null;
  changeCount?: number;
  privacy?: string;
}

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

type ProductId = "local" | "plan" | "recheck" | "incident" | "transaction" | "wallet" | "premium" | "external";

const PRODUCT_META: Record<ProductId, { index: string; name: string; price: string; promise: string }> = {
  local: { index: "01", name: "Local threat brief", price: "0.01 USDC", promise: "Verified changes around one broad location during the last 24 hours." },
  plan: { index: "02", name: "72-hour plan", price: "0.02 USDC", promise: "A step-by-step plan for the next 72 hours, tailored to your household." },
  recheck: { index: "03", name: "Plan recheck", price: "0.01 USDC", promise: "Check for a verified source revision first, then pay only when your saved plan may need to change." },
  incident: { index: "04", name: "Incident explained", price: "0.02 USDC", promise: "One verified signal expanded into facts, uncertainty, sources and action." },
  transaction: { index: "05", name: "Transaction check", price: "0.01 USDC", promise: "Decode and simulate a Solana transaction before you decide whether to sign." },
  wallet: { index: "06", name: "Wallet check", price: "0.02 USDC", promise: "Find token permissions and wallet exposures that deserve your attention. This is a read-only check." },
  premium: { index: "07", name: "Area deep dive", price: "0.05 USDC", promise: "Get additional event and weather data for your area, with sources and practical next steps." },
  external: { index: "08", name: "Queen research", price: "0.08 USDC", promise: "Queen purchases web research, reads a source article and combines it with relevant signals to answer your question." },
};

function requestedProduct(value?: string): ProductId {
  return value && Object.prototype.hasOwnProperty.call(PRODUCT_META, value) ? value as ProductId : "local";
}

function filenameFor(product: ProductId) {
  return `red-queen-${product}-${new Date().toISOString().replaceAll(":", "-")}`;
}

function download(value: unknown, filename: string, mimeType: string) {
  const blob = new Blob([typeof value === "string" ? value : JSON.stringify(value, null, 2)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function reportTitle(product: ProductId, data: any) {
  if (product === "local") return data?.report?.headline || "Local Delta delivered";
  if (product === "plan") return data?.plan?.title || "72-hour protocol delivered";
  if (product === "recheck") return data?.report?.title || "Preparedness recheck delivered";
  if (product === "incident") return data?.dossier?.title || "Incident dossier delivered";
  if (product === "wallet") return data?.audit?.headline || "Wallet exposure audit delivered";
  if (product === "premium") return data?.report?.title || "Premium area intelligence delivered";
  if (product === "external") return data?.report?.title || "External survival intelligence delivered";
  return `Transaction risk: ${data?.report?.overallRisk || "inspection delivered"}`;
}

function reportSummary(product: ProductId, data: any) {
  if (product === "local") return data?.report?.assessment || data?.report?.uncertainty;
  if (product === "plan") return `${data?.plan?.phases?.length || 0} operational phases · review ${data?.plan?.reviewAt || "within 24 hours"}`;
  if (product === "recheck") return data?.report?.headline || data?.report?.nextAction;
  if (product === "incident") return data?.dossier?.queenAssessment || data?.dossier?.exportNotice;
  if (product === "wallet") return data?.audit?.assessment || data?.audit?.trustBoundary;
  if (product === "premium") return data?.report?.headline || data?.report?.assessment;
  if (product === "external") return data?.report?.headline || data?.report?.assessment;
  return data?.report?.queenDirective || "Compare the final wallet simulation before signing.";
}

function reportText(product: ProductId, delivery: X402Delivery) {
  return [
    "RED QUEEN // PAID INTELLIGENCE OUTPUT",
    "======================================",
    `PRODUCT: ${PRODUCT_META[product].name}`,
    `OPERATION: ${delivery.operationId}`,
    `SETTLEMENT: ${delivery.transactionSignature || "SEE PRIVATE RECEIPT LEDGER"}`,
    `DELIVERED: ${new Date().toISOString()}`,
    "",
    JSON.stringify(delivery.data, null, 2),
    "",
    "RQ CORP / RED QUEEN SURVIVAL INTELLIGENCE",
  ].join("\n");
}

function sourceList(sources: any[]) {
  if (!Array.isArray(sources) || !sources.length) return null;
  return <section className="paid-report-sources">
    <span>SOURCES</span>
    <div>{sources.slice(0, 5).map((source, index) => (
      <a key={`${source?.url || source?.label || "source"}-${index}`} href={source?.url || "#"} target="_blank" rel="noreferrer">
        {source?.label || "Open source"} <b>↗</b>
      </a>
    ))}</div>
  </section>;
}

function outputValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not supplied";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : item?.name || item?.label || item?.title).filter(Boolean).join(" · ") || "None";
  return "Available in the JSON export.";
}

function PaidReportContent({ product, data }: { product: ProductId; data: any }) {
  const report = product === "local" ? data?.report : product === "plan" ? data?.plan : product === "incident" ? data?.dossier : product === "wallet" ? data?.audit : data?.report;
  if (!report) return null;

  if (product === "external") {
    const receipt = data?.procurementReceipt;
    return <div className="paid-report paid-report-premium">
      <div className="paid-report-next"><span>ONE NEXT ACTION</span><strong>{report.nextAction}</strong></div>
      <div className="paid-report-context"><div><span>AREA</span><strong>{report.area}</strong></div><div><span>FOCUS</span><strong>{String(report.focus || "SURVIVAL").replaceAll("_", " ")}</strong></div><div><span>DATA COST</span><strong>{receipt?.upstreamCost || "0.03 USDC"}</strong></div></div>
      {Array.isArray(report.findings) && report.findings.length > 0 && <div className="paid-report-phases"><article><header><span>PURCHASED FINDINGS</span></header><ol>{report.findings.map((finding: any, index: number) => <li key={index}><strong>{finding.confidence}</strong> · {finding.fact}<br /><small>{finding.relevance}</small></li>)}</ol></article></div>}
      {sourceList(report.sources)}
      <section className="premium-procurement-receipt"><span>DATA PURCHASE RECEIPTS</span><div>{(receipt?.purchases || []).map((entry: any, index: number) => <article key={`${entry.resource}-${index}`}><header><strong>{entry.merchant}</strong><em className="is-purchased">SETTLED</em></header><p>{entry.amountUsdc} USDC · {entry.resource}</p><small>{entry.transaction ? `TX: ${entry.transaction}` : `IDEMPOTENCY: ${entry.idempotencyKey}`}</small></article>)}</div><p>SHARED: {(receipt?.dataShared || []).join(" · ")}</p></section>
      <div className="paid-report-note"><strong>UNCERTAINTY</strong><p>{report.uncertainty}</p></div>
    </div>;
  }

  if (product === "premium") {
    const receipt = data?.procurementReceipt;
    return <div className="paid-report paid-report-premium">
      <div className="paid-report-next"><span>ONE NEXT ACTION</span><strong>{report.nextAction}</strong></div>
      <div className="paid-report-context"><div><span>AREA</span><strong>{report.area}</strong></div><div><span>RADIUS</span><strong>{report.radiusKm} KM</strong></div><div><span>FOCUS</span><strong>{String(report.focus || "AREA").replaceAll("_", " ")}</strong></div></div>
      {Array.isArray(report.signals) && report.signals.length > 0 && <section className="paid-report-signals"><span>PURCHASED GEOINT RECORDS</span>{report.signals.map((signal: any) => <a key={signal.id} href={signal.sourceUrl || "#"} target="_blank" rel="noreferrer"><strong>{signal.title} <em>{signal.severity}/10</em></strong><p>{signal.summary}</p><small>{signal.category} · {signal.location}{signal.sourceUrl ? " ↗" : ""}</small></a>)}</section>}
      {Array.isArray(report.weather) && report.weather.length > 0 && <div className="paid-report-phases"><article><header><span>WEATHER EVIDENCE</span></header><ol>{report.weather.map((entry: any, index: number) => <li key={index}><strong>{entry.headline}</strong> · {entry.description}</li>)}</ol></article></div>}
      <section className="premium-procurement-receipt"><span>PROCUREMENT RECEIPT</span><div>{(receipt?.upstreamPurchases || []).map((entry: any, index: number) => <article key={`${entry.provider}-${index}`}><header><strong>{entry.provider}</strong><em className={`is-${String(entry.status || "").toLowerCase()}`}>{entry.status}</em></header><p>{entry.meteredUnits} · {entry.recordsReceived} records</p><small>SHARED: {(entry.dataShared || []).join(" · ") || "nothing"}</small></article>)}</div><p>{receipt?.dataBoundary}</p></section>
      <div className="paid-report-note"><strong>UNCERTAINTY</strong><p>{report.uncertainty}</p></div>
    </div>;
  }

  if (product === "plan") {
    return <div className="paid-report paid-report-plan">
      <div className="paid-report-context">
        <div><span>AREA</span><strong>{report.area || "Broad area not supplied"}</strong></div>
        <div><span>FOCUS</span><strong>{String(report.focus || "HOUSEHOLD").replaceAll("_", " ")}</strong></div>
        <div><span>REVIEW</span><strong>{report.reviewAt ? new Date(report.reviewAt).toLocaleString() : "Within 24 hours"}</strong></div>
      </div>
      {Array.isArray(report.phases) && <div className="paid-report-phases">
        {report.phases.map((phase: any, index: number) => <article key={`${phase?.window}-${index}`}>
          <header><span>{String(index + 1).padStart(2, "0")} // {phase?.window || "PHASE"}</span><strong>{phase?.objective}</strong></header>
          <ol>{Array.isArray(phase?.steps) && phase.steps.map((step: string, stepIndex: number) => <li key={stepIndex}>{step}</li>)}</ol>
        </article>)}
      </div>}
      {Array.isArray(report.currentSignalContext) && report.currentSignalContext.length > 0 && <section className="paid-report-signals">
        <span>LIVE CONTEXT USED</span>
        {report.currentSignalContext.map((signal: any) => <a key={signal.id || signal.name} href={signal.sourceUrl || "#"} target="_blank" rel="noreferrer"><strong>{signal.name}</strong><p>{signal.fact}</p><small>{signal.source} ↗</small></a>)}
      </section>}
      {sourceList(report.sources)}
      <div className="paid-report-note"><strong>QUEEN'S REMINDER</strong><p>{report.maintenance || report.uncertainty}</p></div>
    </div>;
  }

  if (product === "recheck") {
    return <div className="paid-report paid-report-local">
      <div className="paid-report-next"><span>ONE NEXT ACTION</span><strong>{report.nextAction}</strong></div>
      <div className="paid-report-context"><div><span>AREA</span><strong>{report.plan?.area}</strong></div><div><span>PLAN PROGRESS</span><strong>{report.plan?.progressPercent}%</strong></div><div><span>CHECKPOINT</span><strong>{report.plan?.checkpoint}</strong></div></div>
      <div className="paid-report-signals"><span>SOURCE REVISIONS</span>{(report.changes || []).map((signal: any) => <a key={signal.id} href={signal.sourceUrl} target="_blank" rel="noreferrer"><strong>{signal.name}</strong><p>{signal.fact}</p><small>{signal.source} · UPDATED {signal.updatedAt} ↗</small></a>)}</div>
      {Array.isArray(report.remainingSteps) && report.remainingSteps.length > 0 && <div className="paid-report-phases"><article><header><span>RECHECK AGAINST THESE OPEN STEPS</span></header><ol>{report.remainingSteps.map((step: string, index: number) => <li key={index}>{step}</li>)}</ol></article></div>}
      <div className="paid-report-note"><strong>UNCERTAINTY</strong><p>{report.uncertainty}</p></div>
    </div>;
  }

  if (product === "local") {
    return <div className="paid-report paid-report-local">
      <div className="paid-report-next"><span>ONE NEXT ACTION</span><strong>{report.nextAction}</strong></div>
      <div className="paid-report-context"><div><span>AREA</span><strong>{report.area}</strong></div><div><span>RADIUS</span><strong>{report.radiusKm ? `${report.radiusKm} KM` : "BROAD MATCH"}</strong></div><div><span>WINDOW</span><strong>LAST 24 HOURS</strong></div></div>
      {Array.isArray(report.changes) && report.changes.length > 0 ? <div className="paid-report-signals">
        <span>CHANGES THAT MATCHED</span>
        {report.changes.map((signal: any) => <a key={signal.id} href={signal.sourceUrl || "#"} target="_blank" rel="noreferrer"><strong>{signal.name} <em>{signal.severity}</em></strong><p>{signal.fact}</p><small>{signal.source}{typeof signal.distanceKm === "number" ? ` · ${signal.distanceKm} KM` : ""} ↗</small></a>)}
      </div> : <div className="paid-report-note"><strong>NO MATCHES IN THIS WINDOW</strong><p>{report.assessment}</p></div>}
      <div className="paid-report-note"><strong>UNCERTAINTY</strong><p>{report.uncertainty}</p></div>
    </div>;
  }

  if (product === "incident") {
    return <div className="paid-report paid-report-incident">
      <div className="paid-report-context"><div><span>CLASSIFICATION</span><strong>{report.classification}</strong></div><div><span>LOCATION</span><strong>{report.location}</strong></div><div><span>CONFIDENCE</span><strong>{report.confidence ?? "Not declared"}</strong></div></div>
      <div className="paid-report-next"><span>QUEEN ASSESSMENT</span><strong>{report.queenAssessment}</strong></div>
      <div className="paid-report-phases"><article><header><span>CONFIRMED FACTS</span></header><ol>{(report.confirmedFacts || []).map((fact: string, index: number) => <li key={index}>{fact}</li>)}</ol></article><article><header><span>ACTION PROTOCOL</span></header><ol>{(report.actionProtocol || []).map((step: string, index: number) => <li key={index}>{step}</li>)}</ol></article></div>
      {sourceList(report.sources)}
      <div className="paid-report-note"><strong>UNCERTAINTY</strong><p>{Array.isArray(report.uncertainty) ? report.uncertainty.join(" ") : report.uncertainty}</p></div>
    </div>;
  }

  const keyFacts = product === "wallet"
    ? [["NETWORK", report.network], ["STATUS", report.status], ["ASSESSMENT", report.headline || report.assessment], ["DELEGATES", report.surface?.activeDelegates], ["FROZEN ACCOUNTS", report.surface?.frozenAccounts]]
    : [["OVERALL RISK", report.overallRisk], ["QUEEN DIRECTIVE", report.queenDirective], ["SIMULATION", report.simulation?.status || report.simulationStatus], ["INSTRUCTIONS", Array.isArray(report.instructions) ? report.instructions.length : undefined]];
  return <div className="paid-report paid-report-generic">
    <div className="paid-report-facts">{keyFacts.filter(([, value]) => value !== undefined).map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{outputValue(value)}</strong></div>)}</div>
    {Array.isArray(report.instructions) && report.instructions.length > 0 && <div className="paid-report-phases"><article><header><span>DECODED INSTRUCTIONS</span></header><ol>{report.instructions.map((instruction: any, index: number) => <li key={index}>{typeof instruction === "string" ? instruction : instruction?.summary || instruction?.program || `Instruction ${index + 1}`}</li>)}</ol></article></div>}
    <div className="paid-report-note"><strong>REPORT BOUNDARY</strong><p>{report.trustBoundary || report.uncertainty || "This report is decision support. Review the raw JSON export before acting on technical details."}</p></div>
  </div>;
}

export default function IntelligenceOperationsClient({ initialProduct }: { initialProduct?: string }) {
  const { publicKey, connected, signTransaction } = useWallet();
  const { session } = useAuth();
  const [active, setActive] = useState<ProductId>(() => requestedProduct(initialProduct));
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityReason, setAvailabilityReason] = useState("Checking x402 settlement rail…");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState<X402Delivery | null>(null);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState("");
  const [radiusKm, setRadiusKm] = useState(250);
  const [focus, setFocus] = useState<SurvivalFocus>("HOUSEHOLD");
  const [household, setHousehold] = useState("");
  const [constraints, setConstraints] = useState("");
  const [recheckPlans, setRecheckPlans] = useState<PreparednessPlan[]>([]);
  const [recheckPlanId, setRecheckPlanId] = useState("");
  const [recheckQuote, setRecheckQuote] = useState<RecheckQuote | null>(null);
  const [recheckBusy, setRecheckBusy] = useState(false);
  const [signalId, setSignalId] = useState("");
  const [incidentQuote, setIncidentQuote] = useState<IncidentQuote | null>(null);
  const [incidentQuoteBusy, setIncidentQuoteBusy] = useState(false);
  const [transaction, setTransaction] = useState("");
  const [savedPlan, setSavedPlan] = useState(false);
  const [premiumQuote, setPremiumQuote] = useState<any>(null);
  const [externalQuestion, setExternalQuestion] = useState("What current external evidence could change my 72-hour preparedness priorities?");
  const [externalQuote, setExternalQuote] = useState<any>(null);
  const [buyerReadiness, setBuyerReadiness] = useState<any>(null);
  const [readinessVersion, setReadinessVersion] = useState(0);
  const [quoteBusy, setQuoteBusy] = useState(false);

  useEffect(() => {
    setAvailable(null);
    fetch("/api/x402/status", { cache: "no-store" })
      .then(async (response) => response.json())
      .then((data) => {
        setAvailable(data.available === true);
        setAvailabilityReason(data.available ? "x402 v2 exact SVM ready" : data.reason || "Settlement rail unavailable");
      })
      .catch(() => {
        setAvailable(false);
        setAvailabilityReason("Settlement health check failed");
      });
  }, [readinessVersion]);

  useEffect(() => {
    setPremiumQuote(null);
    fetch("/api/intel/premium-area/quote", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Provider check failed"); return response.json(); })
      .then((data) => setPremiumQuote(data.quote || null))
      .catch(() => setPremiumQuote({ eligible: false, providers: [], dataBoundary: "Provider quote unavailable." }));
  }, [readinessVersion]);

  useEffect(() => {
    setBuyerReadiness(null);
    fetch("/api/intel/external-intelligence/quote", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Buyer check failed"); return response.json(); })
      .then((data) => setBuyerReadiness(data.quote || { eligible: false }))
      .catch(() => setBuyerReadiness({ eligible: false, reason: "Buyer availability could not be checked. Please refresh." }));
  }, [readinessVersion]);

  useEffect(() => {
    if (active === "external") setExternalQuote(null);
    if (active === "recheck") setRecheckQuote(null);
  }, [active, area, focus, externalQuestion, recheckPlanId]);

  useEffect(() => {
    setActive(requestedProduct(initialProduct));
    setDelivery(null);
    setError("");
    setStatus("");
  }, [initialProduct]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSignal = params.get("signalId");
    const requestedPlan = params.get("planId");
    if (requestedSignal) setSignalId(requestedSignal.slice(0, 240));
    try {
      const localPlans = readPreparednessPlans(localStorage).filter((plan) => plan.status === "ACTIVE");
      setRecheckPlans(localPlans);
      setRecheckPlanId(localPlans.some((plan) => plan.id === requestedPlan) ? requestedPlan! : localPlans[0]?.id || "");
      const context = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "null");
      if (typeof context?.area === "string") setArea(context.area.slice(0, 80));
      if (typeof context?.focus === "string" && SURVIVAL_FOCUS_OPTIONS.some((option) => option.id === context.focus)) setFocus(context.focus);
    } catch {}
  }, []);

  useEffect(() => {
    if (active !== "incident" || !signalId.trim()) { setIncidentQuote(null); setIncidentQuoteBusy(false); return; }
    const id = sanitizeSignalId(signalId);
    if (!id) { setIncidentQuote({ available: false, price: "0.02 USDC", reason: "Choose a valid signal from Pulse or Threat Graph.", checkedAt: "", includes: [], signal: null }); return; }
    const controller = new AbortController();
    setIncidentQuote(null); setIncidentQuoteBusy(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/intel/incident-dossier/quote?signalId=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => { if (!response.ok) throw new Error("Could not check this source"); return response.json(); })
        .then((data) => { if (!controller.signal.aborted) setIncidentQuote(data); })
        .catch(() => { if (!controller.signal.aborted) setIncidentQuote({ available: false, price: "0.02 USDC", reason: "Source check failed. No payment is available until it recovers.", checkedAt: "", includes: [], signal: null }); })
        .finally(() => { if (!controller.signal.aborted) setIncidentQuoteBusy(false); });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [active, signalId, readinessVersion]);

  const output = delivery?.data;
  const recheckPlan = recheckPlans.find((plan) => plan.id === recheckPlanId) || null;
  const canPurchase = available === true && connected && publicKey && signTransaction && !busy;
  const meta = PRODUCT_META[active];
  function productAvailability(product: ProductId) {
    return commerceAvailability(available, product === "premium" || product === "external",
      product === "premium" ? premiumQuote?.eligible : product === "external" ? (externalQuote || buyerReadiness)?.eligible : undefined);
  }
  const selectedAvailability = productAvailability(active);
  const operationStatus = selectedAvailability.label;
  const operationNeedsProvider = active === "premium" || active === "external";
  const sourceCount = useMemo(() => {
    if (active === "local") return output?.report?.changes?.length || 0;
    if (active === "plan") return output?.plan?.sources?.length || 0;
    if (active === "recheck") return output?.report?.changes?.length || 0;
    if (active === "incident") return output?.dossier?.sources?.length || 0;
    if (active === "wallet") return output?.audit?.surface?.tokenAccounts || 0;
    if (active === "premium") return (output?.report?.signals?.length || 0) + (output?.report?.weather?.length || 0);
    if (active === "external") return output?.report?.sources?.length || 0;
    return output?.report?.instructions?.length || 0;
  }, [active, output]);

  function recheckPayload(plan: PreparednessPlan) {
    const completedSteps = plan.steps.filter((step) => step.completed).length;
    return {
      title: plan.title,
      area: plan.area,
      focus: plan.focus,
      updatedAt: plan.conditionCheckedAt || plan.createdAt,
      reviewAt: plan.reviewAt,
      completedSteps,
      totalSteps: plan.steps.length,
      remainingSteps: plan.steps.filter((step) => !step.completed).map((step) => step.text),
    };
  }

  async function prepareRecheckQuote() {
    if (!recheckPlan) { setError("Choose an active saved plan first."); return; }
    setRecheckBusy(true); setRecheckQuote(null); setError(""); setDelivery(null);
    try {
      const response = await fetch("/api/intel/preparedness-recheck/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recheckPayload(recheckPlan)),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.reason || "Plan conditions could not be checked.");
      setRecheckQuote(data);
      if (!data.available && typeof data.checkedAt === "string") {
        setRecheckPlans(updatePreparednessPlanCheckpoint(localStorage, recheckPlan.id, data.checkedAt));
        window.dispatchEvent(new Event(PREPAREDNESS_PLANS_EVENT));
      }
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Plan conditions could not be checked.");
    } finally {
      setRecheckBusy(false);
    }
  }

  async function resolveArea() {
    if (area.trim().length < 2) throw new Error("Enter a broad city or region.");
    const response = await fetch(`/api/location/resolve?q=${encodeURIComponent(area.trim())}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Broad area could not be resolved.");
    return { area: data.label || area.trim(), lat: data.lat, lng: data.lng };
  }

  async function purchase() {
    if (!publicKey || !signTransaction || available !== true) return;
    if (active === "incident" && incidentQuote?.available !== true) { setError("This source is not currently eligible for a paid dossier."); return; }
    if (active === "recheck" && (!recheckPlan || recheckQuote?.available !== true)) { setError("Run the free condition check first. Payment opens only after a verified source revision."); return; }
    setBusy(true);
    setError("");
    setStatus("");
    setDelivery(null);
    setSavedPlan(false);
    try {
      let endpoint = "";
      let method: "GET" | "POST" = "GET";
      let body: unknown;
      if (active === "local") {
        setStatus("RESOLVING BROAD AREA · EXACT HOME LOCATION NOT REQUIRED…");
        const location = await resolveArea();
        endpoint = `/api/intel/local-delta?${new URLSearchParams({
          area: location.area,
          lat: String(location.lat),
          lng: String(location.lng),
          radiusKm: String(radiusKm),
        }).toString()}`;
      } else if (active === "premium") {
        setStatus("RESOLVING BROAD AREA · PREPARING PROVIDER DISCLOSURE…");
        const location = await resolveArea();
        endpoint = "/api/intel/premium-area";
        method = "POST";
        body = { area: location.area, lat: location.lat, lng: location.lng, radiusKm, focus };
      } else if (active === "external") {
        if (!externalQuote?.eligible || !externalQuote?.quoteToken) throw new Error("Review a fresh upstream procurement quote before payment.");
        endpoint = "/api/intel/external-intelligence";
        method = "POST";
        body = { area: area.trim(), focus, question: externalQuestion.trim(), quoteToken: externalQuote.quoteToken };
      } else if (active === "plan") {
        endpoint = "/api/intel/preparedness-plan";
        method = "POST";
        body = { area: area.trim(), focus, household, constraints };
      } else if (active === "recheck") {
        endpoint = "/api/intel/preparedness-recheck";
        method = "POST";
        body = recheckPayload(recheckPlan!);
      } else if (active === "incident") {
        endpoint = `/api/intel/incident-dossier?signalId=${encodeURIComponent(signalId.trim())}`;
      } else if (active === "wallet") {
        endpoint = `/api/intel/wallet-exposure?address=${encodeURIComponent(publicKey.toBase58())}`;
      } else {
        endpoint = "/api/intel/transaction-risk";
        method = "POST";
        body = { transaction: transaction.replace(/\s+/g, ""), wallet: publicKey.toBase58() };
      }
      const result = await purchaseX402Output({
        endpoint,
        method,
        body,
        publicKey,
        signTransaction: async (value) => await signTransaction(value) as VersionedTransaction,
        accessToken: session?.access_token,
        onStatus: setStatus,
      });
      setDelivery(result);
      if (active === "recheck" && recheckPlan && typeof result.data?.report?.generatedAt === "string") {
        setRecheckPlans(updatePreparednessPlanCheckpoint(localStorage, recheckPlan.id, result.data.report.generatedAt));
        window.dispatchEvent(new Event(PREPAREDNESS_PLANS_EVENT));
      }
      setStatus("OUTPUT DELIVERED · RECEIPT BOUND TO OPERATION");
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "Paid operation failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function prepareExternalQuote() {
    if (area.trim().length < 2) { setError("Enter a broad city or region."); return; }
    if (externalQuestion.trim().length < 8) { setError("Enter a specific survival-intelligence question."); return; }
    setQuoteBusy(true);
    setError("");
    setExternalQuote(null);
    try {
      const response = await fetch("/api/intel/external-intelligence/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: area.trim(), focus, question: externalQuestion.trim() }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Procurement quote unavailable.");
      setExternalQuote(data.quote || null);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Procurement quote unavailable.");
    } finally {
      setQuoteBusy(false);
    }
  }

  function storePlan() {
    const paid = delivery?.data?.plan;
    if (!paid || !Array.isArray(paid.phases)) return;
    const createdAt = typeof paid.createdAt === "string" ? paid.createdAt : new Date().toISOString();
    const id = `rq-x402-plan-${Date.now()}`;
    const sources = Array.isArray(paid.sources) ? paid.sources : [];
    const plan: PreparednessPlan = {
      id,
      title: String(paid.title || "72-hour RED QUEEN protocol").slice(0, 100),
      objective: "Execute the highest-impact actions across the next 72 hours, then reassess against official guidance.",
      area: String(paid.area || "").slice(0, 80),
      focus: String(paid.focus || "HOUSEHOLD").slice(0, 80),
      grounding: Array.isArray(paid.currentSignalContext) && paid.currentSignalContext.length ? "VERIFIED_LIVE" : "GENERAL_KNOWLEDGE",
      sourceLabel: sources[0]?.label,
      sourceUrl: sources[0]?.url,
      createdAt,
      updatedAt: createdAt,
      reviewAt: paid.reviewAt || new Date(Date.now() + 86_400_000).toISOString(),
      status: "ACTIVE",
      steps: paid.phases.flatMap((phase: any) => Array.isArray(phase.steps) ? phase.steps : []).slice(0, 8).map((text: string, index: number) => ({ id: `${id}-step-${index + 1}`, text: String(text).slice(0, 220), completed: false })),
    };
    savePreparednessPlan(localStorage, plan);
    window.dispatchEvent(new Event(PREPAREDNESS_PLANS_EVENT));
    setSavedPlan(true);
  }

  function prepareDeliveredProof() {
    if (!delivery) return;
    const proofType = active === "plan" || active === "recheck" ? "PREPAREDNESS_PROTOCOL" : active === "local" || active === "incident" || active === "premium" || active === "external" ? "THREAT_COMPARISON" : "QUEEN_ASSESSMENT";
    try {
      sessionStorage.setItem("rq-proof-draft-v1", JSON.stringify({
        title: reportTitle(active, output),
        type: proofType,
        content: JSON.stringify({ product: active, operationId: delivery.operationId, output }, null, 2),
      }));
    } catch {}
  }

  return (
    <section className="intelligence-market" id="queen-operations">
      <div className="onchain-section-head commerce-desk-head">
        <span>01 // PAID INTELLIGENCE</span>
        <h2>Choose the report you need.</h2>
        <p>Choose a report, review the price and approve payment. Queen returns the result with sources and a receipt.</p>
      </div>

      <div className="intelligence-market-status"><i className={available ? "is-live" : ""} /><strong>{available === null ? "CHECKING" : available ? "PAYMENTS AVAILABLE" : "PAYMENTS UNAVAILABLE"}</strong><span>{availabilityReason}</span><button type="button" disabled={busy} onClick={() => { setExternalQuote(null); setReadinessVersion((value) => value + 1); }}>REFRESH STATUS</button></div>
      <div className="intelligence-market-tabs" role="tablist" aria-label="RED QUEEN paid operations">
        {(Object.keys(PRODUCT_META) as ProductId[]).map((product) => (
          <button key={product} type="button" role="tab" aria-selected={active === product} disabled={busy} className={active === product ? "active" : ""} onClick={() => { setActive(product); setDelivery(null); setError(""); setStatus(""); }}>
            <span>{PRODUCT_META[product].index}</span><strong>{PRODUCT_META[product].name}</strong><small>{PRODUCT_META[product].price}</small><em className={`is-${productAvailability(product).state}`}>{productAvailability(product).label}</em>
          </button>
        ))}
      </div>

      <div className={`intelligence-market-grid${delivery ? " has-delivery" : " is-configuring"}`}>
        <div className="intelligence-market-form">
          <header><span>{meta.name}</span><strong>{meta.price}</strong></header>
          <p>{meta.promise}</p>
          <div className={`commerce-operation-state${selectedAvailability.state !== "ready" ? " requires-provider" : ""}`}><i /><strong>{operationStatus}</strong><span>{operationNeedsProvider ? "Review the data provider, shared information and cost before approving payment." : "One wallet approval · one result · one receipt."}</span></div>
          {active === "premium" && premiumQuote?.reason && <p role="status">{premiumQuote.reason}</p>}
          {active === "external" && (externalQuote || buyerReadiness)?.reason && <p role="status">{(externalQuote || buyerReadiness).reason}</p>}
          {active === "local" && <>
            <label><span>CITY OR REGION</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
            <label><span>SEARCH RADIUS · {radiusKm} KM</span><input type="range" min="25" max="1000" step="25" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} /></label>
            <small>The broad place is resolved through OpenStreetMap. Exact home address is neither requested nor stored. If no current source change matches, Queen will stop before payment.</small>
          </>}
          {active === "premium" && <>
            <label><span>CITY OR REGION</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
            <label><span>INTELLIGENCE FOCUS</span><select value={focus} onChange={(event) => setFocus(event.target.value as SurvivalFocus)}>{SURVIVAL_FOCUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label><span>SEARCH RADIUS · {radiusKm} KM</span><input type="range" min="25" max="1000" step="25" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} /></label>
            <div className={`premium-procurement-quote${premiumQuote?.eligible ? " is-ready" : ""}`}>
              <header><span>DATA SOURCES FOR THIS REPORT</span><strong>{premiumQuote ? premiumQuote.eligible ? "READY" : "NOT READY" : "CHECKING"}</strong></header>
              {(premiumQuote?.providers || []).map((provider: any) => <div key={provider.id}><span>{provider.name}</span><strong>{provider.configured ? provider.estimatedUnits : provider.required ? "REQUIRED" : "OPTIONAL"}</strong></div>)}
              <p>{premiumQuote?.dataBoundary || "Checking what RED QUEEN will disclose before payment…"}</p>
              <small>ACCESS CHECK ONLY. NO METERED DATA CALL OR PAYMENT YET.</small>
            </div>
          </>}
          {active === "external" && <>
            <label><span>CITY OR REGION</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
            <label><span>INTELLIGENCE FOCUS</span><select value={focus} onChange={(event) => setFocus(event.target.value as SurvivalFocus)}>{SURVIVAL_FOCUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label><span>WHAT EVIDENCE SHOULD QUEEN BUY?</span><textarea value={externalQuestion} onChange={(event) => setExternalQuestion(event.target.value)} maxLength={320} /></label>
            {!externalQuote && <button className="intelligence-market-pay" type="button" disabled={quoteBusy || selectedAvailability.state !== "ready"} onClick={() => void prepareExternalQuote()}>{quoteBusy ? "PREPARING DATA PURCHASE…" : "REVIEW DATA PURCHASE"}</button>}
            {externalQuote && <div className={`premium-procurement-quote${externalQuote.eligible ? " is-ready" : ""}`}>
              <header><span>QUEEN BUYER DISCLOSURE</span><strong>{externalQuote.eligible ? "READY" : "NOT CONFIGURED"}</strong></header>
              {(externalQuote.merchant?.resources || []).map((resource: any) => <div key={resource.endpoint}><span>{resource.name}</span><strong>{resource.price}</strong></div>)}
              <p><strong>DATA PROVIDER:</strong> {externalQuote.merchant?.name} · <strong>DATA COST LIMIT:</strong> {externalQuote.upstreamBudget}</p>
              <p><strong>BUYER:</strong> {externalQuote.readiness?.buyerAddress || "DEDICATED WALLET"} · <strong>DAILY CAP:</strong> {externalQuote.buyerPolicy?.dailyLimit || "POLICY CHECK"}</p>
              <p><strong>SHARED:</strong> {(externalQuote.dataShared || []).join(" · ")}</p>
              <p><strong>NEVER SHARED:</strong> {(externalQuote.dataNotShared || []).join(" · ")}</p>
              <small>NO DATA PURCHASE OR PAYMENT HAS OCCURRED.</small>
            </div>}
          </>}
          {active === "plan" && <>
            <label><span>AREA · OPTIONAL</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Barcelona, Spain" maxLength={80} /></label>
            <label><span>PROTOCOL FOCUS</span><select value={focus} onChange={(event) => setFocus(event.target.value as SurvivalFocus)}>{SURVIVAL_FOCUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label><span>WHO / WHAT MUST THE PLAN SUPPORT?</span><textarea value={household} onChange={(event) => setHousehold(event.target.value)} placeholder="Two adults, one child, a dog, prescription refrigeration…" maxLength={320} /></label>
            <label><span>REAL CONSTRAINTS</span><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Apartment, no car, limited storage, 50 EUR budget…" maxLength={320} /></label>
          </>}
          {active === "recheck" && <>
            <label><span>ACTIVE PLAN ON THIS DEVICE</span><select value={recheckPlanId} onChange={(event) => setRecheckPlanId(event.target.value)}>
              {!recheckPlans.length && <option value="">No active saved plans</option>}
              {recheckPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.area || "broad context"}</option>)}
            </select></label>
            {recheckPlan ? <div className={quoteStyles.quote} aria-live="polite">
              <div><span>FREE CONDITION CHECK</span><strong>{recheckBusy ? "CHECKING" : recheckQuote?.available ? `${recheckQuote.changeCount || 0} CHANGED` : recheckQuote ? "NO PAYMENT NEEDED" : "NOT RUN"}</strong></div>
              <h3>{recheckPlan.title}</h3>
              <p>{recheckQuote?.headline || "Queen will compare this plan checkpoint with current, reachable source records before showing a payment request."}</p>
              {recheckQuote?.reason && <p>{recheckQuote.reason}</p>}
              <small>{recheckQuote?.privacy || "The check sends the plan title, broad area, focus, dates and completion counts. Exact address, account and wallet are not included."}</small>
            </div> : <p>Save an active plan from Ask Red Queen or the 72-hour plan output first.</p>}
            <button className="intelligence-market-pay" type="button" disabled={!recheckPlan || recheckBusy} onClick={() => void prepareRecheckQuote()}>{recheckBusy ? "CHECKING CURRENT SOURCES…" : "CHECK CONDITIONS FREE"}</button>
            <Link href="/prepare">OPEN MY SAVED PLANS →</Link>
          </>}
          {active === "incident" && <>
            <label><span>VERIFIED SIGNAL ID</span><input value={signalId} onChange={(event) => setSignalId(event.target.value)} placeholder="Open a live Map signal first" maxLength={240} /></label>
            <small>Only current source records from USGS, NASA EONET, GDACS, NOAA, CISA, WHO or official Solana Status can be purchased.</small>
            <div className={quoteStyles.quote} aria-live="polite">
              <div><span>FREE SOURCE CHECK</span><strong>{incidentQuoteBusy ? "CHECKING" : incidentQuote?.available ? "AVAILABLE" : "NO PAYMENT READY"}</strong></div>
              {incidentQuote?.signal ? <><h3>{incidentQuote.signal.name}</h3><p>Source observed {incidentQuote.signal.observedAt}. Updated {incidentQuote.signal.updatedAt}.</p><a href={incidentQuote.signal.sourceUrl} target="_blank" rel="noopener noreferrer">READ THE FREE PRIMARY SOURCE ↗</a></> : <p>{incidentQuote?.reason || "Choose a verified signal to preview the paid result and its source."}</p>}
              {incidentQuote?.available && <><p>For {incidentQuote.price}, Queen packages:</p><ul>{incidentQuote.includes.map((item) => <li key={item}>{item}</li>)}</ul><small>One optional wallet approval. No charge for this preview. Check the source before buying.</small></>}
            </div>
            <Link href="/pulse#live-map">SELECT A VERIFIED MAP SIGNAL →</Link>
          </>}
          {active === "transaction" && <>
            <label><span>BASE64 SERIALIZED VERSIONED TRANSACTION</span><textarea className="is-code" value={transaction} onChange={(event) => setTransaction(event.target.value)} placeholder="Paste the unsigned transaction returned by the originating app…" maxLength={240000} /></label>
            <small>RED QUEEN simulates this payload with signature verification disabled. She does not sign or submit it.</small>
          </>}
          {active === "wallet" && <>
            <div className="intelligence-market-wallet"><span>CONNECTED PUBLIC ADDRESS</span><strong>{publicKey ? `${publicKey.toBase58().slice(0, 9)}…${publicKey.toBase58().slice(-9)}` : "CONNECT WALLET"}</strong><p>The paid audit expands the public SPL and Token-2022 authority scan. It never asks for a signature from the audited wallet.</p></div>
          </>}

          {active === "recheck" && recheckQuote?.available !== true ? null : !connected ? <WalletMultiButton /> : active === "external" && !externalQuote ? null : <button className="intelligence-market-pay" type="button" disabled={!canPurchase || (active === "premium" && premiumQuote?.eligible !== true) || (active === "external" && externalQuote?.eligible !== true) || (active === "incident" && incidentQuote?.available !== true) || (active === "recheck" && recheckQuote?.available !== true)} onClick={() => void purchase()}>{busy ? status || "PROCESSING…" : active === "premium" && premiumQuote?.eligible !== true ? "PREMIUM PROVIDER NOT READY" : active === "external" && externalQuote?.eligible !== true ? "BUYER WALLET NOT READY" : active === "incident" && incidentQuote?.available !== true ? "VERIFY CURRENT SIGNAL FIRST" : active === "recheck" && recheckQuote?.available !== true ? "NO VERIFIED CHANGE" : available ? `REVIEW & PAY ${meta.price}` : "PAYMENT UNAVAILABLE"}</button>}
          {status && <div className="intelligence-market-progress">{status}</div>}
          {error && <div className="intelligence-market-error"><strong>Report not delivered</strong><p>{error}</p></div>}
        </div>

        {delivery && <div className="intelligence-market-output has-output">
          <>
            <header><span>PAID OUTPUT DELIVERED</span><strong>{delivery.receiptStored ? "RECEIPT STORED" : "CHECK RECEIPT"}</strong></header>
            <h3>{reportTitle(active, output)}</h3>
            <p>{reportSummary(active, output)}</p>
            <div className="intelligence-market-output-meta"><span>{sourceCount} {active === "transaction" ? "INSTRUCTIONS" : active === "premium" ? "PURCHASED RECORDS" : active === "external" ? "PURCHASED SOURCES" : "SOURCE RECORDS"}</span><span>{delivery.operationId}</span></div>
            <PaidReportContent product={active} data={output} />
            <div className="intelligence-market-output-actions">
              <button type="button" onClick={() => download(output, `${filenameFor(active)}.json`, "application/json")}>DOWNLOAD JSON</button>
              <button type="button" onClick={() => download(reportText(active, delivery), `${filenameFor(active)}.txt`, "text/plain")}>EXPORT REPORT</button>
              {active === "plan" && <button type="button" onClick={storePlan} disabled={savedPlan}>{savedPlan ? "SAVED TO PREPARE" : "SAVE AS ACTIVE PLAN"}</button>}
              <Link href="/proofs" onClick={prepareDeliveredProof}>CREATE PROOF</Link>
              {delivery.transactionSignature && <a href={`https://explorer.solana.com/tx/${delivery.transactionSignature}`} target="_blank" rel="noreferrer">SETTLEMENT ↗</a>}
            </div>
          </>
        </div>}
      </div>
    </section>
  );
}
