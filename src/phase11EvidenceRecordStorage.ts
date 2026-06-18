import type {
  Phase11EvidenceGate,
  Phase11EvidenceRecordInput
} from "./phase11EvidenceRecords";

export type Phase11EvidenceRecordInputMap = Partial<
  Record<Phase11EvidenceGate, Phase11EvidenceRecordInput>
>;

export const PHASE11_EVIDENCE_RECORDS_STORAGE_KEY =
  "steerboard.phase11.evidenceRecords.v1";

const PHASE11_EVIDENCE_GATES: Phase11EvidenceGate[] = [
  "fresh-checkout",
  "clean-checkout",
  "build-test",
  "docs-known-limits"
];

const DEFAULT_RECORD_DETAILS: Record<Phase11EvidenceGate, string> = {
  "fresh-checkout":
    "Owner attached fresh-checkout evidence metadata for Phase 11 release review.",
  "clean-checkout":
    "Owner attached clean-checkout evidence metadata for Phase 11 release review.",
  "build-test":
    "Owner attached build/test evidence metadata for Phase 11 release review.",
  "docs-known-limits":
    "Owner attached docs and known-limits evidence metadata for Phase 11 release review."
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPhase11EvidenceGate(value: unknown): value is Phase11EvidenceGate {
  return (
    typeof value === "string" &&
    PHASE11_EVIDENCE_GATES.includes(value as Phase11EvidenceGate)
  );
}

function normalizeInputForGate(
  gate: Phase11EvidenceGate,
  value: unknown
): Phase11EvidenceRecordInput | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    gate: isPhase11EvidenceGate(value.gate) ? value.gate : gate,
    state: value.state,
    source: value.source,
    recordedAt: value.recordedAt,
    detail: value.detail
  };
}

function normalizeInputMap(value: unknown): Phase11EvidenceRecordInputMap {
  const inputs: Phase11EvidenceRecordInputMap = {};

  if (!isRecord(value)) {
    return inputs;
  }

  if (isPhase11EvidenceGate(value.gate)) {
    const input = normalizeInputForGate(value.gate, value);
    if (input) {
      inputs[value.gate] = input;
    }
    return inputs;
  }

  const source = isRecord(value.records) ? value.records : value;

  for (const gate of PHASE11_EVIDENCE_GATES) {
    const input = normalizeInputForGate(gate, source[gate]);
    if (input) {
      inputs[gate] = input;
    }
  }

  return inputs;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE11_EVIDENCE_RECORDS_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(inputs: Phase11EvidenceRecordInputMap): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE11_EVIDENCE_RECORDS_STORAGE_KEY,
      JSON.stringify(inputs)
    );
  } catch {
    return;
  }
}

export function parsePhase11EvidenceRecordInputs(
  serialized: string | null
): Phase11EvidenceRecordInputMap {
  if (!serialized) {
    return {};
  }

  try {
    return normalizeInputMap(JSON.parse(serialized));
  } catch {
    return {};
  }
}

export function loadPhase11EvidenceRecordInputs(): Phase11EvidenceRecordInputMap {
  return parsePhase11EvidenceRecordInputs(readStorage());
}

export function savePhase11EvidenceRecordInputs(
  inputs: Phase11EvidenceRecordInputMap
): void {
  writeStorage(normalizeInputMap(inputs));
}

export function clearPhase11EvidenceRecordInput(
  gate: Phase11EvidenceGate,
  inputs: Phase11EvidenceRecordInputMap
): Phase11EvidenceRecordInputMap {
  const nextInputs = { ...inputs };
  delete nextInputs[gate];
  return nextInputs;
}

export function createPhase11EvidenceRecordInput(
  gate: Phase11EvidenceGate,
  recordedAt: string,
  detail = DEFAULT_RECORD_DETAILS[gate]
): Phase11EvidenceRecordInput {
  return {
    gate,
    state: "ready",
    source: "owner local evidence record",
    recordedAt,
    detail
  };
}
