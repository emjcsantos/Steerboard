import { afterEach, describe, expect, it, vi } from "vitest";
import type { IJsonModel } from "flexlayout-react";
import type { SessionSummary } from "./fixtures";
import {
  buildPhase10FlexLayoutDockingModel,
  extractPhase10FlexLayoutSessionIds,
  phase10FlexLayoutExpectedLicense,
  phase10FlexLayoutPackageName,
  phase10FlexLayoutRepositoryName,
  repairPhase10FlexLayoutDockingModel,
  summarizePhase10FlexLayoutDockingModel
} from "./phase10FlexLayoutDockingModel";
import {
  loadPhase10FlexLayoutDockingModel,
  parseStoredPhase10FlexLayoutDockingModel,
  savePhase10FlexLayoutDockingModel
} from "./phase10FlexLayoutDockingStorage";

function session(id: string, title = id): SessionSummary {
  return {
    id,
    projectId: "website-refresh",
    title,
    role: "implementer",
    state: "implementing",
    branch: "codex/phase10-arena-flexlayout",
    runtime: "local",
    attempt: 1,
    validation: "pending",
    files: ["src/App.tsx"],
    transcript: [],
    tools: []
  };
}

describe("phase 10 FlexLayout docking model", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates dockable tabsets for visible Arena sessions", () => {
    const model = buildPhase10FlexLayoutDockingModel([
      session("panel-1", "Planner"),
      session("panel-2", "Worker"),
      session("panel-3", "Validator")
    ]);

    expect(model.layout.type).toBe("row");
    expect(model.layout.children).toHaveLength(3);
    expect(model.global?.tabEnableClose).toBe(true);
    expect(model.global?.tabEnableDrag).toBe(true);
    expect(model.global?.tabSetEnableDrop).toBe(true);
    expect(model.global?.tabSetEnableDeleteWhenEmpty).toBe(true);
    expect(model.global?.tabSetMinWidth).toBeGreaterThanOrEqual(260);
    expect(model.layout.children?.[0]).toMatchObject({
      type: "tabset",
      children: [
        {
          type: "tab",
          component: "arena-session",
          enableClose: true,
          config: {
            sessionId: "panel-1"
          }
        }
      ]
    });
  });

  it("keeps saved-layout and fallback proof in the summary with the package license", () => {
    const model = buildPhase10FlexLayoutDockingModel([session("panel-1")]);
    const summary = summarizePhase10FlexLayoutDockingModel(model, "saved");

    expect(phase10FlexLayoutExpectedLicense).toBe("ISC");
    expect(summary).toContain(`package=${phase10FlexLayoutPackageName}`);
    expect(summary).toContain(`repository=${phase10FlexLayoutRepositoryName}`);
    expect(summary).toContain("license=ISC");
    expect(summary).toContain("savedLayoutJson=yes");
    expect(summary).toContain("persistence=saved");
    expect(summary).toContain("fallback=custom-adaptive-grid-preserved");
  });

  it("caps initial docked tabsets so narrow Arena panes remain readable", () => {
    const model = buildPhase10FlexLayoutDockingModel([
      session("panel-1"),
      session("panel-2"),
      session("panel-3"),
      session("panel-4"),
      session("panel-5")
    ]);

    expect(model.layout.children).toHaveLength(4);
  });

  it("restores valid saved JSON without regenerating the layout", () => {
    const savedModel = buildPhase10FlexLayoutDockingModel([
      session("panel-1", "Planner"),
      session("panel-2", "Worker")
    ]);
    const result = repairPhase10FlexLayoutDockingModel(savedModel, [
      session("panel-1", "Planner"),
      session("panel-2", "Worker")
    ]);

    expect(result.state).toBe("restored");
    expect(result.repaired).toBe(false);
    expect(result.visibleSessionIds).toEqual(["panel-1", "panel-2"]);
    expect(result.model.layout.children).toHaveLength(2);
  });

  it("prunes stale sessions and duplicate tabs from saved JSON", () => {
    const savedModel: IJsonModel = {
      ...buildPhase10FlexLayoutDockingModel([session("panel-1"), session("panel-2")]),
      layout: {
        id: "phase10-flexlayout-arena-root",
        type: "row",
        children: [
          {
            id: "custom-tabset",
            type: "tabset",
            children: [
              {
                id: "phase10-dock-tab-panel-1",
                type: "tab",
                component: "arena-session",
                config: { sessionId: "panel-1" }
              },
              {
                id: "duplicate-panel-1",
                type: "tab",
                component: "arena-session",
                config: { sessionId: "panel-1" }
              },
              {
                id: "stale-panel",
                type: "tab",
                component: "arena-session",
                config: { sessionId: "stale-panel" }
              }
            ]
          }
        ]
      }
    };

    const result = repairPhase10FlexLayoutDockingModel(savedModel, [
      session("panel-1"),
      session("panel-2")
    ]);

    expect(result.state).toBe("repaired");
    expect(extractPhase10FlexLayoutSessionIds(result.model)).toEqual(["panel-1", "panel-2"]);
    expect(result.model.layout.children).toHaveLength(2);
  });

  it("does not append missing sessions when syncing a user close action", () => {
    const savedModel = buildPhase10FlexLayoutDockingModel([
      session("panel-1"),
      session("panel-2")
    ]);
    const closedModel: IJsonModel = {
      ...savedModel,
      layout: {
        ...savedModel.layout,
        children: savedModel.layout.children?.slice(0, 1)
      }
    };

    const result = repairPhase10FlexLayoutDockingModel(
      closedModel,
      [session("panel-1"), session("panel-2")],
      { appendMissingSessions: false, fallbackState: "saved" }
    );

    expect(result.state).toBe("saved");
    expect(result.visibleSessionIds).toEqual(["panel-1"]);
  });

  it("recovers malformed or empty saved JSON to a safe current-session model", () => {
    const malformed = parseStoredPhase10FlexLayoutDockingModel("{", [session("panel-1")]);
    const empty = repairPhase10FlexLayoutDockingModel(
      { layout: { id: "root", type: "row", children: [] } },
      [session("panel-1")]
    );

    expect(malformed.visibleSessionIds).toEqual(["panel-1"]);
    expect(malformed.state).toBe("generated");
    expect(empty.visibleSessionIds).toEqual(["panel-1"]);
    expect(empty.state).toBe("repaired");
  });

  it("persists a user dock arrangement and reloads it before revealed panels are appended", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        }
      }
    });

    const savedModel = buildPhase10FlexLayoutDockingModel([
      session("panel-1"),
      session("panel-2"),
      session("panel-3")
    ]);
    const dockedAfterCloseAndReorder: IJsonModel = {
      ...savedModel,
      layout: {
        ...savedModel.layout,
        children: savedModel.layout.children?.slice(0, 2).reverse()
      }
    };

    savePhase10FlexLayoutDockingModel(dockedAfterCloseAndReorder);

    const restored = loadPhase10FlexLayoutDockingModel([
      session("panel-2"),
      session("panel-1")
    ]);
    expect(restored.state).toBe("restored");
    expect(restored.visibleSessionIds).toEqual(["panel-2", "panel-1"]);

    const afterReveal = repairPhase10FlexLayoutDockingModel(restored.model, [
      session("panel-2"),
      session("panel-1"),
      session("panel-3")
    ]);
    expect(afterReveal.state).toBe("repaired");
    expect(afterReveal.visibleSessionIds).toEqual(["panel-2", "panel-1", "panel-3"]);
  });
});
