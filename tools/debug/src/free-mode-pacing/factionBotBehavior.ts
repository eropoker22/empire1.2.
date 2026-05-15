import { PLAYER_FACTION_IDS, type PlayerFactionId } from "@empire/shared-types";

export interface FactionBotBehaviorProfile {
  factionId: PlayerFactionId;
  label: string;
  economyFocus: "clean" | "dirty" | "influence" | "intel" | "tech" | "speed" | "combat" | "finance";
  attackTendency: number;
  spyTendency: number;
  attackIntervalMultiplier: number;
  extraAttackChanceMultiplier: number;
  blindAttackTolerance: number;
  dangerZoneAttackMultiplier: number;
  neutralTargetBias: number;
  weakTargetBias: number;
  fortifyBias: number;
  heatTolerance: number;
  preferredBuildingTypes: string[];
  limitation?: string;
}

export const FACTION_BOT_BEHAVIOR_PROFILES: Record<PlayerFactionId, FactionBotBehaviorProfile> = {
  mafian: {
    factionId: "mafian",
    label: "Stable clean growth",
    economyFocus: "clean",
    attackTendency: 0.82,
    spyTendency: 0.36,
    attackIntervalMultiplier: 1.12,
    extraAttackChanceMultiplier: 0.7,
    blindAttackTolerance: 0.54,
    dangerZoneAttackMultiplier: 1.35,
    neutralTargetBias: 0.9,
    weakTargetBias: 1.08,
    fortifyBias: 0.56,
    heatTolerance: 0.52,
    preferredBuildingTypes: ["restaurant", "convenience_store", "exchange", "warehouse"]
  },
  kartel: {
    factionId: "kartel",
    label: "Dirty cash pressure",
    economyFocus: "dirty",
    attackTendency: 1.08,
    spyTendency: 0.32,
    attackIntervalMultiplier: 0.96,
    extraAttackChanceMultiplier: 1.18,
    blindAttackTolerance: 0.72,
    dangerZoneAttackMultiplier: 1.22,
    neutralTargetBias: 1,
    weakTargetBias: 1.05,
    fortifyBias: 0.34,
    heatTolerance: 0.82,
    preferredBuildingTypes: ["street_dealers", "drug_lab", "smuggling_tunnel", "warehouse"]
  },
  kult: {
    factionId: "kult",
    label: "Influence hold",
    economyFocus: "influence",
    attackTendency: 0.94,
    spyTendency: 0.4,
    attackIntervalMultiplier: 1.04,
    extraAttackChanceMultiplier: 0.82,
    blindAttackTolerance: 0.55,
    dangerZoneAttackMultiplier: 1.28,
    neutralTargetBias: 0.86,
    weakTargetBias: 1,
    fortifyBias: 0.76,
    heatTolerance: 0.58,
    preferredBuildingTypes: ["school", "recruitment_center", "fitness_club", "restaurant"]
  },
  "tajna-organizace": {
    factionId: "tajna-organizace",
    label: "Spy-first intel",
    economyFocus: "intel",
    attackTendency: 0.9,
    spyTendency: 0.82,
    attackIntervalMultiplier: 1.02,
    extraAttackChanceMultiplier: 0.72,
    blindAttackTolerance: 0.24,
    dangerZoneAttackMultiplier: 1.42,
    neutralTargetBias: 0.92,
    weakTargetBias: 1.34,
    fortifyBias: 0.48,
    heatTolerance: 0.5,
    preferredBuildingTypes: ["strip_club", "lobby_club", "garage", "restaurant"]
  },
  hackeri: {
    factionId: "hackeri",
    label: "Tech and data pressure",
    economyFocus: "tech",
    attackTendency: 0.96,
    spyTendency: 0.66,
    attackIntervalMultiplier: 1.02,
    extraAttackChanceMultiplier: 0.9,
    blindAttackTolerance: 0.38,
    dangerZoneAttackMultiplier: 1.3,
    neutralTargetBias: 0.95,
    weakTargetBias: 1.18,
    fortifyBias: 0.42,
    heatTolerance: 0.56,
    preferredBuildingTypes: ["factory", "arcade", "power_station", "warehouse"],
    limitation: "Market/data value is still under-modeled in pacing bots."
  },
  "motorkarsky-gang": {
    factionId: "motorkarsky-gang",
    label: "Fast aggression",
    economyFocus: "speed",
    attackTendency: 1.26,
    spyTendency: 0.28,
    attackIntervalMultiplier: 0.82,
    extraAttackChanceMultiplier: 1.35,
    blindAttackTolerance: 0.78,
    dangerZoneAttackMultiplier: 1.55,
    neutralTargetBias: 1.08,
    weakTargetBias: 1.22,
    fortifyBias: 0.28,
    heatTolerance: 0.7,
    preferredBuildingTypes: ["garage", "car_dealer", "street_dealers", "armory"]
  },
  "soukroma-armada": {
    factionId: "soukroma-armada",
    label: "Force and fortify",
    economyFocus: "combat",
    attackTendency: 1.08,
    spyTendency: 0.3,
    attackIntervalMultiplier: 0.96,
    extraAttackChanceMultiplier: 1.02,
    blindAttackTolerance: 0.7,
    dangerZoneAttackMultiplier: 1.22,
    neutralTargetBias: 0.94,
    weakTargetBias: 1.02,
    fortifyBias: 0.84,
    heatTolerance: 0.68,
    preferredBuildingTypes: ["armory", "factory", "recruitment_center", "warehouse"]
  },
  korporace: {
    factionId: "korporace",
    label: "Clean finance expansion",
    economyFocus: "finance",
    attackTendency: 0.78,
    spyTendency: 0.42,
    attackIntervalMultiplier: 1.14,
    extraAttackChanceMultiplier: 0.64,
    blindAttackTolerance: 0.42,
    dangerZoneAttackMultiplier: 1.7,
    neutralTargetBias: 0.84,
    weakTargetBias: 1.12,
    fortifyBias: 0.5,
    heatTolerance: 0.44,
    preferredBuildingTypes: ["shopping_mall", "stock_exchange", "central_bank", "restaurant"],
    limitation: "Finance/market leverage is still under-modeled in pacing bots."
  }
};

export const resolveFactionBotBehavior = (factionId: unknown): FactionBotBehaviorProfile => {
  const normalized = PLAYER_FACTION_IDS.includes(factionId as PlayerFactionId)
    ? factionId as PlayerFactionId
    : "mafian";
  return FACTION_BOT_BEHAVIOR_PROFILES[normalized];
};

export const createBehaviorProfileReport = (): Record<PlayerFactionId, string> =>
  Object.fromEntries(
    PLAYER_FACTION_IDS.map((factionId) => {
      const profile = FACTION_BOT_BEHAVIOR_PROFILES[factionId];
      return [factionId, profile.limitation ? `${profile.label} (${profile.limitation})` : profile.label];
    })
  ) as Record<PlayerFactionId, string>;
