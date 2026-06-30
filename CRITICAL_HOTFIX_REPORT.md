# RED QUEEN: OPERATIONS // CRITICAL HOTFIX REPORT
**Status**: ONLINE // COMPLETED
**Date**: 2026-06-30

---

## 1. Permanent Invite Access Fixes

### Issue
Previously, the access control check relied on the session-dependent `authIdentifier` or localized key hacks in LocalStorage, which caused the Invite screen to reappear upon page refresh, in Incognito windows, or in different browsers where the session was not yet initialized.

### Solved Behaviour
- **Supabase as Source of Truth**: Removed the LocalStorage Step 0 bypass as the primary access check. The primary check now queries Supabase `/api/profile?wallet=${rawWallet}` using the raw Solana wallet address (`publicKey.toString()`) which is constant and stable.
- **Verification Cache Only**: LocalStorage is now strictly used as a cache fallback in the event of an API or database offline error.
- **Verify-First on Activation**: The invite activation sequence now explicitly loads and verifies that `access_type` equals `"Invite"` on Supabase before granting success.

---

## 2. Onboarding & Character Creation Alignment

### Issue
The Character Creation screen was previously shown before the player experienced the Intro Story slides. This caused new players to skip the narrative introduction, and in some cases, created a state where the character profile class and faction were uninitialized.

### Solved Behaviour
- **Narrative-First Onboarding**: The correct onboarding order is now enforced:
  1. Wallet Connection
  2. Access Verification (Invite code validation)
  3. Intro Story slides (steps 1 to 4)
  4. Character Creation (Choose Faction -> Choose Role -> Choose Class -> Codename)
  5. Command Hub Campaign Entry
- **State Enforcement**: The Character Creation screen is only rendered when `completedOnboarding` (from Intro Story) is `true` AND the profile class/faction are uninitialized (e.g., `"None"`).

---

## 3. Campaign & Sector Alpha Initialization

### Issue
Skipping Character Creation left players with uninitialized class/faction profiles. This caused the campaign to fail to start correctly, resulting in Sector Alpha appearing unlocked but showing no available missions.

### Solved Behaviour
- **Full Initial Profile Setup**: Setting faction, class, and role now correctly triggers complete campaign initialization.
- **Campaign World Setup**: The initial world state is created with Sector Alpha unlocked (`isUnlocked: true`, status: `AVAILABLE`) and populated with its corresponding operations.
- **Starter Gear Generation**: Upon profile creation, the player receives:
  - **Starter Equipment**: Basic Combat Helmet, Tactical Plate Vest, Standard Issue Assault Rifle, and Standard Rucksack automatically equipped.
  - **Starter Inventory**: Stim Injectors, C-4 Anomaly charges, Deuterium cells, and Titanite scraps to begin crafting and upgrading immediately.

---

## 4. Mission Availability

- Sector Alpha contains two default Easy operations: **Operation Sanctuary Search** and **Operation Outpost Breach**.
- Both operations have empty unlock requirements (`unlockRequirements: {}`), guaranteeing they are immediately playable by any new Operative right after commissioning their survivor.

---

## 5. Known Remaining Issues & Recommendations

1. **RPC Rate Limits**: Under heavy mainnet network load, public Solana RPC endpoints (`solana-rpc.publicnode.com`) might return 429 errors.
   - *Recommendation*: Configure a private RPC endpoint URL in `NEXT_PUBLIC_SOLANA_RPC_URL` for production deployments.
