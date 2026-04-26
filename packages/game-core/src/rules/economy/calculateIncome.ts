import type { CoreGameState } from "../../entities";

/**
 * Responsibility: Calculates income from authoritative state and resolved config.
 * Belongs here: pure economy math and server-side derivations.
 * Does not belong here: persistence writes or client formatting.
 */
export const calculateIncome = (state: CoreGameState): number =>
  Object.values(calculateIncomeByPlayerId(state)).reduce(
    (total, balances) =>
      total + Object.values(balances).reduce((playerTotal, amount) => playerTotal + amount, 0),
    0
  );

export const calculateIncomeByPlayerId = (
  state: CoreGameState
): Record<string, Record<string, number>> => {
  const incomeByPlayerId: Record<string, Record<string, number>> = {};

  for (const district of Object.values(state.districtsById)) {
    if (!district.ownerPlayerId || district.status === "destroyed") {
      continue;
    }

    for (const [resourceKey, rawAmount] of Object.entries(district.resourceModifiers)) {
      const amount = Math.max(0, Number(rawAmount || 0));

      if (amount <= 0) {
        continue;
      }

      incomeByPlayerId[district.ownerPlayerId] = {
        ...incomeByPlayerId[district.ownerPlayerId],
        [resourceKey]: (incomeByPlayerId[district.ownerPlayerId]?.[resourceKey] ?? 0) + amount
      };
    }
  }

  return incomeByPlayerId;
};
