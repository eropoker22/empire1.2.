import { printMultiSeedFactionReport, printSimulationResult, printVariantSuiteResult } from "./report";
import {
  runFreeModePacingMultiSeedAudit,
  runFreeModePacingSimulation,
  runFreeModePacingVariantSuite
} from "./simulate";
import type { PacingVariantName } from "./types";

declare const process: {
  argv: string[];
};

const options = Object.fromEntries(
  process.argv.slice(2).map((entry: string) => {
    const [key, value = "true"] = entry.replace(/^--/, "").split("=");
    return [key, value];
  })
);

const parseHours = (value: unknown): number[] | undefined =>
  typeof value === "string"
    ? value.split(",").map((entry) => Number(entry.trim())).filter((entry) => Number.isFinite(entry) && entry > 0)
    : undefined;

const parseSeedCount = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const simulationOptions = {
  seed: typeof options.seed === "string" ? options.seed : undefined,
  seedCount: parseSeedCount(options.seeds ?? options.multiSeed),
  botCount: options.bots ? Number(options.bots) : undefined,
  districtCount: options.districts ? Number(options.districts) : undefined,
  checkpointHours: parseHours(options.hours),
  maxHours: options.maxHours ? Number(options.maxHours) : undefined,
  tickStride: options.tickStride ? Number(options.tickStride) : undefined,
  variantName: typeof options.variant === "string" ? options.variant as PacingVariantName : undefined
};

if (options.multiSeed || options.seeds) {
  printMultiSeedFactionReport(runFreeModePacingMultiSeedAudit(simulationOptions));
} else if (simulationOptions.variantName) {
  printSimulationResult(runFreeModePacingSimulation(simulationOptions));
} else {
  printVariantSuiteResult(runFreeModePacingVariantSuite(simulationOptions));
}
