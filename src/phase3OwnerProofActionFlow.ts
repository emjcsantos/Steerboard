import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilityPrecondition } from "./phase3ClearanceTraceability";
import {
  createPhase3OwnerHandoffRecord,
  clearPhase3OwnerHandoffRecord,
  savePhase3OwnerHandoffRecord,
  type Phase3OwnerHandoffRecord
} from "./phase3HandoffRecord";
import {
  importPhase3SmokeProofBundleArtifact,
  type Phase3SmokeProofImportResult
} from "./phase3SmokeProofImport";
import type {
  Phase3PersistedDesktopProofs,
  Phase3SmokeProofBundle
} from "./phase3SmokeProofStorage";

export interface Phase3SmokeProofBundleImportActionEffects {
  readonly setLiveControlSmokeProof: (
    proof: Phase3SmokeProofBundle["liveControlSmoke"]
  ) => void;
  readonly setActiveTurnInterruptSmokeProof: (
    proof: Phase3SmokeProofBundle["activeTurnInterruptSmoke"]
  ) => void;
  readonly setActiveTurnSteerSmokeProof: (
    proof: Phase3SmokeProofBundle["activeTurnSteerSmoke"]
  ) => void;
  readonly setPersistedDesktopProofs: (proofs: Phase3PersistedDesktopProofs) => void;
  readonly setProofEvaluationTime: (evaluatedAt: string) => void;
  readonly setAppNotice: (notice: string) => void;
}

export interface Phase3OwnerHandoffRecordActionEffects {
  readonly saveRecord?: (record: Phase3OwnerHandoffRecord) => void;
  readonly setRecord: (record: Phase3OwnerHandoffRecord) => void;
  readonly setAppNotice: (notice: string) => void;
}

export interface Phase3OwnerHandoffClearActionEffects {
  readonly clearRecord?: () => void;
  readonly setRecord: (record: Phase3OwnerHandoffRecord | undefined) => void;
  readonly setAppNotice: (notice: string) => void;
}

export interface Phase3OwnerHandoffRecordActionInput
  extends Phase3OwnerHandoffRecordActionEffects {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly traceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition;
  readonly evidenceFingerprint: string;
  readonly createdAt?: string;
}

export interface Phase3OwnerHandoffRecordActionResult {
  readonly recorded: boolean;
  readonly notice: string;
  readonly record?: Phase3OwnerHandoffRecord;
}

export function runPhase3SmokeProofBundleImportAction(
  serializedBundle: string,
  effects: Phase3SmokeProofBundleImportActionEffects,
  evaluatedAt?: string
): Phase3SmokeProofImportResult {
  const result = importPhase3SmokeProofBundleArtifact(serializedBundle, evaluatedAt);

  if (!result.imported || !result.bundle || !result.persistedDesktopProofs) {
    effects.setAppNotice(result.notice);
    return result;
  }

  effects.setLiveControlSmokeProof(result.bundle.liveControlSmoke);
  effects.setActiveTurnInterruptSmokeProof(result.bundle.activeTurnInterruptSmoke);
  effects.setActiveTurnSteerSmokeProof(result.bundle.activeTurnSteerSmoke);
  effects.setPersistedDesktopProofs(result.persistedDesktopProofs);
  effects.setProofEvaluationTime(result.evaluatedAt ?? new Date().toISOString());
  effects.setAppNotice(result.notice);

  return result;
}

export function runPhase3OwnerHandoffRecordAction(
  input: Phase3OwnerHandoffRecordActionInput
): Phase3OwnerHandoffRecordActionResult {
  if (!input.clearancePackage.canExit) {
    const notice = "Phase 3 handoff remains held until clearance is exit-ready";
    input.setAppNotice(notice);
    return { recorded: false, notice };
  }

  if (!input.traceabilityPrecondition.canTrustTrace) {
    const notice = input.traceabilityPrecondition.nextAction;
    input.setAppNotice(notice);
    return { recorded: false, notice };
  }

  const record = createPhase3OwnerHandoffRecord(
    input.clearancePackage,
    input.createdAt ?? new Date().toISOString(),
    input.evidenceFingerprint
  );
  const saveRecord = input.saveRecord ?? savePhase3OwnerHandoffRecord;

  saveRecord(record);
  input.setRecord(record);
  input.setAppNotice("Phase 3 owner handoff recorded locally");

  return {
    recorded: true,
    notice: "Phase 3 owner handoff recorded locally",
    record
  };
}

export function runPhase3OwnerHandoffClearAction(
  effects: Phase3OwnerHandoffClearActionEffects
): void {
  const clearRecord = effects.clearRecord ?? clearPhase3OwnerHandoffRecord;

  clearRecord();
  effects.setRecord(undefined);
  effects.setAppNotice("Phase 3 owner handoff record cleared");
}
