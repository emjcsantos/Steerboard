import { describe, expect, it } from "vitest";
import {
  canRunWithAdapter,
  normalizeRuntimeAdapter,
  runtimeStateLabel,
  summarizeRuntimeAdapters,
  type RuntimeAdapter
} from "./runtime";

const readyAdapter: RuntimeAdapter = {
  id: "local",
  label: "Local runtime",
  state: "ready",
  readiness: 91,
  permissions: [
    { permission: "workspace_read", status: "enabled" },
    { permission: "process", status: "enabled" }
  ]
};

describe("runtime adapter model", () => {
  it("repairs malformed adapter state into safe defaults", () => {
    expect(
      normalizeRuntimeAdapter({
        id: "",
        label: "",
        state: "unknown",
        readiness: 180,
        permissions: [
          { permission: "process", status: "unexpected" },
          { permission: "private", status: "enabled" },
          null
        ]
      })
    ).toEqual({
      id: "runtime",
      label: "Local runtime",
      state: "not_configured",
      readiness: 100,
      permissions: [{ permission: "process", status: "review" }]
    });
  });

  it("allows runs only when the adapter is ready with process permission", () => {
    expect(canRunWithAdapter(readyAdapter)).toBe(true);
    expect(canRunWithAdapter({ ...readyAdapter, readiness: 79 })).toBe(false);
    expect(canRunWithAdapter({ ...readyAdapter, state: "limited" })).toBe(false);
    expect(
      canRunWithAdapter({
        ...readyAdapter,
        permissions: [{ permission: "process", status: "review" }]
      })
    ).toBe(false);
  });

  it("summarizes runtime states for the environment panel", () => {
    expect(
      summarizeRuntimeAdapters([
        readyAdapter,
        { ...readyAdapter, id: "limited", state: "limited" },
        { ...readyAdapter, id: "blocked", state: "blocked" },
        { ...readyAdapter, id: "setup", state: "not_configured" },
        { ...readyAdapter, id: "checking", state: "checking" }
      ])
    ).toEqual({
      total: 5,
      ready: 1,
      limited: 1,
      blocked: 1,
      needsSetup: 2
    });
  });

  it("returns stable user-facing labels for runtime states", () => {
    expect(runtimeStateLabel("not_configured")).toBe("Needs setup");
    expect(runtimeStateLabel("ready")).toBe("Ready");
    expect(runtimeStateLabel("blocked")).toBe("Blocked");
  });
});
