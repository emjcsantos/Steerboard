export type CockpitPanelBranchTone = "protected" | "work" | "review" | "neutral";

export interface CockpitPanelBranch {
  label: string;
  detail: string;
  tone: CockpitPanelBranchTone;
}

const DEFAULT_BRANCH_LABEL = "No branch";
const DEFAULT_BRANCH_DETAIL = "Branch information is not available.";
const LABEL_MAX_LENGTH = 28;
const DETAIL_MAX_LENGTH = 96;

function compactText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const safeSlice = Math.max(0, maxLength - 3);
  return `${value.slice(0, safeSlice)}...`;
}

function normalizeBranch(raw: string): string {
  return raw
    .replace(/[\\\/]+/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPrivatePath(branch: string): string {
  const isWindowsDrivePath = /^[a-z]:\//i.test(branch);
  const isWindowsUncPath = /^\/\//.test(branch);
  const isUnixAbsolutePath = /^\//.test(branch);

  if (!isWindowsDrivePath && !isWindowsUncPath && !isUnixAbsolutePath) {
    return branch;
  }

  const segments = branch.split("/").filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? "";
}

function resolveTone(branch: string): CockpitPanelBranchTone {
  const lowerBranch = branch.toLowerCase();

  if (
    lowerBranch === "main" ||
    lowerBranch === "master" ||
    lowerBranch === "prod" ||
    lowerBranch === "production" ||
    lowerBranch.startsWith("release/")
  ) {
    return "protected";
  }

  if (
    lowerBranch.startsWith("work/") ||
    lowerBranch.startsWith("feature/") ||
    lowerBranch.startsWith("codex/") ||
    lowerBranch.startsWith("task/")
  ) {
    return "work";
  }

  if (
    lowerBranch.startsWith("check/") ||
    lowerBranch.startsWith("review/") ||
    lowerBranch.startsWith("validation/")
  ) {
    return "review";
  }

  return "neutral";
}

function resolveDetail(branch: string, tone: CockpitPanelBranchTone): string {
  const label = compactText(branch, DETAIL_MAX_LENGTH);

  switch (tone) {
    case "protected":
      return `Protected branch: ${label}`;
    case "work":
      return `Work branch: ${label}`;
    case "review":
      return `Review branch: ${label}`;
    default:
      return `Branch: ${label}`;
  }
}

export function createCockpitPanelBranch(branch: unknown): CockpitPanelBranch {
  if (typeof branch !== "string") {
    return {
      label: DEFAULT_BRANCH_LABEL,
      detail: DEFAULT_BRANCH_DETAIL,
      tone: "neutral"
    };
  }

  const normalizedBranch = normalizeBranch(branch);

  if (!normalizedBranch) {
    return {
      label: DEFAULT_BRANCH_LABEL,
      detail: DEFAULT_BRANCH_DETAIL,
      tone: "neutral"
    };
  }

  const safeBranch = stripPrivatePath(normalizedBranch) || DEFAULT_BRANCH_LABEL;
  const tone = resolveTone(safeBranch);

  return {
    label: compactText(safeBranch, LABEL_MAX_LENGTH),
    detail: resolveDetail(safeBranch, tone),
    tone
  };
}
