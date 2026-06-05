import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";

export type RuntimeLaunchHandoffAcceptanceTone =
  "ready" | "review" | "blocked" | "waiting";

export type RuntimeLaunchHandoffAcceptanceCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface RuntimeLaunchHandoffAcceptance {
  label: string;
  detail: string;
  tone: RuntimeLaunchHandoffAcceptanceTone;
  checkLabel: string;
  checks: RuntimeLaunchHandoffAcceptanceCheck[];
  ariaLabel: string;
}

const HANDOFF_LABEL: Record<RuntimeLaunchHandoffAcceptanceTone, string> = {
  ready: "Runtime handoff acceptance ready",
  review: "Runtime handoff acceptance needs review",
  blocked: "Runtime handoff acceptance blocked",
  waiting: "Runtime handoff acceptance waiting"
};

const HANDOFF_DETAIL: Record<RuntimeLaunchHandoffAcceptanceTone, string> = {
  ready:
    "Event source, connection, launch request, and approval checks are ready for runtime handoff.",
  review:
    "Some runtime handoff checks need review before adapter launch coverage is stable.",
  blocked:
    "Resolve event-source, connection, launch request, or approval blockers before runtime handoff.",
  waiting:
    "Runtime handoff acceptance is waiting for source, connection, launch request, and approval data."
};

function resolveEventSourceTone(
  source: RuntimeEventSourceSnapshot | undefined
): RuntimeLaunchHandoffAcceptanceCheck["tone"] {
  if (!source) {
    return "neutral";
  }

  if (source.state === "blocked" || source.blocked > 0) {
    return "blocked";
  }

  if ((source.state === "ready" || source.state === "emitting" || source.state === "complete") && source.total > 0) {
    return "ok";
  }

  if (source.state === "paused" || source.state === "offline" || source.total === 0) {
    return "review";
  }

  return "neutral";
}

function resolveConnectionTone(
  connection: RuntimeSourceConnectionSnapshot | undefined
): RuntimeLaunchHandoffAcceptanceCheck["tone"] {
  if (!connection) {
    return "neutral";
  }

  if (connection.state === "blocked") {
    return "blocked";
  }

  if (connection.state === "ready" && connection.canAttach) {
    return "ok";
  }

  if (connection.state === "waiting" || connection.state === "mock") {
    return "review";
  }

  return "neutral";
}

function resolveLaunchRequestTone(
  launchRequest: RuntimeLaunchRequestSnapshot | undefined
): RuntimeLaunchHandoffAcceptanceCheck["tone"] {
  if (!launchRequest) {
    return "neutral";
  }

  if (launchRequest.state === "blocked") {
    return "blocked";
  }

  if (launchRequest.state === "ready" && launchRequest.canRequest && launchRequest.requiresApproval) {
    return "ok";
  }

  if (launchRequest.state === "preview" || launchRequest.state === "waiting") {
    return "review";
  }

  return "neutral";
}

function resolveApprovalTone(
  approval: RuntimeLaunchApprovalSnapshot | undefined
): RuntimeLaunchHandoffAcceptanceCheck["tone"] {
  if (!approval) {
    return "neutral";
  }

  if (approval.state === "blocked") {
    return "blocked";
  }

  if (approval.state === "requestable" || approval.state === "requested") {
    return "ok";
  }

  if (approval.state === "waiting") {
    return "review";
  }

  return "neutral";
}

function computeOverallTone(
  checks: readonly RuntimeLaunchHandoffAcceptanceCheck[]
): RuntimeLaunchHandoffAcceptanceTone {
  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  if (checks.every((check) => check.tone === "neutral")) {
    return "waiting";
  }

  if (checks.every((check) => check.tone === "ok")) {
    return "ready";
  }

  return "review";
}

export function createRuntimeLaunchHandoffAcceptance(
  source?: RuntimeEventSourceSnapshot,
  connection?: RuntimeSourceConnectionSnapshot,
  launchRequest?: RuntimeLaunchRequestSnapshot,
  approval?: RuntimeLaunchApprovalSnapshot
): RuntimeLaunchHandoffAcceptance {
  const checks: RuntimeLaunchHandoffAcceptanceCheck[] = [
    {
      label: "Event source",
      value: source?.state ?? "missing",
      tone: resolveEventSourceTone(source)
    },
    {
      label: "Connection",
      value: connection?.state ?? "missing",
      tone: resolveConnectionTone(connection)
    },
    {
      label: "Launch request",
      value: launchRequest?.state ?? "missing",
      tone: resolveLaunchRequestTone(launchRequest)
    },
    {
      label: "Approval",
      value: approval?.state ?? "missing",
      tone: resolveApprovalTone(approval)
    }
  ];

  const tone = computeOverallTone(checks);
  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;

  return {
    label: HANDOFF_LABEL[tone],
    detail: HANDOFF_DETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${HANDOFF_LABEL[tone]}: ${checkLabel}; ` +
      `Source state ${source?.state ?? "missing"}; ` +
      `Connection state ${connection?.state ?? "missing"}; ` +
      `Launch request state ${launchRequest?.state ?? "missing"}; ` +
      `Approval state ${approval?.state ?? "missing"}; ` +
      `Event source ${checks[0].value}; ` +
      `Connection ${checks[1].value}; ` +
      `Launch request ${checks[2].value}; ` +
      `Approval ${checks[3].value}`
  };
}
