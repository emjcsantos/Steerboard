import {
  buildMigrationPreviewCounts,
  type MigrationPreview,
  type MigrationProfileDraft,
  type MigrationProfileDraftHistoryRecord,
  type MigrationProfileDraftImportState
} from "./migrationModel";

export type MigrationHardeningReadinessState = "ready" | "review" | "waiting" | "blocked";

export type MigrationApplyIntentState =
  | "ready-for-review"
  | "needs-review"
  | "waiting"
  | "blocked"
  | "locked";

export interface MigrationHardeningReadinessItem {
  readonly id: string;
  readonly label: string;
  readonly status: MigrationHardeningReadinessState;
  readonly detail: string;
}

export interface MigrationHardeningReadinessInput {
  readonly preview: MigrationPreview;
  readonly draftHistory: readonly MigrationProfileDraftHistoryRecord[];
  readonly excludedSecretsSummary?: readonly string[];
}

export interface MigrationHardeningReadiness {
  readonly safety: string;
  readonly state: MigrationHardeningReadinessState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly selectedCategoryCount: number;
  readonly canCreateDraft: boolean;
  readonly canRollback: boolean;
  readonly canStageApplyIntent: boolean;
  readonly applyIntentState: MigrationApplyIntentState;
  readonly applyIntentLabel: string;
  readonly latestDraftId?: string;
  readonly nextAction: string;
  readonly items: readonly MigrationHardeningReadinessItem[];
}

export const MIGRATION_HARDENING_SAFETY =
  "Migration hardening is preview/apply-intent metadata only. It does not mutate source apps, copy secrets, import raw transcripts, change the active profile, run commands, or enable provider execution.";

const statusLabels: Record<MigrationHardeningReadinessState, string> = {
  ready: "Ready",
  review: "Review required",
  waiting: "Waiting",
  blocked: "Blocked"
};

const applyIntentLabels: Record<MigrationApplyIntentState, string> = {
  "ready-for-review": "Apply review ready",
  "needs-review": "Apply review held",
  waiting: "Apply waiting",
  blocked: "Apply blocked",
  locked: "Apply locked"
};

const statusWeights: Record<MigrationHardeningReadinessState, number> = {
  ready: 100,
  review: 55,
  waiting: 0,
  blocked: 0
};

function selectedCategories(preview: MigrationPreview) {
  return preview.categories.filter((category) => category.selected);
}

function reviewCategoryCount(draft: MigrationProfileDraft): number {
  return draft.selectedCategories.filter((category) => category.state === "review-required").length;
}

function unsupportedCategoryCount(draft: MigrationProfileDraft): number {
  return draft.selectedCategories.filter((category) => category.state === "unsupported").length;
}

function auditMatchesLatestDraft(record: MigrationProfileDraftHistoryRecord | undefined): boolean {
  if (!record) {
    return false;
  }

  return (
    record.audit.draftId === record.draft.id &&
    record.audit.selectedCategoryCount === record.draft.selectedCategories.length &&
    record.audit.reviewRequiredCategoryCount === reviewCategoryCount(record.draft) &&
    record.audit.unsupportedCategoryCount === unsupportedCategoryCount(record.draft)
  );
}

function applyIntentStateFromDraft(
  draft: MigrationProfileDraft | undefined,
  auditReady: boolean
): MigrationApplyIntentState {
  if (!draft) {
    return "waiting";
  }

  if (!auditReady) {
    return "blocked";
  }

  const state: MigrationProfileDraftImportState = draft.importState;
  if (state === "blocked") {
    return "blocked";
  }

  if (state === "waiting") {
    return "waiting";
  }

  if (state === "review") {
    return "needs-review";
  }

  if (state === "ready") {
    return "ready-for-review";
  }

  return "locked";
}

function applyIntentStatus(state: MigrationApplyIntentState): MigrationHardeningReadinessState {
  if (state === "ready-for-review") {
    return "ready";
  }

  if (state === "needs-review" || state === "locked") {
    return "review";
  }

  return state;
}

function overallStatus(
  items: readonly MigrationHardeningReadinessItem[]
): MigrationHardeningReadinessState {
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

function nextActionForStatus(status: MigrationHardeningReadinessState): string {
  if (status === "blocked") {
    return "Repair unsupported categories or inconsistent draft audit before staging migration apply review.";
  }

  if (status === "waiting") {
    return "Select safe metadata categories and create a reviewed profile draft before staging apply intent.";
  }

  if (status === "review") {
    return "Review required categories, audit detail, and rollback evidence while apply remains locked.";
  }

  return "Stage apply review only; active profile and source data remain unchanged until explicit owner approval.";
}

function readinessFromItems(items: readonly MigrationHardeningReadinessItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((total, item) => total + statusWeights[item.status], 0) / items.length
  );
}

