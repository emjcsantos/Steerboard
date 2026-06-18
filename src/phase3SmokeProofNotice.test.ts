import { describe, expect, it } from "vitest";
import {
  buildPhase3PersistedSmokeProofStorageNotice,
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
    ).toBe("Active-turn interrupt smoke passed and was persisted for Phase 3 handoff review.");
  });

  it("does not claim handoff-ready persistence from a transient pass", () => {
    expect(
      buildPhase3SmokeProofNotice({
        label: "Active-turn steer",
        passed: true,
        persisted: false
      })
    ).toBe("Active-turn steer smoke passed, but it was not persisted for Phase 3 handoff review.");
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

  it("qualifies imported persisted rows with readiness counts", () => {
    expect(
      buildPhase3PersistedSmokeProofStorageNotice({
        persistedRowCount: 2,
        readinessItems: [
          { persisted: true, state: "ready" },
          { persisted: true, state: "review" },
          { persisted: false, state: "waiting" }
        ]
      })
    ).toBe(
      "Phase 3 persisted smoke proof storage has 2 storage-proof-attested desktop proof rows for review: 1 ready, 1 review, 0 blocked"
    );
  });

  it("keeps stale or future persisted rows in review wording instead of implying readiness", () => {
    expect(
      buildPhase3PersistedSmokeProofStorageNotice({
        persistedRowCount: 1,
        readinessItems: [{ persisted: true, state: "review" }]
      })
    ).toBe(
      "Phase 3 persisted smoke proof storage has 1 storage-proof-attested desktop proof row for review: 0 ready, 1 review, 0 blocked"
    );
  });

  it("reports failed imported persistence without row-count wording", () => {
    expect(
      buildPhase3PersistedSmokeProofStorageNotice({
        persistedRowCount: 0,
        readinessItems: [{ persisted: false, state: "waiting" }]
      })
    ).toBe("Phase 3 desktop smoke proof artifact could not be persisted");
  });
});
