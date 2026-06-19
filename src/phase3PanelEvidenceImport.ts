import type { SessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import type { SlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";
import {
  savePhase3SessionControlEvidenceByPanel,
  savePhase3SlashEvidenceByPanel,
  type Phase3SessionControlEvidenceByPanel,
  type Phase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";

export interface Phase3PanelEvidenceImportResult {
  readonly imported: boolean;
  readonly panelId?: string;
  readonly detail: string;
}

export interface Phase3PanelEvidenceImportOptions {
  readonly currentPanelId?: string;
  readonly setSlashEvidenceByPanel: (
    updater: (current: Phase3SlashEvidenceByPanel) => Phase3SlashEvidenceByPanel
  ) => void;
  readonly setSessionControlEvidenceByPanel: (
    updater: (
      current: Phase3SessionControlEvidenceByPanel
    ) => Phase3SessionControlEvidenceByPanel
  ) => void;
  readonly setProofEvaluationTime: (value: string) => void;
}

const PHASE3_PANEL_EVIDENCE_RECORD_SOURCE =
  "steerboard.phase3.panel-evidence-record.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasReadySlashEvidence(value: unknown): value is SlashCommandExecutionEvidence {
  if (!isRecord(value) || !isRecord(value.evidence)) {
    return false;
  }

  const evidence = value.evidence;
  return (
    value.route === "provider" &&
    value.state === "ready" &&
    value.executable === true &&
    value.pass === true &&
    Number(evidence.providerRoute) > 0 &&
    (Number(evidence.live) > 0 || Number(evidence.status) > 0) &&
    Number(evidence.error) === 0
  );
}

function hasReadySessionControlEvidence(
  value: unknown
): value is SessionControlReadinessEvidence {
  if (!isRecord(value) || !isRecord(value.controlStates)) {
    return false;
  }

  const controlStates = value.controlStates;
  return (
    value.state === "ready" &&
    value.pass === true &&
    ["interrupt", "retry", "steer"].every(
      (control) =>
        controlStates[control] === "live" ||
        controlStates[control] === "review"
    ) &&
    ["fork", "resume", "archive"].every((control) =>
      ["unsupported", "live", "review"].includes(String(controlStates[control]))
    )
  );
}

export function runPhase3PanelEvidenceImportAction(
  serializedRecord: string,
  options: Phase3PanelEvidenceImportOptions
): Phase3PanelEvidenceImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serializedRecord);
  } catch {
    return {
      imported: false,
      detail: "Phase 3 panel evidence artifact is not valid JSON."
    };
  }

  if (!isRecord(parsed) || parsed.source !== PHASE3_PANEL_EVIDENCE_RECORD_SOURCE) {
    return {
      imported: false,
      detail: "Phase 3 panel evidence artifact source is not recognized."
    };
  }

  const createdAt = safeString(parsed.createdAt);
  const createdAtMs = Date.parse(createdAt);
  if (!Number.isFinite(createdAtMs)) {
    return {
      imported: false,
      detail: "Phase 3 panel evidence artifact is missing a valid timestamp."
    };
  }

  const targetPanelId = options.currentPanelId ?? safeString(parsed.panelId);
  if (!targetPanelId) {
    return {
      imported: false,
      detail: "Focus an Arena panel before loading Phase 3 panel evidence."
    };
  }

  const slashEvidence = parsed.slashEvidence;
  if (!hasReadySlashEvidence(slashEvidence)) {
    return {
      imported: false,
      detail: "Phase 3 panel evidence artifact does not contain ready slash-command proof."
    };
  }

  const sessionControlEvidence = parsed.sessionControlEvidence;
  if (!hasReadySessionControlEvidence(sessionControlEvidence)) {
    return {
      imported: false,
      detail: "Phase 3 panel evidence artifact does not contain ready session-control proof."
    };
  }

  options.setSlashEvidenceByPanel((currentEvidenceByPanel) =>
    savePhase3SlashEvidenceByPanel(
      {
        ...currentEvidenceByPanel,
        [targetPanelId]: slashEvidence
      },
      {
        createdAt,
        refreshPanelIds: [targetPanelId]
      }
    )
  );
  options.setSessionControlEvidenceByPanel((currentEvidenceByPanel) =>
    savePhase3SessionControlEvidenceByPanel(
      {
        ...currentEvidenceByPanel,
        [targetPanelId]: sessionControlEvidence
      },
      {
        createdAt,
        refreshPanelIds: [targetPanelId]
      }
    )
  );
  options.setProofEvaluationTime(new Date(createdAtMs).toISOString());

  return {
    imported: true,
    panelId: targetPanelId,
    detail: `Phase 3 panel evidence loaded for ${targetPanelId}.`
  };
}
