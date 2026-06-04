import { describe, expect, it } from "vitest";
import { createCockpitPanelRuntime } from "./cockpitPanelRuntime";

describe("createCockpitPanelRuntime", () => {
  it("returns fallback values for non-string or blank runtime", () => {
    expect(createCockpitPanelRuntime({ runtime: null })).toEqual({
      label: "No runtime",
      detail: "Runtime information is not available.",
      tone: "neutral"
    });

    expect(createCockpitPanelRuntime({ runtime: "" })).toEqual({
      label: "No runtime",
      detail: "Runtime information is not available.",
      tone: "neutral"
    });

    expect(createCockpitPanelRuntime({ runtime: "   " })).toEqual({
      label: "No runtime",
      detail: "Runtime information is not available.",
      tone: "neutral"
    });
  });

  it("uses role classification before runtime classification", () => {
    expect(
      createCockpitPanelRuntime({
        runtime: "main workspace/dispatcher",
        role: "worker"
      })
    ).toMatchObject({
      tone: "worker"
    });

    expect(
      createCockpitPanelRuntime({
        runtime: "orchestrator-profile",
        role: "implementer"
      })
    ).toMatchObject({
      tone: "worker"
    });
  });

  it("derives tones from runtime text when role is unknown", () => {
    expect(createCockpitPanelRuntime({ runtime: "Model-Only / orchestrator workspace" })).toMatchObject({
      tone: "orchestrator"
    });
    expect(createCockpitPanelRuntime({ runtime: "worker/profile/main" })).toMatchObject({
      tone: "worker"
    });
    expect(createCockpitPanelRuntime({ runtime: "review-checkpoint" })).toMatchObject({
      tone: "validator"
    });
    expect(createCockpitPanelRuntime({ runtime: "integration-engine" })).toMatchObject({
      tone: "integration"
    });
    expect(createCockpitPanelRuntime({ runtime: "local desktop runtime" })).toMatchObject({
      tone: "local"
    });
  });

  it("normalizes whitespace and slash/backslash separators", () => {
    const signal = createCockpitPanelRuntime({
      runtime: "  worker\\\\profile   /  runtime  "
    });

    expect(signal.label).toBe("worker/profile/runtime");
    expect(signal.tone).toBe("worker");
    expect(signal.detail).toBe("Runtime: worker/profile/runtime");
  });

  it("sanitizes absolute Windows, UNC, and Unix runtime paths to basename only", () => {
    expect(createCockpitPanelRuntime({ runtime: "C:\\\\Users\\\\mj\\\\runtimes\\\\validator" })).toEqual({
      label: "validator",
      detail: "Runtime: validator",
      tone: "validator"
    });

    expect(createCockpitPanelRuntime({ runtime: "\\\\\\\\server\\\\share\\\\runtimes\\\\worker" })).toEqual({
      label: "worker",
      detail: "Runtime: worker",
      tone: "worker"
    });

    expect(createCockpitPanelRuntime({ runtime: "/tmp/mj/runtimes/orchestrator" })).toEqual({
      label: "orchestrator",
      detail: "Runtime: orchestrator",
      tone: "orchestrator"
    });
  });

  it("truncates label and detail for compact display", () => {
    const signal = createCockpitPanelRuntime({
      runtime:
        "worker-profile-for-testing-the-compact-badge-behavior-in-the-runtime-panel-which-is-long-enough-to-trigger-detail-truncation"
    });

    expect(signal.label.length).toBeLessThanOrEqual(24);
    expect(signal.label).toBe("worker-profile-for-te...");

    expect(signal.detail.length).toBeLessThanOrEqual(96);
    expect(signal.detail.startsWith("Runtime: ")).toBe(true);
    expect(signal.detail).toMatch(/\.{3}$/);
  });
});
