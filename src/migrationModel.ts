export type MigrationSourceId =
  | "codex"
  | "claude-code"
  | "antigravity"
  | "generic-mcp"
  | "skill-folder"
  | "manual-file";

export type MigrationCategoryId =
  | "projects"
  | "threads"
  | "settings"
  | "provider-preferences"
  | "commands"
  | "skills"
  | "prompts"
  | "agents"
  | "plugins"
  | "mcp"
  | "tool-policy"
  | "project-instructions"
  | "automations"
  | "personalization"
  | "ui-preferences";

export type MigrationCategoryState =
  | "accepted"
  | "review-required"
  | "unsupported"
  | "excluded";

export type MigrationCategoryPolicyState =
  | "accepted"
  | "review-required"
  | "unsupported";

export interface MigrationSource {
  id: MigrationSourceId;
  label: string;
  description: string;
  categoryPolicies: Record<MigrationCategoryId, MigrationCategoryPolicyState>;
}

export interface MigrationCategoryDefinition {
  id: MigrationCategoryId;
  label: string;
  detail: string;
}

export interface MigrationCategoryPreview {
  id: MigrationCategoryId;
  label: string;
  selected: boolean;
  baseState: MigrationCategoryPolicyState;
  state: MigrationCategoryState;
  itemCount: number;
  detail: string;
}

export interface MigrationPreview {
  source: MigrationSourceId;
  categories: MigrationCategoryPreview[];
}

export type MigrationProfileDraftImportState = "ready" | "review" | "waiting" | "blocked" | "applied";
export type MigrationProfileDraftAuditAction =
  | "created"
  | "apply-review-staged"
  | "applied"
  | "rolled-back";

export interface MigrationProfileDraftCategory {
  id: MigrationCategoryId;
  label: string;
  state: MigrationCategoryState;
  itemCount: number;
  detail: string;
}

export interface MigrationProfileDraft {
  id: string;
  sourceId: MigrationSourceId;
  sourceLabel: string;
  createdAt: string;
  selectedCategories: MigrationProfileDraftCategory[];
  selectedCategoryIds: MigrationCategoryId[];
  counts: MigrationPreviewCounts;
  importState: MigrationProfileDraftImportState;
  readiness: number;
  evidenceFingerprint: string;
  summary: string;
  safetyNote: string;
}

export interface MigrationProfileDraftAudit {
  id: string;
  draftId: string;
  action: MigrationProfileDraftAuditAction;
  createdAt: string;
  sourceId: MigrationSourceId;
  importState: MigrationProfileDraftImportState;
  selectedCategoryCount: number;
  reviewRequiredCategoryCount: number;
  unsupportedCategoryCount: number;
  evidenceFingerprint?: string;
  detail: string;
}

export interface MigrationProfileDraftHistoryRecord {
  draft: MigrationProfileDraft;
  audit: MigrationProfileDraftAudit;
}

export interface MigrationProfileDraftHistorySummary {
  total: number;
  ready: number;
  review: number;
  waiting: number;
  blocked: number;
  applied: number;
  latestDraftId?: string;
}

export interface CreateMigrationProfileDraftOptions {
  sourceLabel?: string;
  safetyNote?: string;
  createdAt?: string;
}

export interface RollbackMigrationProfileDraftResult {
  rolledBackDraft?: MigrationProfileDraft;
  rollbackAudit?: MigrationProfileDraftAudit;
  previousDraft?: MigrationProfileDraft;
  history: MigrationProfileDraftHistoryRecord[];
}

export interface MigrationPreviewCounts {
  accepted: number;
  reviewRequired: number;
  unsupported: number;
  excluded: number;
}

export const MIGRATION_DRAFT_HISTORY_STORAGE_KEY = "steerboard.migrationProfileDraftHistory.v1";
export const MIGRATION_DRAFT_HISTORY_LIMIT = 24;

const migrationCategoryOrder: readonly MigrationCategoryId[] = [
  "projects",
  "threads",
  "settings",
  "provider-preferences",
  "commands",
  "skills",
  "prompts",
  "agents",
  "plugins",
  "mcp",
  "tool-policy",
  "project-instructions",
  "automations",
  "personalization",
  "ui-preferences"
];

