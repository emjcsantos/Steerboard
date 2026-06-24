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
  resumableThreadId?: string;
  providerCapabilities?: Partial<Record<"fork" | "resume" | "archive", boolean>>;
}

export interface CodexUnsupportedSessionControlsSummary {
  count: number;
  label: string;
  detail: string;
}

export type CodexSessionLifecycleControlState = "ready" | "review" | "unsupported";

export interface CodexSessionLifecycleControlsGate {
  state: CodexSessionLifecycleControlState;
  statusLabel: string;
  canUseLifecycleControls: boolean;
  supportedCount: number;
  handlerReadyCount: number;
  unsupportedCount: number;
  disabledCount: number;
  liveCount: number;
  proof: string;
  detail: string;
  nextAction: string;
  safety: string;
}

export interface CodexSessionLifecycleHandlerAvailability {
  fork?: boolean;
  resume?: boolean;
  archive?: boolean;
}

const unsupportedControlLabelById: Record<CodexSessionControlId, string> = {
  interrupt: "Interrupt",
  retry: "Retry",
  steer: "Steer",
  fork: "Fork",
  resume: "Resume",
  archive: "Archive"
};

const unsupportedControlOrder: readonly CodexSessionControlId[] = [
  "interrupt",
  "retry",
  "steer",
  "fork",
  "resume",
  "archive"
];
const lifecycleControlOrder: ReadonlyArray<"fork" | "resume" | "archive"> = [
  "fork",
  "resume",
  "archive"
];
const LIFECYCLE_GATE_SAFETY =
  "Lifecycle control gate is evidence-only. It does not fork, resume, archive, mutate sessions, call provider endpoints, or persist lifecycle changes.";

export function summarizeUnsupportedSessionControls(
  controls: CodexSessionControls
): CodexUnsupportedSessionControlsSummary {
  const entries = unsupportedControlOrder.flatMap((controlId) => {
    const control = controls[controlId];
    return control.state === "unsupported"
      ? [`${unsupportedControlLabelById[controlId]}: ${control.reason}`]
      : [];
  });

  if (entries.length === 0) {
    return {
      count: 0,
      label: "No unsupported controls",
      detail: "No unsupported controls are currently available."
    };
  }

  const countLabel = entries.length === 1 ? "1 unsupported control" : `${entries.length} unsupported controls`;

  return {
    count: entries.length,
    label: countLabel,
    detail: `${countLabel}: ${entries.join(" | ")}`
  };
}

export function buildCodexSessionLifecycleControlsGate(
  controls: CodexSessionControls,
  handlers: CodexSessionLifecycleHandlerAvailability = {}
): CodexSessionLifecycleControlsGate {
  const liveCount = lifecycleControlOrder.filter(
    (controlId) => controls[controlId].state === "live"
  ).length;
  const disabledCount = lifecycleControlOrder.filter(
    (controlId) => controls[controlId].state === "disabled"
  ).length;
  const unsupportedCount = lifecycleControlOrder.filter(
    (controlId) => controls[controlId].state === "unsupported"
  ).length;
  const supportedCount = lifecycleControlOrder.length - unsupportedCount;
  const handlerReadyCount = lifecycleControlOrder.filter(
    (controlId) => controls[controlId].state === "live" && handlers[controlId] === true
  ).length;
  const canUseLifecycleControls = liveCount > 0 && handlerReadyCount === liveCount;
  const state: CodexSessionLifecycleControlState = canUseLifecycleControls
    ? "ready"
    : supportedCount > 0
      ? "review"
      : "unsupported";
  const statusLabel =
    state === "ready" ? "Lifecycle ready" : state === "review" ? "Lifecycle held" : "Unsupported";
  const proof =
    `lifecycleControls state=${state} canUse=${canUseLifecycleControls ? "yes" : "no"} ` +
    `supported=${supportedCount}/3 live=${liveCount}/3 disabled=${disabledCount}/3 ` +
    `handlers=${handlerReadyCount}/${liveCount} unsupported=${unsupportedCount}/3 safety=metadata-only`;
  const detail =
    state === "ready"
      ? "Provider-supported lifecycle controls have matching action handlers."
      : supportedCount > 0
        ? "Provider-supported lifecycle controls are visible, but execution remains held until live state and matching handlers are present."
        : "Provider lifecycle controls are honestly unsupported by the current adapter.";
  const nextAction =
    state === "ready"
      ? "Route lifecycle controls only through provider-supported handlers with owner-visible evidence."
      : supportedCount > 0
        ? "Attach provider lifecycle handlers before enabling fork, resume, or archive."
        : "Keep fork, resume, and archive disabled until the provider advertises lifecycle support.";

  return {
    state,
    statusLabel,
    canUseLifecycleControls,
    supportedCount,
    handlerReadyCount,
    unsupportedCount,
    disabledCount,
    liveCount,
    proof,
    detail,
    nextAction,
    safety: LIFECYCLE_GATE_SAFETY
  };
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

function lifecycleControl(
  action: "Fork" | "Resume" | "Archive",
  supported: boolean | undefined,
  liveTransportAvailable: boolean,
  canUseWhenSupported: boolean,
  liveReason: string,
  disabledReason: string
): CodexSessionControlSnapshot {
  if (!supported) {
    return {
      state: "unsupported",
      reason: unsupportedAdapterReason(action)
    };
  }

  if (!liveTransportAvailable) {
    return {
      state: "unavailable",
      reason: transportUnavailableReason()
    };
  }

  return canUseWhenSupported
    ? {
        state: "live",
        reason: liveReason
      }
    : {
        state: "disabled",
        reason: disabledReason
      };
}

export function buildCodexSessionControls(
  args: CodexSessionControlInputs
): CodexSessionControls {
  const sessionStatus = normalizeSessionStatus(args.sessionStatus);
  const activeTurnStatus = normalizeTurnStatus(args.activeTurn?.status);
  const lastUserPrompt = trimOrEmpty(args.lastUserPrompt);
  const draftText = trimOrEmpty(args.draftText);
  const resumableThreadId = trimOrEmpty(args.resumableThreadId);

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
    fork: lifecycleControl(
      "Fork",
      args.providerCapabilities?.fork,
      args.liveTransportAvailable,
      !sessionStarting && !sessionRunning && lastUserPrompt.length > 0,
      "Fork this panel from the last completed prompt.",
      sessionStarting || sessionRunning
        ? "Wait until the current turn finishes before forking."
        : "No previous user prompt is available to fork."
    ),
    resume: lifecycleControl(
      "Resume",
      args.providerCapabilities?.resume,
      args.liveTransportAvailable,
      (!sessionStarting && !sessionRunning && resumableThreadId.length > 0) ||
        sessionStatus === "interrupted" ||
        sessionStatus === "failed",
      resumableThreadId.length > 0
        ? "Resume the saved provider thread without replaying local prompts."
        : "Resume this interrupted or failed panel session.",
      "Resume is available only after a provider thread id is available or the session is interrupted/failed."
    ),
    archive: lifecycleControl(
      "Archive",
      args.providerCapabilities?.archive,
      args.liveTransportAvailable,
      sessionStatus === "completed" || sessionStatus === "interrupted" || sessionStatus === "failed",
      "Archive this completed, interrupted, or failed panel session.",
      "Archive is available only after the panel session reaches a terminal state."
    )
  };
}
