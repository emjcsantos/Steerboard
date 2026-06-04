import { describe, expect, it } from "vitest";
import { createCockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
import type { SessionSummary } from "./fixtures";

function buildSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "panel-id",
    projectId: "project-id",
    title: "Panel title",
    role: "implementer",
    state: "implementing",
    branch: "feature/panel",
    runtime: "Local runtime",
    attempt: 1,
    validation: "Pending",
    files: [],
    transcript: [],
    tools: ["Edit"],
    ...overrides
  };
}

describe("createCockpitFocusedPanelStatus", () => {
  it("returns a focused status for the visible focused panel", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "alpha", role: "orchestrator", state: "planning", title: "Orchestrator boot" }),
      buildSession({ id: "beta", role: "implementer", state: "implementing", title: "Landing layout" }),
      buildSession({ id: "gamma", role: "validator", state: "validating", title: "Validation checks" })
    ];

    expect(createCockpitFocusedPanelStatus(sessions, "alpha")).toEqual({
      panelId: "alpha",
      hasFocus: true,
      label: "Focused",
      detail: "Panel 1 of 3 - Orchestrator: Orchestrator boot",
      tone: "active"
    });
  });

  it("maps state tones to the required compact status tones", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "blocked", state: "blocked" }),
      buildSession({ id: "validating", state: "validating" }),
      buildSession({ id: "implementing", state: "implementing" }),
      buildSession({ id: "complete", state: "complete" }),
      buildSession({ id: "idle", state: "idle" })
    ];

    expect(createCockpitFocusedPanelStatus(sessions, "blocked")).toMatchObject({
      panelId: "blocked",
      hasFocus: true,
      tone: "critical"
    });

    expect(createCockpitFocusedPanelStatus(sessions, "validating")).toMatchObject({
      tone: "attention"
    });

    expect(createCockpitFocusedPanelStatus(sessions, "implementing")).toMatchObject({
      tone: "active"
    });

    expect(createCockpitFocusedPanelStatus(sessions, "complete")).toMatchObject({
      tone: "complete"
    });

    expect(createCockpitFocusedPanelStatus(sessions, "idle")).toMatchObject({
      tone: "idle"
    });
  });

  it("returns a neutral status when focus id is absent", () => {
    const sessions: SessionSummary[] = [buildSession({ id: "alpha" })];

    expect(createCockpitFocusedPanelStatus(sessions)).toEqual({
      panelId: "none",
      hasFocus: false,
      label: "No focus",
      detail: "No cockpit panel is focused.",
      tone: "neutral"
    });
  });

  it("returns a neutral status when focused panel is not visible", () => {
    const sessions: SessionSummary[] = [buildSession({ id: "alpha" })];

    expect(createCockpitFocusedPanelStatus(sessions, "gamma")).toEqual({
      panelId: "none",
      hasFocus: false,
      label: "No focus",
      detail: "No cockpit panel is focused.",
      tone: "neutral"
    });
  });

  it("sanitizes path-like titles and compacts status detail", () => {
    const session = buildSession({
      id: "long-title",
      title: "A  very\\long/path\\\\that/contains\\\\many  separators\\and spaces in the panel identity",
      role: "integration",
      state: "complete"
    });

    const status = createCockpitFocusedPanelStatus([session], "long-title");
    expect(status.detail).toContain("Panel 1 of 1 - Integration: A very long path that contains many");
    expect(status.detail.endsWith("...")).toBe(true);
    expect(status.detail).not.toContain("\\");
    expect(status.detail).not.toContain("/");
  });

  it("uses fallback title for blank titles", () => {
    const session = buildSession({ id: "untitled", title: "" });
    const status = createCockpitFocusedPanelStatus([session], "untitled");

    expect(status.detail).toContain("Untitled panel");
    expect(status.label).toBe("Focused");
    expect(status.hasFocus).toBe(true);
  });
});
