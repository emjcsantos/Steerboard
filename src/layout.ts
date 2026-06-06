export type LayoutId =
  | "1x1"
  | "2x1"
  | "1x2"
  | "3x1"
  | "1x3"
  | "2x2"
  | "2x3"
  | "3x2"
  | "3x3"
  | "adaptive";

export type LayoutKind = "fixed" | "adaptive";

export type CockpitMode = "focus" | "orchestrator" | "monitor";

export interface LayoutSpec {
  id: LayoutId;
  label: string;
  description: string;
  columns: number;
  rows: number;
  kind: LayoutKind;
}

export interface LayoutGrid {
  columns: number;
  rows: number;
}

export const layoutOptions: LayoutSpec[] = [
  { id: "1x1", label: "1x1", description: "One Arena panel.", columns: 1, rows: 1, kind: "fixed" },
  { id: "2x1", label: "2x1", description: "Two panels side by side.", columns: 2, rows: 1, kind: "fixed" },
  { id: "1x2", label: "1x2", description: "Two stacked panels.", columns: 1, rows: 2, kind: "fixed" },
  { id: "3x1", label: "3x1", description: "Three panels in one row.", columns: 3, rows: 1, kind: "fixed" },
  { id: "1x3", label: "1x3", description: "Three stacked panels.", columns: 1, rows: 3, kind: "fixed" },
  { id: "2x2", label: "2x2", description: "Four balanced Arena panels.", columns: 2, rows: 2, kind: "fixed" },
  { id: "2x3", label: "2x3", description: "Six panels in two columns.", columns: 2, rows: 3, kind: "fixed" },
  { id: "3x2", label: "3x2", description: "Six panels in three columns.", columns: 3, rows: 2, kind: "fixed" },
  { id: "3x3", label: "3x3", description: "Maximum fixed-grid Arena view.", columns: 3, rows: 3, kind: "fixed" },
  {
    id: "adaptive",
    label: "Adaptive",
    description: "Freeform Arena entry point; uses a safe 3x3 placeholder until magnetic panels ship.",
    columns: 3,
    rows: 3,
    kind: "adaptive"
  }
];

export const defaultLayoutByMode: Record<CockpitMode, LayoutId> = {
  focus: "2x1",
  orchestrator: "2x2",
  monitor: "3x2"
};

export function getLayoutSpec(layoutId: LayoutId): LayoutSpec {
  const match = layoutOptions.find((layout) => layout.id === layoutId);

  if (!match) {
    return layoutOptions[0];
  }

  return match;
}

export function maxVisibleCells(layoutId: LayoutId): number {
  const layout = getLayoutSpec(layoutId);
  return Math.min(layout.columns * layout.rows, 9);
}

export function layoutAriaLabel(layout: LayoutSpec): string {
  return `${layout.label}: ${layout.description}`;
}

function sanitizeVisibleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(9, Math.max(1, Math.floor(value)));
}

export function getAdaptivePlaceholderGrid(visibleCount: number): LayoutGrid {
  const count = sanitizeVisibleCount(visibleCount);

  if (count === 1) {
    return { columns: 1, rows: 1 };
  }

  if (count === 2) {
    return { columns: 2, rows: 1 };
  }

  if (count === 3) {
    return { columns: 3, rows: 1 };
  }

  if (count <= 4) {
    return { columns: 2, rows: 2 };
  }

  if (count <= 6) {
    return { columns: 3, rows: 2 };
  }

  return { columns: 3, rows: 3 };
}

export function getDisplayGrid(layout: LayoutSpec, visibleCount: number): LayoutGrid {
  if (layout.kind === "adaptive") {
    return getAdaptivePlaceholderGrid(visibleCount);
  }

  return {
    columns: layout.columns,
    rows: layout.rows
  };
}

export function visibleSessionIds<T extends { id: string }>(
  sessions: T[],
  layoutId: LayoutId
): string[] {
  return sessions.slice(0, maxVisibleCells(layoutId)).map((session) => session.id);
}
