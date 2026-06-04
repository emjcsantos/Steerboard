export type CockpitPanelRuntimeTone =
  | "orchestrator"
  | "worker"
  | "validator"
  | "integration"
  | "local"
  | "neutral";

export interface CockpitPanelRuntimeInput {
  runtime?: unknown;
  role?: unknown;
}

export interface CockpitPanelRuntime {
  label: string;
  detail: string;
  tone: CockpitPanelRuntimeTone;
}

const DEFAULT_RUNTIME_LABEL = "No runtime";
const DEFAULT_RUNTIME_DETAIL = "Runtime information is not available.";
const LABEL_MAX_LENGTH = 24;
const DETAIL_MAX_LENGTH = 96;

function compactText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const safeSlice = Math.max(0, maxLength - 3);
  return `${value.slice(0, safeSlice)}...`;
}

function normalizeRuntime(raw: string): string {
  return raw
    .replace(/[\\\/]+/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePrivatePath(runtime: string): string {
  const isWindowsDrivePath = /^[a-z]:\//i.test(runtime);
  const isWindowsUncPath = /^\/\//.test(runtime);
  const isUnixAbsolutePath = /^\//.test(runtime);

  if (!isWindowsDrivePath && !isWindowsUncPath && !isUnixAbsolutePath) {
    return runtime;
  }

  const segments = runtime.split("/").filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? "";
}

function resolveToneFromRole(role: unknown): CockpitPanelRuntimeTone | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role.trim().toLowerCase();

  if (["orchestrator", "planner", "main"].includes(normalizedRole)) {
    return "orchestrator";
  }

  if (["implementer", "worker"].includes(normalizedRole)) {
    return "worker";
  }

  if (["validator", "check", "review"].includes(normalizedRole)) {
    return "validator";
  }

  if (["integration", "integrator"].includes(normalizedRole)) {
    return "integration";
  }

  return null;
}

function resolveToneFromRuntime(runtime: string): CockpitPanelRuntimeTone {
  const lowerRuntime = runtime.toLowerCase();

  if (
    lowerRuntime.includes("model-only") ||
    lowerRuntime.includes("orchestrator") ||
    lowerRuntime.includes("main workspace")
  ) {
    return "orchestrator";
  }

  if (lowerRuntime.includes("worker") || lowerRuntime.includes("profile")) {
    return "worker";
  }

  if (
    lowerRuntime.includes("validator") ||
    lowerRuntime.includes("check") ||
    lowerRuntime.includes("review")
  ) {
    return "validator";
  }

  if (
    lowerRuntime.includes("integration") ||
    lowerRuntime.includes("integrator")
  ) {
    return "integration";
  }

  if (
    lowerRuntime.includes("local") ||
    lowerRuntime.includes("runtime") ||
    lowerRuntime.includes("desktop")
  ) {
    return "local";
  }

  return "neutral";
}

export function createCockpitPanelRuntime(
  input: CockpitPanelRuntimeInput
): CockpitPanelRuntime {
  const runtimeSource = input?.runtime;

  if (typeof runtimeSource !== "string") {
    return {
      label: DEFAULT_RUNTIME_LABEL,
      detail: DEFAULT_RUNTIME_DETAIL,
      tone: "neutral"
    };
  }

  const normalizedRuntime = normalizeRuntime(runtimeSource);
  const safeRuntime = sanitizePrivatePath(normalizedRuntime);

  if (!safeRuntime) {
    return {
      label: DEFAULT_RUNTIME_LABEL,
      detail: DEFAULT_RUNTIME_DETAIL,
      tone: "neutral"
    };
  }

  const tone =
    resolveToneFromRole(input?.role) ?? resolveToneFromRuntime(safeRuntime);

  return {
    label: compactText(safeRuntime, LABEL_MAX_LENGTH),
    detail: compactText(`Runtime: ${safeRuntime}`, DETAIL_MAX_LENGTH),
    tone
  };
}
