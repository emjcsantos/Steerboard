import { describe, expect, it } from "vitest";
import type { RuntimeLaunchApprovalSnapshot } from "./runtimeLaunchApproval";
import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";
import { buildRuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";

const baseRequestSnapshot: RuntimeLaunchRequestSnapshot = {
  id: "source-1",
  label: "Primary source",
  state: "waiting",
  requiresApproval: true,
  canRequest: false,
  transport: "runtime-transport",
  eventCount: 2,
  readiness: 55,
  detail: "Launch request details.",
  safety: "Local preview safety."
};

const baseApprovalSnapshot: RuntimeLaunchApprovalSnapshot = {
  id: "source-1:approval",
  label: "Primary source approval",
  intent: "idle",
  state: "waiting",
  canRequest: false,
  canCancel: false,
  statusLabel: "Waiting",
  primaryActionLabel: "Request",
  detail: "Approval detail reused for waiting state.",
  safety: "Local approval safety."
};

describe("runtime execution audit snapshot", () => {
  it("returns waiting state and reuses approval detail", () => {
    const snapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        requiresApproval: false
      },
      {
        ...baseApprovalSnapshot,
        detail: "Custom approval status for waiting path."
      }
    );

    expect(snapshot).toEqual({
      id: "source-1:approval:execution-audit",
      label: "Primary source approval execution audit",
      state: "waiting",
      statusLabel: "Waiting",
      eventCount: 2,
      transport: "runtime-transport",
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: false,
      detail: "Custom approval status for waiting path.",
      safety: "Audit preview only. Runtime execution remains locked.",
      items: [
        {
          id: "source-1:launch-request",
          label: "Launch request",
          status: "waiting",
          detail: "Launch request is waiting for readiness."
        },
        {
          id: "source-1:approval:local-approval",
          label: "Local approval",
          status: "waiting",
          detail: "Local approval is waiting for action."
        },
        {
          id: "source-1:approval:execution-lock",
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    });
  });

  it("returns ready state when requestable and ready", () => {
    const snapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        state: "ready",
        canRequest: true
      },
      {
        ...baseApprovalSnapshot,
        state: "requestable"
      }
    );

    expect(snapshot).toEqual({
      id: "source-1:approval:execution-audit",
      label: "Primary source approval execution audit",
      state: "ready",
      statusLabel: "Ready",
      eventCount: 2,
      transport: "runtime-transport",
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: true,
      detail: "Execution audit is ready after approval request.",
      safety: "Audit preview only. Runtime execution remains locked.",
      items: [
        {
          id: "source-1:launch-request",
          label: "Launch request",
          status: "ready",
          detail: "Launch request is ready to proceed."
        },
        {
          id: "source-1:approval:local-approval",
          label: "Local approval",
          status: "waiting",
          detail: "Local approval is ready to be requested."
        },
        {
          id: "source-1:approval:execution-lock",
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    });
  });

  it("returns pending state when approval is requested", () => {
    const snapshot = buildRuntimeExecutionAuditSnapshot(
      baseRequestSnapshot,
      {
        ...baseApprovalSnapshot,
        state: "requested"
      }
    );

    expect(snapshot).toEqual({
      id: "source-1:approval:execution-audit",
      label: "Primary source approval execution audit",
      state: "pending",
      statusLabel: "Pending",
      eventCount: 2,
      transport: "runtime-transport",
      canExecute: false,
      executionLocked: true,
      requiresDesktopApproval: true,
      detail: "Local approval is queued and desktop execution remains locked.",
      safety: "Audit preview only. Runtime execution remains locked.",
      items: [
        {
          id: "source-1:launch-request",
          label: "Launch request",
          status: "waiting",
          detail: "Launch request is waiting for execution setup."
        },
        {
          id: "source-1:approval:local-approval",
          label: "Local approval",
          status: "ready",
          detail: "Local approval has been requested and is pending."
        },
        {
          id: "source-1:approval:execution-lock",
          label: "Execution lock",
          status: "locked",
          detail: "Runtime execution is unavailable in this preview."
        }
      ]
    });
  });

  it("returns blocked state when launch readiness blocks audit", () => {
    const snapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        state: "blocked"
      },
      {
        ...baseApprovalSnapshot,
        state: "requestable"
      }
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.requiresDesktopApproval).toBe(false);
    expect(snapshot.detail).toContain("launch readiness");
  });

  it("always marks execution as locked and not executable", () => {
    const snapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        canRequest: true,
        state: "ready"
      },
      {
        ...baseApprovalSnapshot,
        state: "requested"
      }
    );

    expect(snapshot.canExecute).toBe(false);
    expect(snapshot.executionLocked).toBe(true);
    expect(snapshot.items.at(-1)?.status).toBe("locked");
  });

  it("maps item statuses for launch request and local approval states", () => {
    const readySnapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        state: "ready",
        canRequest: true
      },
      {
        ...baseApprovalSnapshot,
        state: "requestable"
      }
    );
    const waitingSnapshot = buildRuntimeExecutionAuditSnapshot(
      {
        ...baseRequestSnapshot,
        canRequest: false,
        state: "preview"
      },
      {
        ...baseApprovalSnapshot,
        state: "waiting"
      }
    );
    const blockedSnapshot = buildRuntimeExecutionAuditSnapshot(
      baseRequestSnapshot,
      {
        ...baseApprovalSnapshot,
        state: "blocked"
      }
    );

    expect(readySnapshot.items[0].status).toBe("ready");
    expect(readySnapshot.items[1].status).toBe("waiting");
    expect(waitingSnapshot.items[1].status).toBe("waiting");
    expect(blockedSnapshot.items[1].status).toBe("blocked");
    expect(blockedSnapshot.items[0].status).toBe("waiting");
    expect(blockedSnapshot.state).toBe("blocked");
  });

  it("does not mutate request or approval inputs", () => {
    const request: RuntimeLaunchRequestSnapshot = {
      ...baseRequestSnapshot,
      detail: "Mutable request detail."
    };
    const approval: RuntimeLaunchApprovalSnapshot = {
      ...baseApprovalSnapshot,
      detail: "Mutable approval detail."
    };
    const requestClone = JSON.parse(JSON.stringify(request));
    const approvalClone = JSON.parse(JSON.stringify(approval));

    buildRuntimeExecutionAuditSnapshot(request, approval);

    expect(request).toEqual(requestClone);
    expect(approval).toEqual(approvalClone);
  });
});
