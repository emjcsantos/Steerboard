import type { RuntimeIngestionStatus } from "./runtimeIngestion";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";

export interface CockpitMonitorNextEventPreview {
  hasNext: boolean;
  label: string;
  detail: string;
  status: RuntimeIngestionStatus | "empty" | string;
  sequenceLabel: string;
}

function sanitizeDetail(value: string | undefined): string {
  const fallback = "Local event is queued.";
  const cleaned = value
    ?.replace(/[\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, 96);
}

function toTitleCase(value: string): string {
  if (!value) {
    return "";
  }

  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeSequence(sequence: number): number {
  return Number.isFinite(sequence) && sequence >= 0 ? Math.floor(sequence) : 0;
}

export function buildCockpitMonitorNextEventPreview(
  sourceSnapshot: RuntimeEventSourceSnapshot
): CockpitMonitorNextEventPreview {
  const next = sourceSnapshot.events[0];

  if (!next) {
    return {
      hasNext: false,
      label: "No queued local events",
      detail: "Stream queue is clear.",
      status: "empty",
      sequenceLabel: "--"
    };
  }

  return {
    hasNext: true,
    label: `${toTitleCase(next.eventKind)} ${next.adapterStatus}`,
    detail: sanitizeDetail(next.reason),
    status: next.adapterStatus.toLowerCase(),
    sequenceLabel: `#${normalizeSequence(next.sequence) + 1}`
  };
}
