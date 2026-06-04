export type CockpitPanelActivityTone =
  | "active"
  | "waiting"
  | "review"
  | "complete"
  | "empty";

export interface CockpitPanelActivityInput {
  transcript?: unknown;
  state?: unknown;
  validation?: unknown;
}

export interface CockpitPanelActivity {
  label: string;
  detail: string;
  tone: CockpitPanelActivityTone;
  countLabel: string;
}

const DETAIL_PREFIX = "Latest: ";
const DETAIL_MAX_LENGTH = 120;
const DEFAULT_LABEL = "No activity";
const DEFAULT_DETAIL = "No panel activity has been recorded.";
const EMPTY_COUNT_LABEL = "0 notes";

const COMPLETE_STATES = new Set(["complete"]);
const REVIEW_STATES = new Set(["blocked", "failed"]);
const WAITING_STATES = new Set(["idle", "planning"]);

function trimAndFilterTranscriptLines(transcript: unknown): string[] {
  if (!Array.isArray(transcript)) {
    return [];
  }

  return transcript
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function isKeywordMatch(value: string, tokens: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function compactText(raw: string, maxLength: number): string {
  if (raw.length <= maxLength) {
    return raw;
  }

  return `${raw.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizePath(value: string): string {
  return value.replace(/[\\/]+/g, "/");
}

function isAbsolutePath(value: string): boolean {
  const normalized = normalizePath(value);

  return (
    /^[A-Za-z]:\//.test(normalized) ||
    /^\/\/[^/]/.test(normalized) ||
    normalized.startsWith("/")
  );
}

function basename(value: string): string {
  const parts = normalizePath(value)
    .split("/")
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : value;
}

function sanitizePathToken(value: string): string {
  const leading = value.match(/^[\(\[\{<"'`]+/)?.[0] ?? "";
  const trailing = value.match(/[)\]\}>,"'`!;:.,?]+$/)?.[0] ?? "";
  const coreStart = leading.length;
  const coreEnd = value.length - trailing.length;
  const core = value.slice(coreStart, coreEnd);

  if (!isAbsolutePath(core)) {
    return value;
  }

  const name = basename(core);
  return `${leading}${name}${trailing}`;
}

function sanitizeLine(value: string): string {
  return value
    .split(/\s+/)
    .map((token) => sanitizePathToken(token))
    .join(" ")
    .trim();
}

function sanitizeDetailLine(value: string): string {
  return sanitizeLine(value);
}

function createCountLabel(count: number): string {
  if (count === 1) {
    return "1 note";
  }

  return `${count} notes`;
}

function normalizeTextForClassification(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function deriveTone(
  state: string,
  validation: string,
  latestLine: string
): CockpitPanelActivityTone {
  if (COMPLETE_STATES.has(state) || isKeywordMatch(validation, ["passed", "success", "complete", "accepted"])) {
    return "complete";
  }

  if (
    REVIEW_STATES.has(state) ||
    isKeywordMatch(validation, ["blocked", "failed", "error", "needs review"]) ||
    isKeywordMatch(latestLine, ["blocked", "failed", "error", "needs review"])
  ) {
    return "review";
  }

  if (
    WAITING_STATES.has(state) ||
    isKeywordMatch(latestLine, ["waiting", "pending", "queued"])
  ) {
    return "waiting";
  }

  return "active";
}

function deriveLabel(tone: CockpitPanelActivityTone): string {
  if (tone === "complete") {
    return "Complete";
  }

  if (tone === "review") {
    return "Review";
  }

  if (tone === "waiting") {
    return "Waiting";
  }

  return "Active";
}

export function createCockpitPanelActivity(
  input: CockpitPanelActivityInput
): CockpitPanelActivity {
  const transcript = trimAndFilterTranscriptLines(input.transcript);
  const state = normalizeTextForClassification(input.state);
  const validation = normalizeTextForClassification(input.validation);

  if (transcript.length === 0) {
    return {
      label: DEFAULT_LABEL,
      detail: DEFAULT_DETAIL,
      tone: "empty",
      countLabel: EMPTY_COUNT_LABEL
    };
  }

  const latestLine = transcript[transcript.length - 1];
  const tone = deriveTone(state, validation, latestLine);
  const safeLatest = sanitizeDetailLine(latestLine);
  const detail = compactText(`${DETAIL_PREFIX}${safeLatest}`, DETAIL_MAX_LENGTH);

  return {
    label: deriveLabel(tone),
    detail,
    tone,
    countLabel: createCountLabel(transcript.length)
  };
}
