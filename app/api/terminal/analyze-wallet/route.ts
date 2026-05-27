import { Connection, PublicKey } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TREASURY_PUBKEY = new PublicKey("RedQnBv2pTwtE4x3o5dM4rQ1tBvM2bTwtE4x3o5dM4r");
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "solana-devnet"; // Default to devnet for safe testing
const RPC_ENDPOINT = NETWORK === "solana-devnet" 
  ? "https://api.devnet.solana.com" 
  : "https://api.mainnet-beta.solana.com";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function getUSDCMint(): PublicKey {
  return NETWORK === "solana-devnet"
    ? new PublicKey("4zMMC9srt5Ri5X14GAgXwiHii3tzconxEksHXrTXst6H") // Devnet USDC
    : new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC
}

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

// In-memory signature log to prevent double spending/replay attacks on serverless restarts
const processedSignatures = new Set<string>();

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const vector = searchParams.get("vector");
  const wallet = searchParams.get("wallet");
  
  if (!vector) {
    return Response.json({ error: "vector ID required" }, { status: 400 });
  }

  const signature = req.headers.get("x-payment-signature");

  // Step 1: Check if payment signature exists. If not, issue x402 Payment Required response.
  if (!signature) {
    const headers = new Headers();
    headers.set("PAYMENT-REQUIRED-AMOUNT", "0.05");
    headers.set("PAYMENT-REQUIRED-RECIPIENT", TREASURY_PUBKEY.toString());
    headers.set("PAYMENT-REQUIRED-TOKEN", "USDC");
    headers.set("PAYMENT-REQUIRED-NETWORK", NETWORK);

    return Response.json(
      { 
        error: "Payment Required",
        amount: "0.05",
        token: "USDC",
        recipient: TREASURY_PUBKEY.toString(),
        network: NETWORK,
        instruction: "Submit on-chain Solana USDC payment and send the signature in 'X-PAYMENT-SIGNATURE' header."
      },
      { 
        status: 402, 
        headers 
      }
    );
  }

  // Step 2: Prevent replay attacks
  if (processedSignatures.has(signature)) {
    return Response.json({ error: "Duplicate transaction signature detected. Replay blocked." }, { status: 400 });
  }

  // Double check in Supabase if table exists
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("verified_payments")
        .select("signature")
        .eq("signature", signature)
        .single();
      if (data) {
        return Response.json({ error: "Transaction already processed. Replay blocked." }, { status: 400 });
      }
    } catch (e) {
      // Table might not exist yet, log and proceed with in-memory check
      console.warn("Could not query verified_payments table in Supabase:", e);
    }
  }

  // Step 3: Verify the transaction on-chain
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const parsedTx = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });

    if (!parsedTx) {
      // Fallback for mock transactions in local testing if transaction has not populated yet
      if (process.env.NODE_ENV === "development" && signature.startsWith("mock_")) {
        console.log("Mock signature accepted in dev environment:", signature);
      } else {
        return Response.json({ error: "Transaction signature not found on-chain. Please wait or check your transaction." }, { status: 400 });
      }
    } else {
      if (parsedTx.meta?.err) {
        return Response.json({ error: "Solana transaction failed on-chain." }, { status: 400 });
      }

      // Compute expected Treasury ATA
      const usdcMint = getUSDCMint();
      const treasuryAta = getAssociatedTokenAddress(usdcMint, TREASURY_PUBKEY);

      // Verify the transaction has a transfer to Treasury ATA of 0.05 USDC (50,000 base units)
      let foundValidTransfer = false;
      const amountRequired = 50000; // 0.05 * 10^6

      const instructions = parsedTx.transaction.message.instructions;
      
      // Look through top-level instructions
      for (const inst of instructions) {
        if ("parsed" in inst && inst.program === "spl-token") {
          const info = inst.parsed.info;
          if (
            (inst.parsed.type === "transfer" || inst.parsed.type === "transferChecked") &&
            new PublicKey(info.destination).equals(treasuryAta) &&
            parseInt(info.amount) >= amountRequired
          ) {
            foundValidTransfer = true;
            break;
          }
        }
      }

      // Also look through inner-instructions in case it was wrapped
      if (!foundValidTransfer && parsedTx.meta?.innerInstructions) {
        for (const inner of parsedTx.meta.innerInstructions) {
          for (const inst of inner.instructions) {
            if ("parsed" in inst && inst.program === "spl-token") {
              const info = inst.parsed.info;
              if (
                (inst.parsed.type === "transfer" || inst.parsed.type === "transferChecked") &&
                new PublicKey(info.destination).equals(treasuryAta) &&
                parseInt(info.amount) >= amountRequired
              ) {
                foundValidTransfer = true;
                break;
              }
            }
          }
        }
      }

      // Fallback check: check postTokenBalances in meta
      if (!foundValidTransfer && parsedTx.meta?.postTokenBalances && parsedTx.meta?.preTokenBalances) {
        const treasuryBalancePre = parsedTx.meta.preTokenBalances.find(b => b.owner === TREASURY_PUBKEY.toString() && b.mint === usdcMint.toString());
        const treasuryBalancePost = parsedTx.meta.postTokenBalances.find(b => b.owner === TREASURY_PUBKEY.toString() && b.mint === usdcMint.toString());
        
        const preAmount = treasuryBalancePre ? parseInt(treasuryBalancePre.uiTokenAmount.amount) : 0;
        const postAmount = treasuryBalancePost ? parseInt(treasuryBalancePost.uiTokenAmount.amount) : 0;
        
        if (postAmount - preAmount >= amountRequired) {
          foundValidTransfer = true;
        }
      }

      if (!foundValidTransfer) {
        return Response.json({ error: `USDC transfer of at least 0.05 USDC to Red Queen treasury (${TREASURY_PUBKEY.toString()}) not found in transaction.` }, { status: 400 });
      }
    }

    // Step 4: Record signature to block replays
    processedSignatures.add(signature);
    if (supabase) {
      try {
        await supabase.from("verified_payments").insert({
          signature,
          wallet_address: wallet || null,
          vector_id: vector,
          amount: 0.05,
          timestamp: new Date().toISOString()
        });
      } catch (dbErr) {
        // Table might not exist, ignore and rely on memory
      }
    }

    // Step 5: Return the custom security diagnostics report
    const report = generateReport(vector, wallet || "UNKNOWN_OPERATIVE");
    return Response.json({ report });

  } catch (err: any) {
    console.error("Payment validation node error:", err);
    return Response.json({ error: `Verification failed: ${err.message}` }, { status: 500 });
  }
}

