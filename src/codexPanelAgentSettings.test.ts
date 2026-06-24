import { describe, expect, it } from "vitest";
import {
  defaultCodexPanelAgentSettings,
  getCodexPanelModelLabel,
  getCodexPanelPermissionModeLabel,
  getCodexPanelReasoningLabel,
  normalizeCodexPanelAgentSettings,
  parseStoredCodexPanelAgentSettings
} from "./codexPanelAgentSettings";

describe("codex panel agent settings", () => {
  it("normalizes valid model and reasoning choices", () => {
    expect(
      normalizeCodexPanelAgentSettings({
        model: "gpt-5.5",
        reasoning: "xhigh",
        permissionMode: "workspace-agent"
      })
    ).toEqual({
      model: "gpt-5.5",
      reasoning: "xhigh",
      permissionMode: "workspace-agent"
    });
  });

  it("repairs old Codex Agent and reasoning settings to current defaults", () => {
    expect(
      normalizeCodexPanelAgentSettings({
        model: "codex-agent",
        reasoning: "extra-high"
      })
    ).toEqual({
      model: "gpt-5.5",
      reasoning: "xhigh",
      permissionMode: "full-agent"
    });
  });

  it("falls back for malformed or unsupported saved choices", () => {
    expect(normalizeCodexPanelAgentSettings(null)).toEqual(defaultCodexPanelAgentSettings);
    expect(
      normalizeCodexPanelAgentSettings({
        model: "not a model",
        reasoning: "too-much",
        permissionMode: "sideways"
      })
    ).toEqual(defaultCodexPanelAgentSettings);
  });

  it("defaults new panels to Full Agent permission mode", () => {
    expect(defaultCodexPanelAgentSettings.permissionMode).toBe("full-agent");
    expect(normalizeCodexPanelAgentSettings({ model: "gpt-5.4", reasoning: "low" })).toEqual({
      model: "gpt-5.4",
      reasoning: "low",
      permissionMode: "full-agent"
    });
  });

  it("parses per-panel settings and drops blank panel ids", () => {
    expect(
      parseStoredCodexPanelAgentSettings(
        JSON.stringify({
          "panel-1": { model: "gpt-5.5", reasoning: "medium", permissionMode: "chat-only" },
          " ": { model: "provider-default", reasoning: "high" },
          "panel-2": {
            model: "gpt-5.3-codex-spark",
            reasoning: "high",
            permissionMode: "read-only-agent"
          }
        })
      )
    ).toEqual({
      "panel-1": { model: "gpt-5.5", reasoning: "medium", permissionMode: "chat-only" },
      "panel-2": {
        model: "gpt-5.3-codex-spark",
        reasoning: "high",
        permissionMode: "read-only-agent"
      }
    });
  });

  it("returns display labels for selected settings", () => {
    expect(getCodexPanelModelLabel("gpt-5.5")).toBe("GPT-5.5");
    expect(getCodexPanelModelLabel("gpt-5.3-codex-spark")).toBe("GPT-5.3 Codex Spark");
    expect(getCodexPanelReasoningLabel("xhigh")).toBe("X High");
    expect(getCodexPanelPermissionModeLabel("full-agent")).toBe("Full Agent");
  });
});
