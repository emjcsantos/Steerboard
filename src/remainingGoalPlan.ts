import {
  currentProjectManagementPhaseEpicIds,
  currentProjectManagementPhasePlanTaskIds
} from "./projectManagementPhasePlan";

export type RemainingGoalStatus = "blocked" | "active" | "next" | "planned" | "paused";
export type RemainingGoalPriority = "critical" | "high" | "medium";

export interface RemainingGoalPlanItem {
  id: string;
  target: string;
  phases: string[];
  phaseIds: string[];
  goal: string;
  status: RemainingGoalStatus;
  priority: RemainingGoalPriority;
  completionPercent: number;
  pmTaskIds: string[];
  nextAction: string;
  current?: boolean;
}

export interface RemainingGoalPlanTrace {
  goalId: string;
  target: string;
  status: RemainingGoalStatus;
  priority: RemainingGoalPriority;
  completionPercent: number;
  phaseIds: string[];
  pmTaskIds: string[];
  nextAction: string;
  current: boolean;
}

export interface RemainingGoalPlanSummary {
  total: number;
  blocked: number;
  active: number;
  next: number;
  planned: number;
  paused: number;
  averageCompletionPercent: number;
  currentTarget: string;
  currentNextAction: string;
  ownerHoldTarget: string;
  ownerHoldNextAction: string;
  coveredPhaseCount: number;
  remainingPhaseCount: number;
  priorityGoalTraceCount: number;
  priorityGoalTraces: RemainingGoalPlanTrace[];
}

export const remainingProjectManagementPhaseIds = [
  "phase-01-live-chat",
  "phase-02-multi-panel",
  "phase-03-controls-slash",
  "phase-04-provider-surfaces",
  "phase-05-migration-center",
  "phase-06-planning-lane",
  "phase-07-dispatch-loop",
  "phase-08-permissions-audit",
  "phase-09-desktop-runner",
  "phase-10-adaptive-arena",
  "phase-11-owner-packaging"
];

