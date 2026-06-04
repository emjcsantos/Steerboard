import { describe, expect, it } from "vitest";
import { createCockpitPanelOverflow } from "./cockpitPanelOverflow";
import type { SessionSummary } from "./fixtures";

function buildSession(overrides: Partial<SessionSummary>): SessionSummary {
  return {
    id: "session-id",
    projectId: "project-id",
    title: "Cockpit panel",
    role: "implementer",
    state: "implementing",
    branch: "feature/cockpit",
    runtime: "Mock runtime",
    attempt: 1,
    validation: "Pending validation",
    files: ["src/cockpit.ts"],
    transcript: ["Session started."],
    tools: ["Edit"],
    ...overrides
  };
}

describe("createCockpitPanelOverflow", () => {
  it("returns clear signal when there are no hidden panels", () => {
    const sessions = [
      buildSession({ id: "session-1" }),
      buildSession({ id: "session-2" })
    ];

    expect(createCockpitPanelOverflow(sessions, 2, 0)).toEqual({
      label: "All panels visible",
      detail: "No cockpit panels are outside the current grid.",
      tone: "clear",
      hiddenLabel: "0 hidden",
      nextLabel: "None",
      reviewLabel: "0 need review"
    });
  });

  it("returns queued signal for hidden panels", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible panel" }),
      buildSession({ id: "session-2", title: "Queued next" }),
      buildSession({ id: "session-3", title: "Later panel" })
    ];

    expect(createCockpitPanelOverflow(sessions, 1, 0)).toEqual({
      label: "Hidden panels queued",
      detail: "Additional cockpit panels are outside the current grid.",
      tone: "queued",
      hiddenLabel: "2 hidden",
      nextLabel: "Queued next",
      reviewLabel: "0 need review"
    });
  });

  it("prioritizes blocked review when any hidden panel is blocked or failed", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible panel" }),
      buildSession({ id: "session-2", title: "Blocked panel", state: "blocked" }),
      buildSession({ id: "session-3", title: "Failed hidden", state: "failed" })
    ];

    expect(createCockpitPanelOverflow(sessions, 1, 0)).toEqual({
      label: "Hidden panel needs review",
      detail: "A hidden panel is blocked or failed.",
      tone: "blocked",
      hiddenLabel: "2 hidden",
      nextLabel: "Blocked panel",
      reviewLabel: "2 need review"
    });
  });

  it("respects maxVisible clamp for overflow window", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible one" }),
      buildSession({ id: "session-2", title: "Hidden first" }),
      buildSession({ id: "session-3", title: "Hidden second" }),
      buildSession({ id: "session-4", title: "Hidden third" })
    ];

    expect(createCockpitPanelOverflow(sessions, 3, 2)).toEqual({
      label: "Hidden panels queued",
      detail: "Additional cockpit panels are outside the current grid.",
      tone: "queued",
      hiddenLabel: "2 hidden",
      nextLabel: "Hidden second",
      reviewLabel: "0 need review"
    });
  });

  it("treats maxVisible=0 as unlimited when clamping visible count", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible one" }),
      buildSession({ id: "session-2", title: "First hidden" }),
      buildSession({ id: "session-3", title: "Second hidden" })
    ];

    expect(createCockpitPanelOverflow(sessions, 2, 0)).toEqual({
      label: "Hidden panels queued",
      detail: "Additional cockpit panels are outside the current grid.",
      tone: "queued",
      hiddenLabel: "1 hidden",
      nextLabel: "Second hidden",
      reviewLabel: "0 need review"
    });
  });

  it("sanitizes negative and decimal visible/max values", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Blocked hidden", state: "blocked" }),
      buildSession({ id: "session-2", title: "Visible panel" }),
      buildSession({ id: "session-3", title: "Later panel" })
    ];

    expect(createCockpitPanelOverflow(sessions, -2.2, 1.9)).toEqual({
      label: "Hidden panel needs review",
      detail: "A hidden panel is blocked or failed.",
      tone: "blocked",
      hiddenLabel: "3 hidden",
      nextLabel: "Blocked hidden",
      reviewLabel: "1 need review"
    });
  });

  it("sanitizes and truncates hidden panel titles", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible panel" }),
      buildSession({ id: "session-2", title: "  A path/with\\\\nested\\\\slashes and   spacing that should stay tight  " }),
      buildSession({
        id: "session-3",
        title: "Very long fallback title that exceeds the forty-eight character limit for display text."
      })
    ];

    expect(createCockpitPanelOverflow(sessions, 1, 0)).toEqual({
      label: "Hidden panels queued",
      detail: "Additional cockpit panels are outside the current grid.",
      tone: "queued",
      hiddenLabel: "2 hidden",
      nextLabel: "A path with nested slashes and spacing that shou",
      reviewLabel: "0 need review"
    });
  });

  it("falls back to Untitled panel for empty hidden titles", () => {
    const sessions = [
      buildSession({ id: "session-1", title: "Visible panel" }),
      buildSession({ id: "session-2", title: "" }),
      buildSession({ id: "session-3", title: "   \t " })
    ];

    expect(createCockpitPanelOverflow(sessions, 1, 0)).toEqual({
      label: "Hidden panels queued",
      detail: "Additional cockpit panels are outside the current grid.",
      tone: "queued",
      hiddenLabel: "2 hidden",
      nextLabel: "Untitled panel",
      reviewLabel: "0 need review"
    });
  });
});
