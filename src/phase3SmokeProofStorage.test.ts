import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadPhase3SmokeProofBundle,
  loadPhase3SmokeProofBundleWithStorageProof,
  createPhase3SmokeProofFingerprint,
  getFallbackPhase3SmokeProofBundle,
  parseStoredPhase3SmokeProofBundle,
  parseStoredPhase3SmokeProofBundleWithStorageProof,
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
  PHASE3_SMOKE_PROOF_STORAGE_KEY,
  PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
  savePhase3SmokeProofBundle
} from "./phase3SmokeProofStorage";

const fallbackBundle = getFallbackPhase3SmokeProofBundle();
const noPersistedDesktopProofs = {
  liveControlSmoke: false,
  activeTurnInterruptSmoke: false,
  activeTurnSteerSmoke: false
};

const desktopLiveControlSmoke = {
  source: "desktop",
  checkedAt: "2026-06-06T00:00:00.000Z",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Live control smoke passed.",
  sourceDetected: true,
  appServerReady: true,
  protocolReady: true,
  requiredMethods: [
    {
      method: "thread/start",
      supported: true,
      state: "supported",
      detail: "Method present."
    }
  ],
  supportedMethodCount: 1,
  unsupportedMethodCount: 0,
  totalMethodCount: 1
};

const desktopActiveTurnInterruptSmoke = {
  source: "desktop",
  checkedAt: "2026-06-06T00:00:01.000Z",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Interrupt smoke passed.",
  sessionStarted: true,
  turnIdSeen: true,
  interruptSent: true,
  interruptObserved: true,
  completed: true,
  failed: false,
  eventCount: 3,
  transcriptLength: 120,
  controls: [
    {
      control: "turn/interrupt",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Control present."
    }
  ]
};

const desktopActiveTurnSteerSmoke = {
  source: "desktop",
  checkedAt: "1780667800",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Steer smoke passed.",
  sessionStarted: true,
  turnIdSeen: true,
  steerSent: true,
  steerObserved: true,
  expectedTokenSeen: true,
  completed: true,
  failed: false,
  eventCount: 4,
  transcriptLength: 99,
  controls: [
    {
      control: "turn/steer",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Control present."
    }
  ]
};

function expectStorageProof(
  row: Record<string, unknown>,
  proof: string,
  expectedFingerprint: string
) {
  expect(row.phase3StorageProof).toMatchObject({
    source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
    proof,
    proofFingerprint: expectedFingerprint
  });
  expect(Date.parse((row.phase3StorageProof as { createdAt: string }).createdAt)).not.toBeNaN();
}

function createSmokeRecordEnvelope() {
  return {
    source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
    command: "npm.cmd run smoke:phase3",
    createdAt: "2026-06-18T07:53:31.684Z",
    runId: "phase3-smoke-record:2026-06-18T07:53:31.684Z",
    passedTestCount: 3,
    failedTestCount: 0,
    rowFingerprints: {
      liveControlSmoke: createPhase3SmokeProofFingerprint(desktopLiveControlSmoke),
      activeTurnInterruptSmoke: createPhase3SmokeProofFingerprint(desktopActiveTurnInterruptSmoke),
      activeTurnSteerSmoke: createPhase3SmokeProofFingerprint(desktopActiveTurnSteerSmoke)
    },
    bundle: {
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
    }
  };
}

