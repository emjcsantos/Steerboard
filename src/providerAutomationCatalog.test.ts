import { describe, expect, it } from "vitest";
import {
  loadProviderAutomationCatalogSnapshot,
  snapshotFromProviderAutomationCatalogPreview
} from "./providerAutomationCatalog";
import type { AutomationCatalogEntry } from "./automationCatalog";

const fallbackCatalog: AutomationCatalogEntry[] = [
  {
    id: "workflow-checks",
    label: "Workflow Checks",
    lifecycle: "active",
    trigger: "scheduled",
    approvalPosture: "manual",
    state: "live",
    detail: "Fallback check."
  },
  {
    id: "task-handoff",
    label: "Task Handoff",
    lifecycle: "active",
    trigger: "event",
    approvalPosture: "manual",
    state: "preview"
  }
];

describe("provider automation catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderAutomationCatalogSnapshot(
      undefined,
      fallbackCatalog
    );

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe automation rows", () => {
    const snapshot = snapshotFromProviderAutomationCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "workflow-checks",
            state: "live",
            lifecycle: "active",
            trigger: "manual",
            approvalPosture: "automatic",
            detail: "ignored provider detail"
          },
          {
            id: "task-handoff",
            state: "preview",
        label: "Provider Label"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toEqual([
      {
        id: "workflow-checks",
        label: "Workflow Checks",
        lifecycle: "active",
        trigger: "scheduled",
        approvalPosture: "manual",
        state: "live",
        detail: "Fallback check."
      },
      {
        id: "task-handoff",
        label: "Task Handoff",
        lifecycle: "active",
        trigger: "event",
        approvalPosture: "manual",
        state: "preview"
      }
    ]);
  });

  it("downgrades live rows when provider source is preview-only", () => {
    const snapshot = snapshotFromProviderAutomationCatalogPreview(
      {
        source: "provider-preview",
        entries: [
          {
            id: "workflow-checks",
            state: "live"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("repairs malformed payload rows and keeps provider-only rows", () => {
    const snapshot = snapshotFromProviderAutomationCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "workflow-checks",
            state: "running",
            trigger: 99,
            lifecycle: "idle",
            approvalPosture: "manual"
          },
          {
            id: "bad id",
            label: "Ignored",
            state: "live"
          },
          {
            id: "provider-only-flow",
            label: "Provider-only",
            state: "preview",
            lifecycle: "retired",
            trigger: "webhook",
            approvalPosture: "manual",
            detail: ""
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.catalog).toEqual([
      {
        id: "workflow-checks",
        label: "Workflow Checks",
        lifecycle: "active",
        trigger: "scheduled",
        approvalPosture: "manual",
        state: "unavailable",
        detail: "Fallback check."
      },
      {
        id: "provider-only-flow",
        label: "Provider-only",
        lifecycle: "retired",
        trigger: "webhook",
        approvalPosture: "manual",
        detail: undefined,
        state: "preview"
      }
    ]);
  });

  it("returns empty-refresh when provider payload contains no rows", async () => {
    const snapshot = await loadProviderAutomationCatalogSnapshot(
      async () => ({
        source: "empty-refresh",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("returns unavailable snapshot when source is unavailable", async () => {
    const snapshot = await loadProviderAutomationCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "workflow-checks")?.state).toBe(
      "unavailable"
    );
    expect(snapshot.catalog.find((entry) => entry.id === "task-handoff")?.state).toBe("preview");
  });

  it("returns unavailable snapshot when desktop payload is malformed", async () => {
    const snapshot = await loadProviderAutomationCatalogSnapshot(
      async () => "not-a-payload",
      fallbackCatalog
    );
    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "workflow-checks")?.state).toBe(
      "unavailable"
    );
  });
});
