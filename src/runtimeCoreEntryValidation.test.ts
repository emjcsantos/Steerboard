import { describe, expect, it } from "vitest";
import { buildAdapterContract } from "./adapterContract";
import type { RuntimeAdapter } from "./runtime";
import type { RuntimeAdapterSessionSnapshot } from "./runtimeAdapterSession";
import type { AdapterContractItem } from "./adapterContract";
import { createRuntimeCoreEntryValidation } from "./runtimeCoreEntryValidation";

const readyAdapter: RuntimeAdapter = {
  id: "runtime-ready",
  label: "Runtime adapter",
  state: "ready",
  readiness: 90,
  transport: "local",
  capabilities: ["session stream", "task state"],
  requiredPermissions: ["process", "workspace_read"],
  permissions: [
    { permission: "process", status: "enabled" },
    { permission: "workspace_read", status: "enabled" },
    { permission: "workspace_write", status: "review" }
  ]
};

const readySession: RuntimeAdapterSessionSnapshot = {
  id: "session-ready",
  label: "Runtime session",
  state: "ready",
  health: "quiet",
  transport: "local",
  readiness: 92,
  emitted: 0,
  pending: 0,
  accepted: 0,
  review: 0,
  blocked: 0,
  enabledPermissions: 2,
  requiredPermissions: 2,
  heartbeat: "Adapter session is ready.",
  latestEventLabel: "No emitted events"
};

const reviewingSession: RuntimeAdapterSessionSnapshot = {
  ...readySession,
  id: "session-review",
  state: "live",
  health: "review"
};

const blockedSession: RuntimeAdapterSessionSnapshot = {
  ...readySession,
  id: "session-blocked",
  state: "blocked",
  health: "blocked"
};

