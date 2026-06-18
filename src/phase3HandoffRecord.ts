import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3ExitGateEvidence } from "./phase3ExitGateEvidence";

export interface Phase3OwnerHandoffRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase3ClearancePackageState;
  readonly clearanceReadiness: number;
  readonly exactBlockerCount: number;
  readonly canExit: boolean;
  readonly evidenceFingerprint?: string;
  readonly detail: string;
}

export interface Phase3HandoffRecordValidation {
  readonly state: Phase3ClearancePackageState;
  readonly detail: string;
  readonly nextAction: string;
  readonly expectedFingerprint?: string;
  readonly recordFingerprint?: string;
  readonly matchesCurrentEvidence: boolean;
}

export interface Phase3HandoffRecordValidationOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE3_HANDOFF_RECORD_STORAGE_KEY =
  "steerboard.phase3.ownerHandoffRecord.v1";

export const DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const VALID_STATES: Phase3ClearancePackageState[] = [
  "ready",
  "review",
  "blocked",
  "waiting"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeState(value: unknown): Phase3ClearancePackageState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase3ClearancePackageState)
    ? (normalized as Phase3ClearancePackageState)
    : undefined;
}

function clampPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.floor(value));
}

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

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isRecordFresh(
  record: Phase3OwnerHandoffRecord,
  options: Phase3HandoffRecordValidationOptions | undefined
): boolean | undefined {
  const evaluatedAtMs = toTimestamp(options?.evaluatedAt);
  if (evaluatedAtMs === undefined) {
    return undefined;
  }

  const createdAtMs = toTimestamp(record.createdAt);
  if (createdAtMs === undefined) {
    return false;
  }

  const maxRecordAgeMs =
    options?.maxRecordAgeMs ?? DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS;

  return evaluatedAtMs - createdAtMs <= maxRecordAgeMs;
}

