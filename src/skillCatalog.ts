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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
