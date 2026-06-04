import { describe, expect, it } from "vitest";
import {
  MilestoneCompletion,
  MilestoneTone,
  steerboardMilestoneStatuses,
  summarizeMilestoneStatuses
} from "./milestoneStatus";

const privateTermPatterns: RegExp[] = [
  /[A-Za-z]:\\/,
  /[\\/][A-Za-z0-9._-]+\.[A-Za-z0-9]{1,10}\b/,
  /(^|[\s])\.\.[\\/]/,
  /\b(projectatlas|project-atlas|carparts\.com|amicassa|hyperion|zenith)\b/i
];

const workerIdPatterns: RegExp[] = [/worker[-_ ]?[0-9a-f]{4,}/i, /\bworker id[:\s]*[a-z0-9-]+\b/i];

const modelPatterns: RegExp[] = [
  /\bgpt-\d/i,
  /\bclaude/i,
  /\bgemini/i,
  /\bllama\b/i,
  /\bopus\b/i,
  /\bmistral\b/i
];

describe("milestone status model", () => {
  it("exports non-empty milestones with required completion and tone", () => {
    for (const milestone of steerboardMilestoneStatuses) {
      expect(milestone.target.trim().length).toBeGreaterThan(0);
      expect(milestone.note.trim().length).toBeGreaterThan(0);
      expect(milestone.completion).toBeTypeOf("string");
      expect(milestone.tone).toBeTypeOf("string");
    }
  });

  it("includes all required public targets", () => {
    const targets = steerboardMilestoneStatuses.map((milestone) => milestone.target);
    expect(targets).toContain("Product scaffold");
    expect(targets).toContain("Cockpit monitor and operating modes");
    expect(targets).toContain("Orchestration model");
    expect(targets).toContain("Runtime adapters");
    expect(targets).toContain("Security and privacy model");
    expect(targets).toContain("Packaging and installation");
    expect(targets).toContain("Optional project management lane");
  });

  it("requires a compact public-safe summary for cockpit monitor and operating modes", () => {
    const cockpit = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Cockpit monitor and operating modes"
    );
    expect(cockpit?.completion).toBe("In progress");
    expect(cockpit?.tone).toBe("active");
    const note = cockpit?.note.toLowerCase() ?? "";
    expect(note).toContain("visible milestone status");
    expect(note).toContain("compact runtime/worker");
    expect(note).toContain("tool-coverage");
    expect(note).toContain("latest-activity");
    expect(note).toContain("validation visibility");
  });

  it("maps completion values to tone in required way for exported data", () => {
    const toneByCompletion: Record<MilestoneCompletion, MilestoneTone> = {
      Complete: "complete",
      "In progress": "active",
      Planned: "planned",
      Paused: "paused"
    };

    for (const milestone of steerboardMilestoneStatuses) {
      expect(milestone.tone).toBe(toneByCompletion[milestone.completion]);
    }
  });

  it("summarizes exported milestone list counts correctly", () => {
    expect(summarizeMilestoneStatuses(steerboardMilestoneStatuses)).toEqual({
      total: 7,
      complete: 1,
      active: 2,
      planned: 3,
      paused: 1
    });
  });

  it("keeps optional project management lane paused", () => {
    const pmLane = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Optional project management lane"
    );

    expect(pmLane?.completion).toBe("Paused");
    expect(pmLane?.tone).toBe("paused");
  });

  it("safeguards public-facing text from private details", () => {
    for (const milestone of steerboardMilestoneStatuses) {
      for (const pattern of privateTermPatterns) {
        expect(pattern.test(milestone.target)).toBe(false);
        expect(pattern.test(milestone.note)).toBe(false);
      }
      for (const pattern of workerIdPatterns) {
        expect(pattern.test(milestone.note)).toBe(false);
        expect(pattern.test(milestone.target)).toBe(false);
      }
      for (const pattern of modelPatterns) {
        expect(pattern.test(milestone.note)).toBe(false);
        expect(pattern.test(milestone.target)).toBe(false);
      }
    }
  });

  it("summarizes any milestone list", () => {
    const customSummary = summarizeMilestoneStatuses([
      { target: "A", completion: "Complete", tone: "complete", note: "Public note." },
      { target: "B", completion: "In progress", tone: "active", note: "Public note." },
      { target: "C", completion: "Planned", tone: "planned", note: "Public note." },
      { target: "D", completion: "Paused", tone: "paused", note: "Public note." },
      { target: "E", completion: "In progress", tone: "active", note: "Public note." }
    ]);

    expect(customSummary).toEqual({ total: 5, complete: 1, active: 2, planned: 1, paused: 1 });
  });
});
