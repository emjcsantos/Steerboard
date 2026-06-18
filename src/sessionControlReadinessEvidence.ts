export type SessionControlReadinessState = "ready" | "review" | "blocked" | "waiting";

export interface SessionControlReadinessEvidenceCounts {
  live: number;
  review: number;
  unsupported: number;
  blocked: number;
}

export interface SessionControlReadinessStorageProof {
  readonly source: string;
  readonly panelId: string;
  readonly createdAt: string;
  readonly evidenceFingerprint: string;
}

export interface SessionControlReadinessEvidence {
  state: SessionControlReadinessState;
  readiness: number;
  pass: boolean;
  statusLabel: string;
  detail: string;
  safety: string;
  counts: SessionControlReadinessEvidenceCounts;
  controlStates: Record<CanonicalControl, CanonicalControlState>;
  phase3StorageProof?: SessionControlReadinessStorageProof;
}

export interface SessionControlEvidenceInput {
  transcriptMessages?: unknown;
  controlEvidence?: unknown;
}

type CanonicalControl = "interrupt" | "retry" | "steer" | "fork" | "resume" | "archive";
type CanonicalControlState = "live" | "review" | "unsupported" | "blocked" | "waiting";

const REQUIRED_CONTROLS: readonly CanonicalControl[] = ["interrupt", "retry", "steer"];
const LIFECYCLE_CONTROLS: readonly CanonicalControl[] = ["fork", "resume", "archive"];
const ALL_CONTROLS: readonly CanonicalControl[] = [
  "interrupt",
  "retry",
  "steer",
  "fork",
  "resume",
  "archive"
];

const NO_MUTATION_SAFETY =
  "No session-control execution or runtime mutation is performed; this helper is evidence-only.";
const WAITING_DETAIL =
  "Session control evidence is missing or malformed and must be reviewed before readiness can be confirmed.";
const BLOCKED_DETAIL = "One or more controls are blocked and must be resolved before owner testing can proceed.";
const REVIEW_DETAIL =
  "Core session controls are only partially evidenced and need review before owner testing is ready.";
const READY_DETAIL =
  "Required controls are live or transcript-evidenced, and lifecycle controls are honestly unsupported where explicitly reported.";

const READY_READINESS = 100;
const REVIEW_READINESS = 65;
const WAITING_READINESS = 35;
const BLOCKED_READINESS = 15;

const SNAPSHOT_STATE_LABELS: Record<SessionControlReadinessState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? value : [];
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function normalizeControlName(value: unknown): CanonicalControl | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const compact = value.toLowerCase().replace(/[^a-z]/g, "");

  if (compact === "interrupt") {
    return "interrupt";
  }

  if (compact === "retry") {
    return "retry";
  }

  if (compact === "steer" || compact === "followup") {
    return "steer";
  }

  if (compact === "fork") {
    return "fork";
  }

  if (compact === "resume") {
    return "resume";
  }

  if (compact === "archive") {
    return "archive";
  }

  return undefined;
}

function normalizeControlState(value: unknown): CanonicalControlState {
  if (typeof value !== "string") {
    return "waiting";
  }

  switch (value.toLowerCase()) {
    case "live":
      return "live";
    case "unsupported":
      return "unsupported";
    case "blocked":
      return "blocked";
    case "review":
      return "review";
    case "ready":
    case "disabled":
    case "unavailable":
    case "error":
    case "unsupportedroute":
    case "limited":
      return "review";
    default:
      return "waiting";
  }
}

function addTextEvidence(text: string, evidence: Set<CanonicalControl>): void {
  if (text.includes("interrupt") || text.includes("stop turn")) {
    evidence.add("interrupt");
  }

  if (text.includes("retry")) {
    evidence.add("retry");
  }

  if (text.includes("steer") || text.includes("followup") || text.includes("follow up")) {
    evidence.add("steer");
  }

  if (text.includes("fork")) {
    evidence.add("fork");
  }

  if (text.includes("resume")) {
    evidence.add("resume");
  }

  if (text.includes("archive")) {
    evidence.add("archive");
  }
}

