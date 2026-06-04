export type CockpitPanelAttemptTone =
  | "idle"
  | "safe"
  | "warning"
  | "exhausted"
  | "complete";

export interface CockpitPanelAttempt {
  label: string;
  detail: string;
  tone: CockpitPanelAttemptTone;
  current: number;
  max: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;

function sanitizeCount(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }

  const rounded = Math.floor(raw);
  return rounded > 0 ? rounded : 0;
}

function resolveMaxAttempts(maxAttempts: number | undefined): number {
  const candidate = sanitizeCount(maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  return candidate > 0 ? candidate : DEFAULT_MAX_ATTEMPTS;
}

function normalizeState(state: string | undefined): string {
  return typeof state === "string" ? state.toLowerCase() : "implementing";
}

export function createCockpitPanelAttempt(
  attempt: number,
  state?: string,
  maxAttempts?: number
): CockpitPanelAttempt {
  const max = resolveMaxAttempts(maxAttempts);
  const sanitizedAttempt = sanitizeCount(attempt);
  const current = Math.min(sanitizedAttempt, max);
  const normalizedState = normalizeState(state);

  const label = `${current}/${max}`;

  if (normalizedState === "complete") {
    return {
      label,
      detail:
        current === 0
          ? "Completed with no recorded attempt count."
          : `Completed on attempt ${current} of ${max}.`,
      tone: "complete",
      current,
      max
    };
  }

  if (normalizedState === "idle" || current === 0) {
    return {
      label,
      detail: "No attempts yet.",
      tone: "idle",
      current,
      max
    };
  }

  if (current >= max) {
    return {
      label,
      detail: `Attempt ${current} of ${max} has hit the maximum.`,
      tone: "exhausted",
      current,
      max
    };
  }

  const warningThreshold = Math.max(2, Math.ceil((max * 2) / 3));
  if (current >= warningThreshold) {
    return {
      label,
      detail: `Attempt ${current} of ${max} is approaching the limit.`,
      tone: "warning",
      current,
      max
    };
  }

  return {
    label,
    detail: `Attempt ${current} of ${max} in progress.`,
    tone: "safe",
    current,
    max
  };
}
