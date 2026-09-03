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
