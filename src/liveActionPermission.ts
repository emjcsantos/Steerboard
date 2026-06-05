export type LiveActionProvider =
  | "terminal"
  | "git"
  | "mcp"
  | "plugin"
  | "automation"
  | "external-service"
  | "runtime-launch"
  | "profile-activation"
  | "external service"
  | "runtime launch"
  | "profile activation";

export type LiveActionRiskLevel = "low" | "medium" | "high";

export type LiveActionPermissionState =
  | "idle"
  | "requested"
  | "approved"
  | "denied"
  | "timed-out";

export type LiveActionPermissionDecision = "request" | "approve" | "deny" | "timeout" | "reset";

export interface LiveActionPermissionRequest {
  id: string;
  provider: LiveActionProvider;
  actionLabel: string;
  state: LiveActionPermissionState;
  requestedAt: string;
  timeoutMs?: number;
  expiresAt?: string;
  risk?: LiveActionRiskLevel;
}

export interface LiveActionPermissionRequestSummaryInput {
  id: string;
  provider: LiveActionProvider;
  actionLabel: string;
  state: LiveActionPermissionState;
  requestedAt: string;
  timeoutMs?: number;
  expiresAt?: string;
  risk?: LiveActionRiskLevel;
  detail?: string;
  requestedBy?: string;
  transcript?: unknown;
}

export interface LiveActionPermissionRequestSummary {
  id: string;
  provider: LiveActionProvider;
  actionLabel: string;
  state: LiveActionPermissionState;
  risk: LiveActionRiskLevel;
  isRiskGated: boolean;
  requestedAt: string;
  expiresAt: string;
  requestedBy: string;
  transcriptLineCount: number;
  detail: string;
}

const BASE_REQUEST_RISK: Record<LiveActionProvider, LiveActionRiskLevel> = {
  terminal: "high",
  git: "high",
  mcp: "high",
  plugin: "medium",
  automation: "high",
  "external-service": "high",
  "external service": "high",
  "runtime-launch": "high",
  "runtime launch": "high",
  "profile-activation": "high",
  "profile activation": "high"
};

function normalizeLiveActionProvider(
  provider: LiveActionProvider
): Exclude<LiveActionProvider, "external service" | "runtime launch" | "profile activation"> {
  return provider === "external service"
    ? "external-service"
    : provider === "runtime launch"
      ? "runtime-launch"
      : provider === "profile activation"
        ? "profile-activation"
        : provider;
}

const terminalStates: LiveActionPermissionState[] = [
  "idle",
  "requested",
  "approved",
  "denied",
  "timed-out"
];

export function normalizeLiveActionPermissionState(
  value: unknown
): LiveActionPermissionState {
  return terminalStates.includes(value as LiveActionPermissionState)
    ? (value as LiveActionPermissionState)
    : "idle";
}

export function resolveLiveActionRisk(
  provider: LiveActionProvider,
  riskOverride?: LiveActionRiskLevel
): LiveActionRiskLevel {
  if (riskOverride === "low" || riskOverride === "medium" || riskOverride === "high") {
    return riskOverride;
  }

  return BASE_REQUEST_RISK[normalizeLiveActionProvider(provider)];
}

function normalizeTimeout(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.floor(value);
}

function normalizeStringTimestamp(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && Number.isFinite(Date.parse(trimmed)) ? trimmed : "";
}

