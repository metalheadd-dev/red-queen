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
  name: "Ebola Virus (Filovirus)",
  codename: "EBOLA-V",
  severity: 98,
  status: "CRITICAL",
  description: "A highly lethal filovirus causing severe hemorrhagic fever in humans and primates. In the context of digital-physical survival, biological outbreaks disrupt local infrastructure, collapse communications nodes, and trigger state-level quarantine surveillance loops. Operatives must monitor real-world vector progression and isolate physical nodes.",
  countermeasure: "Establish immediate physical isolation. Implement strict biosafety level protocols. Ensure independent power, water, and air-filtration backups. Sever non-essential external connections.",
  publishDate: "2026-05-29",
};
