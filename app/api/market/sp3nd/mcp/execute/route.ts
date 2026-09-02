import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  callSp3ndMcpTool,
  listSp3ndMcpTools,
  openSp3ndValue,
  readSp3ndTokens,
  RED_QUEEN_ORIGIN,
  sp3ndProposalFingerprint,
  SP3ND_PROPOSAL_COOKIE,
  SP3ND_SESSION_COOKIE,
} from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

type Proposal = {
  toolName: string;
  args: Record<string, unknown>;
  intent: "quote" | "order" | "checkout" | "status";
  expiresAt: number;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production" && origin !== RED_QUEEN_ORIGIN) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (body.ownerAuthorized !== true) {
    return NextResponse.json({ error: "Explicit owner approval is required for this SP3ND call." }, { status: 409 });
  }
  const sealedProposal = typeof body.proposal === "string" ? body.proposal : "";
  const proposal = openSp3ndValue<Proposal>(sealedProposal);
  if (!proposal || proposal.expiresAt <= Date.now()) {
    return NextResponse.json({ error: "The SP3ND proposal expired. Prepare a new one." }, { status: 409 });
  }

  const cookieStore = await cookies();
  const expectedFingerprint = cookieStore.get(SP3ND_PROPOSAL_COOKIE)?.value;
  if (!expectedFingerprint || expectedFingerprint !== sp3ndProposalFingerprint(sealedProposal)) {
    return NextResponse.json({ error: "This SP3ND proposal was already used or replaced. Prepare a new one." }, { status: 409 });
  }
  const tokens = readSp3ndTokens(cookieStore.get(SP3ND_SESSION_COOKIE)?.value);
  if (!tokens || tokens.expiresAt <= Date.now()) {
    return NextResponse.json({ error: "Connect SP3ND MCP first.", connectRequired: true }, { status: 401 });
  }

  try {
    const tools = await listSp3ndMcpTools(tokens.accessToken);
    if (!tools.some((tool) => tool.name === proposal.toolName)) {
      const response = NextResponse.json({ error: "The proposed SP3ND tool is no longer advertised." }, { status: 409 });
      response.cookies.delete(SP3ND_PROPOSAL_COOKIE);
      return response;
    }
    const result = await callSp3ndMcpTool(tokens.accessToken, proposal.toolName, proposal.args);
    const response = NextResponse.json({ provider: "SP3ND MCP", intent: proposal.intent, toolName: proposal.toolName, result });
    response.cookies.delete(SP3ND_PROPOSAL_COOKIE);
    return response;
  } catch (reason) {
    const response = NextResponse.json({ error: reason instanceof Error ? reason.message : "SP3ND MCP call failed. Check status before trying again." }, { status: 502 });
    response.cookies.delete(SP3ND_PROPOSAL_COOKIE);
    return response;
  }
}
