export type Phase3SmokeProofReadinessState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3SmokeProofReadinessCounts {
  readonly ready: number;
  readonly review: number;
  readonly blocked: number;
  readonly waiting: number;
}

export interface Phase3SmokeProofReadinessItem {
  readonly proof: "live-control" | "active-turn-interrupt" | "active-turn-steer";
  readonly label: string;
  readonly state: Phase3SmokeProofReadinessState;
  readonly source: string;
  readonly checkedAt: string;
  readonly persisted: boolean;
  readonly detail: string;
}

export interface Phase3SmokeProofReadinessResult {
  readonly state: Phase3SmokeProofReadinessState;
  readonly readiness: number;
  readonly items: readonly Phase3SmokeProofReadinessItem[];
  readonly counts: Phase3SmokeProofReadinessCounts;
}

export interface Phase3SmokeProofReadinessInput {
  readonly liveControlSmoke?: unknown;
  readonly activeTurnInterruptSmoke?: unknown;
  readonly activeTurnSteerSmoke?: unknown;
  readonly persistedDesktopProofs?: {
    readonly liveControlSmoke?: boolean;
    readonly activeTurnInterruptSmoke?: boolean;
    readonly activeTurnSteerSmoke?: boolean;
  };
  readonly evaluatedAt?: string | Date;
  readonly maxProofAgeMs?: number;
}

export const DEFAULT_PHASE3_SMOKE_PROOF_MAX_AGE_MS =
  7 * 24 * 60 * 60 * 1000;

const PROOF_IDS = {
  liveControl: "live-control",
  activeTurnInterrupt: "active-turn-interrupt",
  activeTurnSteer: "active-turn-steer"
} as const;

const PROOF_LABELS = {
  liveControl: "Live-control desktop smoke proof",
  activeTurnInterrupt: "Active-turn interrupt desktop smoke proof",
  activeTurnSteer: "Active-turn steer desktop smoke proof"
} as const;

const READINESS_BY_STATE: Record<Phase3SmokeProofReadinessState, number> = {
  ready: 100,
  review: 65,
  blocked: 15,
  waiting: 35
};

const UNKNOWN_VALUE = "unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bool(value: unknown): boolean {
  return value === true;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function resolveSource(record: Record<string, unknown>): string {
  const value = optionalString(record.source);
  return value ? value : UNKNOWN_VALUE;
}

function resolveCheckedAt(record: Record<string, unknown>): string {
  return optionalString(record.checkedAt) ?? "unavailable";
}

