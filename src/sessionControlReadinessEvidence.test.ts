import { describe, expect, it } from "vitest";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";

describe("session control readiness evidence", () => {
  it("returns ready with live controls and explicitly unsupported lifecycle controls", () => {
    const result = buildSessionControlReadinessEvidence({
      interrupt: { state: "live" },
      retry: { state: "live" },
      steer: { state: "live" },
      fork: { state: "unsupported" },
      resume: { state: "unsupported" },
      archive: { state: "unsupported" }
    });

    expect(result.state).toBe("ready");
    expect(result.pass).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.statusLabel).toBe("Ready");
    expect(result.counts).toEqual({
      live: 3,
      review: 0,
      unsupported: 3,
      blocked: 0
    });
    expect(result.detail).toContain("lifecycle controls are honestly unsupported");
    expect(result.detail).toContain("fork");
    expect(result.detail).toContain("resume");
    expect(result.detail).toContain("archive");
    expect(result.controlStates.fork).toBe("unsupported");
    expect(result.controlStates.resume).toBe("unsupported");
    expect(result.controlStates.archive).toBe("unsupported");
  });

  it("returns ready when required controls are transcript-evidenced across prior states", () => {
    const result = buildSessionControlReadinessEvidence(
      {
        interrupt: { state: "disabled" },
        retry: { state: "live" },
        steer: { state: "disabled" },
        fork: { state: "unsupported" },
        resume: { state: "unsupported" },
        archive: { state: "unsupported" }
      },
      {
        transcriptMessages: [
          { meta: "interrupted", body: "Interrupt observed for the active turn." },
          { meta: "retry", body: "Retry completed for the last prompt." },
          { meta: "steer", body: "Steer observed for a running turn." }
        ]
      }
    );

    expect(result.state).toBe("ready");
    expect(result.pass).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.counts).toEqual({
      live: 1,
      review: 2,
      unsupported: 3,
      blocked: 0
    });
  });

  it("returns review when active controls are partially evidenced", () => {
    const result = buildSessionControlReadinessEvidence(
      {
        interrupt: { state: "live" },
        retry: { state: "disabled" },
        "follow-up": { state: "disabled" },
        fork: { state: "unsupported" }
      },
      {
        controlEvidence: {
          retry: true
        },
        transcriptMessages: [
          {
            body: "owner asked to retry the last prompt"
          }
        ]
      }
    );

    expect(result.state).toBe("review");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(65);
    expect(result.counts).toEqual({
      live: 1,
      review: 2,
      unsupported: 1,
      blocked: 0
    });
  });

  it("returns review when lifecycle controls are missing instead of honestly unsupported", () => {
    const result = buildSessionControlReadinessEvidence(
      {
        interrupt: { state: "live" },
        retry: { state: "live" },
        steer: { state: "live" }
      },
      {
        transcriptMessages: [
          { body: "interrupt retry steer" }
        ]
      }
    );

    expect(result.state).toBe("review");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(65);
    expect(result.controlStates.fork).toBe("waiting");
    expect(result.controlStates.resume).toBe("waiting");
    expect(result.controlStates.archive).toBe("waiting");
    expect(result.counts).toEqual({
      live: 3,
      review: 0,
      unsupported: 0,
      blocked: 0
    });
  });

  it("returns explicit per-control state naming for missing lifecycle controls", () => {
    const result = buildSessionControlReadinessEvidence(
      {
        interrupt: { state: "live" },
        retry: { state: "live" },
        steer: "live"
      },
      {
        controlEvidence: {
          retry: true
        }
      }
    );

    expect(result.state).toBe("review");
    expect(result.controlStates).toEqual({
      interrupt: "live",
      retry: "live",
      steer: "live",
      fork: "waiting",
      resume: "waiting",
      archive: "waiting"
    });
    expect(result.detail).toContain("Snapshot detail:");
    expect(result.detail).toContain("fork");
    expect(result.detail).toContain("resume");
    expect(result.detail).toContain("archive");
    expect(result.detail).toContain("waiting");
  });

  it("returns blocked when any control is blocked", () => {
    const result = buildSessionControlReadinessEvidence({
      interrupt: { state: "live" },
      retry: { state: "blocked", reason: "blocked by provider feedback" },
      steer: { state: "live" },
      fork: { state: "unsupported" },
      resume: { state: "unsupported" },
      archive: { state: "unsupported" }
    });

    expect(result.state).toBe("blocked");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(15);
    expect(result.counts).toEqual({
      live: 2,
      review: 0,
      unsupported: 3,
      blocked: 1
    });
  });

  it("returns waiting for malformed input", () => {
    const result = buildSessionControlReadinessEvidence("not-an-object");

    expect(result.state).toBe("waiting");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(35);
    expect(result.statusLabel).toBe("Waiting");
    expect(result.counts).toEqual({
      live: 0,
      review: 0,
      unsupported: 0,
      blocked: 0
    });
  });

  it("does not mutate input controls, transcript, or evidence", () => {
    const controls = {
      interrupt: { state: "live" },
      retry: { state: "disabled" },
      steer: { state: "disabled" },
      fork: { state: "unsupported" },
      resume: { state: "unsupported" },
      archive: { state: "unsupported" }
    };
    const transcript = [{ body: "interrupted user prompt" }];
    const controlEvidence = { retry: true };

    const controlsCopy = JSON.parse(JSON.stringify(controls));
    const transcriptCopy = JSON.parse(JSON.stringify(transcript));
    const controlEvidenceCopy = JSON.parse(JSON.stringify(controlEvidence));

    buildSessionControlReadinessEvidence(controls, {
      controlEvidence,
      transcriptMessages: transcript
    });

    expect(controls).toEqual(controlsCopy);
    expect(transcript).toEqual(transcriptCopy);
    expect(controlEvidence).toEqual(controlEvidenceCopy);
  });
});
