import type { SessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import type { SlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

export const PHASE3_SLASH_EVIDENCE_STORAGE_KEY =
  "steerboard.phase3.slashEvidenceByPanel.v1";
export const PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY =
  "steerboard.phase3.sessionControlEvidenceByPanel.v1";
export const PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE =
  "phase3-panel-evidence-local-storage";
export const DEFAULT_PHASE3_PANEL_EVIDENCE_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

export type Phase3SlashEvidenceByPanel = Record<string, SlashCommandExecutionEvidence>;
export type Phase3SessionControlEvidenceByPanel = Record<string, SessionControlReadinessEvidence>;

export interface Phase3PanelEvidenceSaveOptions {
  readonly createdAt?: string | Date;
}

export interface Phase3PanelEvidenceFreshnessOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxAgeMs?: number;
}

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

function normalizedIsoTimestamp(value: string | Date | undefined): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : new Date().toISOString();
  }

  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }

  return new Date().toISOString();
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== "phase3StorageProof")
        .sort()
        .map((key) => [key, stableValue(value[key])])
    );
  }

  return value;
}

export function createPhase3PanelEvidenceFingerprint(value: unknown): string {
  const serialized = JSON.stringify(stableValue(value));
  let hash = 0;

  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 31 + serialized.charCodeAt(index)) >>> 0;
  }

  return `phase3-panel-${hash.toString(16).padStart(8, "0")}`;
}

export function hasFreshPhase3PanelEvidenceStorageProof(
  panelId: string,
  evidence: SlashCommandExecutionEvidence | SessionControlReadinessEvidence | undefined,
  options: Phase3PanelEvidenceFreshnessOptions = {}
): boolean {
  if (!evidence?.phase3StorageProof) {
    return false;
  }

  const proof = evidence.phase3StorageProof;
  if (
    proof.source !== PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE ||
    proof.panelId !== panelId ||
    proof.evidenceFingerprint !== createPhase3PanelEvidenceFingerprint(evidence)
  ) {
    return false;
  }

  const createdAtMs = toTimestamp(proof.createdAt);
  if (createdAtMs === undefined) {
    return false;
  }

  const evaluatedAtMs = options.evaluatedAt
    ? toTimestamp(options.evaluatedAt)
    : Date.now();
  if (evaluatedAtMs === undefined) {
    return false;
  }

  const ageMs = evaluatedAtMs - createdAtMs;
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_PHASE3_PANEL_EVIDENCE_MAX_AGE_MS;

  return ageMs >= 0 && ageMs <= maxAgeMs;
}

export function shouldSavePhase3PanelEvidence(
  panelId: string,
  current: SlashCommandExecutionEvidence | SessionControlReadinessEvidence | undefined,
  next: SlashCommandExecutionEvidence | SessionControlReadinessEvidence,
  evidenceEqual: boolean,
  options: Phase3PanelEvidenceFreshnessOptions = {}
): boolean {
  if (!evidenceEqual) {
    return true;
  }

  if (next.state !== "ready" || !next.pass) {
    return false;
  }

  return !hasFreshPhase3PanelEvidenceStorageProof(panelId, current, options);
}

function normalizeStorageProof(
  value: unknown,
  panelId: string,
  evidenceFingerprint: string
): SlashCommandExecutionEvidence["phase3StorageProof"] {
  if (!isRecord(value)) {
    return undefined;
  }

  const source = safeString(value.source);
  const proofPanelId = safeString(value.panelId);
  const createdAt = safeString(value.createdAt);
  const proofFingerprint = safeString(value.evidenceFingerprint);
  const createdAtMs = Date.parse(createdAt);

  if (
    source !== PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE ||
    proofPanelId !== panelId ||
    proofFingerprint !== evidenceFingerprint ||
    !Number.isFinite(createdAtMs)
  ) {
    return undefined;
  }

  return {
    source,
    panelId: proofPanelId,
    createdAt: new Date(createdAtMs).toISOString(),
    evidenceFingerprint: proofFingerprint
  };
}

