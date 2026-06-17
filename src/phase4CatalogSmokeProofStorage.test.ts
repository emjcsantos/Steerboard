import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import {
  loadPhase4CatalogSmokeProof,
  parseStoredPhase4CatalogSmokeProof,
  PHASE4_CATALOG_SMOKE_PROOF_STORAGE_KEY,
  savePhase4CatalogSmokeProof
} from "./phase4CatalogSmokeProofStorage";

const snapshotPayloads = {
  commandCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        command: "/alpha",
        label: "Alpha Command",
        detail: "Primary command snapshot.",
        state: "live",
        scopes: ["panel"]
      }
    ]
  },
  skillCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-skill",
        label: "Alpha Skill",
        source: "builtin",
        trigger: "slash",
        invocationLabel: "Alpha",
        state: "live"
      }
    ]
  },
  pluginCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-plugin",
        label: "Alpha Plugin",
        detail: "Alpha plugin.",
        state: "live"
      }
    ]
  },
  mcpCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-mcp",
        label: "Alpha MCP",
        transport: "stdio",
        state: "live",
        toolPolicy: "read-only"
      }
    ]
  },
  automationCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-automation",
        label: "Alpha Automation",
        lifecycle: "active",
        trigger: "manual",
        approvalPosture: "manual",
        state: "live"
      }
    ]
  },
  personalizationCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-personalization",
        label: "Alpha Personalization",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live"
      }
    ]
  }
} as const;

describe("phase 4 catalog smoke proof storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a persisted executed six-surface metadata-only proof", () => {
    const proof = buildCatalogRefreshProviderSmoke(snapshotPayloads, {
      checkedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(parseStoredPhase4CatalogSmokeProof(JSON.stringify(proof))).toEqual(proof);
  });

  it("falls back for not-run preview, malformed, incomplete, or unsafe records", () => {
    const proof = buildCatalogRefreshProviderSmoke(snapshotPayloads, {
      checkedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(parseStoredPhase4CatalogSmokeProof(null)).toEqual(
      CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
    );
    expect(parseStoredPhase4CatalogSmokeProof("{")).toEqual(
      CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
    );
    expect(
      parseStoredPhase4CatalogSmokeProof(
        JSON.stringify(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW)
      )
    ).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(
      parseStoredPhase4CatalogSmokeProof(
        JSON.stringify({
          ...proof,
          surfaces: proof.surfaces.slice(0, 5)
        })
      )
    ).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(
      parseStoredPhase4CatalogSmokeProof(
        JSON.stringify({
          ...proof,
          safety: "Unsafe refresh can execute commands."
        })
      )
    ).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
  });

  it("saves and loads only persistable proof through localStorage", () => {
    const store = new Map<string, string>();
    const setItem = vi.fn((key: string, value: string) => {
      store.set(key, value);
    });
    const getItem = vi.fn((key: string) => store.get(key) ?? null);

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    savePhase4CatalogSmokeProof(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(setItem).not.toHaveBeenCalled();

    const proof = buildCatalogRefreshProviderSmoke(snapshotPayloads, {
      checkedAt: "2026-06-18T00:00:00.000Z"
    });
    savePhase4CatalogSmokeProof(proof);
    expect(setItem).toHaveBeenCalledWith(
      PHASE4_CATALOG_SMOKE_PROOF_STORAGE_KEY,
      JSON.stringify(proof)
    );
    expect(loadPhase4CatalogSmokeProof()).toEqual(proof);
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase4CatalogSmokeProof()).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(() =>
      savePhase4CatalogSmokeProof(buildCatalogRefreshProviderSmoke(snapshotPayloads))
    ).not.toThrow();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        })
      }
    });

    expect(loadPhase4CatalogSmokeProof()).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(() =>
      savePhase4CatalogSmokeProof(buildCatalogRefreshProviderSmoke(snapshotPayloads))
    ).not.toThrow();
  });
});
