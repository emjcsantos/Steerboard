import { describe, expect, it } from "vitest";
import {
  buildCodexPanelSessionRestoreProof,
  closePanelSession,
  findCodexPanelSessionIdentityIssues,
  markPanelSessionStale,
  parseStoredPanelSessionState,
  removePanelSession,
  startPanelSession,
  upsertPanelSession,
  updatePanelSession
} from "./codexPanelSessionState";

const baseRecord = {
  panelId: "panel-1",
  provider: "codex",
  sessionId: "session-alpha",
  threadId: "thread-alpha",
  status: "active" as const,
  checkedAt: "2026-06-05T10:00:00.000Z",
  updatedAt: "2026-06-05T10:00:00.000Z",
  stale: false,
  detail: "Panel session live."
};

describe("codex panel session state", () => {
  it("returns empty state for missing or malformed saved state", () => {
    expect(parseStoredPanelSessionState(null)).toEqual({});
    expect(parseStoredPanelSessionState("{")).toEqual({});
    expect(parseStoredPanelSessionState("[]")).toEqual({});
  });

  it("repairs malformed records and deduplicates duplicate panel IDs", () => {
    expect(
      parseStoredPanelSessionState(
        JSON.stringify([
          baseRecord,
          {
            ...baseRecord,
            sessionId: "duplicate-session",
            stale: "not-bool"
          },
          { panelId: "panel-2", provider: "codex", status: "active" },
          { panelId: "panel-3", provider: "codex", sessionId: "ok", threadId: "thread-ok", status: "active" }
        ]),
        { now: Date.parse("2026-06-05T10:03:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
      )
    ).toEqual({
      "panel-1": {
        ...baseRecord,
        stale: false,
        checkedAt: "2026-06-05T10:00:00.000Z",
        updatedAt: "2026-06-05T10:00:00.000Z"
      },
      "panel-3": {
        panelId: "panel-3",
        provider: "codex",
        sessionId: "ok",
        threadId: "thread-ok",
        status: "active",
        checkedAt: null,
        updatedAt: null,
        stale: true,
        detail: "No session detail available."
      }
    });
  });

  it("supports upsert and start actions without mutating other panels", () => {
    const seeded = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        { ...baseRecord, panelId: "panel-2", sessionId: "session-beta", threadId: "thread-beta" }
      ])
    );

    const upserted = upsertPanelSession(
      seeded,
      "panel-1",
      { detail: "Updated detail", status: "active" },
      Date.parse("2026-06-05T10:01:00.000Z")
    );

    expect(upserted["panel-1"].detail).toBe("Updated detail");
    expect(upserted["panel-1"].checkedAt).toBe("2026-06-05T10:01:00.000Z");
    expect(upserted["panel-2"]).toEqual(seeded["panel-2"]);
    expect(upserted["panel-1"]).not.toBe(seeded["panel-1"]);
  });

  it("supports start/update/close/markStale/remove actions for individual panels", () => {
    const seeded = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        { ...baseRecord, panelId: "panel-2", sessionId: "session-beta", threadId: "thread-beta" }
      ]),
      { now: Date.parse("2026-06-05T10:00:00.000Z"), staleAfterMs: 60_000 }
    );

    const started = startPanelSession(
      seeded,
      "panel-2",
      {
        provider: "codex",
        sessionId: "session-gamma",
        threadId: "thread-gamma",
        detail: "Starting."
      },
      Date.parse("2026-06-05T10:04:00.000Z")
    );

    expect(started["panel-2"].status).toBe("starting");
    expect(started["panel-2"].sessionId).toBe("session-gamma");
    expect(started["panel-2"].threadId).toBe("thread-gamma");
    expect(started["panel-2"].checkedAt).toBe("2026-06-05T10:04:00.000Z");

    const updated = updatePanelSession(
      started,
      "panel-2",
      { status: "active", detail: "Active now." },
      Date.parse("2026-06-05T10:05:00.000Z")
    );

    expect(updated["panel-2"].status).toBe("active");
    expect(updated["panel-2"].updatedAt).toBe("2026-06-05T10:05:00.000Z");

    const closed = closePanelSession(updated, "panel-2");
    expect(closed["panel-2"].status).toBe("closed");

    const stale = markPanelSessionStale(closed, "panel-1");
    expect(stale["panel-1"].stale).toBe(true);

    const removed = removePanelSession(stale, "panel-2");
    expect(Object.keys(removed)).toEqual(["panel-1"]);
  });

  it("marks sessions stale when persisted checkedAt timestamps are old on reload", () => {
    const saved = JSON.stringify([
      {
        ...baseRecord,
        checkedAt: "2026-06-05T10:00:00.000Z",
        updatedAt: "2026-06-05T10:00:00.000Z",
        stale: false
      }
    ]);

    expect(
      parseStoredPanelSessionState(saved, {
        now: Date.parse("2026-06-05T10:15:00.000Z"),
        staleAfterMs: 5 * 60 * 1000
      })["panel-1"].stale
    ).toBe(true);
  });

  it("reports no live identity issues when panel sessions are unique", () => {
    const state = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        { ...baseRecord, panelId: "panel-2", sessionId: "session-beta", threadId: "thread-beta" }
      ]),
      { now: Date.parse("2026-06-05T10:01:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
    );

    expect(findCodexPanelSessionIdentityIssues(state)).toEqual([]);
  });

  it("summarizes restored fresh and stale panel labels after reload", () => {
    const state = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        {
          ...baseRecord,
          panelId: "panel-2",
          sessionId: "session-beta",
          threadId: "thread-beta",
          checkedAt: "2026-06-05T09:30:00.000Z",
          updatedAt: "2026-06-05T09:30:00.000Z"
        }
      ]),
      { now: Date.parse("2026-06-05T10:01:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
    );

    const proof = buildCodexPanelSessionRestoreProof(state);

    expect(proof).toMatchObject({
      panelCount: 2,
      freshPanelCount: 1,
      stalePanelCount: 1,
      duplicateIdentityCount: 0,
      restoredPanelIds: ["panel-1"],
      stalePanelIds: ["panel-2"]
    });
    expect(proof.detail).toContain("Restored 1/2 saved panel session labels");
    expect(proof.detail).toContain(
      "restoreProof=panels=2 fresh=1 stale=1 duplicateIdentities=0 restored=panel-1 stalePanels=panel-2"
    );
  });

  it("reports duplicate live session ids across different panels", () => {
    const state = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        { ...baseRecord, panelId: "panel-2", threadId: "thread-beta" }
      ]),
      { now: Date.parse("2026-06-05T10:01:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
    );

    expect(findCodexPanelSessionIdentityIssues(state)).toEqual([
      {
        type: "duplicateSessionId",
        identity: "session-alpha",
        panelIds: ["panel-1", "panel-2"],
        severity: "error",
        detail:
          "Live session identity session-alpha is attached to multiple panels: panel-1, panel-2. Start a fresh panel session before sending live chat."
      }
    ]);
  });

  it("reports duplicate live thread ids separately from session ids", () => {
    const state = parseStoredPanelSessionState(
      JSON.stringify([
        baseRecord,
        {
          ...baseRecord,
          panelId: "panel-2",
          sessionId: "session-beta"
        }
      ]),
      { now: Date.parse("2026-06-05T10:01:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
    );

    expect(findCodexPanelSessionIdentityIssues(state)).toEqual([
      {
        type: "duplicateThreadId",
        identity: "thread-alpha",
        panelIds: ["panel-1", "panel-2"],
        severity: "error",
        detail:
          "Live thread identity thread-alpha is attached to multiple panels: panel-1, panel-2. Start a fresh panel session before sending live chat."
      }
    ]);
  });

  it("ignores blank, stale, closed, and malformed identity values", () => {
    const state = {
      "panel-1": baseRecord,
      "panel-2": {
        ...baseRecord,
        panelId: "panel-2",
        sessionId: " session-alpha ",
        threadId: "thread-alpha",
        stale: true
      },
      "panel-3": {
        ...baseRecord,
        panelId: "panel-3",
        sessionId: "session-alpha",
        threadId: "thread-alpha",
        status: "closed" as const
      },
      "panel-4": {
        ...baseRecord,
        panelId: "panel-4",
        sessionId: "   ",
        threadId: "   "
      },
      "panel-5": {
        ...baseRecord,
        panelId: "panel-5",
        sessionId: 42,
        threadId: null
      }
    } as unknown as Record<string, typeof baseRecord>;

    expect(findCodexPanelSessionIdentityIssues(state)).toEqual([]);
  });

  it("orders duplicate identity issues deterministically", () => {
    const state = parseStoredPanelSessionState(
      JSON.stringify([
        {
          ...baseRecord,
          panelId: "panel-c",
          sessionId: "session-z",
          threadId: "thread-z"
        },
        {
          ...baseRecord,
          panelId: "panel-a",
          sessionId: "session-a",
          threadId: "thread-a"
        },
        {
          ...baseRecord,
          panelId: "panel-b",
          sessionId: "session-z",
          threadId: "thread-z"
        },
        {
          ...baseRecord,
          panelId: "panel-d",
          sessionId: "session-a",
          threadId: "thread-a"
        }
      ]),
      { now: Date.parse("2026-06-05T10:01:00.000Z"), staleAfterMs: 10 * 60 * 1000 }
    );

    expect(findCodexPanelSessionIdentityIssues(state).map((issue) => ({
      type: issue.type,
      identity: issue.identity,
      panelIds: issue.panelIds
    }))).toEqual([
      { type: "duplicateSessionId", identity: "session-a", panelIds: ["panel-a", "panel-d"] },
      { type: "duplicateSessionId", identity: "session-z", panelIds: ["panel-b", "panel-c"] },
      { type: "duplicateThreadId", identity: "thread-a", panelIds: ["panel-a", "panel-d"] },
      { type: "duplicateThreadId", identity: "thread-z", panelIds: ["panel-b", "panel-c"] }
    ]);
  });
});
