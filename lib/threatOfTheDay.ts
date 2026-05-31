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
  name: "AI-Driven Disinformation",
  codename: "AI-DISINFO",
  severity: 88,
  status: "SEVERE",
  description: "The proliferation of hyper-realistic deepfakes and algorithmic echo chambers has weaponized information, driving massive societal polarization and eroding trust in public institutions and democratic processes. Autonomous narrative agents now generate thousands of tailored false realities per hour — faster than any human verification system can respond. The battlefield is perception itself.",
  countermeasure: "Cross-verify all media across three or more independent primary sources. Develop deepfake detection literacy and treat all unverified video as hostile until confirmed. Disable algorithmic feeds — consume information through curated, human-edited channels. Maintain analog communication protocols for high-stakes decisions. Cognitive hygiene is now a survival skill.",
  publishDate: "2026-06-01",
};
