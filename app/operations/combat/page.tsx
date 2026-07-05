"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import AccessGuard from "@/components/AccessGuard";
import { loadProfile, saveProfile, saveEquippedGear } from "@/lib/game/service";
import { mainframeAudio } from "@/lib/game/audio";
import { InventoryItem, OperativeProfile } from "@/lib/game/types";
import { 
  generateAIOpponent, 
  getRedQueenCombatComment, 
  AIOpponent, 
  BattleLogEntry, 
  BattleResult,
  CombatantState,
  StatusEffect,
  TacticalAction,
  TacticalPlan,
  calculateEnemyTacticalPlan,
  resolveCombatPlans,
  getRedQueenTacticalAdvice,
  hasStatus
} from "@/lib/game/combat";

const RANKS = [
  { min: 0, max: 999, name: "RECRUIT I", stars: 1 },
  { min: 1000, max: 1199, name: "RECRUIT II", stars: 2 },
  { min: 1200, max: 1399, name: "VETERAN I", stars: 1 },
  { min: 1400, max: 1599, name: "VETERAN II", stars: 2 },
  { min: 1600, max: 1799, name: "ELITE I", stars: 1 },
  { min: 1800, max: 1999, name: "ELITE II", stars: 2 },
  { min: 2000, max: 2199, name: "MASTER I", stars: 1 },
  { min: 2200, max: 99999, name: "MASTER II", stars: 2 }
];

