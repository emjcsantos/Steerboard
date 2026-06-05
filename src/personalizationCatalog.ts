export type PersonalizationCatalogState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

export type PersonalizationCatalogLayer = "ui" | "workflow" | "memory" | "assist" | "governance";

export type PersonalizationCatalogSource = "builtin" | "extension" | "user-config" | "api" | "automation";

export type PersonalizationCatalogPrivacyPosture =
  | "device-only"
  | "optional-sync"
  | "consent-based-sync"
  | "local-process-only";

export type PersonalizationCatalogEntry = {
  id: string;
  label: string;
  layer: PersonalizationCatalogLayer;
  source: PersonalizationCatalogSource;
  privacyPosture: PersonalizationCatalogPrivacyPosture;
  state: PersonalizationCatalogState;
  detail?: string;
};

export type PersonalizationCatalogSummary = {
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

export const defaultPersonalizationCatalog: readonly PersonalizationCatalogEntry[] = [
  {
    id: "focus-priority",
    label: "Focus Priority",
    layer: "governance",
    source: "builtin",
    privacyPosture: "local-process-only",
    state: "preview",
    detail: "Re-rank active tasks based on the current owner preference."
  },
  {
    id: "layout-memory",
    label: "Layout Memory",
    layer: "ui",
    source: "user-config",
    privacyPosture: "device-only",
    state: "preview",
    detail: "Remember panel order and focus size for this workspace."
  },
  {
    id: "notification-style",
    label: "Notification Style",
    layer: "ui",
    source: "user-config",
    privacyPosture: "device-only",
    state: "preview",
    detail: "Tune alert tone and priority labels for local sessions."
  },
  {
    id: "term-memory",
    label: "Term Memory",
    layer: "memory",
    source: "builtin",
    privacyPosture: "local-process-only",
    state: "setup-required",
    detail: "Enable local context caching to keep short handoffs coherent."
  },
  {
    id: "assistant-routing",
    label: "Assistant Routing",
    layer: "assist",
    source: "automation",
    privacyPosture: "consent-based-sync",
    state: "unsupported",
    detail: "Optional routing policy is not supported in this build."
  },
  {
    id: "partner-preferences",
    label: "Partner Preferences",
    layer: "workflow",
    source: "api",
    privacyPosture: "optional-sync",
    state: "unavailable",
    detail: "No partner feed is configured for this environment."
  }
];

const FALLBACK_LAYER: PersonalizationCatalogLayer = "ui";
const FALLBACK_SOURCE: PersonalizationCatalogSource = "builtin";
const FALLBACK_PRIVACY: PersonalizationCatalogPrivacyPosture = "device-only";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPersonalizationCatalogState(value: unknown): value is PersonalizationCatalogState {
  return (
    value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable"
  );
}

function isPersonalizationCatalogLayer(value: unknown): value is PersonalizationCatalogLayer {
  return (
    value === "ui" ||
    value === "workflow" ||
    value === "memory" ||
    value === "assist" ||
    value === "governance"
  );
}

function isPersonalizationCatalogSource(value: unknown): value is PersonalizationCatalogSource {
  return (
    value === "builtin" ||
    value === "extension" ||
    value === "user-config" ||
    value === "api" ||
    value === "automation"
  );
}

function isPersonalizationCatalogPrivacyPosture(
  value: unknown
): value is PersonalizationCatalogPrivacyPosture {
  return (
    value === "device-only" ||
    value === "optional-sync" ||
    value === "consent-based-sync" ||
    value === "local-process-only"
  );
}

function normalizePersonalizationCatalogId(value: unknown): string | undefined {
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

function normalizePersonalizationCatalogLabel(value: unknown, fallbackId: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackId
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  return value.trim();
}

function normalizePersonalizationCatalogLayer(value: unknown): PersonalizationCatalogLayer {
  return isPersonalizationCatalogLayer(value) ? value : FALLBACK_LAYER;
}

function normalizePersonalizationCatalogSource(value: unknown): PersonalizationCatalogSource {
  return isPersonalizationCatalogSource(value) ? value : FALLBACK_SOURCE;
}

function normalizePersonalizationCatalogPrivacyPosture(value: unknown): PersonalizationCatalogPrivacyPosture {
  return isPersonalizationCatalogPrivacyPosture(value) ? value : FALLBACK_PRIVACY;
}

function normalizePersonalizationCatalogState(value: unknown): PersonalizationCatalogState {
  return isPersonalizationCatalogState(value) ? value : "unavailable";
}

function normalizePersonalizationCatalogDetail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const detail = value.trim();
  return detail.length > 0 ? detail : undefined;
}

function normalizePersonalizationCatalogEntry(
  raw: unknown
): PersonalizationCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = normalizePersonalizationCatalogId(raw.id);
  if (!id) {
    return undefined;
  }

  const label = normalizePersonalizationCatalogLabel(raw.label, id);
  const layer = normalizePersonalizationCatalogLayer(raw.layer);
  const source = normalizePersonalizationCatalogSource(raw.source);
  const privacyPosture = normalizePersonalizationCatalogPrivacyPosture(raw.privacyPosture);
  const state = normalizePersonalizationCatalogState(raw.state);
  const detail = normalizePersonalizationCatalogDetail(raw.detail);

  return {
    id,
    label,
    layer,
    source,
    privacyPosture,
    state,
    ...(detail !== undefined ? { detail } : {})
  };
}

function normalizePersonalizationCatalogInternal(value: unknown): PersonalizationCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value
    .map(normalizePersonalizationCatalogEntry)
    .filter((entry): entry is PersonalizationCatalogEntry => entry !== undefined);

  const deduped: PersonalizationCatalogEntry[] = [];
  for (const entry of entries) {
    const isDuplicate = deduped.some((candidate) => candidate.id === entry.id);
    if (!isDuplicate) {
      deduped.push(entry);
    }
  }

  return deduped;
}

export function normalizePersonalizationCatalog(
  value: unknown,
  fallback: readonly PersonalizationCatalogEntry[] = defaultPersonalizationCatalog
): PersonalizationCatalogEntry[] {
  const normalized = normalizePersonalizationCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const normalizedFallback = normalizePersonalizationCatalogInternal(fallback);
  if (normalizedFallback.length > 0) {
    return normalizedFallback;
  }

  return [...defaultPersonalizationCatalog];
}

export function summarizePersonalizationCatalog(
  catalog: unknown = defaultPersonalizationCatalog
): PersonalizationCatalogSummary {
  const safeCatalog = normalizePersonalizationCatalog(catalog);

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
