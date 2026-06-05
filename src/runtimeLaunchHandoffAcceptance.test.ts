import { describe, expect, it } from "vitest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import { createRuntimeLaunchHandoffAcceptance } from "./runtimeLaunchHandoffAcceptance";

const sourceSnapshot: RuntimeEventSourceSnapshot = {
  id: "source-1",
  label: "Source",
  mode: "mock",
  state: "ready",
  transport: "runtime-transport",
  total: 3,
  available: 2,
  emitted: 1,
  pending: 1,
  accepted: 1,
  review: 0,
  blocked: 0,
  nextEventLabel: "Run",
  detail: "Event source ready.",
  events: []
};

const connectionSnapshot: RuntimeSourceConnectionSnapshot = {
  id: "source-1:connection",
  label: "Source connection",
  state: "ready",
  canAttach: true,
  transport: "runtime-transport",
  readiness: 80,
  requiredCapabilities: [],
  missingCapabilities: [],
  enabledPermissions: 2,
  requiredPermissions: 2,
  detail: "Connection ready."
};

const launchRequestSnapshot: RuntimeLaunchRequestSnapshot = {
  id: "source-1:launch-request",
  label: "Source launch request",
  state: "ready",
  requiresApproval: true,
  canRequest: true,
  transport: "runtime-transport",
  eventCount: 2,
  readiness: 80,
  detail: "Launch request ready.",
  safety: "Local safety."
};

const approvalSnapshot: RuntimeLaunchApprovalSnapshot = {
  id: "source-1:approval",
  label: "Source approval",
  intent: "idle",
  state: "requestable",
  canRequest: true,
  canCancel: false,
  statusLabel: "Ready",
  primaryActionLabel: "Request",
  detail: "Approval requestable.",
  safety: "Local safety."
};

describe("createRuntimeLaunchHandoffAcceptance", () => {
  it("returns ready when all checks are ready and returns exact checks", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      sourceSnapshot,
      connectionSnapshot,
      launchRequestSnapshot,
      approvalSnapshot
    );

    expect(result).toEqual({
      label: "Runtime handoff acceptance ready",
      detail:
        "Event source, connection, launch request, and approval checks are ready for runtime handoff.",
      tone: "ready",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Event source", value: "ready", tone: "ok" },
        { label: "Connection", value: "ready", tone: "ok" },
        { label: "Launch request", value: "ready", tone: "ok" },
        { label: "Approval", value: "requestable", tone: "ok" }
      ],
      ariaLabel:
        "Runtime handoff acceptance ready: 4/4 checks; " +
        "Source state ready; " +
        "Connection state ready; " +
        "Launch request state ready; " +
        "Approval state requestable; " +
        "Event source ready; " +
        "Connection ready; " +
        "Launch request ready; " +
        "Approval requestable"
    });
  });

  it("accepts approval requested as an ok state", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      sourceSnapshot,
      connectionSnapshot,
      launchRequestSnapshot,
      {
        ...approvalSnapshot,
        state: "requested"
      }
    );

    expect(result.tone).toBe("ready");
    expect(result.checks[3]).toEqual({
      label: "Approval",
      value: "requested",
      tone: "ok"
    });
  });

  it("returns blocked when source is blocked", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      {
        ...sourceSnapshot,
        state: "blocked",
        blocked: 2
      },
      connectionSnapshot,
      launchRequestSnapshot,
      approvalSnapshot
    );

    expect(result.tone).toBe("blocked");
    expect(result.checks[0].tone).toBe("blocked");
  });

  it("returns blocked when launch request is blocked", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      sourceSnapshot,
      connectionSnapshot,
      {
        ...launchRequestSnapshot,
        state: "blocked"
      },
      approvalSnapshot
    );

    expect(result.tone).toBe("blocked");
    expect(result.checks[2].tone).toBe("blocked");
  });

  it("returns review when launch request needs preview", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      sourceSnapshot,
      connectionSnapshot,
      {
        ...launchRequestSnapshot,
        state: "preview",
        canRequest: false,
        requiresApproval: false
      },
      approvalSnapshot
    );

    expect(result.tone).toBe("review");
    expect(result.checks[2]).toEqual({
      label: "Launch request",
      value: "preview",
      tone: "review"
    });
  });

  it("returns waiting when all inputs are missing", () => {
    const result = createRuntimeLaunchHandoffAcceptance();

    expect(result).toEqual({
      label: "Runtime handoff acceptance waiting",
      detail:
        "Runtime handoff acceptance is waiting for source, connection, launch request, and approval data.",
      tone: "waiting",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Event source", value: "missing", tone: "neutral" },
        { label: "Connection", value: "missing", tone: "neutral" },
        { label: "Launch request", value: "missing", tone: "neutral" },
        { label: "Approval", value: "missing", tone: "neutral" }
      ],
      ariaLabel:
        "Runtime handoff acceptance waiting: 0/4 checks; " +
        "Source state missing; " +
        "Connection state missing; " +
        "Launch request state missing; " +
        "Approval state missing; " +
        "Event source missing; " +
        "Connection missing; " +
        "Launch request missing; " +
        "Approval missing"
    });
  });

  it("keeps missing connection/request/approval checks neutral when source is present", () => {
    const result = createRuntimeLaunchHandoffAcceptance(sourceSnapshot);

    expect(result.tone).toBe("review");
    expect(result.checks).toEqual([
      { label: "Event source", value: "ready", tone: "ok" },
      { label: "Connection", value: "missing", tone: "neutral" },
      { label: "Launch request", value: "missing", tone: "neutral" },
      { label: "Approval", value: "missing", tone: "neutral" }
    ]);
  });

  it("keeps checks in the exact source/connection/request/approval order", () => {
    const result = createRuntimeLaunchHandoffAcceptance(
      sourceSnapshot,
      connectionSnapshot,
      launchRequestSnapshot,
      approvalSnapshot
    );

    expect(result.checks.map((check) => check.label)).toEqual([
      "Event source",
      "Connection",
      "Launch request",
      "Approval"
    ]);
  });

  it("does not mutate source, connection, launch request, or approval inputs", () => {
    const source = {
      ...sourceSnapshot,
      events: [...sourceSnapshot.events]
    };
    const connection = {
      ...connectionSnapshot,
      requiredCapabilities: [...connectionSnapshot.requiredCapabilities],
      missingCapabilities: [...connectionSnapshot.missingCapabilities]
    };
    const launchRequest = {
      ...launchRequestSnapshot
    };
    const approval = {
      ...approvalSnapshot
    };

    const sourceClone = JSON.parse(JSON.stringify(source));
    const connectionClone = JSON.parse(JSON.stringify(connection));
    const launchRequestClone = JSON.parse(JSON.stringify(launchRequest));
    const approvalClone = JSON.parse(JSON.stringify(approval));

    createRuntimeLaunchHandoffAcceptance(source, connection, launchRequest, approval);

    expect(source).toEqual(sourceClone);
    expect(connection).toEqual(connectionClone);
    expect(launchRequest).toEqual(launchRequestClone);
    expect(approval).toEqual(approvalClone);
  });
});
