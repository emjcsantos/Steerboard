import { describe, expect, it } from "vitest";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";
import {
  selectPhase3SessionControlEvidence,
  selectPhase3SlashCommandEvidence
} from "./phase3PanelEvidenceSelection";

const fallbackSlash = buildSlashCommandExecutionEvidence();
const fallbackSession = buildSessionControlReadinessEvidence(undefined);

function slashEvidence(state: "ready" | "review" | "blocked" | "waiting") {
  return {
    ...fallbackSlash,
    route: state === "ready" || state === "review" ? "provider" as const : "blocked" as const,
    state,
    pass: state === "ready",
    readiness: state === "ready" ? 100 : state === "blocked" ? 0 : state === "review" ? 40 : 0,
    status: state,
    detail: `${state} slash`
  };
}

function sessionEvidence(state: "ready" | "review" | "blocked" | "waiting") {
  return {
    ...fallbackSession,
    state,
    pass: state === "ready",
    readiness: state === "ready" ? 100 : state === "blocked" ? 15 : state === "review" ? 65 : 35,
    statusLabel: state,
    detail: `${state} session`
  };
}

describe("phase 3 panel evidence selection", () => {
  it("uses focused-panel slash evidence before another panel's ready proof", () => {
    const result = selectPhase3SlashCommandEvidence(
      {
        "panel-1": slashEvidence("ready"),
        "panel-2": slashEvidence("blocked")
      },
      "panel-2",
      fallbackSlash
    );

    expect(result).toMatchObject({
      state: "blocked",
      detail: "blocked slash"
    });
  });

  it("uses focused-panel session-control evidence before another panel's ready proof", () => {
    const result = selectPhase3SessionControlEvidence(
      {
        "panel-1": sessionEvidence("ready"),
        "panel-2": sessionEvidence("blocked")
      },
      "panel-2",
      fallbackSession
    );

    expect(result).toMatchObject({
      state: "blocked",
      detail: "blocked session"
    });
  });

  it("returns fallback evidence when the focused panel has not produced proof yet", () => {
    expect(
      selectPhase3SlashCommandEvidence(
        { "panel-1": slashEvidence("ready") },
        "panel-2",
        fallbackSlash
      )
    ).toBe(fallbackSlash);
    expect(
      selectPhase3SessionControlEvidence(
        { "panel-1": sessionEvidence("ready") },
        "panel-2",
        fallbackSession
      )
    ).toBe(fallbackSession);
  });

  it("keeps global ranking when no panel is focused", () => {
    expect(
      selectPhase3SlashCommandEvidence(
        {
          "panel-1": slashEvidence("review"),
          "panel-2": slashEvidence("ready")
        },
        undefined,
        fallbackSlash
      )
    ).toMatchObject({ state: "ready" });
    expect(
      selectPhase3SessionControlEvidence(
        {
          "panel-1": sessionEvidence("review"),
          "panel-2": sessionEvidence("ready")
        },
        undefined,
        fallbackSession
      )
    ).toMatchObject({ state: "ready" });
  });
});
