export const PANEL_AGENT_SETTINGS_STORAGE_KEY = "steerboard.panelAgentSettings.v1";

export const codexPanelModelOptions = [
  { label: "GPT-5.5", value: "gpt-5.5" },
  { label: "GPT-5.4", value: "gpt-5.4" },
  { label: "GPT-5.4 Mini", value: "gpt-5.4-mini" },
  { label: "GPT-5.3 Codex Spark", value: "gpt-5.3-codex-spark" },
  { label: "Provider default", value: "provider-default" }
] as const;

export const codexPanelReasoningOptions = [
  { label: "Minimal", value: "minimal" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "X High", value: "xhigh" }
] as const;

export const codexPanelPermissionModeOptions = [
  { label: "Full Agent", value: "full-agent" },
  { label: "Workspace Agent", value: "workspace-agent" },
  { label: "Read-only Agent", value: "read-only-agent" },
  { label: "Chat Only", value: "chat-only" }
] as const;

export type CodexPanelModel = string;
export type CodexPanelReasoning = (typeof codexPanelReasoningOptions)[number]["value"];
export type CodexPanelPermissionMode = (typeof codexPanelPermissionModeOptions)[number]["value"];

export interface CodexPanelAgentSettings {
  model: CodexPanelModel;
  reasoning: CodexPanelReasoning;
  permissionMode: CodexPanelPermissionMode;
}

export const defaultCodexPanelAgentSettings: CodexPanelAgentSettings = {
  model: "gpt-5.5",
  reasoning: "low",
  permissionMode: "full-agent"
};

export type CodexPanelAgentSettingsState = Record<string, CodexPanelAgentSettings>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeModel(value: unknown): CodexPanelModel {
  if (value === "codex-agent") {
    return "gpt-5.5";
  }

  if (typeof value !== "string") {
    return defaultCodexPanelAgentSettings.model;
  }

  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{0,99}$/.test(normalized)
    ? normalized
    : defaultCodexPanelAgentSettings.model;
}

function normalizeReasoning(value: unknown): CodexPanelReasoning {
  if (value === "extra-high") {
    return "xhigh";
  }

  return codexPanelReasoningOptions.some((option) => option.value === value)
    ? (value as CodexPanelReasoning)
    : defaultCodexPanelAgentSettings.reasoning;
}

function normalizePermissionMode(value: unknown): CodexPanelPermissionMode {
  return codexPanelPermissionModeOptions.some((option) => option.value === value)
    ? (value as CodexPanelPermissionMode)
    : defaultCodexPanelAgentSettings.permissionMode;
}

export function normalizeCodexPanelAgentSettings(value: unknown): CodexPanelAgentSettings {
  if (!isRecord(value)) {
    return defaultCodexPanelAgentSettings;
  }

  return {
    model: normalizeModel(value.model),
    reasoning: normalizeReasoning(value.reasoning),
    permissionMode: normalizePermissionMode(value.permissionMode)
  };
}

export function parseStoredCodexPanelAgentSettings(
  serialized: string | null
): CodexPanelAgentSettingsState {
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([panelId]) => panelId.trim().length > 0)
        .map(([panelId, settings]) => [
          panelId,
          normalizeCodexPanelAgentSettings(settings)
        ])
    );
  } catch {
    return {};
  }
}

export function loadCodexPanelAgentSettings(panelId: string): CodexPanelAgentSettings {
  if (typeof window === "undefined") {
    return defaultCodexPanelAgentSettings;
  }

  const stored = parseStoredCodexPanelAgentSettings(
    window.localStorage.getItem(PANEL_AGENT_SETTINGS_STORAGE_KEY)
  );
  return stored[panelId] ?? defaultCodexPanelAgentSettings;
}

export function saveCodexPanelAgentSettings(
  panelId: string,
  settings: CodexPanelAgentSettings
): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored = parseStoredCodexPanelAgentSettings(
    window.localStorage.getItem(PANEL_AGENT_SETTINGS_STORAGE_KEY)
  );
  window.localStorage.setItem(
    PANEL_AGENT_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...stored,
      [panelId]: normalizeCodexPanelAgentSettings(settings)
    })
  );
}

export function getCodexPanelModelLabel(model: CodexPanelModel): string {
  return codexPanelModelOptions.find((option) => option.value === model)?.label ?? model;
}

export function getCodexPanelReasoningLabel(reasoning: CodexPanelReasoning): string {
  return codexPanelReasoningOptions.find((option) => option.value === reasoning)?.label ?? reasoning;
}

export function getCodexPanelPermissionModeLabel(
  permissionMode: CodexPanelPermissionMode
): string {
  return codexPanelPermissionModeOptions.find((option) => option.value === permissionMode)?.label ?? permissionMode;
}
