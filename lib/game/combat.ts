import { InventoryItem } from "./types";

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

export interface StatusEffect {
  name: "Bleeding" | "Burning" | "EMP Disabled" | "Poison" | "Armor Broken" | "Suppressed" | "Cover" | "Brace" | "DodgeBuff" | "CounterStance" | "Stimmed" | "DecoyActive" | "TurretActive";
  duration: number;
  value?: number;
}

export interface CombatantState {
  name: string;
  level: number;
  class: string;
  role: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  weaponPower: number;
  armorPower: number;
  statusEffects: StatusEffect[];
}

export interface CombatTurnResult {
  damageDealt: number;
  shieldDamage: number;
  healingDone: number;
  logText: string;
  criticalHit: boolean;
  dodgeTriggered: boolean;
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

  const levelOffset = Math.floor(r5 * 6) - 2;
  const level = Math.max(1, playerLevel + levelOffset);

  const bioScoreOffset = Math.floor(random(currentSeed + 6) * 120) - 60;
  const bioScore = Math.max(30, playerBioScore + bioScoreOffset);

  const eqPowerBase = level * 400;
  const eqPowerOffset = Math.floor(random(currentSeed + 7) * 800) - 300;
  const equipmentPower = Math.max(200, eqPowerBase + eqPowerOffset);

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
 * Check if a status effect is active on a combatant
 */
export function hasStatus(combatant: CombatantState, name: StatusEffect["name"]): boolean {
  return combatant.statusEffects.some(s => s.name === name && s.duration > 0);
}

/**
 * Remove a status effect
 */
export function removeStatus(combatant: CombatantState, name: StatusEffect["name"]) {
  combatant.statusEffects = combatant.statusEffects.filter(s => s.name !== name);
}

/**
 * Apply a status effect (refreshes duration if already active)
 */
export function applyStatus(combatant: CombatantState, name: StatusEffect["name"], duration: number, value?: number) {
  const existing = combatant.statusEffects.find(s => s.name === name);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    if (value !== undefined) existing.value = value;
  } else {
    combatant.statusEffects.push({ name, duration, value });
  }
}

/**
 * Ticks status effects down at the start of a combatant's turn.
 * Applies damage over time (DoT) and returns the tick log messages.
 */
export function tickStatusEffects(combatant: CombatantState): string[] {
  const tickLogs: string[] = [];
  const nextEffects: StatusEffect[] = [];

  for (const effect of combatant.statusEffects) {
    if (effect.duration <= 0) continue;

    let dotDamage = 0;
    if (effect.name === "Bleeding") {
      dotDamage = 15;
      combatant.hp = Math.max(0, combatant.hp - dotDamage);
      tickLogs.push(`[SYSTEM] ${combatant.name} suffers 15 Bleeding damage.`);
    } else if (effect.name === "Burning") {
      dotDamage = 20;
      combatant.hp = Math.max(0, combatant.hp - dotDamage);
      tickLogs.push(`[SYSTEM] ${combatant.name} suffers 20 Burning damage.`);
    } else if (effect.name === "Poison") {
      dotDamage = 12;
      combatant.hp = Math.max(0, combatant.hp - dotDamage);
      tickLogs.push(`[SYSTEM] ${combatant.name} suffers 12 Poison damage.`);
    } else if (effect.name === "TurretActive") {
      dotDamage = 20;
      combatant.hp = Math.max(0, combatant.hp - dotDamage);
      tickLogs.push(`[SYSTEM] Auto-Turret attacks ${combatant.name} for 20 Kinetic damage.`);
    }

    const nextDuration = effect.duration - 1;
    if (nextDuration > 0) {
      nextEffects.push({ ...effect, duration: nextDuration });
    } else {
      tickLogs.push(`[SYSTEM] Status ${effect.name} on ${combatant.name} expired.`);
    }
  }

  combatant.statusEffects = nextEffects;
  return tickLogs;
}

/**
 * Execute a turn action for a combatant.
 * Updates state for both attacker and target.
 */
