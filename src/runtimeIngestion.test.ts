import { describe, expect, it } from "vitest";
import {
  buildRuntimeIngestionPreview,
  summarizeRuntimeIngestion,
  type RuntimeIngestionEvent
} from "./runtimeIngestion";
import type { AdapterContractItem } from "./adapterContract";
import type { RunTimelineEvent } from "./runEvents";

describe("runtime ingestion preview", () => {
  it("accepts run/task/session/validation events when adapter event contracts are ready", () => {
    const events: RunTimelineEvent[] = [
      {
        id: "run-0",
        kind: "run",
        label: "Run event",
        detail: "Run detail",
        actor: "Scheduler",
        status: "running",
        sequence: 0,
        createdAt: "2026-06-04T08:00:00.000Z"
      },
      {
        id: "task-0",
        kind: "task",
        label: "Task event",
        detail: "Task detail",
        actor: "Agent",
        status: "running",
        sequence: 1,
        createdAt: "2026-06-04T08:00:01.000Z"
      },
      {
        id: "session-0",
        kind: "session",
        label: "Session event",
        detail: "Session detail",
        actor: "Runtime",
        status: "ready",
        sequence: 2,
        createdAt: "2026-06-04T08:00:02.000Z"
      },
      {
        id: "validation-0",
        kind: "validation",
        label: "Validation event",
        detail: "Validation detail",
        actor: "Validation",
        status: "passed",
        sequence: 3,
        createdAt: "2026-06-04T08:00:03.000Z"
      }
    ];

    const contractItems: AdapterContractItem[] = [
      {
        id: "local:transport",
        kind: "transport",
        label: "Transport",
        detail: "local",
        status: "ready"
      },
      {
        id: "local:event:session",
        kind: "event",
        label: "Event",
        detail: "session",
        status: "ready"
      },
      {
        id: "local:event:task",
        kind: "event",
        label: "Event",
        detail: "task",
        status: "ready"
      },
      {
        id: "local:event:validation",
        kind: "event",
        label: "Event",
        detail: "validation",
        status: "ready"
      }
    ];

    const preview = buildRuntimeIngestionPreview(events, contractItems);

    expect(preview).toEqual([
      {
        id: "run-0:ingestion",
        sourceEventId: "run-0",
        eventKind: "run",
        label: "Run event",
        detail: "Adapter detail: session; source status: running",
        adapterStatus: "accepted",
        reason: "Adapter accepts this event.",
        sequence: 0
      },
      {
        id: "task-0:ingestion",
        sourceEventId: "task-0",
        eventKind: "task",
        label: "Task event",
        detail: "Adapter detail: task; source status: running",
        adapterStatus: "accepted",
        reason: "Adapter accepts this event.",
        sequence: 1
      },
      {
        id: "session-0:ingestion",
        sourceEventId: "session-0",
        eventKind: "session",
        label: "Session event",
        detail: "Adapter detail: session; source status: ready",
        adapterStatus: "accepted",
        reason: "Adapter accepts this event.",
        sequence: 2
      },
      {
        id: "validation-0:ingestion",
        sourceEventId: "validation-0",
        eventKind: "validation",
        label: "Validation event",
        detail: "Adapter detail: validation; source status: passed",
        adapterStatus: "accepted",
        reason: "Adapter accepts this event.",
        sequence: 3
      }
    ]);

    expect(preview).toHaveLength(events.length);
    expect(preview.map((item) => item.sequence)).toEqual(events.map((item) => item.sequence));
  });

  it("returns review statuses for review adapter event items", () => {
    const events: RunTimelineEvent[] = [
      {
        id: "task-1",
        kind: "task",
        label: "Task needs review",
        detail: "Needs review",
        actor: "Agent",
        status: "queued",
        sequence: 0,
        createdAt: "2026-06-04T09:00:00.000Z"
      }
    ];

    const contractItems: AdapterContractItem[] = [
      {
        id: "local:event:task",
        kind: "event",
        label: "Event",
        detail: "task",
        status: "review"
      }
    ];

    const preview = buildRuntimeIngestionPreview(events, contractItems);
    const summary = summarizeRuntimeIngestion(preview);

    expect(preview).toHaveLength(1);
    expect(preview[0].adapterStatus).toBe("review");
    expect(preview[0].reason).toBe("Adapter requires setup review for this event.");
    expect(summary).toEqual({ total: 1, accepted: 0, review: 1, blocked: 0, readiness: 0 });
  });

  it("returns blocked statuses when adapter blocks or omits an event", () => {
    const events: RunTimelineEvent[] = [
      {
        id: "run-1",
        kind: "run",
        label: "Blocked run event",
        detail: "Run detail",
        actor: "Scheduler",
        status: "failed",
        sequence: 0,
        createdAt: "2026-06-04T10:00:00.000Z"
      },
      {
        id: "validation-1",
        kind: "validation",
        label: "Missing validation event",
        detail: "Validation detail",
        actor: "Validation",
        status: "failed",
        sequence: 1,
        createdAt: "2026-06-04T10:00:01.000Z"
      }
    ];

    const contractItems: AdapterContractItem[] = [
      {
        id: "local:event:session",
        kind: "event",
        label: "Event",
        detail: "session",
        status: "blocked"
      },
      {
        id: "local:event:task",
        kind: "event",
        label: "Event",
        detail: "task",
        status: "ready"
      }
    ];

    const preview = buildRuntimeIngestionPreview(events, contractItems);
    const summary = summarizeRuntimeIngestion(preview);

    expect(preview).toEqual([
      {
        id: "run-1:ingestion",
        sourceEventId: "run-1",
        eventKind: "run",
        label: "Blocked run event",
        detail: "Adapter detail: session; source status: failed",
        adapterStatus: "blocked",
        reason: "Adapter blocks this event.",
        sequence: 0
      },
      {
        id: "validation-1:ingestion",
        sourceEventId: "validation-1",
        eventKind: "validation",
        label: "Missing validation event",
        detail: "Adapter detail: validation; source status: failed",
        adapterStatus: "blocked",
        reason: "Adapter does not expose this event kind.",
        sequence: 1
      }
    ]);

    expect(summary).toEqual({ total: 2, accepted: 0, review: 0, blocked: 2, readiness: 0 });
  });
});

