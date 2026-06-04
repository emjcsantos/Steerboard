export type CockpitPanelValidationTone =
  | "pending"
  | "running"
  | "passed"
  | "review";

export interface CockpitPanelValidation {
  label: string;
  detail: string;
  tone: CockpitPanelValidationTone;
}

const FALLBACK_VALIDATION = "Validation pending";
const LABEL_MAX_LENGTH = 34;
const DETAIL_MAX_LENGTH = 96;

function collapseText(raw: string): string {
  return raw
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePathSeparators(raw: string): string {
  return raw.replace(/[\\/]+/g, "/").trim();
}

function isPrivateAbsolutePath(value: string): boolean {
  return /^[A-Za-z]:\//.test(value) || /^\/\/[^/]/.test(value) || value.startsWith("/");
}

function basename(value: string): string {
  const parts = value.split("/").filter((part) => part.length > 0);
  return parts[parts.length - 1] ?? "";
}

function compactText(raw: string, maxLength: number): string {
  if (raw.length <= maxLength) {
    return raw;
  }

  return `${raw.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizeValidationText(validation: unknown): string | null {
  if (typeof validation !== "string") {
    return null;
  }

  const normalizedPath = normalizePathSeparators(validation);
  const collapsed = isPrivateAbsolutePath(normalizedPath)
    ? collapseText(basename(normalizedPath) || "validation-evidence")
    : collapseText(validation);
  return collapsed.length > 0 ? collapsed : null;
}

function containsToken(value: string, tokens: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function deriveTone(validation: string, state?: string): CockpitPanelValidationTone {
  const normalizedState = typeof state === "string" ? state.toLowerCase() : "";

  if (normalizedState === "validating") {
    return "running";
  }

  if (normalizedState === "complete") {
    return "passed";
  }

  if (normalizedState === "blocked" || normalizedState === "failed") {
    return "review";
  }

  if (containsToken(validation, ["blocked", "failed", "error"])) {
    return "review";
  }

  if (containsToken(validation, ["passed", "accepted", "success", "complete", "completed"])) {
    return "passed";
  }

  if (containsToken(validation, ["pending", "waiting"])) {
    return "pending";
  }

  if (containsToken(validation, ["running", "running validation", "in progress"])) {
    return "running";
  }

  return "pending";
}

export function createCockpitPanelValidation(
  validation: unknown,
  state?: string
): CockpitPanelValidation {
  const sanitized = normalizeValidationText(validation);

  if (sanitized === null) {
    return {
      label: FALLBACK_VALIDATION,
      detail: `${FALLBACK_VALIDATION}.`,
      tone: deriveTone(FALLBACK_VALIDATION, state)
    };
  }

  const tone = deriveTone(sanitized, state);
  const label = compactText(sanitized, LABEL_MAX_LENGTH);
  const detail = compactText(`Validation: ${sanitized}`, DETAIL_MAX_LENGTH);

  return {
    label,
    detail,
    tone
  };
}
