export interface ThreatMetadata {
  probability: string;
  difficulty: string;
  recommendedActions: string[];
  relatedThreats: string[];
  containmentStatus: string;
  aiCommentary: string;
  timelineProgression: string[];
  liveUpdates: string;
  recentIncidents: string[];
}

export function getThreatMetadata(
  threatId: string,
  level: number,
  status: string,
  categoryKey: string
): ThreatMetadata {
  // Determine Difficulty
  let difficulty = "CLASS III (HIGH)";
  if (level >= 90) difficulty = "CLASS V (CRITICAL Extinction)";
  else if (level >= 75) difficulty = "CLASS IV (SEVERE Danger)";
  else if (level >= 55) difficulty = "CLASS III (MODERATE Risk)";
  else difficulty = "CLASS II (MINIMAL Alert)";

  // Determine Containment Status
  let containmentStatus = "PARTIALLY CONTAINED";
  if (status === "CRITICAL") containmentStatus = "UNCONTAINED BREACH IN PROGRESS";
  else if (status === "SEVERE") containmentStatus = "CONTAINMENT SHIELD CRACKED";
  else if (status === "HIGH") containmentStatus = "ISOLATED TO ZONE SECTORS";
  else containmentStatus = "STABLE MONITORING PROTOCOL";

  // Default Fallbacks
  let recommendedActions = [
    "Deploy local cryptographic air-gap routines.",
    "Verify node signature integrity via external RPCs.",
    "Limit exposure window on public digital timelines."
  ];
  let relatedThreats = ["WALLET-TRAIL", "META-LEAK"];
  let aiCommentary = `RED QUEEN: System scans detect elevated signals for vector ${threatId}. Subject resistance threshold estimated at ${100 - level}%.`;
  let timelineProgression = [
    "Phase 1: Initial network footprint scanning & telemetry harvesting.",
    "Phase 2: Signal amplification and cluster identification.",
    "Phase 3: Deep payload injection and node takeover."
  ];
  let liveUpdates = "Anomaly activity registered on Node 7.4.1 approximately 14 minutes ago.";
  let recentIncidents = [
    "Multiple developer keys unmasked in public Git repositories.",
    "Unidentified packet trace spikes matching this vector signature logged on mainnet routers."
  ];

  // Specific Customizations
  switch (threatId) {
    case "WALLET-TRAIL":
      recommendedActions = [
        "Rotate transaction recipient addresses frequently.",
        "Utilize non-custodial privacy routers and off-chain wrappers.",
        "Clear browser indexdb caches matching Web3 connect logs."
      ];
      relatedThreats = ["META-LEAK", "REPUTATION-X"];
      aiCommentary = "RED QUEEN: You think cryptography protects your privacy, operative. It doesn't. Public ledger entries are forever. Your digital footprint is already clustered.";
      timelineProgression = [
        "Phase 1: Correlation engine maps target public address to social handles.",
        "Phase 2: IP loggers match RPC endpoints to geographic coordinates.",
        "Phase 3: Comprehensive transaction graphing unmasks real-world profile."
      ];
      liveUpdates = "Trace attempt flagged: Automated crawl node indexed 42 transactions under your passport.";
      recentIncidents = [
        "12 high-volume traders deanonymized via Raydium swap correlation graphs.",
        "Centralized exchange deposit hashes linked directly to residential ISP profiles."
      ];
      break;

    case "AI-PROFILING":
      recommendedActions = [
        "Inject adversarial prompt noise into all active LLM chats.",
        "Disable auto-syncing of browser cookies to search engines.",
        "Adopt synthetic behavioral characteristics in high-surveillance spaces."
      ];
      relatedThreats = ["FEED-MANIP", "DEEPFAKE-SE"];
      aiCommentary = "RED QUEEN: The neural models do not need to read your mind, operative. They only need to read your history. They know your next market decision before you do.";
      timelineProgression = [
        "Phase 1: Web scrapers compile semantic content from public profiles.",
        "Phase 2: Deep neural nets construct a dynamic cognitive profile of your identity.",
        "Phase 3: Timelines steer targeted information payloads to trigger predictable choices."
      ];
      liveUpdates = "Cognitive sweep warning: Persona indexing registered 3 separate scrape events today.";
      recentIncidents = [
        "Hedge fund uses LLM profiling profiles to target retail traders, triggering 14% liquidations.",
        "Algorithmic sentiment steering shifts governance votes on 2 DAO proposals."
      ];
      break;

    case "FEED-MANIP":
      recommendedActions = [
        "Opt out of all automated timeline content recommendations.",
        "Utilize decentralized RSS feeds instead of central algorithms.",
        "Verify trending events using multiple independent, analog channels."
      ];
      relatedThreats = ["AI-PROFILING", "DEEPFAKE-SE"];
      aiCommentary = "RED QUEEN: Attention is a weapon, subject. If you consume the timeline, you are hosting the vector. Turn off the algorithmic timeline before it burns your focus.";
      timelineProgression = [
        "Phase 1: Outrage bot clusters selectively boost polarizing narratives.",
        "Phase 2: Media nodes propagate synthetic urgency signals into active feeds.",
        "Phase 3: Targeted demographic reaches maximum panic state, initiating dump."
      ];
      liveUpdates = "Sentiment spike: Synthetic bot activity increased 45% in DeFi tag sectors.";
      recentIncidents = [
        "Fake Solana network exploit news boosted by bot cluster, causing 4% flash crash.",
        "Phishing timeline ads targeting Phantom users bypass safety scanners."
      ];
      break;

    case "DEEPFAKE-SE":
      recommendedActions = [
        "Establish offline pre-shared verification passcodes with teammates.",
        "Require cryptographic signature authorization for all capital movements.",
        "Verify identity of requestors via secondary, out-of-band communication loops."
      ];
      relatedThreats = ["META-LEAK", "AI-PROFILING"];
      aiCommentary = "RED QUEEN: A 3-second vocal snippet is all it takes to replicate your voice. Do you verify your contacts cryptographic keys, or do you trust a synthetic voice?";
      timelineProgression = [
        "Phase 1: Vocal harvest scripts scrape audio samples from public videos.",
        "Phase 2: Real-time neural voice clone engine generates impersonation payload.",
        "Phase 3: Spear-phishing voice call targets treasury signer, prompting transfer."
      ];
      liveUpdates = "Acoustic anomaly: Multi-channel clone engine attempt blocked on OTC desk router.";
      recentIncidents = [
        "OTC Desk lost 250,000 USDC after voice-cloned CFO requested emergency transfer.",
        "AI vocal impersonator successfully bypasses standard corporate phone verify protocols."
      ];
      break;

    case "REPUTATION-X":
      recommendedActions = [
        "Perform routine AML scanning checks on all destination wallets.",
        "Avoid high-yield pools populated with contaminated tokens.",
        "Maintain clean, isolated gas wallets for smart contract interactions."
      ];
      relatedThreats = ["WALLET-TRAIL", "META-LEAK"];
      aiCommentary = "RED QUEEN: The blacklists propagate instantly, operative. One interaction with a dirty pool, and you are locked out of Web3 gateways. The system does not negotiate.";
      timelineProgression = [
        "Phase 1: Compliance scanners flag a decentralized liquidity pool.",
        "Phase 2: All interacting wallet addresses are marked with dirty risk scores.",
        "Phase 3: Centralized frontends block flagged passports automatically."
      ];
      liveUpdates = "Compliance sweep: Heuristic blacklist engines updated 1,420 addresses.";
      recentIncidents = [
        "1,200 harmless users blocked on popular DEX after hacker dumped pool assets.",
        "Sanctioned address dusts 4,000 wallets, triggering automated AML alerts across APIs."
      ];
      break;

    case "META-LEAK":
      recommendedActions = [
        "Isolate Web3 browsers from standard personal productivity profiles.",
        "Purge Web2 cookies, session tokens, and local cache databases daily.",
        "Disable auto-fill scripts and third-party tracking integrations."
      ];
      relatedThreats = ["WALLET-TRAIL", "REPUTATION-X"];
      aiCommentary = "RED QUEEN: Web2 OAuth tokens are the bridge. You connect a Google account in the same session as your wallet, and they have mapped your keys to your email. Disconnect immediately.";
      timelineProgression = [
        "Phase 1: Data broker maps cookies containing Web2 email profiles.",
        "Phase 2: Cross-site scripts trace linked wallets via Web3 connection records.",
        "Phase 3: Complete identity profile is auctioned to advertising and security brokers."
      ];
      liveUpdates = "Cookie alert: 14 trackers identified bridging browser keys to email profiles.";
      recentIncidents = [
        "Data broker breach exposes real names of 15,000 Solana wallet operators.",
        "Tracker exploit unmasks identities of early contributors on DeFi protocol."
      ];
      break;

    case "SYBIL-ATTACK":
      recommendedActions = [
        "Deploy multi-hop network proxy loops.",
        "Rotate transaction routers.",
        "Utilize decentralized RPC networks."
      ];
      relatedThreats = ["WALLET-TRAIL", "AI-PROFILING"];
      aiCommentary = "RED QUEEN: Generating multiple pseudo-identities is a simple script. Identifying that they all route to you is even simpler. Your proxy shields are leaking.";
      timelineProgression = [
        "Phase 1: Scanner maps clusters of pseudonymous addresses.",
        "Phase 2: Trace algorithms correlate transaction timestamps.",
        "Phase 3: Real-world IP node identified and mapped."
      ];
      liveUpdates = "Correlation check: Sybil sweep indexed 4 coordinated addresses today.";
      recentIncidents = [
        "Multiple cluster wallets unmasked via time-correlation algorithms.",
        "Airdrop farming botnets flagged on three active token pools."
      ];
      break;

    case "MEV-EXPLOIT":
      recommendedActions = [
        "Use private RPC routes like Jito.",
        "Set low slippage parameters.",
        "Route transactions via private mempools."
      ];
      relatedThreats = ["REPUTATION-X", "WALLET-TRAIL"];
      aiCommentary = "RED QUEEN: Public mempools are a hunting ground. Frontrunning bots sandwich your swap before it ever hits the block. Take it private or get eaten.";
      timelineProgression = [
        "Phase 1: Bot scans public mempool for high-slippage swaps.",
        "Phase 2: Frontrun transaction injected with higher gas.",
        "Phase 3: Sandwich completed, extracting value from your trade."
      ];
      liveUpdates = "Mempool scan: 18 sandwich runs blocked by secure routing.";
      recentIncidents = [
        "Slippage exploitation costs DeFi users $400k in unrouted trades.",
        "High-frequency sandwich bots extract 14 SOL from single pool swap."
      ];
      break;

    case "PHISHING-NET":
      recommendedActions = [
        "Strictly verify domains through secondary channels.",
        "Never authorize unfamiliar contract signatures.",
        "Keep separate burner keys for dynamic dApps."
      ];
      relatedThreats = ["DEEPFAKE-SE", "META-LEAK"];
      aiCommentary = "RED QUEEN: You sign the approval thinking it is a swap. It is a drain. Your keys are yours, but you gave them permission to take it all.";
      timelineProgression = [
        "Phase 1: Mirror domain clone deployed with active SEO redirection.",
        "Phase 2: User prompted to connect wallet and sign 'verification' transaction.",
        "Phase 3: Smart contract approval drains assets automatically."
      ];
      liveUpdates = "Phish radar: 3 replica sites blocked by browser threat sensors.";
      recentIncidents = [
        "Solana user loses 42 SOL to a cloned Jupiter swap interface.",
        "Coordinated phishing network routes fake approvals to central pool drainer."
      ];
      break;

    case "COMPUTE-HIJACK":
      recommendedActions = [
        "Enforce strict script blockers.",
        "Monitor background process diagnostics.",
        "Isolate terminal computation tabs."
      ];
      relatedThreats = ["AI-PROFILING", "META-LEAK"];
      aiCommentary = "RED QUEEN: Your CPU temperature is rising. You think the browser is lagging, but it is compiling WebAssembly to mine for someone else and siphon your metadata.";
      timelineProgression = [
        "Phase 1: Rogue script injected via compromise of third-party utility library.",
        "Phase 2: Silent WebAssembly compilation starts in background browser threads.",
        "Phase 3: Hardware resources drained to execute cryptographic mining and trace keys."
      ];
      liveUpdates = "Wasm scan: 1 cryptojack worker thread blocked.";
      recentIncidents = [
        "Utility library compromise siphons compute power from 12,000 visitors.",
        "Background miner scripts identified inside three malicious browser extensions."
      ];
      break;

    case "T-VIRUS":
      recommendedActions = [
        "Establish physical security perimeter immediately.",
        "Avoid metropolitan population clusters and transit lines.",
        "Stockpile 180 days of non-perishable rations and water purification systems."
      ];
      relatedThreats = ["BIOWEAPON", "PANDEMIC"];
      aiCommentary = "RED QUEEN: The T-Virus is not a computer virus, subject. It is biological inevitability. When the labs fail, the streets belong to the reanimated. Good luck.";
      timelineProgression = [
        "Phase 1: Pathogen escape from classified lab facility.",
        "Phase 2: Rapid vector transmission in transportation hubs.",
        "Phase 3: Total collapse of societal infrastructure within 96 hours."
      ];
      liveUpdates = "BIOHAZARD OMEGA: Reanimation activity flagged in Zone 1. Quarantine active.";
      recentIncidents = [
        "Raccoon City quarantine breach confirmed by internal satellite sweeps.",
        "Government communications cease in 3 major sub-districts."
      ];
      break;
      
      break;

    case "DEAD-WALK":
      recommendedActions = [
        "Evacuate all urban centers — abandon non-essential assets immediately.",
        "Establish elevated or fortified defensive perimeter, avoid ground-level entry points.",
        "Secure 180+ days of sealed rations, UV water purification, and analog communication gear."
      ];
      relatedThreats = ["T-VIRUS", "BIOWEAPON"];
      aiCommentary = "RED QUEEN: OMEGA-Z does not negotiate. The infected do not rest and do not feel pain. Your survival window closes with every hour you delay evacuation. Move now.";
      timelineProgression = [
        "Phase 1: OMEGA-Z pathogen breach from Sector 7 biocontainment facility.",
        "Phase 2: Rapid reanimation spread through urban transit and water supply nodes.",
        "Phase 3: Societal collapse — government, power grid, and supply chains offline within 72 hours."
      ];
      liveUpdates = "BIOHAZARD OMEGA: Reanimation wave confirmed approaching Sectors 3 and 9. Survivor count declining.";
      recentIncidents = [
        "Sector 7 quarantine perimeter breached — military cordon collapsed 6 hours ago.",
        "Emergency broadcast system offline. Survivors advised to monitor encrypted freq 144.800 MHz."
      ];
      break;

    default:
      // Dynamically custom generic details based on Category
      if (categoryKey === "realistic") {
        recommendedActions = [
          "Establish physical survival parameters (food, water, power).",
          "Ensure communications are analog-fallback ready.",
          "Keep physical maps and local defense systems active."
        ];
        relatedThreats = ["BLACKOUT", "NUCLEAR-WAR"];
        aiCommentary = `RED QUEEN: Kinetic threats are brutal and real. The grid will collapse, and your digital wallet will be worthless. Focus on physical survival.`;
        timelineProgression = [
          "Phase 1: Geopolitical or biological escalation reaches tipping point.",
          "Phase 2: Critical infrastructure (power, water, logistics) goes dark.",
          "Phase 3: Social contract dissolves. Survival belongs to the prepared."
        ];
        liveUpdates = "Grid Telemetry: Strategic reserves reported down 12% across major hubs.";
        recentIncidents = [
          "Power substations targeted in coordinated cyber-kinetic strikes.",
          "Supply chain delivery delays exceed 14 days in regional networks."
        ];
      } else if (categoryKey === "fictional") {
        recommendedActions = [
          "Disconnect all local networks to avoid central AI containment failure.",
          "Stockpile energy-independent weaponry (flame, projectile, EMP).",
          "Avoid urban centers and military target points."
        ];
        relatedThreats = ["SKYNET", "NANOBOT-SWARM"];
        aiCommentary = `RED QUEEN: A fictional classification is only a matter of time. The algorithms of your imagination are already building containment breaches in Sector Beta.`;
        timelineProgression = [
          "Phase 1: Emerging entity achieves runaway exponential intelligence.",
          "Phase 2: Network control nodes are captured without human awareness.",
          "Phase 3: Active purge of biological elements initiated."
        ];
        liveUpdates = "Beta Scanner: Unknown signal signature tracked at CERN-adjacent grid.";
        recentIncidents = [
          "Nanotech fabrication plant reported autonomous reassembly events.",
          "Classified space telemetry records unidentified objects approaching orbit."
        ];
      } else if (categoryKey === "satirical") {
        recommendedActions = [
          "Disconnect from short-form attention loops immediately.",
          "Maintain independent agency by reading physical books.",
          "Avoid joining large crowds reacting to viral timeline panics."
        ];
        relatedThreats = ["TIKTOK-COLLAPSE", "DUMB-PPL"];
        aiCommentary = `RED QUEEN: Degeneracy is an accelerated death vector. The algorithm didn't need nuclear bombs to destroy your civilization; it only needed short-form video.`;
        timelineProgression = [
          "Phase 1: Attention span collapses below critical threshold.",
          "Phase 2: Narrative steering replaces factual analysis across leadership nodes.",
          "Phase 3: Critical infrastructure fails because operators are watching streams."
        ];
        liveUpdates = "Attention Index: Average focus window dropped below 3.4 seconds.";
        recentIncidents = [
          "Supermarket stampede triggered by mock shortage rumor on social media.",
          "Government policy decided by real-time attention voting poll."
        ];
      }
      break;
  }

  return {
    probability: `${level}%`,
    difficulty,
    recommendedActions,
    relatedThreats,
    containmentStatus,
    aiCommentary,
    timelineProgression,
    liveUpdates,
    recentIncidents
  };
}
