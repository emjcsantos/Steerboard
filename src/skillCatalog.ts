export type SkillCatalogState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

export type SkillCatalogSource = "builtin" | "extension" | "automation" | "api" | "remote";

export type SkillCatalogTrigger = "slash" | "command" | "button" | "menu" | "auto";

export type SkillCatalogEntry = {
  id: string;
  label: string;
  source: SkillCatalogSource;
  trigger: SkillCatalogTrigger;
  invocationLabel: string;
  state: SkillCatalogState;
  detail?: string;
};

export type SkillCatalogSummary = {
  total: number;
  live: number;
  preview: number;
  disconnected: number;
  setupRequired: number;
  unsupported: number;
  unavailable: number;
  actionable: number;
  availability: number;
};

export type SkillCatalogRefreshSource =
  | "provider-live"
  | "provider-preview"
  | "default-fallback"
  | "empty-refresh"
  | "unavailable";

export type SkillCatalogProviderCapabilityState = SkillCatalogState;

export interface SkillCatalogSnapshotSummary extends Omit<SkillCatalogSummary, "availability"> {
  source: SkillCatalogRefreshSource;
  availability: number;
}

export interface SkillCatalogSnapshot {
  source: SkillCatalogRefreshSource;
  catalog: readonly SkillCatalogEntry[];
  summary: SkillCatalogSnapshotSummary;
}

export interface SkillCatalogProviderCapabilitySkill {
  id: string;
  state: SkillCatalogProviderCapabilityState;
}

export interface SkillCatalogProviderCapabilityInput {
  canRunLive: boolean;
  canRunPreview: boolean;
  skills: unknown[];
  source: SkillCatalogRefreshSource;
}

export const defaultSkillCatalog: readonly SkillCatalogEntry[] = [
  {
    id: "plan-tasks",
    label: "Plan Tasks",
    source: "builtin",
    trigger: "slash",
    invocationLabel: "Plan",
    state: "preview",
    detail: "Create a practical plan for the active context."
  },
  {
    id: "handoff-notes",
    label: "Handoff Notes",
    source: "builtin",
    trigger: "button",
    invocationLabel: "Create Handoff",
    state: "preview",
    detail: "Capture a concise handoff summary for the next workflow owner."
  },
  {
    id: "review-brief",
    label: "Review Brief",
    source: "extension",
    trigger: "command",
    invocationLabel: "Run Review",
    state: "preview",
    detail: "Summarize open validation items in a quick review pass."
  },
  {
    id: "health-check",
    label: "Health Check",
    source: "automation",
    trigger: "menu",
    invocationLabel: "Run Health",
    state: "setup-required",
    detail: "Enable health telemetry in settings to use live checks."
  },
  {
    id: "legacy-runbook",
    label: "Legacy Runbook",
    source: "api",
    trigger: "auto",
    invocationLabel: "Open",
    state: "unsupported",
    detail: "Legacy runtime is no longer supported in this version."
  },
  {
    id: "remote-lens",
    label: "Remote Lens",
    source: "remote",
    trigger: "button",
    invocationLabel: "Open Lens",
    state: "unavailable",
    detail: "Remote connectivity is not configured."
  }
];

const DEFAULT_INVOCATION_LABEL = "Run";
const FALLBACK_SOURCE: SkillCatalogSource = "builtin";
const FALLBACK_TRIGGER: SkillCatalogTrigger = "command";
const REFRESH_SOURCES: readonly SkillCatalogRefreshSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProviderRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function normalizeSkillId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function normalizeSkillCatalogSource(value: unknown): SkillCatalogSource {
  return value === "builtin" ||
    value === "extension" ||
    value === "automation" ||
    value === "api" ||
    value === "remote"
    ? value
    : FALLBACK_SOURCE;
}

function normalizeSkillCatalogTrigger(value: unknown): SkillCatalogTrigger {
  return value === "slash" ||
    value === "command" ||
    value === "button" ||
    value === "menu" ||
    value === "auto"
    ? value
    : FALLBACK_TRIGGER;
}

