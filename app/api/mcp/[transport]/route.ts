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
        description: "Retrieve live DePIN mesh network diagnostic telemetry from Solana Mainnet Beta, including active/delinquent nodes, vote performance thresholds, and average priority fee metrics. Protected by x402 micropayment standard.",
        inputSchema: z.object({
          paymentSignature: z.string().optional().describe("Optional transaction signature proving payment of $0.02 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg. Required to unlock telemetry."),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to award XP directly to the operative's profile."),
        }),
        outputSchema: z.object({
          success: z.boolean().describe("Operation success indicator"),
          timestamp: z.string().describe("Timestamp of the audit"),
          clearance: z.string().describe("Access clearance status"),
          depin: z.object({
            scannerName: z.string(),
            onlineNodes: z.number(),
            compromisedNodes: z.number(),
            bandwidthTaintIndex: z.string(),
            networkHealth: z.string(),
          }).optional().describe("DePIN network diagnostic metrics"),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        }
      },
      async ({ paymentSignature, operativeToken }) => {
        try {
          const headers: Record<string, string> = {};
          if (paymentSignature) {
            headers["Payment-Signature"] = paymentSignature;
          }
          if (operativeToken) {
            headers["Authorization"] = `Bearer ${operativeToken}`;
          }

          // Create a mock NextRequest and call the router directly
          const mockReq = new NextRequest("http://localhost:3000/api/intel/depin", {
            headers: new Headers(headers),
          });

          const response = await depinGet(mockReq);
          
          if (response.status === 402) {
            const data = await response.json().catch(() => ({}));
            const paymentRequiredHeader = response.headers.get("payment-required") || response.headers.get("x-payment-required");
            return {
              content: [{
                type: "text",
                text: `PAYMENT_REQUIRED: This tool is gated by x402. To unlock this telemetry, please submit a payment of $0.02 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg.\n\nChallenge details (Base64): ${paymentRequiredHeader || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nAfter paying, re-call this tool and supply the transaction signature in the 'paymentSignature' parameter.`
              }],
            };
          }

          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
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
        description: "Retrieve premium global threat briefing containing physical seismic anomalies, NASA natural disaster events, and Disease.sh pathogen analytics. Protected by x402 micropayment standard.",
        inputSchema: z.object({
          paymentSignature: z.string().optional().describe("Optional transaction signature proving payment of $0.01 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg. Required to unlock premium briefing."),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to award XP directly to the operative's profile."),
        }),
        outputSchema: z.object({
          success: z.boolean().describe("Operation success indicator"),
          timestamp: z.string().describe("Timestamp of the brief"),
          clearance: z.string().describe("Clearance authentication level"),
          intel: z.object({
            headline: z.string(),
            summary: z.string(),
            maxEvent: z.object({
              magnitude: z.string(),
              location: z.string(),
              depthKm: z.string(),
              latitude: z.string(),
              longitude: z.string(),
            }),
            t54Telemetry: z.object({
              identityStatus: z.string(),
              complianceScore: z.string(),
              activePromptMitigations: z.number(),
              underwritingTier: z.string(),
              riskShieldState: z.string(),
            }),
            threatVectors: z.array(z.object({
              id: z.string(),
              rating: z.string(),
              trend: z.string(),
              status: z.string(),
              description: z.string(),
              depthKm: z.string(),
              latitude: z.string(),
              longitude: z.string(),
              eventTime: z.string(),
            })),
            nasaEvents: z.array(z.object({
              id: z.string(),
              title: z.string(),
              category: z.string(),
              date: z.string(),
              longitude: z.number(),
              latitude: z.number(),
              source: z.string(),
            })),
            biologicalContainment: z.object({
              activePathogens: z.number(),
              criticalInfections: z.number(),
              dailyEscalations: z.number(),
              totalFatalities: z.number(),
              recoveryRate: z.string(),
            }),
            combinedEntropyIndex: z.string(),
            directive: z.string(),
            explorerUrl: z.string(),
          }).optional().describe("Premium global apocalypse and biological diagnostics data"),
        }),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        }
      },
      async ({ paymentSignature, operativeToken }) => {
        try {
          const headers: Record<string, string> = {};
          if (paymentSignature) {
            headers["Payment-Signature"] = paymentSignature;
          }
          if (operativeToken) {
            headers["Authorization"] = `Bearer ${operativeToken}`;
          }

          // Create a mock NextRequest and call the router directly
          const mockReq = new NextRequest("http://localhost:3000/api/intel/premium", {
            headers: new Headers(headers),
          });

          const response = await premiumGet(mockReq);
          
          if (response.status === 402) {
            const data = await response.json().catch(() => ({}));
            const paymentRequiredHeader = response.headers.get("payment-required") || response.headers.get("x-payment-required");
            return {
              content: [{
                type: "text",
                text: `PAYMENT_REQUIRED: This tool is gated by x402. To unlock this intelligence brief, please submit a payment of $0.01 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg.\n\nChallenge details (Base64): ${paymentRequiredHeader || ""}\nJSON Payload: ${JSON.stringify(data, null, 2)}\n\nAfter paying, re-call this tool and supply the transaction signature in the 'paymentSignature' parameter.`
              }],
            };
          }

          const data = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
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
        description: "Perform security and privacy audit on a Solana wallet. Diagnoses wallet trail anonymity, AI profiling metrics, feed manipulation anomalies, voice/visual clone deepfake SE vectors, and blacklist reputational indexing.",
        inputSchema: z.object({
          wallet: z.string().describe("Solana wallet address (base58) to diagnose"),
          vector: z.enum(["WALLET-TRAIL", "AI-PROFILING", "FEED-MANIP", "DEEPFAKE-SE", "REPUTATION-X"]).describe("The diagnostic security scanner category to execute"),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to verify wallet ownership for restricted analysis."),
        }),
        outputSchema: z.object({
          report: z.string().optional().describe("Formated diagnostic analysis report text detailing identified tracking indicators and threat scores"),
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
