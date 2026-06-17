import type { DispatchPackage, DispatchPackageStatus } from "./dispatch";
import type {
  DispatchRolePanelPlan,
  DispatchRolePanelPlanCounts,
  DispatchRolePanelPlanState
} from "./dispatchRolePanelPlan";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { MockOrchestratorRun } from "./run";

export type DispatchReviewRecordState = DispatchRolePanelPlanState;
export type DispatchReviewClosureState = "review-open" | "ready-to-close";

export interface DispatchReviewHandoffPacketSummary {
  role: "orchestrator" | "implementer" | "validator" | "integration";
  panelId: string;
  owner: string;
  files: string[];
  ownedAreas: string[];
  acceptanceSummary: string;
  dependencies: string[];
  validationLabel: string;
  noRuntimeExecutionNote: string;
}

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
  handoffPackets: DispatchReviewHandoffPacketSummary[];
  validationGateCount: number;
  maxAttemptLimit: number;
  noRuntimeExecutionNote: string;
  integrationOwner: string;
  finalValidationOwner: string;
  commitPushReportingOwner: string;
  traceabilityLinkCount: number;
  closureState: DispatchReviewClosureState;
  reviewEvidenceFingerprint: string;
  mainIntegrationOwnershipNote: string;
  detail: string;
  nextAction: string;
}

export const DISPATCH_REVIEW_RECORD_STORAGE_KEY =
  "steerboard.dispatchReviewRecords.v1";

export const DISPATCH_REVIEW_NO_RUNTIME_NOTE =
  "Dispatch review records are local metadata only; they do not launch worker sessions or execute runtime actions.";

export const DISPATCH_REVIEW_MAIN_OWNERSHIP_NOTE =
  "Main Codex owns final integration, final validation, commit preparation, push approval, reporting, and dispatch-review traceability; worker records remain local metadata.";

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
const validClosureStates: DispatchReviewClosureState[] = ["review-open", "ready-to-close"];

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

function normalizeRoleCounts(value: unknown): DispatchRolePanelPlanCounts {
  const counts = asRecord(value);

  return {
    orchestrator: safeNumber(counts?.orchestrator),
    implementer: safeNumber(counts?.implementer),
    validator: safeNumber(counts?.validator),
    integration: safeNumber(counts?.integration)
  };
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => safeText(entry, ""))
    .filter((entry) => entry.length > 0);
}

function normalizeHandoffPackets(value: unknown): DispatchReviewHandoffPacketSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const record = asRecord(entry);
    if (!record) {
      return [];
    }

    const role = record?.role;

    if (
      role !== "orchestrator" &&
      role !== "implementer" &&
      role !== "validator" &&
      role !== "integration"
    ) {
      return [];
    }

    return [
      {
        role,
        panelId: safeText(record.panelId, `${role}-panel`),
        owner: safeText(record.owner, `${role} owner`),
        files: normalizeTextList(record.files),
        ownedAreas: normalizeTextList(record.ownedAreas),
        acceptanceSummary: safeText(record.acceptanceSummary, "No acceptance summary was provided."),
        dependencies: normalizeTextList(record.dependencies),
        validationLabel: safeText(record.validationLabel, "No validation signal yet."),
        noRuntimeExecutionNote: safeText(
          record.noRuntimeExecutionNote,
          "No runtime execution is performed for this packet in local preview mode."
        )
      }
    ];
  });
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

function isClosureState(value: unknown): value is DispatchReviewClosureState {
  return validClosureStates.includes(value as DispatchReviewClosureState);
}

function attemptLimitFromLabel(label: string): number {
  const match = label.match(/\/\s*(\d+)/);
  return match ? safeNumber(match[1]) : 0;
}

function maxAttemptLimit(plan: DispatchRolePanelPlan): number {
  return Math.max(0, ...plan.panels.map((panel) => attemptLimitFromLabel(panel.attemptLabel)));
}

function integrationOwnerFromPlan(plan: DispatchRolePanelPlan): string {
  return safeText(
    plan.panels.find((panel) => panel.role === "integration")?.owner,
    "Main Codex"
  );
}

function traceabilityLinkCount(record: {
  id?: string;
  sourcePackageId?: string;
  runId?: string;
  planId?: string;
  projectId?: string;
}): number {
  return [
    record.id,
    record.sourcePackageId,
    record.runId,
    record.planId,
    record.projectId
  ].filter((value) => typeof value === "string" && value.trim().length > 0).length;
}