function normalizeSkillCatalogState(value: unknown): SkillCatalogState {
  return value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable"
    ? value
    : "unavailable";
}

function normalizeSkillLabel(value: unknown, fallbackId: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackId
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  return value.trim();
}

function normalizeSkillInvocationLabel(value: unknown, fallbackLabel: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return `${fallbackLabel}`;
}

function normalizeSkillDetail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const detail = value.trim();
  return detail.length > 0 ? detail : undefined;
}

function coerceSkillCatalogEntry(raw: unknown): SkillCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = normalizeSkillId(raw.id);
  if (!id) {
    return undefined;
  }

  const label = normalizeSkillLabel(raw.label, id);
  const source = normalizeSkillCatalogSource(raw.source);
  const trigger = normalizeSkillCatalogTrigger(raw.trigger);
  const invocationLabel = normalizeSkillInvocationLabel(raw.invocationLabel, label);
  const state = normalizeSkillCatalogState(raw.state);
  const detail = normalizeSkillDetail(raw.detail);

  return {
    id,
    label,
    source,
    trigger,
    invocationLabel,
    state,
    ...(detail !== undefined ? { detail } : {})
  };
}

function normalizeSkillCatalogInternal(value: unknown): SkillCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value
    .map(coerceSkillCatalogEntry)
    .filter((entry): entry is SkillCatalogEntry => entry !== undefined);

  const deduped: SkillCatalogEntry[] = [];
  for (const entry of entries) {
    const isDuplicate = deduped.some((item) => item.id === entry.id);
    if (!isDuplicate) {
      deduped.push(entry);
    }
  }

  return deduped;
}

function summarizeSkillCatalogWithSource(
  catalog: unknown,
  source: SkillCatalogRefreshSource
): SkillCatalogSnapshotSummary {
  const safeCatalog = normalizeSkillCatalog(catalog);

  const summary = {
    total: safeCatalog.length,
    live: 0,
    preview: 0,
    disconnected: 0,
    setupRequired: 0,
    unsupported: 0,
    unavailable: 0
  };

  for (const entry of safeCatalog) {
    switch (entry.state) {
      case "live":
        summary.live += 1;
        break;
      case "preview":
        summary.preview += 1;
        break;
      case "disconnected":
        summary.disconnected += 1;
        break;
      case "setup-required":
        summary.setupRequired += 1;
        break;
      case "unsupported":
        summary.unsupported += 1;
        break;
      default:
        summary.unavailable += 1;
        break;
    }
  }

  const actionable =
    summary.live +
    summary.preview +
    summary.disconnected +
    summary.setupRequired +
    summary.unsupported +
    summary.unavailable;
  const availability =
    summary.total > 0 ? Number(((summary.live + summary.preview) / summary.total).toFixed(2)) : 0;

  return {
    ...summary,
    actionable,
    availability,
    source
  };
}

function normalizeRefreshSource(value: unknown): SkillCatalogRefreshSource {
  return typeof value === "string" &&
    (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as SkillCatalogRefreshSource)
    : "unavailable";
}

function isSkillCatalogProviderCapabilityState(value: unknown): value is SkillCatalogProviderCapabilityState {
  return value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable";
}

function isSkillCatalogProviderCapabilityInput(
  value: unknown
): value is SkillCatalogProviderCapabilityInput {
  return (
    isProviderRecord(value) &&
    typeof value.canRunLive === "boolean" &&
    typeof value.canRunPreview === "boolean" &&
    Array.isArray(value.skills)
  );
}

function coerceProviderCapabilitySkill(
  value: unknown
): SkillCatalogProviderCapabilitySkill | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizeSkillId(value.id);
  if (!id) {
    return undefined;
  }

  if (!isSkillCatalogProviderCapabilityState(value.state)) {
    return undefined;
  }

  return { id, state: value.state };
}