export const remainingGoalPlan: RemainingGoalPlanItem[] = [
  {
    id: "goal-phase-1-2-6-publish",
    target: "Unblock Phase 1/2/6 publishing",
    phases: ["Phase 1", "Phase 2", "Phase 6"],
    phaseIds: ["phase-01-live-chat", "phase-02-multi-panel", "phase-06-planning-lane"],
    goal:
      "Hold the completed priority slice locally until the Steerboard public remote is restored and the owner approves pushing.",
    status: "blocked",
    priority: "critical",
    completionPercent: 95,
    pmTaskIds: [
      "phase-01-live-chat",
      "phase-01-parent-single-panel",
      "phase-02-multi-panel",
      "phase-02-parent-panel-identity",
      "phase-06-planning-lane",
      "phase-06-parent-phase-board"
    ],
    nextAction:
      "Keep the branch local, preserve the proof commit, and push only after the remote is recreated and the owner says to push."
  },
  {
    id: "goal-phase-3-proof-clearance",
    target: "Phase 3 desktop proof clearance",
    phases: ["Phase 3"],
    phaseIds: ["phase-03-controls-slash"],
    goal:
      "Clear live-control, active-turn interrupt, active-turn steer, slash, and session-control proof rows from desktop mode with prioritized blocker review and goal/PM traceability.",
    status: "active",
    priority: "critical",
    completionPercent: 92,
    current: true,
    pmTaskIds: [
      "phase-03-controls-slash",
      "phase-03-parent-proof-clearance",
      "phase-03-child-smoke-rows",
      "phase-03-child-exit-gate",
      "phase-03-child-command-plan",
      "phase-03-child-blocker-priority",
      "phase-03-child-traceability",
      "phase-03-child-handoff-gate",
      "phase-03-parent-slash-controls",
      "phase-03-child-slash-ready",
      "phase-03-child-control-ready"
    ],
    nextAction:
      "Use the Phase 3 command plan, blocker-priority queue, traceability rows, and handoff gate to clear the exact top blocker, keep the active goal linked to every required PM child, run the held desktop smoke command only when it matches the blocker, record owner handoff only after exit-ready, and keep Phase 4 held behind the provider boundary."
  },
  {
    id: "goal-phase-4-provider-surfaces",
    target: "Provider integration surfaces",
    phases: ["Phase 4"],
    phaseIds: ["phase-04-provider-surfaces"],
    goal:
      "Harden command, skill, plugin, MCP, automation, and personalization readiness states while keeping refresh metadata-only.",
    status: "next",
    priority: "high",
    completionPercent: 45,
    pmTaskIds: [
      "phase-04-provider-surfaces",
      "phase-04-parent-catalogs",
      "phase-04-child-command-skill",
      "phase-04-child-plugin-mcp",
      "phase-04-child-catalog-depth",
      "phase-04-child-surface-depth",
      "phase-04-child-traceability",
      "phase-04-child-blocker-priority",
      "phase-04-parent-refresh-safety",
      "phase-04-child-refresh-smoke",
      "phase-04-child-refresh-safety-depth"
    ],
    nextAction:
      "Use the Phase 4 Provider Readiness catalog depth, Refresh Safety depth, Surface Depth, traceability, and blocker-priority panels to resolve source coverage, setup blockers, capability gaps, preview rows, metadata-only refresh proof, PM links, and execution locks before provider execution is considered."
  },
  {
    id: "goal-phase-5-migration-hardening",
    target: "Migration Center hardening",
    phases: ["Phase 5"],
    phaseIds: ["phase-05-migration-center"],
    goal:
      "Finish preview, apply-intent lock, rollback evidence, audit consistency, sensitive exclusions, and review-depth records for metadata-only migration work.",
    status: "next",
    priority: "high",
    completionPercent: 50,
    pmTaskIds: [
      "phase-05-migration-center",
      "phase-05-parent-draft-workflow",
      "phase-05-child-profile-drafts",
      "phase-05-child-preview-metadata",
      "phase-05-parent-rollback-audit",
      "phase-05-child-audit-summary",
      "phase-05-child-review-depth",
      "phase-05-child-traceability",
      "phase-05-child-blocker-priority"
    ],
    nextAction:
      "Use the Migration review gate, traceability rows, and blocker-priority queue to keep apply intent locked, link PM child rows, confirm rollback evidence, repair audit blockers, verify sensitive exclusions, rank the exact top blocker, and keep profile activation locked before any migration apply path."
  },
  {
    id: "goal-phase-7-dispatch-loop",
    target: "Planning and dispatch loop",
    phases: ["Phase 7"],
    phaseIds: ["phase-07-dispatch-loop"],
    goal:
      "Turn staged PM work into orchestrator, implementer, validator, and integration handoff packets with visible attempt limits, dispatch review depth, main integration ownership, validation gates, and live-worker locks.",
    status: "next",
    priority: "high",
    completionPercent: 50,
    pmTaskIds: [
      "phase-07-dispatch-loop",
      "phase-07-parent-role-panels",
      "phase-07-child-worker-preview",
      "phase-07-child-integration-owner",
      "phase-07-child-integration-ownership-depth",
      "phase-07-parent-observed-loop",
      "phase-07-child-handoff-trace",
      "phase-07-child-review-depth"
    ],
    nextAction:
      "Use dispatch review records, review-depth checks, and integration ownership rows to audit role counts, attempt limits, handoff tasks, final validation ownership, commit/push/reporting ownership, traceability, closure boundaries, and live-worker execution locks before any live worker session spawning."
  },
  {
    id: "goal-phase-8-permission-audit",
    target: "Permission and audit depth",
    phases: ["Phase 8"],
    phaseIds: ["phase-08-permissions-audit"],
    goal:
      "Expand approval gates, risk exceptions, disabled-path explanations, audit persistence, and rollback evidence before mutation paths grow.",
    status: "next",
    priority: "high",
    completionPercent: 50,
    pmTaskIds: [
      "phase-08-permissions-audit",
      "phase-08-parent-risk-gates",
      "phase-08-child-permission-labels",
      "phase-08-child-risk-blockers",
      "phase-08-child-risk-exceptions",
      "phase-08-child-traceability",
      "phase-08-child-blocker-priority",
      "phase-08-parent-audit-log",
      "phase-08-child-audit-persistence"
    ],
    nextAction:
      "Use the Phase 8 Audit Depth, risk traceability rows, and blocker-priority queue to resolve risk exceptions, disabled paths, PM child links, evidence keys, missing permission, approval, audit persistence, rollback explanations, and the exact top blocker before mutation paths grow."
  },
  {
    id: "goal-phase-9-runner",
    target: "Desktop-backed runner approval",
    phases: ["Phase 9"],
    phaseIds: ["phase-09-desktop-runner"],
    goal:
      "Allow the fixed terminal read-only desktop probe only after permission, audit, validation, and rollback gates pass.",
    status: "next",
    priority: "high",
    completionPercent: 40,
    pmTaskIds: [
      "phase-09-desktop-runner",
      "phase-09-parent-runner-probe",
      "phase-09-child-reversible-action",
      "phase-09-child-runner-observability",
      "phase-09-child-traceability",
      "phase-09-parent-approval-flow",
      "phase-09-child-approval-record",
      "phase-09-child-approval-depth"
    ],
    nextAction:
      "Use the Phase 9 Runner Approval depth and traceability records to keep the terminal-readonly-probe selected, linked to PM child rows, uniquely evidenced, owner-approved, previewed, validated, audited, rollback-safe, gated by Phase 8, and locked away from broad desktop mutation paths."
  },
  {
    id: "goal-phase-10-arena-polish",
    target: "Adaptive Arena polish",
    phases: ["Phase 10"],
    phaseIds: ["phase-10-adaptive-arena"],
    goal:
      "Polish adaptive layout, density, keyboard controls, focus state, and Arena terminology after core live proof clears.",
    status: "next",
    priority: "medium",
    completionPercent: 55,
    pmTaskIds: [
      "phase-10-adaptive-arena",
      "phase-10-parent-layout-foundation",
      "phase-10-child-layout-regression",
      "phase-10-child-density-polish",
      "phase-10-parent-arena-identity",
      "phase-10-child-term-scan"
    ],
    nextAction:
      "Use the Phase 10 Arena Polish panel to verify adaptive layout regression, density, keyboard controls, focus state, terminology, and acceptance gates."
  },
  {
    id: "goal-phase-11-owner-command-center",
    target: "Owner Testing command center",
    phases: ["Phase 11"],
    phaseIds: ["phase-11-owner-packaging"],
    goal:
      "Make Owner Testing the single pass-fail release gate for proof freshness, blockers, phase readiness, and next actions.",
    status: "next",
    priority: "high",
    completionPercent: 55,
    pmTaskIds: [
      "phase-11-owner-packaging",
      "phase-11-parent-owner-testing",
      "phase-11-child-owner-checklist",
      "phase-11-child-proof-freshness-depth",
      "phase-11-child-evidence-records",
      "phase-11-child-fresh-checkout"
    ],
    nextAction:
      "Use the Phase 11 Owner Command, Proof Freshness, and Evidence Records panels to review checklist coverage, proof freshness depth, blockers, phase readiness, next action, and fresh-checkout evidence."
  },
  {
    id: "goal-phase-11-release-readiness",
    target: "Release readiness pass",
    phases: ["Phase 11"],
    phaseIds: ["phase-11-owner-packaging"],
    goal:
      "Coordinate the final clean-checkout, build, smoke, packaging-lock, docs, known-limits, and release-decision pass before release.",
    status: "paused",
    priority: "medium",
    completionPercent: 20,
    pmTaskIds: [
      "phase-11-owner-packaging",
      "phase-11-parent-release-packaging",
      "phase-11-child-package-validation"
    ],
    nextAction:
      "Use the Phase 11 Release Readiness panel to review clean checkout, build/test, smoke proof, packaging lock, docs and known limits, and the final release decision while packaging stays paused."
  }
];

