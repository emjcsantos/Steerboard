export const CLASSROOM_OWNER_BASELINE_NAME = "Classroom Owner Baseline v1" as const;

export const CLASSROOM_OWNER_LIMITS = {
  maximumWorkers: 20,
  maximumVisibleBubbles: 3,
  maximumChatHistory: 80,
  maximumViewportOperations: 8
} as const;

export interface ClassroomOwnerBaselineObservation {
  initialRender: {
    rendered: boolean;
    workerCount: number;
  };
  twentyWorkerUpdate: {
    applied: boolean;
    workerCount: number;
  };
  visibleBubbleCount: number;
  retainedChatMessageCount: number;
  viewport: {
    zoomOperations: number;
    panOperations: number;
    workerCount: number;
  };
  security: {
    executionBypassObserved: boolean;
    secretExposureObserved: boolean;
    privateTranscriptExposureObserved: boolean;
    rawChainOfThoughtExposureObserved: boolean;
    automaticPushObserved: boolean;
    newDependencyObserved: boolean;
  };
}

export type ClassroomOwnerBaselineCheck =
  | "initial-render"
  | "twenty-worker-update"
  | "bubble-limit"
  | "chat-history-limit"
  | "constant-time-viewport"
  | "no-execution-bypass"
  | "no-secret-exposure"
  | "no-private-transcript"
  | "no-raw-chain-of-thought"
  | "no-automatic-push"
  | "no-new-dependency";

export interface ClassroomOwnerBaselineAssertion {
  check: ClassroomOwnerBaselineCheck;
  passed: boolean;
  observed: number | boolean;
  expected: string;
}

export interface ClassroomOwnerBaselineEvidence {
  name: typeof CLASSROOM_OWNER_BASELINE_NAME;
  assertions: readonly ClassroomOwnerBaselineAssertion[];
  passed: boolean;
}

function finiteNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Evaluates supplied observations only. This function does not claim that a runtime,
 * repository, transport, or credential store was inspected.
 */
export function evaluateClassroomOwnerBaseline(
  observation: ClassroomOwnerBaselineObservation
): ClassroomOwnerBaselineEvidence {
  const viewportOperations = observation.viewport.zoomOperations + observation.viewport.panOperations;
  const assertions: ClassroomOwnerBaselineAssertion[] = [
    {
      check: "initial-render",
      passed: observation.initialRender.rendered &&
        finiteNonNegativeInteger(observation.initialRender.workerCount) &&
        observation.initialRender.workerCount <= CLASSROOM_OWNER_LIMITS.maximumWorkers,
      observed: observation.initialRender.workerCount,
      expected: "rendered with 0-20 workers"
    },
    {
      check: "twenty-worker-update",
      passed: observation.twentyWorkerUpdate.applied && observation.twentyWorkerUpdate.workerCount === 20,
      observed: observation.twentyWorkerUpdate.workerCount,
      expected: "applied update with exactly 20 workers"
    },
    {
      check: "bubble-limit",
      passed: finiteNonNegativeInteger(observation.visibleBubbleCount) &&
        observation.visibleBubbleCount <= CLASSROOM_OWNER_LIMITS.maximumVisibleBubbles,
      observed: observation.visibleBubbleCount,
      expected: "at most 3 visible bubbles"
    },
    {
      check: "chat-history-limit",
      passed: finiteNonNegativeInteger(observation.retainedChatMessageCount) &&
        observation.retainedChatMessageCount <= CLASSROOM_OWNER_LIMITS.maximumChatHistory,
      observed: observation.retainedChatMessageCount,
      expected: "at most 80 retained chat messages"
    },
    {
      check: "constant-time-viewport",
      passed: finiteNonNegativeInteger(observation.viewport.zoomOperations) &&
        finiteNonNegativeInteger(observation.viewport.panOperations) &&
        finiteNonNegativeInteger(observation.viewport.workerCount) &&
        observation.viewport.workerCount <= CLASSROOM_OWNER_LIMITS.maximumWorkers &&
        viewportOperations <= CLASSROOM_OWNER_LIMITS.maximumViewportOperations,
      observed: viewportOperations,
      expected: "at most 8 zoom/pan operations, independent of up to 20 workers"
    },
    {
      check: "no-execution-bypass",
      passed: !observation.security.executionBypassObserved,
      observed: observation.security.executionBypassObserved,
      expected: "false"
    },
    {
      check: "no-secret-exposure",
      passed: !observation.security.secretExposureObserved,
      observed: observation.security.secretExposureObserved,
      expected: "false"
    },
    {
      check: "no-private-transcript",
      passed: !observation.security.privateTranscriptExposureObserved,
      observed: observation.security.privateTranscriptExposureObserved,
      expected: "false"
    },
    {
      check: "no-raw-chain-of-thought",
      passed: !observation.security.rawChainOfThoughtExposureObserved,
      observed: observation.security.rawChainOfThoughtExposureObserved,
      expected: "false"
    },
    {
      check: "no-automatic-push",
      passed: !observation.security.automaticPushObserved,
      observed: observation.security.automaticPushObserved,
      expected: "false"
    },
    {
      check: "no-new-dependency",
      passed: !observation.security.newDependencyObserved,
      observed: observation.security.newDependencyObserved,
      expected: "false"
    }
  ];

  return {
    name: CLASSROOM_OWNER_BASELINE_NAME,
    assertions,
    passed: assertions.every((assertion) => assertion.passed)
  };
}

