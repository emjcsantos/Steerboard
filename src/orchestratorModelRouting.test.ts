import { describe, expect, it } from "vitest";
import { resolveOrchestratorModelRouting } from "./orchestratorModelRouting";
import type { WorkerModelProfile } from "./orchestratorWorkerDispatch";

function profile(id: string, role: WorkerModelProfile["role"], provider: WorkerModelProfile["provider"], model: string): WorkerModelProfile {
  return {
    id,
    role,
    provider,
    model,
    reasoningEffort: role === "validator" ? "high" : "medium",
    authRef: `${provider}-auth`,
    capabilities: {
      tools: true,
      filesystem: role !== "orchestrator",
      shell: role === "worker",
      browser: false,
      structuredOutput: true
    }
  };
}

describe("orchestrator model routing", () => {
  it("resolves worker, validator, and orchestrator profiles independently", () => {
    const routing = resolveOrchestratorModelRouting({
      profiles: [
        profile("worker-anthropic", "worker", "anthropic", "claude-worker"),
        profile("validator-openai", "validator", "openai-api", "gpt-validator"),
        profile("orchestrator-codex", "orchestrator", "codex", "gpt-orchestrator")
      ],
      workerProfileId: "worker-anthropic",
      requireSupportProfiles: true
    });

    expect(routing.worker).toMatchObject({ provider: "anthropic", model: "claude-worker", reasoningEffort: "medium" });
    expect(routing.validator).toMatchObject({ provider: "openai-api", model: "gpt-validator", reasoningEffort: "high" });
    expect(routing.orchestrator).toMatchObject({ provider: "codex", model: "gpt-orchestrator" });
    expect(routing.missingRoles).toEqual([]);
  });

  it("blocks an explicitly assigned missing worker profile instead of substituting a default", () => {
    const routing = resolveOrchestratorModelRouting({ profiles: [], workerProfileId: "missing" });

    expect(routing.worker).toBeUndefined();
    expect(routing.missingRoles).toEqual(["worker"]);
  });

  it("copies resolved snapshots so later catalog mutation cannot alter routing truth", () => {
    const source = profile("worker", "worker", "gemini", "gemini-worker");
    const routing = resolveOrchestratorModelRouting({ profiles: [source] });
    source.model = "mutated";
    source.capabilities.shell = false;

    expect(routing.worker).toMatchObject({ model: "gemini-worker", capabilities: { shell: true } });
  });
});
