import type { PoliceState } from "@empire/shared-types";
import type { CoreGameState } from "../entities";

/**
 * Responsibility: Shared player police-state helpers for command handlers.
 * Belongs here: server-authored heat and wanted-level state derivation.
 * Does not belong here: raid scheduling or UI labels.
 */
export const createPlayerPoliceState = (
  player: CoreGameState["playersById"][string],
  tick: number
): PoliceState => ({
  id: player.policeStateId,
  ownerPlayerId: player.id,
  heat: 0,
  wantedLevel: 0,
  lastDecayTick: tick,
  activeFlags: [],
  version: 1
});

export const resolveWantedLevel = (heat: number): number =>
  Math.max(0, Math.min(5, Math.floor(Math.max(0, heat) / 20)));
