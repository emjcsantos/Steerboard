import type { Phase9RunnerCloseoutStatus } from "./phase9RunnerCloseoutStatus";

export type PermissionedToolEvidenceGateState = "ready" | "review" | "blocked" | "waiting";
export type PermissionedToolEvidenceSurface = "terminal" | "git";

export interface PermissionedToolEvidenceApprovalEvidence {
  readonly terminal?: boolean;
  readonly git?: boolean;
}

export interface PermissionedToolEvidenceGateItem {
  readonly id: string;
  readonly label: string;
  readonly surface: PermissionedToolEvidenceSurface;
  readonly state: PermissionedToolEvidenceGateState;
  readonly hasReadOnlyProof: boolean;
  readonly hasApproval: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface PermissionedToolEvidenceGate {
  readonly id: string;
  readonly label: string;
  readonly state: PermissionedToolEvidenceGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canRequestCapture: boolean;
  readonly readOnlyProofReady: boolean;
  readonly approvedSurfaceCount: number;
  readonly requiredSurfaceCount: number;
  readonly detail: string;
  readonly permissionedToolEvidenceGateProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly items: readonly PermissionedToolEvidenceGateItem[];
}

const SURFACES: readonly PermissionedToolEvidenceSurface[] = ["terminal", "git"];
const SAFETY =
  "Permissioned Terminal/Git evidence capture is metadata-only here. It summarizes Phase 9 read-only runner closeout proof and explicit capture approvals without running terminal commands, Git commands, MCP tools, plugins, automations, filesystem mutations, network actions, or external services.";

const STATUS_LABELS: Record<PermissionedToolEvidenceGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function readOnlyProofReady(closeout: Phase9RunnerCloseoutStatus): boolean {
  return (
    closeout.state === "complete" &&
    closeout.implementationComplete &&
    closeout.fixedProbeReady &&
    closeout.requestGateReady &&
    closeout.completionGateReady &&
    closeout.runnerExpansionLocked &&
    closeout.phase9RunnerCloseoutStatusProof.includes("fixedProbe=ready") &&
    closeout.phase9RunnerCloseoutStatusProof.includes("runnerExpansion=locked")
  );
}

function approvalForSurface(
  surface: PermissionedToolEvidenceSurface,
  approvals: PermissionedToolEvidenceApprovalEvidence
): boolean {
  return approvals[surface] === true;
}

function stateForSurface(
  closeout: Phase9RunnerCloseoutStatus,
  hasReadOnlyProof: boolean,
  hasApproval: boolean
): PermissionedToolEvidenceGateState {
  if (closeout.state === "blocked") {
    return "blocked";
  }
  if (!hasReadOnlyProof) {
    return closeout.state === "waiting" ? "waiting" : "review";
  }
  return hasApproval ? "ready" : "review";
}

function buildItem(
  surface: PermissionedToolEvidenceSurface,
  closeout: Phase9RunnerCloseoutStatus,
  hasReadOnlyProof: boolean,
  approvals: PermissionedToolEvidenceApprovalEvidence
): PermissionedToolEvidenceGateItem {
  const hasApproval = approvalForSurface(surface, approvals);
  const state = stateForSurface(closeout, hasReadOnlyProof, hasApproval);
  const label = surface === "terminal" ? "Terminal evidence capture" : "Git evidence capture";

  return {
    id: `permissioned-tool-evidence:${surface}`,
    label,
    surface,
    state,
    hasReadOnlyProof,
    hasApproval,
    detail: hasReadOnlyProof
      ? `${label} has Phase 9 read-only runner closeout proof but still needs explicit ${surface} capture approval.`
      : `${label} is held until Phase 9 read-only runner closeout is complete.`,
    nextAction: hasApproval
      ? `Keep ${surface} capture scoped to owner-approved evidence collection.`
      : `Record explicit owner approval before ${surface} evidence capture can be requested.`
  };
}

function resolveState(
  closeout: Phase9RunnerCloseoutStatus,
  items: readonly PermissionedToolEvidenceGateItem[],
  hasReadOnlyProof: boolean
): PermissionedToolEvidenceGateState {
  if (closeout.state === "blocked" || items.some((item) => item.state === "blocked")) {
    return "blocked";
  }
  if (!hasReadOnlyProof) {
    return closeout.state === "waiting" ? "waiting" : "review";
  }
  return items.every((item) => item.state === "ready") ? "ready" : "review";
}

function readinessForState(state: PermissionedToolEvidenceGateState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 80;
  }
  if (state === "waiting") {
    return 55;
  }
  return 0;
}

