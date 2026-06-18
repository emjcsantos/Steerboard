import { afterEach, describe, expect, it, vi } from "vitest";
import { importPhase3SmokeProofBundleArtifact } from "./phase3SmokeProofImport";
import {
  createPhase3SmokeProofFingerprint,
  loadPhase3SmokeProofBundleWithStorageProof,
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
  PHASE3_SMOKE_PROOF_STORAGE_KEY
} from "./phase3SmokeProofStorage";

const liveControlSmoke = {
  source: "desktop",
  checkedAt: "1781769450476",
  executed: true,
  ok: true,
  completed: true,
  unsupported: false,
  detail: "Live-control proof passed.",
  sourceDetected: true,
  appServerReady: true,
  protocolReady: true,
  requiredMethods: [
    {
      method: "thread/start",
      supported: true,
      state: "supported",
      detail: "Thread creation protocol schema is present."
    }
  ],
  supportedMethodCount: 1,
  unsupportedMethodCount: 0,
  totalMethodCount: 1
};

const activeTurnInterruptSmoke = {
  source: "desktop",
  checkedAt: "1781769429511",
  completed: true,
  controls: [
    {
      attempted: true,
      control: "turn/interrupt",
      detail: "Sent turn/interrupt request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn interrupt command was sent.",
  eventCount: 23,
  executed: true,
  failed: false,
  interruptObserved: false,
  interruptSent: true,
  ok: true,
  sessionStarted: true,
  transcriptLength: 33,
  turnIdSeen: true,
  unsupported: false
};

const activeTurnSteerSmoke = {
  source: "desktop",
  checkedAt: "1781769438295",
  completed: false,
  controls: [
    {
      attempted: true,
      control: "turn/steer",
      detail: "Sent turn/steer request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn steer command was sent.",
  eventCount: 12,
  executed: true,
  expectedTokenSeen: false,
  failed: false,
  ok: true,
  sessionStarted: true,
  steerObserved: false,
  steerSent: true,
  transcriptLength: 0,
  turnIdSeen: true,
  unsupported: false
};

function createStore() {
  const store = new Map<string, string>();
  const setItem = vi.fn((key: string, value: string) => {
    store.set(key, value);
  });
  const getItem = vi.fn((key: string) => store.get(key) ?? null);
  vi.stubGlobal("window", {
    localStorage: {
      getItem,
      setItem,
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      })
    }
  });

  return { store, setItem, getItem };
}

function rawBundle() {
  return {
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  };
}

function provenanceEnvelope() {
  const bundle = rawBundle();

  return {
    source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
    command: "npm.cmd run smoke:phase3",
    createdAt: "2026-06-18T07:57:30.551Z",
    runId: "phase3-smoke-record:2026-06-18T07:57:30.551Z",
    passedTestCount: 3,
    failedTestCount: 0,
    rowFingerprints: {
      liveControlSmoke: createPhase3SmokeProofFingerprint(bundle.liveControlSmoke),
      activeTurnInterruptSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnSteerSmoke)
    },
    bundle
  };
}

describe("phase 3 smoke proof import", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed import payloads before storage attestation", () => {
    const { setItem } = createStore();
    const result = importPhase3SmokeProofBundleArtifact("{");

    expect(result).toEqual({
      imported: false,
      notice: "Phase 3 desktop smoke proof artifact could not be imported"
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("does not storage-attest raw desktop-shaped file imports without smoke-record provenance", () => {
    const { setItem } = createStore();
    const result = importPhase3SmokeProofBundleArtifact(JSON.stringify(rawBundle()));

    expect(result.imported).toBe(false);
    expect(result.notice).toBe(
      "Phase 3 desktop smoke proof artifact needs smoke-record provenance before storage attestation"
    );
    expect(setItem).not.toHaveBeenCalled();
  });

  it("imports a provenance-wrapped local_private smoke bundle and persists attested rows across reload", () => {
    const { setItem, store } = createStore();
    const result = importPhase3SmokeProofBundleArtifact(
      JSON.stringify(provenanceEnvelope()),
      "2026-06-18T07:58:00.000Z"
    );

    expect(result.imported).toBe(true);
    expect(result.notice).toContain("3 storage-proof-attested desktop proof rows");
    expect(result.persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });
    expect(result.readiness?.state).toBe("ready");
    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    expect(store.get(PHASE3_SMOKE_PROOF_STORAGE_KEY)).toContain("phase3StorageProof");

    expect(loadPhase3SmokeProofBundleWithStorageProof().persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });
  });
});
