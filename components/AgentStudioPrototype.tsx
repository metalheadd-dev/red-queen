"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  buildAgentBlueprint,
  getAgentCapacity,
  parseAgentBlueprints,
  RQ_AGENT_DRAFTS_KEY,
  RQ_AGENT_MODULES,
  type RqAgentArchetype,
  type RqAgentBlueprint,
  type RqAgentMemory,
  type RqAgentModule,
} from "@/lib/agent-blueprint";
import { RQ_PROOF_DRAFT_KEY } from "@/lib/intelligence-proof";
import styles from "@/app/agents/page.module.css";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

type WalletSnapshot = {
  threat: { balance: number; clearance: { tier: number; level: number; name: string } };
};

const ARCHETYPES: Array<{ id: RqAgentArchetype; title: string; body: string }> = [
  { id: "SENTINEL", title: "Sentinel", body: "Watches selected signals and prepares bounded escalations." },
  { id: "ANALYST", title: "Analyst", body: "Compares evidence, provenance, confidence and source changes." },
  { id: "QUARTERMASTER", title: "Quartermaster", body: "Tracks preparation gaps and avoids duplicate purchases." },
  { id: "SCENARIO_CONTROLLER", title: "Scenario Controller", body: "Runs fictional crisis branches under Queen oversight." },
];

const MODULE_LABELS: Record<RqAgentModule, string> = {
  THREAT_GRAPH: "Threat Graph",
  SIGNAL_WATCH: "Signal Watch",
  PREPAREDNESS: "Preparedness",
  WALLET_SAFETY: "Wallet Safety",
  COMMERCE_SCOUT: "Commerce Scout",
  SCENARIO_ENGINE: "Scenario Engine",
};

