import type { RuntimeIngestionStatus } from "./runtimeIngestion";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

export interface CockpitMonitorEventFeedItem {
  id: string;
  label: string;
  detail: string;
  status: RuntimeIngestionStatus | string;
  sequenceLabel: string;
}

const defaultLimit = 3;
const maxLimit = 5;

function normalizeLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return defaultLimit;
  }

  return Math.min(maxLimit, Math.floor(value));
}

function titleCase(value: string): string {
  const cleaned = value.replace(/[_-]+/g, " ").trim().toLowerCase();

  return cleaned
    ? cleaned.replace(/\b\w/g, (character) => character.toUpperCase())
    : "Event";
}

function sanitizeDetail(value: string | undefined): string {
  const cleaned = value
    ?.replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? cleaned.slice(0, 96) : "Local event emitted.";
}

function normalizeSequence(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

export function buildCockpitMonitorEventFeed(
  streamSnapshot: RuntimeStreamSnapshot,
  options: { limit?: number } = {}
): CockpitMonitorEventFeedItem[] {
  const limit = normalizeLimit(options.limit);

  return streamSnapshot.emittedEvents
    .slice(-limit)
    .reverse()
    .map((event) => {
      const status = String(event.adapterStatus).toLowerCase();

      return {
        id: event.id,
        label: `${titleCase(event.eventKind)} ${status}`,
        detail: sanitizeDetail(event.reason),
        status,
        sequenceLabel: `#${normalizeSequence(event.sequence) + 1}`
      };
    });
}
