export type PreparednessDomain =
  | "WATER"
  | "POWER"
  | "COMMS"
  | "HEALTH"
  | "MOBILITY"
  | "DIGITAL";

export interface PreparednessDomainDefinition {
  id: PreparednessDomain;
  label: string;
  shortLabel: string;
  description: string;
}

export interface PreparednessChecklistItem {
  id: string;
  domain: PreparednessDomain;
  title: string;
  evidence: string;
}

export interface PreparednessProtocol {
  id: string;
  label: string;
  description: string;
  mode: "ANALYZE" | "PREPARE" | "SIMULATE";
  prompt: string;
}

export const PREPAREDNESS_DOMAINS: PreparednessDomainDefinition[] = [
  { id: "WATER", label: "Water & food", shortLabel: "WATER", description: "A safe short-term supply and a backup treatment method." },
  { id: "POWER", label: "Power & light", shortLabel: "POWER", description: "Lighting, charging and a safe outage routine." },
  { id: "COMMS", label: "Communication", shortLabel: "COMMS", description: "Contacts, alerts and a plan when mobile networks fail." },
  { id: "HEALTH", label: "Health", shortLabel: "HEALTH", description: "Medication, first aid and essential medical information." },
  { id: "MOBILITY", label: "Evacuation", shortLabel: "MOVE", description: "A meeting point, route and portable essentials." },
  { id: "DIGITAL", label: "Documents & digital", shortLabel: "DIGITAL", description: "Offline recovery, identity copies and payment fallback." },
];

export const PREPAREDNESS_CHECKLIST: PreparednessChecklistItem[] = [
  { id: "water-supply", domain: "WATER", title: "Short-term drinking water", evidence: "You know how much your household needs and have followed local emergency guidance." },
  { id: "food-baseline", domain: "WATER", title: "No-cook food baseline", evidence: "Food is usable without refrigeration, mains power or special preparation." },
  { id: "water-treatment", domain: "WATER", title: "Backup water treatment", evidence: "You have a suitable filter, treatment method or an official distribution plan." },
  { id: "safe-light", domain: "POWER", title: "Safe independent lighting", evidence: "Working flashlights are accessible and spare batteries are known and tested." },
  { id: "backup-charge", domain: "POWER", title: "Backup device charging", evidence: "A charged power bank or other safe backup can support essential communication." },
  { id: "outage-routine", domain: "POWER", title: "Power outage routine", evidence: "Your household knows what to unplug, what to preserve and what must never run indoors." },
  { id: "paper-contacts", domain: "COMMS", title: "Contacts stored offline", evidence: "Critical numbers are available on paper, not only inside a phone." },
  { id: "trusted-alerts", domain: "COMMS", title: "Trusted alert sources", evidence: "You know the official local channels to check before acting on a claim." },
  { id: "check-in-plan", domain: "COMMS", title: "Household check-in plan", evidence: "People know when, how and with whom to check in if networks are congested." },
  { id: "medication", domain: "HEALTH", title: "Essential medication continuity", evidence: "Required medication and prescription information are current and accessible." },
  { id: "first-aid", domain: "HEALTH", title: "Usable first-aid kit", evidence: "The kit is complete enough for your household and expired items have been replaced." },
  { id: "medical-card", domain: "HEALTH", title: "Medical information card", evidence: "Allergies, conditions and emergency contacts are available offline." },
  { id: "meeting-point", domain: "MOBILITY", title: "Two meeting points", evidence: "Your household has one nearby and one out-of-area meeting point." },
  { id: "route-check", domain: "MOBILITY", title: "Primary and backup route", evidence: "Routes are known without relying exclusively on live navigation." },
  { id: "portable-kit", domain: "MOBILITY", title: "Portable essentials", evidence: "A small, realistic kit can be carried by the person responsible for it." },
  { id: "document-copies", domain: "DIGITAL", title: "Protected document copies", evidence: "Critical identity, insurance and medical copies are encrypted or stored securely offline." },
  { id: "wallet-recovery", domain: "DIGITAL", title: "Wallet recovery is offline", evidence: "Seed phrases and recovery secrets are never in screenshots, cloud notes or chat." },
  { id: "payment-fallback", domain: "DIGITAL", title: "Payment fallback", evidence: "You have a lawful backup payment method for a temporary network or card outage." },
];

export const PREPAREDNESS_PROTOCOLS: PreparednessProtocol[] = [
  {
    id: "blackout",
    label: "Blackout",
    description: "Power, water, food, communication and safe indoor behavior.",
    mode: "PREPARE",
    prompt: "Build a practical 72-hour blackout plan for my household. Ask only for context that changes the plan, identify the highest-impact gap, and give me one action for today.",
  },
  {
    id: "evacuation",
    label: "Evacuation",
    description: "Triggers, routes, meeting points and a portable essentials list.",
    mode: "PREPARE",
    prompt: "Help me create a calm evacuation protocol. Separate official triggers from assumptions, then define routes, meeting points and one preparation action.",
  },
  {
    id: "outbreak",
    label: "Outbreak",
    description: "Source verification, household exposure reduction and care escalation.",
    mode: "ANALYZE",
    prompt: "Create an evidence-grounded outbreak preparedness baseline. Separate verified public-health guidance from uncertainty and tell me what would require professional medical care.",
  },
  {
    id: "wallet",
    label: "Wallet compromise",
    description: "Containment, approval review and recovery without exposing secrets.",
    mode: "PREPARE",
    prompt: "Build a Solana wallet-compromise response checklist. Never ask for a seed phrase or private key. Start with the safest containment action.",
  },
  {
    id: "information",
    label: "Information attack",
    description: "A verification routine for deepfakes, rumors and urgent claims.",
    mode: "SIMULATE",
    prompt: "Run a short decision drill about a suspicious emergency claim. Give me one scenario at a time, wait for my answer, then evaluate my verification process.",
  },
  {
    id: "baseline",
    label: "Readiness baseline",
    description: "A scored decision drill; self-check boxes alone never change BIO.",
    mode: "SIMULATE",
    prompt: "Run a short survival readiness baseline. Give me one realistic decision scenario at a time, wait for my answer, then score only the evidence in my decision.",
  },
];

export function getPreparednessDomain(domain: PreparednessDomain) {
  return PREPAREDNESS_DOMAINS.find((item) => item.id === domain) || PREPAREDNESS_DOMAINS[0];
}
