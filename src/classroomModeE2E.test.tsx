import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createBoundedOrchestratorRun, createOrchestratorBackendState } from "./orchestratorBackend";
import type { ClassroomParticipantProjection } from "./classroomParticipants";
import { ClassroomPresentation } from "./classroomPresentation";
import { ClassroomRoster } from "./classroomRoster";
import { ClassroomInspector } from "./classroomInspector";
import { normalizeOrchestratorChatState, OrchestratorChat } from "./orchestratorChat";
import { OrchestratorWorkspace } from "./orchestratorWorkspace";
import { createClassroomInternalPreview, disableClassroomRollout, resolveClassroomRollout } from "./classroomRollout";
import type { OrchestratorRunProjection } from "./orchestratorRunProjection";
import { applyValidatorReport, type ValidatorJobRecord, type ValidatorReport } from "./orchestratorValidatorLoop";
import { createPmTaskTemplateSnapshot, DEFAULT_PM_TASK_BUDGET, type PmWorkerReadyTask } from "./pmLaneWorkerReady";
import { DEFAULT_WORKER_MODEL_PROFILE, type WorkerJobRecord, type WorkerModelProfile } from "./orchestratorWorkerDispatch";

function classroomFixture(count: 5 | 20) {
  const participants: ClassroomParticipantProjection = {
    participants: Array.from({ length: count }, (_, index) => ({
      id: `participant-${index + 1}`, runId: "run-e2e", role: "worker" as const, lifecycle: "working" as const,
      seat: index + 1, modelProfileSnapshot: { ...DEFAULT_WORKER_MODEL_PROFILE, role: "worker" as const },
      currentJobId: `job-${index + 1}`, messageIds: [], executionState: "eligible" as const
    })),
    jobs: Array.from({ length: count }, (_, index) => ({
      id: `job-${index + 1}`, runId: "run-e2e", participantId: `participant-${index + 1}`, taskId: `task-${index + 1}`,
      branch: `codex/e2e-${index + 1}`, worktreePath: `.worktrees/e2e-${index + 1}`, status: "running" as const,
      attempt: 1, ownership: { ownedFiles: [`src/e2e-${index + 1}.ts`], forbiddenFiles: [] }, createdAt: "2026-07-11T08:00:00.000Z"
    })),
    messages: [{
      id: "message-e2e", runId: "run-e2e", actor: { kind: "participant" as const, participantId: "participant-2" },
      body: "Working on the assignment. <think>private details</think>", createdAt: "2026-07-11T08:00:01.000Z"
    }]
  };
  const projection: OrchestratorRunProjection = {
    presentation: "classroom", runId: "run-e2e", phase: "working", runStatus: "running",
    counts: { runs: 1, tasks: count, participants: count, jobs: count, messages: 1, validations: 0, completed: 0 },
    completionPercent: 0, taskStates: Object.fromEntries(Array.from({ length: count }, (_, index) => [`task-${index + 1}`, "running"])), progress: [],
    capacity: { approved: count, occupiedSeats: count, emptySeats: 0, queued: 0, active: count, waiting: 0, validating: 0, blocked: 0,
      teacherStandingParticipantIds: ["participant-1", "participant-2"], visibleQueueParticipantIds: [] }
  };
  return { participants, projection };
}

function renderClassroom(count: 5 | 20, reducedMotion = false): string {
  const restored = JSON.parse(JSON.stringify(classroomFixture(count))) as ReturnType<typeof classroomFixture>;
  const chatState = normalizeOrchestratorChatState({ messages: [], collapsed: false });
  return renderToStaticMarkup(
    <ClassroomPresentation
      chat={<OrchestratorChat onCollapsedChange={() => undefined} onSendMessage={() => undefined} runCounts={{ active: count, waiting: 0, validating: 0, blocked: 0 }} state={chatState} />}
      inspector={<ClassroomInspector ledger={[]} now="2026-07-11T08:00:02.000Z" projection={restored.participants} selectedParticipantId="participant-1" />}
      nowMs={Date.parse("2026-07-11T08:00:02.000Z")}
      participants={restored.participants}
      projection={restored.projection}
      reducedMotion={reducedMotion}
      roster={<ClassroomRoster onSelectParticipant={() => undefined} projection={restored.participants} selectedParticipantId="participant-1" />}
      selectedParticipantId="participant-1"
    />
  );
}

