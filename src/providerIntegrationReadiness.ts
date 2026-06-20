import {
  CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";

export type ProviderIntegrationReadinessState =
  | "ready"
  | "preview"
  | "setup-required"
  | "blocked"
  | "unsupported"
  | "unavailable";

export interface ProviderIntegrationReadinessCounts {
  readonly totalEntries: number;
  readonly ready: number;
  readonly preview: number;
  readonly setupRequired: number;
  readonly unsupported: number;
  readonly unavailable: number;
  readonly blocked: number;
}

export interface ProviderIntegrationReadinessSurface {
  readonly surface: CatalogSurface;
  readonly label: string;
  readonly source: CatalogRefreshOwnerValidationSurfaceResult["source"];
  readonly sourceLabel: string;
  readonly total: number;
  readonly readiness: number;
  readonly state: ProviderIntegrationReadinessState;
  readonly statusLabel: string;
  readonly counts: ProviderIntegrationReadinessCounts;
  readonly detail: string;
  readonly nextAction: string;
  readonly safety: string;
}

export interface ProviderIntegrationReadiness {
  readonly safety: string;
  readonly readiness: number;
  readonly state: ProviderIntegrationReadinessState;
  readonly statusLabel: string;
  readonly counts: ProviderIntegrationReadinessCounts;
  readonly nextAction: string;
  readonly surfaces: readonly ProviderIntegrationReadinessSurface[];
}

const SURFACE_LABELS: Record<CatalogSurface, string> = {
  command: "Commands",
  skill: "Skills",
  plugin: "Plugins",
  mcp: "MCP",
  automation: "Automations",
  personalization: "Personalization"
};

const SOURCE_LABELS: Record<CatalogRefreshOwnerValidationSurfaceResult["source"], string> = {
  "provider-live": "Provider live",
  "provider-preview": "Provider preview",
  "default-fallback": "Fallback metadata",
  "empty-refresh": "Empty refresh",
  unavailable: "Unavailable"
};

const STATUS_LABELS: Record<ProviderIntegrationReadinessState, string> = {
  ready: "Ready",
  preview: "Preview",
  "setup-required": "Setup required",
  blocked: "Blocked",
  unsupported: "Unsupported",
  unavailable: "Unavailable"
};

const NEXT_ACTIONS: Record<ProviderIntegrationReadinessState, string> = {
  ready: "Keep provider execution locked until explicit approval, audit, rollback, and permission gates are implemented.",
  preview: "Run catalog smoke and compare preview rows before treating this surface as execution-ready.",
  "setup-required": "Resolve setup-required or disconnected rows before enabling provider execution.",
  blocked: "Fix catalog validation inconsistencies before refreshing again or enabling provider execution.",
  unsupported: "Keep unsupported rows disabled and document their replacement path before execution.",
  unavailable: "Connect provider metadata or keep fallback rows visible until live provider state is available."
};

const EMPTY_COUNTS: ProviderIntegrationReadinessCounts = {
  totalEntries: 0,
  ready: 0,
  preview: 0,
  setupRequired: 0,
  unsupported: 0,
  unavailable: 0,
  blocked: 0
};

function valueOf(summary: Readonly<Record<string, number>>, key: string): number {
  const value = summary[key];

  return Number.isFinite(value) ? value : 0;
}

function countsFromSurface(
  surface: CatalogRefreshOwnerValidationSurfaceResult
): ProviderIntegrationReadinessCounts {
  const disconnected = valueOf(surface.summary, "disconnected");
  const setupRequired = valueOf(surface.summary, "setupRequired") + disconnected;

  return {
    totalEntries: surface.total,
    ready: valueOf(surface.summary, "live"),
    preview: valueOf(surface.summary, "preview"),
    setupRequired,
    unsupported: valueOf(surface.summary, "unsupported"),
    unavailable: valueOf(surface.summary, "unavailable"),
    blocked: surface.pass ? 0 : 1
  };
}

function sumCounts(
  counts: readonly ProviderIntegrationReadinessCounts[]
): ProviderIntegrationReadinessCounts {
  return counts.reduce(
    (total, item) => ({
      totalEntries: total.totalEntries + item.totalEntries,
      ready: total.ready + item.ready,
      preview: total.preview + item.preview,
      setupRequired: total.setupRequired + item.setupRequired,
      unsupported: total.unsupported + item.unsupported,
      unavailable: total.unavailable + item.unavailable,
      blocked: total.blocked + item.blocked
    }),
    EMPTY_COUNTS
  );
}

function isAllUnavailable(counts: ProviderIntegrationReadinessCounts): boolean {
  return counts.totalEntries === 0 || counts.unavailable >= counts.totalEntries;
}

function resolveSurfaceState(
  surface: CatalogRefreshOwnerValidationSurfaceResult,
  counts: ProviderIntegrationReadinessCounts
): ProviderIntegrationReadinessState {
  if (!surface.pass) {
    return "blocked";
  }

  if (surface.source === "unavailable" || surface.source === "empty-refresh" || isAllUnavailable(counts)) {
    return "unavailable";
  }

  if (counts.setupRequired > 0) {
    return "setup-required";
  }

  if (counts.unavailable > 0) {
    return "unavailable";
  }

  if (counts.unsupported > 0) {
    return "unsupported";
  }

  if (surface.source === "provider-preview" || counts.preview > 0) {
    return "preview";
  }

  return "ready";
}

function resolveOverallState(
  counts: ProviderIntegrationReadinessCounts,
  surfaces: readonly ProviderIntegrationReadinessSurface[]
): ProviderIntegrationReadinessState {
  if (counts.blocked > 0) {
    return "blocked";
  }

  if (surfaces.some((surface) => surface.state === "setup-required")) {
    return "setup-required";
  }

  if (surfaces.some((surface) => surface.state === "unavailable")) {
    return "unavailable";
  }

  if (surfaces.some((surface) => surface.state === "unsupported")) {
    return "unsupported";
  }

  if (surfaces.some((surface) => surface.state === "preview")) {
    return "preview";
  }

  return "ready";
}

function readinessFromSurface(
  surface: CatalogRefreshOwnerValidationSurfaceResult,
  counts: ProviderIntegrationReadinessCounts
): number {
  if (!surface.pass || counts.totalEntries === 0) {
    return 0;
  }

  const available = counts.ready + counts.preview;

  return Math.round((available / counts.totalEntries) * 100);
}

function describeCounts(counts: ProviderIntegrationReadinessCounts): string {
  const attention = [
    counts.setupRequired > 0 ? `${counts.setupRequired} setup` : "",
    counts.unsupported > 0 ? `${counts.unsupported} unsupported` : "",
    counts.unavailable > 0 ? `${counts.unavailable} unavailable` : "",
    counts.blocked > 0 ? `${counts.blocked} blocked` : ""
  ].filter(Boolean);

  const prefix = `${counts.ready} ready, ${counts.preview} preview`;

  return attention.length > 0 ? `${prefix}; ${attention.join(", ")}.` : `${prefix}; no blockers.`;
}

function buildSurface(
  surface: CatalogRefreshOwnerValidationSurfaceResult
): ProviderIntegrationReadinessSurface {
  const counts = countsFromSurface(surface);
  const state = resolveSurfaceState(surface, counts);

  return {
    surface: surface.surface,
    label: SURFACE_LABELS[surface.surface],
    source: surface.source,
    sourceLabel: SOURCE_LABELS[surface.source],
    total: surface.total,
    readiness: readinessFromSurface(surface, counts),
    state,
    statusLabel: STATUS_LABELS[state],
    counts,
    detail: `${describeCounts(counts)} Source: ${SOURCE_LABELS[surface.source]}.`,
    nextAction: NEXT_ACTIONS[state],
    safety: surface.safety || CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY
  };
}

export function buildProviderIntegrationReadiness(
  validation: CatalogRefreshOwnerValidationResult
): ProviderIntegrationReadiness {
  const surfaces = validation.surfaces.map(buildSurface);
  const counts = sumCounts(surfaces.map((surface) => surface.counts));
  const readiness =
    surfaces.length > 0
      ? Math.round(surfaces.reduce((total, surface) => total + surface.readiness, 0) / surfaces.length)
      : 0;
  const state = resolveOverallState(counts, surfaces);

  return {
    safety: validation.safety || CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
    readiness,
    state,
    statusLabel: STATUS_LABELS[state],
    counts,
    nextAction: NEXT_ACTIONS[state],
    surfaces
  };
}
