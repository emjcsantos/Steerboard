export type Phase11EvidenceGate =
  | "fresh-checkout"
  | "clean-checkout"
  | "build-test"
  | "docs-known-limits"
  | "release-decision";

export type Phase11EvidenceRecordState = "ready" | "review" | "blocked" | "waiting";
export type Phase11EvidenceRecordsState = Phase11EvidenceRecordState;
export type Phase11EvidenceRecordFreshness = "fresh" | "stale" | "missing" | "malformed";

export interface Phase11EvidenceRecordInput {
  readonly gate: Phase11EvidenceGate;
  readonly state?: unknown;
  readonly source?: unknown;
  readonly recordedAt?: unknown;
  readonly detail?: unknown;
}

export interface Phase11EvidenceRecordSnapshot {
  readonly gate: Phase11EvidenceGate;
  readonly label: string;
  readonly state: Phase11EvidenceRecordState;
  readonly freshness: Phase11EvidenceRecordFreshness;
  readonly source: string;
  readonly recordedAt: string;
  readonly detail: string;
  readonly nextAction: string;
  readonly ageHours?: number;
  readonly safety: string;
}

export interface Phase11EvidenceRecordsSnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11EvidenceRecordsState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly records: Record<Phase11EvidenceGate, Phase11EvidenceRecordSnapshot>;
  readonly totalGateCount: number;
  readonly openGateCount: number;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly staleCount: number;
  readonly missingCount: number;
  readonly malformedCount: number;
  readonly nextAction: string;
  readonly ariaLabel: string;
}

const SNAPSHOT_ID = "phase-11-evidence-records";
const SNAPSHOT_LABEL = "Phase 11 evidence records";
const SAFETY =
  "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions.";
const STALE_AFTER_HOURS = 72;

const STATUS_LABELS: Record<Phase11EvidenceRecordsState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const GATE_LABELS: Record<Phase11EvidenceGate, string> = {
  "fresh-checkout": "Fresh checkout",
  "clean-checkout": "Clean checkout",
  "build-test": "Build and test",
  "docs-known-limits": "Docs and known limits",
  "release-decision": "Release decision evidence"
};

const DEFAULT_NEXT_ACTIONS: Record<Phase11EvidenceGate, string> = {
  "fresh-checkout": "Record fresh-checkout install, test, build, desktop run, and proof-panel evidence after live workflow blockers clear.",
  "clean-checkout": "Record clean-checkout install, dependency verification, and startup proof before release readiness.",
  "build-test": "Record the final test and build pass before release packaging is reconsidered.",
  "docs-known-limits": "Record release docs, owner checklist, packaging limits, and known limits review before release.",
  "release-decision": "Record release-decision evidence metadata before release readiness can recommend release."
};

const READY_NEXT_ACTIONS: Record<Phase11EvidenceGate, string> = {
  "fresh-checkout": "Keep fresh-checkout evidence attached to the owner command center.",
  "clean-checkout": "Keep clean-checkout proof attached to the release record.",
  "build-test": "Keep the final test and build output attached to the release record.",
  "docs-known-limits": "Keep release docs and known limits attached to the readiness record.",
  "release-decision": "Keep owner release-decision evidence attached while current active Phase 3 clearance PM traceability with handoff proof stays attached and packaging remains locked for explicit owner resume."
};

const FRESH_CHECKOUT_REQUIRED_DETAIL_TERMS = [
  "install",
  "test",
  "build",
  "desktop",
  "proof-panel"
];

function normalizeState(value: unknown): Phase11EvidenceRecordState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (
    normalized === "ready" ||
    normalized === "review" ||
    normalized === "blocked" ||
    normalized === "waiting"
  ) {
    return normalized;
  }
  return undefined;
}

function publicText(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const sanitized = value
    .replace(/[A-Za-z]:[\\/][^\s]+/g, "local path")
    .replace(/[\\/](Users|Projects|Documents|Desktop)[\\/][^\s]+/gi, "local path")
    .replace(/sk-[A-Za-z0-9_-]+/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function validDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function ageHours(recordedAt: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - recordedAt.getTime()) / 36_000) / 100);
}

function missingFreshCheckoutTerms(detail: string): string[] {
  const normalized = detail.toLowerCase().replace(/\s+/g, " ");

  return FRESH_CHECKOUT_REQUIRED_DETAIL_TERMS.filter((term) => {
    if (term === "proof-panel") {
      return !normalized.includes("proof-panel") && !normalized.includes("proof panel");
    }

    return !normalized.includes(term);
  });
}

