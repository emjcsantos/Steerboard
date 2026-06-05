export type CommandCatalogState = "live" | "preview" | "unsupported" | "unavailable";

export type CommandCatalogScope = "panel" | "app" | "global";

export type CommandCatalogEntry = {
  command: string;
  label: string;
  detail: string;
  state: CommandCatalogState;
  scopes: CommandCatalogScope[];
};

export type CommandExecutionDecisionSeverity = "error" | "warning" | "info" | "success";

export interface CommandExecutionFeedback {
  statusLabel: string;
  severity: CommandExecutionDecisionSeverity;
  nextAction: string;
}

type CommandExecutionDecisionState = CommandCatalogState;

type UnknownCommand = {
  state: "unsupported";
  executable: false;
  reason: string;
  entry?: undefined;
  feedback: CommandExecutionFeedback;
};

type ExecutableDecision = {
  state: Exclude<CommandExecutionDecisionState, "unsupported" | "unavailable">;
  executable: true;
  reason: string;
  entry: CommandCatalogEntry;
  feedback: CommandExecutionFeedback;
};

type NonExecutableDecision = {
  state: "unsupported" | "unavailable";
  executable: false;
  reason: string;
  entry?: CommandCatalogEntry;
  feedback: CommandExecutionFeedback;
};

export type CommandExecutionDecision = UnknownCommand | ExecutableDecision | NonExecutableDecision;

const DEFAULT_SCOPES: CommandCatalogScope[] = ["panel", "app", "global"];
const DEFAULT_FALLBACK_REASON = "No fallback command catalog is available.";

export const defaultCommandCatalog: readonly CommandCatalogEntry[] = [
  {
    command: "/plan",
    label: "Plan",
    detail: "Draft a practical plan for the current panel context.",
    state: "live",
    scopes: ["panel", "app"]
  },
  {
    command: "/handoff",
    label: "Handoff",
    detail: "Create a scoped worker handoff from current context.",
    state: "live",
    scopes: ["panel", "global"]
  },
  {
    command: "/validate",
    label: "Validate",
    detail: "Run checks and summarize evidence for the current scope.",
    state: "preview",
    scopes: ["panel"]
  },
  {
    command: "/summarize",
    label: "Summarize",
    detail: "Condense ongoing activity into a short transition summary.",
    state: "preview",
    scopes: ["panel", "global"]
  },
  {
    command: "/status",
    label: "Status",
    detail: "Check status across the active orchestration surface.",
    state: "live",
    scopes: ["app", "global"]
  },
  {
    command: "/review",
    label: "Review",
    detail: "Collect review-oriented signals for the current context.",
    state: "preview",
    scopes: ["panel", "app"]
  },
  {
    command: "/mcp",
    label: "MCP",
    detail: "Inspect MCP-facing handoff context and adapters.",
    state: "unsupported",
    scopes: ["app", "global"]
  }
];

function isCommandCatalogState(value: unknown): value is CommandCatalogState {
  return (
    value === "live" ||
    value === "preview" ||
    value === "unsupported" ||
    value === "unavailable"
  );
}

function isCommandCatalogScope(value: unknown): value is CommandCatalogScope {
  return value === "panel" || value === "app" || value === "global";
}

function uniqueCatalogScopes(value: unknown): CommandCatalogScope[] {
  if (Array.isArray(value)) {
    const unique = value
      .filter(isCommandCatalogScope)
      .filter((scope, index, list) => list.indexOf(scope) === index);
    return unique.length > 0 ? unique : [...DEFAULT_SCOPES];
  }

  if (isCommandCatalogScope(value)) {
    return [value];
  }

  return [...DEFAULT_SCOPES];
}

function normalizeCommandToken(value: unknown, requireExactToken = false): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const firstToken = trimmed.split(/\s+/)[0]?.toLowerCase();
  if (!firstToken || !firstToken.startsWith("/")) {
    return undefined;
  }

  if (requireExactToken && trimmed.toLowerCase() !== firstToken) {
    return undefined;
  }

  return firstToken.startsWith("/") && firstToken.length >= 2 ? firstToken : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceCommandCatalogEntry(raw: unknown): CommandCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const command = normalizeCommandToken(raw.command, true);
  if (!command) {
    return undefined;
  }

  const label =
    typeof raw.label === "string" && raw.label.trim().length > 0
      ? raw.label.trim()
      : command.substring(1).charAt(0).toUpperCase() + command.substring(2).toLowerCase();
  const detail = typeof raw.detail === "string" ? raw.detail.trim() : "";
  const state = isCommandCatalogState(raw.state) ? raw.state : "unavailable";
  const scopes = uniqueCatalogScopes(raw.scopes);

  return {
    command,
    label,
    detail,
    state,
    scopes
  };
}

