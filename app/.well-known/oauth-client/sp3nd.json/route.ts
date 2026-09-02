import { SP3ND_CLIENT_METADATA_URL, SP3ND_REDIRECT_URI } from "@/lib/sp3nd-mcp";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    client_id: SP3ND_CLIENT_METADATA_URL,
    client_name: "RED QUEEN Survival Commerce",
    client_uri: "https://redqueen.space/onchain#sp3nd-checkout",
    logo_uri: "https://redqueen.space/logo.png",
    redirect_uris: [SP3ND_REDIRECT_URI],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "openid profile offline_access",
  }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
