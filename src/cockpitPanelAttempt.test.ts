import { describe, expect, it } from "vitest";
import { createCockpitPanelAttempt } from "./cockpitPanelAttempt";

describe("createCockpitPanelAttempt", () => {
  it("returns idle tone for idle state and zero attempt", () => {
    expect(createCockpitPanelAttempt(0, "idle")).toEqual({
      label: "0/3",
      detail: "No attempts yet.",
      tone: "idle",
      current: 0,
      max: 3
    });
  });

  it("flags first attempt as safe when below max", () => {
    expect(createCockpitPanelAttempt(1, "implementing")).toEqual({
      label: "1/3",
      detail: "Attempt 1 of 3 in progress.",
      tone: "safe",
      current: 1,
      max: 3
    });
  });

  it("warns near the attempt limit", () => {
    expect(createCockpitPanelAttempt(2, "implementing")).toEqual({
      label: "2/3",
      detail: "Attempt 2 of 3 is approaching the limit.",
      tone: "warning",
      current: 2,
      max: 3
    });
  });

  it("marks exhausted at the attempt limit", () => {
    expect(createCockpitPanelAttempt(3, "implementing")).toEqual({
      label: "3/3",
      detail: "Attempt 3 of 3 has hit the maximum.",
      tone: "exhausted",
      current: 3,
      max: 3
    });
  });

  it("uses complete tone even when attempts are low", () => {
    expect(createCockpitPanelAttempt(0, "complete")).toEqual({
      label: "0/3",
      detail: "Completed with no recorded attempt count.",
      tone: "complete",
      current: 0,
      max: 3
    });

    expect(createCockpitPanelAttempt(1, "complete")).toEqual({
      label: "1/3",
      detail: "Completed on attempt 1 of 3.",
      tone: "complete",
      current: 1,
      max: 3
    });
  });

  it("sanitizes and clamps invalid attempt and max values", () => {
    expect(createCockpitPanelAttempt(-1, "implementing", 3)).toEqual({
      label: "0/3",
      detail: "No attempts yet.",
      tone: "idle",
      current: 0,
      max: 3
    });

    expect(createCockpitPanelAttempt(2.8, "implementing", 2.2)).toEqual({
      label: "2/2",
      detail: "Attempt 2 of 2 has hit the maximum.",
      tone: "exhausted",
      current: 2,
      max: 2
    });

    expect(createCockpitPanelAttempt(2, "implementing", Number.NaN)).toEqual({
      label: "2/3",
      detail: "Attempt 2 of 3 is approaching the limit.",
      tone: "warning",
      current: 2,
      max: 3
    });

    expect(createCockpitPanelAttempt(2, "implementing", Number.POSITIVE_INFINITY)).toEqual({
      label: "2/3",
      detail: "Attempt 2 of 3 is approaching the limit.",
      tone: "warning",
      current: 2,
      max: 3
    });
  });

  it("supports custom max attempt limits", () => {
    expect(createCockpitPanelAttempt(4, "implementing", 5)).toEqual({
      label: "4/5",
      detail: "Attempt 4 of 5 is approaching the limit.",
      tone: "warning",
      current: 4,
      max: 5
    });
  });
});
