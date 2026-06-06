export type Phase3ExitGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3ExitGateEvidenceCounts {
  readonly ready: number;
  readonly review: number;
  readonly blocked: number;
  readonly waiting: number;
}

export interface Phase3ExitGateEvidence {
  readonly state: Phase3ExitGateState;
  readonly readiness: number;
  readonly pass: boolean;
  readonly statusLabel: string;
  readonly detail: string;
  readonly safety: string;
  readonly nextAction: string;
  readonly counts: Phase3ExitGateEvidenceCounts;
}

export interface Phase3ExitGateEvidenceInput {
  readonly slashEvidence?: unknown;
  readonly sessionControlEvidence?: unknown;
  readonly liveControlSmoke?: unknown;
  readonly activeTurnInterruptSmoke?: unknown;
  readonly activeTurnSteerSmoke?: unknown;
}

const STATE_LABELS: Record<Phase3ExitGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const READINESS_BY_STATE: Record<Phase3ExitGateState, number> = {
  ready: 100,
  review: 65,
  blocked: 15,
  waiting: 35
};

const SAFETY_STATEMENT =
  "No command execution, runtime mutation, or provider dispatch is performed by this evidence builder.";

const NO_EVIDENCE_REASON =
  "One or more key evidence inputs is missing or malformed and must be supplied before exit-gate synthesis can proceed.";
const BLOCKED_REASON =
  "Slash execution or session-control evidence is blocked, or desktop smoke reports unsupported after execution; the phase cannot pass until that is resolved.";
const READY_REASON =
  "Slash execution evidence, session-control evidence, and desktop control smoke are complete and consistent.";
const REVIEW_REASON =
  "Core evidence is present, but desktop control smoke verification is incomplete and needs completion.";
const READY_NEXT_ACTION = "Proceed with phase handoff and finalization activities.";
const REVIEW_NEXT_ACTION = "Run missing desktop smoke proofs until active-turn controls report completion/readiness.";
const BLOCKED_NEXT_ACTION = "Address the blocked control or unsupported-after-execution desktop proof before retrying phase exit.";
const WAITING_NEXT_ACTION_BLOCKED = "Repair malformed evidence payloads and collect complete evidence inputs.";

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safeRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function normalizeState(value: unknown): Phase3ExitGateState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();

  if (normalized === "ready" || normalized === "review" || normalized === "blocked" || normalized === "waiting") {
    return normalized;
  }

  return undefined;
}

function countStates(states: readonly Phase3ExitGateState[]): Phase3ExitGateEvidenceCounts {
  const counts: Record<Phase3ExitGateState, number> = {
    ready: 0,
    review: 0,
    blocked: 0,
    waiting: 0
  };

  for (const state of states) {
    counts[state] += 1;
  }

  return counts;
}

function evaluateSlashEvidence(input: unknown): {
  state: Phase3ExitGateState;
  pass: boolean;
  malformed: boolean;
} {
  const record = safeRecord(input);
  if (!record) {
    return { state: "waiting", pass: false, malformed: true };
  }

  const state = normalizeState(record.state);
  if (!state) {
    return { state: "waiting", pass: false, malformed: true };
  }

  if (state === "ready") {
    return { state: safeBoolean(record.pass) ? "ready" : "review", pass: safeBoolean(record.pass), malformed: false };
  }

  return { state, pass: false, malformed: false };
}

function evaluateSessionControlEvidence(input: unknown): {
  state: Phase3ExitGateState;
  pass: boolean;
  malformed: boolean;
} {
  const record = safeRecord(input);
  if (!record) {
    return { state: "waiting", pass: false, malformed: true };
  }

  const state = normalizeState(record.state);
  if (!state) {
    return { state: "waiting", pass: false, malformed: true };
  }

  if (state === "ready") {
    return { state: safeBoolean(record.pass) ? "ready" : "review", pass: safeBoolean(record.pass), malformed: false };
  }

  return { state, pass: false, malformed: false };
}

function evaluateLiveControlSmoke(input: unknown): Phase3ExitGateState {
  const record = safeRecord(input);
  if (!record) {
    return "waiting";
  }

  const unsupported = safeBoolean(record.unsupported);
  const executed = safeBoolean(record.executed);
  const completed = safeBoolean(record.completed);
  const ok = safeBoolean(record.ok);
  const hasSignal = unsafeHasAnyObjectSignal(record);

  if (unsupported && (executed || completed || ok)) {
    return "blocked";
  }

  if (ok || executed) {
    return "ready";
  }

  return hasSignal ? "review" : "waiting";
}

