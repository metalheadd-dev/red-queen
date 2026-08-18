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

interface PhotonResult {
  features?: Array<{
    bbox?: number[];
    geometry?: { coordinates?: number[] };
    properties?: {
      name?: string;
      city?: string;
      state?: string;
      country?: string;
      type?: string;
      osm_value?: string;
    };
  }>;
}

interface ResolvedArea {
  label: string;
  lat: number;
  lng: number;
  type: string;
  boundingBox: number[] | null;
  source: string;
}

function parseCoordinate(value: unknown, min: number, max: number) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
}

async function resolveWithNominatim(query: string): Promise<ResolvedArea | null> {
  const baseUrl = process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
  const endpoint = new URL("/search", baseUrl);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("layer", "address");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": process.env.GEOCODING_USER_AGENT || "RED-QUEEN-Survival-Intelligence/1.0 (https://redqueen.space)",
    },
    next: { revalidate: 2_592_000 },
    signal: AbortSignal.timeout(4_500),
  });
  if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

  const results = await response.json() as NominatimResult[];
  const result = results[0];
  const lat = parseCoordinate(result?.lat, -90, 90);
  const lng = parseCoordinate(result?.lon, -180, 180);
  if (lat === null || lng === null) return null;

  return {
    label: sanitizeArea(result.display_name || query),
    lat,
    lng,
    type: result.addresstype || result.type || "place",
    boundingBox: Array.isArray(result.boundingbox) ? result.boundingbox.map(Number) : null,
    source: "OpenStreetMap Nominatim",
  };
}

async function resolveWithPhoton(query: string): Promise<ResolvedArea | null> {
  const baseUrl = process.env.PHOTON_GEOCODING_BASE_URL || "https://photon.komoot.io";
  const endpoint = new URL("/api", baseUrl);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.append("layer", "city");
  endpoint.searchParams.append("layer", "locality");
  endpoint.searchParams.append("layer", "state");
  endpoint.searchParams.append("layer", "country");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/geo+json, application/json",
      "User-Agent": process.env.GEOCODING_USER_AGENT || "RED-QUEEN-Survival-Intelligence/1.0 (https://redqueen.space)",
    },
    next: { revalidate: 2_592_000 },
    signal: AbortSignal.timeout(4_500),
  });
  if (!response.ok) throw new Error(`Photon returned ${response.status}`);

  const result = await response.json() as PhotonResult;
  const feature = result.features?.[0];
  const lng = parseCoordinate(feature?.geometry?.coordinates?.[0], -180, 180);
  const lat = parseCoordinate(feature?.geometry?.coordinates?.[1], -90, 90);
  if (lat === null || lng === null) return null;

  const properties = feature?.properties || {};
  const label = [properties.name || properties.city, properties.state, properties.country]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join(", ");

  return {
    label: sanitizeArea(label || query),
    lat,
    lng,
    type: properties.type || properties.osm_value || "place",
    boundingBox: Array.isArray(feature?.bbox) ? feature.bbox.map(Number) : null,
    source: "OpenStreetMap via Photon",
  };
}

export async function GET(request: Request) {
  const query = sanitizeArea(new URL(request.url).searchParams.get("q") || "");
  if (query.length < 2) {
    return Response.json({ error: "Enter a broad city or region." }, { status: 400 });
  }

  const providers = [resolveWithNominatim, resolveWithPhoton];
  for (const provider of providers) {
    try {
      const area = await provider(query);
      if (!area) continue;
      return Response.json({
        query,
        ...area,
        attribution: "© OpenStreetMap contributors",
        precision: "BROAD_AREA",
      }, {
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800" },
      });
    } catch (error) {
      console.warn(`Broad-area geocoder ${provider.name} unavailable:`, error);
    }
  }

  return Response.json({
    error: "Area lookup is temporarily unavailable. Try again shortly or keep the global view.",
  }, { status: 503 });
}
