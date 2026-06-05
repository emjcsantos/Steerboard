import { describe, expect, it, vi } from "vitest";
import {
  appendLiveActionAuditRecord,
  buildLiveActionAuditExportMarkdown,
  createLiveActionAuditRecord,
  LIVE_ACTION_AUDIT_STORAGE_KEY,
  loadLiveActionAuditRecords,
  parseStoredLiveActionAuditRecords,
  repairLiveActionAuditRecord,
  saveLiveActionAuditRecords,
  type LiveActionAuditAction,
  type LiveActionAuditRecord
} from "./liveActionAudit";

const baseInput = {
  what: "Request workspace write for file export",
  why: "User requested a live action for local staging.",
  provider: "provider-a",
  workspace: "workspace-alpha",
  service: "dispatch-service",
  resultSummary: "Pending local confirmation.",
  risk: "low" as const
};

function makeRecord(
  id: string,
  action: LiveActionAuditAction = "requested",
  overrides: Partial<LiveActionAuditRecord> = {}
): LiveActionAuditRecord {
  const baseRecord = createLiveActionAuditRecord(
    baseInput,
    action,
    "2026-06-04T00:00:00.000Z"
  );

  return {
    ...baseRecord,
    id,
    ...overrides
  };
}

describe("live action audit records", () => {
  it("creates valid action records with required fields", () => {
    const record = createLiveActionAuditRecord(
      {
        ...baseInput,
        risk: "medium"
      },
      "executed",
      "2026-06-04T08:00:00.000Z"
    );

    expect(record).toMatchObject({
      action: "executed",
      what: baseInput.what,
      why: baseInput.why,
      provider: "provider-a",
      workspace: "workspace-alpha",
      service: "dispatch-service",
      resultSummary: "Pending local confirmation.",
      timestamp: "2026-06-04T08:00:00.000Z",
      risk: "medium"
    });
  });

  it("prepends newest, dedupes by id, and respects bounded append order", () => {
    const existing = [makeRecord("a"), makeRecord("b"), makeRecord("c")];
    const duplicateNewest = { ...makeRecord("b"), why: "updated reason" };

    const next = appendLiveActionAuditRecord(existing, duplicateNewest, 2);

    expect(next).toEqual([
      {
        ...duplicateNewest,
        id: "b",
        action: "requested"
      },
      {
        ...existing[0],
        id: "a",
        action: "requested"
      }
    ]);
  });

  it("uses limit defaults and handles zero/negative limits", () => {
    const existing = [makeRecord("a"), makeRecord("b"), makeRecord("c")];

    expect(appendLiveActionAuditRecord(existing, makeRecord("d"), 0)).toEqual([]);
    expect(appendLiveActionAuditRecord(existing, makeRecord("d"), -1)).toEqual([]);
    expect(parseStoredLiveActionAuditRecords(JSON.stringify(existing), 0)).toEqual([]);
    expect(parseStoredLiveActionAuditRecords(JSON.stringify(existing), -3)).toEqual([]);
  });

  it("repairs malformed saved state and keeps recent bounded records", () => {
    const parsed = parseStoredLiveActionAuditRecords(
      JSON.stringify([
        {
          id: "kept-a",
          action: "approved",
          what: "first",
          why: "manual",
          provider: "provider-a",
          workspace: "workspace-a",
          service: "svc-a",
          resultSummary: "granted",
          timestamp: "2026-06-04T00:00:00.000Z",
          risk: "medium",
          rawTranscript: ["seeded", "line"]
        },
        {
          // intentionally missing strings and invalid risk; should be repaired
          id: "bad-risk",
          action: "failed",
          what: "",
          why: 7,
          provider: "provider-b",
          workspace: "workspace-b",
          service: "svc-b",
          resultSummary: "failed",
          timestamp: "not-a-timestamp",
          risk: "critical",
          rawTranscript: [123, "fine-line", null]
        },
        {
          id: "duplicate-a",
          action: "timed-out",
          what: "third",
          why: "timeout",
          provider: "provider-a",
          workspace: "workspace-a",
          service: "svc-a",
          resultSummary: "timed out",
          timestamp: "2026-06-04T00:00:01.000Z",
          risk: "high"
        },
        {
          id: "duplicate-a",
          action: "cancelled",
          what: "should-be-dropped",
          why: "duplicate",
          provider: "provider-a",
          workspace: "workspace-a",
          service: "svc-a",
          resultSummary: "dropped",
          timestamp: "2026-06-04T00:00:02.000Z",
          risk: "high"
        },
        {
          id: "",
          action: "invalid-action",
          what: "invalid action",
          why: "ignored",
          provider: "provider-x",
          workspace: "workspace-x",
          service: "svc-x",
          resultSummary: "ignored",
          timestamp: "2026-06-04T00:00:03.000Z",
          risk: "low"
        }
      ]),
      2
    );

    expect(parsed).toEqual([
      {
        id: "kept-a",
        action: "approved",
        what: "first",
        why: "manual",
        provider: "provider-a",
        workspace: "workspace-a",
        service: "svc-a",
        resultSummary: "granted",
        timestamp: "2026-06-04T00:00:00.000Z",
        risk: "medium",
        rawTranscript: ["seeded", "line"]
      },
      {
        id: "bad-risk",
        action: "failed",
        what: "Unknown action",
        why: "No reason provided.",
        provider: "provider-b",
        workspace: "workspace-b",
        service: "svc-b",
        resultSummary: "failed",
        timestamp: "1970-01-01T00:00:00.000Z",
        risk: "low",
        rawTranscript: ["fine-line"]
      }
    ]);
  });

  it("redacts secret-like values and private paths in export markdown", () => {
    const rows = [
      createLiveActionAuditRecord(
        {
          what: "Read /tmp/private/secrets.txt before dispatch",
          why: "authorization=Bearer sk-1234567890123456",
          provider: "desktop",
          workspace: "D:/Sensitive/Project/Private",
          service: "file:/tmp/private/notes.md",
          resultSummary: "cookie=session123; apiKey=abc12345",
          risk: "high"
        },
        "requested",
        "2026-06-04T00:00:00.000Z"
      )
    ];

    const markdown = buildLiveActionAuditExportMarkdown(rows);

    expect(markdown).toContain("## Entries");
    expect(markdown).toContain("### requested at");
    expect(markdown).not.toContain("/tmp/private/secrets.txt");
    expect(markdown).not.toContain("sk-1234567890123456");
    expect(markdown).not.toContain("session123");
    expect(markdown).not.toContain("apiKey=abc12345");
    expect(markdown).not.toContain("D:/Sensitive/Project/Private");
    expect(markdown).not.toContain("file:/tmp/private/notes.md");
  });

  it("omits raw transcript bodies from markdown export", () => {
    const rows = [
      {
        ...makeRecord("export-hidden"),
        rawTranscript: [
          "secret token=abc123456789",
          "cookie=should-not-appear",
          "path: /tmp/private/does-not-leak"
        ]
      }
    ];

    const markdown = buildLiveActionAuditExportMarkdown(rows);

    expect(markdown).not.toContain("secret token=abc123456789");
    expect(markdown).not.toContain("cookie=should-not-appear");
    expect(markdown).not.toContain("/tmp/private/does-not-leak");
    expect(markdown).toContain("- what:");
  });

  it("repairs malformed single records with safe fallbacks", () => {
    expect(
      repairLiveActionAuditRecord({
        id: "",
        action: "invalid-action",
        what: "",
        why: "",
        provider: "",
        workspace: "",
        service: "",
        resultSummary: "",
        timestamp: "bad",
        risk: "unknown"
      }, "requested", 4)
    ).toEqual({
      id: "provider-unknown:service-unknown:requested:1970-01-01T00:00:00.000Z:4",
      action: "requested",
      what: "Unknown action",
      why: "No reason provided.",
      provider: "provider-unknown",
      workspace: "workspace-unknown",
      service: "service-unknown",
      resultSummary: "No result summary.",
      timestamp: "1970-01-01T00:00:00.000Z",
      risk: "low",
      rawTranscript: []
    });
  });

  it("handles unavailable local storage without throwing", () => {
    vi.stubGlobal("window", undefined);

    expect(loadLiveActionAuditRecords()).toEqual([]);
    expect(saveLiveActionAuditRecords([makeRecord("a")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("saves and loads with the expected storage key", () => {
    const setItem = vi.fn();
    const getItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    const records = [makeRecord("stored")];

    saveLiveActionAuditRecords(records);
    expect(setItem).toHaveBeenCalledWith(
      LIVE_ACTION_AUDIT_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadLiveActionAuditRecords()).toEqual([
      {
        ...records[0],
        rawTranscript: records[0].rawTranscript ?? []
      }
    ]);
    expect(getItem).toHaveBeenCalledWith(LIVE_ACTION_AUDIT_STORAGE_KEY);

    vi.unstubAllGlobals();
  });
});
