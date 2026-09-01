import type { Metadata } from "next";
import AgentWalletBinding from "@/components/AgentWalletBinding";
import {
  getRedQueenAgentIdentity,
  RED_QUEEN_AGENT_REGISTRY_PROGRAM,
} from "@/lib/agent-registry";

export const metadata: Metadata = {
  title: "Owner Wallet Control | RED QUEEN",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OwnerWalletControlPage() {
  const identity = getRedQueenAgentIdentity();

  return (
    <div className="onchain-page">
      <div className="container onchain-main">
        <section className="onchain-safety">
          <div>
            <span>OWNER CONTROL // UNLISTED</span>
            <h1>RED QUEEN operational wallet.</h1>
            <p>This route is intentionally absent from public navigation. On-chain ownership checks still protect every binding operation.</p>
          </div>
        </section>

        {identity.registered ? (
          <AgentWalletBinding
            owner={identity.owner}
            asset={identity.asset}
            program={RED_QUEEN_AGENT_REGISTRY_PROGRAM}
          />
        ) : (
          <section className="onchain-safety">
            <div>
              <span>UNAVAILABLE</span>
              <h2>The Agent Asset is not registered.</h2>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