function normalizeDetail(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeTime(value: string | Date): string {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
}

export function calculateLiveActionPermissionExpiry(
  request: Pick<LiveActionPermissionRequest, "requestedAt" | "timeoutMs" | "expiresAt">
): string {
  const explicitExpiry = normalizeStringTimestamp(request.expiresAt);
  if (explicitExpiry) {
    return explicitExpiry;
  }

  const requestedAt = normalizeStringTimestamp(request.requestedAt);
  const timeoutMs = normalizeTimeout(request.timeoutMs);
  if (!requestedAt || timeoutMs === undefined) {
    return "";
  }

  const requestedAtMs = Date.parse(requestedAt);
  if (!Number.isFinite(requestedAtMs)) {
    return "";
  }

  return new Date(requestedAtMs + timeoutMs).toISOString();
}

export function isLiveActionPermissionStateTerminal(
  state: LiveActionPermissionState
): boolean {
  return state === "denied" || state === "timed-out";
}

export function applyLiveActionPermissionDecision(
  current: LiveActionPermissionState,
  decision: LiveActionPermissionDecision
): LiveActionPermissionState {
  if (isLiveActionPermissionStateTerminal(current) && decision !== "reset") {
    return current;
  }

  switch (decision) {
    case "request":
      return "requested";
    case "approve":
      return "approved";
    case "deny":
      return "denied";
    case "timeout":
      return "timed-out";
    case "reset":
      return "idle";
    default:
      return "idle";
  }
}

function isRiskGatedAction(risk: LiveActionRiskLevel): boolean {
  return risk === "medium" || risk === "high";
}

export function isLiveActionPermissionExpired(
  request: Pick<LiveActionPermissionRequest, "requestedAt" | "timeoutMs" | "expiresAt">,
  now: string | Date = new Date()
): boolean {
  const nowMs = Date.parse(normalizeTime(now instanceof Date ? now : now));
  const expiry = calculateLiveActionPermissionExpiry(request);
  if (!expiry) {
    return false;
  }

  const expiryMs = Date.parse(expiry);
  return Number.isFinite(expiryMs) && nowMs >= expiryMs;
}

export function canExecuteLiveAction(
  request: LiveActionPermissionRequest,
  now: string | Date = new Date()
): boolean {
  if (request.state !== "approved") {
    return false;
  }

  const risk = resolveLiveActionRisk(request.provider, request.risk);
  if (!isRiskGatedAction(risk) || isLiveActionPermissionStateTerminal(request.state)) {
    return false;
  }

  return !isLiveActionPermissionExpired(request, now);
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function redactSensitiveValues(value: string): string {
  return compactWhitespace(value)
    .replace(
      /\b(api[_-]?key|auth[_-]?token|access[_-]?token|bearer|secret|password)\b\s*[:=]?\s*[^\s"'`]+/gi,
      "[redacted secret]"
    )
    .replace(/\bsk-[A-Za-z0-9]{8,}\b/g, "[redacted secret]")
    .replace(/[A-Za-z]:\\(?:[^\\s"']+)/g, "[redacted path]")
    .replace(
      /(?:^|[\s])(?:\.{2}[\\/][^\s"']+|(?:[A-Za-z0-9._-]+[\\/]){2,}[^\s"']+)/g,
      " [redacted path] "
    )
    .replace(/\/[A-Za-z0-9._/-]{4,}(?:\.[A-Za-z0-9._-]+)?/g, "[redacted path]")
    .slice(0, 220)
    .trim();
}

function countTranscriptLines(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  return value.filter((line) => typeof line === "string" && line.trim().length > 0).length;
}

export function buildLiveActionPermissionRequestSummary(
  request: LiveActionPermissionRequestSummaryInput
): LiveActionPermissionRequestSummary {
  const sanitizedProviderActionLabel = redactSensitiveValues(
    normalizeDetail(request.actionLabel, "Live action")
  );
  const sanitizedRequestedBy = redactSensitiveValues(
    normalizeDetail(request.requestedBy, "operator")
  );
  const requestId = request.id.trim().length > 0 ? request.id.trim() : "live-action-request";
  const detail = normalizeDetail(request.detail, "No request detail available.");
  const risk = resolveLiveActionRisk(request.provider, request.risk);
  const normalizedExpiry =
    normalizeStringTimestamp(request.expiresAt) ||
    calculateLiveActionPermissionExpiry({
      requestedAt: request.requestedAt,
      timeoutMs: request.timeoutMs,
      expiresAt: request.expiresAt
    }) ||
    "";

  return {
    id: requestId,
    provider: request.provider,
    actionLabel: sanitizedProviderActionLabel,
    state: normalizeLiveActionPermissionState(request.state),
    risk,
    isRiskGated: isRiskGatedAction(risk),
    requestedAt: normalizeStringTimestamp(request.requestedAt) || new Date().toISOString(),
    expiresAt: normalizedExpiry.length > 0 ? normalizedExpiry : "none",
    requestedBy: sanitizedRequestedBy,
    transcriptLineCount: countTranscriptLines(request.transcript),
    detail: redactSensitiveValues(detail)
  };
}