describe("phase 3 smoke proof storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads safe fallback bundle when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadPhase3SmokeProofBundle()).toEqual(fallbackBundle);
    expect(loadPhase3SmokeProofBundleWithStorageProof()).toEqual({
      bundle: fallbackBundle,
      persistedDesktopProofs: noPersistedDesktopProofs
    });
  });

  it("falls back to safe defaults on malformed JSON", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "{")
      }
    });

    expect(loadPhase3SmokeProofBundle()).toEqual(fallbackBundle);
    expect(loadPhase3SmokeProofBundleWithStorageProof()).toEqual({
      bundle: fallbackBundle,
      persistedDesktopProofs: noPersistedDesktopProofs
    });
    expect(parseStoredPhase3SmokeProofBundleWithStorageProof("{")).toEqual({
      bundle: fallbackBundle,
      persistedDesktopProofs: noPersistedDesktopProofs
    });
  });

  it("repairs valid stored proofs with codex transport normalizers", () => {
    const parsed = parseStoredPhase3SmokeProofBundle(
      JSON.stringify({
        liveControlSmoke: {
          ...desktopLiveControlSmoke,
          requiredMethods: [
            { method: "thread/start", supported: true, state: "supported", detail: "" },
            { method: 123, supported: "yes", detail: [] },
            { detail: "missing method" },
            {
              method: "thread/interrupt",
              supported: false,
              state: "supported",
              detail: "No protocol entry."
            }
          ],
          supportedMethodCount: 99,
          totalMethodCount: "3",
          source: "desktop"
        },
        activeTurnInterruptSmoke: {
          ...desktopActiveTurnInterruptSmoke,
          controls: [{ control: "turn/interrupt", attempted: 1, sent: 0, observed: false, supported: "true" }],
          turnIdSeen: "true"
        },
        activeTurnSteerSmoke: {
          ...desktopActiveTurnSteerSmoke,
          controls: [
            {
              control: "turn/steer",
              attempted: 1,
              sent: 1,
              observed: 1,
              supported: 1,
              detail: null
            }
          ]
        }
      })
    );

    expect(parsed).toEqual({
      liveControlSmoke: {
        ...desktopLiveControlSmoke,
        checkedAt: desktopLiveControlSmoke.checkedAt,
        requiredMethods: [
          {
            method: "thread/start",
            supported: true,
            state: "supported",
            detail: "No control smoke method detail was returned."
          },
          {
            method: "thread/interrupt",
            supported: false,
            state: "unsupported",
            detail: "No protocol entry."
          }
        ],
        supportedMethodCount: 1,
        unsupportedMethodCount: 1,
        totalMethodCount: 2
      },
      activeTurnInterruptSmoke: {
        ...desktopActiveTurnInterruptSmoke,
        turnIdSeen: false,
        controls: [
          {
            control: "turn/interrupt",
            attempted: false,
            sent: false,
            observed: false,
            supported: false,
            detail: "No control smoke detail was returned."
          }
        ]
      },
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z",
        controls: [
          {
            control: "turn/steer",
            attempted: false,
            sent: false,
            observed: false,
            supported: false,
            detail: "No control smoke detail was returned."
          }
        ]
      }
    });
  });

  it("falls back and no-ops when localStorage read/write throws", () => {
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

    expect(loadPhase3SmokeProofBundle()).toEqual(fallbackBundle);
    expect(
      savePhase3SmokeProofBundle({
        liveControlSmoke: desktopLiveControlSmoke,
        activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
        activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
      })
    ).toEqual(fallbackBundle);
  });

  it("persists only desktop-executed rows from a partial proof bundle", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        setItem: vi.fn((_key: string, value: string) => {
          store.value = value;
          setItem(_key, value);
        }),
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: {
        source: "browser",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      },
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
    });

    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    const stored = JSON.parse(store.value ?? "{}");
    expect(stored.liveControlSmoke).toBeUndefined();
    expect(stored.activeTurnInterruptSmoke).toMatchObject(desktopActiveTurnInterruptSmoke);
    expect(stored.activeTurnSteerSmoke).toMatchObject({
      ...desktopActiveTurnSteerSmoke,
      checkedAt: "2026-06-05T13:56:40.000Z"
    });
    expectStorageProof(
      stored.activeTurnInterruptSmoke,
      "activeTurnInterruptSmoke",
      createPhase3SmokeProofFingerprint(desktopActiveTurnInterruptSmoke)
    );
    expectStorageProof(
      stored.activeTurnSteerSmoke,
      "activeTurnSteerSmoke",
      createPhase3SmokeProofFingerprint({
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      })
    );
    expect(persistedBundle).toEqual({
      ...fallbackBundle,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    });
    expect(loadPhase3SmokeProofBundle()).toEqual({
      ...fallbackBundle,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    });
  });

  it("storage-attests imported smoke bundles only when smoke-record provenance matches", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });
    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    const envelope = createSmokeRecordEnvelope();
    const persistedBundle = savePhase3SmokeProofBundle(envelope, {
      requireBundleProvenance: true
    });
    const loaded = loadPhase3SmokeProofBundleWithStorageProof();

    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    expect(persistedBundle).toEqual({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    });
    expect(loaded.persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });
    expect(parseStoredPhase3SmokeProofBundle(JSON.stringify(envelope))).toEqual({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    });
  });

  it("does not storage-attest raw desktop-shaped imports when provenance is required", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });
    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle(
      {
        liveControlSmoke: desktopLiveControlSmoke,
        activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
        activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
      },
      { requireBundleProvenance: true }
    );

    expect(setItem).not.toHaveBeenCalled();
    expect(persistedBundle).toEqual(fallbackBundle);
    expect(loadPhase3SmokeProofBundleWithStorageProof()).toEqual({
      bundle: fallbackBundle,
      persistedDesktopProofs: noPersistedDesktopProofs
    });
  });

  it("still allows direct in-app desktop smoke saves without import provenance", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });
    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
    });

    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    expect(persistedBundle.liveControlSmoke).toEqual(desktopLiveControlSmoke);
    expect(loadPhase3SmokeProofBundleWithStorageProof().persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });
  });

  it("does not attest desktop-executed rows that lack storage proof", () => {
    const result = parseStoredPhase3SmokeProofBundleWithStorageProof(
      JSON.stringify({
        liveControlSmoke: desktopLiveControlSmoke,
        activeTurnInterruptSmoke: {
          ...desktopActiveTurnInterruptSmoke,
          source: "browser"
        },
        activeTurnSteerSmoke: {
          ...desktopActiveTurnSteerSmoke,
          executed: false
        }
      })
    );

    expect(result.bundle.liveControlSmoke).toEqual(desktopLiveControlSmoke);
    expect(result.persistedDesktopProofs).toEqual({
      liveControlSmoke: false,
      activeTurnInterruptSmoke: false,
      activeTurnSteerSmoke: false
    });
  });

  it("attests only desktop-executed rows with matching storage proof", () => {
    const storedLiveControlSmoke = {
      ...desktopLiveControlSmoke,
      phase3StorageProof: {
        source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
        proof: "liveControlSmoke",
        createdAt: "2026-06-06T00:02:00.000Z",
        proofFingerprint: createPhase3SmokeProofFingerprint(desktopLiveControlSmoke)
      }
    };
    const result = parseStoredPhase3SmokeProofBundleWithStorageProof(
      JSON.stringify({
        liveControlSmoke: storedLiveControlSmoke,
        activeTurnInterruptSmoke: {
          ...desktopActiveTurnInterruptSmoke,
          source: "browser",
          phase3StorageProof: {
            source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
            proof: "activeTurnInterruptSmoke",
            createdAt: "2026-06-06T00:02:00.000Z",
            proofFingerprint: createPhase3SmokeProofFingerprint({
              ...desktopActiveTurnInterruptSmoke,
              source: "browser"
            })
          }
        },
        activeTurnSteerSmoke: {
          ...desktopActiveTurnSteerSmoke,
          executed: false,
          phase3StorageProof: {
            source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
            proof: "activeTurnSteerSmoke",
            createdAt: "2026-06-06T00:02:00.000Z",
            proofFingerprint: createPhase3SmokeProofFingerprint({
              ...desktopActiveTurnSteerSmoke,
              checkedAt: "2026-06-05T13:56:40.000Z",
              executed: false
            })
          }
        }
      })
    );

    expect(result.bundle.liveControlSmoke).toEqual(desktopLiveControlSmoke);
    expect(result.persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: false,
      activeTurnSteerSmoke: false
    });
  });

  it("rejects storage proof when the fingerprint no longer matches the normalized row", () => {
    const result = parseStoredPhase3SmokeProofBundleWithStorageProof(
      JSON.stringify({
        liveControlSmoke: {
          ...desktopLiveControlSmoke,
          detail: "Edited after storage proof was recorded.",
          phase3StorageProof: {
            source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
            proof: "liveControlSmoke",
            createdAt: "2026-06-06T00:02:00.000Z",
            proofFingerprint: createPhase3SmokeProofFingerprint(desktopLiveControlSmoke)
          }
        }
      })
    );

    expect(result.bundle.liveControlSmoke.detail).toBe(
      "Edited after storage proof was recorded."
    );
    expect(result.persistedDesktopProofs.liveControlSmoke).toBe(false);
  });

  it("returns existing persisted state when no desktop-executed row can be saved", () => {
    const store: { value: string | null } = {
      value: JSON.stringify({
        liveControlSmoke: desktopLiveControlSmoke
      })
    };
    const setItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: {
        source: "browser",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      },
      activeTurnInterruptSmoke: {
        source: "browser",
        checkedAt: null,
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      },
      activeTurnSteerSmoke: {
        source: "browser",
        checkedAt: null,
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      }
    });

    expect(setItem).not.toHaveBeenCalled();
    expect(persistedBundle).toEqual({
      ...fallbackBundle,
      liveControlSmoke: desktopLiveControlSmoke
    });
  });

  it("does not merge already stored partial rows unless storage proof matches", () => {
    const store: { value: string | null } = {
      value: JSON.stringify({
        activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke
      })
    };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });

    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: {
        source: "browser",
        checkedAt: null,
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      },
      activeTurnSteerSmoke: {
        source: "browser",
        checkedAt: null,
        executed: false,
        ok: false,
        unsupported: true,
        detail: "browser"
      }
    });

    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    const stored = JSON.parse(store.value ?? "{}");
    expect(stored.liveControlSmoke).toMatchObject(desktopLiveControlSmoke);
    expect(stored.activeTurnInterruptSmoke).toBeUndefined();
    expectStorageProof(
      stored.liveControlSmoke,
      "liveControlSmoke",
      createPhase3SmokeProofFingerprint(desktopLiveControlSmoke)
    );
    expect(persistedBundle).toEqual({
      ...fallbackBundle,
      liveControlSmoke: desktopLiveControlSmoke
    });
  });

  it("drops non-desktop rows from mixed imported proof bundles", () => {
    const store: { value: string | null } = { value: null };

    vi.stubGlobal("window", {
      localStorage: {
        setItem: vi.fn((_key: string, value: string) => {
          store.value = value;
        }),
        getItem: vi.fn(() => store.value)
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: {
        ...desktopActiveTurnInterruptSmoke,
        source: "browser"
      },
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        source: "browser"
      }
    });

    expect(loadPhase3SmokeProofBundle()).toEqual({
      ...fallbackBundle,
      liveControlSmoke: desktopLiveControlSmoke
    });
    expect(persistedBundle).toEqual({
      ...fallbackBundle,
      liveControlSmoke: desktopLiveControlSmoke
    });
  });

  it("persists and loads a desktop-executed proof bundle roundtrip", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });
    const getItem = vi.fn(() => store.value);

    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem
      }
    });

    const persistedBundle = savePhase3SmokeProofBundle({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
    });

    expect(setItem).toHaveBeenCalledWith(PHASE3_SMOKE_PROOF_STORAGE_KEY, expect.any(String));
    const stored = JSON.parse(store.value ?? "{}");
    expect(stored.liveControlSmoke).toMatchObject(desktopLiveControlSmoke);
    expect(stored.activeTurnInterruptSmoke).toMatchObject(desktopActiveTurnInterruptSmoke);
    expect(stored.activeTurnSteerSmoke).toMatchObject({
      ...desktopActiveTurnSteerSmoke,
      checkedAt: "2026-06-05T13:56:40.000Z"
    });
    expectStorageProof(
      stored.liveControlSmoke,
      "liveControlSmoke",
      createPhase3SmokeProofFingerprint(desktopLiveControlSmoke)
    );
    expectStorageProof(
      stored.activeTurnInterruptSmoke,
      "activeTurnInterruptSmoke",
      createPhase3SmokeProofFingerprint(desktopActiveTurnInterruptSmoke)
    );
    expectStorageProof(
      stored.activeTurnSteerSmoke,
      "activeTurnSteerSmoke",
      createPhase3SmokeProofFingerprint({
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      })
    );
    expect(persistedBundle).toEqual({
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    });
    expect(loadPhase3SmokeProofBundleWithStorageProof()).toEqual({
      bundle: persistedBundle,
      persistedDesktopProofs: {
        liveControlSmoke: true,
        activeTurnInterruptSmoke: true,
        activeTurnSteerSmoke: true
      }
    });

    const expectedStoredBundle = {
      liveControlSmoke: desktopLiveControlSmoke,
      activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
      activeTurnSteerSmoke: {
        ...desktopActiveTurnSteerSmoke,
        checkedAt: "2026-06-05T13:56:40.000Z"
      }
    };

    expect(loadPhase3SmokeProofBundle()).toEqual(parseStoredPhase3SmokeProofBundle(
      JSON.stringify(expectedStoredBundle)
    ));
  });

  it("parses the local Phase 3 desktop smoke proof bundle artifact", () => {
    const parsed = parseStoredPhase3SmokeProofBundle(
      JSON.stringify({
        liveControlSmoke: desktopLiveControlSmoke,
        activeTurnInterruptSmoke: desktopActiveTurnInterruptSmoke,
        activeTurnSteerSmoke: desktopActiveTurnSteerSmoke
      })
    );

    expect(parsed.liveControlSmoke).toEqual(desktopLiveControlSmoke);
    expect(parsed.activeTurnInterruptSmoke).toEqual(desktopActiveTurnInterruptSmoke);
    expect(parsed.activeTurnSteerSmoke).toMatchObject({
      source: "desktop",
      executed: true,
      ok: true,
      checkedAt: "2026-06-05T13:56:40.000Z"
    });
  });

  it("is immutable and does not mutate inputs on parse or save", () => {
    const liveControl = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:00.000Z",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "Live control smoke passed.",
      sourceDetected: true,
      appServerReady: true,
      protocolReady: true,
      requiredMethods: [
        {
          method: "thread/start",
          supported: true,
          state: "supported",
          detail: "Method present."
        }
      ],
      supportedMethodCount: 1,
      unsupportedMethodCount: 0,
      totalMethodCount: 1
    };

    const activeTurnInterrupt = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:01.000Z",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "Interrupt smoke passed.",
      sessionStarted: true,
      turnIdSeen: true,
      interruptSent: true,
      interruptObserved: true,
      completed: true,
      failed: false,
      eventCount: 3,
      transcriptLength: 120,
      controls: [
        {
          control: "turn/interrupt",
          attempted: true,
          sent: true,
          observed: true,
          supported: true,
          detail: "Control present."
        }
      ]
    };

    const activeTurnSteer = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:02.000Z",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "Steer smoke passed.",
      sessionStarted: true,
      turnIdSeen: true,
      steerSent: true,
      steerObserved: true,
      expectedTokenSeen: true,
      completed: true,
      failed: false,
      eventCount: 4,
      transcriptLength: 99,
      controls: [
        {
          control: "turn/steer",
          attempted: true,
          sent: true,
          observed: true,
          supported: true,
          detail: "Control present."
        }
      ]
    };

    const liveCopy = JSON.parse(JSON.stringify(liveControl));
    const interruptCopy = JSON.parse(JSON.stringify(activeTurnInterrupt));
    const steerCopy = JSON.parse(JSON.stringify(activeTurnSteer));

    parseStoredPhase3SmokeProofBundle(
      JSON.stringify({
        liveControlSmoke: liveControl,
        activeTurnInterruptSmoke: activeTurnInterrupt,
        activeTurnSteerSmoke: activeTurnSteer
      })
    );
    savePhase3SmokeProofBundle({
      liveControlSmoke: liveControl,
      activeTurnInterruptSmoke: activeTurnInterrupt,
      activeTurnSteerSmoke: activeTurnSteer
    });

    expect(liveControl).toEqual(liveCopy);
    expect(activeTurnInterrupt).toEqual(interruptCopy);
    expect(activeTurnSteer).toEqual(steerCopy);
  });
});
