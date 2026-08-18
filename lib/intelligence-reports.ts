import { NormalizedSignal, SignalGrid } from "@/lib/signal-engine";
import { SurvivalFocus } from "@/lib/survival-context";

export const MINIMUM_PAID_SOURCE_COVERAGE = 4;

export type PaidReportSource = {
  label: string;
  url: string;
  observedAt?: string;
  confidence?: number;
};

const OFFICIAL_PREPAREDNESS_SOURCES: Record<SurvivalFocus, PaidReportSource[]> = {
  LOCAL_THREATS: [
    { label: "Ready.gov preparedness guidance", url: "https://www.ready.gov/" },
  ],
  BLACKOUT: [
    { label: "Ready.gov power outage guidance", url: "https://www.ready.gov/power-outages" },
    { label: "CDC emergency water safety", url: "https://www.cdc.gov/water-emergency/about/index.html" },
  ],
  HOUSEHOLD: [
    { label: "Ready.gov emergency supply guidance", url: "https://www.ready.gov/kit" },
    { label: "CDC personal emergency needs", url: "https://www.cdc.gov/prepare-your-health/take-action/personal-needs.html" },
  ],
  DIGITAL_SECURITY: [
    { label: "CISA Secure Our World", url: "https://www.cisa.gov/secure-our-world" },
    { label: "Official Solana status", url: "https://status.solana.com/" },
  ],
  HEALTH: [
    { label: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
    { label: "CDC personal emergency needs", url: "https://www.cdc.gov/prepare-your-health/take-action/personal-needs.html" },
  ],
};

const PLAN_STEPS: Record<SurvivalFocus, { immediate: string[]; dayOne: string[]; dayThree: string[] }> = {
  LOCAL_THREATS: {
    immediate: [
      "Enable official local alerts and save the relevant civil-protection or emergency-management page.",
      "Confirm one primary and one backup route without publishing your exact home location.",
    ],
    dayOne: [
      "Check water, medication, charging, light and communication gaps against the current verified signal.",
      "Agree on one household contact point and one out-of-area contact.",
    ],
    dayThree: [
      "Recheck official guidance before changing location or transport plans.",
      "Record what changed, what remains uncertain and the next review time.",
    ],
  },
  BLACKOUT: {
    immediate: [
      "Charge phones and power banks; enable low-power mode and download essential information for offline use.",
      "Locate safe lighting, shut down sensitive equipment and never run fuel-burning devices indoors.",
    ],
    dayOne: [
      "Protect refrigerated medication and food; minimize unnecessary opening of refrigerators and freezers.",
      "Check water access, cash, radio, building access and one offline family communication method.",
    ],
    dayThree: [
      "Rotate charging, water and food use against a written household budget.",
      "Verify restoration information through the utility or local authority before acting on rumors.",
    ],
  },
  HOUSEHOLD: {
    immediate: [
      "Count people, pets, medications, mobility needs and essential devices that the plan must support.",
      "Place water, shelf-stable food, light, charging and first-aid supplies in one reachable location.",
    ],
    dayOne: [
      "Create a paper contact card and agree on meeting points for home, neighborhood and out-of-area separation.",
      "Protect copies of essential documents and list prescriptions without storing account passwords or keys.",
    ],
    dayThree: [
      "Test one no-power meal, one offline communication step and one safe exit route.",
      "Replace missing supplies and schedule a dated monthly review.",
    ],
  },
  DIGITAL_SECURITY: {
    immediate: [
      "Stop signing transactions until the domain, requested accounts, token movements and authorities are understood.",
      "Verify critical account sessions, enable phishing-resistant MFA where available and update exposed software.",
    ],
    dayOne: [
      "Audit Solana token delegates and external close authorities; revoke only approvals you recognize as unnecessary.",
      "Separate public receiving activity from long-term storage and preserve an offline recovery procedure.",
    ],
    dayThree: [
      "Run a recovery drill without revealing a seed phrase and document trusted support channels.",
      "Review transaction history and alerts for evidence; do not treat unfamiliar activity as proof of compromise without verification.",
    ],
  },
  HEALTH: {
    immediate: [
      "Check official local public-health guidance and separate confirmed exposure from a global outbreak headline.",
      "List essential medication, medical devices, dietary needs and the clinician or pharmacy contact required for continuity.",
    ],
    dayOne: [
      "Prepare safe water, hygiene supplies and a plan to reduce avoidable contact if local guidance justifies it.",
      "Write down symptoms or thresholds that require qualified medical advice rather than self-diagnosis.",
    ],
    dayThree: [
      "Review expiry dates, prescription continuity and the needs of children, older adults or people with disabilities.",
      "Recheck WHO and local authority updates before changing treatment, travel or isolation decisions.",
    ],
  },
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function buildLocalDelta(grid: SignalGrid, input: {
  area: string;
  lat?: number;
  lng?: number;
  radiusKm: number;
}) {
  const now = new Date(grid.generatedAt).getTime();
  const cutoff = now - 24 * 60 * 60 * 1_000;
  const areaNeedle = input.area.toLowerCase();
  const hasCoordinates = Number.isFinite(input.lat) && Number.isFinite(input.lng);
  const relevant = grid.signals
    .map((signal) => {
      const distanceKm = hasCoordinates && Number.isFinite(signal.lat) && Number.isFinite(signal.lng)
        ? haversineKm({ lat: input.lat!, lng: input.lng! }, { lat: signal.lat!, lng: signal.lng! })
        : null;
      const textMatch = areaNeedle.length >= 3 && `${signal.region} ${signal.location} ${signal.name}`.toLowerCase().includes(areaNeedle);
      return { signal, distanceKm, relevant: distanceKm !== null ? distanceKm <= input.radiusKm : textMatch };
    })
    .filter((entry) => entry.relevant)
    .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER) || b.signal.priorityScore - a.signal.priorityScore);

  const changes = relevant.filter(({ signal }) => {
    const changedAt = new Date(signal.updatedAt || signal.observedAt).getTime();
    return Number.isFinite(changedAt) && changedAt >= cutoff;
  });
  const priority = changes[0] || relevant[0] || null;

  return {
    area: input.area,
    radiusKm: hasCoordinates ? input.radiusKm : null,
    locationPrecision: hasCoordinates ? "USER-SUPPLIED APPROXIMATE COORDINATES" : "BROAD AREA TEXT MATCH",
    window: { from: new Date(cutoff).toISOString(), to: grid.generatedAt },
    headline: changes.length
      ? `${changes.length} source-backed change${changes.length === 1 ? "" : "s"} matched ${input.area} in the last 24 hours.`
      : `No source-backed change matched ${input.area} in the current 24-hour source window.`,
    assessment: priority
      ? `${priority.signal.name} is the highest-ranked matching record. Personal relevance still depends on official local instructions, exact distance and conditions not visible to RED QUEEN.`
      : "No match is not proof of safety. The verified grid is global, partial and does not replace local emergency alerts.",
    changes: changes.slice(0, 10).map(({ signal, distanceKm }) => ({
      id: signal.id,
      name: signal.name,
      kind: signal.kind,
      severity: signal.severity,
      confidence: signal.confidence,
      freshness: signal.freshness,
      observedAt: signal.observedAt,
      updatedAt: signal.updatedAt || signal.observedAt,
      region: signal.region,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm),
      fact: signal.fact,
      assessment: signal.assessment,
      action: signal.action,
      source: signal.source,
      sourceUrl: signal.sourceUrl,
    })),
    ongoing: relevant.filter((entry) => !changes.includes(entry)).slice(0, 6).map(({ signal, distanceKm }) => ({
      id: signal.id,
      name: signal.name,
      severity: signal.severity,
      freshness: signal.freshness,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm),
      source: signal.source,
      sourceUrl: signal.sourceUrl,
    })),
    nextAction: priority?.signal.action || "Open official local alerts and repeat the scan later if your decision depends on current conditions.",
    uncertainty: "This compares timestamps inside currently reachable source feeds. It cannot prove that every local incident, resolved event or municipal alert was captured.",
  };
}

