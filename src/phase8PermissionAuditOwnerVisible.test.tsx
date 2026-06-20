import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Phase8PermissionAuditDepthPanel } from "./App";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import { createPhase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import {
  buildPhase8AuditReviewArtifact,
  verifyPhase8AuditReviewArtifact,
  type Phase8AuditReviewArtifactVerification
} from "./phase8AuditReviewArtifact";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeExecutionAuditRecord } from "./runtimeExecutionAuditHistory";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";

function liveSummary(
  provider: string,
  state: LiveActionPermissionRequestSummary["state"] = "idle"
): LiveActionPermissionRequestSummary {
  return {
    id: `${provider}:permission`,
    provider: provider as LiveActionPermissionRequestSummary["provider"],
    actionLabel: `${provider} action`,
    state,
    risk: provider === "plugin" ? "medium" : "high",
    isRiskGated: true,
    requestedAt: "2026-06-11T00:00:00.000Z",
    expiresAt: "none",
    requestedBy: "operator",
    transcriptLineCount: 0,
    detail: `${provider} requires explicit permission.`
  };
}

const readyRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  id: "runtime-launch:execution-audit",
  label: "Runtime launch execution audit",
  state: "ready",
  statusLabel: "Ready",
  eventCount: 3,
  transport: "local",
  canExecute: false,
  executionLocked: true,
  requiresDesktopApproval: true,
  detail: "Execution audit is ready after approval request.",
  safety: "Audit preview only. Runtime execution remains locked.",
  items: [
    {
      id: "runtime-launch:execution-lock",
      label: "Execution lock",
      status: "locked",
      detail: "Runtime execution is unavailable in this preview."
    }
  ]
};

const waitingRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  ...readyRuntimeExecutionAudit,
  state: "waiting",
  statusLabel: "Waiting",
  detail: "Runtime handoff request is waiting on local bridge readiness."
};

const readyProfilePermissionApproval: RuntimeProfilePermissionApprovalSnapshot = {
  id: "profile:permission-approval",
  label: "Profile permission approval",
  intent: "idle",
  state: "requestable",
  statusLabel: "Ready",
  primaryActionLabel: "Request",
  detail: "Permission approval can be requested before runtime handoff.",
  safety: "No process execution, filesystem action, or network action is performed.",
  readiness: 100,
  approvalRequired: true,
  executionLocked: true,
  canRequest: true,
  canCancel: false,
  bridgeState: "ready",
  profileId: "profile",
  profileLabel: "Profile"
};

const readyProfilePermissionAudit: RuntimeProfilePermissionAuditSnapshot = {
  id: "profile:permission-audit",
  label: "Profile permission audit",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  executionLocked: true,
  canExport: true,
  recordCount: 1,
  detail: "Audit is ready for review.",
  safety: "Audit preview only. No process execution, filesystem action, or network action is performed.",
  exportMarkdown: "# Export",
  items: []
};

const liveAuditRecord: LiveActionAuditRecord = {
  id: "terminal:local:requested:2026-06-11T00:00:00.000Z",
  action: "requested",
  what: "Terminal probe",
  why: "Permission requested.",
  provider: "terminal",
  workspace: "local",
  service: "terminal",
  resultSummary: "Permission requested locally; execution remains locked.",
  timestamp: "2026-06-11T00:00:00.000Z",
  risk: "high"
};

const readyAuditRecord: RuntimeExecutionAuditRecord = {
  id: "execution:requested:2026-06-11T00:00:00.000Z",
  auditId: "runtime-launch:execution-audit",
  action: "requested",
  createdAt: "2026-06-11T00:00:00.000Z",
  statusLabel: "Ready",
  eventCount: 3,
  transport: "local",
  executionLocked: true,
  detail: "Approval requested locally."
};

const readyProfileRequest: RuntimeProfilePermissionRequestRecord = {
  id: "profile:requested:2026-06-11T00:00:00.000Z",
  handoffId: "profile:permission-handoff",
  action: "requested",
  createdAt: "2026-06-11T00:00:00.000Z",
  statusLabel: "Ready",
  readiness: 100,
  detail: "Requested local profile permission handoff.",
  bridgeState: "ready",
  bridgeSource: "desktop",
  profileId: "profile",
  profileLabel: "Profile"
};

