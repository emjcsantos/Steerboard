import type {
  ProjectManagementTask,
  ProjectManagementTaskComplexity,
  ProjectManagementTaskStatus
} from "./projectManagementHierarchy";
import { PHASE3_PROOF_EXPORT_PM_TASK_ID } from "./phase3ProofExportTrace";

interface PhaseChildSpec {
  id: string;
  title: string;
  description: string;
  status?: ProjectManagementTaskStatus;
  completionPercent: number;
  complexity?: ProjectManagementTaskComplexity;
  sourceDocument: string;
}

interface PhaseParentSpec extends PhaseChildSpec {
  children: PhaseChildSpec[];
}

interface PhaseSpec extends PhaseChildSpec {
  parents: PhaseParentSpec[];
}

const phaseSpecs: PhaseSpec[] = [
  {
    id: "phase-00-baseline",
    title: "Phase 0: Baseline, Safety, and Docs Hygiene",
    description: "Keep the Steerboard baseline clean, validated, documented, and safe before new execution work expands.",
    status: "completed",
    completionPercent: 100,
    complexity: "medium",
    sourceDocument: "Current state and pipeline",
    parents: [
      {
        id: "phase-00-parent-baseline",
        title: "Baseline Integrity",
        description: "Maintain clean branch state, public/private boundary checks, and repeatable validation before each slice.",
        status: "completed",
        completionPercent: 100,
        complexity: "medium",
        sourceDocument: "Steerboard AGENTS and roadmap",
        children: [
          {
            id: "phase-00-child-public-boundary",
            title: "Public Boundary Scan",
            description: "Keep public docs free of private paths, model-specific notes, raw transcripts, and owner-only planning material.",
            status: "completed",
            completionPercent: 100,
            sourceDocument: "Public repository boundary"
          },
          {
            id: "phase-00-child-validation-repeat",
            title: "Repeatable Validation Set",
            description: "Keep tests, build, desktop smoke, diff checks, and leak scans available for every implementation branch.",
            status: "completed",
            completionPercent: 100,
            sourceDocument: "Validation closeout"
          }
        ]
      },
      {
        id: "phase-00-parent-docs",
        title: "Documentation Closeout",
        description: "Keep README, roadmap, current state, and product docs aligned with completed work and the pipeline.",
        status: "completed",
        completionPercent: 100,
        complexity: "low",
        sourceDocument: "Current state and pipeline",
        children: [
          {
            id: "phase-00-child-roadmap-sync",
            title: "Roadmap and Current-State Sync",
            description: "Record done work, next pipeline items, and deferred future work without leaking private execution detail.",
            status: "completed",
            completionPercent: 100,
            complexity: "low",
            sourceDocument: "Documentation closeout"
          }
        ]
      }
    ]
  },
  {
    id: "phase-01-live-chat",
    title: "Phase 1: One Live Chat Panel",
    description: "Prove one Arena chat panel can run against the desktop-backed session path with honest local owner-visible evidence and phase126PublishHoldCloseoutStatusProof while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-01-parent-single-panel",
        title: "Single-Panel Runtime Proof",
        description: "Confirm a single Arena panel can start, stream, complete, and record readiness from the real desktop path with phase126PublishHoldCloseoutStatusProof.",
        status: "ongoing",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Live functionality goal",
        children: [
          {
            id: "phase-01-child-live-start",
            title: "Start One Desktop Session",
            description: "Launch one desktop-backed chat session and show readiness instead of mock-only state with phase126PublishHoldCloseoutStatusProof coverage.",
            status: "ongoing",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Owner testing panel"
          },
          {
            id: "phase-01-child-stream-evidence",
            title: "Capture Stream and Completion Evidence",
            description: "Persist stream, final status, exact missing-signal review detail, compact signal-count proof, method counts, sorted stream method names, any fallback reason, and phase126PublishHoldCloseoutStatusProof in owner-visible proof rows.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 3 smoke proof readiness"
          }
        ]
      },
      {
        id: "phase-01-parent-owner-check",
        title: "Owner Test Confirmation",
        description: "Make the one-panel proof understandable from the Owner Testing panel without reading logs, including phase126PublishHoldCloseoutStatusProof.",
        completionPercent: 100,
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-01-child-reload-proof",
            title: "Reload-Safe One-Panel Evidence",
            description: "Reload the app and confirm the completed proof remains visible, timestamped with checkedAt proof, storage-trusted, accurately labeled, backed by compact reloadProof evidence and phase126PublishHoldCloseoutStatusProof while timestamp-missing desktop proof returns to review.",
            completionPercent: 100,
            sourceDocument: "Local testing checklist"
          }
        ]
      }
    ]
  },
  {
    id: "phase-02-multi-panel",
    title: "Phase 2: Multi-Panel Session Isolation",
    description: "Verify multiple local Arena panels can run independently without cross-talk in identity, stream, or control state with phase126PublishHoldCloseoutStatusProof while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-02-parent-panel-identity",
        title: "Panel Identity Isolation",
        description: "Keep each panel's session id, role, branch, runtime, stream, transcript, and phase126PublishHoldCloseoutStatusProof scoped to that panel.",
        status: "ongoing",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Arena chat lanes",
        children: [
          {
            id: "phase-02-child-two-panel-smoke",
            title: "Run Two-Panel Smoke",
            description: "Open two panels, run separate turns, and verify each panel records compact smokeProof source/execution/timestamp/identity flags plus session/thread, event-count, transcript-length, completion, token evidence, and phase126PublishHoldCloseoutStatusProof for only its own activity.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Desktop smoke harness"
          },
          {
            id: "phase-02-child-no-cross-talk",
            title: "Verify No Cross-Talk",
            description: "Confirm controls, stream state, final response, proof rows, panel completion/token/foreign-token counts, compact runtime routeProof quarantine/cross-talk trust verdict, and phase126PublishHoldCloseoutStatusProof cannot bleed into another panel.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Panel identity guards"
          }
        ]
      },
      {
        id: "phase-02-parent-session-persistence",
        title: "Multi-Panel Persistence",
        description: "Persist and restore panel sessions without corrupting identity, owner-visible readiness evidence, or phase126PublishHoldCloseoutStatusProof.",
        completionPercent: 100,
        sourceDocument: "Session persistence",
        children: [
          {
            id: "phase-02-child-restore-panels",
            title: "Restore Saved Panel Stack",
            description: "Reload the desktop app and verify at least two fresh saved panel session labels restore with compact restoreProof counts, restored/stale panel IDs, stale-label counts, duplicate-identity counts, trust verdict, and phase126PublishHoldCloseoutStatusProof before trusting Phase 2 persistence.",
            completionPercent: 100,
            sourceDocument: "Local testing checklist"
          }
        ]
      }
    ]
  },
  {
    id: "phase-03-controls-slash",
    title: "Phase 3: Controls, Slash Commands, and Desktop Proof",
    description: "Clear the current blocker by proving slash execution, session controls, storage-attested current-panel desktop proof freshness, fail-closed proof-export offline verification, PM-link and evidence-key counted exit visibility, command-plan clarity, visible CLI validation provenance, slash/session-first blocker review, goal/PM traceability, visible handoff record-gate reason, owner-reviewed handoff readiness tied to compact current non-expired evidence, clearance snapshot, age matching, and phase3ClearanceCompletionStatusProof.",
    status: "ongoing",
    completionPercent: 100,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-03-parent-proof-clearance",
        title: "Desktop Proof Clearance",
        description: "Run the real desktop gate actions, prove owner-visible rows persist after reload and refresh stale-proof status while the app stays open, keep command-plan and CLI validation provenance visible in traceability, surface PM-link and evidence-key counted exit visibility, keep proof-export download gated by offline verification, prioritize slash/session blockers before desktop smoke, link goal/PM traceability, show the visible handoff record-gate reason, keep the handoff boundary matched to compact current non-expired evidence, clearance snapshot, and age, and summarize completion with phase3ClearanceCompletionStatusProof.",
        status: "ongoing",
        completionPercent: 100,
        complexity: "extra_high",
        sourceDocument: "Current state and pipeline",
        children: [
          {
            id: "phase-03-child-smoke-rows",
            title: "Persist Smoke Proof Rows",
            description: "Confirm each desktop-executed smoke proof row survives reload independently with storage-attested proof, current-panel storage provenance, stale checkedAt timestamps downgrading to review during long-open sessions, browser fallback rows remaining waiting, and phase3ClearanceCompletionStatusProof smokeRows counts.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 3 smoke proof readiness"
          },
          {
            id: "phase-03-child-exit-gate",
            title: "Expose Exact Exit Blocker",
            description: "If Phase 3 cannot exit, show the exact remaining blocker, current panel, PM link count, evidence key count, stale proof, row-specific slash, session, or smoke next owner action, and phase3ClearanceCompletionStatusProof exit status instead of a vague incomplete state.",
            completionPercent: 100,
            sourceDocument: "Phase 3 exit gate evidence"
          },
          {
            id: "phase-03-child-command-plan",
            title: "Desktop Smoke Command Plan",
            description: "Show the exact local Phase 3 smoke command, covered proof rows, command-held state, visible CLI validation record actions and provenance, blocker-correlated next action, and phase3ClearanceCompletionStatusProof commandPlan/cli status without running commands automatically.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 3 clearance command plan"
          },
          {
            id: "phase-03-child-blocker-priority",
            title: "Clearance Blocker Priority",
            description: "Rank exact Phase 3 blockers by slash/session priority, severity, proof category, command-addressable status, and visible row-specific detail plus exit action, with phase3ClearanceCompletionStatusProof blocker counts before owner handoff.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 3 blocker priority"
          },
          {
            id: "phase-03-child-traceability",
            title: "Clearance Traceability",
            description: "Link the trusted Phase 3 clearance goal, required PM rows, clearance evidence, command plan, CLI validation freshness, proof-export offline verification, blocker priority, phase3ClearanceCompletionStatusProof, and exact handoff-review details for current fingerprint, clearance snapshot, and age matching in one owner-review trace.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 3 clearance traceability"
          },
          {
            id: PHASE3_PROOF_EXPORT_PM_TASK_ID,
            title: "Proof Export Boundary",
            description: "Keep Phase 3 proof export fail-closed until offline verification, current evidence fingerprint, expected and recorded handoff fingerprints, clearance snapshot, open blocker count, fresh handoff age, and phase3ClearanceCompletionStatusProof all match before Phase 4 review can advance, while allowing owner handoff recording from complete proof-export preflight when the handoff record is the only missing item.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 3 proof export"
          },
          {
            id: "phase-03-child-handoff-gate",
            title: "Owner Handoff Gate",
            description: "Show desktop proof clearance, exact blocker visibility, trusted current-goal and PM traceability precondition, visible handoff record-gate reason, local owner handoff record actions gated by fresh CLI validation, fail-closed proof-export offline verification, export-ready current-evidence fingerprint, clearance snapshot, age matching, phase3ClearanceCompletionStatusProof, and the Phase 4 review boundary before Phase 4 review resumes.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 3 handoff gate"
          },
          {
            id: "phase-03-child-clearance-completion-status",
            title: "Clearance Completion Status",
            description: "Show phase3ClearanceCompletionStatusProof state/readiness/phase-complete/phase4/smokeRows/exit/commandPlan/cli/blockers/traceability/proofExport/handoff/publishExecution/noPush/pmLinks/open/topHold counts so Phase 3 only reaches completion when every clearance and handoff proof surface is ready while execution and pushing stay owner-held.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 3 clearance completion status"
          }
        ]
      },
      {
        id: "phase-03-parent-slash-controls",
        title: "Slash and Session Control Readiness",
        description: "Verify current-panel slash execution plus interrupt, retry, steer, fork, resume, and archive readiness evidence with storage provenance, honest unsupported lifecycle states, and phase3ClearanceCompletionStatusProof Phase 3 completion coverage.",
        status: "ongoing",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-03-child-slash-ready",
            title: "Slash Evidence Reaches Ready",
            description: "Run panel-scoped slash command evidence and persist current-panel storage provenance, ready route state, blocked states, and phase3ClearanceCompletionStatusProof exit coverage honestly.",
            completionPercent: 100,
            sourceDocument: "Slash execution evidence"
          },
          {
            id: "phase-03-child-control-ready",
            title: "Session Controls Reach Ready",
            description: "Validate interrupt, retry, and steer as ready while fork, resume, and archive stay honestly unsupported, with phase3ClearanceCompletionStatusProof session-control coverage honest before Phase 3 exits.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Session control readiness"
          }
        ]
      }
    ]
  },
  {
    id: "phase-04-provider-surfaces",
    title: "Phase 4: Provider Integration Surfaces",
    description: "Expand command, skill, plugin, MCP, automation, and personalization surfaces with metadata-only readiness depth, fresh catalog proof, structured catalog-depth aggregate proof, structured command/skill aggregate proof with item-order/source/metadata coverage, structured plugin/MCP aggregate proof with item-order/source/metadata coverage, structured all-catalog refresh-smoke proof, structured refresh-safety depth aggregate proof, structured plugin/MCP scoped proof, structured approval-chain proof, structured audit-chain proof, structured rollback-chain proof, structured permission-chain proof, structured surface-depth aggregate proof, aggregate local record-validation proof, aggregate record-chain traceability proof, offline provider-review artifact providerExecutionGateHeld proof, owner-visible phase4ProviderCompletionStatusProof, and current six-surface fingerprint checks after Phase 3 clears.",
    completionPercent: 100,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-04-parent-catalogs",
        title: "Provider Catalog Surfaces",
        description: "Render provider catalogs, readiness labels, current catalog fingerprints, metadata proof, structured catalog-depth aggregate proof, structured command/skill aggregate proof with item-order/source/metadata coverage, structured plugin/MCP aggregate proof with item-order/source/metadata coverage, structured plugin/MCP scoped proof, structured approval-chain proof, structured audit-chain proof, structured rollback-chain proof, structured permission-chain proof, structured surface-depth aggregate proof, aggregate local record-validation proof, aggregate record-chain traceability proof, offline provider-review artifact providerExecutionGateHeld proof, phase4ProviderCompletionStatusProof, and surface-depth blockers as metadata-first surfaces before execution is enabled.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Live platform capabilities",
        children: [
          {
            id: "phase-04-child-command-skill",
            title: "Command and Skill Catalogs",
            description: "Show command and skill entries with scoped item-order proof, structured command/skill aggregate proof including explicit pair-order, item-order/source/metadata coverage, commandScopeProof, skillInvocationProof, fallback/source guidance, evidence keys, owner-safe readiness proof, and execution locks.",
            completionPercent: 100,
            sourceDocument: "Command and skill catalogs"
          },
          {
            id: "phase-04-child-plugin-mcp",
            title: "Plugin and MCP Catalogs",
            description: "Show plugin and MCP entries with structured plugin/MCP aggregate proof including explicit pair-order, item-order/source/metadata coverage, pluginSurfaceProof, metadata-only surface proof, mcpToolPolicyProof transport/tool-policy proof, connection state, allowed surfaces, non-mutating readiness evidence, and execution-lock artifact enforcement.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Plugin and MCP catalogs"
          },
          {
            id: "phase-04-child-catalog-depth",
            title: "Provider Catalog Detail Depth",
            description: "Show command, skill, plugin, MCP, automation, and personalization catalog records with visible source, totals, explicit six-surface kind-order proof, item-order proof, metadata proof, structured catalogDepthProof aggregate proof, readiness state, evidence keys, owner-safe proof, next actions, and execution locks.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider catalog depth"
          },
          {
            id: "phase-04-child-surface-depth",
            title: "Provider Surface Depth",
            description: "Show surface coverage, setup blockers, capability gaps, preview review, approval, audit, rollback, permission, explicit nine-gate item-kind proof, owner-boundary proof including structured approval/audit/rollback/permission chain proof coverage, structured surfaceDepthProof aggregate proof, localRecordValidationProof, and execution lock before provider execution is considered.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider surface depth"
          },
          {
            id: "phase-04-child-approval-record",
            title: "Provider Approval Record",
            description: "Record and clear local owner approval only when the current six-surface catalog fingerprint, fresh metadata-only refresh-safety proof, structured refresh-safety readiness proof, structured approvalChainProof with compact record-freshness verdict, aggregate local record-validation proof, mutation lock, and execution lock match, without unlocking audit, rollback, permission, or execution.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider approval record"
          },
          {
            id: "phase-04-child-audit-record",
            title: "Provider Audit Record",
            description: "Record and clear local provider audit review only when the current approval record, approval validation state, structured approval-chain proof, current six-surface catalog fingerprint, current surface-depth audit evidence fingerprint, structured auditChainProof with compact record-freshness verdict, aggregate local record-validation proof, owner-boundary proof, and mutation lock match, without unlocking rollback, permission, or execution.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider audit record"
          },
          {
            id: "phase-04-child-rollback-record",
            title: "Provider Rollback Record",
            description: "Record and clear local provider rollback review only when the current approval record, current audit record, ready audit validation, structured audit-chain proof, current six-surface catalog fingerprint, current audit evidence fingerprint, current surface-depth rollback evidence fingerprint, owner/action evidence, structured rollbackChainProof with compact record-freshness verdict, aggregate local record-validation proof, and mutation lock match, without unlocking permission or execution.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider rollback record"
          },
          {
            id: "phase-04-child-permission-record",
            title: "Provider Permission Record",
            description: "Record and clear local provider permission review only when the current approval, audit, rollback, ready rollback validation, structured rollback-chain proof, six-surface catalog, audit evidence, rollback evidence, surface-depth, permission evidence, owner/scope/action evidence, structured permissionChainProof with compact record-freshness verdict, aggregate local record-validation proof, and every provider surface scope match while mutation remains locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider permission record"
          },
          {
            id: "phase-04-child-traceability",
            title: "Provider Traceability",
            description: "Link the Phase 4 remaining goal, PM child rows, catalog depth, refresh safety depth, fresh catalog fingerprint proof, surface depth, local approval, audit, rollback, permission records, aggregate traceabilityProof, aggregate record-chain proof, and execution locks before provider execution is considered.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider traceability"
          },
          {
            id: "phase-04-child-blocker-priority",
            title: "Provider Blocker Priority",
            description: "Rank setup-required, unavailable, unsupported, blocked, and preview provider blockers across catalog depth, refresh safety, surface depth, and traceability before owner action, show compact aggregate blockerPriorityProof with top-blocker source, kind, status, evidence-key, catalog-smoke relevance, traceability trust, and aggregate record-chain proof, while keeping remaining-goal and PM traceability repairs out of catalog-smoke actions.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider blocker priority"
          },
          {
            id: "phase-04-child-completion-status",
            title: "Provider Completion Status",
            description: "Show owner-visible phase4ProviderCompletionStatusProof that ties catalog-depth, refresh-safety, surface-depth, traceability, blocker-priority, offline provider-review artifact providerExecutionGateHeld proof, providerGate held proof, PM links, and provider execution-lock evidence together without unlocking provider execution.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 provider completion status"
          }
        ]
      },
      {
        id: "phase-04-parent-refresh-safety",
        title: "Metadata-Only Refresh Safety",
        description: "Keep refresh and readiness paths read-only, fresh, structured with all-catalog refresh-smoke proof including compact per-surface state proof and refresh-safety depth aggregate proof, and matched to current catalog evidence until provider permissions and approval gates are explicit.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Provider catalog safety",
        children: [
          {
            id: "phase-04-child-refresh-smoke",
            title: "All-Catalog Refresh Smoke",
            description: "Refresh and classify catalog status with checkedAt, all-six-surface execution count, explicit six-surface order proof, compact per-surface state proof, refreshSmokeProof, catalog fingerprint, metadata-only contract, reload-safe proof, and execution-lock proof without running commands, tools, automations, or mutations.",
            completionPercent: 100,
            sourceDocument: "Catalog refresh owner validation"
          },
          {
            id: "phase-04-child-refresh-safety-depth",
            title: "Refresh Safety Depth",
            description: "Show refresh run state, six-surface order, validation result, proof freshness, catalog fingerprint match, structured refreshSafetyDepthProof aggregate proof with explicit review-row kind coverage, metadata-only contract, provider execution lock, and reload-safe metadata-only proof as separate review rows.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 4 refresh safety depth"
          }
        ]
      }
    ]
  },
  {
    id: "phase-05-migration-center",
    title: "Phase 5: Migration Center",
    description: "Turn the metadata-only migration foundations into a guarded, review-first migration workflow with apply-intent locks, rollback evidence, fingerprint-matched audit consistency, persisted apply-review staging, sensitive exclusions, migrationReviewDepthProof, migrationTraceabilityProof trust=ready/openReview=0, migrationBlockerPriorityProof open=0, migrationApplyDecisionProof canApply=no/profileActivation=locked/approval=required, migrationOwnerApprovalHandoffProof requestable=yes/recorded=no/canApply=no with local owner approval record persistence, applyImplementationBoundaryProof executor=missing/mutationPath=locked/canApply=no, phase5MigrationCompletionGate phaseComplete=yes/reviewOnly=complete, and owner-visible no-open-blocker/no-apply proof.",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-05-parent-draft-workflow",
        title: "Migration Draft Workflow",
        description: "Create, persist, preview, review, and stage metadata-only apply intent for migration profile drafts with migrationReviewDepthProof records=6/6 ready=6, migrationApplyDecisionProof canApply=no, migrationOwnerApprovalHandoffProof requestable=yes/recorded states, applyImplementationBoundaryProof executor=missing, and phase5MigrationCompletionGate phaseComplete=yes before any mutation-capable action.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Migration Center",
        children: [
          {
            id: "phase-05-child-profile-drafts",
            title: "Profile Draft Persistence",
            description: "Persist migration profiles, draft history, import state, evidence fingerprints, apply-review-staged audit actions, rollback notes, audit summaries, migrationReviewDepthProof evidenceKeys=6/6, migrationApplyDecisionProof localAudit=ready, migrationOwnerApprovalHandoffProof record persistence, and local migration owner approval records without changing active profiles or source data.",
            completionPercent: 100,
            sourceDocument: "Migration model"
          },
          {
            id: "phase-05-child-preview-metadata",
            title: "Metadata Preview",
            description: "Show migration impact, selected metadata category counts, review-gate previews, sensitive-exclusion evidence keys, unsupported category visibility, migrationReviewDepthProof sourceMutation=locked, migrationApplyDecisionProof sourceMutation=locked, migrationOwnerApprovalHandoffProof sourceMutation=locked, applyImplementationBoundaryProof sourceMutation=locked, and no-private-content/no-external-action boundaries.",
            completionPercent: 100,
            sourceDocument: "Migration Center"
          }
        ]
      },
      {
        id: "phase-05-parent-rollback-audit",
        title: "Rollback and Audit Review",
        description: "Make rollback strategy, review-depth records, fingerprint-matched audit evidence, unique evidence keys, sensitive-boundary traceability, migrationTraceabilityProof trust=ready/openReview=0, migrationBlockerPriorityProof open=0, migrationApplyDecisionProof approval=required/canApply=no, migrationOwnerApprovalHandoffProof approval=required/recorded states, applyImplementationBoundaryProof mutationPath=locked, and source-mutation locks mandatory before migration work can leave review-only mode.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-05-child-audit-summary",
            title: "Audit Summary Review",
            description: "Surface who, what, when, risk level, draft/audit fingerprint match, selected/review-required/unsupported category counts, apply-intent lock, rollback path, migrationReviewDepthProof records=6/6, migrationApplyDecisionProof localAudit=ready, and migrationOwnerApprovalHandoffProof requestable=yes for every migration draft.",
            completionPercent: 100,
            sourceDocument: "Migration audit summary"
          },
          {
            id: "phase-05-child-review-depth",
            title: "Migration Review Depth",
            description: "Show apply-intent lock, local apply-review-staged audit proof, rollback evidence, fingerprint-matched audit consistency, sensitive exclusions, profile activation lock, migrationReviewDepthProof, migrationApplyDecisionProof, and migrationOwnerApprovalHandoffProof as six separate ready owner-review records with unique evidence keys.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Migration review gate"
          },
          {
            id: "phase-05-child-traceability",
            title: "Migration Traceability",
            description: "Link Phase 5 remaining-goal status, PM child rows including the apply-decision gate, owner-approval handoff, apply implementation boundary, and completion gate, migration review-depth evidence keys, draft/audit fingerprint coverage, sensitive exclusions, rollback/audit coverage, migrationTraceabilityProof trust=ready/openReview=0, source-mutation locks, and the profile activation lock before apply review can advance.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 5 migration traceability"
          },
          {
            id: "phase-05-child-blocker-priority",
            title: "Migration Blocker Priority",
            description: "Rank exact Phase 5 blockers across migration hardening, review-depth records, traceability, apply intent, rollback, fingerprint-matched audit, sensitive exclusions, migrationBlockerPriorityProof open=0, migrationApplyDecisionProof openBlockers=0, migrationOwnerApprovalHandoffProof requestable/recorded state, applyImplementationBoundaryProof executor=missing/mutationPath=locked, source-mutation locks, and profile activation lock before apply review advances, while keeping remaining-goal and PM traceability repairs out of metadata-review actions.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 5 migration blocker priority"
          },
          {
            id: "phase-05-child-apply-decision-gate",
            title: "Migration Apply Decision Gate",
            description: "Show the owner-visible apply-decision proof that migration review can be staged locally while migrationApplyDecisionProof keeps canApply=no, profileActivation=locked, sourceMutation=locked, approval=required, rollback=ready, sensitiveExclusions=ready, and active profile changes locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 5 migration apply decision gate"
          },
          {
            id: "phase-05-child-owner-approval-handoff",
            title: "Migration Owner Approval Handoff",
            description: "Show the owner-visible handoff proof that explicit owner approval is requestable and locally persisted from the reviewed migration packet while migrationOwnerApprovalHandoffProof keeps recorded state, canApply=no, profileActivation=locked, sourceMutation=locked, and active profile changes locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 5 migration owner approval handoff"
          },
          {
            id: "phase-05-child-apply-implementation-boundary",
            title: "Migration Apply Implementation Boundary",
            description: "Show the owner-visible final apply implementation boundary proof that a reviewed and locally approved migration packet can only enter a future implementation design while applyImplementationBoundaryProof keeps executor=missing, mutationPath=locked, canApply=no, profileActivation=locked, sourceMutation=locked, and active profile changes locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 5 migration apply implementation boundary"
          },
          {
            id: "phase-05-child-completion-gate",
            title: "Migration Completion Gate",
            description: "Show the owner-visible Phase 5 completion gate proof that the migration lane is complete as a review-only workflow while phase5MigrationCompletionGate keeps phaseComplete=yes, reviewOnly=complete, canApply=no, executor=missing, mutationPath=locked, profileActivation=locked, profileActivationApproval=required, and profileActivationHandler=missing.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 5 migration completion gate"
          }
        ]
      }
    ]
  },
  {
    id: "phase-06-planning-lane",
    title: "Phase 6: Project and Program Planning Lane",
    description: "Make the local Project Management lane a useful phase board, hierarchy planner, staged Arena packet source, and phase126PublishHoldCloseoutStatusProof surface while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-06-parent-phase-board",
        title: "Phase Board Hierarchy",
        description: "Represent every roadmap phase as an Epic with needed Parent and Child tasks, including phase126PublishHoldCloseoutStatusProof coverage.",
        status: "ongoing",
        completionPercent: 100,
        sourceDocument: "Project management lane",
        children: [
          {
            id: "phase-06-child-current-phase-map",
            title: "Load Current Phase Map",
            description: "Update the board with Phase 0 through Phase 11, current completion, next actions, compact phase-map proof, staged Epic/Parent/Child review coverage, and phase126PublishHoldCloseoutStatusProof.",
            status: "ongoing",
            completionPercent: 100,
            sourceDocument: "Phase completion map"
          },
          {
            id: "phase-06-child-saved-state-upgrade",
            title: "Upgrade Existing Saved Boards",
            description: "Ensure existing local Project Management state receives the current phase plan without malformed rows, refreshes stale current-plan rows from the canonical Phase 0-11 map, prunes duplicate current-plan saved rows, preserves duplicate custom rows, and reports saved-state proof counts for current-plan coverage, preserved collapsed or staged UI state, trust verdict, and phase126PublishHoldCloseoutStatusProof.",
            completionPercent: 100,
            sourceDocument: "Project management storage"
          }
        ]
      },
      {
        id: "phase-06-parent-arena-staging",
        title: "Arena Staging from PM Rows",
        description: "Let any phase, parent, or child stage a structured Arena review package with hierarchy context and phase126PublishHoldCloseoutStatusProof.",
        status: "ongoing",
        completionPercent: 100,
        sourceDocument: "Project management lane",
        children: [
          {
            id: "phase-06-child-run-context",
            title: "Staged Package Context",
            description: "Include compact runContextProof with selected task, descendants, parent/epic context, completion, source, risk, staged-review mode, and phase126PublishHoldCloseoutStatusProof in every PM run package.",
            status: "ongoing",
            completionPercent: 100,
            sourceDocument: "Arena dispatch package"
          },
          {
            id: "phase-06-child-publish-hold-traceability",
            title: "Publish Hold Traceability",
            description: "Link Phase 1 live proof, Phase 2 isolation proof, Phase 6 PM staging, required PM rows by Epic/Parent/Child kind, priority proof counts, compact local-hold evidence key with trust verdict, phase126PublishHoldCloseoutStatusProof, and the owner-held publish blocker before pushing is considered.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 1/2/6 publish hold traceability"
          },
          {
            id: "phase-06-child-publish-hold-blocker-priority",
            title: "Publish Hold Blocker Priority",
            description: "Rank the owner/remote publish hold, one-panel proof, two-panel isolation, PM staging, traceability blockers, and phase126PublishHoldCloseoutStatusProof before owner push approval, while keeping publish-goal and PM-link repairs out of owner-review actions.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 1/2/6 publish hold blocker priority"
          },
          {
            id: "phase-06-child-publish-hold-closeout-status",
            title: "Publish Hold Closeout Status",
            description: "Show phase126PublishHoldCloseoutStatusProof and phase126PublishExecutionGateProof state/readiness/implementation-complete/priority/local-hold/publish/push/noPush/proofCommits/PM-link/open/review/top-hold/evidence counts so Phase 1, Phase 2, and Phase 6 local implementation is visibly closed out while remote publishing, proof commits, and pushing stay owner-held.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 1/2/6 publish hold closeout status"
          }
        ]
      }
    ]
  },
  {
    id: "phase-07-dispatch-loop",
    title: "Phase 7: Orchestrator-Worker Dispatch",
    description: "Move from local dispatch previews to saved, reviewable orchestrator-worker handoff records with explicit dispatch review, handoff packet integrity, evidence freshness, offline dispatch-review artifact verification, owner-visible live-worker launch-gate proof, metadata closure-gate proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, main integration ownership depth, dispatchTraceabilityProof, and dispatchBlockerPriorityProof.",
    completionPercent: 100,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-07-parent-role-panels",
        title: "Role-Panel Dispatch Plan",
        description: "Define and record orchestrator, implementer, validator, and integration roles with clear attempt limits, role coverage counts, handoff packet integrity, offline artifact verification, live-worker launch-gate proof, metadata closure-gate proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, integrationOwnershipProof, PM coverage, traceability links, closure boundary, and live-worker execution locks.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Dispatch role-panel plan",
        children: [
          {
            id: "phase-07-child-worker-preview",
            title: "Worker Preview Cards",
            description: "Show worker objective, files owned, validation plan, retry limit, role coverage counts, per-role handoff packet integrity, handoff expectation, validation gate depth, dispatchReviewDepthProof, offline artifact verification, launch-gate canSpawn=no proof, closure-gate canClose metadata proof, closeoutProof state, ownerHandoffProof, phase7DispatchCompletionGate proof, PM coverage, and local no-runtime boundary before launch.",
            completionPercent: 100,
            sourceDocument: "Dispatch controls"
          },
          {
            id: "phase-07-child-integration-owner",
            title: "Main Integration Ownership",
            description: "Keep final integration, validation, commit, push approval, reporting, dispatch-review traceability, five-link traceability coverage, closure boundary, artifact verification, launch-gate approval-required proof, closure-gate no-spawn proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, and integrationOwnershipProof owned by the main Arena path.",
            completionPercent: 100,
            sourceDocument: "Dispatch safety rules"
          },
          {
            id: "phase-07-child-integration-ownership-depth",
            title: "Integration Ownership Depth",
            description: "Show integration owner, final validation owner, commit/push/reporting owner, pushApproval=required state, five traceability links, closure boundary, open-depth counts, integrationOwnershipProof, artifact verification, launch-gate lock ownership, closure-gate readiness, aggregate closeout readiness, owner handoff readiness, completion-gate readiness, and live-worker lock ownership as separate review rows.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 integration ownership depth"
          }
        ]
      },
      {
        id: "phase-07-parent-observed-loop",
        title: "Observed Dispatch-to-Handoff Loop",
        description: "Record role-panel plan, attempts, validation gates, handoff tasks, four per-role handoff packets, packet integrity, evidence freshness, closure, final merge review, dispatchReviewDepthProof, artifact verification, live-worker launch-gate proof, metadata closure-gate proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, and live-worker lock proof in one trace.",
        completionPercent: 100,
        complexity: "extra_high",
        sourceDocument: "Orchestrator-worker dispatch",
        children: [
          {
            id: "phase-07-child-handoff-trace",
            title: "Handoff Trace",
            description: "Show what each worker is expected to own, validate, retry, depend on, and hand back with handoff task counts, four per-role packet ownership, dependency order, validation labels, dispatchReviewDepthProof, offline artifact verification, launch-gate proof, closure-gate proof, closeoutProof state, ownerHandoffProof, phase7DispatchCompletionGate proof, and local no-runtime boundaries without polluting the main context.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Worker handoff"
          },
          {
            id: "phase-07-child-review-depth",
            title: "Dispatch Review Depth",
            description: "Audit visible role counts, max attempt limits, handoff task depth, per-role handoff packet integrity, current evidence fingerprint freshness, validation gate depth, dispatchReviewDepthProof, offline dispatch-review artifact verification, live-worker launch-gate proof, closure-gate proof, closeoutProof state, ownerHandoffProof, phase7DispatchCompletionGate proof, and the no-live-worker execution lock for staged PM Run outputs.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Dispatch review records"
          },
          {
            id: "phase-07-child-traceability",
            title: "Dispatch Traceability",
            description: "Link Phase 7 remaining-goal status, PM child rows, dispatch review depth, evidence freshness, offline artifact verification, integration ownership depth, launch-gate canSpawn=no proof, closure-gate canClose metadata proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, PM coverage, five-link traceability, closure boundary, live-worker locks, and dispatchTraceabilityProof before any worker spawning can be trusted.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch traceability"
          },
          {
            id: "phase-07-child-blocker-priority",
            title: "Dispatch Blocker Priority",
            description: "Rank exact Phase 7 blockers across role coverage, attempt limits, handoff tasks, handoff packet integrity, evidence freshness, validation gates, integration ownership, PM coverage, traceability, artifact verification, live-worker launch-gate proof, metadata closure-gate proof, aggregate closeout proof, owner handoff report proof, phase7DispatchCompletionGate proof, closure boundaries, and live-worker locks with dispatchBlockerPriorityProof before dispatch can expand, while keeping remaining-goal and PM traceability repairs out of dispatch-review actions.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 7 dispatch blocker priority"
          },
          {
            id: "phase-07-child-artifact-verification",
            title: "Dispatch Artifact Verification",
            description: "Verify the offline Phase 7 dispatch-review artifact with current evidence fingerprint matching, dispatchReviewDepthProof, integrationOwnershipProof, dispatchTraceabilityProof, dispatchBlockerPriorityProof, packet integrity, validation gate counts, live-worker locks, and no-runtime execution proof before review evidence can be trusted.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch review artifact"
          },
          {
            id: "phase-07-child-launch-gate",
            title: "Live Worker Launch Gate",
            description: "Show phase7LiveWorkerLaunchGate proof with artifact verification readiness, owner approval required, canSpawn=no, execution=locked, packet counts, live-worker lock counts, and open blocker counts before any worker session can spawn.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 live worker launch gate"
          },
          {
            id: "phase-07-child-closure-gate",
            title: "Dispatch Closure Gate",
            description: "Show phase7DispatchClosureGate proof with closure ready-to-close state, artifact verification readiness, launch-gate lock, canClose=yes metadata proof, canSpawn=no, approval required, traceability link counts, and open blocker counts before the dispatch review can close.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch closure gate"
          },
          {
            id: "phase-07-child-closeout-proof",
            title: "Dispatch Closeout Proof",
            description: "Show phase7DispatchCloseoutProof with artifact verification, launch-gate, closure-gate, canClose, canSpawn, approval-required, and open-blocker counts so Phase 7 can close locally while live worker spawning stays locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch closeout proof"
          },
          {
            id: "phase-07-child-owner-handoff-report",
            title: "Dispatch Owner Handoff Report",
            description: "Show phase7DispatchOwnerHandoffReport with closeout readiness, final validation owner, commit/push/reporting owner, pushApproval=required, canClose, canSpawn=no, packet counts, validation gates, and traceability links for owner review.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch owner handoff report"
          },
          {
            id: "phase-07-child-completion-gate",
            title: "Dispatch Completion Gate",
            description: "Show phase7DispatchCompletionGate proof with phaseComplete, owner handoff state, canClose, canSpawn=no, workerSession=held, sessionApproval=required, canCreateSession=no, pushApproval=required, packet counts, validation gates, and traceability link counts before Phase 7 completion can be trusted.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch completion gate"
          }
        ]
      }
    ]
  },
  {
    id: "phase-08-permissions-audit",
    title: "Phase 8: Permissions and Audit",
    description: "Harden risk gates, audit trails, permission boundaries, risk exceptions, disabled-path explanations, current owner audit-review fingerprints, record-specific rollback evidence, phase8RiskClosureProof, auditPersistenceProof current-fingerprint review, phase8AuditReviewHandoffProof artifact/fingerprint/reviewed-blocker gates, phase8PermissionAuditCompletionGate handoff-ready/fingerprint-current proof, phase8ClosureAuditStatusProof, phase8OwnerActionHandoffProof, phase8AuditReviewBlockerHandoffProof, phase8OwnerReviewClosureReadinessProof, phase8FinalCompletionHandoffProof, and phase8CloseoutStatusProof before mutation-capable paths expand.",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-08-parent-risk-gates",
        title: "Risk Gate Hardening",
        description: "Require explicit permission state, action risk, approval scope, fallback behavior, risk exceptions, disabled paths, owner review freshness, permissionLabelSummaryProof, topBlockerProof, blockerQueueProof, phase8RiskClosureProof, phase8CloseoutStatusProof, and missing-requirement explanations for risky actions.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Permission risk gates",
        children: [
          {
            id: "phase-08-child-permission-labels",
            title: "Permission State Labels",
            description: "Display unavailable, preview-only, approval-required, ready, waiting, review, and blocked states consistently across surfaces with compact permissionLabelProof provider, label, state, risk, requester evidence, aggregate permissionLabelSummaryProof total/preview-only/approval-required/blocked/ready label counts, and phase8CloseoutStatusProof.",
            completionPercent: 100,
            sourceDocument: "Runtime profile permissions"
          },
          {
            id: "phase-08-child-risk-blockers",
            title: "Risk Blocker Explanations",
            description: "Explain why an action is blocked and what permission, approval, evidence, or rollback requirement is needed to continue, with compact riskBlockerProof row detail, topBlockerProof source/kind/status/severity/audit-review detail, blockerQueueProof open/kind/status/reviewable counts, and phase8CloseoutStatusProof.",
            completionPercent: 100,
            sourceDocument: "Permission audit"
          },
          {
            id: "phase-08-child-risk-exceptions",
            title: "Risk Exceptions and Disabled Paths",
            description: "Show each permission, approval, evidence, owner-review, and rollback exception with disabled-path copy, required evidence, rollback expectation, record-specific rollback review, audit source, compact riskExceptionProof rows, aggregate riskExceptionSummaryProof severity/status/ready counts, and phase8CloseoutStatusProof.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 risk exception register"
          },
          {
            id: "phase-08-child-traceability",
            title: "Risk Traceability",
            description: "Link Phase 8 remaining-goal status, PM child rows, permission/audit depth records, local owner audit-review records, current audit evidence fingerprints, risk exceptions, disabled paths, evidence keys, rollback expectations, compact traceabilityProof goal/missing-PM/trust counts, traceabilityRowStateProof ready/review/blocked/waiting row-state counts, and phase8CloseoutStatusProof before mutation-capable paths can advance.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 risk traceability"
          },
          {
            id: "phase-08-child-blocker-priority",
            title: "Risk Blocker Priority",
            description: "Rank exact Phase 8 blockers across permission, approval, evidence, audit persistence, owner-review freshness, record-specific rollback, disabled paths, exceptions, and traceability with topBlockerProof source/kind/status/severity/audit-review detail, blockerQueueProof open/kind/status/reviewable counts, and phase8CloseoutStatusProof before mutation-capable paths can advance, while keeping remaining-goal and PM traceability repairs out of audit-review actions.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 8 risk blocker priority"
          },
          {
            id: "phase-08-child-risk-closure",
            title: "Risk Closure Proof",
            description: "Classify Phase 8 blockers into audit-review addressable, owner-action, and closure-ready groups with open exception counts, mutation-lock state, current top blocker source/status, compact phase8RiskClosureProof, and phase8CloseoutStatusProof before blocker closure can be treated as completion evidence.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 risk closure"
          }
        ]
      },
      {
        id: "phase-08-parent-audit-log",
        title: "Owner-Visible Audit Trail",
        description: "Record attempted actions, owner audit reviews, approvals, blocked states, validation outcomes, record-specific rollback reviews, audit persistence depth, compact auditPersistenceProof state/readiness/record/open-exception counts, current-fingerprint proof, reviewed-blocker proof, phase8AuditReviewHandoffProof artifact-state/fingerprint-current/reviewed-blocker gates, phase8PermissionAuditCompletionGate handoff-ready/fingerprint-current proof, phase8ClosureAuditStatusProof blocked-category counts, phase8OwnerActionHandoffProof owner-action clearance, phase8AuditReviewBlockerHandoffProof reviewable-blocker handoff, phase8OwnerReviewClosureReadinessProof closure gates, phase8FinalCompletionHandoffProof Phase 9 handoff readiness, and phase8CloseoutStatusProof closeout status for local owner-review persistence.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Audit requirements",
        children: [
          {
            id: "phase-08-child-audit-persistence",
            title: "Audit Persistence",
            description: "Persist audit entries and owner audit-review records locally while keeping malformed or stale audit state from hiding permission, evidence, mutation-lock, current-fingerprint, reviewed-blocker, rollback blockers, compact auditPersistenceProof state/readiness/record/open-exception/fingerprint-current counts, and phase8CloseoutStatusProof.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Audit storage"
          },
          {
            id: "phase-08-child-owner-review-handoff",
            title: "Owner Review Handoff",
            description: "Show the Phase 8 owner audit-review handoff with recordable/recorded state, artifact verification state, current audit fingerprint, reviewed-blocker proof, current top blocker source/status/reviewability, mutation lock, traceability trust, open blocker and exception counts, compact phase8AuditReviewHandoffProof artifactState/fingerprintCurrent/reviewedBlocker gates, and phase8CloseoutStatusProof before owner-review records are treated as closure evidence.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 owner review handoff"
          },
          {
            id: "phase-08-child-completion-gate",
            title: "Permission Audit Completion Gate",
            description: "Show the owner-visible Phase 8 completion gate proof that permission and audit depth can close only when traceability is trusted, audit artifact verification is ready, owner audit review is attached, phase8AuditReviewHandoffProof is ready with current fingerprint and reviewed-blocker proof, open blockers and exceptions are zero, phase8PermissionAuditCompletionGate keeps mutation paths locked, and phase8CloseoutStatusProof is present.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 permission audit completion gate"
          },
          {
            id: "phase-08-child-closure-audit-status",
            title: "Closure Audit Status",
            description: "Show final Phase 8 closure status with phase8ClosureAuditStatusProof state/readiness/phase-complete/mutation-advance, blocked-category counts, open blocker counts, owner-action counts, audit-review counts, open exception counts, closure/handoff/gate states, current top blocker, and phase8CloseoutStatusProof before Phase 9 can depend on Phase 8 completion.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 closure audit status"
          },
          {
            id: "phase-08-child-owner-action-handoff",
            title: "Owner Action Handoff",
            description: "Show Phase 8 owner-action handoff with phase8OwnerActionHandoffProof state/readiness/owner-action/audit-review/open/can-continue counts, exact top owner-action source/status/kind/priority, owner-action-clear proof, and phase8CloseoutStatusProof before audit-review blockers become the next closure lane.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 owner action handoff"
          },
          {
            id: "phase-08-child-audit-review-blocker-handoff",
            title: "Audit Review Blocker Handoff",
            description: "Show Phase 8 audit-review blocker handoff with phase8AuditReviewBlockerHandoffProof state/readiness/audit-review/owner-action/open/owner-action-clear/can-record counts, exact top audit-review source/status/kind/priority, reviewable-blocker handoff, and phase8CloseoutStatusProof before owner-review records are treated as closure evidence.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 audit review blocker handoff"
          },
          {
            id: "phase-08-child-owner-review-closure-readiness",
            title: "Owner Review Closure Readiness",
            description: "Show Phase 8 owner-review closure readiness with phase8OwnerReviewClosureReadinessProof state/readiness/recorded/recordable/audit-review-blockers/open/fingerprint/reviewed-blocker/handoff/gate/phase-complete/can-close counts before Phase 8 completion can support Phase 9 runner approval and phase8CloseoutStatusProof.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 owner review closure readiness"
          },
          {
            id: "phase-08-child-final-completion-handoff",
            title: "Final Completion Handoff",
            description: "Show Phase 8 final completion handoff with phase8FinalCompletionHandoffProof state/readiness/phase-complete/phase9/mutation-advance/closure/owner-review-closure/gate/recorded/open/audit-review-blocker/next-lane/top-hold counts plus phase8CloseoutStatusProof so Phase 9 can depend on Phase 8 only after owner-review closure is truly complete.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 final completion handoff"
          },
          {
            id: "phase-08-child-closeout-status",
            title: "Closeout Status",
            description: "Show Phase 8 closeout status with phase8CloseoutStatusProof state/readiness/phase-complete/phase9-dependency/mutation-paths/mutationExpansion/approvals/handlers/canAdvanceMutation/owner-review-close/final-handoff/recorded/open/audit-review-blocker/top-hold counts so Phase 9 dependency review can advance while mutation expansion and mutation paths stay locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 8 closeout status"
          }
        ]
      }
    ]
  },
  {
    id: "phase-09-desktop-runner",
    title: "Phase 9: Desktop-Backed Runner",
    description: "Enable the fixed terminal read-only desktop probe after permission, preview, audit, validation, persisted runner-review, current runner evidence fingerprint, complete Phase 8 owner-review proof, rollback, owner-visible Phase 9 proof summaries, visible Phase 9 desktop probe gate status, backendScope provider/intent proof, phase9RequestGateProof, phase9RunnerCompletionGateProof, phase9RunnerCloseoutStatusProof, Phase 9 request gate, and trusted Phase 9 traceability/current active goal gates pass.",
    completionPercent: 100,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-09-parent-runner-probe",
        title: "Runner Probe Hardening",
        description: "Keep the desktop runner limited to the fixed terminal-readonly-probe with selected-action readiness, visible request preview, visible Phase 9 desktop probe gate status, Phase 9 approval checks, fingerprint-matched local runner-review evidence, runner approval proof summary, backendScope provider/intent proof, phase9RequestGateProof, phase9RunnerCompletionGateProof, phase9RunnerCloseoutStatusProof, and mutation locks.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Desktop runner probe",
        children: [
          {
            id: "phase-09-child-reversible-action",
            title: "Choose One Reversible Action",
            description: "Use terminal-readonly-probe as the single selected read-only action with selected-action readiness, runner approval proof, backendScope provider/intent proof, visible Phase 9 desktop probe gate status, phase9RequestGateProof, no workspace write, no Git operation, no external call, no profile mutation, and the visible Probe control disabled until the Phase 9 request gate and trusted Phase 9 traceability/current active goal proof are ready.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Runner approval plan"
          },
          {
            id: "phase-09-child-runner-observability",
            title: "Runner Observability",
            description: "Show request readiness, approval window, validation output evidence key, backendScope provider/intent proof, audit count, local runner-review evidence, current runner evidence fingerprint, rollback evidence, direct-handler blocks, visible Phase 9 desktop probe gate held/ready status, mutation-lock count, phase9RequestGateProof, phase9RunnerCompletionGateProof, proof summaries, and final state for the selected probe.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Live action runner"
          },
          {
            id: "phase-09-child-traceability",
            title: "Runner Traceability",
            description: "Link Phase 9 remaining-goal status, current active goal trust, PM child rows, complete Phase 8 owner audit review proof, runner approval depth, local runner-review records, current runner evidence fingerprints, backendScope provider/intent proof, phase9RequestGateProof, phase9RunnerCompletionGateProof, Phase 9 request gate evidence, evidence keys, traceability proof summary, and mutation locks before the desktop runner can advance.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 9 runner traceability"
          },
          {
            id: "phase-09-child-blocker-priority",
            title: "Runner Blocker Priority",
            description: "Rank exact Phase 9 blockers across the Phase 8 gate, owner permission, approval window, request preview, validation output, backendScope provider/intent proof, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, phase9RequestGateProof, request-gate enforcement, traceability, blocker-priority proof summary, and mutation locks while separating owner-action blockers from runner-review-addressable blockers before the desktop runner can advance.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 9 runner blocker priority"
          }
        ]
      },
      {
        id: "phase-09-parent-approval-flow",
        title: "Approval and Rollback Flow",
        description: "Require owner approval, request preview, validation result, backendScope provider/intent proof, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, owner-visible proof summaries, phase9RequestGateProof, phase9RunnerCompletionGateProof, and Phase 9 request-gate enforcement before runner expansion.",
        completionPercent: 100,
        complexity: "extra_high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-09-child-approval-record",
            title: "Approval Record",
            description: "Record terminal request, approval, Phase 9 held blocks, fallback, failure, execution, local runner-review fingerprints, runner approval proof, backendScope provider/intent proof, phase9RequestGateProof, and rollback-safe evidence in the owner-visible audit path.",
            completionPercent: 100,
            sourceDocument: "Audit trail"
          },
          {
            id: "phase-09-child-approval-depth",
            title: "Runner Approval Depth",
            description: "Show fixed probe selection, owner approval, request preview, validation output, backendScope provider/intent proof, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, phase9RequestGateProof, phase9RunnerCompletionGateProof, Phase 9 request-gate enforcement, and the desktop execution lock as separate depth records.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 9 runner approval depth"
          },
          {
            id: "phase-09-child-completion-gate",
            title: "Runner Completion Gate",
            description: "Show phase9RunnerCompletionGateProof state/readiness/phase-complete/fixed-probe/runner-expansion/approval/traceability/blocker/request-gate/open/phase8-exception/mutation-lock/top-hold counts so only the fixed terminal-readonly-probe can advance after all Phase 9 gates are ready while broader runner actions stay locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 9 runner completion gate"
          },
          {
            id: "phase-09-child-closeout-status",
            title: "Runner Closeout Status",
            description: "Show phase9RunnerCloseoutStatusProof state/readiness/implementation-complete/fixed-probe/runner-expansion/approval/approval-depth/traceability/blocker/request-gate/completion-gate/PM-link/open/top-hold counts so Phase 9 is visibly closed out while broader runner actions stay locked.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 9 runner closeout status"
          }
        ]
      }
    ]
  },
  {
    id: "phase-10-adaptive-arena",
    title: "Phase 10: Adaptive Magnetic Arena",
    description: "Polish adaptive Arena layout regression, evaluate a FlexLayout-backed docking spike, density, keyboard controls, focus state, terminology, acceptance gates, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and owner-visible proof with npm.cmd run test:phase10:owner-visible.",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-10-parent-layout-foundation",
        title: "Adaptive Layout Foundation",
        description: "Keep drag, drop, keyboard adjustment, saved-state repair, project stack drop, panel capacity rules, owner-visible proof, phase10ArenaPolishCloseoutStatusProof, and the FlexLayout docking feasibility spike visible in Phase 10 readiness.",
        completionPercent: 100,
        sourceDocument: "Adaptive Arena layout",
        children: [
          {
            id: "phase-10-child-layout-regression",
            title: "Layout Regression Pass",
            description: "Verify adaptive panel move, resize, hide, reveal, reset, drop preview, saved-state repair, acceptance gates, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and owner-visible Phase 10 proof with npm.cmd run test:phase10:owner-visible.",
            completionPercent: 100,
            sourceDocument: "Adaptive layout tests"
          },
          {
            id: "phase-10-child-density-polish",
            title: "Density and Readability Polish",
            description: "Tune dense operational views so controls, labels, Phase readiness panels, evidence rows, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and owner-visible Phase 10 proof remain scannable.",
            completionPercent: 100,
            sourceDocument: "Product UI polish"
          },
          {
            id: "phase-10-child-flexlayout-spike",
            title: "FlexLayout Docking Spike",
            description: "Implement flexlayout-react from caplin/FlexLayout as an MIT-licensed opt-in React docking surface for Arena tabsets, splitters, saved layout JSON proof, dockable panels, dependency-install status, owner approval, decisionProof, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and custom adaptive-grid fallback before replacing custom adaptive-grid behavior.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "caplin/FlexLayout MIT license review"
          }
        ]
      },
      {
        id: "phase-10-parent-arena-identity",
        title: "Arena Product Identity",
        description: "Keep Arena language consistent across user-facing docs, UI labels, milestone text, Phase 10 readiness checks, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and owner-visible Arena polish proof.",
        status: "ongoing",
        completionPercent: 100,
        complexity: "low",
        sourceDocument: "Arena rename",
        children: [
          {
            id: "phase-10-child-term-scan",
            title: "Terminology Scan",
            description: "Prevent old public vocabulary from returning while preserving backward-compatible internal keys, public-safe scan reporting, traceabilityProof, blockerPriorityProof, phase10ArenaPolishCloseoutStatusProof, and owner-visible Arena terminology proof.",
            completionPercent: 100,
            complexity: "low",
            sourceDocument: "Arena rename validation"
          },
          {
            id: "phase-10-child-traceability",
            title: "Arena Polish Traceability",
            description: "Link Phase 10 remaining-goal status, PM child rows, layout regression, density, keyboard, focus, terminology, acceptance gates, traceabilityProof goal/missing-PM/trust, phase10ArenaPolishCloseoutStatusProof, and npm.cmd run test:phase10:owner-visible before release packaging can resume.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 10 Arena polish traceability"
          },
          {
            id: "phase-10-child-blocker-priority",
            title: "Arena Polish Blocker Priority",
            description: "Rank exact Phase 10 blockers across layout regression, density, keyboard controls, focus state, terminology, acceptance gates, PM coverage, traceability, blockerPriorityProof open/kind/status, phase10ArenaPolishCloseoutStatusProof, and owner-visible proof with open blocker count, Arena-review addressable count, and top-priority action detail before packaging resumes.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 10 Arena polish blocker priority"
          },
          {
            id: "phase-10-child-closeout-status",
            title: "Arena Polish Closeout Status",
            description: "Show phase10ArenaPolishCloseoutStatusProof state/readiness/implementation-complete/polish/traceability/blocker/FlexLayout/packaging/canResumePackaging/ownerResume/installPath/desktopPackaging/releaseGate/PM-link/open/review/top-hold counts so Phase 10 Arena polish is visibly closed out while FlexLayout is installed/adopted and release packaging stays owner-held.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 10 Arena polish closeout status"
          }
        ]
      }
    ]
  },
  {
    id: "phase-11-owner-packaging",
    title: "Phase 11: Owner Testing and Release Readiness",
    description: "Prepare owner-facing pass/fail command gates, proof-freshness depth, structured evidence records, fresh checkout instructions, owner-command closeout status, packaging locks, known-limit review, signed audit export and rollback reference evidence, final security closure capability, release-decision proof, phase11OwnerCommandCloseoutStatusProof, and phase11ReleaseCloseoutStatusProof.",
    completionPercent: 100,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-11-parent-owner-testing",
        title: "Owner Testing Flow",
        description: "Turn owner testing actions into one command-center pass/fail path for proof freshness depth, blockers, phase readiness, evidence records, next action, and phase11OwnerCommandCloseoutStatusProof.",
        completionPercent: 100,
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-11-child-owner-checklist",
            title: "Owner Checklist",
            description: "Show checklist coverage, ready/total owner checklist counts, proof freshness depth, blockers, phase readiness, next action, priority goal traces, phase11OwnerCommandCloseoutStatusProof, and safety boundaries in the Phase 11 command center.",
            completionPercent: 100,
            sourceDocument: "Owner testing docs"
          },
          {
            id: "phase-11-child-proof-freshness-depth",
            title: "Proof Freshness Depth",
            description: "Break owner proof freshness into Phase 1/2/6 proof, Phase 3 clearance, desktop smoke, command-plan, CLI validation, proof-export, and handoff proof rows with seven-row readiness, open-proof counts, owner-visible safety, phase11OwnerCommandCloseoutStatusProof, and npm.cmd run test:phase3:owner-visible guidance before release readiness.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 proof freshness depth"
          },
          {
            id: "phase-11-child-evidence-records",
            title: "Structured Evidence Records",
            description: "Represent fresh checkout, clean checkout, build/test, docs/known-limits, signed audit export, rollback reference, and release-decision proof as source/timestamp/detail records with missing, stale, malformed, waiting, review, blocked, ready states, and phase11OwnerCommandCloseoutStatusProof evidence-record coverage.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 evidence records"
          },
          {
            id: "phase-11-child-fresh-checkout",
            title: "Fresh Checkout Install Run",
            description: "Track fresh-checkout install, test, build, desktop run, proof-panel evidence, structured evidence record states, owner checkout source, recorded timestamp, freshness, phase11OwnerCommandCloseoutStatusProof, and held release-gate actions.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Packaging checklist"
          },
          {
            id: "phase-11-child-owner-command-closeout-status",
            title: "Owner Command Closeout Status",
            description: "Show phase11OwnerCommandCloseoutStatusProof state/readiness/implementation-complete/owner/proof/evidence/traceability/blocker/release/packaging/publishExecution/noPush/PM-link/open/review/top-hold counts so Owner Testing command-center implementation is visibly closed out while release, packaging, and publish execution stay paused for owner resume.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 owner command closeout status"
          }
        ]
      },
      {
        id: "phase-11-parent-release-packaging",
        title: "Release Readiness Gate",
        description: "Keep fresh checkout, clean checkout, build/test, smoke proof with Phase 3 proof-export detail, completed Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, packaging lock, docs, known limits, signed audit export and rollback reference evidence records, owner release traceability status counts, visible Security 100% final closure guidance, and release-decision top-prerequisite detail visible while packaging stays paused.",
        completionPercent: 100,
        complexity: "high",
        sourceDocument: "Phase 11 release readiness",
        children: [
          {
            id: "phase-11-child-package-validation",
            title: "Package Lock Validation",
            description: "Validate packaged-app prerequisites, fresh-checkout proof, proof persistence, completed Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, evidence-record inputs, packaging lock readiness, release-decision prerequisite detail, visible Security 100% final closure guidance, local storage repair, safety-disabled live actions, and release holds without executing packaging.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Release validation"
          },
          {
            id: "phase-11-child-signed-audit-export",
            title: "Signed Audit Export Evidence",
            description: "Show signed audit export metadata, signature verification, rollback references, no-mutation export scope, release privacy readiness, structured evidence-record freshness, and release-decision prerequisite detail while packaging, signing, installer creation, Git push, and external release actions stay paused.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 signed audit export evidence"
          },
          {
            id: "phase-11-child-traceability",
            title: "Owner Release Traceability",
            description: "Link Owner Testing command gates, proof freshness depth, completed Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, signed audit export and rollback reference evidence records, release readiness, owner release traceability status counts, linked goal and PM row coverage, release hold status, visible Security 100% final closure guidance, required PM rows, and packaging holds before release review can be trusted.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 owner release traceability"
          },
          {
            id: "phase-11-child-blocker-priority",
            title: "Owner Release Blocker Priority",
            description: "Rank exact Phase 11 blockers across owner proof, evidence freshness, fresh-checkout release readiness, signed audit export evidence, rollback references, visible Security 100% final closure guidance, PM coverage, and packaging hold state with open blocker count, owner-review addressable count, and top-priority action detail before packaging resumes, while keeping goal, PM, and Phase 3 trace repairs out of owner-review actions.",
            completionPercent: 100,
            complexity: "medium",
            sourceDocument: "Phase 11 owner release blocker priority"
          },
          {
            id: "phase-11-child-release-closeout-status",
            title: "Release Closeout Status",
            description: "Show phase11ReleaseCloseoutStatusProof state/readiness/implementation-complete/release/packaging/publishExecution/noPush/owner/proof/evidence/readiness/traceability/blocker/PM-link/open/hold/top-hold counts so release readiness is visibly closed out while packaging and publish execution stay paused for owner resume.",
            completionPercent: 100,
            complexity: "high",
            sourceDocument: "Phase 11 release closeout status"
          }
        ]
      }
    ]
  }
];

