import { describe, expect, it } from "vitest";
import { createCockpitPanelFileScope } from "./cockpitPanelFileScope";

describe("createCockpitPanelFileScope", () => {
  it("handles empty and non-usable inputs as empty scope", () => {
    const scope = createCockpitPanelFileScope([]);

    expect(scope).toEqual({
      label: "No files",
      detail: "No file ownership metadata available.",
      tone: "empty",
      count: 0,
      files: []
    });
  });

  it("normalizes backslashes in relative file paths", () => {
    const scope = createCockpitPanelFileScope([
      "src\\views\\Panel.tsx",
      " lib\\util\\helpers.ts ",
      "docs\\layout\\main.ts"
    ]);

    expect(scope.tone).toBe("scoped");
    expect(scope.count).toBe(3);
    expect(scope.files).toEqual([
      "src/views/Panel.tsx",
      "lib/util/helpers.ts",
      "docs/layout/main.ts"
    ]);
    expect(scope.detail).toBe("src/views/Panel.tsx, lib/util/helpers.ts, docs/layout/main.ts");
  });

  it("dedupes blank-safe normalized labels", () => {
    const scope = createCockpitPanelFileScope([
      "src\\components\\same.ts",
      "src/components/same.ts",
      "  ",
      "src/components/other.ts",
      "SRC/COMPONENTS/other.ts"
    ]);

    expect(scope.count).toBe(2);
    expect(scope.files).toEqual([
      "src/components/same.ts",
      "src/components/other.ts"
    ]);
  });

  it("converts private absolute paths to basename-only safe labels", () => {
    const scope = createCockpitPanelFileScope([
      "C:\\Users\\mj\\secret\\plan.md",
      "/home/mj/ledger/overview.md",
      "\\\\server\\share\\notes.md",
      "relative/report.md",
      null as unknown as string
    ] as unknown as string[]);

    expect(scope.files).toEqual([
      "plan.md",
      "overview.md",
      "notes.md",
      "relative/report.md"
    ]);
    expect(scope.detail).not.toContain("C:");
    expect(scope.detail).not.toContain("/home");
    expect(scope.detail).not.toContain("\\\\");
  });

  it("flags wide scopes and keeps detail compact with +N more", () => {
    const scope = createCockpitPanelFileScope([
      "src/a.ts",
      "src/b.ts",
      "src/c.ts",
      "src/d.ts",
      "src/e.ts",
      "src/f.ts"
    ]);

    expect(scope.tone).toBe("wide");
    expect(scope.label).toBe("6 files");
    expect(scope.count).toBe(6);
    expect(scope.detail).toBe("src/a.ts, src/b.ts, src/c.ts +3 more");
  });

  it("compacts long file labels in detail output", () => {
    const scope = createCockpitPanelFileScope([
      "src/features/very-long-file-label-that-definitely-needs-truncation-to-remain-compact.tsx",
      "lib/another-very-long-file-label-for-compactness-check.ts"
    ]);

    expect(scope.tone).toBe("scoped");
    expect(scope.count).toBe(2);
    expect(scope.detail).toContain("...");
    expect(scope.files[0]).toMatch(/\.tsx$/);
    expect(scope.files[1]).toMatch(/\.ts$/);
  });
});
