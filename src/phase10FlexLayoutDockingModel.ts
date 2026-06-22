import type {
  IGlobalAttributes,
  IJsonModel,
  IJsonRowNode,
  IJsonTabNode,
  IJsonTabSetNode
} from "flexlayout-react";
import type { SessionSummary } from "./fixtures";

export const phase10FlexLayoutPackageName = "flexlayout-react";
export const phase10FlexLayoutRepositoryName = "caplin/FlexLayout";
export const phase10FlexLayoutExpectedLicense = "ISC";

export type Phase10FlexLayoutDockingPersistenceState =
  | "generated"
  | "restored"
  | "repaired"
  | "saved"
  | "reset";

export interface Phase10FlexLayoutDockingRepairResult {
  model: IJsonModel;
  state: Phase10FlexLayoutDockingPersistenceState;
  visibleSessionIds: string[];
  activeSessionId?: string;
  repaired: boolean;
}

export interface RepairPhase10FlexLayoutDockingModelOptions {
  appendMissingSessions?: boolean;
  fallbackState?: Phase10FlexLayoutDockingPersistenceState;
}

const MAX_DOCKED_TABSETS = 4;
const ROOT_ID = "phase10-flexlayout-arena-root";
const EMPTY_TABSET_ID = "phase10-dock-tabset-empty";
const EMPTY_TAB_ID = "phase10-dock-tab-empty";
const ARENA_SESSION_COMPONENT = "arena-session";
const EMPTY_COMPONENT = "empty";

const phase10FlexLayoutGlobal: IGlobalAttributes = {
  rootOrientationVertical: false,
  tabEnableClose: true,
  tabEnableDrag: true,
  tabEnablePopout: false,
  tabEnableRenderOnDemand: false,
  tabSetEnableClose: false,
  tabSetEnableDeleteWhenEmpty: true,
  tabSetEnableDrop: true,
  tabSetEnableMaximize: true,
  tabSetMinHeight: 190,
  tabSetMinWidth: 260
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteWeight(value: unknown, fallback = 100): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function finiteSelected(value: unknown, maxIndex: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || maxIndex < 0) {
    return 0;
  }

  return Math.min(Math.max(Math.floor(value), 0), maxIndex);
}

function sessionTabId(sessionId: string): string {
  return `phase10-dock-tab-${sessionId}`;
}

function buildDockedTab(session: SessionSummary): IJsonTabNode {
  return {
    id: sessionTabId(session.id),
    type: "tab",
    name: session.title,
    component: ARENA_SESSION_COMPONENT,
    enableClose: true,
    enableDrag: true,
    helpText: `${session.role} / ${session.state}`,
    config: {
      sessionId: session.id,
      projectId: session.projectId,
      branch: session.branch
    }
  };
}

function buildEmptyTab(): IJsonTabNode {
  return {
    id: EMPTY_TAB_ID,
    type: "tab",
    name: "No Arena panels",
    component: EMPTY_COMPONENT,
    enableClose: false,
    enableDrag: false
  };
}

function buildDockedTabset(
  tabs: IJsonTabNode[],
  index: number,
  weight: number,
  selected = 0
): IJsonTabSetNode {
  return {
    id: `phase10-dock-tabset-${index + 1}`,
    type: "tabset",
    weight,
    selected: finiteSelected(selected, tabs.length - 1),
    enableDeleteWhenEmpty: true,
    children: tabs
  };
}

function buildEmptyTabset(): IJsonTabSetNode {
  return {
    id: EMPTY_TABSET_ID,
    type: "tabset",
    weight: 100,
    selected: 0,
    enableDeleteWhenEmpty: false,
    children: [buildEmptyTab()]
  };
}

function buildRoot(children: IJsonRowNode["children"]): IJsonRowNode {
  return {
    id: ROOT_ID,
    type: "row",
    weight: 100,
    children
  };
}

export function buildPhase10FlexLayoutDockingModel(
  sessions: readonly SessionSummary[]
): IJsonModel {
  const dockedSessions = sessions.slice(0, MAX_DOCKED_TABSETS);
  const weight = dockedSessions.length > 0 ? Math.round(100 / dockedSessions.length) : 100;

  return {
    global: phase10FlexLayoutGlobal,
    borders: [],
    layout: buildRoot(
      dockedSessions.length > 0
        ? dockedSessions.map((session, index) =>
            buildDockedTabset([buildDockedTab(session)], index, weight)
          )
        : [buildEmptyTabset()]
    )
  };
}

