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
    completion: "Complete",
    plan: "Complete core cockpit panels, control affordances, and visible operating-mode cues.",
    completionPercent: 100,
    latestNote:
      "Final desktop and narrow-pane acceptance coverage is complete for cockpit monitor depth, mode handoff QA, and mode/layout/focus/clear interaction readiness.",
    nextStep:
      "Monitor for regressions while orchestration and runtime adapter milestones advance.",
    tone: "complete",
    note:
      "The cockpit monitor includes visible milestone/status tracking, panel focus/highlight controls, and toolbar actions to focus or clear the current attention panel."
  },
  {
    target: "Orchestration model",
    completion: "Complete",
    plan: "Define a consistent model for sequencing cross-cutting tasks and status propagation.",
    completionPercent: 100,
    latestNote:
      "Final orchestration acceptance coverage now confirms lifecycle signals, task coverage, regression checks, and run closure evidence for end-to-end monitoring.",
    nextStep:
      "Monitor orchestration regressions while runtime adapter validation advances.",
    tone: "complete",
    note:
      "Standardized orchestration flow is being finalized to coordinate cockpit tasks and health signals."
  },
  {
    target: "Runtime adapters",
    completion: "Complete",
    plan: "Deliver and stabilize adapter surfaces for consistent runtime status intake.",
    completionPercent: 100,
    latestNote:
      "Runtime adapter recovery and external-source failure-state coverage now closes the runtime intake milestone with visible recovery, source, failure, and safe-handoff checks.",
    nextStep:
      "Monitor runtime adapter regressions while security and privacy controls advance.",
    tone: "complete",
    note:
      "Adapter interfaces are being stabilized across runtime surfaces to support consistent signal ingestion."
  },
  {
    target: "Security and privacy model",
    completion: "In progress",
    plan: "Set baseline protections, data-handling boundaries, and reviewable controls.",
    completionPercent: 55,
    latestNote: "Release/privacy readiness gates are now defined and visible for release promotion checks.",
    nextStep: "Harden release privacy gates against real project data and runtime adapter edge cases.",
    tone: "active",
    note: "Security and privacy posture is being documented, with production controls being designed for release readiness."
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
