# Mobile app interface — 2026-09-30

The mobile experience now opens as a task panel: ask Queen, see Pulse, open saved plans, browse games or find gear. The desktop landing page remains available at desktop widths. The phone layout applies at widths up to 700px and is shared by the mobile browser, PWA and existing Android TWA.

## Implemented

- Five persistent navigation tabs: Home, Queen, Pulse, Plan and Profile. SVG icons, active states, readable labels, safe-area spacing and focus outlines.
- A compact home screen with the existing Queen artwork and four action cards. The marketing landing sections are hidden on phones. Entering Queen does not require the introductory questionnaire.
- Automatic boot animation and welcome dialog are skipped on phones and standalone installations. Explicit replay/personalisation remains available.
- Saved action progress uses the existing device records, including the legacy single-action format. Reading this indicator does not rewrite records or award XP.
- Pulse and Prepare use their compact action headers. Descriptions are fully readable rather than clamped.
- Saved plans precede the household editor. Household and gear settings are initially collapsed on phones; the `#my-loadout` link opens them. Desktop settings remain expanded.
- Gaming opens with Queen/ROOK, catalog access and Steam profile access. The catalog precedes the larger promotional sections. Gaming Queen shows chat before session settings, with shorter copy and a compact composer.
- Email sign-in is the primary visible action on phones; Solana sign-in can be expanded. Public access remains available.
- A visual-viewport handler hides the bottom tabs while a focused text field and a substantial viewport reduction indicate an onscreen keyboard. Actual Android keyboard behaviour still needs device QA.

## Verification

- Next.js production build passed, including TypeScript and static route generation.
- Repository release safety check and `git diff --check` passed (Git reported existing LF/CRLF conversion warnings).
- In-app browser: home and Prepare checked at 320px; home, Queen, Gaming Queen, catalog/search, login and Pulse checked at 390px. Checked pages had no horizontal page overflow.
- Gaming Queen retained its existing Fallout draft and initially collapsed session settings. At 390 × 844 the submit button ended at y=755, above the bottom tabs.
- Catalog search for Fallout narrowed 8 games to 1; the search was cleared afterwards. Existing saved picks were not changed.
- Household disclosure can be opened/closed; direct `#my-loadout` navigation reveals the editor.
- At 1280px the Gaming Queen settings remain expanded. The temporary browser viewport override was reset.
- No browser console errors were captured during this UI walkthrough. Live sensor status remained limited and was presented as limited.

Screenshots: `mobile-app-home-2026-09-30.png` and `mobile-app-gaming-queen-2026-09-30.png`.

## Release boundaries

This is an implemented mobile interface, not a migration to native Android widgets. The Android package remains a TWA. A new signed AAB and real-device keyboard/navigation checks are not confirmed; see `android-play-preparation-2026-09-30.md` for the existing Gradle environment blocker. Live Supabase, Steam account linking and model responses were not configured or revalidated in this UI pass, as requested. No production deployment, database migration, signing-key change or Git push was performed.
