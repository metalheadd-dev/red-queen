---
name: intel
title: Red Queen Intelligence Mainframe
description: Source-bounded survival intelligence API exposing public Pulse data and two beta x402 operations on Solana.
use_case: AI agents query source-backed environmental signals or purchase a declared Solana telemetry operation through x402.
category: data
service_url: https://redqueen.space
openapi:
  path: openapi.json
---

# Red Queen API

RED QUEEN exposes public survival intelligence and beta paid operations. Live map claims use source-backed coordinates and never mix scenario-library fiction into the live layer.

*   **USGS Earthquakes**: Live tectonic activity and seismic disruption telemetry.
*   **NASA EONET**: Open environmental hazards (storms, fires, volcanic activity).
*   **GDACS Alerts**: Global coordination and disaster alert monitoring.
*   **GDACS**: EC JRC / UN disaster alert monitoring with event coordinates.
*   **Solana Mainnet RPC**: Validator, epoch, performance and prioritization-fee telemetry.

## Endpoint Authentication & x402 Micropayments
All premium endpoints require on-chain stablecoin micro-settlement via the x402 V2 protocol.

* **`/api/intel/premium`**: Beta global source synthesis using current USGS and NASA data.
  * Price: **0.01 USDC**
* **`/api/intel/depin`**: Solana validator status tracking, average priority fee rates, and live slot performance samples.
  * Price: **0.02 USDC**

Payment challenges are served as HTTP 402 challenges and settled automatically by x402-compliant clients (such as the `pay.sh` CLI or agent nodes).

Purchases never award XP or BIO-SCORE. If a required source is unavailable, paid endpoints fail closed and do not return synthetic telemetry.
