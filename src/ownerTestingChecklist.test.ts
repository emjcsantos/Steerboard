import { describe, expect, it } from "vitest";
import {
  buildOwnerTestingChecklist,
  resolveOwnerTestingChecklistState,
  summarizeOwnerTestingChecklistItems,
  OWNER_TESTING_CHECKLIST_ORDER,
  OWNER_TESTING_CHECKLIST_ID,
  OWNER_TESTING_CHECKLIST_LABEL
} from "./ownerTestingChecklist";

const checklistBase = buildOwnerTestingChecklist();

describe("owner testing checklist model", () => {
  it("contains all required phase 9 checklist items in deterministic order", () => {
    const itemIds = checklistBase.items.map((item) => item.id);
    const itemNames = checklistBase.items.map((item) => item.name);

    expect(itemIds).toEqual(Array.from(OWNER_TESTING_CHECKLIST_ORDER));
    expect(itemNames).toEqual([
      "Launch",
      "Connect",
      "Chat",
      "Multi-Panel",
      "Controls",
      "Slash Commands",
      "Catalogs",
      "Migration",
      "Planning",
      "Dispatch",
      "Permissions",
      "Reload",
      "Recovery"
    ]);
    expect(checklistBase.id).toBe(OWNER_TESTING_CHECKLIST_ID);
    expect(checklistBase.label).toBe(OWNER_TESTING_CHECKLIST_LABEL);
  });

  it("defaults all checklist items to waiting and reports full waiting summary", () => {
    expect(checklistBase.summary).toEqual({
      total: 13,
      ready: 0,
      review: 0,
      blocked: 0,
      waiting: 13,
      readiness: 25,
      state: "waiting",
      statusLabel: "Waiting"
    });
  });

  it("supports overrides and computes ready/review/blocked states and readiness", () => {
    const custom = buildOwnerTestingChecklist({
      launch: "ready",
      connect: "ready",
      chat: "ready",
      "multi-panel": "review",
      controls: "ready",
      "slash-commands": "ready",
      catalogs: "ready",
      migration: "ready",
      planning: "ready",
      dispatch: "ready",
      permissions: "ready",
      reload: "ready",
      recovery: "ready"
    });

    const summary = custom.summary;

    expect(summary.total).toBe(13);
    expect(summary.ready).toBe(12);
    expect(summary.review).toBe(1);
    expect(summary.blocked).toBe(0);
    expect(summary.waiting).toBe(0);
    expect(summary.state).toBe("review");
    expect(summary.statusLabel).toBe("Review");
    expect(summary.readiness).toBe(97);
  });

  it("returns blocked summary state when any item is blocked", () => {
    const blocked = buildOwnerTestingChecklist({
      connect: "blocked",
      migration: "ready",
      dispatch: "review"
    });
    const summary = blocked.summary;

    expect(summary.blocked).toBe(1);
    expect(summary.review).toBe(1);
    expect(summary.state).toBe("blocked");
    expect(summary.statusLabel).toBe("Blocked");
    expect(summary.readiness).toBe(32);
  });

  it("computes counts via summary helper and keeps deterministic key order", () => {
    const items = [
      { state: "ready" },
      { state: "review" },
      { state: "blocked" },
      { state: "waiting" },
      { state: "ready" }
    ] as const;

    expect(summarizeOwnerTestingChecklistItems(items)).toEqual({
      total: 5,
      ready: 2,
      review: 1,
      blocked: 1,
      waiting: 1,
      readiness: 57,
      state: "blocked",
      statusLabel: "Blocked"
    });
    expect(resolveOwnerTestingChecklistState({ blocked: 0, review: 0, waiting: 2 })).toBe(
      "waiting"
    );
    expect(resolveOwnerTestingChecklistState({ blocked: 0, review: 1, waiting: 2 })).toBe(
      "review"
    );
    expect(resolveOwnerTestingChecklistState({ blocked: 2, review: 0, waiting: 0 })).toBe(
      "blocked"
    );
  });

  it("keeps helper inputs immutable", () => {
    const overrides = {
      launch: "ready",
      connect: "ready",
      chat: "ready",
      recovery: "ready"
    } as const;
    const overridesSnapshot = { ...overrides };

    buildOwnerTestingChecklist(overrides);
    expect(overrides).toEqual(overridesSnapshot);
  });

  it("preserves provided item status overrides exactly per domain", () => {
    const custom = buildOwnerTestingChecklist({
      launch: "ready",
      connect: "review",
      recovery: "blocked"
    });
    const statusById = new Map(custom.items.map((item) => [item.id, item.state]));

    expect(statusById.get("launch")).toBe("ready");
    expect(statusById.get("connect")).toBe("review");
    expect(statusById.get("recovery")).toBe("blocked");
    expect(custom.summary.blocked).toBe(1);
    expect(custom.summary.state).toBe("blocked");
  });
});
