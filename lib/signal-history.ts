export const SIGNAL_HISTORY_STORAGE_KEY = "rq-signal-history-v1";
export const SIGNAL_SCAN_STORAGE_KEY = "rq-signal-scan-v1";

export type SignalChange = "NEW" | "ESCALATED" | "REDUCED" | "STEADY";

export interface TrackableSignal {
  id: string;
  name: string;
  severity: number;
  updatedAt?: string;
}

interface SignalSnapshot {
  seenAt: string;
  severity: number;
  sourceUpdatedAt?: string;
}

interface StoredSignalHistory {
  id: string;
  name: string;
  snapshots: SignalSnapshot[];
}

export interface SignalHistoryView {
  change: SignalChange;
  previousSeverity?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  observations: number;
}

interface StoredSignalScan {
  scannedAt: string;
  signals: Record<string, { name: string; severity: number }>;
}

export interface SignalScanSummary {
  state: "BASELINE" | "COMPARED" | "LIMITED";
  scannedAt?: string;
  previousScanAt?: string;
  activeCount: number;
  newCount: number;
  escalatedCount: number;
  reducedCount: number;
  absentCount: number;
}

const MAX_SIGNALS = 120;
const MAX_SNAPSHOTS = 8;

function validDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
}

function readHistory(storage: Storage): Record<string, StoredSignalHistory> {
  try {
    const parsed = JSON.parse(storage.getItem(SIGNAL_HISTORY_STORAGE_KEY) || "{}") as Record<string, StoredSignalHistory>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function readPreviousScan(storage: Storage): StoredSignalScan | null {
  try {
    const parsed = JSON.parse(storage.getItem(SIGNAL_SCAN_STORAGE_KEY) || "null") as StoredSignalScan | null;
    if (!parsed || !validDate(parsed.scannedAt) || !parsed.signals || typeof parsed.signals !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function recordSignalScanSummary(
  storage: Storage,
  signals: TrackableSignal[],
  comparable: boolean,
  scannedAt = new Date().toISOString(),
): SignalScanSummary {
  const previous = readPreviousScan(storage);
  if (!comparable) {
    return {
      state: "LIMITED",
      previousScanAt: previous?.scannedAt,
      activeCount: signals.length,
      newCount: 0,
      escalatedCount: 0,
      reducedCount: 0,
      absentCount: 0,
    };
  }

  const scanTime = validDate(scannedAt) || new Date().toISOString();
  const currentSignals = Object.fromEntries(signals
    .filter((signal) => signal.id && Number.isFinite(signal.severity))
    .map((signal) => [signal.id, { name: signal.name, severity: signal.severity }]));
  const previousSignals = previous?.signals || {};
  const currentIds = new Set(Object.keys(currentSignals));
  const previousIds = new Set(Object.keys(previousSignals));

  const summary: SignalScanSummary = {
    state: previous ? "COMPARED" : "BASELINE",
    scannedAt: scanTime,
    previousScanAt: previous?.scannedAt,
    activeCount: currentIds.size,
    newCount: previous ? [...currentIds].filter((id) => !previousIds.has(id)).length : 0,
    escalatedCount: previous ? [...currentIds].filter((id) => previousSignals[id] && currentSignals[id].severity > previousSignals[id].severity).length : 0,
    reducedCount: previous ? [...currentIds].filter((id) => previousSignals[id] && currentSignals[id].severity < previousSignals[id].severity).length : 0,
    absentCount: previous ? [...previousIds].filter((id) => !currentIds.has(id)).length : 0,
  };

  try {
    storage.setItem(SIGNAL_SCAN_STORAGE_KEY, JSON.stringify({ scannedAt: scanTime, signals: currentSignals } satisfies StoredSignalScan));
  } catch {
    // The live scan remains available when local storage is unavailable.
  }
  return summary;
}

export function recordSignalScan(
  storage: Storage,
  signals: TrackableSignal[],
  scannedAt = new Date().toISOString(),
): Record<string, SignalHistoryView> {
  const scanTime = validDate(scannedAt) || new Date().toISOString();
  const history = readHistory(storage);
  const views: Record<string, SignalHistoryView> = {};

  for (const signal of signals) {
    if (!signal.id || !Number.isFinite(signal.severity)) continue;
    const existing = history[signal.id];
    const snapshots = Array.isArray(existing?.snapshots) ? existing.snapshots.filter((snapshot) => (
      snapshot
      && Number.isFinite(snapshot.severity)
      && Boolean(validDate(snapshot.seenAt))
    )) : [];
    const previous = snapshots.at(-1);
    const sourceUpdatedAt = validDate(signal.updatedAt);

    let change: SignalChange = "NEW";
    if (previous) {
      change = signal.severity > previous.severity
        ? "ESCALATED"
        : signal.severity < previous.severity
          ? "REDUCED"
          : "STEADY";
    }

    const isDuplicateScan = previous?.seenAt === scanTime
      && previous.severity === signal.severity
      && previous.sourceUpdatedAt === sourceUpdatedAt;
    const nextSnapshots = isDuplicateScan
      ? snapshots
      : [...snapshots, { seenAt: scanTime, severity: signal.severity, sourceUpdatedAt }].slice(-MAX_SNAPSHOTS);

    history[signal.id] = {
      id: signal.id,
      name: signal.name,
      snapshots: nextSnapshots,
    };
    views[signal.id] = {
      change,
      previousSeverity: previous?.severity,
      firstSeenAt: nextSnapshots[0]?.seenAt || scanTime,
      lastSeenAt: nextSnapshots.at(-1)?.seenAt || scanTime,
      observations: nextSnapshots.length,
    };
  }

  const pruned = Object.fromEntries(
    Object.entries(history)
      .sort(([, a], [, b]) => (b.snapshots.at(-1)?.seenAt || "").localeCompare(a.snapshots.at(-1)?.seenAt || ""))
      .slice(0, MAX_SIGNALS),
  );

  try {
    storage.setItem(SIGNAL_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // Pulse remains functional when storage is unavailable or full.
  }

  return views;
}
