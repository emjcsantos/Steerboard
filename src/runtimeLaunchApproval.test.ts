import { describe, expect, it } from "vitest";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import {
  buildRuntimeLaunchApprovalSnapshot,
  normalizeRuntimeLaunchApprovalIntent
} from "./runtimeLaunchApproval";

const requestSnapshot: RuntimeLaunchRequestSnapshot = {
  id: "source-1",
  label: "Primary source",
  state: "ready",
  requiresApproval: false,
  canRequest: false,
  transport: "runtime-transport",
  eventCount: 2,
  readiness: 78,
  detail: "Runtime handoff details available.",
  safety: "Local request only."
};

describe("runtime launch approval snapshot", () => {
  it("normalizes unknown intent to idle", () => {
    const normalized = normalizeRuntimeLaunchApprovalIntent("not-an-intent");

    expect(normalized).toBe("idle");
  });

  it("derives requestable state when request can be requested", () => {
    const snapshot = buildRuntimeLaunchApprovalSnapshot(
      {
        ...requestSnapshot,
        canRequest: true
      },
      "idle"
    );

    expect(snapshot).toEqual({
      id: "source-1:approval",
      label: "Primary source approval",
      intent: "idle",
      state: "requestable",
      canRequest: true,
      canCancel: false,
      statusLabel: "Ready",
      primaryActionLabel: "Request",
      detail: "Approval can be requested for the local handoff.",
      safety: "Local request only. No external process will start from this control."
    });
  });

  it("requested intent overrides requestable request and allows cancel", () => {
    const snapshot = buildRuntimeLaunchApprovalSnapshot(
      {
        ...requestSnapshot,
        canRequest: true
      },
      "requested"
    );

    expect(snapshot).toEqual({
      id: "source-1:approval",
      label: "Primary source approval",
      intent: "requested",
      state: "requested",
      canRequest: false,
      canCancel: true,
      statusLabel: "Requested",
      primaryActionLabel: "Requested",
      detail: "Approval request is queued locally and execution remains locked.",
      safety: "Local request only. No external process will start from this control."
    });
  });

  it("derives blocked state when launch request is blocked", () => {
    const snapshot = buildRuntimeLaunchApprovalSnapshot(
      {
        ...requestSnapshot,
        state: "blocked",
        canRequest: true
      },
      "requested"
    );

    expect(snapshot).toEqual({
      id: "source-1:approval",
      label: "Primary source approval",
      intent: "requested",
      state: "blocked",
      canRequest: false,
      canCancel: true,
      statusLabel: "Blocked",
      primaryActionLabel: "Request",
      detail: "Approval is blocked by launch request state.",
      safety: "Local request only. No external process will start from this control."
    });
  });

  it("reuses request detail in waiting state", () => {
    const snapshot = buildRuntimeLaunchApprovalSnapshot(requestSnapshot, "idle");

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.detail).toBe("Runtime handoff details available.");
  });

  it("does not mutate request input", () => {
    const request: RuntimeLaunchRequestSnapshot = {
      ...requestSnapshot,
      detail: "Mutable detail"
    };
    const clone = JSON.parse(JSON.stringify(request));

    buildRuntimeLaunchApprovalSnapshot(request, "requested");

    expect(request).toEqual(clone);
  });
});
