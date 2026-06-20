import {
  getFallbackCodexLiveSmokeProof,
  getFallbackCodexTwoPanelSmokeProof,
  normalizeCodexLiveSmokeProof,
  normalizeCodexTwoPanelSmokeProof,
  type CodexLiveSmokeProof,
  type CodexTwoPanelSmokeProof
} from "./codexTransportSpike";

export const PHASE_PRIORITY_SMOKE_PROOF_STORAGE_KEY =
  "steerboard.phasePriority.smoke.proofs.v1";

export interface PhasePrioritySmokeProofBundle {
  readonly liveSmoke: CodexLiveSmokeProof;
  readonly twoPanelSmoke: CodexTwoPanelSmokeProof;
}

export interface PhasePrioritySmokeProofBundleInput {
  liveSmoke?: unknown;
  twoPanelSmoke?: unknown;
}

export function getFallbackPhasePrioritySmokeProofBundle(): PhasePrioritySmokeProofBundle {
  return {
    liveSmoke: getFallbackCodexLiveSmokeProof(),
    twoPanelSmoke: getFallbackCodexTwoPanelSmokeProof()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPersistableDesktopExecutedProof(proof: {
  source: string;
  executed: boolean;
  checkedAt: string | null;
}): boolean {
  return proof.source === "desktop" && proof.executed === true && Boolean(proof.checkedAt);
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

function writeToLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(key, value);
  } catch {
    return;
  }
}

export function parseStoredPhasePrioritySmokeProofBundle(
  serialized: string | null
): PhasePrioritySmokeProofBundle {
  if (!serialized) {
    return getFallbackPhasePrioritySmokeProofBundle();
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return getFallbackPhasePrioritySmokeProofBundle();
    }

    const liveSmoke = normalizeCodexLiveSmokeProof(parsed.liveSmoke);
    const twoPanelSmoke = normalizeCodexTwoPanelSmokeProof(parsed.twoPanelSmoke);

    return {
      liveSmoke: isPersistableDesktopExecutedProof(liveSmoke)
        ? liveSmoke
        : getFallbackCodexLiveSmokeProof(),
      twoPanelSmoke: isPersistableDesktopExecutedProof(twoPanelSmoke)
        ? twoPanelSmoke
        : getFallbackCodexTwoPanelSmokeProof()
    };
  } catch {
    return getFallbackPhasePrioritySmokeProofBundle();
  }
}

export function loadPhasePrioritySmokeProofBundle(): PhasePrioritySmokeProofBundle {
  return parseStoredPhasePrioritySmokeProofBundle(
    readFromLocalStorage(PHASE_PRIORITY_SMOKE_PROOF_STORAGE_KEY)
  );
}

export function savePhasePrioritySmokeProofBundle(
  bundle: PhasePrioritySmokeProofBundleInput
): void {
  const liveSmoke = normalizeCodexLiveSmokeProof(bundle?.liveSmoke);
  const twoPanelSmoke = normalizeCodexTwoPanelSmokeProof(bundle?.twoPanelSmoke);

  if (
    !isPersistableDesktopExecutedProof(liveSmoke) &&
    !isPersistableDesktopExecutedProof(twoPanelSmoke)
  ) {
    return;
  }

  writeToLocalStorage(
    PHASE_PRIORITY_SMOKE_PROOF_STORAGE_KEY,
    JSON.stringify({
      liveSmoke,
      twoPanelSmoke
    })
  );
}
