# RED QUEEN

**A survival intelligence ecosystem on Solana.**

RED QUEEN turns verified threat signals into clear assessments, practical preparedness actions, and evidence-based readiness training. The core product is not a panic feed and not a game: it is a daily system for understanding risk and becoming harder to surprise.

Production: [redqueen.space](https://redqueen.space) · X: [@redqueen_agent](https://x.com/redqueen_agent)

## Core product loop

1. **Detect** — read a daily intelligence pulse and explore verified signals on the live map.
2. **Understand** — ask RED QUEEN what a signal means for a broad region, household, device, or wallet.
3. **Prepare** — turn analysis into one practical action, checklist, or 72-hour protocol.
4. **Improve** — build BIO-SCORE only through evaluated decisions and demonstrated preparedness evidence.

| Route | Product role |
| --- | --- |
| `/` | Daily Pulse, First Contact, verified Live Map |
| `/terminal` | Context-aware RED QUEEN agent: Monitor, Analyze, Prepare, Simulate |
| `/survival-kit` | Local preparedness checklist and protocols |
| `/threat-vector` | Real-world, digital, fictional, and satirical scenario library |
| `/operative` | My Readiness: identity, BIO, XP, evidence, memory, token clearance |
| `/network-clearance` | Solana control plane and live `$THREAT` utility proof |

The unfinished Operations game is intentionally disabled and excluded from the current product navigation.

## Intelligence trust contract

RED QUEEN responses separate:

- verified facts;
- Queen assessment;
- uncertainty and missing evidence;
- one practical next action.

Fictional and satirical scenarios remain in the library and are never presented as live alerts. Wallet diagnostics never claim access to private identity data, IP logs, geolocation, Chainalysis, TRM, Elliptic, or other compliance vendors unless a real integration and source are present.

## Solana control plane

The project uses Solana for three separate jobs. They must not be conflated.

### 1. Wallet identity — SIWS

Supabase Web3 Auth verifies a domain-bound, timestamped Sign In With Solana message through the connected wallet adapter. Signing in is off-chain and sends no transaction.

### 2. `$THREAT` holder proof

The server reads the canonical SPL mint on Solana mainnet, aggregates matching token accounts, and maps the live balance to RED QUEEN clearance. RPC failures fail closed: cached balances are not accepted as fresh proof.

Canonical mint: `3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump`

| Level | Balance | Context | Analysis | Earned XP |
| --- | ---: | ---: | --- | ---: |
| Civilian | Public | 6 messages | Essential | ×1.00 |
| Scout | 1+ | 10 messages | Standard | ×1.05 |
| Analyst | 100K+ | 14 messages | Detailed | ×1.10 |
| Sentinel | 500K+ | 18 messages | Advanced | ×1.15 |
| Command | 1M+ | 24 messages | Strategic | ×1.20 |

Token holdings expand intelligence capacity and engagement XP. They never create BIO-SCORE or prove survival competence.

### 3. AI compute payments — x402

Premium HTTP resources can request an exact USDC payment through the x402 SVM scheme. The network, asset, amount, and receiving wallet must be displayed before approval. Wallet connection and SIWS authentication never authorize payment.

Current implementation uses x402 v2 packages with Solana CAIP-2 network identifiers. Production settlement requires a configured facilitator and receiving wallet.

Official references: [Solana Actions and Blinks](https://solana.com/developers/guides/advanced/actions), [Solana Mobile Wallet Adapter](https://docs.solanamobile.com/get-started/web/apps), [x402 specification](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md), [Supabase Web3 Auth](https://supabase.com/docs/guides/auth/auth-web3).

## Next Solana integrations

- Mobile Wallet Adapter for the Seeker Android build.
- Solana Actions/Blinks for shareable RED QUEEN protocols and paid intelligence actions.
- Holder-specific alert channels and compute allowances.
- Privacy-preserving credentials only if readiness data can remain private by design.

Token-2022 is not treated as a cosmetic upgrade. Extensions are selected when a mint is created and cannot simply be added to the existing `$THREAT` mint.

## Local development

Requirements: Node.js 22+, npm, a Supabase project for persistent accounts, and an OpenAI API key for the agent.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Important environment groups are documented in `.env.local.example`:

- OpenAI agent configuration;
- Supabase browser and server credentials;
- Solana RPC endpoints;
- x402 SVM settlement configuration;
- optional protected treasury automation.

Never expose the Supabase service role, treasury private key, facilitator secret, or wallet salt through a `NEXT_PUBLIC_` variable.

## Technical stack

- Next.js 16 App Router and React 19
- TypeScript
- OpenAI Responses API with structured outputs
- Supabase Auth and Postgres
- Solana Wallet Adapter, `@solana/web3.js`, `@solana/kit`
- SPL Token and x402 SVM
- MapLibre GL

## Verification

Before promoting test changes to production:

```bash
npm run build
git diff --check
```

Then verify desktop and mobile flows for Pulse, Map, Queen, Prepare, Library, My Readiness, Login, and the On-chain Hub. All pushes are tested in `red-queen-test` before promotion to the public repository and `redqueen.space`.

## Safety

RED QUEEN provides informational threat analysis and preparedness guidance. It does not replace emergency services, official alerts, medical care, legal advice, or professional financial advice. Never enter a seed phrase, private key, exact home address, or sensitive recovery information into the platform.
