import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import type { PlanningDraft } from "./planning";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import { buildRuntimeStreamSnapshot } from "./runtimeStream";
import { createMockRunFromDispatchPackage } from "./run";
import type { MockOrchestratorRun } from "./run";
import { buildRunTimeline, summarizeRunTimeline } from "./runEvents";
import { buildCockpitMonitorSummary } from "./cockpitMonitorSummary";

const testProject = {
  id: "monitor-project",
  name: "Monitor Project"
};

const baseDraft: PlanningDraft = {
  title: "Monitor fixture",
  objective: "Build a compact Arena monitor summary for local run visibility.",
  targetProjectId: testProject.id,
  scope: ["Summary model", "Stream model"],
  fileAreas: ["src/cockpitMonitorSummary.ts"],
  acceptanceCriteria: [
    "Summary is deterministic.",
    "No run metadata payload leaks through the summary detail."
  ],
  validationPlan: ["npm run test -- src/cockpitMonitorSummary.test.ts"],
  risk: "low",
  rollbackNote: "No rollback required for this fixture.",
  deployMode: "dry-run"
};

function buildDraftRun(status: MockOrchestratorRun["status"], idSeed: string): MockOrchestratorRun {
  const dispatchPackage = buildDispatchPackage(baseDraft, testProject, {
    idSeed,
    createdAt: "2026-06-04T10:00:00.000Z",
    status: "ready"
  });

  return createMockRunFromDispatchPackage(dispatchPackage, {
    idSeed,
    createdAt: "2026-06-04T10:00:00.000Z",
    status
  });
}