const defaultCategoryTemplate: Record<MigrationCategoryId, MigrationCategoryDefinition> = {
  projects: {
    id: "projects",
    label: "Projects",
    detail: "Project and workspace metadata."
  },
  threads: {
    id: "threads",
    label: "Threads",
    detail: "Chat thread and session metadata."
  },
  settings: {
    id: "settings",
    label: "Settings",
    detail: "App and integration settings."
  },
  "provider-preferences": {
    id: "provider-preferences",
    label: "Provider Preferences",
    detail: "Provider and model preference signals."
  },
  commands: {
    id: "commands",
    label: "Commands",
    detail: "Shortcut and shell-like commands."
  },
  skills: {
    id: "skills",
    label: "Skills",
    detail: "Reusable workflow skill definitions."
  },
  prompts: {
    id: "prompts",
    label: "Prompts",
    detail: "Reusable prompt assets."
  },
  agents: {
    id: "agents",
    label: "Agents",
    detail: "Agent workflows and automation roles."
  },
  plugins: {
    id: "plugins",
    label: "Plugins",
    detail: "Plugin manifests and enablement."
  },
  mcp: {
    id: "mcp",
    label: "MCP",
    detail: "Model context protocol servers."
  },
  "tool-policy": {
    id: "tool-policy",
    label: "Tool Policy",
    detail: "Tool permission and safety policy."
  },
  "project-instructions": {
    id: "project-instructions",
    label: "Project Instructions",
    detail: "Project workspace instruction files."
  },
  automations: {
    id: "automations",
    label: "Automations",
    detail: "Automation definitions and triggers."
  },
  personalization: {
    id: "personalization",
    label: "Personalization",
    detail: "User-facing UX and behavior posture."
  },
  "ui-preferences": {
    id: "ui-preferences",
    label: "UI Preferences",
    detail: "Layout and view preferences."
  }
};

const defaultSourceCategoryStateBySource: Record<MigrationSourceId, MigrationCategoryPolicyState> = {
  codex: "accepted",
  "claude-code": "accepted",
  antigravity: "accepted",
  "generic-mcp": "unsupported",
  "skill-folder": "unsupported",
  "manual-file": "unsupported"
};

const sourceReviewStateOverrides: Partial<
  Record<MigrationSourceId, Partial<Record<MigrationCategoryId, MigrationCategoryPolicyState>>>
> = {
  codex: {
    commands: "review-required",
    skills: "review-required",
    prompts: "review-required",
    agents: "review-required",
    plugins: "review-required",
    mcp: "review-required",
    "tool-policy": "review-required",
    automations: "review-required",
    personalization: "review-required"
  },
  "claude-code": {
    commands: "review-required",
    skills: "review-required",
    prompts: "review-required",
    "project-instructions": "review-required",
    "tool-policy": "review-required",
    "ui-preferences": "review-required"
  },
  antigravity: {
    commands: "review-required",
    plugins: "accepted",
    mcp: "review-required",
    automations: "review-required",
    "ui-preferences": "review-required"
  },
  "generic-mcp": {
    mcp: "accepted",
    "tool-policy": "review-required",
    settings: "unsupported",
    "provider-preferences": "unsupported"
  },
  "skill-folder": {
    skills: "accepted",
    prompts: "accepted",
    agents: "review-required",
    projects: "review-required",
    commands: "unsupported"
  },
  "manual-file": {
    projects: "accepted",
    threads: "accepted",
    settings: "accepted",
    "provider-preferences": "review-required",
    "project-instructions": "review-required",
    "ui-preferences": "review-required",
    commands: "review-required"
  }
};

export const migrationSourceIds = Object.keys(
  defaultSourceCategoryStateBySource
) as MigrationSourceId[];

