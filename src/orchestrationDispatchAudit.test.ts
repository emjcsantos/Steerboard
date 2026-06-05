import { describe, expect, it } from "vitest";
import { createOrchestrationDispatchAudit } from "./orchestrationDispatchAudit";
import type { OrchestrationTask } from "./orchestration";

function buildTask(
  overrides: Partial<OrchestrationTask> = {}
): OrchestrationTask {
  return {
    id: "task-id",
    projectId: "project-id",
    title: "Task title",
    role: "implementation",
    status: "queued",
    attempt: 1,
    attemptLimit: 3,
    owner: "owner",
    objective: "Build a small feature",
    scope: ["scope"],
    fileOwnership: ["src/file.ts"],
    acceptanceCriteria: ["Pass tests"],
    validationCommands: ["npm test"],
    dependencies: ["dep"],
    rollback: "Revert changes",
    ...overrides
  };
}

function buildAcceptedTask(overrides: Partial<OrchestrationTask> = {}): OrchestrationTask {
  return buildTask({
    id: "accepted-id",
    status: "accepted",
    dependencies: [],
    fileOwnership: [],
    scope: [],
    acceptanceCriteria: [],
    validationCommands: [],
    rollback: "",
    ...overrides
  });
}

describe("createOrchestrationDispatchAudit", () => {
  it("returns ready when all queued, active, blocked, and sequence signals are satisfied", () => {
    const result = createOrchestrationDispatchAudit([
      buildTask({
        id: "queued-1",
        status: "queued",
        dependencies: ["dep-a"],
        fileOwnership: ["src/queued-a.ts"],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "active-1",
        status: "implementing",
        scope: ["scope-a"],
        acceptanceCriteria: ["Pass tests"],
        validationCommands: ["pnpm test"]
      }),
      buildTask({
        id: "blocked-1",
        status: "blocked",
        rollback: "Rollback change",
        validationCommands: ["npm run test"]
      }),
      buildTask({
        id: "planning-1",
        status: "implementing",
        role: "planning",
        scope: ["scope-b"],
        acceptanceCriteria: ["Pass all checks"],
        validationCommands: ["go test"]
      })
    ]);

    expect(result).toEqual({
      label: "Dispatch sequencing ready",
      detail:
        "Queued, active, blocked, and dependency sequence signals are ready for orchestration handoff.",
      tone: "ready",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Queued", value: "1/1", tone: "ok" },
        { label: "Active audit", value: "2/2", tone: "ok" },
        { label: "Blocked recovery", value: "1/1", tone: "ok" },
        { label: "Sequence", value: "4/4", tone: "ok" }
      ],
      ariaLabel:
        "Dispatch sequencing ready: 4/4 checks; " +
        "4 open tasks; " +
        "Queued 1/1; " +
        "Active audit 2/2; " +
        "Blocked recovery 1/1; " +
        "Sequence 4/4"
    });
  });

  it("returns empty when no open tasks are present", () => {
    const result = createOrchestrationDispatchAudit([
      buildAcceptedTask({ id: "accepted-1" }),
      buildAcceptedTask({ id: "accepted-2" })
    ]);

    expect(result).toEqual({
      label: "No dispatch sequencing",
      detail: "No open orchestration tasks need dispatch sequencing yet.",
      tone: "empty",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Queued", value: "0/0", tone: "neutral" },
        { label: "Active audit", value: "0/0", tone: "neutral" },
        { label: "Blocked recovery", value: "0/0", tone: "neutral" },
        { label: "Sequence", value: "0/0", tone: "neutral" }
      ],
      ariaLabel:
        "No dispatch sequencing: 0/4 checks; " +
        "0 open tasks; " +
        "Queued 0/0; " +
        "Active audit 0/0; " +
        "Blocked recovery 0/0; " +
        "Sequence 0/0"
    });
  });

  it("blocks when queued, active, blocked, or sequencing signals are missing", () => {
    const result = createOrchestrationDispatchAudit([
      buildTask({
        id: "queued-blocked",
        status: "queued",
        dependencies: [],
        fileOwnership: ["src/queued.ts"],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "active-blocked",
        status: "validating",
        scope: [],
        acceptanceCriteria: [],
        validationCommands: []
      }),
      buildTask({
        id: "blocked-blocked",
        status: "blocked",
        rollback: "",
        validationCommands: []
      }),
      buildTask({
        id: "open-unsequenced",
        status: "implementing",
        scope: [],
        acceptanceCriteria: [],
        validationCommands: [],
        dependencies: [],
        role: "implementation"
      })
    ]);

    expect(result).toEqual({
      label: "Dispatch sequencing blocked",
      detail: "Resolve missing dispatch, audit, recovery, or sequencing signals before handoff.",
      tone: "blocked",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Queued", value: "0/1", tone: "blocked" },
        { label: "Active audit", value: "0/2", tone: "blocked" },
        { label: "Blocked recovery", value: "0/1", tone: "blocked" },
        { label: "Sequence", value: "2/4", tone: "review" }
      ],
      ariaLabel:
        "Dispatch sequencing blocked: 0/4 checks; " +
        "4 open tasks; " +
        "Queued 0/1; " +
        "Active audit 0/2; " +
        "Blocked recovery 0/1; " +
        "Sequence 2/4"
    });
  });

  it("returns review when some checks are ready and some need remediation", () => {
    const result = createOrchestrationDispatchAudit([
      buildTask({
        id: "queued-review",
        status: "queued",
        dependencies: ["dep-a"],
        fileOwnership: ["src/queued.ts"],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "active-review",
        status: "implementing",
        scope: ["scope"],
        acceptanceCriteria: ["Pass tests"],
        validationCommands: []
      }),
      buildTask({
        id: "blocked-review",
        status: "blocked",
        rollback: "Rollback changes",
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "open-sequence",
        status: "implementing",
        dependencies: [],
        scope: ["scope"],
        acceptanceCriteria: ["Pass tests"],
        validationCommands: ["npm test"]
      })
    ]);

    expect(result.tone).toBe("review");
    expect(result.checks).toEqual([
      { label: "Queued", value: "1/1", tone: "ok" },
      { label: "Active audit", value: "1/2", tone: "review" },
      { label: "Blocked recovery", value: "1/1", tone: "ok" },
      { label: "Sequence", value: "3/4", tone: "review" }
    ]);
  });

  it("keeps exact check order and computes checkLabel", () => {
    const result = createOrchestrationDispatchAudit([
      buildTask({
        id: "check-order-1",
        status: "queued",
        dependencies: ["dep-a"],
        fileOwnership: ["src/a.ts"],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "check-order-2",
        status: "implementing",
        scope: ["scope"],
        acceptanceCriteria: [],
        role: "implementation",
        dependencies: [],
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "check-order-3",
        status: "blocked",
        dependencies: ["dep-c"],
        rollback: "",
        validationCommands: ["npm test"]
      }),
      buildTask({
        id: "check-order-4",
        status: "accepted",
        dependencies: ["dep-ignored"],
        role: "planning"
      })
    ]);

    expect(result.checkLabel).toBe("1/4 checks");
    expect(result.checks).toEqual([
      { label: "Queued", value: "1/1", tone: "ok" },
      { label: "Active audit", value: "0/1", tone: "blocked" },
      { label: "Blocked recovery", value: "0/1", tone: "blocked" },
      { label: "Sequence", value: "2/3", tone: "review" }
    ]);
  });

  it("does not mutate input tasks", () => {
    const task1 = buildTask({
      id: "immutable-1",
      status: "queued",
      dependencies: ["dep-a"],
      fileOwnership: ["src/a.ts"],
      validationCommands: ["npm test"],
      scope: ["scope"],
      acceptanceCriteria: ["Pass tests"],
      rollback: "rollback"
    });
    const task2 = buildTask({
      id: "immutable-2",
      status: "implementing",
      scope: ["scope"],
      acceptanceCriteria: ["Pass tests"],
      validationCommands: ["npm test"]
    });
    const snapshot = JSON.parse(JSON.stringify([task1, task2]));

    createOrchestrationDispatchAudit([task1, task2]);

    expect(JSON.parse(JSON.stringify([task1, task2]))).toEqual(snapshot);
  });
});
