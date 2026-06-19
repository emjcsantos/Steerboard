export type Phase3RecordedArtifactLoadState = "loaded" | "unavailable" | "rejected";

export interface Phase3RecordedArtifactLoadNoticeInput {
  readonly commandValidation: Phase3RecordedArtifactLoadState;
  readonly smokeProofBundle: Phase3RecordedArtifactLoadState;
}

function artifactLabel(artifact: "commandValidation" | "smokeProofBundle"): string {
  return artifact === "commandValidation"
    ? "Phase 3 CLI validation artifact"
    : "desktop smoke proof bundle";
}

function issueLabel(
  artifact: "commandValidation" | "smokeProofBundle",
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

  if (commandState === "loaded" && smokeState === "loaded") {
    return "Phase 3 CLI validation and desktop smoke proof artifacts loaded";
  }

  if (commandState === "loaded" && smokeState !== "loaded") {
    return `${artifactLabel("commandValidation")} loaded; ${issueLabel(
      "smokeProofBundle",
      smokeState
    )}`;
  }

  if (smokeState === "loaded" && commandState !== "loaded") {
    return `Phase 3 desktop smoke proof bundle loaded; ${issueLabel(
      "commandValidation",
      commandState
    )}`;
  }

  if (commandState === "unavailable" && smokeState === "unavailable") {
    return "Recorded Phase 3 proof artifacts are unavailable; run npm.cmd run smoke:phase3:record first";
  }

  return `${issueLabel("commandValidation", commandState)}; ${issueLabel(
    "smokeProofBundle",
    smokeState
  )}`;
}