function auditDepth(options: {
  summaries?: LiveActionPermissionRequestSummary[];
  liveActionAuditRecords?: LiveActionAuditRecord[];
  runtimeExecutionAudit?: RuntimeExecutionAuditSnapshot;
  runtimeExecutionAuditHistory?: RuntimeExecutionAuditRecord[];
  runtimeProfilePermissionApproval?: RuntimeProfilePermissionApprovalSnapshot;
  runtimeProfilePermissionAudit?: RuntimeProfilePermissionAuditSnapshot;
  runtimeProfilePermissionRequestHistory?: RuntimeProfilePermissionRequestRecord[];
  ownerAuditReviewRecord?: Phase8AuditReviewRecord;
} = {}) {
  return buildPhase8PermissionAuditDepth({
    liveActionSummaries: options.summaries ?? [
      liveSummary("terminal"),
      liveSummary("git"),
      liveSummary("plugin")
    ],
    liveActionAuditRecords: options.liveActionAuditRecords ?? [],
    runtimeExecutionAudit: options.runtimeExecutionAudit ?? waitingRuntimeExecutionAudit,
    runtimeExecutionAuditHistory: options.runtimeExecutionAuditHistory ?? [],
    runtimeProfilePermissionApproval:
      options.runtimeProfilePermissionApproval ?? readyProfilePermissionApproval,
    runtimeProfilePermissionAudit:
      options.runtimeProfilePermissionAudit ?? readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory:
      options.runtimeProfilePermissionRequestHistory ?? [],
    ownerAuditReviewRecord: options.ownerAuditReviewRecord
  });
}

function ownerReviewFor(options: Parameters<typeof auditDepth>[0] = {}) {
  const snapshot = auditDepth({ ...options, ownerAuditReviewRecord: undefined });
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });

  return createPhase8AuditReviewRecord(
    snapshot,
    "2026-06-18T09:00:00.000Z",
    buildPhase8RiskBlockerPriority({ snapshot, traceability })
  );
}

function renderPhase8Proof(options: {
  artifactVerification?: Phase8AuditReviewArtifactVerification;
  importedArtifactVerification?: Phase8AuditReviewArtifactVerification;
  reviewRecord?: Phase8AuditReviewRecord;
  snapshot?: ReturnType<typeof auditDepth>;
} = {}) {
  const snapshot = options.snapshot ?? auditDepth();
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });
  const blockerPriority = buildPhase8RiskBlockerPriority({ snapshot, traceability });
  const artifactVerification =
    options.artifactVerification ??
    verifyPhase8AuditReviewArtifact(
      buildPhase8AuditReviewArtifact({
        exportedAt: "2026-06-18T10:00:00.000Z",
        evaluatedAt: "2026-06-18T10:00:00.000Z",
        snapshot,
        traceability,
        blockerPriority,
        reviewRecord: options.reviewRecord
      }),
      { verifiedAt: "2026-06-18T10:05:00.000Z" }
    );

  return renderToStaticMarkup(
    <Phase8PermissionAuditDepthPanel
      artifactVerification={artifactVerification}
      importedArtifactVerification={options.importedArtifactVerification}
      onClearAuditReview={() => undefined}
      onExportAuditReviewArtifact={() => undefined}
      onRecordAuditReview={() => undefined}
      onVerifyImportedAuditReviewArtifact={() => undefined}
      reviewRecord={options.reviewRecord}
      snapshot={snapshot}
    />
  );
}

