import { describe, expect, it } from "vitest";
import {
  buildProjectManagementArenaDispatch,
  collectProjectManagementDescendants,
  createDefaultProjectManagementTasks,
  flattenProjectManagementRows,
  repairProjectManagementTasks,
  toggleProjectManagementTaskCollapsed
} from "./projectManagementHierarchy";

describe("project management hierarchy", () => {
  it("repairs malformed rows and strips private source paths", () => {
    const tasks = repairProjectManagementTasks([
      {
        id: " Epic 1 ",
        type: "epic",
        title: " Launch ",
        description: " C:\\Users\\MJ\\secret brief ",
        status: "unknown",
        completionPercent: 140,
        complexity: "huge",
        sourceDocument: " C:\\Users\\MJ\\Projects\\brief.md ",
        collapsed: true
      },
      {
        id: "child",
        type: "child",
        title: "",
        parentId: "missing"
      }
    ]);

    expect(tasks[0]).toMatchObject({
      id: "epic-1",
      status: "todo",
      completionPercent: 100,
      complexity: "medium",
      collapsed: true
    });
    expect(tasks[0].sourceDocument).not.toContain("Users");
    expect(tasks[1].parentId).toBe("epic-1");
  });

  it("flattens visible rows and hides descendants under collapsed parents", () => {
    const collapsed = toggleProjectManagementTaskCollapsed(createDefaultProjectManagementTasks(), "phase-03-controls-slash");
    const rows = flattenProjectManagementRows(collapsed);
    const childRows = rows.filter((row) => row.task.parentId === "phase-03-parent-proof-clearance");

    expect(rows[0]).toMatchObject({ depth: 0, hasChildren: true, hiddenByAncestor: false });
    expect(childRows.every((row) => row.hiddenByAncestor)).toBe(true);
  });

  it("collects all descendants for epic and parent dispatch", () => {
    const tasks = createDefaultProjectManagementTasks();

    expect(tasks.filter((task) => task.type === "epic")).toHaveLength(12);
    expect(collectProjectManagementDescendants(tasks, "phase-03-controls-slash").map((task) => task.id)).toEqual([
      "phase-03-parent-proof-clearance",
      "phase-03-child-smoke-rows",
      "phase-03-child-exit-gate",
      "phase-03-child-command-plan",
      "phase-03-child-handoff-gate",
      "phase-03-parent-slash-controls",
      "phase-03-child-slash-ready",
      "phase-03-child-control-ready"
    ]);
    expect(collectProjectManagementDescendants(tasks, "phase-03-parent-proof-clearance").map((task) => task.id)).toEqual([
      "phase-03-child-smoke-rows",
      "phase-03-child-exit-gate",
      "phase-03-child-command-plan",
      "phase-03-child-handoff-gate"
    ]);
  });

  it("builds a staged Arena dispatch package with hierarchy context", () => {
    const result = buildProjectManagementArenaDispatch(
      createDefaultProjectManagementTasks(),
      "phase-03-parent-proof-clearance",
      { id: "website-refresh", name: "Website Refresh" },
      "2026-06-06T08:00:00.000Z"
    );

    expect(result?.payload).toMatchObject({
      taskId: "phase-03-parent-proof-clearance",
      taskType: "Parent",
      status: "On-going",
      complexity: "Extra High",
      executionMode: "staged_review"
    });
    expect(result?.payload.children).toHaveLength(4);
    expect(result?.dispatchPackage.status).toBe("staged");
    expect(result?.dispatchPackage.scope.join(" ")).toContain("Runtime execution is locked");
  });
});
