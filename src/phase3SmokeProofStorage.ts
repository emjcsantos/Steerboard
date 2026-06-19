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
export const PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE =
  "steerboard.phase3.smoke-record.v1";

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

export interface Phase3SmokeProofBundleSaveOptions {
  readonly requireBundleProvenance?: boolean;
}

export interface Phase3PersistedDesktopProofs {
  readonly liveControlSmoke: boolean;
  readonly activeTurnInterruptSmoke: boolean;
  readonly activeTurnSteerSmoke: boolean;
}

export interface Phase3PersistedDesktopProofReviewReasons {
  readonly liveControlSmoke?: string;
  readonly activeTurnInterruptSmoke?: string;
  readonly activeTurnSteerSmoke?: string;
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
  readonly storageReviewReasons: Phase3PersistedDesktopProofReviewReasons;
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

function emptyPersistedDesktopProofReviewReasons(): Phase3PersistedDesktopProofReviewReasons {
  return {};
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

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function bundleInputRecord(value: unknown): Record<string, unknown> {
  const record = isRecord(value) ? value : {};
  return isRecord(record.bundle) ? record.bundle : record;
}

function rowFingerprintMatches(
  expected: unknown,
  rawValue: unknown,
  normalizedValue: Phase3SmokeProofBundle[keyof Phase3SmokeProofBundle]
): boolean {
  return (
    typeof expected === "string" &&
    (expected === createPhase3SmokeProofFingerprint(rawValue) ||
      expected === createPhase3SmokeProofFingerprint(normalizedValue))
  );
}

function hasValidBundleProvenance(
  input: unknown,
  bundle: Phase3SmokeProofBundle
): boolean {
  const record = isRecord(input) ? input : undefined;
  const rows = bundleInputRecord(input);
  const rowFingerprints = isRecord(record?.rowFingerprints)
    ? record.rowFingerprints
    : undefined;

  return (
    record?.source === PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE &&
    typeof record.command === "string" &&
    record.command.trim().length > 0 &&
    validCreatedAt(record.createdAt) &&
    normalizeCount(record.passedTestCount) >= 3 &&
    normalizeCount(record.failedTestCount) === 0 &&
    rowFingerprints !== undefined &&
    rowFingerprintMatches(rowFingerprints.liveControlSmoke, rows.liveControlSmoke, bundle.liveControlSmoke) &&
    rowFingerprintMatches(
      rowFingerprints.activeTurnInterruptSmoke,
      rows.activeTurnInterruptSmoke,
      bundle.activeTurnInterruptSmoke
    ) &&
    rowFingerprintMatches(
      rowFingerprints.activeTurnSteerSmoke,
      rows.activeTurnSteerSmoke,
      bundle.activeTurnSteerSmoke
    )
  );
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
  return storageProofReviewReason(proof, rawValue, normalizedValue) === undefined;
}

function storageProofReviewReason(
  proof: keyof Phase3SmokeProofBundle,
  rawValue: unknown,
  normalizedValue: Phase3SmokeProofBundle[keyof Phase3SmokeProofBundle]
): string | undefined {
  if (!isPersistableDesktopExecutedProof(normalizedValue)) {
    return "Only desktop-executed proof rows can be storage-attested.";
  }

  const storageProof = getStorageProof(rawValue);
  const checkedAt =
    isRecord(normalizedValue) && typeof normalizedValue.checkedAt === "string"
      ? Date.parse(normalizedValue.checkedAt)
      : Number.NaN;
  const createdAt = storageProof ? Date.parse(storageProof.createdAt) : Number.NaN;
  const expectedFingerprint = createPhase3SmokeProofFingerprint(normalizedValue);

  if (!storageProof) {
    return "Storage proof is missing or malformed; reload a recorded desktop smoke proof bundle.";
  }

  if (storageProof.proof !== proof) {
    return `Storage proof is for ${storageProof.proof}, not ${proof}; reload the matching desktop smoke proof row.`;
  }

  if (storageProof.proofFingerprint !== expectedFingerprint) {
    return "Storage proof fingerprint no longer matches this desktop proof row; reload the recorded desktop smoke proof bundle.";
  }

  if (!Number.isFinite(checkedAt)) {
    return "Desktop proof row has no valid checkedAt timestamp; rerun the desktop smoke proof.";
  }

  if (!Number.isFinite(createdAt)) {
    return "Storage proof has no valid createdAt timestamp; reload the recorded desktop smoke proof bundle.";
  }

  if (createdAt < checkedAt) {
    return "Storage proof was created before the desktop proof row it attests; reload the recorded desktop smoke proof bundle.";
  }

  return undefined;
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

function buildPersistedDesktopProofReviewReasons(
  raw: Record<string, unknown>,
  bundle: Phase3SmokeProofBundle
): Phase3PersistedDesktopProofReviewReasons {
  const liveControlSmoke = storageProofReviewReason(
    "liveControlSmoke",
    raw.liveControlSmoke,
    bundle.liveControlSmoke
  );
  const activeTurnInterruptSmoke = storageProofReviewReason(
    "activeTurnInterruptSmoke",
    raw.activeTurnInterruptSmoke,
    bundle.activeTurnInterruptSmoke
  );
  const activeTurnSteerSmoke = storageProofReviewReason(
    "activeTurnSteerSmoke",
    raw.activeTurnSteerSmoke,
    bundle.activeTurnSteerSmoke
  );

  return {
    ...(liveControlSmoke ? { liveControlSmoke } : {}),
    ...(activeTurnInterruptSmoke ? { activeTurnInterruptSmoke } : {}),
    ...(activeTurnSteerSmoke ? { activeTurnSteerSmoke } : {})
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

    const bundle = bundleInputRecord(parsed);

    return {
      liveControlSmoke: normalizeCodexLiveControlSmokeProof(bundle.liveControlSmoke),
      activeTurnInterruptSmoke: normalizeCodexActiveTurnControlSmokeProof(bundle.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: normalizeCodexActiveTurnSteerSmokeProof(bundle.activeTurnSteerSmoke)
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
      persistedDesktopProofs: emptyPersistedDesktopProofs(),
      storageReviewReasons: emptyPersistedDesktopProofReviewReasons()
    };
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return {
        bundle: getFallbackPhase3SmokeProofBundle(),
        persistedDesktopProofs: emptyPersistedDesktopProofs(),
        storageReviewReasons: emptyPersistedDesktopProofReviewReasons()
      };
    }

    const bundleInput = bundleInputRecord(parsed);
    const bundle = {
      liveControlSmoke: normalizeCodexLiveControlSmokeProof(bundleInput.liveControlSmoke),
      activeTurnInterruptSmoke: normalizeCodexActiveTurnControlSmokeProof(bundleInput.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: normalizeCodexActiveTurnSteerSmokeProof(bundleInput.activeTurnSteerSmoke)
    };

    return {
      bundle,
      persistedDesktopProofs: attestPersistedDesktopProofs(parsed, bundle),
      storageReviewReasons: buildPersistedDesktopProofReviewReasons(parsed, bundle)
    };
  } catch {
    return {
      bundle: getFallbackPhase3SmokeProofBundle(),
      persistedDesktopProofs: emptyPersistedDesktopProofs(),
      storageReviewReasons: emptyPersistedDesktopProofReviewReasons()
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
  input: unknown,
  options: Phase3SmokeProofBundleSaveOptions = {}
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
  const bundle = bundleInputRecord(input);
  const liveControlSmoke = normalizeCodexLiveControlSmokeProof(bundle.liveControlSmoke);
  const activeTurnInterruptSmoke = normalizeCodexActiveTurnControlSmokeProof(bundle.activeTurnInterruptSmoke);
  const activeTurnSteerSmoke = normalizeCodexActiveTurnSteerSmokeProof(bundle.activeTurnSteerSmoke);
  const hasTrustedInputProvenance = hasValidBundleProvenance(input, {
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  });
  const canAcceptInputRows =
    options.requireBundleProvenance !== true || hasTrustedInputProvenance;
  const nextBundle: MutablePhase3SmokeProofBundle = {};
  let acceptedInputRow = false;
  const createdAt = new Date().toISOString();

  if (canAcceptInputRows && isPersistableDesktopExecutedProof(liveControlSmoke)) {
    nextBundle.liveControlSmoke = stampStorageProof("liveControlSmoke", liveControlSmoke, createdAt);
    acceptedInputRow = true;
  } else if (storedWithProof.persistedDesktopProofs.liveControlSmoke) {
    nextBundle.liveControlSmoke = stampStorageProof(
      "liveControlSmoke",
      storedBundle.liveControlSmoke,
      getStorageProof(storedRaw.liveControlSmoke)?.createdAt ?? createdAt
    );
  }

  if (canAcceptInputRows && isPersistableDesktopExecutedProof(activeTurnInterruptSmoke)) {
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

  if (canAcceptInputRows && isPersistableDesktopExecutedProof(activeTurnSteerSmoke)) {
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