function expandPhaseSpec(phase: PhaseSpec): ProjectManagementTask[] {
  return [
    {
      id: phase.id,
      type: "epic",
      title: phase.title,
      description: phase.description,
      status: phase.status ?? "todo",
      completionPercent: phase.completionPercent,
      complexity: phase.complexity ?? "medium",
      sourceDocument: phase.sourceDocument,
      collapsed: false
    },
    ...phase.parents.flatMap((parent) => [
      {
        id: parent.id,
        type: "parent" as const,
        title: parent.title,
        description: parent.description,
        status: parent.status ?? "todo",
        completionPercent: parent.completionPercent,
        complexity: parent.complexity ?? "medium",
        sourceDocument: parent.sourceDocument,
        parentId: phase.id,
        collapsed: false
      },
      ...parent.children.map((child) => ({
        id: child.id,
        type: "child" as const,
        title: child.title,
        description: child.description,
        status: child.status ?? "todo",
        completionPercent: child.completionPercent,
        complexity: child.complexity ?? "medium",
        sourceDocument: child.sourceDocument,
        parentId: parent.id
      }))
    ])
  ];
}

const defaultProjectManagementPhasePlan = phaseSpecs.flatMap(expandPhaseSpec);

export const currentProjectManagementPhasePlanTaskIds = new Set(
  defaultProjectManagementPhasePlan.map((task) => task.id)
);

export const currentProjectManagementPhaseEpicIds = new Set(
  phaseSpecs.map((phase) => phase.id)
);

export const legacyProjectManagementSeedTaskIds = new Set([
  "epic-live-arena",
  "parent-phase3-proof",
  "child-smoke-rows",
  "child-session-controls",
  "parent-catalog-safety",
  "child-catalog-refresh",
  "epic-project-management",
  "parent-hierarchy-table",
  "child-pm-chat"
]);

export function createDefaultProjectManagementPhasePlan(): ProjectManagementTask[] {
  return defaultProjectManagementPhasePlan.map((task) => ({ ...task }));
}
