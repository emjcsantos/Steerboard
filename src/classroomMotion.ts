import type { OrchestratorWorkState } from "./orchestratorRunProjection";

export type ClassroomMotionMode = "full" | "fast" | "minimal" | "reduced";

export type ClassroomVisualIntentKind =
  | "enter-seat-with-chair"
  | "assignment"
  | "return-to-desk"
  | "submit-to-validator"
  | "revision-return"
  | "pass-forward"
  | "escalation-forward"
  | "teacher-takeover"
  | "catch-up";

export interface ClassroomMotionActor {
  participantId: string;
  seat: number;
  workState: OrchestratorWorkState;
}

export interface ClassroomMotionFrame {
  revision: number;
  actors: readonly ClassroomMotionActor[];
}

export interface ClassroomVisualIntent {
  id: string;
  kind: ClassroomVisualIntentKind;
  participantId: string;
  actorKey: string;
  seat: number;
  destination: OrchestratorWorkState;
  durationMs: number;
  animateCamera: boolean;
  properties: readonly ["transform", "opacity"];
}

export interface ClassroomMotionPreferences {
  mode: ClassroomMotionMode;
  /** Durable participant ids that have already occupied a seat, persisted outside this module. */
  durableSeatedParticipantIds?: ReadonlySet<string>;
  /** Set by pointer/wheel/keyboard viewport handlers; suppresses all automatic camera movement. */
  viewportManipulatedByUser?: boolean;
  focusedActorKey?: string;
}

export interface ClassroomMotionProjection {
  durableFrame: ClassroomMotionFrame;
  intents: readonly ClassroomVisualIntent[];
  actorKeys: Readonly<Record<string, string>>;
  focusedActorKey?: string;
  animationBlocksRuntime: false;
  cameraMovement: "animated" | "instant" | "disabled";
}

export interface ClassroomMotionBaseline {
  actors: number;
  intents: number;
  operations: number;
  maxActors: 20;
  maxOperations: 60;
  withinBaseline: boolean;
}

const modeDurations: Record<ClassroomMotionMode, number> = {
  full: 360,
  fast: 180,
  minimal: 60,
  reduced: 0
};

function actorKey(participantId: string): string {
  return `classroom-actor:${participantId}`;
}

function transitionIntent(
  previous: OrchestratorWorkState | undefined,
  next: OrchestratorWorkState
): ClassroomVisualIntentKind | undefined {
  if (next === "takeover") return "teacher-takeover";
  if (next === "escalated") return "escalation-forward";
  if (next === "accepted" || next === "integrating" || next === "completed") return "pass-forward";
  if (next === "revision-required") return "revision-return";
  if (next === "submitted" || next === "validating") return "submit-to-validator";
  if (next === "running" && previous !== "running") return "return-to-desk";
  if (next === "assigned" && previous !== "assigned") return "assignment";
  return undefined;
}

/**
 * Derive replaceable visual intent from two authoritative durable snapshots.
 * No timers, promises, callbacks, or business-state writes occur here.
 */
export function deriveClassroomMotion(
  previous: ClassroomMotionFrame | undefined,
  next: ClassroomMotionFrame,
  preferences: ClassroomMotionPreferences
): ClassroomMotionProjection {
  const previousActors = new Map(previous?.actors.map((actor) => [actor.participantId, actor]));
  const durableSeated = preferences.durableSeatedParticipantIds ?? new Set<string>();
  const durationMs = modeDurations[preferences.mode];
  const actorKeys: Record<string, string> = {};
  const intents = next.actors.slice(0, 20).flatMap((actor): ClassroomVisualIntent[] => {
    const key = actorKey(actor.participantId);
    actorKeys[actor.participantId] = key;
    const prior = previousActors.get(actor.participantId);
    let kind: ClassroomVisualIntentKind | undefined;
    if (!prior) {
      kind = durableSeated.has(actor.participantId) ? "catch-up" : "enter-seat-with-chair";
    } else if (prior.workState !== actor.workState || prior.seat !== actor.seat) {
      kind = transitionIntent(prior.workState, actor.workState) ?? "catch-up";
    }
    if (!kind) return [];
    return [{
      id: `${next.revision}:${actor.participantId}:${kind}`,
      kind,
      participantId: actor.participantId,
      actorKey: key,
      seat: actor.seat,
      destination: actor.workState,
      durationMs,
      animateCamera: preferences.mode !== "reduced" && !preferences.viewportManipulatedByUser,
      properties: ["transform", "opacity"]
    }];
  });

  return {
    durableFrame: next,
    intents,
    actorKeys,
    focusedActorKey: preferences.focusedActorKey,
    animationBlocksRuntime: false,
    cameraMovement: preferences.viewportManipulatedByUser
      ? "disabled"
      : preferences.mode === "reduced"
      ? "disabled"
      : preferences.mode === "minimal"
      ? "instant"
      : "animated"
  };
}

/** Reconcile against the last durable frame, discarding every obsolete pending intent. */
export function catchUpClassroomMotion(
  current: ClassroomMotionProjection,
  latest: ClassroomMotionFrame,
  preferences: ClassroomMotionPreferences
): ClassroomMotionProjection {
  return deriveClassroomMotion(current.durableFrame, latest, preferences);
}

/** Deterministic O(n) budget evidence; deliberately avoids flaky wall-clock assertions. */
export function measureClassroomMotionBaseline(
  previous: ClassroomMotionFrame | undefined,
  next: ClassroomMotionFrame,
  preferences: ClassroomMotionPreferences
): ClassroomMotionBaseline {
  const boundedActors = next.actors.slice(0, 20);
  const projection = deriveClassroomMotion(previous, { ...next, actors: boundedActors }, preferences);
  const operations = boundedActors.length * 2 + projection.intents.length;
  return {
    actors: boundedActors.length,
    intents: projection.intents.length,
    operations,
    maxActors: 20,
    maxOperations: 60,
    withinBaseline: next.actors.length <= 20 && operations <= 60
  };
}
