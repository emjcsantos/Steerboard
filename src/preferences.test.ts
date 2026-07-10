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
      view: "planning",
      adaptiveProjectTemplateId: "project-monitor",
      orchestratorPresentationMode: "professional"
    };

    expect(normalizePreferences(stored, validProjects)).toEqual(stored);
  });

  it("preserves the adaptive layout from saved preferences", () => {
    const stored: WorkspacePreferences = {
      selectedProjectId: "website-refresh",
      mode: "orchestrator",
      layoutId: "adaptive",
      view: "cockpit",
      adaptiveProjectTemplateId: "project-orchestrator",
      orchestratorPresentationMode: "professional"
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
        view: "settings",
        adaptiveProjectTemplateId: "bad-template"
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
        view: "cockpit",
        adaptiveProjectTemplateId: "project-focus"
      },
      validProjects
    );

    expect(repaired.layoutId).toBe("2x1");
    expect(repaired.adaptiveProjectTemplateId).toBe("project-focus");
  });

  it("repairs missing adaptive project template to fallback", () => {
    const repaired = normalizePreferences(
      {
        selectedProjectId: "website-refresh",
        mode: "orchestrator",
        layoutId: "adaptive",
        view: "cockpit"
      },
      validProjects
    );

    expect(repaired.adaptiveProjectTemplateId).toBe("auto-stack");
  });

  it("loads classroom presentation when the feature is enabled", () => {
    const repaired = parseStoredPreferences(
      JSON.stringify({
        ...fallbackPreferences,
        orchestratorPresentationMode: "classroom"
      }),
      validProjects,
      fallbackPreferences,
      true
    );

    expect(repaired.orchestratorPresentationMode).toBe("classroom");
  });

  it("repairs classroom presentation when the feature is disabled", () => {
    const repaired = normalizePreferences(
      {
        ...fallbackPreferences,
        orchestratorPresentationMode: "classroom"
      },
      validProjects
    );

    expect(repaired.orchestratorPresentationMode).toBe("professional");
  });

  it("repairs missing and malformed presentation modes to professional", () => {
    const missing = { ...fallbackPreferences } as Record<string, unknown>;
    delete missing.orchestratorPresentationMode;

    expect(normalizePreferences(missing, validProjects, fallbackPreferences, true).orchestratorPresentationMode).toBe(
      "professional"
    );
    expect(
      normalizePreferences(
        { ...fallbackPreferences, orchestratorPresentationMode: "school" },
        validProjects,
        fallbackPreferences,
        true
      ).orchestratorPresentationMode
    ).toBe("professional");
  });

  it("repairs malformed serialized preferences to professional", () => {
    expect(parseStoredPreferences("{", validProjects, fallbackPreferences, true).orchestratorPresentationMode).toBe(
      "professional"
    );
  });
});
