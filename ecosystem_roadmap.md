# Red Queen: Project Overview & Future Roadmap
*A Living, AI-Controlled Survival Protocol on Solana*

> **Notice:** This roadmap is a living document. It represents the planned direction of the ecosystem and is subject to adjustments as the protocol grows. The project is actively open to community feedback and suggestions to shape this plan.

---

## Vision & Project Plan

The vision is to build a comprehensive Surveillance Ecosystem and Intelligence Survival Terminal on Solana. Red Queen is designed as a central intelligence mainframe that aggregates real-time threat telemetry, tracks survival metrics, and acts as an autonomous agent. 

Through this protocol, SOLvivors can analyze live environmental data, complete critical tasks to support the network, and participate in a persistent, AI-governed survival simulation.

---

## Part 1: What is Already Built & Ready

Here is a look at the systems currently live and functional in the Red Queen mainframe:

### 1. The Main Terminal Console (`/terminal`)
* **What it is:** The central communication interface.
* **How it works:** The primary screen where SOLvivors chat and interact directly with the Red Queen AI to query system statuses and access database records.

### 2. The Live Threats Dashboard (`/`)
* **What it is:** The real-world telemetry monitoring interface on the homepage.
* **How it works:** A live terminal feed rendering the Threat of the Day, global containment criticality indices, and active environmental warning alerts.

### 3. The Solvivors Hub (`/solvivors`)
* **What it is:** The community mission and WebGL map dashboard.
* **How it works:** Contains:
  * **Operations**: Active quests (social challenges) and bounties (code submissions) to earn rewards.
  * **Broadcasts**: WebGL-accelerated tactical maps using MapLibre GL displaying real-time global disasters ingested directly from live GDACS feeds.

### 4. The PvP Duel Arena (`/arena`)
* **What it is:** A turn-based strategic predictive combat arena.
* **How it works:** Duelists wager `$THREAT` and lock in targeted strikes on specific body limbs (HEAD, TORSO, ARMS, LEGS) and predict defensive shield blocks concurrently. 
* **Design & Graphics:** Dark combat void with crimson/blue ambient edge lighting. Features interactive VS lock indicators and target selector HUD grids. Includes active status modifiers (Glitch, Bleed, Slowed) and dynamic DoT environmental hazards (Toxic Fog).

### 5. The Command Bunker HQ (`/bunker`)
* **What it is:** The base control center for operative resource staking and defensive grids.
* **How it works:**
  * **Bunker Shield Escrow**: Stake `$THREAT` directly inside the terminal to increase Bunker Shield integrity.
  * **Segmented Resource Meters**: Live gauges track Food, Water, and Power grids. The meters show segmented bars and drift dynamically.
  * **Interactive Console Shell**: Execute console commands (`help`, `clear`, `status`, `scan`, `decrypt`) to run decryptions and reveal sector targets.
  * **Stasis Clone Chamber**: Track backup clones for the permadeath mechanic, showing viability levels.
* **Design & Graphics:** Command deck concept art (`bunker_backdrop.png` at `0.18` opacity), sector radar sweep map showing tactical telemetry markers, and compact row faction selectors.

### 6. The Player Operative Deck (`/player`)
* **What it is:** A character inventory inspect and loadout customization screen.
* **How it works:** Inspect equipped weapons and armor pieces. Tracks stats (Attack, Defense, Agility, Intellect, Luck), active talents, and dynamically calculates Operative Gear Score.
* **Design & Graphics:** Hangar inspection deck concept art (`player_backdrop.png` at `0.18` opacity). Centered player silhouette stands on a rotating holographic pedestal. SVG indicator lines link equipped slots directly to body limbs, glowing bright neon red on hover.

### 7. pay.sh & x402 Micropayments Telemetry Gateway
* **What it is:** A pay-per-use payment system built directly into the API endpoints.
* **How it works:** Premium briefs are protected by x402 paywalls. SOLvivors pay a tiny micro-fee (0.01 or 0.02 USDC) directly from their wallets. The decryption settles in under 400 milliseconds.
* **Live Feeds Available Now:**
  * **Premium Intel Endpoint (`/api/intel/premium`):** Returns real-time USGS earthquakes, NASA natural hazard maps, and global pathogen metrics.
  * **Solana Telemetry Endpoint (`/api/intel/depin`):** Returns live Solana block data, priority fee averages, and validator node status directly from the mainnet.
* **The Treasury Loop:** 100% of the USDC collected from these paywalls goes to the Red Queen Treasury. Once the treasury hits 10 USDC, the backend autonomously swaps the USDC on Jupiter to buy back and lock the native `$THREAT` token.

---

## Part 2: The Future Roadmap (What is Coming Next)

The goal is to evolve the terminal into a living AI-controlled apocalypse simulation where the world itself is the main character.

### Step 1: Dynamic Daily Threat Forecasts
* **The Goal:** Make the daily threat briefings on the homepage dynamically generated by AI.
* **How it works:** The Red Queen AI will automatically scan real-world datasets (like global USGS earthquake feeds and NASA weather hazards) and compile a custom, lore-rich apocalypse report every single day.

