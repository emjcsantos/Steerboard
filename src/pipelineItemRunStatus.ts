import type { PipelineItem } from "./fixtures";
import type { MockOrchestratorRun, MockRunStatus } from "./run";
import { buildPipelineItemRunLinks, type PipelineItemRunLink } from "./pipelineItemRunLink";

export interface PipelineItemRunStatusSummary {
  linkCount: number;
  latestRunId?: string;
  latestStatus?: MockRunStatus;
  latestCreatedAt?: string;
  activeCount: number;
  issueCount: number;
  completeCount: number;
  queuedCount: number;
  label: string;
  detail: string;
}

function buildNoLinksSummary(): PipelineItemRunStatusSummary {
  return {
    linkCount: 0,
    latestRunId: undefined,
    latestStatus: undefined,
    latestCreatedAt: undefined,
    activeCount: 0,
    issueCount: 0,
    completeCount: 0,
    queuedCount: 0,
    label: "No runs",
    detail: "No linked cockpit runs yet."
  };
}

function isRunningStatus(status: PipelineItemRunLink["status"]): boolean {
  return status === "running";
}

function isIssueStatus(status: PipelineItemRunLink["status"]): boolean {
  return status === "blocked" || status === "failed";
}

function isCompleteStatus(status: PipelineItemRunLink["status"]): boolean {
  return status === "complete";
}

function isQueuedStatus(status: PipelineItemRunLink["status"]): boolean {
  return status === "queued";
}

function buildLabel(latestStatus: PipelineItemRunLink["status"] | undefined): string {
  switch (latestStatus) {
    case "running":
      return "Running";
    case "queued":
      return "Queued";
    case "complete":
      return "Complete";
    case "blocked":
      return "Blocked";
    case "failed":
      return "Failed";
    default:
      return "Linked";
  }
}

export function summarizePipelineItemRunStatus(
  item: PipelineItem,
  runs: readonly MockOrchestratorRun[]
): PipelineItemRunStatusSummary {
  const links = buildPipelineItemRunLinks(item, runs, Number.POSITIVE_INFINITY);

  if (links.length === 0) {
    return buildNoLinksSummary();
  }

  let activeCount = 0;
  let issueCount = 0;
  let completeCount = 0;
  let queuedCount = 0;

  for (const link of links) {
    if (isRunningStatus(link.status)) {
      activeCount += 1;
    }

    if (isIssueStatus(link.status)) {
      issueCount += 1;
    }

    if (isCompleteStatus(link.status)) {
      completeCount += 1;
    }

    if (isQueuedStatus(link.status)) {
      queuedCount += 1;
    }
  }

  const latest = links[0];

  return {
    linkCount: links.length,
    latestRunId: latest.runId,
    latestStatus: latest.status,
    latestCreatedAt: latest.createdAt,
    activeCount,
    issueCount,
    completeCount,
    queuedCount,
    label: buildLabel(latest.status),
    detail: `${links.length} linked run${links.length === 1 ? "" : "s"} | active: ${activeCount} | issues: ${issueCount} | complete: ${completeCount} | queued: ${queuedCount}`
  };
}
