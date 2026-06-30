# RED QUEEN: OPERATIONS // ACCESS & CHARACTER FLOW FIX REPORT
**Status**: ONLINE // COMPLETED
**Date**: 2026-06-30

---

## 1. Issues Fixed

### Permanent Invite Access Fix (Closed Beta Gateway)
- **Problem**: The invite code gateway previously hashed the Supabase Auth User UUID (if logged in) instead of the Solana wallet address when writing the database record in `invite_usage` and `users`. When a user refreshed, reconnected, or opened the app in an Incognito window, it queried the database using the hashed Solana wallet address. This resulted in a mismatch, returning `profile: null` and prompting the user for the invite code every time.
- **Solution**: Updated the active identifier resolution in `/api/invite/activate` to prioritize the Solana wallet address (`wallet` from the request body) over the internal Supabase UUID (`wallet || authIdentifier`). Additionally, verified that the `users` table upsert includes the `invite_activated`, `invite_activated_at`, and `invite_code_id` fields as requested.

### Character Creation Bypass on Onboarding
- **Problem**: `DEFAULT_PROFILE` (loaded when a new player had no Supabase record yet) had `class: "Assault"`, `faction: "vanguard"`, and `role: "Breach Specialist"` preset. This meant the check `profile.class === "None"` was bypassed, skipping Character Creation and initializing a default character.
- **Solution**: Set the `DEFAULT_PROFILE` faction, class, and role fields to `"None"`. Now, any new player correctly lands on the Intro Story first, and immediately transitions to the Faction, Role, and Class character selection screen upon completion.

### Campaign & Missions Initialization
- **Problem**: Skipping character creation created a state where the campaign was empty, causing Sector Alpha to show as unlocked but contain no missions.
- **Solution**: Completing character creation now generates a starting inventory with starter equipment equipped (helmet, vest, assault rifle, backpack), default starting resources, starter credits, and initializes campaign progress in Sector Alpha with dynamic missions available (e.g. Operation Sanctuary Search and Operation Outpost Breach).

### Operative Reassignment matrix
- **Problem**: Reassignment matrix was missing from the control panel.
- **Solution**: Implemented the **Operative Reassignment Matrix** inside the Settings Control Panel tab, allowing players to dynamically reassign their Faction, Class, and Role. This updates their profile in state, saves it to LocalStorage, syncs the updated values to Supabase, and reloads the profile.

---

## 2. Validation & Database Migration SQL

To configure your Supabase database instance with the required columns for storing permanent invite metrics, run the following SQL statements in your **Supabase SQL Editor**:

```sql
-- Add permanent invite fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_activated BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_activated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code_id UUID;
```

---

## 3. Validation Tests Conducted

- [x] **TS Compilation**: Confirmed clean compilation with no type errors.
- [x] **Database Upsert**: Confirmed via scratch script that Supabase upserting of users works perfectly.
- [x] **Verification Priority**: Verified that Supabase remains the authoritative source of truth.
