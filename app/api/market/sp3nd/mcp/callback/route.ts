import { NextRequest, NextResponse } from "next/server";
import {
  exchangeSp3ndCode,
  openSp3ndValue,
  RED_QUEEN_ORIGIN,
  sealSp3ndValue,
  SP3ND_SESSION_COOKIE,
  SP3ND_STATE_COOKIE,
  type Sp3ndOAuthState,
} from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

function failure(message: string) {
  const url = new URL("/onchain", RED_QUEEN_ORIGIN);
  url.searchParams.set("sp3ndError", message.slice(0, 180));
  url.hash = "sp3nd-checkout";
  const response = NextResponse.redirect(url);
  response.cookies.delete(SP3ND_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) return failure(url.searchParams.get("error_description") || error);

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const saved = openSp3ndValue<Sp3ndOAuthState>(request.cookies.get(SP3ND_STATE_COOKIE)?.value);
  if (!code || !saved || saved.expiresAt < Date.now() || saved.state !== state) {
    return failure("SP3ND OAuth state expired. Start the connection again.");
  }

  try {
    const tokens = await exchangeSp3ndCode(code, saved.verifier);
    const destination = new URL(saved.returnTo, RED_QUEEN_ORIGIN);
    destination.searchParams.set("sp3nd", "connected");
    const response = NextResponse.redirect(destination);
    response.cookies.delete(SP3ND_STATE_COOKIE);
    response.cookies.set(SP3ND_SESSION_COOKIE, sealSp3ndValue(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (reason) {
    return failure(reason instanceof Error ? reason.message : "SP3ND OAuth failed.");
  }
}
