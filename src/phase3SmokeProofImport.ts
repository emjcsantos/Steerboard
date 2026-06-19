import {
  buildPhase3SmokeProofReadiness,
  type Phase3SmokeProofReadinessResult
} from "./phase3SmokeProofReadiness";
import {
  buildPhase3PersistedSmokeProofStorageNotice,
  countPersistedPhase3SmokeProofRows
} from "./phase3SmokeProofNotice";
import {
  loadPhase3SmokeProofBundleWithStorageProof,
  parseStoredPhase3SmokeProofBundle,
  savePhase3SmokeProofBundle,
  type Phase3PersistedDesktopProofs,
  type Phase3PersistedDesktopProofReviewReasons,
  type Phase3SmokeProofBundle
} from "./phase3SmokeProofStorage";

export interface Phase3SmokeProofImportResult {
  readonly imported: boolean;
  readonly notice: string;
  readonly bundle?: Phase3SmokeProofBundle;
  readonly persistedDesktopProofs?: Phase3PersistedDesktopProofs;
  readonly storageReviewReasons?: Phase3PersistedDesktopProofReviewReasons;
  readonly evaluatedAt?: string;
  readonly readiness?: Phase3SmokeProofReadinessResult;
}

const IMPORT_FAILED_NOTICE = "Phase 3 desktop smoke proof artifact could not be imported";
const PROVENANCE_REQUIRED_NOTICE =
  "Phase 3 desktop smoke proof artifact needs smoke-record provenance before storage attestation";

function desktopExecutedRowCount(bundle: Phase3SmokeProofBundle): number {
  return [
    bundle.liveControlSmoke,
    bundle.activeTurnInterruptSmoke,
    bundle.activeTurnSteerSmoke
  ].filter((proof) => proof.source === "desktop" && proof.executed === true).length;
}

export function importPhase3SmokeProofBundleArtifact(
  serializedBundle: string,
  evaluatedAt = new Date().toISOString()
): Phase3SmokeProofImportResult {
  let rawBundle: unknown;

  try {
    rawBundle = JSON.parse(serializedBundle);
  } catch {
    return {
      imported: false,
      notice: IMPORT_FAILED_NOTICE
    };
  }

  const bundle = parseStoredPhase3SmokeProofBundle(serializedBundle);
  if (desktopExecutedRowCount(bundle) === 0) {
    return {
      imported: false,
      notice: IMPORT_FAILED_NOTICE
    };
  }

  savePhase3SmokeProofBundle(rawBundle, { requireBundleProvenance: true });
  const persistedLoad = loadPhase3SmokeProofBundleWithStorageProof();
  const persistedRowCount = countPersistedPhase3SmokeProofRows(
    persistedLoad.persistedDesktopProofs
  );

  if (persistedRowCount === 0) {
    return {
      imported: false,
      notice: PROVENANCE_REQUIRED_NOTICE
    };
  }

  const persistedBundle = persistedLoad.bundle;
  const readiness = buildPhase3SmokeProofReadiness({
    liveControlSmoke: persistedBundle.liveControlSmoke,
    activeTurnInterruptSmoke: persistedBundle.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: persistedBundle.activeTurnSteerSmoke,
    persistedDesktopProofs: persistedLoad.persistedDesktopProofs,
    storageReviewReasons: persistedLoad.storageReviewReasons,
    evaluatedAt
  });

  return {
    imported: true,
    notice: buildPhase3PersistedSmokeProofStorageNotice({
      persistedRowCount,
      readinessItems: readiness.items
    }),
    bundle: persistedBundle,
    persistedDesktopProofs: persistedLoad.persistedDesktopProofs,
    storageReviewReasons: persistedLoad.storageReviewReasons,
    evaluatedAt,
    readiness
  };
}
