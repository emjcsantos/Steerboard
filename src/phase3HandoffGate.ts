import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilityPrecondition } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3HandoffRecordValidation } from "./phase3HandoffRecord";

export type Phase3HandoffGateState = Phase3ClearancePackageState;

export type Phase3HandoffGateItemKind =
  | "desktop-proof"
  | "blocker-visibility"
  | "traceability-boundary"
  | "command-validation"
  | "handoff-record"
  | "provider-boundary";

export interface Phase3HandoffGateItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase3HandoffGateItemKind;
  readonly status: Phase3HandoffGateState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase3HandoffEvidenceReview {
  readonly expectedFingerprint?: string;
  readonly recordFingerprint?: string;
  readonly matchesCurrentEvidence: boolean;
  readonly evaluatedAt?: string;
  readonly recordAgeMs?: number;
  readonly maxRecordAgeMs?: number;
  readonly hasFreshAgeMetadata: boolean;
  readonly clearanceSnapshot: {
    readonly state: Phase3HandoffGateState;
    readonly readiness: number;
    readonly canExit: boolean;
    readonly readyCount: number;
    readonly exactBlockerCount: number;
    readonly reviewCount: number;
    readonly blockedCount: number;
    readonly waitingCount: number;
  };
}

export interface Phase3HandoffGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3HandoffGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canAdvanceProviderIntegration: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly exactBlockerCount: number;
  readonly nextAction: string;
  readonly ownerReviewSummary: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly handoffEvidenceReview: Phase3HandoffEvidenceReview;
  readonly items: readonly Phase3HandoffGateItem[];
}

export interface Phase3HandoffGateInput {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly traceabilityPrecondition?: Phase3ClearanceTraceabilityPrecondition;
  readonly commandValidation?: Phase3CommandValidationRecordValidation;
  readonly handoffRecordState?: Phase3HandoffGateState;
  readonly handoffRecordValidation?: Phase3HandoffRecordValidation;
}

const GATE_ID = "phase-3-handoff-gate";
const GATE_LABEL = "Phase 3 handoff gate";
const SAFETY =
  "Phase 3 handoff gate is evidence-only. It does not run smoke actions, mutate runtime state, launch providers, push branches, or resume Phase 4 review automatically.";

