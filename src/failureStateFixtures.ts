export type FailureStateFixtureId =
  | "failure-offline-runtime"
  | "failure-missing-auth"
  | "failure-app-server-unavailable"
  | "failure-stream-timeout"
  | "failure-unsupported-capability"
  | "failure-rate-limit";

export type FailureStateFixtureState = "ready" | "review" | "blocked";

export type FailureStateFixtureSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface FailureStateFixture {
  readonly id: FailureStateFixtureId;
  readonly label: string;
  readonly state: FailureStateFixtureState;
  readonly severity: FailureStateFixtureSeverity;
  readonly providerNeutral: true;
  readonly detail: string;
  readonly nextAction: string;
  readonly safety: string;
}

export interface FailureStateFixtureSummary {
  readonly total: number;
  readonly ready: number;
  readonly review: number;
  readonly blocked: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly info: number;
  readonly readiness: number;
  readonly state: FailureStateFixtureState;
  readonly statusLabel: string;
  readonly nextAction: {
    readonly fixtureId: FailureStateFixtureId | "none";
    readonly severity: FailureStateFixtureSeverity;
    readonly state: FailureStateFixtureState;
    readonly label: string;
  };
}

export type FailureStateFixtureOverrides = Partial<
  Record<
    FailureStateFixtureId,
    Partial<
      Pick<FailureStateFixture, "state" | "severity" | "label" | "detail" | "nextAction" | "safety">
    >
  >
>;

interface FailureStateFixtureLike {
  readonly id: string;
  readonly label?: string;
  readonly state?: string;
  readonly severity?: string;
  readonly detail?: string;
  readonly nextAction?: string;
  readonly safety?: string;
}

export const FAILURE_STATE_FIXTURE_ORDER = [
  "failure-offline-runtime",
  "failure-missing-auth",
  "failure-app-server-unavailable",
  "failure-stream-timeout",
  "failure-unsupported-capability",
  "failure-rate-limit"
] as const;

const SAFETY_COPY =
  "No process execution, filesystem action, or network action is performed by this fixture.";

const STATES: Record<FailureStateFixtureState, { readonly weight: number; readonly label: string }> = {
  ready: { weight: 100, label: "Ready" },
  review: { weight: 60, label: "Review" },
  blocked: { weight: 20, label: "Blocked" }
};

const SEVERITY_WEIGHT: Record<FailureStateFixtureSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1
};

const STATE_PRIORITY: Record<FailureStateFixtureState, number> = {
  blocked: 3,
  review: 2,
  ready: 1
};

const OFFLINE_RUNTIME = {
  id: "failure-offline-runtime",
  label: "Offline runtime",
  state: "blocked",
  severity: "critical",
  providerNeutral: true,
  detail: "Runtime transport is unavailable for owner testing.",
  nextAction: "Restart the local runtime transport and re-check availability before retrying.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const MISSING_AUTH = {
  id: "failure-missing-auth",
  label: "Missing auth",
  state: "blocked",
  severity: "critical",
  providerNeutral: true,
  detail: "Owner authentication is not present for test actions.",
  nextAction: "Re-establish owner auth in the configured local session flow.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const APP_SERVER_UNAVAILABLE = {
  id: "failure-app-server-unavailable",
  label: "App-server unavailable",
  state: "blocked",
  severity: "high",
  providerNeutral: true,
  detail: "Live action control is unavailable while the app-server bridge is down.",
  nextAction:
    "Verify bridge startup and retry control registration before continuing owner testing.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const STREAM_TIMEOUT = {
  id: "failure-stream-timeout",
  label: "Stream timeout",
  state: "review",
  severity: "high",
  providerNeutral: true,
  detail: "Session stream events did not arrive within the expected window.",
  nextAction: "Re-check stream readiness and resume owner testing from the current live session.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const UNSUPPORTED_CAPABILITY = {
  id: "failure-unsupported-capability",
  label: "Unsupported capability",
  state: "review",
  severity: "medium",
  providerNeutral: true,
  detail: "An owner action requested a capability not supported by the active profile.",
  nextAction:
    "Disable unsupported actions and continue with provider-compatible controls only.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const RATE_LIMIT = {
  id: "failure-rate-limit",
  label: "Rate limit",
  state: "review",
  severity: "medium",
  providerNeutral: true,
  detail: "Request throughput is currently limited by the active action channel.",
  nextAction: "Back off briefly and use throttled owner checks on recovery windows.",
  safety: SAFETY_COPY
} satisfies Omit<FailureStateFixture, "providerNeutral"> & { providerNeutral: true };

const BASE_FIXTURES: Record<FailureStateFixtureId, FailureStateFixture> = {
  "failure-offline-runtime": OFFLINE_RUNTIME,
  "failure-missing-auth": MISSING_AUTH,
  "failure-app-server-unavailable": APP_SERVER_UNAVAILABLE,
  "failure-stream-timeout": STREAM_TIMEOUT,
  "failure-unsupported-capability": UNSUPPORTED_CAPABILITY,
  "failure-rate-limit": RATE_LIMIT
};

