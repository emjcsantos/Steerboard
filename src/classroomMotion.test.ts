import { describe, expect, it } from "vitest";
import {
  catchUpClassroomMotion,
  deriveClassroomMotion,
  measureClassroomMotionBaseline,
  type ClassroomMotionActor,
  type ClassroomMotionFrame,
  type ClassroomMotionMode
} from "./classroomMotion";
import type { OrchestratorWorkState } from "./orchestratorRunProjection";

const actor = (workState: OrchestratorWorkState, participantId = "p1", seat = 1): ClassroomMotionActor => ({
  participantId, seat, workState
});
const frame = (revision: number, ...actors: ClassroomMotionActor[]): ClassroomMotionFrame => ({ revision, actors });

describe("classroom motion intent", () => {
  it.each([
    ["queued", "assigned", "assignment"],
    ["assigned", "running", "return-to-desk"],
    ["running", "submitted", "submit-to-validator"],
    ["validating", "revision-required", "revision-return"],
    ["validating", "accepted", "pass-forward"],
    ["running", "escalated", "escalation-forward"],
    ["escalated", "takeover", "teacher-takeover"]
  ] as const)("derives %s to %s as %s", (from, to, kind) => {
    const result = deriveClassroomMotion(frame(1, actor(from)), frame(2, actor(to)), { mode: "full" });
    expect(result.intents.map((intent) => intent.kind)).toEqual([kind]);
    expect(result.durableFrame.actors[0].workState).toBe(to);
    expect(result.animationBlocksRuntime).toBe(false);
  });

  it("plays chair entry once, then catches up without replay after reload", () => {
    const first = deriveClassroomMotion(undefined, frame(1, actor("queued")), { mode: "full" });
    expect(first.intents[0].kind).toBe("enter-seat-with-chair");
    const reloaded = deriveClassroomMotion(undefined, frame(2, actor("running")), {
      mode: "full", durableSeatedParticipantIds: new Set(["p1"])
    });
    expect(reloaded.intents[0].kind).toBe("catch-up");
  });

  it("drops obsolete intermediate intent and catches up to the latest durable destination", () => {
    const pending = deriveClassroomMotion(frame(1, actor("running")), frame(2, actor("submitted")), { mode: "full" });
    const caughtUp = catchUpClassroomMotion(pending, frame(4, actor("revision-required")), { mode: "full" });
    expect(caughtUp.intents).toHaveLength(1);
    expect(caughtUp.intents[0]).toMatchObject({ kind: "revision-return", destination: "revision-required" });
    expect(caughtUp.intents[0].id).toMatch(/^4:/);
  });

  it.each([
    ["full", 360, "animated"],
    ["fast", 180, "animated"],
    ["minimal", 60, "instant"],
    ["reduced", 0, "disabled"]
  ] as const)("gives %s distinct timing and camera behavior", (mode, durationMs, cameraMovement) => {
    const result = deriveClassroomMotion(frame(1, actor("running")), frame(2, actor("submitted")), { mode });
    expect(result.intents[0].durationMs).toBe(durationMs);
    expect(result.cameraMovement).toBe(cameraMovement);
    if (mode === "reduced") expect(result.intents[0].animateCamera).toBe(false);
  });

  it("preserves stable actor identity and focus metadata across transitions", () => {
    const first = deriveClassroomMotion(frame(1, actor("running")), frame(2, actor("submitted")), {
      mode: "fast", focusedActorKey: "classroom-actor:p1"
    });
    const second = catchUpClassroomMotion(first, frame(3, actor("validating")), {
      mode: "fast", focusedActorKey: first.focusedActorKey
    });
    expect(first.actorKeys.p1).toBe("classroom-actor:p1");
    expect(second.actorKeys.p1).toBe(first.actorKeys.p1);
    expect(second.focusedActorKey).toBe("classroom-actor:p1");
  });

  it("disables auto-pan while the user manipulates the viewport", () => {
    const result = deriveClassroomMotion(frame(1, actor("running")), frame(2, actor("submitted")), {
      mode: "full", viewportManipulatedByUser: true
    });
    expect(result.cameraMovement).toBe("disabled");
    expect(result.intents[0].animateCamera).toBe(false);
  });

  it("allows only compositor-friendly properties and exposes no callback or loop", () => {
    const result = deriveClassroomMotion(frame(1, actor("running")), frame(2, actor("submitted")), { mode: "full" });
    expect(result.intents[0].properties).toEqual(["transform", "opacity"]);
    expect(Object.keys(result.intents[0])).not.toContain("callback");
    expect(Object.keys(result.intents[0])).not.toContain("iterations");
  });

  it("stays within the deterministic twenty-worker O(n) baseline", () => {
    const actors = Array.from({ length: 20 }, (_, index) => actor("running", `p${index + 1}`, index + 1));
    const baseline = measureClassroomMotionBaseline(undefined, frame(1, ...actors), { mode: "full" });
    expect(baseline).toEqual({ actors: 20, intents: 20, operations: 60, maxActors: 20, maxOperations: 60, withinBaseline: true });
  });

  it("rejects an over-capacity baseline while safely bounding projection work", () => {
    const actors = Array.from({ length: 21 }, (_, index) => actor("running", `p${index + 1}`, index + 1));
    const baseline = measureClassroomMotionBaseline(undefined, frame(1, ...actors), { mode: "full" });
    expect(baseline.actors).toBe(20);
    expect(baseline.withinBaseline).toBe(false);
  });
});
