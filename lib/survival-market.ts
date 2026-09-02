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
    items.push(
      item("cooking", "POWER", "Safe no-flame meal option", "72-hour supply", "Avoids unsafe indoor combustion during an outage.", "no cook emergency meals", "CONTEXTUAL", "Never use outdoor combustion equipment indoors."),
      item("headlamps", "POWER", "LED headlamps", `${input.people} unit(s)`, "Hands-free lighting is safer for stairs, repairs and household checks.", "reliable LED headlamp batteries", "ESSENTIAL"),
      item("thermal-blankets", "SHELTER", "Insulated emergency blankets", `${input.people} unit(s)`, "Supports basic warmth when heating and power are unavailable.", "reusable insulated emergency blanket", "CONTEXTUAL"),
    );
  }
  if (input.focus === "HEALTH") {
    items.push(
      item("respirators", "HEALTH", "Certified particulate respirators", `${input.people * 3} units`, "Useful only when official guidance identifies smoke, dust or airborne-particle exposure.", "certified FFP2 N95 respirator", "CONTEXTUAL", "Follow local public-health guidance and fit instructions."),
      item("thermometer", "HEALTH", "Digital thermometer", "1 household unit", "Provides an objective measurement to share with a clinician or public-health service.", "reliable digital thermometer", "ESSENTIAL", "A reading is context, not a diagnosis."),
      item("surface-cleaning", "HYGIENE", "Labeled cleaning and disinfection supplies", "72-hour household set", "Supports routine hygiene when an outbreak or contamination concern is confirmed.", "household disinfectant cleaning supplies", "CONTEXTUAL", "Never mix cleaning chemicals; follow the product label and ventilation instructions."),
    );
  }
  if (input.focus === "DIGITAL_SECURITY") {
    items.push(item("security-key", "DIGITAL", "Hardware security key", "2 keys", "Supports phishing-resistant recovery when configured before an incident.", "FIDO2 hardware security key", "CONTEXTUAL"));
  }
  if (/(?:zomb|зомб|undead|апокаліп)/.test(lowerConstraints)) {
    items.push(
      item("protective-workwear", "PROTECTION", "Heavy-duty workwear", `${input.people} complete set(s)`, "Durable long sleeves and trousers reduce cuts, scrapes and exposure during debris-heavy movement.", "heavy duty durable workwear jacket trousers", "ESSENTIAL", "Protective clothing reduces ordinary injury risk; it does not make dangerous confrontation safe."),
      item("work-boots", "PROTECTION", "Safety work boots", `${input.people} pair(s)`, "Ankle support, durable soles and toe protection matter when routes contain broken glass or debris.", "waterproof safety work boots puncture resistant sole", "ESSENTIAL"),
      item("work-gloves", "PROTECTION", "Cut-resistant work gloves", `${input.people} pair(s)`, "Protects hands during cleanup, repairs and emergency movement.", "cut resistant puncture resistant work gloves", "ESSENTIAL"),
      item("eye-protection", "PROTECTION", "Sealed safety goggles", `${input.people} pair(s)`, "Reduces eye injury from dust and fragments during repairs or evacuation.", "sealed anti fog safety goggles", "ESSENTIAL"),
      item("shelter-tools", "TOOLS", "Shelter repair tool set", "1 household set", "A claw hammer, pry bar, fasteners, tape and compact hand tools support emergency repairs and a blocked exit.", "emergency shelter repair tool kit claw hammer pry bar", "CONTEXTUAL", "Use only as tools. Avoid confrontation and leave unsafe structures when authorities advise evacuation."),
      item("camp-hatchet", "TOOLS", "Compact camp hatchet", "1 household tool", "Useful for firewood and campsite utility if evacuation reaches an appropriate outdoor setting.", "compact camping hatchet with sheath", "CONTEXTUAL", "Store sheathed and inaccessible to children; use only for lawful utility work, never confrontation."),
      item("door-reinforcement", "SHELTER", "Non-destructive door reinforcement", "1 set per primary door", "A portable brace and basic repair hardware can improve shelter integrity without improvised traps.", "portable door security brace reinforcement", "CONTEXTUAL", "Keep every emergency exit immediately releasable from inside."),
    );
  }
  if (/(?:mosquit|комар|mosquito-borne|денг|malaria|маляр)/.test(lowerConstraints)) {
    items.push(
      item("insect-repellent", "VECTOR CONTROL", "Registered insect repellent", `${input.people} personal bottle(s)`, "Picaridin or DEET products can reduce mosquito bites when used exactly as labeled.", "picaridin DEET mosquito repellent registered", "ESSENTIAL", "Follow the product label, age restrictions and local public-health guidance."),
      item("mosquito-clothing", "PROTECTION", "Light long-sleeve protective clothing", `${input.people} set(s)`, "Loose, tightly woven coverage reduces exposed skin while limiting heat burden.", "lightweight mosquito protective long sleeve clothing", "ESSENTIAL"),
      item("mosquito-net", "SHELTER", "Fine-mesh mosquito net", "1 per sleeping position", "Creates a physical barrier where screened rooms or air conditioning are unavailable.", "fine mesh mosquito bed net travel", "ESSENTIAL"),
      item("head-net", "PROTECTION", "Mosquito head net", `${input.people} unit(s)`, "Adds face and neck protection during unavoidable outdoor activity.", "fine mesh mosquito head net", "CONTEXTUAL"),
      item("window-screen", "SHELTER", "Temporary insect screen repair kit", "1 household kit", "Closes common entry points without relying only on chemical repellents.", "temporary window insect screen repair kit", "CONTEXTUAL"),
    );
  }
  if (/(?:wildfire|forest fire|smoke|лісов.*пожеж|дим)/.test(lowerConstraints)) {
    items.push(
      item("smoke-respirators", "AIR", "Certified particulate respirators", `${input.people * 3} units`, "Helps reduce particulate exposure from smoke when properly fitted.", "certified FFP2 N95 smoke respirator", "ESSENTIAL", "Does not protect from carbon monoxide or make an unsafe building safe."),
      item("air-cleaner", "AIR", "HEPA air cleaner", "1 correctly sized unit", "Can reduce indoor smoke particles in a designated clean room.", "true HEPA air purifier smoke room size", "CONTEXTUAL"),
    );
  }
  if (/(?:volcan|ashfall|вулкан|попіл)/.test(lowerConstraints)) {
    items.push(
      item("ash-respirators", "AIR", "Certified particulate respirators", `${input.people * 3} units`, "Helps reduce inhalation of volcanic ash when properly fitted.", "certified FFP2 N95 volcanic ash respirator", "ESSENTIAL", "Does not protect against volcanic gases; follow evacuation and air-quality instructions."),
      item("ash-goggles", "PROTECTION", "Non-vented protective goggles", `${input.people} pair(s)`, "Reduces eye exposure to abrasive ash.", "non vented safety goggles ash dust", "ESSENTIAL"),
    );
  }
  if (/(?:flood|повін|наводнен)/.test(lowerConstraints)) {
    items.push(
      item("dry-bags", "FLOOD", "Waterproof dry bags", "1 set", "Protects medication, documents, clothing and electronics during evacuation.", "waterproof dry bag emergency evacuation", "ESSENTIAL"),
      item("waterproof-boots", "FLOOD", "Waterproof safety boots", `${input.people} pair(s)`, "Reduces ordinary wet-weather exposure during cleanup after authorities declare an area safe.", "waterproof safety boots flood cleanup", "CONTEXTUAL", "Never enter moving or contaminated floodwater."),
    );
  }
  if (/(?:earthquake|землетрус|сейсм)/.test(lowerConstraints)) {
    items.push(
      item("hard-hats", "DEBRIS", "Certified safety helmets", `${input.people} unit(s)`, "Provides basic head protection during post-event debris checks after authorities say movement is safe.", "certified safety hard hat adjustable", "CONTEXTUAL"),
      item("emergency-whistle", "SIGNAL", "Emergency whistles", `${input.people} unit(s)`, "Allows signaling without exhausting the voice if someone is trapped or separated.", "loud emergency safety whistle", "ESSENTIAL"),
      item("utility-wrench", "TOOLS", "Utility shutoff wrench", "1 household tool", "Supports a pre-planned utility shutdown only when local guidance and the building setup call for it.", "emergency gas water utility shutoff wrench", "CONTEXTUAL", "Know the correct valve and local procedure before an emergency; do not improvise around damaged utilities."),
    );
  }
  if (/(?:hurricane|tornado|severe storm|шторм|ураган|торнад)/.test(lowerConstraints)) {
    items.push(
      item("weather-radio", "ALERTS", "Weather-alert radio", "1 household unit", "Receives warnings when internet or cellular service is unreliable.", "emergency weather alert radio battery hand crank", "ESSENTIAL"),
      item("repair-tarp", "SHELTER", "Heavy-duty tarp and repair cord", "1 sized set", "Supports temporary weatherproofing after the immediate hazard has passed.", "heavy duty waterproof tarp rope repair", "CONTEXTUAL", "Do not attempt exterior repairs during active severe weather."),
    );
  }
  if (/(?:heatwave|extreme heat|спек|жар)/.test(lowerConstraints)) {
    items.push(
      item("cooling-cloths", "HEAT", "Reusable cooling cloths", `${input.people} unit(s)`, "Adds a simple cooling aid while prioritizing shade, water and official heat guidance.", "reusable cooling towel heat", "CONTEXTUAL"),
      item("insulated-water", "WATER", "Insulated water containers", `${input.people} unit(s)`, "Makes the planned drinking-water supply portable during high heat.", "insulated reusable water bottle large", "ESSENTIAL", "Do not exceed medically advised fluid limits."),
    );
  }
  if (/(?:extreme cold|winter storm|blizzard|мороз|холод|зимов)/.test(lowerConstraints)) {
    items.push(
      item("sleeping-bags", "COLD", "Cold-rated sleeping bags", `${input.people} unit(s)`, "Provides passive insulation if heating fails or evacuation requires an unheated shelter.", "cold weather sleeping bag temperature rated", "ESSENTIAL"),
      item("base-layers", "COLD", "Thermal base layers", `${input.people} set(s)`, "Layered clothing preserves warmth more reliably than one heavy garment.", "thermal base layer set cold weather", "ESSENTIAL"),
    );
  }
  if (/(?:evacuat|wildfire|flood|conflict|евакуац|пожеж|повін|конфлікт)/.test(lowerConstraints)) {
    items.push(
      item("go-bags", "EVACUATION", "Durable evacuation backpacks", `${input.people} appropriately sized bag(s)`, "Keeps each person's water, medication, documents and clothing portable.", "durable emergency evacuation backpack", "ESSENTIAL", "Pack to the carrier's ability and keep essential medication accessible."),
      item("paper-map", "NAVIGATION", "Current paper map and waterproof sleeve", "1 regional set", "Provides a navigation fallback when batteries, mobile data or routing services fail.", "current regional road map waterproof sleeve", "CONTEXTUAL"),
    );
  }
  if (/(?:water outage|water contamination|boil water|водопостач|забруднен.*вод|кип'ят)/.test(lowerConstraints)) {
    items.push(
      item("water-containers", "WATER", "Food-grade water containers", `${Math.max(2, input.people)} container(s)`, "Provides a protected way to store and transport the household water baseline.", "food grade emergency water storage container", "ESSENTIAL"),
      item("water-treatment", "WATER", "Certified emergency water treatment", "1 household system", "Adds a backup treatment method when authorities identify a treatable biological contamination.", "certified emergency water filter purifier", "CONTEXTUAL", "Not every filter removes chemicals, salt or all pathogens; follow the local boil-water or do-not-use notice."),
    );
  }
  if (/(?:chemical spill|toxic release|hazmat|хіміч|токсич)/.test(lowerConstraints)) {
    items.push(
      item("shelter-sealing", "SHELTER", "Temporary room-sealing supplies", "1 household set", "Plastic sheeting and removable tape can support official shelter-in-place instructions for a selected room.", "plastic sheeting removable duct tape shelter in place", "CONTEXTUAL", "Use only when authorities advise shelter-in-place; ordinary masks do not protect against toxic gases."),
      item("chemical-radio", "ALERTS", "Battery emergency radio", "1 household unit", "Maintains access to official protective-action and evacuation instructions.", "battery emergency alert radio", "ESSENTIAL"),
    );
  }
  if (/(?:civil unrest|riot|conflict|war|заворуш|бойов|війна|конфлікт)/.test(lowerConstraints)) {
    items.push(
      item("low-profile-bags", "EVACUATION", "Low-profile durable backpacks", `${input.people} bag(s)`, "Keeps essentials mobile without advertising expensive equipment.", "plain durable travel backpack low profile", "ESSENTIAL"),
      item("door-hardware", "SHELTER", "Basic door and window repair hardware", "1 household set", "Supports ordinary repair and secure sheltering while preserving emergency exits.", "door window repair hardware kit", "CONTEXTUAL", "Avoid confrontation, crowds and improvised traps; follow lawful local guidance."),
    );
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
      amazon: { name: "Amazon search", url: amazonBase, rail: "Product discovery · exact pages can enter SP3ND fulfillment" },
      sp3nd: { name: "SP3ND", url: "https://www.sp3nd.shop", rail: "Amazon/eBay fulfillment · Solana USDC · separate approval" },
    },
    checkoutStatus: "READY_FOR_PHYSICAL_PROVIDER_SELECTION",
    checkoutBoundary: "RED QUEEN prepared the threat-specific manifest. No seller, address or payment is selected yet. SP3ND and x402 Market can proceed only through separate destination-disclosure, server-quote and exact-payment approvals.",
  };
}
