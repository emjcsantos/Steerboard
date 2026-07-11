import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Classroom WCAG 2.2 AA presentation evidence", () => {
  it("keeps primary Classroom text above 4.5:1 on its light surface", () => {
    expect(contrast("#164e63", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("provides visible keyboard focus and 44px viewport controls", () => {
    expect(styles).toMatch(/\.classroom-seat:focus-visible\s*\{[^}]*outline:\s*3px/s);
    expect(styles).toMatch(/\.classroom-viewport-controls button\s*\{[^}]*min-height:\s*44px/s);
  });

  it("supports reduced motion without hiding semantic state", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain('.classroom-seat[data-motion-mode="reduced"]');
    expect(styles).toContain("animation: none");
  });

  it("supplies explicit forced-colors surfaces and Highlight focus", () => {
    expect(styles).toContain("@media (forced-colors: active)");
    expect(styles).toContain("border-color: CanvasText");
    expect(styles).toContain("outline: 3px solid Highlight");
  });

  it("uses non-overlay reflow for compact roster, inspector, and chat context", () => {
    expect(styles).toMatch(/@media \(max-width: 1100px\)[\s\S]*\.classroom-context-rail\s*\{[^}]*grid-row:\s*1;/);
    expect(styles).toMatch(/\.classroom-room-viewport\s*\{[^}]*overflow:\s*auto/s);
  });
});
