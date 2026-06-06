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
    const collapsed = toggleProjectManagementTaskCollapsed(createDefaultProjectManagementTasks(), "epic-live-arena");
    const rows = flattenProjectManagementRows(collapsed);
    const childRows = rows.filter((row) => row.task.parentId === "parent-phase3-proof");

    expect(rows[0]).toMatchObject({ depth: 0, hasChildren: true, hiddenByAncestor: false });
    expect(childRows.every((row) => row.hiddenByAncestor)).toBe(true);
  });

  it("collects all descendants for epic and parent dispatch", () => {
    const tasks = createDefaultProjectManagementTasks();

    expect(collectProjectManagementDescendants(tasks, "epic-live-arena").map((task) => task.id)).toEqual([
      "parent-phase3-proof",
      "child-smoke-rows",
      "child-session-controls",
      "parent-catalog-safety",
      "child-catalog-refresh"
    ]);
    expect(collectProjectManagementDescendants(tasks, "parent-phase3-proof").map((task) => task.id)).toEqual([
      "child-smoke-rows",
      "child-session-controls"
    ]);
  });

  it("builds a staged Arena dispatch package with hierarchy context", () => {
    const result = buildProjectManagementArenaDispatch(
      createDefaultProjectManagementTasks(),
      "parent-phase3-proof",
      { id: "website-refresh", name: "Website Refresh" },
      "2026-06-06T08:00:00.000Z"
    );

    expect(result?.payload).toMatchObject({
      taskId: "parent-phase3-proof",
      taskType: "Parent",
      status: "On-going",
      complexity: "High",
      executionMode: "staged_review"
    });
    expect(result?.payload.children).toHaveLength(2);
    expect(result?.dispatchPackage.status).toBe("staged");
    expect(result?.dispatchPackage.scope.join(" ")).toContain("Runtime execution is locked");
  });
});
