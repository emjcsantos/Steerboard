export interface LayoutDimensions {
  id: string;
  columns: number;
  rows: number;
}

export interface CockpitLayoutCapacity {
  label: string;
  detail: string;
  tone: "clear" | "active" | "full" | "overflow";
  layoutLabel: string;
  capacityLabel: string;
  usageLabel: string;
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

function sanitizeDimension(value: number): number {
  return sanitizeCount(value);
}

function buildLayoutLabel(layout: LayoutDimensions): string {
  const id = layout.id.trim();
  if (id) {
    return id;
  }

  return `${layout.columns}x${layout.rows}`;
}

function sanitizeUsage(visible: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.min(total, visible);
}

export function createCockpitLayoutCapacity(
  layout: LayoutDimensions,
  totalSessions: number,
  visibleSessions: number
): CockpitLayoutCapacity {
  const capacity = Math.min(
    sanitizeDimension(layout.columns) * sanitizeDimension(layout.rows),
    9
  );
  const total = sanitizeCount(totalSessions);
  const visible = sanitizeUsage(sanitizeCount(visibleSessions), total);
  const visibleWithinLayout = Math.min(visible, capacity);
  const queued = Math.max(0, total - capacity);

  const layoutLabel = buildLayoutLabel(layout);
  const capacityLabel = `${capacity} cell${capacity === 1 ? "" : "s"}`;
  const usageLabel =
    queued > 0
      ? `${visibleWithinLayout}/${capacity} visible / ${queued} queued`
      : `${visibleWithinLayout}/${capacity} visible`;

  if (capacity <= 0) {
    return {
      label: "Layout empty",
      detail: "This layout currently has no visible cells.",
      tone: "clear",
      layoutLabel,
      capacityLabel,
      usageLabel
    };
  }

  if (total === 0) {
    return {
      label: "Layout clear",
      detail: "No sessions assigned to this layout.",
      tone: "clear",
      layoutLabel,
      capacityLabel,
      usageLabel: `0/${capacity} visible`
    };
  }

  if (queued > 0) {
    return {
      label: "Layout overflow",
      detail: "Active sessions exceed layout capacity.",
      tone: "overflow",
      layoutLabel,
      capacityLabel,
      usageLabel
    };
  }

  if (visibleWithinLayout >= capacity && total > 0) {
    return {
      label: "Layout full",
      detail: "Layout capacity is fully used.",
      tone: "full",
      layoutLabel,
      capacityLabel,
      usageLabel
    };
  }

  return {
    label: "Layout active",
    detail: "Layout has open capacity.",
    tone: "active",
    layoutLabel,
    capacityLabel,
    usageLabel
  };
}