export function buildMigrationHardeningReadiness(
  input: MigrationHardeningReadinessInput
): MigrationHardeningReadiness {
  const selected = selectedCategories(input.preview);
  const counts = buildMigrationPreviewCounts(input.preview);
  const latest = input.draftHistory[0];
  const latestDraft = latest?.draft;
  const effectiveSelectedCategoryCount = selected.length > 0
    ? selected.length
    : latestDraft?.selectedCategories.length ?? 0;
  const auditReady = latest ? auditMatchesLatestDraft(latest) : false;
  const excludedSecretsSummary = input.excludedSecretsSummary ?? [];
  const selectedUnsupported = selected.filter((category) => category.state === "unsupported").length;
  const draftUnsupported = latestDraft ? unsupportedCategoryCount(latestDraft) : 0;
  const applyIntentState = applyIntentStateFromDraft(latestDraft, auditReady);
  const applyStatus = applyIntentStatus(applyIntentState);
  const canRollback = input.draftHistory.length > 0;

  const items: MigrationHardeningReadinessItem[] = [
    {
      id: "preview-selection",
      label: "Preview selection",
      status: effectiveSelectedCategoryCount > 0 ? "ready" : "waiting",
      detail: selected.length > 0
        ? `${selected.length} safe metadata categories are selected for draft review.`
        : latestDraft
          ? `${latestDraft.selectedCategories.length} categories are captured in the existing reviewed draft.`
          : "No migration categories are selected for draft review."
    },
    {
      id: "unsupported-exclusion",
      label: "Unsupported exclusion",
      status: selectedUnsupported > 0 || draftUnsupported > 0 ? "blocked" : "ready",
      detail:
        selectedUnsupported > 0 || draftUnsupported > 0
          ? `${selectedUnsupported + draftUnsupported} unsupported categories are still in the selected/draft path.`
          : `${counts.unsupported} unsupported categories remain visible but excluded from import.`
    },
    {
      id: "draft-created",
      label: "Reviewed draft",
      status: latestDraft ? latestDraft.importState === "blocked" ? "blocked" : "ready" : "waiting",
      detail: latestDraft
        ? `${latestDraft.selectedCategories.length} categories are captured in the latest draft.`
        : "Create a profile draft before any apply review can be staged."
    },
    {
      id: "apply-intent",
      label: "Apply intent",
      status: applyStatus,
      detail: latestDraft
        ? `${applyIntentLabels[applyIntentState]}; active profile changes remain locked.`
        : "Apply intent is unavailable until a reviewed draft exists."
    },
    {
      id: "rollback-evidence",
      label: "Rollback evidence",
      status: canRollback ? "ready" : "waiting",
      detail: canRollback
        ? "Rollback is available for the latest local draft history entry."
        : "Rollback evidence appears after the first reviewed draft is created."
    },
    {
      id: "audit-review",
      label: "Audit review",
      status: latestDraft ? auditReady ? "ready" : "blocked" : "waiting",
      detail: latestDraft
        ? auditReady
          ? "Latest audit matches the draft id, selected category count, review count, and unsupported count."
          : "Latest audit does not match the latest draft and must be repaired before apply review."
        : "Audit review is waiting for a draft creation record."
    },
    {
      id: "sensitive-exclusions",
      label: "Sensitive exclusions",
      status: excludedSecretsSummary.length > 0 ? "ready" : "waiting",
      detail:
        excludedSecretsSummary.length > 0
          ? `${excludedSecretsSummary.length} exclusion notes confirm secrets, auth, browser state, source mutation, or raw transcript data stay out.`
          : "Sensitive exclusion notes are missing from the preview."
    }
  ];

  const state = overallStatus(items);
  const readiness = readinessFromItems(items);
  const canStageApplyIntent =
    Boolean(latestDraft) &&
    auditReady &&
    (applyIntentState === "ready-for-review" || applyIntentState === "needs-review");

  return {
    safety: MIGRATION_HARDENING_SAFETY,
    state,
    statusLabel: statusLabels[state],
    readiness,
    selectedCategoryCount: effectiveSelectedCategoryCount,
    canCreateDraft: selected.length > 0 && selectedUnsupported === 0,
    canRollback,
    canStageApplyIntent,
    applyIntentState,
    applyIntentLabel: applyIntentLabels[applyIntentState],
    latestDraftId: latestDraft?.id,
    nextAction: nextActionForStatus(state),
    items
  };
}

export function createMigrationApplyIntentNotice(readiness: MigrationHardeningReadiness): string {
  if (!readiness.canStageApplyIntent) {
    return readiness.nextAction;
  }

  return `Migration apply review staged for ${readiness.latestDraftId ?? "latest draft"}. Active profile and source data remain unchanged; ${readiness.nextAction}`;
}
