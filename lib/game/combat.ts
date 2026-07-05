import { InventoryItem, OperativeProfile } from "./types";

export interface AIOpponent {
  id: string;
  name: string;
  faction: string;
  class: string;
  role: string;
  level: number;
  bioScore: number;
  equipmentPower: number;
  threatRating: "Low" | "Medium" | "High" | "Critical";
  avatarSeed: number;
}

export interface BattleLogEntry {
  round: number;
  attacker: "player" | "opponent";
  actionName: string;
  damageDealt: number;
  shieldDamage: number;
  healingDone: number;
  logText: string;
  playerHp: number;
  playerShield: number;
  opponentHp: number;
  opponentShield: number;
}

export interface BattleResult {
  outcome: "VICTORY" | "DEFEAT";
  ratingChange: number;
  xpEarned: number;
  creditsEarned: number;
  recoveredResources: Record<string, number>;
  bioScoreChange: number;
  durationSeconds: number;
  logs: BattleLogEntry[];
  totalRounds: number;
}

const FACTIONS = ["Ghost Division", "Aegis", "Nomads", "Eclipse", "Horizon", "Citadel", "Vanguard"];
const CLASSES = ["Assault", "Recon", "Scientist", "Medic", "Engineer"];
const ROLES: Record<string, string[]> = {
  Assault: ["Breach Specialist", "Tactical Vanguard", "Commando Officer"],
  Recon: ["Pathfinder", "Spectre Scout", "Sniper Operative"],
  Scientist: ["Bio-Tech Researcher", "Anomaly Analyst", "Shield Calibration Tech"],
  Medic: ["Field Trauma Surgeon", "Helix Pathologist", "Nano-Gen Combat Doctor"],
  Engineer: ["Defense Systems Engineer", "Fortress Architect", "Hardware Specialist"]
};

/**
 * Generate a suitable AI opponent matching player parameters
 */
export function generateAIOpponent(playerLevel: number, playerBioScore: number, seed?: number): AIOpponent {
  const currentSeed = seed !== undefined ? seed : Math.floor(Math.random() * 10000);
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const r1 = random(currentSeed + 1);
  const r2 = random(currentSeed + 2);
  const r3 = random(currentSeed + 3);
  const r4 = random(currentSeed + 4);
  const r5 = random(currentSeed + 5);

  const num = Math.floor(r1 * 9000) + 1000;
  const name = `SOLVIVOR #${num}`;

  const faction = FACTIONS[Math.floor(r2 * FACTIONS.length)];
  const classType = CLASSES[Math.floor(r3 * CLASSES.length)];
  const rolesList = ROLES[classType];
  const role = rolesList[Math.floor(r4 * rolesList.length)];

  // Scale level: within -2 to +3 levels of player
  const levelOffset = Math.floor(r5 * 6) - 2;
  const level = Math.max(1, playerLevel + levelOffset);

  // Bio score scaling
  const bioScoreBase = Math.round(50 * level);
  const bioScoreOffset = Math.floor(random(currentSeed + 6) * 120) - 60;
  const bioScore = Math.max(30, playerBioScore + bioScoreOffset);

  // Equipment power scaling
  const eqPowerBase = level * 400;
  const eqPowerOffset = Math.floor(random(currentSeed + 7) * 800) - 300;
  const equipmentPower = Math.max(200, eqPowerBase + eqPowerOffset);

  // Threat Rating calculation
  let threatRating: "Low" | "Medium" | "High" | "Critical" = "Medium";
  const ratio = (level + bioScore / 100 + equipmentPower / 1000) / (playerLevel + playerBioScore / 100 + 3.0);
  if (ratio < 0.8) threatRating = "Low";
  else if (ratio < 1.1) threatRating = "Medium";
  else if (ratio < 1.4) threatRating = "High";
  else threatRating = "Critical";

  return {
    id: `opp-${currentSeed}`,
    name,
    faction,
    class: classType,
    role,
    level,
    bioScore,
    equipmentPower,
    threatRating,
    avatarSeed: currentSeed
  };
}

/**
 * Combat Simulation calculations loop
 */
