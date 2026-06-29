import { Sector, Mission, InventoryItem, CraftingRecipe, UpgradeRecipe } from "./types";

export const SECTOR_CONNECTIONS = [
  { from: "sec-alpha", to: "sec-beta", x1: 150, y1: 150, x2: 400, y2: 110 },
  { from: "sec-alpha", to: "sec-delta", x1: 150, y1: 150, x2: 160, y2: 350 },
  { from: "sec-beta", to: "sec-epsilon", x1: 400, y1: 110, x2: 420, y2: 300 },
  { from: "sec-beta", to: "sec-zeta", x1: 400, y1: 110, x2: 680, y2: 140 },
  { from: "sec-delta", to: "sec-epsilon", x1: 160, y1: 350, x2: 420, y2: 300 },
  { from: "sec-delta", to: "sec-gamma", x1: 160, y1: 350, x2: 150, y2: 500 },
  { from: "sec-epsilon", to: "sec-zeta", x1: 420, y1: 300, x2: 680, y2: 140 },
  { from: "sec-epsilon", to: "sec-omega", x1: 420, y1: 300, x2: 660, y2: 500 },
  { from: "sec-gamma", to: "sec-omega", x1: 150, y1: 500, x2: 660, y2: 500 },
  { from: "sec-zeta", to: "sec-omega", x1: 680, y1: 140, x2: 660, y2: 500 }
];

