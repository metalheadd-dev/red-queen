import "server-only";

import { sanitizeArea, SurvivalFocus } from "@/lib/survival-context";

export type SurvivalKitInput = {
  area: string;
  focus: SurvivalFocus;
  people: number;
  constraints: string;
};

export type SurvivalKitItem = {
  id: string;
  category: string;
  name: string;
  quantity: string;
  priority: "ESSENTIAL" | "CONTEXTUAL";
  why: string;
  searchQuery: string;
  cautions?: string;
};

export type SurvivalKit = ReturnType<typeof buildSurvivalKit>;

const VALID_FOCUS: SurvivalFocus[] = ["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"];

export function parseSurvivalKitInput(value: unknown): SurvivalKitInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const area = sanitizeArea(typeof body.area === "string" ? body.area : "");
  const focus = typeof body.focus === "string" && VALID_FOCUS.includes(body.focus as SurvivalFocus)
    ? body.focus as SurvivalFocus
    : "HOUSEHOLD";
  const count = Number(body.people);
  const people = Number.isFinite(count) ? Math.min(12, Math.max(1, Math.round(count))) : 1;
  const constraints = typeof body.constraints === "string"
    ? body.constraints.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 320)
    : "";
  if (!area) return null;
  return { area, focus, people, constraints };
}

function item(id: string, category: string, name: string, quantity: string, why: string, searchQuery: string, priority: SurvivalKitItem["priority"] = "ESSENTIAL", cautions?: string): SurvivalKitItem {
  return { id, category, name, quantity, why, searchQuery, priority, cautions };
}

function defaultAmazonBase(area: string) {
  const normalized = area.toLowerCase();
  if (/spain|españa|madrid|barcelona|valencia|sevilla/.test(normalized)) return "https://www.amazon.es/s";
  if (/germany|deutschland|berlin|munich|münchen|hamburg/.test(normalized)) return "https://www.amazon.de/s";
  if (/france|paris|lyon|marseille/.test(normalized)) return "https://www.amazon.fr/s";
  if (/italy|italia|rome|roma|milan|milano/.test(normalized)) return "https://www.amazon.it/s";
  if (/united kingdom|\buk\b|london|england|scotland/.test(normalized)) return "https://www.amazon.co.uk/s";
  return "https://www.amazon.com/s";
}

export function buildAmazonSearchUrl(baseUrl: string, query: string) {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("k", query);
    return url.toString();
  } catch {
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  }
}

export function buildSurvivalKit(input: SurvivalKitInput) {
  const waterLitres = input.people * 3 * 3;
  const meals = input.people * 3 * 3;
  const lowerConstraints = input.constraints.toLowerCase();
  const items: SurvivalKitItem[] = [
    item("water", "WATER", "Sealed drinking water", `${waterLitres} litres minimum`, "A practical 72-hour baseline of 3 litres per person per day.", "sealed emergency drinking water"),
    item("food", "FOOD", "Shelf-stable food", `${meals} simple servings`, "Meals that require little water, fuel or refrigeration.", "72 hour emergency food kit"),
    item("light", "POWER", "LED lights and spare batteries", "1 light per person + batteries", "Safe lighting reduces falls and preserves phone power.", "battery LED emergency lantern"),
    item("power", "POWER", "USB power bank", `${Math.max(1, Math.ceil(input.people / 2))} unit(s)`, "Keeps communication devices available during a short outage.", "reliable USB C power bank emergency"),
    item("radio", "COMMUNICATION", "Battery or hand-crank radio", "1 household unit", "Provides official instructions when mobile data is unavailable.", "emergency hand crank radio"),
    item("first-aid", "MEDICAL", "Basic first-aid kit", "1 household kit", "Supports minor injury care while professional help is delayed.", "certified home first aid kit", "ESSENTIAL", "Does not replace prescribed medication or professional medical care."),
    item("hygiene", "HYGIENE", "Hygiene and sanitation supplies", "72-hour household set", "Supports hand hygiene and safe waste handling when utilities fail.", "emergency hygiene sanitation kit"),
    item("documents", "DOCUMENTS", "Water-resistant document pouch", "1 household pouch", "Protects copies of IDs, contacts and essential instructions.", "waterproof document pouch emergency"),
  ];

  if (input.focus === "BLACKOUT") {
    items.push(item("cooking", "POWER", "Safe no-flame meal option", "72-hour supply", "Avoids unsafe indoor combustion during an outage.", "no cook emergency meals", "CONTEXTUAL", "Never use outdoor combustion equipment indoors."));
  }
  if (input.focus === "HEALTH") {
    items.push(item("respirators", "HEALTH", "Certified particulate respirators", `${input.people * 3} units`, "Useful only when official guidance identifies smoke, dust or airborne-particle exposure.", "certified FFP2 N95 respirator", "CONTEXTUAL", "Follow local public-health guidance and fit instructions."));
  }
  if (input.focus === "DIGITAL_SECURITY") {
    items.push(item("security-key", "DIGITAL", "Hardware security key", "2 keys", "Supports phishing-resistant recovery when configured before an incident.", "FIDO2 hardware security key", "CONTEXTUAL"));
  }
  if (/dog|cat|pet|animal/.test(lowerConstraints)) {
    items.push(item("pet", "DEPENDENTS", "Pet food and water reserve", "72 hours per animal", "Dependent animals need their own protected reserve.", "72 hour pet emergency kit", "CONTEXTUAL"));
  }
  if (/baby|infant|child|toddler/.test(lowerConstraints)) {
    items.push(item("child", "DEPENDENTS", "Age-appropriate child supplies", "72-hour set", "Food, hygiene and comfort needs must be sized for the child.", "child emergency preparedness supplies", "CONTEXTUAL"));
  }
  if (/wheelchair|mobility|disability|accessible|hearing/.test(lowerConstraints)) {
    items.push(item("accessibility", "ACCESSIBILITY", "Accessibility backup supplies", "One tested backup set", "Preserves the specific device, battery or communication support named in your plan.", "accessible emergency preparedness supplies", "CONTEXTUAL"));
  }

  const amazonBase = process.env.SURVIVAL_MARKET_AMAZON_BASE_URL?.trim() || defaultAmazonBase(input.area);
  const x402Market = process.env.X402_MARKET_BASE_URL?.trim() || "https://x402-market.com/shop";
  return {
    title: `72-hour survival kit · ${input.area}`,
    generatedAt: new Date().toISOString(),
    area: input.area,
    focus: input.focus,
    people: input.people,
    constraints: input.constraints,
    items,
    suppliers: {
      x402Market: { name: "x402 Market", url: x402Market, rail: "Agent-readable catalog · PYUSD checkout · separate approval" },
      amazon: { name: "Amazon search", url: amazonBase, rail: "External retailer · checkout stays outside RED QUEEN" },
    },
    checkoutStatus: "CART_PREVIEW_ONLY",
    checkoutBoundary: "RED QUEEN prepared search-ready items. She has not reserved inventory, selected a seller, transmitted a delivery address or moved funds. Every supplier and final checkout requires a separate user review.",
  };
}