describe("runtime ingestion summary", () => {
  it("counts accepted, review, blocked events and computes readiness", () => {
    const preview: RuntimeIngestionEvent[] = [
      {
        id: "a:ingestion",
        sourceEventId: "a",
        eventKind: "run",
        label: "Run",
        detail: "Adapter detail: session; source status: running",
        adapterStatus: "accepted" as const,
        reason: "Adapter accepts this event.",
        sequence: 0
      },
      {
        id: "b:ingestion",
        sourceEventId: "b",
        eventKind: "task",
        label: "Task",
        detail: "Adapter detail: task; source status: running",
        adapterStatus: "review" as const,
        reason: "Adapter requires setup review for this event.",
        sequence: 1
      },
      {
        id: "c:ingestion",
        sourceEventId: "c",
        eventKind: "validation",
        label: "Validation",
        detail: "Adapter detail: validation; source status: failed",
        adapterStatus: "blocked" as const,
        reason: "Adapter blocks this event.",
        sequence: 2
      }
    ];

    expect(summarizeRuntimeIngestion(preview)).toEqual({
      total: 3,
      accepted: 1,
      review: 1,
      blocked: 1,
      readiness: 33
    });
  });

  it("does not mutate timeline or contract inputs", () => {
    const events: RunTimelineEvent[] = [
      {
        id: "run-2",
        kind: "run",
        label: "Run",
        detail: "Run",
        actor: "Scheduler",
        status: "ready",
        sequence: 0,
        createdAt: "2026-06-04T11:00:00.000Z"
      }
    ];
    const contractItems: AdapterContractItem[] = [
      {
        id: "local:event:session",
        kind: "event",
        label: "Event",
        detail: "session",
        status: "ready"
      }
    ];

    const eventSnapshot = JSON.parse(JSON.stringify(events));
    const contractSnapshot = JSON.parse(JSON.stringify(contractItems));

    buildRuntimeIngestionPreview(events, contractItems);

    expect(events).toEqual(eventSnapshot);
    expect(contractItems).toEqual(contractSnapshot);
  });
});
