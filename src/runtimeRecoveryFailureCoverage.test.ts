import { describe, expect, it } from "vitest";
import {
  createRuntimeRecoveryFailureCoverage,
  type RuntimeRecoveryFailureCoverage
} from "./runtimeRecoveryFailureCoverage";
import type { RuntimeAdapter } from "./runtime";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

function buildAdapter(overrides: Partial<RuntimeAdapter> = {}): RuntimeAdapter {
  return {
    id: "adapter-id",
    label: "Local adapter",
    state: "ready",
    readiness: 80,
    transport: "desktop-transport",
    capabilities: ["Session stream"],
    requiredPermissions: ["process"],
    permissions: [{ permission: "process", status: "enabled" }],
    ...overrides
  };
}

function buildSource(overrides: Partial<RuntimeEventSourceSnapshot> = {}): RuntimeEventSourceSnapshot {
  return {
    id: "source-id",
    label: "Session source",
    mode: "adapter",
    state: "ready",
    transport: "desktop-transport",
    total: 1,
    available: 1,
    emitted: 0,
    pending: 0,
    accepted: 1,
    review: 0,
    blocked: 0,
    nextEventLabel: "next event",
    detail: "",
    events: [],
    ...overrides
  };
}

function buildConnection(overrides: Partial<RuntimeSourceConnectionSnapshot> = {}): RuntimeSourceConnectionSnapshot {
  return {
    id: "connection-id",
    label: "Session source connection",
    state: "ready",
    canAttach: true,
    transport: "desktop-transport",
    readiness: 80,
    requiredCapabilities: ["Session stream"],
    missingCapabilities: [],
    enabledPermissions: 1,
    requiredPermissions: 1,
    detail: "",
    ...overrides
  };
}

function buildLaunchRequest(overrides: Partial<RuntimeLaunchRequestSnapshot> = {}): RuntimeLaunchRequestSnapshot {
  return {
    id: "request-id",
    label: "Session source launch request",
    state: "ready",
    requiresApproval: false,
    canRequest: true,
    transport: "desktop-transport",
    eventCount: 1,
    readiness: 70,
    detail: "",
    safety: "safety text",
    ...overrides
  };
}

function buildApproval(overrides: Partial<RuntimeLaunchApprovalSnapshot> = {}): RuntimeLaunchApprovalSnapshot {
  return {
    id: "approval-id",
    label: "Session launch approval",
    intent: "idle",
    state: "requestable",
    canRequest: true,
    canCancel: false,
    statusLabel: "Ready",
    primaryActionLabel: "Request",
    detail: "",
    safety: "safety text",
    ...overrides
  };
}

function buildStream(overrides: Partial<RuntimeStreamSnapshot> = {}): RuntimeStreamSnapshot {
  return {
    state: "streaming",
    cursor: 0,
    total: 1,
    emitted: 0,
    pending: 1,
    accepted: 0,
    review: 0,
    blocked: 0,
    readiness: 0,
    emittedEvents: [],
    ...overrides
  };
}