export function executeCombatAction(
  attacker: CombatantState,
  target: CombatantState,
  actionType: "attack" | "defend" | "consumable" | "gadget" | "special" | "skip",
  subChoice: string
): CombatTurnResult {
  let damageDealt = 0;
  let shieldDamage = 0;
  let healingDone = 0;
  let criticalHit = false;
  let dodgeTriggered = false;
  let logText = "";

  // 1. SKIP ACTION
  if (actionType === "skip") {
    return {
      damageDealt: 0,
      shieldDamage: 0,
      healingDone: 0,
      criticalHit: false,
      dodgeTriggered: false,
      logText: `${attacker.name} skipped their turn to recalibrate systems.`
    };
  }

  // Check if disabled by EMP
  if ((actionType === "special" || actionType === "gadget") && hasStatus(attacker, "EMP Disabled")) {
    return {
      damageDealt: 0,
      shieldDamage: 0,
      healingDone: 0,
      criticalHit: false,
      dodgeTriggered: false,
      logText: `${attacker.name} attempted to deploy a system, but active EMP disables prevent it.`
    };
  }

  // 2. DEFEND ACTION
  if (actionType === "defend") {
    if (subChoice === "Take Cover") {
      applyStatus(attacker, "Cover", 1);
      logText = `${attacker.name} slides into cover, mitigating incoming attacks by 50%.`;
    } else if (subChoice === "Brace") {
      applyStatus(attacker, "Brace", 2);
      logText = `${attacker.name} braces for impact, boosting structural armor defense by 40%.`;
    } else if (subChoice === "Shield") {
      const shieldRestore = Math.min(attacker.maxShield - attacker.shield, 40);
      attacker.shield += shieldRestore;
      healingDone = shieldRestore;
      logText = `${attacker.name} recalibrates volumetric shield generators, restoring ${shieldRestore} Shield points.`;
    } else if (subChoice === "Dodge") {
      applyStatus(attacker, "DodgeBuff", 1);
      logText = `${attacker.name} initiates predictive evade patterns, increasing dodge chance by 40%.`;
    } else if (subChoice === "Counter Stance") {
      applyStatus(attacker, "CounterStance", 1);
      logText = `${attacker.name} enters a high-reflex counter posture, ready to deflect and strike back.`;
    }
    return { damageDealt, shieldDamage, healingDone, criticalHit, dodgeTriggered, logText };
  }

  // 3. CONSUMABLES
  if (actionType === "consumable") {
    if (subChoice.includes("Medkit") || subChoice.includes("Trauma")) {
      const healBase = 55;
      const finalHeal = hasStatus(attacker, "Poison") ? Math.round(healBase * 0.5) : healBase;
      const healed = Math.min(attacker.maxHp - attacker.hp, finalHeal);
      attacker.hp += healed;
      healingDone = healed;
      removeStatus(attacker, "Bleeding");
      logText = `${attacker.name} consumes Field Medkit, restoring ${healed} HP and sealing bleeding wounds.`;
    } else if (subChoice.includes("Stim")) {
      applyStatus(attacker, "Stimmed", 2);
      logText = `${attacker.name} self-injects Combat Stim, boosting next physical attacks by +30%.`;
    } else if (subChoice.includes("Cell") || subChoice.includes("Plasma")) {
      const shieldRestore = Math.min(attacker.maxShield - attacker.shield, 60);
      attacker.shield += shieldRestore;
      healingDone = shieldRestore;
      logText = `${attacker.name} loads Plasma Energy Cell, recharging ${shieldRestore} Shield points.`;
    } else {
      // Fallback consume
      const heal = Math.min(attacker.maxHp - attacker.hp, 30);
      attacker.hp += heal;
      healingDone = heal;
      logText = `${attacker.name} consumed survival rations, restoring ${heal} HP.`;
    }
    return { damageDealt, shieldDamage, healingDone, criticalHit, dodgeTriggered, logText };
  }

  // 4. GADGETS
  if (actionType === "gadget") {
    if (subChoice === "EMP") {
      applyStatus(target, "EMP Disabled", 2);
      logText = `${attacker.name} triggers EMP pulse. ${target.name}'s electronics are disabled for 2 turns.`;
    } else if (subChoice === "Drone") {
      damageDealt = 30;
      applyStatus(target, "Bleeding", 3);
      
      // Calculate shield split
      if (target.shield > 0) {
        shieldDamage = Math.min(target.shield, damageDealt);
        target.shield -= shieldDamage;
        const remaining = Math.max(0, damageDealt - shieldDamage);
        target.hp = Math.max(0, target.hp - remaining);
      } else {
        target.hp = Math.max(0, target.hp - damageDealt);
      }
      logText = `${attacker.name} deploys Anomaly Drone. Deals 30 damage and applies Bleeding status to ${target.name}.`;
    } else if (subChoice === "Scanner") {
      applyStatus(target, "Armor Broken", 3);
      logText = `${attacker.name} runs volumetric tactical scan on ${target.name}, breaking armor profiles for 3 turns.`;
    } else if (subChoice === "Decoy") {
      applyStatus(attacker, "DecoyActive", 1);
      logText = `${attacker.name} throws a holographic signature decoy, misdirecting target's next combat scan.`;
    }
    return { damageDealt, shieldDamage, healingDone, criticalHit, dodgeTriggered, logText };
  }

  // 5. ROLE SPECIAL ABILITIES
  if (actionType === "special") {
    if (attacker.class === "Medic") {
      const healAmount = Math.min(attacker.maxHp - attacker.hp, 45);
      attacker.hp += healAmount;
      healingDone = healAmount;
      removeStatus(attacker, "Bleeding");
      removeStatus(attacker, "Poison");
      logText = `${attacker.name} activates Helix Inoculation, restoring ${healAmount} HP and neutralizing toxic/bleed elements.`;
    } else if (attacker.class === "Engineer") {
      applyStatus(target, "TurretActive", 3);
      logText = `${attacker.name} deploys micro Kinetic Auto-Turret, locking targeting protocols onto ${target.name}.`;
    } else if (attacker.class === "Recon") {
      applyStatus(attacker, "Stimmed", 1, 2.0); // 100% critical damage boost next turn
      logText = `${attacker.name} initiates Critical Vulnerability Scan, identifying target weaknesses for next strike.`;
    } else {
      // Assault or default
      damageDealt = 40;
      applyStatus(target, "Suppressed", 2);
      if (target.shield > 0) {
        shieldDamage = Math.min(target.shield, damageDealt);
        target.shield -= shieldDamage;
        const rem = Math.max(0, damageDealt - shieldDamage);
        target.hp = Math.max(0, target.hp - rem);
      } else {
        target.hp = Math.max(0, target.hp - damageDealt);
      }
      logText = `${attacker.name} deploys Suppressive Storm. Inflicts 40 damage and Suppresses ${target.name} for 2 turns.`;
    }
    return { damageDealt, shieldDamage, healingDone, criticalHit, dodgeTriggered, logText };
  }

  // 6. ATTACK ACTIONS (Head, Torso, Legs)
  if (actionType === "attack") {
    if (hasStatus(target, "DecoyActive")) {
      removeStatus(target, "DecoyActive");
      return {
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        criticalHit: false,
        dodgeTriggered: true,
        logText: `${attacker.name}'s strike is misdirected by the holographic Decoy and misses completely!`
      };
    }

    let baseAcc = 0.9;
    let dmgMult = 1.0;
    let applyLegsSuppressed = false;

    if (subChoice === "Head") {
      baseAcc = 0.55;
      dmgMult = 1.8;
    } else if (subChoice === "Legs") {
      baseAcc = 0.8;
      dmgMult = 0.7;
      applyLegsSuppressed = Math.random() < 0.6;
    }

    let accuracy = baseAcc;
    if (hasStatus(attacker, "Suppressed")) accuracy -= 0.2;
    if (hasStatus(attacker, "Burning")) accuracy -= 0.15;

    accuracy = Math.min(0.99, Math.max(0.1, accuracy));

    const isHit = Math.random() < accuracy;
    if (!isHit) {
      return {
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        criticalHit: false,
        dodgeTriggered: false,
        logText: `${attacker.name} initiated strike targeting Hostile ${subChoice}, but missed the targeting vectors.`
      };
    }

    let dodgeChance = 0.04;
    if (hasStatus(target, "DodgeBuff")) dodgeChance += 0.4;
    if (hasStatus(target, "Suppressed")) dodgeChance = 0.01;
    
    const isDodge = Math.random() < dodgeChance;
    if (isDodge) {
      if (hasStatus(target, "CounterStance")) {
        removeStatus(target, "CounterStance");
        const counterDmg = 35;
        attacker.hp = Math.max(0, attacker.hp - counterDmg);
        return {
          damageDealt: 0,
          shieldDamage: 0,
          healingDone: 0,
          criticalHit: false,
          dodgeTriggered: true,
          logText: `${target.name} dodges the attack and deploys Counter strike, inflicting 35 damage back onto ${attacker.name}!`
        };
      }
      return {
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        criticalHit: false,
        dodgeTriggered: true,
        logText: `${target.name} successfully dodged incoming threat vectors from ${attacker.name}.`
      };
    }

    let rawDmg = Math.round(15 + attacker.weaponPower * 0.25 + attacker.level * 2);
    rawDmg = Math.round(rawDmg * dmgMult);

    if (hasStatus(attacker, "Stimmed")) {
      const mod = attacker.statusEffects.find(s => s.name === "Stimmed")?.value || 1.3;
      rawDmg = Math.round(rawDmg * mod);
      removeStatus(attacker, "Stimmed");
    }

    if (attacker.class === "Assault") rawDmg = Math.round(rawDmg * 1.1);

    const critBase = subChoice === "Head" ? 0.15 : 0.05;
    const isCrit = Math.random() < critBase;
    if (isCrit) {
      criticalHit = true;
      rawDmg = Math.round(rawDmg * 1.5);
    }

    if (hasStatus(target, "Armor Broken")) {
      rawDmg = Math.round(rawDmg * 1.3);
    }

    if (hasStatus(target, "Cover")) {
      rawDmg = Math.round(rawDmg * 0.5);
      removeStatus(target, "Cover");
    }
    if (hasStatus(target, "Brace")) {
      rawDmg = Math.round(rawDmg * 0.65);
    }

    let finalDmg = rawDmg;
    if (target.shield > 0) {
      shieldDamage = Math.min(target.shield, finalDmg);
      target.shield -= shieldDamage;
      finalDmg = Math.max(0, finalDmg - shieldDamage);
    }

    const armorMitigation = target.armorPower / (target.armorPower + 220);
    const hpDmg = Math.round(finalDmg * (1 - armorMitigation));
    target.hp = Math.max(0, target.hp - hpDmg);
    damageDealt = hpDmg;

    if (subChoice === "Head" && Math.random() < 0.4) {
      applyStatus(target, "Suppressed", 2);
    } else if (subChoice === "Legs" && applyLegsSuppressed) {
      applyStatus(target, "Suppressed", 2);
    }

    let targetLog = `initiated strike targeting Hostile ${subChoice}`;
    if (criticalHit) targetLog += " [CRITICAL]";
    logText = `${attacker.name} ${targetLog}, dealing ${damageDealt} HP damage and ${shieldDamage} shield damage.`;
    if (applyLegsSuppressed && subChoice === "Legs") logText += ` Target ${target.name}'s legs are disabled (Suppressed).`;
  }

  return { damageDealt, shieldDamage, healingDone, criticalHit, dodgeTriggered, logText };
}

