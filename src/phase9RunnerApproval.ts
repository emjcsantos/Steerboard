import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import type { LiveActionRunnerExecutionResult } from "./liveActionRunner";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import {
  buildTerminalReadonlyProbeRequest,
  type DesktopActionRunnerExecuteResult,
  type DesktopActionRunnerRequestBuildResult
} from "./desktopActionRunner";
import {
  buildPhase9RunnerEvidenceFingerprint,
  type Phase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";

export type Phase9RunnerApprovalState = "ready" | "review" | "blocked" | "waiting";

export type Phase9RunnerApprovalItemKind =
  | "selected-action"
  | "permission"
  | "approval"
  | "preview"
  | "validation"
  | "audit"
  | "owner-review"
  | "rollback";

export interface Phase9RunnerApprovalItem {
  id: string;
  label: string;
  kind: Phase9RunnerApprovalItemKind;
  status: Phase9RunnerApprovalState;
  detail: string;
  nextAction: string;
}

export interface Phase9RunnerApprovalSnapshot {
  id: string;
  label: string;
  state: Phase9RunnerApprovalState;
  statusLabel: string;
  readiness: number;
  selectedAction: "terminal-readonly-probe";
  canRequestDesktopProbe: boolean;
  auditRecordCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase9RunnerApprovalItem[];
}

export interface Phase9RunnerApprovalInput {
  permissionRequest?: LiveActionPermissionRequest;
  runnerEvaluation?: LiveActionRunnerExecutionResult;
  desktopRunnerResult: DesktopActionRunnerExecuteResult;
  auditRecords: readonly LiveActionAuditRecord[];
  phase8AuditReviewRecord?: Phase8AuditReviewRecord;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord;
  evaluatedAt?: string | Date;
}

const SNAPSHOT_ID = "phase-09-desktop-runner-approval";
const SNAPSHOT_LABEL = "Phase 9 desktop runner approval";
const SELECTED_ACTION = "terminal-readonly-probe" as const;
const SAFETY =
  "Phase 9 approval review only. The selected action is the fixed terminal read-only probe; no broad terminal, Git, MCP, plugin, automation, runtime, or profile mutation is unlocked.";

const STATUS_LABELS: Record<Phase9RunnerApprovalState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase9RunnerApprovalState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 35;
    case "blocked":
    default:
      return 0;
  }
}

function scoreItems(items: readonly Phase9RunnerApprovalItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(items: readonly Phase9RunnerApprovalItem[]): Phase9RunnerApprovalState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstNextAction(items: readonly Phase9RunnerApprovalItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep the fixed read-only probe scoped, audited, validated, and rollback-safe before expanding runner actions."
  );
}

function optionalFieldMatches(recorded: string | undefined, current: string | undefined): boolean {
  return !recorded || recorded === current;
}

function phase8DependencyProofMatches(
  record: Phase9RunnerApprovalRecord,
  phase8Record: Phase8AuditReviewRecord
): boolean {
  return (
    optionalFieldMatches(record.phase8ReviewFingerprint, phase8Record.auditEvidenceFingerprint) &&
    optionalFieldMatches(record.phase8ReviewedBlockerSourceId, phase8Record.topBlockerSourceId) &&
    optionalFieldMatches(record.phase8ReviewedBlockerKind, phase8Record.topBlockerKind) &&
    optionalFieldMatches(record.phase8ReviewedBlockerStatus, phase8Record.topBlockerStatus) &&
    optionalFieldMatches(record.phase8ReviewedBlockerLabel, phase8Record.topBlockerLabel) &&
    optionalFieldMatches(record.phase8ReviewedBlockerAction, phase8Record.topBlockerAction)
  );
}

function isTerminalAuditRecord(record: LiveActionAuditRecord): boolean {
  return (
    record.provider === "terminal" ||
    record.service.toLowerCase().includes("terminal") ||
    record.what.toLowerCase().includes("terminal")
  );
}

