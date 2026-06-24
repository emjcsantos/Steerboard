import { describe, expect, it } from "vitest";
import {
  defaultCodexPanelAgentSettings,
  getCodexPanelModelLabel,
  getCodexPanelReasoningLabel,
  normalizeCodexPanelAgentSettings,
  parseStoredCodexPanelAgentSettings
} from "./codexPanelAgentSettings";

describe("codex panel agent settings", () => {
  it("normalizes valid model and reasoning choices", () => {
    expect(
      normalizeCodexPanelAgentSettings({
        model: "codex-agent",
        reasoning: "extra-high"
      })
    ).toEqual({
      model: "codex-agent",
      reasoning: "extra-high"
    });
  });

  it("falls back for malformed or unsupported saved choices", () => {
    expect(normalizeCodexPanelAgentSettings(null)).toEqual(defaultCodexPanelAgentSettings);
    expect(
      normalizeCodexPanelAgentSettings({
        model: "not-a-model",
        reasoning: "too-much"
      })
    ).toEqual(defaultCodexPanelAgentSettings);
  });

  it("parses per-panel settings and drops blank panel ids", () => {
    expect(
      parseStoredCodexPanelAgentSettings(
        JSON.stringify({
          "panel-1": { model: "codex-agent", reasoning: "medium" },
          " ": { model: "provider-default", reasoning: "high" },
          "panel-2": { model: "provider-default", reasoning: "high" }
        })
      )
    ).toEqual({
      "panel-1": { model: "codex-agent", reasoning: "medium" },
      "panel-2": { model: "provider-default", reasoning: "high" }
    });
  });

  it("returns display labels for selected settings", () => {
    expect(getCodexPanelModelLabel("codex-agent")).toBe("Codex Agent");
    expect(getCodexPanelReasoningLabel("extra-high")).toBe("Extra High");
  });
});