function resolveDetail(label: string, state: Phase3SmokeProofReadinessState): string {
  if (state === "ready") {
    return `${label} is ready.`;
  }

  if (state === "blocked") {
    return `${label} is blocked after execution and should be rerun on desktop.`;
  }

  if (state === "review") {
    return `${label} ran in part and needs further desktop evidence.`;
  }

  return `${label} has not been executed on desktop yet.`;
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function resolveFreshnessDetail(
  label: string,
  state: Phase3SmokeProofReadinessState,
  source: string,
  checkedAt: string,
  evaluatedAt: string | Date | undefined,
  maxProofAgeMs: number
): string {
  const baseDetail = resolveDetail(label, state);

  if (state !== "ready" || source !== "desktop") {
    return baseDetail;
  }

  const evaluatedAtMs = toTimestamp(evaluatedAt);
  if (evaluatedAtMs === undefined) {
    return `${label} cannot be freshness-checked without an evaluation timestamp and must be reviewed before Phase 3 handoff.`;
  }

  const checkedAtMs = toTimestamp(checkedAt);
  if (checkedAtMs === undefined) {
    return `${label} has no valid checkedAt timestamp and must be rerun on desktop.`;
  }

  const proofAgeMs = evaluatedAtMs - checkedAtMs;
  if (proofAgeMs < 0) {
    return `${label} proof is dated after the current evaluation timestamp and must be rerun on desktop.`;
  }

  if (proofAgeMs > maxProofAgeMs) {
    return `${label} proof is stale; rerun the desktop smoke proof before Phase 3 handoff.`;
  }

  return baseDetail;
}

function applyFreshness(
  label: string,
  state: Phase3SmokeProofReadinessState,
  source: string,
  checkedAt: string,
  evaluatedAt: string | Date | undefined,
  maxProofAgeMs: number
): { state: Phase3SmokeProofReadinessState; detail: string } {
  const detail = resolveFreshnessDetail(
    label,
    state,
    source,
    checkedAt,
    evaluatedAt,
    maxProofAgeMs
  );

  if (state === "ready" && detail !== resolveDetail(label, "ready")) {
    return {
      state: "review",
      detail
    };
  }

  return {
    state,
    detail
  };
}

function applyStorageProof(
  label: string,
  state: Phase3SmokeProofReadinessState,
  source: string,
  persisted: boolean,
  detail: string
): { state: Phase3SmokeProofReadinessState; detail: string } {
  if (state !== "ready" || source !== "desktop" || persisted) {
    return { state, detail };
  }

  return {
    state: "review",
    detail: `${label} must be loaded from persisted/imported desktop proof storage before Phase 3 handoff.`
  };
}

function evaluateLiveControlSmokeState(record: Record<string, unknown>): Phase3SmokeProofReadinessState {
  const source = resolveSource(record);
  const executed = bool(record.executed);
  const unsupported = bool(record.unsupported);
  const ok = bool(record.ok);
  const completed = bool(record.completed);
  const supportedMethodCount = typeof record.supportedMethodCount === "number" && record.supportedMethodCount >= 0
    ? record.supportedMethodCount
    : 0;
  const totalMethodCount = typeof record.totalMethodCount === "number" && record.totalMethodCount >= 0
    ? record.totalMethodCount
    : 0;

  if (source === "browser" && !executed) {
    return "waiting";
  }

  if (!executed) {
    return "waiting";
  }

  if (unsupported && executed) {
    return "blocked";
  }

  if (ok || (executed && completed && supportedMethodCount >= totalMethodCount && totalMethodCount > 0)) {
    return "ready";
  }

  return executed ? "review" : "waiting";
}

function evaluateActiveTurnInterruptSmokeState(record: Record<string, unknown>): Phase3SmokeProofReadinessState {
  const source = resolveSource(record);
  const executed = bool(record.executed);
  const unsupported = bool(record.unsupported);
  const ok = bool(record.ok);
  const completed = bool(record.completed);
  const interruptObserved = bool(record.interruptObserved);

  if (source === "browser" && !executed) {
    return "waiting";
  }

  if (!executed) {
    return "waiting";
  }

  if (unsupported && executed) {
    return "blocked";
  }

  if (ok || (executed && completed && interruptObserved)) {
    return "ready";
  }

  return executed ? "review" : "waiting";
}

function evaluateActiveTurnSteerSmokeState(record: Record<string, unknown>): Phase3SmokeProofReadinessState {
  const source = resolveSource(record);
  const executed = bool(record.executed);
  const unsupported = bool(record.unsupported);
  const ok = bool(record.ok);
  const completed = bool(record.completed);
  const steerObserved = bool(record.steerObserved);

  if (source === "browser" && !executed) {
    return "waiting";
  }

  if (!executed) {
    return "waiting";
  }

  if (unsupported && executed) {
    return "blocked";
  }

  if (ok || (executed && completed && steerObserved)) {
    return "ready";
  }

  return executed ? "review" : "waiting";
}

function buildItem(
  proof: "live-control" | "active-turn-interrupt" | "active-turn-steer",
  input: unknown,
  label: string,
  evaluate: (record: Record<string, unknown>) => Phase3SmokeProofReadinessState,
  persisted: boolean,
  evaluatedAt: string | Date | undefined,
  maxProofAgeMs: number
): Phase3SmokeProofReadinessItem {
  if (!isRecord(input)) {
    return {
      proof,
      label,
      state: "waiting",
      source: UNKNOWN_VALUE,
      checkedAt: "unavailable",
      persisted: false,
      detail: resolveDetail(label, "waiting")
    };
  }

  const record = input;
  const source = resolveSource(record);
  const checkedAt = resolveCheckedAt(record);
  const freshness = applyFreshness(
    label,
    evaluate(record),
    source,
    checkedAt,
    evaluatedAt,
    maxProofAgeMs
  );
  const storageProof = applyStorageProof(
    label,
    freshness.state,
    source,
    persisted,
    freshness.detail
  );

  return {
    proof,
    label,
    state: storageProof.state,
    source,
    checkedAt,
    persisted,
    detail: storageProof.detail
  };
}

function tallyStates(items: ReadonlyArray<Phase3SmokeProofReadinessItem>): Phase3SmokeProofReadinessCounts {
  const counts: Record<Phase3SmokeProofReadinessState, number> = {
    ready: 0,
    review: 0,
    blocked: 0,
    waiting: 0
  };

  for (const item of items) {
    counts[item.state] += 1;
  }

  return counts;
}

function resolveOverallState(items: ReadonlyArray<Phase3SmokeProofReadinessItem>): Phase3SmokeProofReadinessState {
  if (items.every((item) => item.state === "ready")) {
    return "ready";
  }

  if (items.some((item) => item.state === "blocked")) {
    return "blocked";
  }

  if (items.some((item) => item.state === "waiting")) {
    return "waiting";
  }

  if (items.some((item) => item.state === "review")) {
    return "review";
  }

  return "waiting";
}

export function buildPhase3SmokeProofReadiness(
  input: Phase3SmokeProofReadinessInput = {}
): Phase3SmokeProofReadinessResult {
  const maxProofAgeMs =
    typeof input.maxProofAgeMs === "number" && input.maxProofAgeMs > 0
      ? input.maxProofAgeMs
      : DEFAULT_PHASE3_SMOKE_PROOF_MAX_AGE_MS;
  const items: readonly Phase3SmokeProofReadinessItem[] = [
    buildItem(
      PROOF_IDS.liveControl,
      input.liveControlSmoke,
      PROOF_LABELS.liveControl,
      evaluateLiveControlSmokeState,
      input.persistedDesktopProofs?.liveControlSmoke === true,
      input.evaluatedAt,
      maxProofAgeMs
    ),
    buildItem(
      PROOF_IDS.activeTurnInterrupt,
      input.activeTurnInterruptSmoke,
      PROOF_LABELS.activeTurnInterrupt,
      evaluateActiveTurnInterruptSmokeState,
      input.persistedDesktopProofs?.activeTurnInterruptSmoke === true,
      input.evaluatedAt,
      maxProofAgeMs
    ),
    buildItem(
      PROOF_IDS.activeTurnSteer,
      input.activeTurnSteerSmoke,
      PROOF_LABELS.activeTurnSteer,
      evaluateActiveTurnSteerSmokeState,
      input.persistedDesktopProofs?.activeTurnSteerSmoke === true,
      input.evaluatedAt,
      maxProofAgeMs
    )
  ];

  const state = resolveOverallState(items);
  const counts = tallyStates(items);

  return {
    state,
    readiness: READINESS_BY_STATE[state],
    items,
    counts
  };
}
