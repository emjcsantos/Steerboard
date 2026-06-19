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
      "phase-03-child-blocker-priority",
      "phase-03-child-traceability",
      "phase-03-child-handoff-gate",
      "phase-03-parent-slash-controls",
      "phase-03-child-slash-ready",
      "phase-03-child-control-ready"
    ]);
    expect(collectProjectManagementDescendants(tasks, "phase-03-parent-proof-clearance").map((task) => task.id)).toEqual([
      "phase-03-child-smoke-rows",
      "phase-03-child-exit-gate",
      "phase-03-child-command-plan",
      "phase-03-child-blocker-priority",
      "phase-03-child-traceability",
      "phase-03-child-handoff-gate"
    ]);
  });

  it("keeps current Phase 3 and Phase 11 PM descriptions aligned to clearance snapshot and proof depth gates", () => {
    const tasks = createDefaultProjectManagementTasks();
    const byId = new Map(tasks.map((task) => [task.id, task]));

    expect(byId.get("phase-03-controls-slash")?.description).toContain("storage-attested current-panel desktop proof freshness");
    expect(byId.get("phase-03-controls-slash")?.description).toContain("visible handoff record-gate reason");
    expect(byId.get("phase-03-parent-proof-clearance")?.description).toContain("PM-link and evidence-key counted exit visibility");
    expect(byId.get("phase-03-parent-proof-clearance")?.description).toContain("visible handoff record-gate reason");
    expect(byId.get("phase-03-child-smoke-rows")?.description).toContain("storage-attested proof");
    expect(byId.get("phase-03-child-smoke-rows")?.description).toContain("current-panel storage provenance");
    expect(byId.get("phase-03-child-exit-gate")?.description).toContain("PM link count");
    expect(byId.get("phase-03-child-exit-gate")?.description).toContain("evidence key count");
    expect(byId.get("phase-03-child-handoff-gate")?.description).toContain("clearance snapshot");
    expect(byId.get("phase-03-child-handoff-gate")?.description).toContain("visible handoff record-gate reason");
    expect(byId.get("phase-03-child-command-plan")?.description).toContain("visible CLI validation record actions and provenance");
    expect(byId.get("phase-03-child-blocker-priority")?.description).toContain("visible row-specific detail plus exit action");
    expect(byId.get("phase-03-child-traceability")?.description).toContain("handoff-review details");
    expect(byId.get("phase-03-child-slash-ready")?.description).toContain("current-panel storage provenance");
    expect(byId.get("phase-03-child-control-ready")?.description).toContain("honestly unsupported");
    expect(byId.get("phase-11-parent-owner-testing")?.description).toContain("proof freshness depth");
    expect(byId.get("phase-11-parent-release-packaging")?.description).toContain("current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence");
    expect(byId.get("phase-11-parent-release-packaging")?.description).toContain("visible Security 100% final closure guidance");
    expect(byId.get("phase-11-parent-release-packaging")?.description).toContain("release-decision top-prerequisite detail");
    expect(byId.get("phase-11-child-proof-freshness-depth")?.description).toContain("proof-export");
    expect(byId.get("phase-11-child-package-validation")?.description).toContain("current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence");
    expect(byId.get("phase-11-child-package-validation")?.description).toContain("visible Security 100% final closure guidance");
    expect(byId.get("phase-11-child-traceability")?.description).toContain("proof freshness depth");
    expect(byId.get("phase-11-child-traceability")?.description).toContain("current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence");
    expect(byId.get("phase-11-child-blocker-priority")?.description).toContain("fresh-checkout release readiness");
    expect(byId.get("phase-11-child-blocker-priority")?.description).toContain("visible Security 100% final closure guidance");
  });

  it("keeps Phase 1/2/6 PM rows locally ongoing while surfacing the owner publish hold", () => {
    const tasks = createDefaultProjectManagementTasks();
    const byId = new Map(tasks.map((task) => [task.id, task]));

    for (const phaseId of [
      "phase-01-live-chat",
      "phase-02-multi-panel",
      "phase-06-planning-lane"
    ]) {
      const task = byId.get(phaseId);
      expect(task?.status).toBe("ongoing");
      expect(task?.description).toContain("local");
      expect(task?.description).toContain("owner-held");
      expect(task?.description).toContain("Phase 1/2/6 publish blocker");
    }

    expect(byId.get("phase-06-child-publish-hold-traceability")?.description).toContain(
      "owner-held publish blocker"
    );
    expect(byId.get("phase-06-child-publish-hold-blocker-priority")?.description).toContain(
      "owner/remote publish hold"
    );
    expect(collectProjectManagementDescendants(tasks, "phase-06-planning-lane").map((task) => task.id)).toEqual([
      "phase-06-parent-phase-board",
      "phase-06-child-current-phase-map",
      "phase-06-child-saved-state-upgrade",
      "phase-06-parent-arena-staging",
      "phase-06-child-run-context",
      "phase-06-child-publish-hold-traceability",
      "phase-06-child-publish-hold-blocker-priority"
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
    expect(result?.payload.children).toHaveLength(6);
    expect(result?.dispatchPackage.status).toBe("staged");
    expect(result?.dispatchPackage.scope.join(" ")).toContain("Runtime execution is locked");

    const childResult = buildProjectManagementArenaDispatch(
      createDefaultProjectManagementTasks(),
      "phase-06-child-run-context",
      { id: "website-refresh", name: "Website Refresh" },
      "2026-06-06T08:05:00.000Z"
    );

    expect(childResult?.payload).toMatchObject({
      taskId: "phase-06-child-run-context",
      taskType: "Child",
      completion: 60,
      sourceDocument: "Arena dispatch package",
      relationshipContext: {
        epic: { id: "phase-06-planning-lane", title: "Phase 6: Project and Program Planning Lane" },
        parent: { id: "phase-06-parent-arena-staging", title: "Arena Staging from PM Rows" }
      },
      children: []
    });
    expect(childResult?.dispatchPackage.risk).toBe("medium");
    expect(childResult?.dispatchPackage.scope.join(" ")).toContain("Completion: 60%");
    expect(childResult?.dispatchPackage.scope.join(" ")).toContain("Source: Arena dispatch package");

    const epicResult = buildProjectManagementArenaDispatch(
      createDefaultProjectManagementTasks(),
      "phase-06-planning-lane",
      { id: "website-refresh", name: "Website Refresh" },
      "2026-06-06T08:10:00.000Z"
    );

    expect(epicResult?.payload).toMatchObject({
      taskId: "phase-06-planning-lane",
      taskType: "Epic",
      completion: 55,
      sourceDocument: "Phase completion map",
      relationshipContext: {
        epic: { id: "phase-06-planning-lane", title: "Phase 6: Project and Program Planning Lane" }
      }
    });
    expect(epicResult?.payload.children.map((child) => child.id)).toEqual([
      "phase-06-parent-phase-board",
      "phase-06-child-current-phase-map",
      "phase-06-child-saved-state-upgrade",
      "phase-06-parent-arena-staging",
      "phase-06-child-run-context",
      "phase-06-child-publish-hold-traceability",
      "phase-06-child-publish-hold-blocker-priority"
    ]);
    expect(epicResult?.dispatchPackage.risk).toBe("high");
    expect(epicResult?.dispatchPackage.scope.join(" ")).toContain("Descendant Parent: Phase Board Hierarchy");
    expect(epicResult?.dispatchPackage.scope.join(" ")).toContain("Descendant Child: Publish Hold Blocker Priority");
  });
});
