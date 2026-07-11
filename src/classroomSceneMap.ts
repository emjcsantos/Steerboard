export type ClassroomSeatState = "empty" | "reserved" | "occupied" | "away";

export interface ClassroomSceneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClassroomSceneRegion extends ClassroomSceneRect {
  id: string;
}

export interface ClassroomSceneSeat {
  id: string;
  number: number;
  state: ClassroomSeatState;
  desk: ClassroomSceneRect;
  label: ClassroomSceneRect;
  focusRing: ClassroomSceneRect;
  interactionZone: ClassroomSceneRect;
}

export interface ClassroomSceneMap {
  /** Geometry uses a stable 100 x 100 normalized coordinate space. */
  bounds: ClassroomSceneRect;
  capacity: number;
  statusRail: ClassroomSceneRegion;
  doorCorridor: ClassroomSceneRegion;
  teacherZone: ClassroomSceneRegion;
  validatorZone: ClassroomSceneRegion;
  roster: ClassroomSceneRegion;
  walkingPaths: ClassroomSceneRegion[];
  seats: ClassroomSceneSeat[];
}

export const CLASSROOM_SCENE_CAPACITIES = [1, 5, 6, 10, 15, 20] as const;

const seatStates = new Set<ClassroomSeatState>(["empty", "reserved", "occupied", "away"]);

function inset(rect: ClassroomSceneRect, amount: number): ClassroomSceneRect {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: rect.width - amount * 2,
    height: rect.height - amount * 2
  };
}

function seatRect(number: number): ClassroomSceneRect {
  const index = number - 1;
  const bank = Math.floor(index / 10);
  const bankIndex = index % 10;
  const column = bankIndex % 2;
  const row = Math.floor(bankIndex / 2);

  return {
    x: (bank === 0 ? 10 : 48) + column * 14,
    y: 42 + row * 11,
    width: 11,
    height: 7
  };
}

/**
 * Builds presentation-only geometry. It deliberately has no dependency on the
 * participant projection, which keeps durable assignment separate from layout.
 */
export function buildClassroomSceneMap(
  capacity: number,
  states: readonly ClassroomSeatState[] = []
): ClassroomSceneMap {
  if (!CLASSROOM_SCENE_CAPACITIES.includes(capacity as typeof CLASSROOM_SCENE_CAPACITIES[number])) {
    throw new RangeError(`Unsupported classroom capacity: ${capacity}`);
  }

  const seats = Array.from({ length: capacity }, (_, index): ClassroomSceneSeat => {
    const number = index + 1;
    const desk = seatRect(number);
    const requestedState = states[index] ?? "empty";
    if (!seatStates.has(requestedState)) {
      throw new RangeError(`Unsupported state for seat ${number}: ${requestedState}`);
    }
    return {
      id: `seat-${number}`,
      number,
      state: requestedState,
      desk,
      interactionZone: { ...desk },
      focusRing: inset(desk, 0.45),
      label: inset(desk, 1.2)
    };
  });

  return {
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    capacity,
    statusRail: { id: "status-rail", x: 0, y: 0, width: 100, height: 8 },
    doorCorridor: { id: "door-corridor", x: 0, y: 80, width: 8, height: 20 },
    teacherZone: { id: "teacher-zone", x: 10, y: 10, width: 24, height: 18 },
    validatorZone: { id: "validator-zone", x: 50, y: 10, width: 24, height: 18 },
    roster: { id: "roster", x: 84, y: 8, width: 16, height: 92 },
    walkingPaths: [
      { id: "front-walking-path", x: 8, y: 30, width: 76, height: 8 },
      { id: "center-walking-path", x: 39, y: 38, width: 7, height: 62 }
    ],
    seats
  };
}

/** Edge contact is allowed; only positive-area overlap is a collision. */
export function classroomRectsCollide(left: ClassroomSceneRect, right: ClassroomSceneRect): boolean {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}
