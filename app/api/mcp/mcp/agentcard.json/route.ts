import { buildRedQueenMcpDiscovery } from "@/lib/mcp-discovery";

export const dynamic = "force-dynamic";

// Compatibility fallback used by 8004 capability crawlers when a stateless
// tools/list probe is attempted without an MCP initialization handshake.
export async function GET() {
  return Response.json(buildRedQueenMcpDiscovery(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
