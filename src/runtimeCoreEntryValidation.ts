import type { RuntimeAdapter } from "./runtime";
import { canRunWithAdapter } from "./runtime";
import type { AdapterContractItem } from "./adapterContract";
import { summarizeAdapterContract } from "./adapterContract";
import type { RuntimeAdapterSessionSnapshot } from "./runtimeAdapterSession";

export type RuntimeCoreEntryValidationTone = "ready" | "review" | "blocked" | "missing";

export type RuntimeCoreEntryValidationCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface RuntimeCoreEntryValidation {
  label: string;
  detail: string;
  tone: RuntimeCoreEntryValidationTone;
  checkLabel: string;
  checks: RuntimeCoreEntryValidationCheck[];
  ariaLabel: string;
}

const CORE_ENTRY_LABEL: Record<RuntimeCoreEntryValidationTone, string> = {
  ready: "Runtime entry validation ready",
  review: "Runtime entry validation needs review",
  blocked: "Runtime entry validation blocked",
  missing: "Runtime entry validation missing"
};

const CORE_ENTRY_DETAIL: Record<RuntimeCoreEntryValidationTone, string> = {
  ready:
    "Adapter, contract, session, and entry-point checks are ready for runtime validation.",
  review:
    "Some runtime entry checks need review before adapter validation is stable.",
  blocked:
    "Resolve adapter, contract, session, or entry-point blockers before runtime validation.",
  missing: "No runtime adapter is available for core entry validation."
};

function resolveAdapterTone(adapter: RuntimeAdapter | undefined): RuntimeCoreEntryValidationCheck["tone"] {
  if (!adapter) {
    return "neutral";
  }

  if (
    adapter.state === "blocked" ||
    adapter.state === "not_configured" ||
    adapter.readiness === 0
  ) {
    return "blocked";
  }

  return canRunWithAdapter(adapter) ? "ok" : "review";
}

function resolveContractTone(
  contractItems: readonly AdapterContractItem[] | undefined
): RuntimeCoreEntryValidationCheck["tone"] {
  const summary = summarizeAdapterContract(contractItems ?? []);

  if (summary.total === 0) {
    return "neutral";
  }

  if (summary.blocked > 0) {
    return "blocked";
  }

  if (summary.ready === summary.total) {
    return "ok";
  }

  return "review";
}

function resolveSessionTone(
  session: RuntimeAdapterSessionSnapshot | undefined
): RuntimeCoreEntryValidationCheck["tone"] {
  if (!session) {
    return "neutral";
  }

  if (session.health === "blocked" || session.state === "offline" || session.state === "blocked") {
    return "blocked";
  }

  if (session.health === "review" || session.state === "connecting" || session.state === "paused") {
    return "review";
  }

  if (session.state === "ready" || session.state === "live" || session.state === "complete") {
    return "ok";
  }

  return "review";
}

function resolveEntryPointsTone(adapter: RuntimeAdapter | undefined): RuntimeCoreEntryValidationCheck["tone"] {
  if (!adapter) {
    return "neutral";
  }

  const requiredPermissions = adapter.requiredPermissions.length;
  if (requiredPermissions === 0) {
    return "neutral";
  }

  const enabledPermissions = new Set(
    adapter.permissions
      .filter((permission) => permission.status === "enabled")
      .map((permission) => permission.permission)
  );

  const enabledRequiredPermissions = adapter.requiredPermissions.filter((permission) =>
    enabledPermissions.has(permission)
  ).length;

  const hasCapability = adapter.capabilities.length > 0;
  const allEnabled = enabledRequiredPermissions === requiredPermissions;
  const someEnabled = enabledRequiredPermissions > 0;

  if (hasCapability && requiredPermissions > 0 && allEnabled) {
    return "ok";
  }

  if (hasCapability && someEnabled) {
    return "review";
  }

  return "blocked";
}

function enabledRequiredPermissionCount(adapter: RuntimeAdapter): number {
  const enabled = new Set(
    adapter.permissions
      .filter((permission) => permission.status === "enabled")
      .map((permission) => permission.permission)
  );

  return adapter.requiredPermissions.filter((permission) => enabled.has(permission)).length;
}

function computeOverallTone(
  hasAdapter: boolean,
  checks: readonly RuntimeCoreEntryValidationCheck[]
): RuntimeCoreEntryValidationTone {
  if (!hasAdapter) {
    return "missing";
  }

  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.tone === "review" || check.tone === "neutral")) {
    return "review";
  }

  return "ready";
}

export function createRuntimeCoreEntryValidation(
  adapter: RuntimeAdapter | undefined,
  contractItems?: readonly AdapterContractItem[],
  session?: RuntimeAdapterSessionSnapshot
): RuntimeCoreEntryValidation {
  const hasAdapter = adapter !== undefined;
  const adapterTone = resolveAdapterTone(adapter);
  const contractSummary = summarizeAdapterContract(contractItems ?? []);
  const contractTone = resolveContractTone(contractItems);
  const sessionTone = resolveSessionTone(session);
  const entryPointsTone = resolveEntryPointsTone(adapter);
  const enabledRequiredPermissions = adapter ? enabledRequiredPermissionCount(adapter) : 0;
  const requiredPermissions = adapter?.requiredPermissions.length ?? 0;

  const checks: RuntimeCoreEntryValidationCheck[] = [
    {
      label: "Adapter",
      value: adapter ? adapter.state : "missing",
      tone: adapterTone
    },
    {
      label: "Contract",
      value: `${contractSummary.ready}/${contractSummary.total}`,
      tone: contractTone
    },
    {
      label: "Session",
      value: session?.state ?? "missing",
      tone: sessionTone
    },
    {
      label: "Entry points",
      value: `${enabledRequiredPermissions}/${requiredPermissions} perms`,
      tone: entryPointsTone
    }
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;
  const tone = computeOverallTone(hasAdapter, checks);
  const adapterLabel = adapter ? `Adapter id ${adapter.id}` : "Adapter missing";

  return {
    label: CORE_ENTRY_LABEL[tone],
    detail: CORE_ENTRY_DETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${CORE_ENTRY_LABEL[tone]}: ${checkLabel}; ` +
      `${adapterLabel}; ` +
      `Session state ${session?.state ?? "missing"}; ` +
      `${checks[0].label} ${checks[0].value}; ` +
      `${checks[1].label} ${checks[1].value}; ` +
      `${checks[2].label} ${checks[2].value}; ` +
      `${checks[3].label} ${checks[3].value}`
  };
}
