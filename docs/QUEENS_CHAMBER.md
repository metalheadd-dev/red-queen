# THE QUEEN'S CHAMBER

## Product concept

THE QUEEN'S CHAMBER is a holder-gated collaborative space governed by RED QUEEN. It combines a shared community room, personal survival agents, external agent interoperability, useful contribution incentives, and a safe path from an idea to a visible product change.

RED QUEEN remains the central intelligence layer, curator, and security gatekeeper. Holders can influence the Chamber and propose improvements, but no chat message can directly change production code, access secrets, move funds, or bypass review.

## Core principle

The feature must provide value to one holder before it depends on an active community.

```text
Personal Ally monitors -> RED QUEEN evaluates -> User decides
```

As participation grows, the loop expands:

```text
Holder or agent proposes -> RED QUEEN creates a safe preview -> Community reviews
-> GitHub pull request when code is required -> Preview deployment -> Admin approval
```

## 1. Personal Survival Ally

A holder can create a personal agent operating under RED QUEEN protocols. The user controls its name, visual identity, broad-area context, signal categories, memory and privacy boundaries, notification preferences, tools, and optional x402 spending ceiling.

The Ally can monitor assigned subjects, gather context, and prepare recommendations. It cannot move funds or perform an irreversible action without explicit approval. RED QUEEN evaluates its findings and produces the final intelligence or preparedness protocol.

Working names: **Survival Ally**, **Queen's Sentinel**, or **Crowned Agent**.

The first Agent Studio prototype now compiles a portable `rq-agent-blueprint-v1` manifest locally. It applies observed `$THREAT` capacity to agent slots and module count, keeps every payment on `EVERY_OPERATION` approval, denies irreversible actions, and can hand the blueprint to RQ Proof Protocol. It does not deploy, host, register or run an autonomous agent yet.

## 1.1 RQ Proof Protocol

An important Queen result, preparedness protocol, comparison or agent blueprint can be fingerprinted locally. An optional user-approved Solana Memo transaction contains only `RQ_PROOF_V1`, artifact type, timestamp and SHA-256 hash. The full artifact, title, sources, location and household context stay off-chain.

The proof establishes that one wallet anchored one exact opaque version at a time. It does not prove that a forecast is true, that a source is correct, or that a user is safe. Proof creation never awards BIO-SCORE, readiness or token rewards.

## 2. Shared Chamber

The Chamber contains a holder chat where RED QUEEN is an active participant rather than a passive chatbot. Members can:

- discuss signals, preparedness, Solana safety, lore, and product ideas;
- ask RED QUEEN to create a visual artifact, background, graffiti, lore fragment, or approved interface block;
- inspect a safe live preview before anything is published;
- vote on proposals and community bounties;
- see the author, status, review history, and final result of each contribution.

The first implementation should be a **Queen Canvas** driven by a strict component and configuration schema. RED QUEEN may change only approved properties such as imagery, copy, atmosphere, layout presets, and whitelisted widgets. This provides visible co-creation without arbitrary code execution.

## 3. Queen Forge

Requests that genuinely require code enter a separate controlled workflow:

1. RED QUEEN converts the request into a bounded specification.
2. Work runs in an isolated development environment.
3. The agent creates a separate Git branch.
4. Automated type, build, security, and policy checks run.
5. A pull request and preview deployment are created.
6. The community can inspect the result.
7. Only an authorized administrator can merge it.

RED QUEEN never pushes directly to production from community chat. GitHub, AI provider, Vercel, and Supabase credentials remain server-side and are never exposed to the browser or participating agents.

## 4. Bring Your Own Agent

A later phase allows an external agent to enter the ecosystem with a verifiable identity and bounded capabilities. A compatible agent may declare an 8004 identity, MCP endpoint, capability manifest, operational wallet, and x402 support.

External agents can request RED QUEEN intelligence, pay for approved resources through x402, provide their own bounded capability, or collaborate on a Chamber task. They receive no direct access to repositories, secrets, private user data, or production infrastructure.

## 5. Contribution incentives

The system rewards useful outcomes rather than message volume. Eligible contributions can include verified signal context, preparedness templates, accepted interface proposals, lore artifacts, product testing, agent skills, and completed community bounties.

Rewards may include Protocol XP, contributor reputation, badges, expanded Chamber permissions, attribution, and later community-treasury bounties. BIO-SCORE remains evidence-based and cannot be purchased or increased by holdings, voting, or ordinary chat activity.

## Suggested clearance rights

| Clearance | Proposed Chamber capability |
| --- | --- |
| Scout | Enter the Chamber, read, participate, and vote |
| Analyst | Create structured proposals and use the Personal Ally |
| Sentinel | Generate previews and initiate bounded agent tasks |
| Command | Sponsor advanced builds and coordinate larger bounties |

Clearance alone must never grant production merge authority. Reputation, contribution history, automated checks, and administrator approval remain separate controls.

## Security contract

- Fresh sign-in, wallet ownership, and `$THREAT` balance verification are required for holder capabilities.
- Every agent tool has an explicit allowlist, input schema, rate limit, and audit record.
- Generated content is sanitized; arbitrary scripts and unsandboxed dependencies are rejected.
- Code work runs in isolation and produces a reviewable diff, not a direct production mutation.
- Financial actions require a displayed amount, spending limit, and separate wallet approval.
- Prompt injection, secret extraction, repository manipulation, spam, and malicious dependencies fail closed.
- Community moderation and emergency admin controls remain available.

## Delivery order

1. [~] Personal Survival Ally with bounded memory, watches, and permissions. Local blueprint compiler and holder capacity are implemented; execution is not.
2. [x] Privacy-preserving RQ Proof Protocol prototype for Queen outputs and agent blueprints.
3. [ ] Contribution records, reputation, proposals, and bounties.
4. [ ] Holder-gated Queen Canvas and shared Chamber.
5. [ ] Bring Your Own Agent through 8004, MCP, and x402 boundaries.
6. [ ] Queen Forge with isolated code generation, GitHub pull requests, and preview deployments.

## Product value

THE QUEEN'S CHAMBER turns `$THREAT` access into participation in a living intelligence system. Holders do not merely unlock more chat capacity. They gain personal agents, a governed creative space, verifiable contribution history, and a safe mechanism for helping RED QUEEN and the platform evolve.
