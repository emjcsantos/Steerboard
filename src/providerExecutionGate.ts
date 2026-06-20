import type { CatalogSurface } from "./catalogRefreshOwnerValidation";
import type {
  ProviderIntegrationReadiness,
  ProviderIntegrationReadinessSurface
} from "./providerIntegrationReadiness";

export type ProviderExecutionGateState = "ready" | "review" | "blocked" | "waiting";

export type ProviderExecutionSurface = Extract<
  CatalogSurface,
  "skill" | "plugin" | "mcp" | "automation"
>;

export interface ProviderExecutionApprovalEvidence {
  readonly skill?: boolean;
  readonly plugin?: boolean;
  readonly mcp?: boolean;
  readonly automation?: boolean;
}

export interface ProviderExecutionGateItem {
  readonly surface: ProviderExecutionSurface;
  readonly label: string;
  readonly state: ProviderExecutionGateState;
  readonly statusLabel: string;
  readonly providerSupported: boolean;
  readonly approvalRecorded: boolean;
  readonly canRequestExecution: boolean;
  readonly sourceLabel: string;
  readonly detail: string;
  readonly nextAction: string;
}

export interface ProviderExecutionGate {
  readonly id: string;
  readonly label: string;
  readonly state: ProviderExecutionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canRequestExecution: boolean;
  readonly providerSupportedCount: number;
  readonly approvalRecordedCount: number;
  readonly requiredSurfaceCount: number;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly executionGateProof: string;
  readonly items: readonly ProviderExecutionGateItem[];
}

const REQUIRED_SURFACES: readonly ProviderExecutionSurface[] = [
  "skill",
  "plugin",
  "mcp",
  "automation"
];

const STATUS_LABELS: Record<ProviderExecutionGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SURFACE_LABELS: Record<ProviderExecutionSurface, string> = {
  skill: "Skills",
  plugin: "Plugins",
  mcp: "MCP",
  automation: "Automations"
};

const SAFETY =
  "Provider execution gate is evidence-only. It does not invoke skills, plugins, MCP tools, automations, commands, networks, terminals, Git, profiles, or personalization.";

function stateWeight(state: ProviderExecutionGateState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 65;
  }
  if (state === "waiting") {
    return 35;
  }
  return 0;
}

function surfaceById(
  readiness: ProviderIntegrationReadiness,
  surface: ProviderExecutionSurface
): ProviderIntegrationReadinessSurface | undefined {
  return readiness.surfaces.find((item) => item.surface === surface);
}

function providerSupported(surface: ProviderIntegrationReadinessSurface | undefined): boolean {
  return Boolean(
    surface &&
      surface.source === "provider-live" &&
      surface.state === "ready" &&
      surface.counts.ready > 0 &&
      surface.counts.preview === 0 &&
      surface.counts.setupRequired === 0 &&
      surface.counts.unsupported === 0 &&
      surface.counts.unavailable === 0 &&
      surface.counts.blocked === 0
  );
}

function buildItem(
  readiness: ProviderIntegrationReadiness,
  surfaceId: ProviderExecutionSurface,
  approvals: ProviderExecutionApprovalEvidence
): ProviderExecutionGateItem {
  const surface = surfaceById(readiness, surfaceId);
  const supported = providerSupported(surface);
  const approvalRecorded = approvals[surfaceId] === true;
  const state: ProviderExecutionGateState = !surface
    ? "waiting"
    : surface.state === "blocked"
      ? "blocked"
      : supported && approvalRecorded
        ? "ready"
        : supported
          ? "review"
          : surface.state === "ready"
            ? "review"
            : "blocked";
  const label = surface?.label ?? SURFACE_LABELS[surfaceId];
  const supportDetail = supported
    ? "provider-live support is explicit"
    : surface
      ? `${surface.statusLabel.toLowerCase()} provider evidence from ${surface.sourceLabel}`
      : "provider evidence is missing";
  const approvalDetail = approvalRecorded
    ? "approval evidence is attached"
    : "approval evidence is missing";

  return {
    surface: surfaceId,
    label,
    state,
    statusLabel: STATUS_LABELS[state],
    providerSupported: supported,
    approvalRecorded,
    canRequestExecution: state === "ready",
    sourceLabel: surface?.sourceLabel ?? "Missing",
    detail: `${label} execution gate: ${supportDetail}; ${approvalDetail}.`,
    nextAction:
      state === "ready"
        ? `Keep ${label.toLowerCase()} execution behind the recorded approval and owner action.`
        : supported
          ? `Record explicit owner approval before ${label.toLowerCase()} execution can be requested.`
          : `Restore explicit provider-live ${label.toLowerCase()} support before execution approval is considered.`
  };
}

function resolveState(items: readonly ProviderExecutionGateItem[]): ProviderExecutionGateState {
  if (items.some((item) => item.state === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.state === "review")) {
    return "review";
  }
  if (items.some((item) => item.state === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstNextAction(items: readonly ProviderExecutionGateItem[]): string {
  return (
    items.find((item) => item.state === "blocked")?.nextAction ??
    items.find((item) => item.state === "review")?.nextAction ??
    items.find((item) => item.state === "waiting")?.nextAction ??
    "Keep provider execution requests attached to explicit support and approval evidence."
  );
}

function proof(input: {
  state: ProviderExecutionGateState;
  canRequestExecution: boolean;
  providerSupportedCount: number;
  approvalRecordedCount: number;
  requiredSurfaceCount: number;
  items: readonly ProviderExecutionGateItem[];
}): string {
  const surfaceProof = input.items
    .map(
      (item) =>
        `${item.surface}:${item.state}:support=${item.providerSupported ? "yes" : "no"}:approval=${item.approvalRecorded ? "yes" : "no"}`
    )
    .join("|");

  return (
    `providerExecutionGate state=${input.state} ` +
    `canRequest=${input.canRequestExecution ? "yes" : "no"} ` +
    `support=${input.providerSupportedCount}/${input.requiredSurfaceCount} ` +
    `approval=${input.approvalRecordedCount}/${input.requiredSurfaceCount} ` +
    `surfaces=${surfaceProof} safety=metadata-only`
  );
}

export function buildProviderExecutionGate(
  readiness: ProviderIntegrationReadiness,
  approvals: ProviderExecutionApprovalEvidence = {}
): ProviderExecutionGate {
  const items = REQUIRED_SURFACES.map((surface) => buildItem(readiness, surface, approvals));
  const state = resolveState(items);
  const providerSupportedCount = items.filter((item) => item.providerSupported).length;
  const approvalRecordedCount = items.filter((item) => item.approvalRecorded).length;
  const readyCount = items.filter((item) => item.state === "ready").length;
  const reviewCount = items.filter((item) => item.state === "review").length;
  const blockedCount = items.filter((item) => item.state === "blocked").length;
  const waitingCount = items.filter((item) => item.state === "waiting").length;
  const canRequestExecution = state === "ready" && items.every((item) => item.canRequestExecution);
  const readinessScore = Math.round(
    items.reduce((total, item) => total + stateWeight(item.state), 0) / items.length
  );

  const draft = {
    id: "provider-execution-gate",
    label: "Provider execution gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessScore,
    canRequestExecution,
    providerSupportedCount,
    approvalRecordedCount,
    requiredSurfaceCount: REQUIRED_SURFACES.length,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    detail:
      `${providerSupportedCount}/${REQUIRED_SURFACES.length} execution surfaces have explicit provider-live support; ` +
      `${approvalRecordedCount}/${REQUIRED_SURFACES.length} have explicit approval evidence.`,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    executionGateProof: proof(draft)
  };
}
