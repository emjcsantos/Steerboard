export type AutomationState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

export type AutomationLifecycle = "idle" | "active" | "paused" | "retired";

export type AutomationTrigger =
  | "manual"
  | "scheduled"
  | "event"
  | "webhook";

export type AutomationApprovalPosture =
  | "automatic"
  | "manual"
  | "approval-required";

export type AutomationCatalogEntry = {
  id: string;
  label: string;
  lifecycle: AutomationLifecycle;
  trigger: AutomationTrigger;
  approvalPosture: AutomationApprovalPosture;
  state: AutomationState;
  detail?: string;
};

export type AutomationCatalogSummary = {
  total: number;
  live: number;
  preview: number;
  disconnected: number;
  setupRequired: number;
  unsupported: number;
  unavailable: number;
  actionable: number;
  needsAttention: number;
  availability: number;
};

export const defaultAutomationCatalog: readonly AutomationCatalogEntry[] = [
  {
    id: "workflow-checks",
    label: "Workflow Checks",
    lifecycle: "active",
    trigger: "scheduled",
    approvalPosture: "approval-required",
    state: "setup-required",
    detail: "Run periodic workflow health checks and summarize anomalies."
  },
  {
    id: "task-handoff",
    label: "Task Handoff",
    lifecycle: "active",
    trigger: "event",
    approvalPosture: "manual",
    state: "preview",
    detail: "Prepare structured handoff packets when ownership changes."
  },
  {
    id: "evidence-collector",
    label: "Evidence Collector",
    lifecycle: "active",
    trigger: "webhook",
    approvalPosture: "manual",
    state: "disconnected",
    detail: "Capture evidence when execution emits readiness signals."
  },
  {
    id: "notification-router",
    label: "Notification Router",
    lifecycle: "paused",
    trigger: "manual",
    approvalPosture: "approval-required",
    state: "setup-required",
    detail: "Route alerts to team channels after initial setup."
  },
  {
    id: "legacy-bridge",
    label: "Legacy Bridge",
    lifecycle: "retired",
    trigger: "manual",
    approvalPosture: "manual",
    state: "unsupported",
    detail: "Compatibility bridge that is no longer supported."
  }
];

const validLifecycleValues = new Set<AutomationLifecycle>([
  "idle",
  "active",
  "paused",
  "retired"
]);

const validTriggerValues = new Set<AutomationTrigger>([
  "manual",
  "scheduled",
  "event",
  "webhook"
]);

const validApprovalPostureValues = new Set<AutomationApprovalPosture>([
  "automatic",
  "manual",
  "approval-required"
]);

const validStateValues = new Set<AutomationState>([
  "live",
  "preview",
  "disconnected",
  "setup-required",
  "unsupported",
  "unavailable"
]);

const defaultLifecycle: AutomationLifecycle = "idle";
const defaultTrigger: AutomationTrigger = "manual";
const defaultApprovalPosture: AutomationApprovalPosture = "approval-required";
const defaultState: AutomationState = "unavailable";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function titleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeLabel(value: unknown, fallbackId: string): string {
  if (typeof value !== "string") {
    return titleCase(fallbackId);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : titleCase(fallbackId);
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeLifecycle(value: unknown): AutomationLifecycle {
  return validLifecycleValues.has(value as AutomationLifecycle)
    ? (value as AutomationLifecycle)
    : defaultLifecycle;
}

function normalizeTrigger(value: unknown): AutomationTrigger {
  return validTriggerValues.has(value as AutomationTrigger)
    ? (value as AutomationTrigger)
    : defaultTrigger;
}

function normalizeApprovalPosture(value: unknown): AutomationApprovalPosture {
  return validApprovalPostureValues.has(value as AutomationApprovalPosture)
    ? (value as AutomationApprovalPosture)
    : defaultApprovalPosture;
}

function normalizeState(value: unknown): AutomationState {
  return validStateValues.has(value as AutomationState)
    ? (value as AutomationState)
    : defaultState;
}

function normalizeAutomationCatalogEntry(
  raw: unknown
): AutomationCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = normalizeId(raw.id);
  if (!id) {
    return undefined;
  }

  return {
    id,
    label: normalizeLabel(raw.label, id),
    lifecycle: normalizeLifecycle(raw.lifecycle),
    trigger: normalizeTrigger(raw.trigger),
    approvalPosture: normalizeApprovalPosture(raw.approvalPosture),
    state: normalizeState(raw.state),
    detail: normalizeString(raw.detail)
  };
}

function normalizeAutomationCatalogInternal(
  value: unknown
): AutomationCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map(normalizeAutomationCatalogEntry)
    .filter((entry): entry is AutomationCatalogEntry => entry !== undefined);

  const deduped: AutomationCatalogEntry[] = [];
  for (const entry of normalized) {
    if (!deduped.some((existing) => existing.id === entry.id)) {
      deduped.push(entry);
    }
  }

  return deduped;
}

export function normalizeAutomationCatalog(
  value: unknown,
  fallback: readonly AutomationCatalogEntry[] = defaultAutomationCatalog
): AutomationCatalogEntry[] {
  const normalized = normalizeAutomationCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const fallbackCatalog = normalizeAutomationCatalogInternal(fallback);
  if (fallbackCatalog.length > 0) {
    return fallbackCatalog;
  }

  return [...defaultAutomationCatalog];
}

export function summarizeAutomationCatalog(
  catalog: unknown = defaultAutomationCatalog
): AutomationCatalogSummary {
  const safeCatalog = normalizeAutomationCatalog(catalog);

  const summary = {
    total: safeCatalog.length,
    live: 0,
    preview: 0,
    disconnected: 0,
    setupRequired: 0,
    unsupported: 0,
    unavailable: 0,
    actionable: 0,
    needsAttention: 0,
    availability: 0
  };

  for (const entry of safeCatalog) {
    switch (entry.state) {
      case "live":
        summary.live += 1;
        break;
      case "preview":
        summary.preview += 1;
        break;
      case "disconnected":
        summary.disconnected += 1;
        break;
      case "setup-required":
        summary.setupRequired += 1;
        break;
      case "unsupported":
        summary.unsupported += 1;
        break;
      case "unavailable":
      default:
        summary.unavailable += 1;
        break;
    }
  }

  summary.actionable = summary.live + summary.preview + summary.disconnected + summary.setupRequired;
  summary.needsAttention =
    summary.disconnected + summary.setupRequired + summary.unsupported + summary.unavailable;
  summary.availability =
    summary.total > 0
      ? Number(((summary.live + summary.preview) / summary.total).toFixed(2))
      : 0;

  return summary;
}
