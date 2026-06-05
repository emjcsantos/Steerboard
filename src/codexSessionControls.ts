export type CodexSessionStatus =
  | "preview"
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "interrupted"
  | "failed"
  | "error"
  | "unknown";

export type CodexSessionTurnStatus =
  | "starting"
  | "streaming"
  | "completed"
  | "interrupted"
  | "failed"
  | "unknown";

export type CodexSessionControlId =
  | "interrupt"
  | "retry"
  | "steer"
  | "fork"
  | "resume"
  | "archive";

export type CodexSessionControlState = "live" | "unavailable" | "unsupported" | "disabled";

export interface CodexSessionControlSnapshot {
  state: CodexSessionControlState;
  reason: string;
}

export type CodexSessionControls = Record<CodexSessionControlId, CodexSessionControlSnapshot>;

export interface CodexSessionControlInputs {
  sessionStatus: string;
  liveTransportAvailable: boolean;
  activeTurn?: {
    status?: string;
  } | null;
  lastUserPrompt?: string;
  draftText?: string;
}

function normalizeSessionStatus(value: string): CodexSessionStatus {
  return value === "preview" ||
    value === "idle" ||
    value === "starting" ||
    value === "running" ||
    value === "completed" ||
    value === "interrupted" ||
    value === "failed" ||
    value === "error"
    ? value
    : "unknown";
}

function normalizeTurnStatus(value?: string): CodexSessionTurnStatus {
  return value === "starting" ||
    value === "streaming" ||
    value === "completed" ||
    value === "interrupted" ||
    value === "failed"
    ? value
    : "unknown";
}

function trimOrEmpty(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function transportUnavailableReason(): string {
  return "Live transport is not available in preview mode.";
}

function isTurnRunning(status: CodexSessionTurnStatus): boolean {
  return status === "streaming";
}

function isTurnStarting(status: CodexSessionTurnStatus): boolean {
  return status === "starting";
}

function isSessionRunning(status: CodexSessionStatus): boolean {
  return status === "running";
}

function isSessionStarting(status: CodexSessionStatus): boolean {
  return status === "starting";
}

function unsupportedAdapterReason(action: string): string {
  return `${action} is unsupported in the first Codex app-server adapter.`;
}

export function buildCodexSessionControls(
  args: CodexSessionControlInputs
): CodexSessionControls {
  const sessionStatus = normalizeSessionStatus(args.sessionStatus);
  const activeTurnStatus = normalizeTurnStatus(args.activeTurn?.status);
  const lastUserPrompt = trimOrEmpty(args.lastUserPrompt);
  const draftText = trimOrEmpty(args.draftText);

  const turnRunning = isTurnRunning(activeTurnStatus);
  const turnStarting = isTurnStarting(activeTurnStatus);
  const sessionRunning = isSessionRunning(sessionStatus);
  const sessionStarting = isSessionStarting(sessionStatus);

  const interruptState: CodexSessionControlState =
    args.liveTransportAvailable && (turnRunning || turnStarting || sessionRunning || sessionStarting)
      ? "live"
      : args.liveTransportAvailable
        ? "disabled"
        : "unavailable";

  const interruptReason =
    interruptState === "live"
      ? "Interrupt the active live turn."
      : interruptState === "unavailable"
        ? transportUnavailableReason()
        : "No active live turn is available to interrupt.";

  const steerState: CodexSessionControlState =
    args.liveTransportAvailable && (turnRunning || sessionRunning)
      ? "live"
      : args.liveTransportAvailable
        ? "disabled"
        : "unavailable";

  const steerReason =
    steerState === "live"
      ? draftText.length > 0
        ? "Steer the running turn with your draft text."
        : "Type steering instructions in the draft first."
      : steerState === "unavailable"
        ? transportUnavailableReason()
        : "A live turn must be running before steering.";

  const retryState: CodexSessionControlState =
    args.liveTransportAvailable && !sessionRunning && !sessionStarting && lastUserPrompt.length > 0
      ? "live"
      : args.liveTransportAvailable
        ? "disabled"
        : "unavailable";

  const retryReason =
    retryState === "live"
      ? "Retry the last user prompt."
      : retryState === "unavailable"
        ? transportUnavailableReason()
        : lastUserPrompt.length > 0
          ? (sessionStarting || sessionRunning)
            ? "Wait until the current turn finishes before retry."
            : "Retry is not available in this session state."
          : "No previous user prompt is available to retry.";

  return {
    interrupt: {
      state: interruptState,
      reason: interruptReason
    },
    retry: {
      state: retryState,
      reason: retryReason
    },
    steer: {
      state: steerState,
      reason: steerReason
    },
    fork: {
      state: "unsupported",
      reason: unsupportedAdapterReason("Fork")
    },
    resume: {
      state: "unsupported",
      reason: unsupportedAdapterReason("Resume")
    },
    archive: {
      state: "unsupported",
      reason: unsupportedAdapterReason("Archive")
    }
  };
}