function downloadBlueprint(blueprint: RqAgentBlueprint) {
  const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${blueprint.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "rq-agent"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AgentStudioPrototype() {
  const { publicKey } = useWallet();
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [walletStatus, setWalletStatus] = useState("FREE LOCAL PROTOTYPE");
  const [name, setName] = useState("ROOK Sentinel");
  const [archetype, setArchetype] = useState<RqAgentArchetype>("SENTINEL");
  const [directive, setDirective] = useState("Monitor selected threat categories, compare source revisions and escalate only material changes to Red Queen.");
  const [area, setArea] = useState("");
  const [modules, setModules] = useState<RqAgentModule[]>(["THREAT_GRAPH", "SIGNAL_WATCH"]);
  const [memory, setMemory] = useState<RqAgentMemory>("DEVICE_ONLY");
  const [dailyCap, setDailyCap] = useState(0);
  const [drafts, setDrafts] = useState<RqAgentBlueprint[]>([]);
  const [active, setActive] = useState<RqAgentBlueprint | null>(null);
  const [status, setStatus] = useState("DESIGN A BOUNDED AGENT BLUEPRINT");
  const address = publicKey?.toBase58() || "";
  const tier = snapshot?.threat.clearance.tier || 0;
  const capacity = getAgentCapacity(tier);

  useEffect(() => { setDrafts(parseAgentBlueprints(localStorage.getItem(RQ_AGENT_DRAFTS_KEY))); }, []);
  useEffect(() => {
    setSnapshot(null);
    if (!address) {
      setWalletStatus("FREE LOCAL PROTOTYPE");
      return;
    }
    let activeRequest = true;
    setWalletStatus("READING $THREAT CLEARANCE…");
    fetch(`/api/onchain/wallet?address=${encodeURIComponent(address)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Clearance read failed.");
        if (!activeRequest) return;
        setSnapshot(data);
        setWalletStatus(`${data.threat.balance.toLocaleString()} $THREAT · ${data.threat.clearance.name}`);
      })
      .catch((error) => { if (activeRequest) setWalletStatus(error instanceof Error ? error.message : "Clearance read failed."); });
    return () => { activeRequest = false; };
  }, [address]);

  const capacityLabel = useMemo(() => `${capacity.slots} AGENT SLOT${capacity.slots === 1 ? "" : "S"} · ${capacity.modules} MODULES`, [capacity]);

  function toggleModule(module: RqAgentModule) {
    setModules((current) => current.includes(module)
      ? current.filter((item) => item !== module)
      : current.length < capacity.modules ? [...current, module] : current);
  }

  function compileBlueprint() {
    try {
      const blueprint = buildAgentBlueprint({ name, archetype, directive, broadArea: area, modules, memory, dailyCapUsdc: dailyCap, holderTierObserved: tier });
      setActive(blueprint);
      setStatus("BLUEPRINT COMPILED · NOTHING DEPLOYED · NO FUNDS AUTHORIZED");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Blueprint could not be compiled.");
    }
  }

  function saveBlueprint() {
    if (!active) return;
    const exists = drafts.some((item) => item.id === active.id);
    if (!exists && drafts.length >= capacity.slots) {
      setStatus(`${capacityLabel} AVAILABLE AT CURRENT CLEARANCE · REMOVE A DRAFT OR VERIFY A HIGHER TIER`);
      return;
    }
    const next = [active, ...drafts.filter((item) => item.id !== active.id)].slice(0, capacity.slots);
    localStorage.setItem(RQ_AGENT_DRAFTS_KEY, JSON.stringify(next));
    setDrafts(next);
    setStatus("LOCAL BLUEPRINT SAVED · NOT REGISTERED OR RUNNING");
  }

  function sendToProof(blueprint: RqAgentBlueprint) {
    sessionStorage.setItem(RQ_PROOF_DRAFT_KEY, JSON.stringify({ title: `${blueprint.name} blueprint`, type: "AGENT_BLUEPRINT", content: JSON.stringify(blueprint, null, 2) }));
  }

  return (
    <div className={styles.studio}>
      <section className={styles.clearance}>
        <div><span>OBSERVED HOLDER CAPACITY</span><strong>{walletStatus}</strong><small>{capacityLabel}</small></div>
        <WalletMultiButton />
        <p>A free local draft is always available. `$THREAT` expands orchestration capacity, not the truth of an agent&apos;s output and never emergency access.</p>
      </section>

      <section className={styles.builder}>
        <div className={styles.sectionHead}><span>01 // IDENTITY</span><strong>Define one narrow job.</strong></div>
        <label>AGENT NAME<input value={name} maxLength={42} onChange={(event) => setName(event.target.value)} /></label>
        <div className={styles.archetypes}>{ARCHETYPES.map((item) => <button type="button" key={item.id} className={archetype === item.id ? styles.active : ""} onClick={() => setArchetype(item.id)}><strong>{item.title}</strong><span>{item.body}</span></button>)}</div>
        <label>PRIMARY DIRECTIVE<textarea value={directive} maxLength={360} onChange={(event) => setDirective(event.target.value)} /></label>
        <label>BROAD AREA, OPTIONAL<input value={area} maxLength={80} onChange={(event) => setArea(event.target.value)} placeholder="Madrid, Spain" /></label>
      </section>

      <section className={styles.modules}>
        <div className={styles.sectionHead}><span>02 // MODULES</span><strong>{modules.length}/{capacity.modules} active.</strong></div>
        <div className={styles.moduleGrid}>{RQ_AGENT_MODULES.map((module) => <button type="button" key={module} className={modules.includes(module) ? styles.active : ""} onClick={() => toggleModule(module)}><span>{modules.includes(module) ? "ONLINE" : "OFF"}</span><strong>{MODULE_LABELS[module]}</strong></button>)}</div>
        <label>MEMORY<select value={memory} onChange={(event) => setMemory(event.target.value as RqAgentMemory)}><option value="NONE">No memory</option><option value="DEVICE_ONLY">Device only</option><option value="PRIVATE_ACCOUNT">Private account</option></select></label>
        <label>DAILY x402 POLICY CAP<select value={dailyCap} disabled={!capacity.canDraftBudget} onChange={(event) => setDailyCap(Number(event.target.value))}><option value={0}>OFF</option><option value={0.05}>0.05 USDC</option><option value={0.25}>0.25 USDC</option><option value={1}>1.00 USDC</option></select><small>{capacity.canDraftBudget ? "Policy draft only. Every operation still requires separate approval." : "Available from Analyst clearance. No payment permission is granted here."}</small></label>
        <button className={styles.compile} type="button" onClick={compileBlueprint}>COMPILE LOCAL BLUEPRINT</button>
        <p className={styles.status}>{status}</p>
      </section>

      <section className={styles.manifest}>
        <div className={styles.sectionHead}><span>03 // MANIFEST</span><strong>{active ? active.name : "Awaiting compilation"}</strong></div>
        {active ? <><pre>{JSON.stringify(active, null, 2)}</pre><div className={styles.actions}><button type="button" onClick={saveBlueprint}>SAVE LOCALLY</button><button type="button" onClick={() => downloadBlueprint(active)}>EXPORT JSON</button><Link href="/proofs" onClick={() => sendToProof(active)}>ANCHOR BLUEPRINT HASH</Link></div></> : <div className={styles.empty}>Choose the agent&apos;s role, permissions and boundaries. The first version creates a portable blueprint, not a deployed autonomous process.</div>}
      </section>

      <section className={styles.drafts}>
        <div className={styles.sectionHead}><span>LOCAL ROSTER</span><strong>{drafts.length}/{capacity.slots} slots used</strong></div>
        {drafts.length ? drafts.map((draft) => <article key={draft.id}><div><span>{draft.archetype}</span><strong>{draft.name}</strong><small>{draft.modules.length} MODULES · QUEEN OVERSIGHT REQUIRED</small></div><button type="button" onClick={() => setActive(draft)}>OPEN</button><Link href="/proofs" onClick={() => sendToProof(draft)}>PROVE HASH ↗</Link></article>) : <p>No local agent blueprints saved.</p>}
      </section>
    </div>
  );
}
