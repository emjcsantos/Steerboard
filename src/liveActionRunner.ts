import { createLiveActionAuditRecord, type LiveActionAuditRecord } from "./liveActionAudit";
import {
  canExecuteLiveAction,
  isLiveActionPermissionExpired,
  resolveLiveActionRisk,
  type LiveActionPermissionRequest,
  type LiveActionProvider,
  type LiveActionRiskLevel
} from "./liveActionPermission";

export type LiveActionRunnerProvider =
  | "terminal"
  | "git"
  | "mcp"
  | "plugin"
  | "automation"
  | "external-service"
  | "runtime-launch"
  | "profile-activation";

export type LiveActionRunnerStatus = "ready" | "blocked";

export type LiveActionRunnerNextAction =
  | "run-dry-run"
  | "resolve-provider-mismatch"
  | "request-approval"
  | "re-request-approval"
  | "resolve-denial"
  | "review-risk-policy";

export type LiveActionRunnerBlockReason =
  | "denied"
  | "timed-out"
  | "idle"
  | "requested"
  | "expired"
  | "provider-mismatch"
  | "risk-blocked";

export interface LiveActionRunnerDefinition {
  provider: LiveActionRunnerProvider;
  actionLabel: string;
  why: string;
  workspace: string;
  service: string;
  risk: LiveActionRiskLevel;
}

export interface LiveActionRunnerExecutionResult {
  id: string;
  provider: LiveActionRunnerProvider;
  status: LiveActionRunnerStatus;
  blockReason: LiveActionRunnerBlockReason | "";
  canExecute: boolean;
  nextAction: LiveActionRunnerNextAction;
  reason: string;
  auditRecord: LiveActionAuditRecord;
}

export interface LiveActionRunnerSummary {
  total: number;
  ready: number;
  blocked: number;
  readiness: number;
  nextAction: LiveActionRunnerNextAction;
}

export const LIVE_ACTION_RUNNER_DEFINITIONS: readonly LiveActionRunnerDefinition[] = [
  {
    provider: "terminal",
    actionLabel: "Run terminal command",
    why: "Terminal execution can mutate workspace and host environment.",
    workspace: "current workspace",
    service: "local shell",
    risk: "high"
  },
  {
    provider: "git",
    actionLabel: "Run Git operation",
    why: "Git operations can alter repository state.",
    workspace: "current repository",
    service: "git",
    risk: "high"
  },
  {
    provider: "mcp",
    actionLabel: "Invoke MCP tool",
    why: "MCP tooling can reach local or external systems.",
    workspace: "configured MCP server",
    service: "mcp",
    risk: "high"
  },
  {
    provider: "plugin",
    actionLabel: "Run plugin action",
    why: "Plugin actions can generate files and call integrated services.",
    workspace: "active plugin",
    service: "plugin",
    risk: "medium"
  },
  {
    provider: "automation",
    actionLabel: "Start automation",
    why: "Automations can run repeatedly or after the request cycle.",
    workspace: "automation scheduler",
    service: "automation",
    risk: "high"
  },
  {
    provider: "external-service",
    actionLabel: "Send external request",
    why: "External services can receive sensitive payloads.",
    workspace: "external account",
    service: "external service",
    risk: "high"
  },
  {
    provider: "runtime-launch",
    actionLabel: "Launch runtime worker",
    why: "Runtime launch can create long-lived worker processes.",
    workspace: "runtime profile",
    service: "runtime",
    risk: "high"
  },
  {
    provider: "profile-activation",
    actionLabel: "Activate runtime profile",
    why: "Profile activation can change runtime permissions.",
    workspace: "runtime profile",
    service: "profile",
    risk: "high"
  }
];

const PROVIDER_NORMALIZATION: Record<LiveActionProvider, LiveActionRunnerProvider> = {
  terminal: "terminal",
  git: "git",
  mcp: "mcp",
  plugin: "plugin",
  automation: "automation",
  "external-service": "external-service",
  "external service": "external-service",
  "runtime-launch": "runtime-launch",
  "runtime launch": "runtime-launch",
  "profile-activation": "profile-activation",
  "profile activation": "profile-activation"
};

function normalizeProvider(provider: LiveActionProvider): LiveActionRunnerProvider {
  return PROVIDER_NORMALIZATION[provider];
}

function normalizeTimestamp(value: string | Date): string {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return new Date().toISOString();
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
    .replace(/\/[^\s"'`]+/g, "[redacted path]");
}

function resolveBlockState(
  definition: LiveActionRunnerDefinition,
  request: LiveActionPermissionRequest,
  now: string | Date
): {
  status: LiveActionRunnerStatus;
  canExecute: boolean;
  blockReason: LiveActionRunnerBlockReason | "";
  nextAction: LiveActionRunnerNextAction;
} {
  if (normalizeProvider(request.provider) !== definition.provider) {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: "provider-mismatch",
      nextAction: "resolve-provider-mismatch"
    };
  }

  if (request.state === "approved" && isLiveActionPermissionExpired(request, now)) {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: "expired",
      nextAction: "re-request-approval"
    };
  }

  if (request.state === "denied") {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: "denied",
      nextAction: "resolve-denial"
    };
  }

  if (request.state === "timed-out") {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: "timed-out",
      nextAction: "re-request-approval"
    };
  }

  if (request.state === "idle" || request.state === "requested") {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: request.state,
      nextAction: "request-approval"
    };
  }

  if (!canExecuteLiveAction(request, now)) {
    return {
      status: "blocked",
      canExecute: false,
      blockReason: "risk-blocked",
      nextAction: "review-risk-policy"
    };
  }

  return {
    status: "ready",
    canExecute: true,
    blockReason: "",
    nextAction: "run-dry-run"
  };
}

