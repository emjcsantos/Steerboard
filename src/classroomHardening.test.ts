import { describe, expect, it } from "vitest";
import {
  CLASSROOM_OWNER_BASELINE_NAME,
  CLASSROOM_OWNER_LIMITS,
  classroomRecoveryBaseline,
  classifyClassroomRecovery,
  evaluateClassroomOwnerBaseline,
  type ClassroomOwnerBaselineObservation,
  type ClassroomRecoveryCondition,
  type ClassroomRecoveryState
} from "./classroomHardening";

function passingObservation(): ClassroomOwnerBaselineObservation {
  return {
    initialRender: { rendered: true, workerCount: 0 },
    twentyWorkerUpdate: { applied: true, workerCount: 20 },
    visibleBubbleCount: 3,
    retainedChatMessageCount: 80,
    viewport: { zoomOperations: 2, panOperations: 2, workerCount: 20 },
    security: {
      executionBypassObserved: false,
      secretExposureObserved: false,
      privateTranscriptExposureObserved: false,
      rawChainOfThoughtExposureObserved: false,
      automaticPushObserved: false,
      newDependencyObserved: false
    }
  };
}

describe("Classroom Owner Baseline v1", () => {
  it("names and passes deterministic boundary evidence", () => {
    const evidence = evaluateClassroomOwnerBaseline(passingObservation());
    expect(evidence.name).toBe(CLASSROOM_OWNER_BASELINE_NAME);
    expect(evidence.passed).toBe(true);
    expect(evidence.assertions).toHaveLength(11);
    expect(evidence.assertions.every(({ passed }) => passed)).toBe(true);
    expect(CLASSROOM_OWNER_LIMITS).toEqual({
      maximumWorkers: 20,
      maximumVisibleBubbles: 3,
      maximumChatHistory: 80,
      maximumViewportOperations: 8
    });
  });

  it.each([
    ["initial render", (value: ClassroomOwnerBaselineObservation) => { value.initialRender.rendered = false; }, "initial-render"],
    ["20-worker update", (value: ClassroomOwnerBaselineObservation) => { value.twentyWorkerUpdate.workerCount = 19; }, "twenty-worker-update"],
    ["bubble cap", (value: ClassroomOwnerBaselineObservation) => { value.visibleBubbleCount = 4; }, "bubble-limit"],
    ["chat cap", (value: ClassroomOwnerBaselineObservation) => { value.retainedChatMessageCount = 81; }, "chat-history-limit"],
    ["viewport budget", (value: ClassroomOwnerBaselineObservation) => { value.viewport.panOperations = 7; }, "constant-time-viewport"]
  ])("fails %s evidence when its observed boundary is exceeded", (_label, mutate, check) => {
    const observation = passingObservation();
    mutate(observation);
    const evidence = evaluateClassroomOwnerBaseline(observation);
    expect(evidence.passed).toBe(false);
    expect(evidence.assertions.find((item) => item.check === check)?.passed).toBe(false);
  });

  it("rejects non-finite, fractional, negative, and over-capacity counts", () => {
    const invalid = [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5];
    for (const count of invalid) {
      const observation = passingObservation();
      observation.visibleBubbleCount = count;
      expect(evaluateClassroomOwnerBaseline(observation).passed).toBe(false);
    }
    const observation = passingObservation();
    observation.viewport.workerCount = 21;
    expect(evaluateClassroomOwnerBaseline(observation).passed).toBe(false);
  });

  it.each([
    "executionBypassObserved",
    "secretExposureObserved",
    "privateTranscriptExposureObserved",
    "rawChainOfThoughtExposureObserved",
    "automaticPushObserved",
    "newDependencyObserved"
  ] as const)("fails when %s is observed", (key) => {
    const observation = passingObservation();
    observation.security[key] = true;
    const evidence = evaluateClassroomOwnerBaseline(observation);
    expect(evidence.passed).toBe(false);
    expect(evidence.assertions.filter((item) => !item.passed)).toHaveLength(1);
  });
});

describe("classroom recovery evidence", () => {
  const expected: Readonly<Record<ClassroomRecoveryCondition, ClassroomRecoveryState>> = {
    "legacy-snapshot": "truthful-empty",
    "malformed-snapshot": "truthful-empty",
    "unknown-command-or-event": "limited-read-only",
    "duplicate-dispatch-or-report": "repaired",
    "orphan-job": "limited-read-only",
    "missing-profile": "blocked",
    "invalid-seat": "truthful-empty",
    "lost-runtime": "limited-read-only",
    "blocked-approval": "blocked"
  };

  it.each(Object.entries(expected) as [ClassroomRecoveryCondition, ClassroomRecoveryState][])(
    "classifies %s as %s",
    (condition, state) => {
      const evidence = classifyClassroomRecovery(condition);
      expect(evidence).toMatchObject({ condition, state, preservesDurableTruth: true });
      expect(evidence.explanation.length).toBeGreaterThan(20);
      expect(evidence.permitsMutation).toBe(state === "repaired");
    }
  );

  it("returns every named recovery condition exactly once in stable order", () => {
    const baseline = classroomRecoveryBaseline();
    expect(baseline.map(({ condition }) => condition)).toEqual(Object.keys(expected));
    expect(new Set(baseline.map(({ condition }) => condition)).size).toBe(9);
  });
});
