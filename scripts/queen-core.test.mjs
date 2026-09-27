import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { exports: module.exports, module, URL, Date, Set, console }, { filename: file });
  return module.exports;
}

const { enforceQueenConstitution } = load("lib/queen-constitution.ts");
const { buildThreatGraph } = load("lib/threat-graph.ts");
const { parseThreatCases, saveThreatCase, caseChange } = load("lib/threat-casebook.ts");

function response() {
  return {
    threat: { classification: "REAL" }, grounding: "VERIFIED_LIVE", usesLiveContext: true,
    facts: ["Model invented a live fact"], procurement: { title: "Buy" },
    loadout: {
      needed: true, owned: [],
      missing: [{ item: "flashlight", category: "LIGHT", priority: "ESSENTIAL", reason: "For power cuts" }],
      doNotBuy: [], verify: [], budgetNote: "Check prices",
    },
    optionalAction: { type: "BUILD_CART", label: "Build cart", reason: "Optional", requiresApproval: false },
  };
}

test("Queen cannot present invented facts as verified live evidence", () => {
  const checked = enforceQueenConstitution(response(), { evidence: [], ownedEquipment: [] });
  assert.equal(checked.grounding, "GENERAL_KNOWLEDGE");
  assert.equal(checked.usesLiveContext, false);
  assert.deepEqual(Array.from(checked.facts), []);
  assert.equal(checked.optionalAction.requiresApproval, true);
});

test("Queen replaces model facts with server evidence and removes already-owned equipment", () => {
  const checked = enforceQueenConstitution(response(), {
    evidence: [{ fact: "Officially reported earthquake", sourceUrl: "https://example.org/event", observedAt: "2026-09-27T10:00:00Z" }],
    ownedEquipment: ["Torch"],
  });
  assert.equal(checked.grounding, "VERIFIED_LIVE");
  assert.deepEqual(Array.from(checked.facts), ["Officially reported earthquake"]);
  assert.equal(checked.loadout.missing.length, 0);
  assert.equal(checked.loadout.needed, false);
  assert.equal(checked.procurement, null);
  assert.equal(checked.optionalAction.type, "NONE");
});

test("Fiction cannot be relabeled as a live event", () => {
  const answer = response(); answer.threat.classification = "FICTIONAL";
  const checked = enforceQueenConstitution(answer, {
    evidence: [{ fact: "Real earthquake", sourceUrl: "https://example.org/event", observedAt: "2026-09-27T10:00:00Z" }],
    ownedEquipment: [],
  });
  assert.equal(checked.grounding, "SCENARIO_SIMULATION");
  assert.equal(checked.usesLiveContext, false);
  assert.equal(checked.facts.length, 0);
});

test("Stale source evidence cannot justify a current live label", () => {
  const checked = enforceQueenConstitution(response(), {
    evidence: [{ fact: "Old report", sourceUrl: "https://example.org/old", observedAt: "2026-09-20T10:00:00Z", current: false }],
    ownedEquipment: [],
  });
  assert.equal(checked.grounding, "GENERAL_KNOWLEDGE");
  assert.equal(checked.facts.length, 0);
});

function signal(observedAt = "2026-09-27T10:00:00Z") {
  return {
    id: "usgs-test", name: "Test earthquake", kind: "GEOLOGICAL", location: "Test area",
    observedAt, source: "USGS", sourceUrl: "https://earthquake.usgs.gov/example", fact: "Magnitude 4.1",
    assessment: "Distance matters", action: "Check local guidance", confidence: 98,
  };
}

test("Threat Graph separates verified source facts from hypothetical exposure", () => {
  const graph = buildThreatGraph(signal(), new Date("2026-09-27T11:00:00Z"));
  assert.equal(graph.status, "CURRENT");
  assert.equal(graph.nodes.find((node) => node.stage === "EVENT").verified, true);
  assert.equal(graph.nodes.find((node) => node.stage === "EXPOSURE").verified, false);
  assert.equal(graph.edges[0].from, "source");
});

test("Threat Graph marks expired reports stale and rejects invalid provenance", () => {
  assert.equal(buildThreatGraph(signal("2026-09-25T10:00:00Z"), new Date("2026-09-27T11:00:00Z")).status, "STALE");
  assert.equal(buildThreatGraph({ ...signal(), sourceUrl: "javascript:alert(1)" }, new Date("2026-09-27T11:00:00Z")), null);
  assert.equal(buildThreatGraph({ ...signal(), confidence: 55 }, new Date("2026-09-27T11:00:00Z")), null);
});

test("an official source revision renews an ongoing threat without rewriting the first observation", () => {
  const graph = buildThreatGraph({ ...signal("2026-09-25T10:00:00Z"), updatedAt: "2026-09-27T10:30:00Z" }, new Date("2026-09-27T11:00:00Z"));
  assert.equal(graph.status, "CURRENT");
  assert.equal(graph.observedAt, "2026-09-25T10:00:00Z");
  assert.equal(graph.updatedAt, "2026-09-27T10:30:00.000Z");
});

test("casebook offers a new dossier only after a real source revision", () => {
  const now = new Date("2026-09-27T11:00:00Z");
  const first = buildThreatGraph(signal(), now);
  const saved = saveThreatCase([], first, now)[0];
  assert.equal(caseChange(saved, first), "UNCHANGED");
  const updated = buildThreatGraph({ ...signal(), updatedAt: "2026-09-27T10:30:00Z", fact: "Magnitude revised to 4.2" }, now);
  assert.equal(caseChange(saved, updated), "UPDATED");
  assert.equal(caseChange(saved, undefined), "NOT_IN_FEED");
  assert.equal(caseChange(saved, buildThreatGraph(signal("2026-09-24T10:00:00Z"), now)), "STALE");
});

test("casebook rejects malformed saved links and keeps a bounded list", () => {
  assert.equal(parseThreatCases(JSON.stringify([{ id: "usgs-x", name: "bad", sourceUrl: "javascript:alert(1)", observedAt: "2026-09-27T10:00:00Z", updatedAt: "2026-09-27T10:00:00Z", eventLabel: "bad", savedAt: "now" }])).length, 0);
  const graph = buildThreatGraph(signal(), new Date("2026-09-27T11:00:00Z"));
  let cases = [];
  for (let i = 0; i < 9; i++) cases = saveThreatCase(cases, { ...graph, signalId: `usgs-case${i}` });
  assert.equal(cases.length, 6);
  assert.equal(cases[0].id, "usgs-case8");
});
