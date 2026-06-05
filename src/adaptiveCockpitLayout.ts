export const ADAPTIVE_LAYOUT_COLUMNS = 3;
export const ADAPTIVE_LAYOUT_ROWS = 3;
export const ADAPTIVE_LAYOUT_MAX_PANELS = 9;
export const ADAPTIVE_LAYOUT_MIN_SIZE = 1;

export interface AdaptiveCockpitPanelRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AdaptiveCockpitPanel extends AdaptiveCockpitPanelRect {
  hidden: boolean;
}

export interface AdaptiveCockpitLayout {
  columns: number;
  rows: number;
  panels: AdaptiveCockpitPanel[];
}

export interface AddPanelInput {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  hidden?: boolean;
}

export interface MovePanelInput {
  x?: number;
  y?: number;
}

export interface ResizePanelInput {
  w?: number;
  h?: number;
}

export function createDefaultAdaptiveCockpitLayout(
  columns: number = ADAPTIVE_LAYOUT_COLUMNS,
  rows: number = ADAPTIVE_LAYOUT_ROWS
): AdaptiveCockpitLayout {
  return {
    columns: sanitizeGridColumns(columns),
    rows: sanitizeGridRows(rows),
    panels: [
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: ADAPTIVE_LAYOUT_MIN_SIZE,
        h: ADAPTIVE_LAYOUT_MIN_SIZE,
        hidden: false
      }
    ]
  };
}

export function createAdaptiveCockpitLayoutForPanelIds(
  panelIds: string[],
  visibleCount = Math.min(4, panelIds.length)
): AdaptiveCockpitLayout {
  const uniquePanelIds = uniqueNormalizedPanelIds(panelIds).slice(0, ADAPTIVE_LAYOUT_MAX_PANELS);
  const visiblePanelCount = clampInt(visibleCount, 1, Math.max(uniquePanelIds.length, 1));
  let layout: AdaptiveCockpitLayout = {
    columns: ADAPTIVE_LAYOUT_COLUMNS,
    rows: ADAPTIVE_LAYOUT_ROWS,
    panels: []
  };

  for (const [index, panelId] of uniquePanelIds.entries()) {
    layout = addAdaptiveCockpitPanel(layout, {
      id: panelId,
      x: index % ADAPTIVE_LAYOUT_COLUMNS,
      y: Math.floor(index / ADAPTIVE_LAYOUT_COLUMNS),
      hidden: index >= visiblePanelCount
    });
  }

  return layout.panels.length > 0 ? layout : createDefaultAdaptiveCockpitLayout();
}

export function syncAdaptiveCockpitLayoutToPanelIds(
  layout: AdaptiveCockpitLayout,
  panelIds: string[],
  visibleCount = Math.min(4, panelIds.length)
): AdaptiveCockpitLayout {
  const uniquePanelIds = uniqueNormalizedPanelIds(panelIds).slice(0, ADAPTIVE_LAYOUT_MAX_PANELS);
  if (uniquePanelIds.length === 0) {
    return createDefaultAdaptiveCockpitLayout();
  }

  const allowedPanelIds = new Set(uniquePanelIds);
  let synced = repairAdaptiveCockpitLayout({
    ...layout,
    panels: layout.panels.filter((panel) => allowedPanelIds.has(panel.id))
  });

  if (synced.panels.length === 1 && !allowedPanelIds.has(synced.panels[0].id)) {
    synced = {
      columns: ADAPTIVE_LAYOUT_COLUMNS,
      rows: ADAPTIVE_LAYOUT_ROWS,
      panels: []
    };
  }

  for (const [index, panelId] of uniquePanelIds.entries()) {
    if (synced.panels.some((panel) => panel.id === panelId)) {
      continue;
    }

    synced = addAdaptiveCockpitPanel(synced, {
      id: panelId,
      x: index % synced.columns,
      y: Math.floor(index / synced.columns),
      hidden: synced.panels.length >= visibleCount
    });
  }

  if (synced.panels.every((panel) => panel.hidden)) {
    const firstPanel = synced.panels[0];
    return revealAdaptiveCockpitPanel(synced, firstPanel.id);
  }

  return synced;
}