function collectEvidenceFromControlEvidence(
  value: unknown,
  evidence: Set<CanonicalControl>
): void {
  if (isRecord(value)) {
    for (const [key, raw] of Object.entries(value)) {
      const canonical = normalizeControlName(key);
      if (canonical && (raw === true || (isNonNegativeFiniteNumber(raw) && raw > 0))) {
        evidence.add(canonical);
        continue;
      }

      if (isRecord(raw)) {
        for (const nestedKey of Object.keys(raw)) {
          const nestedCanonical = normalizeControlName(nestedKey);
          if (nestedCanonical && (raw[nestedKey] === true || isNonNegativeFiniteNumber(raw[nestedKey]) && raw[nestedKey] > 0)) {
            evidence.add(nestedCanonical);
          }
        }
      }

      addTextEvidence(normalizeString(raw), evidence);
    }

    return;
  }

  for (const entry of asArray(value)) {
    if (isRecord(entry)) {
      collectEvidenceFromControlEvidence(entry, evidence);
      continue;
    }

    addTextEvidence(normalizeString(entry), evidence);
  }
}

function collectEvidence(input?: SessionControlEvidenceInput): ReadonlySet<CanonicalControl> {
  const evidence = new Set<CanonicalControl>();

  if (!input) {
    return evidence;
  }

  for (const message of asArray(input.transcriptMessages)) {
    if (isRecord(message)) {
      addTextEvidence(
        normalizeString((message as { meta?: unknown }).meta) +
          " " +
          normalizeString((message as { body?: unknown }).body) +
          " " +
          normalizeString((message as { message?: unknown }).message) +
          " " +
          normalizeString((message as { action?: unknown }).action) +
          " " +
          normalizeString((message as { text?: unknown }).text),
        evidence
      );
      continue;
    }

    addTextEvidence(normalizeString(message), evidence);
  }

  collectEvidenceFromControlEvidence(input.controlEvidence, evidence);

  return evidence;
}

function getRawControlState(
  snapshot: Record<string, unknown>,
  controlId: CanonicalControl,
  evidence: ReadonlySet<CanonicalControl>
): CanonicalControlState {
  const raw = snapshot[controlId] as unknown;

  if (raw === undefined) {
    return evidence.has(controlId) ? "review" : "waiting";
  }

  if (isRecord(raw)) {
    const normalized = normalizeControlState((raw as { state?: unknown }).state);
    if (normalized !== "waiting") {
      return normalized;
    }

    return evidence.has(controlId) ? "review" : "waiting";
  }

  return evidence.has(controlId) ? "review" : normalizeControlState(raw);
}

function extractMappedSnapshot(
  controlSnapshot: unknown,
  evidence: ReadonlySet<CanonicalControl>
): Record<CanonicalControl, CanonicalControlState> {
  const base: Record<CanonicalControl, CanonicalControlState> = {
    interrupt: "waiting",
    retry: "waiting",
    steer: "waiting",
    fork: "waiting",
    resume: "waiting",
    archive: "waiting"
  };

  if (!isRecord(controlSnapshot)) {
    return base;
  }

  const mapped: Partial<Record<CanonicalControl, Record<string, unknown>>> = {};

  for (const [key, value] of Object.entries(controlSnapshot)) {
    const canonical = normalizeControlName(key);
    if (canonical === undefined) {
      continue;
    }

    if (isRecord(value)) {
      mapped[canonical] = value;
    } else {
      mapped[canonical] = { state: value };
    }
  }

  const snapshot = { ...base };
  for (const control of ALL_CONTROLS) {
    snapshot[control] = getRawControlState(mapped, control, evidence);
  }

  return snapshot;
}

function buildCounts(states: Record<CanonicalControl, CanonicalControlState>): SessionControlReadinessEvidenceCounts {
  const counts: SessionControlReadinessEvidenceCounts = {
    live: 0,
    review: 0,
    unsupported: 0,
    blocked: 0
  };

  for (const control of ALL_CONTROLS) {
    const state = states[control];
    if (state === "live") {
      counts.live += 1;
    } else if (state === "review") {
      counts.review += 1;
    } else if (state === "unsupported") {
      counts.unsupported += 1;
    } else if (state === "blocked") {
      counts.blocked += 1;
    }
  }

  return counts;
}

function buildControlStateList(
  states: Record<CanonicalControl, CanonicalControlState>,
  targetState: CanonicalControlState
): CanonicalControl[] {
  const controls: CanonicalControl[] = [];

  for (const control of ALL_CONTROLS) {
    if (states[control] === targetState) {
      controls.push(control);
    }
  }

  return controls;
}

