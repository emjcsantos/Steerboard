import { describe, expect, it } from "vitest";
import {
  buildPhase3SmokeProofNotice,
  countPersistedPhase3SmokeProofRows
} from "./phase3SmokeProofNotice";

describe("phase 3 smoke proof notices", () => {
  it("reports passed proof only when it was also persisted", () => {
    expect(
      buildPhase3SmokeProofNotice({
        label: "Active-turn interrupt",
        passed: true,
        persisted: true
      })
    ).toBe("Active-turn interrupt smoke passed and was persisted for Phase 3 handoff.");
  });

  it("does not claim handoff-ready persistence from a transient pass", () => {
    expect(
      buildPhase3SmokeProofNotice({
        label: "Active-turn steer",
        passed: true,
        persisted: false
      })
    ).toBe("Active-turn steer smoke passed, but it was not persisted for Phase 3 handoff.");
  });

  it("reports failed proof without implying persistence", () => {
    expect(
      buildPhase3SmokeProofNotice({
        label: "Live-control",
        passed: false,
        persisted: true
      })
    ).toBe("Live-control smoke did not pass.");
  });

  it("counts persisted smoke proof rows from storage attestation", () => {
    expect(
      countPersistedPhase3SmokeProofRows({
        liveControlSmoke: true,
        activeTurnInterruptSmoke: false,
        activeTurnSteerSmoke: true
      })
    ).toBe(2);
  });
});