export function buildPhase3HandoffEvidenceFingerprint(input: {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly exitGate?: Pick<Phase3ExitGateEvidence, "items">;
  readonly commandPlanId?: string;
}): string {
  const payload = {
    blockerCount: input.clearancePackage.openCount,
    canExit: input.clearancePackage.canExit,
    clearanceReadiness: input.clearancePackage.readiness,
    commandPlanId: input.commandPlanId ?? "phase-3-clearance-command-plan",
    evidence: (input.exitGate?.items ?? input.clearancePackage.blockers).map((item) => ({
      detail: "detail" in item ? item.detail : undefined,
      evidenceKey: item.evidenceKey,
      id: item.id,
      pmTaskId: item.pmTaskId,
      state: item.state
    })),
    readyCount: input.clearancePackage.readyCount,
    reviewCount: input.clearancePackage.reviewCount,
    waitingCount: input.clearancePackage.waitingCount
  };

  return `phase3-handoff-${shortHash(stableJson(payload))}`;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE3_HANDOFF_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase3OwnerHandoffRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE3_HANDOFF_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function clearPhase3OwnerHandoffRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE3_HANDOFF_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function parseStoredPhase3OwnerHandoffRecord(
  serialized: string | null
): Phase3OwnerHandoffRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const state = normalizeState(parsed.state);
    const clearanceReadiness = clampPercent(parsed.clearanceReadiness);
    const exactBlockerCount = normalizeCount(parsed.exactBlockerCount);

    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !state ||
      clearanceReadiness === undefined ||
      exactBlockerCount === undefined ||
      typeof parsed.canExit !== "boolean"
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      state,
      clearanceReadiness,
      exactBlockerCount,
      canExit: parsed.canExit,
      evidenceFingerprint: nonEmptyString(parsed.evidenceFingerprint)
        ? publicText(parsed.evidenceFingerprint, "")
        : undefined,
      detail: publicText(
        nonEmptyString(parsed.detail) ? parsed.detail : undefined,
        "Phase 3 owner handoff record is available."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase3OwnerHandoffRecord(): Phase3OwnerHandoffRecord | undefined {
  return parseStoredPhase3OwnerHandoffRecord(readStorage());
}

export function createPhase3OwnerHandoffRecord(
  clearancePackage: Phase3ClearancePackage,
  createdAt: string,
  evidenceFingerprint?: string
): Phase3OwnerHandoffRecord {
  const state: Phase3ClearancePackageState = clearancePackage.canExit
    ? "ready"
    : clearancePackage.state;

  return {
    id: `phase3-owner-handoff:${createdAt}`,
    createdAt,
    state,
    clearanceReadiness: clearancePackage.readiness,
    exactBlockerCount: clearancePackage.openCount,
    canExit: clearancePackage.canExit,
    ...(evidenceFingerprint ? { evidenceFingerprint } : {}),
    detail: clearancePackage.canExit
      ? "Owner-reviewed Phase 3 handoff is recorded from exit-ready clearance evidence."
      : publicText(
          clearancePackage.nextAction,
          "Phase 3 handoff cannot be recorded until clearance reaches exit-ready."
        )
  };
}

export function savePhase3OwnerHandoffRecord(
  record: Phase3OwnerHandoffRecord
): void {
  writeStorage({
    ...record,
    detail: publicText(record.detail, "Phase 3 owner handoff record is available.")
  });
}

export function derivePhase3HandoffRecordState(
  record: Phase3OwnerHandoffRecord | undefined,
  clearancePackage: Phase3ClearancePackage,
  expectedFingerprint?: string,
  options?: Phase3HandoffRecordValidationOptions
): Phase3ClearancePackageState {
  return derivePhase3HandoffRecordValidation(
    record,
    clearancePackage,
    expectedFingerprint,
    options
  ).state;
}

export function derivePhase3HandoffRecordValidation(
  record: Phase3OwnerHandoffRecord | undefined,
  clearancePackage: Phase3ClearancePackage,
  expectedFingerprint?: string,
  options?: Phase3HandoffRecordValidationOptions
): Phase3HandoffRecordValidation {
  if (!clearancePackage.canExit) {
    return {
      state: clearancePackage.state,
      detail: "Phase 3 clearance is not exit-ready, so any handoff record remains held.",
      nextAction: publicText(
        clearancePackage.nextAction,
        "Clear Phase 3 evidence before validating owner handoff."
      ),
      expectedFingerprint,
      recordFingerprint: record?.evidenceFingerprint,
      matchesCurrentEvidence: false
    };
  }

  if (!record) {
    return {
      state: "waiting",
      detail: "Owner-reviewed Phase 3 handoff record is not attached yet.",
      nextAction: "Record the owner-reviewed Phase 3 handoff before advancing provider integration.",
      expectedFingerprint,
      matchesCurrentEvidence: false
    };
  }

  if (record.state === "ready" && record.canExit && record.exactBlockerCount === 0) {
    if (!expectedFingerprint) {
      return {
        state: "review",
        detail:
          "Owner handoff record cannot be validated because the current Phase 3 evidence fingerprint is missing.",
        nextAction: "Attach the current Phase 3 evidence fingerprint before advancing provider integration.",
        recordFingerprint: record.evidenceFingerprint,
        matchesCurrentEvidence: false
      };
    }

    if (!record.evidenceFingerprint) {
      return {
        state: "review",
        detail:
          "Owner handoff record predates the Phase 3 evidence fingerprint and must be refreshed.",
        nextAction: "Clear and record the Phase 3 handoff again from the current exit-ready evidence.",
        expectedFingerprint,
        matchesCurrentEvidence: false
      };
    }

    if (expectedFingerprint && record.evidenceFingerprint !== expectedFingerprint) {
      return {
        state: "review",
        detail:
          "Owner handoff record no longer matches the current Phase 3 evidence fingerprint.",
        nextAction: "Clear and record the Phase 3 handoff again from the current exit-ready evidence.",
        expectedFingerprint,
        recordFingerprint: record.evidenceFingerprint,
        matchesCurrentEvidence: false
      };
    }

    const freshRecord = isRecordFresh(record, options);
    if (freshRecord === false) {
      return {
        state: "review",
        detail:
          "Owner handoff record is stale and must be recorded again from current exit-ready evidence.",
        nextAction: "Clear and record the Phase 3 handoff again from fresh exit-ready evidence.",
        expectedFingerprint,
        recordFingerprint: record.evidenceFingerprint,
        matchesCurrentEvidence: true
      };
    }

    return {
      state: "ready",
      detail: "Owner-reviewed Phase 3 handoff record matches the current evidence fingerprint.",
      nextAction: "Keep the owner-reviewed handoff record attached before Phase 4 work advances.",
      expectedFingerprint,
      recordFingerprint: record.evidenceFingerprint,
      matchesCurrentEvidence: true
    };
  }

  return {
    state: "review",
    detail: "Owner handoff record is attached but is not exit-ready for the current clearance package.",
    nextAction: "Clear and record the Phase 3 handoff again from exit-ready evidence.",
    expectedFingerprint,
    recordFingerprint: record.evidenceFingerprint,
    matchesCurrentEvidence: false
  };
}
