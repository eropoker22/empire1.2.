import { describe, expect, it } from "vitest";
import {
  applyFactionHeatGain,
  applyFactionStartingPackage,
  calculateIncomeByPlayerId,
  completeProduction,
  createFactionReadModel,
  createPlayerView,
  getFactionPassiveModifiers,
  normalizeFactionId
} from "@empire/game-core";
import {
  FACTION_DEFINITION_BY_ID,
  FACTION_DEFINITIONS,
  LEGACY_FACTION_ID_MAP,
  resolveModeConfig
} from "@empire/game-config";
import { FACTION_PASSIVE_MODIFIER_KEYS, PLAYER_FACTION_IDS } from "@empire/shared-types";
import {
  FACTION_PASSIVE_MODIFIER_USAGE,
  listFactionPassiveModifierUsage,
  listUnusedPlannedFactionPassiveModifiers
} from "../../../tools/debug/src/free-mode-pacing/factionPassiveAudit";
import { resolveFactionBotBehavior } from "../../../tools/debug/src/free-mode-pacing/factionBotBehavior";
import { runFreeModePacingMultiSeedAudit } from "../../../tools/debug/src/free-mode-pacing/simulate";
import {
  createCoreStateFixture,
  createFixedBuildingFixture,
  createResourceStateFixture
} from "../../fixtures/game-state-fixtures";

const context = { config: resolveModeConfig("free") };