export function visibleAdaptiveCockpitPanels(
  layout: AdaptiveCockpitLayout
): AdaptiveCockpitPanel[] {
  return layout.panels.filter((panel) => !panel.hidden);
}

export function hiddenAdaptiveCockpitPanels(
  layout: AdaptiveCockpitLayout
): AdaptiveCockpitPanel[] {
  return layout.panels.filter((panel) => panel.hidden);
}

export function snapAndClampPanelRect(
  columns: number,
  rows: number,
  rect: AdaptiveCockpitPanelRect
): AdaptiveCockpitPanelRect {
  const maxColumns = sanitizeGridColumns(columns);
  const maxRows = sanitizeGridRows(rows);

  const snapped = {
    x: Number.isFinite(rect.x) ? Math.round(rect.x) : 0,
    y: Number.isFinite(rect.y) ? Math.round(rect.y) : 0,
    w: Number.isFinite(rect.w) ? Math.round(rect.w) : ADAPTIVE_LAYOUT_MIN_SIZE,
    h: Number.isFinite(rect.h) ? Math.round(rect.h) : ADAPTIVE_LAYOUT_MIN_SIZE
  };

  const minW = ADAPTIVE_LAYOUT_MIN_SIZE;
  const minH = ADAPTIVE_LAYOUT_MIN_SIZE;
  const clampedX = clampInt(snapped.x, 0, maxColumns - minW);
  const clampedY = clampInt(snapped.y, 0, maxRows - minH);
  const clampedW = clampInt(snapped.w, minW, maxColumns - clampedX);
  const clampedH = clampInt(snapped.h, minH, maxRows - clampedY);

  return {
    id: rect.id,
    x: clampedX,
    y: clampedY,
    w: clampedW,
    h: clampedH
  };
}

export function repairAdaptiveCockpitLayout(rawLayout: unknown): AdaptiveCockpitLayout {
  if (!isPlainObject(rawLayout)) {
    return createDefaultAdaptiveCockpitLayout();
  }

  const columns = sanitizeGridColumns(extractNumber(rawLayout.columns, ADAPTIVE_LAYOUT_COLUMNS));
  const rows = sanitizeGridRows(extractNumber(rawLayout.rows, ADAPTIVE_LAYOUT_ROWS));

  const base: AdaptiveCockpitLayout = {
    columns,
    rows,
    panels: []
  };

  if (!Array.isArray(rawLayout.panels)) {
    return base.panels.length > 0
      ? base
      : createDefaultAdaptiveCockpitLayout(columns, rows);
  }

  const ids = new Set<string>();
  let repaired = base;

  for (const rawPanel of rawLayout.panels) {
    if (!isPlainObject(rawPanel) || repaired.panels.length >= ADAPTIVE_LAYOUT_MAX_PANELS) {
      continue;
    }

    const candidate = parsePanelCandidate(rawPanel);
    if (!candidate) {
      continue;
    }

    const nextId = ensureUniqueId(candidate.id, ids);
    ids.add(nextId);
    const snapped = snapAndClampPanelRect(columns, rows, {
      id: nextId,
      x: candidate.x,
      y: candidate.y,
      w: candidate.w,
      h: candidate.h
    });
    const placement = resolveCollisionFreeRect(repaired, nextId, snapped);

    if (!placement) {
      continue;
    }

    repaired = {
      ...repaired,
      panels: [
        ...repaired.panels,
        {
          ...placement,
          id: nextId,
          hidden: Boolean(candidate.hidden)
        }
      ]
    };
  }

  if (repaired.panels.length === 0) {
    return createDefaultAdaptiveCockpitLayout(columns, rows);
  }

  return repaired;
}

