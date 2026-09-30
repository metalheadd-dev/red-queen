# Red Queen in the Gaming Room

Red Queen is the room's survival gaming companion. ROOK remains the mechanical raven mascot; Queen supplies the intelligence and voice. The standalone BLACKSITE game remains a separate, paused development track.

## Implemented

- `/gaming/queen`: a real chat using the existing moderated `/api/chat` engine and its guest quota/account authentication. Defaults to no spoilers.
- Brief: up to three catalog titles, solo/team preference, intensity and session length. Saved picks are added only by an explicit button. They do not imply ownership.
- Discover: compare editorial survival games and explain a first pick. Team recommendations are restricted to the co-op lane in the agent instruction.
- Start: propose an opening-session checklist, with uncertainty about difficulty/version made explicit.
- Debrief: ask what happened and analyze the player's own description. No screen, telemetry or Steam library access is claimed.
- Challenge: create an informal self-reported practice objective. This is not entry into a season and carries no certified score or prize.
- Catalog cards, a main room panel, competitions and the contextual Queen dock lead into the gaming chat.
- Conversations have a UUID URL, browser copies scoped by guest/account, JSON export/import and an authenticated account-history endpoint. A new conversation preserves previous turns. Import validates every reply and existing records win on duplicate IDs; imported replies remain browser copies, not verified game results or server generations.
- Each conversation has a separate draft and preferences. Refresh restores them; explicit sign-in continuation carries the guest draft and conversation ID into the account without deleting guest copies.
- History uses owner-scoped cursor pagination, including tied timestamps. Earlier replies can be loaded before exporting the complete conversation.
- Queen replies have an in-app report form. A private service-only queue at `/admin/feedback` accepts bounded, explicitly submitted prompt/reply/reason data, with server-side abuse limits. Reports are not public and failed storage never displays success.

## Boundaries

Gaming context is reconstructed server-side from catalog IDs and bounded preferences. It does not include Device Survival Memory, private household preparedness context, real-world signals or core agent chat history. The same account clearance can determine response depth, but it does not prove gaming skill.

After generation, the server forces readiness eligibility, XP and every gain to zero; disables real-world plans, procurement, loadouts and commerce; and excludes gaming requests from core readiness/profile writes. Immediate real self-harm still receives human-support guidance through moderation.

Queen cannot certify results, change standings, issue keys, invent holder discounts, spend funds or submit Solana transactions. Season 00 is preseason with closed entries. Future season hosting should use published, versioned rules and server-confirmed events; Queen may explain those records rather than invent them.

## Persistence and activation

When live activation is requested, apply `supabase/migrations/20260930120000_create_gaming_queen_generations.sql` to the verified RED QUEEN Supabase project. It adds separate RLS-enabled generation and agent-report tables. Browser clients have no direct access; history verifies authentication and filters by the server-derived owner key. Live Supabase activation was explicitly skipped by the user; no remote database was changed.

Each signed-in generation is inserted with a pre-generated UUID, conversation UUID, prompt, bounded brief, structured response, model, token usage and timestamp. Existing chat rows and scores are not overwritten. History reads return up to 100 records per page and a cursor for the next page; both conversation replies and the conversation list can load earlier pages. Browser copies retain earlier records already loaded.

If account storage is unavailable, the reply explicitly reports `accountSaved: false`; the UI attempts a browser copy and offers export. If browser storage cannot be parsed or written, existing contents are preserved and a warning advises exporting. Browser data is not encrypted and remains on the device after sign-out.

The AI requires `OPENAI_API_KEY`; signed-in persistence also needs the existing Supabase configuration and migration. No new payment service or Steam API key is required for this companion. Steam identity linking remains a separate feature.

## Verification

`npm run test:gaming` covers catalog sanitization, output boundaries, gaming-only persistence, account-storage failure, draft corruption protection, backup validation, safe login returns, pagination/ownership, private feedback, existing guest quotas, immediate human support and Steam OpenID checks. Model behavior such as recommendation quality and spoiler avoidance requires configured live-model evaluation; those are prompt constraints, not a claim of verified accuracy.

Later: verified library sync (with explicit consent and supported Steam API access), developer-approved challenges, a Queen season briefing and an optional finalized-result digest on Solana. None of these planned capabilities is presented as already active.
