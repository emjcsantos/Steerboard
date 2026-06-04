import { describe, expect, it } from "vitest";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";
import {
  buildRuntimeProfilePermissionAuditSnapshot
} from "./runtimeProfilePermissionAudit";

const baseApproval: RuntimeProfilePermissionApprovalSnapshot = {
  id: "runtime-profile-1:permission-handoff",
  label: "Runtime profile permission handoff",
  intent: "idle",
  state: "review",
  statusLabel: "Review",
  primaryActionLabel: "Request",
  detail: "Approval detail.",
  safety: "No process execution, filesystem action, or network action is performed by this permission approval preview.",
  readiness: 70,
  approvalRequired: true,
  executionLocked: true,
  canRequest: true,
  canCancel: false,
  bridgeState: "ready"
};

const shellGranted: DesktopPermissionApprovalStatus = {
  id: "desktop-permission-approval",
  label: "Desktop permission approval",
  state: "ready",
  approvalCommandAvailable: true,
  permissionGranted: true,
  detail: "Shell can approve runtime permission requests.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "desktop"
};

const shellNotGranted: DesktopPermissionApprovalStatus = {
  ...shellGranted,
  state: "locked",
  approvalCommandAvailable: false,
  permissionGranted: false,
  detail: "Shell approval pending."
};

const sampleRecord: RuntimeProfilePermissionRequestRecord = {
  id: "runtime-profile-1:permission-handoff:requested:2026-06-04T00:00:00.000Z",
  handoffId: "runtime-profile-1:permission-handoff",
  action: "requested",
  createdAt: "2026-06-04T00:00:00.000Z",
  statusLabel: "Requested",
  readiness: 70,
  detail: "Requested local profile permission handoff.",
  bridgeState: "ready",
  bridgeSource: "desktop",
  profileId: "runtime-profile-1",
  profileLabel: "Runtime profile one"
};

describe("runtime profile permission audit snapshot", () => {
  it("blocks blocked approval with no export and locked execution", () => {
    const snapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "blocked"
      },
      shellNotGranted,
      [sampleRecord]
    );

    expect(snapshot).toEqual({
      id: "runtime-profile-1:permission-handoff:permission-audit",
      label: "Runtime profile permission handoff audit",
      state: "blocked",
      statusLabel: "Blocked",
      readiness: 0,
      executionLocked: true,
      canExport: false,
      recordCount: 1,
      detail: "Audit is blocked by permission approval readiness.",
      safety:
        "Audit preview only. No process execution, filesystem action, or network action is performed.",
      items: expect.arrayContaining([
        expect.objectContaining({ id: "runtime-profile-1:permission-handoff:permission-approval" }),
        expect.objectContaining({ id: "runtime-profile-1:permission-handoff:shell-approval" }),
        expect.objectContaining({ id: "runtime-profile-1:permission-handoff:request-history" }),
        expect.objectContaining({ id: "runtime-profile-1:permission-handoff:execution-lock" })
      ]),
      exportMarkdown: expect.any(String)
    });
  });

  it("creates pending exportable snapshot for requested approvals", () => {
    const snapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "requested"
      },
      shellNotGranted,
      [sampleRecord]
    );

    expect(snapshot.state).toBe("pending");
    expect(snapshot.statusLabel).toBe("Pending");
    expect(snapshot.canExport).toBe(true);
    expect(snapshot.recordCount).toBe(1);
    expect(snapshot.readiness).toBe(70);
  });

  it("waits when shell permission is not granted and gates export on record count", () => {
    const waitingSnapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "review",
        readiness: 84
      },
      shellNotGranted,
      [sampleRecord]
    );
    const noRecordsSnapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "requestable"
      },
      {
        ...shellNotGranted,
        detail: "Shell approval still pending."
      },
      []
    );

    expect(waitingSnapshot.state).toBe("waiting");
    expect(waitingSnapshot.statusLabel).toBe("Waiting");
    expect(waitingSnapshot.canExport).toBe(true);
    expect(waitingSnapshot.readiness).toBe(84);

    expect(noRecordsSnapshot.state).toBe("waiting");
    expect(noRecordsSnapshot.canExport).toBe(false);
  });

  it("returns ready state when requestable and shell permission is granted", () => {
    const snapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "requestable"
      },
      shellGranted,
      [sampleRecord]
    );

    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.canExport).toBe(true);
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.executionLocked).toBe(true);
  });

  it("builds export markdown with key fields and item status lines", () => {
    const snapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "requested"
      },
      shellNotGranted,
      [sampleRecord]
    );

    expect(snapshot.exportMarkdown).toContain("Runtime profile permission handoff audit");
    expect(snapshot.exportMarkdown).toContain("state: pending");
    expect(snapshot.exportMarkdown).toContain("readiness: 70");
    expect(snapshot.exportMarkdown).toContain("recordCount: 1");
    expect(snapshot.exportMarkdown).toContain("shellState: locked");
    expect(snapshot.exportMarkdown).toContain("permissionGranted: no");
    expect(snapshot.exportMarkdown).toContain("- Execution lock: locked");
    expect(snapshot.exportMarkdown).toContain("- Permission request history: ready");
  });

  it("clamps non-finite readiness to 0", () => {
    const snapshot = buildRuntimeProfilePermissionAuditSnapshot(
      {
        ...baseApproval,
        state: "requested",
        readiness: Number.POSITIVE_INFINITY
      },
      shellGranted,
      [sampleRecord]
    );

    expect(snapshot.readiness).toBe(0);
  });

  it("does not mutate approval, shell, or records inputs", () => {
    const approval: RuntimeProfilePermissionApprovalSnapshot = {
      ...baseApproval
    };
    const shell: DesktopPermissionApprovalStatus = {
      ...shellNotGranted
    };
    const records: readonly RuntimeProfilePermissionRequestRecord[] = [sampleRecord];
    const approvalCopy = JSON.parse(JSON.stringify(approval));
    const shellCopy = JSON.parse(JSON.stringify(shell));
    const recordsCopy = JSON.parse(JSON.stringify(records));

    buildRuntimeProfilePermissionAuditSnapshot(approval, shell, records);

    expect(approval).toEqual(approvalCopy);
    expect(shell).toEqual(shellCopy);
    expect(records).toEqual(recordsCopy);
  });
});