function safeSourceLookup(value: unknown): MigrationSourceId | undefined {
  return (
    value === "codex" ||
    value === "claude-code" ||
    value === "antigravity" ||
    value === "generic-mcp" ||
    value === "skill-folder" ||
    value === "manual-file"
  )
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBoolean(value: unknown): boolean | undefined {
  return value === true || value === false ? value : undefined;
}

function normalizeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeCategoryId(value: unknown): MigrationCategoryId | undefined {
  return migrationCategoryOrder.includes(value as MigrationCategoryId)
    ? (value as MigrationCategoryId)
    : undefined;
}

function buildSourceCategoryPolicies(sourceId: MigrationSourceId): MigrationSource["categoryPolicies"] {
  const defaults = defaultSourceCategoryStateBySource[sourceId];
  const overrides = sourceReviewStateOverrides[sourceId] ?? {};
  const categories: Record<MigrationCategoryId, MigrationCategoryPolicyState> =
    {} as Record<MigrationCategoryId, MigrationCategoryPolicyState>;

  for (const categoryId of migrationCategoryOrder) {
    categories[categoryId] = overrides[categoryId] ?? defaults;
  }

  return categories;
}

function buildSafeSourceDefinition(id: MigrationSourceId): MigrationSource {
  const labels = {
    codex: "Codex",
    "claude-code": "Claude Code",
    antigravity: "Antigravity",
    "generic-mcp": "Generic MCP",
    "skill-folder": "Skill Folder",
    "manual-file": "Manual File"
  };

  const descriptions = {
    codex:
      "Import project and runtime settings from an installed Codex profile export.",
    "claude-code":
      "Import selected content from a Claude Code-style configuration folder.",
    antigravity:
      "Import adapter metadata and integrations from Antigravity-style tooling.",
    "generic-mcp":
      "Import generic MCP server metadata and connection policy.",
    "skill-folder":
      "Import local prompt/skill assets from a folder-shaped source.",
    "manual-file":
      "Import structured settings from a manual JSON/TOML payload."
  };

  return {
    id,
    label: labels[id],
    description: descriptions[id],
    categoryPolicies: buildSourceCategoryPolicies(id)
  };
}

export const defaultMigrationSources = migrationSourceIds.map((id) =>
  buildSafeSourceDefinition(id)
);
export const defaultMigrationCategories = migrationCategoryOrder.map(
  (id) => defaultCategoryTemplate[id]
);

export const defaultMigrationSource: MigrationSourceId = "codex";
export const safeMigrationSources = defaultMigrationSources;
export const safeMigrationCategories = defaultMigrationCategories;
export const defaultMigrationPreview = buildDefaultMigrationPreview();

export function buildDefaultMigrationPreview(
  source: MigrationSourceId = defaultMigrationSource
): MigrationPreview {
  const sourceDefinition = buildSafeSourceDefinition(source);
  const categories: MigrationCategoryPreview[] = migrationCategoryOrder.map((categoryId) => {
    const definition = defaultCategoryTemplate[categoryId];
    const baseState = sourceDefinition.categoryPolicies[categoryId];
    return {
      id: categoryId,
      label: definition.label,
      selected: false,
      baseState,
      state: baseState === "unsupported" ? "unsupported" : "excluded",
      itemCount: 0,
      detail: definition.detail
    };
  });

  return {
    source,
    categories
  };
}

function deriveCategoryState(
  baseState: MigrationCategoryPolicyState,
  selected: boolean
): MigrationCategoryState {
  if (baseState === "unsupported") {
    return "unsupported";
  }

  return selected ? baseState : "excluded";
}

function normalizeSource(value: unknown): MigrationSourceId {
  if (isRecord(value)) {
    return safeSourceLookup(value.id) ?? defaultMigrationSource;
  }

  return safeSourceLookup(value) ?? defaultMigrationSource;
}

function normalizeCategoryInputRecord(
  value: unknown
): {
  id?: MigrationCategoryId;
  selected?: boolean;
  itemCount?: number;
  detail?: string;
} {
  if (!isRecord(value)) {
    return {};
  }

  const id = normalizeCategoryId(value.id);
  if (id === undefined) {
    return {};
  }

  const requestedSelected = normalizeBoolean(value.selected);
  const selected = requestedSelected ?? false;
  const itemCount = normalizeNumber(value.itemCount);
  const detail =
    typeof value.detail === "string" && value.detail.trim().length > 0
      ? redactMigrationPreviewDetail(value.detail)
      : "";

  return {
    id,
    selected,
    itemCount,
    detail
  };
}

function mergeCategoryInputs(
  sourceId: MigrationSourceId,
  rawCategoryInputs: unknown
): MigrationCategoryPreview[] {
  const categories = buildDefaultMigrationPreview(sourceId).categories;
  if (!Array.isArray(rawCategoryInputs)) {
    return categories;
  }

  const byId = new Map<
    MigrationCategoryId,
    {
      selected: boolean;
      itemCount: number;
      detail: string;
    }
  >();

  for (const rawCategory of rawCategoryInputs) {
    const categoryInput = normalizeCategoryInputRecord(rawCategory);
    if (!categoryInput.id) {
      continue;
    }

    byId.set(categoryInput.id, {
      selected: categoryInput.selected ?? false,
      itemCount: categoryInput.itemCount ?? 0,
      detail: categoryInput.detail ?? ""
    });
  }

  return categories.map((category) => {
    const override = byId.get(category.id);
    const selected =
      category.baseState === "unsupported" ? false : (override?.selected ?? false);
    return {
      ...category,
      itemCount: override?.itemCount ?? 0,
      detail: override?.detail || category.detail,
      selected,
      state: deriveCategoryState(category.baseState, selected)
    };
  });
}

export function normalizeMigrationPreview(raw: unknown): MigrationPreview {
  const value = isRecord(raw) ? raw : {};
  const source = normalizeSource(value.source);
  const normalizedSource = mergeCategoryInputs(source, value.categories).map((category) => ({
    ...category,
    detail: redactMigrationPreviewDetail(category.detail)
  }));

  return {
    source,
    categories: normalizedSource
  };
}

export function toggleMigrationCategory(
  preview: MigrationPreview,
  categoryId: MigrationCategoryId,
  nextSelected?: boolean
): MigrationPreview {
  const normalizedSource = normalizeSource(preview.source);
  const normalizedCategoryId = normalizeCategoryId(categoryId);
  if (!normalizedCategoryId) {
    return { ...preview, source: normalizedSource, categories: [...preview.categories] };
  }

  const updatedCategories = preview.categories.map((category) => {
    if (category.id !== normalizedCategoryId) {
      return category;
    }

    if (category.baseState === "unsupported") {
      return category;
    }

    const nextValue = nextSelected ?? !category.selected;
    return {
      ...category,
      selected: nextValue,
      state: deriveCategoryState(category.baseState, nextValue)
    };
  });

  return {
    ...preview,
    source: normalizedSource,
    categories: updatedCategories
  };
}

export function toggleMigrationCategorySelection(
  preview: MigrationPreview,
  categoryId: MigrationCategoryId,
  nextSelected?: boolean
): MigrationPreview {
  return toggleMigrationCategory(preview, categoryId, nextSelected);
}

export function buildMigrationPreviewCounts(
  preview: Pick<MigrationPreview, "categories">
): MigrationPreviewCounts {
  const counts = {
    accepted: 0,
    reviewRequired: 0,
    unsupported: 0,
    excluded: 0
  };

  for (const category of preview.categories) {
    switch (category.state) {
      case "accepted":
        counts.accepted += 1;
        break;
      case "review-required":
        counts.reviewRequired += 1;
        break;
      case "unsupported":
        counts.unsupported += 1;
        break;
      case "excluded":
      default:
        counts.excluded += 1;
        break;
    }
  }

  return counts;
}

export function buildMigrationCategoryCounts(
  preview: Pick<MigrationPreview, "categories">
): MigrationPreviewCounts {
  return buildMigrationPreviewCounts(preview);
}

function stripModelNames(value: string): string {
  const modelPatterns = [
    /\bgpt-[0-9]+(?:-[a-z0-9]+)?\b/gi,
    /\bclaude[- ]?\w*/gi,
    /\bgemini-\w+/gi,
    /\bmistral-\w*/gi,
    /\bllama[- ]?\w*/gi,
    /\bqwen[- ]?\w*/gi,
    /\bopus\b/gi
  ];

  let sanitized = value;
  for (const pattern of modelPatterns) {
    sanitized = sanitized.replace(pattern, "[redacted model]");
  }

  return sanitized;
}

function stripSourceNames(value: string): string {
  const sourceNames = [
    "\\b[Cc]odex\\b",
    "\\b[Cc]laude[\\s_-]?[Cc]ode\\b",
    "\\b[Aa]ntigravity\\b",
    "\\b[Gg]eneric[\\s_-]?[Mm][Cc][Pp]\\b",
    "\\b[Ss]kill[\\s_-]?[Ff]older\\b",
    "\\b[Mm]anual[\\s_-]?[Ff]ile\\b"
  ];

  let sanitized = value;
  for (const name of sourceNames) {
    const pattern = new RegExp(name, "g");
    sanitized = sanitized.replace(pattern, "[source]");
  }

  return sanitized;
}

function stripSecretMarkers(value: string): string {
  return value
    .replace(
      /\b(api[\s_-]?key|auth[\s_-]?token|access[\s_-]?token|bearer|oauth|raw transcript)\b[^\\s"'`]*\b/gi,
      "[redacted secret]"
    )
    .replace(/\bsk-[A-Za-z0-9]{8,}\b/g, "[redacted secret]")
    .replace(/\b[A-Za-z0-9_-]{30,}\b/g, "[redacted secret]")
    .replace(/\b(raw\s*transcript)\b/gi, "[redacted content]");
}

function stripPathFragments(value: string): string {
  return value
    .replace(/[A-Za-z]:\\(?:[^\\s"']+)/g, "[redacted path]")
    .replace(/(?:^|[\s])(?:\.{2}[\\/][^\s"']+|(?:[A-Za-z0-9._-]+[\\/]){2,}[^\s"']+)/g, " [redacted path] ")
    .replace(/\/[A-Za-z0-9._/-]{4,}(?:\.[A-Za-z0-9._-]+)?/g, "[redacted path]");
}

export function redactMigrationPreviewDetail(value: string): string {
  if (typeof value !== "string") {
    return "No preview detail available.";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "No preview detail available.";
  }

  let safe = trimmed
    .replace(/\s+/g, " ")
    .replace(/[\r\n]/g, " ");
  safe = stripPathFragments(safe);
  safe = stripSecretMarkers(safe);
  safe = stripModelNames(safe);
  safe = stripSourceNames(safe);
  safe = safe.trim();

  return safe.length > 0 ? safe.slice(0, 200).trim() : "No preview detail available.";
}

const DEFAULT_DRAFT_SAFETY_NOTE =
  "Profile draft created from reviewed local profile metadata only. Source app settings, credentials, tokens, and raw transcripts are not imported.";
const DEFAULT_DRAFT_CREATED_AT = "1970-01-01T00:00:00.000Z";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}

function safeDateText(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_DRAFT_CREATED_AT;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_DRAFT_CREATED_AT;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? DEFAULT_DRAFT_CREATED_AT : date.toISOString();
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  return 0;
}

function safeLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MIGRATION_DRAFT_HISTORY_LIMIT;
  }

  const normalized = Math.floor(value);
  if (normalized < 0) {
    return 0;
  }

  return normalized;
}

function buildDraftId(
  sourceId: MigrationSourceId,
  createdAt: string,
  selectedCategoryIds: MigrationCategoryId[]
): string {
  const normalizedIds = selectedCategoryIds.length > 0
    ? selectedCategoryIds.join(",")
    : "none";
  return `migration-profile-draft:${sourceId}:${createdAt}:${normalizedIds}`;
}

function normalizeDraftSourceLabel(preview: MigrationPreview, sourceLabel?: string): string {
  if (typeof sourceLabel === "string" && sourceLabel.trim()) {
    return redactMigrationPreviewDetail(sourceLabel);
  }

  return buildSafeSourceDefinition(preview.source).label;
}

function normalizeDraftSafetyNote(safetyNote?: string): string {
  return redactMigrationPreviewDetail(
    typeof safetyNote === "string" && safetyNote.trim()
      ? safetyNote
      : DEFAULT_DRAFT_SAFETY_NOTE
  );
}

function buildMigrationDraftSummary(
  preview: MigrationPreview,
  selectedCategoryCount: number
): string {
  const selectedIds = selectedMigrationCategoryIds(preview);
  if (selectedIds.length === 0) {
    return "No migration categories were selected for draft.";
  }

  const readyCount = preview.categories.filter(
    (category) => category.selected && category.state === "accepted"
  ).length;

  return `${preview.categories.length} categories scanned; ${selectedCategoryCount} selected, ${readyCount} ready.`;
}

function selectedMigrationCategoryIds(preview: MigrationPreview): MigrationCategoryId[] {
  return preview.categories
    .filter((category) => category.selected)
    .map((category) => category.id);
}

function resolveDraftImportState(
  selectedCategories: readonly MigrationProfileDraftCategory[]
): MigrationProfileDraftImportState {
  const selectedCount = selectedCategories.length;
  if (selectedCount === 0) {
    return "waiting";
  }

  const hasUnsupported = selectedCategories.some((item) => item.state === "unsupported");
  if (hasUnsupported) {
    return "blocked";
  }

  const hasReview = selectedCategories.some((item) => item.state === "review-required");
  if (hasReview) {
    return "review";
  }

  return "ready";
}

function normalizeDraftCounts(
  preview: MigrationPreview,
  selectedCategories: readonly MigrationProfileDraftCategory[]
): MigrationPreviewCounts {
  const base = buildMigrationPreviewCounts(preview);
  if (selectedCategories.length === 0) {
    return {
      accepted: 0,
      reviewRequired: 0,
      unsupported: 0,
      excluded: base.excluded
    };
  }

  return selectedCategories.reduce<MigrationPreviewCounts>(
    (acc, category) => {
      if (category.state === "accepted") {
        acc.accepted += 1;
      } else if (category.state === "review-required") {
        acc.reviewRequired += 1;
      } else if (category.state === "unsupported") {
        acc.unsupported += 1;
      } else {
        acc.excluded += 1;
      }
      return acc;
    },
    { accepted: 0, reviewRequired: 0, unsupported: 0, excluded: base.excluded }
  );
}

function normalizeDraftCategoryEntries(
  preview: MigrationPreview
): MigrationProfileDraftCategory[] {
  return preview.categories
    .filter((category) => category.selected)
    .map((category) => ({
      id: category.id,
      label: category.label,
      state: category.state,
      itemCount: Math.max(0, Math.floor(category.itemCount)),
      detail: redactMigrationPreviewDetail(category.detail)
    }))
    .sort((a, b) => migrationCategoryOrder.indexOf(a.id) - migrationCategoryOrder.indexOf(b.id));
}

function normalizeDraftReadiness(
  selectedCategories: readonly MigrationProfileDraftCategory[]
): number {
  if (selectedCategories.length === 0) {
    return 0;
  }

  const readyCount = selectedCategories.filter((item) => item.state === "accepted").length;
  return Math.round((readyCount / selectedCategories.length) * 100);
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

function stableHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `phase5-migration:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function buildMigrationProfileDraftEvidenceFingerprint(
  draft: Pick<
    MigrationProfileDraft,
    "sourceId" | "selectedCategories" | "selectedCategoryIds" | "counts" | "importState" | "readiness"
  >
): string {
  return stableHash(
    stableJson({
      counts: draft.counts,
      importState: draft.importState,
      readiness: draft.readiness,
      selectedCategories: draft.selectedCategories.map((category) => ({
        detail: category.detail,
        id: category.id,
        itemCount: category.itemCount,
        state: category.state
      })),
      selectedCategoryIds: draft.selectedCategoryIds,
      sourceId: draft.sourceId
    })
  );
}

export function createMigrationProfileDraft(
  preview: MigrationPreview,
  options: CreateMigrationProfileDraftOptions = {}
): MigrationProfileDraft {
  const normalizedPreview = normalizeMigrationPreview(preview);
  const selectedCategories = normalizeDraftCategoryEntries(normalizedPreview);
  const selectedCategoryIds = selectedCategoryIdsFromEntries(selectedCategories);

  const importState = resolveDraftImportState(selectedCategories);
  const readiness = normalizeDraftReadiness(selectedCategories);
  const createdAt = safeDateText(options.createdAt ?? new Date().toISOString());
  const sourceLabel = normalizeDraftSourceLabel(
    normalizedPreview,
    options.sourceLabel ?? buildSafeSourceDefinition(normalizedPreview.source).label
  );
  const counts = normalizeDraftCounts(normalizedPreview, selectedCategories);

  const id = buildDraftId(normalizedPreview.source, createdAt, selectedCategoryIds);

  const draftBase = {
    id,
    sourceId: normalizedPreview.source,
    sourceLabel,
    createdAt,
    selectedCategories,
    selectedCategoryIds,
    counts,
    importState,
    readiness,
    evidenceFingerprint: "",
    summary: normalizeDraftSummary(
      buildMigrationDraftSummary(normalizedPreview, selectedCategoryIds.length)
    ),
    safetyNote: normalizeDraftSafetyNote(options.safetyNote)
  };

  return {
    ...draftBase,
    evidenceFingerprint: buildMigrationProfileDraftEvidenceFingerprint(draftBase)
  };
}

function selectedCategoryIdsFromEntries(
  categories: readonly MigrationProfileDraftCategory[]
): MigrationCategoryId[] {
  return categories.map((category) => category.id);
}

function normalizeDraftSummary(value: string): string {
  return normalizeValue(value, "Draft was not fully normalized.");
}

function normalizeValue(value: string, fallback: string): string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 260).trim() : fallback;
}

export function createMigrationProfileDraftAuditRecord(
  draft: MigrationProfileDraft,
  action: MigrationProfileDraftAuditAction,
  createdAt = new Date().toISOString()
): MigrationProfileDraftAudit {
  const timestamp = safeDateText(createdAt);
  const reviewRequiredCount = draft.selectedCategories.filter(
    (category) => category.state === "review-required"
  ).length;
  const unsupportedCount = draft.selectedCategories.filter(
    (category) => category.state === "unsupported"
  ).length;

  return {
    id: `${draft.id}:${action}:${timestamp}`,
    draftId: draft.id,
    action,
    createdAt: timestamp,
    sourceId: draft.sourceId,
    importState: draft.importState,
    selectedCategoryCount: draft.selectedCategories.length,
    reviewRequiredCategoryCount: reviewRequiredCount,
    unsupportedCategoryCount: unsupportedCount,
    evidenceFingerprint: draft.evidenceFingerprint,
    detail: redactMigrationPreviewDetail(
      `${action} for ${draft.sourceLabel} migration draft with ${draft.selectedCategories.length} selected categories`
    )
  };
}

export function appendMigrationProfileDraftHistory(
  records: readonly MigrationProfileDraftHistoryRecord[],
  draft: MigrationProfileDraft,
  action: MigrationProfileDraftAuditAction = "created",
  limit = MIGRATION_DRAFT_HISTORY_LIMIT,
  createdAt = new Date().toISOString()
): MigrationProfileDraftHistoryRecord[] {
  const existing = [...records];
  const normalizedLimit = safeLimit(limit);
  if (normalizedLimit === 0) {
    return [];
  }

  const nextAudit = createMigrationProfileDraftAuditRecord(draft, action, createdAt);
  const nextRecords = [{ draft, audit: nextAudit }, ...existing];
  const seenDrafts = new Set<string>();
  const deduped: MigrationProfileDraftHistoryRecord[] = [];

  for (const record of nextRecords) {
    if (seenDrafts.has(record.draft.id)) {
      continue;
    }

    seenDrafts.add(record.draft.id);
    deduped.push(repairMigrationProfileDraftHistoryRecord(record));
    if (deduped.length >= normalizedLimit) {
      break;
    }
  }

  return deduped;
}

export function rollbackMigrationProfileDraftHistory(
  records: readonly MigrationProfileDraftHistoryRecord[],
  createdAt = new Date().toISOString()
): RollbackMigrationProfileDraftResult {
  const history = [...records];
  if (history.length === 0) {
    return { history };
  }

  const [latest, ...rest] = history;
  const nextHistory = rest.map((entry) => repairMigrationProfileDraftHistoryRecord(entry));
  const rollbackAudit = createMigrationProfileDraftAuditRecord(
    latest.draft,
    "rolled-back",
    createdAt
  );
  const rolledBackDraft = repairMigrationProfileDraftHistoryRecord(latest).draft;

  return {
    rolledBackDraft,
    rollbackAudit,
    previousDraft: nextHistory[0]?.draft,
    history: nextHistory
  };
}

export function summarizeMigrationProfileDrafts(
  records: readonly MigrationProfileDraftHistoryRecord[]
): MigrationProfileDraftHistorySummary {
  const summary: MigrationProfileDraftHistorySummary = {
    total: 0,
    ready: 0,
    review: 0,
    waiting: 0,
    blocked: 0,
    applied: 0
  };

  for (const record of records) {
    summary.total += 1;
    switch (record.draft.importState) {
      case "ready":
        summary.ready += 1;
        break;
      case "review":
        summary.review += 1;
        break;
      case "waiting":
        summary.waiting += 1;
        break;
      case "blocked":
        summary.blocked += 1;
        break;
      case "applied":
        summary.applied += 1;
        break;
      default:
        break;
    }
  }

  summary.latestDraftId = records[0]?.draft.id;
  return summary;
}

function repairMigrationProfileDraftRecord(
  value: unknown
): MigrationProfileDraftHistoryRecord {
  const record = asRecord(value);
  if (!record) {
    const fallback = createFallbackMigrationProfileDraft();
    return { draft: fallback, audit: createMigrationProfileDraftAuditRecord(fallback, "created", fallback.createdAt) };
  }

  const repairedDraft = repairMigrationProfileDraft(record.draft, createFallbackMigrationProfileDraft());
  const repairedAudit = repairMigrationProfileDraftAudit(
    record.audit,
    repairedDraft,
    "created"
  );

  return {
    draft: repairedDraft,
    audit: {
      ...repairedAudit,
      draftId: repairedDraft.id
    }
  };
}

function createFallbackMigrationProfileDraft(): MigrationProfileDraft {
  return {
    id: buildDraftId(defaultMigrationSource, DEFAULT_DRAFT_CREATED_AT, []),
    sourceId: defaultMigrationSource,
    sourceLabel: buildSafeSourceDefinition(defaultMigrationSource).label,
    createdAt: DEFAULT_DRAFT_CREATED_AT,
    selectedCategories: [],
    selectedCategoryIds: [],
    counts: { accepted: 0, reviewRequired: 0, unsupported: 0, excluded: 15 },
    importState: "waiting",
    readiness: 0,
    evidenceFingerprint: buildMigrationProfileDraftEvidenceFingerprint({
      sourceId: defaultMigrationSource,
      selectedCategories: [],
      selectedCategoryIds: [],
      counts: { accepted: 0, reviewRequired: 0, unsupported: 0, excluded: 15 },
      importState: "waiting",
      readiness: 0
    }),
    summary: "No migration draft selected.",
    safetyNote: normalizeDraftSafetyNote(DEFAULT_DRAFT_SAFETY_NOTE)
  };
}

function repairMigrationProfileDraft(
  value: unknown,
  fallback: MigrationProfileDraft
): MigrationProfileDraft {
  const record = asRecord(value);
  if (!record) {
    return fallback;
  }

  const sourceId = normalizeSource(
    (record as Record<string, unknown>).sourceId ?? record.source
  );
  const sourceLabel = safeText(record.sourceLabel, buildSafeSourceDefinition(sourceId).label);
  const createdAt = safeDateText(record.createdAt);
  const selectedCategoryIds = Array.isArray(record.selectedCategoryIds)
    ? record.selectedCategoryIds.map((id) => normalizeCategoryId(id)).filter((id): id is MigrationCategoryId => Boolean(id))
    : [];
  const selectedCategories = Array.isArray(record.selectedCategories)
    ? record.selectedCategories
      .map((entry) => {
        const candidate = asRecord(entry);
        if (!candidate) {
          return undefined;
        }

        const categoryId = normalizeCategoryId(candidate.id);
        if (!categoryId) {
          return undefined;
        }

        const label = safeText(candidate.label, categoryId);
        const state = candidate.state === "accepted" || candidate.state === "review-required"
          || candidate.state === "unsupported" || candidate.state === "excluded"
          ? candidate.state
          : "excluded";
        const itemCount = safeNumber(candidate.itemCount);
        const detail = redactMigrationPreviewDetail(safeText(candidate.detail, ""));
        return { id: categoryId, label, state, itemCount, detail };
      })
      .filter((entry): entry is MigrationProfileDraftCategory => entry !== undefined)
    : [];

  const sortedSelectedCategories = selectedCategories
    .sort((a, b) => migrationCategoryOrder.indexOf(a.id) - migrationCategoryOrder.indexOf(b.id));
  const countsRecord = asRecord(record.counts);
  const normalizedCounts = {
    accepted: safeNumber(countsRecord?.accepted),
    reviewRequired: safeNumber(countsRecord?.reviewRequired),
    unsupported: safeNumber(countsRecord?.unsupported),
    excluded: safeNumber(countsRecord?.excluded)
  };
  const importState = resolveDraftImportState(sortedSelectedCategories);
  const readiness = normalizeDraftReadiness(sortedSelectedCategories);
  const summary = normalizeDraftSummary(safeText(record.summary, "Draft was repaired from malformed storage."));
  const normalizedSelectedCategories = selectedCategories.sort(
    (a, b) => migrationCategoryOrder.indexOf(a.id) - migrationCategoryOrder.indexOf(b.id)
  );
  const normalizedSelectedCategoryIds = selectedCategoryIds.length > 0
    ? selectedCategoryIds
    : selectedCategoryIdsFromEntries(normalizedSelectedCategories);

  const draftBase = {
    id: safeText(record.id, buildDraftId(sourceId, createdAt, normalizedSelectedCategoryIds)),
    sourceId,
    sourceLabel: normalizeDraftSourceLabel(
      { source: sourceId, categories: buildDefaultMigrationPreview(sourceId).categories },
      sourceLabel
    ),
    createdAt,
    selectedCategories: normalizedSelectedCategories,
    selectedCategoryIds: normalizedSelectedCategoryIds,
    counts: normalizedCounts.accepted ||
      normalizedCounts.reviewRequired ||
      normalizedCounts.unsupported ||
      normalizedCounts.excluded
      ? {
          accepted: normalizedCounts.accepted,
          reviewRequired: normalizedCounts.reviewRequired,
          unsupported: normalizedCounts.unsupported,
          excluded: normalizedCounts.excluded
        }
      : normalizeDraftCounts({ source: sourceId, categories: sortedSelectedCategories.map((item) => ({
          id: item.id,
          label: item.label,
          baseState: "accepted",
          detail: item.detail,
          selected: true,
          state: item.state,
          itemCount: item.itemCount
        })) }, sortedSelectedCategories),
    importState: importState,
    readiness,
    evidenceFingerprint: "",
    summary,
    safetyNote: normalizeDraftSafetyNote(safeText(record.safetyNote, DEFAULT_DRAFT_SAFETY_NOTE))
  };

  return {
    ...draftBase,
    evidenceFingerprint: buildMigrationProfileDraftEvidenceFingerprint(draftBase)
  };
}

function repairMigrationProfileDraftHistoryRecord(
  value: unknown
): MigrationProfileDraftHistoryRecord {
  return repairMigrationProfileDraftRecord(value);
}

function repairMigrationProfileDraftAudit(
  value: unknown,
  draft: MigrationProfileDraft,
  fallbackAction: MigrationProfileDraftAuditAction
): MigrationProfileDraftAudit {
  const record = asRecord(value);
  const action = isMigrationProfileDraftAuditAction(record?.action)
    ? (record!.action as MigrationProfileDraftAuditAction)
    : fallbackAction;
  const createdAt = safeDateText(record?.createdAt);

  return {
    id: safeText(record?.id, `${draft.id}:${action}:${createdAt}`),
    draftId: draft.id,
    action,
    createdAt,
    sourceId: draft.sourceId,
    importState: draft.importState,
    selectedCategoryCount: safeNumber(record?.selectedCategoryCount ?? draft.selectedCategories.length),
    reviewRequiredCategoryCount: safeNumber(record?.reviewRequiredCategoryCount ?? draft.selectedCategories.filter((category) => category.state === "review-required").length),
    unsupportedCategoryCount: safeNumber(record?.unsupportedCategoryCount ?? draft.selectedCategories.filter((category) => category.state === "unsupported").length),
    evidenceFingerprint: safeText(record?.evidenceFingerprint, ""),
    detail: redactMigrationPreviewDetail(safeText(record?.detail, `${action} migration draft ${draft.id}`))
  };
}

function isMigrationProfileDraftAuditAction(value: unknown): value is MigrationProfileDraftAuditAction {
  return (
    value === "created" ||
    value === "apply-review-staged" ||
    value === "applied" ||
    value === "rolled-back"
  );
}

export function parseStoredMigrationProfileDraftHistory(
  serialized: string | null,
  fallback: MigrationProfileDraftHistoryRecord[] = [],
  limit = MIGRATION_DRAFT_HISTORY_LIMIT
): MigrationProfileDraftHistoryRecord[] {
  if (!serialized) {
    return [...fallback];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return [...fallback];
  }

  if (!Array.isArray(parsed)) {
    return [...fallback];
  }

  const normalizedLimit = safeLimit(limit);
  if (normalizedLimit === 0) {
    return [];
  }

  const repaired: MigrationProfileDraftHistoryRecord[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    const repairedEntry = repairMigrationProfileDraftHistoryRecord(entry);
    if (seen.has(repairedEntry.draft.id)) {
      continue;
    }

    seen.add(repairedEntry.draft.id);
    repaired.push(repairedEntry);

    if (repaired.length >= normalizedLimit) {
      break;
    }
  }

  return repaired;
}

function readMigrationProfileDraftStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(MIGRATION_DRAFT_HISTORY_STORAGE_KEY);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeMigrationProfileDraftStorage(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(MIGRATION_DRAFT_HISTORY_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export function loadMigrationProfileDraftHistory(
  fallback: MigrationProfileDraftHistoryRecord[] = [],
  limit = MIGRATION_DRAFT_HISTORY_LIMIT
): MigrationProfileDraftHistoryRecord[] {
  return parseStoredMigrationProfileDraftHistory(
    readMigrationProfileDraftStorage(),
    fallback,
    limit
  );
}

export function saveMigrationProfileDraftHistory(records: MigrationProfileDraftHistoryRecord[]): void {
  writeMigrationProfileDraftStorage(JSON.stringify(records.map((record) => repairMigrationProfileDraftHistoryRecord(record))));
}
