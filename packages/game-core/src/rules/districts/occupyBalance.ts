import type { ConflictBalanceConfig } from "../../contracts";

export interface OccupyBalance {
  cooldownTicks: number;
  heatGain: number;
  influenceCost: number;
}

export const DEFAULT_OCCUPY_BALANCE: OccupyBalance = {
  cooldownTicks: 2,
  heatGain: 2,
  influenceCost: 5
};

export const resolveOccupyBalance = (
  config?: Pick<ConflictBalanceConfig, "occupyCooldownTicks" | "occupyHeatGain" | "occupyInfluenceCost">
): OccupyBalance => ({
  cooldownTicks: Math.max(0, Math.floor(config?.occupyCooldownTicks ?? DEFAULT_OCCUPY_BALANCE.cooldownTicks)),
  heatGain: Math.max(0, Number(config?.occupyHeatGain ?? DEFAULT_OCCUPY_BALANCE.heatGain)),
  influenceCost: Math.max(0, Number(config?.occupyInfluenceCost ?? DEFAULT_OCCUPY_BALANCE.influenceCost))
});

export const createOccupyCooldownKey = (districtId: string): string => `occupy:${districtId}`;
