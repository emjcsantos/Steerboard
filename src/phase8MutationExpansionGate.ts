import type { Phase8CloseoutStatus } from "./phase8CloseoutStatus";
import type { Phase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";

export const PHASE8_MUTATION_EXPANSION_SURFACES = [
  "desktop",
  "terminal",
  "git",
  "mcp",
  "plugin",
  "automation",
  "runtime",
  "profile",
  "external-service"
] as const;

export type Phase8MutationExpansionSurface =
  (typeof PHASE8_MUTATION_EXPANSION_SURFACES)[number];

export type Phase8MutationExpansionGateState = "ready" | "review" | "waiting" | "blocked";

export interface Phase8MutationExpansionEvidence {
  readonly approvedMutationSurfaces?: readonly Phase8MutationExpansionSurface[];
  readonly liveHandlerSurfaces?: readonly Phase8MutationExpansionSurface[];
}

export interface Phase8MutationExpansionGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8MutationExpansionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canAdvanceMutationPaths: boolean;
  readonly completionState: Phase8PermissionAuditCompletionGate["state"];
  readonly closeoutState: Phase8CloseoutStatus["state"];
  readonly phaseComplete: boolean;
  readonly closeoutReady: boolean;
  readonly mutationPathsLocked: boolean;
  readonly approvedSurfaceCount: number;
  readonly handlerSurfaceCount: number;
  readonly requiredSurfaceCount: number;
  readonly missingApprovalSurfaces: readonly Phase8MutationExpansionSurface[];
  readonly missingHandlerSurfaces: readonly Phase8MutationExpansionSurface[];
  readonly detail: string;
  readonly nextAction: string;
  readonly mutationExpansionGateProof: string;
  readonly ariaLabel: string;
}

const STATUS_LABELS: Record<Phase8MutationExpansionGateState, string> = {
  ready: "Ready",
  review: "Review held",
  waiting: "Approval needed",
  blocked: "Blocked"
};

function surfaceCount(surfaces: readonly Phase8MutationExpansionSurface[] | undefined): number {
  return new Set(surfaces ?? []).size;
}

function missingSurfaces(
  surfaces: readonly Phase8MutationExpansionSurface[] | undefined
): readonly Phase8MutationExpansionSurface[] {
  const present = new Set(surfaces ?? []);

  return PHASE8_MUTATION_EXPANSION_SURFACES.filter((surface) => !present.has(surface));
}

function proof(
  gate: Omit<Phase8MutationExpansionGate, "mutationExpansionGateProof" | "ariaLabel">
): string {
  return [
    "phase8MutationExpansionGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `completion=${gate.completionState}`,
    `closeout=${gate.closeoutState}`,
    `closeoutReady=${gate.closeoutReady ? "yes" : "no"}`,
    `mutationPaths=${gate.mutationPathsLocked ? "locked" : "unlocked"}`,
    `approvals=${gate.approvedSurfaceCount}/${gate.requiredSurfaceCount}`,
    `handlers=${gate.handlerSurfaceCount}/${gate.requiredSurfaceCount}`,
    `canAdvance=${gate.canAdvanceMutationPaths ? "yes" : "no"}`,
    `missingApprovals=${gate.missingApprovalSurfaces.join(",") || "none"}`,
    `missingHandlers=${gate.missingHandlerSurfaces.join(",") || "none"}`
  ].join(" ");
}

