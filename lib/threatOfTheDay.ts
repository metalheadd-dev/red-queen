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
  name: "Football Fans Invasion",
  codename: "CUP-2026",
  severity: 100,
  status: "CRITICAL",
  description: "A massive, uncoordinated, yet highly synchronized swarm of multi-national football fan factions has breached all border containment lines. While the epicenter is localized across the United States, Canada, and Mexico, this registers as a worldwide threat: millions of fans who couldn't attend are occupying local bars, streets, and living rooms in their home countries. Outbreaks are characterized by intense face-painting, loud rhythmic chanting, spontaneous air-horn blasts, and localized stampedes toward screens. High concentration of alcohol-fueled adrenaline is threatening global beer supplies and testing urban decibel thresholds.",
  countermeasure: "Operatives must blend in immediately to avoid target identification. 1. Stockpile and consume high volumes of fermented beverages (cold lager or craft beer) to mirror host hydration behavior. 2. Wear brightly colored apparel (jersey or scarf) representing one of the active factions. If questioned, loudly yell \"GOAL!\" or chant \"Ole, Ole, Ole\" with enthusiasm. 3. Avoid logical debates regarding the offside rule, as this will expose your non-operative status and trigger hostile feedback. 4. Retreat to the nearest screen showing live feeds to maintain visual cover.",
  publishDate: "2026-06-11",
};