function extractSessionIdFromTab(tab: IJsonTabNode): string | undefined {
  const config = isPlainObject(tab.config) ? tab.config : undefined;
  return typeof config?.sessionId === "string" ? config.sessionId : undefined;
}

function repairTab(
  rawTab: unknown,
  sessionById: ReadonlyMap<string, SessionSummary>,
  seenSessionIds: Set<string>
): IJsonTabNode | undefined {
  if (!isPlainObject(rawTab) || rawTab.type !== "tab") {
    return undefined;
  }

  const sessionId = extractSessionIdFromTab(rawTab as IJsonTabNode);
  if (!sessionId || seenSessionIds.has(sessionId)) {
    return undefined;
  }

  const session = sessionById.get(sessionId);
  if (!session) {
    return undefined;
  }

  seenSessionIds.add(sessionId);
  return buildDockedTab(session);
}

function isTabsetNode(value: unknown): value is IJsonTabSetNode {
  return isPlainObject(value) && value.type === "tabset";
}

function isRowNode(value: unknown): value is IJsonRowNode {
  return isPlainObject(value) && value.type === "row";
}

function repairTabset(
  rawNode: unknown,
  sessionById: ReadonlyMap<string, SessionSummary>,
  seenSessionIds: Set<string>,
  fallbackIndex: number
): IJsonTabSetNode | undefined {
  if (!isTabsetNode(rawNode) || !Array.isArray(rawNode.children)) {
    return undefined;
  }

  const children = rawNode.children
    .map((tab) => repairTab(tab, sessionById, seenSessionIds))
    .filter((tab): tab is IJsonTabNode => Boolean(tab));

  if (children.length === 0) {
    return undefined;
  }

  return {
    id:
      typeof rawNode.id === "string" && rawNode.id.trim()
        ? rawNode.id
        : `phase10-dock-tabset-${fallbackIndex + 1}`,
    type: "tabset",
    weight: finiteWeight(rawNode.weight),
    selected: finiteSelected(rawNode.selected, children.length - 1),
    ...(rawNode.active ? { active: true } : {}),
    ...(rawNode.maximized ? { maximized: true } : {}),
    enableDeleteWhenEmpty: true,
    children
  };
}

function repairNode(
  rawNode: unknown,
  sessionById: ReadonlyMap<string, SessionSummary>,
  seenSessionIds: Set<string>,
  index: number
): IJsonRowNode | IJsonTabSetNode | undefined {
  if (isTabsetNode(rawNode)) {
    return repairTabset(rawNode, sessionById, seenSessionIds, index);
  }

  if (!isRowNode(rawNode) || !Array.isArray(rawNode.children)) {
    return undefined;
  }

  const children = rawNode.children
    .map((child, childIndex) =>
      repairNode(child, sessionById, seenSessionIds, childIndex)
    )
    .filter((child): child is IJsonRowNode | IJsonTabSetNode => Boolean(child));

  if (children.length === 0) {
    return undefined;
  }

  return {
    id: typeof rawNode.id === "string" && rawNode.id.trim() ? rawNode.id : ROOT_ID,
    type: "row",
    weight: finiteWeight(rawNode.weight),
    children
  };
}

function appendMissingSessionTabsets(
  root: IJsonRowNode,
  sessions: readonly SessionSummary[],
  seenSessionIds: Set<string>
): { root: IJsonRowNode; changed: boolean } {
  const missingSessions = sessions
    .filter((session) => !seenSessionIds.has(session.id))
    .slice(0, Math.max(MAX_DOCKED_TABSETS - seenSessionIds.size, 0));

  if (missingSessions.length === 0) {
    return { root, changed: false };
  }

  const existingChildren = root.children ?? [];
  const nextChildren = [
    ...existingChildren,
    ...missingSessions.map((session, index) =>
      buildDockedTabset(
        [buildDockedTab(session)],
        existingChildren.length + index,
        Math.round(100 / Math.max(existingChildren.length + missingSessions.length, 1))
      )
    )
  ];

  return {
    root: {
      ...root,
      children: nextChildren
    },
    changed: true
  };
}

function rootFromRepairedNode(node: IJsonRowNode | IJsonTabSetNode): IJsonRowNode {
  if (node.type === "row") {
    return {
      ...node,
      id: ROOT_ID,
      weight: 100
    };
  }

  return buildRoot([node]);
}

