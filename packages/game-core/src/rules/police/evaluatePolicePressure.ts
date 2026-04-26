import type { CoreGameState } from "../../entities";
import type { GameCoreContext } from "../../engine/context";

/**
 * Responsibility: Evaluates police pressure from authoritative state.
 * Belongs here: pure server-side police/heat evaluation.
 * Does not belong here: admin dashboard rendering or notification delivery.
 */
export const evaluatePolicePressure = (
  state: CoreGameState,
  context?: GameCoreContext
): number => {
  const playerHeat = Object.values(state.policeStatesById).reduce(
    (total, policeState) => total + Math.max(0, Number(policeState.heat || 0)),
    0
  );
  const districtHeat = Object.values(state.districtsById).reduce(
    (total, district) => total + Math.max(0, Number(district.heat || 0)),
    0
  );
  const multiplier = Math.max(0, Number(context?.config.balance.policePressureMultiplier ?? 1));

  return Math.floor((playerHeat + districtHeat) * multiplier);
};
