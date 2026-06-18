import {
  buildPhase3SmokeProofReadiness,
  type Phase3SmokeProofReadinessItem
} from "./phase3SmokeProofReadiness";
import {
  createPhase3PanelEvidenceFingerprint,
  DEFAULT_PHASE3_PANEL_EVIDENCE_MAX_AGE_MS,
  PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE
} from "./phase3PanelEvidenceStorage";

export type Phase3ExitGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3ExitGateEvidenceCounts {
  readonly ready: number;
  readonly review: number;
  readonly blocked: number;
  readonly waiting: number;
}

export interface Phase3ExitGateDiagnostic {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ExitGateState;
  readonly detail: string;
  readonly nextAction: string;
  readonly pmTaskId: string;
  readonly evidenceKey: string;
}

export interface Phase3ExitGateEvidence {
  readonly currentPanelId?: string;
  readonly currentPanelLabel: string;
  readonly state: Phase3ExitGateState;
  readonly readiness: number;
  readonly pass: boolean;
  readonly statusLabel: string;
  readonly detail: string;
  readonly safety: string;
  readonly nextAction: string;
  readonly items: readonly Phase3ExitGateDiagnostic[];
  readonly counts: Phase3ExitGateEvidenceCounts;
  readonly pmTaskLinkCount: number;
  readonly evidenceKeyCount: number;
}