export function addAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panel: AddPanelInput
): AdaptiveCockpitLayout {
  if (layout.panels.length >= ADAPTIVE_LAYOUT_MAX_PANELS) {
    return layout;
  }

  const id = normalizePanelId(panel.id);
  if (!id || layout.panels.some((existing) => existing.id === id)) {
    return layout;
  }

  const snapped = snapAndClampPanelRect(layout.columns, layout.rows, {
    id,
    x: panel.x ?? 0,
    y: panel.y ?? 0,
    w: panel.w ?? ADAPTIVE_LAYOUT_MIN_SIZE,
    h: panel.h ?? ADAPTIVE_LAYOUT_MIN_SIZE
  });
  const placement = resolveCollisionFreeRect(layout, id, snapped);
  if (!placement) {
    return layout;
  }

  return {
    ...layout,
    panels: [...layout.panels, { ...placement, id, hidden: Boolean(panel.hidden) }]
  };
}

export function moveAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panelId: string,
  move: MovePanelInput
): AdaptiveCockpitLayout {
  const index = layout.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) {
    return layout;
  }

  const panel = layout.panels[index];
  const request = snapAndClampPanelRect(layout.columns, layout.rows, {
    id: panelId,
    x: move.x ?? panel.x,
    y: move.y ?? panel.y,
    w: panel.w,
    h: panel.h
  });
  const resolved = resolveCollisionFreeRect(layout, panelId, request);
  if (!resolved) {
    return layout;
  }

  return replacePanelAt(layout, index, {
    ...panel,
    x: resolved.x,
    y: resolved.y
  });
}

export function resizeAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panelId: string,
  resize: ResizePanelInput
): AdaptiveCockpitLayout {
  const index = layout.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) {
    return layout;
  }

  const panel = layout.panels[index];
  const request = snapAndClampPanelRect(layout.columns, layout.rows, {
    id: panelId,
    x: panel.x,
    y: panel.y,
    w: resize.w ?? panel.w,
    h: resize.h ?? panel.h
  });
  const resolved = resolveCollisionFreeRect(layout, panelId, request);
  if (!resolved) {
    return layout;
  }

  return replacePanelAt(layout, index, {
    ...panel,
    x: resolved.x,
    y: resolved.y,
    w: resolved.w,
    h: resolved.h
  });
}

export function hideAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panelId: string
): AdaptiveCockpitLayout {
  const index = layout.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0 || layout.panels[index].hidden) {
    return layout;
  }

  return replacePanelAt(layout, index, { ...layout.panels[index], hidden: true });
}

export function revealAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panelId: string
): AdaptiveCockpitLayout {
  const index = layout.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0 || !layout.panels[index].hidden) {
    return layout;
  }

  const panel = layout.panels[index];
  const request = snapAndClampPanelRect(layout.columns, layout.rows, panel);
  const placement = resolveCollisionFreeRect(layout, panelId, request);
  if (!placement) {
    return layout;
  }

  return replacePanelAt(layout, index, {
    ...panel,
    x: placement.x,
    y: placement.y,
    w: placement.w,
    h: placement.h,
    hidden: false
  });
}

export function removeAdaptiveCockpitPanel(
  layout: AdaptiveCockpitLayout,
  panelId: string
): AdaptiveCockpitLayout {
  const nextPanels = layout.panels.filter((panel) => panel.id !== panelId);
  if (nextPanels.length === layout.panels.length) {
    return layout;
  }

  return {
    ...layout,
    panels: nextPanels
  };
}

function replacePanelAt(
  layout: AdaptiveCockpitLayout,
  index: number,
  patch: AdaptiveCockpitPanel
): AdaptiveCockpitLayout {
  const nextPanels = [...layout.panels];
  nextPanels[index] = patch;

  return {
    ...layout,
    panels: nextPanels
  };
}

