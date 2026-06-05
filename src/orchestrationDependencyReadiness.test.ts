import { describe, expect, it } from "vitest";
import {
  createOrchestrationDependencyReadiness
} from "./orchestrationDependencyReadiness";
import type { OrchestrationTask } from "./orchestration";

function buildTask(
  overrides: Partial<OrchestrationTask> = {}
): OrchestrationTask {
  return {
    id: "task-id",
    projectId: "project-id",
    title: "Task title",
    role: "planning",
    status: "queued",
    attempt: 1,
    attemptLimit: 3,
    owner: "owner",
    objective: "Build a small feature",
    scope: ["scope"],
    fileOwnership: ["src/file.ts"],
    acceptanceCriteria: ["Pass tests"],
    validationCommands: ["yarn test"],
    dependencies: ["dep"],
    rollback: "Revert changes",
    ...overrides
  };
}

function buildAcceptedTask(overrides: Partial<OrchestrationTask> = {}): OrchestrationTask {
  return buildTask({
    id: "accepted-task",
    status: "accepted",
    dependencies: [],
    fileOwnership: [],
    validationCommands: [],
    ...overrides
  });
}

describe("createOrchestrationDependencyReadiness", () => {
  it("returns ready when all open tasks satisfy dependency, ownership, validation, and retry signals", () => {
    const result = createOrchestrationDependencyReadiness([
      buildTask({
        id: "t1",
        status: "implementing",
        dependencies: ["dep-a"],
        fileOwnership: ["src/a.ts"],
        validationCommands: ["npm test"],
        attempt: 1,
        attemptLimit: 2
      }),
      buildTask({
        id: "t2",
        status: "queued",
        dependencies: ["dep-b"],
        fileOwnership: ["src/b.ts"],
        validationCommands: ["pnpm test"],
        attempt: 0,
        attemptLimit: 3
      })
    ]);

    expect(result).toEqual({
      label: "Orchestration dependencies ready",
      detail: "Open tasks have dependency, file ownership, validation, and retry signals for sequencing.",
      tone: "ready",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Dependencies", value: "2/2", tone: "ok" },
        { label: "File scope", value: "2/2", tone: "ok" },
        { label: "Validation", value: "2/2", tone: "ok" },
        { label: "Retry", value: "0/2 at limit", tone: "ok" }
      ],
      ariaLabel:
        "Orchestration dependencies ready: 4/4 checks; " +
        "2 open tasks; " +
        "Dependencies 2/2; " +
        "File scope 2/2; " +
        "Validation 2/2; " +
        "Retry 0/2 at limit"
    });
  });

  it("returns empty when only accepted tasks are open", () => {
    const result = createOrchestrationDependencyReadiness([
      buildAcceptedTask({ id: "accepted-1" }),
      buildAcceptedTask({ id: "accepted-2" })
    ]);

    expect(result).toEqual({
      label: "No orchestration dependencies",
      detail: "No open orchestration tasks need sequencing yet.",
      tone: "empty",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Dependencies", value: "0/0", tone: "neutral" },
        { label: "File scope", value: "0/0", tone: "neutral" },
        { label: "Validation", value: "0/0", tone: "neutral" },
        { label: "Retry", value: "0/0 at limit", tone: "neutral" }
      ],
      ariaLabel:
        "No orchestration dependencies: 0/4 checks; " +
        "0 open tasks; " +
        "Dependencies 0/0; " +
        "File scope 0/0; " +
        "Validation 0/0; " +
        "Retry 0/0 at limit"
    });
  });

  it("blocks when dependency, validation, or file ownership signals are missing", () => {
    const result = createOrchestrationDependencyReadiness([
      buildTask({
        id: "blocked-dependencies",
        status: "queued",
        dependencies: [],
        fileOwnership: [],
        validationCommands: []
      }),
      buildTask({
        id: "blocked-validation",
        status: "implementing",
        dependencies: [],
        fileOwnership: [],
        validationCommands: [],
        attempt: 1,
        attemptLimit: 3
      })
    ]);

    expect(result.tone).toBe("blocked");
    expect(result.checks.map((check) => check.tone)).toEqual([
      "blocked",
      "blocked",
      "blocked",
      "ok"
    ]);
    expect(result.checks[0]).toEqual({ label: "Dependencies", value: "0/2", tone: "blocked" });
    expect(result.checks[1]).toEqual({ label: "File scope", value: "0/2", tone: "blocked" });
    expect(result.checks[2]).toEqual({ label: "Validation", value: "0/2", tone: "blocked" });
    expect(result.checks[3]).toEqual({ label: "Retry", value: "0/2 at limit", tone: "ok" });
  });

  it("blocks file scope when ownership is duplicated between open tasks", () => {
    const result = createOrchestrationDependencyReadiness([
      buildTask({
        id: "file-dup-1",
        dependencies: ["dep-a"],
        fileOwnership: ["src/common.ts"],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "file-dup-2",
        dependencies: ["dep-b"],
        fileOwnership: ["src/common.ts"],
        validationCommands: ["pnpm test"]
      })
    ]);

    expect(result.tone).toBe("blocked");
    expect(result.checks[1]).toEqual({ label: "File scope", value: "2/2", tone: "blocked" });
  });

  it("returns review when dependency, validation, and retry are partially ready", () => {
    const result = createOrchestrationDependencyReadiness([
      buildTask({
        id: "review-a",
        status: "queued",
        dependencies: ["dep-a"],
        fileOwnership: ["src/a.ts"],
        validationCommands: ["npm test"],
        attempt: 1,
        attemptLimit: 2
      }),
      buildTask({
        id: "review-b",
        status: "blocked",
        dependencies: [],
        fileOwnership: ["src/b.ts"],
        validationCommands: [],
        attempt: 2,
        attemptLimit: 2
      })
    ]);

    expect(result.tone).toBe("review");
    expect(result.checks[0]).toEqual({ label: "Dependencies", value: "1/2", tone: "review" });
    expect(result.checks[2]).toEqual({ label: "Validation", value: "1/2", tone: "review" });
    expect(result.checks[3]).toEqual({ label: "Retry", value: "1/2 at limit", tone: "review" });
  });

  it("keeps exact check order and computes checkLabel", () => {
    const result = createOrchestrationDependencyReadiness([
      buildTask({
        id: "check-order-a",
        dependencies: ["dep-a"],
        fileOwnership: ["src/a.ts"],
        validationCommands: [],
        status: "blocked",
        attempt: 3,
        attemptLimit: 3
      }),
      buildTask({
        id: "check-order-b",
        status: "implementing",
        dependencies: ["dep-b"],
        fileOwnership: ["src/b.ts"],
        validationCommands: ["npm test"]
      })
    ]);

    expect(result.checkLabel).toBe("2/4 checks");
    expect(result.checks).toEqual([
      { label: "Dependencies", value: "2/2", tone: "ok" },
      { label: "File scope", value: "2/2", tone: "ok" },
      { label: "Validation", value: "1/2", tone: "review" },
      { label: "Retry", value: "1/2 at limit", tone: "review" }
    ]);
  });

  it("does not mutate input tasks", () => {
    const task1 = buildTask({
      id: "immutable-1",
      dependencies: ["dep-a"],
      fileOwnership: ["src/a.ts"],
      validationCommands: ["npm test"],
      attempt: 1,
      attemptLimit: 3
    });
    const task2 = buildTask({
      id: "immutable-2",
      status: "implementing",
      dependencies: ["dep-b"],
      fileOwnership: ["src/b.ts"],
      validationCommands: ["pnpm test"],
      attempt: 2,
      attemptLimit: 2
    });
    const snapshot = JSON.parse(JSON.stringify([task1, task2]));

    createOrchestrationDependencyReadiness([task1, task2]);

    expect(JSON.parse(JSON.stringify([task1, task2]))).toEqual(snapshot);
  });
});
