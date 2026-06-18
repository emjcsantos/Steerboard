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
export const PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE =
  "steerboard.phase3.smoke-proof-storage.v1";

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

export interface Phase3SmokeProofStorageProof {
  readonly source: typeof PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE;
  readonly proof: keyof Phase3SmokeProofBundle;
  readonly createdAt: string;
  readonly proofFingerprint: string;
}

export interface Phase3SmokeProofBundleWithStorageProof {
  readonly bundle: Phase3SmokeProofBundle;
  readonly persistedDesktopProofs: Phase3PersistedDesktopProofs;
}

type MutablePhase3SmokeProofBundle = {
  -readonly [Key in keyof Phase3SmokeProofBundle]?: Phase3SmokeProofBundle[Key] & {
    readonly phase3StorageProof?: Phase3SmokeProofStorageProof;
  };
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

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function proofWithoutStorageProof(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const copy = { ...value };
  delete copy.phase3StorageProof;
  return copy;
}

export function createPhase3SmokeProofFingerprint(value: unknown): string {
  return `phase3-smoke-proof-${shortHash(stableJson(proofWithoutStorageProof(value)))}`;
}

function validCreatedAt(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function createPhase3StorageProof(
  proof: keyof Phase3SmokeProofBundle,
  value: Phase3SmokeProofBundle[keyof Phase3SmokeProofBundle],
  createdAt: string
): Phase3SmokeProofStorageProof {
  return {
    source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
    proof,
    createdAt,
    proofFingerprint: createPhase3SmokeProofFingerprint(value)
  };
}

function getStorageProof(
  value: unknown
): Phase3SmokeProofStorageProof | undefined {
  const record = isRecord(value) ? value : undefined;
  const proof = isRecord(record?.phase3StorageProof)
    ? record.phase3StorageProof
    : undefined;

  if (
    proof?.source !== PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE ||
    !validCreatedAt(proof.createdAt) ||
    typeof proof.proofFingerprint !== "string"
  ) {
    return undefined;
  }

  const proofName = proof.proof;
  if (
    proofName !== "liveControlSmoke" &&
    proofName !== "activeTurnInterruptSmoke" &&
    proofName !== "activeTurnSteerSmoke"
  ) {
    return undefined;
  }

  return {
    source: PHASE3_SMOKE_PROOF_STORAGE_PROOF_SOURCE,
    proof: proofName,
    createdAt: proof.createdAt,
    proofFingerprint: proof.proofFingerprint
  };
}

function hasValidStorageProof(
  proof: keyof Phase3SmokeProofBundle,
  rawValue: unknown,
  normalizedValue: Phase3SmokeProofBundle[keyof Phase3SmokeProofBundle]
): boolean {
  const storageProof = getStorageProof(rawValue);

  return (
    storageProof?.proof === proof &&
    storageProof.proofFingerprint === createPhase3SmokeProofFingerprint(normalizedValue)
  );
}

function stampStorageProof<Key extends keyof Phase3SmokeProofBundle>(
  proof: Key,
  value: Phase3SmokeProofBundle[Key],
  createdAt: string
): Phase3SmokeProofBundle[Key] & { readonly phase3StorageProof: Phase3SmokeProofStorageProof } {
  return {
    ...value,
    phase3StorageProof: createPhase3StorageProof(proof, value, createdAt)
  };
}

function attestPersistedDesktopProofs(
  raw: Record<string, unknown>,
  bundle: Phase3SmokeProofBundle
): Phase3PersistedDesktopProofs {
  return {
    liveControlSmoke:
      isPersistableDesktopExecutedProof(bundle.liveControlSmoke) &&
      hasValidStorageProof("liveControlSmoke", raw.liveControlSmoke, bundle.liveControlSmoke),
    activeTurnInterruptSmoke:
      isPersistableDesktopExecutedProof(bundle.activeTurnInterruptSmoke) &&
      hasValidStorageProof(
        "activeTurnInterruptSmoke",
        raw.activeTurnInterruptSmoke,
        bundle.activeTurnInterruptSmoke
      ),
    activeTurnSteerSmoke:
      isPersistableDesktopExecutedProof(bundle.activeTurnSteerSmoke) &&
      hasValidStorageProof(
        "activeTurnSteerSmoke",
        raw.activeTurnSteerSmoke,
        bundle.activeTurnSteerSmoke
      )
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
      persistedDesktopProofs: attestPersistedDesktopProofs(parsed, bundle)
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
  const storedSerialized = readFromLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY);
  const storedRaw = (() => {
    try {
      const parsed = JSON.parse(storedSerialized ?? "");
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  })();
  const storedWithProof = parseStoredPhase3SmokeProofBundleWithStorageProof(storedSerialized);
  const storedBundle = storedWithProof.bundle;
  const liveControlSmoke = normalizeCodexLiveControlSmokeProof(bundle?.liveControlSmoke);
  const activeTurnInterruptSmoke = normalizeCodexActiveTurnControlSmokeProof(bundle?.activeTurnInterruptSmoke);
  const activeTurnSteerSmoke = normalizeCodexActiveTurnSteerSmokeProof(bundle?.activeTurnSteerSmoke);
  const nextBundle: MutablePhase3SmokeProofBundle = {};
  let acceptedInputRow = false;
  const createdAt = new Date().toISOString();

  if (isPersistableDesktopExecutedProof(liveControlSmoke)) {
    nextBundle.liveControlSmoke = stampStorageProof("liveControlSmoke", liveControlSmoke, createdAt);
    acceptedInputRow = true;
  } else if (storedWithProof.persistedDesktopProofs.liveControlSmoke) {
    nextBundle.liveControlSmoke = stampStorageProof(
      "liveControlSmoke",
      storedBundle.liveControlSmoke,
      getStorageProof(storedRaw.liveControlSmoke)?.createdAt ?? createdAt
    );
  }

  if (isPersistableDesktopExecutedProof(activeTurnInterruptSmoke)) {
    nextBundle.activeTurnInterruptSmoke = stampStorageProof(
      "activeTurnInterruptSmoke",
      activeTurnInterruptSmoke,
      createdAt
    );
    acceptedInputRow = true;
  } else if (storedWithProof.persistedDesktopProofs.activeTurnInterruptSmoke) {
    nextBundle.activeTurnInterruptSmoke = stampStorageProof(
      "activeTurnInterruptSmoke",
      storedBundle.activeTurnInterruptSmoke,
      getStorageProof(storedRaw.activeTurnInterruptSmoke)?.createdAt ?? createdAt
    );
  }

  if (isPersistableDesktopExecutedProof(activeTurnSteerSmoke)) {
    nextBundle.activeTurnSteerSmoke = stampStorageProof(
      "activeTurnSteerSmoke",
      activeTurnSteerSmoke,
      createdAt
    );
    acceptedInputRow = true;
  } else if (storedWithProof.persistedDesktopProofs.activeTurnSteerSmoke) {
    nextBundle.activeTurnSteerSmoke = stampStorageProof(
      "activeTurnSteerSmoke",
      storedBundle.activeTurnSteerSmoke,
      getStorageProof(storedRaw.activeTurnSteerSmoke)?.createdAt ?? createdAt
    );
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
