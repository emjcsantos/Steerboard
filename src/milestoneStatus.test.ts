import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  MilestoneCompletion,
  MilestoneTone,
  steerboardMilestoneStatuses,
  summarizeMilestoneStatuses
} from "./milestoneStatus";
import { remainingGoalPlan } from "./remainingGoalPlan";

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
    expect(targets).toContain("Arena monitor and operating modes");
    expect(targets).toContain("Orchestration model");
    expect(targets).toContain("Runtime adapter previews");
    expect(targets).toContain("Live adapter integration");
    expect(targets).toContain("Platform capabilities");
    expect(targets).toContain("Migration Center");
    expect(targets).toContain("Security and privacy model");
    expect(targets).toContain("Owner testing hardening");
    expect(targets).toContain("Packaging and installation");
    expect(targets).toContain("Optional project management lane");
  });

  it("requires a compact public-safe summary for Arena monitor and operating modes", () => {
    const arena = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Arena monitor and operating modes"
    );
    expect(arena?.completion).toBe("In progress");
    expect(arena?.tone).toBe("active");
    expect(arena?.completionPercent).toBe(66);
    expect(arena?.latestNote.toLowerCase()).toContain("panel-keyed live session chat");
    expect(arena?.latestNote.toLowerCase()).toContain("visible unsupported-control evidence");
    expect(arena?.latestNote.toLowerCase()).toContain("owner-testing control readiness evidence");
    expect(arena?.latestNote.toLowerCase()).toContain("duplicate session identity guards");
    expect(arena?.latestNote.toLowerCase()).toContain("native two-panel plus active-turn interrupt and steer smoke proof paths");
    expect(arena?.latestNote.toLowerCase()).toContain("project stack drag-in");
    expect(arena?.latestNote.toLowerCase()).toContain("keyboard adjustment");
    expect(arena?.nextStep.toLowerCase()).toContain("two-panel smoke");
    expect(arena?.nextStep.toLowerCase()).toContain("active-turn interrupt");
    expect(arena?.nextStep.toLowerCase()).toContain("active-turn steer");
    expect(arena?.nextStep.toLowerCase()).toContain("owner testing controls evidence");
  });

  it("requires a compact public-safe summary for orchestration model", () => {
    const orchestration = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Orchestration model"
    );

    expect(orchestration?.completion).toBe("In progress");
    expect(orchestration?.tone).toBe("active");
    expect(orchestration?.completionPercent).toBe(55);
    expect(orchestration?.current).toBeUndefined();
    expect(orchestration?.latestNote).toBe(
      "Local orchestration now creates explicit orchestrator, implementer, validator, and integration role-panel plans for Arena review, with handoff, retry state, dispatch review records, and owner-visible Phase 7 proof before external dispatch."
    );
    expect(orchestration?.nextStep).toBe(
      "Run `npm.cmd run test:phase7:owner-visible`, keep the dispatch review rows owner-visible, and preserve local-first review before live worker session spawning."
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

  it("keeps Live adapter integration active while platform capabilities take focus", () => {
    const liveCodex = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Live adapter integration"
    );

    expect(liveCodex?.completion).toBe("In progress");
    expect(liveCodex?.tone).toBe("active");
    expect(liveCodex?.completionPercent).toBe(48);
    expect(liveCodex?.current).toBeUndefined();
    expect(liveCodex?.latestNote.toLowerCase()).toContain("two-panel isolation smoke");
    expect(liveCodex?.latestNote.toLowerCase()).toContain("control-readiness smoke");
    expect(liveCodex?.latestNote.toLowerCase()).toContain("active-turn interrupt and steer smokes");
    expect(liveCodex?.nextStep).toBe(
      "Run native two-panel smoke, control-readiness smoke, active-turn interrupt smoke, and active-turn steer smoke in desktop mode as recurring regression checks, then continue fork/resume/archive hardening."
    );
  });

  it("tracks Platform capabilities as the current live-functionality focus", () => {
    const platform = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Platform capabilities"
    );

    expect(platform?.completion).toBe("In progress");
    expect(platform?.tone).toBe("active");
    expect(platform?.completionPercent).toBe(62);
    expect(platform?.current).toBe(true);
    expect(platform?.latestNote).toBe(
      "Platform command, skill, plugin, MCP, automation, and personalization capability surfaces refresh through ready/preview/setup-required/blocked/unsupported/unavailable states. Panel composers restrict slash suggestions and decisions to panel-scoped commands, provider-routed slash submissions leave explicit transcript evidence, and owner testing now evaluates slash-command execution plus session-control readiness from transcript proof without executing commands. The connection dialog still runs an all-catalog provider refresh smoke proof across six metadata/status surfaces without execution, Phase 3 exit-package clearance now has recorded CLI validation, desktop smoke proof, current-panel slash/session storage proof, owner handoff, and proof-export readiness, Phase 4 provider integration now holds completed metadata-only recorded provider-review proof at next/99, Phase 7 dispatch loop now holds completion-gate proof at next/100, Phase 5 migration hardening now holds completed migration review evidence at next/100, and Phase 8 permission and audit depth is the current active implementation goal with risk-closure, audit-persistence current-fingerprint proof, owner-review handoff artifact/fingerprint/reviewed-blocker proof, completion-gate handoff-ready proof, and closure-audit blocked-category proof at active/92."
    );
    expect(platform?.nextStep).toBe(
      "Advance Phase 8 permission and audit depth with permission labels, risk blockers, risk exceptions, traceability, blocker-priority, phase8RiskClosureProof, auditPersistenceProof current-fingerprint review, owner-review fingerprints, phase8AuditReviewHandoffProof artifactState/fingerprintCurrent/reviewedBlocker gates, record-specific rollback evidence, phase8PermissionAuditCompletionGate handoff-ready/fingerprint-current proof, and phase8ClosureAuditStatusProof blocked-category counts as the current active implementation target, keep live worker spawning and Phase 4 provider execution disabled, and preserve arbitrary terminal commands, Git mutation, MCP/plugin/automation execution, runtime/profile mutation, external-service actions, migration apply paths, and worker spawning behind owner-reviewed locks."
    );
  });

  it("ties the current Platform milestone to the active Phase 8 goal after Phase 5 completion", () => {
    const platform = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Platform capabilities"
    );
    const activeGoal = remainingGoalPlan.find((goal) => goal.current === true);
    const migrationGoal = remainingGoalPlan.find(
      (goal) => goal.id === "goal-phase-5-migration-hardening"
    );
    const phase8Goal = remainingGoalPlan.find(
      (goal) => goal.id === "goal-phase-8-permission-audit"
    );

    expect(platform?.current).toBe(true);
    expect(activeGoal?.id).toBe("goal-phase-8-permission-audit");
    expect(activeGoal?.status).toBe("active");
    expect(activeGoal?.target).toBe("Permission and audit depth");
    expect(migrationGoal?.status).toBe("next");
    expect(phase8Goal?.current).toBe(true);
    expect(platform?.latestNote).toContain("Phase 3 exit-package clearance now has recorded CLI validation");
    expect(platform?.latestNote).toContain("Phase 4 provider integration now holds completed metadata-only recorded provider-review proof at next/99");
    expect(platform?.latestNote).toContain("Phase 7 dispatch loop now holds completion-gate proof at next/100");
    expect(platform?.latestNote).toContain("Phase 5 migration hardening now holds completed migration review evidence at next/100");
    expect(platform?.latestNote).toContain("Phase 8 permission and audit depth is the current active implementation goal with risk-closure, audit-persistence current-fingerprint proof, owner-review handoff artifact/fingerprint/reviewed-blocker proof, completion-gate handoff-ready proof, and closure-audit blocked-category proof at active/92");
    expect(platform?.nextStep).toContain("Advance Phase 8 permission and audit depth");
  });

  it("tracks Migration Center as an active metadata-only transition milestone", () => {
    const migrationCenter = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Migration Center"
    );

    expect(migrationCenter?.completion).toBe("In progress");
    expect(migrationCenter?.tone).toBe("active");
    expect(migrationCenter?.completionPercent).toBe(58);
    expect(migrationCenter?.current).toBeUndefined();
    expect(migrationCenter?.latestNote).toBe(
      "Reviewed profile-draft persistence, local apply-review-staged audit proof, rollback/audit summaries, persisted apply-review staging, and owner-visible Phase 5 review-depth checks are now part of the migration milestone; migration remains metadata-only, with secrets, raw transcripts, and source mutation excluded."
    );
    expect(migrationCenter?.nextStep).toBe(
      "Run `npm.cmd run test:phase5:owner-visible`, keep migration metadata checks owner-reviewed, verify local apply-review-staged audit proof plus rollback audit coverage, and require explicit apply before changing active profile state."
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
      total: 11,
      complete: 0,
      active: 10,
      planned: 0,
      paused: 1,
      averageCompletionPercent: 52,
      nextTarget: "Platform capabilities",
      nextStep:
        "Advance Phase 8 permission and audit depth with permission labels, risk blockers, risk exceptions, traceability, blocker-priority, phase8RiskClosureProof, auditPersistenceProof current-fingerprint review, owner-review fingerprints, phase8AuditReviewHandoffProof artifactState/fingerprintCurrent/reviewedBlocker gates, record-specific rollback evidence, phase8PermissionAuditCompletionGate handoff-ready/fingerprint-current proof, and phase8ClosureAuditStatusProof blocked-category counts as the current active implementation target, keep live worker spawning and Phase 4 provider execution disabled, and preserve arbitrary terminal commands, Git mutation, MCP/plugin/automation execution, runtime/profile mutation, external-service actions, migration apply paths, and worker spawning behind owner-reviewed locks.",
      nextCompletionPercent: 62
    });
  });

  it("tracks security and privacy model as active after risk gate foundations land", () => {
    const securityMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Security and privacy model"
    );

    expect(securityMilestone?.completion).toBe("In progress");
    expect(securityMilestone?.tone).toBe("active");
    expect(securityMilestone?.completionPercent).toBe(45);
    expect(securityMilestone?.current).toBeUndefined();
    expect(securityMilestone?.latestNote).toBe(
      "Phase 10B keeps the runner contract strict: approved requests can perform only fixed read-only terminal probe actions; all other terminal writes and platform mutations stay disabled."
    );
    expect(securityMilestone?.nextStep).toBe(
      "Enforce explicit approval-to-probe transitions, verify disabled-path audit visibility, and preserve lockouts for Git, MCP, plugin, automation, runtime/profile, and external-service mutation."
    );
  });

  it("tracks owner testing hardening as the current live-functionality milestone", () => {
    const ownerTesting = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Owner testing hardening"
    );

    expect(ownerTesting?.completion).toBe("In progress");
    expect(ownerTesting?.tone).toBe("active");
    expect(ownerTesting?.completionPercent).toBe(50);
    expect(ownerTesting?.current).toBeUndefined();
    expect(ownerTesting?.latestNote).toBe(
      "A provider-neutral checklist and fixture layer now verifies Phase 10B runner contract behavior, disabled mutation paths, redacted audit output, six-surface catalog refresh owner validation, all-catalog provider refresh smoke proofing, slash execution readiness evidence, per-control session-control state evidence, opt-in Phase 3 desktop smoke harnessing, reload-safe owner-visible Phase 3 smoke proof readiness rows, the non-live `npm.cmd run test:phase3:owner-visible` proof-panel check, an actionable diagnostic Phase 3 exit gate, and the non-live `npm.cmd run test:phase11:owner-visible` Owner Command, Proof Freshness, Evidence Records, Release Readiness, owner release traceability, blocker-priority, and packaging-hold proof without automatic execution."
    );
    expect(ownerTesting?.nextStep).toBe(
      "Run the full local testing checklist, keep `npm.cmd run smoke:phase3` as the recurring opt-in desktop smoke command, run `npm.cmd run test:phase3:owner-visible` for the non-live imported-proof panel check, run `npm.cmd run test:phase11:owner-visible` for the non-live Owner Command, Proof Freshness, Evidence Records, Release Readiness, owner release traceability, blocker-priority, and packaging-hold proof, use the Phase 3 gate actions to clear missing proofs, verify smoke proof rows move browser or non-executed proofs to waiting and desktop executions to ready, review, or blocked across reload and while the app remains open, verify the per-control Owner Testing state chips, approval-to-probe behavior, all-catalog provider refresh smoke, live panel slash execution evidence, live panel control evidence, active-turn interrupt/steer smoke proof, Phase 11 owner command evidence, and disabled-path evidence (terminal, Git, MCP, plugin, automation, runtime, profile, and external), and keep desktop-backed mutation as a future phase."
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
    expect(pmLane?.completionPercent).toBe(57);
    expect(pmLane?.latestNote.toLowerCase()).toContain("owner-visible phase 7 dispatch proof");
    expect(pmLane?.latestNote.toLowerCase()).toContain("offline dispatch-review artifact verification");
    expect(pmLane?.nextStep.toLowerCase()).toContain("test:phase7:owner-visible");
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
    expect(securityDocText).toContain("## Live Arena Security Acceptance");
    expect(securityDocText).toContain("Live Arena run selected");
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

  it("keeps packaging and installation paused behind release readiness", () => {
    const packagingMilestone = steerboardMilestoneStatuses.find(
      (milestone) => milestone.target === "Packaging and installation"
    );

    expect(packagingMilestone?.completion).toBe("Paused");
    expect(packagingMilestone?.tone).toBe("paused");
    expect(packagingMilestone?.completionPercent).toBe(20);
    expect(packagingMilestone?.latestNote).toBe(
      "The Phase 11 Release Readiness gate now tracks clean checkout, build/test, smoke proof with Phase 3 proof-export detail, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, packaging lock, docs/known limits, final security closure capability, structured release-decision evidence, owner release traceability, and blocker-priority review while packaging remains paused and owner-held."
    );
    expect(packagingMilestone?.nextStep).toBe(
      "Use the Phase 11 Release Readiness, owner release traceability, and blocker-priority panels to record the final release proof after live workflow, provider, migration, audit, Phase 3 traceability, final security closure, owner proof, and release-decision evidence holds are clear; do not package, sign, create installers, push, or resume release actions from this gate."
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