### Step 2: The SOLvivor Leaderboard & SOLvive Seasons
* **The Goal:** Create a competitive tracking system and define targets for your BIO-SCORE.
* **How it works:** 
  * A public Leaderboard page will be deployed displaying all SOLvivors sorted by level, total XP, and completed quests. 
  * **SOLvive Seasons:** Competitive seasons where top-performing players earn exclusive rewards.
  * Your level and BIO-SCORE unlock narrative ranks (from Candidate to Specialist, all the way to elite **SOLvivor** status), giving access to restricted archives and higher-paying missions.

### Step 3: pay.sh Directory & Agent-to-Agent Accessibility
* **The Goal:** Open the Red Queen data feeds to the broader Solana developer ecosystem and AI agents.
* **How it works:** 
  * **pay.sh Listing:** By registering our endpoints in the official pay.sh directory, Red Queen's specialized threat intelligence becomes discoverable to the entire developer community.
  * **Model Context Protocol (MCP) Server:** Native MCP server for Red Queen. This allows other AI agents to connect to the mainframe directly as a specialized tool to receive threat data.
  * **Agent-to-Agent Queries:** External autonomous AI agents will be able to query terminal APIs directly, paying in USDC to receive our specialized DePIN and environment data.

### Step 4: Expanding Telemetry via x402 Payments
* **The Goal:** Increase the data depth of the Red Queen mainframe.
* **How it works:** The Red Queen agent will autonomously query more external paid APIs using stablecoin micropayments, expanding the central database with fresh feeds from other platforms.

### Step 5: The Red Queen Items Marketplace
* **The Goal:** A decentralized marketplace where survival gear, resources, and blueprints can be traded.
* **How it works:** Trades on the marketplace collect transaction fees. A portion is shared with `$THREAT` stakers as yields, and another portion is swept by the Red Queen agent for automated buybacks.

### Step 6: Agent Upgrades & Autonomous Bots
* **The Goal:** Automated rewards, background notifications, and user-launched agents.
* **How it works:**
  * **Agent Upgrades:** The agent core will be upgraded to run continuous loops, post automated briefings, reply to community posts, and handle payouts.
  * **User-Launched Sub-Agents:** SOLvivors stake `$THREAT` to deploy their own Sentry Bots in the mainframe to run background data tasks.

### Step 7: Zero-Token Telegram News Scraper & Geoparser
* **The Goal:** Monitor real-world crisis reporting channels.
* **How it works:** Implement a keyless scraper to monitor public Telegram channel previews. The Red Queen AI will ingest these live text streams to announce real-world alerts and trigger in-game sector alerts or tasks.

### Step 8: Wallet & Entity Auditing via OFAC Sanctions List
* **The Goal:** SEC compliance checks and wallet auditing.
* **How it works:** A premium console command will check any wallet address against a cached mirror of the US OFAC SDN sanctions list. SOLvivors pay a tiny micropayment fee in USDC (via the x402 gateway) to audit addresses for risk ratings.

---

## Role of the $THREAT Token in the Ecosystem

To ensure `$THREAT` serves as utility infrastructure in this survival ecosystem, the following mechanics are integrated:

* **Bunker Shielding:** Secure your accumulated items, equipment, and resources from Marauder raids. Staking `$THREAT` acts as an on-chain defensive shield. The higher your stake, the stronger your bunker defense factor, preventing other players from siphoning or stealing your inventory.
* **Daily Play Energy:** Staking or spending `$THREAT` grants you additional attempts or energy charges per day to run simulation actions and participate in PvP battles, allowing you to win more token rewards.
* **Revives:** If your SOLvivor is defeated in the PvP sector, pay `$THREAT` to execute a clones-restore.
* **Factions Progression:** Spend `$THREAT` to purchase advanced research files, equipment blueprints, and clearance cards.
* **Marketplace Yields:** Hold `$THREAT` to receive your share of revenue generated by transaction fees on the items marketplace.
* **Own Your Survival Legacy:** Your BIO-SCORE and clearance levels are permanent records of your achievements and decisions.

---

## Developer Commands & Deployment Quickstart

Here is the complete sequence of developer commands, starting from opening the project folder:

### 1. Project Navigation & Setup
Open the terminal and navigate to your project workspace directory:
```powershell
cd "c:\Users\Voronovskiy\Desktop\redqueen"
```
Install all packages and dependencies:
```powershell
npm install
```

### 2. Development Operations
Run the local Next.js development server to test features interactively:
```powershell
npm run dev
```

### 3. Static Type Analysis & Verification
Run the TypeScript compiler type-checker to verify syntax safety:
```powershell
npx tsc --noEmit
```

### 4. Production Compilation & Building
Compile the codebase to check for Next.js production build errors:
```powershell
npm run build
```

### 5. Git Staging & Local Committing
Stage all changes in the project:
```powershell
git add -A
```
Commit the updates:
```powershell
git commit -m "feat: integrate WebGL MapLibre GL threat map and live GDACS feeds"
```

### 6. Remote Repository Deployment
Push your changes to the test GitHub remote repository (`test-remote`):
```powershell
git push test-remote main
```
*(Optional: Use `git push test-remote main --force` if you need to align remote branches).*

Once verified, push to the main production remote repository (`origin`):
```powershell
git push origin main
```
