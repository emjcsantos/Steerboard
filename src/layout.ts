export type LayoutId =
  | "1x1"
  | "2x1"
  | "1x2"
  | "3x1"
  | "1x3"
  | "2x2"
  | "2x3"
  | "3x2"
  | "3x3";

export type CockpitMode = "focus" | "orchestrator" | "monitor";

export interface LayoutSpec {
  id: LayoutId;
  columns: number;
  rows: number;
}

export const layoutOptions: LayoutSpec[] = [
  { id: "1x1", columns: 1, rows: 1 },
  { id: "2x1", columns: 2, rows: 1 },
  { id: "1x2", columns: 1, rows: 2 },
  { id: "3x1", columns: 3, rows: 1 },
  { id: "1x3", columns: 1, rows: 3 },
  { id: "2x2", columns: 2, rows: 2 },
  { id: "2x3", columns: 2, rows: 3 },
  { id: "3x2", columns: 3, rows: 2 },
  { id: "3x3", columns: 3, rows: 3 }
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

export function visibleSessionIds<T extends { id: string }>(
  sessions: T[],
  layoutId: LayoutId
): string[] {
  return sessions.slice(0, maxVisibleCells(layoutId)).map((session) => session.id);
}
