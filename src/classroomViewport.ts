export const CLASSROOM_VIEWPORT_STORAGE_KEY = "steerboard.classroomViewport.v1";

export interface ClassroomViewportState {
  zoom: number;
  panX: number;
  panY: number;
  fitMode: "auto" | "manual";
}

export const defaultClassroomViewport: ClassroomViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  fitMode: "auto"
};

function bounded(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

export function normalizeClassroomViewport(value: unknown): ClassroomViewportState {
  const source = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  return {
    zoom: bounded(source.zoom, 0.6, 1.8, 1),
    panX: bounded(source.panX, -1, 1, 0),
    panY: bounded(source.panY, -1, 1, 0),
    fitMode: source.fitMode === "manual" ? "manual" : "auto"
  };
}

export function parseClassroomViewport(serialized: string | null): ClassroomViewportState {
  if (!serialized) return defaultClassroomViewport;
  try { return normalizeClassroomViewport(JSON.parse(serialized)); }
  catch { return defaultClassroomViewport; }
}

export function loadClassroomViewport(): ClassroomViewportState {
  return typeof window === "undefined"
    ? defaultClassroomViewport
    : parseClassroomViewport(window.localStorage.getItem(CLASSROOM_VIEWPORT_STORAGE_KEY));
}

export function saveClassroomViewport(state: ClassroomViewportState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLASSROOM_VIEWPORT_STORAGE_KEY, JSON.stringify(normalizeClassroomViewport(state)));
  }
}

export function manipulateClassroomViewport(
  state: ClassroomViewportState,
  change: Partial<Pick<ClassroomViewportState, "zoom" | "panX" | "panY">>
): ClassroomViewportState {
  return normalizeClassroomViewport({ ...state, ...change, fitMode: "manual" });
}

export function fitClassroomViewport(): ClassroomViewportState {
  return { ...defaultClassroomViewport, fitMode: "auto" };
}

export function resetClassroomViewport(): ClassroomViewportState {
  return { ...defaultClassroomViewport, fitMode: "manual" };
}

export function classroomSemanticZoom(zoom: number): "overview" | "standard" | "detail" {
  return zoom < 0.82 ? "overview" : zoom > 1.25 ? "detail" : "standard";
}