function selectedActionItem(): Phase9RunnerApprovalItem {
  return {
    id: `${SNAPSHOT_ID}:selected-action`,
    label: "Selected reversible action",
    kind: "selected-action",
    status: "ready",
    detail:
      "The selected Phase 9 action is a fixed terminal read-only probe with no workspace write, Git operation, external call, or profile mutation.",
    nextAction:
      "Keep Phase 9 limited to the fixed terminal read-only probe until approval, audit, validation, and rollback gates stay ready."
  };
}

function permissionItem(
  request: LiveActionPermissionRequest | undefined,
  evaluation: LiveActionRunnerExecutionResult | undefined
): Phase9RunnerApprovalItem {
  if (!request || request.state === "idle") {
    return {
      id: `${SNAPSHOT_ID}:permission`,
      label: "Owner permission",
      kind: "permission",
      status: "waiting",
      detail: "Terminal runner permission has not been requested for the selected probe.",
      nextAction: "Request owner approval for the fixed terminal read-only probe."
    };
  }

  if (request.state === "requested") {
    return {
      id: `${SNAPSHOT_ID}:permission`,
      label: "Owner permission",
      kind: "permission",
      status: "review",
      detail: "Terminal runner permission is requested and waiting for an owner decision.",
      nextAction: "Approve, deny, time out, or reset the terminal runner permission request."
    };
  }

  if (request.state === "denied" || request.state === "timed-out") {
    return {
      id: `${SNAPSHOT_ID}:permission`,
      label: "Owner permission",
      kind: "permission",
      status: "blocked",
      detail: `Terminal runner permission is ${request.state}.`,
      nextAction: "Reset and re-request permission before the desktop runner can be considered."
    };
  }

  if (evaluation?.canExecute) {
    return {
      id: `${SNAPSHOT_ID}:permission`,
      label: "Owner permission",
      kind: "permission",
      status: "ready",
      detail: "Terminal runner permission is approved and the runner contract can evaluate the selected probe.",
      nextAction: "Build the desktop runner request and preserve the approval audit record."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:permission`,
    label: "Owner permission",
    kind: "permission",
    status: "blocked",
    detail:
      evaluation?.reason ?? "Terminal runner permission is approved but the runner contract is blocked.",
    nextAction: "Resolve the runner block before creating a desktop-backed probe request."
  };
}

function approvalItem(
  request: LiveActionPermissionRequest | undefined,
  buildResult: DesktopActionRunnerRequestBuildResult | undefined
): Phase9RunnerApprovalItem {
  if (!request || request.state === "idle") {
    return {
      id: `${SNAPSHOT_ID}:approval`,
      label: "Approval window",
      kind: "approval",
      status: "waiting",
      detail: "Approval timing is not available until the owner requests and approves the selected probe.",
      nextAction: "Request and approve the probe so the runner can verify request and expiry timestamps."
    };
  }

  if (request.state === "requested") {
    return {
      id: `${SNAPSHOT_ID}:approval`,
      label: "Approval window",
      kind: "approval",
      status: "review",
      detail: "Approval timing exists but the owner decision is still pending.",
      nextAction: "Complete the owner approval decision before building the desktop runner request."
    };
  }

  if (!buildResult) {
    return {
      id: `${SNAPSHOT_ID}:approval`,
      label: "Approval window",
      kind: "approval",
      status: "waiting",
      detail: "Desktop runner request has not been evaluated yet.",
      nextAction: "Evaluate the selected probe against the owner approval window."
    };
  }

  if (buildResult.ok) {
    return {
      id: `${SNAPSHOT_ID}:approval`,
      label: "Approval window",
      kind: "approval",
      status: "ready",
      detail: "The approved request includes a valid requested timestamp and expiry window.",
      nextAction: "Keep the approval window attached to the probe audit trail."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:approval`,
    label: "Approval window",
    kind: "approval",
    status:
      buildResult.reason === "permission-not-approved" ||
      buildResult.reason === "execution-blocked"
        ? "review"
        : "blocked",
    detail: buildResult.message,
    nextAction:
      buildResult.reason === "approval-expired"
        ? "Re-request approval because the probe approval window expired."
        : "Repair the approval contract before the desktop runner request is sent."
  };
}

function previewItem(
  buildResult: DesktopActionRunnerRequestBuildResult | undefined
): Phase9RunnerApprovalItem {
  if (!buildResult) {
    return {
      id: `${SNAPSHOT_ID}:preview`,
      label: "Runner request preview",
      kind: "preview",
      status: "waiting",
      detail: "No desktop runner request preview is available yet.",
      nextAction: "Approve the selected probe so the request can be built without executing it."
    };
  }

  if (buildResult.ok) {
    return {
      id: `${SNAPSHOT_ID}:preview`,
      label: "Runner request preview",
      kind: "preview",
      status: "ready",
      detail:
        "The request preview is limited to terminal-readonly-probe and can only target the terminal provider.",
      nextAction: "Send only this fixed read-only request through the desktop runner."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:preview`,
    label: "Runner request preview",
    kind: "preview",
    status:
      buildResult.reason === "permission-not-approved" ||
      buildResult.reason === "execution-blocked"
        ? "review"
        : "blocked",
    detail: buildResult.message,
    nextAction: "Resolve the request preview blocker before the runner can receive a request."
  };
}

function validationItem(result: DesktopActionRunnerExecuteResult): Phase9RunnerApprovalItem {
  if (result.requestId === "desktop-action-runner-initial") {
    return {
      id: `${SNAPSHOT_ID}:validation`,
      label: "Validation output",
      kind: "validation",
      status: "waiting",
      detail: "The desktop runner probe has not been attempted yet.",
      nextAction:
        "After approval and preview are ready, run the fixed probe to collect validation output."
    };
  }

  if (result.status === "executed") {
    return {
      id: `${SNAPSHOT_ID}:validation`,
      label: "Validation output",
      kind: "validation",
      status: "ready",
      detail: result.summary,
      nextAction: "Keep the executed probe result attached to the audit trail."
    };
  }

  if (result.status === "unavailable") {
    return {
      id: `${SNAPSHOT_ID}:validation`,
      label: "Validation output",
      kind: "validation",
      status: "review",
      detail: result.summary,
      nextAction: "Run the approved probe from desktop mode to collect host-backed validation output."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:validation`,
    label: "Validation output",
    kind: "validation",
    status: "blocked",
    detail: result.summary,
    nextAction:
      "Resolve the blocked or failed probe result before treating the runner path as approved."
  };
}

function auditItem(records: readonly LiveActionAuditRecord[]): Phase9RunnerApprovalItem {
  const terminalRecords = records.filter(isTerminalAuditRecord);

  if (terminalRecords.length > 0) {
    return {
      id: `${SNAPSHOT_ID}:audit`,
      label: "Approval and result audit",
      kind: "audit",
      status: "ready",
      detail: `${terminalRecords.length} terminal audit records are available for the selected runner action.`,
      nextAction: "Keep request, approval, denial, failure, and execution records tied to the selected probe."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:audit`,
    label: "Approval and result audit",
    kind: "audit",
    status: "waiting",
    detail: "No terminal runner audit record is available yet.",
    nextAction: "Create a request, approval, dry-run, fallback, failure, or execution audit record."
  };
}

function terminalProbeNeedsRollback(record: LiveActionAuditRecord): boolean {
  return isTerminalAuditRecord(record) && (record.action === "executed" || record.action === "failed");
}

function hasRecordSpecificRollbackEvidence(record: LiveActionAuditRecord): boolean {
  const summary = record.resultSummary.toLowerCase();

  return (
    summary.includes("rollback") &&
    (summary.includes("no-mutation") ||
      summary.includes("no mutation") ||
      summary.includes("mutation lock") ||
      summary.includes("mutation paths stay locked"))
  );
}

function ownerReviewItem(
  phase8Record: Phase8AuditReviewRecord | undefined,
  record: Phase9RunnerApprovalRecord | undefined,
  currentRunnerEvidenceFingerprint: string
): Phase9RunnerApprovalItem {
  if (!phase8Record) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "blocked",
      detail:
        "Phase 9 cannot trust runner approval until the persisted Phase 8 owner audit review is attached.",
      nextAction:
        "Record the Phase 8 owner audit review before reviewing the Phase 9 runner approval path."
    };
  }

  if (phase8Record.state !== "ready" || !phase8Record.mutationLocked) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: phase8Record.state === "blocked" || !phase8Record.mutationLocked ? "blocked" : "review",
      detail:
        "The persisted Phase 8 owner audit review is not ready or does not preserve the mutation lock.",
      nextAction:
        "Resolve Phase 8 owner audit review blockers before recording Phase 9 runner approval."
    };
  }

  if (!record) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "waiting",
      detail:
        "No local Phase 9 runner approval review record is attached to the fixed probe path.",
      nextAction:
        "Record a local owner review for the current Phase 9 runner approval evidence."
    };
  }

  if (
    record.selectedAction !== SELECTED_ACTION ||
    record.phase8ReviewRecordId !== phase8Record.id ||
    record.phase8ReviewState !== "ready" ||
    !phase8DependencyProofMatches(record, phase8Record)
  ) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "review",
      detail:
        "The persisted Phase 9 runner review is stale against the current fixed probe, Phase 8 owner audit review record, or reviewed-blocker proof.",
      nextAction:
        "Record a fresh Phase 9 runner approval review for the current Phase 8 audit record and reviewed-blocker proof."
    };
  }

  if (!record.runnerEvidenceFingerprint) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "review",
      detail:
        "The persisted Phase 9 runner review predates runner evidence fingerprinting.",
      nextAction:
        "Record a fresh Phase 9 runner approval review for the current permission, preview, validation, audit, rollback, and mutation-lock evidence."
    };
  }

  if (record.runnerEvidenceFingerprint !== currentRunnerEvidenceFingerprint) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "review",
      detail:
        `Phase 9 runner review fingerprint ${record.runnerEvidenceFingerprint} does not match current runner evidence ${currentRunnerEvidenceFingerprint}. ${record.rollbackEvidence}`,
      nextAction:
        "Re-record Phase 9 runner approval review after checking the current permission, preview, validation, audit, rollback, and mutation-lock evidence."
    };
  }

  if (!record.mutationLocked || !record.rollbackEvidence.trim()) {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "blocked",
      detail:
        "The persisted Phase 9 runner review is missing mutation-lock or rollback evidence.",
      nextAction:
        "Clear and re-record the Phase 9 runner approval review with rollback evidence attached."
    };
  }

  if (record.state === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "blocked",
      detail: record.detail,
      nextAction:
        "Resolve the blocked Phase 9 runner review record before trusting the runner path."
    };
  }

  if (record.state === "review" || record.state === "waiting") {
    return {
      id: `${SNAPSHOT_ID}:owner-review`,
      label: "Owner runner review",
      kind: "owner-review",
      status: "review",
      detail: record.detail,
      nextAction:
        "Review the persisted Phase 9 runner approval record before runner approval advances."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:owner-review`,
    label: "Owner runner review",
    kind: "owner-review",
    status: "ready",
    detail: `${record.detail} ${record.rollbackEvidence}`,
    nextAction:
      "Keep the Phase 9 runner approval review record attached before expanding runner actions."
  };
}

function rollbackItem(records: readonly LiveActionAuditRecord[]): Phase9RunnerApprovalItem {
  const recordsNeedingRollback = records.filter(terminalProbeNeedsRollback);
  const recordsMissingRollback = recordsNeedingRollback.filter(
    (record) => !hasRecordSpecificRollbackEvidence(record)
  );

  if (recordsMissingRollback.length > 0) {
    return {
      id: `${SNAPSHOT_ID}:rollback`,
      label: "Rollback evidence",
      kind: "rollback",
      status: "review",
      detail: `${recordsMissingRollback.length}/${recordsNeedingRollback.length} executed or failed terminal probe audit record${recordsNeedingRollback.length === 1 ? "" : "s"} need record-specific rollback and no-mutation evidence.`,
      nextAction:
        "Attach rollback and no-mutation proof to each executed or failed terminal-readonly-probe audit record before runner approval advances."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:rollback`,
    label: "Rollback evidence",
    kind: "rollback",
    status: "ready",
    detail:
      recordsNeedingRollback.length > 0
        ? `${recordsNeedingRollback.length} executed or failed terminal probe audit record${recordsNeedingRollback.length === 1 ? "" : "s"} include record-specific rollback and no-mutation evidence.`
        : "The selected probe is read-only; rollback evidence is the fixed no-mutation contract and unchanged broader mutation locks.",
    nextAction:
      "Do not add write-capable runner actions until rollback evidence is action-specific and owner-visible."
  };
}

function buildAriaLabel(snapshot: Omit<Phase9RunnerApprovalSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `selected action ${snapshot.selectedAction}; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase9RunnerApprovalSnapshot(
  input: Phase9RunnerApprovalInput
): Phase9RunnerApprovalSnapshot {
  const buildResult =
    input.permissionRequest && input.runnerEvaluation
      ? buildTerminalReadonlyProbeRequest(
          input.runnerEvaluation,
          input.permissionRequest,
          input.evaluatedAt
        )
      : undefined;
  const baseItems = [
    selectedActionItem(),
    permissionItem(input.permissionRequest, input.runnerEvaluation),
    approvalItem(input.permissionRequest, buildResult),
    previewItem(buildResult),
    validationItem(input.desktopRunnerResult),
    auditItem(input.auditRecords),
    rollbackItem(input.auditRecords)
  ];
  const baseDraft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state: resolveState(baseItems),
    statusLabel: STATUS_LABELS[resolveState(baseItems)],
    readiness: scoreItems(baseItems),
    selectedAction: SELECTED_ACTION,
    canRequestDesktopProbe: false,
    auditRecordCount: input.auditRecords.filter(isTerminalAuditRecord).length,
    readyCount: baseItems.filter((item) => item.status === "ready").length,
    reviewCount: baseItems.filter((item) => item.status === "review").length,
    blockedCount: baseItems.filter((item) => item.status === "blocked").length,
    waitingCount: baseItems.filter((item) => item.status === "waiting").length,
    nextAction: firstNextAction(baseItems),
    safety: SAFETY,
    ariaLabel: "",
    items: baseItems
  };
  const currentRunnerEvidenceFingerprint =
    buildPhase9RunnerEvidenceFingerprint(baseDraft);
  const items = [
    ...baseItems,
    ownerReviewItem(
      input.phase8AuditReviewRecord,
      input.runnerApprovalRecord,
      currentRunnerEvidenceFingerprint
    )
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const auditRecordCount = input.auditRecords.filter(isTerminalAuditRecord).length;
  const rollbackReady = items.find((item) => item.kind === "rollback")?.status === "ready";
  const canRequestDesktopProbe =
    Boolean(buildResult?.ok) &&
    blockedCount === 0 &&
    rollbackReady &&
    input.phase8AuditReviewRecord?.state === "ready" &&
    input.runnerApprovalRecord?.state === "ready" &&
    input.runnerApprovalRecord.phase8ReviewRecordId === input.phase8AuditReviewRecord.id &&
    phase8DependencyProofMatches(input.runnerApprovalRecord, input.phase8AuditReviewRecord) &&
    input.runnerApprovalRecord.runnerEvidenceFingerprint === currentRunnerEvidenceFingerprint &&
    input.runnerApprovalRecord.mutationLocked;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    selectedAction: SELECTED_ACTION,
    canRequestDesktopProbe,
    auditRecordCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
