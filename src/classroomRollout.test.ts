import { describe, expect, it } from "vitest";
import {
  approveClassroomRollout,
  createClassroomInternalPreview,
  disableClassroomRollout,
  resolveClassroomRollout,
  rollbackClassroomRollout
} from "./classroomRollout";

const ownerApproval = {
  approvedBy: "product-owner",
  approvedAt: "2026-07-11T08:00:00.000Z",
  evidence: "PRD #1 acceptance approved"
};

describe("classroom rollout gate", () => {
  it("defaults to Professional when off and preserves the durable run identity", () => {
    const run = { id: "run-1", nested: { phase: "working" } };
    const snapshot = structuredClone(run);
    const decision = resolveClassroomRollout(disableClassroomRollout(), run);

    expect(decision).toMatchObject({ state: "off", presentation: "professional", available: false });
    expect(decision.durableState).toBe(run);
    expect(run).toEqual(snapshot);
  });

  it("allows internal preview without recording owner approval", () => {
    const run = { id: "run-2", events: ["started"] };
    const decision = resolveClassroomRollout(createClassroomInternalPreview(), run);

    expect(decision).toMatchObject({
      state: "internal-preview",
      presentation: "classroom",
      available: true,
      ownerApproved: false
    });
    expect(decision.audit.ownerApproval).toBeUndefined();
    expect(decision.durableState).toBe(run);
  });

  it("requires and exposes an explicit owner approval record", () => {
    const run = { id: "run-3", projection: { completionPercent: 50 } };
    const snapshot = structuredClone(run);
    const decision = resolveClassroomRollout(approveClassroomRollout(ownerApproval), run);

    expect(decision).toMatchObject({
      state: "owner-approved",
      presentation: "classroom",
      available: true,
      ownerApproved: true
    });
    expect(decision.audit.ownerApproval).toEqual(ownerApproval);
    expect(decision.audit.reason).toContain("explicit owner approval");
    expect(decision.durableState).toBe(run);
    expect(run).toEqual(snapshot);
  });

  it("rolls back to Professional without mutating the underlying run", () => {
    const run = { id: "run-4", taskStates: { task: "validating" } };
    const snapshot = structuredClone(run);
    const rollback = { rolledBackBy: "product-owner", rolledBackAt: "2026-07-11T09:00:00.000Z", reason: "Release hold" };
    const decision = resolveClassroomRollout(rollbackClassroomRollout(rollback), run);

    expect(decision).toMatchObject({ state: "rolled-back", presentation: "professional", available: false });
    expect(decision.audit.rollback).toEqual(rollback);
    expect(decision.durableState).toBe(run);
    expect(run).toEqual(snapshot);
  });

  it.each([
    undefined,
    { state: "surprise" },
    { state: "owner-approved" },
    { state: "rolled-back", rollback: { reason: "missing audit identity" } }
  ])("repairs malformed or unknown config off", (config) => {
    const decision = resolveClassroomRollout(config, { id: "run-5" });
    expect(decision).toMatchObject({ state: "off", presentation: "professional", available: false });
    expect(decision.audit.repaired).toBe(true);
  });
});
