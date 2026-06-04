import type { RuntimeAdapter } from "./runtime";

export type AdapterContractItemStatus = "ready" | "review" | "blocked";

export type AdapterContractItemKind = "capability" | "permission" | "event" | "transport";

export interface AdapterContractItem {
  id: string;
  kind: AdapterContractItemKind;
  label: string;
  detail: string;
  status: AdapterContractItemStatus;
}

export interface AdapterContractSummary {
  total: number;
  ready: number;
  review: number;
  blocked: number;
  readiness: number;
}

type ContractAdapter = RuntimeAdapter & {
  transport?: string;
  capabilities?: readonly unknown[];
  requiredPermissions?: readonly unknown[];
};

const eventKinds = ["session", "task", "validation", "tool-call"] as const;

function normalizeContractSegment(value: unknown): string {
  if (typeof value !== "string") {
    return "item";
  }

  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized.length > 0 ? normalized : "item";
}

function transportStatus(state: RuntimeAdapter["state"]): AdapterContractItemStatus {
  if (state === "ready") {
    return "ready";
  }

  if (state === "blocked") {
    return "blocked";
  }

  return "review";
}

function readinessStatus(state: RuntimeAdapter["state"]): AdapterContractItemStatus {
  if (state === "ready") {
    return "ready";
  }

  if (state === "blocked") {
    return "blocked";
  }

  return "review";
}

function eventStatus(state: RuntimeAdapter["state"]): AdapterContractItemStatus {
  if (state === "ready" || state === "checking") {
    return "ready";
  }

  if (state === "blocked") {
    return "blocked";
  }

  return "review";
}

export function buildAdapterContract(adapter?: RuntimeAdapter): AdapterContractItem[] {
  if (!adapter) {
    return [
      {
        id: "adapter:missing",
        kind: "transport",
        label: "Runtime adapter",
        detail: "No runtime adapter is registered for this project.",
        status: "blocked"
      }
    ];
  }

  const contractAdapter = adapter as ContractAdapter;
  const transport = contractAdapter.transport ?? "";
  const capabilities = Array.isArray(contractAdapter.capabilities)
    ? contractAdapter.capabilities
    : [];
  const requiredPermissions = Array.isArray(contractAdapter.requiredPermissions)
    ? contractAdapter.requiredPermissions
    : [];
  const transportItem: AdapterContractItem = {
    id: `${adapter.id}:transport`,
    kind: "transport",
    label: "Transport",
    detail: transport,
    status: transportStatus(adapter.state)
  };

  const capabilityItems: AdapterContractItem[] = capabilities.map((capability) => ({
    id: `${adapter.id}:capability:${normalizeContractSegment(capability)}`,
    kind: "capability",
    label: "Capability",
    detail: String(capability),
    status: readinessStatus(adapter.state)
  }));

  const permissionItems: AdapterContractItem[] = requiredPermissions.map((permission) => ({
    id: `${adapter.id}:permission:${normalizeContractSegment(permission)}`,
    kind: "permission",
    label: "Permission",
    detail: String(permission),
    status: readinessStatus(adapter.state)
  }));

  const eventItems: AdapterContractItem[] = eventKinds.map((eventKind) => ({
    id: `${adapter.id}:event:${normalizeContractSegment(eventKind)}`,
    kind: "event",
    label: "Event",
    detail: eventKind,
    status: eventStatus(adapter.state)
  }));

  return [transportItem, ...capabilityItems, ...permissionItems, ...eventItems];
}

export function summarizeAdapterContract(
  items: readonly AdapterContractItem[]
): AdapterContractSummary {
  const summary = items.reduce<AdapterContractSummary>(
    (running, item) => ({
      total: running.total + 1,
      ready: running.ready + (item.status === "ready" ? 1 : 0),
      review: running.review + (item.status === "review" ? 1 : 0),
      blocked: running.blocked + (item.status === "blocked" ? 1 : 0),
      readiness: running.readiness
    }),
    {
      total: 0,
      ready: 0,
      review: 0,
      blocked: 0,
      readiness: 0
    }
  );

  return {
    ...summary,
    readiness: summary.total === 0 ? 0 : Math.round((summary.ready / summary.total) * 100)
  };
}
