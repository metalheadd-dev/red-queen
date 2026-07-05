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
    points: "50,50 110,40 180,45 250,55 280,120 270,200 220,230 140,250 80,260 40,160",
    labelX: 160,
    labelY: 140,
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
    points: "290,30 360,25 430,30 510,40 500,90 470,150 430,200 350,195 290,140 275,80",
    labelX: 390,
    labelY: 105,
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
    points: "80,280 150,270 230,265 260,310 245,370 210,410 140,415 80,400 65,340",
    labelX: 160,
    labelY: 335,
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
    points: "295,210 370,200 450,215 520,225 540,290 510,360 470,405 380,410 320,380 290,290",
    labelX: 415,
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
    points: "540,50 630,45 720,55 800,60 840,110 820,180 760,230 680,240 580,230 550,130",
    labelX: 680,
    labelY: 135,
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
    points: "70,440 130,435 200,440 260,450 245,500 215,570 140,580 60,560 50,500",
    labelX: 155,
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
    points: "520,430 610,425 720,430 810,435 845,490 810,570 720,580 600,575 510,530 490,480",
    labelX: 660,
    labelY: 500,
    connectedSectors: ["sec-epsilon", "sec-gamma", "sec-zeta"]
  }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "op-1-sanctuary-search",
    title: "OPERATION SANCTUARY SEARCH",
    description: "Extract civilian medical pod from Sector Alpha suburb depots. High toxic threat.",
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
    story: "Suburban depot pod filters are failing. Extract the target pod before toxicity levels saturate.",
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
        text: "Blocked entry gates. High bio-hazard readings. Survivors running out of oxygen.",
        options: [
          {
            id: "op-1-ev1-opt1",
            text: "Crawl through ventilation shafts using hazard filters.",
            success_prob: 75,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "Safe ventilation transit completed.",
            failure_text: "Atmospheric filters failed. Respiratory trauma sustained.",
            effects: { xp: 10, credits: 10, injury: 20 }
          },
          {
            id: "op-1-ev1-opt2",
            text: "Blast the gate hinges using a breach charge.",
            success_prob: 80,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Hinges destroyed. Entrance cleared.",
            failure_text: "Blast debris caused a minor collapse. Injury sustained.",
            effects: { xp: 15, credits: 5, injury: 30 }
          }
        ]
      },
      {
        id: "op-1-ev-2",
        title: "TOXIC HALLWAY",
        text: "Depot corridor is flooded with bio-chemical coolant.",
        options: [
          {
            id: "op-1-ev2-opt1",
            text: "Coat boots with a synthesized neutralizer formula.",
            success_prob: 70,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "Corrosive chemical dissolved safely.",
            failure_text: "Boot lining melted. Chemical burns sustained.",
            effects: { xp: 15, credits: 15, injury: 25 }
          },
          {
            id: "op-1-ev2-opt2",
            text: "Jump across exposed structural steel girders.",
            success_prob: 60,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "Successfully leaped across the coolant pool.",
            failure_text: "Slipped on toxic debris, falling into coolant.",
            effects: { xp: 10, credits: 5, injury: 35 }
          }
        ]
      },
      {
        id: "op-1-ev-3",
        title: "POD CONDUIT CODES",
        text: "Target rescue pod reached, but console lock triggers are offline.",
        options: [
          {
            id: "op-1-ev3-opt1",
            text: "Manual valve bypass using insulated cutters.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "Pressure released. Hatch opened safely.",
            failure_text: "Hot steam feedback released before hatch opened.",
            effects: { xp: 20, credits: 20, injury: 20, reputationBonus: 10 }
          },
          {
            id: "op-1-ev3-opt2",
            text: "Decrypt the locking codes using a terminal WASM loop.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Codes cracked. Lock systems deactivated.",
            failure_text: "Console overload generated EM shock feedback.",
            effects: { xp: 25, credits: 15, injury: 25, reputationBonus: 10 }
          }
        ]
      }
    ]
  },
  {
    id: "op-2-signal-recovery",
    title: "OPERATION BEACON RECOVERY",
    description: "Recover transmitter beacon core. High gravity anomaly distortions.",
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
    story: "Extract orbital beacon core from magnetic substation before structural collapse.",
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
        text: "Local terrain shifting under gravity anomalies.",
        options: [
          {
            id: "op-2-ev1-opt1",
            text: "Calibrate gravity wave stabilizers.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "Gravitational spikes stabilized. Clear path ahead.",
            failure_text: "Calibration failed. Gravitational shear caused joint damage.",
            effects: { xp: 15, credits: 10, injury: 20 }
          },
          {
            id: "op-2-ev1-opt2",
            text: "Sprint across boundary lines during field drops.",
            success_prob: 60,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "Interval timed correctly. Threshold crossed.",
            failure_text: "Gravitational shift caught you mid-step. Heavy impact sustained.",
            effects: { xp: 10, credits: 5, injury: 25 }
          }
        ]
      },
      {
        id: "op-2-ev-2",
        title: "BEACON CIRCUIT SHIELD",
        text: "The target transmitter is protected by an active high-frequency EM shield loop.",
        options: [
          {
            id: "op-2-ev2-opt1",
            text: "Inject a dampening algorithm to ground the shield.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Shield grounded. Terminal feedback suppressed.",
            failure_text: "Shield backfired. System overload scorched your deck.",
            effects: { xp: 20, credits: 15, injury: 20 }
          },
          {
            id: "op-2-ev2-opt2",
            text: "Cut power cell wiring manually.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "Wiring sliced. Shield system collapsed.",
            failure_text: "Power backfired. Electrical shock sustained.",
            effects: { xp: 15, credits: 20, injury: 30 }
          }
        ]
      },
      {
        id: "op-2-ev-3",
        title: "CORE HARVEST",
        text: "Beacon core is unstable. Direct extraction requires kinetic clamps.",
        options: [
          {
            id: "op-2-ev3-opt1",
            text: "Deploy remote drone to pull core.",
            success_prob: 85,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Drone extraction completed cleanly.",
            failure_text: "Drone capacitor failed. Shock feedback sustained.",
            effects: { xp: 20, credits: 30, injury: 25, unlocksSectorId: "sec-epsilon", reputationBonus: 12 }
          },
          {
            id: "op-2-ev3-opt2",
            text: "Extract core using magnetic clamps.",
            success_prob: 70,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Core ripped free. Anomaly signature neutralized.",
            failure_text: "Clamps slipped. Force feedback caused shoulder strain.",
            effects: { xp: 25, credits: 25, injury: 35, unlocksSectorId: "sec-epsilon", reputationBonus: 12 }
          }
        ]
      }
    ]
  },
  {
    id: "op-3-sybil-breach",
    title: "OPERATION SYBIL BREACH",
    description: "Infiltrate exchange nodes. Obfuscate signature footprints & bypass firewalls.",
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
    story: "Deploy WASM bypass scripts to route around tracer grids.",
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
        text: "Rogue security sweeps monitoring node perimeter.",
        options: [
          {
            id: "op-3-ev1-opt1",
            text: "Obfuscate signatures via decoy relays.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Decoy engaged. Tracer sweep bypassed.",
            failure_text: "Relay traced. Feedback shock sustained.",
            effects: { xp: 15, credits: 15, injury: 15 }
          },
          {
            id: "op-3-ev1-opt2",
            text: "Slip through sweep shadows using cloaks.",
            success_prob: 70,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "Vanguard sweep avoided cleanly.",
            failure_text: "Cloak fluctuated. Laser warning pulse fired.",
            effects: { xp: 20, credits: 10, injury: 30 }
          }
        ]
      },
      {
        id: "op-3-ev-2",
        title: "FIREWALL BYPASS",
        text: "Main routing rack protected by double-blind firewall.",
        options: [
          {
            id: "op-3-ev2-opt1",
            text: "Inject bypass script via terminal connection.",
            success_prob: 75,
            class_bonus: { classId: "Specialist", bonus: 20 },
            success_text: "Bypass script accepted. Firewall collapsed.",
            failure_text: "Trace counter-hack triggered. Terminal shock sustained.",
            effects: { xp: 25, credits: 25, injury: 25 }
          },
          {
            id: "op-3-ev2-opt2",
            text: "Short-circuit local power distributor.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Power failed. Firewall protection collapsed.",
            failure_text: "High-voltage backfire burned glove nodes.",
            effects: { xp: 20, credits: 30, injury: 35 }
          }
        ]
      },
      {
        id: "op-3-ev-3",
        title: "DATA CLEANSE",
        text: "Mainframe coordinates purging. Fast download required.",
        options: [
          {
            id: "op-3-ev3-opt1",
            text: "Overload buffer registries to halt purge.",
            success_prob: 70,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "Purge halted. Anomaly registry downloaded.",
            failure_text: "Override script failed. Partial data purge.",
            effects: { xp: 30, credits: 40, injury: 25, unlocksSectorId: "sec-gamma", reputationBonus: 15 }
          },
          {
            id: "op-3-ev3-opt2",
            text: "Execute manual core memory extraction.",
            success_prob: 60,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Hardware memory modules recovered.",
            failure_text: "Extractor capacitor exploded, injuring fingers.",
            effects: { xp: 25, credits: 50, injury: 35, unlocksSectorId: "sec-gamma", reputationBonus: 15 }
          }
        ]
      }
    ]
  },
  {
    id: "op-4-server-raid",
    title: "OPERATION SERVER RAID",
    description: "Retrieve encrypted database drives from subterranean warehouses.",
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
    story: "Raid automated server silos to extract anomaly coordinates.",
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
        text: "Silo gates guarded by automated kinetic turret sweep.",
        options: [
          {
            id: "op-4-ev1-opt1",
            text: "Dodge sweeps using cloak filters.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "Turret sweep bypassed undetected.",
            failure_text: "Sensor sweep caught your cloak. Kinetic round grazed your leg.",
            effects: { xp: 15, credits: 10, injury: 25 }
          },
          {
            id: "op-4-ev1-opt2",
            text: "Deactivate turret sensors via EM grenades.",
            success_prob: 75,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Turrets blinded. Path cleared.",
            failure_text: "EM blast backfired, causing facial armor damage.",
            effects: { xp: 15, credits: 15, injury: 35 }
          }
        ]
      },
      {
        id: "op-4-ev-2",
        title: "DATABASE CORE",
        text: "Secure console terminal locked.",
        options: [
          {
            id: "op-4-ev2-opt1",
            text: "Inject bypass security decryption key.",
            success_prob: 75,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Console accepted bypass key.",
            failure_text: "Lockout trigger fired. Console shock sustained.",
            effects: { xp: 20, credits: 20, injury: 20 }
          }
        ]
      },
      {
        id: "op-4-ev-3",
        title: "SECURITY REBOOT",
        text: "Silo alerts triggered. Vault seals activating.",
        options: [
          {
            id: "op-4-ev3-opt1",
            text: "Secure the drive and escape via vents.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 20 },
            success_text: "Secured database drive and escaped through vents.",
            failure_text: "Vent hatch closed early. Heavy strain sustained during escape.",
            effects: { xp: 25, credits: 30, injury: 25, unlocksSectorId: "sec-omega", reputationBonus: 10 }
          }
        ]
      }
    ]
  },
  {
    id: "op-5-satellite-hijack",
    title: "OPERATION SATELLITE HIJACK",
    description: "Redirect telemetry scanning paths from Sector Gamma uplink.",
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
    story: "Calibrate regional dish path telemetry to bypass search scanners.",
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
        text: "Dish antenna grids leaking high-dose radiation.",
        options: [
          {
            id: "op-5-ev1-opt1",
            text: "Inject anti-radiation formula.",
            success_prob: 80,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "Inoculation held. Shielded from radiation spikes.",
            failure_text: "Formula collapsed. Cell radiation damage sustained.",
            effects: { xp: 25, credits: 20, injury: 30 }
          }
        ]
      },
      {
        id: "op-5-ev-2",
        title: "RECALIBRATION CODES",
        text: "Dish console locked to active tracking targets.",
        options: [
          {
            id: "op-5-ev2-opt1",
            text: "Calibrate spectrum alignment grids.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 20 },
            success_text: "Scan paths successfully redirected.",
            failure_text: "Console capacitor exploded. Plasma burn sustained.",
            effects: { xp: 30, credits: 40, injury: 25 }
          }
        ]
      },
      {
        id: "op-5-ev-3",
        title: "UPLINK SECURITY",
        text: "Rogue security drones approaching telemetry deck.",
        options: [
          {
            id: "op-5-ev3-opt1",
            text: "Trigger fake decoy signatures.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Drones redirected away. Telemetry uplink secured.",
            failure_text: "Decoy key failed. Drones fired during your retreat.",
            effects: { xp: 35, credits: 50, injury: 30, unlocksSectorId: "sec-zeta", reputationBonus: 15 }
          }
        ]
      }
    ]
  },
  {
    id: "op-6-outpost-breach",
    title: "OPERATION OUTPOST BREACH",
    description: "Clear perimeter gate to secure transport routes. Repeatable.",
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
    story: "Assault security outposts blocking transport supply lanes.",
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
        text: "Reinforced gate blocks transport route access.",
        options: [
          {
            id: "op-6-ev1-opt1",
            text: "Blast gate with breach charge.",
            success_prob: 85,
            class_bonus: { classId: "Assault", bonus: 10 },
            success_text: "Gate blown. Transport lane cleared.",
            failure_text: "Debris feedback struck shoulder guards.",
            effects: { xp: 10, credits: 20, injury: 15 }
          }
        ]
      },
      {
        id: "op-6-ev-2",
        title: "TACTICAL RETREAT",
        text: "Rogue guardian drone blocking gate exit.",
        options: [
          {
            id: "op-6-ev2-opt1",
            text: "Neutralize the drone.",
            success_prob: 80,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Drone neutralized. Exit clear.",
            failure_text: "Drone shot fired. Laser burn sustained.",
            effects: { xp: 15, credits: 20, injury: 20, reputationBonus: 5 }
          }
        ]
      }
    ]
  },
  {
    id: "op-7-omega-nexus",
    title: "OPERATION OMEGA NEXUS",
    description: "Secure Sector Omega quantum relay. Establish final legacy registry handshake.",
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
    story: "Infiltrate temporal substation core to verify terminal connection.",
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
        text: "Quantum core surrounded by shifting chrono-flares.",
        options: [
          {
            id: "op-7-ev1-opt1",
            text: "Calibrate frequencies via quantum pads.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "Frequencies locked. Arch energy stabilized.",
            failure_text: "Temporal feedback shocked terminal interfaces.",
            effects: { xp: 30, credits: 50, injury: 25 }
          },
          {
            id: "op-7-ev1-opt2",
            text: "Inject script routing override loops.",
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Handshake completed. Core arch opened.",
            failure_text: "Override detected. Defenses fired warning pulse.",
            effects: { xp: 35, credits: 40, injury: 30 }
          }
        ]
      }
    ]
  },
  {
    id: "op-8-core-venting",
    title: "OPERATION CORE VENTING",
    description: "Vent radioactive reactor core valves & retrieve Deuterium canisters. Repeatable.",
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
    story: "Vent pressure tubes to secure remaining Deuterium cells.",
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
        text: "Coolant pipes leaking high-pressure radioactive vapor.",
        options: [
          {
            id: "op-8-ev1-opt1",
            text: "Cycle backup valves using cutters.",
            success_prob: 75,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "Valve cycled. Vapor vented safely.",
            failure_text: "Scalding coolant spray caused severe skin burns.",
            effects: { xp: 20, credits: 30, injury: 25 }
          }
        ]
      }
    ]
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "inv-basic-helmet", name: "Standard Combat Helmet", rarity: "Common", quality: 100, slot: "Helmet", classRequirement: "None", power: 15, desc: "Standard issues steel composite helmet providing basic head defense.", qty: 1, type: "armor", itemLevel: 1, stats: { Armor: "+5%" }, category: "Armor", weight: 1.0, durability: 100, maxDurability: 100 },
  { id: "inv-basic-vest", name: "Tactical Plate Vest", rarity: "Common", quality: 100, slot: "Armor", classRequirement: "None", power: 20, desc: "Standard issue bulletproof vest with steel plating.", qty: 1, type: "armor", itemLevel: 1, stats: { Armor: "+10%" }, category: "Armor", weight: 3.5, durability: 100, maxDurability: 100 },
  { id: "inv-basic-rifle", name: "Standard Issue Assault Rifle", rarity: "Common", quality: 100, slot: "Weapon", classRequirement: "None", power: 25, desc: "Reliable kinetic carbine standard issue for recruit security forces.", qty: 1, type: "weapon", itemLevel: 1, stats: { DPS: 20 }, category: "Weapons", weight: 3.2, durability: 100, maxDurability: 100 },
  { id: "inv-basic-backpack", name: "Standard Rucksack", rarity: "Common", quality: 100, slot: "Backpack", classRequirement: "None", power: 10, desc: "Durable nylon rucksack with standard cargo slots.", qty: 1, type: "armor", itemLevel: 1, stats: { Slots: "+5" }, category: "Armor", weight: 0.8, durability: 100, maxDurability: 100 },
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
