import type { CoreGameState } from "../../entities";
import type { CoreEvent } from "../../events";
import { CORE_EVENT_TYPES, createEvent } from "../../events";
import type { GameCoreContext } from "../../engine/context";

const RAID_PRESSURE_THRESHOLD = 100;
const RAID_PENDING_FLAG = "raid:pending";

/**
 * Responsibility: Flags player police states that cross the raid pressure threshold.
 * Belongs here: police-driven state transitions in the core.
 * Does not belong here: transport or UI effects.
 */
export const triggerRaid = (
  state: CoreGameState,
  context?: GameCoreContext
): { nextState: CoreGameState; events: CoreEvent[] } => {
  let changed = false;
  let nextPoliceStatesById = state.policeStatesById;
  const events: CoreEvent[] = [];
  const raidIntensityMultiplier = Math.max(0, Number(context?.config.balance.raidIntensityMultiplier ?? 1));
  const threshold = Math.max(1, Math.floor(RAID_PRESSURE_THRESHOLD / Math.max(0.01, raidIntensityMultiplier)));

  for (const policeState of Object.values(state.policeStatesById)) {
    if (policeState.heat < threshold || policeState.activeFlags.includes(RAID_PENDING_FLAG)) {
      continue;
    }

    nextPoliceStatesById = {
      ...nextPoliceStatesById,
      [policeState.id]: {
        ...policeState,
        wantedLevel: Math.max(policeState.wantedLevel, 5),
        activeFlags: [...policeState.activeFlags, RAID_PENDING_FLAG],
        version: policeState.version + 1
      }
    };
    changed = true;
    events.push(
      createEvent(CORE_EVENT_TYPES.policeRaidTriggered, {
        playerId: policeState.ownerPlayerId,
        policeStateId: policeState.id,
        heat: policeState.heat,
        threshold
      })
    );
  }

  return {
    nextState: changed
      ? {
          ...state,
          policeStatesById: nextPoliceStatesById
        }
      : state,
    events
  };
};
