import { describe, expect, it } from "vitest";
import { createCockpitPanelBranch } from "./cockpitPanelBranch";

describe("createCockpitPanelBranch", () => {
  it("returns fallback values for blank or non-string branches", () => {
    expect(createCockpitPanelBranch("")).toEqual({
      label: "No branch",
      detail: "Branch information is not available.",
      tone: "neutral"
    });

    expect(createCockpitPanelBranch("   ")).toEqual({
      label: "No branch",
      detail: "Branch information is not available.",
      tone: "neutral"
    });

    expect(createCockpitPanelBranch(null)).toEqual({
      label: "No branch",
      detail: "Branch information is not available.",
      tone: "neutral"
    });
  });

  it("maps protected branch names and release prefixes to protected tone", () => {
    expect(createCockpitPanelBranch("main")).toEqual({
      label: "main",
      detail: "Protected branch: main",
      tone: "protected"
    });
    expect(createCockpitPanelBranch("master")).toEqual({
      label: "master",
      detail: "Protected branch: master",
      tone: "protected"
    });
    expect(createCockpitPanelBranch("prod")).toEqual({
      label: "prod",
      detail: "Protected branch: prod",
      tone: "protected"
    });
    expect(createCockpitPanelBranch("production")).toEqual({
      label: "production",
      detail: "Protected branch: production",
      tone: "protected"
    });
    expect(createCockpitPanelBranch("release/2026.06.05")).toEqual({
      label: "release/2026.06.05",
      detail: "Protected branch: release/2026.06.05",
      tone: "protected"
    });
  });

  it("maps work branch prefixes to work tone", () => {
    expect(createCockpitPanelBranch("work/feature-redesign")).toMatchObject({
      tone: "work",
      detail: "Work branch: work/feature-redesign"
    });
    expect(createCockpitPanelBranch("feature/flywheel")).toMatchObject({
      tone: "work",
      detail: "Work branch: feature/flywheel"
    });
    expect(createCockpitPanelBranch("codex/task-queue")).toMatchObject({
      tone: "work",
      detail: "Work branch: codex/task-queue"
    });
    expect(createCockpitPanelBranch("task/cli-cleanup")).toMatchObject({
      tone: "work",
      detail: "Work branch: task/cli-cleanup"
    });
  });

  it("maps review branch prefixes to review tone", () => {
    expect(createCockpitPanelBranch("check/locality-check")).toMatchObject({
      tone: "review",
      detail: "Review branch: check/locality-check"
    });
    expect(createCockpitPanelBranch("review/deep-diff")).toMatchObject({
      tone: "review",
      detail: "Review branch: review/deep-diff"
    });
    expect(createCockpitPanelBranch("validation/strict-mode")).toMatchObject({
      tone: "review",
      detail: "Review branch: validation/strict-mode"
    });
  });

  it("sanitizes private absolute paths to basename-only labels", () => {
    expect(createCockpitPanelBranch("C:\\Users\\mj\\project\\work\\feature-redesign")).toEqual({
      label: "feature-redesign",
      detail: "Branch: feature-redesign",
      tone: "neutral"
    });

    expect(createCockpitPanelBranch("\\\\server\\share\\work\\codex-branch")).toEqual({
      label: "codex-branch",
      detail: "Branch: codex-branch",
      tone: "neutral"
    });

    expect(createCockpitPanelBranch("/home/mj/project/work/task-alpha")).toEqual({
      label: "task-alpha",
      detail: "Branch: task-alpha",
      tone: "neutral"
    });
  });

  it("normalizes whitespace and backslashes", () => {
    const signal = createCockpitPanelBranch("  work\\\\feature\\\\cleanup   task   ");

    expect(signal.label).toBe("work/feature/cleanup task");
    expect(signal.tone).toBe("work");
    expect(signal.detail).toBe("Work branch: work/feature/cleanup task");
  });

  it("truncates long branch labels for compact badge display", () => {
    const signal = createCockpitPanelBranch("work/this-is-an-excessively-long-feature-branch-name-with-many-segments");

    expect(signal.label.length).toBeLessThanOrEqual(28);
    expect(signal.label).toBe("work/this-is-an-excessive...");
    expect(signal.detail).toBe(
      "Work branch: work/this-is-an-excessively-long-feature-branch-name-with-many-segments"
    );
    expect(signal.detail.length).toBeGreaterThan(28);
  });
});
