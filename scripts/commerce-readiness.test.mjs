import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    exports: module.exports, module, Buffer, URL, AbortSignal, Request, Response, crypto: globalThis.crypto,
    process: { env: {} }, console,
    require: (name) => name === "server-only" ? {} : Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    ...globals,
  }, { filename: file });
  return module.exports;
}

test("paid cards show availability, never a fixed UPSTREAM label", () => {
  const { commerceAvailability: status } = load("lib/commerce-readiness.ts");
  assert.equal(status(null, false).state, "checking");
  assert.equal(status(true, true).label, "CHECKING");
  assert.equal(status(true, true, true).label, "READY");
  assert.equal(status(true, true, false).state, "blocked");
  assert.equal(status(false, true, true).label, "PAYMENTS UNAVAILABLE");
});

for (const [name, httpStatus, remaining, expected] of [
  ["valid provider with credits", 200, 200, true],
  ["rejected key", 401, 200, false],
  ["exhausted quota", 200, 2, false],
  ["missing balance", 200, undefined, false],
]) {
  test(`Off-Nadir preflight: ${name}`, async () => {
    let calls = 0;
    const premium = load("lib/premium-survival-intelligence.ts", { "@/lib/survival-context": {} }, {
      process: { env: { OFF_NADIR_API_KEY: "test-key", OPENWEATHER_API_KEY: "test-weather" } },
      fetch: async (url) => {
        calls++;
        assert.equal(url, "https://offnadir-delta.com/api/v1/usage");
        return Response.json({ tokens: { remaining } }, { status: httpStatus });
      },
    });
    const quote = await premium.checkedPremiumProviderQuote();
    assert.equal(quote.eligible, expected);
    assert.equal(calls, 1);
    assert.equal(JSON.stringify(quote).includes("test-key"), false);
  });
}