export interface Phase3ExitGateEvidenceInput {
  readonly slashEvidence?: unknown;
  readonly sessionControlEvidence?: unknown;
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
  readonly maxPanelEvidenceAgeMs?: number;
  readonly currentPanelId?: string;
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
const SLASH_REVIEW_NEXT_ACTION =
  "Run a provider-routed slash command from an Arena panel and verify provider-route plus live/status transcript evidence.";
const SLASH_BLOCKED_NEXT_ACTION =
  "Repair slash command routing or catalog policy before retrying Phase 3 slash evidence.";
const SLASH_WAITING_NEXT_ACTION =
  "Submit a provider-routed slash command from an Arena panel before Phase 3 can exit.";
const SESSION_REVIEW_NEXT_ACTION =
  "Use Arena session controls until interrupt, retry, steer, and lifecycle support states are evidenced.";
const SESSION_BLOCKED_NEXT_ACTION =
  "Resolve the blocked session control before retrying Phase 3 session-control evidence.";
const SESSION_WAITING_NEXT_ACTION =
  "Collect Arena session-control evidence for interrupt, retry, steer, fork, resume, and archive states.";
const SLASH_PROVENANCE_NEXT_ACTION =
  "Refresh slash execution evidence from the current Arena panel transcript before Phase 3 can exit.";
const SESSION_PROVENANCE_NEXT_ACTION =
  "Refresh session-control evidence from the current Arena panel/session before Phase 3 can exit.";

const PHASE3_GATE_IDS = {
  slash: "phase3-exit-gate:slash-execution",
  session: "phase3-exit-gate:session-controls",
  liveControl: "phase3-exit-gate:live-control-smoke",
  interrupt: "phase3-exit-gate:active-turn-interrupt-smoke",
  steer: "phase3-exit-gate:active-turn-steer-smoke"
} as const;

const PHASE3_GATE_LABELS = {
  slash: "Slash execution",
  session: "Session controls",
  liveControl: "Live control smoke",
  interrupt: "Active-turn interrupt smoke",
  steer: "Active-turn steer smoke"
} as const;
const PHASE3_GATE_TRACE = {
  slash: {
    pmTaskId: "phase-03-child-slash-ready",
    evidenceKey: "phase3.slash-execution"
  },
  session: {
    pmTaskId: "phase-03-child-control-ready",
    evidenceKey: "phase3.session-controls"
  },
  liveControl: {
    pmTaskId: "phase-03-child-smoke-rows",
    evidenceKey: "phase3.live-control-smoke"
  },
  interrupt: {
    pmTaskId: "phase-03-child-smoke-rows",
    evidenceKey: "phase3.active-turn-interrupt-smoke"
  },
  steer: {
    pmTaskId: "phase-03-child-smoke-rows",
    evidenceKey: "phase3.active-turn-steer-smoke"
  }
} as const;

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safeRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
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

function slashEvidenceSupportsReady(record: Record<string, unknown>): boolean {
  const evidence = safeRecord(record.evidence);

  return (
    record.route === "provider" &&
    record.executable === true &&
    safeNumber(evidence?.providerRoute) > 0 &&
    safeNumber(evidence?.error) === 0 &&
    (safeNumber(evidence?.status) > 0 || safeNumber(evidence?.live) > 0)
  );
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function evidenceWithoutStorageProof(record: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...record };
  delete copy.phase3StorageProof;
  return copy;
}

function storageProofReviewDetail(
  label: string,
  record: Record<string, unknown>,
  evaluatedAt: string | Date | undefined,
  maxAgeMs: number,
  currentPanelId?: string
): string | undefined {
  const proof = safeRecord(record.phase3StorageProof);
  if (!proof) {
    return `${label} must be refreshed from the current panel and saved with Phase 3 storage provenance before exit can pass.`;
  }

  if (proof.source !== PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE) {
    return `${label} storage provenance source is not recognized and must be refreshed from the current panel.`;
  }

  if (!currentPanelId) {
    return `${label} storage provenance cannot be tied to a current Arena panel and must be refreshed from the focused panel.`;
  }

  if (proof.panelId !== currentPanelId) {
    return `${label} storage provenance belongs to another panel and must be refreshed from the current Arena panel.`;
  }

  const evidenceFingerprint = createPhase3PanelEvidenceFingerprint(evidenceWithoutStorageProof(record));
  if (proof.evidenceFingerprint !== evidenceFingerprint) {
    return `${label} storage provenance fingerprint does not match the current evidence payload and must be refreshed from the current panel.`;
  }

  const evaluatedAtMs = toTimestamp(evaluatedAt);
  if (evaluatedAtMs === undefined) {
    return `${label} storage provenance cannot be freshness-checked without the current Phase 3 evaluation timestamp.`;
  }

  const createdAt =
    typeof proof.createdAt === "string" && proof.createdAt.trim().length > 0
      ? proof.createdAt
      : undefined;
  const createdAtMs = toTimestamp(createdAt);
  if (createdAtMs === undefined) {
    return `${label} storage provenance has no valid createdAt timestamp and must be refreshed from the current panel.`;
  }

  const ageMs = evaluatedAtMs - createdAtMs;
  if (ageMs < 0) {
    return `${label} storage provenance is dated after the current Phase 3 evaluation timestamp and must be refreshed from the current panel.`;
  }

  if (ageMs > maxAgeMs) {
    return `${label} storage provenance is stale and must be refreshed from the current panel before Phase 3 can exit.`;
  }

  return undefined;
}

function storageProofReadyDetail(
  label: string,
  record: Record<string, unknown>
): string | undefined {
  const proof = safeRecord(record.phase3StorageProof);
  const panelId = typeof proof?.panelId === "string" ? proof.panelId : undefined;
  const createdAt = typeof proof?.createdAt === "string" ? proof.createdAt : undefined;
  const evidenceFingerprint =
    typeof proof?.evidenceFingerprint === "string"
      ? proof.evidenceFingerprint
      : undefined;

  if (!panelId || !createdAt || !evidenceFingerprint) {
    return undefined;
  }

  return `${label} is ready with current-panel storage provenance: panel ${panelId}, saved ${createdAt}, fingerprint ${evidenceFingerprint}.`;
}

function normalizeControlState(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "waiting";
}

function sessionControlsSupportReady(record: Record<string, unknown>): boolean {
  const controlStates = safeRecord(record.controlStates);
  if (!controlStates) {
    return false;
  }

  const interrupt = normalizeControlState(controlStates.interrupt);
  const retry = normalizeControlState(controlStates.retry);
  const steer = normalizeControlState(controlStates.steer);
  const fork = normalizeControlState(controlStates.fork);
  const resume = normalizeControlState(controlStates.resume);
  const archive = normalizeControlState(controlStates.archive);
  const requiredReady = [interrupt, retry, steer].every(
    (state) => state === "live" || state === "review"
  );
  const lifecycleHonest = [fork, resume, archive].every(
    (state) => state === "live" || state === "review" || state === "unsupported"
  );
  const counts = safeRecord(record.counts);
  const blockedCount = safeNumber(counts?.blocked);

  return requiredReady && lifecycleHonest && blockedCount === 0;
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

function evaluateSlashEvidence(
  input: unknown,
  evaluatedAt: string | Date | undefined,
  maxAgeMs: number,
  currentPanelId?: string
): {
  state: Phase3ExitGateState;
  pass: boolean;
  malformed: boolean;
  provenanceIssue?: string;
  provenanceNextAction?: string;
  provenanceReadyDetail?: string;
  storageReady: boolean;
} {
  const record = safeRecord(input);
  if (!record) {
    return { state: "waiting", pass: false, malformed: true, storageReady: false };
  }

  const state = normalizeState(record.state);
  if (!state) {
    return { state: "waiting", pass: false, malformed: true, storageReady: false };
  }

  if (state === "ready") {
    const pass = safeBoolean(record.pass) && slashEvidenceSupportsReady(record);
    if (!pass) {
      return { state: "review", pass: false, malformed: false, storageReady: false };
    }

    const provenanceIssue = storageProofReviewDetail(
      PHASE3_GATE_LABELS.slash,
      record,
      evaluatedAt,
      maxAgeMs,
      currentPanelId
    );

    return {
      state: provenanceIssue ? "review" : "ready",
      pass: !provenanceIssue,
      malformed: false,
      provenanceIssue,
      provenanceNextAction: provenanceIssue ? SLASH_PROVENANCE_NEXT_ACTION : undefined,
      provenanceReadyDetail: provenanceIssue
        ? undefined
        : storageProofReadyDetail(PHASE3_GATE_LABELS.slash, record),
      storageReady: !provenanceIssue
    };
  }

  return { state, pass: false, malformed: false, storageReady: false };
}

function evaluateSessionControlEvidence(
  input: unknown,
  evaluatedAt: string | Date | undefined,
  maxAgeMs: number,
  currentPanelId?: string
): {
  state: Phase3ExitGateState;
  pass: boolean;
  malformed: boolean;
  provenanceIssue?: string;
  provenanceNextAction?: string;
  provenanceReadyDetail?: string;
  storageReady: boolean;
} {
  const record = safeRecord(input);
  if (!record) {
    return { state: "waiting", pass: false, malformed: true, storageReady: false };
  }

  const state = normalizeState(record.state);
  if (!state) {
    return { state: "waiting", pass: false, malformed: true, storageReady: false };
  }

  if (state === "ready") {
    const pass = safeBoolean(record.pass) && sessionControlsSupportReady(record);
    if (!pass) {
      return { state: "review", pass: false, malformed: false, storageReady: false };
    }

    const provenanceIssue = storageProofReviewDetail(
      PHASE3_GATE_LABELS.session,
      record,
      evaluatedAt,
      maxAgeMs,
      currentPanelId
    );

    return {
      state: provenanceIssue ? "review" : "ready",
      pass: !provenanceIssue,
      malformed: false,
      provenanceIssue,
      provenanceNextAction: provenanceIssue ? SESSION_PROVENANCE_NEXT_ACTION : undefined,
      provenanceReadyDetail: provenanceIssue
        ? undefined
        : storageProofReadyDetail(PHASE3_GATE_LABELS.session, record),
      storageReady: !provenanceIssue
    };
  }

  return { state, pass: false, malformed: false, storageReady: false };
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

function resolveCurrentPanelLabel(currentPanelId: string | undefined): string {
  return currentPanelId ? currentPanelId : "No focused panel";
}

function diagnosticLaneRank(item: Phase3ExitGateDiagnostic): number {
  if (item.id === PHASE3_GATE_IDS.slash || item.id === PHASE3_GATE_IDS.session) {
    return 0;
  }
  if (
    item.id === PHASE3_GATE_IDS.liveControl ||
    item.id === PHASE3_GATE_IDS.interrupt ||
    item.id === PHASE3_GATE_IDS.steer
  ) {
    return 1;
  }
  return 2;
}

function diagnosticStateRank(state: Phase3ExitGateState): number {
  if (state === "blocked") {
    return 0;
  }
  if (state === "review") {
    return 1;
  }
  if (state === "waiting") {
    return 2;
  }
  return 3;
}

function diagnosticKindRank(item: Phase3ExitGateDiagnostic): number {
  if (item.id === PHASE3_GATE_IDS.slash) {
    return 0;
  }
  if (item.id === PHASE3_GATE_IDS.session) {
    return 1;
  }
  if (item.id === PHASE3_GATE_IDS.liveControl) {
    return 2;
  }
  if (item.id === PHASE3_GATE_IDS.interrupt) {
    return 3;
  }
  if (item.id === PHASE3_GATE_IDS.steer) {
    return 4;
  }
  return 5;
}

function topOpenDiagnostic(
  items: readonly Phase3ExitGateDiagnostic[]
): Phase3ExitGateDiagnostic | undefined {
  return [...items]
    .filter((item) => item.state !== "ready")
    .sort(
      (left, right) =>
        diagnosticLaneRank(left) - diagnosticLaneRank(right) ||
        diagnosticStateRank(left.state) - diagnosticStateRank(right.state) ||
        diagnosticKindRank(left) - diagnosticKindRank(right) ||
        left.label.localeCompare(right.label)
    )[0];
}

function resolveGateNextAction(
  state: Phase3ExitGateState,
  items: readonly Phase3ExitGateDiagnostic[]
): string {
  if (state === "ready") {
    return READY_NEXT_ACTION;
  }

  return topOpenDiagnostic(items)?.nextAction ?? resolveNextAction(state);
}

function resolveSlashNextAction(state: Phase3ExitGateState): string {
  if (state === "ready") {
    return "Keep provider-routed slash execution evidence attached for Phase 3 handoff.";
  }
  if (state === "blocked") {
    return SLASH_BLOCKED_NEXT_ACTION;
  }
  if (state === "waiting") {
    return SLASH_WAITING_NEXT_ACTION;
  }
  return SLASH_REVIEW_NEXT_ACTION;
}

function resolveSessionNextAction(state: Phase3ExitGateState): string {
  if (state === "ready") {
    return "Keep session-control evidence attached for Phase 3 handoff.";
  }
  if (state === "blocked") {
    return SESSION_BLOCKED_NEXT_ACTION;
  }
  if (state === "waiting") {
    return SESSION_WAITING_NEXT_ACTION;
  }
  return SESSION_REVIEW_NEXT_ACTION;
}

function resolveItemDetail(
  itemLabel: string,
  state: Phase3ExitGateState,
  malformed = false
): string {
  if (state === "ready") {
    return `${itemLabel} is ready.`;
  }

  if (state === "blocked") {
    return `${itemLabel} is blocked.`;
  }

  if (state === "review") {
    return `${itemLabel} needs additional evidence before phase exit can pass.`;
  }

  if (malformed) {
    return `${itemLabel} is malformed or missing; provide complete evidence payload.`;
  }

  return `${itemLabel} is missing and cannot be verified yet.`;
}

function resolveSmokeItemDetail(item: Phase3SmokeProofReadinessItem): string {
  return `${item.detail} Source: ${item.source}; checked: ${item.checkedAt}.`;
}

export function buildPhase3ExitGateEvidence(
  input: Phase3ExitGateEvidenceInput = {}
): Phase3ExitGateEvidence {
  const maxPanelEvidenceAgeMs =
    typeof input.maxPanelEvidenceAgeMs === "number" && input.maxPanelEvidenceAgeMs > 0
      ? input.maxPanelEvidenceAgeMs
      : DEFAULT_PHASE3_PANEL_EVIDENCE_MAX_AGE_MS;
  const slashEvidence = evaluateSlashEvidence(
    input.slashEvidence,
    input.evaluatedAt,
    maxPanelEvidenceAgeMs,
    input.currentPanelId
  );
  const sessionControlEvidence = evaluateSessionControlEvidence(
    input.sessionControlEvidence,
    input.evaluatedAt,
    maxPanelEvidenceAgeMs,
    input.currentPanelId
  );
  const smokeReadiness = buildPhase3SmokeProofReadiness({
    liveControlSmoke: input.liveControlSmoke,
    activeTurnInterruptSmoke: input.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: input.activeTurnSteerSmoke,
    persistedDesktopProofs: input.persistedDesktopProofs,
    evaluatedAt: input.evaluatedAt,
    maxProofAgeMs: input.maxProofAgeMs
  });
  const liveControlSmokeItem = smokeReadiness.items[0];
  const activeTurnInterruptSmokeItem = smokeReadiness.items[1];
  const activeTurnSteerSmokeItem = smokeReadiness.items[2];
  const liveControlSmoke = liveControlSmokeItem.state;
  const activeTurnInterruptSmoke = activeTurnInterruptSmokeItem.state;
  const activeTurnSteerSmoke = activeTurnSteerSmokeItem.state;

  const items: Phase3ExitGateDiagnostic[] = [
    {
      id: PHASE3_GATE_IDS.slash,
      label: PHASE3_GATE_LABELS.slash,
      state: slashEvidence.state,
      detail:
        slashEvidence.provenanceIssue ??
        slashEvidence.provenanceReadyDetail ??
        resolveItemDetail(PHASE3_GATE_LABELS.slash, slashEvidence.state, slashEvidence.malformed),
      nextAction: slashEvidence.provenanceNextAction ?? resolveSlashNextAction(slashEvidence.state),
      ...PHASE3_GATE_TRACE.slash
    },
    {
      id: PHASE3_GATE_IDS.session,
      label: PHASE3_GATE_LABELS.session,
      state: sessionControlEvidence.state,
      detail:
        sessionControlEvidence.provenanceIssue ??
        sessionControlEvidence.provenanceReadyDetail ??
        resolveItemDetail(PHASE3_GATE_LABELS.session, sessionControlEvidence.state, sessionControlEvidence.malformed),
      nextAction:
        sessionControlEvidence.provenanceNextAction ??
        resolveSessionNextAction(sessionControlEvidence.state),
      ...PHASE3_GATE_TRACE.session
    },
    {
      id: PHASE3_GATE_IDS.liveControl,
      label: PHASE3_GATE_LABELS.liveControl,
      state: liveControlSmoke,
      detail: resolveSmokeItemDetail(liveControlSmokeItem),
      nextAction: resolveNextAction(liveControlSmoke),
      ...PHASE3_GATE_TRACE.liveControl
    },
    {
      id: PHASE3_GATE_IDS.interrupt,
      label: PHASE3_GATE_LABELS.interrupt,
      state: activeTurnInterruptSmoke,
      detail: resolveSmokeItemDetail(activeTurnInterruptSmokeItem),
      nextAction: resolveNextAction(activeTurnInterruptSmoke),
      ...PHASE3_GATE_TRACE.interrupt
    },
    {
      id: PHASE3_GATE_IDS.steer,
      label: PHASE3_GATE_LABELS.steer,
      state: activeTurnSteerSmoke,
      detail: resolveSmokeItemDetail(activeTurnSteerSmokeItem),
      nextAction: resolveNextAction(activeTurnSteerSmoke),
      ...PHASE3_GATE_TRACE.steer
    }
  ];

  const gateStates = [
    items[0].state,
    items[1].state,
    items[2].state,
    items[3].state,
    items[4].state
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
  const pmTaskLinkCount = new Set(items.map((item) => item.pmTaskId)).size;
  const evidenceKeyCount = new Set(items.map((item) => item.evidenceKey)).size;

  return {
    currentPanelId: input.currentPanelId,
    currentPanelLabel: resolveCurrentPanelLabel(input.currentPanelId),
    state,
    pass: state === "ready",
    readiness: resolveReadiness(state),
    statusLabel: STATE_LABELS[state],
    detail: state === "waiting" ? NO_EVIDENCE_REASON : resolveDetail(state),
    safety: SAFETY_STATEMENT,
    nextAction: resolveGateNextAction(state, items),
    items,
    counts,
    pmTaskLinkCount,
    evidenceKeyCount
  };
}
