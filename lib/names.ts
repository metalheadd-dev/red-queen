// ─── Apocalyptic Name Generator ───────────────────────────────────────────────
const ADJECTIVES = [
  "IRRADIATED", "FORSAKEN", "HOLLOW", "CRIMSON", "SILENT", "BURNING",
  "FRACTURED", "PHANTOM", "CORRODED", "VAULTED", "NEON", "ASHEN",
  "RUSTED", "CURSED", "SPECTRAL", "VOLATILE", "DEAD", "LAST",
  "INFECTED", "SHATTERED", "TOXIC", "OMEGA", "FINAL", "BROKEN",
  "VOID", "STATIC", "CHROME", "SCARRED", "FALLEN", "ROGUE",
];

const NOUNS = [
  "PROPHET", "WANDERER", "SENTINEL", "REVENANT", "GHOST", "PILGRIM",
  "OPERATOR", "SURVIVOR", "SPECTER", "HARBINGER", "WRAITH", "NOMAD",
  "WARDEN", "ORACLE", "HUNTER", "VECTOR", "ARCHITECT", "WITNESS",
  "EXILE", "PHANTOM", "RELIC", "ENVOY", "CIPHER", "OUTCAST",
  "AGENT", "REMNANT", "SERAPH", "STALKER", "REAPER", "SIGNAL",
];

export function generateApocalypticName(wallet: string): string {
  if (!wallet) return "";
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) {
    hash = (hash * 31 + wallet.charCodeAt(i)) >>> 0;
  }
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(hash / ADJECTIVES.length) % NOUNS.length];
  return `${adj} ${noun}`;
}
