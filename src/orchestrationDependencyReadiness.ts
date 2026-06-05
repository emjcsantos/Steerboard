import type { OrchestrationTask } from "./orchestration";

export type OrchestrationDependencyReadinessTone =
  | "ready"
  | "review"
  | "blocked"
  | "empty";

export type OrchestrationDependencyReadinessCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface OrchestrationDependencyReadiness {
  label: string;
  detail: string;
  tone: OrchestrationDependencyReadinessTone;
  checkLabel: string;
  checks: OrchestrationDependencyReadinessCheck[];
  ariaLabel: string;
}

const READINESS_LABEL: Record<OrchestrationDependencyReadinessTone, string> = {
  ready: "Orchestration dependencies ready",
  review: "Orchestration dependencies need review",
  blocked: "Orchestration dependencies blocked",
  empty: "No orchestration dependencies"
};

const READINESS_DETAIL: Record<OrchestrationDependencyReadinessTone, string> = {
  ready:
    "Open tasks have dependency, file ownership, validation, and retry signals for sequencing.",
  review:
    "Some open tasks need dependency, file ownership, validation, or retry review before sequencing.",
  blocked:
    "Resolve missing or conflicting orchestration signals before sequencing work.",
  empty: "No open orchestration tasks need sequencing yet."
};

function hasDuplicateOwnership(tasks: readonly OrchestrationTask[]): boolean {
  const seen = new Set<string>();

  for (const task of tasks) {
    const taskPaths = new Set(task.fileOwnership);

    for (const path of taskPaths) {
      if (seen.has(path)) {
        return true;
      }

      seen.add(path);
    }
  }

  return false;
}

function checkTone(
  openCount: number,
  readyCount: number
): "ok" | "review" | "blocked" | "neutral" {
  if (openCount === 0) {
    return "neutral";
  }

  if (readyCount === openCount) {
    return "ok";
  }

  if (readyCount === 0) {
    return "blocked";
  }

  return "review";
}

export function createOrchestrationDependencyReadiness(
  tasks: readonly OrchestrationTask[]
): OrchestrationDependencyReadiness {
  const openTasks = tasks.filter((task) => task.status !== "accepted");
  const openCount = openTasks.length;

  const dependencyReady = openTasks.filter((task) => task.dependencies.length > 0).length;
  const validationReady = openTasks.filter((task) => task.validationCommands.length > 0).length;
  const ownershipReady = openTasks.filter(
    (task) => task.fileOwnership.length > 0
  ).length;
  const blockedAttempts = openTasks.filter(
    (task) => task.status === "blocked" || task.attempt >= task.attemptLimit
  ).length;
  const hasDuplicateFileOwnership = hasDuplicateOwnership(openTasks);

  const dependencyTone = checkTone(openCount, dependencyReady);
  const validationTone = checkTone(openCount, validationReady);
  const retryTone =
    openCount === 0
      ? "neutral"
      : blockedAttempts === 0
      ? "ok"
      : blockedAttempts === openCount
      ? "blocked"
      : "review";

  const fileScopeTone =
    openCount === 0
      ? "neutral"
      : hasDuplicateFileOwnership
      ? "blocked"
      : checkTone(openCount, ownershipReady);

  const checks: OrchestrationDependencyReadinessCheck[] = [
    {
      label: "Dependencies",
      value: `${dependencyReady}/${openCount}`,
      tone: dependencyTone
    },
    {
      label: "File scope",
      value: `${ownershipReady}/${openCount}`,
      tone: fileScopeTone
    },
    {
      label: "Validation",
      value: `${validationReady}/${openCount}`,
      tone: validationTone
    },
    {
      label: "Retry",
      value: `${blockedAttempts}/${openCount} at limit`,
      tone: retryTone
    }
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;

  const tone: OrchestrationDependencyReadinessTone =
    openCount === 0
      ? "empty"
      : checks.some((check) => check.tone === "blocked")
      ? "blocked"
      : checks.some((check) => check.tone === "review")
      ? "review"
      : "ready";

  return {
    label: READINESS_LABEL[tone],
    detail: READINESS_DETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${READINESS_LABEL[tone]}: ${checkLabel}; ` +
      `${openCount} open tasks; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