const PRIORITY_ORDER: Record<RemainingGoalPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2
};

const STATUS_ORDER: Record<RemainingGoalStatus, number> = {
  blocked: 0,
  active: 1,
  next: 2,
  planned: 3,
  paused: 4
};

function compareGoalPriority(a: RemainingGoalPlanItem, b: RemainingGoalPlanItem): number {
  if (Boolean(a.current) !== Boolean(b.current)) {
    return a.current ? -1 : 1;
  }

  const priorityDelta = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const statusDelta = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (statusDelta !== 0) {
    return statusDelta;
  }

  const completionDelta = a.completionPercent - b.completionPercent;
  if (completionDelta !== 0) {
    return completionDelta;
  }

  return a.target.localeCompare(b.target);
}

export function buildRemainingGoalPriorityTraces(
  goals: readonly RemainingGoalPlanItem[] = remainingGoalPlan,
  limit = 8
): RemainingGoalPlanTrace[] {
  return [...goals]
    .sort(compareGoalPriority)
    .slice(0, Math.max(0, limit))
    .map((goal) => ({
      goalId: goal.id,
      target: goal.target,
      status: goal.status,
      priority: goal.priority,
      completionPercent: goal.completionPercent,
      phaseIds: [...goal.phaseIds],
      pmTaskIds: [...goal.pmTaskIds],
      nextAction: goal.nextAction,
      current: Boolean(goal.current)
    }));
}

