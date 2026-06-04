export type MilestoneCompletion = "Complete" | "In progress" | "Planned" | "Paused";

export type MilestoneTone = "complete" | "active" | "planned" | "paused";

export interface MilestoneStatus {
  target: string;
  completion: MilestoneCompletion;
  note: string;
  tone: MilestoneTone;
}

export interface MilestoneStatusSummary {
  total: number;
  complete: number;
  active: number;
  planned: number;
  paused: number;
}

export const steerboardMilestoneStatuses: MilestoneStatus[] = [
  {
    target: "Product scaffold",
    completion: "Complete",
    tone: "complete",
    note: "Core Steerboard structure, navigation baseline, and documentation skeleton are in place."
  },
  {
    target: "Cockpit monitor and operating modes",
    completion: "In progress",
    tone: "active",
    note:
      "Visible milestone status is available in the right panel alongside compact runtime/worker, tool-coverage, latest-activity, and validation visibility."
  },
  {
    target: "Orchestration model",
    completion: "Planned",
    tone: "planned",
    note: "A standard orchestration model is being finalized to coordinate cockpit tasks and health signals."
  },
  {
    target: "Runtime adapters",
    completion: "In progress",
    tone: "active",
    note:
      "Adapter interfaces are being stabilized across runtime surfaces so cockpit signals can be consumed consistently."
  },
  {
    target: "Security and privacy model",
    completion: "Planned",
    tone: "planned",
    note: "Security and privacy posture are being documented and shaped into release-ready controls."
  },
  {
    target: "Packaging and installation",
    completion: "Planned",
    tone: "planned",
    note: "Distribution packaging, environment setup, and install workflow are being prepared for dependable rollout."
  },
  {
    target: "Optional project management lane",
    completion: "Paused",
    tone: "paused",
    note:
      "This lane is intentionally optional and not the current core focus while cockpit milestones are completed."
  }
];

export function summarizeMilestoneStatuses(
  milestones: readonly MilestoneStatus[]
): MilestoneStatusSummary {
  const summary: MilestoneStatusSummary = {
    total: 0,
    complete: 0,
    active: 0,
    planned: 0,
    paused: 0
  };

  for (const milestone of milestones) {
    summary.total += 1;
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
  }

  return summary;
}
