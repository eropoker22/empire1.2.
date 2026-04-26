import type { ResourceState } from "@empire/shared-types";
import type { CoreGameState } from "../../entities";
import { calculateIncomeByPlayerId } from "./calculateIncome";

/**
 * Responsibility: Applies periodic income collection to the authoritative state.
 * Belongs here: server-side economy transitions driven by ticks or commands.
 * Does not belong here: UI timing or client cache updates.
 */
export const collectIncome = (state: CoreGameState): CoreGameState => {
  const incomeByPlayerId = calculateIncomeByPlayerId(state);

  if (Object.keys(incomeByPlayerId).length === 0) {
    return state;
  }

  let changed = false;
  let nextResourceStatesById = state.resourceStatesById;

  for (const [playerId, incomeBalances] of Object.entries(incomeByPlayerId)) {
    const player = state.playersById[playerId];

    if (!player) {
      continue;
    }

    const currentResourceState = state.resourceStatesById[player.resourceStateId] ?? createPlayerResourceState(player, state.root.tick);
    const nextBalances = {
      ...currentResourceState.balances
    };

    for (const [resourceKey, amount] of Object.entries(incomeBalances)) {
      nextBalances[resourceKey] = Math.max(0, Number(nextBalances[resourceKey] || 0) + amount);
    }

    nextResourceStatesById = {
      ...nextResourceStatesById,
      [currentResourceState.id]: {
        ...currentResourceState,
        balances: nextBalances,
        lastUpdatedTick: state.root.tick,
        version: currentResourceState.version + (state.resourceStatesById[currentResourceState.id] ? 1 : 0)
      }
    };
    changed = true;
  }

  return changed
    ? {
        ...state,
        resourceStatesById: nextResourceStatesById
      }
    : state;
};

const createPlayerResourceState = (
  player: CoreGameState["playersById"][string],
  tick: number
): ResourceState => ({
  id: player.resourceStateId,
  ownerType: "player",
  ownerId: player.id,
  balances: {},
  incomeModifiers: {},
  lastUpdatedTick: tick,
  version: 1
});
