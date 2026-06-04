import { describe, expect, it } from "vitest";
import { createBlankRuntimeProfile, type RuntimeProfile } from "./runtimeProfile";
import {
  runtimeProfiles,
  selectRuntimeProfileForAdapter,
  summarizeRuntimeProfiles
} from "./runtimeProfileCatalog";

describe("runtime profile catalog", () => {
  it("summarizes counts and readiness percentage deterministically", () => {
    expect(summarizeRuntimeProfiles(runtimeProfiles)).toEqual({
      total: 3,
      ready: 1,
      review: 1,
      blocked: 1,
      readiness: 33
    });
  });

  it("selects by adapter id and falls back to first profile when unmatched", () => {
    const profiles: RuntimeProfile[] = [
      { ...createBlankRuntimeProfile(), id: "first", adapterId: "first-adapter" },
      { ...createBlankRuntimeProfile(), id: "second", adapterId: "second-adapter" },
      { ...createBlankRuntimeProfile(), id: "third", adapterId: "second-adapter" }
    ];

    expect(selectRuntimeProfileForAdapter(profiles, "second-adapter")).toBe(profiles[1]);
    expect(selectRuntimeProfileForAdapter(profiles, "missing-adapter")).toBe(profiles[0]);
  });

  it("maps the ready mock profile to the primary demo adapter", () => {
    expect(selectRuntimeProfileForAdapter(runtimeProfiles, "website-refresh")?.label).toBe(
      "Mock preview profile"
    );
  });

  it("returns summary defaults for an empty profile list", () => {
    expect(summarizeRuntimeProfiles([])).toEqual({
      total: 0,
      ready: 0,
      review: 0,
      blocked: 0,
      readiness: 0
    });
  });

  it("exports public-safe generic profile labels", () => {
    const labels = runtimeProfiles.map((profile) => profile.label);

    expect(labels).toEqual([
      "Local process draft",
      "Remote endpoint review",
      "Mock preview profile"
    ]);

    expect(labels.join(" ")).not.toMatch(/cursor|spark|codex|gpt|claude|anthropic|llm|vendor/i);
    expect(labels.join(" ")).not.toMatch(/[\\/]/);
  });
});
