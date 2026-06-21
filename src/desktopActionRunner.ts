import {
  isLiveActionPermissionExpired,
  type LiveActionPermissionRequest
} from "./liveActionPermission";
import type { LiveActionRunnerExecutionResult } from "./liveActionRunner";

export type DesktopActionRunnerAction = "terminal-readonly-probe";

export type DesktopActionRunnerProvider =
  | "terminal"
  | "git"
  | "mcp"
  | "plugin"
  | "automation"
  | "external-service"
  | "runtime-launch"
  | "profile-activation";

export type DesktopActionRunnerStatus = "executed" | "blocked" | "unavailable" | "failed";

export type DesktopActionRunnerResultCode =
  | "ok"
  | "unsupported-provider"
  | "execution-blocked"
  | "permission-not-approved"
  | "approval-timing-missing"
  | "approval-expired"
  | "execution-failed"
  | "runtime-unavailable";

export type DesktopActionRunnerBuildRejectionReason =
  | "unsupported-provider"
  | "execution-blocked"
  | "permission-not-approved"
  | "approval-timing-missing"
  | "approval-expired";

export interface DesktopActionRunnerExecuteRequest {
  provider: "terminal";
  state: "approved";
  actionLabel: string;
  requestId: string;
  requestedTimestamp: string;
  timeout?: number;
  expiry?: string;
  intent: DesktopActionRunnerAction;
}

export interface DesktopActionRunnerBackendResult {
  provider: string;
  intent: string;
  executed: boolean;
  blocked: boolean;
  actionLabel: string;
  resultSummary: string;
  timestamp: string;
  safety: string;
}

export interface DesktopActionRunnerExecuteResult {
  provider: DesktopActionRunnerProvider;
  intent: string;
  requestId: string;
  status: DesktopActionRunnerStatus;
  code: DesktopActionRunnerResultCode;
  canExecute: boolean;
  summary: string;
  detail: string;
  evaluatedAt: string;
}

export interface DesktopActionRunnerRequestBuildSuccess {
  ok: true;
  request: DesktopActionRunnerExecuteRequest;
}

export interface DesktopActionRunnerRequestBuildFailure {
  ok: false;
  reason: DesktopActionRunnerBuildRejectionReason;
  message: string;
}

export type DesktopActionRunnerRequestBuildResult =
  | DesktopActionRunnerRequestBuildSuccess
  | DesktopActionRunnerRequestBuildFailure;

export interface DesktopActionRunnerResultSummary {
  requestId: string;
  statusLabel: "Executed" | "Blocked" | "Unavailable" | "Failed";
  auditText: string;
  detail: string;
  canExecute: boolean;
}

const ACTION_ID: DesktopActionRunnerAction = "terminal-readonly-probe";
const SUPPORTED_DESKTOP_ACTION_PROVIDERS: readonly DesktopActionRunnerProvider[] = ["terminal"];
const STATUS_LABELS: Record<DesktopActionRunnerStatus, DesktopActionRunnerResultSummary["statusLabel"]> = {
  executed: "Executed",
  blocked: "Blocked",
  unavailable: "Unavailable",
  failed: "Failed"
};

function normalizeTimestamp(value: string | Date): string {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
}

function normalizeTimeOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function sanitizeRunnerText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /\b(api[_-]?key|auth[_-]?token|access[_-]?token|bearer|secret|password)\b\s*[:=]?\s*[^\s"'`]+/gi,
      "[redacted secret]"
    )
    .replace(/\b(sk-[A-Za-z0-9]{8,})\b/g, "[redacted token]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{10,}\b/g, "[redacted token]")
    .replace(/[A-Za-z]:\\(?:[^\s"'`]+)/g, "[redacted path]")
    .replace(/\/(?:[^\s"'`]+)/g, "[redacted path]");
}

function resolveApprovalExpiryMs(
  request: Pick<LiveActionPermissionRequest, "requestedAt" | "timeoutMs" | "expiresAt">
): number | null {
  const explicitExpiry = normalizeTimeOrNull(request.expiresAt);
  if (explicitExpiry) {
    return Date.parse(explicitExpiry);
  }

  const requestedAt = normalizeTimeOrNull(request.requestedAt);
  if (!requestedAt) {
    return null;
  }

  if (!Number.isFinite(request.timeoutMs ?? Number.NaN) || request.timeoutMs! <= 0) {
    return null;
  }

  return Date.parse(requestedAt) + request.timeoutMs!;
}

function timestampMsString(value: string): string | null {
  const normalized = normalizeTimeOrNull(value);
  if (!normalized) {
    return null;
  }

  return String(Date.parse(normalized));
}

function isBlockedExecution(evaluation: LiveActionRunnerExecutionResult): boolean {
  return evaluation.status !== "ready" || !evaluation.canExecute;
}

export function buildTerminalReadonlyProbeRequest(
  execution: LiveActionRunnerExecutionResult,
  permissionRequest: LiveActionPermissionRequest,
  evaluatedAt: string | Date = new Date()
): DesktopActionRunnerRequestBuildResult {
  if (!SUPPORTED_DESKTOP_ACTION_PROVIDERS.includes(execution.provider)) {
    return {
      ok: false,
      reason: "unsupported-provider",
      message:
        `Provider ${execution.provider} cannot be dispatched with ${ACTION_ID} in desktop runner preview.`
    };
  }

  if (permissionRequest.provider !== execution.provider) {
    return {
      ok: false,
      reason: "unsupported-provider",
      message: "Permission provider does not match selected desktop runner provider."
    };
  }

  if (isBlockedExecution(execution)) {
    return {
      ok: false,
      reason: "execution-blocked",
      message: execution.blockReason
        ? `Execution blocked: ${execution.blockReason}`
        : `Execution is not ready (${execution.status}).`
    };
  }

  if (permissionRequest.state !== "approved") {
    return {
      ok: false,
      reason: "permission-not-approved",
      message: `Permission state "${permissionRequest.state}" cannot dispatch terminal execution.`
    };
  }

  const expiryMs = resolveApprovalExpiryMs(permissionRequest);
  if (expiryMs === null) {
    return {
      ok: false,
      reason: "approval-timing-missing",
      message:
        "Approval timing is missing; requested timestamp and expiration window are required for desktop dispatch."
    };
  }

  const now = normalizeTimestamp(evaluatedAt);
  if (isLiveActionPermissionExpired(permissionRequest, now)) {
    return {
      ok: false,
      reason: "approval-expired",
      message: `Approval expired at ${normalizeTimestamp(permissionRequest.expiresAt ?? permissionRequest.requestedAt)}.`
    };
  }
  const requestedTimestamp = timestampMsString(permissionRequest.requestedAt);
  if (requestedTimestamp === null) {
    return {
      ok: false,
      reason: "approval-timing-missing",
      message:
        "Approval timing is missing; requested timestamp and expiration window are required for desktop dispatch."
    };
  }

  return {
    ok: true,
    request: {
      provider: "terminal",
      state: "approved",
      actionLabel: permissionRequest.actionLabel,
      requestId: permissionRequest.id,
      requestedTimestamp,
      timeout: permissionRequest.timeoutMs,
      expiry: permissionRequest.expiresAt
        ? timestampMsString(permissionRequest.expiresAt) ?? undefined
        : String(expiryMs),
      intent: ACTION_ID
    }
  };
}

export function buildDesktopActionRunnerBrowserFallbackResult(
  permissionRequestId: string,
  evaluatedAt: string | Date = new Date()
): DesktopActionRunnerExecuteResult {
  return {
    provider: "terminal",
    intent: ACTION_ID,
    requestId: permissionRequestId,
    status: "unavailable",
    code: "runtime-unavailable",
    canExecute: false,
    summary: "Desktop runner execution is unavailable in browser preview.",
    detail: "Desktop runtime command bridge is not available; desktop-backed execution must wait.",
    evaluatedAt: normalizeTimestamp(evaluatedAt)
  };
}

export function buildDesktopActionRunnerBuildFailureResult(
  permissionRequestId: string,
  reason: DesktopActionRunnerBuildRejectionReason,
  message: string,
  evaluatedAt: string | Date = new Date()
): DesktopActionRunnerExecuteResult {
  return {
    provider: "terminal",
    intent: ACTION_ID,
    requestId: permissionRequestId,
    status: "blocked",
    code:
      reason === "unsupported-provider"
        ? "unsupported-provider"
        : reason === "permission-not-approved"
          ? "permission-not-approved"
          : reason === "approval-expired"
            ? "approval-expired"
            : reason === "approval-timing-missing"
              ? "approval-timing-missing"
              : "execution-blocked",
    canExecute: false,
    summary: `Desktop terminal read-only probe blocked: ${message}`,
    detail: "Desktop runner request was not sent because the approval contract was not satisfied.",
    evaluatedAt: normalizeTimestamp(evaluatedAt)
  };
}

function codeFromBackendResult(result: DesktopActionRunnerBackendResult): DesktopActionRunnerResultCode {
  if (result.provider !== "terminal" || result.intent !== ACTION_ID) {
    return "unsupported-provider";
  }

  if (result.executed && !result.blocked) {
    return "ok";
  }

  if (result.resultSummary === "blocked_unsupported_provider") {
    return "unsupported-provider";
  }

  if (result.resultSummary === "blocked_request_state_not_approved") {
    return "permission-not-approved";
  }

  if (
    result.resultSummary === "blocked_invalid_requested_timestamp" ||
    result.resultSummary === "blocked_invalid_expiry_timestamp" ||
    result.resultSummary === "blocked_missing_expiry"
  ) {
    return "approval-timing-missing";
  }

  if (result.resultSummary === "blocked_expired") {
    return "approval-expired";
  }

  if (result.resultSummary.startsWith("blocked_probe_execution_error")) {
    return "execution-failed";
  }

  return "execution-blocked";
}

export function normalizeDesktopActionRunnerBackendResult(
  result: DesktopActionRunnerBackendResult,
  requestId: string
): DesktopActionRunnerExecuteResult {
  const code = codeFromBackendResult(result);
  const expectedScope = result.provider === "terminal" && result.intent === ACTION_ID;
  const executed = expectedScope && result.executed && !result.blocked;
  const status: DesktopActionRunnerStatus = executed
    ? "executed"
    : code === "execution-failed"
      ? "failed"
      : "blocked";

  return {
    provider: result.provider as DesktopActionRunnerProvider,
    intent: result.intent,
    requestId,
    status,
    code,
    canExecute: executed,
    summary: executed
      ? "Desktop terminal read-only probe executed through the approved runner contract."
      : `Desktop terminal read-only probe blocked: ${result.resultSummary}.`,
    detail: result.safety,
    evaluatedAt: normalizeTimestamp(result.timestamp)
  };
}

export function summarizeDesktopActionRunnerResult(
  result: DesktopActionRunnerExecuteResult
): DesktopActionRunnerResultSummary {
  return {
    requestId: result.requestId,
    statusLabel: STATUS_LABELS[result.status],
    auditText: sanitizeRunnerText(result.summary),
    detail: sanitizeRunnerText(result.detail),
    canExecute: result.canExecute
  };
}
