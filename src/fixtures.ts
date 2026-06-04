import type { CockpitMode } from "./layout";
import type { OrchestrationTask } from "./orchestration";
import type { PlanningDraft } from "./planning";
import type { RegistryEntry } from "./registry";
import type { RuntimeAdapter } from "./runtime";

export type SessionState =
  | "idle"
  | "planning"
  | "implementing"
  | "validating"
  | "blocked"
  | "failed"
  | "complete";

export type SessionRole = "orchestrator" | "implementer" | "validator" | "integration";

export interface ProjectSummary {
  id: string;
  name: string;
  status: "active" | "queued" | "blocked";
  updated: string;
  runs: number;
}

export interface SessionSummary {
  id: string;
  projectId: string;
  title: string;
  role: SessionRole;
  state: SessionState;
  branch: string;
  runtime: string;
  attempt: number;
  validation: string;
  files: string[];
  transcript: string[];
  tools: string[];
}

export interface PipelineItem {
  id: string;
  projectId: string;
  title: string;
  stage: "planned" | "ready" | "running" | "validating" | "accepted";
  owner: string;
  risk: "low" | "medium" | "high";
  readiness: number;
}

export interface CockpitPreset {
  mode: CockpitMode;
  label: string;
  description: string;
  sessionIds: string[];
}

export interface PermissionSurface {
  id: string;
  label: string;
  status: "enabled" | "review" | "disabled";
  detail: string;
}

export const projects: ProjectSummary[] = [
  { id: "website-refresh", name: "Website Refresh", status: "active", updated: "8m", runs: 4 },
  { id: "billing-workflow", name: "Billing Workflow", status: "active", updated: "19m", runs: 3 },
  { id: "developer-tooling", name: "Developer Tooling", status: "queued", updated: "42m", runs: 2 },
  { id: "mobile-prototype", name: "Mobile App Prototype", status: "blocked", updated: "1h", runs: 1 }
];

export const sessions: SessionSummary[] = [
  {
    id: "run-plan",
    projectId: "website-refresh",
    title: "Refresh Launch Plan",
    role: "orchestrator",
    state: "planning",
    branch: "product/refresh-plan",
    runtime: "Local Runtime A",
    attempt: 1,
    validation: "Scope split ready",
    files: ["docs/brief.md", "src/app/routes.ts"],
    transcript: [
      "Defined release lanes and acceptance gates.",
      "Split implementation into layout, content, and validation tasks.",
      "Waiting for worker readiness confirmation."
    ],
    tools: ["Plan", "Task Split", "Readiness"]
  },
  {
    id: "worker-layout",
    projectId: "website-refresh",
    title: "Landing Layout",
    role: "implementer",
    state: "implementing",
    branch: "work/layout-shell",
    runtime: "Worker Profile 1",
    attempt: 2,
    validation: "Pending visual check",
    files: ["src/components/Shell.tsx", "src/styles/layout.css"],
    transcript: [
      "Created responsive shell with stable side rail.",
      "Adjusted pane spacing for narrow desktop windows.",
      "Preparing component test run."
    ],
    tools: ["Edit", "Build", "Test"]
  },
  {
    id: "worker-validation",
    projectId: "website-refresh",
    title: "Validation Pass",
    role: "validator",
    state: "validating",
    branch: "check/layout-shell",
    runtime: "Worker Profile 2",
    attempt: 1,
    validation: "3 checks running",
    files: ["tests/layout.spec.ts", "reports/visual.md"],
    transcript: [
      "Running layout assertions for 1x1, 2x1, and 3x3.",
      "Checking long status labels for overflow.",
      "Collecting evidence for final integration."
    ],
    tools: ["Lint", "Unit", "Visual"]
  },
  {
    id: "integration",
    projectId: "website-refresh",
    title: "Integration Queue",
    role: "integration",
    state: "idle",
    branch: "main",
    runtime: "Main Workspace",
    attempt: 0,
    validation: "Waiting for accepted tasks",
    files: ["CHANGELOG.md", "package.json"],
    transcript: [
      "No accepted worker output yet.",
      "Integration remains gated by validation evidence."
    ],
    tools: ["Git", "Review", "Report"]
  },
  {
    id: "billing-api",
    projectId: "billing-workflow",
    title: "Billing API Contract",
    role: "implementer",
    state: "blocked",
    branch: "work/billing-contract",
    runtime: "Worker Profile 1",
    attempt: 3,
    validation: "Blocked on field mapping",
    files: ["src/api/billing.ts", "src/types/invoice.ts"],
    transcript: [
      "Field mapping is incomplete for adjustment reason.",
      "Returned to orchestrator after three attempts."
    ],
    tools: ["Edit", "Schema", "Stop"]
  },
  {
    id: "tooling-smoke",
    projectId: "developer-tooling",
    title: "Tooling Smoke Test",
    role: "validator",
    state: "complete",
    branch: "check/tooling",
    runtime: "Worker Profile 3",
    attempt: 1,
    validation: "Passed",
    files: ["tests/tooling.spec.ts"],
    transcript: [
      "Install path passes with clean fixture project.",
      "Build and test commands returned success."
    ],
    tools: ["Install", "Build", "Test"]
  }
];

