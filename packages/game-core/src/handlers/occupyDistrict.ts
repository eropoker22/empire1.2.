import type { OccupyDistrictCommand } from "@empire/shared-types";
import type { CoreGameState } from "../entities";
import type { GameCoreContext } from "../engine/context";
import type { CoreEvent } from "../events";
import type { CoreError } from "../errors";
import { CORE_EVENT_TYPES, createEvent } from "../events";
import { createOccupyCooldownKey, resolveOccupyBalance } from "../rules";
import {
  applyFactionCooldownTicks,
  applyFactionMultiplier,
  getFactionPassiveModifiers
} from "../rules/factions/factionRules";
import { validateOccupy } from "../validation";
import { createPlayerCooldownState, reassignCapturedDistrictBuildings } from "./attackDistrictHelpers";
import { increasePlayerPoliceHeat } from "./playerPoliceState";

/**
 * Responsibility: Claims one neutral district after successful spy intel.
 * Belongs here: validated ownership transfer and capture event emission.
 * Does not belong here: combat resolution, active faction abilities, or UI logic.
 */
export const handleOccupyDistrict = (
  state: CoreGameState,
  command: OccupyDistrictCommand,
  context: GameCoreContext
): { nextState: CoreGameState; events: CoreEvent[]; errors: CoreError[] } => {
  const errors = validateOccupy(state, command, context.config.balance.conflict);

  if (errors.length > 0) {
    return {
      nextState: state,
      events: [],
      errors
    };
  }

  const player = state.playersById[command.playerId];
  const sourceDistrict = state.districtsById[command.payload.sourceDistrictId ?? ""]!;
  const targetDistrict = state.districtsById[command.payload.districtId];
  const balance = resolveOccupyBalance(context.config.balance.conflict);
  const factionModifiers = getFactionPassiveModifiers(state, player.id, context);
  const cooldownTicks = applyFactionCooldownTicks(balance.cooldownTicks, "occupy", factionModifiers);
  const heatGain = resolveOccupyHeatGain(balance.heatGain, factionModifiers.aggressiveActionHeatGainMultiplier);
  const cooldownState = state.cooldownStatesById[player.cooldownStateId] ?? createPlayerCooldownState(player.id, player.cooldownStateId);
  const occupyCooldownKey = createOccupyCooldownKey(targetDistrict.id);
  const nextPoliceState = increasePlayerPoliceHeat(state, player, heatGain, state.root.tick);
  const nextBuildingsById = reassignCapturedDistrictBuildings(state, targetDistrict.buildingIds, player.id);

  return {
    nextState: {
      ...state,
      playersById: {
        ...state.playersById,
        [player.id]: {
          ...player,
          lastActionAt: command.issuedAt,
          version: player.version + 1
        }
      },
      districtsById: {
        ...state.districtsById,
        [sourceDistrict.id]: {
          ...sourceDistrict,
          influence: Math.max(0, Number(sourceDistrict.influence || 0) - balance.influenceCost),
          version: sourceDistrict.version + 1
        },
        [targetDistrict.id]: {
          ...targetDistrict,
          ownerPlayerId: player.id,
          controllerAllianceId: player.allianceId,
          heat: Math.max(0, Number(targetDistrict.heat || 0) + heatGain),
          status: "claimed",
          lastHeatDecayTick: state.root.tick,
          version: targetDistrict.version + 1
        }
      },
      buildingsById: nextBuildingsById,
      cooldownStatesById: {
        ...state.cooldownStatesById,
        [cooldownState.id]: {
          ...cooldownState,
          cooldowns: {
            ...cooldownState.cooldowns,
            [occupyCooldownKey]: state.root.tick + cooldownTicks
          },
          version: cooldownState.version + (state.cooldownStatesById[cooldownState.id] ? 1 : 0)
        }
      },
      policeStatesById: {
        ...state.policeStatesById,
        [nextPoliceState.id]: nextPoliceState
      },
      root: {
        ...state.root,
        version: state.root.version + 1
      }
    },
    events: [
      createEvent(CORE_EVENT_TYPES.districtCaptured, {
        attackerPlayerId: player.id,
        districtId: targetDistrict.id,
          previousOwnerPlayerId: null,
          sourceDistrictId: command.payload.sourceDistrictId,
        actionType: "occupy-district",
        heatGained: heatGain,
        influenceCost: balance.influenceCost,
        cooldownTicks
      })
    ],
    errors: []
  };
};

const resolveOccupyHeatGain = (baseHeatGain: number, aggressiveActionHeatGainMultiplier: number | undefined): number => {
  const base = Math.max(0, Number(baseHeatGain) || 0);
  const modified = Math.max(0, applyFactionMultiplier(base, aggressiveActionHeatGainMultiplier));
  if (modified > base) return Math.ceil(modified);
  if (modified < base) return Math.floor(modified);
  return modified;
};
