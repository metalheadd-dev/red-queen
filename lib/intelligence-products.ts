export type IntelligenceProductStatus = "BETA" | "NEXT" | "RESEARCH";
export type IntelligenceDeliveryMode = "PREPARED_BEFORE_PAYMENT" | "UPSTREAM_AFTER_PAYMENT" | "RESEARCH_ONLY";

export interface IntelligenceProduct {
  id: string;
  status: IntelligenceProductStatus;
  name: string;
  price: string;
  scheme: string;
  value: string;
  output: string;
  endpoint?: string;
  method?: "GET" | "POST";
  deliveryMode: IntelligenceDeliveryMode;
  freePreflight?: string;
}

export const X402_INTELLIGENCE_PRODUCTS: IntelligenceProduct[] = [
  {
    id: "global-source-synthesis",
    status: "BETA",
    name: "Global source synthesis",
    price: "0.01 USDC",
    scheme: "SVM EXACT",
    value: "One paid synthesis across the seven-source verified signal grid with explicit coverage, confidence, freshness and source status.",
    output: "Ranked machine-readable dossier + source links",
    endpoint: "/api/intel/premium",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "solana-network-health",
    status: "BETA",
    name: "Solana network health",
    price: "0.02 USDC",
    scheme: "SVM EXACT",
    value: "Current validator, epoch, performance and priority-fee telemetry from Solana RPC.",
    output: "Network diagnostic snapshot",
    endpoint: "/api/intel/depin",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "local-delta-brief",
    status: "BETA",
    name: "Local threat delta brief",
    price: "0.01 USDC",
    scheme: "SVM EXACT",
    value: "Find source-backed changes around a broad area inside the current 24-hour observation window and explain only meaningful matches.",
    output: "Personal Pulse delta + one justified action",
    endpoint: "/api/intel/local-delta?area={area}&lat={lat}&lng={lng}&radiusKm={radius}",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "premium-area-intelligence",
    status: "BETA",
    name: "Premium area intelligence",
    price: "0.05 USDC",
    scheme: "SVM EXACT",
    value: "Purchase provider-metered geospatial and optional weather evidence for one broad area, then let RED QUEEN compare it and explain what deserves action.",
    output: "Sourced area report + upstream procurement receipt",
    endpoint: "/api/intel/premium-area",
    method: "POST",
    deliveryMode: "UPSTREAM_AFTER_PAYMENT",
  },
  {
    id: "external-survival-intelligence",
    status: "BETA",
    name: "External survival intelligence",
    price: "0.08 USDC",
    scheme: "SVM EXACT",
    value: "Authorize RED QUEEN to buy two disclosed x402 resources from an allowlisted merchant, verify the purchased evidence and synthesize one bounded survival-intelligence decision.",
    output: "Queen assessment + sources + upstream x402 receipts",
    endpoint: "/api/intel/external-intelligence",
    method: "POST",
    deliveryMode: "UPSTREAM_AFTER_PAYMENT",
    freePreflight: "/api/intel/external-intelligence/quote",
  },
  {
    id: "preparedness-compiler",
    status: "BETA",
    name: "Preparedness plan compiler",
    price: "0.02 USDC",
    scheme: "SVM EXACT",
    value: "Turn household constraints and a selected hazard into a cited, exportable preparedness plan.",
    output: "Structured plan + checklist + maintenance date",
    endpoint: "/api/intel/preparedness-plan",
    method: "POST",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "preparedness-recheck",
    status: "BETA",
    name: "Preparedness plan recheck",
    price: "0.01 USDC",
    scheme: "SVM EXACT",
    value: "Compare one device-supplied plan checkpoint with current source revisions and charge only when a verified change may affect the plan.",
    output: "Changed conditions + open-step review + next action",
    endpoint: "/api/intel/preparedness-recheck",
    method: "POST",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
    freePreflight: "/api/intel/preparedness-recheck/quote",
  },
  {
    id: "incident-dossier",
    status: "BETA",
    name: "Incident dossier",
    price: "0.02 USDC",
    scheme: "SVM EXACT",
    value: "Open one current verified signal as a timestamped dossier with explicit facts, assessment, uncertainty and action protocol.",
    output: "Source-backed dossier + portable export",
    endpoint: "/api/intel/incident-dossier?signalId={verified-signal}",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
    freePreflight: "/api/intel/incident-dossier/quote?signalId={verified-signal}",
  },
  {
    id: "transaction-risk-explanation",
    status: "BETA",
    name: "Transaction risk explanation",
    price: "0.01 USDC",
    scheme: "SVM EXACT",
    value: "Decode and simulate a serialized Solana transaction before signing, then expose signer, writable-account, authority and program risks.",
    output: "Pre-sign simulation + bounded Queen explanation",
    endpoint: "/api/intel/transaction-risk",
    method: "POST",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "wallet-exposure-audit",
    status: "BETA",
    name: "Solana wallet exposure audit",
    price: "0.02 USDC",
    scheme: "SVM EXACT",
    value: "Inspect SPL and Token-2022 accounts for active delegates, frozen state, empty accounts and external close authorities without requesting secrets.",
    output: "Evidence-bounded authority audit + exact next action",
    endpoint: "/api/intel/wallet-exposure?address={wallet}",
    deliveryMode: "PREPARED_BEFORE_PAYMENT",
  },
  {
    id: "agent-budget",
    status: "RESEARCH",
    name: "RED QUEEN agent budget",
    price: "USER-CAPPED",
    scheme: "SVM UPTO",
    value: "Authorize a strict maximum so the agent can pay for several data or model calls and settle only measured usage.",
    output: "Budget receipt + per-operation ledger",
    deliveryMode: "RESEARCH_ONLY",
  },
];
