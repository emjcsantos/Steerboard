import type { RuntimeAdapter } from "./runtime";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

export type RuntimeRecoveryFailureCoverageTone = "covered" | "review" | "blocked" | "waiting";

export type RuntimeRecoveryFailureCoverageCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface RuntimeRecoveryFailureCoverage {
  label: string;
  detail: string;
  tone: RuntimeRecoveryFailureCoverageTone;
  checkLabel: string;
  checks: RuntimeRecoveryFailureCoverageCheck[];
  ariaLabel: string;
}

const COVERAGE_LABELS: Record<RuntimeRecoveryFailureCoverageTone, string> = {
  covered: "Runtime recovery coverage complete",
  review: "Runtime recovery coverage needs review",
  blocked: "Runtime recovery coverage blocked",
  waiting: "Runtime recovery coverage waiting"
};

const COVERAGE_DETAILS: Record<RuntimeRecoveryFailureCoverageTone, string> = {
  covered:
    "Adapter recovery, external-source state, failure-state handling, and safe handoff coverage are ready.",
  review:
    "Some runtime recovery or failure-state checks need review before adapter coverage is complete.",
  blocked:
    "Resolve adapter recovery, external-source, failure-state, or handoff blockers before closing runtime coverage.",
  waiting: "Runtime recovery coverage is waiting for adapter, source, failure, and handoff data."
};