export const FAILURE_STATE_FIXTURES: readonly FailureStateFixture[] = FAILURE_STATE_FIXTURE_ORDER.map(
  (id) => BASE_FIXTURES[id]
);

export function isFailureStateFixtureId(id: string): id is FailureStateFixtureId {
  return (FAILURE_STATE_FIXTURE_ORDER as readonly string[]).includes(id);
}

function isKnownState(
  state: string | undefined
): state is FailureStateFixtureState {
  return state === "ready" || state === "review" || state === "blocked";
}

function isKnownSeverity(
  severity: string | undefined
): severity is FailureStateFixtureSeverity {
  return severity === "critical" || severity === "high" || severity === "medium" || severity === "low" || severity === "info";
}

function normalizeTrimmedText(value: string | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? fallback : normalized;
}

export function normalizeFailureStateFixture(
  fixture: FailureStateFixtureLike
): FailureStateFixture {
  const id = isFailureStateFixtureId(fixture.id) ? fixture.id : "failure-offline-runtime";
  const template = BASE_FIXTURES[id];

  return {
    ...template,
    label: normalizeTrimmedText(fixture.label, template.label),
    state: isKnownState(fixture.state) ? fixture.state : template.state,
    severity: isKnownSeverity(fixture.severity) ? fixture.severity : template.severity,
    detail: normalizeTrimmedText(fixture.detail, template.detail),
    nextAction: normalizeTrimmedText(fixture.nextAction, template.nextAction),
    safety: normalizeTrimmedText(fixture.safety, template.safety),
    providerNeutral: true
  };
}

export function buildFailureStateFixtures(
  overrides: FailureStateFixtureOverrides = {}
): readonly FailureStateFixture[] {
  const safeOverrides = { ...overrides };
  return FAILURE_STATE_FIXTURE_ORDER.map((id) => {
    const template = BASE_FIXTURES[id];
    const rawOverride = safeOverrides[id];
    if (rawOverride === undefined) {
      return { ...template };
    }

    return normalizeFailureStateFixture({
      id,
      label: rawOverride.label,
      state: rawOverride.state,
      severity: rawOverride.severity,
      detail: rawOverride.detail,
      nextAction: rawOverride.nextAction,
      safety: rawOverride.safety
    });
  });
}

function readinessFromFixtureTotals(total: number, sum: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round(sum / total);
}

export function summarizeFailureStateFixtures(
  fixtures: readonly FailureStateFixture[] = FAILURE_STATE_FIXTURES
): FailureStateFixtureSummary {
  let ready = 0;
  let review = 0;
  let blocked = 0;
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let info = 0;
  let weightedStateSum = 0;
  let total = 0;

  const orderedFixtures: FailureStateFixture[] = [];

  for (const id of FAILURE_STATE_FIXTURE_ORDER) {
    const template = BASE_FIXTURES[id];
    const input =
      fixtures.find((fixture) => fixture.id === id) ?? template;
    const normalized = normalizeFailureStateFixture(input);

    orderedFixtures.push(normalized);
    total += 1;
    weightedStateSum += STATES[normalized.state].weight;

    switch (normalized.state) {
      case "ready":
        ready += 1;
        break;
      case "review":
        review += 1;
        break;
      case "blocked":
        blocked += 1;
        break;
    }

    switch (normalized.severity) {
      case "critical":
        critical += 1;
        break;
      case "high":
        high += 1;
        break;
      case "medium":
        medium += 1;
        break;
      case "low":
        low += 1;
        break;
      case "info":
        info += 1;
        break;
    }
  }

  let chosen: FailureStateFixture | undefined;

  for (const fixture of orderedFixtures) {
    if (fixture.state === "ready") {
      continue;
    }

    if (
      !chosen ||
      STATE_PRIORITY[fixture.state] > STATE_PRIORITY[chosen.state] ||
      (STATE_PRIORITY[fixture.state] === STATE_PRIORITY[chosen.state] &&
        SEVERITY_WEIGHT[fixture.severity] > SEVERITY_WEIGHT[chosen.severity])
    ) {
      chosen = fixture;
    }
  }

  const summaryState =
    blocked > 0 ? "blocked" : review > 0 ? "review" : "ready";
  const stateReadiness =
    summaryState === "ready"
      ? 100
      : readinessFromFixtureTotals(total, weightedStateSum);

  return {
    total,
    ready,
    review,
    blocked,
    critical,
    high,
    medium,
    low,
    info,
    readiness: stateReadiness,
    state: summaryState,
    statusLabel: STATES[summaryState].label,
    nextAction: chosen
      ? {
          fixtureId: chosen.id,
          severity: chosen.severity,
          state: chosen.state,
          label: chosen.nextAction
        }
      : {
          fixtureId: "none",
          severity: "info",
          state: "ready",
          label: "All owner testing failure states are clear for hardening checks."
        }
  };
}
