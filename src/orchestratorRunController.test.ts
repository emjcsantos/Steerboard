import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORCHESTRATOR_EXECUTION_POLICY,
  OrchestratorRunController
} from "./orchestratorRunController";

describe("orchestrator run controller", () => {
  it("keeps manual execution as the default", () => {
    const controller = new OrchestratorRunController();
    const lease = controller.claim("repo");

    expect(DEFAULT_ORCHESTRATOR_EXECUTION_POLICY).toEqual({
      mode: "manual",
      readinessApproved: false,
      permissionApproved: false
    });
    expect(lease).toMatchObject({ acquired: true, canExecuteRuntimeCommand: true, reason: "ready" });
    lease.release();
  });

  it("allows only one active pump per repository", () => {
    const controller = new OrchestratorRunController();
    const first = controller.claim("repo");
    const concurrent = controller.claim("repo");

    expect(concurrent).toMatchObject({
      acquired: false,
      canExecuteRuntimeCommand: false,
      reason: "already-running"
    });
    first.release();
    expect(controller.claim("repo").acquired).toBe(true);
  });

  it("keeps continuous runtime execution gated until readiness and permission pass", () => {
    const controller = new OrchestratorRunController();
    const gated = controller.claim("repo", {
      mode: "continuous",
      readinessApproved: true,
      permissionApproved: false
    });

    expect(gated).toMatchObject({
      acquired: true,
      canExecuteRuntimeCommand: false,
      reason: "continuous-gate-closed"
    });
    gated.release();

    const ready = controller.claim("repo", {
      mode: "continuous",
      readinessApproved: true,
      permissionApproved: true
    });
    expect(ready.canExecuteRuntimeCommand).toBe(true);
    ready.release();
  });

  it("runs command and event processing as separate ordered phases", async () => {
    const controller = new OrchestratorRunController();
    const phases: string[] = [];
    const result = await controller.runCycle({
      key: "repo",
      executeNextCommand: async () => {
        phases.push("command");
        return "command-result";
      },
      processEvents: async () => {
        phases.push("events");
        return "event-result";
      }
    });

    expect(phases).toEqual(["command", "events"]);
    expect(result).toMatchObject({
      status: "completed",
      commandResult: "command-result",
      eventResult: "event-result",
      runtimeCommandGated: false
    });
  });

  it("still processes events when continuous command execution is gated", async () => {
    const controller = new OrchestratorRunController();
    let commandCalls = 0;
    let eventCalls = 0;
    const result = await controller.runCycle({
      key: "repo",
      policy: { mode: "continuous", readinessApproved: false, permissionApproved: false },
      executeNextCommand: async () => {
        commandCalls += 1;
      },
      processEvents: async () => {
        eventCalls += 1;
      }
    });

    expect(commandCalls).toBe(0);
    expect(eventCalls).toBe(1);
    expect(result.runtimeCommandGated).toBe(true);
  });
});
