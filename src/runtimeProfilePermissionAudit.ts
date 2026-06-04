import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";

export type RuntimeProfilePermissionAuditState =
  | "blocked"
  | "waiting"
  | "ready"
  | "pending";

export type RuntimeProfilePermissionAuditItemStatus =
  | "blocked"
  | "waiting"
  | "ready"
  | "locked";

export interface RuntimeProfilePermissionAuditItem {
  id: string;
  label: string;
  status: RuntimeProfilePermissionAuditItemStatus;
  detail: string;
}

export interface RuntimeProfilePermissionAuditSnapshot {
  id: string;
  label: string;
  state: RuntimeProfilePermissionAuditState;
  statusLabel: string;
  readiness: number;
  executionLocked: boolean;
  canExport: boolean;
  recordCount: number;
  detail: string;
  safety: string;
  exportMarkdown: string;
  items: RuntimeProfilePermissionAuditItem[];
}

type RuntimeProfilePermissionAuditDraft = Omit<
  RuntimeProfilePermissionAuditSnapshot,
  "exportMarkdown"
>;

const AUDIT_SAFETY =
  "Audit preview only. No process execution, filesystem action, or network action is performed.";

function clampReadiness(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function buildPermissionApprovalItemStatus(
  approval: RuntimeProfilePermissionApprovalSnapshot
): RuntimeProfilePermissionAuditItemStatus {
  if (approval.state === "blocked") {
    return "blocked";
  }

  if (approval.state === "requested") {
    return "ready";
  }

  return "waiting";
}

function buildShellApprovalItemStatus(
  shell: DesktopPermissionApprovalStatus
): RuntimeProfilePermissionAuditItemStatus {
  if (shell.permissionGranted) {
    return "ready";
  }

  if (shell.state === "unavailable" || shell.state === "error") {
    return "blocked";
  }

  return "waiting";
}

function buildRecordHistoryItemStatus(
  recordCount: number
): RuntimeProfilePermissionAuditItemStatus {
  return recordCount > 0 ? "ready" : "waiting";
}

function buildAuditExportMarkdown(
  snapshot: RuntimeProfilePermissionAuditDraft,
  shell: DesktopPermissionApprovalStatus
): string {
  const itemLines = snapshot.items
    .map((item) => `- ${item.label}: ${item.status}`)
    .join("\n");

  return [
    `# ${snapshot.label}`,
    "## Permission Audit Preview",
    `- label: ${snapshot.label}`,
    `- state: ${snapshot.state}`,
    `- readiness: ${snapshot.readiness}`,
    `- recordCount: ${snapshot.recordCount}`,
    `- shellState: ${shell.state}`,
    `- permissionGranted: ${shell.permissionGranted ? "yes" : "no"}`,
    `- executionLocked: ${snapshot.executionLocked ? "yes" : "no"}`,
    `- detail: ${snapshot.detail}`,
    "## Items",
    itemLines
  ].join("\n");
}

export function buildRuntimeProfilePermissionAuditSnapshot(
  approval: RuntimeProfilePermissionApprovalSnapshot,
  shell: DesktopPermissionApprovalStatus,
  records: readonly RuntimeProfilePermissionRequestRecord[]
): RuntimeProfilePermissionAuditSnapshot {
  if (approval.state === "blocked") {
    const snapshot: RuntimeProfilePermissionAuditDraft = {
      id: `${approval.id}:permission-audit`,
      label: `${approval.label} audit`,
      state: "blocked",
      statusLabel: "Blocked",
      readiness: 0,
      executionLocked: true,
      canExport: false,
      recordCount: records.length,
      detail: "Audit is blocked by permission approval readiness.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${approval.id}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionApprovalItemStatus(approval),
          detail: "Permission approval is blocked by readiness."
        },
        {
          id: `${approval.id}:shell-approval`,
          label: "Shell approval",
          status: buildShellApprovalItemStatus(shell),
          detail: "Shell approval status is not available for export preview."
        },
        {
          id: `${approval.id}:request-history`,
          label: "Permission request history",
          status: buildRecordHistoryItemStatus(records.length),
          detail: "Recent permission request records are included for review."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution remains locked in this audit preview."
        }
      ]
    };

    return {
      ...snapshot,
      exportMarkdown: buildAuditExportMarkdown(snapshot, shell)
    };
  }

  const readiness = clampReadiness(approval.readiness);

  if (approval.state === "requested") {
    const snapshot: RuntimeProfilePermissionAuditDraft = {
      id: `${approval.id}:permission-audit`,
      label: `${approval.label} audit`,
      state: "pending",
      statusLabel: "Pending",
      readiness,
      executionLocked: true,
      canExport: true,
      recordCount: records.length,
      detail:
        "Permission request is queued locally and export preview is available for review.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${approval.id}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionApprovalItemStatus(approval),
          detail: "Permission request is queued and waiting for review."
        },
        {
          id: `${approval.id}:shell-approval`,
          label: "Shell approval",
          status: buildShellApprovalItemStatus(shell),
          detail: "Shell approval state is checked for preview consistency."
        },
        {
          id: `${approval.id}:request-history`,
          label: "Permission request history",
          status: buildRecordHistoryItemStatus(records.length),
          detail: "Recent permission request records are included for review."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution remains locked in this audit preview."
        }
      ]
    };

    return {
      ...snapshot,
      exportMarkdown: buildAuditExportMarkdown(snapshot, shell)
    };
  }

  if (
    (approval.state === "review" || approval.state === "requestable") &&
    !shell.permissionGranted
  ) {
    const snapshot: RuntimeProfilePermissionAuditDraft = {
      id: `${approval.id}:permission-audit`,
      label: `${approval.label} audit`,
      state: "waiting",
      statusLabel: "Waiting",
      readiness,
      executionLocked: true,
      canExport: records.length > 0,
      recordCount: records.length,
      detail:
        "Shell permission is not granted and execution remains locked.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${approval.id}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionApprovalItemStatus(approval),
          detail: "Permission approval needs shell access before it can be confirmed."
        },
        {
          id: `${approval.id}:shell-approval`,
          label: "Shell approval",
          status: buildShellApprovalItemStatus(shell),
          detail: "Shell approval has not been granted yet."
        },
        {
          id: `${approval.id}:request-history`,
          label: "Permission request history",
          status: buildRecordHistoryItemStatus(records.length),
          detail: "Recent permission request records are included for review."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution remains locked in this audit preview."
        }
      ]
    };

    return {
      ...snapshot,
      exportMarkdown: buildAuditExportMarkdown(snapshot, shell)
    };
  }

  if (approval.state === "requestable" && shell.permissionGranted) {
    const snapshot: RuntimeProfilePermissionAuditDraft = {
      id: `${approval.id}:permission-audit`,
      label: `${approval.label} audit`,
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      executionLocked: true,
      canExport: true,
      recordCount: records.length,
      detail:
        "Audit is ready for the future runtime handoff review, but execution remains locked by this preview helper.",
      safety: AUDIT_SAFETY,
      items: [
        {
          id: `${approval.id}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionApprovalItemStatus(approval),
          detail: "Permission approval can be included in the runtime handoff review."
        },
        {
          id: `${approval.id}:shell-approval`,
          label: "Shell approval",
          status: "ready",
          detail: "Shell permission is currently granted."
        },
        {
          id: `${approval.id}:request-history`,
          label: "Permission request history",
          status: buildRecordHistoryItemStatus(records.length),
          detail: "Recent permission request records are included for review."
        },
        {
          id: `${approval.id}:execution-lock`,
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution remains locked in this audit preview."
        }
      ]
    };

    return {
      ...snapshot,
      exportMarkdown: buildAuditExportMarkdown(snapshot, shell)
    };
  }

  const snapshot: RuntimeProfilePermissionAuditDraft = {
    id: `${approval.id}:permission-audit`,
    label: `${approval.label} audit`,
    state: "waiting",
    statusLabel: "Waiting",
    readiness,
    executionLocked: true,
    canExport: records.length > 0,
    recordCount: records.length,
    detail: "Shell permission is not granted and execution remains locked.",
    safety: AUDIT_SAFETY,
    items: [
      {
        id: `${approval.id}:permission-approval`,
        label: "Permission approval",
        status: buildPermissionApprovalItemStatus(approval),
        detail: "Permission approval has not yet been granted."
      },
      {
        id: `${approval.id}:shell-approval`,
        label: "Shell approval",
        status: buildShellApprovalItemStatus(shell),
        detail: "Shell approval has not been granted yet."
      },
      {
        id: `${approval.id}:request-history`,
        label: "Permission request history",
        status: buildRecordHistoryItemStatus(records.length),
        detail: "Recent permission request records are included for review."
      },
      {
        id: `${approval.id}:execution-lock`,
        label: "Execution lock",
        status: "locked",
        detail: "Runtime execution remains locked in this audit preview."
      }
    ]
  };

  return {
    ...snapshot,
    exportMarkdown: buildAuditExportMarkdown(snapshot, shell)
  };
}
