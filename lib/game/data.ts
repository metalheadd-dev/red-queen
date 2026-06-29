import { Sector, Mission, InventoryItem } from "./types";

export const INITIAL_SECTORS: Sector[] = [
  {
    id: "sec-alpha",
    name: "SECTOR ALPHA",
    status: "AVAILABLE",
    difficulty: "Easy",
    rewards: ["Medical Supplies", "Credits", "Metal"],
    description: "Ruined medical depots in suburban zone containing vital civilian caches.",
    completionPercentage: 80,
    x: "25%",
    y: "35%"
  },
  {
    id: "sec-beta",
    name: "SECTOR BETA",
    status: "AVAILABLE",
    difficulty: "Normal",
    rewards: ["Electronics", "Credits", "Energy Cells"],
    description: "Fluctuating electromagnetic field generator requiring isolation scripts.",
    completionPercentage: 40,
    x: "50%",
    y: "60%"
  },
  {
    id: "sec-delta",
    name: "SECTOR DELTA",
    status: "DANGEROUS",
    difficulty: "Hard",
    rewards: ["Research Data", "Credits", "Energy Cells"],
    description: "Rogue Sybil node cluster routing network traffic and trace scanners.",
    completionPercentage: 10,
    x: "75%",
    y: "30%"
  },
  {
    id: "sec-epsilon",
    name: "SECTOR EPSILON",
    status: "LOCKED",
    difficulty: "Normal",
    rewards: ["Research Data", "Metal", "Credits"],
    description: "Deep sub-level server warehouse silos protected by firewalls.",
    completionPercentage: 0,
    x: "20%",
    y: "75%"
  },
  {
    id: "sec-gamma",
    name: "SECTOR GAMMA",
    status: "LOCKED",
    difficulty: "Hard",
    rewards: ["Titanite Scrap", "Credits"],
    description: "Volatile orbital fallout telemetry station emitting anomaly radiation.",
    completionPercentage: 0,
    x: "85%",
    y: "70%"
  },
  {
    id: "sec-zeta",
    name: "SECTOR ZETA",
    status: "LOCKED",
    difficulty: "Hard",
    rewards: ["Deuterium Cells", "Research Data"],
    description: "Decommissioned quantum core processing plant experiencing localized gravity drops.",
    completionPercentage: 0,
    x: "65%",
    y: "80%"
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
    completionState: "AVAILABLE",
    unlockRequirements: {},
    category: "critical",
    scenarios: [
      {
        text: "You arrive at the depot. The entrance is blocked by structural rubble, and there are high biological hazard readings inside. The survivors are running out of air.",
        options: [
          {
            id: "opt-1-shaft",
            text: "Inject advanced stim-neutralizers and crawl through the narrow ventilation shafts.",
            success_prob: 75,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "You navigated the vents, located the survivors, and stabilized them. Extraction successful.",
            failure_text: "The toxic gas saturated your filters before you could reach the shafts. You had to pull back.",
            stat_gains: { xp: 25, credits: 50, resource: "Medical Supplies", resource_qty: 2, sub_stats: { adaptability: 2, technical_preparedness: 1 } }
          },
          {
            id: "opt-1-breach",
            text: "Use heavy breach charges to clear the front rubble.",
            success_prob: 80,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "The charge cleared the door instantly. You rushed in and pulled the survivors to safety.",
            failure_text: "The explosion caused a secondary structural collapse, blocking the entrance permanently. Mission failed.",
            stat_gains: { xp: 30, credits: 40, resource: "Metal", resource_qty: 3, sub_stats: { operational_discipline: 2, resourcefulness: 1 } }
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
    completionState: "AVAILABLE",
    unlockRequirements: { level: 1 },
    category: "normal",
    scenarios: [
      {
        text: "The gravity beacon is fluctuating rapidly, threatening to collapse the immediate sector grid. A massive electromagnetic field prevents close physical access.",
        options: [
          {
            id: "opt-2-emp",
            text: "Calibrate the EMP dampening field to match the beacon's resonant frequency.",
            success_prob: 70,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "The dampener neutralized the anomaly field, allowing you to easily extract the main core.",
            failure_text: "The dampening wave backfired, overloading your scanner and locking down the core.",
            stat_gains: { xp: 45, credits: 100, resource: "Electronics", resource_qty: 3, sub_stats: { technical_preparedness: 3, resourcefulness: 1 } }
          },
          {
            id: "opt-2-script",
            text: "Initiate an automated bypass script via raw terminal overrides.",
            success_prob: 85,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Your bypass script successfully drained the anomaly's power grid, resetting the core safety parameters.",
            failure_text: "The anomaly detected the override and triggered an immediate data purge, wiping the transmitter logs.",
            stat_gains: { xp: 50, credits: 80, resource: "Research Data", resource_qty: 2, sub_stats: { surveillance_resistance: 2, threat_awareness: 2 } }
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
    completionState: "AVAILABLE",
    unlockRequirements: { bioScore: 15 },
    category: "critical",
    scenarios: [
      {
        text: "You interface with the node directory. A Sentinel security routine flags your hardware fingerprint and starts tracing your location.",
        options: [
          {
            id: "opt-3-obfuscate",
            text: "Deploy a network address obfuscation loop to confuse the trace scan.",
            success_prob: 65,
            class_bonus: { classId: "Specialist", bonus: 20 },
            success_text: "Your routing keys swapped dynamically. The scanner lost tracking and the bypass completed safely.",
            failure_text: "The trace bypassed your obfuscation path, locking down the terminal and exposing your signature.",
            stat_gains: { xp: 60, credits: 150, resource: "Research Data", resource_qty: 2, sub_stats: { surveillance_resistance: 4, threat_awareness: 1 } }
          },
          {
            id: "opt-3-overload",
            text: "Overload the localized node grid, causing an emergency shutdown.",
            success_prob: 70,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "The system short-circuited. You extracted the offline memory logs manually during the reboot.",
            failure_text: "A feedback surge ruptured your terminal adapter, aborting the extraction sequence.",
            stat_gains: { xp: 55, credits: 130, resource: "Energy Cells", resource_qty: 2, sub_stats: { technical_preparedness: 3 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-4-server-raid",
    title: "OPERATION SERVER RAID",
    description: "Extract encrypted anomaly coordinates from the Sector Epsilon sub-level vault databases. Watch for rogue drones.",
    region: "sec-epsilon",
    difficulty: "Normal",
    duration: 8,
    recommendedClass: "Recon",
    recommendedFaction: "Eclipse",
    rewards: { xp: 40, credits: 90, resource: "Research Data", resourceQty: 3 },
    completionState: "LOCKED",
    unlockRequirements: { completedMissionId: "op-2-signal-recovery", level: 2 },
    category: "normal",
    scenarios: [
      {
        text: "Rogue security drones patrol the corridors. The vault console is at the end of the hall.",
        options: [
          {
            id: "opt-4-cloak",
            text: "Activate recon scanner cloaking grids and slip past the drone sensors.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "You bypassed the security patrols undetected and downloaded the coordinates.",
            failure_text: "The sensors picked up your thermal signature. You had to trigger an emergency retreat.",
            stat_gains: { xp: 40, credits: 95, resource: "Research Data", resource_qty: 3, sub_stats: { threat_awareness: 3, adaptability: 1 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-5-satellite-hijack",
    title: "OPERATION SATELLITE HIJACK",
    description: "Recalibrate the high-altitude telemetry dish in Sector Gamma to redirect scanning paths away from secure bunker coordinates.",
    region: "sec-gamma",
    difficulty: "Hard",
    duration: 12,
    recommendedClass: "Scientist",
    recommendedFaction: "Horizon",
    rewards: { xp: 75, credits: 200, resource: "Energy Cells", resourceQty: 2 },
    completionState: "LOCKED",
    unlockRequirements: { completedMissionId: "op-3-sybil-breach", bioScore: 30 },
    category: "critical",
    scenarios: [
      {
        text: "The satellite console requires manual wave-alignment. Anomaly radiation levels are rising.",
        options: [
          {
            id: "opt-5-realign",
            text: "Use gravity wave spectrum decoders to align the dish manually.",
            success_prob: 75,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "You aligned the frequencies perfectly. The anomaly scan has been successfully redirected.",
            failure_text: "The radiation spikes scrambled the dish logic boards before alignment could finish.",
            stat_gains: { xp: 80, credits: 200, resource: "Energy Cells", resource_qty: 2, sub_stats: { psychological_stability: 3, technical_preparedness: 2 } }
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
    completionState: "AVAILABLE",
    unlockRequirements: {},
    category: "side",
    scenarios: [
      {
        text: "A locked armored hatch blocks the main logistics entry depot.",
        options: [
          {
            id: "opt-6-blow",
            text: "Detonate heavy kinetic charges on the vault door hinge brackets.",
            success_prob: 85,
            class_bonus: { classId: "Assault", bonus: 10 },
            success_text: "The door is blown. Route cleared.",
            failure_text: "The charge failed to ignite correctly, forcing a manual extraction fallback.",
            stat_gains: { xp: 20, credits: 40, resource: "Metal", resource_qty: 2, sub_stats: { operational_discipline: 2 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-7-pathogen-extraction",
    title: "OPERATION PATHOGEN EXTRACTION",
    description: "Harvest biological toxin cultures from a leaking bio-containment capsule in Sector Alpha.",
    region: "sec-alpha",
    difficulty: "Easy",
    duration: 6,
    recommendedClass: "Medic",
    recommendedFaction: "Helix",
    rewards: { xp: 30, credits: 60, resource: "Medical Supplies", resourceQty: 3 },
    completionState: "AVAILABLE",
    unlockRequirements: {},
    category: "side",
    scenarios: [
      {
        text: "Liquid bio-toxins are dripping onto the platform. The valve must be isolated and extracted.",
        options: [
          {
            id: "opt-7-neutralize",
            text: "Inject chemical stabilizer formulas directly into the canister core.",
            success_prob: 80,
            class_bonus: { classId: "Medic", bonus: 15 },
            success_text: "Canister stabilized and harvested safely.",
            failure_text: "The canister ruptured, leaking hazardous compounds. You evacuated the area immediately.",
            stat_gains: { xp: 30, credits: 60, resource: "Medical Supplies", resource_qty: 3, sub_stats: { adaptability: 2, resourcefulness: 1 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-8-drone-sabotage",
    title: "OPERATION DRONE SABOTAGE",
    description: "Intercept and recalibrate a patrol drone in Sector Beta to secure route telemetry parameters.",
    region: "sec-beta",
    difficulty: "Normal",
    duration: 7,
    recommendedClass: "Engineer",
    recommendedFaction: "Nomads",
    rewards: { xp: 35, credits: 70, resource: "Electronics", resourceQty: 2 },
    completionState: "AVAILABLE",
    unlockRequirements: { level: 2 },
    category: "side",
    scenarios: [
      {
        text: "The drone lies damaged on the floor, but its beacon will alert security if not deactivated.",
        options: [
          {
            id: "opt-8-override",
            text: "Recalibrate the drone telemetry router using custom Wasm scripts.",
            success_prob: 75,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Drone secured and routed into your tracking network.",
            failure_text: "A hardware security fuse blew, bricking the drone and alerting security patrols.",
            stat_gains: { xp: 35, credits: 70, resource: "Electronics", resource_qty: 2, sub_stats: { technical_preparedness: 2, resourcefulness: 1 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-9-quantum-decryption",
    title: "OPERATION QUANTUM DECRYPTION",
    description: "Decrypt localized sub-quantum key signatures inside the Sector Zeta processing plant core logs.",
    region: "sec-zeta",
    difficulty: "Hard",
    duration: 10,
    recommendedClass: "Scientist",
    recommendedFaction: "Horizon",
    rewards: { xp: 50, credits: 110, resource: "Research Data", resourceQty: 2 },
    completionState: "LOCKED",
    unlockRequirements: { level: 3 },
    category: "normal",
    scenarios: [
      {
        text: "The quantum register is fluctuating. The key must be decrypted within the alignment window.",
        options: [
          {
            id: "opt-9-align",
            text: "Deploy a sub-quantum decrypt signature bypass script.",
            success_prob: 70,
            class_bonus: { classId: "Scientist", bonus: 15 },
            success_text: "Signature bypassed. Logs retrieved successfully.",
            failure_text: "The quantum states collapsed, wiping the register buffer logs.",
            stat_gains: { xp: 50, credits: 110, resource: "Research Data", resource_qty: 2, sub_stats: { technical_preparedness: 2, surveillance_resistance: 2 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-10-core-overload",
    title: "OPERATION CORE OVERLOAD",
    description: "Trigger a controlled overload of the localized quantum generator core in Sector Zeta.",
    region: "sec-zeta",
    difficulty: "Hard",
    duration: 14,
    recommendedClass: "Engineer",
    recommendedFaction: "Citadel",
    rewards: { xp: 80, credits: 180, resource: "Energy Cells", resourceQty: 3 },
    completionState: "LOCKED",
    unlockRequirements: { level: 4, bioScore: 40 },
    category: "critical",
    scenarios: [
      {
        text: "The core safety valves must be shut down. Structural gravity fields are collapsing.",
        options: [
          {
            id: "opt-10-valves",
            text: "Manually bypass the generator core fluid safety containment valves.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 20 },
            success_text: "Core overloaded. You evacuated with secondary telemetry logs intact.",
            failure_text: "Valves jammed. The system triggered an automatic trace protocol lockdown.",
            stat_gains: { xp: 85, credits: 180, resource: "Energy Cells", resource_qty: 3, sub_stats: { technical_preparedness: 3, adaptability: 2 } }
          }
        ]
      }
    ]
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Kinetic Carbine V3", rarity: "Rare", quality: 100, slot: "Weapon", classRequirement: "Assault", power: 45, desc: "Short-stroke piston rifle caliber tailored for anomaly breach parameters.", qty: 1, type: "weapon" },
  { id: "inv-2", name: "Stealth Recon Cloak", rarity: "Epic", quality: 92, slot: "Gadget", classRequirement: "Recon", power: 65, desc: "Bends electromagnetic spectra to match surrounding quadrant visual noise.", qty: 1, type: "weapon" },
  { id: "inv-3", name: "Advanced Stim Injector", rarity: "Uncommon", quality: 100, slot: "Medkit", classRequirement: "Medic", power: 25, desc: "Rapidly neutralizes biological toxins and speeds metabolic repair.", qty: 5, type: "consumable" },
  { id: "inv-4", name: "Volumetric Shield Core", rarity: "Legendary", quality: 100, slot: "Armor", classRequirement: "Scientist", power: 90, desc: "Projects a gravity displacement barrier to deflect analog projectiles.", qty: 1, type: "armor" },
  { id: "inv-5", name: "C-4 Anomaly Breach Charge", rarity: "Rare", quality: 100, slot: "Utility", classRequirement: "Assault", power: 50, desc: "Heavy thermite detonation device capable of punching through node shields.", qty: 3, type: "consumable" },
  { id: "inv-6", name: "Decoy Signature Key", rarity: "Common", quality: 100, slot: "Utility", classRequirement: "Specialist", power: 10, desc: "Injects synthetic user profiles to misdirect rogue Sybil trackers.", qty: 8, type: "consumable" },
  { id: "inv-7", name: "Quantum Decryptor Pad", rarity: "Uncommon", quality: 85, slot: "Gadget", classRequirement: "Scientist", power: 30, desc: "Processes localized sub-quantum key decryptions via custom WASM modules.", qty: 1, type: "weapon" },
  { id: "inv-8", name: "Helix Biosensor Helmet", rarity: "Epic", quality: 95, slot: "Helmet", classRequirement: "Medic", power: 75, desc: "Monitors oxygen filtration levels and identifies regional pathogen clusters.", qty: 1, type: "armor" },
  { id: "inv-9", name: "Modular Tactical Pack", rarity: "Common", quality: 100, slot: "Backpack", classRequirement: "Engineer", power: 15, desc: "Extra load-bearing compartments reinforced with composite materials.", qty: 1, type: "armor" },
  { id: "inv-10", name: "Kevlar Node Mesh Jacket", rarity: "Common", quality: 78, slot: "Armor", classRequirement: "Engineer", power: 22, desc: "Reinforced under-armor offering basic protection against thermal loops.", qty: 1, type: "armor" },
  { id: "inv-11", name: "Deuterium Power Cell", rarity: "Rare", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "High-density plasma power pack for calibrating transmitters.", qty: 12, type: "material" },
  { id: "inv-12", name: "Raw Titanite Scrap", rarity: "Common", quality: 100, slot: "None", classRequirement: "None", power: 0, desc: "Scraped bulkhead alloys for crafting primary shield plates.", qty: 25, type: "material" },
  { id: "inv-13", name: "Sybil Decoy Router", rarity: "Epic", quality: 90, slot: "Gadget", classRequirement: "Specialist", power: 70, desc: "Establishes multi-hop non-custodial transaction relay connections.", qty: 1, type: "weapon" },
  { id: "inv-14", name: "Portable Gravity Analyzer", rarity: "Rare", quality: 100, slot: "Utility", classRequirement: "Scientist", power: 55, desc: "Measures localized gravity-well contractions and warns of grid implosions.", qty: 1, type: "weapon" }
];
