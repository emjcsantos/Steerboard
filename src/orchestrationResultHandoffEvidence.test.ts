import { describe, expect, it } from "vitest";
import { createOrchestrationResultHandoffEvidence } from "./orchestrationResultHandoffEvidence";
import type { MockOrchestratorRun } from "./run";
import type { OrchestrationTask } from "./orchestration";

function buildTask(overrides: Partial<OrchestrationTask> = {}): OrchestrationTask {
  return {
    id: "task-id",
    projectId: "project-id",
    title: "Task",
    role: "planning",
    status: "queued",
    attempt: 0,
    attemptLimit: 3,
    owner: "owner",
    objective: "Demonstrate orchestration handoff evidence behavior.",
    scope: ["scope"],
    fileOwnership: ["src/index.ts"],
    acceptanceCriteria: ["Criteria validated"],
    validationCommands: ["npm run test"],
    dependencies: ["dependency-id"],
    rollback: "Rollback plan",
    ...overrides
  };
}

function buildAcceptedTask(overrides: Partial<OrchestrationTask> = {}): OrchestrationTask {
  return buildTask({
    id: "accepted-task",
    status: "accepted",
    ...overrides
  });
}

function buildRun(
  overrides: Partial<MockOrchestratorRun> = {}
): MockOrchestratorRun {
  return {
    id: "run-id",
    projectId: "project-id",
    projectName: "Project",
    title: "Run",
    status: "complete",
    createdAt: "2026-06-04T10:00:00.000Z",
    sourcePackageId: "package-id",
    summary: {
      objective: "Run objective",
      scopeCount: 1,
      fileAreaCount: 1,
      acceptanceCriteriaCount: 1,
      validationGateCount: 1,
      risk: "low"
    },
    sessions: [],
    tasks: [],
    validationGates: [],
    ...overrides
  };
}