describe("Classroom Mode end-to-end hardening", () => {
  it("keeps Professional exact when disabled and enables preview without mutating durable state", () => {
    const run = { id: "run-rollout", status: "running", events: ["started"] };
    const disabled = resolveClassroomRollout(disableClassroomRollout(), run);
    const preview = resolveClassroomRollout(createClassroomInternalPreview(), run);
    const html = renderToStaticMarkup(<OrchestratorWorkspace classroomModeEnabled={disabled.available} onPresentationModeChange={() => undefined} presentationMode="classroom" professionalContent={<main>Arena PM provider permission right panel</main>} />);
    expect(html).toBe("<main>Arena PM provider permission right panel</main>");
    expect(preview.available).toBe(true);
    expect(preview.durableState).toBe(run);
  });

  it.each([5, 20] as const)("restores and renders %i workers with orchestrator-only chat, roster, inspector, bubbles, and Reduced mode", (count) => {
    const html = renderClassroom(count, true);
    expect(html.match(/data-seat-state="occupied"/g)).toHaveLength(count);
    expect(html).toContain('data-chat-recipient="orchestrator"');
    expect(html).toContain("Participant roster");
    expect(html).toContain("Worker Inspector");
    expect(html).toContain('aria-label="Classroom activity previews"');
    expect(html).not.toContain("private details");
    expect(html).toContain('data-motion-mode="reduced"');
    expect(html).not.toContain("Message Worker");
  });

  it("revises twice and queues exactly one orchestrator takeover on the third failure", () => {
    let state = createBoundedOrchestratorRun(createOrchestratorBackendState(), { id: "run-takeover", projectId: "e2e", scope: { mode: "task-list", taskIds: ["task-1"] }, baseBranch: "main", createdAt: "2026-07-11T08:00:00.000Z" });
    const task: PmWorkerReadyTask = {
      id: "task-1", title: "E2E takeover", objective: "Prove exhaustion", ownedFiles: ["src/e2e.ts"], forbiddenFiles: [], dependencies: [],
      acceptanceCriteria: ["Pass"], validationCommands: ["npm test"], rollbackPlan: "Revert", budget: { ...DEFAULT_PM_TASK_BUDGET }, priority: "normal",
      capabilityProfile: "workspace-write", evidenceKinds: ["unit-test"], provenance: { origin: "orchestrator", labels: ["e2e"] },
      templateSnapshot: createPmTaskTemplateSnapshot({ taskId: "task-1", templateId: "e2e", resolvedAt: "2026-07-11T08:00:00.000Z", templateJson: {} }),
      status: "queued", createdAt: "2026-07-11T08:00:00.000Z", sequence: 1
    };
    const baseJob: WorkerJobRecord = {
      id: "job-1", runId: "run-takeover", taskId: "task-1", branch: "codex/e2e", worktreePath: ".worktrees/e2e", status: "completed",
      modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id, capabilityProfile: "workspace-write", budget: { ...DEFAULT_PM_TASK_BUDGET }, ownedFiles: ["src/e2e.ts"], forbiddenFiles: [], attempt: 1, lease: {}, createdAt: "2026-07-11T08:00:00.000Z"
    };
    const orchestratorProfile: WorkerModelProfile = {
      id: "e2e-orchestrator", role: "orchestrator", provider: "codex", model: "gpt-5-codex", reasoningEffort: "high",
      authRef: "codex-desktop", capabilities: { tools: true, filesystem: true, shell: true, browser: false, structuredOutput: true }
    };
    for (const attempt of [1, 2, 3]) {
      const validator: ValidatorJobRecord = { id: `validator-${attempt}`, runId: "run-takeover", taskId: "task-1", workerJobId: "job-1", worktreePath: ".worktrees/e2e", status: "completed", capabilityProfile: "read-only", attempt, readonly: true, validationScope: { ownedFiles: ["src/e2e.ts"], acceptanceCriteria: ["Pass"], validationCommands: ["npm test"] }, createdAt: `2026-07-11T08:0${attempt}:00.000Z` };
      const report: ValidatorReport = { id: `report-${attempt}`, runId: "run-takeover", taskId: "task-1", workerJobId: "job-1", validatorJobId: validator.id, attempt, verdict: "revision-required", findings: [{ id: `finding-${attempt}`, severity: "error", message: "Revise", files: ["src/e2e.ts"], sharedSurface: false, evidence: ["failed"] }], commandsRun: [], acceptanceResults: [], changedFiles: ["src/e2e.ts"], evidenceReferences: ["failed"], nextAction: "return-to-worker", createdAt: validator.createdAt };
      state = applyValidatorReport(state, task, { ...baseJob, attempt }, validator, report, 3, "orchestrator-takeover", orchestratorProfile).backendState;
    }
    expect(state.commandQueue.filter((command) => command.kind === "orchestrator.takeover")).toHaveLength(1);
    expect(state.commandQueue.filter((command) => command.kind === "worker.start")).toHaveLength(2);
  });
});
