import { describe, expect, it } from "vitest";
import {
  PRODUCTION_GAME_LIFECYCLE_PHASES,
  isDevSetupGameLifecyclePhase,
  isProductionGameLifecyclePhase
} from "@empire/shared-types";
import { createServerApp } from "../../apps/server/src/app";
import { createAttackDistrictCommandFixture } from "../fixtures/command-fixtures";
import { createInstanceManagerFixture } from "../fixtures/runtime-fixtures";

describe("ServerInstanceManager", () => {
  it("keeps instances isolated", () => {
    const manager = createInstanceManagerFixture();
    manager.createInstance("instance:1", "free");
    manager.createInstance("instance:2", "war");

    expect(manager.listInstances()).toHaveLength(2);
    expect(manager.getInstanceById("instance:1")?.record.mode).toBe("free");
    expect(manager.getInstanceById("instance:2")?.record.mode).toBe("war");
  });

  it("starts free and war instances without requiring dev setup phases", () => {
    const server = createServerApp();
    const freeRuntime = server.instanceManager.createInstance("instance:free", "free");
    const warRuntime = server.instanceManager.createInstance("instance:war", "war");

    server.instanceManager.startInstance(freeRuntime.record.id);
    server.instanceManager.startInstance(warRuntime.record.id);

    [freeRuntime, warRuntime].forEach((runtime) => {
      expect(runtime.record.status).toBe("running");
      expect(runtime.state.root.phase).toBe(PRODUCTION_GAME_LIFECYCLE_PHASES.live);
      expect(isProductionGameLifecyclePhase(runtime.state.root.phase)).toBe(true);
      expect(isDevSetupGameLifecyclePhase(runtime.state.root.phase)).toBe(false);
    });
  });

  it("rejects commands before core dispatch when server runtime gates fail", () => {
    const server = createServerApp();
    const runtime = server.instanceManager.createInstance("instance:free", "free");

    const instanceMismatch = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        serverInstanceId: "instance:other"
      })
    );

    expect(instanceMismatch?.errors.map((error) => error.code)).toEqual(["server.instance_mismatch"]);

    const modeMismatch = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        id: "command:attack:mode-mismatch",
        mode: "war",
        serverInstanceId: runtime.record.id
      })
    );

    expect(modeMismatch?.errors).toEqual([
      {
        code: "server.mode_mismatch",
        message: "Command mode does not match the target server instance mode."
      }
    ]);

    runtime.state.root.phase = PRODUCTION_GAME_LIFECYCLE_PHASES.resolved;
    const resolved = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        serverInstanceId: runtime.record.id
      })
    );

    expect(resolved?.errors.map((error) => error.code)).toEqual(["server.instance_resolved"]);

    runtime.state.root.phase = PRODUCTION_GAME_LIFECYCLE_PHASES.live;
    runtime.state.root.playerIds = Array.from({ length: runtime.config.balance.maxPlayersPerServer + 1 }, (_, index) => `player:${index}`);
    const playerCap = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        id: "command:attack:player-cap",
        serverInstanceId: runtime.record.id
      })
    );

    expect(playerCap?.errors.map((error) => error.code)).toEqual(["server.player_cap_exceeded"]);
  });

  it("rejects expired sessions and per-tick command floods before core dispatch", () => {
    const server = createServerApp();
    const runtime = server.instanceManager.createInstance("instance:free", "free");

    const sessionTtlTicks = Math.ceil(runtime.config.technical.sessionTtlMs / runtime.config.tickRateMs);
    runtime.state.root.tick = sessionTtlTicks;
    const expired = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        id: "command:attack:expired",
        serverInstanceId: runtime.record.id
      })
    );

    expect(expired?.errors.map((error) => error.code)).toEqual(["server.session_expired"]);

    runtime.state.root.tick = 1;
    runtime.commandRateLimitWindow = {
      tick: 1,
      commandCountsByPlayerId: {}
    };

    for (let index = 0; index < 5; index += 1) {
      const result = server.instanceManager.dispatchCommand(
        runtime.record.id,
        createAttackDistrictCommandFixture({
          id: `command:attack:flood:${index}`,
          serverInstanceId: runtime.record.id
        })
      );

      expect(result?.errors.map((error) => error.code)).toEqual(["attacker_not_found"]);
    }

    const rateLimited = server.instanceManager.dispatchCommand(
      runtime.record.id,
      createAttackDistrictCommandFixture({
        id: "command:attack:flood:6",
        serverInstanceId: runtime.record.id
      })
    );

    expect(rateLimited?.errors.map((error) => error.code)).toEqual(["server.rate_limited"]);
  });

  it("rejects duplicate command ids before replaying core dispatch", () => {
    const server = createServerApp();
    const runtime = server.instanceManager.createInstance("instance:free", "free");
    const command = createAttackDistrictCommandFixture({
      serverInstanceId: runtime.record.id
    });

    const firstResult = server.instanceManager.dispatchCommand(runtime.record.id, command);
    const duplicateResult = server.instanceManager.dispatchCommand(runtime.record.id, command);

    expect(firstResult?.errors.map((error) => error.code)).toEqual(["attacker_not_found"]);
    expect(duplicateResult?.errors).toEqual([
      {
        code: "server.duplicate_command",
        message: "Command id was already processed by this server instance."
      }
    ]);
  });
});
