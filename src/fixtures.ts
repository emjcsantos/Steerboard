import type { CockpitMode } from "./layout";

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
  { id: "pipe-1", title: "Define workspace registry", stage: "ready", owner: "Planning", risk: "medium", readiness: 92 },
  { id: "pipe-2", title: "Render cockpit shell", stage: "running", owner: "UI", risk: "medium", readiness: 100 },
  { id: "pipe-3", title: "Add runtime adapter mock", stage: "planned", owner: "Runtime", risk: "high", readiness: 54 },
  { id: "pipe-4", title: "Validate grid bounds", stage: "validating", owner: "Quality", risk: "low", readiness: 100 }
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
