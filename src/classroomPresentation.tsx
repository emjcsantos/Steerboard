import { useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { ClassroomParticipantProjection } from "./classroomParticipants";
import type { OrchestratorRunProjection, OrchestratorWorkState } from "./orchestratorRunProjection";
import {
  classroomSemanticZoom,
  fitClassroomViewport,
  loadClassroomViewport,
  manipulateClassroomViewport,
  resetClassroomViewport,
  saveClassroomViewport
} from "./classroomViewport";
import { buildClassroomSceneMap, CLASSROOM_SCENE_CAPACITIES, type ClassroomSceneRect } from "./classroomSceneMap";

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
  const [viewport, setViewport] = useState(loadClassroomViewport);
  useEffect(() => saveClassroomViewport(viewport), [viewport]);
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
  const sceneCapacity = CLASSROOM_SCENE_CAPACITIES.find((capacity) => capacity >= initialPlaces.length) ?? 20;
  const scene = buildClassroomSceneMap(sceneCapacity);
  const semanticZoom = classroomSemanticZoom(viewport.zoom);

  function sceneStyle(rect: ClassroomSceneRect): CSSProperties {
    return { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` };
  }

  function zoomBy(delta: number) {
    setViewport((current) => manipulateClassroomViewport(current, { zoom: current.zoom + delta }));
  }

  function panBy(x: number, y: number) {
    setViewport((current) => manipulateClassroomViewport(current, {
      panX: current.panX + x,
      panY: current.panY + y
    }));
  }

  function handleViewportKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const handled = ["+", "=", "-", "_", "0", "f", "F", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!handled.includes(event.key)) return;
    event.preventDefault();
    if (event.key === "+" || event.key === "=") zoomBy(0.1);
    else if (event.key === "-" || event.key === "_") zoomBy(-0.1);
    else if (event.key === "0") setViewport(resetClassroomViewport());
    else if (event.key === "f" || event.key === "F") setViewport(fitClassroomViewport());
    else if (event.key === "ArrowLeft") panBy(-0.08, 0);
    else if (event.key === "ArrowRight") panBy(0.08, 0);
    else if (event.key === "ArrowUp") panBy(0, -0.08);
    else if (event.key === "ArrowDown") panBy(0, 0.08);
  }

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

      <nav aria-label="Classroom viewport controls" className="classroom-viewport-controls">
        <button aria-keyshortcuts="+" onClick={() => zoomBy(0.1)} type="button">Zoom In</button>
        <button aria-keyshortcuts="-" onClick={() => zoomBy(-0.1)} type="button">Zoom Out</button>
        <button aria-keyshortcuts="F" onClick={() => setViewport(fitClassroomViewport())} type="button">Fit</button>
        <button aria-keyshortcuts="0" onClick={() => setViewport(resetClassroomViewport())} type="button">Reset</button>
        <span role="group" aria-label="Pan classroom">
          <button aria-label="Pan left" onClick={() => panBy(-0.08, 0)} type="button">Left</button>
          <button aria-label="Pan up" onClick={() => panBy(0, -0.08)} type="button">Up</button>
          <button aria-label="Pan down" onClick={() => panBy(0, 0.08)} type="button">Down</button>
          <button aria-label="Pan right" onClick={() => panBy(0.08, 0)} type="button">Right</button>
        </span>
        <output aria-live="polite">{Math.round(viewport.zoom * 100)}% · {viewport.fitMode} fit</output>
      </nav>
      <div
        aria-label="Classroom canvas viewport"
        className="classroom-room-viewport"
        data-fit-mode={viewport.fitMode}
        data-semantic-zoom={semanticZoom}
        onKeyDown={handleViewportKeyDown}
        tabIndex={0}
      >
      <div className="classroom-room" style={{ transform: `translate(${viewport.panX * 20}%, ${viewport.panY * 20}%) scale(${viewport.zoom})` }}>
        <div aria-hidden="true" className="classroom-door-corridor" style={sceneStyle(scene.doorCorridor)} />
        {scene.walkingPaths.map((path) => <div aria-hidden="true" className="classroom-walking-path" key={path.id} style={sceneStyle(path)} />)}
        <section aria-label="Teacher zone" className="classroom-teacher-zone" style={sceneStyle(scene.teacherZone)}>
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
            const seatState = !participant
              ? "empty"
              : participant.lifecycle === "waiting"
              ? "away"
              : status === "queued"
              ? "reserved"
              : "occupied";
            return (
              <button
                aria-label={participant ? `Worker ${participant.seat}, ${status}` : `Seat ${seat}, empty`}
                aria-pressed={participant ? participant.id === selectedParticipantId : undefined}
                className="classroom-seat"
                data-status={status ?? "empty"}
                data-seat-state={seatState}
                disabled={!participant || !onSelectParticipant}
                key={seat}
                onClick={() => participant && onSelectParticipant?.(participant.id)}
                style={sceneStyle(scene.seats[seat - 1].interactionZone)}
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

        <section aria-label="Validator zone" className="classroom-validator-zone" style={sceneStyle(scene.validatorZone)}>
          <div className="classroom-actor classroom-actor-validator">
            <span>Assistant teacher</span><strong>Validator</strong>
          </div>
          <div aria-label="Validator standing slots" className="classroom-standing-slots">
            {[0, 1].map((index) => standingSlot("validator", index, validatorIds[index]))}
          </div>
        </section>
      </div>
      </div>

      <aside aria-label="Classroom context" className="classroom-context-rail">
        {roster}<div className="classroom-context-inspector">{inspector}</div><div className="classroom-context-chat">{chat}</div>
      </aside>
    </section>
  );
}