function closureStateForReadiness(
  readinessState: DispatchReviewRecordState
): DispatchReviewClosureState {
  return readinessState === "complete" ? "ready-to-close" : "review-open";
}

function createRecordId(sourcePackageId: string, runId: string, createdAt: string): string {
  return [
    "dispatch-review",
    normalizeSegment(sourcePackageId),
    normalizeSegment(runId),
    normalizeSegment(createdAt)
  ].join("-");
}

function fingerprintPayload(
  dispatchPackage: DispatchPackage,
  rolePanelPlan: DispatchRolePanelPlan,
  run: MockOrchestratorRun
) {
  return {
    sourcePackageId: dispatchPackage.id,
    runId: run.id,
    runStatus: run.status,
    planId: rolePanelPlan.planId,
    projectId: rolePanelPlan.projectId,
    projectName: rolePanelPlan.projectName,
    packageStatus: dispatchPackage.status,
    risk: dispatchPackage.risk,
    deployMode: dispatchPackage.deployMode,
    panelCount: rolePanelPlan.totalPanelCount,
    roleCounts: rolePanelPlan.roleCounts,
    handoffPackets: handoffPacketsFromPlan(rolePanelPlan),
    panels: rolePanelPlan.panels.map((panel) => ({
      role: panel.role,
      owner: panel.owner,
      state: panel.state,
      attemptLabel: panel.attemptLabel,
      validationLabel: panel.validationLabel,
      files: panel.files,
      ownedAreas: panel.ownedAreas,
      acceptanceSummary: panel.acceptanceSummary,
      dependencies: panel.dependencies,
      noRuntimeExecutionNote: panel.noRuntimeExecutionNote
    })),
    tasks: run.tasks.map((task) => ({
      id: task.id,
      role: task.role,
      status: task.status,
      attempt: task.attempt,
      attemptLimit: task.attemptLimit,
      owner: task.owner,
      fileOwnership: task.fileOwnership,
      acceptanceCriteria: task.acceptanceCriteria,
      validationCommands: task.validationCommands,
      dependencies: task.dependencies
    })),
    validationGates: run.validationGates.map((gate) => ({
      id: gate.id,
      command: gate.command,
      status: gate.status,
      detail: gate.detail
    }))
  };
}

function handoffPacketsFromPlan(
  rolePanelPlan: DispatchRolePanelPlan
): DispatchReviewHandoffPacketSummary[] {
  return rolePanelPlan.panels.map((panel) => ({
    role: panel.role,
    panelId: safeText(panel.panelId, `${panel.role}-panel`),
    owner: safeText(panel.owner, `${panel.role} owner`),
    files: panel.files.map((item) => safeText(item, "file")).filter((item) => item.length > 0),
    ownedAreas: panel.ownedAreas
      .map((item) => safeText(item, "owned area"))
      .filter((item) => item.length > 0),
    acceptanceSummary: safeText(
      panel.acceptanceSummary,
      `No acceptance summary was provided for ${panel.role}.`
    ),
    dependencies: panel.dependencies
      .map((item) => safeText(item, "dependency"))
      .filter((item) => item.length > 0),
    validationLabel: safeText(panel.validationLabel, "No validation signal yet."),
    noRuntimeExecutionNote: safeText(
      panel.noRuntimeExecutionNote,
      "No runtime execution is performed for this packet in local preview mode."
    )
  }));
}

export function buildDispatchReviewEvidenceFingerprint(
  dispatchPackage: DispatchPackage,
  rolePanelPlan: DispatchRolePanelPlan,
  run: MockOrchestratorRun
): string {
  return `phase7-dispatch-${shortHash(stableJson(fingerprintPayload(dispatchPackage, rolePanelPlan, run)))}`;
}

