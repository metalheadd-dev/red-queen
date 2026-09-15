import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, extra = {}) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, URLSearchParams, ...extra });
  return module.exports;
}
const rq = load("lib/rq-experience.ts");
const { commerceDestination } = load("lib/rq-navigation.ts");
test("introduction rejects malformed or inaccessible device records", () => {
  assert.equal(rq.readRqProfile({ getItem: () => "{" }), null);
  assert.equal(rq.readRqProfile({ getItem: () => { throw new Error("blocked"); } }), null);
  assert.equal(rq.readRqProfile({ getItem: () => "{}" }), null);
});
test("introduction bounds optional data and household size", () => {
  const p = rq.readRqProfile({ getItem: () => JSON.stringify({ completedAt: "2026-09-15", people: 900, name: "x".repeat(100), goal: "invalid", interest: "invalid" }) });
  assert.equal(p.people, 12);
  assert.equal(p.name.length, 40);
  assert.equal(p.goal, "prepare");
  assert.equal(p.interest, "both");
});
test("first draft carries household context, marks fiction and waits for a decision", () => {
  const text = rq.profilePrompt({ name: "Scout", city: "Barcelona", country: "Spain", people: 2, interest: "both", favorite: "Resident Evil", goal: "practice" });
  assert.match(text, /wait for my answer/);
  assert.match(text, /Barcelona, Spain/);
  assert.match(text, /2 people/);
  assert.match(text, /fictional inspiration/);
});
test("draft preparation writes bounded session data, never sends a request", () => {
  let value;
  const m = load("lib/rq-experience.ts", { sessionStorage: { setItem: (_key, data) => { value = JSON.parse(data); } } });
  assert.equal(m.draftQueenQuestion("a".repeat(4000), "SIMULATE", "BLACKOUT"), "/red-queen");
  assert.equal(value.prompt.length, 2000);
  assert.equal(value.mode, "SIMULATE");
  assert.equal(value.focus, "BLACKOUT");
});
test("Queen remains accessible when session storage is blocked", () => {
  const m = load("lib/rq-experience.ts", { sessionStorage: { setItem: () => { throw new Error("blocked"); } } });
  assert.equal(m.draftQueenQuestion("hello"), "/red-queen");
});
for (const [search, hash, expected] of [
  ["", "", "/reports"],
  ["?product=incident&signal=example", "#queen-operations", "/reports?product=incident&signal=example#queen-operations"],
  ["?fromChat=1&people=2&focus=BLACKOUT", "#survival-market", "/shop?fromChat=1&people=2&focus=BLACKOUT#survival-market"],
  ["?sp3ndProduct=https%3A%2F%2Famazon.com%2Fdp%2FEXAMPLE", "#sp3nd-checkout", "/shop?sp3ndProduct=https%3A%2F%2Famazon.com%2Fdp%2FEXAMPLE#sp3nd-checkout"],
  ["?sp3ndError=cancelled", "", "/shop?sp3ndError=cancelled"],
  ["", "#agent-identity", "/network-clearance#agent-identity"],
  ["", "#buy-threat", "/network-clearance#buy-threat"],
]) test(`legacy deep link: ${search}${hash || "/"}`, () => assert.equal(commerceDestination(search, hash), expected));