export function extractPhase10FlexLayoutSessionIds(model: IJsonModel): string[] {
  const ids: string[] = [];

  function visitNode(node: IJsonRowNode | IJsonTabSetNode | IJsonTabNode | undefined) {
    if (!node) {
      return;
    }

    if (node.type === "tab") {
      const sessionId = extractSessionIdFromTab(node);
      if (sessionId) {
        ids.push(sessionId);
      }
      return;
    }

    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach(visitNode);
    }
  }

  visitNode(model.layout);
  return ids;
}

export function extractPhase10FlexLayoutActiveSessionId(model: IJsonModel): string | undefined {
  let activeSessionId: string | undefined;
  let fallbackSessionId: string | undefined;

  function visitNode(node: IJsonRowNode | IJsonTabSetNode | IJsonTabNode | undefined) {
    if (!node || node.type === "tab") {
      return;
    }

    if (isTabsetNode(node) && Array.isArray(node.children)) {
      const selectedIndex = finiteSelected(node.selected, node.children.length - 1);
      const selectedTab = node.children[selectedIndex];
      if (selectedTab?.type === "tab") {
        const sessionId = extractSessionIdFromTab(selectedTab);
        if (sessionId) {
          fallbackSessionId ??= sessionId;
          if (node.active) {
            activeSessionId = sessionId;
          }
        }
      }
    }

    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach(visitNode);
    }
  }

  visitNode(model.layout);
  return activeSessionId ?? fallbackSessionId ?? extractPhase10FlexLayoutSessionIds(model)[0];
}

export function repairPhase10FlexLayoutDockingModel(
  rawModel: unknown,
  sessions: readonly SessionSummary[],
  options: RepairPhase10FlexLayoutDockingModelOptions = {}
): Phase10FlexLayoutDockingRepairResult {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const seenSessionIds = new Set<string>();
  const appendMissingSessions = options.appendMissingSessions ?? true;
  const fallbackState = options.fallbackState ?? "restored";

  if (!isPlainObject(rawModel) || !isPlainObject(rawModel.layout)) {
    const model = buildPhase10FlexLayoutDockingModel(sessions);
    return {
      model,
      state: options.fallbackState ?? "generated",
      visibleSessionIds: extractPhase10FlexLayoutSessionIds(model),
      activeSessionId: extractPhase10FlexLayoutActiveSessionId(model),
      repaired: true
    };
  }

  const repairedNode = repairNode(rawModel.layout, sessionById, seenSessionIds, 0);
  if (!repairedNode) {
    const model = buildPhase10FlexLayoutDockingModel(sessions.slice(0, Math.max(sessions.length, 1)));
    return {
      model,
      state: "repaired",
      visibleSessionIds: extractPhase10FlexLayoutSessionIds(model),
      activeSessionId: extractPhase10FlexLayoutActiveSessionId(model),
      repaired: true
    };
  }

  let root = rootFromRepairedNode(repairedNode);
  let appendedMissing = false;

  if (appendMissingSessions) {
    const appended = appendMissingSessionTabsets(root, sessions, seenSessionIds);
    root = appended.root;
    appendedMissing = appended.changed;
  }

  const model: IJsonModel = {
    global: phase10FlexLayoutGlobal,
    borders: [],
    layout: root
  };
  const visibleSessionIds = extractPhase10FlexLayoutSessionIds(model);
  const serializedInput = JSON.stringify(rawModel);
  const serializedOutput = JSON.stringify(model);
  const repaired = serializedInput !== serializedOutput || appendedMissing;

  return {
    model,
    state: repaired ? "repaired" : fallbackState,
    visibleSessionIds,
    activeSessionId: extractPhase10FlexLayoutActiveSessionId(model),
    repaired
  };
}

export function summarizePhase10FlexLayoutDockingModel(
  model: IJsonModel,
  persistenceState: Phase10FlexLayoutDockingPersistenceState = "generated"
): string {
  const tabsetCount = model.layout.children?.length ?? 0;
  const tabCount = extractPhase10FlexLayoutSessionIds(model).length;

  return (
    `FlexLayout docking model: package=${phase10FlexLayoutPackageName} ` +
    `repository=${phase10FlexLayoutRepositoryName} license=${phase10FlexLayoutExpectedLicense} ` +
    `tabsets=${tabsetCount} tabs=${tabCount} savedLayoutJson=yes persistence=${persistenceState} ` +
    `fallback=custom-adaptive-grid-preserved`
  );
}
