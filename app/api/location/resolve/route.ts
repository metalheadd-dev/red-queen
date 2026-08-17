import { sanitizeArea } from "@/lib/survival-context";

export const dynamic = "force-dynamic";

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  boundingbox?: string[];
  type?: string;
  addresstype?: string;
}

function parseCoordinate(value: string | undefined, min: number, max: number) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
}

export async function GET(request: Request) {
  const query = sanitizeArea(new URL(request.url).searchParams.get("q") || "");
  if (query.length < 2) {
    return Response.json({ error: "Enter a broad city or region." }, { status: 400 });
  }

  const baseUrl = process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
  const endpoint = new URL("/search", baseUrl);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("layer", "address");
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": process.env.GEOCODING_USER_AGENT || "RED-QUEEN-Survival-Intelligence/1.0 (https://redqueen.space)",
      },
      next: { revalidate: 2_592_000 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = await response.json() as NominatimResult[];
    const result = results[0];
    const lat = parseCoordinate(result?.lat, -90, 90);
    const lng = parseCoordinate(result?.lon, -180, 180);
    if (lat === null || lng === null) {
      return Response.json({ error: "Broad area could not be resolved. Try city and country." }, { status: 404 });
    }

    return Response.json({
      query,
      label: sanitizeArea(result.display_name || query),
      lat,
      lng,
      type: result.addresstype || result.type || "place",
      boundingBox: Array.isArray(result.boundingbox) ? result.boundingbox.map(Number) : null,
      source: "OpenStreetMap Nominatim",
      attribution: "© OpenStreetMap contributors",
      precision: "BROAD_AREA",
    }, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.warn("Broad-area geocoding unavailable:", error);
    return Response.json({
      error: "Area lookup is temporarily unavailable. Global intelligence remains available.",
    }, { status: 503 });
  }
}
