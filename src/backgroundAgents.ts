import type { CodexProtocolLedgerEntry } from "./codexSession";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

export type BackgroundAgentStatus =
  | "queued"
  | "running"
  | "waiting-permission"
  | "completed"
  | "failed"
  | "cancelled";

export interface BackgroundAgentRecord {
  id: string;
  agentId: string;
  agentLabel: string;
  sessionId: string;
  panelId: string;
  status: BackgroundAgentStatus;
  latestActivity: string;
  progressPercent: number;
  pendingPermission?: LiveActionPermissionRequest;
  completion?: BackgroundAgentHandoff;
  error?: string;
  ledger: CodexProtocolLedgerEntry[];
  updatedAt: string;
}

export interface BackgroundAgentHandoff {
  targetPanelId: string;
  summary: string;
  reviewable: boolean;
  ledgerEntryCount: number;
  completedAt: string;
}

export interface AcpAgentDefinition {
  id: string;
  label: string;
  runtimeProfileId: string;
  setupState: "disabled" | "setup-required" | "ready";
  transport: "acp" | "stdio" | "http";
  launchEnabled: boolean;
  detail: string;
}

export const defaultAcpAgentDefinitions: AcpAgentDefinition[] = [
  {
    id: "acp-local-worker",
    label: "ACP local worker",
    runtimeProfileId: "runtime-profile-acp-local-worker",
    setupState: "setup-required",
    transport: "acp",
    launchEnabled: false,
    detail: "ACP agent profile is represented but disabled until setup and approval are explicit."
  },
  {
    id: "background-reviewer",
    label: "Background reviewer",
    runtimeProfileId: "runtime-profile-background-reviewer",
    setupState: "disabled",
    transport: "stdio",
    launchEnabled: false,
    detail: "Background reviewer is a disabled runtime profile placeholder."
  }
];

export function createBackgroundAgentRecord(input: {
  id: string;
  agentId: string;
  agentLabel: string;
  sessionId: string;
  panelId: string;
  now?: string;
}): BackgroundAgentRecord {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    agentId: input.agentId,
    agentLabel: input.agentLabel,
    sessionId: input.sessionId,
    panelId: input.panelId,
    status: "queued",
    latestActivity: "Background agent queued.",
    progressPercent: 0,
    ledger: [],
    updatedAt: now
  };
}

export function transitionBackgroundAgent(
  record: BackgroundAgentRecord,
  status: BackgroundAgentStatus,
  activity: string,
  progressPercent = record.progressPercent,
  ledgerEntry?: CodexProtocolLedgerEntry,
  now = new Date().toISOString()
): BackgroundAgentRecord {
  return {
    ...record,
    status,
    latestActivity: activity,
    progressPercent: Math.max(0, Math.min(100, Math.round(progressPercent))),
    ledger: ledgerEntry ? [...record.ledger, ledgerEntry] : record.ledger,
    updatedAt: now
  };
}

export function routeBackgroundPermissionRequest(
  record: BackgroundAgentRecord,
  permission: LiveActionPermissionRequest,
  now = new Date().toISOString()
): BackgroundAgentRecord {
  return {
    ...record,
    status: "waiting-permission",
    pendingPermission: permission,
    latestActivity: `Waiting for ${permission.provider} approval.`,
    updatedAt: now
  };
}

export function completeBackgroundAgentHandoff(
  record: BackgroundAgentRecord,
  targetPanelId: string,
  summary: string,
  now = new Date().toISOString()
): BackgroundAgentRecord {
  return {
    ...record,
    status: "completed",
    progressPercent: 100,
    pendingPermission: undefined,
    completion: {
      targetPanelId,
      summary,
      reviewable: true,
      ledgerEntryCount: record.ledger.length,
      completedAt: now
    },
    latestActivity: "Background agent completed with reviewable handoff.",
    updatedAt: now
  };
}

export function failBackgroundAgent(
  record: BackgroundAgentRecord,
  error: string,
  now = new Date().toISOString()
): BackgroundAgentRecord {
  return {
    ...record,
    status: "failed",
    error: error.trim() || "Unknown background agent failure.",
    latestActivity: "Background agent failed.",
    updatedAt: now
  };
}

export function repairBackgroundAgentRecords(value: unknown): BackgroundAgentRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is BackgroundAgentRecord =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as BackgroundAgentRecord).id === "string" &&
      typeof (item as BackgroundAgentRecord).agentId === "string"
    )
    .map((item) => ({
      ...item,
      status: normalizeBackgroundStatus(item.status),
      progressPercent: Number.isFinite(item.progressPercent)
        ? Math.max(0, Math.min(100, Math.round(item.progressPercent)))
        : 0,
      ledger: Array.isArray(item.ledger) ? item.ledger : [],
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString()
    }));
}

function normalizeBackgroundStatus(value: unknown): BackgroundAgentStatus {
  return value === "queued" ||
    value === "running" ||
    value === "waiting-permission" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled"
    ? value
    : "queued";
}

