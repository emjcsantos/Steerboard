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
    completionPercent: 58,
    latestNote:
      "Multi-panel cockpit and local chat-lane scaffold exist; visible panels can use panel-keyed live Codex chat and per-panel session controls, with native two-panel smoke still pending.",
    nextStep:
      "Run native two-panel smoke and live-control smoke, then continue command capability work.",
    tone: "active",
    note:
      "Cockpit layouts, local monitor previews, and chat-lane scaffolding exist, but live provider-backed behavior is not complete."
  },
  {
    target: "Orchestration model",
    completion: "In progress",
    plan: "Define a consistent model for sequencing cross-cutting tasks and status propagation.",
    completionPercent: 52,
    latestNote:
      "Local orchestration now creates orchestrator, implementer, validator, and integration panels with visible handoff and retry state.",
    nextStep:
      "Connect the local handoff loop to configured runtime profiles and live worker session spawning.",
    current: true,
    tone: "active",
    note:
      "Local runs, task state, validation gates, handoff previews, and retry state are modeled before live runtime dispatch."
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
    target: "Live Codex integration",
    completion: "In progress",
    plan: "Connect real Codex auth/session transport to cockpit panels.",
    completionPercent: 42,
    latestNote:
      "Codex app-server bridge now supports no-prompt readiness, explicit live smoke, panel-keyed sessions, visible-panel live chat paths, and interrupt/retry/steer foundations.",
    nextStep:
      "Run native two-panel smoke and live-control smoke as recurring regression checks.",
    tone: "active",
    note:
      "Codex connection center, app-server bridge, live panel chat, and normalized stream ingestion are the next core milestone."
  },
  {
    target: "Platform capabilities",
    completion: "In progress",
    plan: "Make commands, plugins, automations, MCP, personalization, permissions, and audit state live.",
    completionPercent: 28,
    latestNote:
      "Slash commands, platform catalogs, and migration preview/profile-draft foundations are provider-neutral and state-aware.",
    nextStep:
      "Connect provider refresh, reviewed import persistence, and permission gates.",
    tone: "active",
    note:
      "Slash commands, platform catalogs, and migration preview now have provider-neutral foundations; provider refresh, execution, permissions, and audit still need live backing."
  },
  {
    target: "Security and privacy model",
    completion: "In progress",
    plan: "Set baseline protections, data-handling boundaries, and reviewable controls.",
    completionPercent: 30,
    latestNote:
      "Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening.",
    nextStep:
      "Add provider credential, permission, and audit acceptance criteria before live execution.",
    tone: "active",
    note: "Baseline local-first boundaries exist, but live provider permissions, secret handling, and audit gates still need implementation."
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
    completionPercent: 25,
    latestNote: "Pipeline visibility, dispatch previews, linked local runs, and readiness language are scaffolded.",
    nextStep:
      "Keep secondary and connect it to provider capability readiness after live chat works.",
    tone: "active",
    note:
      "Optional pipeline visibility, dispatch previews, and linked local run state are scaffolded; it remains secondary to cockpit chat."
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
