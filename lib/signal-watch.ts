export const SIGNAL_WATCH_STORAGE_KEY = "rq-signal-watch-v1";
export const SIGNAL_WATCH_EVENT = "rq-signal-watch-updated";
export const SIGNAL_WATCH_REQUEST_EVENT = "rq-signal-watch-request";

export type SignalWatchType = "GEOLOGICAL" | "METEOROLOGICAL" | "KINETIC" | "ALGORITHMIC" | "SPACE_WEATHER" | "BIOLOGICAL";

export interface SignalWatchMemory {
  version: 1;
  types: SignalWatchType[];
  localPriority: boolean;
  browserAlerts: boolean;
  knownSignalIds: string[];
  acknowledgedSignalIds: string[];
  lastScanAt?: string;
}

export const SIGNAL_WATCH_OPTIONS: Array<{ id: SignalWatchType; label: string; description: string }> = [
  { id: "GEOLOGICAL", label: "Seismic", description: "Earthquakes and volcanic events" },
  { id: "METEOROLOGICAL", label: "Climate", description: "Floods, storms, fires and drought" },
  { id: "KINETIC", label: "Infrastructure", description: "Humanitarian and infrastructure disruption" },
  { id: "ALGORITHMIC", label: "Digital", description: "CISA cyber and Solana security signals" },
  { id: "SPACE_WEATHER", label: "Space weather", description: "NOAA grid, radio and navigation notices" },
  { id: "BIOLOGICAL", label: "Health", description: "WHO acute public-health event notices" },
];

const WATCH_TYPES = new Set(SIGNAL_WATCH_OPTIONS.map((option) => option.id));

export function isSignalWatchType(value: string): value is SignalWatchType {
  return WATCH_TYPES.has(value as SignalWatchType);
}

export function parseSignalWatchMemory(value: string | null): SignalWatchMemory {
  const fallback: SignalWatchMemory = {
    version: 1,
    types: [],
    localPriority: false,
    browserAlerts: false,
    knownSignalIds: [],
    acknowledgedSignalIds: [],
  };
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as Partial<SignalWatchMemory>;
    return {
      version: 1,
      types: Array.isArray(parsed.types)
        ? parsed.types.filter((type): type is SignalWatchType => WATCH_TYPES.has(type as SignalWatchType))
        : [],
      localPriority: parsed.localPriority === true,
      browserAlerts: parsed.browserAlerts === true,
      knownSignalIds: Array.isArray(parsed.knownSignalIds)
        ? parsed.knownSignalIds.filter((id): id is string => typeof id === "string").slice(-400)
        : [],
      acknowledgedSignalIds: Array.isArray(parsed.acknowledgedSignalIds)
        ? parsed.acknowledgedSignalIds.filter((id): id is string => typeof id === "string").slice(-400)
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