export function buildCurrentDispatchReviewEvidenceFingerprint(
  record: DispatchReviewRecord,
  run: MockOrchestratorRun
): string {
  const dispatchPackage: DispatchPackage = {
    id: record.sourcePackageId,
    targetProject: {
      id: record.projectId,
      name: record.projectName
    },
    sourceDraftTitle: record.title,
    objective: record.detail,
    deployMode: record.deployMode,
    risk: record.risk,
    scope: [],
    fileAreas: [],
    acceptanceCriteria: [],
    validationPlan: [],
    rollbackNote: "",
    createdAt: record.createdAt,
    status: record.packageStatus
  };
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);

  return buildDispatchReviewEvidenceFingerprint(dispatchPackage, rolePanelPlan, run);
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
    (record!.handoffPackets === undefined || Array.isArray(record!.handoffPackets)) &&
    typeof record!.validationGateCount === "number" &&
    Number.isFinite(record!.validationGateCount) &&
    typeof record!.maxAttemptLimit === "number" &&
    Number.isFinite(record!.maxAttemptLimit) &&
    typeof record!.noRuntimeExecutionNote === "string" &&
    record!.noRuntimeExecutionNote.trim().length > 0 &&
    (record!.integrationOwner === undefined ||
      (typeof record!.integrationOwner === "string" && record!.integrationOwner.trim().length > 0)) &&
    (record!.finalValidationOwner === undefined ||
      (typeof record!.finalValidationOwner === "string" &&
        record!.finalValidationOwner.trim().length > 0)) &&
    (record!.commitPushReportingOwner === undefined ||
      (typeof record!.commitPushReportingOwner === "string" &&
        record!.commitPushReportingOwner.trim().length > 0)) &&
    (record!.traceabilityLinkCount === undefined ||
      (typeof record!.traceabilityLinkCount === "number" &&
        Number.isFinite(record!.traceabilityLinkCount))) &&
    (record!.closureState === undefined || isClosureState(record!.closureState)) &&
    (record!.reviewEvidenceFingerprint === undefined ||
      (typeof record!.reviewEvidenceFingerprint === "string" &&
        record!.reviewEvidenceFingerprint.trim().length > 0)) &&
    (record!.mainIntegrationOwnershipNote === undefined ||
      (typeof record!.mainIntegrationOwnershipNote === "string" &&
        record!.mainIntegrationOwnershipNote.trim().length > 0)) &&
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
  const integrationOwner = integrationOwnerFromPlan(rolePanelPlan);
  const recordId = createRecordId(sourcePackageId, runId, createdAt);
  const closureState = closureStateForReadiness(rolePanelPlan.readinessState);
  const reviewEvidenceFingerprint = buildDispatchReviewEvidenceFingerprint(
    dispatchPackage,
    rolePanelPlan,
    run
  );

  return {
    id: recordId,
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
    handoffPackets: handoffPacketsFromPlan(rolePanelPlan),
    validationGateCount,
    maxAttemptLimit: attemptLimit,
    noRuntimeExecutionNote: DISPATCH_REVIEW_NO_RUNTIME_NOTE,
    integrationOwner,
    finalValidationOwner: "Main Codex",
    commitPushReportingOwner: "Main Codex",
    traceabilityLinkCount: traceabilityLinkCount({
      id: recordId,
      sourcePackageId,
      runId,
      planId: rolePanelPlan.planId,
      projectId: rolePanelPlan.projectId
    }),
    closureState,
    reviewEvidenceFingerprint,
    mainIntegrationOwnershipNote: DISPATCH_REVIEW_MAIN_OWNERSHIP_NOTE,
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
        handoffPackets: normalizeHandoffPackets(item.handoffPackets),
        validationGateCount: safeNumber(item.validationGateCount),
        maxAttemptLimit: safeNumber(item.maxAttemptLimit),
        noRuntimeExecutionNote: safeText(
          item.noRuntimeExecutionNote,
          DISPATCH_REVIEW_NO_RUNTIME_NOTE
        ),
        integrationOwner: safeText(item.integrationOwner, "Main Codex"),
        finalValidationOwner: safeText(item.finalValidationOwner, "Main Codex"),
        commitPushReportingOwner: safeText(item.commitPushReportingOwner, "Main Codex"),
        traceabilityLinkCount: safeNumber(
          item.traceabilityLinkCount,
          traceabilityLinkCount({
            id: item.id,
            sourcePackageId: item.sourcePackageId,
            runId: item.runId,
            planId: item.planId,
            projectId: item.projectId
          })
        ),
        closureState: isClosureState(item.closureState)
          ? item.closureState
          : closureStateForReadiness(item.readinessState),
        reviewEvidenceFingerprint: safeText(item.reviewEvidenceFingerprint, ""),
        mainIntegrationOwnershipNote: safeText(
          item.mainIntegrationOwnershipNote,
          DISPATCH_REVIEW_MAIN_OWNERSHIP_NOTE
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