function normalizeSkillCatalogProviderCapabilityInput(
  value: unknown
): {
  source: SkillCatalogRefreshSource;
  skills: SkillCatalogProviderCapabilitySkill[];
  skillCount: number;
  canRunLive: boolean;
} {
  const raw = isSkillCatalogProviderCapabilityInput(value)
    ? (value as SkillCatalogProviderCapabilityInput)
    : undefined;

  if (!raw) {
    return {
      source: "default-fallback",
      skills: [],
      skillCount: -1,
      canRunLive: false
    };
  }

  return {
    source: raw.canRunLive
      ? "provider-live"
      : raw.canRunPreview
        ? "provider-preview"
        : "default-fallback",
    skills: raw.skills
      .map(coerceProviderCapabilitySkill)
      .filter((item): item is SkillCatalogProviderCapabilitySkill => item !== undefined),
    skillCount: raw.skills.length,
    canRunLive: raw.canRunLive
  };
}

function normalizeSkillCatalogWithProviderCapabilities(
  catalog: unknown,
  providerCapabilities: {
    canRunLive: boolean;
    skills: SkillCatalogProviderCapabilitySkill[];
  }
): SkillCatalogEntry[] {
  const fallbackCatalog = normalizeSkillCatalog(catalog);
  const bySkill = new Map<string, SkillCatalogProviderCapabilityState>(
    providerCapabilities.skills.map((item) => [item.id, item.state])
  );

  return fallbackCatalog.map((entry) => {
    const override = bySkill.get(entry.id);
    if (!override) {
      return entry;
    }

    const resolvedState = providerCapabilities.canRunLive
      ? override
      : override === "live"
        ? "preview"
        : override;

    return {
      ...entry,
      state: resolvedState
    };
  });
}

function normalizeSkillCatalogWithProviderEntries(
  entries: unknown,
  source: SkillCatalogRefreshSource,
  fallback: readonly SkillCatalogEntry[]
): SkillCatalogEntry[] {
  const providerEntries = normalizeSkillCatalogInternal(entries);
  const fallbackEntries = normalizeSkillCatalogInternal(fallback);

  if (providerEntries.length === 0) {
    return [];
  }

  return providerEntries.map((entry) => {
    const fallbackEntry = fallbackEntries.find((item) => item.id === entry.id);
    const state = source === "provider-preview" && entry.state === "live"
      ? "preview"
      : entry.state;

    return {
      ...(fallbackEntry ?? entry),
      state
    };
  });
}

function unavailableSnapshot(
  fallback: readonly SkillCatalogEntry[]
): SkillCatalogSnapshot {
  const catalog = normalizeSkillCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? ("unavailable" as const) : entry.state
  }));

  return {
    source: "unavailable",
    catalog,
    summary: summarizeSkillCatalogWithSource(catalog, "unavailable")
  };
}

export function buildSkillCatalogSnapshot(
  catalog: unknown,
  source: SkillCatalogRefreshSource = "default-fallback",
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): SkillCatalogSnapshot {
  const providedIsArray = Array.isArray(catalog);
  const normalizedCatalog = providedIsArray ? normalizeSkillCatalogInternal(catalog) : [];
  const normalizedFallback = normalizeSkillCatalogInternal(fallback);

  if (normalizedCatalog.length > 0) {
    const resolvedSource = source === "provider-live" || source === "provider-preview" ? source : "default-fallback";
    return {
      source: resolvedSource,
      catalog: normalizedCatalog,
      summary: summarizeSkillCatalogWithSource(normalizedCatalog, resolvedSource)
    };
  }

  let resolvedSource: SkillCatalogRefreshSource;
  if (providedIsArray) {
    resolvedSource = catalog.length === 0 ? "empty-refresh" : "default-fallback";
  } else if (normalizedFallback.length === 0) {
    resolvedSource = "unavailable";
  } else {
    resolvedSource = "default-fallback";
  }

  const safeCatalog = normalizeSkillCatalog(catalog, fallback);
  return {
    source: resolvedSource,
    catalog: safeCatalog,
    summary: summarizeSkillCatalogWithSource(safeCatalog, resolvedSource)
  };
}

