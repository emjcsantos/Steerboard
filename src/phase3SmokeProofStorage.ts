import {
  getFallbackCodexActiveTurnControlSmokeProof,
  getFallbackCodexActiveTurnSteerSmokeProof,
  getFallbackCodexLiveControlSmokeProof,
  normalizeCodexActiveTurnControlSmokeProof,
  normalizeCodexActiveTurnSteerSmokeProof,
  normalizeCodexLiveControlSmokeProof,
  type CodexActiveTurnControlSmokeProof,
  type CodexActiveTurnSteerSmokeProof,
  type CodexLiveControlSmokeProof
} from "./codexTransportSpike";

export const PHASE3_SMOKE_PROOF_STORAGE_KEY = "steerboard.phase3.smoke.proofs.v1";

export interface Phase3SmokeProofBundle {
  readonly liveControlSmoke: CodexLiveControlSmokeProof;
  readonly activeTurnInterruptSmoke: CodexActiveTurnControlSmokeProof;
  readonly activeTurnSteerSmoke: CodexActiveTurnSteerSmokeProof;
}

export interface Phase3SmokeProofBundleInput {
  liveControlSmoke?: unknown;
  activeTurnInterruptSmoke?: unknown;
  activeTurnSteerSmoke?: unknown;
}

export interface Phase3PersistedDesktopProofs {
  readonly liveControlSmoke: boolean;
  readonly activeTurnInterruptSmoke: boolean;
  readonly activeTurnSteerSmoke: boolean;
}

export interface Phase3SmokeProofBundleWithStorageProof {
  readonly bundle: Phase3SmokeProofBundle;
  readonly persistedDesktopProofs: Phase3PersistedDesktopProofs;
}

type MutablePhase3SmokeProofBundle = {
  -readonly [Key in keyof Phase3SmokeProofBundle]?: Phase3SmokeProofBundle[Key];
};

export function getFallbackPhase3SmokeProofBundle(): Phase3SmokeProofBundle {
  return {
    liveControlSmoke: getFallbackCodexLiveControlSmokeProof(),
    activeTurnInterruptSmoke: getFallbackCodexActiveTurnControlSmokeProof(),
    activeTurnSteerSmoke: getFallbackCodexActiveTurnSteerSmokeProof()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPersistableDesktopExecutedProof(
  proof: { source: string; executed: boolean }
): proof is { source: "desktop"; executed: true } {
  return proof.source === "desktop" && proof.executed === true;
}

function emptyPersistedDesktopProofs(): Phase3PersistedDesktopProofs {
  return {
    liveControlSmoke: false,
    activeTurnInterruptSmoke: false,
    activeTurnSteerSmoke: false
  };
}

function attestPersistedDesktopProofs(
  bundle: Phase3SmokeProofBundle
): Phase3PersistedDesktopProofs {
  return {
    liveControlSmoke: isPersistableDesktopExecutedProof(bundle.liveControlSmoke),
    activeTurnInterruptSmoke: isPersistableDesktopExecutedProof(bundle.activeTurnInterruptSmoke),
    activeTurnSteerSmoke: isPersistableDesktopExecutedProof(bundle.activeTurnSteerSmoke)
  };
}

function readFromLocalStorage(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(key);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem?.(key, value);
    return true;
  } catch {
    return false;
  }
}

export function parseStoredPhase3SmokeProofBundle(
  serialized: string | null
): Phase3SmokeProofBundle {
  if (!serialized) {
    return getFallbackPhase3SmokeProofBundle();
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return getFallbackPhase3SmokeProofBundle();
    }

    return {
      liveControlSmoke: normalizeCodexLiveControlSmokeProof(parsed.liveControlSmoke),
      activeTurnInterruptSmoke: normalizeCodexActiveTurnControlSmokeProof(parsed.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: normalizeCodexActiveTurnSteerSmokeProof(parsed.activeTurnSteerSmoke)
    };
  } catch {
    return getFallbackPhase3SmokeProofBundle();
  }
}

export function parseStoredPhase3SmokeProofBundleWithStorageProof(
  serialized: string | null
): Phase3SmokeProofBundleWithStorageProof {
  if (!serialized) {
    return {
      bundle: getFallbackPhase3SmokeProofBundle(),
      persistedDesktopProofs: emptyPersistedDesktopProofs()
    };
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return {
        bundle: getFallbackPhase3SmokeProofBundle(),
        persistedDesktopProofs: emptyPersistedDesktopProofs()
      };
    }

    const bundle = {
      liveControlSmoke: normalizeCodexLiveControlSmokeProof(parsed.liveControlSmoke),
      activeTurnInterruptSmoke: normalizeCodexActiveTurnControlSmokeProof(parsed.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: normalizeCodexActiveTurnSteerSmokeProof(parsed.activeTurnSteerSmoke)
    };

    return {
      bundle,
      persistedDesktopProofs: attestPersistedDesktopProofs(bundle)
    };
  } catch {
    return {
      bundle: getFallbackPhase3SmokeProofBundle(),
      persistedDesktopProofs: emptyPersistedDesktopProofs()
    };
  }
}

export function loadPhase3SmokeProofBundle(): Phase3SmokeProofBundle {
  return parseStoredPhase3SmokeProofBundle(readFromLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY));
}

