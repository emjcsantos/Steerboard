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
