import type { OrchestrationTask } from "./orchestration";
import { createOrchestrationDependencyReadiness } from "./orchestrationDependencyReadiness";
import { createOrchestrationDispatchAudit } from "./orchestrationDispatchAudit";
import { createOrchestrationResultHandoffEvidence } from "./orchestrationResultHandoffEvidence";
import type { MockOrchestratorRun } from "./run";

export type OrchestrationAcceptanceCoverageTone = "accepted" | "review" | "blocked" | "empty";

export type OrchestrationAcceptanceCoverageCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface OrchestrationAcceptanceCoverage {
  label: string;
  detail: string;
  tone: OrchestrationAcceptanceCoverageTone;
  checkLabel: string;
  checks: OrchestrationAcceptanceCoverageCheck[];
  ariaLabel: string;
}

const ACCEPTANCE_LABEL: Record<OrchestrationAcceptanceCoverageTone, string> = {
  accepted: "Orchestration acceptance covered",
  review: "Orchestration acceptance needs review",
  blocked: "Orchestration acceptance blocked",
  empty: "No orchestration acceptance coverage"
};

const ACCEPTANCE_DETAIL: Record<OrchestrationAcceptanceCoverageTone, string> = {
  accepted:
    "Lifecycle signals, task coverage, regression checks, and run closure evidence are covered for orchestration review.",
  review:
    "Some orchestration acceptance coverage needs review before the milestone is treated as stable.",
  blocked:
    "Resolve missing lifecycle, task, regression, or run closure coverage before closing orchestration.",
  empty: "No orchestration tasks or runs are available for acceptance coverage yet."
};

function isCompleteRunWithClosedEvidence(run: MockOrchestratorRun): boolean {
  return (
    run.validationGates.length > 0 &&
    run.validationGates.every((gate) => gate.status === "passed") &&
    run.tasks.some((task) => task.status === "accepted")
  );
}

function checkCoverageTone(available: number, total: number): "ok" | "review" | "blocked" | "neutral" {
  if (total === 0) {
    return "neutral";
  }

  if (available === total) {
    return "ok";
  }

  if (available === 0) {
    return "blocked";
  }

  return "review";
}

export function createOrchestrationAcceptanceCoverage(
  tasks: readonly OrchestrationTask[],
  runs: readonly MockOrchestratorRun[]
): OrchestrationAcceptanceCoverage {
  const dependencyReadiness = createOrchestrationDependencyReadiness(tasks);
  const dispatchAudit = createOrchestrationDispatchAudit(tasks);
  const resultHandoffEvidence = createOrchestrationResultHandoffEvidence(tasks, runs);

  const completeRuns = runs.filter((run) => run.status === "complete");
  const completeRunCount = completeRuns.length;
  const closedCompleteRuns = completeRuns.filter(isCompleteRunWithClosedEvidence).length;
  const taskCount = tasks.length;

  const coveredTasks = tasks.filter((task) =>
    task.scope.length > 0 &&
    task.fileOwnership.length > 0 &&
    task.acceptanceCriteria.length > 0 &&
    task.validationCommands.length > 0
  ).length;

  const regressionReadyTasks = tasks.filter((task) => task.validationCommands.length > 0).length;

  const availableLifecycleSignals = [
    dependencyReadiness.tone,
    dispatchAudit.tone,
    resultHandoffEvidence.tone
  ].filter((tone) => tone !== "empty").length;

  const checks: OrchestrationAcceptanceCoverageCheck[] = [
    {
      label: "Lifecycle signals",
      value: `${availableLifecycleSignals}/3`,
      tone:
        availableLifecycleSignals === 0
          ? "blocked"
          : availableLifecycleSignals === 3
          ? "ok"
          : "review"
    },
    {
      label: "Task coverage",
      value: `${coveredTasks}/${taskCount}`,
      tone: checkCoverageTone(coveredTasks, taskCount)
    },
    {
      label: "Regression checks",
      value: `${regressionReadyTasks}/${taskCount}`,
      tone: checkCoverageTone(regressionReadyTasks, taskCount)
    },
    {
      label: "Run closure",
      value: `${closedCompleteRuns}/${completeRunCount}`,
      tone: checkCoverageTone(closedCompleteRuns, completeRunCount)
    }
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;

  const tone: OrchestrationAcceptanceCoverageTone =
    taskCount === 0 && runs.length === 0
      ? "empty"
      : checks.some((check) => check.tone === "blocked")
      ? "blocked"
      : checks.some((check) => check.tone === "review")
      ? "review"
      : "accepted";

  return {
    label: ACCEPTANCE_LABEL[tone],
    detail: ACCEPTANCE_DETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${ACCEPTANCE_LABEL[tone]}: ${checkLabel}; ` +
      `${taskCount} tasks; ` +
      `${runs.length} runs; ` +
      `${completeRunCount} complete runs; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
