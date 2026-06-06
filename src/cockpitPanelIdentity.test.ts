import { describe, expect, it } from "vitest";
import type { CockpitPanelIdentityInput } from "./cockpitPanelIdentity";
import { createCockpitPanelIdentity } from "./cockpitPanelIdentity";

function buildSession(
  overrides: Partial<CockpitPanelIdentityInput> = {}
): CockpitPanelIdentityInput {
  return {
    title: "Arena panel",
    role: "implementer",
    state: "implementing",
    runtime: "Mock runtime",
    ...overrides
  };
}

describe("createCockpitPanelIdentity", () => {
  it("builds a normal compact identity from session-like input", () => {
    const identity = createCockpitPanelIdentity({
      ...buildSession({
        title: "Landing Layout Validation",
        role: "implementer",
        runtime: "Worker Profile 2",
        state: "implementing",
        projectName: "Website Refresh"
      })
    });

    expect(identity).toEqual({
      projectLabel: "Website Refresh",
      roleLabel: "Implementer",
      runtimeLabel: "Worker Profile 2",
      ariaLabel: "Website Refresh - Implementer - Landing Layout Validation - Worker Profile 2",
      title: "Landing Layout Validation",
      detail: "Implementer on Worker Profile 2 for Website Refresh.",
      tone: "active"
    });
  });

  it("falls back to safe labels when fields are blank", () => {
    const identity = createCockpitPanelIdentity({});

    expect(identity).toEqual({
      projectLabel: "Unassigned project",
      roleLabel: "Panel",
      runtimeLabel: "Unknown runtime",
      ariaLabel: "Unassigned project - Panel - Untitled panel - Unknown runtime",
      title: "Untitled panel",
      detail: "Panel on Unknown runtime for Unassigned project.",
      tone: "waiting"
    });
  });

  it("sanitizes path-like labels", () => {
    const identity = createCockpitPanelIdentity(
      buildSession({
        projectLabel: "C:/Users/MJ/ProjectAtlas/Steerboard",
        title: "src/features/layout/overview.tsx",
        runtime: "Worker\\Profile\\2",
        role: "validator"
      })
    );

    expect(identity.projectLabel).toBe("C: Users MJ ProjectAtlas ...");
    expect(identity.projectLabel.length).toBeLessThanOrEqual(28);
    expect(identity.title).toBe("src features layout overview.tsx");
    expect(identity.runtimeLabel).toBe("Worker Profile 2");
    expect(identity.roleLabel).toBe("Validator");
    expect(identity.detail).toContain("Validator");
  });

  it("truncates long labels to compact limits", () => {
    const identity = createCockpitPanelIdentity(
      buildSession({
        projectLabel: "Long Local Project Identity With Excessive Descriptive Metadata For Safety",
        runtime: "Runtime adapter connected to an extraordinarily long local path profile identifier",
        title: "Landing Layout Validation and Integration Coordination for the Third Revision of the Dashboard"
      })
    );

    expect(identity.projectLabel.endsWith("...")).toBe(true);
    expect(identity.runtimeLabel.endsWith("...")).toBe(true);
    expect(identity.title.endsWith("...")).toBe(true);
    expect(identity.projectLabel.length).toBeLessThanOrEqual(28);
    expect(identity.runtimeLabel.length).toBeLessThanOrEqual(28);
    expect(identity.title.length).toBeLessThanOrEqual(48);
  });

  it("maps blocked, failed, complete, idle, and active states to tones", () => {
    const blocked = createCockpitPanelIdentity(
      buildSession({ state: "blocked", title: "Blocked panel", projectName: "Billing" })
    );
    expect(blocked.tone).toBe("review");

    const failed = createCockpitPanelIdentity(
      buildSession({ state: "failed", title: "Failed panel", projectName: "Billing" })
    );
    expect(failed.tone).toBe("review");

    const complete = createCockpitPanelIdentity(
      buildSession({ state: "complete", title: "Complete panel", projectName: "Billing" })
    );
    expect(complete.tone).toBe("complete");

    const idle = createCockpitPanelIdentity(
      buildSession({ state: "idle", title: "Idle panel", projectName: "Billing" })
    );
    expect(idle.tone).toBe("waiting");

    const active = createCockpitPanelIdentity(
      buildSession({ state: "implementing", title: "Active panel", projectName: "Billing" })
    );
    expect(active.tone).toBe("active");
  });
});
