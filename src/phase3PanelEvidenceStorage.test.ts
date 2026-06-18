import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPhase3PanelEvidenceFingerprint,
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  parseStoredPhase3SessionControlEvidenceByPanel,
  parseStoredPhase3SlashEvidenceByPanel,
  PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY,
  PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE,
  PHASE3_SLASH_EVIDENCE_STORAGE_KEY,
  savePhase3SessionControlEvidenceByPanel,
  savePhase3SlashEvidenceByPanel,
  shouldSavePhase3PanelEvidence,
  type Phase3SessionControlEvidenceByPanel,
  type Phase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";

const slashEvidence: Phase3SlashEvidenceByPanel = {
  "panel-1": {
    route: "provider",
    state: "ready",
    executable: true,
    command: "/review",
    status: "Ready",
    readiness: 100,
    pass: true,
    detail: "Provider route and live transcript evidence are attached.",
    safety: "Evidence only.",
    evidence: {
      providerRoute: 1,
      status: 1,
      live: 0,
      error: 0
    }
  }
};

const sessionEvidence: Phase3SessionControlEvidenceByPanel = {
  "panel-1": {
    state: "ready",
    readiness: 100,
    pass: true,
    statusLabel: "Ready",
    detail: "Session controls are evidenced.",
    safety: "Evidence only.",
    counts: {
      live: 3,
      review: 0,
      unsupported: 3,
      blocked: 0
    },
    controlStates: {
      interrupt: "live",
      retry: "live",
      steer: "live",
      fork: "unsupported",
      resume: "unsupported",
      archive: "unsupported"
    }
  }
};

function withStorageProof<T extends object>(
  panelId: string,
  evidence: T,
  createdAt = "2026-06-06T00:00:30.000Z"
): T & {
  phase3StorageProof: {
    source: string;
    panelId: string;
    createdAt: string;
    evidenceFingerprint: string;
  };
} {
  return {
    ...evidence,
    phase3StorageProof: {
      source: PHASE3_PANEL_EVIDENCE_STORAGE_PROOF_SOURCE,
      panelId,
      createdAt,
      evidenceFingerprint: createPhase3PanelEvidenceFingerprint(evidence)
    }
  };
}