function ariaLabel(gate: Omit<Phase8MutationExpansionGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `phase complete ${gate.phaseComplete ? "yes" : "no"}; ` +
    `approvals ${gate.approvedSurfaceCount}/${gate.requiredSurfaceCount}; ` +
    `handlers ${gate.handlerSurfaceCount}/${gate.requiredSurfaceCount}; ` +
    `mutation paths ${gate.canAdvanceMutationPaths ? "advanceable" : "locked"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase8MutationExpansionGateState,
  completionGate: Phase8PermissionAuditCompletionGate,
  closeoutStatus: Phase8CloseoutStatus,
  evidence: Phase8MutationExpansionEvidence | undefined,
  detail: string,
  nextAction: string
): Phase8MutationExpansionGate {
  const approvedSurfaceCount = surfaceCount(evidence?.approvedMutationSurfaces);
  const handlerSurfaceCount = surfaceCount(evidence?.liveHandlerSurfaces);
  const requiredSurfaceCount = PHASE8_MUTATION_EXPANSION_SURFACES.length;
  const canAdvanceMutationPaths =
    state === "ready" &&
    completionGate.phaseComplete &&
    closeoutStatus.phaseComplete &&
    closeoutStatus.mutationPathsLocked &&
    approvedSurfaceCount === requiredSurfaceCount &&
    handlerSurfaceCount === requiredSurfaceCount;
  const draft = {
    id: "phase-8-mutation-expansion-gate",
    label: "Phase 8 mutation expansion gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness:
      state === "ready" ? 100 : state === "review" ? 75 : state === "waiting" ? 55 : 0,
    canAdvanceMutationPaths,
    completionState: completionGate.state,
    closeoutState: closeoutStatus.state,
    phaseComplete: completionGate.phaseComplete && closeoutStatus.phaseComplete,
    closeoutReady: closeoutStatus.phase9DependencyReady,
    mutationPathsLocked:
      completionGate.mutationLocked && closeoutStatus.mutationPathsLocked,
    approvedSurfaceCount,
    handlerSurfaceCount,
    requiredSurfaceCount,
    missingApprovalSurfaces: missingSurfaces(evidence?.approvedMutationSurfaces),
    missingHandlerSurfaces: missingSurfaces(evidence?.liveHandlerSurfaces),
    detail,
    nextAction
  };
  const gate = {
    ...draft,
    mutationExpansionGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}

export function buildPhase8MutationExpansionGate(
  completionGate: Phase8PermissionAuditCompletionGate,
  closeoutStatus: Phase8CloseoutStatus,
  evidence?: Phase8MutationExpansionEvidence
): Phase8MutationExpansionGate {
  if (
    completionGate.state === "blocked" ||
    closeoutStatus.state === "blocked" ||
    !completionGate.mutationLocked ||
    !closeoutStatus.mutationPathsLocked
  ) {
    return result(
      "blocked",
      completionGate,
      closeoutStatus,
      evidence,
      "Phase 8 mutation expansion is blocked because audit completion or closeout no longer proves locked mutation paths.",
      "Restore locked Phase 8 completion and closeout proof before mutation-capable surfaces can be reviewed."
    );
  }

  if (completionGate.state === "waiting" || closeoutStatus.state === "waiting") {
    return result(
      "waiting",
      completionGate,
      closeoutStatus,
      evidence,
      "Phase 8 mutation expansion is waiting for owner-review completion and closeout evidence.",
      closeoutStatus.nextAction
    );
  }

  if (!completionGate.phaseComplete || !closeoutStatus.phaseComplete) {
    return result(
      "review",
      completionGate,
      closeoutStatus,
      evidence,
      "Phase 8 mutation expansion remains held until permission-audit completion and closeout are both ready.",
      completionGate.phaseComplete ? closeoutStatus.nextAction : completionGate.nextAction
    );
  }

  if (surfaceCount(evidence?.approvedMutationSurfaces) < PHASE8_MUTATION_EXPANSION_SURFACES.length) {
    return result(
      "waiting",
      completionGate,
      closeoutStatus,
      evidence,
      "Phase 8 mutation expansion is waiting for explicit owner approval on every mutation-capable surface.",
      "Record owner approvals for desktop, terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths."
    );
  }

  if (surfaceCount(evidence?.liveHandlerSurfaces) < PHASE8_MUTATION_EXPANSION_SURFACES.length) {
    return result(
      "review",
      completionGate,
      closeoutStatus,
      evidence,
      "Phase 8 mutation expansion has owner approvals but not every live handler is ready.",
      "Connect permissioned handlers for every approved mutation-capable surface before mutation paths can advance."
    );
  }

  return result(
    "ready",
    completionGate,
    closeoutStatus,
    evidence,
    "Phase 8 mutation expansion is ready because audit completion, closeout, owner approvals, and live handlers are all present.",
    "Advance mutation-capable surfaces only through approved handlers while preserving this proof with Phase 8 closeout evidence."
  );
}
