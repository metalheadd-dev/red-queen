import { facilitator } from "@payai/facilitator";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";

// Fallback to PayAI's default facilitator endpoint if not configured
const facilitatorUrl = process.env.PAYAI_FACILITATOR_URL || "https://facilitator.payai.network";

const config = {
  ...facilitator,
  url: facilitatorUrl,
};

const facilitatorClient = new HTTPFacilitatorClient(config);

export const x402Server = new x402ResourceServer(facilitatorClient);
registerExactSvmScheme(x402Server);
