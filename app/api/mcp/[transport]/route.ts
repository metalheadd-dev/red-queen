import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { NextRequest } from "next/server";

// Import existing Next.js API Route Handlers directly to invoke in-memory
import { POST as threatPost } from "@/app/api/threat/route";
import { GET as depinGet } from "@/app/api/intel/depin/route";
import { GET as premiumGet } from "@/app/api/intel/premium/route";
import { GET as walletExposureGet } from "@/app/api/intel/wallet-exposure/route";
import { GET as localDeltaGet } from "@/app/api/intel/local-delta/route";
import { POST as preparednessPlanPost } from "@/app/api/intel/preparedness-plan/route";
import { GET as incidentDossierGet } from "@/app/api/intel/incident-dossier/route";
import { POST as transactionRiskPost } from "@/app/api/intel/transaction-risk/route";
import { POST as analyzeWalletPost } from "@/app/api/terminal/analyze-wallet/route";

async function invokePaidRoute(input: {
  route: (request: NextRequest) => Promise<Response>;
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  operationId?: string;
  paymentSignature?: string;
}) {
  const headers: Record<string, string> = {};
  if (input.operationId) headers["X-Operation-Id"] = input.operationId;
  if (input.paymentSignature) headers["Payment-Signature"] = input.paymentSignature;
  if (input.method === "POST") headers["Content-Type"] = "application/json";
  const request = new NextRequest(input.url, {
    method: input.method || "GET",
    headers: new Headers(headers),
    body: input.method === "POST" ? JSON.stringify(input.body || {}) : undefined,
  });
  const response = await input.route(request);
  if (response.status === 402) {
    const data = await response.json().catch(() => ({}));
    const challenge = response.headers.get("payment-required") || response.headers.get("x-payment-required");
    const responseOperationId = response.headers.get("x-operation-id") || input.operationId || "";
    return {
      content: [{
        type: "text" as const,
        text: `PAYMENT_REQUIRED: Inspect the exact runtime challenge before approval.\n\nX-Operation-Id: ${responseOperationId}\nChallenge (Base64): ${challenge || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nRe-call this tool with the same operationId, identical inputs, and complete paymentSignature.`,
      }],
    };
  }
  const data = await response.json();
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    isError: !response.ok,
  };
}