function toSafeReadiness(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveAdapterRecoveryTone(adapter?: RuntimeAdapter): RuntimeRecoveryFailureCoverageCheck {
  if (adapter === undefined) {
    return {
      label: "Adapter recovery",
      value: "missing",
      tone: "neutral"
    };
  }

  const readiness = toSafeReadiness(adapter.readiness);
  const readinessValue = `${readiness}%`;

  if (adapter.state === "blocked" || readiness === 0) {
    return {
      label: "Adapter recovery",
      value: `${adapter.state}; readiness ${readinessValue}`,
      tone: "blocked"
    };
  }

  if (
    adapter.state === "ready" ||
    adapter.state === "limited"
  ) {
    if (readiness >= 60) {
      return {
        label: "Adapter recovery",
        value: `${adapter.state}; readiness ${readinessValue}`,
        tone: "ok"
      };
    }

    return {
      label: "Adapter recovery",
      value: `${adapter.state}; readiness ${readinessValue}`,
      tone: "review"
    };
  }

  if (
    adapter.state === "checking" ||
    adapter.state === "not_configured"
  ) {
    return {
      label: "Adapter recovery",
      value: `${adapter.state}; readiness ${readinessValue}`,
      tone: readiness > 0 ? "review" : "blocked"
    };
  }

  return {
    label: "Adapter recovery",
    value: `${adapter.state}; readiness ${readinessValue}`,
    tone: "neutral"
  };
}

function resolveExternalSourceTone(source?: RuntimeEventSourceSnapshot): RuntimeRecoveryFailureCoverageCheck {
  if (source === undefined) {
    return {
      label: "External source",
      value: "missing",
      tone: "neutral"
    };
  }

  if (source.state === "blocked" || source.blocked > 0) {
    return {
      label: "External source",
      value: `mode=${source.mode}; state=${source.state}; total=${source.total}; blocked=${source.blocked}`,
      tone: "blocked"
    };
  }

  if (
    source.mode === "mock" ||
    source.state === "paused" ||
    source.state === "offline" ||
    source.total === 0
  ) {
    return {
      label: "External source",
      value: `mode=${source.mode}; state=${source.state}; total=${source.total}; review=${source.review}`,
      tone: "review"
    };
  }

  return {
    label: "External source",
    value: `mode=${source.mode}; state=${source.state}; total=${source.total}; review=${source.review}; blocked=${source.blocked}`,
    tone: "ok"
  };
}

function resolveFailureStateTone(
  source?: RuntimeEventSourceSnapshot,
  stream?: RuntimeStreamSnapshot
): RuntimeRecoveryFailureCoverageCheck {
  if (source === undefined && stream === undefined) {
    return {
      label: "Failure state",
      value: "missing",
      tone: "neutral"
    };
  }

  const sourceBlocked = source?.blocked ?? 0;
  const sourceReview = source?.review ?? 0;
  const streamBlocked = stream?.blocked ?? 0;
  const streamReview = stream?.review ?? 0;
  const sourceState = source?.state ?? "idle";
  const streamState = stream?.state ?? "idle";

  if (
    sourceBlocked > 0 ||
    streamBlocked > 0 ||
    sourceState === "blocked" ||
    streamState === "blocked"
  ) {
    return {
      label: "Failure state",
      value: `source(state=${sourceState}, blocked=${sourceBlocked}, review=${sourceReview}); stream(state=${streamState}, blocked=${streamBlocked}, review=${streamReview})`,
      tone: "blocked"
    };
  }

  if (sourceReview > 0 || streamReview > 0) {
    return {
      label: "Failure state",
      value: `source(review=${sourceReview}, blocked=${sourceBlocked}); stream(review=${streamReview}, blocked=${streamBlocked})`,
      tone: "review"
    };
  }

  return {
    label: "Failure state",
    value: `source(state=${sourceState}, blocked=${sourceBlocked}); stream(state=${streamState}, blocked=${streamBlocked})`,
    tone: "ok"
  };
}

function resolveSafeHandoffTone(
  connection?: RuntimeSourceConnectionSnapshot,
  launchRequest?: RuntimeLaunchRequestSnapshot,
  approval?: RuntimeLaunchApprovalSnapshot
): RuntimeRecoveryFailureCoverageCheck {
  if (
    connection === undefined &&
    launchRequest === undefined &&
    approval === undefined
  ) {
    return {
      label: "Safe handoff",
      value: "missing",
      tone: "neutral"
    };
  }

  if (
    connection?.state === "blocked" ||
    launchRequest?.state === "blocked" ||
    approval?.state === "blocked"
  ) {
    return {
      label: "Safe handoff",
      value:
        `connection=${connection?.state ?? "missing"}, launchRequest=${launchRequest?.state ?? "missing"}, approval=${approval?.state ?? "missing"}`,
      tone: "blocked"
    };
  }

  if (
    connection?.canAttach ||
    launchRequest?.canRequest ||
    approval?.state === "requestable" ||
    approval?.state === "requested"
  ) {
    return {
      label: "Safe handoff",
      value:
        `connection=${connection?.state ?? "missing"}, canAttach=${String(connection?.canAttach ?? false)}; ` +
        `launchRequest=${launchRequest?.state ?? "missing"}, canRequest=${String(launchRequest?.canRequest ?? false)}; ` +
        `approval=${approval?.state ?? "missing"}`,
      tone: "ok"
    };
  }

  if (
    connection?.state === "waiting" ||
    connection?.state === "mock" ||
    launchRequest?.state === "preview" ||
    launchRequest?.state === "waiting" ||
    approval?.state === "waiting"
  ) {
    return {
      label: "Safe handoff",
      value:
        `connection=${connection?.state ?? "missing"}, canAttach=${String(connection?.canAttach ?? false)}; ` +
        `launchRequest=${launchRequest?.state ?? "missing"}, canRequest=${String(launchRequest?.canRequest ?? false)}; ` +
        `approval=${approval?.state ?? "missing"}`,
      tone: "review"
    };
  }

  return {
    label: "Safe handoff",
    value:
      `connection=${connection?.state ?? "missing"}, canAttach=${String(connection?.canAttach ?? false)}; ` +
      `launchRequest=${launchRequest?.state ?? "missing"}, canRequest=${String(launchRequest?.canRequest ?? false)}; ` +
      `approval=${approval?.state ?? "missing"}`,
    tone: "neutral"
  };
}

function resolveCoverageTone(
  checks: RuntimeRecoveryFailureCoverageCheck[]
): RuntimeRecoveryFailureCoverageTone {
  if (checks.every((check) => check.tone === "neutral")) {
    return "waiting";
  }

  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  const nonNeutral = checks.filter((check) => check.tone !== "neutral");
  const okCount = checks.filter((check) => check.tone === "ok").length;
  const allNonNeutralOk = nonNeutral.every((check) => check.tone === "ok");

  if (allNonNeutralOk && okCount >= 3) {
    return "covered";
  }

  return "review";
}

function buildStateLabel(value: string | undefined): string {
  return value === undefined ? "missing" : value;
}

export function createRuntimeRecoveryFailureCoverage(
  adapter?: RuntimeAdapter,
  source?: RuntimeEventSourceSnapshot,
  connection?: RuntimeSourceConnectionSnapshot,
  launchRequest?: RuntimeLaunchRequestSnapshot,
  approval?: RuntimeLaunchApprovalSnapshot,
  stream?: RuntimeStreamSnapshot
): RuntimeRecoveryFailureCoverage {
  const checks: RuntimeRecoveryFailureCoverageCheck[] = [
    resolveAdapterRecoveryTone(adapter),
    resolveExternalSourceTone(source),
    resolveFailureStateTone(source, stream),
    resolveSafeHandoffTone(connection, launchRequest, approval)
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;
  const tone = resolveCoverageTone(checks);

  return {
    label: COVERAGE_LABELS[tone],
    detail: COVERAGE_DETAILS[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${COVERAGE_LABELS[tone]}: ${checkLabel}; ` +
      `adapter=${adapter?.state ?? "missing"}; ` +
      `source=${source ? `${source.mode} ${source.state}` : "missing"}; ` +
      `connection=${buildStateLabel(connection?.state)}; ` +
      `launchRequest=${buildStateLabel(launchRequest?.state)}; ` +
      `approval=${buildStateLabel(approval?.state)}; ` +
      `stream=${buildStateLabel(stream?.state)}; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
