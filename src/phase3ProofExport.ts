import type { Phase3CommandValidationRecord } from "./phase3CommandValidationRecord";
import { loadPhase3CommandValidationRecord } from "./phase3CommandValidationRecord";
import type { Phase3OwnerHandoffRecord } from "./phase3HandoffRecord";
import { loadPhase3OwnerHandoffRecord } from "./phase3HandoffRecord";
import {
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  type Phase3SessionControlEvidenceByPanel,
  type Phase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";
import {
  loadPhase3SmokeProofBundleWithStorageProof,
  type Phase3PersistedDesktopProofs,
  type Phase3PersistedDesktopProofReviewReasons,
  type Phase3SmokeProofBundle
} from "./phase3SmokeProofStorage";

export type Phase3ProofExportState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3ProofExportArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase3.proof-export.v1";
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly currentPanelId?: string;
  readonly handoffEvidenceFingerprint?: string;
  readonly slashEvidenceByPanel: Phase3SlashEvidenceByPanel;
  readonly sessionControlEvidenceByPanel: Phase3SessionControlEvidenceByPanel;
  readonly smokeProofBundle: Phase3SmokeProofBundle;
  readonly persistedDesktopProofs: Phase3PersistedDesktopProofs;
  readonly storageReviewReasons?: Phase3PersistedDesktopProofReviewReasons;
  readonly commandValidationRecord?: Phase3CommandValidationRecord;
  readonly ownerHandoffRecord?: Phase3OwnerHandoffRecord;
}

export interface Phase3ProofExportVerification {
  readonly state: Phase3ProofExportState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly currentPanelId?: string;
  readonly readyPanelEvidenceCount: number;
  readonly storageAttestedDesktopProofCount: number;
  readonly hasCommandValidationRecord: boolean;
  readonly hasOwnerHandoffRecord: boolean;
}

export interface Phase3ProofExportBuildInput {
  readonly currentPanelId?: string;
  readonly evaluatedAt?: string;
  readonly exportedAt?: string;
  readonly handoffEvidenceFingerprint?: string;
  readonly slashEvidenceByPanel?: Phase3SlashEvidenceByPanel;
  readonly sessionControlEvidenceByPanel?: Phase3SessionControlEvidenceByPanel;
  readonly smokeProofBundle?: Phase3SmokeProofBundle;
  readonly persistedDesktopProofs?: Phase3PersistedDesktopProofs;
  readonly storageReviewReasons?: Phase3PersistedDesktopProofReviewReasons;
  readonly commandValidationRecord?: Phase3CommandValidationRecord;
  readonly ownerHandoffRecord?: Phase3OwnerHandoffRecord;
}

export interface Phase3ProofExportVerifyOptions {
  readonly verifiedAt?: string | Date;
  readonly maxArtifactAgeMs?: number;
  readonly maxHandoffAgeMs?: number;
}

const STATUS_LABELS: Record<Phase3ProofExportState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};
const DEFAULT_MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_HANDOFF_AGE_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isFresh(
  createdAt: string | undefined,
  verifiedAt: string | Date | undefined,
  maxAgeMs: number
): boolean {
  const createdAtMs = toTimestamp(createdAt);
  const verifiedAtMs = verifiedAt ? toTimestamp(verifiedAt) : Date.now();

  if (createdAtMs === undefined || verifiedAtMs === undefined) {
    return false;
  }

  const ageMs = verifiedAtMs - createdAtMs;
  return ageMs >= 0 && ageMs <= maxAgeMs;
}

function persistedDesktopProofCount(proofs: Phase3PersistedDesktopProofs): number {
  return [
    proofs.liveControlSmoke,
    proofs.activeTurnInterruptSmoke,
    proofs.activeTurnSteerSmoke
  ].filter(Boolean).length;
}

function storageReviewReasonSummary(
  reasons: Phase3PersistedDesktopProofReviewReasons | undefined
): string | undefined {
  if (!reasons) {
    return undefined;
  }

  const entries = [
    ["live-control", reasons.liveControlSmoke],
    ["active-turn-interrupt", reasons.activeTurnInterruptSmoke],
    ["active-turn-steer", reasons.activeTurnSteerSmoke]
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);

  return entries.length > 0
    ? ` Storage proof review: ${entries.map(([label, reason]) => `${label}: ${reason}`).join(" ")}`
    : undefined;
}