describe("createOrchestrationResultHandoffEvidence", () => {
  it("returns ready when accepted results, propagation, integration, and run evidence are ready", () => {
    const acceptedTask = buildAcceptedTask({
      id: "accepted-feature",
      acceptanceCriteria: ["Feature implemented"],
      validationCommands: ["npm run test"],
      fileOwnership: ["src/feature.ts"]
    });
    const integrationTask = buildTask({
      id: "integration-task",
      role: "integration",
      dependencies: ["accepted-feature"],
      scope: ["Prepare release artifacts"],
      acceptanceCriteria: ["Integration handoff generated"],
      validationCommands: ["npm run test"]
    });
    const completeRun = buildRun({
      id: "complete-run",
      validationGates: [
        {
          id: "gate-1",
          label: "Validation",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        }
      ],
      tasks: [
        acceptedTask,
        buildTask({
          id: "validation-task",
          role: "validation",
          status: "accepted"
        })
      ]
    });

    const result = createOrchestrationResultHandoffEvidence([acceptedTask, integrationTask], [completeRun]);

    expect(result).toEqual({
      label: "Result handoff ready",
      detail:
        "Accepted results, propagation, integration handoff, and run evidence are ready for review.",
      tone: "ready",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Accepted results", value: "1/1", tone: "ok" },
        { label: "Propagation", value: "1/1", tone: "ok" },
        { label: "Integration handoff", value: "1/1", tone: "ok" },
        { label: "Run evidence", value: "1/1", tone: "ok" }
      ],
      ariaLabel:
        "Result handoff ready: 4/4 checks; " +
        "1 accepted results; 1 integration tasks; 1 complete runs; " +
        "Accepted results 1/1; " +
        "Propagation 1/1; " +
        "Integration handoff 1/1; " +
        "Run evidence 1/1"
    });
  });

  it("returns empty when no accepted tasks, integration tasks, or complete runs exist", () => {
    const result = createOrchestrationResultHandoffEvidence(
      [
        buildTask({
          id: "planning-task",
          status: "queued",
          role: "planning"
        }),
        buildTask({
          id: "open-task",
          status: "queued",
          role: "implementation"
        })
      ],
      [
        buildRun({
          status: "running",
          validationGates: [],
          tasks: [buildAcceptedTask()]
        })
      ]
    );

    expect(result).toEqual({
      label: "No result handoff evidence",
      detail: "No accepted results, integration handoffs, or complete runs are available yet.",
      tone: "empty",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Accepted results", value: "0/0", tone: "neutral" },
        { label: "Propagation", value: "0/0", tone: "neutral" },
        { label: "Integration handoff", value: "0/0", tone: "neutral" },
        { label: "Run evidence", value: "0/0", tone: "neutral" }
      ],
      ariaLabel:
        "No result handoff evidence: 0/4 checks; " +
        "0 accepted results; 0 integration tasks; 0 complete runs; " +
        "Accepted results 0/0; " +
        "Propagation 0/0; " +
        "Integration handoff 0/0; " +
        "Run evidence 0/0"
    });
  });

  it("returns blocked when accepted and complete run evidence is missing", () => {
    const acceptedTask = buildAcceptedTask({
      id: "accepted-feature",
      acceptanceCriteria: [],
      validationCommands: [],
      fileOwnership: []
    });
    const integrationTask = buildTask({
      id: "integration-task",
      role: "integration",
      dependencies: [],
      scope: [],
      acceptanceCriteria: [],
      validationCommands: []
    });
    const completeRun = buildRun({
      id: "complete-run",
      status: "complete",
      validationGates: [],
      tasks: [buildTask({ id: "running-task", status: "queued" })]
    });

    const result = createOrchestrationResultHandoffEvidence([acceptedTask, integrationTask], [completeRun]);

    expect(result.tone).toBe("blocked");
    expect(result.checks).toEqual([
      { label: "Accepted results", value: "0/1", tone: "blocked" },
      { label: "Propagation", value: "0/1", tone: "blocked" },
      { label: "Integration handoff", value: "0/1", tone: "blocked" },
      { label: "Run evidence", value: "0/1", tone: "blocked" }
    ]);
  });

  it("returns review when checks are partially ready", () => {
    const acceptedWithEvidence = buildAcceptedTask({
      id: "accepted-with-evidence",
      acceptanceCriteria: ["implemented"],
      validationCommands: ["npm run test"],
      fileOwnership: ["src/with-evidence.ts"]
    });
    const acceptedWithoutEvidence = buildAcceptedTask({
      id: "accepted-without-evidence",
      acceptanceCriteria: [],
      validationCommands: [],
      fileOwnership: []
    });
    const integrationReady = buildTask({
      id: "integration-ready",
      role: "integration",
      dependencies: ["accepted-with-evidence"],
      scope: ["handoff scope"],
      acceptanceCriteria: ["handoff criteria"],
      validationCommands: ["npm run test"]
    });
    const integrationBlocked = buildTask({
      id: "integration-blocked",
      role: "integration",
      dependencies: ["non-accepted-task"],
      scope: [],
      acceptanceCriteria: ["handoff criteria"],
      validationCommands: ["npm run test"]
    });
    const runWithEvidence = buildRun({
      id: "run-evidence",
      status: "complete",
      validationGates: [
        {
          id: "gate-evidence",
          label: "Validation",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        }
      ],
      tasks: [acceptedWithEvidence]
    });
    const runWithoutEvidence = buildRun({
      id: "run-no-evidence",
      status: "complete",
      validationGates: [],
      tasks: [acceptedWithoutEvidence]
    });

    const result = createOrchestrationResultHandoffEvidence(
      [
        acceptedWithEvidence,
        acceptedWithoutEvidence,
        integrationReady,
        integrationBlocked
      ],
      [runWithEvidence, runWithoutEvidence]
    );

    expect(result).toEqual({
      label: "Result handoff needs review",
      detail:
        "Some accepted-result or integration handoff evidence needs review before final orchestration.",
      tone: "review",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Accepted results", value: "1/2", tone: "review" },
        { label: "Propagation", value: "1/2", tone: "review" },
        { label: "Integration handoff", value: "1/2", tone: "review" },
        { label: "Run evidence", value: "1/2", tone: "review" }
      ],
      ariaLabel:
        "Result handoff needs review: 0/4 checks; " +
        "2 accepted results; 2 integration tasks; 2 complete runs; " +
        "Accepted results 1/2; " +
        "Propagation 1/2; " +
        "Integration handoff 1/2; " +
        "Run evidence 1/2"
    });
  });

  it("keeps checks in exact order and computes checkLabel", () => {
    const acceptedTask = buildAcceptedTask({
      id: "accepted-feature",
      acceptanceCriteria: ["implemented"],
      validationCommands: ["npm run test"],
      fileOwnership: ["src/task.ts"]
    });
    const integrationTask = buildTask({
      id: "integration-task",
      role: "integration",
      dependencies: [],
      scope: [],
      acceptanceCriteria: ["criteria"],
      validationCommands: ["npm run test"]
    });
    const completeRun = buildRun({
      id: "complete-run",
      status: "complete",
      validationGates: [
        {
          id: "gate-evidence",
          label: "Validation",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        },
        {
          id: "gate-blocked",
          label: "Blocked",
          command: "make build",
          status: "failed",
          detail: "Not passed."
        }
      ],
      tasks: [acceptedTask]
    });

    const result = createOrchestrationResultHandoffEvidence(
      [acceptedTask, integrationTask],
      [completeRun]
    );

    expect(result.checkLabel).toBe("1/4 checks");
    expect(result.checks[0].label).toBe("Accepted results");
    expect(result.checks[1].label).toBe("Propagation");
    expect(result.checks[2].label).toBe("Integration handoff");
    expect(result.checks[3].label).toBe("Run evidence");
    expect(result.checks).toEqual([
      { label: "Accepted results", value: "1/1", tone: "ok" },
      { label: "Propagation", value: "0/1", tone: "blocked" },
      { label: "Integration handoff", value: "0/1", tone: "blocked" },
      { label: "Run evidence", value: "0/1", tone: "blocked" }
    ]);
  });

  it("does not mutate input tasks or runs", () => {
    const acceptedTask = buildAcceptedTask({
      id: "accepted-task",
      acceptanceCriteria: ["implemented"],
      validationCommands: ["npm run test"],
      fileOwnership: ["src/accepted.ts"]
    });
    const integrationTask = buildTask({
      id: "integration-task",
      role: "integration",
      dependencies: ["accepted-task"],
      scope: ["handoff"],
      acceptanceCriteria: ["handoff criteria"],
      validationCommands: ["npm run test"]
    });
    const completeRun = buildRun({
      id: "run-id",
      status: "complete",
      validationGates: [
        {
          id: "gate-1",
          label: "Validation",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        }
      ],
      tasks: [acceptedTask, integrationTask]
    });

    const tasks = [acceptedTask, integrationTask];
    const runs = [completeRun];
    const tasksSnapshot = JSON.parse(JSON.stringify(tasks));
    const runsSnapshot = JSON.parse(JSON.stringify(runs));

    createOrchestrationResultHandoffEvidence(tasks, runs);

    expect(JSON.parse(JSON.stringify(tasks))).toEqual(tasksSnapshot);
    expect(JSON.parse(JSON.stringify(runs))).toEqual(runsSnapshot);
  });
});