export function runCombatSimulation(
  profile: OperativeProfile,
  equippedGear: Record<string, InventoryItem | null>,
  opponent: AIOpponent
): BattleResult {
  // Player Stats Setup
  const pLevel = profile.level || 1;
  const pBioScore = profile.stats ? (profile.stats.threat_awareness + profile.stats.operational_discipline + profile.stats.psychological_stability) / 3 * 10 : 50;
  
  // Power Index Math
  let pWeaponPower = 50;
  let pArmorPower = 50;
  let pShieldMax = 100;

  if (equippedGear.Weapon) pWeaponPower += equippedGear.Weapon.power || 0;
  if (equippedGear.Armor) pArmorPower += equippedGear.Armor.power || 0;
  if (equippedGear.Helmet) pArmorPower += (equippedGear.Helmet.power || 0) * 0.5;
  if (equippedGear.Backpack) pArmorPower += (equippedGear.Backpack.power || 0) * 0.2;
  if (equippedGear.Utility) pWeaponPower += (equippedGear.Utility.power || 0) * 0.3;

  // Custom shield calculations
  if (equippedGear.Armor && equippedGear.Armor.stats && typeof equippedGear.Armor.stats.Shield === "string") {
    const sVal = parseInt(equippedGear.Armor.stats.Shield.replace(/\D/g, ""));
    if (!isNaN(sVal)) pShieldMax += sVal;
  }

  const playerMaxHp = Math.round(150 + pLevel * 15 + pBioScore * 0.8);
  let playerHp = playerMaxHp;
  let playerShield = pShieldMax;

  // Opponent Stats Setup
  const oLevel = opponent.level;
  const oBioScore = opponent.bioScore;
  const oEqPower = opponent.equipmentPower;

  const opponentMaxHp = Math.round(140 + oLevel * 14 + oBioScore * 0.75);
  let opponentHp = opponentMaxHp;
  let opponentShield = Math.round(80 + oEqPower * 0.05);

  const oWeaponPower = Math.round(45 + oEqPower * 0.04);
  const oArmorPower = Math.round(45 + oEqPower * 0.04);

  // Battle execution variables
  const logs: BattleLogEntry[] = [];
  let round = 1;
  const maxRounds = 12;

  // Active temporary buffs
  let pDmgBuff = 1.0;
  let oDmgBuff = 1.0;
  let pShieldRegen = 0;
  let oShieldRegen = 0;

  // Faction matchup bonuses
  let pFactionBonus = 1.0;
  if (profile.faction === "Ghost Division" && opponent.faction === "Eclipse") pFactionBonus = 1.15;
  if (profile.faction === "Aegis" && opponent.faction === "Nomads") pFactionBonus = 1.15;

  while (playerHp > 0 && opponentHp > 0 && round <= maxRounds) {
    // 1. Process regenerations
    if (playerShield < pShieldMax && pShieldRegen > 0) {
      playerShield = Math.min(pShieldMax, playerShield + pShieldRegen);
    }
    if (opponentShield < (80 + oEqPower * 0.05) && oShieldRegen > 0) {
      opponentShield = Math.min(Math.round(80 + oEqPower * 0.05), opponentShield + oShieldRegen);
    }

    // --- PLAYER TURN ---
    // Action pick based on Class/Role
    let actionName = "Assault Fire";
    let baseDmg = Math.round(15 + pWeaponPower * 0.25 + pLevel * 2);
    let healing = 0;

    if (profile.class === "Medic") {
      if (playerHp < playerMaxHp * 0.4 && Math.random() > 0.3) {
        actionName = "Helix Healing Node";
        healing = Math.round(30 + pBioScore * 0.4);
      } else {
        actionName = "Pathological Strike";
        baseDmg = Math.round(baseDmg * 0.85);
      }
    } else if (profile.class === "Recon") {
      if (Math.random() > 0.5) {
        actionName = "Precision Sniper Shot";
        baseDmg = Math.round(baseDmg * 1.4);
      } else {
        actionName = "Stealth Strike";
      }
    } else if (profile.class === "Scientist") {
      if (playerShield < pShieldMax * 0.3 && Math.random() > 0.4) {
        actionName = "Shield Supercharge";
        playerShield = Math.min(pShieldMax, playerShield + Math.round(40 + pBioScore * 0.3));
      } else {
        actionName = "Volumetric Laser Sweep";
      }
    }

    // Apply modifiers
    let dmg = Math.round(baseDmg * pDmgBuff * pFactionBonus * (0.9 + Math.random() * 0.2));
    
    // Critical Hit Roll (5% base + adaptability stats)
    const pCritChance = 0.05 + (profile.stats?.adaptability || 0) * 0.005;
    let isCrit = Math.random() < pCritChance;
    if (isCrit) {
      dmg = Math.round(dmg * 1.5);
    }

    // Dodging check
    const oDodgeChance = 0.03 + (opponent.class === "Recon" ? 0.08 : 0);
    const isDodged = Math.random() < oDodgeChance;

    let dmgDealt = 0;
    let shieldDmg = 0;
    let logText = "";

    if (healing > 0) {
      playerHp = Math.min(playerMaxHp, playerHp + healing);
      logText = `${profile.name || "Operative"} deployed ${actionName}, restoring ${healing} HP.`;
    } else if (isDodged) {
      logText = `${opponent.name} successfully dodged the attack from ${profile.name || "Operative"}.`;
    } else {
      // Calculate split to shields first
      if (opponentShield > 0) {
        shieldDmg = Math.min(opponentShield, dmg);
        opponentShield -= shieldDmg;
        dmgDealt = Math.max(0, dmg - shieldDmg);
        
        // Mitigate remaining damage with opponent armor power
        const mitigation = oArmorPower / (oArmorPower + 200);
        dmgDealt = Math.round(dmgDealt * (1 - mitigation));
        opponentHp -= dmgDealt;
      } else {
        const mitigation = oArmorPower / (oArmorPower + 200);
        dmgDealt = Math.round(dmg * (1 - mitigation));
        opponentHp -= dmgDealt;
      }
      
      logText = `${profile.name || "Operative"} initiated ${actionName}${isCrit ? " [CRITICAL]" : ""}, dealing ${dmgDealt} HP damage and ${shieldDmg} shield damage.`;
    }

    logs.push({
      round,
      attacker: "player",
      actionName,
      damageDealt: dmgDealt,
      shieldDamage: shieldDmg,
      healingDone: healing,
      logText,
      playerHp: Math.max(0, playerHp),
      playerShield: Math.max(0, playerShield),
      opponentHp: Math.max(0, opponentHp),
      opponentShield: Math.max(0, opponentShield)
    });

    if (opponentHp <= 0) break;

    // --- OPPONENT TURN ---
    let oAction = "Counter Attack";
    let oBaseDmg = Math.round(15 + oWeaponPower * 0.23 + oLevel * 1.8);
    let oHealing = 0;

    if (opponent.class === "Medic") {
      if (opponentHp < opponentMaxHp * 0.4 && Math.random() > 0.4) {
        oAction = "Nano-Med Injector";
        oHealing = Math.round(25 + oBioScore * 0.35);
      } else {
        oAction = "Pathogen Dart";
      }
    } else if (opponent.class === "Recon") {
      if (Math.random() > 0.6) {
        oAction = "Suppressive Rifle Burst";
        oBaseDmg = Math.round(oBaseDmg * 1.3);
      }
    }

    let oDmg = Math.round(oBaseDmg * oDmgBuff * (0.9 + Math.random() * 0.2));
    const oCritChance = 0.05 + oLevel * 0.003;
    const isOpponentCrit = Math.random() < oCritChance;
    if (isOpponentCrit) {
      oDmg = Math.round(oDmg * 1.5);
    }

    const pDodgeChance = 0.03 + (profile.class === "Recon" ? 0.07 : 0) + (profile.stats?.surveillance_resistance || 0) * 0.005;
    const isPlayerDodged = Math.random() < pDodgeChance;

    let oDmgDealt = 0;
    let oShieldDmg = 0;
    let oLogText = "";

    if (oHealing > 0) {
      opponentHp = Math.min(opponentMaxHp, opponentHp + oHealing);
      oLogText = `${opponent.name} activated ${oAction}, recovering ${oHealing} HP.`;
    } else if (isPlayerDodged) {
      oLogText = `${profile.name || "Operative"} dodged incoming threat vectors from ${opponent.name}.`;
    } else {
      if (playerShield > 0) {
        oShieldDmg = Math.min(playerShield, oDmg);
        playerShield -= oShieldDmg;
        oDmgDealt = Math.max(0, oDmg - oShieldDmg);
        const pMitigation = pArmorPower / (pArmorPower + 220);
        oDmgDealt = Math.round(oDmgDealt * (1 - pMitigation));
        playerHp -= oDmgDealt;
      } else {
        const pMitigation = pArmorPower / (pArmorPower + 220);
        oDmgDealt = Math.round(oDmg * (1 - pMitigation));
        playerHp -= oDmgDealt;
      }

      oLogText = `${opponent.name} executed ${oAction}${isOpponentCrit ? " [CRITICAL]" : ""}, inflicting ${oDmgDealt} HP damage and ${oShieldDmg} shield damage.`;
    }

    logs.push({
      round,
      attacker: "opponent",
      actionName: oAction,
      damageDealt: oDmgDealt,
      shieldDamage: oShieldDmg,
      healingDone: oHealing,
      logText: oLogText,
      playerHp: Math.max(0, playerHp),
      playerShield: Math.max(0, playerShield),
      opponentHp: Math.max(0, opponentHp),
      opponentShield: Math.max(0, opponentShield)
    });

    round++;
  }

  const outcome = opponentHp <= 0 ? "VICTORY" : "DEFEAT";

  // Calculations for rewards
  const baseRatingShift = outcome === "VICTORY" ? 25 : -15;
  const bioScoreDiff = (oBioScore - pBioScore) / 20;
  const ratingChange = Math.round(baseRatingShift + Math.min(15, Math.max(-10, bioScoreDiff)));

  const xpEarned = outcome === "VICTORY" ? Math.round(200 + oLevel * 15) : Math.round(80 + oLevel * 5);
  const creditsEarned = outcome === "VICTORY" ? Math.round(150 + oLevel * 10) : Math.round(50 + oLevel * 3);

  // Drops roll: Medical Supplies, Electronics, Components, Deuterium Cell
  const recoveredResources: Record<string, number> = {};
  const dropRoll = Math.random();
  if (outcome === "VICTORY") {
    if (dropRoll < 0.25) {
      recoveredResources["Medical Supplies"] = Math.floor(Math.random() * 2) + 1;
    } else if (dropRoll < 0.50) {
      recoveredResources["Components"] = Math.floor(Math.random() * 2) + 1;
    } else if (dropRoll < 0.70) {
      recoveredResources["Electronics"] = 1;
    } else if (dropRoll < 0.82) {
      recoveredResources["Deuterium Cell"] = 1;
    }
  } else {
    // Defeat drop chance is significantly lower
    if (dropRoll < 0.1) {
      recoveredResources["Medical Supplies"] = 1;
    }
  }

  // BIO-SCORE impact calculation based on combat results
  const bioScoreChange = outcome === "VICTORY" ? 2 : -1;

  return {
    outcome,
    ratingChange,
    xpEarned,
    creditsEarned,
    recoveredResources,
    bioScoreChange,
    durationSeconds: round * 8, // simulated round length
    logs,
    totalRounds: round - 1
  };
}