export function loadPhase3SmokeProofBundleWithStorageProof(): Phase3SmokeProofBundleWithStorageProof {
  return parseStoredPhase3SmokeProofBundleWithStorageProof(
    readFromLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY)
  );
}

export function savePhase3SmokeProofBundle(
  bundle: Phase3SmokeProofBundleInput
): Phase3SmokeProofBundle {
  const storedBundle = parseStoredPhase3SmokeProofBundle(
    readFromLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY)
  );
  const liveControlSmoke = normalizeCodexLiveControlSmokeProof(bundle?.liveControlSmoke);
  const activeTurnInterruptSmoke = normalizeCodexActiveTurnControlSmokeProof(bundle?.activeTurnInterruptSmoke);
  const activeTurnSteerSmoke = normalizeCodexActiveTurnSteerSmokeProof(bundle?.activeTurnSteerSmoke);
  const nextBundle: MutablePhase3SmokeProofBundle = {};
  let acceptedInputRow = false;

  if (isPersistableDesktopExecutedProof(liveControlSmoke)) {
    nextBundle.liveControlSmoke = liveControlSmoke;
    acceptedInputRow = true;
  } else if (isPersistableDesktopExecutedProof(storedBundle.liveControlSmoke)) {
    nextBundle.liveControlSmoke = storedBundle.liveControlSmoke;
  }

  if (isPersistableDesktopExecutedProof(activeTurnInterruptSmoke)) {
    nextBundle.activeTurnInterruptSmoke = activeTurnInterruptSmoke;
    acceptedInputRow = true;
  } else if (isPersistableDesktopExecutedProof(storedBundle.activeTurnInterruptSmoke)) {
    nextBundle.activeTurnInterruptSmoke = storedBundle.activeTurnInterruptSmoke;
  }

  if (isPersistableDesktopExecutedProof(activeTurnSteerSmoke)) {
    nextBundle.activeTurnSteerSmoke = activeTurnSteerSmoke;
    acceptedInputRow = true;
  } else if (isPersistableDesktopExecutedProof(storedBundle.activeTurnSteerSmoke)) {
    nextBundle.activeTurnSteerSmoke = storedBundle.activeTurnSteerSmoke;
  }

  if (!acceptedInputRow || Object.keys(nextBundle).length === 0) {
    return storedBundle;
  }

  const serialized = JSON.stringify(nextBundle);

  if (!writeToLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY, serialized)) {
    return storedBundle;
  }

  return parseStoredPhase3SmokeProofBundle(serialized);
}
