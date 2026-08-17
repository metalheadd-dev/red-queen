import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";
import { Connection } from "@solana/web3.js";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const handler = async (_req: NextRequest) => {
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const [voteAccounts, epochInfo, feeMetrics, supplyInfo, inflationRate, perfSamples] = await Promise.all([
      connection.getVoteAccounts(),
      connection.getEpochInfo(),
      connection.getRecentPrioritizationFees().catch(() => null),
      connection.getSupply().catch(() => null),
      connection.getInflationRate().catch(() => null),
      connection.getRecentPerformanceSamples(1).catch(() => null),
    ]);

    const currentValidatorCount = voteAccounts.current.length;
    const delinquentValidatorCount = voteAccounts.delinquent.length;
    const totalVoteAccounts = currentValidatorCount + delinquentValidatorCount;
    const delinquentShare = totalVoteAccounts > 0
      ? Number(((delinquentValidatorCount / totalVoteAccounts) * 100).toFixed(2))
      : 0;
    const averagePriorityFee = feeMetrics && feeMetrics.length > 0
      ? Math.round(feeMetrics.reduce((sum, item) => sum + item.prioritizationFee, 0) / feeMetrics.length)
      : null;
    const performanceSample = perfSamples?.[0] || null;
    const sampledTps = performanceSample && performanceSample.samplePeriodSecs > 0
      ? Math.round(performanceSample.numTransactions / performanceSample.samplePeriodSecs)
      : null;

    const topCurrentValidators = [...voteAccounts.current]
      .sort((a, b) => b.activatedStake - a.activatedStake)
      .slice(0, 5)
      .map((validator) => ({
        votePubkey: validator.votePubkey,
        activatedStakeSol: Math.round(validator.activatedStake / 1e9),
        commission: validator.commission,
        lastVote: validator.lastVote,
      }));

    const delinquentVoteAccounts = voteAccounts.delinquent.slice(0, 5).map((validator) => ({
      votePubkey: validator.votePubkey,
      activatedStakeSol: Math.round(validator.activatedStake / 1e9),
      commission: validator.commission,
      lastVote: validator.lastVote,
    }));

    const sourceStatus = [
      { metric: "Vote accounts", status: "LIVE", source: "getVoteAccounts" },
      { metric: "Epoch and slot", status: "LIVE", source: "getEpochInfo" },
      { metric: "Priority fee sample", status: feeMetrics ? "LIVE" : "UNAVAILABLE", source: "getRecentPrioritizationFees" },
      { metric: "Performance sample", status: performanceSample ? "LIVE" : "UNAVAILABLE", source: "getRecentPerformanceSamples" },
      { metric: "Supply", status: supplyInfo ? "LIVE" : "UNAVAILABLE", source: "getSupply" },
      { metric: "Inflation", status: inflationRate ? "LIVE" : "UNAVAILABLE", source: "getInflationRate" },
    ];
    const liveMetricCount = sourceStatus.filter((item) => item.status === "LIVE").length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clearance: "PAID OUTPUT // x402 SETTLED",
      network: {
        name: "Solana Mainnet",
        commitment: "confirmed",
        rpcHost: new URL(rpcUrl).host,
        sourceCoverage: `${liveMetricCount}/${sourceStatus.length} RPC METRICS LIVE`,
        sourceStatus,
        voteAccounts: {
          current: currentValidatorCount,
          delinquent: delinquentValidatorCount,
          total: totalVoteAccounts,
          delinquentShare,
        },
        epoch: {
          number: epochInfo.epoch,
          absoluteSlot: epochInfo.absoluteSlot,
          progress: Number(((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(1)),
        },
        fees: {
          averageRecentPriorityFeeMicroLamports: averagePriorityFee,
          sampleSize: feeMetrics?.length || 0,
        },
        performance: {
          sampledTransactionsPerSecond: sampledTps,
          samplePeriodSeconds: performanceSample?.samplePeriodSecs || null,
          sampledTransactions: performanceSample?.numTransactions || null,
        },
        supply: supplyInfo ? {
          circulatingSol: Math.round(supplyInfo.value.circulating / 1e9),
          totalSol: Math.round(supplyInfo.value.total / 1e9),
          nonCirculatingShare: Number(((supplyInfo.value.nonCirculating / supplyInfo.value.total) * 100).toFixed(1)),
        } : null,
        inflation: inflationRate ? {
          totalPercent: Number((inflationRate.total * 100).toFixed(2)),
          validatorPercent: Number((inflationRate.validator * 100).toFixed(2)),
        } : null,
        topCurrentValidators,
        delinquentVoteAccounts,
        assessment: delinquentValidatorCount > 0
          ? `${delinquentValidatorCount} of ${totalVoteAccounts} vote accounts are currently reported as delinquent by this RPC snapshot. Delinquent does not by itself mean compromised.`
          : "This RPC snapshot reported no delinquent vote accounts.",
        nextAction: "Use this snapshot to time a non-urgent transaction or investigate RPC conditions; verify the final fee and transaction details in your wallet before signing.",
      },
    });
  } catch (error) {
    console.error("Solana network health snapshot failed:", error);
    return NextResponse.json({
      success: false,
      error: "Required Solana RPC telemetry is temporarily unavailable. No paid snapshot was generated.",
      sourceStatus: "UNAVAILABLE",
      syntheticData: false,
    }, { status: 503 });
  }
};

export const GET = withFriendlyX402(
  handler,
  {
    productId: "solana-network-health",
    accepts: {
      scheme: "exact",
      price: "$0.02",
      network,
      payTo: svmAddress,
    },
    description: "Source-backed Solana mainnet validator, epoch, fee, performance, supply, and inflation snapshot.",
  },
);
