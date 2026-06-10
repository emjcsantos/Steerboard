import type { DispatchPackage, DispatchPackageStatus } from "./dispatch";
import type {
  DispatchRolePanelPlan,
  DispatchRolePanelPlanCounts,
  DispatchRolePanelPlanState
} from "./dispatchRolePanelPlan";
import type { MockOrchestratorRun } from "./run";

export type DispatchReviewRecordState = DispatchRolePanelPlanState;

export interface DispatchReviewRecord {
  id: string;
  sourcePackageId: string;
  runId: string;
  planId: string;
  projectId: string;
  projectName: string;
  title: string;
  createdAt: string;
  packageStatus: DispatchPackageStatus;
  readinessState: DispatchReviewRecordState;
  risk: DispatchPackage["risk"];
  deployMode: DispatchPackage["deployMode"];
  panelCount: number;
  roleCounts: DispatchRolePanelPlanCounts;
  handoffTaskCount: number;
  validationGateCount: number;
  maxAttemptLimit: number;
  noRuntimeExecutionNote: string;
  detail: string;
  nextAction: string;
}

export const DISPATCH_REVIEW_RECORD_STORAGE_KEY =
  "steerboard.dispatchReviewRecords.v1";

export const DISPATCH_REVIEW_NO_RUNTIME_NOTE =
  "Dispatch review records are local metadata only; they do not launch worker sessions or execute runtime actions.";

const validReadinessStates: DispatchReviewRecordState[] = [
  "complete",
  "blocked",
  "active",
  "idle",
  "waiting"
];
const validPackageStatuses: DispatchPackageStatus[] = ["staged", "ready"];
const validRisks: DispatchPackage["risk"][] = ["low", "medium", "high"];
const validDeployModes: DispatchPackage["deployMode"][] = ["dry-run", "staged", "full"];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[<>/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 64) || "segment";
}

function safeNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(numeric));
}

function normalizeCreatedAt(createdAt?: string): string {
  return typeof createdAt === "string" && createdAt.trim().length > 0
    ? createdAt.trim()
    : new Date().toISOString();
}

function normalizeRoleCounts(value: unknown): DispatchRolePanelPlanCounts {
  const counts = asRecord(value);

  return {
    orchestrator: safeNumber(counts?.orchestrator),
    implementer: safeNumber(counts?.implementer),
    validator: safeNumber(counts?.validator),
    integration: safeNumber(counts?.integration)
  };
}

function isReadinessState(value: unknown): value is DispatchReviewRecordState {
  return validReadinessStates.includes(value as DispatchReviewRecordState);
}

function isPackageStatus(value: unknown): value is DispatchPackageStatus {
  return validPackageStatuses.includes(value as DispatchPackageStatus);
}

function isRisk(value: unknown): value is DispatchPackage["risk"] {
  return validRisks.includes(value as DispatchPackage["risk"]);
}

function isDeployMode(value: unknown): value is DispatchPackage["deployMode"] {
  return validDeployModes.includes(value as DispatchPackage["deployMode"]);
}

function attemptLimitFromLabel(label: string): number {
  const match = label.match(/\/\s*(\d+)/);
  return match ? safeNumber(match[1]) : 0;
}

function maxAttemptLimit(plan: DispatchRolePanelPlan): number {
  return Math.max(0, ...plan.panels.map((panel) => attemptLimitFromLabel(panel.attemptLabel)));
}

function createRecordId(sourcePackageId: string, runId: string, createdAt: string): string {
  return [
    "dispatch-review",
    normalizeSegment(sourcePackageId),
    normalizeSegment(runId),
    normalizeSegment(createdAt)
  ].join("-");
}

function nextActionForState(state: DispatchReviewRecordState): string {
  switch (state) {
    case "blocked":
      return "Resolve blocked role-panel evidence before any dispatch launch can be considered.";
    case "active":
      return "Review active role panels, attempt limits, validation gates, and handoff ownership.";
    case "complete":
      return "Confirm accepted handoff evidence before closing the dispatch review.";
    case "idle":
      return "Request owner review of the staged role-panel plan before live worker spawning.";
    case "waiting":
    default:
      return "Stage a dispatch package with role-panel evidence before requesting worker launch.";
  }
}

function isDispatchReviewRecord(value: unknown): value is DispatchReviewRecord {
  const record = asRecord(value);

  return (
    Boolean(record) &&
    typeof record!.id === "string" &&
    record!.id.trim().length > 0 &&
    typeof record!.sourcePackageId === "string" &&
    record!.sourcePackageId.trim().length > 0 &&
    typeof record!.runId === "string" &&
    record!.runId.trim().length > 0 &&
    typeof record!.planId === "string" &&
    record!.planId.trim().length > 0 &&
    typeof record!.projectId === "string" &&
    record!.projectId.trim().length > 0 &&
    typeof record!.projectName === "string" &&
    record!.projectName.trim().length > 0 &&
    typeof record!.title === "string" &&
    record!.title.trim().length > 0 &&
    typeof record!.createdAt === "string" &&
    record!.createdAt.trim().length > 0 &&
    isPackageStatus(record!.packageStatus) &&
    isReadinessState(record!.readinessState) &&
    isRisk(record!.risk) &&
    isDeployMode(record!.deployMode) &&
    typeof record!.panelCount === "number" &&
    Number.isFinite(record!.panelCount) &&
    Boolean(asRecord(record!.roleCounts)) &&
    typeof record!.handoffTaskCount === "number" &&
    Number.isFinite(record!.handoffTaskCount) &&
    typeof record!.validationGateCount === "number" &&
    Number.isFinite(record!.validationGateCount) &&
    typeof record!.maxAttemptLimit === "number" &&
    Number.isFinite(record!.maxAttemptLimit) &&
    typeof record!.noRuntimeExecutionNote === "string" &&
    record!.noRuntimeExecutionNote.trim().length > 0 &&
    typeof record!.detail === "string" &&
    record!.detail.trim().length > 0 &&
    typeof record!.nextAction === "string" &&
    record!.nextAction.trim().length > 0
  );
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return 8;
  }

  const normalizedLimit = Math.floor(limit);
  return normalizedLimit <= 0 ? 0 : normalizedLimit;
}

