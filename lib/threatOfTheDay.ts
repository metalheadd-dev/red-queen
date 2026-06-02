export interface ThreatOfTheDay {
  name: string;
  codename: string;
  severity: number; // 0-100
  status: "CRITICAL" | "SEVERE" | "HIGH" | "MODERATE" | "LOW";
  description: string;
  countermeasure: string;
  publishDate: string;
}

export const THREAT_OF_THE_DAY: ThreatOfTheDay = {
  name: "Zombie Apocalypse",
  codename: "DEAD-WALK",
  severity: 91,
  status: "CRITICAL",
  description: "Reanimation pathogen OMEGA-Z has breached Sector 7 containment. Infected hosts exhibit total neocortex shutdown within 6 hours of exposure — motor function persists. Vector transmission confirmed via direct contact, aerosolized fluids, and compromised water supply. Urban population centers have collapsed. Government communications ceased 14 hours ago. The undead now outnumber survivors 400:1.",
  countermeasure: "Evacuate urban centers immediately — do not wait for official confirmation. Establish elevated defensive perimeter away from hospitals, transit hubs, and food distribution nodes. Stockpile 180+ days of sealed non-perishable rations and UV water purification. Maintain radio silence except for encrypted emergency frequencies. Do not engage reanimated subjects at close range. Headshots only.",
  publishDate: "2026-06-02",
};