const STATUS_LABELS: Record<Phase3HandoffGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function publicText(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
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

function stateWeight(state: Phase3HandoffGateState): number {
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

function resolveState(items: readonly Phase3HandoffGateItem[]): Phase3HandoffGateState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function scoreItems(items: readonly Phase3HandoffGateItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(items: readonly Phase3HandoffGateItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Record Phase 3 handoff completion and keep Phase 4 review behind owner review plus proof-export offline verification."
  );
}

function desktopProofItem(
  clearancePackage: Phase3ClearancePackage
): Phase3HandoffGateItem {
  const status = clearancePackage.canExit ? "ready" : clearancePackage.state;

  return {
    id: `${GATE_ID}:desktop-proof`,
    label: "Desktop proof clearance",
    kind: "desktop-proof",
    status,
    detail: `${clearancePackage.readyCount} ready and ${clearancePackage.openCount} open Phase 3 evidence row${clearancePackage.openCount === 1 ? "" : "s"}.`,
    nextAction: publicText(
      clearancePackage.nextAction,
      "Clear Phase 3 desktop proof evidence before handoff."
    )
  };
}

function blockerVisibilityItem(
  clearancePackage: Phase3ClearancePackage
): Phase3HandoffGateItem {
  if (clearancePackage.openCount > 0) {
    return {
      id: `${GATE_ID}:blocker-visibility`,
      label: "Exact blocker visibility",
      kind: "blocker-visibility",
      status: clearancePackage.state,
      detail: `${clearancePackage.openCount} exact Phase 3 blocker${clearancePackage.openCount === 1 ? "" : "s"} are visible in the clearance package.`,
      nextAction: publicText(
        clearancePackage.blockers[0]?.nextAction,
        "Resolve the first exact Phase 3 blocker before handoff."
      )
    };
  }

  return {
    id: `${GATE_ID}:blocker-visibility`,
    label: "Exact blocker visibility",
    kind: "blocker-visibility",
    status: "ready",
    detail: "The clearance package has no open Phase 3 blockers.",
    nextAction: "Keep exact blocker visibility attached to the Phase 3 handoff record."
  };
}

function traceabilityBoundaryItem(
  traceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition | undefined
): Phase3HandoffGateItem {
  if (!traceabilityPrecondition) {
    return {
      id: `${GATE_ID}:traceability-boundary`,
      label: "Traceability boundary",
      kind: "traceability-boundary",
      status: "review",
      detail: "Phase 3 current-goal and PM traceability precondition is not attached.",
      nextAction:
        "Attach Phase 3 traceability precondition before Phase 4 review resumes and proof-export offline verification is trusted."
    };
  }

  return {
    id: `${GATE_ID}:traceability-boundary`,
    label: "Traceability boundary",
    kind: "traceability-boundary",
    status: traceabilityPrecondition.canTrustTrace
      ? "ready"
      : traceabilityPrecondition.state,
    detail: traceabilityPrecondition.detail,
    nextAction: traceabilityPrecondition.canTrustTrace
      ? "Keep Phase 3 traceability trusted before Phase 4 review resumes and proof-export offline verification is trusted."
      : traceabilityPrecondition.nextAction
  };
}

function canTrustTraceability(
  traceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition | undefined
): boolean {
  return traceabilityPrecondition?.canTrustTrace === true;
}

function hasReadyCommandValidation(
  commandValidation: Phase3CommandValidationRecordValidation | undefined
): boolean {
  return commandValidation?.state === "ready";
}

function commandValidationItem(
  commandValidation: Phase3CommandValidationRecordValidation | undefined
): Phase3HandoffGateItem {
  if (!commandValidation) {
    return {
      id: `${GATE_ID}:command-validation`,
      label: "CLI validation boundary",
      kind: "command-validation",
      status: "waiting",
      detail: "Phase 3 CLI smoke validation is not attached to the handoff gate.",
      nextAction:
        "Attach fresh Phase 3 CLI smoke validation before recording or advancing the owner handoff."
    };
  }

  return {
    id: `${GATE_ID}:command-validation`,
    label: "CLI validation boundary",
    kind: "command-validation",
    status: commandValidation.state,
    detail: commandValidation.detail,
    nextAction:
      commandValidation.state === "ready"
        ? "Keep fresh Phase 3 CLI smoke validation attached through owner handoff."
        : commandValidation.nextAction
  };
}

function formatFingerprint(value: string | undefined): string {
  return value ? publicText(value, "attached") : "missing";
}

function formatRecordAge(validation: Phase3HandoffRecordValidation | undefined): string {
  if (!validation) {
    return "age unchecked";
  }

  if (validation.recordAgeMs === undefined) {
    return validation.evaluatedAt
      ? "age unavailable"
      : "age unchecked";
  }

  if (validation.recordAgeMs < 0) {
    return `age future by ${Math.abs(validation.recordAgeMs)}ms`;
  }

  return `age ${validation.recordAgeMs}ms`;
}

function handoffValidationMetadata(
  validation: Phase3HandoffRecordValidation | undefined
): string {
  if (!validation) {
    return "";
  }

  const ageWindow =
    validation.maxRecordAgeMs === undefined
      ? formatRecordAge(validation)
      : `${formatRecordAge(validation)} of ${validation.maxRecordAgeMs}ms window`;

  return ` Fingerprint expected ${formatFingerprint(validation.expectedFingerprint)}, record ${formatFingerprint(validation.recordFingerprint)}; ${ageWindow}.`;
}

function hasCurrentFingerprintMatch(
  validation: Phase3HandoffRecordValidation | undefined
): boolean {
  return (
    validation?.state === "ready" &&
    validation.matchesCurrentEvidence === true &&
    Boolean(validation.expectedFingerprint) &&
    validation.recordFingerprint === validation.expectedFingerprint
  );
}

function hasFreshAgeMetadata(
  validation: Phase3HandoffRecordValidation | undefined
): boolean {
  if (!validation || !validation.evaluatedAt) {
    return false;
  }

  return (
    typeof validation.recordAgeMs === "number" &&
    typeof validation.maxRecordAgeMs === "number" &&
    validation.recordAgeMs >= 0 &&
    validation.recordAgeMs <= validation.maxRecordAgeMs
  );
}

function hasReadyHandoffValidation(
  validation: Phase3HandoffRecordValidation | undefined
): boolean {
  return hasCurrentFingerprintMatch(validation) && hasFreshAgeMetadata(validation);
}

function buildHandoffEvidenceReview(
  clearancePackage: Phase3ClearancePackage,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffEvidenceReview {
  return {
    expectedFingerprint: handoffRecordValidation?.expectedFingerprint,
    recordFingerprint: handoffRecordValidation?.recordFingerprint,
    matchesCurrentEvidence: handoffRecordValidation?.matchesCurrentEvidence === true,
    evaluatedAt: handoffRecordValidation?.evaluatedAt,
    recordAgeMs: handoffRecordValidation?.recordAgeMs,
    maxRecordAgeMs: handoffRecordValidation?.maxRecordAgeMs,
    hasFreshAgeMetadata: hasFreshAgeMetadata(handoffRecordValidation),
    clearanceSnapshot: {
      state: clearancePackage.state,
      readiness: clearancePackage.readiness,
      canExit: clearancePackage.canExit,
      readyCount: clearancePackage.readyCount,
      exactBlockerCount: clearancePackage.openCount,
      reviewCount: clearancePackage.reviewCount,
      blockedCount: clearancePackage.blockerCount,
      waitingCount: clearancePackage.waitingCount
    }
  };
}

function resolveHandoffRecordStatus(
  clearancePackage: Phase3ClearancePackage,
  handoffRecordState: Phase3HandoffGateState | undefined,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffGateState {
  if (handoffRecordValidation) {
    if (
      handoffRecordValidation.state === "ready" &&
      !hasReadyHandoffValidation(handoffRecordValidation)
    ) {
      return "review";
    }

    return handoffRecordValidation.state;
  }

  if (handoffRecordState === "ready" && clearancePackage.canExit) {
    return "review";
  }

  return handoffRecordState ?? "waiting";
}

function handoffRecordItem(
  clearancePackage: Phase3ClearancePackage,
  handoffRecordState: Phase3HandoffGateState | undefined,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffGateItem {
  const status = resolveHandoffRecordStatus(
    clearancePackage,
    handoffRecordState,
    handoffRecordValidation
  );
  const missingValidation = !handoffRecordValidation && handoffRecordState === "ready";
  const invalidReadyValidation =
    handoffRecordValidation?.state === "ready" &&
    status === "review" &&
    !hasReadyHandoffValidation(handoffRecordValidation);

  return {
    id: `${GATE_ID}:handoff-record`,
    label: "Owner handoff record",
    kind: "handoff-record",
    status,
    detail:
      ((invalidReadyValidation
        ? "Owner handoff record validation is ready, but it does not prove a current evidence fingerprint match with fresh age metadata."
        : undefined) ??
      handoffRecordValidation?.detail ??
      (missingValidation
        ? "Owner handoff record state is ready, but current evidence fingerprint validation is not attached."
        : undefined) ??
      (status === "ready"
        ? "Owner-reviewed Phase 3 handoff record is attached."
        : "Owner-reviewed Phase 3 handoff record is not attached yet.")) +
      handoffValidationMetadata(handoffRecordValidation),
    nextAction:
      (invalidReadyValidation
        ? "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
        : undefined) ??
      handoffRecordValidation?.nextAction ??
      (missingValidation
        ? "Attach current handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
        : undefined) ??
      (status === "ready"
        ? "Keep the owner-reviewed handoff record attached before Phase 4 review resumes and proof-export offline verification is trusted."
        : clearancePackage.canExit
          ? "Record the owner-reviewed Phase 3 handoff before Phase 4 review resumes and proof-export offline verification is trusted."
          : "Wait for the clearance package to reach exit-ready before recording handoff.")
  };
}

function providerBoundaryItem(
  clearancePackage: Phase3ClearancePackage,
  traceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition | undefined,
  commandValidation: Phase3CommandValidationRecordValidation | undefined,
  handoffRecordState: Phase3HandoffGateState | undefined,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffGateItem {
  const validatedRecordState = resolveHandoffRecordStatus(
    clearancePackage,
    handoffRecordState,
    handoffRecordValidation
  );

  if (clearancePackage.state === "blocked") {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: "blocked",
      detail: "Phase 4 review remains blocked because Phase 3 evidence is blocked.",
      nextAction: publicText(
        clearancePackage.nextAction,
        "Clear the blocked Phase 3 evidence before Phase 4 review resumes and proof-export offline verification is trusted."
      )
    };
  }

  if (!clearancePackage.canExit) {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: clearancePackage.state,
      detail: "Phase 4 review remains held until Phase 3 clearance reaches exit-ready.",
      nextAction: publicText(
        clearancePackage.nextAction,
        "Complete Phase 3 clearance before Phase 4 review resumes and proof-export offline verification is trusted."
      )
    };
  }

  if (!canTrustTraceability(traceabilityPrecondition)) {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: traceabilityPrecondition?.state ?? "review",
      detail: traceabilityPrecondition
        ? `Phase 4 review remains held because ${traceabilityPrecondition.detail} proof-export offline verification must stay trusted before Phase 4 review resumes.`
        : "Phase 4 review remains held until Phase 3 traceability precondition is attached and proof-export offline verification is trusted.",
      nextAction:
        traceabilityPrecondition?.nextAction ??
        "Attach Phase 3 traceability precondition before Phase 4 review resumes and proof-export offline verification is trusted."
    };
  }

  if (!hasReadyCommandValidation(commandValidation)) {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: commandValidation?.state ?? "waiting",
      detail: commandValidation
        ? `Phase 4 review remains held because ${commandValidation.detail} proof-export offline verification must stay trusted before Phase 4 review resumes.`
        : "Phase 4 review remains held until fresh Phase 3 CLI smoke validation is attached and proof-export offline verification is trusted.",
      nextAction:
        commandValidation?.nextAction ??
        "Attach fresh Phase 3 CLI smoke validation before Phase 4 review resumes and proof-export offline verification is trusted."
    };
  }

  if (validatedRecordState !== "ready") {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: validatedRecordState === "review" ? "review" : "waiting",
      detail:
        handoffRecordValidation?.state === "review"
          ? `Phase 4 review remains held because ${handoffRecordValidation.detail} proof-export offline verification must stay trusted before Phase 4 review resumes.`
          : handoffRecordValidation?.state === "ready" &&
              !hasReadyHandoffValidation(handoffRecordValidation)
            ? "Phase 4 review remains held until the owner handoff record proves a current evidence fingerprint match, fresh age metadata, and trusted proof-export offline verification."
          : !handoffRecordValidation && handoffRecordState === "ready"
            ? "Phase 4 review remains held until the owner handoff record is validated against current evidence and proof-export offline verification is trusted."
            : "Phase 4 review remains held until the owner handoff record is attached and proof-export offline verification is trusted.",
      nextAction:
        handoffRecordValidation?.state === "review"
          ? handoffRecordValidation.nextAction
          : handoffRecordValidation?.state === "ready" &&
              !hasReadyHandoffValidation(handoffRecordValidation)
            ? "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
          : !handoffRecordValidation && handoffRecordState === "ready"
            ? "Attach current handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
          : "Attach the owner-reviewed Phase 3 handoff before Phase 4 review resumes and proof-export offline verification is trusted."
    };
  }

  return {
    id: `${GATE_ID}:provider-boundary`,
    label: "Provider boundary",
    kind: "provider-boundary",
    status: "ready",
    detail:
      "Phase 4 review can resume after owner review when proof-export offline verification, current active goal, and PM traceability are trusted.",
    nextAction:
      "Resume Phase 4 review from the reviewed handoff while keeping proof-export offline verification, current active goal, and PM traceability trusted."
  };
}

function buildOwnerReviewSummary(
  input: Phase3HandoffGateInput,
  canAdvanceProviderIntegration: boolean
): string {
  const {
    clearancePackage,
    commandValidation,
    handoffRecordState,
    handoffRecordValidation,
    traceabilityPrecondition
  } = input;
  const validatedRecordState = resolveHandoffRecordStatus(
    clearancePackage,
    handoffRecordState,
    handoffRecordValidation
  );

  if (canAdvanceProviderIntegration) {
    return "Owner handoff current: fingerprint, clearance snapshot, proof export, and age metadata match; Phase 4 review remains behind owner review plus proof-export offline verification.";
  }

  if (clearancePackage.state === "blocked") {
    return `Owner handoff blocked: ${publicText(
      clearancePackage.nextAction,
      "Clear the blocked Phase 3 evidence before recording handoff."
    )}`;
  }

  if (!clearancePackage.canExit) {
    return `Owner handoff held: ${clearancePackage.openCount} exact Phase 3 blocker${clearancePackage.openCount === 1 ? "" : "s"} remain before the handoff can be recorded.`;
  }

  if (!canTrustTraceability(traceabilityPrecondition)) {
    return `Owner handoff held: ${publicText(
      traceabilityPrecondition?.detail,
      "Phase 3 current-goal and PM traceability is not trusted yet."
    )}`;
  }

  if (!hasReadyCommandValidation(commandValidation)) {
    return `Owner handoff held: ${publicText(
      commandValidation?.detail,
      "Phase 3 CLI smoke validation is not attached yet."
    )}`;
  }

  if (!handoffRecordValidation && handoffRecordState === "ready") {
    return "Owner handoff review: a ready handoff state is attached, but current evidence fingerprint validation is missing.";
  }

  if (!handoffRecordValidation) {
    return "Owner handoff recordable: clearance is exit-ready, Phase 3 PM traceability is trusted, CLI validation is ready, and proof-export offline verification is trusted; record the owner-reviewed handoff locally.";
  }

  if (
    handoffRecordValidation.state === "ready" &&
    validatedRecordState !== "ready"
  ) {
    return "Owner handoff review: the handoff record must prove both a current evidence fingerprint match and fresh age metadata.";
  }

  if (validatedRecordState !== "ready") {
    return `Owner handoff review: ${publicText(
      handoffRecordValidation.detail,
      "The owner handoff record needs review before Phase 4 review resumes and proof-export offline verification is trusted."
    )}`;
  }

  return "Owner handoff review: keep the owner-reviewed handoff attached while Phase 4 review remains behind owner review plus proof-export offline verification.";
}

function buildAriaLabel(snapshot: Omit<Phase3HandoffGate, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `${snapshot.exactBlockerCount} exact blockers; owner review: ${snapshot.ownerReviewSummary}; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase3HandoffGate(
  input: Phase3HandoffGateInput
): Phase3HandoffGate {
  const items = [
    desktopProofItem(input.clearancePackage),
    blockerVisibilityItem(input.clearancePackage),
    traceabilityBoundaryItem(input.traceabilityPrecondition),
    commandValidationItem(input.commandValidation),
    handoffRecordItem(
      input.clearancePackage,
      input.handoffRecordState,
      input.handoffRecordValidation
    ),
    providerBoundaryItem(
      input.clearancePackage,
      input.traceabilityPrecondition,
      input.commandValidation,
      input.handoffRecordState,
      input.handoffRecordValidation
    )
  ];
  const state = resolveState(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const canAdvanceProviderIntegration =
    state === "ready" &&
    input.clearancePackage.canExit &&
    canTrustTraceability(input.traceabilityPrecondition) &&
    hasReadyCommandValidation(input.commandValidation) &&
    hasReadyHandoffValidation(input.handoffRecordValidation);
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canAdvanceProviderIntegration,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    exactBlockerCount: input.clearancePackage.openCount,
    nextAction: firstNextAction(items),
    ownerReviewSummary: buildOwnerReviewSummary(input, canAdvanceProviderIntegration),
    safety: SAFETY,
    handoffEvidenceReview: buildHandoffEvidenceReview(
      input.clearancePackage,
      input.handoffRecordValidation
    ),
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
