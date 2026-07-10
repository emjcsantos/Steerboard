import type { ClassroomParticipantProjection } from "./classroomParticipants";

export interface ClassroomRosterProps {
  projection: ClassroomParticipantProjection;
  selectedParticipantId?: string;
  visibleParticipantIds?: readonly string[];
  onSelectParticipant: (participantId: string) => void;
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
  onSelectParticipant
}: ClassroomRosterProps) {
  const visibleIds = visibleParticipantIds === undefined
    ? undefined
    : new Set(visibleParticipantIds);
  const participants = [...projection.participants].sort(
    (left, right) => left.seat - right.seat || left.id.localeCompare(right.id)
  );

  return (
    <section aria-labelledby="classroom-roster-heading" className="classroom-roster">
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
                  onClick={() => onSelectParticipant(participant.id)}
                  type="button"
                >
                  <strong>Seat {participant.seat}</strong>
                  <span>{participant.id}</span>
                  <span>{profile.provider} / {profile.model}</span>
                  <span>{participant.lifecycle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