export const pipelineItems: PipelineItem[] = [
  {
    id: "pipe-1",
    projectId: "website-refresh",
    title: "Define workspace registry",
    stage: "ready",
    owner: "Planning",
    risk: "medium",
    readiness: 92
  },
  {
    id: "pipe-2",
    projectId: "website-refresh",
    title: "Render cockpit shell",
    stage: "running",
    owner: "UI",
    risk: "medium",
    readiness: 100
  },
  {
    id: "pipe-3",
    projectId: "website-refresh",
    title: "Add runtime adapter mock",
    stage: "planned",
    owner: "Runtime",
    risk: "high",
    readiness: 54
  },
  {
    id: "pipe-4",
    projectId: "website-refresh",
    title: "Validate grid bounds",
    stage: "validating",
    owner: "Quality",
    risk: "low",
    readiness: 100
  },
  {
    id: "pipe-5",
    projectId: "billing-workflow",
    title: "Confirm invoice state map",
    stage: "ready",
    owner: "Planning",
    risk: "medium",
    readiness: 84
  },
  {
    id: "pipe-6",
    projectId: "developer-tooling",
    title: "Review install command path",
    stage: "accepted",
    owner: "Quality",
    risk: "low",
    readiness: 100
  }
];

export const registryEntries: RegistryEntry[] = [
  {
    projectId: "website-refresh",
    projectName: "Website Refresh",
    status: "active",
    workspaceLabel: "Marketing workspace",
    runtimeState: "ready",
    permissionState: "allowed",
    readiness: 92
  },
  {
    projectId: "billing-workflow",
    projectName: "Billing Workflow",
    status: "active",
    workspaceLabel: "Operations workspace",
    runtimeState: "starting",
    permissionState: "review",
    readiness: 84
  },
  {
    projectId: "developer-tooling",
    projectName: "Developer Tooling",
    status: "queued",
    workspaceLabel: "Internal tooling workspace",
    runtimeState: "stopped",
    permissionState: "review",
    readiness: 68
  },
  {
    projectId: "mobile-prototype",
    projectName: "Mobile App Prototype",
    status: "blocked",
    workspaceLabel: "Product design workspace",
    runtimeState: "error",
    permissionState: "blocked",
    readiness: 31
  }
];

export const runtimeAdapters: RuntimeAdapter[] = [
  {
    id: "website-refresh",
    label: "Local runtime",
    state: "ready",
    readiness: 92,
    transport: "mock-local-transport",
    capabilities: ["Session stream", "Task state", "Validation evidence", "Tool call summary"],
    requiredPermissions: ["workspace_read", "workspace_write", "process"],
    permissions: [
      { permission: "workspace_read", status: "enabled" },
      { permission: "workspace_write", status: "review" },
      { permission: "process", status: "enabled" },
      { permission: "network", status: "disabled" }
    ]
  },
  {
    id: "billing-workflow",
    label: "Local runtime",
    state: "limited",
    readiness: 72,
    transport: "mock-local-transport",
    capabilities: ["Session stream", "Task state", "Validation evidence"],
    requiredPermissions: ["workspace_read", "workspace_write", "process"],
    permissions: [
      { permission: "workspace_read", status: "enabled" },
      { permission: "workspace_write", status: "review" },
      { permission: "process", status: "review" },
      { permission: "network", status: "disabled" }
    ]
  },
  {
    id: "developer-tooling",
    label: "Local runtime",
    state: "not_configured",
    readiness: 0,
    transport: "mock-local-transport",
    capabilities: ["Session stream", "Task state"],
    requiredPermissions: ["workspace_read", "process"],
    permissions: [
      { permission: "workspace_read", status: "review" },
      { permission: "workspace_write", status: "disabled" },
      { permission: "process", status: "disabled" },
      { permission: "network", status: "disabled" }
    ]
  },
  {
    id: "mobile-prototype",
    label: "Local runtime",
    state: "blocked",
    readiness: 31,
    transport: "mock-local-transport",
    capabilities: ["Session stream", "Task state", "Validation evidence"],
    requiredPermissions: ["workspace_read", "workspace_write", "process"],
    permissions: [
      { permission: "workspace_read", status: "enabled" },
      { permission: "workspace_write", status: "disabled" },
      { permission: "process", status: "disabled" },
      { permission: "network", status: "disabled" }
    ]
  }
];

