export type Phase3CommandValidationStatus = "passed" | "failed";
export type Phase3CommandValidationReadinessState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase3CommandValidationRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly command: string;
  readonly status: Phase3CommandValidationStatus;
  readonly passedTestCount: number;
  readonly failedTestCount: number;
  readonly detail: string;
}

export interface Phase3CommandValidationRecordValidation {
  readonly state: Phase3CommandValidationReadinessState;
  readonly statusLabel: string;
  readonly detail: string;
  readonly nextAction: string;
  readonly isFresh: boolean;
}

export interface Phase3CommandValidationRecordValidationOptions {
  readonly expectedCommand?: string;
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY =
  "steerboard.phase3.commandValidationRecord.v1";

export const DEFAULT_PHASE3_COMMAND_VALIDATION_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const DEFAULT_PASSED_TEST_COUNT = 3;
const DEFAULT_FAILED_TEST_COUNT = 0;
const DEFAULT_PASS_DETAIL =
  "Phase 3 CLI smoke validation passed locally; desktop UI proof rows still require persisted desktop evidence.";

const STATUS_LABELS: Record<Phase3CommandValidationReadinessState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeStatus(value: unknown): Phase3CommandValidationStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return normalized === "passed" || normalized === "failed" ? normalized : undefined;
}

function normalizeCount(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
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

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function resolveFreshness(
  record: Phase3CommandValidationRecord,
  options: Phase3CommandValidationRecordValidationOptions | undefined
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
    options?.maxRecordAgeMs ?? DEFAULT_PHASE3_COMMAND_VALIDATION_RECORD_MAX_AGE_MS;

  const recordAgeMs = evaluatedAtMs - createdAtMs;
  return recordAgeMs >= 0 && recordAgeMs <= maxRecordAgeMs;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase3CommandValidationRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function clearPhase3CommandValidationRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function parseStoredPhase3CommandValidationRecord(
  serialized: string | null
): Phase3CommandValidationRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const status = normalizeStatus(parsed.status);

    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !nonEmptyString(parsed.command) ||
      !status
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      command: parsed.command.trim(),
      status,
      passedTestCount: normalizeCount(parsed.passedTestCount, status === "passed" ? DEFAULT_PASSED_TEST_COUNT : 0),
      failedTestCount: normalizeCount(parsed.failedTestCount, status === "failed" ? 1 : DEFAULT_FAILED_TEST_COUNT),
      detail: publicText(
        nonEmptyString(parsed.detail) ? parsed.detail : undefined,
        status === "passed" ? DEFAULT_PASS_DETAIL : "Phase 3 CLI smoke validation needs review."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase3CommandValidationRecord():
  | Phase3CommandValidationRecord
  | undefined {
  return parseStoredPhase3CommandValidationRecord(readStorage());
}

export function createPhase3CommandValidationRecord(
  command: string,
  createdAt: string,
  detail = DEFAULT_PASS_DETAIL
): Phase3CommandValidationRecord {
  return {
    id: `phase3-command-validation:${createdAt}`,
    createdAt,
    command: command.trim(),
    status: "passed",
    passedTestCount: DEFAULT_PASSED_TEST_COUNT,
    failedTestCount: DEFAULT_FAILED_TEST_COUNT,
    detail: publicText(detail, DEFAULT_PASS_DETAIL)
  };
}

export function derivePhase3CommandValidationRecordValidation(
  record: Phase3CommandValidationRecord | undefined,
  options?: Phase3CommandValidationRecordValidationOptions
): Phase3CommandValidationRecordValidation {
  if (!record) {
    return {
      state: "waiting",
      statusLabel: STATUS_LABELS.waiting,
      detail: "No Phase 3 CLI smoke validation record is attached.",
      nextAction:
        "Run npm.cmd run smoke:phase3 manually, then record the local CLI pass without changing desktop proof rows.",
      isFresh: false
    };
  }

  if (options?.expectedCommand && record.command !== options.expectedCommand) {
    return {
      state: "review",
      statusLabel: STATUS_LABELS.review,
      detail:
        "Phase 3 CLI smoke validation record was captured for a different command.",
      nextAction:
        "Clear and record the Phase 3 CLI smoke validation again with the current command plan.",
      isFresh: false
    };
  }

  if (record.status === "failed") {
    return {
      state: "blocked",
      statusLabel: STATUS_LABELS.blocked,
      detail: publicText(record.detail, "Phase 3 CLI smoke validation failed locally."),
      nextAction:
        "Rerun npm.cmd run smoke:phase3 after resolving the failed local CLI validation.",
      isFresh: false
    };
  }

  const isFresh = resolveFreshness(record, options);
  if (isFresh === undefined) {
    return {
      state: "review",
      statusLabel: STATUS_LABELS.review,
      detail:
        "Phase 3 CLI smoke validation record cannot be freshness-checked without an evaluation timestamp.",
      nextAction:
        "Review the Phase 3 CLI smoke validation with the current evaluation time before owner handoff.",
      isFresh: false
    };
  }

  if (isFresh === false) {
    return {
      state: "review",
      statusLabel: STATUS_LABELS.review,
      detail:
        "Phase 3 CLI smoke validation record is stale and must be recorded again.",
      nextAction:
        "Rerun npm.cmd run smoke:phase3 manually, then record a fresh local CLI pass.",
      isFresh: false
    };
  }

  return {
    state: "ready",
    statusLabel: STATUS_LABELS.ready,
    detail:
      "Phase 3 CLI smoke validation is fresh, but persisted desktop UI proof rows remain the exit-readiness source.",
    nextAction:
      "Keep the CLI smoke validation attached for owner review without using it to unlock handoff.",
    isFresh: true
  };
}

export function savePhase3CommandValidationRecord(
  record: Phase3CommandValidationRecord
): void {
  writeStorage({
    ...record,
    detail: publicText(record.detail, DEFAULT_PASS_DETAIL)
  });
}
