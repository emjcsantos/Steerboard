import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
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

type SnapshotMilestoneRow = {
  target: string;
  plan: string;
  completionPercent: number;
  latestNote: string;
  nextStep: string;
};

function parseSnapshotRows(markdown: string): SnapshotMilestoneRow[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    /^\|\s*Target\s*\|\s*Plan\s*\|\s*% Completion\s*\|\s*Latest Note\s*\|\s*Next Step\s*\|\s*$/i.test(
      line.trim()
    )
  );
  expect(headerIndex).toBeGreaterThanOrEqual(0);

  const rows: SnapshotMilestoneRow[] = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|") || !line.endsWith("|")) {
      break;
    }

    if (line === "| --- | --- | --- | --- | --- |") {
      continue;
    }

    const columns = line
      .slice(1, -1)
      .split("|")
      .map((column) => column.trim());

    if (columns.length !== 5) {
      break;
    }

    const [target, plan, completionPercent, latestNote, nextStep] = columns;
    if (!target || !plan || !completionPercent || !latestNote || !nextStep) {
      break;
    }

    const normalizedCompletionPercent = Number.parseInt(
      completionPercent.replace("%", "").trim(),
      10
    );
    expect(Number.isInteger(normalizedCompletionPercent)).toBe(true);

    rows.push({
      target,
      plan,
      completionPercent: normalizedCompletionPercent,
      latestNote,
      nextStep
    });
  }

  return rows;
}

