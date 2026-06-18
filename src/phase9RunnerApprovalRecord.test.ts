import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type { Phase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import {
  buildPhase9RunnerEvidenceFingerprint,
  clearPhase9RunnerApprovalRecord,
  createPhase9RunnerApprovalRecord,
  loadPhase9RunnerApprovalRecord,
  parseStoredPhase9RunnerApprovalRecord,
  PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY,
  savePhase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";

const phase8ReviewRecord: Phase8AuditReviewRecord = {
  id: "phase8-audit-review:2026-06-18T00:00:00.000Z",
  createdAt: "2026-06-18T00:00:00.000Z",
  state: "ready",
  readiness: 100,
  auditRecordCount: 8,
  openExceptionCount: 0,
  disabledPathCount: 8,
  mutationLocked: true,
  auditEvidenceFingerprint: "phase8-audit:abcdef12",
  topBlockerLabel: "Owner audit review",
  topBlockerSourceId: "phase-08-permission-audit-depth:owner-audit-review",
  topBlockerKind: "audit-depth",
  topBlockerStatus: "waiting",
  topBlockerAction: "Record Phase 8 owner audit review.",
  rollbackEvidence: "Phase 8 rollback evidence is attached.",
  detail: "Phase 8 owner audit review is ready."
};

function runnerApprovalSnapshot(
  overrides: Partial<Phase9RunnerApprovalSnapshot> = {}
): Phase9RunnerApprovalSnapshot {
  return {
    id: "phase-09-desktop-runner-approval",
    label: "Phase 9 desktop runner approval",
    state: "review",
    statusLabel: "Review",
    readiness: 72,
    selectedAction: "terminal-readonly-probe",
    canRequestDesktopProbe: false,
    auditRecordCount: 2,
    readyCount: 5,
    reviewCount: 1,
    blockedCount: 0,
    waitingCount: 1,
    nextAction: "Review Phase 9 runner approval evidence.",
    safety: "Phase 9 review only.",
    ariaLabel: "Phase 9 runner approval review.",
    items: [],
    ...overrides
  };
}

describe("phase 9 runner approval record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a local runner review record without unlocking mutation paths", () => {
    const record = createPhase9RunnerApprovalRecord(
      runnerApprovalSnapshot(),
      phase8ReviewRecord,
      "2026-06-18T01:00:00.000Z"
    );

    expect(record).toEqual({
      id: "phase9-runner-approval:2026-06-18T01:00:00.000Z",
      createdAt: "2026-06-18T01:00:00.000Z",
      state: "review",
      readiness: 72,
      selectedAction: "terminal-readonly-probe",
      auditRecordCount: 2,
      phase8ReviewRecordId: phase8ReviewRecord.id,
      phase8ReviewState: "ready",
      phase8ReviewFingerprint: "phase8-audit:abcdef12",
      phase8ReviewedBlockerLabel: "Owner audit review",
      phase8ReviewedBlockerSourceId: "phase-08-permission-audit-depth:owner-audit-review",
      phase8ReviewedBlockerKind: "audit-depth",
      phase8ReviewedBlockerStatus: "waiting",
      phase8ReviewedBlockerAction: "Record Phase 8 owner audit review.",
      canRequestDesktopProbe: false,
      mutationLocked: true,
      runnerEvidenceFingerprint: buildPhase9RunnerEvidenceFingerprint(
        runnerApprovalSnapshot()
      ),
      rollbackEvidence:
        "Phase 9 remains limited to terminal-readonly-probe; broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths stay locked before runner expansion.",
      detail:
        "Owner-reviewed Phase 9 runner approval recorded locally at 72% readiness with 2 terminal audit records; selected action remains terminal-readonly-probe."
    });
  });

  it("treats the self-missing owner review row as ready when it is the only waiting item", () => {
    const record = createPhase9RunnerApprovalRecord(
      runnerApprovalSnapshot({
        state: "waiting",
        readiness: 91,
        readyCount: 7,
        reviewCount: 0,
        blockedCount: 0,
        waitingCount: 1,
        items: [
          {
            id: "phase-09-desktop-runner-approval:owner-review",
            label: "Owner runner review",
            kind: "owner-review",
            status: "waiting",
            detail: "No local record.",
            nextAction: "Record review."
          }
        ]
      }),
      phase8ReviewRecord,
      "2026-06-18T01:00:00.000Z"
    );

    expect(record.state).toBe("ready");
    expect(record.readiness).toBe(100);
    expect(record.runnerEvidenceFingerprint).toBe(
      buildPhase9RunnerEvidenceFingerprint(
        runnerApprovalSnapshot({
          state: "waiting",
          readiness: 91,
          readyCount: 7,
          reviewCount: 0,
          blockedCount: 0,
          waitingCount: 1,
          items: [
            {
              id: "phase-09-desktop-runner-approval:owner-review",
              label: "Owner runner review",
              kind: "owner-review",
              status: "waiting",
              detail: "No local record.",
              nextAction: "Record review."
            }
          ]
        })
      )
    );
  });

  it("treats a stale self-review row as ready when recording fresh evidence", () => {
    const record = createPhase9RunnerApprovalRecord(
      runnerApprovalSnapshot({
        state: "review",
        readiness: 91,
        readyCount: 7,
        reviewCount: 1,
        blockedCount: 0,
        waitingCount: 0,
        items: [
          {
            id: "phase-09-desktop-runner-approval:owner-review",
            label: "Owner runner review",
            kind: "owner-review",
            status: "review",
            detail: "Stale record.",
            nextAction: "Record fresh review."
          }
        ]
      }),
      phase8ReviewRecord,
      "2026-06-18T01:05:00.000Z"
    );

    expect(record.state).toBe("ready");
    expect(record.readiness).toBe(100);
  });

  it("keeps ready runner records in review when Phase 8 reviewed-blocker proof is incomplete", () => {
    const record = createPhase9RunnerApprovalRecord(
      runnerApprovalSnapshot({
        state: "ready",
        readiness: 100,
        canRequestDesktopProbe: true,
        readyCount: 8,
        reviewCount: 0,
        blockedCount: 0,
        waitingCount: 0
      }),
      {
        ...phase8ReviewRecord,
        topBlockerSourceId: undefined
      },
      "2026-06-18T01:10:00.000Z"
    );

    expect(record.state).toBe("review");
    expect(record.readiness).toBe(99);
    expect(record.canRequestDesktopProbe).toBe(false);
    expect(record.phase8ReviewState).toBe("ready");
    expect(record.phase8ReviewFingerprint).toBe("phase8-audit:abcdef12");
    expect(record.phase8ReviewedBlockerSourceId).toBeUndefined();
  });

  it("parses a stored review record with clamped counts and sanitized text", () => {
    const parsed = parseStoredPhase9RunnerApprovalRecord(
      JSON.stringify({
        id: " phase9-runner-approval:1 ",
        createdAt: " 2026-06-18T01:00:00.000Z ",
        state: "READY",
        readiness: 104.6,
        selectedAction: "terminal-readonly-probe",
        auditRecordCount: 2.9,
        phase8ReviewRecordId: " phase8-audit-review:1 ",
        phase8ReviewState: "READY",
        phase8ReviewFingerprint:
          "phase8 C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md sk-ABCDEF1234567890 <unsafe>",
        phase8ReviewedBlockerSourceId:
          "blocker C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md sk-ABCDEF1234567890 <unsafe>",
        canRequestDesktopProbe: true,
        mutationLocked: true,
        runnerEvidenceFingerprint: " phase9-runner-12345678 ",
        rollbackEvidence:
          "Rollback C:\\Users\\MJ\\Projects\\ProjectAtlas\\rollback.md with token sk-ABCDEF1234567890 <unsafe>",
        detail:
          "Review C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase9-runner-approval:1",
      createdAt: "2026-06-18T01:00:00.000Z",
      state: "ready",
      readiness: 100,
      auditRecordCount: 2,
      phase8ReviewRecordId: "phase8-audit-review:1",
      phase8ReviewState: "ready",
      phase8ReviewFingerprint: expect.stringContaining("phase8 local path"),
      phase8ReviewedBlockerSourceId: expect.stringContaining("blocker local path"),
      canRequestDesktopProbe: true,
      mutationLocked: true,
      runnerEvidenceFingerprint: "phase9-runner-12345678"
    });
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.rollbackEvidence).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.phase8ReviewFingerprint).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.phase8ReviewedBlockerSourceId).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.rollbackEvidence).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.phase8ReviewFingerprint).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.phase8ReviewedBlockerSourceId).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parsed?.detail).not.toContain(">");
  });

  it("rejects malformed stored records", () => {
    expect(parseStoredPhase9RunnerApprovalRecord(null)).toBeUndefined();
    expect(parseStoredPhase9RunnerApprovalRecord("{")).toBeUndefined();
    expect(parseStoredPhase9RunnerApprovalRecord("[]")).toBeUndefined();
    expect(
      parseStoredPhase9RunnerApprovalRecord(
        JSON.stringify({
          id: "record",
          createdAt: "2026-06-18T01:00:00.000Z",
          state: "ready",
          readiness: 100,
          selectedAction: "terminal-write",
          auditRecordCount: 1,
          phase8ReviewRecordId: "phase8",
          phase8ReviewState: "ready",
          canRequestDesktopProbe: true,
          mutationLocked: true,
          rollbackEvidence: "Rollback evidence."
        })
      )
    ).toBeUndefined();
    expect(
      parseStoredPhase9RunnerApprovalRecord(
        JSON.stringify({
          id: "record",
          createdAt: "2026-06-18T01:00:00.000Z",
          state: "ready",
          readiness: 100,
          selectedAction: "terminal-readonly-probe",
          auditRecordCount: 1,
          phase8ReviewRecordId: "phase8",
          phase8ReviewState: "ready",
          canRequestDesktopProbe: true,
          mutationLocked: true,
          rollbackEvidence: ""
        })
      )
    ).toBeUndefined();
  });

  it("saves, loads, and clears through localStorage", () => {
    const store = new Map<string, string>();
    const setItem = vi.fn((key: string, value: string) => {
      store.set(key, value);
    });
    const getItem = vi.fn((key: string) => store.get(key) ?? null);
    const removeItem = vi.fn((key: string) => {
      store.delete(key);
    });

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem,
        removeItem
      }
    });

    const record = createPhase9RunnerApprovalRecord(
      runnerApprovalSnapshot(),
      phase8ReviewRecord,
      "2026-06-18T01:00:00.000Z"
    );

    savePhase9RunnerApprovalRecord(record);
    expect(setItem).toHaveBeenCalledWith(
      PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase9RunnerApprovalRecord()).toEqual(record);

    clearPhase9RunnerApprovalRecord();
    expect(removeItem).toHaveBeenCalledWith(
      PHASE9_RUNNER_APPROVAL_RECORD_STORAGE_KEY
    );
    expect(loadPhase9RunnerApprovalRecord()).toBeUndefined();
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase9RunnerApprovalRecord()).toBeUndefined();
    expect(() =>
      savePhase9RunnerApprovalRecord(
        createPhase9RunnerApprovalRecord(
          runnerApprovalSnapshot(),
          phase8ReviewRecord,
          "2026-06-18T01:00:00.000Z"
        )
      )
    ).not.toThrow();
    expect(() => clearPhase9RunnerApprovalRecord()).not.toThrow();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        }),
        removeItem: vi.fn(() => {
          throw new Error("remove failed");
        })
      }
    });

    expect(loadPhase9RunnerApprovalRecord()).toBeUndefined();
    expect(() =>
      savePhase9RunnerApprovalRecord(
        createPhase9RunnerApprovalRecord(
          runnerApprovalSnapshot(),
          phase8ReviewRecord,
          "2026-06-18T01:00:00.000Z"
        )
      )
    ).not.toThrow();
    expect(() => clearPhase9RunnerApprovalRecord()).not.toThrow();
  });
});
