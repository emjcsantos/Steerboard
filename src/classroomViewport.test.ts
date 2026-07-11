import { describe, expect, it } from "vitest";
import {
  classroomSemanticZoom, fitClassroomViewport, manipulateClassroomViewport,
  normalizeClassroomViewport, parseClassroomViewport, resetClassroomViewport
} from "./classroomViewport";

describe("classroom viewport", () => {
  it("repairs malformed and bounds persisted viewport state", () => {
    expect(normalizeClassroomViewport({ zoom: 9, panX: -4, panY: "bad", fitMode: "manual" }))
      .toEqual({ zoom: 1.8, panX: -1, panY: 0, fitMode: "manual" });
    expect(parseClassroomViewport("not-json")).toEqual({ zoom: 1, panX: 0, panY: 0, fitMode: "auto" });
  });

  it("stops auto fit after any manual viewport manipulation", () => {
    expect(manipulateClassroomViewport(fitClassroomViewport(), { zoom: 1.2 }).fitMode).toBe("manual");
    expect(manipulateClassroomViewport(fitClassroomViewport(), { panX: 0.2 }).fitMode).toBe("manual");
  });

  it("distinguishes fit from reset and provides semantic zoom tiers", () => {
    expect(fitClassroomViewport().fitMode).toBe("auto");
    expect(resetClassroomViewport().fitMode).toBe("manual");
    expect(classroomSemanticZoom(0.7)).toBe("overview");
    expect(classroomSemanticZoom(1)).toBe("standard");
    expect(classroomSemanticZoom(1.4)).toBe("detail");
  });
});
