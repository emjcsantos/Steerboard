import { isValidElement, type MouseEventHandler, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  ClassroomParticipantProjection,
  ClassroomParticipantSnapshot
} from "./classroomParticipants";
import { ClassroomRoster } from "./classroomRoster";

function participant(id: string, seat: number): ClassroomParticipantSnapshot {
  return {
    id,
    runId: "run-1",
    role: "worker",
    lifecycle: seat === 2 ? "waiting" : "working",
    seat,
    modelProfileSnapshot: {
      id: `profile-${id}`,
      role: "worker",
      provider: seat === 2 ? "anthropic" : "codex",
      model: seat === 2 ? "claude-sonnet" : "gpt-5",
      reasoningEffort: "medium",
      authRef: "auth",
      capabilities: {
        tools: true,
        filesystem: true,
        shell: true,
        browser: false,
        structuredOutput: true
      }
    },
    currentJobId: `job-${id}`,
    messageIds: [],
    executionState: "eligible"
  };
}

function projection(participants: ClassroomParticipantSnapshot[]): ClassroomParticipantProjection {
  return { participants, jobs: [], messages: [] };
}

function findButtonOnClick(node: ReactNode, participantId: string): MouseEventHandler<HTMLButtonElement> {
  if (Array.isArray(node)) {
    for (const child of node) {
      try {
        return findButtonOnClick(child, participantId);
      } catch {
        // Continue through the rendered element tree.
      }
    }
  }

  if (isValidElement<{ children?: ReactNode; "data-participant-id"?: string; onClick?: MouseEventHandler<HTMLButtonElement> }>(node)) {
    if (node.props["data-participant-id"] === participantId && node.props.onClick) {
      return node.props.onClick;
    }
    return findButtonOnClick(node.props.children, participantId);
  }

  throw new Error(`Participant button ${participantId} was not found`);
}

describe("ClassroomRoster", () => {
  it("renders every real participant, including participants outside the visible room subset", () => {
    const html = renderToStaticMarkup(
      <ClassroomRoster
        onSelectParticipant={() => undefined}
        projection={projection([
          participant("worker-3", 3),
          participant("worker-1", 1),
          participant("worker-2", 2)
        ])}
        selectedParticipantId="worker-2"
        visibleParticipantIds={["worker-1", "worker-3"]}
      />
    );

    expect(html.match(/data-participant-id=/g)).toHaveLength(3);
    expect(html.indexOf("Seat 1")).toBeLessThan(html.indexOf("Seat 2"));
    expect(html).toContain('data-participant-id="worker-2"');
    expect(html).toContain('data-in-room="false"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("model anthropic claude-sonnet");
    expect(html).toContain("state waiting");
    expect(html).toContain("not currently visible in room");
  });

  it("selects a participant that is not visible in the room", () => {
    const onSelectParticipant = vi.fn();
    const element = ClassroomRoster({
      projection: projection([participant("worker-1", 1), participant("worker-2", 2)]),
      selectedParticipantId: "worker-1",
      visibleParticipantIds: ["worker-1"],
      onSelectParticipant
    });

    findButtonOnClick(element, "worker-2")({} as never);

    expect(onSelectParticipant).toHaveBeenCalledOnce();
    expect(onSelectParticipant).toHaveBeenCalledWith("worker-2");
  });

  it("does not fabricate participant rows for an empty projection", () => {
    const html = renderToStaticMarkup(
      <ClassroomRoster
        onSelectParticipant={() => undefined}
        projection={projection([])}
        visibleParticipantIds={[]}
      />
    );

    expect(html).toContain("No participants have been dispatched.");
    expect(html).not.toContain("data-participant-id");
    expect(html).not.toContain("classroom-roster-list");
  });
});