function stampPhase3PanelEvidence<T extends SlashCommandExecutionEvidence | SessionControlReadinessEvidence>(
  panelId: string,
  evidence: T,
  options: Phase3PanelEvidenceSaveOptions = {}
): T {
  const evidenceWithoutProof = {
    ...evidence,
    phase3StorageProof: undefined
  };
  delete (evidenceWithoutProof as { phase3StorageProof?: unknown }).phase3StorageProof;
  const evidenceFingerprint = createPhase3PanelEvidenceFingerprint(evidenceWithoutProof);

  return {
    ...evidenceWithoutProof,
    phase3StorageProof: {
      source: PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE,
      panelId,
      createdAt: normalizedIsoTimestamp(options.createdAt),
      evidenceFingerprint
    }
  } as T;
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

function normalizeSlashEvidence(
  panelId: string,
  value: unknown
): SlashCommandExecutionEvidence | undefined {
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

  const normalized: SlashCommandExecutionEvidence = {
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
  const evidenceFingerprint = createPhase3PanelEvidenceFingerprint(normalized);
  const phase3StorageProof = normalizeStorageProof(
    value.phase3StorageProof,
    panelId,
    evidenceFingerprint
  );

  return phase3StorageProof
    ? {
        ...normalized,
        phase3StorageProof
      }
    : normalized;
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

function normalizeSessionEvidence(
  panelId: string,
  value: unknown
): SessionControlReadinessEvidence | undefined {
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

  const normalized: SessionControlReadinessEvidence = {
    state,
    readiness: state === "ready" ? 100 : state === "blocked" ? 15 : state === "waiting" ? 35 : 65,
    pass: state === "ready",
    statusLabel: state === "ready" ? "Ready" : state === "blocked" ? "Blocked" : state === "waiting" ? "Waiting" : "Needs review",
    detail,
    safety,
    counts,
    controlStates
  };
  const evidenceFingerprint = createPhase3PanelEvidenceFingerprint(normalized);
  const phase3StorageProof = normalizeStorageProof(
    value.phase3StorageProof,
    panelId,
    evidenceFingerprint
  );

  return phase3StorageProof
    ? {
        ...normalized,
        phase3StorageProof
      }
    : normalized;
}

export function parseStoredPhase3SlashEvidenceByPanel(
  serialized: string | null
): Phase3SlashEvidenceByPanel {
  const parsed = parseMap(serialized);
  const entries = Object.entries(parsed)
    .map(([panelId, value]) => [panelId, normalizeSlashEvidence(panelId, value)] as const)
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
    .map(([panelId, value]) => [panelId, normalizeSessionEvidence(panelId, value)] as const)
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

export function savePhase3SlashEvidenceByPanel(
  evidenceByPanel: Phase3SlashEvidenceByPanel,
  options: Phase3PanelEvidenceSaveOptions = {}
): Phase3SlashEvidenceByPanel {
  const stampedEvidenceByPanel = Object.fromEntries(
    Object.entries(evidenceByPanel)
      .map(([panelId, evidence]) => [
        panelId,
        evidence.state === "ready" && evidence.pass
          ? stampPhase3PanelEvidence(panelId, evidence, options)
          : evidence
      ])
  );
  const readyEvidenceByPanel = Object.fromEntries(
    Object.entries(stampedEvidenceByPanel).filter(
      ([, evidence]) => evidence.state === "ready" && evidence.pass
    )
  );

  writeToLocalStorage(PHASE3_SLASH_EVIDENCE_STORAGE_KEY, JSON.stringify(readyEvidenceByPanel));
  return stampedEvidenceByPanel;
}

export function savePhase3SessionControlEvidenceByPanel(
  evidenceByPanel: Phase3SessionControlEvidenceByPanel,
  options: Phase3PanelEvidenceSaveOptions = {}
): Phase3SessionControlEvidenceByPanel {
  const stampedEvidenceByPanel = Object.fromEntries(
    Object.entries(evidenceByPanel)
      .map(([panelId, evidence]) => [
        panelId,
        evidence.state === "ready" && evidence.pass
          ? stampPhase3PanelEvidence(panelId, evidence, options)
          : evidence
      ])
  );
  const readyEvidenceByPanel = Object.fromEntries(
    Object.entries(stampedEvidenceByPanel).filter(
      ([, evidence]) => evidence.state === "ready" && evidence.pass
    )
  );

  writeToLocalStorage(
    PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY,
    JSON.stringify(readyEvidenceByPanel)
  );
  return stampedEvidenceByPanel;
}
