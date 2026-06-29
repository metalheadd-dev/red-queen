import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Standard mock operations as defined in the Master Game Bible
const MOCK_OPERATIONS = [
  {
    id: "op-1-sanctuary-search",
    title: "OPERATION SANCTUARY SEARCH",
    slug: "sanctuary-search",
    description: "Deploy to Sector Alpha to locate and extract a civilian survival cell trapped inside an abandoned medical depot. High toxic levels detected.",
    category: "Rescue",
    difficulty: "Easy",
    recommended_class_id: "Medic",
    recommended_role_ids: ["Combat Medic"],
    minimum_level: 1,
    minimum_bio_score: 0,
    estimated_duration: 5,
    energy_cost: 0,
    reward_package_id: "reward-easy-medic",
    repeatable: true,
    status: "ACTIVE",
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
          },
          {
            id: "opt-1-manual",
            text: "Locate an alternative maintenance hatch using manual overrides.",
            success_prob: 65,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "You bypassed the security locks and opened the side hatch, letting the survivors escape.",
            failure_text: "The override took too long and the console shorted out, leaving you locked out.",
            stat_gains: { xp: 20, credits: 60, resource: "Electronics", resource_qty: 2, sub_stats: { technical_preparedness: 2 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-2-signal-recovery",
    title: "OPERATION BEACON RECOVERY",
    slug: "signal-recovery",
    description: "Deploy to Sector Beta to recover an orbital transmitter beacon emitting high-energy gravity anomalies. Structural stability is collapsing.",
    category: "Recovery",
    difficulty: "Normal",
    recommended_class_id: "Engineer",
    recommended_role_ids: ["Field Engineer"],
    minimum_level: 2,
    minimum_bio_score: 20,
    estimated_duration: 10,
    energy_cost: 0,
    reward_package_id: "reward-normal-eng",
    repeatable: true,
    status: "ACTIVE",
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
            success_prob: 80,
            class_bonus: { classId: "Specialist", bonus: 15 },
            success_text: "Your bypass script successfully drained the anomaly's power grid, resetting the core safety parameters.",
            failure_text: "The anomaly detected the override and triggered an immediate data purge, wiping the transmitter logs.",
            stat_gains: { xp: 50, credits: 80, resource: "Research Data", resource_qty: 2, sub_stats: { surveillance_resistance: 2, threat_awareness: 2 } }
          },
          {
            id: "opt-2-manual",
            text: "Disconnect the power cells manually using insulated kinetic cutters.",
            success_prob: 60,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "You quickly sheared the primary power cables, shutting down the beacon before it imploded.",
            failure_text: "A feedback surge from the cutter static-shocked you, disabling your system and aborting the run.",
            stat_gains: { xp: 35, credits: 120, resource: "Energy Cells", resource_qty: 2, sub_stats: { operational_discipline: 3 } }
          }
        ]
      }
    ]
  },
  {
    id: "op-3-sybil-breach",
    title: "OPERATION SYBIL GRID BREACH",
    slug: "sybil-breach",
    description: "Locate and scan a rogue sybil botnet cluster harvesting cryptographic user signatures in Sector Delta.",
    category: "Recon",
    difficulty: "Hard",
    recommended_class_id: "Specialist",
    recommended_role_ids: ["Drone Operator", "Infiltrator"],
    minimum_level: 3,
    minimum_bio_score: 40,
    estimated_duration: 15,
    energy_cost: 0,
    reward_package_id: "reward-hard-spec",
    repeatable: true,
    status: "ACTIVE",
    scenarios: [
      {
        text: "The rogue botnet senses your signature uplink. It initiates a trace loop to locate your physical node coordinates and freeze your asset wallets.",
        options: [
          {
            id: "opt-3-decoy",
            text: "Deploy a swarm of virtual decoy keys to overload the tracker's memory buffers.",
            success_prob: 65,
            class_bonus: { classId: "Specialist", bonus: 20 },
            success_text: "The decoy keys saturated the botnet tracker, allowing you to clone its central database completely undetected.",
            failure_text: "The botnet identified the decoys as synthetic, redirecting its counter-trace straight to your subnet.",
            stat_gains: { xp: 75, credits: 200, resource: "Research Data", resource_qty: 4, sub_stats: { surveillance_resistance: 4, technical_preparedness: 2 } }
          },
          {
            id: "opt-3-route",
            text: "Route your transaction uplink through 4 non-custodial relay loops.",
            success_prob: 75,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "Your routing profile successfully masked your node geography. The scan completed cleanly.",
            failure_text: "Latency from the multi-hop routing collapsed the connection before the scan could complete.",
            stat_gains: { xp: 60, credits: 180, resource: "Energy Cells", resource_qty: 3, sub_stats: { adaptability: 3, threat_awareness: 2 } }
          },
          {
            id: "opt-3-shutdown",
            text: "Force shutdown the local grid node, purging all active configurations.",
            success_prob: 70,
            class_bonus: { classId: "Engineer", bonus: 15 },
            success_text: "You cut the power grid cleanly, isolating the botnet and securing your local data payload.",
            failure_text: "The shutdown sequence triggered an automatic warning, alert-steered by the adversary to lock your system.",
            stat_gains: { xp: 55, credits: 150, resource: "Metal", resource_qty: 4, sub_stats: { operational_discipline: 3, psychological_stability: 2 } }
          }
        ]
      }
    ]
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: MOCK_OPERATIONS,
    error: null
  });
}