/**
 * Select Live Red Queen Commentary based on current state of combat
 */
export function getRedQueenCombatComment(
  round: number,
  winProbability: number,
  playerHp: number,
  playerMaxHp: number,
  opponentHp: number,
  opponentMaxHp: number
): { comment: string; recommendation: string; insights: string[]; weaknesses: string[] } {
  
  let comment = "Evaluating operational vectors. Maintain discipline.";
  let recommendation = "Use a standard combat action to chip away at hostile defenses.";
  const insights = ["Combat subroutines active.", "Scanning telemetry streams."];
  const weaknesses = ["Armor mitigation present.", "Standard baseline shield active."];

  const pHpPct = playerHp / playerMaxHp;
  const oHpPct = opponentHp / opponentMaxHp;

  if (round === 1) {
    comment = "Operational simulation initiated. Opponent threat vectors are mapped.";
    recommendation = "Open with tactical strikes to test armor densities.";
    insights.push("Target stands prepared.");
  } else if (pHpPct < 0.3) {
    comment = "CRITICAL: Operative bio-vitals are dropping. High probability of operational failure.";
    recommendation = "Activate emergency medical protocols or defensive matrices immediately.";
    insights.push("Operative shields depleted.", "Vitals warning flashing.");
    weaknesses.push("Opponent maintaining high attack pressure.");
  } else if (oHpPct < 0.3) {
    comment = "Threat targets are failing to sustain structural integrity. Finish the simulation.";
    recommendation = "Deploy maximum kinetic overcharges to terminate active targets.";
    insights.push("Target armor structural failure.", "Offensive output high.");
    weaknesses.push("Target evasion protocol failing.");
  } else if (winProbability > 75) {
    comment = "Operative performance exceeds baseline projection matrix. Victory is highly probable.";
    recommendation = "Press the offensive and lock down hostile evade parameters.";
    insights.push("Operative damage is high.", "Tactics calculation matching.");
  } else if (winProbability < 35) {
    comment = "Simulated probabilities heavily favor opponent. Sub-optimal loadout impact visible.";
    recommendation = "Switch to bio-chemical shield calibration to counter heavy burst damage.";
    insights.push("Armor breach warning.", "Evasion response sluggish.");
  }

  return {
    comment,
    recommendation,
    insights,
    weaknesses
  };
}