function panelEvidenceReady(
  artifact: Phase3ProofExportArtifact,
  currentPanelId: string | undefined
): number {
  if (!currentPanelId) {
    return 0;
  }

  const slashEvidence = artifact.slashEvidenceByPanel[currentPanelId];
  const sessionEvidence = artifact.sessionControlEvidenceByPanel[currentPanelId];

  return [slashEvidence, sessionEvidence].filter(
    (evidence) => evidence?.state === "ready" && evidence.pass
  ).length;
}

function result(
  state: Phase3ProofExportState,
  artifact: Phase3ProofExportArtifact | undefined,
  detail: string,
  nextAction: string,
  counts: Partial<Pick<
    Phase3ProofExportVerification,
    | "readyPanelEvidenceCount"
    | "storageAttestedDesktopProofCount"
    | "hasCommandValidationRecord"
    | "hasOwnerHandoffRecord"
  >> = {}
): Phase3ProofExportVerification {
  const readiness =
    state === "ready" ? 100 : state === "review" ? 65 : state === "blocked" ? 15 : 35;

  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canVerifyOffline: state === "ready",
    detail,
    nextAction,
    currentPanelId: artifact?.currentPanelId,
    readyPanelEvidenceCount: counts.readyPanelEvidenceCount ?? 0,
    storageAttestedDesktopProofCount: counts.storageAttestedDesktopProofCount ?? 0,
    hasCommandValidationRecord: counts.hasCommandValidationRecord ?? false,
    hasOwnerHandoffRecord: counts.hasOwnerHandoffRecord ?? false
  };
}

export function buildPhase3ProofExportArtifact(
  input: Phase3ProofExportBuildInput = {}
): Phase3ProofExportArtifact {
  const smokeProofLoad = input.smokeProofBundle && input.persistedDesktopProofs
    ? {
        bundle: input.smokeProofBundle,
        persistedDesktopProofs: input.persistedDesktopProofs,
        storageReviewReasons: input.storageReviewReasons ?? {}
      }
    : loadPhase3SmokeProofBundleWithStorageProof();
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    source: "steerboard.phase3.proof-export.v1",
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    ...(input.currentPanelId ? { currentPanelId: input.currentPanelId } : {}),
    ...(input.handoffEvidenceFingerprint
      ? { handoffEvidenceFingerprint: input.handoffEvidenceFingerprint }
      : {}),
    slashEvidenceByPanel: input.slashEvidenceByPanel ?? loadPhase3SlashEvidenceByPanel(),
    sessionControlEvidenceByPanel:
      input.sessionControlEvidenceByPanel ?? loadPhase3SessionControlEvidenceByPanel(),
    smokeProofBundle: smokeProofLoad.bundle,
    persistedDesktopProofs: smokeProofLoad.persistedDesktopProofs,
    ...(Object.keys(smokeProofLoad.storageReviewReasons).length > 0
      ? { storageReviewReasons: smokeProofLoad.storageReviewReasons }
      : {}),
    ...(input.commandValidationRecord ?? loadPhase3CommandValidationRecord()
      ? { commandValidationRecord: input.commandValidationRecord ?? loadPhase3CommandValidationRecord() }
      : {}),
    ...(input.ownerHandoffRecord ?? loadPhase3OwnerHandoffRecord()
      ? { ownerHandoffRecord: input.ownerHandoffRecord ?? loadPhase3OwnerHandoffRecord() }
      : {})
  };
}

