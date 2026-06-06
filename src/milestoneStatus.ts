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
      "Local shell, public docs, navigation, and cockpit scaffolding are in place.",
    nextStep: "Keep scaffold stable while live provider integration starts.",
    tone: "active",
    note: "Local desktop shell, public fixture data, project sidebar, cockpit layouts, and docs are available for review."
  },
  {
    target: "Cockpit monitor and operating modes",
    completion: "In progress",
    plan: "Complete core cockpit panels, control affordances, and visible operating-mode cues.",
    completionPercent: 66,
    latestNote:
      "Multi-panel cockpit, adaptive magnetic layout with project stack drag-in, session drag-in, drop previews, keyboard adjustment, and adaptive project-drop template selection exist; local chat-lane scaffolding includes panel-keyed live session chat, per-panel session controls, visible unsupported-control evidence, owner-testing control readiness evidence, duplicate session identity guards, and native two-panel plus active-turn interrupt and steer smoke proof paths.",
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
    completionPercent: 53,
    latestNote:
      "Local orchestration now creates explicit orchestrator, implementer, validator, and integration role-panel plans for cockpit review, with handoff and retry state visible before external dispatch.",
    nextStep:
      "Connect the role-panel plan preview loop to staged dispatch records while preserving local-first review before live worker session spawning.",
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
    plan: "Connect runtime auth/session transport to cockpit panels.",
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
    completionPercent: 56,
    latestNote:
      "Platform command, skill, plugin, MCP, automation, and personalization capability surfaces refresh through ready/preview/setup-required/blocked/unsupported/unavailable states. Panel composers restrict slash suggestions and decisions to panel-scoped commands, provider-routed slash submissions leave explicit transcript evidence, and owner testing now evaluates slash-command execution plus session-control readiness from transcript proof without executing commands. The connection dialog still runs an all-catalog provider refresh smoke proof across six metadata/status surfaces without execution.",
    nextStep:
      "Run live provider-routed slash and session-control checks in desktop mode and verify Owner Testing evidence moves from review to ready, then keep the connection dialog catalog smoke as the recurring provider-refresh regression check while arbitrary terminal commands, Git mutation, MCP/plugin/automation execution, runtime/profile mutation, and external-service actions remain disabled.",
    current: true,
    tone: "active",
    note:
      "Panel-scoped slash commands, Skills catalog, platform catalogs, migration preview, and risk-gated approval/audit foundations exist; broader provider refresh and full execution remain live-disabled."
  },
  {
    target: "Migration Center",
    completion: "In progress",
    plan: "Implement safe migration metadata review and safe-to-apply profile transitions.",
    completionPercent: 30,
    latestNote:
      "Reviewed profile-draft persistence and rollback/audit summaries are now part of the migration milestone; migration remains metadata-only, with secrets, raw transcripts, and source mutation excluded.",
    nextStep:
      "Keep migration metadata checks owner-reviewed, verify rollback audit coverage, and require explicit apply before changing active profile state.",
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
    completionPercent: 39,
    latestNote:
      "A provider-neutral checklist and fixture layer now verifies Phase 10B runner contract behavior, disabled mutation paths, redacted audit output, six-surface catalog refresh owner validation, all-catalog provider refresh smoke proofing, slash execution readiness evidence, and session-control readiness evidence without execution.",
    nextStep:
      "Run the full local testing checklist, verify approval-to-probe behavior, all-catalog provider refresh smoke, live panel slash execution evidence, live panel control evidence, and disabled-path evidence (terminal, Git, MCP, plugin, automation, runtime, profile, and external), and keep desktop-backed mutation as a future phase.",
    tone: "active",
    note: "Daily local testing and failure-state coverage are being hardened before broader live runner attachment."
  },
  {
    target: "Packaging and installation",
    completion: "Paused",
    plan: "Prepare install, environment, and distribution path for dependable rollout.",
    completionPercent: 0,
    latestNote: "Packaging is intentionally deferred until core development is complete.",
    nextStep: "Remain paused until core development is complete.",
    tone: "paused",
    note: "Packaging and installation work is intentionally paused while security and core delivery milestones advance."
  },
  {
    target: "Optional project management lane",
    completion: "In progress",
    plan: "Define the optional lane scope while keeping cockpit chat primary.",
    completionPercent: 30,
    latestNote:
      "Pipeline visibility, explicit orchestrator/implementer/validator/integration role-panel plan previews, dispatch previews, and linked local runs for cockpit review are added.",
    nextStep:
      "Keep secondary and connect staged role-panel plan previews to dispatch history, then continue provider readiness work after live chat hardening.",
    tone: "active",
    note:
      "Optional pipeline visibility, role-panel plan previews, dispatch previews, and linked local run state are scaffolded; it remains secondary to cockpit chat."
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