describe("phase 8 permission audit owner-visible proof", () => {
  it("renders permission, approval, evidence, rollback, traceability, blocker, and locked mutation evidence", () => {
    const html = renderPhase8Proof();

    expect(html).toContain("Phase 8 Audit Depth");
    expect(html).toContain("Phase 8 permission and audit depth");
    expect(html).toContain("Risky");
    expect(html).toContain("Records");
    expect(html).toContain("Review");
    expect(html).toContain("Blocked");
    expect(html).toContain("Open Exceptions");
    expect(html).toContain("No local audit review record");
    expect(html).toContain("Mutation paths remain locked");
    expect(html).toContain("Record review");
    expect(html).toContain("Audit review artifact");
    expect(html).toContain("Export review");
    expect(html).toContain("Import review");
    expect(html).toContain("Depth 10");
    expect(html).toContain("Mutation locked");
    expect(html).toContain("terminal action");
    expect(html).toContain(
      "permissionLabelProof=provider=terminal label=preview-only state=idle risk=high requestedBy=operator"
    );
    expect(html).toContain(
      "permissionLabelSummaryProof=total=3 previewOnly=3 approvalRequired=0 blocked=0 ready=0"
    );
    expect(html).toContain("riskExceptionSummaryProof=");
    expect(html).toContain("riskExceptionProof=source=phase8-live-action-terminal:permission status=waiting");
    expect(html).toContain("git action");
    expect(html).toContain("plugin action");
    expect(html).toContain("permission");
    expect(html).toContain("approval");
    expect(html).toContain("evidence");
    expect(html).toContain("rollback");
    expect(html).toContain("phase-08-child-permission-labels");
    expect(html).toContain("phase8.permission-scope");
    expect(html).toContain("Phase 8 risk traceability");
    expect(html).toContain(
      "traceabilityProof=goal=goal-phase-8-permission-audit state=waiting"
    );
    expect(html).toContain("traceabilityRowStateProof=rows=5");
    expect(html).toContain("Phase 8 audit review handoff");
    expect(html).toContain("phase8AuditReviewHandoffProof");
    expect(html).toContain("recordable=yes");
    expect(html).toContain("Phase 8 risk closure");
    expect(html).toContain("phase8RiskClosureProof");
    expect(html).toContain("Audit Review");
    expect(html).toContain("Owner Action");
    expect(html).toContain("Phase 8 permission audit completion gate");
    expect(html).toContain("phase8PermissionAuditCompletionGate");
    expect(html).toContain("phaseComplete=no");
    expect(html).toContain("canAdvanceMutationPaths=no");
    expect(html).toContain("handoff=held");
    expect(html).toContain("handoffState=waiting");
    expect(html).toContain("Phase 8 closure audit status");
    expect(html).toContain("phase8ClosureAuditStatusProof");
    expect(html).toContain("blockedCategories=");
    expect(html).toContain("mutationAdvance=no");
    expect(html).toContain("Phase 8 owner-action handoff");
    expect(html).toContain("phase8OwnerActionHandoffProof");
    expect(html).toContain("ownerAction=");
    expect(html).toContain("canContinueAuditReview=");
    expect(html).toContain("Phase 8 audit-review blocker handoff");
    expect(html).toContain("phase8AuditReviewBlockerHandoffProof");
    expect(html).toContain("ownerActionClear=");
    expect(html).toContain("canRecordAuditReview=");
    expect(html).toContain("Phase 8 owner-review closure readiness");
    expect(html).toContain("phase8OwnerReviewClosureReadinessProof");
    expect(html).toContain("canClose=");
    expect(html).toContain("phaseComplete=");
    expect(html).toContain("Phase 8 final completion handoff");
    expect(html).toContain("phase8FinalCompletionHandoffProof");
    expect(html).toContain("phase9=");
    expect(html).toContain("topHold=");
    expect(html).toContain("mutationAdvance=no");
    expect(html).toContain("Phase 8 closeout status");
    expect(html).toContain("phase8CloseoutStatusProof");
    expect(html).toContain("phase9Dependency=");
    expect(html).toContain("mutationPaths=locked");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("PM row coverage");
    expect(html).toContain("Audit-depth evidence");
    expect(html).toContain("Risk exception register");
    expect(html).toContain("Disabled-path lock");
    expect(html).toContain("Phase 8 risk blocker priority");
    expect(html).toContain("Open");
    expect(html).toContain("Reviewable");
    expect(html).toContain("Status");
    expect(html).toContain("phase8-live-action-terminal:permission / audit-depth / waiting");
    expect(html).toContain(
      "topBlockerProof=source=phase8-live-action-terminal:permission kind=audit-depth status=waiting priority=1 severity=medium auditReview=yes"
    );
    expect(html).toContain("blockerQueueProof=");
    expect(html).toContain(
      "riskBlockerProof=source=phase8-live-action-terminal:permission kind=permission status=waiting pm=phase-08-child-permission-labels evidence=phase8.permission-scope.phase8-live-action-terminal-permission auditReview=yes"
    );
    expect(html).toContain("Audit review");
    expect(html).toContain("permission review record");
    expect(html).toContain("rollback evidence");
    expect(html).toContain("without requesting approval, exporting audit records, running actions, or unlocking mutation paths");
    expect(html).toContain("without granting access or running actions");
  });

  it("renders current owner audit-review state, fingerprint-sensitive review, and rollback proof text", () => {
    const readyOptions = {
      summaries: [
        liveSummary("terminal", "approved"),
        liveSummary("git", "approved"),
        liveSummary("plugin", "approved")
      ],
      liveActionAuditRecords: [liveAuditRecord],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [readyAuditRecord],
      runtimeProfilePermissionRequestHistory: [readyProfileRequest]
    };
    const reviewRecord = ownerReviewFor(readyOptions);
    const snapshot = auditDepth({
      ...readyOptions,
      ownerAuditReviewRecord: reviewRecord
    });
    const html = renderPhase8Proof({ reviewRecord, snapshot });

    expect(html).toContain("Audit review recorded");
    expect(html).toContain("Jun 18");
    expect(html).toContain("0 open exceptions");
    expect(html).toContain("Phase 8 audit review record ready");
    expect(html).toContain("auditPersistenceProof=state=ready readiness=100");
    expect(html).toContain("audit evidence fingerprint");
    expect(html).toContain("current audit evidence");
    expect(html).toContain("Audit review artifact");
    expect(html).toContain("Review record attached");
    expect(html).toContain(
      "Reviewed blocker phase-08-permission-audit-depth:owner-audit-review / audit-depth / waiting"
    );
    expect(html).toContain("Runtime, profile, terminal, Git, MCP, plugin, automation, and external-service mutation paths remain locked");
    expect(html).toContain("Clear");
    expect(html).toContain("Record review");
  });

  it("shows stale owner audit reviews as visible review blockers", () => {
    const staleReview = ownerReviewFor({
      summaries: [
        liveSummary("terminal", "approved"),
        liveSummary("git", "approved"),
        liveSummary("plugin", "approved")
      ],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [readyAuditRecord],
      runtimeProfilePermissionRequestHistory: [readyProfileRequest]
    });
    const snapshot = auditDepth({
      summaries: [
        liveSummary("terminal", "approved"),
        liveSummary("git", "approved"),
        liveSummary("plugin", "approved")
      ],
      liveActionAuditRecords: [liveAuditRecord],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [readyAuditRecord],
      runtimeProfilePermissionRequestHistory: [readyProfileRequest],
      ownerAuditReviewRecord: staleReview
    });
    const html = renderPhase8Proof({ reviewRecord: staleReview, snapshot });

    expect(html).toContain("Audit review recorded");
    expect(html).toContain("Owner audit review");
    expect(html).toContain("does not match current audit evidence");
    expect(html).toContain("Re-record owner audit review");
    expect(html).toContain("Phase 8 risk blocker priority");
    expect(html).toContain("Reviewable");
  });

  it("renders imported artifact verification without mutating the local owner review record", () => {
    const snapshot = auditDepth();
    const importedArtifactVerification = verifyPhase8AuditReviewArtifact(
      buildPhase8AuditReviewArtifact({
        exportedAt: "2026-06-18T10:00:00.000Z",
        evaluatedAt: "2026-06-18T10:00:00.000Z",
        snapshot,
        traceability: buildPhase8RiskTraceabilitySummary({ snapshot }),
        blockerPriority: buildPhase8RiskBlockerPriority({
          snapshot,
          traceability: buildPhase8RiskTraceabilitySummary({ snapshot })
        })
      }),
      { verifiedAt: "2026-06-18T10:05:00.000Z" }
    );
    const html = renderPhase8Proof({ importedArtifactVerification });

    expect(html).toContain("Imported audit review");
    expect(html).toContain("Phase 8 audit review artifact is valid but still has");
    expect(html).toContain("Review record missing");
    expect(html).toContain("Mutation locked");
    expect(html).toContain("No local audit review record");
  });
});
