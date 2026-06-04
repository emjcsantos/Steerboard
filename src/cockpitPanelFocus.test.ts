import { describe, expect, it } from "vitest";
import {
  createCockpitPanelFocusTarget
} from "./cockpitPanelFocus";
import type { SessionSummary } from "./fixtures";
import type { CockpitPanelPriority } from "./cockpitPanelPriority";

function buildSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "panel-0",
    projectId: "project-id",
    title: "Panel identity",
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

function buildPriority(
  panelId: string,
  tone: CockpitPanelPriority["tone"] = "active"
): CockpitPanelPriority {
  return {
    panelId,
    title: "Panel priority",
    role: "implementer",
    state: "implementing",
    priorityLabel: "Panel priority",
    detail: "Panel priority detail.",
    tone,
    score: 1
  };
}

describe("createCockpitPanelFocusTarget", () => {
  it("returns a focus target for visible priority panel", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "panel-1" }),
      buildSession({ id: "panel-2" }),
      buildSession({ id: "panel-3" }),
      buildSession({ id: "panel-4" })
    ];

    const target = createCockpitPanelFocusTarget(sessions, buildPriority("panel-2", "attention"), "panel-1");

    expect(target).toEqual({
      panelId: "panel-2",
      canFocus: true,
      isFocused: false,
      positionLabel: "Panel 2 of 4",
      detail: "Panel is visible and can be focused.",
      tone: "attention"
    });
  });

  it("returns focused tone and disables focus when already focused", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "panel-1" }),
      buildSession({ id: "panel-2" })
    ];

    const target = createCockpitPanelFocusTarget(sessions, buildPriority("panel-2"), "panel-2");

    expect(target).toEqual({
      panelId: "panel-2",
      canFocus: false,
      isFocused: true,
      positionLabel: "Panel 2 of 2",
      detail: "Panel is already focused.",
      tone: "focused"
    });
  });

  it("returns neutral/disabled target when priority has no panel", () => {
    const sessions: SessionSummary[] = [buildSession({ id: "panel-1" })];

    expect(createCockpitPanelFocusTarget(sessions, buildPriority("none"), "panel-1")).toEqual({
      panelId: "none",
      canFocus: false,
      isFocused: false,
      positionLabel: "No visible panel",
      detail: "No visible panel target.",
      tone: "neutral"
    });
  });

  it("returns neutral/disabled target when priority panel is not visible", () => {
    const sessions: SessionSummary[] = [buildSession({ id: "panel-1" })];

    expect(createCockpitPanelFocusTarget(sessions, buildPriority("panel-3"), "panel-1")).toEqual({
      panelId: "none",
      canFocus: false,
      isFocused: false,
      positionLabel: "No visible panel",
      detail: "No visible panel target.",
      tone: "neutral"
    });
  });
});