function normalizeCommandCatalogInternal(value: unknown): CommandCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value
    .map(coerceCommandCatalogEntry)
    .filter((entry): entry is CommandCatalogEntry => Boolean(entry))
    .filter((entry, index, list) => list.findIndex((item) => item.command === entry.command) === index);

  return entries;
}

function commandFeedback(
  statusLabel: string,
  severity: CommandExecutionDecisionSeverity,
  nextAction: string
): CommandExecutionFeedback {
  return { statusLabel, severity, nextAction };
}

export function normalizeCommandCatalog(
  value: unknown,
  fallback: readonly CommandCatalogEntry[] = defaultCommandCatalog
): CommandCatalogEntry[] {
  const normalized = normalizeCommandCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const normalizedFallback = normalizeCommandCatalogInternal(fallback);
  if (normalizedFallback.length > 0) {
    return normalizedFallback;
  }

  return [
    {
      command: "/help",
      label: "Help",
      detail: DEFAULT_FALLBACK_REASON,
      state: "preview",
      scopes: [...DEFAULT_SCOPES]
    }
  ];
}

function normalizeDraftText(value: string): string {
  return value.trimStart();
}

function extractCommandToken(value: string): string {
  return normalizeDraftText(value).split(/\s+/)[0]?.toLowerCase() ?? "";
}

export function getCommandCatalogSuggestions(
  draft: string,
  catalog: readonly CommandCatalogEntry[] = defaultCommandCatalog
): CommandCatalogEntry[] {
  const normalizedDraft = normalizeDraftText(draft);
  if (!normalizedDraft.startsWith("/")) {
    return [];
  }

  const query = extractCommandToken(normalizedDraft).toLowerCase();
  const safeCatalog = normalizeCommandCatalog(catalog);
  return safeCatalog.filter((entry) => entry.command.startsWith(query));
}

export function findCommandCatalogEntry(
  submitted: string,
  catalog: readonly CommandCatalogEntry[] = defaultCommandCatalog
): CommandCatalogEntry | undefined {
  const normalizedSubmitted = extractCommandToken(submitted);
  if (!normalizedSubmitted) {
    return undefined;
  }

  return normalizeCommandCatalog(catalog).find((entry) => entry.command === normalizedSubmitted);
}

export function buildCommandExecutionDecision(
  submitted: string,
  liveTransportAvailable: boolean,
  catalog: readonly CommandCatalogEntry[] = defaultCommandCatalog
): CommandExecutionDecision {
  const entry = findCommandCatalogEntry(submitted, catalog);
  if (!entry) {
    const normalizedSubmitted = extractCommandToken(submitted);
    return {
      state: "unsupported",
      executable: false,
      reason: normalizedSubmitted.length > 1
        ? `Unknown slash command ${normalizedSubmitted}.`
        : "A valid slash command is required.",
      feedback: commandFeedback(
        "Unknown",
        "error",
        normalizedSubmitted.length > 1
          ? "Use a supported slash command from the catalog."
          : "Start with a valid slash command."
      )
    };
  }

  if (entry.state === "live" && !liveTransportAvailable) {
    return {
      state: "unavailable",
      executable: false,
      reason: `Live transport is not available for ${entry.command}.`,
      entry,
      feedback: commandFeedback(
        "Blocked",
        "warning",
        "Enable live transport or retry once provider connectivity is active."
      )
    };
  }

  if (entry.state === "live") {
    return {
      state: "live",
      executable: true,
      reason: `${entry.command} is available in live mode.`,
      entry,
      feedback: commandFeedback(
        "Ready",
        "success",
        "Route this command through the connected provider."
      )
    };
  }

  if (entry.state === "preview") {
    return {
      state: "preview",
      executable: true,
      reason: `${entry.command} runs in preview mode.`,
      entry,
      feedback: commandFeedback(
        "Preview",
        "info",
        "Run locally and review staged result before provider execution."
      )
    };
  }

  return {
    state: entry.state,
    executable: false,
    reason: entry.state === "unsupported"
      ? `${entry.command} is unsupported in this catalog context.`
      : `${entry.command} is unavailable in this environment.`,
    entry,
    feedback: commandFeedback(
      entry.state === "unsupported" ? "Unsupported" : "Unavailable",
      entry.state === "unsupported" ? "error" : "warning",
      entry.state === "unsupported"
        ? "Use a supported command that is enabled for this panel."
        : "Retry when this command is enabled in this environment."
    )
  };
}
