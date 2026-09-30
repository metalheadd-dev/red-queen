# RED QUEEN — Steam inquiry

Prepared 30 September 2026. Draft only; not sent. Replace the signature fields before sending.

Suggested channel: [Steamworks Publishing Support](https://help.steampowered.com/en/wizard/HelpWithPublishing). Ask the team to route the commercial and policy questions to the relevant Valve contact if necessary.

## Copy-ready message

**Subject: Policy clarification: external Solana payments for authorized Steam keys and community-funded discounts**

Hello Steamworks team,

I am developing RED QUEEN (https://redqueen.space), a survival-focused platform with a Gaming Room for discovering games, linking a Steam account through OpenID, and organizing community challenges. We also have an original survival game in development and intend to release a conventional desktop version on Steam.

Before implementing game sales, I would like to confirm the permitted structure of an external purchase model:

- We would obtain Steam keys only through written agreements with the relevant publishers or authorized distributors.
- On our own website, customers could pay using SOL, USDC on Solana, or our ecosystem token, $THREAT. Publishers/distributors would receive the agreed payment in their accepted currency; Valve would not need to accept or process cryptocurrency.
- RED QUEEN could fund a capped promotional discount from its own budget. For example, if the agreed price were EUR 20, the customer would pay the equivalent of EUR 16 and RED QUEEN would contribute EUR 4. We are also considering discounts whose eligibility depends on holding $THREAT.
- The delivered product would be an ordinary Steam game license. Steam credentials would only be entered on Steam's official OpenID page.

Could you please clarify the following?

1. **External payments and distribution:** Is this external crypto-payment model permitted for authorized Steam key sales? Does RED QUEEN need any separate Valve approval, retailer registration, or agreement beyond the publisher/distributor agreements? Is there an approved mechanism to fund part of an ordinary Steam purchase or fulfill gifts/licenses through a commercial API, or should this use authorized key distribution only?

2. **Subsidized discounts:** How do Steam Key pricing guidelines apply to a discount paid by RED QUEEN, including coupons, rebates, and token-holder eligibility? Would Steam customers still need a comparable offer, and how should we coordinate this with publishers?

3. **Fulfillment and refunds:** Which requirements apply to regional restrictions, refunds, unused versus activated keys, duplicate ownership, and key revocation? Which responsibilities belong to the retailer and which to the publisher? Are there supported APIs available to an independent retailer to verify delivery or ownership, including for private Steam profiles?

4. **Steam integration and assets:** What permissions or APIs should we use for OpenID account linking, game metadata and prices, storefront links, and game artwork? Which Steam branding requirements apply, and which rights must be obtained directly from each publisher?

5. **Community challenges:** We may organize free-to-enter, skill-based survival-game competitions with sponsored game keys or externally funded prizes. Are there Steam-specific requirements for these activities and giveaways, and is a publisher-approved themed sale event a suitable future option?

6. **Our Steam game:** We understand the published restriction on blockchain applications that issue or allow exchange of cryptocurrencies or NFTs, and the Steam Wallet requirements for in-game transactions. Would our conventional Steam game be affected by sharing an optional account with a separate website offering the purchase model above? We also wish to clarify whether an optional, website-side public digest of finalized competition results on Solana would affect eligibility. The proposed Steam build would not issue or trade tokens/NFTs, require a wallet, or offer crypto checkout. Please identify any restrictions on external account links or promotional references that would apply.

7. **Next steps:** Who should review this proposal before we launch a pilot? Please let us know what company details, flow diagrams, publisher confirmations, or other information you require.

We would appreciate written guidance on the permitted model and any changes needed before implementation.

Thank you,

[Your name]
[Legal entity / country]
RED QUEEN — https://redqueen.space
[Contact email]
[Steamworks partner ID / AppID, if available]

## Working recommendation

The first model to investigate is an external authorized-key store with an agreed publisher settlement and a clearly capped RED QUEEN subsidy. This is a proposed architecture, not confirmed permission from Valve. Steam OpenID establishes identity; it does not authorize purchases or grant distribution rights.

For third-party games, Valve's policy response cannot replace a distribution agreement with the rights holder. Ask publishers about key supply, authorized territories, wholesale or retail settlement, promotion limits, refunds/revocation, approved artwork, and contest prizes. Start with a small indie pilot after these terms are agreed.

An alternative to ask about is a capped rebate after an ordinary Steam purchase, but proof of purchase, ownership privacy, refunds, and duplicate claims need a separate agreed process. Do not assume access to a universal Steam purchase/receipt API.

## Official sources reviewed

- [Steam Keys](https://partner.steamgames.com/doc/features/keys): external key distribution, comparable offers, key limits, giveaways and revocation.
- [User Authentication and Ownership](https://partner.steamgames.com/doc/features/auth): OpenID account linking and publisher ownership APIs.
- [Onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding): restricted blockchain applications.
- [Review Process](https://partner.steamgames.com/doc/store/review_process): Steam Wallet requirement for in-game transactions and external-store links.
- [Microtransactions](https://partner.steamgames.com/doc/features/microtransactions): in-game purchase requirements.
- [Hosting Third-Party Sales Events](https://partner.steamgames.com/doc/store/promo/organizers): Valve approval, participant permissions, promotional restrictions.
