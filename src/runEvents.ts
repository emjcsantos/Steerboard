import type {
  MockOrchestratorRun,
  MockRunSessionSummary,
  MockValidationGate
} from "./run";
import type { OrchestrationTask } from "./orchestration";

export type RunTimelineEventKind = "run" | "task" | "session" | "validation";

export interface RunTimelineEvent {
  id: string;
  kind: RunTimelineEventKind;
  label: string;
  detail: string;
  actor: string;
  status: string;
  sequence: number;
  createdAt: string;
}

export interface RunTimelineSummary {
  total: number;
  byKind: Record<RunTimelineEventKind, number>;
  activeCount: number;
  issueCount: number;
  completeCount: number;
}

const ACTIVE_STATUSES = new Set(["running", "implementing", "validating", "pending"]);
const ISSUE_STATUSES = new Set(["blocked", "failed"]);
const COMPLETE_STATUSES = new Set(["complete", "accepted", "passed"]);

function isActiveStatus(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

function isIssueStatus(status: string): boolean {
  return ISSUE_STATUSES.has(status);
}

function isCompleteStatus(status: string): boolean {
  return COMPLETE_STATUSES.has(status);
}

function buildTaskDetail(task: OrchestrationTask): string {
  const command = task.validationCommands[0] ?? "No validation command configured.";
  return `Role: ${task.role}; First validation command: ${command}`;
}

function buildSessionDetail(session: MockRunSessionSummary): string {
  return `Validation: ${session.validation}`;
}

function buildGateDetail(gate: MockValidationGate): string {
  return `Command: ${gate.command}`;
}

export function buildRunTimeline(run: MockOrchestratorRun): RunTimelineEvent[] {
  const events: RunTimelineEvent[] = [];
  let sequence = 0;

  events.push({
    id: `${run.id}:timeline:run`,
    kind: "run",
    label: `Run ${run.status}`,
    detail: run.title,
    actor: "Orchestrator",
    status: run.status,
    sequence: sequence++,
    createdAt: run.createdAt
  });

  for (const task of run.tasks) {
    events.push({
      id: `${run.id}:timeline:task:${task.id}`,
      kind: "task",
      label: task.title,
      detail: buildTaskDetail(task),
      actor: task.owner,
      status: task.status,
      sequence: sequence++,
      createdAt: run.createdAt
    });
  }

  for (const session of run.sessions) {
    events.push({
      id: `${run.id}:timeline:session:${session.id}`,
      kind: "session",
      label: session.title,
      detail: buildSessionDetail(session),
      actor: session.role,
      status: session.state,
      sequence: sequence++,
      createdAt: run.createdAt
    });
  }

  for (const gate of run.validationGates) {
    events.push({
      id: `${run.id}:timeline:gate:${gate.id}`,
      kind: "validation",
      label: gate.label,
      detail: buildGateDetail(gate),
      actor: "Validation",
      status: gate.status,
      sequence: sequence++,
      createdAt: run.createdAt
    });
  }

  return events;
}

export function summarizeRunTimeline(events: readonly RunTimelineEvent[]): RunTimelineSummary {
  return events.reduce<RunTimelineSummary>(
    (summary, event) => {
      summary.total += 1;
      summary.byKind[event.kind] += 1;

      if (isActiveStatus(event.status)) {
        summary.activeCount += 1;
      }

      if (isIssueStatus(event.status)) {
        summary.issueCount += 1;
      }

      if (isCompleteStatus(event.status)) {
        summary.completeCount += 1;
      }

      return summary;
    },
    {
      total: 0,
      byKind: {
        run: 0,
        task: 0,
        session: 0,
        validation: 0
      },
      activeCount: 0,
      issueCount: 0,
      completeCount: 0
    }
  );
}
