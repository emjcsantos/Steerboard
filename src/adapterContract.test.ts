import { describe, expect, it } from "vitest";
import { buildAdapterContract, summarizeAdapterContract } from "./adapterContract";
import type { RuntimeAdapter } from "./runtime";

type FixtureAdapter = RuntimeAdapter & {
  transport: string;
  capabilities: string[];
  requiredPermissions: string[];
};

describe("adapter contract builder", () => {
  it("returns blocked transport item when adapter is missing", () => {
    const items = buildAdapterContract(undefined);
    const summary = summarizeAdapterContract(items);

    expect(items).toEqual([
      {
        id: "adapter:missing",
        kind: "transport",
        label: "Runtime adapter",
        detail: "No runtime adapter is registered for this project.",
        status: "blocked"
      }
    ]);
    expect(summary).toEqual({
      total: 1,
      ready: 0,
      review: 0,
      blocked: 1,
      readiness: 0
    });
  });

  it("returns fully ready statuses for a ready adapter", () => {
    const adapter = {
      id: "runtime-ready",
      label: "Local runtime",
      state: "ready",
      readiness: 100,
      permissions: [],
      transport: "mock-transport",
      capabilities: ["File Sync", "task events"],
      requiredPermissions: ["workspace_read", "process"]
    } as FixtureAdapter;

    const items = buildAdapterContract(adapter);
    const summary = summarizeAdapterContract(items);

    expect(items.every((item) => item.status === "ready")).toBe(true);
    expect(summary).toEqual({
      total: 9,
      ready: 9,
      review: 0,
      blocked: 0,
      readiness: 100
    });
  });

  it("handles non-ready adapter states with event readiness exceptions for checking", () => {
    const states = ["limited", "checking", "not_configured"] as const;

    for (const state of states) {
      const adapter = {
        id: `runtime-${state}`,
        label: "Local runtime",
        state,
        readiness: 64,
        permissions: [],
        transport: "mock-transport",
        capabilities: ["file sync"],
        requiredPermissions: ["workspace_read"]
      } as FixtureAdapter;

      const items = buildAdapterContract(adapter);
      const summary = summarizeAdapterContract(items);

      const transportItem = items.find((item) => item.kind === "transport");
      const capabilityItems = items.filter((item) => item.kind === "capability");
      const permissionItems = items.filter((item) => item.kind === "permission");
      const eventItems = items.filter((item) => item.kind === "event");

      expect(transportItem?.status).toBe(state === "not_configured" || state === "limited" ? "review" : "review");
      expect(capabilityItems.every((item) => item.status === "review")).toBe(true);
      expect(permissionItems.every((item) => item.status === "review")).toBe(true);
      expect(eventItems.every((item) => item.status === (state === "checking" ? "ready" : "review"))).toBe(
        true
      );

      if (state === "checking") {
        expect(summary.readiness).toBe(57);
        expect(summary.ready).toBe(4);
      } else {
        expect(summary.readiness).toBe(0);
        expect(summary.ready).toBe(0);
      }
    }
  });

  it("returns fully blocked statuses for a blocked adapter", () => {
    const adapter = {
      id: "runtime-blocked",
      label: "Local runtime",
      state: "blocked",
      readiness: 12,
      permissions: [],
      transport: "mock-transport",
      capabilities: ["File Sync", "task events"],
      requiredPermissions: ["workspace_read", "process"]
    } as FixtureAdapter;

    const items = buildAdapterContract(adapter);
    const summary = summarizeAdapterContract(items);

    expect(items.every((item) => item.status === "blocked")).toBe(true);
    expect(summary).toEqual({
      total: 9,
      ready: 0,
      review: 0,
      blocked: 9,
      readiness: 0
    });
  });

  it("builds stable normalized ids and does not mutate adapter input", () => {
    const adapter = {
      id: "local-runtime",
      label: "Local runtime",
      state: "ready",
      readiness: 91,
      permissions: [],
      transport: "mock-transport",
      capabilities: ["File Sync", "task-events", ""],
      requiredPermissions: ["workspace read", "NETWORK_ACCESS", ""]
    } as unknown as FixtureAdapter;

    const before = JSON.stringify(adapter);
    const items = buildAdapterContract(adapter);

    expect(items.map((item) => item.id)).toEqual([
      "local-runtime:transport",
      "local-runtime:capability:file-sync",
      "local-runtime:capability:task-events",
      "local-runtime:capability:item",
      "local-runtime:permission:workspace-read",
      "local-runtime:permission:network-access",
      "local-runtime:permission:item",
      "local-runtime:event:session",
      "local-runtime:event:task",
      "local-runtime:event:validation",
      "local-runtime:event:tool-call"
    ]);

    expect(JSON.stringify(adapter)).toBe(before);
  });
});