export default function CombatSimulationPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { authIdentifier } = useAuth();
  const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");

  // Page view state: "dashboard" | "prep" | "combat" | "debrief"
  const [view, setView] = useState<"dashboard" | "prep" | "combat" | "debrief">("dashboard");
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedGear, setEquippedGear] = useState<Record<string, InventoryItem | null>>({});
  const [loading, setLoading] = useState(true);

  // Combat system states
  const [activeOpponent, setActiveOpponent] = useState<AIOpponent | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [combatLogs, setCombatLogs] = useState<BattleLogEntry[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [combatSpeed, setCombatSpeed] = useState<1 | 2 | 4>(2);
  const [isCombatRunning, setIsCombatRunning] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  // Interactive Live Combat States
  const [playerHp, setPlayerHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(50);
  const [opponentHp, setOpponentHp] = useState(100);
  const [opponentShield, setOpponentShield] = useState(50);
  const [combatRound, setCombatRound] = useState(1);
  const [playerEffects, setPlayerEffects] = useState<StatusEffect[]>([]);
  const [opponentEffects, setOpponentEffects] = useState<StatusEffect[]>([]);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isSimulationConcluded, setIsSimulationConcluded] = useState(false);
  const [playerPlanActions, setPlayerPlanActions] = useState<TacticalAction[]>([]);
  const [playerAp, setPlayerAp] = useState(100);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Load and sanitize profile data
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?wallet=${identifier}`);
      const data = await res.json();
      if (data && data.profile) {
        const initialized = initializeCombatStats(data.profile);
        setProfile(initialized);
        setInventory((data.profile as any).inventory || []);
      } else {
        const cachedRaw = loadProfile(identifier);
        const initialized = initializeCombatStats(cachedRaw);
        setProfile(initialized);
        setInventory((cachedRaw as any).inventory || []);
      }
    } catch (e) {
      const cachedRaw = loadProfile(identifier);
      const initialized = initializeCombatStats(cachedRaw);
      setProfile(initialized);
      setInventory((cachedRaw as any).inventory || []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Synchronize equipped gear state
  useEffect(() => {
    if (!profile) return;
    const derived: Record<string, InventoryItem | null> = {
      Helmet: null, Armor: null, Weapon: null, Utility: null, Medkit: null, Backpack: null, Gadget: null
    };
    inventory.forEach(item => {
      if (item.equipped && item.slot && item.slot !== "None") {
        derived[item.slot] = item;
      }
    });
    setEquippedGear(derived);
    saveEquippedGear(identifier, derived);
  }, [inventory, !!profile, identifier]);

  // Sync profile update back to API
  const updateProfileOnServer = async (updated: OperativeProfile, updatedInventory: InventoryItem[]) => {
    saveProfile(identifier, updated);
    if (identifier === "offline-operative") return;
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: identifier,
          username: updated.name,
          level: updated.level,
          xp: updated.xp,
          health: updated.health,
          class: updated.class,
          role: updated.role,
          faction: updated.faction,
          credits: updated.credits,
          reputation: updated.reputation,
          resources: updated.resources,
          stats: updated.stats,
          world_state: updated.worldState,
          completed_missions: updated.completedMissions,
          sector_discoveries: updated.sectorDiscoveries,
          mission_history: updated.missionHistory,
          achievements: updated.achievements,
          campaign_stats: updated.campaignStats,
          operations_archive: updated.operationsArchive,
          inventory: updatedInventory,
          holder_status: updated.holderStatus,
          holder_tier: updated.holderTier,
          verified_balance: updated.verifiedBalance,
          access_type: updated.accessType
        })
      });
    } catch (e) {
      console.warn("Failed to sync profile changes online:", e);
    }
  };

  // Helper to extract combat rank info based on rating
  const getRankInfo = (rating: number) => {
    for (const r of RANKS) {
      if (rating >= r.min && rating <= r.max) return r;
    }
    return RANKS[0];
  };

  // Safe initialize combat statistics and historical logs inside Campaign Stats JSONB
  const initializeCombatStats = (p: OperativeProfile): OperativeProfile => {
    const stats = p.campaignStats || {
      operationsCompleted: 0,
      operationsFailed: 0,
      sectorsSecured: 0,
      researchDataCollected: 0,
      civiliansExtracted: 0,
      anomaliesDiscovered: 0,
      totalResourcesRecovered: {}
    };
    const todayStr = new Date().toISOString().split("T")[0];
    
    let cStats = (stats as any).combatStats;
    if (!cStats) {
      cStats = {
        arenaRating: 1000,
        combatRank: "RECRUIT II",
        dailyAttemptsUsed: 0,
        lastAttemptResetDate: todayStr,
        winRate: 0,
        winStreak: 0,
        bestWinStreak: 0,
        totalSimulations: 0,
        victories: 0,
        defeats: 0
      };
    } else if (cStats.lastAttemptResetDate !== todayStr) {
      cStats.dailyAttemptsUsed = 0;
      cStats.lastAttemptResetDate = todayStr;
    }
    
    let cHistory = (stats as any).combatHistory;
    if (!cHistory) {
      cHistory = [];
    }

    return {
      ...p,
      campaignStats: {
        ...stats,
        combatStats: cStats,
        combatHistory: cHistory
      } as any
    };
  };

  const getMaxAttempts = () => {
    const tier = profile?.holderTier || 0;
    if (tier === 1) return 4;
    if (tier === 2) return 5;
    if (tier === 3) return 6;
    return 3; // base attempts
  };

  // Opponent loader
  const loadNewOpponent = () => {
    if (!profile) return;
    const playerLevel = profile.level || 1;
    const stats = profile.stats || { threat_awareness: 3, operational_discipline: 3, psychological_stability: 3 };
    const playerBio = Math.round((stats.threat_awareness + stats.operational_discipline + stats.psychological_stability) / 3 * 10);
    const generated = generateAIOpponent(playerLevel, playerBio);
    setActiveOpponent(generated);
  };

  // Initialize first opponent once profile loads
  useEffect(() => {
    if (profile && !activeOpponent) {
      loadNewOpponent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Handle Equipment changes on the Prep Screen
  const handleEquipChange = (slot: string, itemToEquip: InventoryItem | null) => {
    if (!profile) return;
    try { mainframeAudio.playBeep(); } catch(e){}

    let nextInv = inventory.map(i => ({ ...i }));
    
    // Unequip current item in slot
    const currentEquippedIndex = nextInv.findIndex(i => i.equipped && i.slot === slot);
    if (currentEquippedIndex !== -1) {
      const current = nextInv[currentEquippedIndex];
      current.equipped = false;
      const baseId = current.id.replace(/-equipped$/, "");
      current.id = baseId;
      
      const existingUnequippedIndex = nextInv.findIndex(i => !i.equipped && i.id === baseId);
      if (existingUnequippedIndex !== -1 && existingUnequippedIndex !== currentEquippedIndex) {
        nextInv[existingUnequippedIndex].qty += current.qty;
        nextInv.splice(currentEquippedIndex, 1);
      }
    }

    // Equip new item
    if (itemToEquip) {
      const targetIndex = nextInv.findIndex(i => i.id === itemToEquip.id && !i.equipped);
      if (targetIndex !== -1) {
        const target = nextInv[targetIndex];
        if (target.qty > 1) {
          target.qty -= 1;
          const baseId = target.id.replace(/-equipped$/, "");
          nextInv.push({
            ...target,
            id: `${baseId}-equipped`,
            qty: 1,
            equipped: true
          });
        } else {
          target.equipped = true;
          const baseId = target.id.replace(/-equipped$/, "");
          target.id = `${baseId}-equipped`;
        }
      }
    }

    setInventory(nextInv);
    const updatedProfile = { ...profile, inventory: nextInv };
    setProfile(updatedProfile);
    updateProfileOnServer(updatedProfile, nextInv);
  };

  // Launch Turn-based Simulation Screen
  const triggerSimulation = () => {
    if (!profile || !activeOpponent) return;

    // Check attempts limit
    const cStats = (profile.campaignStats as any).combatStats;
    const maxAtt = getMaxAttempts();
    if (cStats.dailyAttemptsUsed >= maxAtt && identifier !== "offline-operative") {
      alert("DAILY ATTEMPTS COMPLETED. CALIBRATE MORE $THREAT TO INCREASE LIMIT.");
      return;
    }

    try { mainframeAudio.playSweep(); } catch(e){}

    const pLevel = profile.level || 1;
    const pBio = profile.stats ? (profile.stats.threat_awareness + profile.stats.operational_discipline + profile.stats.psychological_stability) / 3 * 10 : 50;
    const pMaxHpVal = Math.round(150 + pLevel * 15 + pBio * 0.8);
    
    let pWeaponPower = 50;
    let pArmorPower = 50;
    let pShieldMaxVal = 100;
    if (equippedGear.Weapon) pWeaponPower += equippedGear.Weapon.power || 0;
    if (equippedGear.Armor) pArmorPower += equippedGear.Armor.power || 0;
    if (equippedGear.Helmet) pArmorPower += (equippedGear.Helmet.power || 0) * 0.5;
    if (equippedGear.Backpack) pArmorPower += (equippedGear.Backpack.power || 0) * 0.2;
    if (equippedGear.Utility) pWeaponPower += (equippedGear.Utility.power || 0) * 0.3;
    if (equippedGear.Armor && equippedGear.Armor.stats && typeof equippedGear.Armor.stats.Shield === "string") {
      const sVal = parseInt(equippedGear.Armor.stats.Shield.replace(/\D/g, ""));
      if (!isNaN(sVal)) pShieldMaxVal += sVal;
    }

    const oLevel = activeOpponent.level;
    const oBioScore = activeOpponent.bioScore;
    const oEqPower = activeOpponent.equipmentPower;
    const oMaxHpVal = Math.round(140 + oLevel * 14 + oBioScore * 0.75);
    const oShieldMaxVal = Math.round(80 + oEqPower * 0.05);

    setPlayerHp(pMaxHpVal);
    setPlayerShield(pShieldMaxVal);
    setOpponentHp(oMaxHpVal);
    setOpponentShield(oShieldMaxVal);
    setCombatRound(1);
    setPlayerEffects([]);
    setOpponentEffects([]);
    setActiveSubmenu(null);
    setIsSimulationConcluded(false);
    setPlayerPlanActions([]);
    setPlayerAp(100);
    setBattleResult(null);

    setCombatLogs([
      {
        round: 1,
        attacker: "player",
        actionName: "INIT",
        damageDealt: 0,
        shieldDamage: 0,
        healingDone: 0,
        logText: "Tactical Evaluation Matrix activated. Red Queen Online. Enter Planning Phase.",
        playerHp: pMaxHpVal,
        playerShield: pShieldMaxVal,
        opponentHp: oMaxHpVal,
        opponentShield: oShieldMaxVal
      }
    ]);

    setView("combat");
    setIsCombatRunning(true);
  };

  const handleBattleConclusion = (outcome: "VICTORY" | "DEFEAT", finalRound: number) => {
    setIsCombatRunning(false);
    setIsSimulationConcluded(true);

    const baseRatingShift = outcome === "VICTORY" ? 25 : -15;
    const playerBio = Math.round((profile!.stats.threat_awareness + profile!.stats.operational_discipline + profile!.stats.psychological_stability) / 3 * 10);
    const bioScoreDiff = (activeOpponent!.bioScore - playerBio) / 20;
    const ratingChange = Math.round(baseRatingShift + Math.min(15, Math.max(-10, bioScoreDiff)));

    const xpEarned = outcome === "VICTORY" ? Math.round(200 + activeOpponent!.level * 15) : Math.round(80 + activeOpponent!.level * 5);
    const creditsEarned = outcome === "VICTORY" ? Math.round(150 + activeOpponent!.level * 10) : Math.round(50 + activeOpponent!.level * 3);

    const recoveredResources: Record<string, number> = {};
    const dropRoll = Math.random();
    if (outcome === "VICTORY") {
      if (dropRoll < 0.25) recoveredResources["Medical Supplies"] = Math.floor(Math.random() * 2) + 1;
      else if (dropRoll < 0.50) recoveredResources["Components"] = Math.floor(Math.random() * 2) + 1;
      else if (dropRoll < 0.70) recoveredResources["Electronics"] = 1;
      else if (dropRoll < 0.82) recoveredResources["Deuterium Cell"] = 1;
    } else {
      if (dropRoll < 0.1) recoveredResources["Medical Supplies"] = 1;
    }

    const bioScoreChange = outcome === "VICTORY" ? 2 : -1;

    const summaryResult: BattleResult = {
      outcome,
      ratingChange,
      xpEarned,
      creditsEarned,
      recoveredResources,
      bioScoreChange,
      durationSeconds: finalRound * 8,
      logs: [],
      totalRounds: finalRound
    };

    setBattleResult(summaryResult);
    finalizeCombatResultsInteractive(summaryResult);
  };

  const finalizeCombatResultsInteractive = (result: BattleResult) => {
    if (!profile || !activeOpponent) return;

    const cStats = { ...(profile.campaignStats as any).combatStats };
    const cHistory = [...((profile.campaignStats as any).combatHistory || [])];

    cStats.dailyAttemptsUsed = (cStats.dailyAttemptsUsed || 0) + 1;
    cStats.totalSimulations = (cStats.totalSimulations || 0) + 1;

    if (result.outcome === "VICTORY") {
      cStats.victories = (cStats.victories || 0) + 1;
      cStats.winStreak = (cStats.winStreak || 0) + 1;
      if (cStats.winStreak > (cStats.bestWinStreak || 0)) {
        cStats.bestWinStreak = cStats.winStreak;
      }
    } else {
      cStats.defeats = (cStats.defeats || 0) + 1;
      cStats.winStreak = 0;
    }

    cStats.winRate = Math.round((cStats.victories / cStats.totalSimulations) * 100);
    cStats.arenaRating = Math.max(100, (cStats.arenaRating || 1000) + result.ratingChange);
    cStats.combatRank = getRankInfo(cStats.arenaRating).name;

    const historyEntry = {
      id: `sim-${Date.now()}`,
      opponent: activeOpponent.name,
      faction: activeOpponent.faction,
      class: activeOpponent.class,
      role: activeOpponent.role,
      result: result.outcome,
      ratingChange: result.ratingChange,
      xpEarned: result.xpEarned,
      creditsEarned: result.creditsEarned,
      bioScoreChange: result.bioScoreChange,
      durationSeconds: result.durationSeconds,
      date: new Date().toISOString()
    };

    cHistory.unshift(historyEntry);

    let newXp = (profile.xp || 0) + result.xpEarned;
    let newLevel = profile.level || 1;
    const reqXp = newLevel * 1000;
    if (newXp >= reqXp) {
      newXp -= reqXp;
      newLevel += 1;
    }

    const newCredits = (profile.credits || 0) + result.creditsEarned;
    
    const newResources = { ...(profile.resources || {}) };
    Object.keys(result.recoveredResources).forEach(res => {
      newResources[res] = (newResources[res] || 0) + result.recoveredResources[res];
    });

    const updatedProfile: OperativeProfile = {
      ...profile,
      level: newLevel,
      xp: newXp,
      credits: newCredits,
      resources: newResources,
      campaignStats: {
        ...profile.campaignStats,
        combatStats: cStats,
        combatHistory: cHistory
      } as any
    };

    setProfile(updatedProfile);
    updateProfileOnServer(updatedProfile, inventory);
  };

  // Add action to the planned queue
  const addTacticalAction = (type: string, name: string, subChoice: string, cost: number) => {
    if (playerAp < cost) {
      alert(`INSUFFICIENT ACTION POINTS. REQUIRED: ${cost} AP, CURRENT: ${playerAp} AP.`);
      return;
    }

    // ATTACK: only one attack action allowed per round
    if (type === "attack") {
      const alreadyHasAttack = playerPlanActions.some(a => a.type === "attack");
      if (alreadyHasAttack) {
        alert("TACTICAL LIMIT: You can only queue one attack action per round.");
        return;
      }
    }

    // DEFEND: only one defend per specific zone (subChoice is the zone key)
    if (type === "defend") {
      const alreadyDefendingZone = playerPlanActions.some(a => a.type === "defend" && a.subChoice === subChoice);
      if (alreadyDefendingZone) {
        alert(`TACTICAL LIMIT: You are already defending ${subChoice} this round.`);
        return;
      }
    }

    // Guard consumable inventory limits in plan
    if (type === "consumable") {
      const alreadyQueuedCount = playerPlanActions.filter(a => a.subChoice === subChoice).length;
      const invItem = inventory.find(i => i.name === subChoice || i.id === subChoice);
      const available = invItem ? invItem.qty : 0;
      if (alreadyQueuedCount >= available) {
        alert(`INSUFFICIENT STOCK IN INVENTORY TO QUEUE ANOTHER ${subChoice.toUpperCase()}.`);
        return;
      }
    }

    try { mainframeAudio.playBeep(); } catch(e){}

    const newAct: TacticalAction = {
      id: `act-${Date.now()}-${playerPlanActions.length}`,
      type: type as any,
      name,
      subChoice,
      apCost: cost
    };

    setPlayerPlanActions(prev => [...prev, newAct]);
    setPlayerAp(prev => prev - cost);
    setActiveSubmenu(null);
  };

  // Remove action from the planned queue
  const removeTacticalAction = (id: string, cost: number) => {
    try { mainframeAudio.playBeep(); } catch(e){}
    setPlayerPlanActions(prev => prev.filter(a => a.id !== id));
    setPlayerAp(prev => Math.min(100, prev + cost));
  };

  // Resolve player tactical plan vs enemy AI plan
  const commitTacticalPlan = () => {
    if (!profile || !activeOpponent || isSimulationConcluded) return;

    try { mainframeAudio.playSweep(); } catch(e){}

    const pLevel = profile.level || 1;
    const pBio = profile.stats ? (profile.stats.threat_awareness + profile.stats.operational_discipline + profile.stats.psychological_stability) / 3 * 10 : 50;
    const pMaxHpVal = Math.round(150 + pLevel * 15 + pBio * 0.8);
    
    let pWeaponPower = 50;
    let pArmorPower = 50;
    let pShieldMaxVal = 100;
    if (equippedGear.Weapon) pWeaponPower += equippedGear.Weapon.power || 0;
    if (equippedGear.Armor) pArmorPower += equippedGear.Armor.power || 0;
    if (equippedGear.Helmet) pArmorPower += (equippedGear.Helmet.power || 0) * 0.5;
    if (equippedGear.Backpack) pArmorPower += (equippedGear.Backpack.power || 0) * 0.2;
    if (equippedGear.Utility) pWeaponPower += (equippedGear.Utility.power || 0) * 0.3;
    if (equippedGear.Armor && equippedGear.Armor.stats && typeof equippedGear.Armor.stats.Shield === "string") {
      const sVal = parseInt(equippedGear.Armor.stats.Shield.replace(/\D/g, ""));
      if (!isNaN(sVal)) pShieldMaxVal += sVal;
    }

    const oLevel = activeOpponent.level;
    const oBioScore = activeOpponent.bioScore;
    const oEqPower = activeOpponent.equipmentPower;
    const oMaxHpVal = Math.round(140 + oLevel * 14 + oBioScore * 0.75);
    const oShieldMaxVal = Math.round(80 + oEqPower * 0.05);

    const playerState: CombatantState = {
      name: profile.name || "Operative",
      level: pLevel,
      class: profile.class || "Assault",
      role: profile.role || "Vanguard",
      hp: playerHp,
      maxHp: pMaxHpVal,
      shield: playerShield,
      maxShield: pShieldMaxVal,
      weaponPower: pWeaponPower,
      armorPower: pArmorPower,
      statusEffects: [...playerEffects],
      ap: playerAp,
      maxAp: 100
    };

    const opponentState: CombatantState = {
      name: activeOpponent.name,
      level: oLevel,
      class: activeOpponent.class,
      role: activeOpponent.role,
      hp: opponentHp,
      maxHp: oMaxHpVal,
      shield: opponentShield,
      maxShield: oShieldMaxVal,
      weaponPower: Math.round(45 + oEqPower * 0.04),
      armorPower: Math.round(45 + oEqPower * 0.04),
      statusEffects: [...opponentEffects],
      ap: 100,
      maxAp: 100
    };

    // 1. Deduct consumables from inventory profile immediately upon resolution commit
    let nextInv = [...inventory];
    playerPlanActions.forEach(act => {
      if (act.type === "consumable") {
        nextInv = nextInv.map(item => {
          if (item.name === act.subChoice || item.id === act.subChoice) {
            return { ...item, qty: item.qty - 1 };
          }
          return item;
        }).filter(item => item.qty > 0);
      }
    });

    if (nextInv.length !== inventory.length || nextInv.some((item, idx) => item.qty !== inventory[idx]?.qty)) {
      setInventory(nextInv);
      const updatedProfile = { ...profile, inventory: nextInv };
      setProfile(updatedProfile);
      updateProfileOnServer(updatedProfile, nextInv);
    }

    // 2. Generate opponent AI Tactical Plan
    const opponentPlan = calculateEnemyTacticalPlan(opponentState, playerState);

    // 3. Resolve round plans
    const roundResolutionLogs = resolveCombatPlans(
      playerState,
      opponentState,
      { actions: playerPlanActions, totalApSpent: 100 - playerAp },
      opponentPlan,
      combatRound
    );

    // Add round summary separator
    const headerLog: BattleLogEntry = {
      round: combatRound,
      attacker: "player",
      actionName: "SYSTEM SUMMARY",
      damageDealt: 0,
      shieldDamage: 0,
      healingDone: 0,
      logText: `--- RESOLVING ROUND ${combatRound} TACTICAL PLANS ---`,
      playerHp: playerHp,
      playerShield: playerShield,
      opponentHp: opponentHp,
      opponentShield: opponentShield
    };

    const finalLogs = [headerLog, ...roundResolutionLogs];

    // Check battle conclusion conditions
    if (playerState.hp <= 0 && opponentState.hp <= 0) {
      // Double knockout - defeat or victory? Favor defeat for survival stakes.
      setPlayerHp(0);
      setOpponentHp(0);
      setCombatLogs(prev => [...prev, ...finalLogs]);
      handleBattleConclusion("DEFEAT", combatRound);
      return;
    }

    if (playerState.hp <= 0) {
      setPlayerHp(0);
      setCombatLogs(prev => [...prev, ...finalLogs]);
      handleBattleConclusion("DEFEAT", combatRound);
      return;
    }

    if (opponentState.hp <= 0) {
      setOpponentHp(0);
      setCombatLogs(prev => [...prev, ...finalLogs]);
      handleBattleConclusion("VICTORY", combatRound);
      return;
    }

    // Update states for next planning turn
    setPlayerHp(playerState.hp);
    setPlayerShield(playerState.shield);
    setOpponentHp(opponentState.hp);
    setOpponentShield(opponentState.shield);
    setPlayerEffects(playerState.statusEffects);
    setOpponentEffects(opponentState.statusEffects);
    setCombatRound(prev => prev + 1);
    setPlayerPlanActions([]);
    setPlayerAp(100);

    setCombatLogs(prev => [...prev, ...finalLogs]);
  };

  // Scroll active combat logs automatically
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [combatLogs]);

  const getPentagonPoints = (center: number, radius: number) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${Math.round(x)},${Math.round(y)}`);
    }
    return points.join(" ");
  };

  const getValuationPoints = (center: number, radius: number, values: number[]) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const scale = values[i] / 100;
      const angle = (i * 72 - 90) * Math.PI / 180;
      const x = center + (radius * scale) * Math.cos(angle);
      const y = center + (radius * scale) * Math.sin(angle);
      points.push(`${Math.round(x)},${Math.round(y)}`);
    }
    return points.join(" ");
  };

  if (loading || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", color: "var(--accent)" }}>
        [ LOADING OPERATIONAL EVALUATION MATRIX... ]
      </div>
    );
  }

  // Combat configurations
  const combatStats = (profile.campaignStats as any).combatStats || {};
  const combatHistory = (profile.campaignStats as any).combatHistory || [];
  const maxAttempts = getMaxAttempts();
  const attemptsRemaining = Math.max(0, maxAttempts - (combatStats.dailyAttemptsUsed || 0));

  const pMaxHp = Math.round(150 + (profile.level || 1) * 15);
  const pShieldMax = 100 + (equippedGear.Armor ? 100 : 0);

  // Active Live state calculation
  const activePlayerHp = playerHp;
  const activePlayerShield = playerShield;
  const activeOppHp = opponentHp;
  const activeOppShield = opponentShield;

  // Win probability calculation
  const getLiveProbability = () => {
    if (!activeOpponent) return 50;
    const pPower = (profile.level * 100) + (profile.reputation || 0) + (equippedGear.Weapon ? 100 : 0);
    const oPower = (activeOpponent.level * 100) + activeOpponent.bioScore;
    const ratio = pPower / (pPower + oPower);
    const pPct = activePlayerHp / pMaxHp;
    const oPct = activeOppHp / Math.round(140 + activeOpponent.level * 14 + activeOpponent.bioScore * 0.75);
    return Math.round(Math.min(99, Math.max(1, (ratio * 0.6 + (pPct - oPct + 1) * 0.2) * 100)));
  };

  const winProb = getLiveProbability();
  const rqLive = getRedQueenCombatComment(
    combatRound,
    winProb,
    activePlayerHp,
    pMaxHp,
    activeOppHp,
    activeOpponent ? Math.round(140 + activeOpponent.level * 14 + activeOpponent.bioScore * 0.75) : 100
  );

  const rqTactical = getRedQueenTacticalAdvice(
    {
      name: profile?.name || "Operative",
      level: profile?.level || 1,
      class: profile?.class || "Assault",
      role: profile?.role || "Vanguard",
      hp: activePlayerHp,
      maxHp: pMaxHp,
      shield: activePlayerShield,
      maxShield: pShieldMax,
      weaponPower: 50,
      armorPower: 50,
      statusEffects: playerEffects,
      ap: playerAp,
      maxAp: 100
    },
    activeOpponent ? {
      name: activeOpponent.name,
      level: activeOpponent.level,
      class: activeOpponent.class,
      role: activeOpponent.role,
      hp: activeOppHp,
      maxHp: Math.round(140 + activeOpponent.level * 14 + activeOpponent.bioScore * 0.75),
      shield: activeOppShield,
      maxShield: Math.round(80 + activeOpponent.equipmentPower * 0.05),
      weaponPower: 50,
      armorPower: 50,
      statusEffects: opponentEffects,
      ap: 100,
      maxAp: 100
    } : {
      name: "Opponent",
      level: 1,
      class: "Assault",
      role: "Vanguard",
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      weaponPower: 50,
      armorPower: 50,
      statusEffects: [],
      ap: 100,
      maxAp: 100
    }
  );

  return (
    <AccessGuard>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#060606", color: "var(--text-main)" }}>
        {/* CRT Scanline filter */}
        <div className="crt-scanlines" />

        {/* Global HUD Header */}
        <header style={{
          height: "64px", borderBottom: "1px solid var(--border)", background: "#0b0b0b",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", background: "var(--accent)", borderRadius: "50%" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.2em", fontWeight: "bold" }}>
              RED QUEEN TERMINAL // COMBAT PANEL
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", fontFamily: "var(--mono)", fontSize: "12px" }}>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
              <span style={{ color: "var(--text-dim)" }}>THREAT: </span>
              <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{profile.reputation.toLocaleString()}</span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
              <span style={{ color: "var(--text-dim)" }}>CREDITS: </span>
              <span style={{ color: "#ffd700", fontWeight: "bold" }}>{profile.credits.toLocaleString()}</span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--accent)" }}>{profile.name}</span>
              <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "2px", fontSize: "10px" }}>
                LVL {profile.level}
              </span>
            </div>
          </div>
        </header>

        {/* Workstation layout frame */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar Menu exactly matching app/operations/page.tsx */}
          <aside style={{
            width: "200px", borderRight: "1px solid var(--border)", background: "#060606",
            padding: "24px 16px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "6px", fontWeight: "bold" }}>
              ▶ OPERATIONAL DECKS
            </div>
            
            <Link href="/operations" passHref legacyBehavior>
              <a style={{
                width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
                background: "none", color: "var(--text-dim)", borderColor: "var(--border)",
                fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
                transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em", display: "block"
              }}>
                🛰️ COMMAND HUB
              </a>
            </Link>

            <button
              style={{
                width: "100%", padding: "12px 14px", border: "1px solid var(--accent)",
                background: "rgba(255, 77, 77, 0.06)", color: "var(--accent)",
                fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
                borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
              }}
            >
              ⚔️ COMBAT SIM
            </button>

            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
              <Link href="/" passHref legacyBehavior>
                <a style={{
                  display: "block", width: "100%", padding: "10px", textAlign: "center", border: "1px solid var(--border)",
                  fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", borderRadius: "2px", textDecoration: "none"
                }}>
                  EXIT MAINFRAME
                </a>
              </Link>
            </div>
          </aside>

          {/* Decks Main Panel */}
          <main style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* VIEW 1: COMBAT DASHBOARD DECK */}
            {view === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Deck Title & Subtitle */}
                <div>
                  <h2 style={{ fontFamily: "var(--title-font)", fontSize: "24px", margin: "0 0 4px 0", color: "#fff", letterSpacing: "0.05em" }}>
                    COMBAT SIMULATION
                  </h2>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", margin: 0, letterSpacing: "0.15em" }}>
                    RED QUEEN TACTICAL EVALUATION PROTOCOL // V1.0.3
                  </p>
                </div>

                {/* Arena Metrics Ribbon */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>ARENA RATING</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--accent)" }}>{combatStats.arenaRating}</div>
                  </div>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>COMBAT RANK</div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>{combatStats.combatRank}</div>
                  </div>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>W / L RECORD</div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}>
                      {combatStats.victories} / {combatStats.defeats} <span style={{ fontSize: "11px", color: "var(--accent)" }}>({combatStats.winRate}%)</span>
                    </div>
                  </div>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>DAILY ATTEMPTS</div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}>
                      {attemptsRemaining} / {maxAttempts}
                    </div>
                  </div>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>WIN STREAK</div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}>
                      {combatStats.winStreak} <span style={{ fontSize: "10px", color: "var(--text-dim)" }}> (Max: {combatStats.bestWinStreak})</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard layout (Scrollable modes list + active preview card) */}
                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
                  
                  {/* Left Column: Combat Modes Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#fff", margin: 0, letterSpacing: "0.1em" }}>
                      SELECT EVALUATION VECTOR
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      {/* Mode 1: AI Combat */}
                      <div style={{ 
                        background: "#0c0c0c", border: "1px solid var(--accent)", borderRadius: "2px", padding: "16px",
                        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px",
                        boxShadow: "0 0 10px rgba(0,255,204,0.05)"
                      }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--accent)" }}>AI SIMULATION</span>
                            <span style={{ background: "rgba(0,255,204,0.1)", color: "var(--accent)", fontSize: "9px", padding: "2px 6px", borderRadius: "2px", fontWeight: "bold" }}>ACTIVE</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5", margin: 0 }}>
                            Fight against Red Queen synthesized hostiles. Test your equipment combinations and increase your arena ranking.
                          </p>
                        </div>
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span>DIFFICULTY: DYNAMIC</span>
                            <span>TIME: 2-3 MIN</span>
                          </div>
                          <button
                            onClick={() => {
                              try { mainframeAudio.playBeep(); } catch(e){}
                              setView("prep");
                            }}
                            className="btn btn-primary"
                            style={{ width: "100%", fontSize: "11px", padding: "8px", fontWeight: "bold" }}
                          >
                            SELECT VECTOR
                          </button>
                        </div>
                      </div>

                      {/* Mode 2: Ranked PvP */}
                      <div style={{ 
                        background: "#080808", border: "1px solid var(--border)", borderRadius: "2px", padding: "16px",
                        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", opacity: 0.6
                      }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-dim)" }}>RANKED PVP</span>
                            <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-dim)", fontSize: "9px", padding: "2px 6px", borderRadius: "2px" }}>LOCKED</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5", margin: 0 }}>
                            Compete against other active SOLvivors in ranked matches to climb the global leaderboard hierarchy.
                          </p>
                        </div>
                        <button disabled className="btn btn-ghost" style={{ width: "100%", fontSize: "11px", border: "1px solid var(--border)", padding: "8px" }}>
                          COMING SOON
                        </button>
                      </div>

                      {/* Mode 3: Faction Wars */}
                      <div style={{ 
                        background: "#080808", border: "1px solid var(--border)", borderRadius: "2px", padding: "16px",
                        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", opacity: 0.6
                      }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-dim)" }}>FACTION WARS</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5", margin: 0 }}>
                            Represent your faction. Secure sectors and claim faction multipliers on $THREAT tokens.
                          </p>
                        </div>
                        <button disabled className="btn btn-ghost" style={{ width: "100%", fontSize: "11px", border: "1px solid var(--border)", padding: "8px" }}>
                          COMING SOON
                        </button>
                      </div>

                      {/* Mode 4: Tournament */}
                      <div style={{ 
                        background: "#080808", border: "1px solid var(--border)", borderRadius: "2px", padding: "16px",
                        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", opacity: 0.6
                      }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-dim)" }}>TOURNAMENTS</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5", margin: 0 }}>
                            Join organized regional leagues and seasonal tournaments with high token and rare loot payouts.
                          </p>
                        </div>
                        <button disabled className="btn btn-ghost" style={{ width: "100%", fontSize: "11px", border: "1px solid var(--border)", padding: "8px" }}>
                          COMING SOON
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Red Queen Advice & Pentagon Chart */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "12px" }}>
                        <div style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)" }}>RED QUEEN ANALYSIS</div>
                        <h4 style={{ margin: "4px 0 0 0", color: "#fff", fontSize: "14px" }}>Simulation Calibration</h4>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                        "Combat simulations are the fastest way to evaluate and improve your combat readiness. Choose your opponent wisely. Preparation is key to survival."
                      </p>
                      
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span>HOLDER BONUS:</span>
                          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>
                            {(profile?.holderTier || 0) > 0 ? `+${profile?.holderTier} Daily Attempts` : "None"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", display: "flex", justifyContent: "space-between" }}>
                          <span>DAILY RESET IN:</span>
                          <span style={{ color: "#fff" }}>07:44:20</span>
                        </div>
                      </div>
                    </div>

                    {/* Pentagon Performance Radar Chart */}
                    <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "100%", borderLeft: "2px solid var(--accent)", paddingLeft: "12px" }}>
                        <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>COMBAT PERFORMANCE</span>
                      </div>
                      
                      {/* Dynamic SVG Pentagon Radar Graph */}
                      <svg width="150" height="150" viewBox="0 0 100 100" style={{ overflow: "visible" }}>
                        {/* pentagon grid lines */}
                        <polygon points={getPentagonPoints(50, 45)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <polygon points={getPentagonPoints(50, 30)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <polygon points={getPentagonPoints(50, 15)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        
                        {/* axis spokes */}
                        {getPentagonPoints(50, 45).split(" ").map((p, idx) => {
                          const [x, y] = p.split(",");
                          return <line key={idx} x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />;
                        })}

                        {/* Value Polygon */}
                        <polygon 
                          points={getValuationPoints(50, 45, [
                            72, // Attack
                            68, // Defense
                            74, // Tactics
                            66, // Survival
                            70  // Accuracy
                          ])} 
                          fill="rgba(0, 255, 204, 0.15)" 
                          stroke="var(--accent)" 
                          strokeWidth="1" 
                        />

                        {/* Labels */}
                        <text x="50" y="3" textAnchor="middle" fontSize="4.5" fill="var(--text-dim)" fontFamily="var(--mono)">ATK (72)</text>
                        <text x="96" y="38" textAnchor="start" fontSize="4.5" fill="var(--text-dim)" fontFamily="var(--mono)">DEF (68)</text>
                        <text x="80" y="93" textAnchor="start" fontSize="4.5" fill="var(--text-dim)" fontFamily="var(--mono)">TAC (74)</text>
                        <text x="20" y="93" textAnchor="end" fontSize="4.5" fill="var(--text-dim)" fontFamily="var(--mono)">SURV (66)</text>
                        <text x="4" y="38" textAnchor="end" fontSize="4.5" fill="var(--text-dim)" fontFamily="var(--mono)">ACC (70)</text>
                      </svg>
                    </div>

                  </div>
                </div>

                {/* Bottom Row: Combat History */}
                <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold", fontFamily: "var(--mono)", color: "#fff", letterSpacing: "0.1em" }}>
                      OPERATIONAL HISTORY
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      Total battles: {combatStats.totalSimulations}
                    </span>
                  </div>

                  {combatHistory.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                      NO RECORDED ENGAGEMENTS. DEPLOY TO GENERATE SIMULATION DATA.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {combatHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((h: any, idx: number) => (
                        <div key={idx} style={{ 
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "#070707", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "2px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", border: "1px solid var(--border)" }}>
                              👤
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>{h.opponent}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{h.faction.toUpperCase()} // {h.class.toUpperCase()}</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "32px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                            <div>
                              <span style={{ color: h.result === "VICTORY" ? "var(--accent)" : "#ff4d4d", fontWeight: "bold" }}>
                                {h.result}
                              </span>
                            </div>
                            <div style={{ width: "80px", textAlign: "right" }}>
                              <span style={{ color: h.ratingChange > 0 ? "var(--accent)" : "#ff4d4d" }}>
                                {h.ratingChange > 0 ? `+${h.ratingChange}` : h.ratingChange} Rating
                              </span>
                            </div>
                            <div style={{ width: "130px", textAlign: "right" }}>
                              <span style={{ color: "var(--text-dim)" }}>+{h.xpEarned} XP // +{h.creditsEarned} Cr</span>
                            </div>
                            <div style={{ color: "var(--text-dim)", fontSize: "11px" }}>
                              {new Date(h.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {combatHistory.length > historyPerPage && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
                          <button
                            disabled={historyPage === 1}
                            onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setHistoryPage(p => Math.max(1, p - 1)); }}
                            className="btn btn-ghost"
                            style={{ padding: "4px 12px", fontSize: "11px", border: "1px solid var(--border)" }}
                          >
                            PREV
                          </button>
                          <span style={{ alignSelf: "center", fontSize: "12px", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>
                            PAGE {historyPage} / {Math.ceil(combatHistory.length / historyPerPage)}
                          </span>
                          <button
                            disabled={historyPage >= Math.ceil(combatHistory.length / historyPerPage)}
                            onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setHistoryPage(p => p + 1); }}
                            className="btn btn-ghost"
                            style={{ padding: "4px 12px", fontSize: "11px", border: "1px solid var(--border)" }}
                          >
                            NEXT
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* VIEW 2: PREPARATION & TACTICAL BRIEFING DECK */}
            {view === "prep" && activeOpponent && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Back button */}
                <div>
                  <button 
                    onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setView("dashboard"); }}
                    className="btn btn-ghost"
                    style={{ fontSize: "11px", padding: "6px 12px", border: "1px solid var(--border)" }}
                  >
                    ◀ RETURN TO WORKSTATION
                  </button>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--title-font)", fontSize: "20px", margin: "0 0 4px 0", color: "#fff" }}>
                    EVALUATION PROTOCOL: PREPARATION DECK
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", margin: 0 }}>
                    CALIBRATE TACTICAL MODULES BEFORE DEPLOYMENT
                  </p>
                </div>

                {/* Matchup Comparison Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "20px", alignItems: "center" }}>
                  
                  {/* Left Side: PLAYER CARD */}
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--accent)", padding: "20px", borderRadius: "2px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,255,204,0.1)", color: "var(--accent)", fontSize: "9px", padding: "2px 6px", borderRadius: "2px", fontWeight: "bold" }}>
                      OPERATIVE
                    </div>

                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                      {/* Portrait Placeholder */}
                      <div style={{ width: "70px", height: "70px", background: "rgba(0,255,204,0.03)", border: "1px solid var(--accent)", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                        <span>PORTRAIT</span>
                        <span>[AVATAR]</span>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: "0 0 6px 0", color: "#fff", fontSize: "16px" }}>{profile.name}</h4>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)", display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span>FACTION: {profile.faction.toUpperCase()}</span>
                          <span>CLASS: {profile.class.toUpperCase()}</span>
                          <span>ROLE: {profile.role.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>LEVEL:</span> <span style={{ color: "#fff", fontWeight: "bold" }}>{profile.level}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>BIO SCORE:</span> <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{Math.round((profile.stats.threat_awareness + profile.stats.operational_discipline + profile.stats.psychological_stability) / 3 * 10)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>POWER INDEX:</span> <span style={{ color: "#fff" }}>{(equippedGear.Weapon?.power || 50) + (equippedGear.Armor?.power || 50)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>HEALTH:</span> <span style={{ color: "#fff" }}>{profile.health} / {pMaxHp}</span>
                      </div>
                    </div>

                    {/* Equipment Loadout Swap Selection */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "12px", paddingTop: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px" }}>
                        EQUIPPED SYSTEMS (CLICK TO SWAP)
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {["Weapon", "Armor", "Helmet"].map(slot => {
                          const item = equippedGear[slot];
                          const candidates = inventory.filter(i => !i.equipped && i.slot === slot);
                          return (
                            <div key={slot} style={{ flex: "1 1 120px" }}>
                              <div style={{ fontSize: "9px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{slot.toUpperCase()}</div>
                              {candidates.length > 0 ? (
                                <select
                                  value={item?.id || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const candidate = candidates.find(c => c.id === val) || null;
                                    handleEquipChange(slot, candidate);
                                  }}
                                  style={{ width: "100%", background: "#050505", border: "1px solid var(--border)", color: "#fff", padding: "4px", fontSize: "11px", borderRadius: "2px" }}
                                >
                                  <option value="">{item ? item.name : `No ${slot}`}</option>
                                  {candidates.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} (+{c.power})</option>
                                  ))}
                                </select>
                              ) : (
                                <div style={{ fontSize: "11px", color: "#fff", background: "#0f0f0f", padding: "6px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                                  {item ? item.name : `Empty`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* VS Indicator */}
                  <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "var(--title-font)", color: "var(--accent)" }}>
                    VS
                  </div>

                  {/* Right Side: OPPONENT CARD */}
                  <div style={{ background: "#0b0b0b", border: "1px solid #ff4d4d", padding: "20px", borderRadius: "2px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,77,77,0.1)", color: "#ff4d4d", fontSize: "9px", padding: "2px 6px", borderRadius: "2px", fontWeight: "bold" }}>
                      EVALUATION HOSTILE
                    </div>

                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                      {/* Portrait Placeholder */}
                      <div style={{ width: "70px", height: "70px", background: "rgba(255,77,77,0.03)", border: "1px solid #ff4d4d", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#ff4d4d", fontFamily: "var(--mono)" }}>
                        <span>PORTRAIT</span>
                        <span>[AVATAR]</span>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: "0 0 6px 0", color: "#fff", fontSize: "16px" }}>{activeOpponent.name}</h4>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)", display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span>FACTION: {activeOpponent.faction.toUpperCase()}</span>
                          <span>CLASS: {activeOpponent.class.toUpperCase()}</span>
                          <span>ROLE: {activeOpponent.role.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>LEVEL:</span> <span style={{ color: "#fff", fontWeight: "bold" }}>{activeOpponent.level}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>BIO SCORE:</span> <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{activeOpponent.bioScore}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>EQ POWER:</span> <span style={{ color: "#fff" }}>{activeOpponent.equipmentPower}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-dim)" }}>THREAT RATING:</span> <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{activeOpponent.threatRating}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "12px", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Calibrate new hostile parameter:</span>
                      <button
                        onClick={() => {
                          try { mainframeAudio.playBeep(); } catch(e){}
                          loadNewOpponent();
                        }}
                        className="btn btn-ghost"
                        style={{ fontSize: "11px", padding: "4px 10px", border: "1px solid var(--border)", color: "var(--accent)" }}
                      >
                        REFRESH HOSTILE
                      </button>
                    </div>
                  </div>

                </div>

                {/* Briefing Analysis Console Card */}
                <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                    🛰️ RED QUEEN EVALUATION LOG
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                        <div style={{ width: "36px", height: "36px", background: "rgba(255,77,77,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                          👑
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>RED QUEEN ASSISTANT</div>
                          <p style={{ fontSize: "13px", color: "#fff", lineHeight: "1.6", margin: "4px 0 0 0" }}>
                            "{rqLive.comment}"
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                        <div style={{ background: "rgba(0,255,204,0.02)", border: "1px solid rgba(0,255,204,0.06)", padding: "12px", borderRadius: "2px" }}>
                          <span style={{ color: "var(--accent)", fontWeight: "bold", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>RECOMMENDED MODULES:</span>
                          <span style={{ color: "var(--text-dim)" }}>Role: {rqLive.recommendation.split("Use ")[1] || "Defensive action"}</span>
                        </div>
                        <div style={{ background: "rgba(255,77,77,0.02)", border: "1px solid rgba(255,77,77,0.06)", padding: "12px", borderRadius: "2px" }}>
                          <span style={{ color: "#ff4d4d", fontWeight: "bold", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>HOSTILE VECTORS:</span>
                          <span style={{ color: "var(--text-dim)" }}>{rqLive.weaknesses.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Probability Sweep Gauge */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#070707", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px" }}>
                      <div style={{ position: "relative", width: "100px", height: "100px" }}>
                        <svg width="100" height="100" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth="2.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="2.5"
                            strokeDasharray={`${winProb}, 100`}
                          />
                        </svg>
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)" }}>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>{winProb}%</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginTop: "8px" }}>
                        WIN PROBABILITY
                      </span>
                    </div>

                  </div>
                </div>

                {/* Launch Button */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                  <button
                    onClick={triggerSimulation}
                    className="btn btn-primary"
                    style={{ fontSize: "14px", padding: "16px 40px", fontFamily: "var(--title-font)", fontWeight: "bold", letterSpacing: "0.15em", width: "100%", maxWidth: "450px" }}
                  >
                    BEGIN COMBAT SIMULATION
                  </button>
                </div>

              </div>
            )}

            {/* VIEW 3: LIVE COMBAT SCREEN */}
            {view === "combat" && activeOpponent && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Simulation Header controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "15px", fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>
                      EVALUATION STREAMING IN PROGRESS
                    </h3>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                      ROUND {combatRound} / 12 // DURATION: {combatRound * 8}s
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "var(--mono)", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-dim)" }}>MANUAL VECTOR CONTROLS ACTIVE</span>
                  </div>
                </div>

                {/* Split Vitals screen */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.1fr", gap: "20px", alignItems: "stretch" }}>
                  
                  {/* Left Column: Player status */}
                  <div style={{ background: "#0a0a0a", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>{profile.name}</span>
                      <span style={{ color: "var(--accent)", fontSize: "10px", fontFamily: "var(--mono)" }}>PLAYER</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>LVL {profile.level} // {profile.class.toUpperCase()}</div>
                    
                    {/* Portrait Card */}
                    <div style={{ height: "130px", background: "rgba(0,255,204,0.01)", border: "1px solid rgba(0,255,204,0.06)", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                      <span>[ PORTRAIT DECK ]</span>
                      {playerEffects.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "0 8px", justifyContent: "center" }}>
                          {playerEffects.map((eff, idx) => (
                            <span key={idx} style={{ 
                              background: eff.name === "EMP Disabled" ? "rgba(186,85,211,0.15)" : eff.name === "Stimmed" ? "rgba(255,165,0,0.15)" : "rgba(255,77,77,0.15)",
                              border: eff.name === "EMP Disabled" ? "1px solid #ba55d3" : eff.name === "Stimmed" ? "1px solid #ffa500" : "1px solid #ff4d4d",
                              color: eff.name === "EMP Disabled" ? "#ba55d3" : eff.name === "Stimmed" ? "#ffa500" : "#ff4d4d",
                              fontSize: "8px", padding: "1px 4px", borderRadius: "1px", fontWeight: "bold"
                            }}>
                              {eff.name.toUpperCase()} ({eff.duration})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vitals bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", marginBottom: "3px" }}>
                          <span>VITALS HP</span>
                          <span>{activePlayerHp} / {pMaxHp}</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "1px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#ff4d4d", width: `${(activePlayerHp / pMaxHp) * 100}%`, transition: "width 0.25s ease-out" }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", marginBottom: "3px" }}>
                          <span>SHIELD INDEX</span>
                          <span>{activePlayerShield} / {pShieldMax}</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "1px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--accent)", width: `${(activePlayerShield / pShieldMax) * 100}%`, transition: "width 0.25s ease-out" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Column: Round Actions Log */}
                  <div style={{ 
                    background: "#070707", border: "1px solid var(--border)", borderRadius: "2px", padding: "16px",
                    display: "flex", flexDirection: "column", justifyItems: "stretch"
                  }}>
                    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontWeight: "bold" }}>ROUND FEED RECORDS</span>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px" }} className="custom-scrollbar">
                      {combatLogs.map((log, idx) => (
                        <div key={idx} style={{ 
                          fontSize: "11px", fontFamily: "var(--mono)", padding: "8px 10px",
                          background: log.attacker === "player" ? "rgba(0,255,204,0.02)" : "rgba(255,77,77,0.02)",
                          borderLeft: log.attacker === "player" ? "2px solid var(--accent)" : "2px solid #ff4d4d",
                          borderRadius: "1px"
                        }}>
                          <span style={{ color: "var(--text-dim)", marginRight: "4px" }}>R{log.round}</span>
                          <span style={{ color: "#fff" }}>{log.logText}</span>
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>

                  {/* Right Column: Hostile status */}
                  <div style={{ background: "#0a0a0a", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>{activeOpponent.name}</span>
                      <span style={{ color: "#ff4d4d", fontSize: "10px", fontFamily: "var(--mono)" }}>HOSTILE</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>LVL {activeOpponent.level} // {activeOpponent.class.toUpperCase()}</div>
                    
                    {/* Portrait Card */}
                    <div style={{ height: "130px", background: "rgba(255,77,77,0.01)", border: "1px solid rgba(255,77,77,0.06)", borderRadius: "2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "11px", color: "#ff4d4d", fontFamily: "var(--mono)" }}>
                      <span>[ PORTRAIT DECK ]</span>
                      {opponentEffects.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "0 8px", justifyContent: "center" }}>
                          {opponentEffects.map((eff, idx) => (
                            <span key={idx} style={{ 
                              background: eff.name === "EMP Disabled" ? "rgba(186,85,211,0.15)" : eff.name === "Stimmed" ? "rgba(255,165,0,0.15)" : "rgba(255,77,77,0.15)",
                              border: eff.name === "EMP Disabled" ? "1px solid #ba55d3" : eff.name === "Stimmed" ? "1px solid #ffa500" : "1px solid #ff4d4d",
                              color: eff.name === "EMP Disabled" ? "#ba55d3" : eff.name === "Stimmed" ? "#ffa500" : "#ff4d4d",
                              fontSize: "8px", padding: "1px 4px", borderRadius: "1px", fontWeight: "bold"
                            }}>
                              {eff.name.toUpperCase()} ({eff.duration})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vitals bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", marginBottom: "3px" }}>
                          <span>VITALS HP</span>
                          <span>{activeOppHp} / {Math.round(140 + activeOpponent.level * 14 + activeOpponent.bioScore * 0.75)}</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "1px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#ff4d4d", width: `${(activeOppHp / Math.round(140 + activeOpponent.level * 14 + activeOpponent.bioScore * 0.75)) * 100}%`, transition: "width 0.25s ease-out" }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", marginBottom: "3px" }}>
                          <span>SHIELD INDEX</span>
                          <span>{activeOppShield} / {Math.round(80 + activeOpponent.equipmentPower * 0.05)}</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "1px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--accent)", width: `${(activeOppShield / Math.round(80 + activeOpponent.equipmentPower * 0.05)) * 100}%`, transition: "width 0.25s ease-out" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* INTERACTIVE ACTION DECK */}
                {isCombatRunning && !isSimulationConcluded && (
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    
                    {/* Primary options header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                          SELECT TACTICAL ACTIONS // AP AVAILABLE:
                        </span>
                        <div style={{ background: "rgba(0,255,204,0.1)", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: "11px", fontFamily: "var(--mono)", padding: "2px 8px", borderRadius: "2px", fontWeight: "bold" }}>
                          {playerAp} / 100 AP
                        </div>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                        DECISION VECTOR // ROUND {combatRound}
                      </span>
                    </div>

                    {/* Active Plan Queue */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "2px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px", fontWeight: "bold" }}>
                        QUEUED TACTICAL PLAN (CLICK ACTION TO REMOVE / REFUND AP):
                      </div>
                      {playerPlanActions.length === 0 ? (
                        <div style={{ fontSize: "11.5px", color: "var(--text-dim)", fontStyle: "italic", fontFamily: "var(--mono)" }}>
                          Queue is empty. Select actions below to construct your tactical plan.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {playerPlanActions.map((act) => (
                            <button
                              key={act.id}
                              onClick={() => removeTacticalAction(act.id, act.apCost)}
                              className="btn btn-ghost"
                              style={{
                                background: "rgba(0,255,204,0.05)",
                                border: "1px solid rgba(0,255,204,0.3)",
                                color: "#fff",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontFamily: "var(--mono)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                                borderRadius: "1px"
                              }}
                            >
                              <span>{act.name}</span>
                              <span style={{ color: "var(--accent)", fontSize: "9px" }}>({act.apCost} AP) ✕</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Primary Button Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
                      <button
                        onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setActiveSubmenu(activeSubmenu === "attack" ? null : "attack"); }}
                        className="btn"
                        style={{
                          background: activeSubmenu === "attack" ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.02)",
                          border: activeSubmenu === "attack" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: activeSubmenu === "attack" ? "var(--accent)" : "#fff",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        ⚔️ ATTACK
                      </button>

                      <button
                        onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setActiveSubmenu(activeSubmenu === "defend" ? null : "defend"); }}
                        className="btn"
                        style={{
                          background: activeSubmenu === "defend" ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.02)",
                          border: activeSubmenu === "defend" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: activeSubmenu === "defend" ? "var(--accent)" : "#fff",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        🛡️ DEFEND
                      </button>

                      <button
                        onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setActiveSubmenu(activeSubmenu === "consumable" ? null : "consumable"); }}
                        className="btn"
                        style={{
                          background: activeSubmenu === "consumable" ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.02)",
                          border: activeSubmenu === "consumable" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: activeSubmenu === "consumable" ? "var(--accent)" : "#fff",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        🎒 CONSUMABLE
                      </button>

                      <button
                        onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setActiveSubmenu(activeSubmenu === "gadget" ? null : "gadget"); }}
                        className="btn"
                        style={{
                          background: activeSubmenu === "gadget" ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.02)",
                          border: activeSubmenu === "gadget" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: activeSubmenu === "gadget" ? "var(--accent)" : "#fff",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        ⚙️ GADGET
                      </button>

                      <button
                        onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setActiveSubmenu(activeSubmenu === "special" ? null : "special"); }}
                        className="btn"
                        style={{
                          background: activeSubmenu === "special" ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.02)",
                          border: activeSubmenu === "special" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          color: activeSubmenu === "special" ? "var(--accent)" : "#fff",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        ⚡ ABILITY
                      </button>

                      <button
                        onClick={commitTacticalPlan}
                        className="btn"
                        style={{
                          background: "rgba(0,255,204,0.2)",
                          border: "1px solid var(--accent)",
                          color: "var(--accent)",
                          fontFamily: "var(--mono)", fontSize: "11px", padding: "10px", cursor: "pointer", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        🚀 COMMIT PLAN
                      </button>
                    </div>

                    {/* Submenu Expansion Panel */}
                    {activeSubmenu && (
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "2px", marginTop: "4px" }}>
                        
                        {/* A. Attack Targeting */}
                        {activeSubmenu === "attack" && (
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>SELECT ATTACK TARGET VECTOR:</div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button onClick={() => addTacticalAction("attack", "Attack Head", "Head", 40)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(255,77,77,0.3)", padding: "8px", fontSize: "11px", color: "#ff4d4d", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                TARGET HEAD (40 AP // 55% Acc // 1.8x Dmg)
                              </button>
                              <button onClick={() => addTacticalAction("attack", "Attack Torso", "Torso", 30)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                TARGET TORSO (30 AP // 90% Acc // 1.0x Dmg)
                              </button>
                              <button onClick={() => addTacticalAction("attack", "Attack Legs", "Legs", 30)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(255,255,255,0.15)", padding: "8px", fontSize: "11px", color: "#fff", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                TARGET LEGS (30 AP // 80% Acc // 0.7x Dmg + Suppressed chance)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* B. Defend Positioning */}
                        {activeSubmenu === "defend" && (
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>SELECT DEFENSIVE ACTION MATRIX:</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                              <button onClick={() => addTacticalAction("defend", "Protect Head", "Protect Head", 20)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                PROTECT HEAD (20 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Protect Torso", "Protect Torso", 20)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                PROTECT TORSO (20 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Protect Legs", "Protect Legs", 20)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                PROTECT LEGS (20 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Shield Stance", "Shield", 30)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                SHIELD STANCE (30 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Take Cover", "Cover", 25)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                COVER (25 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Brace Plating", "Brace", 25)} className="btn btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                BRACE (25 AP)
                              </button>
                              <button onClick={() => addTacticalAction("defend", "Counter Position", "Counter Position", 30)} className="btn btn-ghost" style={{ border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                COUNTER POSITION (30 AP)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* C. Consumables list */}
                        {activeSubmenu === "consumable" && (
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>CHOOSE CONSUMABLE (DEDUCTED FROM PROFILE INVENTORY):</div>
                            {inventory.filter(i => i.name.includes("Medkit") || i.name.includes("Stim") || i.name.includes("Cell") || i.name.includes("Plasma") || i.name.includes("Supplies") || i.name.includes("Deuterium")).length === 0 ? (
                              <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontStyle: "italic" }}>
                                NO USABLE CONSUMABLES AVAILABLE IN INVENTORY.
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {inventory.filter(i => i.name.includes("Medkit") || i.name.includes("Stim") || i.name.includes("Cell") || i.name.includes("Plasma") || i.name.includes("Supplies") || i.name.includes("Deuterium")).map(item => {
                                  let apCost = 20;
                                  if (item.name.includes("Stim")) apCost = 25;
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => addTacticalAction("consumable", `Use ${item.name}`, item.name, apCost)}
                                      className="btn btn-ghost"
                                      style={{ border: "1px solid var(--border)", padding: "8px 14px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}
                                    >
                                      📦 {item.name.toUpperCase()} (Cost: {apCost} AP // Qty: {item.qty})
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* D. Gadgets list */}
                        {activeSubmenu === "gadget" && (
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>DEPLOY GADGET MODULE:</div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button onClick={() => addTacticalAction("gadget", "EMP Pulse", "EMP", 30)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                EMP PULSE (30 AP)
                              </button>
                              <button onClick={() => addTacticalAction("gadget", "Anomaly Drone", "Drone", 25)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                ANOMALY DRONE (25 AP)
                              </button>
                              <button onClick={() => addTacticalAction("gadget", "Tactical Scanner", "Scanner", 15)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                SCANNER (15 AP)
                              </button>
                              <button onClick={() => addTacticalAction("gadget", "Decoy Hologram", "Decoy", 20)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", padding: "8px", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff", cursor: "pointer" }}>
                                DECOY (20 AP)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* E. Special Abilities */}
                        {activeSubmenu === "special" && (
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>DEPLOY ROLE-SPECIFIC ABILITY (35 AP):</div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              {profile.class === "Medic" && (
                                <button onClick={() => addTacticalAction("special", "Helix Inoculation", "Helix Emergency Heal", 35)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                  HELIX INOCULATION (Heal 45 HP + Remove Poison/Bleed)
                                </button>
                              )}
                              {profile.class === "Engineer" && (
                                <button onClick={() => addTacticalAction("special", "Deploy Defense Turret", "Deploy Defense Turret", 35)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                  DEPLOY AUTO-TURRET (20 automatic DoT for 3 rounds)
                                </button>
                              )}
                              {profile.class === "Recon" && (
                                <button onClick={() => addTacticalAction("special", "Critical scan", "Critical scan", 35)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                  VULNERABILITY SCAN (Guarantees Critical Hit next turn)
                                </button>
                              )}
                              {profile.class !== "Medic" && profile.class !== "Engineer" && profile.class !== "Recon" && (
                                <button onClick={() => addTacticalAction("special", "Suppressive Storm", "Suppressive Storm", 35)} className="btn btn-ghost" style={{ flex: 1, border: "1px solid rgba(0,255,204,0.3)", padding: "8px", fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", cursor: "pointer" }}>
                                  SUPPRESSIVE STORM (Deal 40 Dmg + Suppressed)
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                )}

                {/* Live Analysis commentary & win prob dashboard */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", gap: "16px" }}>
                    <div style={{ width: "32px", height: "32px", background: "rgba(0,255,204,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                      👑
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "var(--accent)", fontFamily: "var(--mono)" }}>RED QUEEN LIVE ANALYSIS</div>
                      <p style={{ fontSize: "12.5px", color: "#fff", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                        "{rqTactical.advice}"
                      </p>
                      <div style={{ fontSize: "11.5px", color: "var(--accent)", marginTop: "6px", fontFamily: "var(--mono)", textTransform: "uppercase" }}>
                        Tactical Scan: <span style={{ color: "#ff4d4d" }}>{rqTactical.prediction}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", alignItems: "center", gap: "16px", justifyContent: "center" }}>
                    <div style={{ position: "relative", width: "54px", height: "54px" }}>
                      <svg width="54" height="54" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${winProb}, 100`} />
                      </svg>
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontFamily: "var(--mono)", color: "#fff" }}>
                        {winProb}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>LIVE WIN PROBABILITY</div>
                      <span style={{ fontSize: "12px", color: "#fff", fontWeight: "bold" }}>
                        {winProb > 65 ? "DOMINANT VECTORS" : winProb < 35 ? "SUB-OPTIMAL CONDITIONS" : "STABLE EQUIVALENCE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Abort block */}
                {!isCombatRunning && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                    <button
                      onClick={() => { try { mainframeAudio.playBeep(); } catch(e){} setView("debrief"); }}
                      className="btn btn-primary"
                      style={{ fontSize: "13px", padding: "10px 32px", fontFamily: "var(--title-font)", fontWeight: "bold" }}
                    >
                      PROCEED TO OPERATIONAL DEBRIEF
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* VIEW 4: результаты / POST-COMBAT RESULTS SCREEN */}
            {view === "debrief" && battleResult && activeOpponent && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "700px", margin: "0 auto", width: "100%" }}>
                
                {/* Result header */}
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ 
                    fontSize: "40px", fontWeight: "bold", fontFamily: "var(--title-font)", 
                    color: battleResult.outcome === "VICTORY" ? "var(--accent)" : "#ff4d4d",
                    letterSpacing: "0.15em", textShadow: battleResult.outcome === "VICTORY" ? "0 0 20px rgba(0,255,204,0.15)" : "0 0 20px rgba(255,77,77,0.15)"
                  }}>
                    {battleResult.outcome}
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                    OPERATIONAL EVALUATION CONCLUDED // STATUS CODE: {battleResult.outcome === "VICTORY" ? "SECURED" : "FAILED"}
                  </span>
                </div>

                {/* Rewards Grid */}
                <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                    ACQUIRED RESOURCES & METRICS
                  </span>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", textAlign: "center" }}>
                    <div style={{ background: "#070707", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>ARENA RATING CHANGE</div>
                      <span style={{ fontSize: "18px", fontWeight: "bold", color: battleResult.ratingChange > 0 ? "var(--accent)" : "#ff4d4d" }}>
                        {battleResult.ratingChange > 0 ? `+${battleResult.ratingChange}` : battleResult.ratingChange}
                      </span>
                    </div>

                    <div style={{ background: "#070707", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>XP SECURED</div>
                      <span style={{ fontSize: "18px", fontWeight: "bold", color: "var(--accent)" }}>+{battleResult.xpEarned}</span>
                    </div>

                    <div style={{ background: "#070707", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "4px" }}>CREDITS TRANSACTED</div>
                      <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ffd700" }}>+{battleResult.creditsEarned}</span>
                    </div>
                  </div>

                  {/* Scavenged Inventory Drops */}
                  {Object.keys(battleResult.recoveredResources).length > 0 && (
                    <div style={{ background: "#070707", border: "1px solid var(--border)", padding: "14px", borderRadius: "2px", marginTop: "4px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: "8px" }}>SCAVENGED MATERIAL COMPONENT DROPS:</div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        {Object.keys(battleResult.recoveredResources).map(res => (
                          <div key={res} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "2px", fontSize: "12px", color: "#fff" }}>
                            📦 {res} <span style={{ color: "var(--accent)", fontWeight: "bold" }}>x{battleResult.recoveredResources[res]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Red Queen Debrief review */}
                <div style={{ background: "#0b0b0b", border: "1px solid var(--border)", padding: "20px", borderRadius: "2px", display: "flex", gap: "16px" }}>
                  <div style={{ width: "36px", height: "36px", background: "rgba(0,255,204,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                    👑
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", color: "var(--accent)", fontFamily: "var(--mono)" }}>RED QUEEN OPERATIONAL DEBRIEF</div>
                    <p style={{ fontSize: "13px", color: "#fff", lineHeight: "1.6", margin: "4px 0 8px 0" }}>
                      {battleResult.outcome === "VICTORY" 
                        ? `"Operative execution patterns were consistent with tactical protocols. Target structural weaknesses were fully exploited, resulting in successful simulation clearance. Continue testing higher-level combat vectors."`
                        : `"Hostile threat output exceeded operative defense metrics. The loss indicates a critical deficiency in armor calibration and shield replenishment discipline. Re-evaluate equipment power and BIO-SCORE before re-deploying."`
                      }
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "11px", color: "var(--text-dim)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                      <div>
                        <span style={{ color: "var(--accent)", fontWeight: "bold" }}>BIO-SCORE CHANGE:</span> {battleResult.bioScoreChange > 0 ? `+${battleResult.bioScoreChange}` : battleResult.bioScoreChange}
                      </div>
                      <div>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>ROUNDS ELAPSED:</span> {battleResult.totalRounds}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exit Results */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                  <button
                    onClick={() => {
                      try { mainframeAudio.playBeep(); } catch(e){}
                      loadNewOpponent();
                      setView("dashboard");
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: "13px", padding: "12px 36px", fontFamily: "var(--title-font)", fontWeight: "bold", width: "100%" }}
                  >
                    RETURN TO COMBAT SIMULATION WORKSTATION
                  </button>
                </div>

              </div>
            )}

          </main>
        </div>
      </div>
    </AccessGuard>
  );
}
