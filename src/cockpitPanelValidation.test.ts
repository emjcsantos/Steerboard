import { describe, expect, it } from "vitest";
import { createCockpitPanelValidation } from "./cockpitPanelValidation";

describe("createCockpitPanelValidation", () => {
  it("uses fallback label and detail for blank validation", () => {
    expect(createCockpitPanelValidation("", "implementing")).toEqual({
      label: "Validation pending",
      detail: "Validation pending.",
      tone: "pending"
    });

    expect(createCockpitPanelValidation(null)).toEqual({
      label: "Validation pending",
      detail: "Validation pending.",
      tone: "pending"
    });
  });

  it("maps pending and waiting words to pending tone", () => {
    const pending = createCockpitPanelValidation("Pending approval from tests", "implementing");
    const waiting = createCockpitPanelValidation("Waiting for reviewer note", "planning");

    expect(pending.tone).toBe("pending");
    expect(waiting.tone).toBe("pending");
  });

  it("maps validating state to running tone", () => {
    const pendingFromState = createCockpitPanelValidation("3 checks", "validating");

    expect(pendingFromState.tone).toBe("running");
    expect(pendingFromState.label).toBe("3 checks");
  });

  it("maps passed-like validation text to passed tone", () => {
    expect(createCockpitPanelValidation("Passed all tests", "implementing").tone).toBe("passed");
    expect(createCockpitPanelValidation("Validation accepted by policy", "implementing").tone).toBe("passed");
    expect(createCockpitPanelValidation("Build success", "implementing").tone).toBe("passed");
    expect(createCockpitPanelValidation("Handoff complete", "implementing").tone).toBe("passed");
    expect(createCockpitPanelValidation("Review completed", "implementing").tone).toBe("passed");
  });

  it("maps blocked/failed/error text to review tone", () => {
    expect(createCockpitPanelValidation("blocked by dependency", "implementing").tone).toBe("review");
    expect(createCockpitPanelValidation("failed to finish", "implementing").tone).toBe("review");
    expect(createCockpitPanelValidation("error writing reports", "implementing").tone).toBe("review");
    expect(createCockpitPanelValidation("Needs review", "blocked").tone).toBe("review");
  });

  it("collapses whitespace and path separators for public-safe labels", () => {
    const result = createCockpitPanelValidation(
      "  C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\evidence\\final\\panel\\result.md  "
    );

    expect(result.label).toBe("result.md");
    expect(result.detail).toBe("Validation: result.md");
    expect(result.label).not.toContain("C:");
    expect(result.detail).not.toContain("Users");
    expect(result.label).not.toContain("/");
    expect(result.label).not.toContain("\\");
    expect(result.detail).not.toContain("/");
    expect(result.detail).not.toContain("\\");
  });

  it("truncates labels for compact badge rendering while preserving detail context", () => {
    const result = createCockpitPanelValidation(
      "Validation summary for the final layout test run includes very long coverage across many sections, " +
        "but keeps the badge compact and readable."
    );

    expect(result.label).toHaveLength(34);
    expect(result.label.endsWith("...")).toBe(true);
    expect(result.detail).toHaveLength(96);
    expect(result.detail.endsWith("...")).toBe(true);
    expect(result.detail.startsWith("Validation: Validation summary")).toBe(true);
  });
});
