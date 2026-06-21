import { describe, expect, it } from "vitest";
import type { SessionSummary } from "./fixtures";
import {
  buildPhase10FlexLayoutDockingModel,
  phase10FlexLayoutPackageName,
  phase10FlexLayoutRepositoryName,
  summarizePhase10FlexLayoutDockingModel
} from "./phase10FlexLayoutDockingModel";

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
  it("creates dockable tabsets for visible Arena sessions", () => {
    const model = buildPhase10FlexLayoutDockingModel([
      session("panel-1", "Planner"),
      session("panel-2", "Worker"),
      session("panel-3", "Validator")
    ]);

    expect(model.layout.type).toBe("row");
    expect(model.layout.children).toHaveLength(3);
    expect(model.global?.tabEnableDrag).toBe(true);
    expect(model.global?.tabSetEnableDrop).toBe(true);
    expect(model.global?.tabSetMinWidth).toBeGreaterThanOrEqual(260);
    expect(model.layout.children?.[0]).toMatchObject({
      type: "tabset",
      children: [
        {
          type: "tab",
          component: "arena-session",
          config: {
            sessionId: "panel-1"
          }
        }
      ]
    });
  });

  it("keeps a custom adaptive-grid fallback proof in the summary", () => {
    const model = buildPhase10FlexLayoutDockingModel([session("panel-1")]);
    const summary = summarizePhase10FlexLayoutDockingModel(model);

    expect(summary).toContain(`package=${phase10FlexLayoutPackageName}`);
    expect(summary).toContain(`repository=${phase10FlexLayoutRepositoryName}`);
    expect(summary).toContain("license=MIT");
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
});
