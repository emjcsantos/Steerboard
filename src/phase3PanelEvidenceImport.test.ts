import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPhase3PanelEvidenceImportAction } from "./phase3PanelEvidenceImport";
import {
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY,
  PHASE3_SLASH_EVIDENCE_STORAGE_KEY,
  type Phase3SessionControlEvidenceByPanel,
  type Phase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";

const createdAt = "2026-06-20T00:00:00.000Z";

function readyArtifact() {
  return JSON.stringify({
    source: "steerboard.phase3.panel-evidence-record.v1",
    createdAt,
    panelId: "artifact-panel",
    slashEvidence: {
      route: "provider",
      state: "ready",
      executable: true,
      command: "/plan",
      status: "Ready",
      readiness: 100,
      pass: true,
      detail: "Provider-routed slash proof.",
      safety: "No command execution is performed by this evidence builder.",
      evidence: {
        providerRoute: 1,
        status: 0,
        live: 1,
        error: 0
      }
    },
    sessionControlEvidence: {
      state: "ready",
      readiness: 100,
      pass: true,
      statusLabel: "Ready",
      detail: "Session controls are ready.",
      safety: "No session-control execution or runtime mutation is performed.",
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
  });
}

describe("phase 3 panel evidence import", () => {
  let store: Map<string, string>;
  let slashState: Phase3SlashEvidenceByPanel;
  let sessionState: Phase3SessionControlEvidenceByPanel;
  let proofEvaluationTime = "";

  beforeEach(() => {
    store = new Map<string, string>();
    slashState = {};
    sessionState = {};
    proofEvaluationTime = "";
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store.set(key, value);
        })
      }
    });
  });

  it("imports ready slash and session evidence into the focused panel with storage proof", () => {
    const result = runPhase3PanelEvidenceImportAction(readyArtifact(), {
      currentPanelId: "focused-panel",
      setSlashEvidenceByPanel: (updater) => {
        slashState = updater(slashState);
      },
      setSessionControlEvidenceByPanel: (updater) => {
        sessionState = updater(sessionState);
      },
      setProofEvaluationTime: (value) => {
        proofEvaluationTime = value;
      }
    });

    expect(result).toMatchObject({ imported: true, panelId: "focused-panel" });
    expect(proofEvaluationTime).toBe(createdAt);
    expect(slashState["focused-panel"].phase3StorageProof).toMatchObject({
      panelId: "focused-panel",
      createdAt
    });
    expect(sessionState["focused-panel"].phase3StorageProof).toMatchObject({
      panelId: "focused-panel",
      createdAt
    });
    expect(store.get(PHASE3_SLASH_EVIDENCE_STORAGE_KEY)).toContain("focused-panel");
    expect(store.get(PHASE3_SESSION_CONTROL_EVIDENCE_STORAGE_KEY)).toContain("focused-panel");
    expect(loadPhase3SlashEvidenceByPanel()["focused-panel"].pass).toBe(true);
    expect(loadPhase3SessionControlEvidenceByPanel()["focused-panel"].pass).toBe(true);
  });

  it("rejects artifacts without ready provider-routed slash proof", () => {
    const artifact = JSON.parse(readyArtifact());
    artifact.slashEvidence.evidence.providerRoute = 0;

    const result = runPhase3PanelEvidenceImportAction(JSON.stringify(artifact), {
      currentPanelId: "focused-panel",
      setSlashEvidenceByPanel: (updater) => {
        slashState = updater(slashState);
      },
      setSessionControlEvidenceByPanel: (updater) => {
        sessionState = updater(sessionState);
      },
      setProofEvaluationTime: (value) => {
        proofEvaluationTime = value;
      }
    });

    expect(result.imported).toBe(false);
    expect(slashState).toEqual({});
    expect(sessionState).toEqual({});
  });
});
