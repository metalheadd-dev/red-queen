import "server-only";

type AmazonLocale = {
  marketplace: string;
  tagEnv: string;
};

export type AmazonProductCard = {
  asin: string;
  title: string;
  url: string;
  imageUrl: string | null;
  price: string | null;
  availability: string | null;
  marketplace: string;
  provider: "Amazon Creators API";
};

const PRODUCT_RESOURCES = [
  "images.primary.medium",
  "itemInfo.title",
  "itemInfo.features",
  "offersV2.listings.availability",
  "offersV2.listings.price",
  "offersV2.listings.isBuyBoxWinner",
];

let tokenCache: { value: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;

function localeForArea(area: string): AmazonLocale {
  const value = area.toLowerCase();
  if (/spain|españa|madrid|barcelona|valencia|sevilla/.test(value)) return { marketplace: "www.amazon.es", tagEnv: "AMAZON_ASSOCIATE_TAG_ES" };
  if (/germany|deutschland|berlin|munich|münchen|hamburg/.test(value)) return { marketplace: "www.amazon.de", tagEnv: "AMAZON_ASSOCIATE_TAG_DE" };
  if (/france|paris|lyon|marseille/.test(value)) return { marketplace: "www.amazon.fr", tagEnv: "AMAZON_ASSOCIATE_TAG_FR" };
  if (/italy|italia|rome|roma|milan|milano/.test(value)) return { marketplace: "www.amazon.it", tagEnv: "AMAZON_ASSOCIATE_TAG_IT" };
  if (/united kingdom|\buk\b|london|england|scotland/.test(value)) return { marketplace: "www.amazon.co.uk", tagEnv: "AMAZON_ASSOCIATE_TAG_UK" };
  return { marketplace: "www.amazon.com", tagEnv: "AMAZON_ASSOCIATE_TAG_US" };
}

function credentials() {
  const clientId = process.env.AMAZON_CREATORS_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.AMAZON_CREATORS_CLIENT_SECRET?.trim() || "";
  const version = process.env.AMAZON_CREATORS_CREDENTIAL_VERSION?.trim() || "3.2";
  return { clientId, clientSecret, version };
}

function partnerTag(locale: AmazonLocale) {
  return process.env[locale.tagEnv]?.trim() || process.env.AMAZON_CREATORS_PARTNER_TAG?.trim() || "";
}

export function amazonCreatorsReadiness(area = "") {
  const locale = localeForArea(area);
  const auth = credentials();
  const tag = partnerTag(locale);
  return {
    ready: Boolean(auth.clientId && auth.clientSecret && tag),
    credentialsConfigured: Boolean(auth.clientId && auth.clientSecret),
    partnerTagConfigured: Boolean(tag),
    marketplace: locale.marketplace,
  };
}

function tokenEndpoint(version: string) {
  if (version === "3.1") return "https://api.amazon.com/auth/o2/token";
  if (version === "3.3") return "https://api.amazon.co.jp/auth/o2/token";
  return "https://api.amazon.co.uk/auth/o2/token";
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    const auth = credentials();
    if (!auth.clientId || !auth.clientSecret) throw new Error("Amazon Creators API credentials are not configured.");
    const response = await fetch(tokenEndpoint(auth.version), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        scope: "creatorsapi::default",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Amazon authentication returned HTTP ${response.status}.`);
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    if (!payload.access_token) throw new Error("Amazon authentication returned no access token.");
    tokenCache = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max(300, Number(payload.expires_in) || 3_600) * 1_000,
    };
    return tokenCache.value;
  })();
  try { return await tokenRequest; }
  finally { tokenRequest = null; }
}

function displayValue(value: any) {
  if (typeof value === "string") return value;
  if (typeof value?.displayValue === "string") return value.displayValue;
  if (typeof value?.displayAmount === "string") return value.displayAmount;
  return null;
}

function safeAmazonUrl(value: unknown, marketplace: string) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === marketplace || url.hostname.endsWith(".amazon.com")) ? url.toString() : null;
  } catch { return null; }
}

function safeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const allowed = url.hostname === "m.media-amazon.com" || url.hostname.endsWith("ssl-images-amazon.com");
    return url.protocol === "https:" && allowed ? url.toString() : null;
  } catch { return null; }
}

function normalizeProduct(item: any, marketplace: string): AmazonProductCard | null {
  const asin = typeof item?.asin === "string" ? item.asin : "";
  const url = safeAmazonUrl(item?.detailPageURL, marketplace);
  const title = displayValue(item?.itemInfo?.title);
  if (!asin || !url || !title) return null;
  const listing = item?.offersV2?.listings?.[0] || item?.offers?.listings?.[0];
  const price = displayValue(listing?.price?.money) || displayValue(listing?.price) || null;
  const availability = displayValue(listing?.availability?.message)
    || displayValue(listing?.availability?.type)
    || null;
  return {
    asin,
    title: title.slice(0, 180),
    url,
    imageUrl: safeImageUrl(item?.images?.primary?.medium?.url),
    price,
    availability,
    marketplace,
    provider: "Amazon Creators API",
  };
}

export async function searchAmazonProduct(query: string, area: string) {
  const locale = localeForArea(area);
  const tag = partnerTag(locale);
  if (!amazonCreatorsReadiness(area).ready || !query.trim()) return null;
  const token = await accessToken();
  const response = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-marketplace": locale.marketplace,
    },
    body: JSON.stringify({
      marketplace: locale.marketplace,
      partnerTag: tag,
      keywords: query.trim().slice(0, 180),
      searchIndex: "All",
      availability: "Available",
      itemCount: 3,
      resources: PRODUCT_RESOURCES,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Amazon SearchItems returned HTTP ${response.status}.`);
  const payload = await response.json() as any;
  const items = Array.isArray(payload?.searchResult?.items) ? payload.searchResult.items : [];
  return items.map((item: any) => normalizeProduct(item, locale.marketplace)).find(Boolean) || null;
}
