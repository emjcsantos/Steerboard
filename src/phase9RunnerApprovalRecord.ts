import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type {
  Phase9RunnerApprovalSnapshot,
  Phase9RunnerApprovalState
} from "./phase9RunnerApproval";

export interface Phase9RunnerApprovalRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase9RunnerApprovalState;
  readonly readiness: number;
  readonly selectedAction: "terminal-readonly-probe";
  readonly auditRecordCount: number;
  readonly phase8ReviewRecordId: string;
  readonly phase8ReviewState: Phase9RunnerApprovalState;
  readonly phase8ReviewFingerprint?: string;
  readonly phase8ReviewedBlockerLabel?: string;
  readonly phase8ReviewedBlockerSourceId?: string;
  readonly phase8ReviewedBlockerKind?: string;
  readonly phase8ReviewedBlockerStatus?: string;
  readonly phase8ReviewedBlockerAction?: string;
  readonly canRequestDesktopProbe: boolean;
  readonly mutationLocked: boolean;
  readonly runnerEvidenceFingerprint?: string;
  readonly rollbackEvidence: string;
  readonly detail: string;
}

export const PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY =
  "steerboard.phase9.runnerApprovalRecord.v1";

const VALID_STATES: readonly Phase9RunnerApprovalState[] = [
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

function normalizeState(value: unknown): Phase9RunnerApprovalState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase9RunnerApprovalState)
    ? (normalized as Phase9RunnerApprovalState)
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
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function hasPhase8ReviewDependencyProof(record: Phase8AuditReviewRecord | undefined): boolean {
  if (!record || record.state !== "ready" || !record.mutationLocked) {
    return false;
  }

  return [
    record.auditEvidenceFingerprint,
    record.topBlockerLabel,
    record.topBlockerSourceId,
    record.topBlockerKind,
    record.topBlockerStatus,
    record.topBlockerAction
  ].every((value) => typeof value === "string" && value.trim().length > 0);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
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

export function buildPhase9RunnerEvidenceFingerprint(
  snapshot: Phase9RunnerApprovalSnapshot
): string {
  const payload = {
    selectedAction: snapshot.selectedAction,
    auditRecordCount: snapshot.auditRecordCount,
    items: snapshot.items
      .filter((item) => item.kind !== "owner-review")
      .map((item) => ({
        id: item.id,
        label: item.label,
        kind: item.kind,
        status: item.status,
        detail: item.detail,
        nextAction: item.nextAction
      }))
  };

  return `phase9-runner-${shortHash(stableJson(payload))}`;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(
      PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase9RunnerApprovalRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function clearPhase9RunnerApprovalRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function parseStoredPhase9RunnerApprovalRecord(
  serialized: string | null
): Phase9RunnerApprovalRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const state = normalizeState(parsed.state);
    const phase8ReviewState = normalizeState(parsed.phase8ReviewState);
    const readiness = clampPercent(parsed.readiness);
    const auditRecordCount = normalizeCount(parsed.auditRecordCount);

    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !state ||
      !phase8ReviewState ||
      readiness === undefined ||
      parsed.selectedAction !== "terminal-readonly-probe" ||
      auditRecordCount === undefined ||
      !nonEmptyString(parsed.phase8ReviewRecordId) ||
      typeof parsed.canRequestDesktopProbe !== "boolean" ||
      typeof parsed.mutationLocked !== "boolean" ||
      !nonEmptyString(parsed.rollbackEvidence)
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      state,
      readiness,
      selectedAction: "terminal-readonly-probe",
      auditRecordCount,
      phase8ReviewRecordId: parsed.phase8ReviewRecordId.trim(),
      phase8ReviewState,
      phase8ReviewFingerprint: nonEmptyString(parsed.phase8ReviewFingerprint)
        ? publicText(parsed.phase8ReviewFingerprint, "")
        : undefined,
      phase8ReviewedBlockerLabel: nonEmptyString(parsed.phase8ReviewedBlockerLabel)
        ? publicText(parsed.phase8ReviewedBlockerLabel, "")
        : undefined,
      phase8ReviewedBlockerSourceId: nonEmptyString(parsed.phase8ReviewedBlockerSourceId)
        ? publicText(parsed.phase8ReviewedBlockerSourceId, "")
        : undefined,
      phase8ReviewedBlockerKind: nonEmptyString(parsed.phase8ReviewedBlockerKind)
        ? publicText(parsed.phase8ReviewedBlockerKind, "")
        : undefined,
      phase8ReviewedBlockerStatus: nonEmptyString(parsed.phase8ReviewedBlockerStatus)
        ? publicText(parsed.phase8ReviewedBlockerStatus, "")
        : undefined,
      phase8ReviewedBlockerAction: nonEmptyString(parsed.phase8ReviewedBlockerAction)
        ? publicText(parsed.phase8ReviewedBlockerAction, "")
        : undefined,
      canRequestDesktopProbe: parsed.canRequestDesktopProbe,
      mutationLocked: parsed.mutationLocked,
      runnerEvidenceFingerprint: publicText(
        nonEmptyString(parsed.runnerEvidenceFingerprint)
          ? parsed.runnerEvidenceFingerprint
          : undefined,
        ""
      ),
      rollbackEvidence: publicText(
        parsed.rollbackEvidence,
        "Rollback evidence remains required before runner expansion can unlock."
      ),
      detail: publicText(
        nonEmptyString(parsed.detail) ? parsed.detail : undefined,
        "Phase 9 runner approval review record is available."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase9RunnerApprovalRecord(): Phase9RunnerApprovalRecord | undefined {
  return parseStoredPhase9RunnerApprovalRecord(readStorage());
}

export function createPhase9RunnerApprovalRecord(
  snapshot: Phase9RunnerApprovalSnapshot,
  phase8ReviewRecord: Phase8AuditReviewRecord | undefined,
  createdAt: string
): Phase9RunnerApprovalRecord {
  const ownerReviewMissingOnly =
    snapshot.items.some(
      (item) =>
        item.id === "phase-09-desktop-runner-approval:owner-review" &&
        (item.status === "waiting" || item.status === "review")
    ) &&
    snapshot.blockedCount === 0 &&
    snapshot.reviewCount + snapshot.waitingCount === 1;
  const state = ownerReviewMissingOnly ? "ready" : snapshot.state;
  const readiness = ownerReviewMissingOnly ? 100 : snapshot.readiness;
  const phase8ReviewState = phase8ReviewRecord?.state ?? "blocked";
  const phase8DependencyReady = hasPhase8ReviewDependencyProof(phase8ReviewRecord);
  const recordState = state === "ready" && !phase8DependencyReady ? "review" : state;
  const recordReadiness =
    state === "ready" && !phase8DependencyReady ? Math.min(readiness, 99) : readiness;
  const canRequestDesktopProbe =
    snapshot.canRequestDesktopProbe &&
    recordState === "ready" &&
    phase8DependencyReady;

  return {
    id: `phase9-runner-approval:${createdAt}`,
    createdAt,
    state: recordState,
    readiness: recordReadiness,
    selectedAction: "terminal-readonly-probe",
    auditRecordCount: snapshot.auditRecordCount,
    phase8ReviewRecordId: phase8ReviewRecord?.id ?? "missing-phase8-review-record",
    phase8ReviewState,
    phase8ReviewFingerprint: phase8ReviewRecord?.auditEvidenceFingerprint,
    phase8ReviewedBlockerLabel: phase8ReviewRecord?.topBlockerLabel,
    phase8ReviewedBlockerSourceId: phase8ReviewRecord?.topBlockerSourceId,
    phase8ReviewedBlockerKind: phase8ReviewRecord?.topBlockerKind,
    phase8ReviewedBlockerStatus: phase8ReviewRecord?.topBlockerStatus,
    phase8ReviewedBlockerAction: phase8ReviewRecord?.topBlockerAction,
    canRequestDesktopProbe,
    mutationLocked: true,
    runnerEvidenceFingerprint: buildPhase9RunnerEvidenceFingerprint(snapshot),
    rollbackEvidence:
      "Phase 9 remains limited to terminal-readonly-probe; broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths stay locked before runner expansion.",
    detail: publicText(
      `Owner-reviewed Phase 9 runner approval recorded locally at ${recordReadiness}% readiness with ${snapshot.auditRecordCount} terminal audit records; selected action remains terminal-readonly-probe.`,
      "Phase 9 runner approval review record is available."
    )
  };
}

export function savePhase9RunnerApprovalRecord(
  record: Phase9RunnerApprovalRecord
): void {
  writeStorage({
    ...record,
    runnerEvidenceFingerprint: publicText(record.runnerEvidenceFingerprint, ""),
    phase8ReviewFingerprint: record.phase8ReviewFingerprint
      ? publicText(record.phase8ReviewFingerprint, "")
      : undefined,
    phase8ReviewedBlockerLabel: record.phase8ReviewedBlockerLabel
      ? publicText(record.phase8ReviewedBlockerLabel, "")
      : undefined,
    phase8ReviewedBlockerSourceId: record.phase8ReviewedBlockerSourceId
      ? publicText(record.phase8ReviewedBlockerSourceId, "")
      : undefined,
    phase8ReviewedBlockerKind: record.phase8ReviewedBlockerKind
      ? publicText(record.phase8ReviewedBlockerKind, "")
      : undefined,
    phase8ReviewedBlockerStatus: record.phase8ReviewedBlockerStatus
      ? publicText(record.phase8ReviewedBlockerStatus, "")
      : undefined,
    phase8ReviewedBlockerAction: record.phase8ReviewedBlockerAction
      ? publicText(record.phase8ReviewedBlockerAction, "")
      : undefined,
    rollbackEvidence: publicText(
      record.rollbackEvidence,
      "Rollback evidence remains required before runner expansion can unlock."
    ),
    detail: publicText(
      record.detail,
      "Phase 9 runner approval review record is available."
    )
  });
}
