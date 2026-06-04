import { describe, expect, it } from "vitest";
import { createCockpitPanelToolCoverage } from "./cockpitPanelToolCoverage";

describe("createCockpitPanelToolCoverage", () => {
  it("falls back for non-array input or empty useful tool lists", () => {
    expect(createCockpitPanelToolCoverage("not-an-array")).toEqual({
      label: "No tools",
      detail: "No tools are assigned to this panel.",
      tone: "empty",
      countLabel: "0 tools"
    });

    expect(createCockpitPanelToolCoverage([])).toEqual({
      label: "No tools",
      detail: "No tools are assigned to this panel.",
      tone: "empty",
      countLabel: "0 tools"
    });

    expect(createCockpitPanelToolCoverage([null, "  ", 10, {}])).toEqual({
      label: "No tools",
      detail: "No tools are assigned to this panel.",
      tone: "empty",
      countLabel: "0 tools"
    });
  });

  it("trims, filters, and deduplicates case-insensitively while preserving first casing", () => {
    expect(
      createCockpitPanelToolCoverage([
        "  lint  ",
        "",
        "LINT",
        123,
        "test",
        "test",
        "  REVIEW  ",
        "  review"
      ])
    ).toMatchObject({
      detail: "Tools: lint, test, REVIEW",
      tone: "review",
      countLabel: "3 tools"
    });
  });

  it("uses singular tool count labels", () => {
    expect(createCockpitPanelToolCoverage(["  one_tool  "])).toMatchObject({
      countLabel: "1 tool"
    });
  });

  it("classifies no signal as ready", () => {
    expect(
      createCockpitPanelToolCoverage(["build-tool", "analysis", "planner"])
    ).toMatchObject({
      label: "Tool set",
      tone: "ready"
    });
  });

  it("classifies tool coverage as review when review-like tokens are present", () => {
    expect(createCockpitPanelToolCoverage(["Build tool", "Audit helper"])).toMatchObject({
      label: "Review set",
      tone: "review"
    });
  });

  it("classifies tool coverage as blocked when stop/block/error/fail is present and prioritizes blocked", () => {
    expect(createCockpitPanelToolCoverage(["error handler", "review board"])).toMatchObject({
      label: "Review tools",
      tone: "blocked"
    });
  });

  it("truncates details to compact length", () => {
    const longToolList = [
      "first tool",
      "second tool",
      "third tool that is very verbose and intentionally long for truncation coverage",
      "fourth tool",
      "fifth tool",
      "sixth tool",
      "seventh tool"
    ];

    const signal = createCockpitPanelToolCoverage(longToolList);

    expect(signal.detail.length).toBeLessThanOrEqual(120);
    expect(signal.detail.startsWith("Tools: ")).toBe(true);
    expect(signal.detail.endsWith("...")).toBe(true);
  });

  it("sanitizes private Windows, UNC, and Unix absolute path tokens in tool details", () => {
    const windows = createCockpitPanelToolCoverage([
      "Use C:\\Users\\MJ\\Atlas\\tools\\lint-checker"
    ]);
    const unc = createCockpitPanelToolCoverage([
      "Load from \\\\server\\share\\incoming\\extractor"
    ]);
    const unix = createCockpitPanelToolCoverage([
      "/tmp/artifacts/analyzer"
    ]);

    expect(windows.detail).toBe("Tools: Use lint-checker");
    expect(unc.detail).toBe("Tools: Load from extractor");
    expect(unix.detail).toBe("Tools: analyzer");
  });
});