export function serializePhase3ProofExportArtifact(
  artifact: Phase3ProofExportArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase3ProofExportArtifact(
  serializedArtifact: string
): Phase3ProofExportArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase3.proof-export.v1" ||
      typeof parsed.exportedAt !== "string" ||
      typeof parsed.evaluatedAt !== "string" ||
      !isRecord(parsed.slashEvidenceByPanel) ||
      !isRecord(parsed.sessionControlEvidenceByPanel) ||
      !isRecord(parsed.smokeProofBundle) ||
      !isRecord(parsed.persistedDesktopProofs)
    ) {
      return undefined;
    }

    return parsed as unknown as Phase3ProofExportArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase3ProofExportArtifact(
  artifact: Phase3ProofExportArtifact | undefined,
  options: Phase3ProofExportVerifyOptions = {}
): Phase3ProofExportVerification {
  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 3 proof export artifact is missing or malformed.",
      "Export or import a Phase 3 proof package before offline verification."
    );
  }

  const storageAttestedDesktopProofCount = persistedDesktopProofCount(
    artifact.persistedDesktopProofs
  );
  const readyPanelEvidenceCount = panelEvidenceReady(artifact, artifact.currentPanelId);
  const counts = {
    readyPanelEvidenceCount,
    storageAttestedDesktopProofCount,
    hasCommandValidationRecord: Boolean(artifact.commandValidationRecord),
    hasOwnerHandoffRecord: Boolean(artifact.ownerHandoffRecord)
  };

  if (
    artifact.schemaVersion !== 1 ||
    artifact.source !== "steerboard.phase3.proof-export.v1"
  ) {
    return result(
      "waiting",
      artifact,
      "Phase 3 proof export artifact has an unsupported schema.",
      "Re-export the Phase 3 proof package from the current Steerboard build.",
      counts
    );
  }

  if (!artifact.currentPanelId) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact is missing the focused panel id.",
      "Focus the owner-reviewed Arena panel before exporting Phase 3 proof.",
      counts
    );
  }

  if (!isFresh(artifact.evaluatedAt, options.verifiedAt, options.maxArtifactAgeMs ?? DEFAULT_MAX_ARTIFACT_AGE_MS)) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact is stale or future-dated.",
      "Re-export Phase 3 proof from the current focused panel.",
      counts
    );
  }

  if (readyPanelEvidenceCount < 2) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact does not include ready slash and session-control proof for the focused panel.",
      "Record or import ready current-panel slash and session-control proof before exporting.",
      counts
    );
  }

  if (storageAttestedDesktopProofCount < 3) {
    const storageDetail = storageReviewReasonSummary(artifact.storageReviewReasons);
    return result(
      "review",
      artifact,
      `Phase 3 proof export artifact does not include all storage-attested desktop proof rows.${storageDetail ?? ""}`,
      storageDetail
        ? "Resolve the storage proof review reasons, then re-export the Phase 3 proof package."
        : "Import or record the Phase 3 desktop smoke proof bundle before exporting.",
      counts
    );
  }

  if (!artifact.commandValidationRecord) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact is missing the CLI smoke validation record.",
      "Attach the Phase 3 CLI smoke validation record before exporting.",
      counts
    );
  }

  if (!artifact.ownerHandoffRecord) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact is missing the owner handoff record.",
      "Record the owner-reviewed Phase 3 handoff before exporting.",
      counts
    );
  }

  if (
    artifact.handoffEvidenceFingerprint &&
    artifact.ownerHandoffRecord.evidenceFingerprint !== artifact.handoffEvidenceFingerprint
  ) {
    return result(
      "review",
      artifact,
      "Phase 3 proof export artifact handoff fingerprint does not match the current expected fingerprint.",
      "Clear and record the Phase 3 handoff again from current exit-ready evidence.",
      counts
    );
  }

  if (
    !isFresh(
      artifact.ownerHandoffRecord.createdAt,
      options.verifiedAt ?? artifact.evaluatedAt,
      options.maxHandoffAgeMs ?? DEFAULT_MAX_HANDOFF_AGE_MS
    )
  ) {
    return result(
      "review",
      artifact,
      "Phase 3 owner handoff record in the export is stale or future-dated.",
      "Record a fresh owner handoff from the current exit-ready Phase 3 evidence.",
      counts
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 3 proof export artifact contains current-panel panel proof, storage-attested desktop proof, CLI validation, and owner handoff evidence.",
    "Keep the exported Phase 3 proof package attached while Phase 4 remains gated by owner review.",
    counts
  );
}

export function verifySerializedPhase3ProofExportArtifact(
  serializedArtifact: string,
  options: Phase3ProofExportVerifyOptions = {}
): Phase3ProofExportVerification {
  return verifyPhase3ProofExportArtifact(
    parsePhase3ProofExportArtifact(serializedArtifact),
    options
  );
}