export function summarizeRemainingGoalPlan(
  goals: readonly RemainingGoalPlanItem[] = remainingGoalPlan
): RemainingGoalPlanSummary {
  const summary: RemainingGoalPlanSummary = {
    total: goals.length,
    blocked: 0,
    active: 0,
    next: 0,
    planned: 0,
    paused: 0,
    averageCompletionPercent: 0,
    currentTarget: "No remaining goal",
    currentNextAction: "No remaining action.",
    ownerHoldTarget: "No owner hold",
    ownerHoldNextAction: "No owner hold action.",
    coveredPhaseCount: 0,
    remainingPhaseCount: remainingProjectManagementPhaseIds.length,
    priorityGoalTraceCount: 0,
    priorityGoalTraces: []
  };
  const coveredPhases = new Set<string>();

  for (const goal of goals) {
    summary[goal.status] += 1;
    summary.averageCompletionPercent += goal.completionPercent;
    for (const phaseId of goal.phaseIds) {
      coveredPhases.add(phaseId);
    }
  }

  const currentGoal =
    goals.find((goal) => goal.current && goal.status !== "blocked") ??
    goals.find((goal) => goal.status === "active") ??
    goals.find((goal) => goal.current) ??
    goals.find((goal) => goal.status === "blocked") ??
    goals.find((goal) => goal.status === "next") ??
    goals[0];
  const ownerHoldGoal =
    goals.find((goal) => goal.status === "blocked" && goal.priority === "critical") ??
    goals.find((goal) => goal.status === "blocked");

  if (currentGoal) {
    summary.currentTarget = currentGoal.target;
    summary.currentNextAction = currentGoal.nextAction;
  }
  if (ownerHoldGoal) {
    summary.ownerHoldTarget = ownerHoldGoal.target;
    summary.ownerHoldNextAction = ownerHoldGoal.nextAction;
  }

  if (summary.total > 0) {
    summary.averageCompletionPercent = Math.round(
      summary.averageCompletionPercent / summary.total
    );
  }

  summary.coveredPhaseCount = remainingProjectManagementPhaseIds.filter((phaseId) =>
    coveredPhases.has(phaseId)
  ).length;
  summary.priorityGoalTraces = buildRemainingGoalPriorityTraces(goals);
  summary.priorityGoalTraceCount = summary.priorityGoalTraces.length;

  return summary;
}

export function findRemainingGoalPlanIssues(
  goals: readonly RemainingGoalPlanItem[] = remainingGoalPlan
): string[] {
  const issues: string[] = [];
  const goalIds = new Set<string>();
  const coveredPhaseIds = new Set<string>();

  for (const goal of goals) {
    if (goalIds.has(goal.id)) {
      issues.push(`Duplicate remaining goal id: ${goal.id}`);
    }
    goalIds.add(goal.id);

    if (!goal.target.trim()) {
      issues.push(`Remaining goal ${goal.id} is missing a target.`);
    }
    if (!goal.goal.trim()) {
      issues.push(`Remaining goal ${goal.id} is missing a goal.`);
    }
    if (!goal.nextAction.trim()) {
      issues.push(`Remaining goal ${goal.id} is missing a next action.`);
    }
    if (!Number.isInteger(goal.completionPercent) || goal.completionPercent < 0 || goal.completionPercent > 100) {
      issues.push(`Remaining goal ${goal.id} has invalid completion.`);
    }

    for (const phaseId of goal.phaseIds) {
      coveredPhaseIds.add(phaseId);
      if (!currentProjectManagementPhaseEpicIds.has(phaseId)) {
        issues.push(`Remaining goal ${goal.id} references unknown phase ${phaseId}.`);
      }
    }

    for (const taskId of goal.pmTaskIds) {
      if (!currentProjectManagementPhasePlanTaskIds.has(taskId)) {
        issues.push(`Remaining goal ${goal.id} references unknown PM task ${taskId}.`);
      }
    }
  }

  for (const phaseId of remainingProjectManagementPhaseIds) {
    if (!coveredPhaseIds.has(phaseId)) {
      issues.push(`Remaining phase ${phaseId} has no goal coverage.`);
    }
  }

  return issues;
}