export const planningDrafts: PlanningDraft[] = [
  {
    title: "Prepare launch checklist",
    objective: "Create a scoped checklist before dispatching the next website refresh task.",
    targetProjectId: "website-refresh",
    scope: ["Confirm page inventory", "Identify files likely affected", "Define validation evidence"],
    fileAreas: ["src/routes", "src/components", "docs/product"],
    acceptanceCriteria: [
      "Checklist has clear owner-facing scope.",
      "Validation evidence is explicit before dispatch."
    ],
    validationPlan: ["npm run test", "npm run build"],
    risk: "medium",
    rollbackNote: "Keep the draft local and discard it if scope changes before dispatch.",
    deployMode: "staged"
  },
  {
    title: "Billing state clarification",
    objective: "Clarify state transitions before implementation begins.",
    targetProjectId: "billing-workflow",
    scope: ["Confirm draft, sent, paid, adjusted, and void states"],
    fileAreas: ["docs/product"],
    acceptanceCriteria: ["Open questions are separated from confirmed behavior."],
    validationPlan: [],
    risk: "medium",
    rollbackNote: "",
    deployMode: "dry-run"
  }
];

export const orchestrationTasks: OrchestrationTask[] = [
  {
    id: "task-registry",
    projectId: "website-refresh",
    title: "Workspace Registry Schema",
    role: "implementation",
    status: "queued",
    attempt: 0,
    attemptLimit: 3,
    owner: "Worker A",
    objective: "Create the typed workspace registry contract used by the cockpit and pipeline lanes.",
    scope: [
      "Define the registry data shape for project identity, status, path, and runtime adapter state.",
      "Keep the registry deterministic and independent from local user paths.",
      "Return implementation notes and validation evidence to the orchestrator."
    ],
    fileOwnership: ["src/registry.ts", "src/registry.test.ts"],
    acceptanceCriteria: [
      "Registry entries can represent active, queued, and blocked projects.",
      "Invalid project state is rejected by a focused unit test.",
      "No private local paths or owner-specific names are introduced."
    ],
    validationCommands: ["npm run test -- src/registry.test.ts", "npm run build"],
    dependencies: ["Pipeline item pipe-1 is ready for dispatch."],
    rollback: "Revert only the registry files and leave cockpit layout files untouched."
  },
  {
    id: "task-cockpit",
    projectId: "website-refresh",
    title: "Cockpit Panel Header Pass",
    role: "implementation",
    status: "implementing",
    attempt: 1,
    attemptLimit: 3,
    owner: "Worker B",
    objective: "Tighten panel headers so each lane exposes role, state, branch, and validation status at a glance.",
    scope: [
      "Adjust the existing session cell header only.",
      "Preserve current 1x1 through 3x3 grid behavior.",
      "Avoid changing pipeline data or runtime adapter mocks."
    ],
    fileOwnership: ["src/App.tsx", "src/styles.css"],
    acceptanceCriteria: [
      "Long session titles remain clipped instead of resizing the grid.",
      "State chips remain visible at desktop widths.",
      "Existing layout tests still pass."
    ],
    validationCommands: ["npm run test -- src/layout.test.ts", "npm run build"],
    dependencies: ["Current cockpit shell scaffold."],
    rollback: "Revert the header and style changes without touching orchestration fixtures."
  },
  {
    id: "task-grid-validation",
    projectId: "website-refresh",
    title: "Cockpit Grid Validation",
    role: "validation",
    status: "validating",
    attempt: 1,
    attemptLimit: 3,
    owner: "Worker C",
    objective: "Validate that every supported cockpit layout caps visible panels at nine cells.",
    scope: [
      "Exercise 1x1, 2x1, 1x2, 3x1, 1x3, 2x2, 2x3, 3x2, and 3x3 layouts.",
      "Report any overflow or missing layout option.",
      "Do not modify production UI unless a failing test proves the need."
    ],
    fileOwnership: ["src/layout.test.ts"],
    acceptanceCriteria: [
      "Every layout has a deterministic max visible cell count.",
      "3x3 never renders more than nine panels.",
      "Validation notes identify the tested layout set."
    ],
    validationCommands: ["npm run test -- src/layout.test.ts"],
    dependencies: ["Layout model already exists."],
    rollback: "Remove only the added validation assertions if they are wrong or redundant."
  },
  {
    id: "task-runtime-mock",
    projectId: "website-refresh",
    title: "Runtime Adapter Mock Contract",
    role: "planning",
    status: "blocked",
    attempt: 3,
    attemptLimit: 3,
    owner: "Orchestrator",
    objective: "Specify a local-only runtime adapter contract before any real process execution is introduced.",
    scope: [
      "Document the adapter states and permissions needed for future integrations.",
      "Keep execution mocked until explicit runtime safety gates exist.",
      "Return the blocked reason for orchestration review."
    ],
    fileOwnership: ["docs/architecture/architecture-plan.md"],
    acceptanceCriteria: [
      "Adapter state names match the UI permission surface.",
      "The plan clearly separates mock data from real command execution.",
      "No model-specific worker assumptions are added."
    ],
    validationCommands: ["npm run build"],
    dependencies: ["Runtime permission model needs product decision."],
    rollback: "Remove the adapter contract note if the runtime lane changes direction."
  },
  {
    id: "task-billing-map",
    projectId: "billing-workflow",
    title: "Invoice State Map",
    role: "planning",
    status: "queued",
    attempt: 0,
    attemptLimit: 3,
    owner: "Worker A",
    objective: "Draft a small invoice state map that can be reviewed before implementation.",
    scope: [
      "Represent draft, sent, paid, adjusted, and void states.",
      "Capture unknown mapping questions as explicit blockers.",
      "Keep the output in a project-local planning file."
    ],
    fileOwnership: ["docs/product/invoice-state-map.md"],
    acceptanceCriteria: [
      "Each state has a plain-language definition.",
      "Transitions identify the user action that causes them.",
      "Open questions are listed separately from confirmed behavior."
    ],
    validationCommands: ["npm run build"],
    dependencies: ["Pipeline item pipe-5 is ready for dispatch."],
    rollback: "Delete the planning file if the billing lane is descoped."
  }
];

