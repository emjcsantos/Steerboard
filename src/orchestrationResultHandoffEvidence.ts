import type { OrchestrationTask } from "./orchestration";
import type { MockOrchestratorRun } from "./run";

export type OrchestrationResultHandoffTone =
  | "ready"
  | "review"
  | "blocked"
  | "empty";

export type OrchestrationResultHandoffCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface OrchestrationResultHandoffEvidence {
  label: string;
  detail: string;
  tone: OrchestrationResultHandoffTone;
  checkLabel: string;
  checks: OrchestrationResultHandoffCheck[];
  ariaLabel: string;
}

const RESULT_HANDOFF_LABELS: Record<OrchestrationResultHandoffTone, string> = {
  ready: "Result handoff ready",
  review: "Result handoff needs review",
  blocked: "Result handoff blocked",
  empty: "No result handoff evidence"
};

const RESULT_HANDOFF_DETAILS: Record<OrchestrationResultHandoffTone, string> = {
  ready:
    "Accepted results, propagation, integration handoff, and run evidence are ready for review.",
  review:
    "Some accepted-result or integration handoff evidence needs review before final orchestration.",
  blocked:
    "Resolve missing accepted-result, propagation, integration, or run evidence before final orchestration.",
  empty: "No accepted results, integration handoffs, or complete runs are available yet."
};

type Tone = OrchestrationResultHandoffCheck["tone"];

function getTone(count: number, total: number): Tone {
  if (total === 0) {
    return "neutral";
  }

  if (count === total) {
    return "ok";
  }

  if (count === 0) {
    return "blocked";
  }

  return "review";
}

function isAccepted(task: OrchestrationTask): boolean {
  return task.status === "accepted";
}

function hasEvidence(task: OrchestrationTask): boolean {
  return (
    task.acceptanceCriteria.length > 0 &&
    task.validationCommands.length > 0 &&
    task.fileOwnership.length > 0
  );
}

function isReadyIntegration(task: OrchestrationTask): boolean {
  return (
    task.dependencies.length > 0 &&
    task.scope.length > 0 &&
    task.acceptanceCriteria.length > 0 &&
    task.validationCommands.length > 0
  );
}

function isCompleteRunWithHandoffEvidence(run: MockOrchestratorRun): boolean {
  return (
    run.validationGates.length > 0 &&
    run.validationGates.every((gate) => gate.status === "passed") &&
    run.tasks.some((task) => task.status === "accepted")
  );
}

export function createOrchestrationResultHandoffEvidence(
  tasks: readonly OrchestrationTask[],
  runs: readonly MockOrchestratorRun[]
): OrchestrationResultHandoffEvidence {
  const acceptedTasks = tasks.filter(isAccepted);
  const acceptedCount = acceptedTasks.length;
  const integrationTasks = tasks.filter((task) => task.role === "integration");
  const integrationCount = integrationTasks.length;

  const acceptedWithEvidence = acceptedTasks.filter(hasEvidence).length;

  const propagatedAccepted = acceptedTasks.filter((acceptedTask) =>
    integrationTasks.some((integrationTask) => integrationTask.dependencies.includes(acceptedTask.id))
  ).length;

  const readyIntegration = integrationTasks.filter(isReadyIntegration).length;

  const completeRuns = runs.filter((run) => run.status === "complete");
  const completeRunCount = completeRuns.length;
  const completeRunsWithEvidence = completeRuns.filter(isCompleteRunWithHandoffEvidence).length;

  const checks: OrchestrationResultHandoffCheck[] = [
    {
      label: "Accepted results",
      value: `${acceptedWithEvidence}/${acceptedCount}`,
      tone: getTone(acceptedWithEvidence, acceptedCount)
    },
    {
      label: "Propagation",
      value: `${propagatedAccepted}/${acceptedCount}`,
      tone: getTone(propagatedAccepted, acceptedCount)
    },
    {
      label: "Integration handoff",
      value: `${readyIntegration}/${integrationCount}`,
      tone: getTone(readyIntegration, integrationCount)
    },
    {
      label: "Run evidence",
      value: `${completeRunsWithEvidence}/${completeRunCount}`,
      tone: getTone(completeRunsWithEvidence, completeRunCount)
    }
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;

  const tone: OrchestrationResultHandoffTone =
    acceptedCount === 0 && integrationCount === 0 && completeRunCount === 0
      ? "empty"
      : checks.some((check) => check.tone === "blocked")
      ? "blocked"
      : checks.some((check) => check.tone === "review")
      ? "review"
      : "ready";

  return {
    label: RESULT_HANDOFF_LABELS[tone],
    detail: RESULT_HANDOFF_DETAILS[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${RESULT_HANDOFF_LABELS[tone]}: ${checkLabel}; ` +
      `${acceptedCount} accepted results; ` +
      `${integrationCount} integration tasks; ` +
      `${completeRunCount} complete runs; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
