export const PANEL_SESSION_STATE_STORAGE_KEY = "steerboard.panelSessionState.v1";
export const PANEL_SESSION_STALE_AFTER_MS = 10 * 60 * 1000;

export type CodexPanelSessionStatus =
  | "starting"
  | "active"
  | "idle"
  | "closed"
  | "error"
  | "unknown";

export interface CodexPanelSessionStateRecord {
  panelId: string;
  provider: string;
  sessionId: string;
  threadId: string;
  status: CodexPanelSessionStatus;
  checkedAt: string | null;
  updatedAt: string | null;
  stale: boolean;
  detail: string;
}

export type CodexPanelSessionState = Record<string, CodexPanelSessionStateRecord>;

type PanelSessionRawState = Partial<CodexPanelSessionStateRecord> | null | undefined;

export interface RepairPanelSessionsOptions {
  now?: number;
  staleAfterMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

const validStatuses: ReadonlyArray<CodexPanelSessionStatus> = [
  "starting",
  "active",
  "idle",
  "closed",
  "error",
  "unknown"
];

function hasValidStatus(value: unknown): value is CodexPanelSessionStatus {
  return validStatuses.includes(value as CodexPanelSessionStatus);
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function isStaleByTimestamp(
  checkedAt: string | null,
  now: number,
  staleAfterMs: number
): boolean {
  if (!checkedAt) {
    return true;
  }

  const parsed = Date.parse(checkedAt);
  if (Number.isNaN(parsed)) {
    return true;
  }

  return now - parsed >= staleAfterMs;
}

function nowStamp(now: number): string {
  return new Date(now).toISOString();
}

function hydratePanelSessionStateRecord(
  panelId: string,
  raw: PanelSessionRawState,
  seen: Set<string>,
  options: RepairPanelSessionsOptions
): CodexPanelSessionStateRecord | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const panelRecordId = isString(raw.panelId) ? raw.panelId : panelId;
  if (!isString(panelRecordId) || seen.has(panelRecordId)) {
    return undefined;
  }

  if (!isString(raw.provider) || !isString(raw.sessionId) || !isString(raw.threadId)) {
    return undefined;
  }

  const status = hasValidStatus(raw.status) ? raw.status : "unknown";
  const checkedAt = normalizeTimestamp(raw.checkedAt);
  const updatedAt = normalizeTimestamp(raw.updatedAt);
  const stale = isBoolean(raw.stale) ? raw.stale : false;
  const detail = isString(raw.detail) ? raw.detail : "No session detail available.";

  const now = options.now ?? Date.now();
  const staleAfterMs = options.staleAfterMs ?? PANEL_SESSION_STALE_AFTER_MS;
  const repairedStale = stale || isStaleByTimestamp(checkedAt, now, staleAfterMs);

  const record: CodexPanelSessionStateRecord = {
    panelId: panelRecordId,
    provider: raw.provider,
    sessionId: raw.sessionId,
    threadId: raw.threadId,
    status,
    checkedAt,
    updatedAt,
    stale: repairedStale,
    detail
  };

  seen.add(panelRecordId);
  return record;
}

export function parseStoredPanelSessionState(
  serialized: string | null,
  options: RepairPanelSessionsOptions = {}
): CodexPanelSessionState {
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized);
    if (Array.isArray(parsed)) {
      const next: CodexPanelSessionState = {};
      const seen = new Set<string>();
      for (const raw of parsed) {
        const record = hydratePanelSessionStateRecord("", raw, seen, options);
        if (!record) {
          continue;
        }

        next[record.panelId] = record;
      }
      return next;
    }

    if (isRecord(parsed)) {
      const seen = new Set<string>();
      const next: CodexPanelSessionState = {};
      for (const [panelId, raw] of Object.entries(parsed)) {
        const record = hydratePanelSessionStateRecord(panelId, raw, seen, options);
        if (record) {
          next[record.panelId] = record;
        }
      }
      return next;
    }
  } catch {
    return {};
  }

  return {};
}

export const parsePanelSessionState = parseStoredPanelSessionState;

