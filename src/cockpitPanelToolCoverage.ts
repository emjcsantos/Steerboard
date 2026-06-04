export type CockpitPanelToolCoverageTone =
  | "ready"
  | "review"
  | "blocked"
  | "empty";

export interface CockpitPanelToolCoverage {
  label: string;
  detail: string;
  tone: CockpitPanelToolCoverageTone;
  countLabel: string;
}

const DEFAULT_LABEL = "No tools";
const DEFAULT_DETAIL = "No tools are assigned to this panel.";
const DETAIL_PREFIX = "Tools: ";
const DETAIL_MAX_LENGTH = 120;
const EMPTY_COUNT_LABEL = "0 tools";
const BLOCKED_KEYWORDS = ["stop", "block", "error", "fail"];
const REVIEW_KEYWORDS = ["review", "schema", "visual", "audit"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value);
}

function compactText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const safeSlice = Math.max(0, maxLength - 3);
  return `${value.slice(0, safeSlice)}...`;
}

function normalizePath(value: string): string {
  return value.replace(/[\\\/]+/g, "/");
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
  const segments = normalizePath(value)
    .split("/")
    .filter((segment) => segment.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : "path";
}

function sanitizePathToken(token: string): string {
  const leadingMatch = token.match(/^[\(\[\{<"'`]+/);
  const trailingMatch = token.match(/[)\]\}>,"'`!;:.,?]+$/);
  const leading = leadingMatch?.[0] ?? "";
  const trailing = trailingMatch?.[0] ?? "";
  const core = token.slice(leading.length, token.length - trailing.length);

  if (!isAbsolutePath(core)) {
    return token;
  }

  return `${leading}${basename(core)}${trailing}`;
}

function sanitizeToolText(raw: string): string {
  return raw
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => sanitizePathToken(token))
    .join(" ");
}

function containsAny(value: string, tokens: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function countLabel(count: number): string {
  if (count === 1) {
    return "1 tool";
  }

  return `${count} tools`;
}

export function createCockpitPanelToolCoverage(
  tools: unknown
): CockpitPanelToolCoverage {
  if (!isStringArray(tools)) {
    return {
      label: DEFAULT_LABEL,
      detail: DEFAULT_DETAIL,
      tone: "empty",
      countLabel: EMPTY_COUNT_LABEL
    };
  }

  const normalizedTools: string[] = tools
    .map((tool) => (typeof tool === "string" ? tool.trim() : ""))
    .filter((tool) => tool.length > 0);

  const uniqueTools: string[] = [];
  const seen = new Set<string>();
  for (const tool of normalizedTools) {
    const lowered = tool.toLowerCase();
    if (seen.has(lowered)) {
      continue;
    }
    seen.add(lowered);
    uniqueTools.push(tool);
  }

  if (uniqueTools.length === 0) {
    return {
      label: DEFAULT_LABEL,
      detail: DEFAULT_DETAIL,
      tone: "empty",
      countLabel: EMPTY_COUNT_LABEL
    };
  }

  const hasBlockedSignal = uniqueTools.some((tool) =>
    containsAny(tool, BLOCKED_KEYWORDS)
  );
  const hasReviewSignal = uniqueTools.some((tool) =>
    containsAny(tool, REVIEW_KEYWORDS)
  );
  const tone: CockpitPanelToolCoverageTone = hasBlockedSignal
    ? "blocked"
    : hasReviewSignal
    ? "review"
    : "ready";

  const label =
    tone === "blocked"
      ? "Review tools"
      : tone === "review"
      ? "Review set"
      : "Tool set";

  const safeTools = uniqueTools.map(sanitizeToolText);
  const detail = compactText(
    `${DETAIL_PREFIX}${safeTools.join(", ")}`,
    DETAIL_MAX_LENGTH
  );

  return {
    label,
    detail,
    tone,
    countLabel: countLabel(uniqueTools.length)
  };
}
