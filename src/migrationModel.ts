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

export interface MigrationPreviewCounts {
  accepted: number;
  reviewRequired: number;
  unsupported: number;
  excluded: number;
}

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
