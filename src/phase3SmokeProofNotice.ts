export interface Phase3SmokeProofNoticeInput {
  readonly label: string;
  readonly passed: boolean;
  readonly persisted: boolean;
}

export function buildPhase3SmokeProofNotice(input: Phase3SmokeProofNoticeInput): string {
  if (input.passed && input.persisted) {
    return `${input.label} smoke passed and was persisted for Phase 3 handoff.`;
  }

  if (input.passed) {
    return `${input.label} smoke passed, but it was not persisted for Phase 3 handoff.`;
  }

  return `${input.label} smoke did not pass.`;
}

export function countPersistedPhase3SmokeProofRows(input: {
  readonly liveControlSmoke?: boolean;
  readonly activeTurnInterruptSmoke?: boolean;
  readonly activeTurnSteerSmoke?: boolean;
}): number {
  return [
    input.liveControlSmoke,
    input.activeTurnInterruptSmoke,
    input.activeTurnSteerSmoke
  ].filter(Boolean).length;
}