function resolveOverallState(
  states: Record<CanonicalControl, CanonicalControlState>,
  malformed: boolean,
  evidence: ReadonlySet<CanonicalControl>
): SessionControlReadinessState {
  if (malformed) {
    return "waiting";
  }

  const hasBlocked = ALL_CONTROLS.some((control) => states[control] === "blocked");
  if (hasBlocked) {
    return "blocked";
  }

  const requiredReady = REQUIRED_CONTROLS.every(
    (control) => states[control] === "live" || evidence.has(control)
  );
  const lifecycleControlsHonest = (["fork", "resume", "archive"] as const).every(
    (control) =>
      states[control] === "unsupported" ||
      states[control] === "live" ||
      evidence.has(control)
  );
  const hasRequiredSignal = REQUIRED_CONTROLS.some(
    (control) =>
      states[control] === "live" || states[control] === "review" || evidence.has(control)
  );
  const hasLifecycleSignal = (["fork", "resume", "archive"] as const).some(
    (control) =>
      states[control] === "unsupported" ||
      states[control] === "live" ||
      states[control] === "review" ||
      evidence.has(control)
  );

  if (requiredReady && lifecycleControlsHonest) {
    return "ready";
  }

  if (hasRequiredSignal || hasLifecycleSignal || evidence.size > 0) {
    return "review";
  }

  return "waiting";
}

function buildReadiness(state: SessionControlReadinessState): number {
  if (state === "ready") {
    return READY_READINESS;
  }

  if (state === "review") {
    return REVIEW_READINESS;
  }

  if (state === "blocked") {
    return BLOCKED_READINESS;
  }

  return WAITING_READINESS;
}

function buildControlDetailsByState(
  controlState: CanonicalControlState,
  states: Record<CanonicalControl, CanonicalControlState>
): string {
  const controls = buildControlStateList(states, controlState);

  if (controls.length === 0) {
    return "";
  }

  return `${controlState}: ${controls.join(", ")}`;
}

function buildDetail(
  state: SessionControlReadinessState,
  states: Record<CanonicalControl, CanonicalControlState>
): string {
  const lifecycleUnsupported = buildControlStateList(states, "unsupported").filter((control) =>
    LIFECYCLE_CONTROLS.includes(control)
  );
  const lifecycleReviewOrWait = buildControlStateList(states, "review").filter((control) =>
    LIFECYCLE_CONTROLS.includes(control)
  );

  if (state === "ready") {
    const lifecycleMessage =
      lifecycleUnsupported.length > 0
        ? `Lifecycle controls are honestly unsupported: ${lifecycleUnsupported.join(", ")}.`
        : "Lifecycle controls are not explicitly unsupported yet.";

    return `${READY_DETAIL} ${lifecycleMessage}`.trim();
  }

  if (state === "review") {
    const requiredMessage =
      lifecycleReviewOrWait.length > 0
        ? `Lifecycle controls awaiting evidence include: ${lifecycleReviewOrWait.join(", ")}.`
        : "";

    const snapshotSummary = [
      buildControlDetailsByState("unsupported", states),
      buildControlDetailsByState("blocked", states),
      buildControlDetailsByState("waiting", states),
      buildControlDetailsByState("review", states)
    ].filter(Boolean);

    const detailsLine = snapshotSummary.length
      ? `Snapshot detail: ${snapshotSummary.join(" | ")}`
      : "";
    return `${REVIEW_DETAIL} ${requiredMessage} ${detailsLine}`.trim();
  }

  if (state === "blocked") {
    return BLOCKED_DETAIL;
  }

  return WAITING_DETAIL;
}

export function buildSessionControlReadinessEvidence(
  controlSnapshot: unknown,
  evidenceInput?: SessionControlEvidenceInput
): SessionControlReadinessEvidence {
  const evidence = collectEvidence(evidenceInput);
  const states = extractMappedSnapshot(controlSnapshot, evidence);
  const malformed = !isRecord(controlSnapshot);
  const state = resolveOverallState(states, malformed, evidence);
  const counts = buildCounts(states);

  return {
    state,
    readiness: buildReadiness(state),
    pass: state === "ready",
    statusLabel: SNAPSHOT_STATE_LABELS[state],
    detail: buildDetail(state, states),
    controlStates: { ...states },
    safety: NO_MUTATION_SAFETY,
    counts
  };
}