export const cockpitPresets: CockpitPreset[] = [
  {
    mode: "focus",
    label: "Focus Lane",
    description: "One run with supporting evidence panes.",
    sessionIds: ["run-plan", "worker-validation"]
  },
  {
    mode: "orchestrator",
    label: "Orchestrator With Workers",
    description: "Main run plus implementer, validator, and integration panels.",
    sessionIds: ["run-plan", "worker-layout", "worker-validation", "integration"]
  },
  {
    mode: "monitor",
    label: "Independent Project Monitor",
    description: "Multiple unrelated project lanes at once.",
    sessionIds: ["run-plan", "billing-api", "tooling-smoke", "worker-layout", "worker-validation", "integration"]
  }
];

export const permissionSurfaces: PermissionSurface[] = [
  {
    id: "project-folder",
    label: "Project folder",
    status: "enabled",
    detail: "Mock workspace scope only"
  },
  {
    id: "git",
    label: "Git",
    status: "enabled",
    detail: "Read-only status mock"
  },
  {
    id: "terminal",
    label: "Terminal/process",
    status: "disabled",
    detail: "No command execution in scaffold"
  },
  {
    id: "runtime",
    label: "Runtime adapter",
    status: "review",
    detail: "Mock transport pending setup"
  },
  {
    id: "notifications",
    label: "Notifications",
    status: "review",
    detail: "Local alerts not configured"
  }
];
