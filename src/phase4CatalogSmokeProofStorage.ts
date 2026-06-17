import {
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW,
  CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER,
  type CatalogRefreshProviderSmokeResult,
  type CatalogRefreshProviderSmokeSurface,
  type CatalogRefreshProviderSmokeSurfaceResult
} from "./catalogRefreshProviderSmoke";

export const PHASE4_CATALOG_SMOKE_PROOF_STORAGE_KEY =
  "steerboard.phase4.catalogSmokeProof.v1";

const VALID_SURFACE_STATES = ["ready", "blocked", "preview"] as const;
const VALID_SURFACE_SOURCES = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
] as const;

type CatalogSmokeSurfaceState = CatalogRefreshProviderSmokeSurfaceResult["state"];
type CatalogSmokeSurfaceSource = CatalogRefreshProviderSmokeSurfaceResult["source"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bool(value: unknown): boolean {
  return value === true;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeSurface(value: unknown): CatalogRefreshProviderSmokeSurfaceResult | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const surface = String(value.surface) as CatalogRefreshProviderSmokeSurface;
  const state = String(value.state) as CatalogSmokeSurfaceState;
  const source = String(value.source) as CatalogSmokeSurfaceSource;

  if (
    !CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER.includes(surface) ||
    !VALID_SURFACE_STATES.includes(state) ||
    !VALID_SURFACE_SOURCES.includes(source)
  ) {
    return undefined;
  }

  return {
    surface,
    source,
    total: numberOrZero(value.total),
    pass: bool(value.pass),
    executed: bool(value.executed),
    readiness: numberOrZero(value.readiness),
    state,
    detail: stringOrFallback(value.detail, "Provider catalog refresh proof is available."),
    safety: stringOrFallback(
      value.safety,
      CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW.safety
    )
  };
}

function hasMetadataOnlySafety(proof: CatalogRefreshProviderSmokeResult): boolean {
  return (
    proof.safety.includes("must not execute") &&
    proof.safety.includes("commands") &&
    proof.safety.includes("MCP") &&
    proof.safety.includes("Git") &&
    proof.surfaces.every((surface) => surface.safety === proof.safety)
  );
}

function hasSixSurfaceOrder(proof: CatalogRefreshProviderSmokeResult): boolean {
  return (
    proof.surfaces.length === CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER.length &&
    proof.surfaces.every(
      (surface, index) => surface.surface === CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER[index]
    )
  );
}

function isPersistablePhase4CatalogSmokeProof(
  proof: CatalogRefreshProviderSmokeResult
): boolean {
  return proof.executed && hasSixSurfaceOrder(proof) && hasMetadataOnlySafety(proof);
}

function readFromLocalStorage(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(key);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(key, value);
  } catch {
    return;
  }
}

export function parseStoredPhase4CatalogSmokeProof(
  serialized: string | null
): CatalogRefreshProviderSmokeResult {
  if (!serialized) {
    return CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed) || !Array.isArray(parsed.surfaces)) {
      return CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
    }

    const surfaces = parsed.surfaces
      .map(normalizeSurface)
      .filter((surface): surface is CatalogRefreshProviderSmokeSurfaceResult => Boolean(surface));
    const proof: CatalogRefreshProviderSmokeResult = {
      executed: bool(parsed.executed),
      ok: bool(parsed.ok),
      readiness: numberOrZero(parsed.readiness),
      state:
        parsed.state === "ready" || parsed.state === "blocked" || parsed.state === "preview"
          ? parsed.state
          : "preview",
      ...(optionalString(parsed.checkedAt) ? { checkedAt: optionalString(parsed.checkedAt) } : {}),
      ...(optionalString(parsed.catalogFingerprint)
        ? { catalogFingerprint: optionalString(parsed.catalogFingerprint) }
        : {}),
      detail: stringOrFallback(parsed.detail, "Provider catalog refresh proof is available."),
      safety: stringOrFallback(
        parsed.safety,
        CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW.safety
      ),
      surfaces
    };

    return isPersistablePhase4CatalogSmokeProof(proof)
      ? proof
      : CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
  } catch {
    return CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW;
  }
}

export function loadPhase4CatalogSmokeProof(): CatalogRefreshProviderSmokeResult {
  return parseStoredPhase4CatalogSmokeProof(
    readFromLocalStorage(PHASE4_CATALOG_SMOKE_PROOF_STORAGE_KEY)
  );
}

export function savePhase4CatalogSmokeProof(proof: CatalogRefreshProviderSmokeResult): void {
  if (!isPersistablePhase4CatalogSmokeProof(proof)) {
    return;
  }

  writeToLocalStorage(PHASE4_CATALOG_SMOKE_PROOF_STORAGE_KEY, JSON.stringify(proof));
}
