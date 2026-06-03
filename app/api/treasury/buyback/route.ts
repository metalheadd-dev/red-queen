import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { getWorkingConnection } from "@/lib/solana";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const dynamic = "force-dynamic";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC on Mainnet
const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump"); // $THREAT Token

export async function POST(req: NextRequest) {
  // 1. Authorization Check to prevent public abuse/spam
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  if (cronSecret) {
    if (secretParam !== cronSecret && bearerToken !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid secret key" }, { status: 401 });
    }
  }

  // 2. Validate Private Key Presence
  const privateKeyStr = process.env.TREASURY_PRIVATE_KEY;
  if (!privateKeyStr) {
    return NextResponse.json({ error: "System Error: TREASURY_PRIVATE_KEY is not configured in environment variables" }, { status: 500 });
  }

  let keypair: Keypair;
  try {
    const trimmedKeyStr = privateKeyStr.trim();
    if (trimmedKeyStr.startsWith("[")) {
      keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(trimmedKeyStr)));
    } else if (/^[0-9a-fA-F]{128}$/.test(trimmedKeyStr)) {
      keypair = Keypair.fromSecretKey(Buffer.from(trimmedKeyStr, "hex"));
    } else {
      keypair = Keypair.fromSecretKey(bs58.decode(trimmedKeyStr));
    }
  } catch (err: any) {
    return NextResponse.json({ error: `System Error: Failed to load Keypair: ${err.message || err}` }, { status: 500 });
  }

  const connection = process.env.SOLANA_RPC_URL
    ? new Connection(process.env.SOLANA_RPC_URL, "confirmed")
    : await getWorkingConnection(false);

  try {
    // 3. Fetch Treasury USDC balance securely using ATA address
    const vaultAta = await getAssociatedTokenAddress(USDC_MINT, keypair.publicKey);
    
    let usdcBalanceUi = 0;
    let usdcAmountRaw = "0";
    
    try {
      const bal = await connection.getTokenAccountBalance(vaultAta);
      usdcBalanceUi = bal.value.uiAmount || 0;
      usdcAmountRaw = bal.value.amount;
    } catch (e: any) {
      if (e.message.includes("could not find account") || e.message.includes("Invalid param") || e.message.includes("does not exist")) {
        return NextResponse.json({
          success: false,
          message: "No USDC account found. Treasury balance is 0 USDC.",
          balance: 0
        });
      } else {
        // Fallback to getParsedTokenAccountsByOwner if public RPC fails
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(keypair.publicKey, {
          mint: USDC_MINT,
        });

        if (tokenAccounts.value.length === 0) {
          return NextResponse.json({
            success: false,
            message: "No USDC account found. Treasury balance is 0 USDC.",
            balance: 0
          });
        }

        const tokenAccountInfo = tokenAccounts.value[0].account.data.parsed.info;
        usdcBalanceUi = tokenAccountInfo.tokenAmount.uiAmount || 0;
        usdcAmountRaw = tokenAccountInfo.tokenAmount.amount;
      }
    }

    // Parse minimum USDC for buyback (defaulting to 0.10 USDC)
    const minUsdcStr = searchParams.get("minUsdc") || "0.10";
    const minUsdc = parseFloat(minUsdcStr);

    if (usdcBalanceUi < minUsdc) {
      return NextResponse.json({
        success: false,
        message: `USDC balance (${usdcBalanceUi}) is below the minimum threshold (${minUsdc} USDC) required to trigger buyback.`,
        balance: usdcBalanceUi
      });
    }

    // 4. Request Jupiter Swap Quote (USDC -> $THREAT)
    // slippageBps = 100 is 1.00% slippage
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${USDC_MINT.toBase58()}&outputMint=${THREAT_MINT.toBase58()}&amount=${usdcAmountRaw}&slippageBps=100`;
    const quoteRes = await fetch(quoteUrl);
    if (!quoteRes.ok) {
      const errText = await quoteRes.text();
      return NextResponse.json({ error: `Failed to fetch quote from Jupiter API: ${errText}` }, { status: 502 });
    }
    const quoteData = await quoteRes.json();

    // 5. Construct Jupiter Swap Transaction
    const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: keypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      }),
    });

    if (!swapRes.ok) {
      const errText = await swapRes.text();
      return NextResponse.json({ error: `Failed to construct swap transaction: ${errText}` }, { status: 502 });
    }

    const { swapTransaction } = await swapRes.json();

    // 6. Deserialize and Sign the Versioned Transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([keypair]);

    // 7. Execute transaction on Mainnet
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    // 8. Wait for Blockhash confirmation
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
      },
      "confirmed"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully executed automated buyback of $THREAT.`,
      swappedUsdc: usdcBalanceUi,
      expectedThreatOut: quoteData.outAmount,
      txid,
      explorerUrl: `https://solscan.io/tx/${txid}`,
    });

  } catch (err: any) {
    console.error("Automated buyback execution failed:", err);
    return NextResponse.json({ error: `Execution Failure: ${err.message || err}` }, { status: 500 });
  }
}