export const INITIAL_SECTORS: Sector[] = [
  {
    id: "sec-alpha",
    name: "SECTOR ALPHA",
    difficulty: "Easy",
    threatLevel: "Low",
    threatType: "Bio-Toxins",
    availableResources: ["Medical Supplies", "Credits"],
    description: "Ruined medical depots in suburban zone containing vital civilian caches. Pathogen contamination remains high.",
    points: "50,50 250,50 280,240 80,260",
    labelX: 150,
    labelY: 130,
    connectedSectors: ["sec-beta", "sec-delta"]
  },
  {
    id: "sec-beta",
    name: "SECTOR BETA",
    difficulty: "Normal",
    threatLevel: "Medium",
    threatType: "EM Anomalies",
    availableResources: ["Electronics", "Credits"],
    description: "High-voltage transmission substation generating localized magnetic storms and gravity drops.",
    points: "280,30 520,30 480,210 290,190",
    labelX: 380,
    labelY: 100,
    connectedSectors: ["sec-alpha", "sec-epsilon", "sec-zeta"]
  },
  {
    id: "sec-delta",
    name: "SECTOR DELTA",
    difficulty: "Hard",
    threatLevel: "High",
    threatType: "Sybil Trackers",
    availableResources: ["Research Data", "Credits"],
    description: "Decentralized database center currently seized by rogue Sybil tracer drones monitoring connection signatures.",
    points: "80,280 270,260 250,420 60,400",
    labelX: 150,
    labelY: 330,
    connectedSectors: ["sec-alpha", "sec-epsilon", "sec-gamma"]
  },
  {
    id: "sec-epsilon",
    name: "SECTOR EPSILON",
    difficulty: "Normal",
    threatLevel: "Severe",
    threatType: "Radiation Storm",
    availableResources: ["Research Data", "Metal"],
    description: "Underground military server warehouses protected by thick reinforced bulkhead gates.",
    points: "290,210 560,230 500,410 310,390",
    labelX: 410,
    labelY: 300,
    connectedSectors: ["sec-beta", "sec-delta", "sec-zeta", "sec-omega"]
  },
  {
    id: "sec-zeta",
    name: "SECTOR ZETA",
    difficulty: "Hard",
    threatLevel: "Severe",
    threatType: "Gravity Drops",
    availableResources: ["Deuterium Cells", "Research Data"],
    description: "Abandoned reactor core suffering from gravity waves and spatial compression faults.",
    points: "540,50 780,60 840,240 580,240",
    labelX: 650,
    labelY: 140,
    connectedSectors: ["sec-beta", "sec-epsilon", "sec-omega"]
  },
  {
    id: "sec-gamma",
    name: "SECTOR GAMMA",
    difficulty: "Normal",
    threatLevel: "Medium",
    threatType: "Pathogen Leak",
    availableResources: ["Titanite Scrap", "Credits"],
    description: "Volatile orbital fallout telemetry station currently leaking biological hazards.",
    points: "70,440 270,440 230,580 50,560",
    labelX: 150,
    labelY: 500,
    connectedSectors: ["sec-delta", "sec-omega"]
  },
  {
    id: "sec-omega",
    name: "SECTOR OMEGA",
    difficulty: "Hard",
    threatLevel: "Severe",
    threatType: "Quantum Feedback",
    availableResources: ["Energy Cells", "Credits"],
    description: "Deep subterranean quantum relay substation undergoing temporal sync delays and firewall shifts.",
    points: "520,430 850,430 800,580 480,570",
    labelX: 650,
    labelY: 500,
    connectedSectors: ["sec-epsilon", "sec-gamma", "sec-zeta"]
  }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "op-1-sanctuary-search",
    title: "OPERATION SANCTUARY SEARCH",
    description: "Deploy to Sector Alpha to locate and extract a civilian survival cell trapped inside an abandoned medical depot. High toxic levels detected.",
    region: "sec-alpha",
    difficulty: "Easy",
    duration: 5,
    recommendedClass: "Medic",
    recommendedFaction: "Helix",
    rewards: { xp: 25, credits: 50, resource: "Medical Supplies", resourceQty: 2 },
    unlockRequirements: {},
    category: "critical",
    factionReputationDelta: { helix: 12, citadel: -5 },
    sectorProgressPoints: 10,
    story: "Red Queen scouts have pinpointed a structural node in Sector Alpha containing trapped medical staff. Bypassing the security gateway is required to retrieve them before local toxin levels saturate their pod filters.",
    primaryObjective: "Extract civilian medical pod from Sector Alpha.",
    secondaryObjectives: ["Retrieve bio-toxin samples", "Decrypt security gate keylogs"],
    expectedThreat: "Low-level rogue cleaning drones, atmospheric toxins.",
    environmentalHazard: "Bio-toxin gas (level 2)",
    recommendedEquipment: "Biosensor Helmet, Insulated Cutters",
    recommendedDivision: "Helix Division",
    objectives: [
      { id: "obj-1-1", description: "Breach the security gateway at the medical depot entrance", status: "PENDING", reward: "25 XP" },
      { id: "obj-1-2", description: "Bypass the toxic hallway filters without sustaining damage", status: "PENDING", reward: "15 credits" },
      { id: "obj-1-3", description: "Manually decrypt the release coordinates on the escape pod console", status: "PENDING", reward: "1 Medical Supplies" }
    ],
    events: [
      {
        id: "op-1-ev-1",
        title: "DEPOT ENTRY GATES",
        text: "You arrive at the depot. The entrance is blocked by structural rubble, and there are high biological hazard readings inside. The survivors are running out of air.",
        options: [
          {
            id: "op-1-ev1-opt1",
            text: "Crawl through the narrow ventilation shafts using hazard filters.",
            success_prob: 75,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "You navigated the vents safely and reached the interior corridor.",
            failure_text: "The toxic gas saturated your filters. You sustained respiratory damage before dropping into the depot.",
            effects: { xp: 10, credits: 10, injury: 20 }
          },
          {
            id: "op-1-ev1-opt2",
            text: "Clear the door hinges using a breach charge.",
            success_prob: 80,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "The hinges blew cleanly. You bypassed the door instantly.",
            failure_text: "The blast caused a minor structural collapse. Falling concrete struck your shoulder.",
            effects: { xp: 15, credits: 5, injury: 30 }
          }
        ]
      },
      {
        id: "op-1-ev-2",
        title: "TOXIC HALLWAY",
        text: "The hallway is flooded with glowing bio-chemical coolant leaking from ruptured storage vats.",
        options: [
          {
            id: "op-1-ev2-opt1",
            text: "Synthesize a chemical neutralizer formula to coat your boots.",
            success_prob: 70,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "The neutralizer dissolved the hazard. You crossed the pool cleanly.",
            failure_text: "The acid burned through your protective boot meshes, causing severe chemical burns.",
            effects: { xp: 15, credits: 15, injury: 25 }
          },
          {
            id: "op-1-ev2-opt2",
            text: "Jump across structural girder supports.",
            success_prob: 60,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "You leap across the columns, landing on solid platform boards.",
            failure_text: "You slipped on wet debris, falling into the shallow acid pool.",
            effects: { xp: 10, credits: 5, injury: 35 }
          }
        ]
      },
      {
        id: "op-1-ev-3",
        title: "POD CONDUIT CODES",
        text: "You reach the pod, but the emergency release console is locked by secure encryption keys.",
        options: [
          {
            id: "op-1-ev3-opt1",
            text: "Manually bypass pressure release valves using insulated cutters.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "The hatch popped open. The survivors are secure.",
            failure_text: "A pressure backfire sprayed steam in your face before the pod unlocked.",
            effects: { xp: 20, credits: 20, injury: 20, reputationBonus: 10 }
          },
          {
            id: "op-1-ev3-opt2",
            text: "Decrypt the release codes using a WASM loop script.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "The code cracked instantly, releasing the cell safety locks.",
            failure_text: "A security backup loop shorted the console, causing an EM feedback pulse.",
            effects: { xp: 25, credits: 15, injury: 25, reputationBonus: 10 }
          }
        ]
      }
    ]
  },
  {
    id: "op-2-signal-recovery",
    title: "OPERATION BEACON RECOVERY",
    description: "Deploy to Sector Beta to recover an orbital transmitter beacon emitting high-energy gravity anomalies. Structural stability is collapsing.",
    region: "sec-beta",
    difficulty: "Normal",
    duration: 10,
    recommendedClass: "Engineer",
    recommendedFaction: "Nomads",
    rewards: { xp: 45, credits: 100, resource: "Electronics", resourceQty: 3 },
    unlockRequirements: { completedMissionId: "op-1-sanctuary-search", level: 1 },
    category: "normal",
    factionReputationDelta: { nomads: 10, aegis: -4 },
    sectorProgressPoints: 15,
    story: "An orbital transmitter beacon has dropped in Sector Beta, emitting a powerful gravitational anomaly. Gravity spikes are tearing the local structures apart. Recover the core before structural collapse is complete.",
    primaryObjective: "Extract transmitter beacon core.",
    secondaryObjectives: ["Map localized gravitational faults", "Secure electronics caches"],
    expectedThreat: "Gravitational compression waves, EM flares.",
    environmentalHazard: "Gravity waves (level 3)",
    recommendedEquipment: "Gravity wave stabilizer, Volumetric Shield Core",
    recommendedDivision: "Nomads Division",
    objectives: [
      { id: "obj-2-1", description: "Navigate through gravity field boundaries safely", status: "PENDING", reward: "45 XP" },
      { id: "obj-2-2", description: "Inject a dampening script to disable the beacon circuit shield", status: "PENDING", reward: "30 credits" },
      { id: "obj-2-3", description: "Use remote drone extraction to recover the anomaly core", status: "PENDING", reward: "1 Electronics" }
    ],
    events: [
      {
        id: "op-2-ev-1",
        title: "GRAVITY FIELD ENTRY",
        text: "The terrain surrounding the beacon substation shifts rapidly due to gravitational anomalies.",
        options: [
          {
            id: "op-2-ev1-opt1",
            text: "Calibrate gravity wave stabilizers to guide your path.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "The spikes smoothed out. You walked forward safely.",
            failure_text: "The stabilizer feedback knocked you off balance. You tumbled down a rocky slope.",
            effects: { xp: 15, credits: 10, injury: 20 }
          },
          {
            id: "op-2-ev1-opt2",
            text: "Sprint through the field boundaries during the gravity wave drop intervals.",
            success_prob: 60,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "You timed it perfectly and crossed the threshold.",
            failure_text: "A sudden gravity swell slammed you to the floor, bruising your knees.",
            effects: { xp: 10, credits: 5, injury: 25 }
          }
        ]
      },
      {
        id: "op-2-ev-2",
        title: "BEACON CIRCUIT SHIELD",
        text: "The transmitter beacon is protected by an active high-frequency EM shield loop.",
        options: [
          {
            id: "op-2-ev2-opt1",
            text: "Inject a dampening algorithm to ground the shield.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "The shield collapsed with a quiet hum.",
            failure_text: "The loop backfired, overloading your arm terminal and burning your wrist.",
            effects: { xp: 20, credits: 15, injury: 20 }
          },
          {
            id: "op-2-ev2-opt2",
            text: "Cut the shield generator power cells manually.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "You sliced the connectors. The shield instantly dissolved.",
            failure_text: "Spark feedback from the high-voltage cells scorched your chest plate.",
            effects: { xp: 15, credits: 20, injury: 30 }
          }
        ]
      },
      {
        id: "op-2-ev-3",
        title: "CORE HARVEST",
        text: "The beacon's core is unstable. Removing it requires precise kinetic isolation.",
        options: [
          {
            id: "op-2-ev3-opt1",
            text: "Deploy a remote extraction drone to pull the core.",
            success_prob: 85,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "The drone extracted the core cleanly without feedback.",
            failure_text: "The drone core exploded on detachment, spraying shrapnel.",
            effects: { xp: 20, credits: 30, injury: 25, unlocksSectorId: "sec-epsilon", reputationBonus: 12 }
          },
          {
            id: "op-2-ev3-opt2",
            text: "Pull the core manually using magnetic containment clamps.",
            success_prob: 70,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "You ripped the core free. The gravitational collapse ceased.",
            failure_text: "The core anomaly collapsed slightly on exit, causing joint strain.",
            effects: { xp: 25, credits: 25, injury: 35, unlocksSectorId: "sec-epsilon", reputationBonus: 12 }
          }
        ]
      }
    ]
  },
  {
    id: "op-3-sybil-breach",
    title: "OPERATION SYBIL BREACH",
    description: "Infiltrate Sector Delta's primary routing exchange nodes. Erase operative digital footprints and deploy decentralized WASM routing bypasses.",
    region: "sec-delta",
    difficulty: "Hard",
    duration: 15,
    recommendedClass: "Specialist",
    recommendedFaction: "Ghost Division",
    rewards: { xp: 60, credits: 150, resource: "Research Data", resourceQty: 2 },
    unlockRequirements: { completedMissionId: "op-2-signal-recovery", bioScore: 15 },
    category: "critical",
    factionReputationDelta: { ghost: 15, horizon: -6 },
    sectorProgressPoints: 25,
    story: "Sybil routing sensors are tracing network communication signatures in Sector Delta. Infiltrate the routing exchange nodes, deploy WASM decrypters, and purge your operative digital footprint before they isolate your location.",
    primaryObjective: "Bypass routing exchanges and copy coordinates.",
    secondaryObjectives: ["Obfuscate telemetry logs", "Erase router memory registries"],
    expectedThreat: "Sybil tracker drones, firewall trace programs.",
    environmentalHazard: "Firewall trace arrays",
    recommendedEquipment: "Decoy Signature Key, Quantum Decryptor Pad",
    recommendedDivision: "Ghost Division",
    objectives: [
      { id: "obj-3-1", description: "Avoid routing scanner sweeps using decoy signature relays", status: "PENDING", reward: "60 XP" },
      { id: "obj-3-2", description: "Deactivate the double-blind firewall on the routing node rack", status: "PENDING", reward: "45 credits" },
      { id: "obj-3-3", description: "Extract decrypted database core memory before the purge sequence", status: "PENDING", reward: "1 Research Data" }
    ],
    events: [
      {
        id: "op-3-ev-1",
        title: "ROUTER SCANNER AVOIDANCE",
        text: "Rogue security scans sweep the node perimeter.",
        options: [
          {
            id: "op-3-ev1-opt1",
            text: "Obfuscate your transmission signature using fake relays.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "The scanner passed your position without triggering alerts.",
            failure_text: "The tracer detected the relay. A tracking wave shocked your interface.",
            effects: { xp: 15, credits: 15, injury: 15 }
          },
          {
            id: "op-3-ev1-opt2",
            text: "Slip through sensor shadows using cloak filters.",
            success_prob: 70,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "You navigated the node corridor unseen.",
            failure_text: "A sensor caught your thermal leak, firing an warning laser pulse.",
            effects: { xp: 20, credits: 10, injury: 30 }
          }
        ]
      },
      {
        id: "op-3-ev-2",
        title: "FIREWALL BYPASS",
        text: "The main server rack is locked behind a double-blind firewall.",
        options: [
          {
            id: "op-3-ev2-opt1",
            text: "Inject a bypass script via direct terminal hookup.",
            success_prob: 75,
            class_bonus: { classId: "Specialist", bonus: 20 },
            success_text: "The firewall collapsed. Databases are exposed.",
            failure_text: "The security program back-traced your port, overloading your arm deck.",
            effects: { xp: 25, credits: 25, injury: 25 }
          },
          {
            id: "op-3-ev2-opt2",
            text: "Short-circuit the rack's localized power distributor.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Power died. The firewall reset, exposing raw sectors.",
            failure_text: "The high-voltage surge discharged into your gloves, causing shock burns.",
            effects: { xp: 20, credits: 30, injury: 35 }
          }
        ]
      },
      {
        id: "op-3-ev-3",
        title: "DATA CLEANSE",
        text: "The system is deleting the coordinates. You must copy the data before the purge.",
        options: [
          {
            id: "op-3-ev3-opt1",
            text: "Overload the memory register buffers to halt the purge.",
            success_prob: 70,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "Buffer overflow successful. Data downloaded.",
            failure_text: "The override failed, purging half the file and shocking your console.",
            effects: { xp: 30, credits: 40, injury: 25, unlocksSectorId: "sec-gamma", reputationBonus: 15 }
          },
          {
            id: "op-3-ev3-opt2",
            text: "Force manual memory extraction blocks.",
            success_prob: 60,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "You extracted the hardware memory boards directly.",
            failure_text: "The capacitor discharged during extraction, burning your fingers.",
            effects: { xp: 25, credits: 50, injury: 35, unlocksSectorId: "sec-gamma", reputationBonus: 15 }
          }
        ]
      }
    ]
  },
  {
    id: "op-4-server-raid",
    title: "OPERATION SERVER RAID",
    description: "Extract encrypted anomaly coordinates from Sector Epsilon server warehouses.",
    region: "sec-epsilon",
    difficulty: "Normal",
    duration: 8,
    recommendedClass: "Recon",
    recommendedFaction: "Eclipse",
    rewards: { xp: 40, credits: 90, resource: "Research Data", resourceQty: 3 },
    unlockRequirements: { completedMissionId: "op-3-sybil-breach", level: 2 },
    category: "normal",
    factionReputationDelta: { eclipse: 10, vanguard: -4 },
    sectorProgressPoints: 15,
    story: "The underground military warehouses in Sector Epsilon contain encrypted coordinates for advanced anomalies. Automated security systems are active. Perform a fast tactical raid to extract the data drives.",
    primaryObjective: "Recover data drives from server warehouses.",
    secondaryObjectives: ["Disable automated perimeter turret", "Download backup silo telemetry"],
    expectedThreat: "Automated kinetic turrets, security alarms.",
    environmentalHazard: "High-voltage containment field",
    recommendedEquipment: "Stealth Recon Cloak, EM Grenade",
    recommendedDivision: "Eclipse Division",
    objectives: [
      { id: "obj-4-1", description: "Bypass outer silo kinetic turrets without triggering security alerts", status: "PENDING", reward: "40 XP" },
      { id: "obj-4-2", description: "Inject security bypass codes into the server rack terminal", status: "PENDING", reward: "25 credits" },
      { id: "obj-4-3", description: "Secure the drive and escape through the vents", status: "PENDING", reward: "1 Research Data" }
    ],
    events: [
      {
        id: "op-4-ev-1",
        title: "OUTER SILOS",
        text: "The server silos are guarded by automated turret sweeps.",
        options: [
          {
            id: "op-4-ev1-opt1",
            text: "Cloak and dodge the turret sweep paths.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "You bypassed the turrets without notice.",
            failure_text: "A turret grazed your leg armor with a kinetic round.",
            effects: { xp: 15, credits: 10, injury: 25 }
          },
          {
            id: "op-4-ev1-opt2",
            text: "Throw EM disruptor grenades to blind the turrets.",
            success_prob: 75,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "The sensors shorted. You walked past the deactivated turrets.",
            failure_text: "The grenade detonated early, blowing shrapnel in your face.",
            effects: { xp: 15, credits: 15, injury: 35 }
          }
        ]
      },
      {
        id: "op-4-ev-2",
        title: "DATABASE CORE",
        text: "A security lock prevents terminal connection.",
        options: [
          {
            id: "op-4-ev2-opt1",
            text: "Inject security bypass coordinates.",
            success_prob: 75,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "The terminal accepted the bypass.",
            failure_text: "The system locked out, shock-discharging your arm deck.",
            effects: { xp: 20, credits: 20, injury: 20 }
          }
        ]
      },
      {
        id: "op-4-ev-3",
        title: "SECURITY REBOOT",
        text: "The systems are rebooting. Alarm levels are rising.",
        options: [
          {
            id: "op-4-ev3-opt1",
            text: "Secure the drive and escape through the vents.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "You escaped safely before security closed the silo.",
            failure_text: "You fell from a vent shaft, bruising your ribs.",
            effects: { xp: 25, credits: 30, injury: 20, reputationBonus: 10 }
          }
        ]
      }
    ]
  },
  {
    id: "op-5-satellite-hijack",
    title: "OPERATION SATELLITE HIJACK",
    description: "Recalibrate the high-altitude telemetry dish in Sector Gamma to redirect scanning paths.",
    region: "sec-gamma",
    difficulty: "Hard",
    duration: 12,
    recommendedClass: "Scientist",
    recommendedFaction: "Horizon",
    rewards: { xp: 75, credits: 200, resource: "Energy Cells", resourceQty: 2 },
    unlockRequirements: { completedMissionId: "op-4-server-raid", bioScore: 30 },
    category: "critical",
    factionReputationDelta: { horizon: 15, ghost: -6 },
    sectorProgressPoints: 25,
    story: "A volatile pathogen leak is spiking in Sector Gamma, centering around a high-altitude telemetry dish. Inject alignment instructions to redirect scanning paths and secure local sensor arrays.",
    primaryObjective: "Redirect scanning paths of the telemetry dish.",
    secondaryObjectives: ["Contain localized pathogen leaks", "Inject decoy signatures into the uplink"],
    expectedThreat: "Volatile bio-pathogens, search drones.",
    environmentalHazard: "Pathogen storm (level 4)",
    recommendedEquipment: "Advanced Stim Injector, Biosensor Helmet",
    recommendedDivision: "Horizon Division",
    objectives: [
      { id: "obj-5-1", description: "Synthesize anti-radiation pathogen inoculations", status: "PENDING", reward: "75 XP" },
      { id: "obj-5-2", description: "Calibrate alignment spectrum grids on the dish controller", status: "PENDING", reward: "50 credits" },
      { id: "obj-5-3", description: "Initiate decoy signature scripts to clear search drones from the deck", status: "PENDING", reward: "1 Energy Cells" }
    ],
    events: [
      {
        id: "op-5-ev-1",
        title: "TELEMETRY DISH ACCESS",
        text: "Radiation levels are leaking from the dish antenna grids.",
        options: [
          {
            id: "op-5-ev1-opt1",
            text: "Synthesize anti-radiation inoculations.",
            success_prob: 80,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "The injection protected you from the radiation spikes.",
            failure_text: "The formula failed. You absorbed radiation, causing cell damage.",
            effects: { xp: 25, credits: 20, injury: 30 }
          }
        ]
      },
      {
        id: "op-5-ev-2",
        title: "RECALIBRATION CODES",
        text: "The dish is locked to its target path coordinates.",
        options: [
          {
            id: "op-5-ev2-opt1",
            text: "Calibrate alignment spectrum grids.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "You redirected the telemetry scans.",
            failure_text: "The dish console exploded with wave feedback.",
            effects: { xp: 30, credits: 40, injury: 25 }
          }
        ]
      },
      {
        id: "op-5-ev-3",
        title: "UPLINK SECURITY",
        text: "Drones are searching the telemetry platform.",
        options: [
          {
            id: "op-5-ev3-opt1",
            text: "Initiate decoy signatures to clear the deck.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "The drones left the platform. Connection resolved.",
            failure_text: "The drones fired on your position during your retreat.",
            effects: { xp: 35, credits: 50, injury: 30, unlocksSectorId: "sec-zeta", reputationBonus: 15 }
          }
        ]
      }
    ]
  },
  {
    id: "op-6-outpost-breach",
    title: "OPERATION OUTPOST BREACH",
    description: "Clear Sector Alpha outpost parameter fortifications to secure transport routes. Repeatable side-op.",
    region: "sec-alpha",
    difficulty: "Easy",
    duration: 4,
    recommendedClass: "Assault",
    recommendedFaction: "Vanguard",
    rewards: { xp: 20, credits: 40, resource: "Metal", resourceQty: 2 },
    unlockRequirements: {},
    category: "side",
    factionReputationDelta: { vanguard: 8, eclipse: -3 },
    sectorProgressPoints: 10,
    isRepeatable: true,
    story: "An outpost guarding a transport route in Sector Alpha has locked its perimeter fortifications. Clear the blockade to ensure secure supply route travel.",
    primaryObjective: "Clear outpost parameter fortifications.",
    secondaryObjectives: ["Scan sector gateway channels", "Disable backup power distributors"],
    expectedThreat: "Security lock grids, defense drones.",
    environmentalHazard: "None",
    recommendedEquipment: "Breach Charge, Kinetic Carbine",
    recommendedDivision: "Vanguard Division",
    objectives: [
      { id: "obj-6-1", description: "Blow the reinforced parameter door using breach charges", status: "PENDING", reward: "20 XP" },
      { id: "obj-6-2", description: "Neutralize the active security drone blocking the escape vector", status: "PENDING", reward: "15 credits" }
    ],
    events: [
      {
        id: "op-6-ev-1",
        title: "OUTPOST GATES",
        text: "A heavy reinforced door blocks entry to the depot.",
        options: [
          {
            id: "op-6-ev1-opt1",
            text: "Blow the door with charges.",
            success_prob: 85,
            class_bonus: { classId: "Assault", bonus: 10 },
            success_text: "The door is blown. Route cleared.",
            failure_text: "Shrapnel from the door hit your arm.",
            effects: { xp: 10, credits: 20, injury: 15 }
          }
        ]
      },
      {
        id: "op-6-ev-2",
        title: "TACTICAL RETREAT",
        text: "A rogue security drone blocks your escape route.",
        options: [
          {
            id: "op-6-ev2-opt1",
            text: "Neutralize the drone.",
            success_prob: 80,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Drone destroyed.",
            failure_text: "The drone fired a laser pulse, burning your shoulder.",
            effects: { xp: 15, credits: 20, injury: 20, reputationBonus: 5 }
          }
        ]
      }
    ]
  },
  {
    id: "op-7-omega-nexus",
    title: "OPERATION OMEGA NEXUS",
    description: "Infiltrate the deep subterranean quantum relay in Sector Omega. Establish final firewall uplink and secure humanity's legacy registry.",
    region: "sec-omega",
    difficulty: "Hard",
    duration: 20,
    recommendedClass: "Specialist",
    recommendedFaction: "Ghost Division",
    rewards: { xp: 100, credits: 300, resource: "Research Data", resourceQty: 5 },
    unlockRequirements: { completedMissionId: "op-5-satellite-hijack", level: 5, bioScore: 40 },
    category: "critical",
    factionReputationDelta: { ghost: 20, horizon: 10, eclipse: -10 },
    sectorProgressPoints: 25,
    story: "This is the final coordinate node. The deep subterranean quantum relay in Sector Omega is undergoing temporal drift. Secure the node structure, establish a direct mainframe link, and execute the final security handshake to secure the network registry.",
    primaryObjective: "Establish final mainframe uplink handshake.",
    secondaryObjectives: ["Purge leftover tracking anomalies", "Download deep core database memory"],
    expectedThreat: "Temporal quantum echoes, automated terminal gates.",
    environmentalHazard: "Temporal displacement anomalies",
    recommendedEquipment: "Quantum Decryptor Pad, Decoy Signature Key",
    recommendedDivision: "Ghost Division",
    objectives: [
      { id: "obj-7-1", description: "Decrypt final firewall layers using WASM subroutines", status: "PENDING", reward: "100 XP" },
      { id: "obj-7-2", description: "Establish direct quantum telemetry linkage", status: "PENDING", reward: "100 credits" }
    ],
    events: [
      {
        id: "op-7-ev-1",
        title: "THE NEXUS ARCH",
        text: "The quantum core is surrounded by shifting energy barriers. Chrono-flares threaten to destabilize your terminal connection.",
        options: [
          {
            id: "op-7-ev1-opt1",
            text: "Calibrate frequency arrays using quantum data pads.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "Frequency locked. Chrono-flares normalized.",
            failure_text: "Chronological feedback shocked your deck, causing temporary system drift.",
            effects: { xp: 30, credits: 50, injury: 25 }
          },
          {
            id: "op-7-ev1-opt2",
            text: "Inject routing override bypass loops.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Bypass completed successfully. The arch opened.",
            failure_text: "Bypass detected. Core defense systems fired warning lasers.",
            effects: { xp: 35, credits: 40, injury: 30 }
          }
        ]
      }
    ]
  },
  {
    id: "op-8-core-venting",
    title: "OPERATION CORE VENTING",
    description: "Deploy to Sector Zeta reactor core to vent radioactive particles and secure deuterium canisters. Repeatable side-op.",
    region: "sec-zeta",
    difficulty: "Hard",
    duration: 10,
    recommendedClass: "Engineer",
    recommendedFaction: "Nomads",
    rewards: { xp: 50, credits: 120, resource: "Energy Cells", resourceQty: 3 },
    unlockRequirements: { completedMissionId: "op-5-satellite-hijack", level: 4 },
    category: "side",
    factionReputationDelta: { nomads: 12, citadel: -4 },
    sectorProgressPoints: 20,
    isRepeatable: true,
    story: "The reactor core in Sector Zeta has accumulated dangerous gravity distortions. Manually cycle the pressure valves and extract remaining Deuterium containers before the core goes critical.",
    primaryObjective: "Cycle pressure valves and extract Deuterium containers.",
    secondaryObjectives: ["Vent radioactive particles", "Calibrate primary backup power grid"],
    expectedThreat: "Gravity drops, radioactive coolant leaks.",
    environmentalHazard: "Radiation leaks (level 4)",
    recommendedEquipment: "Gravity wave stabilizer, Power cutters",
    recommendedDivision: "Nomads Division",
    objectives: [
      { id: "obj-8-1", description: "Trigger localized venting sequence in reactor core", status: "PENDING", reward: "50 XP" },
      { id: "obj-8-2", description: "Vent coolant pressure valves manually", status: "PENDING", reward: "30 credits" }
    ],
    events: [
      {
        id: "op-8-ev-1",
        title: "COOLANT PIPES",
        text: "Coolant pipes are ruptured, venting high-pressure radioactive vapor across the catwalk.",
        options: [
          {
            id: "op-8-ev1-opt1",
            text: "Vent the backup valve stack using insulated cutters.",
            success_prob: 75,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Pressure released. Path cleared.",
            failure_text: "Scalding coolant vapor escaped before you could seal the pipe.",
            effects: { xp: 20, credits: 30, injury: 25 }
          }
        ]
      }
    ]
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Kinetic Carbine V3", rarity: "Rare", quality: 100, slot: "Weapon", classRequirement: "Assault", factionRequirement: "vanguard", factionStandingRequirement: 15, power: 45, desc: "Short-stroke piston rifle caliber tailored for anomaly breach parameters.", qty: 1, type: "weapon", itemLevel: 12, stats: { DPS: 48, Accuracy: "94%", Range: "45m" }, category: "Weapons", weight: 3.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 3 },
  { id: "inv-2", name: "Stealth Recon Cloak", rarity: "Epic", quality: 92, slot: "Gadget", classRequirement: "Recon", factionRequirement: "eclipse", factionStandingRequirement: 25, power: 65, desc: "Bends electromagnetic spectra to match surrounding quadrant visual noise.", qty: 1, type: "weapon", itemLevel: 18, stats: { Stealth: "+30", Evade: "+12%" }, category: "Armor", weight: 1.5, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2 },
  { id: "inv-3", name: "Advanced Stim Injector", rarity: "Uncommon", quality: 100, slot: "Medkit", classRequirement: "Medic", power: 25, desc: "Rapidly neutralizes biological toxins and restores 30 HP.", qty: 5, type: "consumable", itemLevel: 5, stats: { Heal: "+30 HP", Speed: "+15%" }, category: "Medical", weight: 0.2, durability: 100, maxDurability: 100 },
  { id: "inv-4", name: "Volumetric Shield Core", rarity: "Legendary", quality: 100, slot: "Armor", classRequirement: "Scientist", factionRequirement: "citadel", factionStandingRequirement: 30, power: 90, desc: "Projects a gravity displacement barrier to deflect analog projectiles.", qty: 1, type: "armor", itemLevel: 25, stats: { Shield: "+150", Mitigation: "20%" }, category: "Armor", weight: 5.2, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 4 },
  { id: "inv-5", name: "C-4 Anomaly Breach Charge", rarity: "Rare", quality: 100, slot: "Utility", classRequirement: "Assault", power: 50, desc: "Heavy thermite detonation device capable of punching through node shields.", qty: 3, type: "consumable", itemLevel: 10, stats: { BreachPower: 120, Radius: "4m" }, category: "Tools", weight: 2.0, durability: 100, maxDurability: 100 },
  { id: "inv-6", name: "Decoy Signature Key", rarity: "Common", quality: 100, slot: "Utility", classRequirement: "Specialist", power: 10, desc: "Injects synthetic user profiles to misdirect rogue Sybil trackers.", qty: 8, type: "consumable", itemLevel: 3, stats: { Obfuscate: "+15", Duration: "45s" }, category: "Tools", weight: 0.1, durability: 100, maxDurability: 100 },
  { id: "inv-7", name: "Quantum Decryptor Pad", rarity: "Uncommon", quality: 85, slot: "Gadget", classRequirement: "Scientist", power: 30, desc: "Processes localized sub-quantum key decryptions via custom WASM modules.", qty: 1, type: "weapon", itemLevel: 8, stats: { DecryptSpeed: "+25%", PowerCost: "-10%" }, category: "Tools", weight: 0.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2 },
  { id: "inv-8", name: "Helix Biosensor Helmet", rarity: "Epic", quality: 95, slot: "Helmet", classRequirement: "Medic", factionRequirement: "helix", factionStandingRequirement: 20, power: 75, desc: "Monitors oxygen filtration levels and identifies regional pathogen clusters.", qty: 1, type: "armor", itemLevel: 15, stats: { ThreatDetection: "+20", FilterEfficiency: "98%" }, category: "Armor", weight: 1.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2 },
  { id: "inv-9", name: "Modular Tactical Pack", rarity: "Common", quality: 100, slot: "Backpack", classRequirement: "Engineer", power: 15, desc: "Extra load-bearing compartments reinforced with composite materials.", qty: 1, type: "armor", itemLevel: 4, stats: { Slots: "+10", LoadCapacity: "+15kg" }, category: "Armor", weight: 1.2, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 1 },
  { id: "inv-11", name: "Deuterium Power Cell", rarity: "Rare", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "High-density plasma power pack for calibrating transmitters.", qty: 12, type: "material", itemLevel: 1, stats: { EnergyCapacity: "500MW" }, category: "Materials", weight: 0.3 },
  { id: "inv-12", name: "Raw Titanite Scrap", rarity: "Common", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "Scraped bulkhead alloys for crafting primary shield plates.", qty: 25, type: "material", itemLevel: 1, stats: { Purity: "78%" }, category: "Materials", weight: 0.5 },
  { id: "mat-bio-sample", name: "Pathogen Biostrain Sample", rarity: "Uncommon", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "Localized bio-pathogen spores harvested from active containment zones.", qty: 4, type: "material", itemLevel: 1, stats: { HazardLevel: 3 }, category: "Materials", weight: 0.1 },
  { id: "mat-encrypted-intel", name: "Encrypted Decryption Keyring", rarity: "Rare", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "Decentralized trace registry telemetry captured from security exchanges.", qty: 2, type: "material", itemLevel: 1, stats: { DecryptTier: 2 }, category: "Materials", weight: 0.05 },
  { id: "inv-10", name: "Field Medkit", rarity: "Rare", quality: 100, slot: "Medkit", classRequirement: "None", power: 40, desc: "Heavy cellular reconstructors to restore 60 HP and repair tissue.", qty: 2, type: "consumable", itemLevel: 8, stats: { Heal: "+60 HP", MedicalEfficiency: "+15%" }, category: "Medical", weight: 0.5, durability: 100, maxDurability: 100 },
  { id: "inv-13", name: "Signal Booster", rarity: "Uncommon", quality: 100, slot: "Gadget", classRequirement: "None", power: 20, desc: "Tactical deployable boosting local communications. Boosts signal coverage.", qty: 1, type: "consumable", itemLevel: 4, stats: { DecryptSpeed: "+15%", ResearchEfficiency: "+10%" }, category: "Tools", weight: 0.3, durability: 100, maxDurability: 100 },
  { id: "inv-14", name: "Portable Scanner", rarity: "Rare", quality: 100, slot: "Gadget", classRequirement: "None", power: 45, desc: "Provides radar sweeping overlays mapping biological signatures.", qty: 1, type: "consumable", itemLevel: 10, stats: { ThreatDetection: "+25", Detection: "+20" }, category: "Tools", weight: 0.6, durability: 100, maxDurability: 100 }
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "rec-stim-injector",
    name: "Advanced Stim Injector",
    description: "Synthesize an advanced stim pack using localized biological samples and chemical filters.",
    resultItemId: "inv-3",
    resultQty: 1,
    ingredients: [
      { itemId: "Medical Supplies", qty: 2 },
      { itemId: "Components", qty: 1 }
    ],
    requiredLevel: 1
  },
  {
    id: "rec-medkit",
    name: "Field Medkit",
    description: "Assemble a heavy trauma field medkit with cellular reconstructors.",
    resultItemId: "inv-10",
    resultQty: 1,
    ingredients: [
      { itemId: "Medical Supplies", qty: 4 },
      { itemId: "Components", qty: 2 }
    ],
    requiredLevel: 2
  },
  {
    id: "rec-energy-cell",
    name: "Deuterium Power Cell",
    description: "Refine raw alloys and capacitors into a tactical high-density power cell.",
    resultItemId: "inv-11",
    resultQty: 1,
    ingredients: [
      { itemId: "Metal", qty: 2 },
      { itemId: "Components", qty: 1 }
    ],
    requiredLevel: 1
  },
  {
    id: "rec-signal-booster",
    name: "Signal Booster",
    description: "Assemble a deployable antenna pack boosting telemetry ranges.",
    resultItemId: "inv-13",
    resultQty: 1,
    ingredients: [
      { itemId: "Electronics", qty: 2 },
      { itemId: "Energy Cells", qty: 1 }
    ],
    requiredLevel: 2
  },
  {
    id: "rec-portable-scanner",
    name: "Portable Scanner",
    description: "Synthesize a portable biosignature sweeper mapping life sign signatures.",
    resultItemId: "inv-14",
    resultQty: 1,
    ingredients: [
      { itemId: "Electronics", qty: 2 },
      { itemId: "Components", qty: 2 }
    ],
    requiredLevel: 3
  },
  {
    id: "rec-decoy-device",
    name: "Decoy Device",
    description: "Construct a misdirection transmitter emitting trace user profiles.",
    resultItemId: "inv-6",
    resultQty: 1,
    ingredients: [
      { itemId: "Electronics", qty: 1 },
      { itemId: "Metal", qty: 1 }
    ],
    requiredLevel: 1
  },
  {
    id: "rec-kinetic-carbine",
    name: "Kinetic Carbine V3",
    description: "Assemble a standard Kinetic Carbine from raw bulk alloy and electrical wiring components.",
    resultItemId: "inv-1",
    resultQty: 1,
    ingredients: [
      { itemId: "Metal", qty: 10 },
      { itemId: "Components", qty: 5 },
      { itemId: "Electronics", qty: 3 }
    ],
    requiredLevel: 3
  }
];

export const UPGRADE_RECIPES: UpgradeRecipe[] = [
  {
    id: "upg-carbine-overcharge",
    name: "Kinetic Carbine Overcharge",
    description: "Upgrade Kinetic Carbine capacitor cells to increase rate of fire and kinetic velocity.",
    targetItemId: "inv-1",
    ingredients: [
      { itemId: "inv-11", qty: 4 }
    ],
    statModifiers: { DPS: 62, Accuracy: "95%" },
    powerIncrease: 15
  },
  {
    id: "upg-shield-calibration",
    name: "Shield Integrity Calibration",
    description: "Calibrate volumetric core capacitors to absorb 25% more physical kinetic energy.",
    targetItemId: "inv-4",
    ingredients: [
      { itemId: "inv-11", qty: 6 }
    ],
    statModifiers: { Shield: "+200", Mitigation: "25%" },
    powerIncrease: 20
  }
];
