export const SIGNAL_WATCH_STORAGE_KEY = "rq-signal-watch-v1";
export const SIGNAL_WATCH_EVENT = "rq-signal-watch-updated";

export type SignalWatchType = "GEOLOGICAL" | "METEOROLOGICAL" | "BIOLOGICAL" | "KINETIC" | "ALGORITHMIC";

export interface SignalWatchMemory {
  version: 1;
  types: SignalWatchType[];
  localPriority: boolean;
  knownSignalIds: string[];
  lastScanAt?: string;
}

export const SIGNAL_WATCH_OPTIONS: Array<{ id: SignalWatchType; label: string; description: string }> = [
  { id: "GEOLOGICAL", label: "Seismic", description: "Earthquakes and volcanic events" },
  { id: "METEOROLOGICAL", label: "Climate", description: "Floods, storms, fires and drought" },
  { id: "BIOLOGICAL", label: "Biological", description: "Source-backed public-health signals" },
  { id: "KINETIC", label: "Infrastructure", description: "Humanitarian and infrastructure disruption" },
  { id: "ALGORITHMIC", label: "Digital", description: "Cyber and Solana security signals" },
];

const WATCH_TYPES = new Set(SIGNAL_WATCH_OPTIONS.map((option) => option.id));

export function parseSignalWatchMemory(value: string | null): SignalWatchMemory {
  const fallback: SignalWatchMemory = { version: 1, types: [], localPriority: false, knownSignalIds: [] };
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as Partial<SignalWatchMemory>;
    return {
      version: 1,
      types: Array.isArray(parsed.types)
        ? parsed.types.filter((type): type is SignalWatchType => WATCH_TYPES.has(type as SignalWatchType))
        : [],
      localPriority: parsed.localPriority === true,
      knownSignalIds: Array.isArray(parsed.knownSignalIds)
        ? parsed.knownSignalIds.filter((id): id is string => typeof id === "string").slice(-400)
        : [],
      lastScanAt: typeof parsed.lastScanAt === "string" ? parsed.lastScanAt : undefined,
    };
  } catch {
    return fallback;
  }
}

export function writeSignalWatchMemory(storage: Pick<Storage, "setItem">, memory: SignalWatchMemory) {
  storage.setItem(SIGNAL_WATCH_STORAGE_KEY, JSON.stringify(memory));
}