function cleanConstraint(value: string) {
  return value.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 320);
}

export function buildPreparednessPlan(input: {
  area: string;
  focus: SurvivalFocus;
  household: string;
  constraints: string;
  grid: SignalGrid;
}) {
  const steps = PLAN_STEPS[input.focus];
  const areaNeedle = input.area.toLowerCase();
  const relevantSignals = input.grid.signals.filter((signal) => {
    if (areaNeedle.length >= 3 && `${signal.region} ${signal.location}`.toLowerCase().includes(areaNeedle)) return true;
    if (input.focus === "BLACKOUT") return signal.kind === "DISASTER" || signal.kind === "SPACE_WEATHER";
    if (input.focus === "DIGITAL_SECURITY") return signal.kind === "CYBER" || signal.kind === "SOLANA_NETWORK";
    if (input.focus === "HEALTH") return signal.kind === "HEALTH";
    return false;
  }).slice(0, 3);
  const createdAt = input.grid.generatedAt;
  const reviewAt = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1_000).toISOString();
  const personalize = (text: string) => {
    const notes = [cleanConstraint(input.household), cleanConstraint(input.constraints)].filter(Boolean);
    return notes.length ? `${text} Apply this to: ${notes.join("; ")}.` : text;
  };

  return {
    title: `72-hour ${input.focus.replaceAll("_", " ").toLowerCase()} protocol`,
    area: input.area || "Broad area not supplied",
    focus: input.focus,
    createdAt,
    reviewAt,
    household: cleanConstraint(input.household) || "Household details not supplied",
    constraints: cleanConstraint(input.constraints) || "No additional constraint supplied",
    grounding: relevantSignals.length ? "VERIFIED_LIVE + OFFICIAL GENERAL GUIDANCE" : "OFFICIAL GENERAL GUIDANCE",
    currentSignalContext: relevantSignals.map((signal) => ({
      id: signal.id,
      name: signal.name,
      fact: signal.fact,
      observedAt: signal.observedAt,
      source: signal.source,
      sourceUrl: signal.sourceUrl,
    })),
    phases: [
      { window: "0-6 HOURS", objective: "Stabilize immediate safety and information", steps: steps.immediate.map(personalize) },
      { window: "6-24 HOURS", objective: "Protect continuity and remove the largest gap", steps: steps.dayOne.map(personalize) },
      { window: "24-72 HOURS", objective: "Sustain, verify and reassess", steps: steps.dayThree.map(personalize) },
    ],
    sources: [
      ...relevantSignals.map((signal) => ({ label: signal.source, url: signal.sourceUrl, observedAt: signal.observedAt, confidence: signal.confidence })),
      ...OFFICIAL_PREPAREDNESS_SOURCES[input.focus],
    ].filter((source, index, all) => all.findIndex((candidate) => candidate.url === source.url) === index),
    maintenance: "Review within 24 hours, after any official alert, and whenever household needs or available supplies change.",
    uncertainty: "This plan cannot see your building, medical condition, inventory, transport access or official local instructions. Verify critical steps with qualified professionals and local authorities.",
  };
}

export function buildIncidentDossier(signal: NormalizedSignal) {
  return {
    id: signal.id,
    title: signal.name,
    classification: signal.kind,
    generatedAt: new Date().toISOString(),
    observedAt: signal.observedAt,
    updatedAt: signal.updatedAt || signal.observedAt,
    location: signal.region,
    severity: signal.severity,
    priorityScore: signal.priorityScore,
    confidence: signal.confidence,
    freshness: signal.freshness,
    confirmedFacts: [signal.fact],
    queenAssessment: signal.assessment,
    uncertainty: [
      "One verified source record cannot establish complete local impact or personal exposure.",
      "Severity and priority are RED QUEEN ranking aids, not official alert levels unless the source fact says so.",
      `The record is ${signal.ageHours} hours old in the current source snapshot and may change after export.`,
    ],
    actionProtocol: [
      signal.action,
      "Open the primary source and compare its geography and timestamp with official local guidance.",
      "Reassess before acting if the source, location or conditions change.",
    ],
    sources: [{ label: signal.source, url: signal.sourceUrl, observedAt: signal.observedAt, confidence: signal.confidence }],
    exportNotice: "This dossier is a timestamped decision-support artifact, not an emergency order or guarantee of safety.",
  };
}
