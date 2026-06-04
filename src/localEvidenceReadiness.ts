import type { MockOrchestratorRun, MockValidationGate } from "./run";

export type LocalEvidenceReadinessState = "empty" | "waiting" | "ready" | "blocked";
export type LocalEvidenceReadinessItemStatus = "missing" | "waiting" | "ready" | "blocked";

export interface LocalEvidenceReadinessItem {
  id: string;
  label: string;
  status: LocalEvidenceReadinessItemStatus;
  detail: string;
}

export interface LocalEvidenceReadinessSnapshot {
  id: string;
  label: string;
  state: LocalEvidenceReadinessState;
  statusLabel: string;
  readiness: number;
  gateCount: number;
  passedGateCount: number;
  failedGateCount: number;
  evidenceCount: number;
  canFinalize: boolean;
  detail: string;
  safety: string;
  items: LocalEvidenceReadinessItem[];
}

const LOCAL_EVIDENCE_READINESS_ID = "local-evidence-readiness";
const LOCAL_EVIDENCE_READINESS_LABEL = "Local evidence readiness";
const PREVIEW_SAFETY =
  "No terminal command, filesystem action, process execution, or network action is performed.";

const READY_READINESS = 100;
const BLOCKED_READINESS = 25;
const WAITING_READINESS_MIN = 50;
const WAITING_READINESS_MAX = 75;

