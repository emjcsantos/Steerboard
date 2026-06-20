export type MilestoneCompletion = "Complete" | "In progress" | "Planned" | "Paused";

export type MilestoneTone = "complete" | "active" | "planned" | "paused";

export interface MilestoneStatus {
  target: string;
  completion: MilestoneCompletion;
  plan: string;
  completionPercent: number;
  latestNote: string;
  nextStep: string;
  current?: boolean;
  note?: string;
  tone: MilestoneTone;
}

export interface MilestoneStatusSummary {
  total: number;
  complete: number;
  active: number;
  planned: number;
  paused: number;
  averageCompletionPercent: number;
  nextTarget: string;
  nextStep: string;
  nextCompletionPercent: number;
}

export const steerboardMilestoneStatuses: MilestoneStatus[] = [
  {
    target: "Product scaffold",
    completion: "In progress",
    plan: "Establish a stable baseline structure, public docs contract, and navigation foundations.",
    completionPercent: 60,
    latestNote:
      "Local shell, public docs, navigation, and Arena scaffolding are in place.",
    nextStep: "Keep scaffold stable while live provider integration starts.",
    tone: "active",
    note: "Local desktop shell, public fixture data, project sidebar, Arena layouts, and docs are available for review."
  },
  {
    target: "Arena monitor and operating modes",
    completion: "In progress",
    plan: "Complete core Arena panels, control affordances, and visible operating-mode cues.",
    completionPercent: 66,
    latestNote:
      "Multi-panel Arena, adaptive magnetic layout with project stack drag-in, session drag-in, drop previews, keyboard adjustment, and adaptive project-drop template selection exist; local chat-lane scaffolding includes panel-keyed live session chat, per-panel session controls, visible unsupported-control evidence, owner-testing control readiness evidence, duplicate session identity guards, and native two-panel plus active-turn interrupt and steer smoke proof paths.",
    nextStep:
      "Run native two-panel smoke, control-readiness smoke, active-turn interrupt smoke, and active-turn steer smoke from desktop mode, then verify the Owner Testing controls evidence moves from review to ready after interrupt, retry, and steer proof.",
    tone: "active",
    note:
      "Fixed layouts, adaptive panel geometry, project stack drag-in, session drag-in, drop previews, local monitor previews, and guarded chat-lane scaffolding with unsupported-control evidence exist, but live provider-backed behavior is not complete."
  },
  {
    target: "Orchestration model",
    completion: "In progress",
    plan: "Define a consistent model for sequencing cross-cutting tasks and status propagation.",
    completionPercent: 55,
    latestNote:
      "Local orchestration now creates explicit orchestrator, implementer, validator, and integration role-panel plans for Arena review, with handoff, retry state, dispatch review records, and owner-visible Phase 7 proof before external dispatch.",
    nextStep:
      "Run `npm.cmd run test:phase7:owner-visible`, keep the dispatch review rows owner-visible, and preserve local-first review before live worker session spawning.",
    tone: "active",
    note:
      "Local runs, task state, role-plan visibility, validation gates, handoff previews, and retry state are modeled before live runtime execution."
  },
  {
    target: "Runtime adapter previews",
    completion: "In progress",
    plan: "Deliver and stabilize adapter surfaces for consistent runtime status intake.",
    completionPercent: 50,
    latestNote:
      "Runtime profiles, bridge previews, permission previews, local event simulations, panel-session persistence, stream routing, and control capability foundations exist.",
    nextStep:
      "Connect routed stream and control state to richer monitor surfaces.",
    tone: "active",
    note:
      "Provider-neutral profile, bridge, permission, launch, and evidence previews exist as locked local scaffolds."
  },
  {
    target: "Live adapter integration",
    completion: "In progress",
    plan: "Connect runtime auth/session transport to Arena panels.",
    completionPercent: 48,
    latestNote:
      "Runtime app-server bridge now supports no-prompt readiness, explicit live smoke, two-panel isolation smoke, control-readiness smoke, explicit active-turn interrupt and steer smokes, panel-keyed sessions, visible-panel live chat paths, and interrupt/retry/steer foundations.",
    nextStep:
      "Run native two-panel smoke, control-readiness smoke, active-turn interrupt smoke, and active-turn steer smoke in desktop mode as recurring regression checks, then continue fork/resume/archive hardening.",
    tone: "active",
    note:
      "Runtime connection center, adapter bridge, live panel chat, and normalized stream ingestion are the next core milestone."
  },
  {
    target: "Platform capabilities",
    completion: "In progress",
    plan: "Make commands, plugins, automations, MCP, personalization, permissions, and audit state live.",
    completionPercent: 62,
    latestNote:
      "Platform command, skill, plugin, MCP, automation, and personalization capability surfaces refresh through ready/preview/setup-required/blocked/unsupported/unavailable states. Panel composers restrict slash suggestions and decisions to panel-scoped commands, provider-routed slash submissions leave explicit transcript evidence, and owner testing now evaluates slash-command execution plus session-control readiness from transcript proof without executing commands. The connection dialog still runs an all-catalog provider refresh smoke proof across six metadata/status surfaces without execution, Phase 3 exit-package clearance now has recorded CLI validation, desktop smoke proof, current-panel slash/session storage proof, owner handoff, and proof-export readiness, Phase 4 provider integration now holds completed metadata-only recorded provider-review proof at next/99, Phase 7 dispatch loop now holds completion-gate proof at next/100, Phase 5 migration hardening now holds completed migration review evidence at next/100, and Phase 8 permission and audit depth is the current active implementation goal with risk-closure, owner-review handoff, and completion-gate proof at active/76.",
    nextStep:
      "Advance Phase 8 permission and audit depth with permission labels, risk blockers, risk exceptions, traceability, blocker-priority, phase8RiskClosureProof, audit persistence, owner-review fingerprints, owner-review handoff proof, record-specific rollback evidence, and phase8PermissionAuditCompletionGate proof as the current active implementation target, keep live worker spawning and Phase 4 provider execution disabled, and preserve arbitrary terminal commands, Git mutation, MCP/plugin/automation execution, runtime/profile mutation, external-service actions, migration apply paths, and worker spawning behind owner-reviewed locks.",
    current: true,
    tone: "active",
    note:
      "Panel-scoped slash commands, Skills catalog, platform catalogs, migration preview, and risk-gated approval/audit foundations exist; broader provider refresh and full execution remain live-disabled."
  },
  {
    target: "Migration Center",
    completion: "In progress",
    plan: "Implement safe migration metadata review and safe-to-apply profile transitions.",
    completionPercent: 58,
    latestNote:
      "Reviewed profile-draft persistence, local apply-review-staged audit proof, rollback/audit summaries, persisted apply-review staging, and owner-visible Phase 5 review-depth checks are now part of the migration milestone; migration remains metadata-only, with secrets, raw transcripts, and source mutation excluded.",
    nextStep:
      "Run `npm.cmd run test:phase5:owner-visible`, keep migration metadata checks owner-reviewed, verify local apply-review-staged audit proof plus rollback audit coverage, and require explicit apply before changing active profile state.",
    tone: "active",
    note:
      "Reviewed profile-draft persistence and rollback/audit summaries are now part of the migration milestone; migration remains metadata-only, with secrets, raw transcripts, and source mutation excluded."
  },
  {
    target: "Security and privacy model",
    completion: "In progress",
    plan: "Set baseline protections, data-handling boundaries, and reviewable controls.",
    completionPercent: 45,
    latestNote:
      "Phase 10B keeps the runner contract strict: approved requests can perform only fixed read-only terminal probe actions; all other terminal writes and platform mutations stay disabled.",
    nextStep:
      "Enforce explicit approval-to-probe transitions, verify disabled-path audit visibility, and preserve lockouts for Git, MCP, plugin, automation, runtime/profile, and external-service mutation.",
    tone: "active",
    note: "Local-first safety boundaries, live-action approval gates, and redacted audit records are visible before real tool execution."
  },
  {
    target: "Owner testing hardening",
    completion: "In progress",
    plan: "Make live-functionality checks repeatable through a local checklist, failure fixtures, and docs consistency checks.",
    completionPercent: 50,
    latestNote:
      "A provider-neutral checklist and fixture layer now verifies Phase 10B runner contract behavior, disabled mutation paths, redacted audit output, six-surface catalog refresh owner validation, all-catalog provider refresh smoke proofing, slash execution readiness evidence, per-control session-control state evidence, opt-in Phase 3 desktop smoke harnessing, reload-safe owner-visible Phase 3 smoke proof readiness rows, the non-live `npm.cmd run test:phase3:owner-visible` proof-panel check, an actionable diagnostic Phase 3 exit gate, and the non-live `npm.cmd run test:phase11:owner-visible` Owner Command, Proof Freshness, Evidence Records, Release Readiness, owner release traceability, blocker-priority, and packaging-hold proof without automatic execution.",
    nextStep:
      "Run the full local testing checklist, keep `npm.cmd run smoke:phase3` as the recurring opt-in desktop smoke command, run `npm.cmd run test:phase3:owner-visible` for the non-live imported-proof panel check, run `npm.cmd run test:phase11:owner-visible` for the non-live Owner Command, Proof Freshness, Evidence Records, Release Readiness, owner release traceability, blocker-priority, and packaging-hold proof, use the Phase 3 gate actions to clear missing proofs, verify smoke proof rows move browser or non-executed proofs to waiting and desktop executions to ready, review, or blocked across reload and while the app remains open, verify the per-control Owner Testing state chips, approval-to-probe behavior, all-catalog provider refresh smoke, live panel slash execution evidence, live panel control evidence, active-turn interrupt/steer smoke proof, Phase 11 owner command evidence, and disabled-path evidence (terminal, Git, MCP, plugin, automation, runtime, profile, and external), and keep desktop-backed mutation as a future phase.",
    tone: "active",
    note: "Daily local testing and failure-state coverage are being hardened before broader live runner attachment."
  },
  {
    target: "Packaging and installation",
    completion: "Paused",
    plan: "Prepare install, environment, and distribution path for dependable rollout.",
    completionPercent: 20,
    latestNote:
      "The Phase 11 Release Readiness gate now tracks clean checkout, build/test, smoke proof with Phase 3 proof-export detail, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, packaging lock, docs/known limits, final security closure capability, structured release-decision evidence, owner release traceability, and blocker-priority review while packaging remains paused and owner-held.",
    nextStep:
      "Use the Phase 11 Release Readiness, owner release traceability, and blocker-priority panels to record the final release proof after live workflow, provider, migration, audit, Phase 3 traceability, final security closure, owner proof, and release-decision evidence holds are clear; do not package, sign, create installers, push, or resume release actions from this gate.",
    tone: "paused",
    note: "Packaging and installation work is intentionally paused while security and core delivery milestones advance."
  },
  {
    target: "Optional project management lane",
    completion: "In progress",
    plan: "Define the optional lane scope while keeping Arena chat primary.",
    completionPercent: 57,
    latestNote:
      "Pipeline visibility, explicit orchestrator/implementer/validator/integration role-panel plan previews, dispatch previews, linked local runs, handoff packet integrity, integration ownership rows, offline dispatch-review artifact verification, traceability, blocker priority, and owner-visible Phase 7 dispatch proof are added for Arena review.",
    nextStep:
      "Keep secondary, run `npm.cmd run test:phase7:owner-visible`, and keep staged dispatch review proof local before live worker session spawning.",
    tone: "active",
    note:
      "Optional pipeline visibility, role-panel plan previews, dispatch previews, linked local run state, and owner-visible dispatch proof are scaffolded; it remains secondary to Arena chat."
  }
];