describe("createRuntimeCoreEntryValidation", () => {
  it("returns ready when adapter, contract, session, and entry points are all ready", () => {
    const contractItems = buildAdapterContract(readyAdapter);
    const result = createRuntimeCoreEntryValidation(readyAdapter, contractItems, readySession);

    expect(result).toEqual({
      label: "Runtime entry validation ready",
      detail:
        "Adapter, contract, session, and entry-point checks are ready for runtime validation.",
      tone: "ready",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Adapter", value: "ready", tone: "ok" },
        { label: "Contract", value: "9/9", tone: "ok" },
        { label: "Session", value: "ready", tone: "ok" },
        { label: "Entry points", value: "2/2 perms", tone: "ok" }
      ],
      ariaLabel: expect.stringContaining("Runtime entry validation ready")
    });
  });

  it("returns missing when no adapter is provided", () => {
    const result = createRuntimeCoreEntryValidation(
      undefined,
      buildAdapterContract(undefined),
      readySession
    );

    expect(result.tone).toBe("missing");
    expect(result.label).toBe("Runtime entry validation missing");
    expect(result.detail).toBe("No runtime adapter is available for core entry validation.");
    expect(result.checks).toEqual([
      { label: "Adapter", value: "missing", tone: "neutral" },
      { label: "Contract", value: "0/1", tone: "blocked" },
      { label: "Session", value: "ready", tone: "ok" },
      { label: "Entry points", value: "0/0 perms", tone: "neutral" }
    ]);
    expect(result.checkLabel).toBe("1/4 checks");
    expect(result.ariaLabel).toContain("Adapter missing");
    expect(result.ariaLabel).toContain("Session state ready");
  });

  it("returns blocked when any blocker condition exists across checks", () => {
    const blockedAdapter: RuntimeAdapter = {
      ...readyAdapter,
      id: "runtime-not-configured",
      state: "not_configured",
      readiness: 0,
      permissions: [
        { permission: "process", status: "disabled" },
        { permission: "workspace_read", status: "disabled" }
      ]
    };

    const contractItems: AdapterContractItem[] = [
      {
        id: "transport-blocked",
        kind: "transport",
        label: "Transport",
        detail: "No transport",
        status: "blocked"
      }
    ];

    const result = createRuntimeCoreEntryValidation(
      blockedAdapter,
      contractItems,
      blockedSession
    );

    expect(result.tone).toBe("blocked");
    expect(result.checks).toEqual([
      { label: "Adapter", value: "not_configured", tone: "blocked" },
      { label: "Contract", value: "0/1", tone: "blocked" },
      { label: "Session", value: "blocked", tone: "blocked" },
      { label: "Entry points", value: "0/2 perms", tone: "blocked" }
    ]);
  });

  it("returns review when checks are partial and not blocked", () => {
    const partialAdapter: RuntimeAdapter = {
      ...readyAdapter,
      id: "runtime-review",
      readiness: 90,
      permissions: [
        { permission: "process", status: "disabled" },
        { permission: "workspace_read", status: "enabled" }
      ]
    };

    const result = createRuntimeCoreEntryValidation(partialAdapter, [
      {
        id: "transport-review",
        kind: "transport",
        label: "Transport",
        detail: "reviewing",
        status: "review"
      },
      {
        id: "capability-review",
        kind: "capability",
        label: "Capability",
        detail: "active",
        status: "ready"
      },
      {
        id: "permission-review",
        kind: "permission",
        label: "Permission",
        detail: "workspace",
        status: "review"
      }
    ], reviewingSession);

    expect(result.tone).toBe("review");
    expect(result.checkLabel).toBe("0/4 checks");
    expect(result.checks).toEqual([
      { label: "Adapter", value: "ready", tone: "review" },
      { label: "Contract", value: "1/3", tone: "review" },
      { label: "Session", value: "live", tone: "review" },
      { label: "Entry points", value: "1/2 perms", tone: "review" }
    ]);
  });

  it("keeps exact check order and builds the expected check label", () => {
    const contractItems = buildAdapterContract(readyAdapter).slice(0, 2);
    const result = createRuntimeCoreEntryValidation(
      readyAdapter,
      [
        ...contractItems,
        {
          id: "transport-review-order",
          kind: "transport",
          label: "Transport",
          detail: "Needs review",
          status: "review"
        }
      ],
      readySession
    );

    expect(result.checks.map((check) => check.label)).toEqual([
      "Adapter",
      "Contract",
      "Session",
      "Entry points"
    ]);
    expect(result.checkLabel).toBe("3/4 checks");
  });

  it("handles missing contract and session data without throwing", () => {
    const result = createRuntimeCoreEntryValidation(readyAdapter);

    expect(result.tone).toBe("review");
    expect(result.checkLabel).toBe("2/4 checks");
    expect(result.checks).toEqual([
      { label: "Adapter", value: "ready", tone: "ok" },
      { label: "Contract", value: "0/0", tone: "neutral" },
      { label: "Session", value: "missing", tone: "neutral" },
      { label: "Entry points", value: "2/2 perms", tone: "ok" }
    ]);
    expect(result.ariaLabel).toContain("Session state missing");
  });

  it("keeps missing adapter tone when adapter, contract, and session are absent", () => {
    const result = createRuntimeCoreEntryValidation(undefined);

    expect(result.tone).toBe("missing");
    expect(result.label).toBe("Runtime entry validation missing");
    expect(result.checks).toEqual([
      { label: "Adapter", value: "missing", tone: "neutral" },
      { label: "Contract", value: "0/0", tone: "neutral" },
      { label: "Session", value: "missing", tone: "neutral" },
      { label: "Entry points", value: "0/0 perms", tone: "neutral" }
    ]);
  });

  it("does not mutate adapter, contract items, or session", () => {
    const contractItems = buildAdapterContract(readyAdapter);
    const session: RuntimeAdapterSessionSnapshot = { ...readySession };
    const adapter = structuredClone(readyAdapter);
    const contractItemsClone = structuredClone(contractItems);
    const sessionClone = structuredClone(session);

    createRuntimeCoreEntryValidation(adapter, contractItems, session);

    expect(adapter).toEqual(readyAdapter);
    expect(contractItems).toEqual(contractItemsClone);
    expect(session).toEqual(sessionClone);
  });
});