function readStoredRecords(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(DISPATCH_REVIEW_RECORD_STORAGE_KEY);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeStoredRecords(records: DispatchReviewRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      DISPATCH_REVIEW_RECORD_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

export function createDispatchReviewRecord(
  dispatchPackage: DispatchPackage,
  rolePanelPlan: DispatchRolePanelPlan,
  run: MockOrchestratorRun,
  options: { createdAt?: string } = {}
): DispatchReviewRecord {
  const createdAt = normalizeCreatedAt(options.createdAt);
  const sourcePackageId = safeText(dispatchPackage.id, "unknown-package");
  const runId = safeText(run.id, "unknown-run");
  const panelCount = safeNumber(rolePanelPlan.totalPanelCount);
  const handoffTaskCount = Array.isArray(run.tasks) ? run.tasks.length : 0;
  const validationGateCount = Array.isArray(run.validationGates) ? run.validationGates.length : 0;
  const attemptLimit = maxAttemptLimit(rolePanelPlan);

  return {
    id: createRecordId(sourcePackageId, runId, createdAt),
    sourcePackageId,
    runId,
    planId: safeText(rolePanelPlan.planId, "unknown-plan"),
    projectId: safeText(rolePanelPlan.projectId, "unknown-project"),
    projectName: safeText(rolePanelPlan.projectName, "Unknown Project"),
    title: safeText(dispatchPackage.sourceDraftTitle, "Staged dispatch review"),
    createdAt,
    packageStatus: dispatchPackage.status,
    readinessState: rolePanelPlan.readinessState,
    risk: dispatchPackage.risk,
    deployMode: dispatchPackage.deployMode,
    panelCount,
    roleCounts: { ...rolePanelPlan.roleCounts },
    handoffTaskCount,
    validationGateCount,
    maxAttemptLimit: attemptLimit,
    noRuntimeExecutionNote: DISPATCH_REVIEW_NO_RUNTIME_NOTE,
    detail: `${panelCount} role panels, ${handoffTaskCount} handoff tasks, ${validationGateCount} validation gates, max attempt limit ${attemptLimit}.`,
    nextAction: nextActionForState(rolePanelPlan.readinessState)
  };
}

export function appendDispatchReviewRecord(
  records: readonly DispatchReviewRecord[],
  record: DispatchReviewRecord,
  limit = 8
): DispatchReviewRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: DispatchReviewRecord[] = [];
  const seenIds = new Set<string>();

  for (const nextRecord of [record, ...records]) {
    if (seenIds.has(nextRecord.id)) {
      continue;
    }

    seenIds.add(nextRecord.id);
    deduped.push(nextRecord);

    if (deduped.length >= normalizedLimit) {
      break;
    }
  }

  return deduped;
}

export function parseStoredDispatchReviewRecords(
  serialized: string | null,
  limit = 8
): DispatchReviewRecord[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedLimit = normalizeLimit(limit);
    if (normalizedLimit === 0) {
      return [];
    }

    const repaired: DispatchReviewRecord[] = [];
    const seenIds = new Set<string>();

    for (const item of parsed) {
      if (!isDispatchReviewRecord(item) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);
      repaired.push({
        id: safeText(item.id, "dispatch-review"),
        sourcePackageId: safeText(item.sourcePackageId, "unknown-package"),
        runId: safeText(item.runId, "unknown-run"),
        planId: safeText(item.planId, "unknown-plan"),
        projectId: safeText(item.projectId, "unknown-project"),
        projectName: safeText(item.projectName, "Unknown Project"),
        title: safeText(item.title, "Staged dispatch review"),
        createdAt: safeText(item.createdAt, new Date().toISOString()),
        packageStatus: item.packageStatus,
        readinessState: item.readinessState,
        risk: item.risk,
        deployMode: item.deployMode,
        panelCount: safeNumber(item.panelCount),
        roleCounts: normalizeRoleCounts(item.roleCounts),
        handoffTaskCount: safeNumber(item.handoffTaskCount),
        validationGateCount: safeNumber(item.validationGateCount),
        maxAttemptLimit: safeNumber(item.maxAttemptLimit),
        noRuntimeExecutionNote: safeText(
          item.noRuntimeExecutionNote,
          DISPATCH_REVIEW_NO_RUNTIME_NOTE
        ),
        detail: safeText(item.detail, "Dispatch review record is waiting for detail."),
        nextAction: safeText(item.nextAction, nextActionForState(item.readinessState))
      });

      if (repaired.length >= normalizedLimit) {
        break;
      }
    }

    return repaired;
  } catch {
    return [];
  }
}

export function loadDispatchReviewRecords(): DispatchReviewRecord[] {
  return parseStoredDispatchReviewRecords(readStoredRecords());
}

export function saveDispatchReviewRecords(records: DispatchReviewRecord[]): void {
  writeStoredRecords(records);
}