function detail(
  state: PermissionedToolEvidenceGateState,
  hasReadOnlyProof: boolean,
  approvedCount: number
): string {
  if (state === "blocked") {
    return "Permissioned Terminal/Git capture is blocked by Phase 9 runner closeout evidence.";
  }
  if (!hasReadOnlyProof) {
    return "Permissioned Terminal/Git capture is held until the fixed read-only runner path is proven.";
  }
  if (approvedCount < SURFACES.length) {
    return "Phase 9 read-only runner proof is present; explicit Terminal and Git capture approvals are still required.";
  }
  return "Permissioned Terminal/Git capture is approved for evidence collection only.";
}

function nextAction(
  closeout: Phase9RunnerCloseoutStatus,
  hasReadOnlyProof: boolean,
  approvedCount: number
): string {
  if (!hasReadOnlyProof) {
    return closeout.nextAction;
  }
  if (approvedCount < SURFACES.length) {
    return "Record explicit owner approval for Terminal and Git evidence capture after reviewing Phase 9 read-only closeout proof.";
  }
  return "Request only the scoped Terminal/Git evidence capture path; keep broader runner actions locked.";
}

function proof(
  state: PermissionedToolEvidenceGateState,
  canRequestCapture: boolean,
  hasReadOnlyProof: boolean,
  approvedCount: number,
  items: readonly PermissionedToolEvidenceGateItem[]
): string {
  const surfaceProof = items
    .map(
      (item) =>
        `${item.surface}:${item.state}:readonly=${item.hasReadOnlyProof ? "yes" : "no"}:approval=${item.hasApproval ? "yes" : "no"}`
    )
    .join("|");

  return (
    `permissionedToolEvidenceGate state=${state} canRequest=${canRequestCapture ? "yes" : "no"} ` +
    `readOnlyProof=${hasReadOnlyProof ? "ready" : "held"} approvals=${approvedCount}/${SURFACES.length} ` +
    `surfaces=${surfaceProof} safety=metadata-only`
  );
}

export function buildPermissionedToolEvidenceGate(
  closeout: Phase9RunnerCloseoutStatus,
  approvals: PermissionedToolEvidenceApprovalEvidence = {}
): PermissionedToolEvidenceGate {
  const hasReadOnlyProof = readOnlyProofReady(closeout);
  const items = SURFACES.map((surface) =>
    buildItem(surface, closeout, hasReadOnlyProof, approvals)
  );
  const state = resolveState(closeout, items, hasReadOnlyProof);
  const approvedSurfaceCount = items.filter((item) => item.hasApproval).length;
  const canRequestCapture = hasReadOnlyProof && approvedSurfaceCount === SURFACES.length;

  return {
    id: "permissioned-tool-evidence-gate",
    label: "Permissioned Terminal/Git evidence gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canRequestCapture,
    readOnlyProofReady: hasReadOnlyProof,
    approvedSurfaceCount,
    requiredSurfaceCount: SURFACES.length,
    detail: detail(state, hasReadOnlyProof, approvedSurfaceCount),
    permissionedToolEvidenceGateProof: proof(
      state,
      canRequestCapture,
      hasReadOnlyProof,
      approvedSurfaceCount,
      items
    ),
    nextAction: nextAction(closeout, hasReadOnlyProof, approvedSurfaceCount),
    safety: SAFETY,
    items
  };
}
