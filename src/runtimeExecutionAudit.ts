import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";

export type RuntimeExecutionAuditState = "waiting" | "ready" | "pending" | "blocked";

export type RuntimeExecutionAuditItemStatus =
  | "waiting"
  | "ready"
  | "locked"
  | "blocked";

export interface RuntimeExecutionAuditItem {
  id: string;
  label: string;
  status: RuntimeExecutionAuditItemStatus;
  detail: string;
}

export interface RuntimeExecutionAuditSnapshot {
  id: string;
  label: string;
  state: RuntimeExecutionAuditState;
  statusLabel: string;
  eventCount: number;
  transport: string;
  canExecute: boolean;
  executionLocked: boolean;
  requiresDesktopApproval: boolean;
  detail: string;
  safety: string;
  items: RuntimeExecutionAuditItem[];
}

const AUDIT_SAFETY = "Audit preview only. Runtime execution remains locked.";

function deriveLaunchRequestItemStatus(
  request: RuntimeLaunchRequestSnapshot
): RuntimeExecutionAuditItemStatus {
  if (request.state === "blocked") {
    return "blocked";
  }
  if (request.canRequest) {
    return "ready";
  }
  return "waiting";
}

function deriveLocalApprovalItemStatus(
  approval: RuntimeLaunchApprovalSnapshot
): RuntimeExecutionAuditItemStatus {
  if (approval.state === "blocked") {
    return "blocked";
  }
  if (approval.state === "requested") {
    return "ready";
  }
  return "waiting";
}

export function buildRuntimeExecutionAuditSnapshot(
  request: RuntimeLaunchRequestSnapshot,
  approval: RuntimeLaunchApprovalSnapshot
): RuntimeExecutionAuditSnapshot {
  if (request.state === "blocked" || approval.state === "blocked") {
    return {
      id: `${approval.id}:execution-audit`,
      label: `${approval.label} execution audit`,
      state: "blocked",
      statusLabel: "Blocked",
      eventCount: request.eventCount,
      transport: request.transport,
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: false,
      detail: "Execution audit is blocked by launch readiness.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${request.id}:launch-request`,
          label: "Launch request",
          status: deriveLaunchRequestItemStatus(request),
          detail: "Launch request is blocked and must clear before execution."
        },
        {
          id: `${approval.id}:local-approval`,
          label: "Local approval",
          status: deriveLocalApprovalItemStatus(approval),
          detail: "Local approval is blocked and cannot proceed."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    };
  }

  if (approval.state === "requested") {
    return {
      id: `${approval.id}:execution-audit`,
      label: `${approval.label} execution audit`,
      state: "pending",
      statusLabel: "Pending",
      eventCount: request.eventCount,
      transport: request.transport,
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: true,
      detail: "Local approval is queued and desktop execution remains locked.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${request.id}:launch-request`,
          label: "Launch request",
          status: deriveLaunchRequestItemStatus(request),
          detail: "Launch request is waiting for execution setup."
        },
        {
          id: `${approval.id}:local-approval`,
          label: "Local approval",
          status: deriveLocalApprovalItemStatus(approval),
          detail: "Local approval has been requested and is pending."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    };
  }

  if (request.canRequest && approval.state === "requestable") {
    return {
      id: `${approval.id}:execution-audit`,
      label: `${approval.label} execution audit`,
      state: "ready",
      statusLabel: "Ready",
      eventCount: request.eventCount,
      transport: request.transport,
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: true,
      detail: "Execution audit is ready after approval request.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${request.id}:launch-request`,
          label: "Launch request",
          status: deriveLaunchRequestItemStatus(request),
          detail: "Launch request is ready to proceed."
        },
        {
          id: `${approval.id}:local-approval`,
          label: "Local approval",
          status: deriveLocalApprovalItemStatus(approval),
          detail: "Local approval is ready to be requested."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    };
  }

  return {
    id: `${approval.id}:execution-audit`,
    label: `${approval.label} execution audit`,
    state: "waiting",
    statusLabel: "Waiting",
    eventCount: request.eventCount,
    transport: request.transport,
    canExecute: false,
    executionLocked: true,
    requiresDesktopApproval: request.requiresApproval,
    detail: approval.detail,
    safety: AUDIT_SAFETY,
    items: [
      {
        id: `${request.id}:launch-request`,
        label: "Launch request",
        status: deriveLaunchRequestItemStatus(request),
        detail: "Launch request is waiting for readiness."
      },
      {
        id: `${approval.id}:local-approval`,
        label: "Local approval",
        status: deriveLocalApprovalItemStatus(approval),
        detail: "Local approval is waiting for action."
      },
      {
        id: `${approval.id}:execution-lock`,
        label: "Execution lock",
        status: "locked",
        detail: "Runtime execution is unavailable in this preview."
      }
    ]
  };
}
