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

type SnapshotMilestoneRow = {
  target: string;
  plan: string;
  completion: string;
  completionPercent: number;
  latestNote: string;
  nextStep: string;
};

type SnapshotTargetRow = {
  target: string;
  completion: string;
  note: string;
};

function parseCompactTargetRows(markdown: string): SnapshotTargetRow[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    /^\|\s*Target\s*\|\s*Completion\s*\|\s*Note\s*\|\s*$/i.test(
      line.trim()
    )
  );
  expect(headerIndex).toBeGreaterThanOrEqual(0);

  const rows: SnapshotTargetRow[] = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|") || !line.endsWith("|")) {
      break;
    }

    if (line === "| --- | --- | --- |") {
      continue;
    }

    const columns = line
      .slice(1, -1)
      .split("|")
      .map((column) => column.trim());

    if (columns.length !== 3) {
      break;
    }

    const [target, completion, note] = columns;
    if (!target || !completion || !note) {
      break;
    }

    rows.push({ target, completion, note });
  }

  return rows;
}

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
    expect(targets).toContain("Runtime adapter previews");
    expect(targets).toContain("Live Codex integration");
    expect(targets).toContain("Platform capabilities");
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
    expect(cockpit?.latestNote.toLowerCase()).toContain("panel-keyed live codex chat");
    expect(cockpit?.nextStep.toLowerCase()).toContain("two-panel smoke");
  });

  it("requires a compact public-safe summary for orchestration model", () => {
    const orchestration = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Orchestration model"
    );

    expect(orchestration?.completion).toBe("In progress");
    expect(orchestration?.tone).toBe("active");
    expect(orchestration?.completionPercent).toBe(40);
    expect(orchestration?.latestNote).toBe(
      "Mock orchestration, validation, and handoff projections are modeled."
    );
    expect(orchestration?.nextStep).toBe(
      "Feed real provider session events into the same model."
    );
  });

  it("requires a compact public-safe summary for runtime adapter previews", () => {
    const runtimeAdapters = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Runtime adapter previews"
    );

    expect(runtimeAdapters?.completion).toBe("In progress");
    expect(runtimeAdapters?.tone).toBe("active");
    expect(runtimeAdapters?.completionPercent).toBe(50);
    expect(runtimeAdapters?.latestNote).toBe(
      "Runtime profiles, bridge previews, permission previews, local event simulations, panel-session persistence, stream routing, and control capability foundations exist."
    );
    expect(runtimeAdapters?.nextStep).toBe(
      "Connect routed stream and control state to richer monitor surfaces."
    );
  });

  it("marks Live Codex integration as the current selected milestone", () => {
    const liveCodex = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Live Codex integration"
    );

    expect(liveCodex?.completion).toBe("In progress");
    expect(liveCodex?.tone).toBe("active");
    expect(liveCodex?.completionPercent).toBe(42);
    expect(liveCodex?.current).toBe(true);
    expect(liveCodex?.nextStep).toBe(
      "Run native two-panel smoke and live-control smoke, then start slash command capability work."
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
      total: 9,
      complete: 0,
      active: 7,
      planned: 1,
      paused: 1,
      averageCompletionPercent: 34,
      nextTarget: "Live Codex integration",
      nextStep: "Run native two-panel smoke and live-control smoke, then start slash command capability work.",
      nextCompletionPercent: 42
    });
  });

  it("tracks security and privacy model as complete with closure language", () => {
    const securityMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Security and privacy model"
    );

    expect(securityMilestone?.completion).toBe("In progress");
    expect(securityMilestone?.tone).toBe("active");
    expect(securityMilestone?.completionPercent).toBe(30);
    expect(securityMilestone?.latestNote).toBe(
      "Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening."
    );
    expect(securityMilestone?.nextStep).toBe(
      "Add provider credential, permission, and audit acceptance criteria before live execution."
    );
  });

  it("enforces the public snapshot table contract", () => {
    const snapshotText = fs.readFileSync(
      path.join(process.cwd(), "docs/project/milestone-status.md"),
      "utf8"
    );
    const targetRows = parseCompactTargetRows(snapshotText);
    const snapshotRows = parseSnapshotRows(snapshotText);

    expect(targetRows.length).toBe(steerboardMilestoneStatuses.length);
    expect(snapshotRows.length).toBe(steerboardMilestoneStatuses.length);

    for (const targetRow of targetRows) {
      expect(targetRow.target.trim().length).toBeGreaterThan(0);
      expect(targetRow.completion.trim().length).toBeGreaterThan(0);
      expect(targetRow.note.trim().length).toBeGreaterThan(0);
    }

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
    expect(targetRows.every((row) => liveTargets.has(row.target))).toBe(true);
    expect(snapshotRows.length).toBe(liveTargets.size);
    expect(targetRows.length).toBe(liveTargets.size);
  });

  it("keeps compact target/completion/latest note rows in sync with exported milestones", () => {
    const snapshotText = fs.readFileSync(
      path.join(process.cwd(), "docs/project/milestone-status.md"),
      "utf8"
    );
    const targetRows = parseCompactTargetRows(snapshotText);
    const liveRowsByTarget = new Map(
      steerboardMilestoneStatuses.map((milestone) => [milestone.target, milestone])
    );

    expect(targetRows.length).toBe(steerboardMilestoneStatuses.length);

    for (const targetRow of targetRows) {
      const live = liveRowsByTarget.get(targetRow.target);
      expect(live).toBeDefined();
      expect(live?.completion).toBe(targetRow.completion);
      expect(live?.latestNote).toBe(targetRow.note);
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

  it("keeps optional project management lane secondary but active", () => {
    const pmLane = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Optional project management lane"
    );

    expect(pmLane?.completion).toBe("In progress");
    expect(pmLane?.tone).toBe("active");
    expect(pmLane?.completionPercent).toBe(25);
    expect(pmLane?.nextStep.toLowerCase()).toContain("after live chat works");
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
    expect(securityDocText).toContain("Local-first defaults");
    expect(securityDocText).toContain("Sensitive data boundary");
    expect(securityDocText).toContain("Permission and execution lock");
    expect(securityDocText).toContain("Dependency and fixture safety");
    expect(securityDocText).toContain("Audit and export trail");
    expect(securityDocText).toContain("## Live Cockpit Security Acceptance");
    expect(securityDocText).toContain("Live cockpit run selected");
    expect(securityDocText).toContain("Release privacy readiness");
    expect(securityDocText).toContain("Runtime adapter edge evidence");
    expect(securityDocText).toContain("Audit review trail");
    expect(securityDocText).toContain("## Repeated Live Run Evidence");
    expect(securityDocText).toContain("reviewed run sample coverage");
    expect(securityDocText).toContain("ready run count");
    expect(securityDocText).toContain("blocked run count");
    expect(securityDocText).toContain("evidence can be closed");
    expect(securityDocText).toContain("## Final Security Review Gate");
    expect(securityDocText).toContain("release privacy check");
    expect(securityDocText).toContain("current-run security acceptance");
    expect(securityDocText).toContain("packaging pause lock");
    expect(securityDocText).toContain("close-security decision");

    for (const pattern of securityDocForbiddenTerms) {
      expect(pattern.test(securityDocText)).toBe(false);
    }
  });

  it("captures review-gate labels for real project data and adapter edge hardening", () => {
    const securityDocText = fs.readFileSync(
      path.join(process.cwd(), "docs/architecture/security-privacy-model.md"),
      "utf8"
    );

    expect(securityDocText).toContain(
      "## Real Project Data And Runtime Adapter Edge Hardening"
    );
    expect(securityDocText).toContain("Real project data boundary");
    expect(securityDocText).toContain("Runtime adapter fallback states");
    expect(securityDocText).toContain("Permission lock edge cases");
    expect(securityDocText).toContain("Audit export review");
    expect(securityDocText).toContain("Fixture and dependency review");
    expect(securityDocText).toMatch(/checks? only/i);
    expect(securityDocText).toMatch(/must not/i);
  });

  it("pauses packaging and installation to 0%", () => {
    const packagingMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Packaging and installation"
    );

    expect(packagingMilestone?.completion).toBe("Paused");
    expect(packagingMilestone?.tone).toBe("paused");
    expect(packagingMilestone?.completionPercent).toBe(0);
    expect(packagingMilestone?.latestNote).toBe(
      "Packaging is intentionally deferred until core development is complete."
    );
    expect(packagingMilestone?.nextStep).toBe(
      "Remain paused until core development is complete."
    );
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
