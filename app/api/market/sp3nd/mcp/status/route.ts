import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  listSp3ndMcpTools,
  readSp3ndTokens,
  refreshSp3ndTokens,
  sealSp3ndValue,
  SP3ND_SESSION_COOKIE,
} from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  let tokens = readSp3ndTokens(cookieStore.get(SP3ND_SESSION_COOKIE)?.value);
  if (!tokens) return NextResponse.json({ connected: false, provider: "SP3ND MCP", apiKeysRequired: false });

  try {
    let refreshed = false;
    if (tokens.expiresAt < Date.now() + 60_000) {
      tokens = await refreshSp3ndTokens(tokens);
      refreshed = true;
    }
    const tools = await listSp3ndMcpTools(tokens.accessToken);
    const response = NextResponse.json({
      connected: true,
      provider: "SP3ND MCP",
      apiKeysRequired: false,
      toolCount: tools.length,
      tools: tools.map((tool) => ({ name: tool.name, description: tool.description || "" })),
    });
    if (refreshed) {
      response.cookies.set(SP3ND_SESSION_COOKIE, sealSp3ndValue(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    return response;
  } catch (reason) {
    const response = NextResponse.json({
      connected: false,
      provider: "SP3ND MCP",
      apiKeysRequired: false,
      error: reason instanceof Error && reason.message !== "SP3ND_SESSION_EXPIRED"
        ? reason.message
        : "SP3ND connection expired. Connect the wallet again.",
    });
    response.cookies.delete(SP3ND_SESSION_COOKIE);
    return response;
  }
}
