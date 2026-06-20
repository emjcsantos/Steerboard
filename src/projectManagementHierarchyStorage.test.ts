import { describe, expect, it } from "vitest";
import {
  parseStoredProjectManagementChat,
  parseStoredProjectManagementTasks
} from "./projectManagementHierarchyStorage";
import {
  currentProjectManagementPhaseEpicIds,
  currentProjectManagementPhasePlanTaskIds
} from "./projectManagementPhasePlan";

describe("project management hierarchy storage", () => {
  it("falls back to a usable default hierarchy for missing or malformed task state", () => {
    expect(parseStoredProjectManagementTasks(null).some((task) => task.type === "epic")).toBe(true);
    expect(parseStoredProjectManagementTasks("{").some((task) => task.type === "epic")).toBe(true);
    expect(parseStoredProjectManagementTasks("[]").some((task) => task.type === "epic")).toBe(true);
  });

  it("upgrades an older saved PM board to the current phase plan", () => {
    const tasks = parseStoredProjectManagementTasks(JSON.stringify([
      {
        id: "epic-live-arena",
        type: "epic",
        title: "Live Arena Readiness",
        description: "Old seed row",
        status: "ongoing",
        completionPercent: 45,
        complexity: "high",
        sourceDocument: "Old PM seed"
      },
      {
        id: "custom-owner-note",
        type: "epic",
        title: "Owner Note",
        description: "Custom row that should survive the phase-plan upgrade.",
        status: "todo",
        completionPercent: 0,
        complexity: "low",
        sourceDocument: "Local PM board"
      }
    ]));

    expect(tasks.some((task) => task.id === "phase-03-controls-slash")).toBe(true);
    expect(tasks.some((task) => task.id === "phase-11-owner-packaging")).toBe(true);
    expect(tasks.some((task) => task.id === "epic-live-arena")).toBe(false);
    expect(tasks.some((task) => task.id === "custom-owner-note")).toBe(true);

    const taskIds = new Set(tasks.map((task) => task.id));
    const phaseEpicIds = [...currentProjectManagementPhaseEpicIds];

    expect(phaseEpicIds).toEqual([
      "phase-00-baseline",
      "phase-01-live-chat",
      "phase-02-multi-panel",
      "phase-03-controls-slash",
      "phase-04-provider-surfaces",
      "phase-05-migration-center",
      "phase-06-planning-lane",
      "phase-07-dispatch-loop",
      "phase-08-permissions-audit",
      "phase-09-desktop-runner",
      "phase-10-adaptive-arena",
      "phase-11-owner-packaging"
    ]);
    expect([...currentProjectManagementPhasePlanTaskIds].every((taskId) => taskIds.has(taskId))).toBe(
      true
    );
    expect(
      tasks.every((task) => !task.parentId || taskIds.has(task.parentId))
    ).toBe(true);
    expect(tasks.find((task) => task.id === "phase-06-parent-phase-board")).toMatchObject({
      type: "parent",
      parentId: "phase-06-planning-lane"
    });
    expect(tasks.find((task) => task.id === "phase-06-child-saved-state-upgrade")).toMatchObject({
      type: "child",
      parentId: "phase-06-parent-phase-board"
    });
  });

  it("refreshes stale current phase-plan rows while preserving local UI state", () => {
    const tasks = parseStoredProjectManagementTasks(JSON.stringify([
      {
        id: "phase-06-planning-lane",
        type: "epic",
        title: "Old Phase 6",
        description: "Stale Phase 6 row",
        status: "todo",
        completionPercent: 1,
        complexity: "low",
        sourceDocument: "Old saved board",
        collapsed: true,
        runState: "staged"
      },
      {
        id: "phase-06-child-current-phase-map",
        type: "child",
        title: "Old Phase Map",
        description: "Stale saved row",
        status: "todo",
        completionPercent: 1,
        complexity: "low",
        sourceDocument: "Old saved board",
        parentId: "missing-parent",
        runState: "staged"
      },
      {
        id: "phase-06-parent-phase-board",
        type: "parent",
        title: "Old Parent",
        description: "Stale parent row",
        status: "todo",
        completionPercent: 1,
        complexity: "low",
        sourceDocument: "Old saved board",
        parentId: "phase-06-planning-lane",
        collapsed: true,
        runState: "staged"
      }
    ]));

    expect(tasks.find((task) => task.id === "phase-06-child-current-phase-map")).toMatchObject({
      title: "Load Current Phase Map",
      description: expect.stringContaining("compact phase-map proof"),
      status: "ongoing",
      completionPercent: 72,
      complexity: "medium",
      sourceDocument: "Phase completion map",
      parentId: "phase-06-parent-phase-board",
      runState: "staged"
    });
    expect(tasks.find((task) => task.id === "phase-06-parent-phase-board")).toMatchObject({
      title: "Phase Board Hierarchy",
      collapsed: true,
      runState: "staged"
    });
    expect(tasks.find((task) => task.id === "phase-06-planning-lane")).toMatchObject({
      title: "Phase 6: Project and Program Planning Lane",
      collapsed: true,
      runState: "staged"
    });
  });

  it("repairs saved chat messages and excludes invalid entries", () => {
    const messages = parseStoredProjectManagementChat(
      JSON.stringify([
        { id: " one ", role: "user", text: " Move task ", createdAt: " now " },
        { id: "bad", role: "system", text: "ignore" },
        { id: " two ", role: "assistant", text: " C:\\Users\\MJ\\secret ", createdAt: "" }
      ])
    );

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ id: "one", role: "user", text: "Move task" });
    expect(messages[1].text).not.toContain("Users");
  });
});
