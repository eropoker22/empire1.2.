import type { CoreGameState } from "@empire/game-core";
import { PLAYER_FACTION_IDS, type PlayerFactionId } from "@empire/shared-types";
import type { FactionBalanceStats, PacingFactionActionStats } from "./types";

export const createFactionBalanceStats = (
  state: CoreGameState,
  ticksPerHour = 1,
  actionStats: Record<PlayerFactionId, PacingFactionActionStats> = createEmptyFactionActionStats(),
  winRate: Record<string, number> = createEmptyFactionNumberMap()
): Record<PlayerFactionId, FactionBalanceStats> => {
  const totals = createFactionBalanceAccumulators();
  const placements = createFinalPlacementByPlayerId(state);
  const activeDistricts = Object.values(state.districtsById).filter((district) => district.status !== "destroyed");
  const controlledDistrictsByPlayerId = createControlledDistrictsByPlayerId(state);

  for (const player of Object.values(state.playersById)) {
    const factionId = normalizeFactionId(player.factionId);
    const balances = state.resourceStatesById[player.resourceStateId]?.balances ?? {};
    const controlledDistricts = controlledDistrictsByPlayerId[player.id] ?? 0;
    totals.playersByFaction[factionId] += 1;
    totals.survivalByFaction[factionId] += resolveSurvivalHours(state, player.id, ticksPerHour);
    totals.eliminatedByFaction[factionId] += player.status === "defeated" ? 1 : 0;
    totals.placementByFaction[factionId] += placements[player.id] ?? state.root.playerIds.length;
    totals.controlledByFaction[factionId] += controlledDistricts;
    totals.controlPercentByFaction[factionId] += activeDistricts.length > 0 ? (controlledDistricts / activeDistricts.length) * 100 : 0;
    totals.cashByFaction[factionId] += Math.max(0, Number(balances.cash || 0));
    totals.dirtyCashByFaction[factionId] += Math.max(0, Number(balances["dirty-cash"] || 0));
    totals.heatByFaction[factionId] += Math.max(0, Number(state.policeStatesById[player.policeStateId]?.heat || 0));
    totals.top8ByFaction[factionId] += player.status === "active" ? 1 : 0;
  }

  for (const district of activeDistricts) {
    const owner = district.ownerPlayerId ? state.playersById[district.ownerPlayerId] : null;
    if (!owner) continue;
    const factionId = normalizeFactionId(owner.factionId);
    totals.influenceTotals[factionId] += Math.max(0, Number(district.influence || 0));
    totals.influenceCounts[factionId] += 1;
  }

  return Object.fromEntries(
    PLAYER_FACTION_IDS.map((factionId) => {
      const count = Math.max(1, totals.playersByFaction[factionId]);
      const stats = actionStats[factionId] ?? createEmptyActionStats();
      return [factionId, {
        averageSurvivalTimeHours: round(totals.survivalByFaction[factionId] / count),
        eliminatedCount: round(totals.eliminatedByFaction[factionId]),
        averageFinalPlacement: round(totals.placementByFaction[factionId] / count),
        averageControlledDistricts: round(totals.controlledByFaction[factionId] / count),
        averageControlPercent: round(totals.controlPercentByFaction[factionId] / count),
        averageCash: round(totals.cashByFaction[factionId] / count),
        averageDirtyCash: round(totals.dirtyCashByFaction[factionId] / count),
        averageHeat: round(totals.heatByFaction[factionId] / count),
        averageAttackCount: round(stats.attackCount / count),
        averageSuccessfulAttacks: round(stats.successfulAttacks / count),
        averageSpyAttempts: round(stats.spyAttempts / count),
        averageSpySuccess: stats.spyAttempts > 0 ? round(stats.spySuccesses / stats.spyAttempts) : 0,
        dangerZoneEscapes: round(stats.dangerZoneEscapes),
        averageDistrictInfluence: round(totals.influenceTotals[factionId] / Math.max(1, totals.influenceCounts[factionId])),
        reachedTop8Count: round(totals.top8ByFaction[factionId]),
        factionWinRate: round(winRate[factionId] ?? 0)
      }];
    })
  ) as Record<PlayerFactionId, FactionBalanceStats>;
};

export const aggregateFactionBalanceStats = (
  entries: readonly Record<PlayerFactionId, FactionBalanceStats>[],
  winRate: Record<string, number> = createEmptyFactionNumberMap()
): Record<PlayerFactionId, FactionBalanceStats> =>
  Object.fromEntries(
    PLAYER_FACTION_IDS.map((factionId) => {
      const total = entries.reduce((sum, entry) => addBalanceStats(sum, entry[factionId]), createEmptyBalanceStats());
      const count = Math.max(1, entries.length);
      return [factionId, {
        averageSurvivalTimeHours: round(total.averageSurvivalTimeHours / count),
        eliminatedCount: round(total.eliminatedCount / count),
        averageFinalPlacement: round(total.averageFinalPlacement / count),
        averageControlledDistricts: round(total.averageControlledDistricts / count),
        averageControlPercent: round(total.averageControlPercent / count),
        averageCash: round(total.averageCash / count),
        averageDirtyCash: round(total.averageDirtyCash / count),
        averageHeat: round(total.averageHeat / count),
        averageAttackCount: round(total.averageAttackCount / count),
        averageSuccessfulAttacks: round(total.averageSuccessfulAttacks / count),
        averageSpyAttempts: round(total.averageSpyAttempts / count),
        averageSpySuccess: round(total.averageSpySuccess / count),
        dangerZoneEscapes: round(total.dangerZoneEscapes / count),
        averageDistrictInfluence: round(total.averageDistrictInfluence / count),
        reachedTop8Count: round(total.reachedTop8Count / count),
        factionWinRate: round(winRate[factionId] ?? 0)
      }];
    })
  ) as Record<PlayerFactionId, FactionBalanceStats>;

