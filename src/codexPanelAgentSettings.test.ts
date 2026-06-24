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
        model: "gpt-5.5",
        reasoning: "extra-high"
      })
    ).toEqual({
      model: "gpt-5.5",
      reasoning: "extra-high"
    });
  });

  it("repairs the old Codex Agent setting to the GPT-5.5 orchestrator default", () => {
    expect(
      normalizeCodexPanelAgentSettings({
        model: "codex-agent",
        reasoning: "medium"
      })
    ).toEqual({
      model: "gpt-5.5",
      reasoning: "medium"
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
          "panel-1": { model: "gpt-5.5", reasoning: "medium" },
          " ": { model: "provider-default", reasoning: "high" },
          "panel-2": { model: "gpt-5.3-codex-spark", reasoning: "high" }
        })
      )
    ).toEqual({
      "panel-1": { model: "gpt-5.5", reasoning: "medium" },
      "panel-2": { model: "gpt-5.3-codex-spark", reasoning: "high" }
    });
  });

  it("returns display labels for selected settings", () => {
    expect(getCodexPanelModelLabel("gpt-5.5")).toBe("GPT-5.5");
    expect(getCodexPanelModelLabel("gpt-5.3-codex-spark")).toBe("GPT-5.3 Codex Spark");
    expect(getCodexPanelReasoningLabel("extra-high")).toBe("Extra High");
  });
});
