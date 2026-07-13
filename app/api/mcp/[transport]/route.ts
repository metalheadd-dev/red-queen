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
        inputSchema: {},
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
        inputSchema: {
          paymentSignature: z.string().optional().describe("Optional transaction signature proving payment of $0.02 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg. Required to unlock telemetry."),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to award XP directly to the operative's profile."),
        },
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
        inputSchema: {
          paymentSignature: z.string().optional().describe("Optional transaction signature proving payment of $0.01 USDC to SVM address AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg. Required to unlock premium briefing."),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to award XP directly to the operative's profile."),
        },
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
        inputSchema: {
          wallet: z.string().describe("Solana wallet address (base58) to diagnose"),
          vector: z.enum(["WALLET-TRAIL", "AI-PROFILING", "FEED-MANIP", "DEEPFAKE-SE", "REPUTATION-X"]).describe("The diagnostic security scanner category to execute"),
          operativeToken: z.string().optional().describe("Optional Bearer JWT token to verify wallet ownership for restricted analysis."),
        },
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
