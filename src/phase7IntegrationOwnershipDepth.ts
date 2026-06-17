import type { DispatchReviewRecord } from "./dispatchReviewRecord";

export type Phase7IntegrationOwnershipDepthState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export type Phase7IntegrationOwnershipDepthKind =
  | "integration-owner"
  | "final-validation"
  | "commit-push-reporting"
  | "traceability"
  | "closure-boundary";

export interface Phase7IntegrationOwnershipDepthItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase7IntegrationOwnershipDepthKind;
  readonly status: Phase7IntegrationOwnershipDepthState;
  readonly statusLabel: string;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase7IntegrationOwnershipDepthSnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase7IntegrationOwnershipDepthState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openDepthCount: number;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly nextAction: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase7IntegrationOwnershipDepthItem[];
}

const SNAPSHOT_ID = "phase-07-integration-ownership-depth";
const SNAPSHOT_LABEL = "Phase 7 integration ownership depth";

const STATUS_LABELS: Record<Phase7IntegrationOwnershipDepthState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function statusWeight(status: Phase7IntegrationOwnershipDepthState): number {
  switch (status) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 30;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  items: readonly Phase7IntegrationOwnershipDepthItem[]
): Phase7IntegrationOwnershipDepthState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  return "ready";
}

function readiness(items: readonly Phase7IntegrationOwnershipDepthItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((total, item) => total + statusWeight(item.status), 0) / items.length
  );
}

function firstNextAction(items: readonly Phase7IntegrationOwnershipDepthItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    "Keep main integration, final validation, commit, push approval, reporting, and traceability owned by the main Arena path."
  );
}

function includesAll(source: string, terms: readonly string[]): boolean {
  const lower = source.toLowerCase();

  return terms.every((term) => lower.includes(term));
}

function hasTraceableIds(record: DispatchReviewRecord): boolean {
  return record.traceabilityLinkCount >= 5;
}

function item(
  record: DispatchReviewRecord,
  kind: Phase7IntegrationOwnershipDepthKind,
  label: string,
  status: Phase7IntegrationOwnershipDepthState,
  detail: string,
  nextAction: string
): Phase7IntegrationOwnershipDepthItem {
  return {
    id: `${record.id}:${kind}`,
    label,
    kind,
    status,
    statusLabel: STATUS_LABELS[status],
    detail,
    nextAction
  };
}

function buildItems(record: DispatchReviewRecord): Phase7IntegrationOwnershipDepthItem[] {
  const integrationStatus: Phase7IntegrationOwnershipDepthState =
    record.roleCounts.integration > 0 && record.integrationOwner === "Main Codex"
      ? "ready"
      : record.roleCounts.integration > 0
        ? "review"
        : "waiting";
  const finalValidationStatus: Phase7IntegrationOwnershipDepthState =
    record.validationGateCount > 0 && record.finalValidationOwner === "Main Codex"
      ? "ready"
      : record.validationGateCount > 0
        ? "review"
        : "waiting";
  const ownershipTermsReady =
    record.commitPushReportingOwner === "Main Codex" &&
    includesAll(record.mainIntegrationOwnershipNote, [
      "main codex",
      "final integration",
      "final validation",
      "commit",
      "push approval",
      "reporting",
      "traceability"
    ]);
  const traceabilityReady = hasTraceableIds(record);
  const closureReady =
    (record.closureState === "review-open" || record.closureState === "ready-to-close") &&
    includesAll(record.noRuntimeExecutionNote, [
      "local metadata",
      "do not launch",
      "execute runtime"
    ]);

  return [
    item(
      record,
      "integration-owner",
      "Integration owner",
      integrationStatus,
      `${record.roleCounts.integration} integration lane record${record.roleCounts.integration === 1 ? "" : "s"} are present; owner is ${record.integrationOwner}.`,
      integrationStatus === "ready"
        ? "Keep integration ownership visible until main Arena closes the review."
        : "Add an integration owner lane before worker dispatch can leave review."
    ),
    item(
      record,
      "final-validation",
      "Final validation owner",
      finalValidationStatus,
      `${record.validationGateCount} validation gate${record.validationGateCount === 1 ? "" : "s"} are linked to the review record; owner is ${record.finalValidationOwner}.`,
      finalValidationStatus === "ready"
        ? "Keep final validation attached to the main integration path."
        : "Attach at least one validation gate before main integration can close the review."
    ),
    item(
      record,
      "commit-push-reporting",
      "Commit, push, and reporting owner",
      ownershipTermsReady ? "ready" : "blocked",
      `${record.commitPushReportingOwner}: ${record.mainIntegrationOwnershipNote}`,
      ownershipTermsReady
        ? "Keep commit preparation, push approval, reporting, and traceability owned by main Codex."
        : "Restore the main ownership note for commit, push approval, reporting, and traceability."
    ),
    item(
      record,
      "traceability",
      "Review traceability",
      traceabilityReady ? "ready" : "blocked",
      `${record.traceabilityLinkCount}/5 traceability links are present for record, package, plan, project, and run.`,
      traceabilityReady
        ? "Keep source package, plan, run, and review record linked through final reporting."
        : "Restore source package, plan, run, and review identifiers before closing dispatch."
    ),
    item(
      record,
      "closure-boundary",
      "Closure boundary",
      closureReady ? "ready" : "blocked",
      `${record.closureState}: ${record.noRuntimeExecutionNote}`,
      closureReady
        ? "Keep live worker spawning locked while main Codex owns final closure."
        : "Restore the local metadata-only execution boundary before final integration review."
    )
  ];
}

function buildAriaLabel(
  snapshot: Omit<Phase7IntegrationOwnershipDepthSnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.openDepthCount} open checks; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase7IntegrationOwnershipDepth(
  record: DispatchReviewRecord
): Phase7IntegrationOwnershipDepthSnapshot {
  const items = buildItems(record);
  const state = resolveState(items);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(items),
    openDepthCount: items.filter((item) => item.status !== "ready").length,
    readyCount: items.filter((item) => item.status === "ready").length,
    reviewCount: items.filter((item) => item.status === "review").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    waitingCount: items.filter((item) => item.status === "waiting").length,
    nextAction: firstNextAction(items),
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
