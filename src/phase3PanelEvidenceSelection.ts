import type { SessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import type { SlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

type EvidenceByPanel<T> = Readonly<Record<string, T>>;

function selectFallbackOrFocused<T>(
  evidenceByPanel: EvidenceByPanel<T>,
  focusedPanelId: string | undefined,
  fallback: T
): { evidence?: T; shouldUseGlobalRanking: boolean } {
  if (!focusedPanelId) {
    return { shouldUseGlobalRanking: true };
  }

  return {
    evidence: evidenceByPanel[focusedPanelId] ?? fallback,
    shouldUseGlobalRanking: false
  };
}

export function selectPhase3SlashCommandEvidence(
  evidenceByPanel: EvidenceByPanel<SlashCommandExecutionEvidence>,
  focusedPanelId: string | undefined,
  fallback: SlashCommandExecutionEvidence
): SlashCommandExecutionEvidence {
  const focusedSelection = selectFallbackOrFocused(evidenceByPanel, focusedPanelId, fallback);
  if (!focusedSelection.shouldUseGlobalRanking) {
    return focusedSelection.evidence ?? fallback;
  }

  const evidenceItems = Object.values(evidenceByPanel);

  return (
    evidenceItems.find((item) => item.pass) ??
    evidenceItems.find((item) => item.route === "provider") ??
    evidenceItems.find((item) => item.state === "blocked") ??
    evidenceItems.find((item) => item.state === "review") ??
    evidenceItems[0] ??
    fallback
  );
}

export function selectPhase3SessionControlEvidence(
  evidenceByPanel: EvidenceByPanel<SessionControlReadinessEvidence>,
  focusedPanelId: string | undefined,
  fallback: SessionControlReadinessEvidence
): SessionControlReadinessEvidence {
  const focusedSelection = selectFallbackOrFocused(evidenceByPanel, focusedPanelId, fallback);
  if (!focusedSelection.shouldUseGlobalRanking) {
    return focusedSelection.evidence ?? fallback;
  }

  const evidenceItems = Object.values(evidenceByPanel);

  return (
    evidenceItems.find((item) => item.pass) ??
    evidenceItems.find((item) => item.state === "blocked") ??
    evidenceItems.find((item) => item.state === "review") ??
    evidenceItems.find((item) => item.state === "waiting") ??
    evidenceItems[0] ??
    fallback
  );
}
