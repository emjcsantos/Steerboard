import { describe, expect, it } from "vitest";
import {
  fallbackPreferences,
  normalizePreferences,
  parseStoredPreferences,
  type WorkspacePreferences
} from "./preferences";

const validProjects = ["website-refresh", "billing-workflow"];

describe("workspace preferences", () => {
  it("loads valid persisted preferences", () => {
    const stored: WorkspacePreferences = {
      selectedProjectId: "billing-workflow",
      mode: "monitor",
      layoutId: "3x2",
      view: "planning"
    };

    expect(normalizePreferences(stored, validProjects)).toEqual(stored);
  });

  it("falls back when stored values are malformed", () => {
    expect(parseStoredPreferences("{", validProjects)).toEqual(fallbackPreferences);
    expect(normalizePreferences(null, validProjects)).toEqual(fallbackPreferences);
  });

  it("repairs unsupported project, mode, layout, and view values", () => {
    const repaired = normalizePreferences(
      {
        selectedProjectId: "private-project",
        mode: "unknown",
        layoutId: "9x9",
        view: "settings"
      },
      validProjects
    );

    expect(repaired).toEqual(fallbackPreferences);
  });

  it("uses the selected mode default when a saved layout is invalid", () => {
    const repaired = normalizePreferences(
      {
        selectedProjectId: "website-refresh",
        mode: "focus",
        layoutId: "4x4",
        view: "cockpit"
      },
      validProjects
    );

    expect(repaired.layoutId).toBe("2x1");
  });
});