function clampReadiness(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasBlockingStatus(run: MockOrchestratorRun): boolean {
  if (run.status === "blocked" || run.status === "failed") {
    return true;
  }

  if (run.validationGates.some((gate) => isFailedGate(gate))) {
    return true;
  }

  if (run.sessions.some((session) => session.state === "blocked" || session.state === "failed")) {
    return true;
  }

  return run.tasks.some((task) => task.status === "blocked");
}

function isMissingValue(value: string): boolean {
  return value.trim().length === 0;
}

function isFailedGate(gate: MockValidationGate): boolean {
  return gate.status === "failed";
}

function isPassedGate(gate: MockValidationGate): boolean {
  return gate.status === "passed";
}

function countEvidenceSessions(run: MockOrchestratorRun): number {
  return run.sessions.filter((session) =>
    session.files.some((file) => !isMissingValue(file)) ||
    session.transcript.some((line) => !isMissingValue(line)) ||
    !isMissingValue(session.validation)
  ).length;
}

function buildRunSelectedStatus(run: MockOrchestratorRun): LocalEvidenceReadinessItemStatus {
  if (run.status === "complete") {
    return "ready";
  }

  if (run.status === "blocked" || run.status === "failed") {
    return "blocked";
  }

  return "waiting";
}

function buildValidationGateStatus(
  run: MockOrchestratorRun
): LocalEvidenceReadinessItemStatus {
  if (run.validationGates.length === 0) {
    return "missing";
  }

  if (run.validationGates.some(isFailedGate)) {
    return "blocked";
  }

  if (run.validationGates.some((gate) => gate.status === "pending")) {
    return "waiting";
  }

  return "ready";
}

function buildEvidenceStatus(
  evidenceCount: number,
  isReady: boolean
): LocalEvidenceReadinessItemStatus {
  if (evidenceCount === 0) {
    return "missing";
  }

  return isReady ? "ready" : "waiting";
}

function buildFinalReviewStatus(
  state: LocalEvidenceReadinessState,
  canFinalize: boolean
): LocalEvidenceReadinessItemStatus {
  if (state === "blocked") {
    return "blocked";
  }

  return canFinalize ? "ready" : "waiting";
}

function hasNonCompleteSessions(run: MockOrchestratorRun): boolean {
  return run.sessions.some((session) => session.state !== "complete");
}

function allValidationGatesPassed(run: MockOrchestratorRun): boolean {
  return run.validationGates.every(isPassedGate);
}

function readinessFromProgress(
  run: MockOrchestratorRun,
  gateCount: number,
  passedGateCount: number,
  evidenceCount: number
): number {
  const evidenceBonus = evidenceCount > 0 ? 15 : 0;
  const pendingGateBonus = gateCount === 0 ? 0 : (passedGateCount / gateCount) * 25;
  const sessionPenalty = hasNonCompleteSessions(run) ? 0 : 10;
  return clampReadiness(
    WAITING_READINESS_MIN + evidenceBonus + pendingGateBonus + sessionPenalty
  );
}

function finalizeReadiness(value: number): number {
  return clampReadiness(
    Math.max(
      WAITING_READINESS_MIN,
      Math.min(WAITING_READINESS_MAX, value)
    )
  );
}

export function buildLocalEvidenceReadinessSnapshot(
  run: MockOrchestratorRun | undefined
): LocalEvidenceReadinessSnapshot {
  if (run === undefined) {
    return {
      id: LOCAL_EVIDENCE_READINESS_ID,
      label: LOCAL_EVIDENCE_READINESS_LABEL,
      state: "empty",
      statusLabel: "No run",
      readiness: 0,
      gateCount: 0,
      passedGateCount: 0,
      failedGateCount: 0,
      evidenceCount: 0,
      canFinalize: false,
      detail:
        "No run is loaded. Add or select a run to begin local evidence evaluation.",
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${LOCAL_EVIDENCE_READINESS_ID}:selected-run`,
          label: "Selected run",
          status: "missing",
          detail: "No run has been selected."
        },
        {
          id: `${LOCAL_EVIDENCE_READINESS_ID}:validation-gates`,
          label: "Validation gates",
          status: "missing",
          detail: "No validation gate list is available because no run is loaded."
        },
        {
          id: `${LOCAL_EVIDENCE_READINESS_ID}:session-evidence`,
          label: "Session evidence",
          status: "missing",
          detail: "No session evidence can be evaluated without a selected run."
        },
        {
          id: `${LOCAL_EVIDENCE_READINESS_ID}:final-review`,
          label: "Final review",
          status: "blocked",
          detail: "Final review cannot be reached until a run is selected."
        }
      ]
    };
  }

  const gateCount = run.validationGates.length;
  const passedGateCount = run.validationGates.filter(isPassedGate).length;
  const failedGateCount = run.validationGates.filter(isFailedGate).length;
  const evidenceCount = countEvidenceSessions(run);
  const blocking = hasBlockingStatus(run);
  const allGatesPassed = gateCount === 0 || allValidationGatesPassed(run);
  const ready = run.status === "complete" && allGatesPassed && evidenceCount > 0 && !blocking;
  const state: LocalEvidenceReadinessState = blocking
    ? "blocked"
    : ready
      ? "ready"
      : "waiting";

  const readiness =
    state === "ready"
      ? READY_READINESS
      : state === "blocked"
        ? BLOCKED_READINESS
        : finalizeReadiness(readinessFromProgress(run, gateCount, passedGateCount, evidenceCount));

  const canFinalize = state === "ready";

  return {
    id: LOCAL_EVIDENCE_READINESS_ID,
    label: LOCAL_EVIDENCE_READINESS_LABEL,
    state,
    statusLabel:
      state === "ready"
        ? "Ready"
        : state === "blocked"
          ? "Blocked"
          : "Waiting",
    readiness,
    gateCount,
    passedGateCount,
    failedGateCount,
    evidenceCount,
    canFinalize,
    detail:
      state === "ready"
        ? "Local evidence is sufficient for finalization in this preview."
        : state === "blocked"
          ? "Local evidence readiness is blocked due to validation or session issues."
          : "Local evidence is being assembled in this preview mode.",
    safety: PREVIEW_SAFETY,
    items: [
      {
        id: `${LOCAL_EVIDENCE_READINESS_ID}:selected-run`,
        label: "Selected run",
        status: buildRunSelectedStatus(run),
        detail: `Run ${run.title} is currently ${run.status}.`
      },
      {
        id: `${LOCAL_EVIDENCE_READINESS_ID}:validation-gates`,
        label: "Validation gates",
        status: buildValidationGateStatus(run),
        detail:
          gateCount > 0
            ? `There ${gateCount === 1 ? "is" : "are"} ${gateCount} validation gate${gateCount === 1 ? "" : "s"} configured.`
            : "No validation gates are configured on this run."
      },
      {
        id: `${LOCAL_EVIDENCE_READINESS_ID}:session-evidence`,
        label: "Session evidence",
        status: buildEvidenceStatus(evidenceCount, ready),
        detail: `${evidenceCount} session(s) currently include files, transcript, or validation text.`
      },
      {
        id: `${LOCAL_EVIDENCE_READINESS_ID}:final-review`,
        label: "Final review",
        status: buildFinalReviewStatus(state, canFinalize),
        detail: canFinalize
          ? "Final review can be completed from this local evidence."
          : "Final review cannot be finalized yet."
      }
    ]
  };
}