export type ClassroomRecoveryCondition =
  | "legacy-snapshot"
  | "malformed-snapshot"
  | "unknown-command-or-event"
  | "duplicate-dispatch-or-report"
  | "orphan-job"
  | "missing-profile"
  | "invalid-seat"
  | "lost-runtime"
  | "blocked-approval";

export type ClassroomRecoveryState =
  | "truthful-empty"
  | "repaired"
  | "blocked"
  | "limited-read-only";

export interface ClassroomRecoveryEvidence {
  condition: ClassroomRecoveryCondition;
  state: ClassroomRecoveryState;
  preservesDurableTruth: true;
  permitsMutation: boolean;
  explanation: string;
}

const RECOVERY_CONTRACTS: Readonly<Record<ClassroomRecoveryCondition, Omit<ClassroomRecoveryEvidence, "condition">>> = {
  "legacy-snapshot": {
    state: "truthful-empty",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Keep the legacy run valid while presenting no invented Classroom participants."
  },
  "malformed-snapshot": {
    state: "truthful-empty",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Reject malformed content and present no invented participants or activity."
  },
  "unknown-command-or-event": {
    state: "limited-read-only",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Keep known durable state visible but do not execute unknown input."
  },
  "duplicate-dispatch-or-report": {
    state: "repaired",
    preservesDurableTruth: true,
    permitsMutation: true,
    explanation: "Deduplicate by durable identity and retain one canonical record."
  },
  "orphan-job": {
    state: "limited-read-only",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Expose the orphan truthfully for inspection without guessing ownership."
  },
  "missing-profile": {
    state: "blocked",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Block dispatch until an executable model and reasoning profile exists."
  },
  "invalid-seat": {
    state: "truthful-empty",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Reject the invalid participant envelope instead of inventing a replacement seat."
  },
  "lost-runtime": {
    state: "limited-read-only",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Keep the last durable snapshot readable and disable runtime actions."
  },
  "blocked-approval": {
    state: "blocked",
    preservesDurableTruth: true,
    permitsMutation: false,
    explanation: "Show the pending approval boundary and perform no automatic approval."
  }
};

/** Returns the deterministic recovery contract for one explicitly observed condition. */
export function classifyClassroomRecovery(condition: ClassroomRecoveryCondition): ClassroomRecoveryEvidence {
  return { condition, ...RECOVERY_CONTRACTS[condition] };
}

export function classroomRecoveryBaseline(): readonly ClassroomRecoveryEvidence[] {
  return (Object.keys(RECOVERY_CONTRACTS) as ClassroomRecoveryCondition[]).map(classifyClassroomRecovery);
}
