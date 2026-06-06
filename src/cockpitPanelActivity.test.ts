import { describe, expect, it } from "vitest";
import type { CockpitPanelActivityInput } from "./cockpitPanelActivity";
import { createCockpitPanelActivity } from "./cockpitPanelActivity";

function buildInput(overrides: Partial<CockpitPanelActivityInput> = {}): CockpitPanelActivityInput {
  return {
    transcript: ["Starter transcript line"],
    ...overrides
  };
}

describe("createCockpitPanelActivity", () => {
  it("falls back to empty state for non-array or empty transcript", () => {
    expect(createCockpitPanelActivity({
      transcript: "not-an-array",
      state: "active"
    })).toEqual({
      label: "No activity",
      detail: "No panel activity has been recorded.",
      tone: "empty",
      countLabel: "0 notes"
    });

    expect(createCockpitPanelActivity({ transcript: [] })).toEqual({
      label: "No activity",
      detail: "No panel activity has been recorded.",
      tone: "empty",
      countLabel: "0 notes"
    });
  });

  it("trims, filters transcript lines, and computes pluralized count labels", () => {
    const activity = createCockpitPanelActivity({
      transcript: ["  ", "first note", 42, "", "second note  ", null, "  third note  "]
    });

    expect(activity.label).toBe("Active");
    expect(activity.tone).toBe("active");
    expect(activity.countLabel).toBe("3 notes");
    expect(activity.detail).toBe("Latest: third note");
  });

  it("uses singular note count for single usable transcript entry", () => {
    const activity = createCockpitPanelActivity({
      transcript: ["  single valid note  ", "   "]
    });

    expect(activity.countLabel).toBe("1 note");
    expect(activity.detail).toBe("Latest: single valid note");
  });

  it("maps completed states/validation to complete label and tone", () => {
    const fromState = createCockpitPanelActivity(buildInput({ state: "complete" }));
    const fromValidation = createCockpitPanelActivity({
      ...buildInput(),
      validation: "All checks passed"
    });

    expect(fromState.label).toBe("Complete");
    expect(fromState.tone).toBe("complete");
    expect(fromValidation.label).toBe("Complete");
    expect(fromValidation.tone).toBe("complete");
  });

  it("maps blocked/failed states and review text to review label and tone", () => {
    const blockedState = createCockpitPanelActivity(buildInput({ state: "blocked" }));
    const failedLatest = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["still waiting", "This step failed hard"]
    });

    expect(blockedState.label).toBe("Review");
    expect(blockedState.tone).toBe("review");
    expect(failedLatest.tone).toBe("review");
  });

  it("maps waiting states and waiting/pending/queued text to waiting label and tone", () => {
    const fromState = createCockpitPanelActivity(buildInput({ state: "planning" }));
    const fromLine = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["No action yet", "Queued for handoff"]
    });

    expect(fromState.label).toBe("Waiting");
    expect(fromState.tone).toBe("waiting");
    expect(fromLine.label).toBe("Waiting");
    expect(fromLine.tone).toBe("waiting");
  });

  it("creates active label and tone when no higher-priority signals are present", () => {
    const activity = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["Working on the next step", "Still running task"],
      state: "implementing",
      validation: "in progress"
    });

    expect(activity.label).toBe("Active");
    expect(activity.tone).toBe("active");
    expect(activity.detail).toBe("Latest: Still running task");
  });

  it("truncates the latest detail to compact length", () => {
    const longLine =
      "This is a very long transcript line that should be compacted because Arena panel cards need a small preview area and " +
      "the line is intentionally verbose well beyond what should be rendered.";
    const activity = createCockpitPanelActivity({ transcript: [longLine] });

    expect(activity.detail.length).toBe(120);
    expect(activity.detail.endsWith("...")).toBe(true);
    expect(activity.detail.startsWith("Latest: This is")).toBe(true);
  });

  it("sanitizes Windows, UNC, and Unix absolute paths in detail", () => {
    const windows = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["Reading C:\\Users\\MJ\\Projects\\Atlas\\notes\\status.txt for review"]
    });
    const unix = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["Loaded /tmp/logs/engine.log and continuing"]
    });
    const unc = createCockpitPanelActivity({
      ...buildInput(),
      transcript: ["\\server\\share\\incoming\\payload.json"]
    });

    expect(windows.detail).toBe("Latest: Reading status.txt for review");
    expect(unix.detail).toBe("Latest: Loaded engine.log and continuing");
    expect(unc.detail).toBe("Latest: payload.json");
    expect(windows.detail).not.toContain("\\");
    expect(unix.detail).not.toContain("/");
    expect(unc.detail).not.toContain("\\");
  });
});
