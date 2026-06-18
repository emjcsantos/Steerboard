export interface Phase3SmokeProofNoticeInput {
  readonly label: string;
  readonly passed: boolean;
  readonly persisted: boolean;
}

export type Phase3SmokeProofNoticeReadinessState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3PersistedSmokeProofStorageNoticeInput {
  readonly persistedRowCount: number;
  readonly readinessItems?: readonly {
    readonly persisted: boolean;
    readonly state: Phase3SmokeProofNoticeReadinessState;
  }[];
}

export function buildPhase3SmokeProofNotice(input: Phase3SmokeProofNoticeInput): string {
  if (input.passed && input.persisted) {
    return `${input.label} smoke passed and was persisted for Phase 3 handoff review.`;
  }

  if (input.passed) {
    return `${input.label} smoke passed, but it was not persisted for Phase 3 handoff review.`;
  }

  return `${input.label} smoke did not pass.`;
}

export function buildPhase3PersistedSmokeProofStorageNotice(
  input: Phase3PersistedSmokeProofStorageNoticeInput
): string {
  if (input.persistedRowCount <= 0) {
    return "Phase 3 desktop smoke proof artifact could not be persisted";
  }

  const persistedItems = input.readinessItems?.filter((item) => item.persisted) ?? [];
  const readyCount = persistedItems.filter((item) => item.state === "ready").length;
  const reviewCount = persistedItems.filter((item) => item.state === "review").length;
  const blockedCount = persistedItems.filter((item) => item.state === "blocked").length;
  const persistedRowLabel = `desktop proof row${input.persistedRowCount === 1 ? "" : "s"}`;

  if (persistedItems.length === 0) {
    return `Phase 3 persisted smoke proof storage has ${input.persistedRowCount} ${persistedRowLabel} for review`;
  }

  return `Phase 3 persisted smoke proof storage has ${input.persistedRowCount} ${persistedRowLabel} for review: ${readyCount} ready, ${reviewCount} review, ${blockedCount} blocked`;
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
