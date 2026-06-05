import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_COCKPIT_DROP_JSON_MIME,
  buildProjectDropPayload,
  buildSessionDropPayload,
  parseAdaptiveCockpitDropPayload,
  resolveAdaptiveDropPanelId
} from "./adaptiveCockpitDrop";

describe("adaptiveCockpitDrop", () => {
  it("builds and parses session payloads", () => {
    const sessionsByProject = {
      "project-1": ["session-alpha", "session-beta"]
    };
    const payload = buildSessionDropPayload("session-alpha", "Session Alpha");
    const serialized = JSON.stringify(payload);

    expect(parseAdaptiveCockpitDropPayload(serialized)).toEqual(payload);
    expect(resolveAdaptiveDropPanelId(payload, sessionsByProject)).toBe("session-alpha");
  });

  it("builds and resolves project payload to first available session", () => {
    const sessionsByProject = {
      projectA: ["session-a1", "session-a2"],
      projectB: ["session-b1"]
    };
    const payload = buildProjectDropPayload("projectA", "Project A");
    const serialized = JSON.stringify(payload);

    expect(parseAdaptiveCockpitDropPayload(serialized)).toEqual(payload);
    expect(resolveAdaptiveDropPanelId(payload, sessionsByProject)).toBe("session-a1");
  });

  it("returns null for malformed JSON", () => {
    expect(parseAdaptiveCockpitDropPayload("not-json")).toBeNull();
  });

  it("returns null for unknown source payloads", () => {
    expect(
      parseAdaptiveCockpitDropPayload(
        `{
          "kind":"adaptive-cockpit-drop",
          "version":1,
          "source":"unknown-source",
          "projectId":"project-1",
          "projectName":"Project 1"
        }`
      )
    ).toBeNull();
  });

  it("returns null when project has no available sessions", () => {
    const payload = buildProjectDropPayload("project-unknown", "No Sessions");
    expect(resolveAdaptiveDropPanelId(payload, { projectA: ["session-a1"] })).toBeNull();
  });

  it("exposes payload MIME constants", () => {
    expect(ADAPTIVE_COCKPIT_DROP_JSON_MIME).toContain("json");
  });
});
