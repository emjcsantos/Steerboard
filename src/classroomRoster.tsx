import type { KeyboardEvent } from "react";
import type { ClassroomParticipantProjection } from "./classroomParticipants";

export interface ClassroomRosterProps {
  projection: ClassroomParticipantProjection;
  selectedParticipantId?: string;
  visibleParticipantIds?: readonly string[];
  onSelectParticipant: (participantId: string) => void;
  focusedParticipantId?: string;
  onFocusedParticipantChange?: (participantId: string) => void;
  onRevealParticipant?: (participantId: string, behavior: "smooth" | "instant") => void;
  reducedMotion?: boolean;
}

function participantAccessibleName(
  participant: ClassroomParticipantProjection["participants"][number],
  isVisible: boolean
): string {
  const profile = participant.modelProfileSnapshot;
  const visibility = isVisible ? "visible in room" : "not currently visible in room";

  return [
    `Seat ${participant.seat}`,
    `participant ${participant.id}`,
    `model ${profile.provider} ${profile.model}`,
    `state ${participant.lifecycle}`,
    `execution ${participant.executionState}`,
    visibility
  ].join(", ");
}

/**
 * Complete, accessible participant index for a Classroom run.
 *
 * Room visibility is presentation-only: it never filters the durable participant
 * projection, so keyboard and assistive-technology users can select any real
 * participant in the run.
 */
export function ClassroomRoster({
  projection,
  selectedParticipantId,
  visibleParticipantIds,
  onSelectParticipant,
  focusedParticipantId,
  onFocusedParticipantChange,
  onRevealParticipant,
  reducedMotion = false
}: ClassroomRosterProps) {
  const visibleIds = visibleParticipantIds === undefined
    ? undefined
    : new Set(visibleParticipantIds);
  const participants = [...projection.participants].sort(
    (left, right) => left.seat - right.seat || left.id.localeCompare(right.id)
  );
  const rovingParticipantId = focusedParticipantId ?? selectedParticipantId ?? participants[0]?.id;
  const revealBehavior = reducedMotion ? "instant" : "smooth";

  function reveal(participantId: string) {
    onRevealParticipant?.(participantId, revealBehavior);
  }

  function moveFocus(currentIndex: number, key: string) {
    if (!participants.length) return;
    const nextIndex = key === "Home"
      ? 0
      : key === "End"
      ? participants.length - 1
      : key === "ArrowDown" || key === "ArrowRight"
      ? (currentIndex + 1) % participants.length
      : (currentIndex - 1 + participants.length) % participants.length;
    const nextId = participants[nextIndex].id;
    onFocusedParticipantChange?.(nextId);
    reveal(nextId);
    queueMicrotask(() => {
      if (typeof document === "undefined") return;
      const button = document.querySelector<HTMLButtonElement>(
        `.classroom-roster-participant[data-participant-id="${CSS.escape(nextId)}"]`
      );
      button?.focus();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number, participantId: string) {
    if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      moveFocus(index, event.key);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectParticipant(participantId);
      reveal(participantId);
    }
  }

  return (
    <section
      aria-labelledby="classroom-roster-heading"
      className="classroom-roster"
      data-reveal-behavior={revealBehavior}
    >
      <h2 id="classroom-roster-heading">Participant roster</h2>
      {participants.length === 0 ? (
        <p>No participants have been dispatched.</p>
      ) : (
        <ul aria-label="Classroom participants" className="classroom-roster-list">
          {participants.map((participant) => {
            const profile = participant.modelProfileSnapshot;
            const isVisible = visibleIds?.has(participant.id) ?? true;
            const isSelected = participant.id === selectedParticipantId;

            return (
              <li key={participant.id}>
                <button
                  aria-label={participantAccessibleName(participant, isVisible)}
                  aria-pressed={isSelected}
                  className="classroom-roster-participant"
                  data-in-room={isVisible}
                  data-participant-id={participant.id}
                  onClick={() => {
                    onSelectParticipant(participant.id);
                    reveal(participant.id);
                  }}
                  onKeyDown={(event) => handleKeyDown(event, participants.indexOf(participant), participant.id)}
                  tabIndex={participant.id === rovingParticipantId ? 0 : -1}
                  type="button"
                >
                  <strong><span aria-hidden="true" className="classroom-roster-status-icon">{participant.executionState === "eligible" ? "●" : "!"}</span> Seat {participant.seat}</strong>
                  <span>{participant.id}</span>
                  <span>{profile.provider} / {profile.model}</span>
                  <span className="classroom-roster-status-text">{participant.lifecycle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
