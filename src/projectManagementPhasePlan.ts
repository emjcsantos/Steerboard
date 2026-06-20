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
    description: "Prove one Arena chat panel can run against the desktop-backed session path with honest owner-visible evidence; local proof remains ongoing while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 60,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-01-parent-single-panel",
        title: "Single-Panel Runtime Proof",
        description: "Confirm a single Arena panel can start, stream, complete, and record readiness from the real desktop path.",
        status: "ongoing",
        completionPercent: 60,
        complexity: "high",
        sourceDocument: "Live functionality goal",
        children: [
          {
            id: "phase-01-child-live-start",
            title: "Start One Desktop Session",
            description: "Launch one desktop-backed chat session and show readiness instead of mock-only state.",
            status: "ongoing",
            completionPercent: 65,
            complexity: "medium",
            sourceDocument: "Owner testing panel"
          },
          {
            id: "phase-01-child-stream-evidence",
            title: "Capture Stream and Completion Evidence",
            description: "Persist stream, final status, and any fallback reason in owner-visible proof rows.",
            completionPercent: 45,
            complexity: "high",
            sourceDocument: "Phase 3 smoke proof readiness"
          }
        ]
      },
      {
        id: "phase-01-parent-owner-check",
        title: "Owner Test Confirmation",
        description: "Make the one-panel proof understandable from the Owner Testing panel without reading logs.",
        completionPercent: 55,
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-01-child-reload-proof",
            title: "Reload-Safe One-Panel Evidence",
            description: "Reload the app and confirm the completed proof remains visible and accurately labeled.",
            completionPercent: 50,
            sourceDocument: "Local testing checklist"
          }
        ]
      }
    ]
  },
  {
    id: "phase-02-multi-panel",
    title: "Phase 2: Multi-Panel Session Isolation",
    description: "Verify multiple Arena panels can run independently without cross-talk in identity, stream, or control state; local isolation proof remains ongoing while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 57,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-02-parent-panel-identity",
        title: "Panel Identity Isolation",
        description: "Keep each panel's session id, role, branch, runtime, stream, and transcript scoped to that panel.",
        status: "ongoing",
        completionPercent: 62,
        complexity: "high",
        sourceDocument: "Arena chat lanes",
        children: [
          {
            id: "phase-02-child-two-panel-smoke",
            title: "Run Two-Panel Smoke",
            description: "Open two panels, run separate turns, and verify each panel records only its own activity.",
            completionPercent: 55,
            complexity: "high",
            sourceDocument: "Desktop smoke harness"
          },
          {
            id: "phase-02-child-no-cross-talk",
            title: "Verify No Cross-Talk",
            description: "Confirm controls, stream state, final response, and proof rows cannot bleed into another panel.",
            completionPercent: 45,
            complexity: "high",
            sourceDocument: "Panel identity guards"
          }
        ]
      },
      {
        id: "phase-02-parent-session-persistence",
        title: "Multi-Panel Persistence",
        description: "Persist and restore panel sessions without corrupting identity or owner-visible readiness evidence.",
        completionPercent: 50,
        sourceDocument: "Session persistence",
        children: [
          {
            id: "phase-02-child-restore-panels",
            title: "Restore Saved Panel Stack",
            description: "Reload the desktop app and verify the saved panel stack and session labels restore correctly.",
            completionPercent: 50,
            sourceDocument: "Local testing checklist"
          }
        ]
      }
    ]
  },
  {
    id: "phase-03-controls-slash",
    title: "Phase 3: Controls, Slash Commands, and Desktop Proof",
    description: "Clear the current blocker by proving slash execution, session controls, storage-attested current-panel desktop proof freshness, fail-closed proof-export offline verification, PM-link and evidence-key counted exit visibility, command-plan clarity, visible CLI validation provenance, slash/session-first blocker review, goal/PM traceability, visible handoff record-gate reason, and owner-reviewed handoff readiness tied to compact current non-expired evidence, clearance snapshot, and age matching.",
    status: "ongoing",
    completionPercent: 99,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-03-parent-proof-clearance",
        title: "Desktop Proof Clearance",
        description: "Run the real desktop gate actions, prove owner-visible rows persist after reload and refresh stale-proof status while the app stays open, keep command-plan and CLI validation provenance visible in traceability, surface PM-link and evidence-key counted exit visibility, keep proof-export download gated by offline verification, prioritize slash/session blockers before desktop smoke, link goal/PM traceability, show the visible handoff record-gate reason, and keep the handoff boundary matched to compact current non-expired evidence, clearance snapshot, and age.",
        status: "ongoing",
        completionPercent: 99,
        complexity: "extra_high",
        sourceDocument: "Current state and pipeline",
        children: [
          {
            id: "phase-03-child-smoke-rows",
            title: "Persist Smoke Proof Rows",
            description: "Confirm each desktop-executed smoke proof row survives reload independently with storage-attested proof, current-panel storage provenance, stale checkedAt timestamps downgrading to review during long-open sessions, and browser fallback rows remaining waiting.",
            completionPercent: 90,
            complexity: "high",
            sourceDocument: "Phase 3 smoke proof readiness"
          },
          {
            id: "phase-03-child-exit-gate",
            title: "Expose Exact Exit Blocker",
            description: "If Phase 3 cannot exit, show the exact remaining blocker, current panel, PM link count, evidence key count, stale proof, and row-specific slash, session, or smoke next owner action instead of a vague incomplete state.",
            completionPercent: 94,
            sourceDocument: "Phase 3 exit gate evidence"
          },
          {
            id: "phase-03-child-command-plan",
            title: "Desktop Smoke Command Plan",
            description: "Show the exact local Phase 3 smoke command, covered proof rows, command-held state, visible CLI validation record actions and provenance, and blocker-correlated next action without running commands automatically.",
            completionPercent: 90,
            complexity: "medium",
            sourceDocument: "Phase 3 clearance command plan"
          },
          {
            id: "phase-03-child-blocker-priority",
            title: "Clearance Blocker Priority",
            description: "Rank exact Phase 3 blockers by slash/session priority, severity, proof category, command-addressable status, and visible row-specific detail plus exit action before owner handoff.",
            completionPercent: 90,
            complexity: "medium",
            sourceDocument: "Phase 3 blocker priority"
          },
          {
            id: "phase-03-child-traceability",
            title: "Clearance Traceability",
            description: "Link the current active Phase 3 goal, required PM rows, clearance evidence, command plan, CLI validation freshness, proof-export offline verification, blocker priority, and exact handoff-review details for current fingerprint, clearance snapshot, and age matching in one owner-review trace.",
            completionPercent: 90,
            complexity: "medium",
            sourceDocument: "Phase 3 clearance traceability"
          },
          {
            id: PHASE3_PROOF_EXPORT_PM_TASK_ID,
            title: "Proof Export Boundary",
            description: "Keep Phase 3 proof export fail-closed until offline verification, current evidence fingerprint, expected and recorded handoff fingerprints, clearance snapshot, open blocker count, and fresh handoff age all match before Phase 4 review can advance, while allowing owner handoff recording from complete proof-export preflight when the handoff record is the only missing item.",
            completionPercent: 99,
            complexity: "high",
            sourceDocument: "Phase 3 proof export"
          },
          {
            id: "phase-03-child-handoff-gate",
            title: "Owner Handoff Gate",
            description: "Show desktop proof clearance, exact blocker visibility, trusted current-goal and PM traceability precondition, visible handoff record-gate reason, local owner handoff record actions gated by fresh CLI validation, fail-closed proof-export offline verification, export-ready current-evidence fingerprint, clearance snapshot, age matching, and the Phase 4 review boundary before Phase 4 review resumes.",
            completionPercent: 99,
            complexity: "high",
            sourceDocument: "Phase 3 handoff gate"
          }
        ]
      },
      {
        id: "phase-03-parent-slash-controls",
        title: "Slash and Session Control Readiness",
        description: "Verify current-panel slash execution plus interrupt, retry, steer, fork, resume, and archive readiness evidence with storage provenance and honest unsupported lifecycle states.",
        status: "ongoing",
        completionPercent: 90,
        complexity: "high",
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-03-child-slash-ready",
            title: "Slash Evidence Reaches Ready",
            description: "Run panel-scoped slash command evidence and persist current-panel storage provenance, ready route state, or blocked states honestly.",
            completionPercent: 90,
            sourceDocument: "Slash execution evidence"
          },
          {
            id: "phase-03-child-control-ready",
            title: "Session Controls Reach Ready",
            description: "Validate interrupt, retry, and steer as ready while fork, resume, and archive stay honestly unsupported before Phase 3 exits.",
            completionPercent: 90,
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
    description: "Expand command, skill, plugin, MCP, automation, and personalization surfaces with metadata-only readiness depth, fresh catalog proof, and current six-surface fingerprint checks after Phase 3 clears.",
    completionPercent: 78,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-04-parent-catalogs",
        title: "Provider Catalog Surfaces",
        description: "Render provider catalogs, readiness labels, current catalog fingerprints, metadata proof, and surface-depth blockers as metadata-first surfaces before execution is enabled.",
        completionPercent: 66,
        complexity: "high",
        sourceDocument: "Live platform capabilities",
        children: [
          {
            id: "phase-04-child-command-skill",
            title: "Command and Skill Catalogs",
            description: "Show command and skill entries with scoped item-order proof, fallback/source guidance, evidence keys, owner-safe readiness proof, and execution locks.",
            completionPercent: 62,
            sourceDocument: "Command and skill catalogs"
          },
          {
            id: "phase-04-child-plugin-mcp",
            title: "Plugin and MCP Catalogs",
            description: "Show plugin and MCP entries with metadata-only surface proof, MCP transport/tool-policy proof, connection state, allowed surfaces, and non-mutating readiness evidence.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Plugin and MCP catalogs"
          },
          {
            id: "phase-04-child-catalog-depth",
            title: "Provider Catalog Detail Depth",
            description: "Show command, skill, plugin, MCP, automation, and personalization catalog records with visible source, totals, item-order proof, metadata proof, readiness state, evidence keys, owner-safe proof, next actions, and execution locks.",
            completionPercent: 68,
            complexity: "high",
            sourceDocument: "Phase 4 provider catalog depth"
          },
          {
            id: "phase-04-child-surface-depth",
            title: "Provider Surface Depth",
            description: "Show surface coverage, setup blockers, capability gaps, preview review, approval, audit, rollback, permission, and execution lock before provider execution is considered.",
            completionPercent: 60,
            complexity: "high",
            sourceDocument: "Phase 4 provider surface depth"
          },
          {
            id: "phase-04-child-approval-record",
            title: "Provider Approval Record",
            description: "Record and clear local owner approval only when the current six-surface catalog fingerprint and fresh metadata-only refresh-safety proof match, without unlocking audit, rollback, permission, or execution.",
            completionPercent: 62,
            complexity: "high",
            sourceDocument: "Phase 4 provider approval record"
          },
          {
            id: "phase-04-child-audit-record",
            title: "Provider Audit Record",
            description: "Record and clear local provider audit review only when the current approval record, current six-surface catalog fingerprint, and current surface-depth audit evidence fingerprint match, without unlocking rollback, permission, or execution.",
            completionPercent: 60,
            complexity: "high",
            sourceDocument: "Phase 4 provider audit record"
          },
          {
            id: "phase-04-child-rollback-record",
            title: "Provider Rollback Record",
            description: "Record and clear local provider rollback review only when the current approval record, current audit record, current six-surface catalog fingerprint, and current surface-depth rollback evidence fingerprint match, without unlocking permission or execution.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Phase 4 provider rollback record"
          },
          {
            id: "phase-04-child-permission-record",
            title: "Provider Permission Record",
            description: "Record and clear local provider permission review only when the current approval, audit, rollback, six-surface catalog, surface-depth, and permission evidence fingerprints match every provider surface while mutation remains locked.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Phase 4 provider permission record"
          },
          {
            id: "phase-04-child-traceability",
            title: "Provider Traceability",
            description: "Link the Phase 4 remaining goal, PM child rows, catalog depth, refresh safety depth, fresh catalog fingerprint proof, surface depth, local approval, audit, rollback, and permission records, and execution locks before provider execution is considered.",
            completionPercent: 68,
            complexity: "high",
            sourceDocument: "Phase 4 provider traceability"
          },
          {
            id: "phase-04-child-blocker-priority",
            title: "Provider Blocker Priority",
            description: "Rank setup-required, unavailable, unsupported, blocked, and preview provider blockers across catalog depth, refresh safety, surface depth, and traceability before owner action, show compact top-blocker source, kind, status, and evidence-key proof, while keeping remaining-goal and PM traceability repairs out of catalog-smoke actions.",
            completionPercent: 68,
            complexity: "high",
            sourceDocument: "Phase 4 provider blocker priority"
          }
        ]
      },
      {
        id: "phase-04-parent-refresh-safety",
        title: "Metadata-Only Refresh Safety",
        description: "Keep refresh and readiness paths read-only, fresh, and matched to current catalog evidence until provider permissions and approval gates are explicit.",
        completionPercent: 66,
        complexity: "high",
        sourceDocument: "Provider catalog safety",
        children: [
          {
            id: "phase-04-child-refresh-smoke",
            title: "All-Catalog Refresh Smoke",
            description: "Refresh and classify catalog status with checkedAt and catalog fingerprint proof without running commands, tools, automations, or mutations.",
            completionPercent: 62,
            sourceDocument: "Catalog refresh owner validation"
          },
          {
            id: "phase-04-child-refresh-safety-depth",
            title: "Refresh Safety Depth",
            description: "Show refresh run state, six-surface order, validation result, proof freshness, catalog fingerprint match, metadata-only contract, provider execution lock, and reload-safe metadata-only proof as separate review rows.",
            completionPercent: 68,
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
    description: "Turn the metadata-only migration foundations into a guarded, review-first migration workflow with apply-intent locks, rollback evidence, fingerprint-matched audit consistency, persisted apply-review staging, and sensitive exclusions.",
    completionPercent: 64,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-05-parent-draft-workflow",
        title: "Migration Draft Workflow",
        description: "Create, persist, preview, review, and stage metadata-only apply intent for migration profile drafts before any mutation-capable action.",
        completionPercent: 64,
        complexity: "high",
        sourceDocument: "Migration Center",
        children: [
          {
            id: "phase-05-child-profile-drafts",
            title: "Profile Draft Persistence",
            description: "Persist migration profiles, history, evidence fingerprints, apply-review staging notes, rollback notes, and audit summaries locally.",
            completionPercent: 62,
            sourceDocument: "Migration model"
          },
          {
            id: "phase-05-child-preview-metadata",
            title: "Metadata Preview",
            description: "Show migration impact and review-gate previews without copying private content or executing external actions.",
            completionPercent: 58,
            sourceDocument: "Migration Center"
          }
        ]
      },
      {
        id: "phase-05-parent-rollback-audit",
        title: "Rollback and Audit Review",
        description: "Make rollback strategy, review-depth records, and fingerprint-matched audit evidence mandatory before migration work can leave review-only mode.",
        completionPercent: 62,
        complexity: "high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-05-child-audit-summary",
            title: "Audit Summary Review",
            description: "Surface who, what, when, risk level, evidence fingerprint, apply-intent lock, and rollback path for every migration draft.",
            completionPercent: 60,
            sourceDocument: "Migration audit summary"
          },
          {
            id: "phase-05-child-review-depth",
            title: "Migration Review Depth",
            description: "Show apply-intent lock, local apply-review-staged audit proof, rollback evidence, fingerprint-matched audit consistency, sensitive exclusions, and profile activation lock as separate owner-review records.",
            completionPercent: 60,
            complexity: "high",
            sourceDocument: "Migration review gate"
          },
          {
            id: "phase-05-child-traceability",
            title: "Migration Traceability",
            description: "Link Phase 5 remaining-goal status, PM child rows, migration review depth evidence keys, draft/audit fingerprint coverage, sensitive exclusions, rollback/audit coverage, and the profile activation lock before apply review can advance.",
            completionPercent: 62,
            complexity: "high",
            sourceDocument: "Phase 5 migration traceability"
          },
          {
            id: "phase-05-child-blocker-priority",
            title: "Migration Blocker Priority",
            description: "Rank exact Phase 5 blockers across migration hardening, review-depth records, traceability, apply intent, rollback, fingerprint-matched audit, sensitive exclusions, and profile activation lock before apply review advances, while keeping remaining-goal and PM traceability repairs out of metadata-review actions.",
            completionPercent: 62,
            complexity: "medium",
            sourceDocument: "Phase 5 migration blocker priority"
          }
        ]
      }
    ]
  },
  {
    id: "phase-06-planning-lane",
    title: "Phase 6: Project and Program Planning Lane",
    description: "Make the Project Management lane a useful phase board, hierarchy planner, and staged Arena packet source; local PM staging remains ongoing while publishing is owner-held by the Phase 1/2/6 publish blocker.",
    status: "ongoing",
    completionPercent: 55,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-06-parent-phase-board",
        title: "Phase Board Hierarchy",
        description: "Represent every roadmap phase as an Epic with needed Parent and Child tasks.",
        status: "ongoing",
        completionPercent: 60,
        sourceDocument: "Project management lane",
        children: [
          {
            id: "phase-06-child-current-phase-map",
            title: "Load Current Phase Map",
            description: "Update the board with Phase 0 through Phase 11, current completion, and next actions.",
            status: "ongoing",
            completionPercent: 70,
            sourceDocument: "Phase completion map"
          },
          {
            id: "phase-06-child-saved-state-upgrade",
            title: "Upgrade Existing Saved Boards",
            description: "Ensure existing local Project Management state receives the current phase plan without malformed rows.",
            completionPercent: 45,
            sourceDocument: "Project management storage"
          }
        ]
      },
      {
        id: "phase-06-parent-arena-staging",
        title: "Arena Staging from PM Rows",
        description: "Let any phase, parent, or child stage a structured Arena review package with hierarchy context.",
        status: "ongoing",
        completionPercent: 55,
        sourceDocument: "Project management lane",
        children: [
          {
            id: "phase-06-child-run-context",
            title: "Staged Package Context",
            description: "Include selected task, descendants, parent context, completion, source, and risk in every PM run package.",
            status: "ongoing",
            completionPercent: 60,
            sourceDocument: "Arena dispatch package"
          },
          {
            id: "phase-06-child-publish-hold-traceability",
            title: "Publish Hold Traceability",
            description: "Link Phase 1 live proof, Phase 2 isolation proof, Phase 6 PM staging, required PM rows, and the owner-held publish blocker before pushing is considered.",
            completionPercent: 45,
            complexity: "medium",
            sourceDocument: "Phase 1/2/6 publish hold traceability"
          },
          {
            id: "phase-06-child-publish-hold-blocker-priority",
            title: "Publish Hold Blocker Priority",
            description: "Rank the owner/remote publish hold, one-panel proof, two-panel isolation, PM staging, and traceability blockers before owner push approval, while keeping publish-goal and PM-link repairs out of owner-review actions.",
            completionPercent: 65,
            complexity: "medium",
            sourceDocument: "Phase 1/2/6 publish hold blocker priority"
          }
        ]
      }
    ]
  },
  {
    id: "phase-07-dispatch-loop",
    title: "Phase 7: Orchestrator-Worker Dispatch",
    description: "Move from local dispatch previews to saved, reviewable orchestrator-worker handoff records with explicit dispatch review, handoff packet integrity, evidence freshness, and main integration ownership depth.",
    completionPercent: 64,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-07-parent-role-panels",
        title: "Role-Panel Dispatch Plan",
        description: "Define and record orchestrator, implementer, validator, and integration roles with clear attempt limits and ownership.",
        completionPercent: 58,
        complexity: "high",
        sourceDocument: "Dispatch role-panel plan",
        children: [
          {
            id: "phase-07-child-worker-preview",
            title: "Worker Preview Cards",
            description: "Show worker objective, files owned, validation plan, retry limit, role counts, handoff expectation, and local no-runtime boundary before launch.",
            completionPercent: 58,
            sourceDocument: "Dispatch controls"
          },
          {
            id: "phase-07-child-integration-owner",
            title: "Main Integration Ownership",
            description: "Keep final integration, validation, commit, push, reporting, and dispatch-review traceability owned by the main Arena path.",
            completionPercent: 58,
            sourceDocument: "Dispatch safety rules"
          },
          {
            id: "phase-07-child-integration-ownership-depth",
            title: "Integration Ownership Depth",
            description: "Show integration owner, final validation owner, commit/push/reporting owner, traceability links, and closure boundary as separate review rows.",
            completionPercent: 62,
            complexity: "high",
            sourceDocument: "Phase 7 integration ownership depth"
          }
        ]
      },
      {
        id: "phase-07-parent-observed-loop",
        title: "Observed Dispatch-to-Handoff Loop",
        description: "Record role-panel plan, attempts, validation gates, handoff tasks, packet integrity, evidence freshness, closure, and final merge review in one trace.",
        completionPercent: 62,
        complexity: "extra_high",
        sourceDocument: "Orchestrator-worker dispatch",
        children: [
          {
            id: "phase-07-child-handoff-trace",
            title: "Handoff Trace",
            description: "Show what each worker is expected to own, validate, retry, depend on, and hand back without polluting the main context.",
            completionPercent: 58,
            complexity: "high",
            sourceDocument: "Worker handoff"
          },
          {
            id: "phase-07-child-review-depth",
            title: "Dispatch Review Depth",
            description: "Audit visible role counts, max attempt limits, handoff task depth, per-role handoff packet integrity, current evidence fingerprint freshness, validation gate depth, and the no-live-worker execution lock for staged PM Run outputs.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Dispatch review records"
          },
          {
            id: "phase-07-child-traceability",
            title: "Dispatch Traceability",
            description: "Link Phase 7 remaining-goal status, PM child rows, dispatch review depth, evidence freshness, integration ownership depth, and live-worker locks before any worker spawning can be trusted.",
            completionPercent: 62,
            complexity: "high",
            sourceDocument: "Phase 7 dispatch traceability"
          },
          {
            id: "phase-07-child-blocker-priority",
            title: "Dispatch Blocker Priority",
            description: "Rank exact Phase 7 blockers across role coverage, attempt limits, handoff tasks, handoff packet integrity, evidence freshness, validation gates, integration ownership, traceability, closure boundaries, and live-worker locks before dispatch can expand, while keeping remaining-goal and PM traceability repairs out of dispatch-review actions.",
            completionPercent: 62,
            complexity: "medium",
            sourceDocument: "Phase 7 dispatch blocker priority"
          }
        ]
      }
    ]
  },
  {
    id: "phase-08-permissions-audit",
    title: "Phase 8: Permissions and Audit",
    description: "Harden risk gates, audit trails, permission boundaries, risk exceptions, disabled-path explanations, current owner audit-review fingerprints, and record-specific rollback evidence before mutation-capable paths expand.",
    completionPercent: 65,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-08-parent-risk-gates",
        title: "Risk Gate Hardening",
        description: "Require explicit permission state, action risk, approval scope, fallback behavior, risk exceptions, disabled paths, owner review freshness, and missing-requirement explanations for risky actions.",
        completionPercent: 64,
        complexity: "high",
        sourceDocument: "Permission risk gates",
        children: [
          {
            id: "phase-08-child-permission-labels",
            title: "Permission State Labels",
            description: "Display unavailable, preview-only, approval-required, ready, waiting, review, and blocked states consistently across surfaces.",
            completionPercent: 50,
            sourceDocument: "Runtime profile permissions"
          },
          {
            id: "phase-08-child-risk-blockers",
            title: "Risk Blocker Explanations",
            description: "Explain why an action is blocked and what permission, approval, evidence, or rollback requirement is needed to continue.",
            completionPercent: 45,
            sourceDocument: "Permission audit"
          },
          {
            id: "phase-08-child-risk-exceptions",
            title: "Risk Exceptions and Disabled Paths",
            description: "Show each permission, approval, evidence, owner-review, and rollback exception with disabled-path copy, required evidence, rollback expectation, record-specific rollback review, and audit source.",
            completionPercent: 58,
            complexity: "high",
            sourceDocument: "Phase 8 risk exception register"
          },
          {
            id: "phase-08-child-traceability",
            title: "Risk Traceability",
            description: "Link Phase 8 remaining-goal status, PM child rows, permission/audit depth records, local owner audit-review records, current audit evidence fingerprints, risk exceptions, disabled paths, evidence keys, and rollback expectations before mutation-capable paths can advance.",
            completionPercent: 52,
            complexity: "high",
            sourceDocument: "Phase 8 risk traceability"
          },
          {
            id: "phase-08-child-blocker-priority",
            title: "Risk Blocker Priority",
            description: "Rank exact Phase 8 blockers across permission, approval, evidence, audit persistence, owner-review freshness, record-specific rollback, disabled paths, exceptions, and traceability before mutation-capable paths can advance, while keeping remaining-goal and PM traceability repairs out of audit-review actions.",
            completionPercent: 62,
            complexity: "medium",
            sourceDocument: "Phase 8 risk blocker priority"
          }
        ]
      },
      {
        id: "phase-08-parent-audit-log",
        title: "Owner-Visible Audit Trail",
        description: "Record attempted actions, owner audit reviews, approvals, blocked states, validation outcomes, record-specific rollback reviews, and audit persistence depth.",
        completionPercent: 56,
        complexity: "high",
        sourceDocument: "Audit requirements",
        children: [
          {
            id: "phase-08-child-audit-persistence",
            title: "Audit Persistence",
            description: "Persist audit entries and owner audit-review records locally while keeping malformed or stale audit state from hiding permission, evidence, mutation-lock, fingerprint, or rollback blockers.",
            completionPercent: 58,
            complexity: "high",
            sourceDocument: "Audit storage"
          }
        ]
      }
    ]
  },
  {
    id: "phase-09-desktop-runner",
    title: "Phase 9: Desktop-Backed Runner",
    description: "Enable the fixed terminal read-only desktop probe after permission, preview, audit, validation, persisted runner-review, current runner evidence fingerprint, complete Phase 8 owner-review proof, rollback, Phase 9 request gate, and trusted Phase 9 traceability/current active goal gates pass.",
    completionPercent: 64,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-09-parent-runner-probe",
        title: "Runner Probe Hardening",
        description: "Keep the desktop runner limited to the fixed terminal-readonly-probe with visible request preview, Phase 9 approval checks, fingerprint-matched local runner-review evidence, and mutation locks.",
        completionPercent: 62,
        complexity: "high",
        sourceDocument: "Desktop runner probe",
        children: [
          {
            id: "phase-09-child-reversible-action",
            title: "Choose One Reversible Action",
            description: "Use terminal-readonly-probe as the single selected read-only action, with the visible Probe control disabled until the Phase 9 request gate and trusted Phase 9 traceability/current active goal proof are ready.",
            completionPercent: 54,
            complexity: "high",
            sourceDocument: "Runner approval plan"
          },
          {
            id: "phase-09-child-runner-observability",
            title: "Runner Observability",
            description: "Show request readiness, approval window, validation output, audit count, local runner-review evidence, current runner evidence fingerprint, rollback evidence, direct-handler blocks, and final state for the selected probe.",
            completionPercent: 62,
            complexity: "high",
            sourceDocument: "Live action runner"
          },
          {
            id: "phase-09-child-traceability",
            title: "Runner Traceability",
            description: "Link Phase 9 remaining-goal status, current active goal trust, PM child rows, complete Phase 8 owner audit review proof, runner approval depth, local runner-review records, current runner evidence fingerprints, Phase 9 request gate evidence, evidence keys, and mutation locks before the desktop runner can advance.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Phase 9 runner traceability"
          },
          {
            id: "phase-09-child-blocker-priority",
            title: "Runner Blocker Priority",
            description: "Rank exact Phase 9 blockers across the Phase 8 gate, owner permission, approval window, request preview, validation output, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, request-gate enforcement, traceability, and mutation locks while separating owner-action blockers from runner-review-addressable blockers before the desktop runner can advance.",
            completionPercent: 64,
            complexity: "medium",
            sourceDocument: "Phase 9 runner blocker priority"
          }
        ]
      },
      {
        id: "phase-09-parent-approval-flow",
        title: "Approval and Rollback Flow",
        description: "Require owner approval, request preview, validation result, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, and Phase 9 request-gate enforcement before runner expansion.",
        completionPercent: 64,
        complexity: "extra_high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-09-child-approval-record",
            title: "Approval Record",
            description: "Record terminal request, approval, Phase 9 held blocks, fallback, failure, execution, local runner-review fingerprints, and rollback-safe evidence in the owner-visible audit path.",
            completionPercent: 64,
            sourceDocument: "Audit trail"
          },
          {
            id: "phase-09-child-approval-depth",
            title: "Runner Approval Depth",
            description: "Show fixed probe selection, owner approval, request preview, validation output, audit record, local runner-review record, current runner evidence fingerprint, rollback evidence, Phase 9 request-gate enforcement, and the desktop execution lock as separate depth records.",
            completionPercent: 66,
            complexity: "high",
            sourceDocument: "Phase 9 runner approval depth"
          }
        ]
      }
    ]
  },
  {
    id: "phase-10-adaptive-arena",
    title: "Phase 10: Adaptive Magnetic Arena",
    description: "Polish adaptive Arena layout regression, evaluate a FlexLayout-backed docking spike, density, keyboard controls, focus state, terminology, and acceptance gates.",
    completionPercent: 57,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-10-parent-layout-foundation",
        title: "Adaptive Layout Foundation",
        description: "Keep drag, drop, keyboard adjustment, saved-state repair, project stack drop, panel capacity rules, and the FlexLayout docking feasibility spike visible in Phase 10 readiness.",
        completionPercent: 62,
        sourceDocument: "Adaptive Arena layout",
        children: [
          {
            id: "phase-10-child-layout-regression",
            title: "Layout Regression Pass",
            description: "Verify adaptive panel move, resize, hide, reveal, reset, drop preview, saved-state repair, and acceptance gates.",
            completionPercent: 55,
            sourceDocument: "Adaptive layout tests"
          },
          {
            id: "phase-10-child-density-polish",
            title: "Density and Readability Polish",
            description: "Tune dense operational views so controls, labels, Phase readiness panels, and evidence rows remain scannable.",
            completionPercent: 55,
            sourceDocument: "Product UI polish"
          },
          {
            id: "phase-10-child-flexlayout-spike",
            title: "FlexLayout Docking Spike",
            description: "Evaluate caplin/FlexLayout as an MIT-licensed React docking layout option for Arena tabsets, splitters, saved layout JSON, and dockable panels before replacing custom adaptive-grid behavior.",
            completionPercent: 35,
            complexity: "medium",
            sourceDocument: "caplin/FlexLayout MIT license review"
          }
        ]
      },
      {
        id: "phase-10-parent-arena-identity",
        title: "Arena Product Identity",
        description: "Keep Arena language consistent across user-facing docs, UI labels, milestone text, and Phase 10 readiness checks.",
        status: "ongoing",
        completionPercent: 55,
        complexity: "low",
        sourceDocument: "Arena rename",
        children: [
          {
            id: "phase-10-child-term-scan",
            title: "Terminology Scan",
            description: "Prevent old public vocabulary from returning while preserving backward-compatible internal keys and public-safe scan reporting.",
            completionPercent: 55,
            complexity: "low",
            sourceDocument: "Arena rename validation"
          },
          {
            id: "phase-10-child-traceability",
            title: "Arena Polish Traceability",
            description: "Link Phase 10 remaining-goal status, PM child rows, layout regression, density, keyboard, focus, terminology, and acceptance gates before release packaging can resume.",
            completionPercent: 55,
            complexity: "medium",
            sourceDocument: "Phase 10 Arena polish traceability"
          },
          {
            id: "phase-10-child-blocker-priority",
            title: "Arena Polish Blocker Priority",
            description: "Rank exact Phase 10 blockers across layout regression, density, keyboard controls, focus state, terminology, acceptance gates, PM coverage, and traceability before packaging resumes.",
            completionPercent: 35,
            complexity: "medium",
            sourceDocument: "Phase 10 Arena polish blocker priority"
          }
        ]
      }
    ]
  },
  {
    id: "phase-11-owner-packaging",
    title: "Phase 11: Owner Testing and Release Readiness",
    description: "Prepare owner-facing pass/fail command gates, proof-freshness depth, structured evidence records, fresh checkout instructions, packaging locks, known-limit review, final security closure capability, and release-decision proof.",
    completionPercent: 61,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-11-parent-owner-testing",
        title: "Owner Testing Flow",
        description: "Turn owner testing actions into one command-center pass/fail path for proof freshness depth, blockers, phase readiness, evidence records, and next action.",
        completionPercent: 64,
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-11-child-owner-checklist",
            title: "Owner Checklist",
            description: "Show checklist coverage, proof freshness depth, blockers, phase readiness, next action, and safety boundaries in the Phase 11 command center.",
            completionPercent: 58,
            sourceDocument: "Owner testing docs"
          },
          {
            id: "phase-11-child-proof-freshness-depth",
            title: "Proof Freshness Depth",
            description: "Break owner proof freshness into Phase 1/2/6 proof, Phase 3 clearance, desktop smoke, command-plan, CLI validation, proof-export, and handoff proof rows before release readiness.",
            completionPercent: 52,
            complexity: "high",
            sourceDocument: "Phase 11 proof freshness depth"
          },
          {
            id: "phase-11-child-evidence-records",
            title: "Structured Evidence Records",
            description: "Represent fresh checkout, clean checkout, build/test, and docs/known-limits proof as source/timestamp/detail records with missing, stale, malformed, waiting, review, blocked, and ready states.",
            completionPercent: 64,
            complexity: "high",
            sourceDocument: "Phase 11 evidence records"
          },
          {
            id: "phase-11-child-fresh-checkout",
            title: "Fresh Checkout Install Run",
            description: "Track fresh-checkout install, test, build, desktop run, and expected proof-panel evidence as a held release gate.",
            completionPercent: 58,
            complexity: "high",
            sourceDocument: "Packaging checklist"
          }
        ]
      },
      {
        id: "phase-11-parent-release-packaging",
        title: "Release Readiness Gate",
        description: "Keep fresh checkout, clean checkout, build/test, smoke proof with Phase 3 proof-export detail, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, packaging lock, docs, known limits, evidence records, visible Security 100% final closure guidance, and release-decision top-prerequisite detail visible while packaging stays paused.",
        completionPercent: 59,
        complexity: "high",
        sourceDocument: "Phase 11 release readiness",
        children: [
          {
            id: "phase-11-child-package-validation",
            title: "Package Lock Validation",
            description: "Validate packaged-app prerequisites, fresh-checkout proof, proof persistence, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, evidence-record inputs, visible Security 100% final closure guidance, local storage repair, safety-disabled live actions, and release holds without executing packaging.",
            completionPercent: 56,
            complexity: "high",
            sourceDocument: "Release validation"
          },
          {
            id: "phase-11-child-traceability",
            title: "Owner Release Traceability",
            description: "Link Owner Testing command gates, proof freshness depth, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, current non-ready proof freshness row actions for handoff/proof-export review, evidence records, release readiness, visible Security 100% final closure guidance, required PM rows, and packaging holds before release review can be trusted.",
            completionPercent: 48,
            complexity: "high",
            sourceDocument: "Phase 11 owner release traceability"
          },
          {
            id: "phase-11-child-blocker-priority",
            title: "Owner Release Blocker Priority",
            description: "Rank exact Phase 11 blockers across owner proof, evidence freshness, fresh-checkout release readiness, visible Security 100% final closure guidance, PM coverage, and packaging hold state before packaging resumes, while keeping goal, PM, and Phase 3 trace repairs out of owner-review actions.",
            completionPercent: 62,
            complexity: "medium",
            sourceDocument: "Phase 11 owner release blocker priority"
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
