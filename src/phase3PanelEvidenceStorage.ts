import type { SessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import type { SlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

export const PHASE3_SLASH_EVIDENCE_STORAGE_KEY =
  "steerboard.phase3.slashEvidenceByPanel.v1";
export const PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY =
  "steerboard.phase3.sessionControlEvidenceByPanel.v1";

export type Phase3SlashEvidenceByPanel = Record<string, SlashCommandExecutionEvidence>;
export type Phase3SessionControlEvidenceByPanel = Record<string, SessionControlReadinessEvidence>;

const SLASH_STATES = new Set(["ready", "review", "blocked", "waiting"]);
const SLASH_ROUTES = new Set(["provider", "local-preview", "blocked", "none"]);
const CONTROL_STATES = new Set(["ready", "review", "blocked", "waiting"]);
const CANONICAL_CONTROL_STATES = new Set(["live", "review", "unsupported", "blocked", "waiting"]);
const CANONICAL_CONTROLS = ["interrupt", "retry", "steer", "fork", "resume", "archive"] as const;
const REQUIRED_CONTROLS = ["interrupt", "retry", "steer"] as const;
const LIFECYCLE_CONTROLS = ["fork", "resume", "archive"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeOptionalString(value: unknown): string | undefined {
  const text = safeString(value);
  return text.length > 0 ? text : undefined;
}

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safePercent(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function readFromLocalStorage(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(key);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(key, value);
  } catch {
    return;
  }
}

function parseMap(serialized: string | null): Record<string, unknown> {
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeSlashEvidence(value: unknown): SlashCommandExecutionEvidence | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const route = safeString(value.route);
  const evidence = isRecord(value.evidence) ? value.evidence : {};
  const status = safeString(value.status);
  const detail = safeString(value.detail);
  const safety = safeString(value.safety);

  if (!SLASH_ROUTES.has(route) || !status || !detail || !safety) {
    return undefined;
  }

  const normalizedEvidence = {
    providerRoute: safeCount(evidence.providerRoute),
    status: safeCount(evidence.status),
    live: safeCount(evidence.live),
    error: safeCount(evidence.error)
  };
  const hasProviderResult =
    route === "provider" &&
    safeBoolean(value.executable) &&
    normalizedEvidence.providerRoute > 0 &&
    (normalizedEvidence.status > 0 || normalizedEvidence.live > 0) &&
    normalizedEvidence.error === 0;
  const state = hasProviderResult
    ? "ready"
    : route === "blocked" || normalizedEvidence.error > 0
      ? "blocked"
      : route === "none"
        ? "waiting"
        : "review";

  return {
    route: route as SlashCommandExecutionEvidence["route"],
    state,
    executable: safeBoolean(value.executable),
    command: safeOptionalString(value.command),
    status: state === "ready" ? "Ready" : state === "blocked" ? "Blocked" : state === "waiting" ? "Waiting" : "Review",
    readiness: state === "ready" ? 100 : state === "blocked" ? 0 : state === "waiting" ? 0 : 40,
    pass: state === "ready",
    detail,
    safety,
    evidence: normalizedEvidence
  };
}

function countControlStates(
  controlStates: SessionControlReadinessEvidence["controlStates"]
): SessionControlReadinessEvidence["counts"] {
  return {
    live: CANONICAL_CONTROLS.filter((control) => controlStates[control] === "live").length,
    review: CANONICAL_CONTROLS.filter((control) => controlStates[control] === "review").length,
    unsupported: CANONICAL_CONTROLS.filter((control) => controlStates[control] === "unsupported").length,
    blocked: CANONICAL_CONTROLS.filter((control) => controlStates[control] === "blocked").length
  };
}

function deriveSessionState(
  controlStates: SessionControlReadinessEvidence["controlStates"],
  incomingReady: boolean
): SessionControlReadinessEvidence["state"] {
  if (CANONICAL_CONTROLS.some((control) => controlStates[control] === "blocked")) {
    return "blocked";
  }

  const requiredSignaled = REQUIRED_CONTROLS.every(
    (control) => controlStates[control] === "live" || controlStates[control] === "review"
  );
  const lifecycleSignaled = LIFECYCLE_CONTROLS.every((control) =>
    ["live", "review", "unsupported"].includes(controlStates[control])
  );

  if (incomingReady && requiredSignaled && lifecycleSignaled) {
    return "ready";
  }

  if (
    CANONICAL_CONTROLS.some((control) =>
      ["live", "review", "unsupported"].includes(controlStates[control])
    )
  ) {
    return "review";
  }

  return "waiting";
}

function normalizeSessionEvidence(value: unknown): SessionControlReadinessEvidence | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const rawState = safeString(value.state);
  const rawControlStates = isRecord(value.controlStates) ? value.controlStates : {};
  const statusLabel = safeString(value.statusLabel);
  const detail = safeString(value.detail);
  const safety = safeString(value.safety);

  if (!CONTROL_STATES.has(rawState) || !statusLabel || !detail || !safety) {
    return undefined;
  }

  const controlStates = Object.fromEntries(
    CANONICAL_CONTROLS.map((control) => {
      const rawState = safeString(rawControlStates[control]);
      return [control, CANONICAL_CONTROL_STATES.has(rawState) ? rawState : "waiting"];
    })
  ) as SessionControlReadinessEvidence["controlStates"];
  const state = deriveSessionState(controlStates, rawState === "ready" && safeBoolean(value.pass));
  const counts = countControlStates(controlStates);

  return {
    state,
    readiness: state === "ready" ? 100 : state === "blocked" ? 15 : state === "waiting" ? 35 : 65,
    pass: state === "ready",
    statusLabel: state === "ready" ? "Ready" : state === "blocked" ? "Blocked" : state === "waiting" ? "Waiting" : "Needs review",
    detail,
    safety,
    counts,
    controlStates
  };
}

export function parseStoredPhase3SlashEvidenceByPanel(
  serialized: string | null
): Phase3SlashEvidenceByPanel {
  const parsed = parseMap(serialized);
  const entries = Object.entries(parsed)
    .map(([panelId, value]) => [panelId, normalizeSlashEvidence(value)] as const)
    .filter((entry): entry is readonly [string, SlashCommandExecutionEvidence] =>
      safeString(entry[0]).length > 0 && Boolean(entry[1])
    );

  return Object.fromEntries(entries);
}

export function parseStoredPhase3SessionControlEvidenceByPanel(
  serialized: string | null
): Phase3SessionControlEvidenceByPanel {
  const parsed = parseMap(serialized);
  const entries = Object.entries(parsed)
    .map(([panelId, value]) => [panelId, normalizeSessionEvidence(value)] as const)
    .filter((entry): entry is readonly [string, SessionControlReadinessEvidence] =>
      safeString(entry[0]).length > 0 && Boolean(entry[1])
    );

  return Object.fromEntries(entries);
}

export function loadPhase3SlashEvidenceByPanel(): Phase3SlashEvidenceByPanel {
  return parseStoredPhase3SlashEvidenceByPanel(
    readFromLocalStorage(PHASE3_SLASH_EVIDENCE_STORAGE_KEY)
  );
}

export function loadPhase3SessionControlEvidenceByPanel(): Phase3SessionControlEvidenceByPanel {
  return parseStoredPhase3SessionControlEvidenceByPanel(
    readFromLocalStorage(PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY)
  );
}

export function savePhase3SlashEvidenceByPanel(evidenceByPanel: Phase3SlashEvidenceByPanel): void {
  const readyEvidenceByPanel = Object.fromEntries(
    Object.entries(evidenceByPanel).filter(([, evidence]) => evidence.state === "ready" && evidence.pass)
  );

  writeToLocalStorage(PHASE3_SLASH_EVIDENCE_STORAGE_KEY, JSON.stringify(readyEvidenceByPanel));
}

export function savePhase3SessionControlEvidenceByPanel(
  evidenceByPanel: Phase3SessionControlEvidenceByPanel
): void {
  const readyEvidenceByPanel = Object.fromEntries(
    Object.entries(evidenceByPanel).filter(([, evidence]) => evidence.state === "ready" && evidence.pass)
  );

  writeToLocalStorage(
    PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY,
    JSON.stringify(readyEvidenceByPanel)
  );
}