export function loadPanelSessionState(
  options: RepairPanelSessionsOptions = {}
): CodexPanelSessionState {
  if (typeof window === "undefined") {
    return {};
  }

  return parseStoredPanelSessionState(window.localStorage.getItem(PANEL_SESSION_STATE_STORAGE_KEY), options);
}

export function savePanelSessionState(state: CodexPanelSessionState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PANEL_SESSION_STATE_STORAGE_KEY, JSON.stringify(state));
}

export function createInitialPanelSessionState(): CodexPanelSessionState {
  return {};
}

function touchPanelSessionRecord(record: CodexPanelSessionStateRecord, now: number): CodexPanelSessionStateRecord {
  const checkedAt = nowStamp(now);
  return {
    ...record,
    checkedAt,
    updatedAt: checkedAt,
    stale: false
  };
}

export function upsertPanelSession(
  state: CodexPanelSessionState,
  panelId: string,
  patch: Partial<CodexPanelSessionStateRecord>,
  now = Date.now()
): CodexPanelSessionState {
  const previous = state[panelId];
  const withDefaults: CodexPanelSessionStateRecord = previous
    ? touchPanelSessionRecord(
        {
          ...previous,
          ...patch,
          panelId,
          status: hasValidStatus(patch.status) ? patch.status : previous.status,
          provider: isString(patch.provider) ? patch.provider : previous.provider,
          sessionId: isString(patch.sessionId) ? patch.sessionId : previous.sessionId,
          threadId: isString(patch.threadId) ? patch.threadId : previous.threadId,
          detail: isString(patch.detail) ? patch.detail : previous.detail
        },
        now
      )
    : {
        panelId,
        provider: isString(patch.provider) ? patch.provider : "codex",
        sessionId: isString(patch.sessionId) ? patch.sessionId : "session:unknown",
        threadId: isString(patch.threadId) ? patch.threadId : "thread:unknown",
        status: hasValidStatus(patch.status) ? patch.status : "idle",
        checkedAt: nowStamp(now),
        updatedAt: nowStamp(now),
        stale: false,
        detail: isString(patch.detail) ? patch.detail : "Session metadata upserted."
      };

  return {
    ...state,
    [panelId]: withDefaults
  };
}

export function startPanelSession(
  state: CodexPanelSessionState,
  panelId: string,
  options: {
    provider: string;
    sessionId: string;
    threadId: string;
    detail?: string;
  },
  now = Date.now()
): CodexPanelSessionState {
  return upsertPanelSession(
    state,
    panelId,
    {
      ...options,
      status: "starting",
      detail: options.detail ?? "Panel session start requested."
    },
    now
  );
}

export function updatePanelSession(
  state: CodexPanelSessionState,
  panelId: string,
  patch: Partial<CodexPanelSessionStateRecord>,
  now = Date.now()
): CodexPanelSessionState {
  if (!state[panelId]) {
    return state;
  }

  const repaired = touchPanelSessionRecord(
    {
      ...state[panelId],
      ...patch,
      panelId,
      status: hasValidStatus(patch.status) ? patch.status : state[panelId].status
    },
    now
  );

  return {
    ...state,
    [panelId]: repaired
  };
}

export function closePanelSession(
  state: CodexPanelSessionState,
  panelId: string,
  detail?: string,
  now = Date.now()
): CodexPanelSessionState {
  if (!state[panelId]) {
    return state;
  }

  return updatePanelSession(
    state,
    panelId,
    {
      status: "closed",
      detail: detail ?? "Panel session closed.",
      stale: false
    },
    now
  );
}

export function markPanelSessionStale(
  state: CodexPanelSessionState,
  panelId: string,
  detail?: string,
  now = Date.now()
): CodexPanelSessionState {
  if (!state[panelId]) {
    return state;
  }

  const record = state[panelId];
  return {
    ...state,
    [panelId]: {
      ...record,
      stale: true,
      detail: detail ?? record.detail,
      updatedAt: nowStamp(now)
    }
  };
}

export function removePanelSession(
  state: CodexPanelSessionState,
  panelId: string
): CodexPanelSessionState {
  if (!state[panelId]) {
    return state;
  }

  const next = { ...state };
  delete next[panelId];
  return next;
}