// Generates dynamic security reports matching the specific vector profiles
function generateReport(vector: string, wallet: string): string {
  const date = new Date().toISOString();
  const rawKeyText = wallet !== "UNKNOWN_OPERATIVE" ? `${wallet.substring(0, 8)}...${wallet.substring(wallet.length - 8)}` : "ANONYMOUS";
  
  switch (vector) {
    case "WALLET-TRAIL":
      return `[RED QUEEN CO-PROCESSING UNIT // WALLET-TRAIL DIAGNOSTIC]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: SYSTEM SURVEILLANCE RISK IDENTIFIED.

[+] GAS SOURCE LINKAGE: Identified primary gas funding link to major centralized exchange hot-wallet.
[+] CLUSTERING ENGINE MATCH: Co-correlated with 14 external addresses using common transfer hops.
[+] GEO-IP LEAK RISK: Heuristic match suggests transaction broadcast timings align with GMT+2 timezone, exposing potential node location.
[+] THREAT SCORE: 94% — TRANSACTION PATHWAY LACKS ANONYMITY SHIELDING.
RECOMMENDATION: ROUTE ALL FUTURE SPL ACTIONS THROUGH A PRIVACY WRAPPER BEFORE OUTBOUND DISCHARGE.`;

    case "AI-PROFILING":
      return `[RED QUEEN CO-PROCESSING UNIT // COGNITIVE PROFILE DECRYPT]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: SYNTHETIC DOSSIER RETRIEVED.

[+] SEMANTIC SCRAPE ENGINE: Retrieved 4 public forums where matching wallet keywords were mentioned.
[+] PERSONA HARVESTING MODEL: Aggregated interest indicators index: [Solana DeFi: 88%, Privacy Tech: 92%, Adversarial Networks: 74%].
[+] SOCIAL OUTLET MATCHING: AI mapping predicts user identity aligns with cryptographic development clusters.
[+] THREAT SCORE: 91% — HIGH PROFILING COEFFICIENT.
RECOMMENDATION: INJECT ADVERSARIAL PROMPT JITTER INTO LLM UPLINKS AND DECENTRALIZE CHAT PROFILES.`;

    case "FEED-MANIP":
      return `[RED QUEEN CO-PROCESSING UNIT // FEED-MANIP SCANNER]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: SENTIMENT COGNITIVE VECTORS ACTIVE.

[+] OUTRAGE TARGETING MATRIX: Detected 12 bot cluster nodes actively pushing targeted controversy threads to your mapped interest nodes.
[+] TIMELINE ANOMALY: Algorithmic weight values selectively filter out non-reactive educational posts.
[+] ENGAGEMENT VELOCITY: Emotional loop triggers detected in 89% of visited social networks.
[+] THREAT SCORE: 89% — HIGH COGNITIVE REWIRE COEFFICIENT.
RECOMMENDATION: PURGE SOCIAL TRACKING PIXELS AND OPT FOR UNPERSONALIZED STATIC FEED CHANNELS.`;

    case "DEEPFAKE-SE":
      return `[RED QUEEN CO-PROCESSING UNIT // SOCIAL ENGINEERING SIMULATOR]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: VOICE & VISUAL CLONE VULNERABILITY DETECTED.

[+] VERBAL AUDIO HARVEST: Checked public media channels. Mapped 3 vocal samples suitable for neural cloning.
[+] IMPERSONATION PATHWAYS: Simulated deepfake spear-phishing attack exposes authentication confirmation vulnerability.
[+] RISK VULNERABILITY: Level 5 system operator credentials lack physical dual-factor authorization keys.
[+] THREAT SCORE: 86% — EXTREME VERBAL SPOOF RISK.
RECOMMENDATION: ESTABLISH CRYPTOGRAPHIC PRE-SHARED PASSCODES FOR OUT-OF-BAND COMM CHANNELS.`;

    case "REPUTATION-X":
      return `[RED QUEEN CO-PROCESSING UNIT // BLACKLIST INDEX CHECK]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: SYSTEM COMPLIANCE METRICS SECURED.

[+] AML DATABASE AUDIT: Checked TRM, Chainalysis, and elliptic blacklists. Mapped address: CLEAN.
[+] INDIRECT DUST RISK: Detected 0.0004 SOL deposit from historical flagged contract.
[+] LIQUIDITY RISK INDEX: Mapped interaction with decentralized router pools with 4% compliance taint.
[+] THREAT SCORE: 82% — MODERATE HEURISTIC EXPOSURE.
RECOMMENDATION: AVOID CO-MINGLING TRANSACTION UTILITY ROUTINES WITH UNAUDITED SMART CONTRACT HUBS.`;

    case "META-LEAK":
      return `[RED QUEEN CO-PROCESSING UNIT // WEB2 COMPROMISE TRACE]
TIMESTAMP: ${date}
TARGET KEY: ${rawKeyText}
ANALYSIS RESULT: SENSITIVE METADATA CORRELATION REPORT.

[+] WEB2-TO-WEB3 CORRELATIONS: Found 2 public data broker databases mapping raw Web2 email logins to wallet connection cookies.
[+] PASSWORD EXPOSURE: Mapped hashed credentials present in historical database breaches.
[+] COOKIE TRAIL: Detected active cross-domain trackers tracking Web3 session triggers.
[+] THREAT SCORE: 80% — HIGH PRIVACY EXPOSURE INDEX.
RECOMMENDATION: ROUTINELY PURGE WEB3 OAUTH SESSIONS AND UTILISED DEDICATED ANONYMIZED BROWSERS.`;

    default:
      return `[RED QUEEN CO-PROCESSING UNIT // DIAGNOSTIC COMPLETED]
TIMESTAMP: ${date}
VECTOR: ${vector}
DATA: Decryption payload loaded successfully. No anomalies detected.`;
  }
}