function buildAuditResult(
  definition: LiveActionRunnerDefinition,
  request: LiveActionPermissionRequest,
  state: {
    status: LiveActionRunnerStatus;
    canExecute: boolean;
    blockReason: LiveActionRunnerBlockReason | "";
    nextAction: LiveActionRunnerNextAction;
  },
  now: string | Date
): {
  action: "requested" | "approved" | "denied" | "failed" | "executed" | "timed-out" | "cancelled";
  resultSummary: string;
} {
  const what = sanitizeRunnerText(request.actionLabel || definition.actionLabel);
  const baseReason = definition.why;

  if (state.status === "ready") {
    return {
      action: "approved",
      resultSummary: sanitizeRunnerText(
        `${definition.actionLabel} is ready for dry-run execution with no live side effects at ${normalizeTimestamp(now)}.`
      )
    };
  }

  const deniedSummaryMap: Record<Exclude<LiveActionRunnerBlockReason, "">, string> = {
    denied: `Permission denied for ${what}. Review required before execution.`,
    "timed-out": "Permission timed out; request must be re-approved before execution.",
    idle: "Permission not requested. Action must be requested first.",
    requested: "Permission remains pending and is awaiting approval.",
    expired: `Approval expired at ${normalizeTimestamp(now)}; re-approval is required.`,
    "provider-mismatch": "Runner provider does not match requested provider.",
    "risk-blocked": "Risk policy blocked execution. Review policy before dry-run."
  };

  return {
    action: state.blockReason === "denied"
      ? "denied"
      : state.blockReason === "timed-out"
        ? "timed-out"
        : state.blockReason === "provider-mismatch"
          ? "requested"
          : "requested",
    resultSummary: sanitizeRunnerText(
      `${baseReason} ${deniedSummaryMap[state.blockReason as Exclude<LiveActionRunnerBlockReason, "">]}`
    )
  };
}

export function evaluateLiveActionRunnerExecution(
  definition: LiveActionRunnerDefinition,
  request: LiveActionPermissionRequest,
  now: string | Date = new Date(),
  evaluatedAt: string = new Date().toISOString()
): LiveActionRunnerExecutionResult {
  const inputSnapshot = {
    id: request.id,
    provider: request.provider,
    actionLabel: request.actionLabel,
    state: request.state,
    requestedAt: request.requestedAt,
    timeoutMs: request.timeoutMs,
    expiresAt: request.expiresAt,
    risk: request.risk
  };

  const state = resolveBlockState(definition, request, now);
  const audited = buildAuditResult(definition, request, state, now);
  const auditInput = {
    what: definition.actionLabel,
    why: definition.why,
    provider: definition.provider,
    workspace: definition.workspace,
    service: definition.service,
    resultSummary: audited.resultSummary,
    risk: resolveLiveActionRisk(request.provider, request.risk)
  };
  const record = createLiveActionAuditRecord(
    auditInput,
    audited.action,
    normalizeTimestamp(evaluatedAt)
  );
  const safeReason = sanitizeRunnerText(audited.resultSummary);

  return {
    id: `${definition.provider}:${normalizeProvider(inputSnapshot.provider)}:${inputSnapshot.id}`,
    provider: definition.provider,
    status: state.status,
    blockReason: state.blockReason,
    canExecute: state.canExecute,
    nextAction: state.nextAction,
    reason: safeReason,
    auditRecord: {
      ...record,
      what: sanitizeRunnerText(record.what),
      why: sanitizeRunnerText(record.why),
      provider: definition.provider,
      workspace: definition.workspace,
      service: definition.service,
      resultSummary: safeReason
    }
  };
}

const SUMMARY_PRIORITIES: Record<LiveActionRunnerNextAction, number> = {
  "resolve-provider-mismatch": 0,
  "resolve-denial": 1,
  "re-request-approval": 2,
  "request-approval": 3,
  "review-risk-policy": 4,
  "run-dry-run": 5
};

export function summarizeLiveActionRunnerExecutions(
  evaluations: readonly LiveActionRunnerExecutionResult[]
): LiveActionRunnerSummary {
  const summary = evaluations.reduce<{
    total: number;
    ready: number;
    blocked: number;
    nextAction: LiveActionRunnerNextAction;
  }>(
    (acc, evaluation) => ({
      total: acc.total + 1,
      ready: acc.ready + (evaluation.status === "ready" ? 1 : 0),
      blocked: acc.blocked + (evaluation.status === "blocked" ? 1 : 0),
      nextAction:
        acc.nextAction === "run-dry-run"
          ? evaluation.nextAction
          : SUMMARY_PRIORITIES[evaluation.nextAction] < SUMMARY_PRIORITIES[acc.nextAction]
            ? evaluation.nextAction
            : acc.nextAction
    }),
    {
      total: 0,
      ready: 0,
      blocked: 0,
      nextAction: "run-dry-run"
    }
  );

  return {
    ...summary,
    readiness:
      summary.total === 0 ? 0 : Math.round((summary.ready / summary.total) * 100)
  };
}
