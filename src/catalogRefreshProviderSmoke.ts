import {
  CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
  CATALOG_REFRESH_OWNER_SURFACE_ORDER,
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationInput,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult
} from "./catalogRefreshOwnerValidation";

export type CatalogRefreshProviderSmokeSurface = (typeof CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER)[number];

export interface CatalogRefreshProviderSmokeInput {
  readonly commandCatalogSnapshot?: unknown;
  readonly skillCatalogSnapshot?: unknown;
  readonly pluginCatalogSnapshot?: unknown;
  readonly mcpCatalogSnapshot?: unknown;
  readonly automationCatalogSnapshot?: unknown;
  readonly personalizationCatalogSnapshot?: unknown;
}

export interface CatalogRefreshProviderSmokeSurfaceResult {
  readonly surface: CatalogRefreshProviderSmokeSurface;
  readonly source: CatalogRefreshOwnerValidationSurfaceResult["source"];
  readonly total: number;
  readonly pass: boolean;
  readonly executed: boolean;
  readonly readiness: number;
  readonly state: "ready" | "blocked" | "preview";
  readonly detail: string;
  readonly safety: string;
}

export interface CatalogRefreshProviderSmokeResult {
  readonly executed: boolean;
  readonly ok: boolean;
  readonly readiness: number;
  readonly state: "ready" | "blocked" | "preview";
  readonly detail: string;
  readonly safety: string;
  readonly surfaces: readonly CatalogRefreshProviderSmokeSurfaceResult[];
}

export interface CatalogRefreshProviderSmokeOptions {
  readonly validationOverride?: CatalogRefreshOwnerValidationResult;
  readonly notRunPreview?: boolean;
}

export const CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER = CATALOG_REFRESH_OWNER_SURFACE_ORDER;

const CATALOG_REFRESH_PROVIDER_SMOKE_COMPLETED_DETAIL =
  "Provider catalog metadata/status refresh completed without executing commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.";

const CATALOG_REFRESH_PROVIDER_SMOKE_UNAVAILABLE_DETAIL =
  "Provider catalog refresh smoke proof was not run in this preview/unavailable context.";

const CATALOG_REFRESH_PROVIDER_SMOKE_BLOCKED_DETAIL =
  "Provider catalog metadata/status refresh was blocked due to validation inconsistency.";

const CATALOG_REFRESH_PROVIDER_SMOKE_NO_EXECUTION_SAFETY =
  CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY;

const NOT_RUN_SOURCE = "unavailable" as const;

function isUnavailableSource(source: CatalogRefreshOwnerValidationSurfaceResult["source"]): boolean {
  return source === "unavailable";
}

function toSmokeSurface(
  surface: CatalogRefreshProviderSmokeSurface,
  source: CatalogRefreshOwnerValidationSurfaceResult["source"],
  total: number,
  pass: boolean,
  readiness: number
): CatalogRefreshProviderSmokeSurfaceResult {
  const notRun = isUnavailableSource(source);
  const executed = !notRun;
  const surfaceState = notRun ? "preview" : pass ? "ready" : "blocked";
  const detail = notRun
    ? CATALOG_REFRESH_PROVIDER_SMOKE_UNAVAILABLE_DETAIL
    : pass
      ? CATALOG_REFRESH_PROVIDER_SMOKE_COMPLETED_DETAIL
      : CATALOG_REFRESH_PROVIDER_SMOKE_BLOCKED_DETAIL;

  return {
    surface,
    source,
    total,
    pass,
    executed,
    readiness,
    state: surfaceState,
    detail,
    safety: CATALOG_REFRESH_PROVIDER_SMOKE_NO_EXECUTION_SAFETY
  };
}

const fallbackSurface = CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER.reduce(
  (surfaceById, surface) => {
    surfaceById[surface] = {
      surface,
      source: NOT_RUN_SOURCE,
      total: 0,
      pass: false,
      executed: false,
      readiness: 0,
      state: "preview",
      detail: CATALOG_REFRESH_PROVIDER_SMOKE_UNAVAILABLE_DETAIL,
      safety: CATALOG_REFRESH_PROVIDER_SMOKE_NO_EXECUTION_SAFETY
    };

    return surfaceById;
  },
  {} as Record<CatalogRefreshProviderSmokeSurface, CatalogRefreshProviderSmokeSurfaceResult>
);

export const CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW: CatalogRefreshProviderSmokeResult = {
  executed: false,
  ok: false,
  readiness: 0,
  state: "preview",
  detail: CATALOG_REFRESH_PROVIDER_SMOKE_UNAVAILABLE_DETAIL,
  safety: CATALOG_REFRESH_PROVIDER_SMOKE_NO_EXECUTION_SAFETY,
  surfaces: CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER.map((surface) => fallbackSurface[surface])
};

function mapSurfaces(
  validation: CatalogRefreshOwnerValidationResult
): readonly CatalogRefreshProviderSmokeSurfaceResult[] {
  return CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER.map((surface) => {
    const surfaceValidation = validation.surfaces.find((item) => item.surface === surface);
    if (!surfaceValidation) {
      return fallbackSurface[surface];
    }

    return toSmokeSurface(
      surface,
      surfaceValidation.source,
      surfaceValidation.total,
      surfaceValidation.pass,
      surfaceValidation.readiness
    );
  });
}

function computeResult(
  surfaces: readonly CatalogRefreshProviderSmokeSurfaceResult[]
): CatalogRefreshProviderSmokeResult {
  const hasPreview = surfaces.some((surface) => surface.state === "preview");
  const readiness = hasPreview
    ? 0
    : Math.round(surfaces.reduce((total, surface) => total + surface.readiness, 0) / surfaces.length);
  const ok = !hasPreview && surfaces.every((surface) => surface.pass);
  const state = hasPreview ? "preview" : ok ? "ready" : "blocked";

  const detail = hasPreview
    ? "Provider catalog refresh smoke proof is unavailable for one or more surfaces; running in preview-only mode."
    : ok
      ? CATALOG_REFRESH_PROVIDER_SMOKE_COMPLETED_DETAIL
      : CATALOG_REFRESH_PROVIDER_SMOKE_BLOCKED_DETAIL;

  return {
    executed: surfaces.every((surface) => surface.executed),
    ok,
    readiness,
    state,
    detail,
    safety: CATALOG_REFRESH_PROVIDER_SMOKE_NO_EXECUTION_SAFETY,
    surfaces
  };
}

export function buildCatalogRefreshProviderSmoke(
  snapshots: CatalogRefreshProviderSmokeInput = {},
  options: CatalogRefreshProviderSmokeOptions = {}
): CatalogRefreshProviderSmokeResult {
  try {
    if (options.notRunPreview) {
      return CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
    }

    const ownerPayload: CatalogRefreshOwnerValidationInput = {
      commandPayload: snapshots.commandCatalogSnapshot,
      skillPayload: snapshots.skillCatalogSnapshot,
      pluginPayload: snapshots.pluginCatalogSnapshot,
      mcpPayload: snapshots.mcpCatalogSnapshot,
      automationPayload: snapshots.automationCatalogSnapshot,
      personalizationPayload: snapshots.personalizationCatalogSnapshot
    };

    const validation = options.validationOverride ?? buildCatalogRefreshOwnerValidation(ownerPayload);
    const surfaces = mapSurfaces(validation);

    return computeResult(surfaces);
  } catch {
    return CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
  }
}
