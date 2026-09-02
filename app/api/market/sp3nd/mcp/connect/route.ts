import { NextResponse } from "next/server";
import {
  createSp3ndAuthorization,
  safeSp3ndReturnTo,
  sealSp3ndValue,
  SP3ND_STATE_COOKIE,
} from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const returnTo = safeSp3ndReturnTo(new URL(request.url).searchParams.get("returnTo"));
  const authorization = createSp3ndAuthorization(returnTo);
  const response = NextResponse.redirect(authorization.authorizationUrl);
  response.cookies.set(SP3ND_STATE_COOKIE, sealSp3ndValue(authorization.state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
