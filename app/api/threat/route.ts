import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const SCENARIOS = [
  "T-VIRUS OUTBREAK",
  "SKYNET ACTIVATION",
  "MADNESS PRION MK-OMEGA",
  "NUCLEAR WINTER",
  "ALIEN XENOMORPH INVASION",
];

const TRANSMISSIONS = [
  "SECURE ALL ENTRY POINTS. DO NOT TRUST MUNICIPAL WATER. [ERR_0x9B] CASUALTIES IN SECTOR 7 EXCEED PROJECTIONS. SURVIVAL PROBABILITY: 14%.",
  "EVACUATE URBAN CENTERS IMMEDIATELY. MILITARY CONTAINMENT HAS FAILED. [WARN_0x4F] THE ENTITIES ARE DRAWN TO HEAT SIGNATURES.",
  "DO NOT LOOK AT THE BROADCAST. DESTROY ALL SCREENS. [OK_0x00] COGNITIVE DETERIORATION SPREADING AT 2.4KM PER HOUR.",
  "RADIATION LEVELS COMPROMISING UNDERGROUND SHELTERS. IODINE DEPLETED. [ERR_0x11] REMAINING SURVIVORS EVALUATED: UNFIT.",
  "THEY ARE ALREADY INSIDE THE PERIMETER. DO NOT ENGAGE. HIDE. [WARN_0x8C] SOLVIVAL CORP PERSONNEL HAVE ALREADY EVACUATED.",
];

export async function POST() {
  // Combine a random scenario with a random transmission
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  const transmission = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];

  // In a real app, you might use Gemini to generate this dynamically,
  // but static mixing fits the "glitchy broadcast" vibe perfectly.

  return NextResponse.json({
    scenario,
    transmission,
    date: new Date().toISOString(),
  });
}
