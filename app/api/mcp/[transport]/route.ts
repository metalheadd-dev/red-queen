import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { NextRequest } from "next/server";

// Import existing Next.js API Route Handlers directly to invoke in-memory
import { POST as threatPost } from "@/app/api/threat/route";
import { GET as depinGet } from "@/app/api/intel/depin/route";
import { GET as premiumGet } from "@/app/api/intel/premium/route";
import { POST as analyzeWalletPost } from "@/app/api/terminal/analyze-wallet/route";

const handler = createMcpHandler(
  (server) => {
    // Tool 1: get_threat_forecast
    server.registerTool(
      "get_threat_forecast",
      {
        title: "Get Threat Forecast",
        description: "Retrieve the daily autonomous AI survival threat forecast from the Red Queen mainframe. Synthesizes real-world USGS seismic feeds, NOAA space weather, NASA natural disaster feeds, and disease outbreaks.",
        inputSchema: z.object({}),
        outputSchema: z.object({
          codename: z.string().describe("Internal Red Queen operations codename for the threat vector"),
          name: z.string().describe("Human-readable hazard name"),
          description: z.string().describe("Detailed situational report on the active anomalies"),
          countermeasure: z.string().describe("Tactical recommendations for operatives in the sector"),
          severity: z.number().describe("Entropy severity indicator score (0-100%)"),
          status: z.string().describe("Status classification (e.g. SEVERE, MODERATE, NOMINAL)"),
          location: z.string().describe("Geographic sector of the anomalies"),
          publishDate: z.string().describe("Dossier publication date"),
          source: z.string().describe("Sensor source logs parsed"),
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
            content: [{ type: "text", text: `Error fetching threat forecast: ${err.message}` }],
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
  },
  {},
  {
    basePath: "/api/mcp",
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };
