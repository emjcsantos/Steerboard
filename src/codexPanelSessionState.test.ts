import { describe, expect, it } from "vitest";
import {
  closePanelSession,
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
});