function evaluateActiveTurnInterruptSmoke(input: unknown): Phase3ExitGateState {
  const record = safeRecord(input);
  if (!record) {
    return "waiting";
  }

  const unsupported = safeBoolean(record.unsupported);
  const executed = safeBoolean(record.executed);
  const completed = safeBoolean(record.completed);
  const ok = safeBoolean(record.ok);
  const interruptObserved = safeBoolean(record.interruptObserved);
  const hasSignal = unsafeHasAnyObjectSignal(record);

  if (unsupported && (executed || completed || ok)) {
    return "blocked";
  }

  if (ok || (completed && interruptObserved)) {
    return "ready";
  }

  return hasSignal ? "review" : "waiting";
}

function evaluateActiveTurnSteerSmoke(input: unknown): Phase3ExitGateState {
  const record = safeRecord(input);
  if (!record) {
    return "waiting";
  }

  const unsupported = safeBoolean(record.unsupported);
  const executed = safeBoolean(record.executed);
  const completed = safeBoolean(record.completed);
  const ok = safeBoolean(record.ok);
  const steerObserved = safeBoolean(record.steerObserved);
  const hasSignal = unsafeHasAnyObjectSignal(record);

  if (unsupported && (executed || completed || ok)) {
    return "blocked";
  }

  if (ok || (completed && steerObserved)) {
    return "ready";
  }

  return hasSignal ? "review" : "waiting";
}

function unsafeHasAnyObjectSignal(record: Readonly<Record<string, unknown>>): boolean {
  const keys = [
    "ok",
    "executed",
    "unsupported",
    "completed",
    "interruptObserved",
    "steerObserved"
  ] as const;

  return keys.some((key) => record[key] !== undefined);
}

function resolveReadiness(state: Phase3ExitGateState): number {
  return READINESS_BY_STATE[state];
}

function resolveDetail(state: Phase3ExitGateState): string {
  if (state === "ready") {
    return READY_REASON;
  }

  if (state === "blocked") {
    return BLOCKED_REASON;
  }

  if (state === "waiting") {
    return NO_EVIDENCE_REASON;
  }

  return REVIEW_REASON;
}

function resolveNextAction(state: Phase3ExitGateState): string {
  if (state === "ready") {
    return READY_NEXT_ACTION;
  }

  if (state === "blocked") {
    return BLOCKED_NEXT_ACTION;
  }

  if (state === "waiting") {
    return WAITING_NEXT_ACTION_BLOCKED;
  }

  return REVIEW_NEXT_ACTION;
}

export function buildPhase3ExitGateEvidence(
  input: Phase3ExitGateEvidenceInput = {}
): Phase3ExitGateEvidence {
  const slashEvidence = evaluateSlashEvidence(input.slashEvidence);
  const sessionControlEvidence = evaluateSessionControlEvidence(input.sessionControlEvidence);

  const liveControlSmoke = evaluateLiveControlSmoke(input.liveControlSmoke);
  const activeTurnInterruptSmoke = evaluateActiveTurnInterruptSmoke(input.activeTurnInterruptSmoke);
  const activeTurnSteerSmoke = evaluateActiveTurnSteerSmoke(input.activeTurnSteerSmoke);

  const gateStates = [
    slashEvidence.state,
    sessionControlEvidence.state,
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  ];

  let state: Phase3ExitGateState;

  if (
    slashEvidence.state === "blocked" ||
    sessionControlEvidence.state === "blocked" ||
    liveControlSmoke === "blocked" ||
    activeTurnInterruptSmoke === "blocked" ||
    activeTurnSteerSmoke === "blocked"
  ) {
    state = "blocked";
  } else if (
    slashEvidence.malformed ||
    sessionControlEvidence.malformed ||
    liveControlSmoke === "waiting" ||
    activeTurnInterruptSmoke === "waiting" ||
    activeTurnSteerSmoke === "waiting"
  ) {
    state = "waiting";
  } else if (
    slashEvidence.state === "ready" &&
    sessionControlEvidence.state === "ready" &&
    liveControlSmoke === "ready" &&
    activeTurnInterruptSmoke === "ready" &&
    activeTurnSteerSmoke === "ready"
  ) {
    state = "ready";
  } else {
    state = "review";
  }

  const counts = countStates(gateStates);

  return {
    state,
    pass: state === "ready",
    readiness: resolveReadiness(state),
    statusLabel: STATE_LABELS[state],
    detail: state === "waiting" ? NO_EVIDENCE_REASON : resolveDetail(state),
    safety: SAFETY_STATEMENT,
    nextAction: resolveNextAction(state),
    counts
  };
}
