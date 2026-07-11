import { describe, expect, it } from "vitest";
import {
  buildClassroomSceneMap,
  classroomRectsCollide,
  CLASSROOM_SCENE_CAPACITIES,
  type ClassroomSceneRect,
  type ClassroomSeatState
} from "./classroomSceneMap";

const states: ClassroomSeatState[] = ["empty", "reserved", "occupied", "away"];

function inside(inner: ClassroomSceneRect, outer: ClassroomSceneRect): boolean {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height;
}

describe("buildClassroomSceneMap", () => {
  it.each(CLASSROOM_SCENE_CAPACITIES)("builds deterministic normalized geometry for capacity %i", (capacity) => {
    const assignedStates = Array.from({ length: capacity }, (_, index) => states[index % states.length]);
    const first = buildClassroomSceneMap(capacity, assignedStates);
    const second = buildClassroomSceneMap(capacity, assignedStates);

    expect(first).toEqual(second);
    expect(first.bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(first.seats).toHaveLength(capacity);
    expect(first.seats.map((seat) => seat.state)).toEqual(assignedStates);

    const everyRect = [
      first.statusRail,
      first.doorCorridor,
      first.teacherZone,
      first.validatorZone,
      first.roster,
      ...first.walkingPaths,
      ...first.seats.flatMap((seat) => [seat.desk, seat.interactionZone, seat.focusRing, seat.label])
    ];
    expect(everyRect.every((rect) => inside(rect, first.bounds))).toBe(true);
    expect(first.seats.every((seat) => inside(seat.label, seat.focusRing))).toBe(true);
    expect(first.seats.every((seat) => inside(seat.focusRing, seat.interactionZone))).toBe(true);
  });

  it.each(CLASSROOM_SCENE_CAPACITIES)("keeps physical regions collision-safe at capacity %i", (capacity) => {
    const scene = buildClassroomSceneMap(capacity);
    const fixedRegions = [
      scene.statusRail,
      scene.doorCorridor,
      scene.teacherZone,
      scene.validatorZone,
      scene.roster,
      ...scene.walkingPaths
    ];

    for (let left = 0; left < fixedRegions.length; left += 1) {
      for (let right = left + 1; right < fixedRegions.length; right += 1) {
        expect(classroomRectsCollide(fixedRegions[left], fixedRegions[right])).toBe(false);
      }
    }
    for (let left = 0; left < scene.seats.length; left += 1) {
      expect(fixedRegions.some((region) => classroomRectsCollide(scene.seats[left].desk, region))).toBe(false);
      for (let right = left + 1; right < scene.seats.length; right += 1) {
        expect(classroomRectsCollide(scene.seats[left].desk, scene.seats[right].desk)).toBe(false);
        expect(classroomRectsCollide(scene.seats[left].interactionZone, scene.seats[right].interactionZone)).toBe(false);
      }
    }
  });

  it("defaults unspecified seats to empty and preserves every supported state", () => {
    const scene = buildClassroomSceneMap(5, states);
    expect(scene.seats.map((seat) => seat.state)).toEqual([...states, "empty"]);
  });

  it("rejects unsupported capacities and states", () => {
    expect(() => buildClassroomSceneMap(7)).toThrow(RangeError);
    expect(() => buildClassroomSceneMap(1, ["sleeping" as ClassroomSeatState])).toThrow(RangeError);
  });
});
