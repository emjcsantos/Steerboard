import type { OrchestrationTask } from "./orchestration";

export type OrchestrationDispatchAuditTone = "ready" | "review" | "blocked" | "empty";

export type OrchestrationDispatchAuditCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface OrchestrationDispatchAudit {
  label: string;
  detail: string;
  tone: OrchestrationDispatchAuditTone;
  checkLabel: string;
  checks: OrchestrationDispatchAuditCheck[];
  ariaLabel: string;
}

const LABEL_BY_TONE: Record<OrchestrationDispatchAuditTone, string> = {
  ready: "Dispatch sequencing ready",
  review: "Dispatch sequencing needs review",
  blocked: "Dispatch sequencing blocked",
  empty: "No dispatch sequencing"
};

const DETAIL_BY_TONE: Record<OrchestrationDispatchAuditTone, string> = {
  ready:
    "Queued, active, blocked, and dependency sequence signals are ready for orchestration handoff.",
  review: "Some orchestration handoff signals need review before dispatch.",
  blocked:
    "Resolve missing dispatch, audit, recovery, or sequencing signals before handoff.",
  empty: "No open orchestration tasks need dispatch sequencing yet."
};

function checkTone(total: number, ready: number): "ok" | "review" | "blocked" | "neutral" {
  if (total === 0) {
    return "neutral";
  }

  if (ready === total) {
    return "ok";
  }

  if (ready === 0) {
    return "blocked";
  }

  return "review";
}

export function createOrchestrationDispatchAudit(
  tasks: readonly OrchestrationTask[]
): OrchestrationDispatchAudit {
  const openTasks = tasks.filter((task) => task.status !== "accepted");
  const openCount = openTasks.length;

  const queuedTasks = openTasks.filter((task) => task.status === "queued");
  const activeTasks = openTasks.filter(
    (task) => task.status === "implementing" || task.status === "validating"
  );
  const blockedTasks = openTasks.filter(
    (task) => task.status === "blocked" || task.attempt >= task.attemptLimit
  );

  const queuedCount = queuedTasks.length;
  const activeCount = activeTasks.length;
  const blockedCount = blockedTasks.length;

  const dispatchableQueued = queuedTasks.filter(
    (task) =>
      task.dependencies.length > 0 &&
      task.fileOwnership.length > 0 &&
      task.validationCommands.length > 0
  ).length;

  const auditedActive = activeTasks.filter(
    (task) =>
      task.scope.length > 0 &&
      task.acceptanceCriteria.length > 0 &&
      task.validationCommands.length > 0
  ).length;

  const recoverableBlocked = blockedTasks.filter(
    (task) => task.rollback.trim().length > 0 && task.validationCommands.length > 0
  ).length;

  const sequenced = openTasks.filter(
    (task) => task.dependencies.length > 0 || task.role === "planning"
  ).length;

  const checks: OrchestrationDispatchAuditCheck[] = [
    { label: "Queued", value: `${dispatchableQueued}/${queuedCount}`, tone: checkTone(queuedCount, dispatchableQueued) },
    { label: "Active audit", value: `${auditedActive}/${activeCount}`, tone: checkTone(activeCount, auditedActive) },
    { label: "Blocked recovery", value: `${recoverableBlocked}/${blockedCount}`, tone: checkTone(blockedCount, recoverableBlocked) },
    { label: "Sequence", value: `${sequenced}/${openCount}`, tone: checkTone(openCount, sequenced) }
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;

  const tone: OrchestrationDispatchAuditTone =
    openCount === 0
      ? "empty"
      : checks.some((check) => check.tone === "blocked")
      ? "blocked"
      : checks.some((check) => check.tone === "review")
      ? "review"
      : "ready";

  return {
    label: LABEL_BY_TONE[tone],
    detail: DETAIL_BY_TONE[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${LABEL_BY_TONE[tone]}: ${checkLabel}; ` +
      `${openCount} open tasks; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
