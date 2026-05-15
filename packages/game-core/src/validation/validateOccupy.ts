import type { OccupyDistrictCommand } from "@empire/shared-types";
import type { ConflictBalanceConfig } from "../contracts";
import type { CoreGameState } from "../entities";
import type { CoreError } from "../errors";
import { createOccupyCooldownKey, resolveOccupyBalance } from "../rules";
import { hasSuccessfulSpyIntel } from "./spyIntel";

/**
 * Responsibility: Pure validator for neutral district occupation after successful intel.
 * Belongs here: player, adjacency, neutral ownership, and spy-intel preconditions.
 * Does not belong here: capture state mutation, combat, or UI shaping.
 */
export const validateOccupy = (
  state: CoreGameState,
  command: OccupyDistrictCommand,
  conflictConfig?: ConflictBalanceConfig
): CoreError[] => {
  const player = state.playersById[command.playerId];
  const sourceDistrict = command.payload.sourceDistrictId
    ? state.districtsById[command.payload.sourceDistrictId]
    : null;
  const targetDistrict = state.districtsById[command.payload.districtId];

  if (!player) {
    return [
      {
        code: "occupy_player_not_found",
        message: `Player ${command.playerId} was not found.`
      }
    ];
  }

  if (!targetDistrict) {
    return [
      {
        code: "occupy_target_not_found",
        message: `Target district ${command.payload.districtId} was not found.`
      }
    ];
  }

  if (!sourceDistrict) {
    return [
      {
        code: "occupy_source_not_found",
        message: "Player must occupy from one owned neighboring district."
      }
    ];
  }

  if (sourceDistrict.status === "destroyed") {
    return [
      {
        code: "occupy_source_destroyed",
        message: "Player cannot occupy from a destroyed district."
      }
    ];
  }

  if (targetDistrict.status === "destroyed") {
    return [
      {
        code: "occupy_target_destroyed",
        message: "Destroyed districts cannot be occupied."
      }
    ];
  }

  if (sourceDistrict.ownerPlayerId !== command.playerId) {
    return [
      {
        code: "occupy_source_not_owned",
        message: "Player can only occupy from a district they own."
      }
    ];
  }

  if (targetDistrict.ownerPlayerId === command.playerId) {
    return [
      {
        code: "occupy_own_district",
        message: "Player already controls this district."
      }
    ];
  }

  if (targetDistrict.ownerPlayerId) {
    return [
      {
        code: "occupy_enemy_owned_district",
        message: "Enemy-owned districts must be taken through attack-district."
      }
    ];
  }

  if (targetDistrict.status !== "neutral") {
    return [
      {
        code: "occupy_target_not_neutral",
        message: "Only neutral districts can be occupied without combat."
      }
    ];
  }

  if (!sourceDistrict.adjacentDistrictIds.includes(targetDistrict.id)) {
    return [
      {
        code: "occupy_target_not_adjacent",
        message: "Player can only occupy a neutral district bordering the selected source district."
      }
    ];
  }

  if (!hasSuccessfulSpyIntel(state, command.playerId, targetDistrict.id)) {
    return [
      {
        code: "occupy_requires_successful_spy",
        message: "Successful spy intel is required before occupying this district."
      }
    ];
  }

  const balance = resolveOccupyBalance(conflictConfig);
  const occupyCooldownKey = createOccupyCooldownKey(targetDistrict.id);
  const activeOccupyCooldownTick =
    state.cooldownStatesById[player.cooldownStateId]?.cooldowns?.[occupyCooldownKey];

  if (typeof activeOccupyCooldownTick === "number" && activeOccupyCooldownTick > state.root.tick) {
    return [
      {
        code: "occupy_on_cooldown",
        message: `Occupation route to ${targetDistrict.name} is cooling down for ${activeOccupyCooldownTick - state.root.tick} more ticks.`
      }
    ];
  }

  if (Math.max(0, Number(sourceDistrict.influence || 0)) < balance.influenceCost) {
    return [
      {
        code: "occupy_not_enough_influence",
        message: `Occupation requires ${balance.influenceCost} influence in the source district.`
      }
    ];
  }

  return [];
};