const createFactionBalanceAccumulators = () => ({
  playersByFaction: createEmptyFactionNumberMap(),
  survivalByFaction: createEmptyFactionNumberMap(),
  eliminatedByFaction: createEmptyFactionNumberMap(),
  placementByFaction: createEmptyFactionNumberMap(),
  controlledByFaction: createEmptyFactionNumberMap(),
  controlPercentByFaction: createEmptyFactionNumberMap(),
  cashByFaction: createEmptyFactionNumberMap(),
  dirtyCashByFaction: createEmptyFactionNumberMap(),
  heatByFaction: createEmptyFactionNumberMap(),
  top8ByFaction: createEmptyFactionNumberMap(),
  influenceTotals: createEmptyFactionNumberMap(),
  influenceCounts: createEmptyFactionNumberMap()
});

const createControlledDistrictsByPlayerId = (state: CoreGameState): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const district of Object.values(state.districtsById)) {
    if (!district.ownerPlayerId || district.status === "destroyed") continue;
    counts[district.ownerPlayerId] = (counts[district.ownerPlayerId] ?? 0) + 1;
  }
  return counts;
};

const createFinalPlacementByPlayerId = (state: CoreGameState): Record<string, number> => {
  const controlledDistrictsByPlayerId = createControlledDistrictsByPlayerId(state);
  const placements = Object.fromEntries(
    Object.values(state.playersById)
      .filter((player) => player.status === "active")
      .sort((left, right) =>
        (controlledDistrictsByPlayerId[right.id] ?? 0) - (controlledDistrictsByPlayerId[left.id] ?? 0)
        || right.id.localeCompare(left.id)
      )
      .map((player, index) => [player.id, index + 1])
  );

  for (const player of Object.values(state.playersById)) {
    if (player.status === "defeated") {
      placements[player.id] = Number(player.metadata?.finalPlacement ?? state.root.playerIds.length);
    }
  }
  return placements;
};

const addBalanceStats = (left: FactionBalanceStats, right: FactionBalanceStats): FactionBalanceStats => ({
  averageSurvivalTimeHours: left.averageSurvivalTimeHours + right.averageSurvivalTimeHours,
  eliminatedCount: left.eliminatedCount + right.eliminatedCount,
  averageFinalPlacement: left.averageFinalPlacement + right.averageFinalPlacement,
  averageControlledDistricts: left.averageControlledDistricts + right.averageControlledDistricts,
  averageControlPercent: left.averageControlPercent + right.averageControlPercent,
  averageCash: left.averageCash + right.averageCash,
  averageDirtyCash: left.averageDirtyCash + right.averageDirtyCash,
  averageHeat: left.averageHeat + right.averageHeat,
  averageAttackCount: left.averageAttackCount + right.averageAttackCount,
  averageSuccessfulAttacks: left.averageSuccessfulAttacks + right.averageSuccessfulAttacks,
  averageSpyAttempts: left.averageSpyAttempts + right.averageSpyAttempts,
  averageSpySuccess: left.averageSpySuccess + right.averageSpySuccess,
  dangerZoneEscapes: left.dangerZoneEscapes + right.dangerZoneEscapes,
  averageDistrictInfluence: left.averageDistrictInfluence + right.averageDistrictInfluence,
  reachedTop8Count: left.reachedTop8Count + right.reachedTop8Count,
  factionWinRate: left.factionWinRate + right.factionWinRate
});

const createEmptyBalanceStats = (): FactionBalanceStats => ({
  averageSurvivalTimeHours: 0,
  eliminatedCount: 0,
  averageFinalPlacement: 0,
  averageControlledDistricts: 0,
  averageControlPercent: 0,
  averageCash: 0,
  averageDirtyCash: 0,
  averageHeat: 0,
  averageAttackCount: 0,
  averageSuccessfulAttacks: 0,
  averageSpyAttempts: 0,
  averageSpySuccess: 0,
  dangerZoneEscapes: 0,
  averageDistrictInfluence: 0,
  reachedTop8Count: 0,
  factionWinRate: 0
});

const createEmptyFactionNumberMap = (): Record<PlayerFactionId, number> =>
  Object.fromEntries(PLAYER_FACTION_IDS.map((factionId) => [factionId, 0])) as Record<PlayerFactionId, number>;

const createEmptyFactionActionStats = (): Record<PlayerFactionId, PacingFactionActionStats> =>
  Object.fromEntries(PLAYER_FACTION_IDS.map((factionId) => [factionId, createEmptyActionStats()])) as Record<PlayerFactionId, PacingFactionActionStats>;

const createEmptyActionStats = (): PacingFactionActionStats => ({
  attackCount: 0,
  successfulAttacks: 0,
  spyAttempts: 0,
  spySuccesses: 0,
  dangerZoneEscapes: 0
});

const resolveSurvivalHours = (state: CoreGameState, playerId: string, ticksPerHour: number): number => {
  const player = state.playersById[playerId];
  const eliminatedAtTick = Number(player?.metadata?.eliminatedAtTick ?? player?.metadata?.defeatedAtTick);
  const survivedTicks = player?.status === "defeated" && Number.isFinite(eliminatedAtTick)
    ? eliminatedAtTick
    : state.root.tick;
  return survivedTicks / Math.max(1, ticksPerHour);
};

const normalizeFactionId = (value: unknown): PlayerFactionId =>
  PLAYER_FACTION_IDS.includes(value as PlayerFactionId) ? value as PlayerFactionId : "mafian";

const round = (value: number): number => Math.round(value * 100) / 100;