for (const [name, amount, state, genesis, expected] of [
  ["funded", "30000", "initialized", "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", true],
  ["unfunded", "0", "initialized", "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", false],
  ["frozen", "1000000", "frozen", "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", false],
  ["wrong network", "1000000", "initialized", "devnet", false],
]) {
  test(`buyer funding: ${name}`, async () => {
    const owner = "GVf6gQpmAcc45aGxmFKu1mdVmyYcVKB7AckLAK1WVtFb";
    const buyer = load("lib/buyer-funding.ts", { "@/lib/solana": { getSolanaRpcUrls: () => ["https://rpc.invalid"] } }, {
      fetch: async (_url, options) => {
        const { method } = JSON.parse(options.body);
        assert.ok(["getGenesisHash", "getAccountInfo"].includes(method));
        return Response.json({ result: method === "getGenesisHash" ? genesis : { value: {
          owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          data: { parsed: { info: { owner, mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", state, tokenAmount: { amount } } } },
        } } });
      },
    });
    assert.equal((await buyer.checkBuyerFunding(owner)).ready, expected);
  });
}

test("stored paid delivery bypasses expired quote and depleted provider checks", async () => {
  const { createHash } = require("node:crypto");
  const fingerprint = (value) => createHash("sha256").update(value).digest("hex");
  const productId = "external-survival-intelligence";
  const proof = "previously-verified-proof";
  const request = new Request("https://redqueen.space/api/intel/external-intelligence", {
    method: "POST", headers: { "x-operation-id": "afcb673e-479b-4d67-ae17-3b918d799d35", "payment-signature": proof }, body: "{}",
  });
  const stored = {
    product_id: productId,
    request_fingerprint: fingerprint(`POST\n/api/intel/external-intelligence\n{}\n${productId}`),
    payment_fingerprint: fingerprint(proof), response_body: { success: true }, settlement: { success: true },
  };
  let preflights = 0;
  const runtime = load("lib/x402.ts", {
    "@payai/facilitator": { facilitator: {} }, "@x402/core/server": {}, "@x402/svm/exact/server": {}, "@x402/next": {},
    "next/server": { NextResponse: Response }, "@/lib/solana": { isValidSolanaPublicKey: () => true },
    "@/lib/x402-discovery": { discoveryExtensionsFor: () => ({}) },
    "@/lib/x402-operations": { fingerprint, checkX402OperationStore: async () => ({ available: true }), findX402Operation: async () => stored },
  });
  const handler = runtime.withFriendlyX402(() => { throw new Error("must not charge again"); }, {
    productId, accepts: { payTo: "approved" }, preflight: () => { preflights++; return Response.json({}, { status: 503 }); },
  });
  const response = await handler(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Idempotent-Replay"), "true");
  assert.equal(preflights, 0);
});

test("x402 prepares deterministic output before entering the payment middleware", async () => {
  const { createHash } = require("node:crypto");
  const fingerprint = (value) => createHash("sha256").update(value).digest("hex");
  let paymentMiddlewareCalls = 0;
  let deliveredPrepared;
  const runtime = load("lib/x402.ts", {
    "@payai/facilitator": { facilitator: {} },
    "@x402/core/server": { HTTPFacilitatorClient: class {}, x402ResourceServer: class {} },
    "@x402/svm/exact/server": { registerExactSvmScheme: () => {} },
    "@x402/next": { withX402: (handler) => {
      paymentMiddlewareCalls++;
      return handler;
    } },
    "next/server": { NextResponse: Response },
    "@/lib/solana": { isValidSolanaPublicKey: () => true },
    "@/lib/x402-discovery": { discoveryExtensionsFor: () => ({}) },
    "@/lib/x402-operations": {
      fingerprint,
      checkX402OperationStore: async () => ({ available: true }),
      findX402Operation: async () => null,
    },
  });
  const route = runtime.withFriendlyX402(async (_request, prepared) => {
    deliveredPrepared = prepared;
    return Response.json({ delivered: prepared });
  }, {
    productId: "incident-dossier",
    accepts: { payTo: "approved", scheme: "exact", network: "solana:mainnet", price: "$0.02" },
    preflight: async () => ({ prepared: { sourceRevision: "v2" } }),
  });
  const response = await route(new Request("https://redqueen.space/api/intel/incident-dossier"));
  assert.equal(response.status, 200);
  assert.equal(paymentMiddlewareCalls, 1);
  assert.equal(deliveredPrepared.sourceRevision, "v2");
  assert.equal((await response.json()).delivered.sourceRevision, "v2");

  const rejectedRoute = runtime.withFriendlyX402(() => { throw new Error("must not deliver"); }, {
    productId: "incident-dossier",
    accepts: { payTo: "approved", scheme: "exact", network: "solana:mainnet", price: "$0.02" },
    preflight: async () => Response.json({ error: "Source stale" }, { status: 503 }),
  });
  const rejected = await rejectedRoute(new Request("https://redqueen.space/api/intel/incident-dossier"));
  assert.equal(rejected.status, 503);
  assert.equal(paymentMiddlewareCalls, 1);
});

test("x402 catalog discloses delivery risk and MCP publishes plan recheck tools", () => {
  const { X402_INTELLIGENCE_PRODUCTS } = load("lib/intelligence-products.ts");
  const live = X402_INTELLIGENCE_PRODUCTS.filter((product) => product.endpoint && product.status !== "RESEARCH");
  assert.ok(live.length >= 10);
  assert.ok(live.every((product) => ["PREPARED_BEFORE_PAYMENT", "UPSTREAM_AFTER_PAYMENT"].includes(product.deliveryMode)));
  assert.deepEqual(
    Array.from(live.filter((product) => product.deliveryMode === "UPSTREAM_AFTER_PAYMENT"), (product) => product.id),
    ["premium-area-intelligence", "external-survival-intelligence"],
  );
  const recheck = live.find((product) => product.id === "preparedness-recheck");
  assert.equal(recheck.freePreflight, "/api/intel/preparedness-recheck/quote");

  const { RED_QUEEN_MCP_TOOLS } = load("lib/mcp-discovery.ts");
  assert.ok(RED_QUEEN_MCP_TOOLS.includes("quote_preparedness_plan_recheck"));
  assert.ok(RED_QUEEN_MCP_TOOLS.includes("recheck_preparedness_plan"));
  const publicCard = JSON.parse(fs.readFileSync("public/.well-known/mcp/server-card.json", "utf8"));
  assert.deepEqual(Array.from(publicCard.capabilities.tools), Array.from(RED_QUEEN_MCP_TOOLS));
  assert.match(publicCard.description, /RQ Corp/);
});

test("RQ Proof Protocol stores only a bounded hash memo and parses it exactly", () => {
  const proof = load("lib/intelligence-proof.ts");
  const hash = "a".repeat(64);
  const memo = proof.buildIntelligenceProofMemo({ hash, type: "QUEEN_ASSESSMENT", anchoredAt: "2026-09-27T12:00:00.000Z" });
  assert.equal(memo, `RQ_PROOF_V1|sha256:${hash}|type:QUEEN_ASSESSMENT|at:2026-09-27T12:00:00.000Z`);
  assert.deepEqual({ ...proof.parseIntelligenceProofMemo(memo) }, { hash, type: "QUEEN_ASSESSMENT", anchoredAt: "2026-09-27T12:00:00.000Z" });
  assert.equal(memo.includes("Madrid"), false);
  assert.equal(proof.parseIntelligenceProofMemo(`${memo}|private:data`), null);
});

test("Agent Studio enforces holder capacity without granting payment authority", () => {
  const agents = load("lib/agent-blueprint.ts");
  assert.equal(agents.getAgentCapacity(0).modules, 2);
  assert.equal(agents.getAgentCapacity(4).slots, 8);
  const civilian = agents.buildAgentBlueprint({
    name: "ROOK Sentinel", archetype: "SENTINEL", directive: "Watch source revisions and escalate material changes.", broadArea: "Madrid",
    modules: ["THREAT_GRAPH", "SIGNAL_WATCH", "PREPAREDNESS"], memory: "DEVICE_ONLY", dailyCapUsdc: 1, holderTierObserved: 0,
  });
  assert.equal(civilian.modules.length, 2);
  assert.equal(civilian.paymentPolicy.enabled, false);
  assert.equal(civilian.paymentPolicy.approval, "EVERY_OPERATION");
  assert.equal(civilian.irreversibleActions, "DENIED");
});

test("paid local intelligence excludes stale records even when their place matches", () => {
  const { buildThreatGraph } = load("lib/threat-graph.ts");
  const { buildLocalDelta, buildPreparednessPlan } = load("lib/intelligence-reports.ts", {
    "@/lib/survival-context": {},
    "@/lib/threat-graph": { buildThreatGraph },
  });
  const base = {
    kind: "GEOLOGICAL", region: "Barcelona", location: "Barcelona", lat: 41.4, lng: 2.17,
    name: "Quake", source: "USGS", sourceUrl: "https://earthquake.usgs.gov/earthquakes/", fact: "Magnitude 3.0",
    action: "Review local guidance", assessment: "Check relevance", confidence: 98, severity: 45, priorityScore: 70,
    freshness: "CURRENT", ageHours: 2,
  };
  const grid = {
    generatedAt: "2026-09-27T11:00:00Z",
    signals: [
      { ...base, id: "old", observedAt: "2026-09-24T09:00:00Z", updatedAt: "2026-09-24T09:00:00Z" },
      { ...base, id: "current", observedAt: "2026-09-27T09:00:00Z", updatedAt: "2026-09-27T10:00:00Z" },
    ],
  };
  const delta = buildLocalDelta(grid, { area: "Barcelona", radiusKm: 250 });
  assert.deepEqual(Array.from(delta.changes, (item) => item.id), ["current"]);
  const plan = buildPreparednessPlan({ area: "Barcelona", focus: "LOCAL_THREATS", household: "Two adults", constraints: "", grid });
  assert.deepEqual(Array.from(plan.currentSignalContext, (item) => item.id), ["current"]);
});

test("plan recheck charges only when a current matching source changed after the checkpoint", () => {
  const { buildThreatGraph } = load("lib/threat-graph.ts");
  const { buildPreparednessRecheck } = load("lib/intelligence-reports.ts", {
    "@/lib/survival-context": {},
    "@/lib/threat-graph": { buildThreatGraph },
  });
  const signal = {
    id: "gdacs-current", kind: "DISASTER", region: "Madrid", location: "Madrid", name: "Infrastructure disruption",
    observedAt: "2026-09-27T08:00:00Z", updatedAt: "2026-09-27T10:30:00Z", source: "GDACS", sourceUrl: "https://www.gdacs.org/",
    fact: "Official record updated", assessment: "Check local continuity", action: "Review the plan", confidence: 96,
    severity: 60, priorityScore: 80, freshness: "CURRENT", ageHours: 3,
  };
  const input = {
    title: "Blackout plan", area: "Madrid", focus: "BLACKOUT", updatedAt: "2026-09-27T09:00:00Z",
    reviewAt: "2026-09-28T09:00:00Z", completedSteps: 2, totalSteps: 6, remainingSteps: ["Check lighting"],
  };
  const changed = buildPreparednessRecheck({ generatedAt: "2026-09-27T11:00:00Z", signals: [signal] }, input);
  assert.equal(changed.changes.length, 1);
  assert.equal(changed.plan.progressPercent, 33);
  const unchanged = buildPreparednessRecheck({ generatedAt: "2026-09-27T11:00:00Z", signals: [signal] }, { ...input, updatedAt: "2026-09-27T10:45:00Z" });
  assert.equal(unchanged.changes.length, 0);
});

test("mosquito and fictional disaster kits have different practical supplies", () => {
  const { buildSurvivalKit } = load("lib/survival-market.ts", { "@/lib/survival-context": {} });
  const input = { area: "Barcelona", focus: "HOUSEHOLD", people: 2 };
  const mosquito = buildSurvivalKit({ ...input, constraints: "mosquito attacks" });
  const zombie = buildSurvivalKit({ ...input, constraints: "zombie scenario" });
  assert.ok(mosquito.items.some((item) => item.id === "insect-repellent"));
  assert.ok(mosquito.items.some((item) => item.id === "mosquito-net"));
  assert.ok(zombie.items.some((item) => item.id === "protective-workwear"));
  assert.ok(zombie.items.some((item) => item.id === "shelter-tools"));
  assert.ok(!zombie.items.some((item) => item.id === "insect-repellent"));
  assert.equal(mosquito.items.find((item) => item.id === "water").quantity, "18 litres minimum");
});

test("survival kit removes confirmed owned equipment instead of recommending duplicates", () => {
  const { buildSurvivalKit } = load("lib/survival-market.ts", { "@/lib/survival-context": {} });
  const kit = buildSurvivalKit({
    area: "Barcelona",
    focus: "BLACKOUT",
    people: 2,
    constraints: "72-hour blackout",
    ownedItems: ["Two flashlights", "20,000 mAh power bank", "first aid kit"],
  });
  assert.ok(!kit.items.some((item) => item.id === "light"));
  assert.ok(!kit.items.some((item) => item.id === "power"));
  assert.ok(!kit.items.some((item) => item.id === "first-aid"));
  assert.ok(kit.items.some((item) => item.id === "water"));
  assert.ok(kit.items.some((item) => item.id === "food"));
});

test("Queen Core enforces the six-stage response contract", () => {
  const { RED_QUEEN_RESPONSE_SCHEMA, formatAgentMessage } = load("lib/red-queen-agent.ts");
  const response = RED_QUEEN_RESPONSE_SCHEMA.parse({
    threat: { classification: "REAL", label: "Blackout", summary: "A household power outage.", location: "Barcelona", timeframe: "CURRENT" },
    situation: "Power is unavailable.",
    facts: [],
    answer: "Protect light, communications and medication continuity first.",
    uncertainty: "Restoration time is unknown.",
    action: "Check the official outage notice.",
    urgency: "PREPARE",
    confidence: "MEDIUM",
    grounding: "GENERAL_KNOWLEDGE",
    usesLiveContext: false,
    sourceStatus: { freshness: "NOT_AVAILABLE", observedAt: "", note: "No verified live source was used." },
    priorities: [{ title: "Confirm scope", reason: "It determines whether to shelter or relocate.", timing: "NOW" }],
    followUps: ["How long has power been out?", "What equipment do you own?"],
    plan: null,
    procurement: null,
    loadout: { needed: false, owned: ["Flashlights"], missing: [], verify: ["Battery charge"], doNotBuy: ["Another flashlight"], budgetNote: "No purchase is needed." },
    optionalAction: { type: "NONE", label: "No secondary action", reason: "Complete the immediate check first.", requiresApproval: false },
    readiness: { eligible: false, xp: 0, reason: "No completed action yet.", gains: {
      threat_awareness: 0, operational_discipline: 0, psychological_stability: 0,
      technical_preparedness: 0, adaptability: 0, resourcefulness: 0, surveillance_resistance: 0,
    } },
  });
  const message = formatAgentMessage(response);
  const stages = ["THREAT\n", "ASSESSMENT\n", "PRIORITIES\n", "PLAN\n", "LOADOUT\n", "OPTIONAL ACTION\n"];
  const positions = stages.map((stage) => message.indexOf(stage));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(message, /DO NOT BUY: Another flashlight/);
});
