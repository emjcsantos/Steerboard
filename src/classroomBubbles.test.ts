import { describe, expect, it } from "vitest";
import {
  selectClassroomBubbles,
  type ClassroomBubbleCandidate,
  type ClassroomBubbleKind
} from "./classroomBubbles";

const viewport = { x: 0, y: 0, width: 800, height: 600 };
const anchor = (id: string, x: number) => ({ id, x, y: 20, width: 100, height: 60 });

function candidate(
  id: string,
  kind: ClassroomBubbleKind,
  overrides: Partial<ClassroomBubbleCandidate> = {}
): ClassroomBubbleCandidate {
  return {
    id,
    actorId: id,
    kind,
    summary: `${kind} summary`,
    createdAtMs: 9_000,
    anchors: [anchor(`${id}-anchor`, Number(id.replace(/\D/g, "") || 0) * 110)],
    durableActivityId: `activity-${id}`,
    ...overrides
  };
}

describe("selectClassroomBubbles", () => {
  it("prioritizes errors and escalation, validation, orchestrator, then routine and caps at three", () => {
    const result = selectClassroomBubbles([
      candidate("1", "thinking"),
      candidate("2", "orchestrator", { messageId: "message-2" }),
      candidate("3", "validation"),
      candidate("4", "assignment", { severity: "error" })
    ], { nowMs: 10_000, viewport });

    expect(result.bubbles.map((bubble) => bubble.id)).toEqual(["4", "3", "2"]);
    expect(result.bubbles[2].target).toEqual({
      surface: "orchestrator-chat",
      referenceId: "message-2",
      readOnly: true
    });
  });

  it("shows only the highest-priority preview for each actor", () => {
    const result = selectClassroomBubbles([
      candidate("routine", "acknowledgement", { actorId: "worker-1", anchors: [anchor("routine", 0)] }),
      candidate("urgent", "escalation", { actorId: "worker-1", anchors: [anchor("urgent", 120)] })
    ], { nowMs: 10_000, viewport });

    expect(result.bubbles.map((bubble) => bubble.id)).toEqual(["urgent"]);
  });

  it("expires routine previews but retains hovered, focused, and unacknowledged errors", () => {
    const old = { createdAtMs: 0, routineLifetimeMs: 100 };
    const result = selectClassroomBubbles([
      candidate("1", "assignment", old),
      candidate("2", "thinking", { ...old, hovered: true }),
      candidate("3", "acknowledgement", { ...old, focused: true }),
      candidate("4", "escalation", old),
      candidate("5", "escalation", { ...old, acknowledged: true })
    ], { nowMs: 10_000, viewport });

    expect(result.bubbles.map((bubble) => bubble.id)).toEqual(["4", "3", "2"]);
  });

  it("suppresses colliding previews and exposes a labeled durable activity link", () => {
    const result = selectClassroomBubbles([
      candidate("worker", "thinking", { anchors: [anchor("blocked", 0)] })
    ], {
      nowMs: 10_000,
      viewport,
      occupiedRects: [{ x: 0, y: 0, width: 150, height: 150 }]
    });

    expect(result.bubbles).toEqual([]);
    expect(result.durableActivityIndicators).toEqual([{
      actorId: "worker",
      label: "Activity available for worker",
      target: { surface: "durable-activity", referenceId: "activity-worker", readOnly: true },
      reason: "collision"
    }]);
  });

  it("tries alternate collision-free anchors and reserves chosen space", () => {
    const result = selectClassroomBubbles([
      candidate("a", "validation", { anchors: [anchor("a1", 0), anchor("a2", 220)] }),
      candidate("b", "validation", { anchors: [anchor("b1", 0), anchor("b2", 110)] })
    ], {
      nowMs: 10_000,
      viewport,
      occupiedRects: [{ x: 0, y: 0, width: 100, height: 100 }]
    });

    expect(result.bubbles.map((bubble) => bubble.anchor.id)).toEqual(["a2", "b2"]);
  });

  it("sanitizes and bounds user-safe summaries without exposing chain-of-thought", () => {
    const result = selectClassroomBubbles([
      candidate("safe", "thinking", {
        summary: "Visible progress. <think>secret tokens and reasoning</think> " + "x".repeat(200)
      })
    ], { nowMs: 10_000, viewport, maximumSummaryLength: 40 });

    expect(result.bubbles[0].summary).not.toContain("secret");
    expect(result.bubbles[0].summary.length).toBeLessThanOrEqual(40);
  });

  it("uses static status in reduced-motion mode and keeps durable targets read-only", () => {
    const result = selectClassroomBubbles([
      candidate("worker", "assignment")
    ], { nowMs: 10_000, viewport, reducedMotion: true });

    expect(result.bubbles[0].staticStatus).toBe(true);
    expect(result.bubbles[0].target).toEqual({
      surface: "durable-activity",
      referenceId: "activity-worker",
      readOnly: true
    });
  });

  it("supports all preview kinds from durable activity", () => {
    const kinds: ClassroomBubbleKind[] = [
      "assignment", "acknowledgement", "validation", "escalation", "orchestrator", "thinking"
    ];
    for (const kind of kinds) {
      const result = selectClassroomBubbles([candidate("1", kind)], { nowMs: 10_000, viewport });
      expect(result.bubbles[0].kind).toBe(kind);
    }
  });
});
