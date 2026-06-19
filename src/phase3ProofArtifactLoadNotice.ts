export type Phase3RecordedArtifactLoadState = "loaded" | "unavailable" | "rejected";

export interface Phase3RecordedArtifactLoadNoticeInput {
  readonly commandValidation: Phase3RecordedArtifactLoadState;
  readonly smokeProofBundle: Phase3RecordedArtifactLoadState;
  readonly panelEvidence?: Phase3RecordedArtifactLoadState;
}

type Phase3RecordedArtifact = "commandValidation" | "smokeProofBundle" | "panelEvidence";

function artifactLabel(artifact: Phase3RecordedArtifact): string {
  if (artifact === "commandValidation") {
    return "Phase 3 CLI validation artifact";
  }

  if (artifact === "panelEvidence") {
    return "panel slash/session evidence";
  }

  return "desktop smoke proof bundle";
}

function issueLabel(
  artifact: Phase3RecordedArtifact,
  state: Phase3RecordedArtifactLoadState
): string {
  if (state === "loaded") {
    return `${artifactLabel(artifact)} loaded`;
  }

  return `${artifactLabel(artifact)} ${
    state === "unavailable" ? "is unavailable" : "could not be imported"
  }`;
}

export function buildPhase3RecordedArtifactLoadNotice(
  input: Phase3RecordedArtifactLoadNoticeInput
): string {
  const commandState = input.commandValidation;
  const smokeState = input.smokeProofBundle;
  const panelState = input.panelEvidence;

  if (commandState === "loaded" && smokeState === "loaded" && panelState === "loaded") {
    return "Phase 3 CLI validation, desktop smoke proof, and panel evidence artifacts loaded";
  }

  if (commandState === "loaded" && smokeState === "loaded" && panelState) {
    return `Phase 3 CLI validation and desktop smoke proof artifacts loaded; ${issueLabel(
      "panelEvidence",
      panelState
    )}`;
  }

  if (commandState === "loaded" && smokeState === "loaded") {
    return "Phase 3 CLI validation and desktop smoke proof artifacts loaded";
  }

  if (commandState === "loaded" && smokeState !== "loaded") {
    const base = `${artifactLabel("commandValidation")} loaded; ${issueLabel(
      "smokeProofBundle",
      smokeState
    )}`;
    return panelState ? `${base}; ${issueLabel("panelEvidence", panelState)}` : base;
  }

  if (smokeState === "loaded" && commandState !== "loaded") {
    const base = `Phase 3 desktop smoke proof bundle loaded; ${issueLabel(
      "commandValidation",
      commandState
    )}`;
    return panelState ? `${base}; ${issueLabel("panelEvidence", panelState)}` : base;
  }

  if (
    commandState === "unavailable" &&
    smokeState === "unavailable" &&
    (!panelState || panelState === "unavailable")
  ) {
    return "Recorded Phase 3 proof artifacts are unavailable; run npm.cmd run smoke:phase3:record first";
  }

  const base = `${issueLabel("commandValidation", commandState)}; ${issueLabel(
    "smokeProofBundle",
    smokeState
  )}`;
  return panelState ? `${base}; ${issueLabel("panelEvidence", panelState)}` : base;
}
