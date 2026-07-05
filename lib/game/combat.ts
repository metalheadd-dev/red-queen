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

export interface TacticalAction {
  id: string;
  type: "attack" | "defend" | "consumable" | "gadget" | "special" | "skip";
  name: string;
  subChoice: string;
  apCost: number;
}

export interface TacticalPlan {
  actions: TacticalAction[];
  totalApSpent: number;
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
  name: "Bleeding" | "Burning" | "EMP Disabled" | "Poison" | "Armor Broken" | "Suppressed" | "Cover" | "Brace" | "DodgeBuff" | "CounterStance" | "Stimmed" | "DecoyActive" | "TurretActive" | "ProtectHead" | "ProtectTorso" | "ProtectLegs";
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
  ap: number;
  maxAp: number;
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

export function hasStatus(combatant: CombatantState, name: StatusEffect["name"]): boolean {
  return combatant.statusEffects.some(s => s.name === name && s.duration > 0);
}

export function removeStatus(combatant: CombatantState, name: StatusEffect["name"]) {
  combatant.statusEffects = combatant.statusEffects.filter(s => s.name !== name);
}

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
 * Tick status effects down, applying DoTs
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
 * Execute a single Tactical Action during simultaneous resolution
 */
export function resolveSingleAction(
  attacker: CombatantState,
  target: CombatantState,
  action: TacticalAction,
  playerStateForHpSync: CombatantState,
  oppStateForHpSync: CombatantState,
  round: number
): BattleLogEntry {
  let damageDealt = 0;
  let shieldDamage = 0;
  let healingDone = 0;
  let logText = "";

  const subChoice = action.subChoice;

  // check EMP Status
  if ((action.type === "special" || action.type === "gadget") && hasStatus(attacker, "EMP Disabled")) {
    logText = `${attacker.name} attempted to use ${action.name}, but active EMP disables prevent it.`;
    return {
      round,
      attacker: attacker.name === playerStateForHpSync.name ? "player" : "opponent",
      actionName: action.name,
      damageDealt: 0,
      shieldDamage: 0,
      healingDone: 0,
      logText,
      playerHp: playerStateForHpSync.hp,
      playerShield: playerStateForHpSync.shield,
      opponentHp: oppStateForHpSync.hp,
      opponentShield: oppStateForHpSync.shield
    };
  }

  // 1. Defenses Focus
  if (action.type === "defend") {
    if (subChoice === "Protect Head") {
      applyStatus(attacker, "ProtectHead", 1);
      logText = `${attacker.name} shields their head vectors, guarding against headshots.`;
    } else if (subChoice === "Protect Torso") {
      applyStatus(attacker, "ProtectTorso", 1);
      logText = `${attacker.name} focuses core armor defense matrices onto their Torso.`;
    } else if (subChoice === "Protect Legs") {
      applyStatus(attacker, "ProtectLegs", 1);
      logText = `${attacker.name} takes a low stance, protecting their legs against suppression.`;
    } else if (subChoice === "Cover") {
      applyStatus(attacker, "Cover", 1);
      logText = `${attacker.name} slides behind local cover barriers.`;
    } else if (subChoice === "Brace") {
      applyStatus(attacker, "Brace", 2);
      logText = `${attacker.name} braces for impact, strengthening structural plating.`;
    } else if (subChoice === "Shield") {
      const restore = Math.min(attacker.maxShield - attacker.shield, 40);
      attacker.shield += restore;
      healingDone = restore;
      logText = `${attacker.name} triggers Shield Stance, recharging shield systems by +40.`;
    } else if (subChoice === "Dodge") {
      applyStatus(attacker, "DodgeBuff", 1);
      logText = `${attacker.name} initiates defensive maneuvers, increasing evade vectors.`;
    } else if (subChoice === "Counter Position") {
      applyStatus(attacker, "CounterStance", 1);
      logText = `${attacker.name} enters reflex counter stance, ready to return fire.`;
    }
  }

  // 2. Consumables
  else if (action.type === "consumable") {
    if (subChoice.includes("Medkit") || subChoice.includes("Trauma")) {
      const heal = hasStatus(attacker, "Poison") ? 27 : 55;
      const healed = Math.min(attacker.maxHp - attacker.hp, heal);
      attacker.hp += healed;
      healingDone = healed;
      removeStatus(attacker, "Bleeding");
      logText = `${attacker.name} injects Field Medkit, healing +${healed} HP and stopping bleeding.`;
    } else if (subChoice.includes("Stim")) {
      applyStatus(attacker, "Stimmed", 2);
      logText = `${attacker.name} utilizes Stim Pack, raising attack power by +30% for 2 rounds.`;
    } else if (subChoice.includes("Cell") || subChoice.includes("Plasma")) {
      const shield = Math.min(attacker.maxShield - attacker.shield, 60);
      attacker.shield += shield;
      healingDone = shield;
      logText = `${attacker.name} uses Energy Cell, replenishing +${shield} Shield.`;
    } else {
      const healed = Math.min(attacker.maxHp - attacker.hp, 30);
      attacker.hp += healed;
      healingDone = healed;
      logText = `${attacker.name} uses survival rations, restoring +${healed} HP.`;
    }
  }

  // 3. Gadgets
  else if (action.type === "gadget") {
    if (subChoice === "EMP") {
      applyStatus(target, "EMP Disabled", 2);
      logText = `${attacker.name} fires EMP core, jamming target's systems for 2 rounds.`;
    } else if (subChoice === "Drone") {
      damageDealt = 30;
      applyStatus(target, "Bleeding", 3);
      if (target.shield > 0) {
        shieldDamage = Math.min(target.shield, damageDealt);
        target.shield -= shieldDamage;
        const rem = Math.max(0, damageDealt - shieldDamage);
        target.hp = Math.max(0, target.hp - rem);
      } else {
        target.hp = Math.max(0, target.hp - damageDealt);
      }
      logText = `${attacker.name} deploys Recon Drone, dealing 30 damage and applying Bleeding.`;
    } else if (subChoice === "Scanner") {
      applyStatus(target, "Armor Broken", 3);
      logText = `${attacker.name} scans target vulnerabilities, breaking armor arrays for 3 rounds.`;
    } else if (subChoice === "Decoy") {
      applyStatus(attacker, "DecoyActive", 1);
      logText = `${attacker.name} drops decoy signature drone to scramble incoming attacks.`;
    }
  }

  // 4. Special Abilities
  else if (action.type === "special") {
    if (attacker.class === "Medic") {
      const heal = Math.min(attacker.maxHp - attacker.hp, 45);
      attacker.hp += heal;
      healingDone = heal;
      removeStatus(attacker, "Bleeding");
      removeStatus(attacker, "Poison");
      logText = `${attacker.name} deploys Helix Heal, restoring +${heal} HP and purging toxins.`;
    } else if (attacker.class === "Engineer") {
      applyStatus(target, "TurretActive", 3);
      logText = `${attacker.name} deploys automated Kinetic Auto-Turret targeting opponent.`;
    } else if (attacker.class === "Recon") {
      applyStatus(attacker, "Stimmed", 1, 2.0);
      logText = `${attacker.name} executes Critical Vulnerability Scan to expose critical weakpoints.`;
    } else {
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
      logText = `${attacker.name} triggers Suppressive Storm, dealing 40 damage and Suppressing opponent.`;
    }
  }

  // 5. Attacks (Head, Torso, Legs)
  else if (action.type === "attack") {
    // Decoy redirect
    if (hasStatus(target, "DecoyActive")) {
      removeStatus(target, "DecoyActive");
      logText = `${attacker.name}'s attack targeting Hostile ${subChoice} is diverted by Decoy signature and misses!`;
      return {
        round,
        attacker: attacker.name === playerStateForHpSync.name ? "player" : "opponent",
        actionName: action.name,
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        logText,
        playerHp: playerStateForHpSync.hp,
        playerShield: playerStateForHpSync.shield,
        opponentHp: oppStateForHpSync.hp,
        opponentShield: oppStateForHpSync.shield
      };
    }

    let accuracy = subChoice === "Head" ? 0.55 : subChoice === "Legs" ? 0.8 : 0.9;
    if (hasStatus(attacker, "Suppressed")) accuracy -= 0.2;
    if (hasStatus(attacker, "Burning")) accuracy -= 0.15;
    accuracy = Math.min(0.99, Math.max(0.1, accuracy));

    const isHit = Math.random() < accuracy;
    if (!isHit) {
      logText = `${attacker.name} attacks Hostile ${subChoice}, but misses the vector targets.`;
      return {
        round,
        attacker: attacker.name === playerStateForHpSync.name ? "player" : "opponent",
        actionName: action.name,
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        logText,
        playerHp: playerStateForHpSync.hp,
        playerShield: playerStateForHpSync.shield,
        opponentHp: oppStateForHpSync.hp,
        opponentShield: oppStateForHpSync.shield
      };
    }

    // Dodge check
    let dodge = 0.04;
    if (hasStatus(target, "DodgeBuff")) dodge += 0.4;
    if (hasStatus(target, "Suppressed")) dodge = 0.01;
    const isDodge = Math.random() < dodge;
    if (isDodge) {
      if (hasStatus(target, "CounterStance")) {
        removeStatus(target, "CounterStance");
        attacker.hp = Math.max(0, attacker.hp - 35);
        logText = `${target.name} evades attack and fires Counter strike, dealing 35 damage back onto ${attacker.name}!`;
      } else {
        logText = `${target.name} evades attack targeting Hostile ${subChoice}.`;
      }
      return {
        round,
        attacker: attacker.name === playerStateForHpSync.name ? "player" : "opponent",
        actionName: action.name,
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        logText,
        playerHp: playerStateForHpSync.hp,
        playerShield: playerStateForHpSync.shield,
        opponentHp: oppStateForHpSync.hp,
        opponentShield: oppStateForHpSync.shield
      };
    }

    // Base damage calculation
    let dmg = Math.round(15 + attacker.weaponPower * 0.25 + attacker.level * 2);
    let dmgMult = subChoice === "Head" ? 1.8 : subChoice === "Legs" ? 0.7 : 1.0;

    // PREDICTION COUNTERS DETECTED:
    let predictionCountered = false;
    if (subChoice === "Head" && hasStatus(target, "ProtectHead")) {
      dmgMult = 0.35; // 65% reduction
      predictionCountered = true;
    } else if (subChoice === "Torso" && hasStatus(target, "ProtectTorso")) {
      dmgMult = 0.4; // 60% reduction
      predictionCountered = true;
    } else if (subChoice === "Legs" && hasStatus(target, "ProtectLegs")) {
      dmgMult = 0.3; // 70% reduction
      predictionCountered = true;
    }

    dmg = Math.round(dmg * dmgMult);

    if (hasStatus(attacker, "Stimmed")) {
      const val = attacker.statusEffects.find(s => s.name === "Stimmed")?.value || 1.3;
      dmg = Math.round(dmg * val);
      removeStatus(attacker, "Stimmed");
    }

    if (attacker.class === "Assault") dmg = Math.round(dmg * 1.1);

    const isCrit = Math.random() < (subChoice === "Head" ? 0.2 : 0.05);
    if (isCrit) dmg = Math.round(dmg * 1.5);

    if (hasStatus(target, "Armor Broken")) dmg = Math.round(dmg * 1.3);
    if (hasStatus(target, "Cover")) {
      dmg = Math.round(dmg * 0.5);
      removeStatus(target, "Cover");
    }
    if (hasStatus(target, "Brace")) dmg = Math.round(dmg * 0.65);

    let finalDmg = dmg;
    if (target.shield > 0) {
      shieldDamage = Math.min(target.shield, finalDmg);
      target.shield -= shieldDamage;
      finalDmg = Math.max(0, finalDmg - shieldDamage);
    }

    const mitigation = target.armorPower / (target.armorPower + 220);
    const hpDmg = Math.round(finalDmg * (1 - mitigation));
    target.hp = Math.max(0, target.hp - hpDmg);
    damageDealt = hpDmg;

    logText = `${attacker.name} attacks Hostile ${subChoice}${isCrit ? " [CRITICAL]" : ""}, dealing ${damageDealt} HP damage and ${shieldDamage} shield damage.`;
    if (predictionCountered) {
      logText += ` [PREDICTION SUCCESS] ${target.name} anticipated attack vector and deflected the brunt of it!`;
    }

    if (subChoice === "Legs" && Math.random() < 0.6) {
      applyStatus(target, "Suppressed", 2);
      logText += ` Target ${target.name} is Suppressed by the impact.`;
    }
  }

  return {
    round,
    attacker: attacker.name === playerStateForHpSync.name ? "player" : "opponent",
    actionName: action.name,
    damageDealt,
    shieldDamage,
    healingDone,
    logText,
    playerHp: playerStateForHpSync.hp,
    playerShield: playerStateForHpSync.shield,
    opponentHp: oppStateForHpSync.hp,
    opponentShield: oppStateForHpSync.shield
  };
}

/**
 * Resolve entire committed round's plans simultaneously
 */
export function resolveCombatPlans(
  player: CombatantState,
  opponent: CombatantState,
  playerPlan: TacticalPlan,
  opponentPlan: TacticalPlan,
  round: number
): BattleLogEntry[] {
  const roundLogs: BattleLogEntry[] = [];

  // A. Process ticks at start of round
  const pTicks = tickStatusEffects(player);
  pTicks.forEach(tText => {
    roundLogs.push({
      round, attacker: "opponent", actionName: "Status Tick",
      damageDealt: 0, shieldDamage: 0, healingDone: 0, logText: tText,
      playerHp: player.hp, playerShield: player.shield, opponentHp: opponent.hp, opponentShield: opponent.shield
    });
  });

  const oTicks = tickStatusEffects(opponent);
  oTicks.forEach(tText => {
    roundLogs.push({
      round, attacker: "player", actionName: "Status Tick",
      damageDealt: 0, shieldDamage: 0, healingDone: 0, logText: tText,
      playerHp: player.hp, playerShield: player.shield, opponentHp: opponent.hp, opponentShield: opponent.shield
    });
  });

  if (player.hp <= 0 || opponent.hp <= 0) return roundLogs;

  // B. Gather Queued Actions
  const pActions = [...playerPlan.actions];
  const oActions = [...opponentPlan.actions];

  // We split resolution into phases to support prediction/strategic priority
  // Priority order:
  // 1. Defenses
  // 2. Consumables & Gadgets
  // 3. Attacks & Specials

  const resolvePhase = (actionFilter: (act: TacticalAction) => boolean) => {
    const filteredP = pActions.filter(actionFilter);
    const filteredO = oActions.filter(actionFilter);
    const maxLen = Math.max(filteredP.length, filteredO.length);
    for (let i = 0; i < maxLen; i++) {
      if (player.hp <= 0 || opponent.hp <= 0) break;

      // Player Action first (player acts simultaneously/slightly before)
      if (i < filteredP.length) {
        const act = filteredP[i];
        const res = resolveSingleAction(player, opponent, act, player, opponent, round);
        roundLogs.push(res);
      }

      if (player.hp <= 0 || opponent.hp <= 0) break;

      // Opponent Action
      if (i < filteredO.length) {
        const act = filteredO[i];
        const res = resolveSingleAction(opponent, player, act, player, opponent, round);
        roundLogs.push(res);
      }
    }
  };

  // Phase 1: Defenses
  resolvePhase(act => act.type === "defend");

  // Phase 2: Consumables & Gadgets
  resolvePhase(act => act.type === "consumable" || act.type === "gadget");

  // Phase 3: Attacks & Specials
  resolvePhase(act => act.type === "attack" || act.type === "special" || act.type === "skip");

  // C. Round Cleanup: remove round-specific temporary protection statuses
  removeStatus(player, "ProtectHead");
  removeStatus(player, "ProtectTorso");
  removeStatus(player, "ProtectLegs");
  removeStatus(player, "Cover");
  removeStatus(player, "CounterStance");
  removeStatus(player, "DecoyActive");

  removeStatus(opponent, "ProtectHead");
  removeStatus(opponent, "ProtectTorso");
  removeStatus(opponent, "ProtectLegs");
  removeStatus(opponent, "Cover");
  removeStatus(opponent, "CounterStance");
  removeStatus(opponent, "DecoyActive");

  return roundLogs;
}

/**
 * Intelligent AI Decision Planner spending 100 AP
 */
export function calculateEnemyTacticalPlan(
  enemy: CombatantState,
  player: CombatantState
): TacticalPlan {
  const actions: TacticalAction[] = [];
  let ap = 100;

  // Helper to add action if AP is available
  const addAction = (type: TacticalAction["type"], name: string, subChoice: string, cost: number) => {
    if (ap >= cost) {
      actions.push({ id: `opp-act-${Date.now()}-${actions.length}`, type, name, subChoice, apCost: cost });
      ap -= cost;
    }
  };

  // 1. Low HP critical check: queue heal and protection first
  if (enemy.hp < enemy.maxHp * 0.35) {
    if (enemy.class === "Medic" && !hasStatus(enemy, "EMP Disabled")) {
      addAction("special", "Helix Inoculation", "Helix Emergency Heal", 35);
    } else {
      addAction("consumable", "Use Field Medkit", "Field Medkit", 20);
    }
    // Add defense support
    addAction("defend", "Focus Torso Defense", "Protect Torso", 20);
  }

  // 2. Ability/EMP check: if player counter posture is active, use scanner or brace
  if (hasStatus(player, "CounterStance")) {
    if (!hasStatus(enemy, "EMP Disabled")) {
      addAction("gadget", "Deploy Scanner", "Scanner", 15);
    }
    addAction("defend", "Brace Positioning", "Brace", 25);
  }

  // 3. Regular Strategy combos based on Class
  if (enemy.class === "Assault") {
    // Aggressive Assault combo: Suppressive Storm + Torso Strike
    if (!hasStatus(enemy, "EMP Disabled")) {
      addAction("special", "Suppressive Storm", "Suppressive Storm", 35);
    }
    addAction("attack", "Attack Torso", "Torso", 30);
    addAction("defend", "Focus Torso Defense", "Protect Torso", 20);
  } else if (enemy.class === "Recon") {
    // Critical Vulnerability scan + Headshot
    if (!hasStatus(enemy, "EMP Disabled")) {
      addAction("special", "Vulnerability Scan", "Critical scan", 35);
    }
    addAction("attack", "Attack Head", "Head", 40);
    addAction("defend", "Focus Head Defense", "Protect Head", 20);
  } else if (enemy.class === "Engineer") {
    // Deploy Turret + Shield
    if (!hasStatus(enemy, "EMP Disabled")) {
      addAction("special", "Deploy Auto-Turret", "Deploy Turret", 35);
    }
    addAction("defend", "Calibrate Shields", "Shield", 30);
    addAction("attack", "Attack Torso", "Torso", 30);
  } else {
    // Generic Tactical setup
    addAction("attack", "Attack Torso", "Torso", 30);
    addAction("defend", "Focus Torso Defense", "Protect Torso", 20);
    addAction("attack", "Attack Legs", "Legs", 30);
  }

  // 4. Fill remaining AP with basic attacks or defenses
  while (ap >= 20) {
    if (ap >= 30) {
      // 50% chance head / torso
      if (Math.random() < 0.3) {
        addAction("attack", "Attack Head", "Head", 40);
      } else {
        addAction("attack", "Attack Torso", "Torso", 30);
      }
    } else {
      addAction("defend", "Focus Torso Defense", "Protect Torso", 20);
    }
  }

  return { actions, totalApSpent: 100 - ap };
}

/**
 * Select Live Red Queen Commentary during Planning Phase
 */
export function getRedQueenTacticalAdvice(
  player: CombatantState,
  opponent: CombatantState
): { advice: string; prediction: string; insights: string[] } {
  let advice = "Build your tactical plan. Balance offense vectors with defense coverage.";
  let prediction = "Enemy scanning posture indicates balanced Torso engagement.";
  const insights = ["Ensure shields are calibrated.", "Deploy scanners to break heavy armor targets."];

  const pHpPct = player.hp / player.maxHp;
  const oHpPct = opponent.hp / opponent.maxHp;

  if (oHpPct < 0.3) {
    advice = "Hostile metrics indicate terminal state failure. Deploy aggressive Headshot plans to terminate.";
    prediction = "Opponent likely running panic defensive recovery subroutines.";
    insights.push("Target armor breached.");
  } else if (pHpPct < 0.3) {
    advice = "CRITICAL: Bio-vitals unstable. Queue healing consumables and double-guard Torso/Head vectors.";
    prediction = "Opponent calibrating offensive Head targeting loops.";
    insights.push("Vitals flatline threshold close.");
  } else if (opponent.class === "Recon") {
    advice = "Target Recon class has sniper capability. Anticipating high-accuracy headshots.";
    prediction = "Hostile likely lining up Head shot vectors.";
    insights.push("Reinforce Head defenses immediately.");
  } else if (opponent.class === "Assault") {
    advice = "Assault class uses suppressive bullet storms. Brace for high-damage torso focus.";
    prediction = "Hostile likely targeting Torso.";
    insights.push("Reinforce Torso defenses immediately.");
  }

  return { advice, prediction, insights };
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
