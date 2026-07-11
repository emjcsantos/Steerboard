import {
  isValidElement,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode
} from "react";
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

interface ParticipantButtonProps {
  children?: ReactNode;
  "data-participant-id"?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  tabIndex?: number;
}

function findButtonProps(node: ReactNode, participantId: string): ParticipantButtonProps {
  if (Array.isArray(node)) {
    for (const child of node) {
      try {
        return findButtonProps(child, participantId);
      } catch {
        // Continue through the rendered element tree.
      }
    }
  }

  if (isValidElement<ParticipantButtonProps>(node)) {
    if (node.props["data-participant-id"] === participantId) {
      return node.props;
    }
    return findButtonProps(node.props.children, participantId);
  }

  throw new Error(`Participant button ${participantId} was not found`);
}

function keyEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn()
  } as unknown as Parameters<KeyboardEventHandler<HTMLButtonElement>>[0];
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

    findButtonProps(element, "worker-2").onClick?.({} as never);

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

  it("provides a complete semantic roster for twenty workers with text and icon status", () => {
    const participants = Array.from({ length: 20 }, (_, index) =>
      participant(`worker-${index + 1}`, index + 1)
    );
    const html = renderToStaticMarkup(
      <ClassroomRoster
        onSelectParticipant={() => undefined}
        projection={projection(participants)}
        visibleParticipantIds={participants.slice(0, 5).map(({ id }) => id)}
      />
    );

    expect(html).toContain('<ul aria-label="Classroom participants"');
    expect(html.match(/<li>/g)).toHaveLength(20);
    expect(html.match(/data-participant-id=/g)).toHaveLength(20);
    expect(html.match(/class="classroom-roster-status-icon"/g)).toHaveLength(20);
    expect(html.match(/class="classroom-roster-status-text"/g)).toHaveLength(20);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="classroom-roster-status-text">working</span>');
    expect(html).toContain('class="classroom-roster-status-text">waiting</span>');
  });

  it("uses a deterministic roving tab stop across the roster", () => {
    const element = ClassroomRoster({
      projection: projection([
        participant("worker-3", 3),
        participant("worker-1", 1),
        participant("worker-2", 2)
      ]),
      selectedParticipantId: "worker-1",
      focusedParticipantId: "worker-2",
      visibleParticipantIds: ["worker-1", "worker-2", "worker-3"],
      onFocusedParticipantChange: () => undefined,
      onSelectParticipant: () => undefined
    });

    expect(findButtonProps(element, "worker-1").tabIndex).toBe(-1);
    expect(findButtonProps(element, "worker-2").tabIndex).toBe(0);
    expect(findButtonProps(element, "worker-3").tabIndex).toBe(-1);
  });

  it.each([
    ["ArrowDown", "worker-3"],
    ["ArrowRight", "worker-3"],
    ["ArrowUp", "worker-1"],
    ["ArrowLeft", "worker-1"],
    ["Home", "worker-1"],
    ["End", "worker-3"]
  ])("moves roving focus with %s", (key, expectedParticipantId) => {
    const onFocusedParticipantChange = vi.fn();
    const element = ClassroomRoster({
      projection: projection([
        participant("worker-3", 3),
        participant("worker-1", 1),
        participant("worker-2", 2)
      ]),
      focusedParticipantId: "worker-2",
      visibleParticipantIds: ["worker-1", "worker-2", "worker-3"],
      onFocusedParticipantChange,
      onSelectParticipant: () => undefined
    });
    const event = keyEvent(key);

    findButtonProps(element, "worker-2").onKeyDown?.(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(onFocusedParticipantChange).toHaveBeenCalledOnce();
    expect(onFocusedParticipantChange).toHaveBeenCalledWith(expectedParticipantId);
  });

  it.each(["Enter", " "])("selects and reveals an offscreen participant with %s", (key) => {
    const onSelectParticipant = vi.fn();
    const onRevealParticipant = vi.fn();
    const element = ClassroomRoster({
      projection: projection([participant("worker-1", 1), participant("worker-20", 20)]),
      focusedParticipantId: "worker-20",
      visibleParticipantIds: ["worker-1"],
      onRevealParticipant,
      onSelectParticipant,
      reducedMotion: false
    });
    const event = keyEvent(key);

    findButtonProps(element, "worker-20").onKeyDown?.(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(onSelectParticipant).toHaveBeenCalledWith("worker-20");
    expect(onRevealParticipant).toHaveBeenCalledWith("worker-20", "smooth");
  });

  it("marks reduced-motion offscreen reveals as instant", () => {
    const onRevealParticipant = vi.fn();
    const props = {
      projection: projection([participant("worker-1", 1), participant("worker-20", 20)]),
      focusedParticipantId: "worker-20",
      visibleParticipantIds: ["worker-1"],
      onRevealParticipant,
      onSelectParticipant: () => undefined,
      reducedMotion: true
    } as const;
    const html = renderToStaticMarkup(<ClassroomRoster {...props} />);
    const element = ClassroomRoster({
      ...props
    });

    findButtonProps(element, "worker-20").onClick?.({} as never);

    expect(html).toContain('data-reveal-behavior="instant"');
    expect(onRevealParticipant).toHaveBeenCalledOnce();
    expect(onRevealParticipant).toHaveBeenCalledWith("worker-20", "instant");
  });
});
