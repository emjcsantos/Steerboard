import { describe, expect, it } from "vitest";
import { createCockpitLayoutCapacity } from "./cockpitLayoutCapacity";

describe("createCockpitLayoutCapacity", () => {
  it("returns a clear signal for an empty layout", () => {
    const signal = createCockpitLayoutCapacity({ id: "0x0", columns: 0, rows: 0 }, 0, 0);

    expect(signal).toEqual({
      label: "Layout empty",
      detail: "This layout currently has no visible cells.",
      tone: "clear",
      layoutLabel: "0x0",
      capacityLabel: "0 cells",
      usageLabel: "0/0 visible"
    });
  });

  it("returns an active signal for partial usage", () => {
    const signal = createCockpitLayoutCapacity({ id: "2x3", columns: 2, rows: 3 }, 5, 3);

    expect(signal).toEqual({
      label: "Layout active",
      detail: "Layout has open capacity.",
      tone: "active",
      layoutLabel: "2x3",
      capacityLabel: "6 cells",
      usageLabel: "3/6 visible"
    });
  });

  it("returns a full signal when capacity is reached", () => {
    const signal = createCockpitLayoutCapacity({ id: "2x2", columns: 2, rows: 2 }, 4, 4);

    expect(signal).toEqual({
      label: "Layout full",
      detail: "Layout capacity is fully used.",
      tone: "full",
      layoutLabel: "2x2",
      capacityLabel: "4 cells",
      usageLabel: "4/4 visible"
    });
  });

  it("returns an overflow signal when sessions exceed capacity", () => {
    const signal = createCockpitLayoutCapacity({ id: "2x3", columns: 2, rows: 3 }, 10, 6);

    expect(signal).toEqual({
      label: "Layout overflow",
      detail: "Active sessions exceed layout capacity.",
      tone: "overflow",
      layoutLabel: "2x3",
      capacityLabel: "6 cells",
      usageLabel: "6/6 visible / 4 queued"
    });
  });

  it("hard caps 3x3 layout visibility at 9", () => {
    const signal = createCockpitLayoutCapacity({ id: "3x3", columns: 3, rows: 12 }, 12, 12);

    expect(signal).toEqual({
      label: "Layout overflow",
      detail: "Active sessions exceed layout capacity.",
      tone: "overflow",
      layoutLabel: "3x3",
      capacityLabel: "9 cells",
      usageLabel: "9/9 visible / 3 queued"
    });
  });

  it("sanitizes negative and non-numeric counts", () => {
    const signal = createCockpitLayoutCapacity({ id: "2x2", columns: 2, rows: 2 }, Number.NaN, -2.7);

    expect(signal).toEqual({
      label: "Layout clear",
      detail: "No sessions assigned to this layout.",
      tone: "clear",
      layoutLabel: "2x2",
      capacityLabel: "4 cells",
      usageLabel: "0/4 visible"
    });
  });
});
