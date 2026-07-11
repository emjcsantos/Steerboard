import { sanitizeOrchestratorProgress } from "./orchestratorRunProjection";

export type ClassroomBubbleKind =
  | "assignment"
  | "acknowledgement"
  | "validation"
  | "escalation"
  | "orchestrator"
  | "thinking";

export interface ClassroomBubbleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClassroomBubbleAnchor extends ClassroomBubbleRect {
  id: string;
}

export interface ClassroomBubbleCandidate {
  id: string;
  actorId: string;
  kind: ClassroomBubbleKind;
  summary: unknown;
  createdAtMs: number;
  anchors: readonly ClassroomBubbleAnchor[];
  severity?: "routine" | "error";
  acknowledged?: boolean;
  hovered?: boolean;
  focused?: boolean;
  routineLifetimeMs?: number;
  durableActivityId?: string;
  messageId?: string;
}

export interface ClassroomBubbleTarget {
  surface: "orchestrator-chat" | "durable-activity";
  referenceId: string;
  readOnly: true;
}

export interface ClassroomBubblePreview {
  id: string;
  actorId: string;
  kind: ClassroomBubbleKind;
  summary: string;
  anchor: ClassroomBubbleAnchor;
  priority: number;
  staticStatus: boolean;
  target: ClassroomBubbleTarget;
}

export interface ClassroomDurableActivityIndicator {
  actorId: string;
  label: string;
  target: ClassroomBubbleTarget;
  reason: "collision";
}

export interface SelectClassroomBubblesOptions {
  nowMs: number;
  viewport: ClassroomBubbleRect;
  occupiedRects?: readonly ClassroomBubbleRect[];
  reducedMotion?: boolean;
  maxBubbles?: number;
  maximumSummaryLength?: number;
}

export interface ClassroomBubbleSelection {
  bubbles: ClassroomBubblePreview[];
  durableActivityIndicators: ClassroomDurableActivityIndicator[];
}

const DEFAULT_ROUTINE_LIFETIME_MS = 6_000;
const DEFAULT_MAXIMUM_SUMMARY_LENGTH = 120;

function priority(candidate: ClassroomBubbleCandidate): number {
  if (candidate.severity === "error" || candidate.kind === "escalation") return 4;
  if (candidate.kind === "validation") return 3;
  if (candidate.kind === "orchestrator") return 2;
  return 1;
}

function targetFor(candidate: ClassroomBubbleCandidate): ClassroomBubbleTarget {
  if (candidate.kind === "orchestrator" && candidate.messageId) {
    return { surface: "orchestrator-chat", referenceId: candidate.messageId, readOnly: true };
  }
  return {
    surface: "durable-activity",
    referenceId: candidate.durableActivityId ?? candidate.messageId ?? candidate.id,
    readOnly: true
  };
}

function intersects(first: ClassroomBubbleRect, second: ClassroomBubbleRect): boolean {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}

function containedBy(rect: ClassroomBubbleRect, viewport: ClassroomBubbleRect): boolean {
  return rect.x >= viewport.x && rect.y >= viewport.y &&
    rect.x + rect.width <= viewport.x + viewport.width &&
    rect.y + rect.height <= viewport.y + viewport.height;
}

function isVisibleAt(candidate: ClassroomBubbleCandidate, nowMs: number): boolean {
  if (!Number.isFinite(candidate.createdAtMs) || candidate.createdAtMs > nowMs) return false;
  if (candidate.focused || candidate.hovered) return true;

  const persistentError = candidate.severity === "error" || candidate.kind === "escalation";
  if (persistentError && !candidate.acknowledged) return true;

  const lifetime = Math.max(0, candidate.routineLifetimeMs ?? DEFAULT_ROUTINE_LIFETIME_MS);
  return nowMs - candidate.createdAtMs <= lifetime;
}

/**
 * Selects optional canvas previews only. Complete content remains reachable through
 * the returned orchestrator-chat or durable-activity target, which is always read-only.
 */
export function selectClassroomBubbles(
  candidates: readonly ClassroomBubbleCandidate[],
  options: SelectClassroomBubblesOptions
): ClassroomBubbleSelection {
  const maximumSummaryLength = Math.max(16, options.maximumSummaryLength ?? DEFAULT_MAXIMUM_SUMMARY_LENGTH);
  const maximumBubbles = Math.min(3, Math.max(0, options.maxBubbles ?? 3));
  const normalized = candidates
    .map((candidate) => ({
      candidate,
      summary: sanitizeOrchestratorProgress(candidate.summary, maximumSummaryLength)
    }))
    .filter((item): item is { candidate: ClassroomBubbleCandidate; summary: string } =>
      Boolean(item.summary) && isVisibleAt(item.candidate, options.nowMs)
    )
    .sort((first, second) =>
      priority(second.candidate) - priority(first.candidate) ||
      Number(second.candidate.focused === true) - Number(first.candidate.focused === true) ||
      second.candidate.createdAtMs - first.candidate.createdAtMs ||
      first.candidate.id.localeCompare(second.candidate.id)
    );

  const onePerActor = new Map<string, typeof normalized[number]>();
  for (const item of normalized) {
    if (!onePerActor.has(item.candidate.actorId)) onePerActor.set(item.candidate.actorId, item);
  }

  const bubbles: ClassroomBubblePreview[] = [];
  const durableActivityIndicators: ClassroomDurableActivityIndicator[] = [];
  const occupied = [...(options.occupiedRects ?? [])];

  for (const { candidate, summary } of onePerActor.values()) {
    if (bubbles.length >= maximumBubbles) break;
    const anchor = candidate.anchors.find((item) =>
      containedBy(item, options.viewport) && occupied.every((rect) => !intersects(item, rect))
    );
    const target = targetFor(candidate);
    if (!anchor) {
      durableActivityIndicators.push({
        actorId: candidate.actorId,
        label: `Activity available for ${candidate.actorId}`,
        target,
        reason: "collision"
      });
      continue;
    }
    bubbles.push({
      id: candidate.id,
      actorId: candidate.actorId,
      kind: candidate.kind,
      summary,
      anchor,
      priority: priority(candidate),
      staticStatus: options.reducedMotion === true,
      target
    });
    occupied.push(anchor);
  }

  return { bubbles, durableActivityIndicators };
}
