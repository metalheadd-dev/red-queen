export type CommerceAvailability = { state: "checking" | "ready" | "blocked"; label: string };

export function commerceAvailability(
  settlement: boolean | null,
  requiresProvider: boolean,
  providerEligible?: boolean,
): CommerceAvailability {
  if (settlement === false) return { state: "blocked", label: "PAYMENTS UNAVAILABLE" };
  if (settlement === null || (requiresProvider && providerEligible === undefined)) {
    return { state: "checking", label: "CHECKING" };
  }
  return requiresProvider && !providerEligible
    ? { state: "blocked", label: "NOT READY" }
    : { state: "ready", label: "READY" };
}
