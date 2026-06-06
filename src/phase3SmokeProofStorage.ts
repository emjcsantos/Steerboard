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

export function loadPhase3SmokeProofBundle(): Phase3SmokeProofBundle {
  return parseStoredPhase3SmokeProofBundle(readFromLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY));
}

export function savePhase3SmokeProofBundle(bundle: Phase3SmokeProofBundleInput): void {
  const liveControlSmoke = normalizeCodexLiveControlSmokeProof(bundle?.liveControlSmoke);
  const activeTurnInterruptSmoke = normalizeCodexActiveTurnControlSmokeProof(bundle?.activeTurnInterruptSmoke);
  const activeTurnSteerSmoke = normalizeCodexActiveTurnSteerSmokeProof(bundle?.activeTurnSteerSmoke);

  if (
    !isPersistableDesktopExecutedProof(liveControlSmoke) ||
    !isPersistableDesktopExecutedProof(activeTurnInterruptSmoke) ||
    !isPersistableDesktopExecutedProof(activeTurnSteerSmoke)
  ) {
    return;
  }

  const serialized = JSON.stringify({
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  });

  writeToLocalStorage(PHASE3_SMOKE_PROOF_STORAGE_KEY, serialized);
}