function makeIngestionEvent(
  id: string,
  adapterStatus: RuntimeIngestionEvent["adapterStatus"]
): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}:source`,
    eventKind: "run",
    label: `${id} label`,
    detail: `${id} detail`,
    adapterStatus,
    reason: `${adapterStatus} reason`,
    sequence: Number(id.replace("evt-", ""))
  };
}

describe("Arena monitor summary", () => {
  it("returns deterministic no-run defaults", () => {
    const timeline = summarizeRunTimeline([]);
    const stream = buildRuntimeStreamSnapshot([], 0, "idle");
    const summary = buildCockpitMonitorSummary(undefined, timeline, stream);

    expect(summary).toEqual({
      runLabel: "No run selected",
      runState: "none",
      timelineTotal: 0,
      activeCount: 0,
      issueCount: 0,
      completeCount: 0,
      streamLabel: "Idle",
      streamState: "idle",
      streamProgressLabel: "0/0 emitted",
      streamProgressPercent: 0,
      streamProgressValue: "0%",
      pendingCount: 0,
      blockedCount: 0,
      latestEventLabel: "Waiting for first local event.",
      latestEventStatus: "idle",
      latestEventDetail: "No emitted events yet.",
      detail: "Select or stage a run to monitor local Arena activity."
    });
  });

  it("builds streaming summary with run state, timeline counts, and stream progress", () => {
    const run = buildDraftRun("running", "monitor-streaming");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [
        makeIngestionEvent("evt-1", "accepted"),
        makeIngestionEvent("evt-2", "review"),
        makeIngestionEvent("evt-3", "accepted")
      ],
      1,
      "streaming"
    );
    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.runLabel).toBe(run.title);
    expect(summary.runState).toBe("running");
    expect(summary.streamState).toBe("streaming");
    expect(summary.streamLabel).toBe("Streaming");
    expect(summary.streamProgressLabel).toBe("1/3 emitted");
    expect(summary.streamProgressPercent).toBe(33);
    expect(summary.streamProgressValue).toBe("33%");
    expect(summary.timelineTotal).toBe(timelineSummary.total);
  });

  it("surfaces waiting cue when stream is attached but has not emitted events", () => {
    const run = buildDraftRun("running", "monitor-waiting");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot([], 0, "streaming");
    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.latestEventLabel).toBe("Waiting for first local event.");
    expect(summary.latestEventStatus).toBe("none");
    expect(summary.latestEventDetail).toBe("No emitted events yet.");
    expect(summary.streamProgressPercent).toBe(0);
    expect(summary.streamProgressValue).toBe("0%");
  });

  it("safeguards over-total and non-finite stream totals", () => {
    const run = buildDraftRun("running", "monitor-progress-safety");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [makeIngestionEvent("evt-1", "accepted"), makeIngestionEvent("evt-2", "accepted")],
      2,
      "streaming"
    );
    const snapshotCopy = structuredClone(snapshot);
    const badSnapshot = {
      ...snapshot,
      emitted: 5,
      total: 2
    };
    const nonFiniteSnapshot = {
      ...snapshot,
      emitted: 1,
      total: Infinity
    };

    const clampedSummary = buildCockpitMonitorSummary(run, timelineSummary, badSnapshot);
    const nonFiniteSummary = buildCockpitMonitorSummary(run, timelineSummary, nonFiniteSnapshot);

    expect(clampedSummary.streamProgressPercent).toBe(100);
    expect(clampedSummary.streamProgressValue).toBe("100%");
    expect(nonFiniteSummary.streamProgressPercent).toBe(0);
    expect(nonFiniteSummary.streamProgressValue).toBe("0%");
    expect(snapshot).toEqual(snapshotCopy);
  });

  it("uses public-safe latest event metadata from the runtime stream", () => {
    const run = buildDraftRun("running", "monitor-latest-event");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [
        makeIngestionEvent("evt-1", "accepted"),
        makeIngestionEvent("evt-2", "review")
      ],
      2,
      "streaming"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.latestEventLabel).toBe("Latest run event");
    expect(summary.latestEventStatus).toBe("review");
    expect(summary.latestEventDetail).toBe("review: review reason");
  });

  it("sanitizes path-like latest event cue content", () => {
    const run = buildDraftRun("running", "monitor-latest-event-safety");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const event = makeIngestionEvent("evt-1", "blocked");
    const snapshot = buildRuntimeStreamSnapshot(
      [
        {
          ...event,
          label: "C:\\private\\event.ts",
          reason: "/private/source failed"
        }
      ],
      1,
      "paused"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.latestEventLabel).not.toContain("/");
    expect(summary.latestEventLabel).not.toContain("\\");
    expect(summary.latestEventStatus).not.toContain("/");
    expect(summary.latestEventStatus).not.toContain("\\");
    expect(summary.latestEventDetail).not.toContain("/");
    expect(summary.latestEventDetail).not.toContain("\\");
    expect(summary.latestEventDetail).toBe("blocked: private source failed");
  });

  it("labels blocked stream state when events contain blocked items", () => {
    const run = buildDraftRun("running", "monitor-blocked");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [makeIngestionEvent("evt-1", "accepted"), makeIngestionEvent("evt-2", "blocked")],
      2,
      "streaming"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.streamState).toBe("blocked");
    expect(summary.streamLabel).toBe("Blocked");
    expect(summary.blockedCount).toBe(1);
  });

  it("maps paused stream state correctly", () => {
    const run = buildDraftRun("queued", "monitor-paused");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [makeIngestionEvent("evt-1", "review"), makeIngestionEvent("evt-2", "accepted")],
      2,
      "paused"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.streamState).toBe("paused");
    expect(summary.streamLabel).toBe("Paused");
  });

  it("propagates stream and timeline counts into summary fields", () => {
    const run = buildDraftRun("complete", "monitor-counts");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [
        makeIngestionEvent("evt-1", "accepted"),
        makeIngestionEvent("evt-2", "review"),
        makeIngestionEvent("evt-3", "accepted"),
        makeIngestionEvent("evt-4", "blocked")
      ],
      3,
      "streaming"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.timelineTotal).toBe(timelineSummary.total);
    expect(summary.activeCount).toBe(timelineSummary.activeCount);
    expect(summary.issueCount).toBe(timelineSummary.issueCount);
    expect(summary.completeCount).toBe(timelineSummary.completeCount);
    expect(summary.pendingCount).toBe(snapshot.pending);
    expect(summary.blockedCount).toBe(snapshot.blocked);
  });

  it("uses a safe fallback stream label for unexpected stream state", () => {
    const run = buildDraftRun("running", "monitor-fallback");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const streamSnapshot = buildRuntimeStreamSnapshot(
      [makeIngestionEvent("evt-1", "accepted")],
      1,
      "streaming"
    );
    const unexpectedStateSnapshot = {
      ...streamSnapshot,
      state: "suspended"
    } as unknown as typeof streamSnapshot;

    const summary = buildCockpitMonitorSummary(run, timelineSummary, unexpectedStateSnapshot);

    expect(summary.streamLabel).toBe("Stream");
    expect(summary.streamState).toBe("suspended");
  });

  it("does not mutate run, timeline, or stream arguments", () => {
    const run = buildDraftRun("running", "monitor-immutability");
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshotEvents = [
      makeIngestionEvent("evt-1", "accepted"),
      makeIngestionEvent("evt-2", "review")
    ];
    const snapshot = buildRuntimeStreamSnapshot(snapshotEvents, 2, "paused");
    const snapshotCopy = structuredClone(snapshotEvents);
    const timelineSnapshot = structuredClone(timelineSummary);
    const runSnapshot = JSON.parse(JSON.stringify(run)) as MockOrchestratorRun;
    const snapshotObjectCopy = structuredClone(snapshot);

    buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(run).toEqual(runSnapshot);
    expect(timelineSummary).toEqual(timelineSnapshot);
    expect(snapshot).toEqual(snapshotObjectCopy);
    expect(snapshotEvents).toEqual(snapshotCopy);
  });

  it("keeps detail compact and free of private payload details", () => {
    const run = {
      ...buildDraftRun("failed", "monitor-privacy"),
      id: "run-private",
      sourcePackageId: "package/secret",
      summary: {
        ...buildDraftRun("failed", "monitor-privacy-summary").summary,
        objective: "/private/secret/objective"
      },
      tasks: [
        {
          ...buildDraftRun("failed", "monitor-privacy-task").tasks[0],
          fileOwnership: ["/tmp/private/file.ts"]
        }
      ],
      sessions: [
        {
          ...buildDraftRun("failed", "monitor-privacy-session").sessions[0],
          files: ["C:\\secret\\notes.md"],
          transcript: ["C:\\should-not-appear", "payload details"]
        }
      ] as MockOrchestratorRun["sessions"]
    };
    const timelineSummary = summarizeRunTimeline(buildRunTimeline(run));
    const snapshot = buildRuntimeStreamSnapshot(
      [makeIngestionEvent("evt-1", "blocked"), makeIngestionEvent("evt-2", "accepted")],
      1,
      "paused"
    );

    const summary = buildCockpitMonitorSummary(run, timelineSummary, snapshot);

    expect(summary.detail).toContain(`Run failed`);
    expect(summary.detail).toContain("pending");
    expect(summary.detail).not.toContain(run.id);
    expect(summary.detail).not.toContain(run.sourcePackageId);
    expect(summary.detail).not.toContain(run.summary.objective);
    expect(summary.detail).not.toContain("/");
    expect(summary.detail).not.toContain("\\");
    expect(summary.detail).not.toContain("payload");
    expect(summary.detail).not.toContain("notes");
  });
});
