import type { AdapterContractItem } from "./adapterContract";
import type { RunTimelineEvent, RunTimelineEventKind } from "./runEvents";

export type RuntimeIngestionStatus = "accepted" | "review" | "blocked";

export interface RuntimeIngestionEvent {
  id: string;
  sourceEventId: string;
  eventKind: RunTimelineEventKind;
  label: string;
  detail: string;
  adapterStatus: RuntimeIngestionStatus;
  reason: string;
  sequence: number;
}

export interface RuntimeIngestionSummary {
  total: number;
  accepted: number;
  review: number;
  blocked: number;
  readiness: number;
}

const kindToAdapterDetail: Record<RunTimelineEventKind, string> = {
  run: "session",
  task: "task",
  session: "session",
  validation: "validation"
};

function determineAdapterStatusAndReason(
  contractItem?: AdapterContractItem
): { status: RuntimeIngestionStatus; reason: string } {
  if (!contractItem) {
    return {
      status: "blocked",
      reason: "Adapter does not expose this event kind."
    };
  }

  if (contractItem.status === "ready") {
    return {
      status: "accepted",
      reason: "Adapter accepts this event."
    };
  }

  if (contractItem.status === "review") {
    return {
      status: "review",
      reason: "Adapter requires setup review for this event."
    };
  }

  return {
    status: "blocked",
    reason: "Adapter blocks this event."
  };
}

export function buildRuntimeIngestionPreview(
  events: readonly RunTimelineEvent[],
  contractItems: readonly AdapterContractItem[]
): RuntimeIngestionEvent[] {
  return events.map((event) => {
    const adapterDetail = kindToAdapterDetail[event.kind];
    const adapterItem = contractItems.find(
      (contractItem) =>
        contractItem.kind === "event" && contractItem.detail === adapterDetail
    );
    const { status, reason } = determineAdapterStatusAndReason(adapterItem);

    return {
      id: `${event.id}:ingestion`,
      sourceEventId: event.id,
      eventKind: event.kind,
      label: event.label,
      detail: `Adapter detail: ${adapterDetail}; source status: ${event.status}`,
      adapterStatus: status,
      reason,
      sequence: event.sequence
    };
  });
}

export function summarizeRuntimeIngestion(
  events: readonly RuntimeIngestionEvent[]
): RuntimeIngestionSummary {
  const summary = events.reduce<RuntimeIngestionSummary>(
    (running, event) => ({
      total: running.total + 1,
      accepted: running.accepted + (event.adapterStatus === "accepted" ? 1 : 0),
      review: running.review + (event.adapterStatus === "review" ? 1 : 0),
      blocked: running.blocked + (event.adapterStatus === "blocked" ? 1 : 0),
      readiness: running.readiness
    }),
    {
      total: 0,
      accepted: 0,
      review: 0,
      blocked: 0,
      readiness: 0
    }
  );

  return {
    ...summary,
    readiness: summary.total === 0 ? 0 : Math.round((summary.accepted / summary.total) * 100)
  };
}
