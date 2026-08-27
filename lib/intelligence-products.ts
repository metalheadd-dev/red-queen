export type IntelligenceProductStatus = "BETA" | "NEXT" | "RESEARCH";

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
  },
  {
    id: "agent-budget",
    status: "RESEARCH",
    name: "RED QUEEN agent budget",
    price: "USER-CAPPED",
    scheme: "SVM UPTO",
    value: "Authorize a strict maximum so the agent can pay for several data or model calls and settle only measured usage.",
    output: "Budget receipt + per-operation ledger",
  },
];
