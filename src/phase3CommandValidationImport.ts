import {
  parseStoredPhase3CommandValidationRecord,
  savePhase3CommandValidationRecord,
  type Phase3CommandValidationRecord
} from "./phase3CommandValidationRecord";

export interface Phase3CommandValidationImportEffects {
  readonly setRecord: (record: Phase3CommandValidationRecord) => void;
  readonly setProofEvaluationTime: (evaluatedAt: string) => void;
  readonly setAppNotice: (notice: string) => void;
}

export interface Phase3CommandValidationImportResult {
  readonly imported: boolean;
  readonly notice: string;
  readonly record?: Phase3CommandValidationRecord;
  readonly evaluatedAt?: string;
}

export function runPhase3CommandValidationImportAction(
  serializedRecord: string,
  effects: Phase3CommandValidationImportEffects,
  evaluatedAt = new Date().toISOString()
): Phase3CommandValidationImportResult {
  const record = parseStoredPhase3CommandValidationRecord(serializedRecord);

  if (!record) {
    const notice = "Phase 3 CLI smoke validation artifact could not be imported";
    effects.setAppNotice(notice);
    return { imported: false, notice };
  }

  savePhase3CommandValidationRecord(record);
  effects.setRecord(record);
  effects.setProofEvaluationTime(evaluatedAt);

  const notice =
    record.status === "passed"
      ? "Phase 3 CLI smoke validation artifact imported"
      : "Phase 3 CLI smoke validation artifact imported with failed status";
  effects.setAppNotice(notice);

  return {
    imported: true,
    notice,
    record,
    evaluatedAt
  };
}
