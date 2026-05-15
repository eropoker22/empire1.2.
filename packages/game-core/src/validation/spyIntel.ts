import type { CoreGameState } from "../entities";

/**
 * Responsibility: Read-only lookup for successful district spy intel.
 * Belongs here: shared validation/projection check over authoritative notifications.
 * Does not belong here: spy outcome calculation or UI visibility.
 */
export const hasSuccessfulSpyIntel = (
  state: CoreGameState,
  playerId: string,
  targetDistrictId: string
): boolean =>
  Object.values(state.notificationsById).some((notification) => {
    if (notification.recipientId !== playerId || notification.category !== "report.spy") {
      return false;
    }

    const payload = notification.payload;
    return payload.targetDistrictId === targetDistrictId && payload.result === "success";
  });