export function normalizeSkillCatalog(
  value: unknown,
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): SkillCatalogEntry[] {
  const normalized = normalizeSkillCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const normalizedFallback = normalizeSkillCatalogInternal(fallback);
  if (normalizedFallback.length > 0) {
    return normalizedFallback;
  }

  return [
    {
      id: "skill-fallback",
      label: "Fallback Skill",
      source: FALLBACK_SOURCE,
      trigger: FALLBACK_TRIGGER,
      invocationLabel: DEFAULT_INVOCATION_LABEL,
      state: "unavailable",
      detail: "No valid skill catalog is available."
    }
  ];
}

export function summarizeSkillCatalog(
  catalog: unknown = defaultSkillCatalog
): SkillCatalogSummary {
  const safeCatalog = normalizeSkillCatalog(catalog);

  const summary = {
    total: safeCatalog.length,
    live: 0,
    preview: 0,
    disconnected: 0,
    setupRequired: 0,
    unsupported: 0,
    unavailable: 0
  };

  for (const entry of safeCatalog) {
    switch (entry.state) {
      case "live":
        summary.live += 1;
        break;
      case "preview":
        summary.preview += 1;
        break;
      case "disconnected":
        summary.disconnected += 1;
        break;
      case "setup-required":
        summary.setupRequired += 1;
        break;
      case "unsupported":
        summary.unsupported += 1;
        break;
      case "unavailable":
      default:
        summary.unavailable += 1;
        break;
    }
  }

  const actionable =
    summary.live +
    summary.preview +
    summary.disconnected +
    summary.setupRequired +
    summary.unsupported +
    summary.unavailable;
  const availability =
    summary.total > 0 ? Number(((summary.live + summary.preview) / summary.total).toFixed(2)) : 0;

  return {
    ...summary,
    actionable,
    availability
  };
}

export function buildSkillCatalogSnapshotFromProviderCapabilities(
  providerCapabilities: unknown,
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): SkillCatalogSnapshot {
  const normalizedFallback = normalizeSkillCatalogInternal(fallback);
  const normalizedFallbackCatalog = normalizeSkillCatalog([], fallback);
  const { source, skills, skillCount, canRunLive } =
    normalizeSkillCatalogProviderCapabilityInput(providerCapabilities);

  if (skillCount < 0) {
    return normalizedFallback.length === 0
      ? unavailableSnapshot(fallback)
      : {
          source: "default-fallback",
          catalog: normalizedFallbackCatalog,
          summary: summarizeSkillCatalogWithSource(normalizedFallbackCatalog, "default-fallback")
        };
  }

  if (skillCount === 0) {
    return buildSkillCatalogSnapshot([], "empty-refresh", fallback);
  }

  const providerCatalog = normalizeSkillCatalogWithProviderCapabilities(fallback, {
    canRunLive,
    skills
  });

  const providerSource = skills.length > 0 ? source : normalizeRefreshSource("default-fallback");
  const safeSource = normalizeRefreshSource(providerSource);

  return {
    source: safeSource,
    catalog: skills.length > 0 ? providerCatalog : normalizedFallbackCatalog,
    summary: summarizeSkillCatalogWithSource(
      skills.length > 0 ? providerCatalog : normalizedFallbackCatalog,
      safeSource
    )
  };
}

export function snapshotFromProviderSkillCatalogPayload(
  value: unknown,
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): SkillCatalogSnapshot {
  if (!isProviderRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    const providerEntries = normalizeSkillCatalogWithProviderEntries(
      value.entries,
      source,
      fallback
    );
    if (providerEntries.length > 0) {
      return {
        source,
        catalog: providerEntries,
        summary: summarizeSkillCatalogWithSource(providerEntries, source)
      };
    }

    return buildSkillCatalogSnapshotFromProviderCapabilities(
      {
        canRunLive: source === "provider-live",
        canRunPreview: true,
        source,
        skills: isRecord(value) ? value.entries : []
      },
      fallback
    );
  }

  if (source === "default-fallback" || source === "empty-refresh") {
    return buildSkillCatalogSnapshot(value.entries, source, fallback);
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildSkillCatalogSnapshot([], "unavailable", fallback);
}