const handler = createMcpHandler(
  (server) => {
    // Compatibility name retained; the tool returns observed signals, not a prediction.
    server.registerTool(
      "get_threat_forecast",
      {
        title: "Get RED QUEEN Daily Signal Brief",
        description: "Retrieve RED QUEEN's current source-backed survival intelligence brief. It separates observed public signals, assessment, uncertainty, and one practical action; it does not predict disasters.",
        inputSchema: z.object({}),
        outputSchema: z.object({
          codename: z.string().describe("RED QUEEN identifier for the current brief"),
          name: z.string().describe("Plain-language signal or sensor-status headline"),
          description: z.string().describe("Source-backed observation or explicit limited-coverage notice"),
          countermeasure: z.string().describe("One practical next action"),
          severity: z.number().describe("Current priority score from 0 to 100"),
          status: z.string().describe("Current signal or sensor-coverage status"),
          location: z.string().describe("Reported area or global sensor grid"),
          publishDate: z.string().describe("Brief generation timestamp"),
          source: z.string().describe("Primary source or sensor-status origin"),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        }
      },
      async () => {
        try {
          const response = await threatPost();
          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          };
        } catch (err: any) {
          return {
            content: [{ type: "text", text: `Error fetching RED QUEEN signal brief: ${err.message}` }],
            isError: true,
          };
        }
      }
    );

    // Tool 2: get_depin_telemetry
    server.registerTool(
      "get_depin_telemetry",
      {
        title: "Get DePIN Telemetry",
        description: "Retrieve current Solana Mainnet validator, epoch, performance, supply, inflation, and priority-fee telemetry. Protected by a runtime x402 payment challenge.",
        inputSchema: z.object({
          operationId: z.string().uuid().optional().describe("Reuse the X-Operation-Id returned with the payment challenge for receipt-safe retries."),
          paymentSignature: z.string().optional().describe("Base64-encoded x402 v2 payment payload created from the exact runtime challenge. It is not a bare transaction signature."),
          operativeToken: z.string().optional().describe("Deprecated and ignored. Purchasing intelligence never awards readiness or XP."),
        }),
        outputSchema: z.object({
          success: z.boolean().describe("Operation success indicator"),
          timestamp: z.string().optional().describe("Timestamp of the audit"),
          clearance: z.string().optional().describe("Delivery status"),
          network: z.any().optional().describe("Source-backed Solana network telemetry"),
          error: z.string().optional(),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        }
      },
      async ({ operationId, paymentSignature }) => {
        try {
          const headers: Record<string, string> = {};
          if (operationId) headers["X-Operation-Id"] = operationId;
          if (paymentSignature) {
            headers["Payment-Signature"] = paymentSignature;
          }

          // Create a mock NextRequest and call the router directly
          const mockReq = new NextRequest("http://localhost:3000/api/intel/depin", {
            headers: new Headers(headers),
          });

          const response = await depinGet(mockReq);
          
          if (response.status === 402) {
            const data = await response.json().catch(() => ({}));
            const paymentRequiredHeader = response.headers.get("payment-required") || response.headers.get("x-payment-required");
            const responseOperationId = response.headers.get("x-operation-id") || operationId || "";
            return {
              content: [{
                type: "text",
                text: `PAYMENT_REQUIRED: Decode and inspect the runtime x402 challenge before approval. It declares the exact network, asset, amount, recipient, fee payer, and timeout.\n\nX-Operation-Id: ${responseOperationId}\nChallenge (Base64): ${paymentRequiredHeader || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nRe-call this tool with the same operationId and the complete base64 x402 payment payload in paymentSignature.`
              }],
            };
          }

          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            isError: !response.ok,
          };
        } catch (err: any) {
          return {
            content: [{ type: "text", text: `Error fetching DePIN telemetry: ${err.message}` }],
            isError: true,
          };
        }
      }
    );

    // Tool 3: get_premium_intel
    server.registerTool(
      "get_premium_intel",
      {
        title: "Get Premium Intel",
        description: "Retrieve a ranked synthesis across RED QUEEN's seven-source verified signal grid. Delivery requires at least four reachable source families and a runtime x402 payment challenge.",
        inputSchema: z.object({
          operationId: z.string().uuid().optional().describe("Reuse the X-Operation-Id returned with the payment challenge for receipt-safe retries."),
          paymentSignature: z.string().optional().describe("Base64-encoded x402 v2 payment payload created from the exact runtime challenge. It is not a bare transaction signature."),
          operativeToken: z.string().optional().describe("Deprecated and ignored. Purchasing intelligence never awards readiness or XP."),
        }),
        outputSchema: z.object({
          success: z.boolean().describe("Operation success indicator"),
          timestamp: z.string().optional().describe("Timestamp of the synthesis"),
          clearance: z.string().optional().describe("Delivery status"),
          intel: z.any().optional().describe("Seven-source ranked signal dossier with coverage and trust boundaries"),
          error: z.string().optional(),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        }
      },
      async ({ operationId, paymentSignature }) => {
        try {
          const headers: Record<string, string> = {};
          if (operationId) headers["X-Operation-Id"] = operationId;
          if (paymentSignature) {
            headers["Payment-Signature"] = paymentSignature;
          }

          // Create a mock NextRequest and call the router directly
          const mockReq = new NextRequest("http://localhost:3000/api/intel/premium", {
            headers: new Headers(headers),
          });

          const response = await premiumGet(mockReq);
          
          if (response.status === 402) {
            const data = await response.json().catch(() => ({}));
            const paymentRequiredHeader = response.headers.get("payment-required") || response.headers.get("x-payment-required");
            const responseOperationId = response.headers.get("x-operation-id") || operationId || "";
            return {
              content: [{
                type: "text",
                text: `PAYMENT_REQUIRED: Decode and inspect the runtime x402 challenge before approval. It declares the exact network, asset, amount, recipient, fee payer, and timeout.\n\nX-Operation-Id: ${responseOperationId}\nChallenge (Base64): ${paymentRequiredHeader || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nRe-call this tool with the same operationId and the complete base64 x402 payment payload in paymentSignature.`
              }],
            };
          }

          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            isError: !response.ok,
          };
        } catch (err: any) {
          return {
            content: [{ type: "text", text: `Error fetching premium intel: ${err.message}` }],
            isError: true,
          };
        }
      }
    );

    // Tool 4: analyze_wallet_security
    server.registerTool(
      "analyze_wallet_security",
      {
        title: "Analyze Wallet Security",
        description: "Run an evidence-bounded Solana wallet safety triage. Returns live public RPC facts, explicit data limitations, and practical security actions without identity, geolocation, AML-vendor, or blacklist claims.",
        inputSchema: z.object({
          wallet: z.string().describe("Solana wallet address (base58) to diagnose"),
          vector: z.enum(["WALLET-TRAIL", "AI-PROFILING", "FEED-MANIP", "DEEPFAKE-SE", "REPUTATION-X"]).describe("The safety guidance category to apply to verified public RPC facts"),
          operativeToken: z.string().optional().describe("Deprecated compatibility field; public on-chain reads do not require account credentials."),
        }),
        outputSchema: z.object({
          report: z.string().optional().describe("Evidence-bounded report with observed public-chain facts, limitations, and safe actions"),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        }
      },
      async ({ wallet, vector, operativeToken }) => {
        try {
          const headers: Record<string, string> = {};
          if (operativeToken) {
            headers["Authorization"] = `Bearer ${operativeToken}`;
          }

          // Create a mock NextRequest with query params and call the router directly
          const mockReq = new NextRequest(`http://localhost:3000/api/terminal/analyze-wallet?vector=${vector}&wallet=${wallet}`, {
            method: "POST",
            headers: new Headers(headers),
          });

          const response = await analyzeWalletPost(mockReq);
          const data = await response.json();
          return {
            content: [{ type: "text", text: data.report || JSON.stringify(data, null, 2) }],
          };
        } catch (err: any) {
          return {
            content: [{ type: "text", text: `Error executing wallet diagnostic: ${err.message}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "get_wallet_exposure_audit",
      {
        title: "Get Solana Wallet Exposure Audit",
        description: "Purchase an evidence-bounded x402 audit of SPL and Token-2022 delegates, frozen accounts, empty accounts, and external close authorities for a public Solana address.",
        inputSchema: z.object({
          wallet: z.string().describe("Public Solana wallet address to audit"),
          operationId: z.string().uuid().optional().describe("Reuse the X-Operation-Id returned with the payment challenge for receipt-safe retries."),
          paymentSignature: z.string().optional().describe("Complete base64 x402 v2 payment payload created from the runtime challenge."),
        }),
        outputSchema: z.object({
          success: z.boolean().optional(),
          timestamp: z.string().optional(),
          clearance: z.string().optional(),
          audit: z.any().optional(),
          error: z.string().optional(),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async ({ wallet, operationId, paymentSignature }) => {
        try {
          const headers: Record<string, string> = {};
          if (operationId) headers["X-Operation-Id"] = operationId;
          if (paymentSignature) headers["Payment-Signature"] = paymentSignature;
          const mockReq = new NextRequest(`http://localhost:3000/api/intel/wallet-exposure?address=${encodeURIComponent(wallet)}`, {
            headers: new Headers(headers),
          });
          const response = await walletExposureGet(mockReq);
          if (response.status === 402) {
            const data = await response.json().catch(() => ({}));
            const challenge = response.headers.get("payment-required") || response.headers.get("x-payment-required");
            const responseOperationId = response.headers.get("x-operation-id") || operationId || "";
            return {
              content: [{
                type: "text",
                text: `PAYMENT_REQUIRED: Inspect the exact runtime challenge before approval.\n\nX-Operation-Id: ${responseOperationId}\nChallenge (Base64): ${challenge || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nRe-call this tool with the same operationId and complete paymentSignature.`,
              }],
            };
          }
          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            isError: !response.ok,
          };
        } catch (err: any) {
          return {
            content: [{ type: "text", text: `Error fetching wallet exposure audit: ${err.message}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "get_local_delta_brief",
      {
        title: "Get RED QUEEN Local Delta",
        description: "Purchase a source-backed 24-hour change brief around a broad place and radius. Exact home addresses are neither required nor retained.",
        inputSchema: z.object({
          area: z.string().min(2).max(80),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          radiusKm: z.number().int().min(25).max(1000).default(250),
          operationId: z.string().uuid().optional(),
          paymentSignature: z.string().optional(),
        }),
        outputSchema: z.object({ success: z.boolean().optional(), report: z.any().optional(), error: z.string().optional() }),
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
      },
      async ({ area, latitude, longitude, radiusKm, operationId, paymentSignature }) => invokePaidRoute({
        route: localDeltaGet,
        url: `http://localhost:3000/api/intel/local-delta?${new URLSearchParams({ area, lat: String(latitude), lng: String(longitude), radiusKm: String(radiusKm) })}`,
        operationId,
        paymentSignature,
      }),
    );

    server.registerTool(
      "compile_72_hour_plan",
      {
        title: "Compile RED QUEEN 72-Hour Plan",
        description: "Purchase a personalized phased preparedness protocol grounded in household constraints, official guidance and any directly relevant verified signal context.",
        inputSchema: z.object({
          area: z.string().max(80).default(""),
          focus: z.enum(["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"]),
          household: z.string().max(320).default(""),
          constraints: z.string().max(320).default(""),
          operationId: z.string().uuid().optional(),
          paymentSignature: z.string().optional(),
        }).refine((value) => Boolean(value.household.trim() || value.constraints.trim()), { message: "Provide household or constraint context." }),
        outputSchema: z.object({ success: z.boolean().optional(), plan: z.any().optional(), error: z.string().optional() }),
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
      },
      async ({ area, focus, household, constraints, operationId, paymentSignature }) => invokePaidRoute({
        route: preparednessPlanPost,
        url: "http://localhost:3000/api/intel/preparedness-plan",
        method: "POST",
        body: { area, focus, household, constraints },
        operationId,
        paymentSignature,
      }),
    );

    server.registerTool(
      "get_incident_dossier",
      {
        title: "Get RED QUEEN Incident Dossier",
        description: "Purchase a timestamped dossier for one current verified RED QUEEN signal, including fact, source, uncertainty and action protocol.",
        inputSchema: z.object({
          signalId: z.string().min(3).max(240),
          operationId: z.string().uuid().optional(),
          paymentSignature: z.string().optional(),
        }),
        outputSchema: z.object({ success: z.boolean().optional(), dossier: z.any().optional(), error: z.string().optional() }),
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
      },
      async ({ signalId, operationId, paymentSignature }) => invokePaidRoute({
        route: incidentDossierGet,
        url: `http://localhost:3000/api/intel/incident-dossier?signalId=${encodeURIComponent(signalId)}`,
        operationId,
        paymentSignature,
      }),
    );

    server.registerTool(
      "explain_solana_transaction_risk",
      {
        title: "Explain Solana Transaction Risk",
        description: "Purchase a pre-sign simulation and bounded explanation of a serialized Solana v0 transaction. The inspected transaction is never signed or submitted.",
        inputSchema: z.object({
          transaction: z.string().min(40).max(240000),
          expectedWallet: z.string().max(60).default(""),
          operationId: z.string().uuid().optional(),
          paymentSignature: z.string().optional(),
        }),
        outputSchema: z.object({ success: z.boolean().optional(), report: z.any().optional(), error: z.string().optional() }),
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
      },
      async ({ transaction, expectedWallet, operationId, paymentSignature }) => invokePaidRoute({
        route: transactionRiskPost,
        url: "http://localhost:3000/api/intel/transaction-risk",
        method: "POST",
        body: { transaction, wallet: expectedWallet },
        operationId,
        paymentSignature,
      }),
    );
  },
  {},
  {
    basePath: "/api/mcp",
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };
