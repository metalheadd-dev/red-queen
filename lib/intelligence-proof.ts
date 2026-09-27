export const RQ_PROOF_PROTOCOL = "RQ_PROOF_V1";
export const RQ_PROOF_DRAFT_KEY = "rq-proof-draft-v1";
export const RQ_PROOF_HISTORY_KEY = "rq-proof-history-v1";
export const RQ_PROOF_MAX_CONTENT = 60_000;

export const RQ_PROOF_TYPES = [
  "QUEEN_ASSESSMENT",
  "THREAT_COMPARISON",
  "PREPAREDNESS_PROTOCOL",
  "AGENT_BLUEPRINT",
] as const;

export type RqProofType = typeof RQ_PROOF_TYPES[number];

export type RqProofDraft = {
  title: string;
  type: RqProofType;
  content: string;
};

export type RqProofRecord = {
  id: string;
  title: string;
  type: RqProofType;
  hash: string;
  memo: string;
  signature: string;
  wallet: string;
  anchoredAt: string;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isRqProofType(value: unknown): value is RqProofType {
  return typeof value === "string" && RQ_PROOF_TYPES.includes(value as RqProofType);
}

export function normalizeProofDraft(value: unknown): RqProofDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const title = text(raw.title, 100);
  const content = text(raw.content, RQ_PROOF_MAX_CONTENT);
  if (title.length < 2 || content.length < 8 || !isRqProofType(raw.type)) return null;
  return { title, type: raw.type, content };
}

export function buildIntelligenceProofMemo(input: { hash: string; type: RqProofType; anchoredAt: string }) {
  const hash = input.hash.toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("A SHA-256 artifact hash is required.");
  if (!isRqProofType(input.type)) throw new Error("Unsupported RQ proof type.");
  const anchoredAt = new Date(input.anchoredAt);
  if (!Number.isFinite(anchoredAt.getTime())) throw new Error("A valid proof timestamp is required.");
  return `${RQ_PROOF_PROTOCOL}|sha256:${hash}|type:${input.type}|at:${anchoredAt.toISOString()}`;
}

export function parseIntelligenceProofMemo(value: string) {
  const match = value.match(/^RQ_PROOF_V1\|sha256:([0-9a-f]{64})\|type:([A-Z_]+)\|at:(.+)$/);
  if (!match || !isRqProofType(match[2])) return null;
  const anchoredAt = new Date(match[3]);
  if (!Number.isFinite(anchoredAt.getTime())) return null;
  return { hash: match[1], type: match[2], anchoredAt: anchoredAt.toISOString() } as const;
}

export function parseProofHistory(value: string | null): RqProofRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): RqProofRecord[] => {
      if (!entry || typeof entry !== "object") return [];
      const raw = entry as Record<string, unknown>;
      const memo = text(raw.memo, 300);
      const proof = parseIntelligenceProofMemo(memo);
      const signature = text(raw.signature, 120);
      const wallet = text(raw.wallet, 60);
      const title = text(raw.title, 100);
      if (!proof || signature.length < 64 || wallet.length < 32 || title.length < 2) return [];
      return [{
        id: text(raw.id, 80) || signature,
        title,
        type: proof.type,
        hash: proof.hash,
        memo,
        signature,
        wallet,
        anchoredAt: proof.anchoredAt,
      }];
    }).slice(0, 20);
  } catch {
    return [];
  }
}