describe("faction core foundation", () => {
  it("has a canonical definition for every PlayerFactionId", () => {
    expect(FACTION_DEFINITIONS.map((definition) => definition.id).sort()).toEqual([...PLAYER_FACTION_IDS].sort());
    for (const factionId of PLAYER_FACTION_IDS) {
      expect(FACTION_DEFINITION_BY_ID[factionId]).toMatchObject({
        id: factionId,
        name: expect.any(String),
        passiveModifiers: expect.any(Object),
        startingPackage: expect.any(Object)
      });
    }
  });

  it("maps legacy faction ids to canonical ids and safely falls back", () => {
    expect(LEGACY_FACTION_ID_MAP.mafia).toBe("mafian");
    expect(LEGACY_FACTION_ID_MAP.cartel).toBe("kartel");
    expect(normalizeFactionId("hackers", context.config)).toBe("mafian");
    expect(normalizeFactionId("unknown", context.config)).toBe("mafian");
  });

  it("keeps starting packages inside free-mode balance range", () => {
    const baseResources = context.config.balance.startingResources;
    for (const definition of FACTION_DEFINITIONS) {
      const pack = definition.startingPackage;
      expect(pack.cash ?? 0).toBeLessThanOrEqual(Number(baseResources.cash || 0) * 0.25);
      expect(pack.dirtyCash ?? 0).toBeLessThanOrEqual(Number(baseResources["dirty-cash"] || 0) * 0.75);
      for (const [resourceKey, amount] of Object.entries(pack.resources ?? {})) {
        expect(amount).toBeLessThanOrEqual(Math.max(1, Number(baseResources[resourceKey] || 1)));
      }
      expect(Object.values(pack.attackLoadout ?? {}).reduce((sum, amount) => sum + Number(amount || 0), 0)).toBeLessThanOrEqual(3);
      expect(Object.values(pack.defenseLoadout ?? {}).reduce((sum, amount) => sum + Number(amount || 0), 0)).toBeLessThanOrEqual(2);
      expect(pack.initialHeat ?? 0).toBeLessThanOrEqual(3);
      expect(pack.initialInfluence ?? 0).toBeLessThanOrEqual(20);
    }
  });

  it("applies the small passive balance patch values", () => {
    expect(FACTION_DEFINITION_BY_ID["soukroma-armada"].passiveModifiers.defensePowerMultiplier).toBe(1.08);
    expect(FACTION_DEFINITION_BY_ID["soukroma-armada"].passiveModifiers.attackPowerMultiplier).toBe(1.05);
    expect(FACTION_DEFINITION_BY_ID.korporace.passiveModifiers.attackDurationMultiplier).toBe(1.03);
    expect(FACTION_DEFINITION_BY_ID["tajna-organizace"].passiveModifiers.attackPowerMultiplier).toBe(0.97);
  });

  it("keeps every passive modifier valid and explicitly audited", () => {
    const definedModifierKeys = new Set<string>();

    for (const definition of FACTION_DEFINITIONS) {
      for (const [key, value] of Object.entries(definition.passiveModifiers)) {
        definedModifierKeys.add(key);
        expect(FACTION_PASSIVE_MODIFIER_KEYS).toContain(key);
        expect(value).toEqual(expect.any(Number));
        if (key.endsWith("Bonus")) {
          expect(value).toBeGreaterThanOrEqual(-0.25);
          expect(value).toBeLessThanOrEqual(0.25);
        } else {
          expect(value).toBeGreaterThanOrEqual(0.75);
          expect(value).toBeLessThanOrEqual(1.25);
        }
      }
    }

    for (const usage of listFactionPassiveModifierUsage()) {
      expect(["active", "partial", "planned"]).toContain(usage.status);
      expect(usage.note.length).toBeGreaterThan(10);
      if (usage.status === "active") {
        expect(usage.surfaces.length).toBeGreaterThan(0);
      }
    }

    for (const modifierKey of definedModifierKeys) {
      expect(FACTION_PASSIVE_MODIFIER_USAGE[modifierKey as keyof typeof FACTION_PASSIVE_MODIFIER_USAGE]).toBeDefined();
    }
    expect([...definedModifierKeys].filter((key) =>
      FACTION_PASSIVE_MODIFIER_USAGE[key as keyof typeof FACTION_PASSIVE_MODIFIER_USAGE]?.status === "planned"
    ).sort()).toEqual(["equipmentLossMultiplier", "marketFeeMultiplier", "rumorTruthMultiplier"].sort());
    expect(listUnusedPlannedFactionPassiveModifiers().map((usage) => usage.key).sort()).toEqual([
      "equipmentLossMultiplier",
      "marketFeeMultiplier",
      "rumorTruthMultiplier",
      "upkeepCostMultiplier"
    ].sort());
  });

  it("applies starting package into authoritative server state", () => {
    const state = createCoreStateFixture();
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "kartel"
    };
    state.policeStatesById["police:1"] = {
      id: "police:1",
      ownerPlayerId: "player:1",
      heat: 0,
      wantedLevel: 0,
      lastDecayTick: 0,
      activeFlags: [],
      version: 1
    };

    const nextState = applyFactionStartingPackage(state, "player:1", context);

    expect(nextState.resourceStatesById["resource:1"].balances).toMatchObject({
      cash: 1100,
      "dirty-cash": 180,
      chemicals: 3
    });
    expect(nextState.playersById["player:1"].attackLoadout.pistol).toBe(1);
    expect(nextState.policeStatesById["police:1"].heat).toBe(3);
  });

  it("applies clean and dirty income passives without mutating gameplay state", () => {
    const state = createCoreStateFixture();
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "korporace"
    };
    state.districtsById["district:1"] = {
      ...state.districtsById["district:1"],
      resourceModifiers: {
        cash: 100,
        "dirty-cash": 100
      }
    };
    const before = state.playersById["player:1"].version;

    const income = calculateIncomeByPlayerId(state, context)["player:1"];

    expect(income.cash).toBeCloseTo(115);
    expect(income["dirty-cash"]).toBe(92);
    expect(state.playersById["player:1"].version).toBe(before);
  });

  it("applies production passive for tech factions", () => {
    const state = createCoreStateFixture();
    const building = createFixedBuildingFixture("factory", {
      id: "building:district-1:factory:1",
      buildingTypeId: "factory"
    });
    state.root.tick = 1;
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "hackeri"
    };
    state.buildingsById[building.id] = building;
    state.districtsById["district:1"] = {
      ...state.districtsById["district:1"],
      buildingIds: [building.id]
    };
    state.resourceStatesById[`resource:${building.id}`] = createResourceStateFixture({
      id: `resource:${building.id}`,
      ownerType: "building",
      ownerId: building.id,
      balances: { "metal-parts": 0 },
      lastUpdatedTick: 0
    });
    const config = {
      ...context.config,
      balance: {
        ...context.config.balance,
        productionMultiplier: 1,
        productionBuildings: {
          factory: { resourceKey: "tech-core", resourceLabel: "Tech Core", amountPerTick: 10, storageCap: 50 }
        }
      }
    };

    const nextState = completeProduction(state, { config });

    expect(nextState.resourceStatesById[`resource:${building.id}`].balances["tech-core"]).toBe(12);
  });

  it("applies heat and spy modifiers only through core helpers", () => {
    const state = createCoreStateFixture();
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "tajna-organizace"
    };
    const modifiers = getFactionPassiveModifiers(state, "player:1", context);

    expect(applyFactionHeatGain(100, modifiers)).toBe(92);
    expect(modifiers.spySuccessChanceBonus).toBe(0.1);
  });

  it("adds faction read model to player view", () => {
    const state = createCoreStateFixture();
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "mafian"
    };

    expect(createFactionReadModel(state, "player:1", context)).toMatchObject({
      factionId: "mafian",
      name: "Mafián",
      activePassiveEffects: expect.arrayContaining(["Clean income +10 %"]),
      plannedPassiveEffects: []
    });
    expect(createPlayerView(state, "player:1", context).faction).toMatchObject({
      factionId: "mafian",
      tagline: "Staré peníze, staré krytí."
    });
  });

  it("separates active and planned faction passive effects in the read model", () => {
    const state = createCoreStateFixture();
    state.playersById["player:1"] = {
      ...state.playersById["player:1"],
      factionId: "korporace"
    };

    const readModel = createFactionReadModel(state, "player:1", context);

    expect(readModel?.activePassiveEffects).toEqual(expect.arrayContaining(["Clean income +15 %", "Attack duration +3 %"]));
    expect(readModel?.plannedPassiveEffects).toEqual(expect.arrayContaining(["Market fee -10 %"]));
  });

  it("resolves faction-aware bot behavior profiles", () => {
    expect(resolveFactionBotBehavior("tajna-organizace").spyTendency)
      .toBeGreaterThan(resolveFactionBotBehavior("soukroma-armada").spyTendency);
    expect(resolveFactionBotBehavior("motorkarsky-gang").attackTendency)
      .toBeGreaterThan(resolveFactionBotBehavior("korporace").attackTendency);
    expect(resolveFactionBotBehavior("unknown").factionId).toBe("mafian");
  });

  it("aggregates faction survival stats in a multi-seed pacing audit", () => {
    const report = runFreeModePacingMultiSeedAudit({
      seed: "unit-faction-passive-balance",
      seedCount: 2,
      maxHours: 24,
      botCount: 20,
      districtCount: 60,
      tickStride: 720,
      variantName: "elimination-8h-stop8"
    });

    expect(report.results).toHaveLength(2);
    expect(Object.keys(report.factionStats).sort()).toEqual([...PLAYER_FACTION_IDS].sort());
    expect(report.factionStats.mafian.averageSurvivalTimeHours).toBeGreaterThan(0);
    expect(report.factionStats.kartel.averageAttackCount).toBeGreaterThanOrEqual(0);
    expect(report.behaviorProfileByFaction.hackeri).toContain("under-modeled");
    expect(report.factionAttackRate["motorkarsky-gang"]).toBeGreaterThanOrEqual(0);
    expect(report.factionSpyRate["tajna-organizace"]).toBeGreaterThanOrEqual(0);
    expect(report.factionTop8Rate.mafian).toBeGreaterThanOrEqual(0);
    expect(report.topFactionByControl).toEqual(expect.any(String));
  });
});
