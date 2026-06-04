export type CockpitPanelFileScopeTone = "empty" | "scoped" | "wide";

export interface CockpitPanelFileScope {
  label: string;
  detail: string;
  tone: CockpitPanelFileScopeTone;
  count: number;
  files: string[];
}

const EMPTY_LABEL = "No files";
const EMPTY_DETAIL = "No file ownership metadata available.";
const DETAILED_LIMIT = 3;
const DETAIL_MAX_LABEL_LENGTH = 28;

function toCollapsedText(raw: string): string {
  return raw.replace(/[\\/]+/g, "/").replace(/\s+/g, " ").trim();
}

function isWindowsDrivePath(value: string): boolean {
  return /^[A-Za-z]:\//.test(value);
}

function isUncPath(value: string): boolean {
  return /^\/\/[^/]/.test(value);
}

function isUnixAbsolutePath(value: string): boolean {
  return value.startsWith("/");
}

function isPrivateAbsolutePath(value: string): boolean {
  return isWindowsDrivePath(value) || isUncPath(value) || isUnixAbsolutePath(value);
}

function compactLabel(value: string): string {
  if (value.length <= DETAIL_MAX_LABEL_LENGTH) {
    return value;
  }

  return `${value.slice(0, DETAIL_MAX_LABEL_LENGTH - 3)}...`;
}

function toPublicSafeLabel(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const collapsed = toCollapsedText(raw);

  if (collapsed.length === 0) {
    return null;
  }

  if (!isPrivateAbsolutePath(collapsed)) {
    return collapsed;
  }

  const normalized = collapsed.split("/").filter((segment) => segment.length > 0);
  const basename = normalized[normalized.length - 1];

  return basename || "private-path";
}

function dedupePreservingOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(value);
  }

  return output;
}

export function createCockpitPanelFileScope(files: readonly string[]): CockpitPanelFileScope {
  const normalizedFiles = dedupePreservingOrder(
    files
      .map((raw) => toPublicSafeLabel(raw))
      .filter((value): value is string => value !== null)
  );

  const count = normalizedFiles.length;

  if (count === 0) {
    return {
      label: EMPTY_LABEL,
      detail: EMPTY_DETAIL,
      tone: "empty",
      count: 0,
      files: []
    };
  }

  const sample = normalizedFiles
    .slice(0, DETAILED_LIMIT)
    .map((value) => compactLabel(value));

  const remainingCount = count - sample.length;

  const detail = remainingCount > 0
    ? `${sample.join(", ")} +${remainingCount} more`
    : sample.join(", ");

  const tone: CockpitPanelFileScopeTone = count > DETAILED_LIMIT ? "wide" : "scoped";
  const label = count === 1 ? "1 file" : `${count} files`;

  return {
    label,
    detail,
    tone,
    count,
    files: normalizedFiles
  };
}