function resolveCollisionFreeRect(
  layout: AdaptiveCockpitLayout,
  panelId: string,
  requested: AdaptiveCockpitPanelRect
): AdaptiveCockpitPanelRect | undefined {
  const candidates = generateShiftedCandidates(layout, requested);
  for (const candidate of candidates) {
    if (fitsInGrid(layout, candidate) && canPlace(layout, panelId, candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function generateShiftedCandidates(
  layout: AdaptiveCockpitLayout,
  requested: AdaptiveCockpitPanelRect
): AdaptiveCockpitPanelRect[] {
  const candidates: AdaptiveCockpitPanelRect[] = [];
  const seen = new Set<string>();
  const maxX = layout.columns - requested.w;
  const maxY = layout.rows - requested.h;

  if (maxX < 0 || maxY < 0) {
    return candidates;
  }

  for (let y = requested.y; y <= maxY; y++) {
    const xStart = y === requested.y ? requested.x : 0;
    for (let x = xStart; x <= maxX; x++) {
      addCandidate(candidates, seen, { ...requested, x, y });
    }
  }

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      addCandidate(candidates, seen, { ...requested, x, y });
    }
  }

  return candidates;
}

function addCandidate(
  candidates: AdaptiveCockpitPanelRect[],
  seen: Set<string>,
  candidate: AdaptiveCockpitPanelRect
) {
  const key = `${candidate.x},${candidate.y}`;
  if (!seen.has(key)) {
    seen.add(key);
    candidates.push(candidate);
  }
}

function canPlace(
  layout: AdaptiveCockpitLayout,
  panelId: string,
  candidate: AdaptiveCockpitPanelRect
): boolean {
  return layout.panels.every((other) => {
    if (other.id === panelId || other.hidden) {
      return true;
    }

    return !rectanglesOverlap(candidate, other);
  });
}

function fitsInGrid(layout: AdaptiveCockpitLayout, rect: AdaptiveCockpitPanelRect): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.w >= ADAPTIVE_LAYOUT_MIN_SIZE &&
    rect.h >= ADAPTIVE_LAYOUT_MIN_SIZE &&
    rect.x + rect.w <= layout.columns &&
    rect.y + rect.h <= layout.rows
  );
}

function rectanglesOverlap(a: AdaptiveCockpitPanelRect, b: AdaptiveCockpitPanelRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function parsePanelCandidate(rawPanel: Record<string, unknown>): {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hidden: boolean;
} | undefined {
  const id = normalizePanelId(rawPanel.id);
  if (!id) {
    return undefined;
  }

  return {
    id,
    x: extractNumber(rawPanel.x, 0),
    y: extractNumber(rawPanel.y, 0),
    w: extractNumber(rawPanel.w, ADAPTIVE_LAYOUT_MIN_SIZE),
    h: extractNumber(rawPanel.h, ADAPTIVE_LAYOUT_MIN_SIZE),
    hidden: rawPanel.hidden === true
  };
}

function normalizePanelId(rawId: unknown): string {
  if (typeof rawId !== "string") {
    return "";
  }

  const trimmed = rawId.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function ensureUniqueId(id: string, seenIds: Set<string>): string {
  if (!seenIds.has(id)) {
    return id;
  }

  let suffix = 2;
  while (seenIds.has(`${id}-${suffix}`)) {
    suffix += 1;
  }

  return `${id}-${suffix}`;
}

function uniqueNormalizedPanelIds(panelIds: string[]): string[] {
  const seen = new Set<string>();
  const uniqueIds: string[] = [];

  for (const rawPanelId of panelIds) {
    const panelId = normalizePanelId(rawPanelId);
    if (!panelId || seen.has(panelId)) {
      continue;
    }

    seen.add(panelId);
    uniqueIds.push(panelId);
  }

  return uniqueIds;
}

function sanitizeGridColumns(value: number): number {
  return clampInt(value, ADAPTIVE_LAYOUT_MIN_SIZE, ADAPTIVE_LAYOUT_COLUMNS);
}

function sanitizeGridRows(value: number): number {
  return clampInt(value, ADAPTIVE_LAYOUT_MIN_SIZE, ADAPTIVE_LAYOUT_ROWS);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  const rounded = Math.round(value);
  if (rounded < min) {
    return min;
  }

  if (rounded > max) {
    return max;
  }

  return rounded;
}

function extractNumber(rawValue: unknown, fallback: number): number {
  return typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
