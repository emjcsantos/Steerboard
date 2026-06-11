import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";

export interface Phase3OwnerHandoffRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase3ClearancePackageState;
  readonly clearanceReadiness: number;
  readonly exactBlockerCount: number;
  readonly canExit: boolean;
  readonly detail: string;
}

export const PHASE3_HANDOFF_RECORD_STORAGE_KEY =
  "steerboard.phase3.ownerHandoffRecord.v1";

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
  createdAt: string
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
  clearancePackage: Phase3ClearancePackage
): Phase3ClearancePackageState {
  if (!clearancePackage.canExit) {
    return clearancePackage.state;
  }

  if (!record) {
    return "waiting";
  }

  if (record.state === "ready" && record.canExit && record.exactBlockerCount === 0) {
    return "ready";
  }

  return "review";
}
