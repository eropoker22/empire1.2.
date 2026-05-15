import type { FactionPassiveModifiers } from "@empire/shared-types";
import { FACTION_PASSIVE_MODIFIER_KEYS } from "@empire/shared-types";

export type FactionPassiveModifierUsageStatus = "active" | "partial" | "planned";

export interface FactionPassiveModifierUsage {
  key: keyof FactionPassiveModifiers;
  status: FactionPassiveModifierUsageStatus;
  surfaces: string[];
  note: string;
}

export const FACTION_PASSIVE_MODIFIER_USAGE: Record<
  keyof FactionPassiveModifiers,
  FactionPassiveModifierUsage
> = {
  cleanIncomeMultiplier: {
    key: "cleanIncomeMultiplier",
    status: "active",
    surfaces: [
      "packages/game-core/src/rules/economy/calculateIncome.ts: district resource income",
      "packages/game-core/src/rules/economy/calculateIncome.ts: fixed building income"
    ],
    note: "Aplikuje se na cash income z district modifiers i fixed budov."
  },
  dirtyIncomeMultiplier: {
    key: "dirtyIncomeMultiplier",
    status: "active",
    surfaces: [
      "packages/game-core/src/rules/economy/calculateIncome.ts: district dirty income",
      "packages/game-core/src/rules/economy/calculateIncome.ts: fixed building dirty income"
    ],
    note: "Aplikuje se na dirty-cash income z district modifiers i fixed budov."
  },
  productionMultiplier: {
    key: "productionMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/rules/production/completeProduction.ts"],
    note: "Obecný násobič produkce pro productionBuildings."
  },
  illegalProductionMultiplier: {
    key: "illegalProductionMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/rules/factions/factionRules.ts: illegal production building set"],
    note: "Aktivní pro drug_lab, smuggling_tunnel a street_dealers, pokud produkují přes productionBuildings."
  },
  techProductionMultiplier: {
    key: "techProductionMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/rules/factions/factionRules.ts: tech resource set"],
    note: "Aktivní pro tech-core, data a intel resources."
  },
  heatGainMultiplier: {
    key: "heatGainMultiplier",
    status: "active",
    surfaces: [
      "packages/game-core/src/handlers/attackDistrict.ts",
      "packages/game-core/src/handlers/useBuildingAction.ts",
      "packages/game-core/src/rules/economy/collectIncome.ts: fixed building passive pressure"
    ],
    note: "Aplikuje se na attack heat, building action heat a pasivní heat z fixed budov."
  },
  influenceGainMultiplier: {
    key: "influenceGainMultiplier",
    status: "active",
    surfaces: [
      "packages/game-core/src/handlers/useBuildingAction.ts",
      "packages/game-core/src/rules/economy/collectIncome.ts: fixed building passive pressure"
    ],
    note: "Aplikuje se jen na pozitivní influence gain."
  },
  spySuccessChanceBonus: {
    key: "spySuccessChanceBonus",
    status: "active",
    surfaces: ["packages/game-core/src/handlers/spyDistrict.ts"],
    note: "Aditivní bonus v p. b. přes applyFactionChanceBonus."
  },
  attackPowerMultiplier: {
    key: "attackPowerMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/handlers/attackDistrict.ts"],
    note: "Aplikuje se na attacker power po trap/effect výpočtu."
  },
  defensePowerMultiplier: {
    key: "defensePowerMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/handlers/attackDistrict.ts"],
    note: "Aplikuje se na defender power po district efektech."
  },
  attackDurationMultiplier: {
    key: "attackDurationMultiplier",
    status: "active",
    surfaces: ["packages/game-core/src/handlers/attackDistrict.ts"],
    note: "Aplikuje se na výsledný attack cooldown/duration po day-night a building redukcích."
  },
  equipmentLossMultiplier: {
    key: "equipmentLossMultiplier",
    status: "planned",
    surfaces: [],
    note: "Definováno pro Soukromou armádu, zatím nenapojeno na loss/mitigation pipeline."
  },
  marketFeeMultiplier: {
    key: "marketFeeMultiplier",
    status: "planned",
    surfaces: [],
    note: "Definováno pro Hackery/Korporaci, zatím nenapojeno na serverMarketSystem fee výpočty."
  },
  rumorTruthMultiplier: {
    key: "rumorTruthMultiplier",
    status: "planned",
    surfaces: [],
    note: "Definováno pro Tajnou organizaci, zatím nenapojeno do rumorPipeline truthChancePct."
  },
  upkeepCostMultiplier: {
    key: "upkeepCostMultiplier",
    status: "planned",
    surfaces: [],
    note: "Kontrakt existuje pro budoucí upkeep systém; žádná frakce ho zatím nepoužívá."
  }
};

export const listFactionPassiveModifierUsage = (): FactionPassiveModifierUsage[] =>
  FACTION_PASSIVE_MODIFIER_KEYS.map((key) => FACTION_PASSIVE_MODIFIER_USAGE[key]);

export const listUnusedPlannedFactionPassiveModifiers = (): FactionPassiveModifierUsage[] =>
  listFactionPassiveModifierUsage().filter((usage) => usage.status === "planned");
