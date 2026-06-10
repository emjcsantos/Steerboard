import type {
  ProjectManagementTask,
  ProjectManagementTaskComplexity,
  ProjectManagementTaskStatus
} from "./projectManagementHierarchy";

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
    description: "Prove one Arena chat panel can run against the desktop-backed session path with honest owner-visible evidence.",
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
    description: "Verify multiple Arena panels can run independently without cross-talk in identity, stream, or control state.",
    status: "ongoing",
    completionPercent: 55,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-02-parent-panel-identity",
        title: "Panel Identity Isolation",
        description: "Keep each panel's session id, role, branch, runtime, stream, and transcript scoped to that panel.",
        status: "ongoing",
        completionPercent: 60,
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
    description: "Clear the current blocker by proving slash execution, session controls, and desktop proof persistence.",
    status: "ongoing",
    completionPercent: 70,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-03-parent-proof-clearance",
        title: "Desktop Proof Clearance",
        description: "Run the real desktop gate actions and prove the owner-visible rows persist after reload.",
        status: "ongoing",
        completionPercent: 70,
        complexity: "extra_high",
        sourceDocument: "Current state and pipeline",
        children: [
          {
            id: "phase-03-child-smoke-rows",
            title: "Persist Smoke Proof Rows",
            description: "Confirm desktop-executed smoke proof rows survive reload and browser fallback rows remain waiting.",
            completionPercent: 65,
            complexity: "high",
            sourceDocument: "Phase 3 smoke proof readiness"
          },
          {
            id: "phase-03-child-exit-gate",
            title: "Expose Exact Exit Blocker",
            description: "If Phase 3 cannot exit, show the exact remaining blocker instead of a vague incomplete state.",
            completionPercent: 65,
            sourceDocument: "Phase 3 exit gate evidence"
          }
        ]
      },
      {
        id: "phase-03-parent-slash-controls",
        title: "Slash and Session Control Readiness",
        description: "Verify slash execution plus interrupt, retry, steer, fork, resume, and archive readiness evidence.",
        status: "ongoing",
        completionPercent: 70,
        complexity: "high",
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-03-child-slash-ready",
            title: "Slash Evidence Reaches Ready",
            description: "Run panel-scoped slash command evidence and persist ready or blocked states honestly.",
            completionPercent: 70,
            sourceDocument: "Slash execution evidence"
          },
          {
            id: "phase-03-child-control-ready",
            title: "Session Controls Reach Ready",
            description: "Validate interrupt, retry, steer, fork, resume, and archive control evidence before Phase 3 exits.",
            completionPercent: 70,
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
    description: "Expand command, skill, plugin, MCP, automation, and personalization surfaces after Phase 3 clears.",
    completionPercent: 10,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-04-parent-catalogs",
        title: "Provider Catalog Surfaces",
        description: "Render provider catalogs as metadata-first surfaces with clear readiness and safety labels.",
        completionPercent: 15,
        complexity: "high",
        sourceDocument: "Live platform capabilities",
        children: [
          {
            id: "phase-04-child-command-skill",
            title: "Command and Skill Catalogs",
            description: "Show command and skill entries with scope, fallback guidance, and owner-safe invocation status.",
            completionPercent: 20,
            sourceDocument: "Command and skill catalogs"
          },
          {
            id: "phase-04-child-plugin-mcp",
            title: "Plugin and MCP Catalogs",
            description: "Show plugin and MCP entries with connection state, allowed surfaces, and non-mutating refresh evidence.",
            completionPercent: 10,
            complexity: "high",
            sourceDocument: "Plugin and MCP catalogs"
          }
        ]
      },
      {
        id: "phase-04-parent-refresh-safety",
        title: "Metadata-Only Refresh Safety",
        description: "Keep refresh paths read-only until provider permissions and approval gates are explicit.",
        completionPercent: 10,
        complexity: "high",
        sourceDocument: "Provider catalog safety",
        children: [
          {
            id: "phase-04-child-refresh-smoke",
            title: "All-Catalog Refresh Smoke",
            description: "Refresh catalog status without running commands, tools, automations, or mutations.",
            completionPercent: 15,
            sourceDocument: "Catalog refresh owner validation"
          }
        ]
      }
    ]
  },
  {
    id: "phase-05-migration-center",
    title: "Phase 5: Migration Center",
    description: "Turn the metadata-only migration foundations into a guarded, review-first migration workflow.",
    completionPercent: 35,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-05-parent-draft-workflow",
        title: "Migration Draft Workflow",
        description: "Create, persist, preview, and revise migration profile drafts before any mutation-capable action.",
        completionPercent: 40,
        complexity: "high",
        sourceDocument: "Migration Center",
        children: [
          {
            id: "phase-05-child-profile-drafts",
            title: "Profile Draft Persistence",
            description: "Persist migration profiles, history, rollback notes, and audit summaries locally.",
            completionPercent: 45,
            sourceDocument: "Migration model"
          },
          {
            id: "phase-05-child-preview-metadata",
            title: "Metadata Preview",
            description: "Show migration impact previews without copying private content or executing external actions.",
            completionPercent: 35,
            sourceDocument: "Migration Center"
          }
        ]
      },
      {
        id: "phase-05-parent-rollback-audit",
        title: "Rollback and Audit Review",
        description: "Make rollback strategy and audit evidence mandatory before migration work can leave preview mode.",
        completionPercent: 30,
        complexity: "high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-05-child-audit-summary",
            title: "Audit Summary Review",
            description: "Surface who, what, when, risk level, and rollback path for every migration draft.",
            completionPercent: 30,
            sourceDocument: "Migration audit summary"
          }
        ]
      }
    ]
  },
  {
    id: "phase-06-planning-lane",
    title: "Phase 6: Project and Program Planning Lane",
    description: "Make the Project Management lane a useful phase board, hierarchy planner, and staged Arena packet source.",
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
          }
        ]
      }
    ]
  },
  {
    id: "phase-07-dispatch-loop",
    title: "Phase 7: Orchestrator-Worker Dispatch",
    description: "Move from local dispatch previews to an observed, reviewable orchestrator-worker handoff loop.",
    completionPercent: 25,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-07-parent-role-panels",
        title: "Role-Panel Dispatch Plan",
        description: "Define orchestrator, implementer, validator, and integration roles with clear attempt limits and ownership.",
        completionPercent: 30,
        complexity: "high",
        sourceDocument: "Dispatch role-panel plan",
        children: [
          {
            id: "phase-07-child-worker-preview",
            title: "Worker Preview Cards",
            description: "Show worker objective, files owned, validation plan, retry limit, and handoff expectation before launch.",
            completionPercent: 30,
            sourceDocument: "Dispatch controls"
          },
          {
            id: "phase-07-child-integration-owner",
            title: "Main Integration Ownership",
            description: "Keep final integration, validation, commit, push, and reporting owned by the main Arena path.",
            completionPercent: 25,
            sourceDocument: "Dispatch safety rules"
          }
        ]
      },
      {
        id: "phase-07-parent-observed-loop",
        title: "Observed Dispatch-to-Handoff Loop",
        description: "Record worker launch, attempts, validation, handoff, closure, and final merge review in one trace.",
        completionPercent: 20,
        complexity: "extra_high",
        sourceDocument: "Orchestrator-worker dispatch",
        children: [
          {
            id: "phase-07-child-handoff-trace",
            title: "Handoff Trace",
            description: "Show what each worker changed, validated, retried, and handed back without polluting the main context.",
            completionPercent: 20,
            complexity: "high",
            sourceDocument: "Worker handoff"
          }
        ]
      }
    ]
  },
  {
    id: "phase-08-permissions-audit",
    title: "Phase 8: Permissions and Audit",
    description: "Harden risk gates, audit trails, and permission boundaries before mutation-capable paths expand.",
    completionPercent: 30,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-08-parent-risk-gates",
        title: "Risk Gate Hardening",
        description: "Require explicit permission state, action risk, approval scope, and fallback behavior for risky actions.",
        completionPercent: 35,
        complexity: "high",
        sourceDocument: "Permission risk gates",
        children: [
          {
            id: "phase-08-child-permission-labels",
            title: "Permission State Labels",
            description: "Display unavailable, preview-only, approval-required, and ready states consistently across surfaces.",
            completionPercent: 35,
            sourceDocument: "Runtime profile permissions"
          },
          {
            id: "phase-08-child-risk-blockers",
            title: "Risk Blocker Explanations",
            description: "Explain why an action is blocked and what evidence or approval is needed to continue.",
            completionPercent: 30,
            sourceDocument: "Permission audit"
          }
        ]
      },
      {
        id: "phase-08-parent-audit-log",
        title: "Owner-Visible Audit Trail",
        description: "Record attempted actions, approvals, blocked states, validation outcomes, and rollback notes.",
        completionPercent: 25,
        complexity: "high",
        sourceDocument: "Audit requirements",
        children: [
          {
            id: "phase-08-child-audit-persistence",
            title: "Audit Persistence",
            description: "Persist audit entries locally and keep malformed audit state from hiding important risk evidence.",
            completionPercent: 25,
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
    description: "Enable one reversible approved action from the desktop-backed runner after permissions and proof gates pass.",
    completionPercent: 20,
    complexity: "extra_high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-09-parent-runner-probe",
        title: "Runner Probe Hardening",
        description: "Keep the live action runner probe limited, reversible, observable, and blocked by approval gates.",
        completionPercent: 25,
        complexity: "high",
        sourceDocument: "Desktop runner probe",
        children: [
          {
            id: "phase-09-child-reversible-action",
            title: "Choose One Reversible Action",
            description: "Select a low-risk action with a clear rollback path and no external irreversible side effect.",
            completionPercent: 20,
            complexity: "high",
            sourceDocument: "Runner approval plan"
          },
          {
            id: "phase-09-child-runner-observability",
            title: "Runner Observability",
            description: "Show command, permission, output, validation, rollback, and final state for the approved action.",
            completionPercent: 20,
            complexity: "high",
            sourceDocument: "Live action runner"
          }
        ]
      },
      {
        id: "phase-09-parent-approval-flow",
        title: "Approval and Rollback Flow",
        description: "Require owner approval, action preview, validation plan, and rollback note before runner execution.",
        completionPercent: 15,
        complexity: "extra_high",
        sourceDocument: "Permissions and audit",
        children: [
          {
            id: "phase-09-child-approval-record",
            title: "Approval Record",
            description: "Record the approval decision, scope, validation result, and rollback outcome in the audit trail.",
            completionPercent: 15,
            sourceDocument: "Audit trail"
          }
        ]
      }
    ]
  },
  {
    id: "phase-10-adaptive-arena",
    title: "Phase 10: Adaptive Magnetic Arena",
    description: "Polish the adaptive Arena layout after the core live workflow and safety gates are proven.",
    completionPercent: 40,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-10-parent-layout-foundation",
        title: "Adaptive Layout Foundation",
        description: "Keep drag, drop, keyboard adjustment, project stack drop, and panel capacity rules reliable.",
        completionPercent: 45,
        sourceDocument: "Adaptive Arena layout",
        children: [
          {
            id: "phase-10-child-layout-regression",
            title: "Layout Regression Pass",
            description: "Verify panel resizing, drop previews, focus state, and keyboard controls across common viewport sizes.",
            completionPercent: 40,
            sourceDocument: "Adaptive layout tests"
          },
          {
            id: "phase-10-child-density-polish",
            title: "Density and Readability Polish",
            description: "Tune dense operational views so controls, labels, and evidence panels remain scannable.",
            completionPercent: 35,
            sourceDocument: "Product UI polish"
          }
        ]
      },
      {
        id: "phase-10-parent-arena-identity",
        title: "Arena Product Identity",
        description: "Keep the renamed Arena language consistent across user-facing docs, UI labels, and milestone text.",
        status: "ongoing",
        completionPercent: 45,
        complexity: "low",
        sourceDocument: "Arena rename",
        children: [
          {
            id: "phase-10-child-term-scan",
            title: "Terminology Scan",
            description: "Prevent old public vocabulary from returning while preserving backward-compatible internal keys.",
            completionPercent: 45,
            complexity: "low",
            sourceDocument: "Arena rename validation"
          }
        ]
      }
    ]
  },
  {
    id: "phase-11-owner-packaging",
    title: "Phase 11: Owner Testing and Packaging",
    description: "Prepare owner-facing test flows, fresh checkout instructions, desktop packaging, and release proof.",
    completionPercent: 30,
    complexity: "high",
    sourceDocument: "Phase completion map",
    parents: [
      {
        id: "phase-11-parent-owner-testing",
        title: "Owner Testing Flow",
        description: "Turn owner testing actions into a clear pass/fail path for desktop proof, controls, and PM staging.",
        completionPercent: 35,
        sourceDocument: "Owner testing panel",
        children: [
          {
            id: "phase-11-child-owner-checklist",
            title: "Owner Checklist",
            description: "Document the exact owner steps to run, verify, reload, and interpret every critical proof row.",
            completionPercent: 35,
            sourceDocument: "Owner testing docs"
          },
          {
            id: "phase-11-child-fresh-checkout",
            title: "Fresh Checkout Install Run",
            description: "Verify a clean checkout can install, test, build, run desktop mode, and surface expected proof panels.",
            completionPercent: 25,
            complexity: "high",
            sourceDocument: "Packaging checklist"
          }
        ]
      },
      {
        id: "phase-11-parent-release-packaging",
        title: "Desktop Packaging",
        description: "Prepare packaged desktop build notes, validation evidence, known limits, and rollout checklist.",
        completionPercent: 25,
        complexity: "high",
        sourceDocument: "Desktop packaging",
        children: [
          {
            id: "phase-11-child-package-validation",
            title: "Package Validation",
            description: "Validate packaged app startup, proof persistence, local storage repair, and safety-disabled live actions.",
            completionPercent: 25,
            complexity: "high",
            sourceDocument: "Release validation"
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
