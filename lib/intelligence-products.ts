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
    status: "NEXT",
    name: "Local threat delta brief",
    price: "TARGET 0.01 USDC",
    scheme: "SVM EXACT",
    value: "Compare verified signals around a broad area against the previous scan and explain only meaningful changes.",
    output: "Personal Pulse delta + one justified action",
  },
  {
    id: "preparedness-compiler",
    status: "NEXT",
    name: "Preparedness plan compiler",
    price: "TARGET 0.02 USDC",
    scheme: "SVM EXACT",
    value: "Turn household constraints and a selected hazard into a cited, exportable preparedness plan.",
    output: "Structured plan + checklist + maintenance date",
  },
  {
    id: "wallet-exposure-audit",
    status: "NEXT",
    name: "Solana wallet exposure audit",
    price: "TARGET 0.02 USDC",
    scheme: "SVM EXACT",
    value: "Go beyond the free RPC triage with transaction-pattern and token-account analysis without requesting secrets.",
    output: "Evidence-bounded wallet safety report",
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
