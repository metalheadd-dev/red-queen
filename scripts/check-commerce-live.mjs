// Read-only checks. Never sends payment proofs, signed transactions or orders.
import { PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

const origin = "https://redqueen.space";
const owner = "GVf6gQpmAcc45aGxmFKu1mdVmyYcVKB7AckLAK1WVtFb";
async function probe(path, body, extraHeaders = {}) {
  const response = await fetch(path.startsWith("https://") ? path : `${origin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    const event = text.split(/\r?\n/).filter((line) => line.startsWith("data:")).at(-1);
    try { data = JSON.parse(event?.slice(5) || "null"); } catch { data = null; }
  }
  const required = response.headers.get("payment-required");
  let payment;
  try { payment = required ? JSON.parse(Buffer.from(required, "base64").toString()) : undefined; } catch {}
  console.log(JSON.stringify({ path, status: response.status,
    ...(payment ? { payment: payment.accepts?.map(({ network, asset, amount }) => ({ network, asset, amount })), bazaar: Boolean(payment.extensions?.bazaar) } : {}),
    ...(!payment ? { data: path === "/api/threat" ? { coverage: data?.coverage, sources: data?.sourceHealth } : path.includes("quote") ? { eligible: data?.quote?.eligible, reason: data?.quote?.reason, readiness: data?.quote?.readiness, providers: data?.quote?.providers?.map(({ name, configured }) => ({ name, configured })) } : data?.result?.tools ? { tools: data.result.tools.map(({ name }) => name) } : data } : {}),
  }));
  return { response, data };
}
const safeProbe = async (...args) => { try { return await probe(...args); } catch (error) { console.log(JSON.stringify({ path: args[0], error: error.message })); return {}; } };

await Promise.all([
  safeProbe("/api/x402/status"), safeProbe("/api/intel/premium-area/quote"),
  safeProbe("/api/intel/external-intelligence/quote"), safeProbe("/api/market/sp3nd/mcp/status"),
]);
const { data: grid } = await safeProbe("/api/threat", {});
const signalId = grid?.signals?.[0]?.id || grid?.threats?.[0]?.id;
const transaction = Buffer.from(new VersionedTransaction(new TransactionMessage({
  payerKey: new PublicKey(owner), recentBlockhash: PublicKey.default.toBase58(), instructions: [],
}).compileToV0Message()).serialize()).toString("base64");
const area = { area: "Barcelona, Spain", lat: 41.3874, lng: 2.1686, radiusKm: 250, focus: "HOUSEHOLD" };
await Promise.all([
  safeProbe("/api/intel/local-delta?area=Barcelona&lat=41.3874&lng=2.1686&radiusKm=250"),
  safeProbe("/api/intel/preparedness-plan", { ...area, household: "Two adults", constraints: "Apartment, limited storage" }),
  safeProbe("/api/intel/transaction-risk", { transaction, wallet: owner }),
  safeProbe(`/api/intel/wallet-exposure?address=${owner}`),
  safeProbe("/api/intel/premium-area", area),
  safeProbe("/api/intel/premium"), safeProbe("/api/intel/depin"),
]);
if (signalId) await safeProbe(`/api/intel/incident-dossier?signalId=${encodeURIComponent(signalId)}`);
const input = { area: area.area, focus: area.focus, question: "What verified external evidence could change household preparedness priorities?" };
const { data: quote } = await safeProbe("/api/intel/external-intelligence/quote", input);
if (quote?.quote?.eligible) await safeProbe("/api/intel/external-intelligence", { ...input, quoteToken: quote.quote.quoteToken });
const mcpHeaders = { Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-06-18" };
const { response: initialized } = await safeProbe("/api/mcp/mcp", { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "RED-QUEEN-read-only-check", version: "1.0.0" } } }, mcpHeaders);
await safeProbe("/api/mcp/mcp", { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, { ...mcpHeaders, ...(initialized?.headers.get("mcp-session-id") ? { "mcp-session-id": initialized.headers.get("mcp-session-id") } : {}) });
await safeProbe("https://mcp.sp3nd.shop/mcp", { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "RED-QUEEN-read-only-check", version: "1.0.0" } } }, mcpHeaders);
await safeProbe("/api/market/catalog-search", { query: "emergency lantern" });