describe("milestone status model", () => {
  it("exports non-empty milestones with required public fields", () => {
    for (const milestone of steerboardMilestoneStatuses) {
      expect(milestone.target.trim().length).toBeGreaterThan(0);
      expect(milestone.plan.trim().length).toBeGreaterThan(0);
      expect(milestone.latestNote.trim().length).toBeGreaterThan(0);
      expect(milestone.nextStep.trim().length).toBeGreaterThan(0);
      expect(milestone.completion).toBeTypeOf("string");
      expect(milestone.tone).toBeTypeOf("string");
      expect(milestone.completionPercent).toBeTypeOf("number");
      expect(Number.isInteger(milestone.completionPercent)).toBe(true);
      expect(milestone.completionPercent).toBeGreaterThanOrEqual(0);
      expect(milestone.completionPercent).toBeLessThanOrEqual(100);
      if (milestone.note !== undefined) {
        expect(milestone.note.trim().length).toBeGreaterThan(0);
      }
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
    const latestNote = cockpit?.latestNote.toLowerCase() ?? "";
    const nextStep = cockpit?.nextStep.toLowerCase() ?? "";
    expect(latestNote).toContain("focus/clear");
    expect(latestNote).toContain("toolbar");
    expect(nextStep).toContain("toolbar");
    expect(nextStep).toContain("focus");
    expect(nextStep).toContain("clear");
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

  it("enforces the public snapshot table contract", () => {
    const snapshotText = fs.readFileSync(
      path.join(process.cwd(), "docs/project/milestone-status.md"),
      "utf8"
    );
    const snapshotRows = parseSnapshotRows(snapshotText);

    expect(snapshotRows.length).toBe(steerboardMilestoneStatuses.length);

    for (const row of snapshotRows) {
      const columns = [
        row.target,
        row.plan,
        String(row.completionPercent),
        row.latestNote,
        row.nextStep
      ];
      expect(columns).toHaveLength(5);
      expect(columns.every((column) => column.length > 0)).toBe(true);
      expect(row.completionPercent).toBeGreaterThanOrEqual(0);
      expect(row.completionPercent).toBeLessThanOrEqual(100);
      expect(Number.isInteger(row.completionPercent)).toBe(true);
    }
  });

  it("keeps exported milestone target/plan/% completion/latest note/next step in sync with the public snapshot", () => {
    const snapshotText = fs.readFileSync(
      path.join(process.cwd(), "docs/project/milestone-status.md"),
      "utf8"
    );
    const snapshotRows = parseSnapshotRows(snapshotText);

    expect(snapshotRows.length).toBe(steerboardMilestoneStatuses.length);

    const liveRowsByTarget = new Map(
      steerboardMilestoneStatuses.map((milestone) => [milestone.target, milestone])
    );

    for (const snapshotRow of snapshotRows) {
      const live = liveRowsByTarget.get(snapshotRow.target);
      expect(live).toBeDefined();
      expect(live?.plan).toBe(snapshotRow.plan);
      expect(live?.completionPercent).toBe(snapshotRow.completionPercent);
      expect(live?.latestNote).toBe(snapshotRow.latestNote);
      expect(live?.nextStep).toBe(snapshotRow.nextStep);
    }

    for (const milestone of steerboardMilestoneStatuses) {
      expect(
        snapshotRows.some((snapshotRow) => snapshotRow.target === milestone.target)
      ).toBe(true);
    }
  });

  it("keeps optional project management lane paused", () => {
    const pmLane = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Optional project management lane"
    );

    expect(pmLane?.completion).toBe("Paused");
    expect(pmLane?.tone).toBe("paused");
    expect(pmLane?.completionPercent).toBe(0);
    expect(pmLane?.nextStep.toLowerCase()).toContain("remain paused");
  });

  it("safeguards public-facing text from private details", () => {
    for (const milestone of steerboardMilestoneStatuses) {
      for (const pattern of privateTermPatterns) {
        expect(pattern.test(milestone.target)).toBe(false);
        expect(pattern.test(milestone.plan)).toBe(false);
        expect(pattern.test(milestone.latestNote)).toBe(false);
        expect(pattern.test(milestone.nextStep)).toBe(false);
        if (milestone.note !== undefined) {
          expect(pattern.test(milestone.note)).toBe(false);
        }
      }
      for (const pattern of workerIdPatterns) {
        expect(pattern.test(milestone.target)).toBe(false);
        expect(pattern.test(milestone.plan)).toBe(false);
        expect(pattern.test(milestone.latestNote)).toBe(false);
        expect(pattern.test(milestone.nextStep)).toBe(false);
        if (milestone.note !== undefined) {
          expect(pattern.test(milestone.note)).toBe(false);
        }
      }
      for (const pattern of modelPatterns) {
        expect(pattern.test(milestone.target)).toBe(false);
        expect(pattern.test(milestone.plan)).toBe(false);
        expect(pattern.test(milestone.latestNote)).toBe(false);
        expect(pattern.test(milestone.nextStep)).toBe(false);
        if (milestone.note !== undefined) {
          expect(pattern.test(milestone.note)).toBe(false);
        }
      }
    }
  });

  it("summarizes any milestone list", () => {
    const customSummary = summarizeMilestoneStatuses([
      {
        target: "A",
        plan: "A plan.",
        completionPercent: 100,
        latestNote: "A latest note.",
        nextStep: "A next step.",
        completion: "Complete",
        tone: "complete",
        note: "Public note."
      },
      {
        target: "B",
        plan: "B plan.",
        completionPercent: 50,
        latestNote: "B latest note.",
        nextStep: "B next step.",
        completion: "In progress",
        tone: "active",
        note: "Public note."
      },
      {
        target: "C",
        plan: "C plan.",
        completionPercent: 20,
        latestNote: "C latest note.",
        nextStep: "C next step.",
        completion: "Planned",
        tone: "planned",
        note: "Public note."
      },
      {
        target: "D",
        plan: "D plan.",
        completionPercent: 0,
        latestNote: "D latest note.",
        nextStep: "D next step.",
        completion: "Paused",
        tone: "paused",
        note: "Public note."
      },
      {
        target: "E",
        plan: "E plan.",
        completionPercent: 70,
        latestNote: "E latest note.",
        nextStep: "E next step.",
        completion: "In progress",
        tone: "active",
        note: "Public note."
      }
    ]);

    expect(customSummary).toEqual({ total: 5, complete: 1, active: 2, planned: 1, paused: 1 });
  });
});
