import { describe, expect, it } from "vitest";
import type { PipelineItem } from "./fixtures";
import { buildPipelineItemDispatchPreview } from "./pipelineItemDispatchPreview";
import type { RegistryEntry } from "./registry";
import type { RuntimeAdapter } from "./runtime";

const readyItem: PipelineItem = {
  id: "pipe-ready-preview",
  projectId: "website-refresh",
  title: "Prepare dispatch preview",
  stage: "ready",
  owner: "Orchestrator",
  risk: "low",
  readiness: 94
};

const readyRegistry: RegistryEntry = {
  projectId: "website-refresh",
  projectName: "Website Refresh",
  status: "active",
  workspaceLabel: "Marketing workspace",
  runtimeState: "ready",
  permissionState: "allowed",
  readiness: 100
};

const readyRuntime: RuntimeAdapter = {
  id: "website-refresh",
  label: "Local runtime",
  state: "ready",
  readiness: 95,
  transport: "mock-local-transport",
  capabilities: ["Task state", "Validation evidence"],
  requiredPermissions: ["workspace_read", "process", "network"],
  permissions: [
    { permission: "workspace_read", status: "enabled" },
    { permission: "process", status: "enabled" },
    { permission: "network", status: "review" }
  ]
};

describe("buildPipelineItemDispatchPreview", () => {
  it("returns ready when item, registry, and runtime gates all pass", () => {
    const preview = buildPipelineItemDispatchPreview(readyItem, readyRegistry, readyRuntime);

    expect(preview.itemId).toBe("pipe-ready-preview");
    expect(preview.state).toBe("ready");
    expect(preview.canDispatch).toBe(true);
    expect(preview.gates).toHaveLength(3);
    expect(preview.gates.every((gate) => gate.status === "ready")).toBe(true);
    expect(preview.detail).toContain("Dispatch is ready.");
  });

  it("returns review when the item gate is not ready", () => {
    const notReadyItem: PipelineItem = {
      ...readyItem,
      id: "pipe-item-not-ready",
      stage: "planned",
      readiness: 91
    };

    const preview = buildPipelineItemDispatchPreview(notReadyItem, readyRegistry, readyRuntime);

    expect(preview.state).toBe("review");
    expect(preview.canDispatch).toBe(false);
    expect(preview.gates.find((gate) => gate.id === "item")?.status).toBe("review");
    expect(preview.detail).toContain("Dispatch requires review.");
  });

  it("returns review when the registry gate is missing", () => {
    const preview = buildPipelineItemDispatchPreview(readyItem, undefined, readyRuntime);

    expect(preview.state).toBe("review");
    expect(preview.canDispatch).toBe(false);
    expect(preview.gates.find((gate) => gate.id === "registry")?.status).toBe("review");
    expect(preview.detail).toContain("Registry entry: No registry entry was provided for this item.");
  });

  it("returns blocked when runtime gate is blocked", () => {
    const blockedRuntime: RuntimeAdapter = {
      ...readyRuntime,
      state: "blocked",
      readiness: 100
    };

    const preview = buildPipelineItemDispatchPreview(readyItem, readyRegistry, blockedRuntime);

    expect(preview.state).toBe("blocked");
    expect(preview.canDispatch).toBe(false);
    expect(preview.gates.find((gate) => gate.id === "runtime")?.status).toBe("blocked");
    expect(preview.detail).toContain("Dispatch is blocked.");
  });

  it("returns blocked when runtime permission is disabled", () => {
    const permissionBlockedRuntime: RuntimeAdapter = {
      ...readyRuntime,
      permissions: [
        { permission: "workspace_read", status: "enabled" },
        { permission: "process", status: "disabled" },
        { permission: "network", status: "review" }
      ]
    };

    const preview = buildPipelineItemDispatchPreview(readyItem, readyRegistry, permissionBlockedRuntime);

    expect(preview.state).toBe("blocked");
    expect(preview.canDispatch).toBe(false);
    expect(preview.gates.find((gate) => gate.id === "runtime")?.status).toBe("blocked");
    expect(preview.detail).toContain("Dispatch is blocked.");
  });

  it("handles malformed edge values without throwing and returns review", () => {
    const malformedRuntime: RuntimeAdapter = {
      ...readyRuntime,
      readiness: Number.NaN
    };

    const preview = buildPipelineItemDispatchPreview(readyItem, readyRegistry, malformedRuntime);

    expect(preview.canDispatch).toBe(false);
    expect(preview.state).toBe("review");
    expect(preview.gates.find((gate) => gate.id === "runtime")?.status).toBe("review");
  });
});
