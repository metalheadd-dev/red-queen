/** Keep existing chat, payment and OAuth deep links working after the UI split. */
export function commerceDestination(search: string, hash: string): string {
  const params = new URLSearchParams(search);
  const shopping = hash === "#survival-market" || hash === "#sp3nd-checkout"
    || params.get("fromChat") === "1" || [...params.keys()].some(key => key.startsWith("sp3nd"));
  const wallet = ["#buy-threat", "#agent-identity", "#wallet-intelligence", "#onchain-actions"].includes(hash);
  const page = shopping ? "/shop" : wallet ? "/network-clearance" : "/reports";
  return `${page}${search}${hash}`;
}