export function summarizeMilestoneStatuses(
  milestones: readonly MilestoneStatus[]
): MilestoneStatusSummary {
  let foundNextActive = false;
  const summary: MilestoneStatusSummary = {
    total: 0,
    complete: 0,
    active: 0,
    planned: 0,
    paused: 0,
    averageCompletionPercent: 0,
    nextTarget: "No active milestone",
    nextStep: "No active next step.",
    nextCompletionPercent: 100
  };

  const currentMilestone = milestones.find(
    (milestone) =>
      milestone.current &&
      milestone.completion !== "Complete" &&
      milestone.completion !== "Paused"
  );

  for (const milestone of milestones) {
    summary.total += 1;
    summary.averageCompletionPercent += milestone.completionPercent;
    switch (milestone.completion) {
      case "Complete":
        summary.complete += 1;
        break;
      case "In progress":
        summary.active += 1;
        break;
      case "Planned":
        summary.planned += 1;
        break;
      case "Paused":
        summary.paused += 1;
        break;
      default:
        break;
    }

    if (currentMilestone) {
      continue;
    }

    if (!foundNextActive && milestone.completion !== "Complete" && milestone.completion !== "Paused") {
      foundNextActive = true;
      summary.nextTarget = milestone.target;
      summary.nextStep = milestone.nextStep;
      summary.nextCompletionPercent = milestone.completionPercent;
    }
  }

  if (currentMilestone) {
    summary.nextTarget = currentMilestone.target;
    summary.nextStep = currentMilestone.nextStep;
    summary.nextCompletionPercent = currentMilestone.completionPercent;
  }

  if (summary.total > 0) {
    summary.averageCompletionPercent = Math.round(
      summary.averageCompletionPercent / summary.total
    );
  }

  return summary;
}
