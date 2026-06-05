export type MilestoneCompletion = "Complete" | "In progress" | "Planned" | "Paused";

export type MilestoneTone = "complete" | "active" | "planned" | "paused";

export interface MilestoneStatus {
  target: string;
  completion: MilestoneCompletion;
  plan: string;
  completionPercent: number;
  latestNote: string;
  nextStep: string;
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
    completion: "Complete",
    plan: "Establish a stable baseline structure, public docs contract, and navigation foundations.",
    completionPercent: 100,
    latestNote:
      "Initial platform scaffolding, public milestone reporting format, and baseline docs are complete.",
    nextStep: "Monitor for documentation drift and align updates with routine roadmap reviews.",
    tone: "complete",
    note: "Core Steerboard structure, navigation baseline, and documentation skeleton are in place."
  },
  {
    target: "Cockpit monitor and operating modes",
    completion: "In progress",
    plan: "Complete core cockpit panels, control affordances, and visible operating-mode cues.",
    completionPercent: 90,
    latestNote:
      "Monitor-depth and mode-handoff QA are now visible in the cockpit, with final interaction-readiness coverage for mode, layout, focus, and clear controls.",
    nextStep:
      "Complete final desktop and narrow-pane acceptance pass, then close the cockpit operating modes milestone.",
    tone: "active",
    note:
      "The cockpit monitor includes visible milestone/status tracking, panel focus/highlight controls, and toolbar actions to focus or clear the current attention panel."
  },
  {
    target: "Orchestration model",
    completion: "Planned",
    plan: "Define a consistent model for sequencing cross-cutting tasks and status propagation.",
    completionPercent: 30,
    latestNote: "Initial orchestration patterns are drafted, with shared lifecycle semantics under active design.",
    nextStep:
      "Expand execution rules and complete dependency ordering for broader subsystem coverage.",
    tone: "planned",
    note:
      "Standardized orchestration flow is being finalized to coordinate cockpit tasks and health signals."
  },
  {
    target: "Runtime adapters",
    completion: "In progress",
    plan: "Deliver and stabilize adapter surfaces for consistent runtime status intake.",
    completionPercent: 45,
    latestNote: "Key adapter boundaries are in place, and interface contracts are being aligned.",
    nextStep: "Validate adapter behavior against core runtime entry points and close remaining gaps.",
    tone: "active",
    note:
      "Adapter interfaces are being stabilized across runtime surfaces to support consistent signal ingestion."
  },
  {
    target: "Security and privacy model",
    completion: "Planned",
    plan: "Set baseline protections, data-handling boundaries, and reviewable controls.",
    completionPercent: 20,
    latestNote: "Security and privacy requirements are being translated into an initial shared model.",
    nextStep: "Complete threat modeling and publish practical control guidance for implementation.",
    tone: "planned",
    note: "Security and privacy posture is being documented, with production controls being designed for release readiness."
  },
  {
    target: "Packaging and installation",
    completion: "Planned",
    plan: "Prepare install, environment, and distribution path for dependable rollout.",
    completionPercent: 15,
    latestNote: "Basic packaging decisions are started and setup planning is underway.",
    nextStep: "Finalize release packaging and installation scripts for repeatable onboarding.",
    tone: "planned",
    note: "Distribution, environment setup, and installation workflow are being prepared for dependable rollout."
  },
  {
    target: "Optional project management lane",
    completion: "Paused",
    plan: "Define the optional lane scope and keep it intentionally dormant unless priority changes.",
    completionPercent: 0,
    latestNote: "Paused: optional lane is deferred while core delivery milestones advance.",
    nextStep:
      "Remain paused; reassess only after critical milestones move to a stable operating state.",
    tone: "paused",
    note:
      "Optional by design and clearly not the current development focus while core cockpit milestones are completed."
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

    if (
      !foundNextActive &&
      milestone.completion !== "Complete" &&
      milestone.completion !== "Paused"
    ) {
      foundNextActive = true;
      summary.nextTarget = milestone.target;
      summary.nextStep = milestone.nextStep;
      summary.nextCompletionPercent = milestone.completionPercent;
    }
  }

  if (summary.total > 0) {
    summary.averageCompletionPercent = Math.round(
      summary.averageCompletionPercent / summary.total
    );
  }

  return summary;
}
