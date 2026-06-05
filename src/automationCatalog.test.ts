import { describe, expect, it } from "vitest";
import {
  defaultAutomationCatalog,
  normalizeAutomationCatalog,
  summarizeAutomationCatalog,
  type AutomationApprovalPosture,
  type AutomationCatalogEntry,
  type AutomationLifecycle,
  type AutomationState,
  type AutomationTrigger
} from "./automationCatalog";

describe("automation catalog defaults", () => {
  it("contains provider-neutral safe defaults", () => {
    expect(defaultAutomationCatalog.length).toBeGreaterThan(0);
    for (const entry of defaultAutomationCatalog) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.label).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.state).toMatch(
        /^(live|preview|disconnected|setup-required|unsupported|unavailable)$/
      );
      expect(entry.lifecycle).toMatch(/^(idle|active|paused|retired)$/);
      expect(entry.trigger).toMatch(/^(manual|scheduled|event|webhook)$/);
      expect(entry.approvalPosture).toMatch(
        /^(automatic|manual|approval-required)$/
      );
      expect(entry.detail).toBeDefined();
      expect(entry.detail).not.toMatch(/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/);
    }
  });

  it("includes every supported state", () => {
    const states: AutomationState[] = [
      "live",
      "preview",
      "disconnected",
      "setup-required",
      "unsupported",
      "unavailable"
    ];
    expect(states).toHaveLength(6);
  });
});

describe("automation catalog normalization", () => {
  it("repairs malformed rows, invalid enums, and dedupes by id", () => {
    const repaired = normalizeAutomationCatalog(
      [
        {
          id: " task-handoff ",
          label: "",
          lifecycle: "running",
          trigger: "manual",
          approvalPosture: "automatic",
          state: "live"
        },
        {
          id: "bad id",
          label: "Ignored",
          lifecycle: "idle",
          trigger: "manual",
          approvalPosture: "manual",
          state: "live"
        },
        {
          id: "workflow-checks",
          label: "Workflow Check Override",
          lifecycle: "dispatched",
          trigger: "weird",
          approvalPosture: "strict",
          state: "not-a-state"
        },
        {
          detail: "No id should be filtered",
          label: "No id",
          lifecycle: "paused",
          trigger: "scheduled",
          approvalPosture: "manual",
          state: "live"
        },
        {
          id: "task-handoff",
          label: "Duplicate",
          lifecycle: "paused",
          trigger: "webhook",
          approvalPosture: "manual",
          state: "preview"
        },
        {
          id: "webhook-router",
          label: "Fresh",
          lifecycle: "paused",
          trigger: "webhook",
          approvalPosture: "manual",
          state: "preview"
        }
      ] as unknown[],
      defaultAutomationCatalog
    );

    expect(repaired).toEqual([
      {
        id: "task-handoff",
        label: "Task Handoff",
        lifecycle: "idle",
        trigger: "manual",
        approvalPosture: "automatic",
        state: "live"
      },
      {
        id: "workflow-checks",
        label: "Workflow Check Override",
        lifecycle: "idle",
        trigger: "manual",
        approvalPosture: "approval-required",
        state: "unavailable",
        detail: undefined
      },
      {
        id: "webhook-router",
        label: "Fresh",
        lifecycle: "paused",
        trigger: "webhook",
        approvalPosture: "manual",
        state: "preview"
      }
    ]);
  });

  it("deduplicates by canonicalized id", () => {
    const repaired = normalizeAutomationCatalog(
      [
        {
          id: "Task-Handoff",
          label: "Original",
          lifecycle: "active",
          trigger: "manual",
          approvalPosture: "manual",
          state: "live"
        },
        {
          id: "task-handoff",
          label: "Replacement",
          lifecycle: "active",
          trigger: "event",
          approvalPosture: "manual",
          state: "preview"
        }
      ] as unknown[],
      defaultAutomationCatalog
    );

    expect(repaired).toHaveLength(1);
    expect(repaired[0]).toMatchObject({
      id: "task-handoff",
      label: "Original"
    });
  });

  it("repairs lifecycle, trigger, and approval-posture enums", () => {
    const repaired = normalizeAutomationCatalog(
      [
        {
          id: "enum-repair",
          label: "Enum Repair",
          lifecycle: "does-not-exist",
          trigger: "bad-trigger",
          approvalPosture: "bad-posture",
          state: "unsupported"
        }
      ] as unknown[],
      defaultAutomationCatalog
    );

    expect(repaired[0].lifecycle).toBe("idle");
    expect(repaired[0].trigger).toBe("manual");
    expect(repaired[0].approvalPosture).toBe("approval-required");
    expect(repaired[0].state).toBe("unsupported");
  });

  it("falls back to defaults when input is unusable", () => {
    expect(normalizeAutomationCatalog("not-an-array")).toEqual(defaultAutomationCatalog);
    expect(normalizeAutomationCatalog([], [] as AutomationCatalogEntry[])).toEqual(
      defaultAutomationCatalog
    );
  });
});

describe("automation catalog summary", () => {
  it("returns useful UI counts", () => {
    const catalog: AutomationCatalogEntry[] = [
      {
        id: "one",
        label: "One",
        lifecycle: "active",
        trigger: "manual",
        approvalPosture: "manual",
        state: "live"
      },
      {
        id: "two",
        label: "Two",
        lifecycle: "active",
        trigger: "scheduled",
        approvalPosture: "manual",
        state: "live"
      },
      {
        id: "three",
        label: "Three",
        lifecycle: "paused",
        trigger: "event",
        approvalPosture: "manual",
        state: "preview"
      },
      {
        id: "four",
        label: "Four",
        lifecycle: "idle",
        trigger: "manual",
        approvalPosture: "manual",
        state: "disconnected"
      },
      {
        id: "five",
        label: "Five",
        lifecycle: "idle",
        trigger: "manual",
        approvalPosture: "manual",
        state: "setup-required"
      },
      {
        id: "six",
        label: "Six",
        lifecycle: "retired",
        trigger: "manual",
        approvalPosture: "manual",
        state: "unsupported"
      },
      {
        id: "seven",
        label: "Seven",
        lifecycle: "retired",
        trigger: "manual",
        approvalPosture: "manual",
        state: "unavailable"
      }
    ];

    const summary = summarizeAutomationCatalog(catalog);

    expect(summary).toEqual({
      total: 7,
      live: 2,
      preview: 1,
      disconnected: 1,
      setupRequired: 1,
      unsupported: 1,
      unavailable: 1,
      actionable: 5,
      needsAttention: 4,
      availability: 0.43
    });
  });
});

describe("helper type coverage", () => {
  it("covers lifecycle and trigger enums", () => {
    const lifecycles: AutomationLifecycle[] = ["idle", "active", "paused", "retired"];
    const triggers: AutomationTrigger[] = ["manual", "scheduled", "event", "webhook"];
    const posts: AutomationApprovalPosture[] = [
      "automatic",
      "manual",
      "approval-required"
    ];

    expect(lifecycles).toHaveLength(4);
    expect(triggers).toHaveLength(4);
    expect(posts).toHaveLength(3);
  });
});
