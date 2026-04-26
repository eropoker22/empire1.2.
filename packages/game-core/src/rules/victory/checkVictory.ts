import type { CoreGameState } from "../../entities";
import type { GameCoreContext } from "../../engine/context";
import { PRODUCTION_GAME_LIFECYCLE_PHASES } from "@empire/shared-types";

export interface VictoryCheckResult {
  nextState: CoreGameState;
  resolved: boolean;
}

/**
 * Responsibility: Checks victory conditions against authoritative state.
 * Belongs here: server-side victory evaluation hooks.
 * Does not belong here: scoreboard rendering or admin transport.
 */
export const checkVictory = (
  state: CoreGameState,
  context: GameCoreContext
): VictoryCheckResult => {
  if (state.victoryState?.status === "resolved" || state.matchResult) {
    return {
      nextState: state,
      resolved: true
    };
  }

  const activeDistricts = Object.values(state.districtsById).filter((district) => district.status !== "destroyed");
  const districtScores = createDistrictControlScores(activeDistricts);
  const leader = districtScores[0] ?? null;
  const allActiveDistrictsControlledByLeader =
    activeDistricts.length > 1 &&
    leader !== null &&
    leader.score === activeDistricts.length;
  const durationTicks = Math.max(1, Math.ceil(context.config.technical.gameDurationMs / Math.max(1, context.config.tickRateMs)));
  const durationExpired = state.root.tick >= durationTicks;

  if (!allActiveDistrictsControlledByLeader && !durationExpired) {
    return {
      nextState: state,
      resolved: false
    };
  }

  const reason = allActiveDistrictsControlledByLeader
    ? `control:${context.config.balance.victoryConditionKey}`
    : `duration:${context.config.balance.victoryConditionKey}`;
  const winnerPlayerId = leader?.subjectId ?? null;
  const victoryStateId = state.root.victoryStateId ?? `victory:${state.serverInstance.id}`;
  const matchResultId = state.root.matchResultId ?? `match:${state.serverInstance.id}:${state.root.tick}`;
  const endedAt = new Date(0).toISOString();

  return {
    nextState: {
      ...state,
      serverInstance: {
        ...state.serverInstance,
        status: "ended",
        endedAt,
        version: state.serverInstance.version + 1
      },
      root: {
        ...state.root,
        phase: PRODUCTION_GAME_LIFECYCLE_PHASES.resolved,
        victoryStateId,
        matchResultId,
        version: state.root.version + 1
      },
      victoryState: {
        id: victoryStateId,
        serverInstanceId: state.serverInstance.id,
        status: "resolved",
        victoryType: context.config.balance.victoryConditionKey,
        leaderPlayerId: winnerPlayerId,
        leaderAllianceId: null,
        progressPayload: {
          reason,
          controlledDistrictCount: leader?.score ?? 0,
          totalActiveDistrictCount: activeDistricts.length,
          durationTicks,
          currentTick: state.root.tick
        },
        resolvedAtTick: state.root.tick,
        version: (state.victoryState?.version ?? 0) + 1
      },
      matchResult: {
        id: matchResultId,
        serverInstanceId: state.serverInstance.id,
        endedAt,
        winnerPlayerId,
        winnerAllianceId: null,
        ranking: districtScores.map((score, index) => ({
          subjectType: "player",
          subjectId: score.subjectId,
          rank: index + 1,
          score: score.score
        })),
        reason
      }
    },
    resolved: true
  };
};

const createDistrictControlScores = (
  districts: Array<CoreGameState["districtsById"][string]>
): Array<{ subjectId: string; score: number }> => {
  const scoreByPlayerId = new Map<string, number>();

  for (const district of districts) {
    if (!district.ownerPlayerId) {
      continue;
    }

    scoreByPlayerId.set(
      district.ownerPlayerId,
      (scoreByPlayerId.get(district.ownerPlayerId) ?? 0) + 1
    );
  }

  return [...scoreByPlayerId.entries()]
    .map(([subjectId, score]) => ({ subjectId, score }))
    .sort((left, right) => right.score - left.score || left.subjectId.localeCompare(right.subjectId));
};
