export const HOLDER_PROOF_MAX_AGE_MS = 30 * 60 * 1000;

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export function isHolderProofFresh(
  balance: number | null | undefined,
  lastVerification: string | null | undefined,
  now = Date.now(),
) {
  if (!Number.isFinite(Number(balance)) || Number(balance) <= 0 || !lastVerification) return false;
  const verifiedAt = new Date(lastVerification).getTime();
  if (!Number.isFinite(verifiedAt)) return false;
  const age = now - verifiedAt;
  return age >= -MAX_CLOCK_SKEW_MS && age <= HOLDER_PROOF_MAX_AGE_MS;
}
