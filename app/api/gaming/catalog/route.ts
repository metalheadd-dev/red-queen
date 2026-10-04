import { getPublishedCatalog } from "@/lib/gaming/catalog-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getPublishedCatalog();
  return Response.json(catalog, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
