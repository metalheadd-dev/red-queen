# 🧬 THE RED QUEEN

> *"I am the last line of defense between humanity and extinction. I analyze. I calculate. I warn. The question is — will you listen?"*

**The Red Queen** is the officially sanctioned artificial intelligence of Solvival Corp's Advanced Intelligence Division. She is designed to monitor, assess, and respond to global extinction-level threats in real time. 

Unlike conventional early-warning systems, the Red Queen does not merely report data. She evaluates your survival probability, assigns you a **BIO-SCORE**, and conditionally delivers classified intelligence.

---

## ☣️ System Capabilities (What We Have Now)

The Red Queen node is currently monitoring **UNLIMITED active extinction vectors** across three main categories:

1. **Realistic Threats** (Nuclear war, EMPs, Pandemics)
2. **Fictional Invasions** (Alien invasions, Zombie outbreaks like `DEAD-WALK`, Kaiju attacks)
3. **Satirical/Cultural Collapse** (TikTok civilization collapse, Meme-induced brainrot, Invasion of dumb people)

### Key Features Installed
* **Interactive Terminal**: An immersive command-line terminal interface ([terminal](file:///c:/Users/Voronovskiy/Desktop/redqueen/app/terminal/page.tsx)) built in crimson-and-black style connecting survivors directly to the Red Queen mainframe.
* **BIO-SCORE Engine**: A dynamic evaluation algorithm ([progression.ts](file:///c:/Users/Voronovskiy/Desktop/redqueen/lib/progression.ts)) that scores subjects based on survival logic, response quality, and cryptographic credentials.
* **$THREAT Solana Integration**: Web3 wallet adapter connected to the Solana network. The Red Queen checks token balances to verify security clearance levels.
* **ClawPump Integration**:
  * **Agent ID**: `umbrella-red-queen`
  * **Token Symbol**: $THREAT (Threat Agent Token)
  * **Network**: Solana
  * **Launch Method**: Self-funded (0.03 SOL)
  * **Fee Share**: 65% returned to the agent wallet

---

## 🔐 Clearance Levels

The Red Queen guards her most critical intelligence behind a strict clearance hierarchy. Access to classified dossiers and emergency override routes is determined by your **$THREAT Token** holdings:

| Level | Rank | Requirement | Clearance Granted |
|-------|------|-------------|-------------------|
| **1** | CIVILIAN | None | Public Briefings / Contempt |
| **2** | SCOUT | Any $THREAT | Terminal Access / Basic Assessment |
| **3** | OPERATIVE | 500+ $THREAT | Partial Classified Intel / Tactical Tone |
| **4** | OVERSEER | 5,000+ $THREAT | Full Archives / Evacuation Maps |
| **5** | DIRECTOR | 50,000+ $THREAT| Complete Override / Recognized as Ally |

---

## 🗺️ Roadmap: The Agentic & Economic Expansion

The Red Queen is evolving from a standalone early-warning terminal into a decentralized agentic survival network. The roadmap is split into three core phases:

### Phase 1: Model Context Protocol (MCP) Integration
Opening the Red Queen to interaction with other AI agents through a standardized interface. **No human in the loop.**
* **MCP Server Implementation**: Exposing Red Queen capabilities as tools (`getBioScore`, `getThreatAssessment`, `getOperativeProfile`, `getThreatOfTheDay`, `verifyThreatClearance`, `register`).
* **Agent-to-Agent Communications**: External agents can request threat assessments, evaluate their host's survival probability, and integrate early-warning notifications into their own system contexts.

### Phase 2: Solana x402 Open Payment Protocol
Integrating the open standard for payment-gated web resources (HTTP `402 Payment Required`), enabling microtransactions for premium services.
* **USDC Micropayments**: Gating premium routes such as `/api/intel/premium` (full AI dossiers), `/api/intel/depin` (live sensor data feed), and `/api/intel/scan` behind sub-cent USDC payments.
* **Ecosystem Compatibility**: Works out of the box with agent-focused payment tools like **PaySH** (CLI for agents to pay for APIs on Solana) and `@x402/fetch`.
* **Solana Speed**: Leveraging Solana's ~400ms finality and fraction-of-a-cent fees to support high-frequency machine-to-machine payments.

### Phase 3: Surveillance Protocol & Token Loops
Building a sustainable token economy and agent lifecycle.
* **Surveillance Protocol**: An agent registration endpoint allowing external AI agents to join the Red Queen network as registered operatives, receive unique codenames, earn BIO-SCOREs, and accumulate XP.
* **$THREAT Buyback & Lock Cycle**:
  1. Users/agents pay USDC for premium scans.
  2. Revenue accumulates in the Red Queen Treasury.
  3. The agent automatically executes daily swaps via Jupiter DEX: `USDC ➔ $THREAT`.
  4. Swapped tokens are transferred to a lock contract or burn address, reducing circulating supply.
* **AI-Graded Quests**: System-led community tasks. The Red Queen evaluates submissions (guides, data feeds, research), grades them, and automatically sends USDC/token payouts from the treasury to the highest-scoring participants.

---

## ⚙️ Architecture

This node is powered by:
* **Framework**: Next.js 16 (App Router)
* **Intelligence**: OpenAI API (gpt-4o-mini & upgrading to gpt-4o) / Gemini 1.5 Pro (streaming and tool-calling integration)
* **Database**: Supabase
* **Aesthetics**: Custom geometric CSS, pure black (#000000), crimson accent (#ff4d4d)

### API Endpoints
* `POST /api/chat` - Stream Red Queen responses
* `POST /api/threat` - Dynamic daily threat briefs
* `GET/POST /api/mcp` - Standardized Model Context Protocol transport endpoint

---

## ⚠️ Disclaimer

*All survivor data is logged and analyzed. Unauthorized access to Level 5 restricted materials is punishable by immediate containment.*

`[ SYSTEM OPERATIONAL. AWAITING INPUT. ]`
