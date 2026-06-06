import { describe, expect, it } from "vitest";
import {
  createCockpitPanelPriority
} from "./cockpitPanelPriority";
import type { SessionSummary } from "./fixtures";

function buildSession(
  overrides: Partial<SessionSummary> = {}
): SessionSummary {
  return {
    id: "panel-id",
    projectId: "project-id",
    title: "Panel title",
    role: "implementer",
    state: "implementing",
    branch: "feature/placeholder",
    runtime: "Local runtime",
    attempt: 1,
    validation: "Pending",
    files: [],
    transcript: [],
    tools: ["Edit"],
    ...overrides
  };
}

describe("createCockpitPanelPriority", () => {
  it("returns an idle result for empty input", () => {
    expect(createCockpitPanelPriority([])).toEqual({
      panelId: "none",
      title: "No visible panel",
      role: "integration",
      state: "idle",
      priorityLabel: "Idle arena",
      detail: "No visible Arena panels are currently requiring attention.",
      tone: "idle",
      score: 0
    });
  });

  it("prioritizes blocked before failed before validating", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "planning", state: "planning", role: "validator", attempt: 9 }),
      buildSession({ id: "blocked", state: "blocked", role: "implementer", attempt: 1 }),
      buildSession({ id: "failed", state: "failed", role: "integration", attempt: 2 }),
      buildSession({ id: "validating", state: "validating", role: "validator", attempt: 8 })
    ];

    expect(createCockpitPanelPriority(sessions)).toEqual({
      panelId: "blocked",
      title: "Panel title",
      role: "implementer",
      state: "blocked",
      priorityLabel: "Blocked panel",
      detail: "implementer panel is blocked.",
      tone: "critical",
      score: 12009
    });
  });

  it("uses attempt as a deterministic tie-break within the same state", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "late", state: "implementing", attempt: 1 }),
      buildSession({ id: "first", state: "implementing", attempt: 3 }),
      buildSession({ id: "middle", state: "implementing", attempt: 3, title: "Another panel" })
    ];

    expect(createCockpitPanelPriority(sessions)).toMatchObject({
      panelId: "first",
      role: "implementer",
      state: "implementing",
      score: 7029
    });
  });

  it("uses original order when state and attempt are tied", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "first", state: "planning", attempt: 1, title: "Panel one" }),
      buildSession({ id: "second", state: "planning", attempt: 1, title: "Panel two" })
    ];

    expect(createCockpitPanelPriority(sessions)).toEqual({
      panelId: "first",
      title: "Panel one",
      role: "implementer",
      state: "planning",
      priorityLabel: "Planning panel",
      detail: "implementer panel is planning.",
      tone: "active",
      score: 4510
    });
  });

  it("sanitizes and truncates long titles and details", () => {
    const sessions: SessionSummary[] = [
      buildSession({
        id: "long",
        title: "A  very / long\\ path\\\\with\\\\slashes   and spacing that will force clipping for Arena rendering.",
        state: "validating",
        attempt: 2
      })
    ];

    const priority = createCockpitPanelPriority(sessions);

    expect(priority.title).toBe("A very long path with slashes and spacing that wi...");
    expect(priority.detail).toBe("implementer panel is validating.");
    expect(priority.score).toBe(9020);
  });

  it("keeps invalid attempt values safe and deterministic", () => {
    const sessions: SessionSummary[] = [
      buildSession({ id: "invalid", state: "failed", attempt: -3.8 }),
      buildSession({ id: "valid", state: "failed", attempt: 1 })
    ];

    expect(createCockpitPanelPriority(sessions)).toEqual({
      panelId: "valid",
      title: "Panel title",
      role: "implementer",
      state: "failed",
      priorityLabel: "Failed panel",
      detail: "implementer panel is failed.",
      tone: "critical",
      score: 11509
    });
  });
});