/**
 * Enemy AI Decision logic.
 * Decides turn action based on current vital metrics and player posture.
 */
export function calculateEnemyAIDecision(
  enemy: CombatantState,
  player: CombatantState
): { action: "attack" | "defend" | "consumable" | "gadget" | "special" | "skip"; subChoice: string } {
  
  if (enemy.hp < enemy.maxHp * 0.35) {
    if (enemy.class === "Medic" && !hasStatus(enemy, "EMP Disabled")) {
      return { action: "special", subChoice: "Helix emergency heal" };
    }
    return { action: "consumable", subChoice: "Field Medkit" };
  }

  const empDisabled = hasStatus(enemy, "EMP Disabled");

  if (hasStatus(player, "CounterStance")) {
    if (!empDisabled) {
      if (enemy.class === "Engineer") return { action: "special", subChoice: "Deploy Auto-Turret" };
      if (enemy.class === "Recon") return { action: "special", subChoice: "Critical vulnerability scan" };
      return { action: "gadget", subChoice: "Scanner" };
    }
    return { action: "defend", subChoice: Math.random() < 0.5 ? "Brace" : "Shield" };
  }

  const r = Math.random();

  if (r < 0.30 && !empDisabled) {
    if (enemy.class === "Assault") return { action: "special", subChoice: "Suppressive Storm" };
    if (enemy.class === "Medic") return { action: "special", subChoice: "Helix emergency heal" };
    if (enemy.class === "Engineer") return { action: "special", subChoice: "Deploy Auto-Turret" };
    if (enemy.class === "Recon") return { action: "special", subChoice: "Critical scan" };
    return { action: "gadget", subChoice: "Drone" };
  }

  if (r < 0.45) {
    if (enemy.shield < enemy.maxShield * 0.3) {
      return { action: "defend", subChoice: "Shield" };
    }
    return { action: "defend", subChoice: "Brace" };
  }

  const attackRoll = Math.random();
  if (attackRoll < 0.25) {
    return { action: "attack", subChoice: "Head" };
  } else if (attackRoll < 0.55) {
    return { action: "attack", subChoice: "Legs" };
  }
  return { action: "attack", subChoice: "Torso" };
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
