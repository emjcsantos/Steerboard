import type { ReactNode } from "react";
import type { ClassroomParticipantProjection } from "./classroomParticipants";
import type { OrchestratorRunProjection, OrchestratorWorkState } from "./orchestratorRunProjection";

export type ClassroomVisualStatus =
  | "queued"
  | "working"
  | "validating"
  | "revision"
  | "accepted"
  | "escalated"
  | "blocked"
  | "completed";

const statusIcons: Record<ClassroomVisualStatus, string> = {
  queued: "○",
  working: "▶",
  validating: "◇",
  revision: "↺",
  accepted: "✓",
  escalated: "!",
  blocked: "×",
  completed: "●"
};

function visualStatus(workState: OrchestratorWorkState | undefined, lifecycle: string): ClassroomVisualStatus {
  if (workState === "queued") return "queued";
  if (workState === "validating" || workState === "submitted") return "validating";
  if (workState === "revision-required") return "revision";
  if (workState === "accepted" || workState === "integrating") return "accepted";
  if (workState === "escalated" || workState === "takeover") return "escalated";
  if (workState === "blocked" || workState === "failed" || lifecycle === "failed") return "blocked";
  if (workState === "completed" || lifecycle === "completed") return "completed";
  if (workState === "running" || workState === "assigned" || lifecycle === "working") return "working";
  return "queued";
}

export interface ClassroomPresentationProps {
  projection: OrchestratorRunProjection;
  participants: ClassroomParticipantProjection;
  selectedParticipantId?: string;
  onSelectParticipant?: (participantId: string) => void;
  roster?: ReactNode;
  chat?: ReactNode;
  inspector?: ReactNode;
}

/** Read-only presentation of durable orchestrator state. */
export function ClassroomPresentation({
  projection,
  participants,
  selectedParticipantId,
  onSelectParticipant,
  roster,
  chat,
  inspector
}: ClassroomPresentationProps) {
  const runParticipants = participants.participants
    .filter((participant) => !projection.runId || participant.runId === projection.runId)
    .sort((left, right) => left.seat - right.seat);
  const participantById = new Map(runParticipants.map((participant) => [participant.id, participant]));
  const jobByParticipantId = new Map(
    participants.jobs
      .filter((job) => !projection.runId || job.runId === projection.runId)
      .map((job) => [job.participantId, job])
  );
  const teacherIds = projection.capacity.teacherStandingParticipantIds.slice(0, 2);
  const validatorIds = runParticipants
    .filter((participant) => {
      const job = jobByParticipantId.get(participant.id);
      const state = job ? projection.taskStates[job.taskId] : undefined;
      return state === "submitted" || state === "validating" || state === "revision-required" || state === "accepted";
    })
    .map((participant) => participant.id)
    .filter((participantId) => !teacherIds.includes(participantId))
    .slice(0, 2);
  const occupiedSeats = new Map(runParticipants.map((participant) => [participant.seat, participant]));
  const initialPlaces = Array.from({ length: Math.max(5, projection.capacity.approved) }, (_, index) => index + 1);

  function standingSlot(role: "teacher" | "validator", index: number, participantId?: string) {
    const participant = participantId ? participantById.get(participantId) : undefined;
    return (
      <div className="classroom-standing-slot" data-occupied={Boolean(participant)} data-role={role} key={`${role}-${index}`}>
        <span>{role === "teacher" ? "Assignment" : "Validation"} {index + 1}</span>
        <strong>{participant ? `Worker ${participant.seat}` : "Available"}</strong>
      </div>
    );
  }

  return (
    <section aria-label="Classroom presentation" className="classroom-presentation" data-reduced-motion="supported">
      <header className="classroom-status-board">
        <div>
          <span>Run status</span>
          <strong>{projection.runStatus}</strong>
        </div>
        <dl aria-label="Classroom run counts">
          <div><dt>Active</dt><dd>{projection.capacity.active}</dd></div>
          <div><dt>Queued</dt><dd>{projection.capacity.queued}</dd></div>
          <div><dt>Validating</dt><dd>{projection.capacity.validating}</dd></div>
          <div><dt>Blocked</dt><dd>{projection.capacity.blocked}</dd></div>
          <div><dt>Completed</dt><dd>{projection.counts.completed}</dd></div>
        </dl>
      </header>

      <div className="classroom-room">
        <section aria-label="Teacher zone" className="classroom-teacher-zone">
          <div className="classroom-actor classroom-actor-teacher">
            <span>Teacher</span><strong>Orchestrator</strong>
          </div>
          <div aria-label="Teacher assignment slots" className="classroom-standing-slots">
            {[0, 1].map((index) => standingSlot("teacher", index, teacherIds[index]))}
          </div>
        </section>

        <section aria-label="Student places" className="classroom-seat-grid">
          {initialPlaces.map((seat) => {
            const participant = occupiedSeats.get(seat);
            const job = participant ? jobByParticipantId.get(participant.id) : undefined;
            const status = participant
              ? visualStatus(job ? projection.taskStates[job.taskId] : undefined, participant.lifecycle)
              : undefined;
            return (
              <button
                aria-label={participant ? `Worker ${participant.seat}, ${status}` : `Seat ${seat}, empty`}
                aria-pressed={participant ? participant.id === selectedParticipantId : undefined}
                className="classroom-seat"
                data-status={status ?? "empty"}
                disabled={!participant || !onSelectParticipant}
                key={seat}
                onClick={() => participant && onSelectParticipant?.(participant.id)}
                type="button"
              >
                <span className="classroom-seat-number">Seat {seat}</span>
                {participant && status ? (
                  <><strong>Worker {participant.seat}</strong><span><i aria-hidden="true">{statusIcons[status]}</i> {status}</span></>
                ) : <strong>Open place</strong>}
              </button>
            );
          })}
        </section>

        <section aria-label="Validator zone" className="classroom-validator-zone">
          <div className="classroom-actor classroom-actor-validator">
            <span>Assistant teacher</span><strong>Validator</strong>
          </div>
          <div aria-label="Validator standing slots" className="classroom-standing-slots">
            {[0, 1].map((index) => standingSlot("validator", index, validatorIds[index]))}
          </div>
        </section>
      </div>

      <aside aria-label="Classroom context" className="classroom-context-rail">
        {roster}<div className="classroom-context-inspector">{inspector}</div><div className="classroom-context-chat">{chat}</div>
      </aside>
    </section>
  );
}
