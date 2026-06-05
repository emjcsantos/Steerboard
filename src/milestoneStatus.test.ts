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

const securityDocForbiddenTerms: RegExp[] = [
  /projectatlas/i,
  /project-atlas/i,
  /carparts\.com/i,
  /amicassa/i,
  /hyperion/i,
  /zenith/i,
  /[A-Za-z]:\\/,
  /\.\.\\|\.{2}\//,
  /\braw private transcripts\b/i
];

const installationDocForbiddenTerms: RegExp[] = [
  /[A-Za-z]:\\/,
  /(^|[\s])\.\.[\\/]/,
  /\b(projectatlas|project-atlas|carparts\.com|amicassa|hyperion|zenith)\b/i,
  /\braw private transcripts\b/i,
  /worker[-_ ]?[0-9a-f]{4,}/i,
  /\bworker id[:\s]*[a-z0-9-]+\b/i,
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
  completion: string;
  completionPercent: number;
  latestNote: string;
  nextStep: string;
};

function parseSnapshotRows(markdown: string): SnapshotMilestoneRow[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    /^\|\s*Target\s*\|\s*Plan\s*\|\s*Completion\s*\|\s*% Completion\s*\|\s*Latest Note\s*\|\s*Next Step\s*\|\s*$/i.test(
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

    if (line === "| --- | --- | --- | --- | --- | --- |") {
      continue;
    }

    const columns = line
      .slice(1, -1)
      .split("|")
      .map((column) => column.trim());

    if (columns.length !== 6) {
      break;
    }

    const [target, plan, completion, completionPercent, latestNote, nextStep] = columns;
    if (!target || !plan || !completion || !completionPercent || !latestNote || !nextStep) {
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
      completion,
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
    expect(cockpit?.completion).toBe("Complete");
    expect(cockpit?.tone).toBe("complete");
    expect(cockpit?.latestNote.toLowerCase()).toContain("acceptance coverage is complete");
    expect(cockpit?.nextStep.toLowerCase()).toContain("regressions");
  });

  it("requires a compact public-safe summary for orchestration model", () => {
    const orchestration = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Orchestration model"
    );

    expect(orchestration?.completion).toBe("Complete");
    expect(orchestration?.tone).toBe("complete");
    expect(orchestration?.completionPercent).toBe(100);
    expect(orchestration?.latestNote).toBe(
      "Final orchestration acceptance coverage now confirms lifecycle signals, task coverage, regression checks, and run closure evidence for end-to-end monitoring."
    );
    expect(orchestration?.nextStep).toBe(
      "Monitor orchestration regressions while runtime adapter validation advances."
    );
  });

  it("requires a compact public-safe summary for runtime adapters", () => {
    const runtimeAdapters = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Runtime adapters"
    );

    expect(runtimeAdapters?.completion).toBe("Complete");
    expect(runtimeAdapters?.tone).toBe("complete");
    expect(runtimeAdapters?.completionPercent).toBe(100);
    expect(runtimeAdapters?.latestNote).toBe(
      "Runtime adapter recovery and external-source failure-state coverage now closes the runtime intake milestone with visible recovery, source, failure, and safe-handoff checks."
    );
    expect(runtimeAdapters?.nextStep).toBe(
      "Monitor runtime adapter regressions while security and privacy controls advance."
    );
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
      complete: 4,
      active: 2,
      planned: 0,
      paused: 1,
      averageCompletionPercent: 67,
      nextTarget: "Security and privacy model",
      nextStep:
        "Add visible security-control readiness checks to the cockpit and validate privacy-safe release guidance.",
      nextCompletionPercent: 40
    });
  });

  it("tracks security and privacy model as in progress with updated completion", () => {
    const securityMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Security and privacy model"
    );

    expect(securityMilestone?.completion).toBe("In progress");
    expect(securityMilestone?.tone).toBe("active");
    expect(securityMilestone?.completionPercent).toBe(40);
    expect(securityMilestone?.nextStep).toBe(
      "Add visible security-control readiness checks to the cockpit and validate privacy-safe release guidance."
    );
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
        row.completion,
        String(row.completionPercent),
        row.latestNote,
        row.nextStep
      ];
      expect(columns).toHaveLength(6);
      expect(columns.every((column) => column.length > 0)).toBe(true);
      expect(row.completionPercent).toBeGreaterThanOrEqual(0);
      expect(row.completionPercent).toBeLessThanOrEqual(100);
      expect(Number.isInteger(row.completionPercent)).toBe(true);
      expect(row.target.length).toBeGreaterThan(0);
      expect(row.completion.length).toBeGreaterThan(0);
      expect(row.plan.length).toBeGreaterThan(0);
      expect(row.latestNote.length).toBeGreaterThan(0);
    }

    const liveTargets = new Set(
      steerboardMilestoneStatuses.map((milestone) => milestone.target)
    );
    expect(
      snapshotRows.every((row) => liveTargets.has(row.target))
    ).toBe(true);
    expect(snapshotRows.length).toBe(liveTargets.size);
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
      expect(live?.completion).toBe(snapshotRow.completion);
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

  it("keeps the public security and privacy architecture doc current and public-safe", () => {
    const docPath = path.join(process.cwd(), "docs/architecture/security-privacy-model.md");
    const securityDocText = fs.readFileSync(docPath, "utf8");

    expect(securityDocText).toContain("## Threat Model");
    expect(securityDocText).toContain("## Implementation Controls");

    expect(securityDocText).toContain("Private data leakage");
    expect(securityDocText).toContain("Overbroad local permissions");
    expect(securityDocText).toContain("Unsafe external execution");
    expect(securityDocText).toContain("Unreviewed dependency adoption");
    expect(securityDocText).toContain("Missing audit trail");

    for (const pattern of securityDocForbiddenTerms) {
      expect(pattern.test(securityDocText)).toBe(false);
    }
  });

  it("advances packaging and installation to in-progress 30%", () => {
    const packagingMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Packaging and installation"
    );

    expect(packagingMilestone?.completion).toBe("In progress");
    expect(packagingMilestone?.tone).toBe("active");
    expect(packagingMilestone?.completionPercent).toBe(30);
    expect(packagingMilestone?.latestNote).toContain("Source-first install readiness gates are now defined");
    expect(packagingMilestone?.nextStep).toBe(
      "Expose source-install readiness in the cockpit and validate build/package guidance."
    );
  });

  it("documents public-safe source-first readiness checks", () => {
    const installationStrategyPath = path.join(
      process.cwd(),
      "docs/operations/installation-strategy.md"
    );
    const installationStrategyText = fs.readFileSync(
      installationStrategyPath,
      "utf8"
    );

    expect(installationStrategyText).toContain("Source-First Readiness Checks");
    expect(installationStrategyText).toContain("Source setup scripts");
    expect(installationStrategyText).toContain("Desktop startup script");
    expect(installationStrategyText).toContain("Production build script");
    expect(installationStrategyText).toContain("Validation script");
    expect(installationStrategyText).toContain("Install hook safety");

    for (const pattern of installationDocForbiddenTerms) {
      expect(pattern.test(installationStrategyText)).toBe(false);
      expect(pattern.test(installationStrategyText.toLowerCase())).toBe(false);
    }
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
        completionPercent: 21,
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

    expect(customSummary).toEqual({
      total: 5,
      complete: 1,
      active: 2,
      planned: 1,
      paused: 1,
      averageCompletionPercent: 48,
      nextTarget: "B",
      nextStep: "B next step.",
      nextCompletionPercent: 50
    });
  });

  it("falls back to no active milestone when all milestones are complete or paused", () => {
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
        target: "D",
        plan: "D plan.",
        completionPercent: 0,
        latestNote: "D latest note.",
        nextStep: "D next step.",
        completion: "Paused",
        tone: "paused",
        note: "Public note."
      }
    ]);

    expect(customSummary).toEqual({
      total: 2,
      complete: 1,
      active: 0,
      planned: 0,
      paused: 1,
      averageCompletionPercent: 50,
      nextTarget: "No active milestone",
      nextStep: "No active next step.",
      nextCompletionPercent: 100
    });
  });

  it("handles empty milestone lists with defaults", () => {
    const customSummary = summarizeMilestoneStatuses([]);

    expect(customSummary).toEqual({
      total: 0,
      complete: 0,
      active: 0,
      planned: 0,
      paused: 0,
      averageCompletionPercent: 0,
      nextTarget: "No active milestone",
      nextStep: "No active next step.",
      nextCompletionPercent: 100
    });
  });
});
