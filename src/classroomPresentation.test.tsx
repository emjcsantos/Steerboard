import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ClassroomParticipantProjection, ClassroomParticipantSnapshot } from "./classroomParticipants";
import { ClassroomPresentation } from "./classroomPresentation";
import type { OrchestratorRunProjection, OrchestratorWorkState } from "./orchestratorRunProjection";

function participant(seat: number, lifecycle: ClassroomParticipantSnapshot["lifecycle"] = "working"): ClassroomParticipantSnapshot {
  return {
    id: `participant-${seat}`, runId: "run-1", role: "worker", lifecycle, seat,
    modelProfileSnapshot: {
      id: "worker", role: "worker", provider: "codex", model: "gpt-5-codex", reasoningEffort: "medium",
      authRef: "codex", capabilities: { tools: true, filesystem: true, shell: true, browser: false, structuredOutput: true }
    },
    currentJobId: `job-${seat}`, messageIds: [], executionState: "eligible"
  };
}

function fixture(states: OrchestratorWorkState[], approved = 5): {
  projection: OrchestratorRunProjection;
  participants: ClassroomParticipantProjection;
} {
  const people = states.map((state, index) => participant(index + 1, state === "completed" ? "completed" : "working"));
  return {
    projection: {
      presentation: "classroom", runId: "run-1", phase: "Delivery", runStatus: "running",
      counts: { runs: 1, tasks: states.length, participants: people.length, jobs: people.length, messages: 0, validations: 2, completed: states.filter((state) => state === "completed").length },
      completionPercent: 20,
      taskStates: Object.fromEntries(states.map((state, index) => [`task-${index + 1}`, state])),
      progress: [],
      capacity: {
        approved, occupiedSeats: people.length, emptySeats: Math.max(0, approved - people.length), queued: 1,
        active: 2, waiting: 0, validating: states.filter((state) => state === "validating").length, blocked: 0,
        teacherStandingParticipantIds: people.slice(0, 2).map((item) => item.id), visibleQueueParticipantIds: []
      }
    },
    participants: {
      participants: people,
      jobs: people.map((item) => ({
        id: item.currentJobId, runId: item.runId, participantId: item.id, taskId: `task-${item.seat}`,
        branch: `codex/worker-${item.seat}`, worktreePath: `.worktrees/${item.seat}`, status: "running", attempt: 1,
        ownership: { ownedFiles: [], forbiddenFiles: [] }, createdAt: "2026-07-11T00:00:00.000Z"
      })),
      messages: []
    }
  };
}

function render(states: OrchestratorWorkState[], approved = 5): string {
  const data = fixture(states, approved);
  return renderToStaticMarkup(<ClassroomPresentation {...data} inspector={<div>Inspector detail</div>} roster={<div>Roster detail</div>} chat={<div>Orchestrator chat</div>} />);
}

describe("ClassroomPresentation", () => {
  it("renders five empty capacity places without fabricating students", () => {
    const html = render([]);
    expect(html.match(/Open place/g)).toHaveLength(5);
    expect(html).not.toContain("Worker 1");
  });

  it.each([1, 5])("renders exactly %i real participants in the initial places", (count) => {
    const html = render(Array.from({ length: count }, () => "running" as const));
    expect(html.match(/class="classroom-seat-number">Seat \d+<\/span><strong>Worker /g)).toHaveLength(count);
    expect(html.match(/class=\"classroom-seat\"/g)).toHaveLength(5);
  });

  it("keeps teacher and validator roles dominant and provides two non-overlapping slot groups", () => {
    const html = render(["running", "running", "validating", "revision-required", "accepted"]);
    expect(html).toContain("<strong>Orchestrator</strong>");
    expect(html).toContain("<strong>Validator</strong>");
    expect(html.match(/Assignment [12]/g)).toHaveLength(2);
    expect(html.match(/Validation [12]/g)).toHaveLength(2);
  });

  it("exposes every required state with persistent text and icon semantics", () => {
    const html = render(["queued", "running", "validating", "revision-required", "accepted", "escalated", "blocked", "completed"], 8);
    for (const status of ["queued", "working", "validating", "revision", "accepted", "escalated", "blocked", "completed"]) {
      expect(html).toContain(`data-status="${status}"`);
      expect(html).toContain(`${status}</span>`);
    }
  });

  it("declares reduced-motion support and retains roster, inspector, and orchestrator chat context", () => {
    const html = render(["running"]);
    expect(html).toContain('data-reduced-motion="supported"');
    expect(html).toContain("Roster detail");
    expect(html).toContain("Inspector detail");
    expect(html).toContain("Orchestrator chat");
  });

  it("renders labeled keyboard viewport controls without replacing semantic seat text", () => {
    const html = render(["queued", "running"]);
    expect(html).toContain('aria-label="Classroom viewport controls"');
    expect(html).toContain('aria-keyshortcuts="+"');
    expect(html).toContain('aria-keyshortcuts="-"');
    expect(html).toContain('aria-keyshortcuts="F"');
    expect(html).toContain('aria-keyshortcuts="0"');
    expect(html).toContain('aria-label="Pan classroom"');
    expect(html).toContain('data-seat-state="reserved"');
    expect(html).toContain('data-seat-state="occupied"');
    expect(html).toContain('data-seat-state="empty"');
  });

  it("renders twenty deterministic participant targets while preserving the non-overlay context rail", () => {
    const html = render(Array.from({ length: 20 }, () => "running" as const), 20);
    expect(html.match(/class="classroom-seat"/g)).toHaveLength(20);
    expect(html.match(/data-seat-state="occupied"/g)).toHaveLength(20);
    expect(html).toContain('class="classroom-context-rail"');
    expect(html).toContain('aria-label="Classroom canvas viewport"');
  });
});
