import { describe, expect, it } from "vitest";
import {
  parseStoredProjectManagementChat,
  parseStoredProjectManagementTasks
} from "./projectManagementHierarchyStorage";

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