describe("createRuntimeRecoveryFailureCoverage", () => {
  it("returns covered when adapter recovery, source, failure-state, and handoff are covered", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter({ readiness: 80 }),
      buildSource(),
      buildConnection(),
      buildLaunchRequest({ canRequest: true }),
      buildApproval({ state: "requestable" }),
      buildStream()
    );

    expect(result).toEqual({
      label: "Runtime recovery coverage complete",
      detail:
        "Adapter recovery, external-source state, failure-state handling, and safe handoff coverage are ready.",
      tone: "covered",
      checkLabel: "4/4 checks",
      checks: [
        {
          label: "Adapter recovery",
          value: "ready; readiness 80%",
          tone: "ok"
        },
        {
          label: "External source",
          value: "mode=adapter; state=ready; total=1; review=0; blocked=0",
          tone: "ok"
        },
        {
          label: "Failure state",
          value: "source(state=ready, blocked=0); stream(state=streaming, blocked=0)",
          tone: "ok"
        },
        {
          label: "Safe handoff",
          value:
            "connection=ready, canAttach=true; launchRequest=ready, canRequest=true; approval=requestable",
          tone: "ok"
        }
      ],
      ariaLabel:
        "Runtime recovery coverage complete: 4/4 checks; " +
        "adapter=ready; " +
        "source=adapter ready; " +
        "connection=ready; " +
        "launchRequest=ready; " +
        "approval=requestable; " +
        "stream=streaming; " +
        "Adapter recovery ready; readiness 80%; " +
        "External source mode=adapter; state=ready; total=1; review=0; blocked=0; " +
        "Failure state source(state=ready, blocked=0); stream(state=streaming, blocked=0); " +
        "Safe handoff connection=ready, canAttach=true; launchRequest=ready, canRequest=true; approval=requestable"
    });
  });

  it("treats limited adapter with readiness >= 60 as ok", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter({ state: "limited", readiness: 60 }),
      buildSource(),
      buildConnection(),
      buildLaunchRequest(),
      buildApproval({ state: "requestable" }),
      buildStream()
    );

    expect(result.tone).toBe("covered");
    expect(result.checks[0]).toMatchObject({
      label: "Adapter recovery",
      value: "limited; readiness 60%",
      tone: "ok"
    });
  });

  it("returns blocked when adapter is blocked", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter({ state: "blocked", readiness: 90 }),
      buildSource(),
      buildConnection(),
      buildLaunchRequest(),
      buildApproval()
    );

    expect(result.tone).toBe("blocked");
    expect(result.checks[0]).toMatchObject({ tone: "blocked" });
    expect(result.checks).toHaveLength(4);
    expect(result.checkLabel).toBe("3/4 checks");
  });

  it("returns blocked when external source is blocked", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter(),
      buildSource({ state: "blocked", blocked: 2 }),
      buildConnection(),
      buildLaunchRequest({ canRequest: true }),
      buildApproval()
    );

    expect(result.tone).toBe("blocked");
    expect(result.checks[1]).toMatchObject({
      label: "External source",
      tone: "blocked",
      value: "mode=adapter; state=blocked; total=1; blocked=2"
    });
  });

  it("returns review for mock source when no blockers are present", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter(),
      buildSource({ mode: "mock", state: "ready" }),
      buildConnection({ state: "ready", canAttach: false }),
      buildLaunchRequest({ canRequest: false, state: "ready" }),
      buildApproval({ state: "waiting" }),
      buildStream()
    );

    expect(result.tone).toBe("review");
    expect(result.checks[1].tone).toBe("review");
    expect(result.checks[3].tone).toBe("review");
  });

  it("returns review for review events", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter(),
      buildSource({ review: 1, mode: "adapter" }),
      buildConnection({ state: "ready", canAttach: false }),
      buildLaunchRequest({ canRequest: false, state: "ready" }),
      buildApproval({ state: "waiting" }),
      buildStream({ review: 2 })
    );

    expect(result.tone).toBe("review");
    expect(result.checks[2].tone).toBe("review");
  });

  it("returns waiting with all missing input", () => {
    const result = createRuntimeRecoveryFailureCoverage();

    expect(result).toEqual({
      label: "Runtime recovery coverage waiting",
      detail:
        "Runtime recovery coverage is waiting for adapter, source, failure, and handoff data.",
      tone: "waiting",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Adapter recovery", value: "missing", tone: "neutral" },
        { label: "External source", value: "missing", tone: "neutral" },
        { label: "Failure state", value: "missing", tone: "neutral" },
        { label: "Safe handoff", value: "missing", tone: "neutral" }
      ],
      ariaLabel:
        "Runtime recovery coverage waiting: 0/4 checks; " +
        "adapter=missing; " +
        "source=missing; " +
        "connection=missing; " +
        "launchRequest=missing; " +
        "approval=missing; " +
        "stream=missing; " +
        "Adapter recovery missing; " +
        "External source missing; " +
        "Failure state missing; " +
        "Safe handoff missing"
    });
  });

  it("defaults safe handoff to neutral when connection, request, and approval are partially missing", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter(),
      buildSource(),
      undefined,
      buildLaunchRequest({ canRequest: false, state: "ready" }),
      undefined,
      buildStream()
    );

    expect(result.checks[3].tone).toBe("neutral");
  });

  it("keeps checks in exact order and computes checkLabel", () => {
    const result = createRuntimeRecoveryFailureCoverage(
      buildAdapter({ state: "ready", readiness: 100 }),
      buildSource({ mode: "adapter", total: 2 }),
      buildConnection({ state: "ready", canAttach: true }),
      buildLaunchRequest({ canRequest: true }),
      buildApproval({ state: "requested" }),
      buildStream({ blocked: 0 })
    );

    const checkLabels = result.checks.map((check) => check.label);

    expect(checkLabels).toEqual([
      "Adapter recovery",
      "External source",
      "Failure state",
      "Safe handoff"
    ]);
    expect(result.checkLabel).toBe("4/4 checks");
  });

  it("does not mutate any input snapshots", () => {
    const adapter = buildAdapter();
    const source = buildSource();
    const connection = buildConnection();
    const launchRequest = buildLaunchRequest();
    const approval = buildApproval();
    const stream = buildStream();

    const adapterSnapshot: RuntimeAdapter = JSON.parse(JSON.stringify(adapter));
    const sourceSnapshot: RuntimeEventSourceSnapshot = JSON.parse(JSON.stringify(source));
    const connectionSnapshot: RuntimeSourceConnectionSnapshot = JSON.parse(JSON.stringify(connection));
    const launchRequestSnapshot: RuntimeLaunchRequestSnapshot = JSON.parse(JSON.stringify(launchRequest));
    const approvalSnapshot: RuntimeLaunchApprovalSnapshot = JSON.parse(JSON.stringify(approval));
    const streamSnapshot: RuntimeStreamSnapshot = JSON.parse(JSON.stringify(stream));

    createRuntimeRecoveryFailureCoverage(
      adapter,
      source,
      connection,
      launchRequest,
      approval,
      stream
    );

    expect(adapter).toEqual(adapterSnapshot);
    expect(source).toEqual(sourceSnapshot);
    expect(connection).toEqual(connectionSnapshot);
    expect(launchRequest).toEqual(launchRequestSnapshot);
    expect(approval).toEqual(approvalSnapshot);
    expect(stream).toEqual(streamSnapshot);
  });
});