function stateWeight(state: Phase11EvidenceRecordState): number {
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

function scoreRecords(records: readonly Phase11EvidenceRecordSnapshot[]): number {
  if (records.length === 0) {
    return 0;
  }

  return Math.round(
    records.reduce((sum, record) => sum + stateWeight(record.state), 0) / records.length
  );
}

function resolveRecordsState(
  records: readonly Phase11EvidenceRecordSnapshot[]
): Phase11EvidenceRecordsState {
  if (records.some((record) => record.state === "blocked")) {
    return "blocked";
  }
  if (records.some((record) => record.state === "review")) {
    return "review";
  }
  if (records.some((record) => record.state === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstRecordNextAction(records: readonly Phase11EvidenceRecordSnapshot[]): string {
  return (
    records.find((record) => record.state === "blocked")?.nextAction ??
    records.find((record) => record.state === "review")?.nextAction ??
    records.find((record) => record.state === "waiting")?.nextAction ??
    "Keep all Phase 11 evidence records attached while release packaging remains held."
  );
}

function buildAriaLabel(input: {
  label: string;
  statusLabel: string;
  readiness: number;
  openGateCount: number;
  missingCount: number;
  staleCount: number;
  malformedCount: number;
  nextAction: string;
}): string {
  return (
    `${input.label}: ${input.statusLabel}; ${input.readiness}% ready; ` +
    `${input.openGateCount} open evidence gates; ${input.missingCount} missing; ` +
    `${input.staleCount} stale; ${input.malformedCount} malformed; next action: ${input.nextAction}`
  );
}

export function evaluatePhase11EvidenceRecord(
  gate: Phase11EvidenceGate,
  input?: Phase11EvidenceRecordInput,
  nowIso = new Date().toISOString()
): Phase11EvidenceRecordSnapshot {
  const now = validDate(nowIso) ?? new Date();
  const label = GATE_LABELS[gate];

  if (!input) {
    return {
      gate,
      label,
      state: "waiting",
      freshness: "missing",
      source: "missing",
      recordedAt: "missing",
      detail: `${label} evidence has not been recorded.`,
      nextAction: DEFAULT_NEXT_ACTIONS[gate],
      safety: SAFETY
    };
  }

  const state = normalizeState(input.state);
  const recordedAtDate = validDate(input.recordedAt);
  const inputGateMatches = input.gate === gate;

  if (!state || !recordedAtDate || !inputGateMatches) {
    return {
      gate,
      label,
      state: "blocked",
      freshness: "malformed",
      source: publicText(input.source, "malformed"),
      recordedAt: publicText(input.recordedAt, "malformed"),
      detail: inputGateMatches
        ? `${label} evidence is malformed or missing required state/timestamp metadata.`
        : `${label} evidence is malformed because it was recorded for ${GATE_LABELS[input.gate]}.`,
      nextAction: `Repair ${label.toLowerCase()} evidence metadata before release readiness.`,
      safety: SAFETY
    };
  }

  if (recordedAtDate.getTime() > now.getTime()) {
    return {
      gate,
      label,
      state: "blocked",
      freshness: "malformed",
      source: publicText(input.source, "local evidence"),
      recordedAt: recordedAtDate.toISOString(),
      detail: `${label} evidence is future-dated and cannot be trusted for release readiness.`,
      nextAction: `Repair ${label.toLowerCase()} evidence timestamp before release readiness.`,
      safety: SAFETY
    };
  }

  const hours = ageHours(recordedAtDate, now);
  if (hours > STALE_AFTER_HOURS) {
    return {
      gate,
      label,
      state: "review",
      freshness: "stale",
      source: publicText(input.source, "local evidence"),
      recordedAt: recordedAtDate.toISOString(),
      detail: `${label} evidence is ${hours} hours old and needs owner review.`,
      nextAction: `Refresh or re-review ${label.toLowerCase()} evidence before release readiness.`,
      ageHours: hours,
      safety: SAFETY
    };
  }

  const source = publicText(input.source, "local evidence");
  const detail = publicText(input.detail, `${label} evidence recorded.`);
  const missingFreshTerms =
    gate === "fresh-checkout" && state === "ready"
      ? missingFreshCheckoutTerms(detail)
      : [];

  if (missingFreshTerms.length > 0) {
    return {
      gate,
      label,
      state: "review",
      freshness: "fresh",
      source,
      recordedAt: recordedAtDate.toISOString(),
      detail: `${label} evidence is fresh but missing checklist coverage for ${missingFreshTerms.join(", ")}.`,
      nextAction:
        "Attach fresh-checkout install, test, build, desktop run, and proof-panel evidence metadata before release readiness can proceed.",
      ageHours: hours,
      safety: SAFETY
    };
  }

  return {
    gate,
    label,
    state,
    freshness: "fresh",
    source,
    recordedAt: recordedAtDate.toISOString(),
    detail,
    nextAction:
      state === "ready"
        ? READY_NEXT_ACTIONS[gate]
        : state === "blocked"
          ? `Resolve blocked ${label.toLowerCase()} evidence before release readiness.`
          : state === "review"
            ? `Review ${label.toLowerCase()} evidence before release readiness.`
            : DEFAULT_NEXT_ACTIONS[gate],
    ageHours: hours,
    safety: SAFETY
  };
}

export function buildPhase11EvidenceRecords(
  inputs: Partial<Record<Phase11EvidenceGate, Phase11EvidenceRecordInput>> = {},
  nowIso = new Date().toISOString()
): Phase11EvidenceRecordsSnapshot {
  const records = {
    "fresh-checkout": evaluatePhase11EvidenceRecord("fresh-checkout", inputs["fresh-checkout"], nowIso),
    "clean-checkout": evaluatePhase11EvidenceRecord("clean-checkout", inputs["clean-checkout"], nowIso),
    "build-test": evaluatePhase11EvidenceRecord("build-test", inputs["build-test"], nowIso),
    "docs-known-limits": evaluatePhase11EvidenceRecord("docs-known-limits", inputs["docs-known-limits"], nowIso),
    "release-decision": evaluatePhase11EvidenceRecord("release-decision", inputs["release-decision"], nowIso)
  };
  const values = Object.values(records);
  const state = resolveRecordsState(values);
  const readiness = scoreRecords(values);
  const openGateCount = values.filter((record) => record.state !== "ready").length;
  const nextAction = firstRecordNextAction(values);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    records,
    totalGateCount: values.length,
    openGateCount,
    readyCount: values.filter((record) => record.state === "ready").length,
    reviewCount: values.filter((record) => record.state === "review").length,
    blockedCount: values.filter((record) => record.state === "blocked").length,
    waitingCount: values.filter((record) => record.state === "waiting").length,
    staleCount: values.filter((record) => record.freshness === "stale").length,
    missingCount: values.filter((record) => record.freshness === "missing").length,
    malformedCount: values.filter((record) => record.freshness === "malformed").length,
    nextAction
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