describe("phase 3 panel evidence storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses stored slash and session-control evidence by panel", () => {
    expect(parseStoredPhase3SlashEvidenceByPanel(JSON.stringify(slashEvidence))).toEqual(slashEvidence);
    expect(parseStoredPhase3SessionControlEvidenceByPanel(JSON.stringify(sessionEvidence))).toEqual(sessionEvidence);
  });

  it("preserves matching Phase 3 storage proof and drops mismatched proof", () => {
    const stampedSlash = withStorageProof("panel-1", slashEvidence["panel-1"]);
    const stampedSession = withStorageProof("panel-1", sessionEvidence["panel-1"]);
    const mismatchedSlash = {
      ...stampedSlash,
      phase3StorageProof: {
        ...stampedSlash.phase3StorageProof,
        evidenceFingerprint: "phase3-panel-bad"
      }
    };

    expect(
      parseStoredPhase3SlashEvidenceByPanel(JSON.stringify({ "panel-1": stampedSlash }))
    ).toEqual({ "panel-1": stampedSlash });
    expect(
      parseStoredPhase3SessionControlEvidenceByPanel(JSON.stringify({ "panel-1": stampedSession }))
    ).toEqual({ "panel-1": stampedSession });
    expect(
      parseStoredPhase3SlashEvidenceByPanel(JSON.stringify({ "panel-1": mismatchedSlash }))
    ).toEqual({ "panel-1": slashEvidence["panel-1"] });
  });

  it("drops malformed panel evidence and normalizes derived fields", () => {
    const parsedSlash = parseStoredPhase3SlashEvidenceByPanel(
      JSON.stringify({
        "panel-1": {
          ...slashEvidence["panel-1"],
          readiness: 142.5,
          evidence: {
            providerRoute: 1.7,
            status: -1,
            live: 2,
            error: 0
          }
        },
        broken: {
          route: "provider",
          state: "ready"
        }
      })
    );
    const parsedSession = parseStoredPhase3SessionControlEvidenceByPanel(
      JSON.stringify({
        "panel-1": {
          ...sessionEvidence["panel-1"],
          readiness: -10,
          controlStates: {
            ...sessionEvidence["panel-1"].controlStates,
            fork: "bad-state"
          }
        },
        broken: {
          state: "ready"
        }
      })
    );

    expect(Object.keys(parsedSlash)).toEqual(["panel-1"]);
    expect(parsedSlash["panel-1"].readiness).toBe(100);
    expect(parsedSlash["panel-1"].evidence.providerRoute).toBe(1);
    expect(parsedSlash["panel-1"].evidence.status).toBe(0);
    expect(Object.keys(parsedSession)).toEqual(["panel-1"]);
    expect(parsedSession["panel-1"].state).toBe("review");
    expect(parsedSession["panel-1"].readiness).toBe(65);
    expect(parsedSession["panel-1"].controlStates.fork).toBe("waiting");
  });

  it("downgrades internally inconsistent ready slash or session-control evidence", () => {
    const parsedSlash = parseStoredPhase3SlashEvidenceByPanel(
      JSON.stringify({
        "panel-1": {
          ...slashEvidence["panel-1"],
          evidence: {
            providerRoute: 0,
            status: 0,
            live: 0,
            error: 0
          }
        }
      })
    );
    const parsedSession = parseStoredPhase3SessionControlEvidenceByPanel(
      JSON.stringify({
        "panel-1": {
          ...sessionEvidence["panel-1"],
          counts: {
            live: 0,
            review: 0,
            unsupported: 0,
            blocked: 0
          },
          controlStates: {
            interrupt: "waiting",
            retry: "waiting",
            steer: "waiting",
            fork: "waiting",
            resume: "waiting",
            archive: "waiting"
          }
        }
      })
    );

    expect(parsedSlash["panel-1"]).toMatchObject({
      state: "review",
      pass: false,
      readiness: 40
    });
    expect(parsedSession["panel-1"]).toMatchObject({
      state: "waiting",
      pass: false,
      readiness: 35,
      counts: {
        live: 0,
        review: 0,
        unsupported: 0,
        blocked: 0
      }
    });
  });

  it("saves and loads through localStorage", () => {
    const store = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store.set(key, value);
        })
      }
    });

    const savedSlashEvidence = savePhase3SlashEvidenceByPanel(slashEvidence, {
      createdAt: "2026-06-06T00:00:30.000Z"
    });
    const savedSessionEvidence = savePhase3SessionControlEvidenceByPanel(sessionEvidence, {
      createdAt: "2026-06-06T00:00:30.000Z"
    });
    const stampedSlashEvidence = {
      "panel-1": withStorageProof("panel-1", slashEvidence["panel-1"])
    };
    const stampedSessionEvidence = {
      "panel-1": withStorageProof("panel-1", sessionEvidence["panel-1"])
    };

    expect(store.get(PHASE3_SLASH_EVIDENCE_STORAGE_KEY)).toBe(JSON.stringify(stampedSlashEvidence));
    expect(store.get(PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY)).toBe(JSON.stringify(stampedSessionEvidence));
    expect(savedSlashEvidence).toEqual(stampedSlashEvidence);
    expect(savedSessionEvidence).toEqual(stampedSessionEvidence);
    expect(loadPhase3SlashEvidenceByPanel()).toEqual(stampedSlashEvidence);
    expect(loadPhase3SessionControlEvidenceByPanel()).toEqual(stampedSessionEvidence);
  });

  it("persists only ready slash and session-control evidence", () => {
    const store = new Map<string, string>();
    const reviewSlash: Phase3SlashEvidenceByPanel = {
      "panel-1": {
        ...slashEvidence["panel-1"],
        state: "review",
        pass: false,
        readiness: 40
      }
    };
    const reviewSession: Phase3SessionControlEvidenceByPanel = {
      "panel-1": {
        ...sessionEvidence["panel-1"],
        state: "review",
        pass: false,
        readiness: 65
      }
    };

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store.set(key, value);
        })
      }
    });

    savePhase3SlashEvidenceByPanel(reviewSlash);
    savePhase3SessionControlEvidenceByPanel(reviewSession);

    expect(store.get(PHASE3_SLASH_EVIDENCE_STORAGE_KEY)).toBe("{}");
    expect(store.get(PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY)).toBe("{}");
  });

  it("refreshes unchanged ready evidence when its Phase 3 storage proof is missing or stale", () => {
    const readySlash = slashEvidence["panel-1"];
    const stampedSlash = withStorageProof(
      "panel-1",
      readySlash,
      "2026-06-06T00:00:30.000Z"
    );
    const freshOptions = {
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      maxAgeMs: 24 * 60 * 60 * 1000
    };
    const staleOptions = {
      evaluatedAt: "2026-06-07T00:00:31.000Z",
      maxAgeMs: 24 * 60 * 60 * 1000
    };

    expect(
      shouldSavePhase3PanelEvidence("panel-1", readySlash, readySlash, true, freshOptions)
    ).toBe(true);
    expect(
      shouldSavePhase3PanelEvidence("panel-1", stampedSlash, readySlash, true, freshOptions)
    ).toBe(false);
    expect(
      shouldSavePhase3PanelEvidence("panel-1", stampedSlash, readySlash, true, staleOptions)
    ).toBe(true);
    expect(
      shouldSavePhase3PanelEvidence("panel-2", stampedSlash, readySlash, true, freshOptions)
    ).toBe(true);
  });

  it("does not refresh unchanged non-ready evidence only to create storage proof", () => {
    const reviewSlash = {
      ...slashEvidence["panel-1"],
      state: "review" as const,
      pass: false,
      readiness: 40
    };

    expect(
      shouldSavePhase3PanelEvidence("panel-1", reviewSlash, reviewSlash, true, {
        evaluatedAt: "2026-06-06T00:01:00.000Z"
      })
    ).toBe(false);
    expect(
      shouldSavePhase3PanelEvidence("panel-1", reviewSlash, slashEvidence["panel-1"], false, {
        evaluatedAt: "2026-06-06T00:01:00.000Z"
      })
    ).toBe(true);
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase3SlashEvidenceByPanel()).toEqual({});
    expect(loadPhase3SessionControlEvidenceByPanel()).toEqual({});
    expect(() => savePhase3SlashEvidenceByPanel(slashEvidence)).not.toThrow();
    expect(() => savePhase3SessionControlEvidenceByPanel(sessionEvidence)).not.toThrow();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        })
      }
    });

    expect(loadPhase3SlashEvidenceByPanel()).toEqual({});
    expect(loadPhase3SessionControlEvidenceByPanel()).toEqual({});
    expect(() => savePhase3SlashEvidenceByPanel(slashEvidence)).not.toThrow();
    expect(() => savePhase3SessionControlEvidenceByPanel(sessionEvidence)).not.toThrow();
  });
});
