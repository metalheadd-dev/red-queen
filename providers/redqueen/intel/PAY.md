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

* **USGS**: Recent significant earthquake observations.
* **NASA EONET**: Open environmental hazards with geospatial context.
* **GDACS**: EC JRC / UN disaster alerts.
* **NOAA SWPC**: Space-weather alerts, watches and warnings.
* **CISA KEV**: Vulnerabilities with known exploitation evidence.
* **WHO DON**: Acute public-health event notices.
* **Official Solana Status**: Unresolved Mainnet, RPC and component incidents.
* **Solana Mainnet RPC**: Validator, epoch, performance and prioritization-fee telemetry for the separate network-health operation.

## Endpoint Authentication & x402 Micropayments
All premium endpoints require on-chain stablecoin micro-settlement via the x402 V2 protocol.

* **`/api/intel/premium`**: Beta global synthesis across the seven-source verified signal grid. Delivery requires at least four reachable source families.
  * Price: **0.01 USDC**
* **`/api/intel/depin`**: Solana validator status tracking, average priority fee rates, and live slot performance samples.
  * Price: **0.02 USDC**

Payment challenges are served as HTTP 402 challenges and settled automatically by x402-compliant clients (such as the `pay.sh` CLI or agent nodes).

Purchases never award XP or BIO-SCORE. Runtime payment requirements declare the current recipient and asset; this file does not hardcode a treasury address. If minimum source coverage is unavailable, the handler returns `503` and x402 cancels settlement rather than delivering synthetic telemetry.
