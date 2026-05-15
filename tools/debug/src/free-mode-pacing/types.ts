import type { CoreGameState } from "@empire/game-core";
import type { FactionPacingMetrics } from "./factionMetrics";
import { PLAYER_FACTION_IDS, type PlayerFactionId } from "@empire/shared-types";

export type PacingVariantName =
  | "baseline"
  | "elimination-8h-stop8"
  | "elimination-8h-stop8-lower-catastrophe"
  | "elimination-8h-stop8-lower-catastrophe-faster-attacks";

export interface PacingEliminationVariantConfig {
  enabled: true;
  firstEliminationTick: number;
  eliminationIntervalTicks: number;
  minActivePlayers: number;
  dangerZoneSize: number;
  quietHours: {
    enabled: true;
    timeZone: "Europe/Bratislava";
    startHour: 0;
    endHour: 6;
    behavior: "defer_to_window_end";
  };
  defeatedDistrictPolicy: "neutralize";
}

export interface FreeModePacingVariant {
  variantName: PacingVariantName;
  catastropheChance?: number;
  attackCooldownTicks?: number;
  minAttackDurationTicks?: number;
  elimination?: PacingEliminationVariantConfig;
}

export interface FreeModePacingOptions {
  seed?: string;
  seedCount?: number;
  botCount?: number;
  districtCount?: number;
  checkpointHours?: number[];
  maxHours?: number;
  tickStride?: number;
  variantName?: PacingVariantName;
  variant?: FreeModePacingVariant;
  quiet?: boolean;
}

export interface PacingFactionActionStats {
  attackCount: number;
  successfulAttacks: number;
  spyAttempts: number;
  spySuccesses: number;
  dangerZoneEscapes: number;
}

export interface PacingMilestone {
  tick: number;
  hour: number;
  subjectType: "player" | "alliance";
  subjectId: string;
  percent: number;
}

export interface PacingMetrics {
  totalAttacks: number;
  successfulAttacks: number;
  failedAttacks: number;
  districtCaptures: number;
  factionActionStats: Record<PlayerFactionId, PacingFactionActionStats>;
  first25: PacingMilestone | null;
  first50: PacingMilestone | null;
  first75: PacingMilestone | null;
  eliminationTimeline: EliminationTimelineEntry[];
}

export interface PacingSnapshot {
  variantName: PacingVariantName;
  simulatedHours: number;
  currentTick: number;
  activePlayersRemaining: number;
  eliminatedPlayers: string[];
  activeDistricts: number;
  destroyedDistricts: number;
  neutralDistricts: number;
  topPlayerId: string | null;
  topPlayerControlledDistricts: number;
  topPlayerControlPercent: number;
  topAllianceId: string | null;
  topAllianceControlledDistricts: number;
  topAllianceControlPercent: number;
  averageDistrictHeat: number;
  averagePlayerCash: number;
  averagePlayerDirtyCash: number;
  factionMetrics: FactionPacingMetrics;
  totalAttacks: number;
  successfulAttacks: number;
  failedAttacks: number;
  districtCaptures: number;
  first25PercentHour: number | null;
  first50PercentHour: number | null;
  first75PercentHour: number | null;
  victoryReached: boolean;
  victoryTick: number | null;
  victoryHour: number | null;
  winnerType: "player" | "alliance" | "none" | null;
  winnerId: string | null;
}

export interface EliminationTimelineEntry {
  eliminationNumber: number;
  tick: number;
  hour: number;
  eliminatedPlayerId: string;
  finalPlacement: number;
  eliminatedPlayerScore: number;
  eliminatedPlayerControlledDistricts: number;
  activePlayersRemaining: number;
  topAllianceControlPercentAfterElimination: number;
}

export interface PacingSimulationResult {
  variantName: PacingVariantName;
  config: {
    tickRateMs: number;
    ticksPerHour: number;
    tickStride: number;
    dayLengthTicks: number;
    nightLengthTicks: number;
    minimumVictoryTicks: number;
    controlHoldTicks: number;
    hardTimeoutTicks: number;
    victoryThreshold: number;
    allowDurationVictoryFallback: boolean;
  };
  finalState: CoreGameState;
  factionBalanceStats: Record<PlayerFactionId, FactionBalanceStats>;
  snapshots: PacingSnapshot[];
  eliminationTimeline: EliminationTimelineEntry[];
  milestones: {
    first25: PacingMilestone | null;
    first50: PacingMilestone | null;
    first75: PacingMilestone | null;
  };
  verdict: string;
}

export interface PacingVariantSuiteResult {
  results: PacingSimulationResult[];
  factionWinRate: Record<string, number>;
}

export interface FactionBalanceStats {
  averageSurvivalTimeHours: number;
  eliminatedCount: number;
  averageFinalPlacement: number;
  averageControlledDistricts: number;
  averageControlPercent: number;
  averageCash: number;
  averageDirtyCash: number;
  averageHeat: number;
  averageAttackCount: number;
  averageSuccessfulAttacks: number;
  averageSpyAttempts: number;
  averageSpySuccess: number;
  dangerZoneEscapes: number;
  averageDistrictInfluence: number;
  reachedTop8Count: number;
  factionWinRate: number;
}

export interface PacingMultiSeedFactionReport {
  variantName: PacingVariantName;
  seedCount: number;
  simulatedHours: number;
  botCount: number;
  districtCount: number;
  results: PacingSimulationResult[];
  factionStats: Record<PlayerFactionId, FactionBalanceStats>;
  behaviorProfileByFaction: Record<PlayerFactionId, string>;
  factionAttackRate: Record<PlayerFactionId, number>;
  factionSpyRate: Record<PlayerFactionId, number>;
  factionExpansionRate: Record<PlayerFactionId, number>;
  factionAverageHeat: Record<PlayerFactionId, number>;
  factionDangerZoneEscapes: Record<PlayerFactionId, number>;
  factionTop8Rate: Record<PlayerFactionId, number>;
  factionAverageFinalPlacement: Record<PlayerFactionId, number>;
  topFactionByControl: PlayerFactionId | null;
  strongestFaction: PlayerFactionId | null;
  weakestFaction: PlayerFactionId | null;
}

export const createInitialPacingMetrics = (): PacingMetrics => ({
  totalAttacks: 0,
  successfulAttacks: 0,
  failedAttacks: 0,
  districtCaptures: 0,
  factionActionStats: createEmptyFactionActionStats(),
  first25: null,
  first50: null,
  first75: null,
  eliminationTimeline: []
});

export const createEmptyFactionActionStats = (): Record<PlayerFactionId, PacingFactionActionStats> =>
  Object.fromEntries(
    PLAYER_FACTION_IDS.map((factionId) => [
      factionId,
      {
        attackCount: 0,
        successfulAttacks: 0,
        spyAttempts: 0,
        spySuccesses: 0,
        dangerZoneEscapes: 0
      }
    ])
  ) as Record<PlayerFactionId, PacingFactionActionStats>;
