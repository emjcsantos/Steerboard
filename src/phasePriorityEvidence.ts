import type {
  CodexLiveSmokeProof,
  CodexTwoPanelSmokeProof
} from "./codexTransportSpike";
import {
  buildCodexPanelSessionRestoreProof,
  findCodexPanelSessionIdentityIssues,
  type CodexPanelSessionState
} from "./codexPanelSessionState";
import {
  buildProjectManagementArenaDispatch,
  type ProjectManagementTask
} from "./projectManagementHierarchy";
import {
  currentProjectManagementPhaseEpicIds,
  currentProjectManagementPhasePlanTaskIds
} from "./projectManagementPhasePlan";
import type { RuntimeStreamIsolationProof } from "./runtimeStream";

export type PhasePriorityEvidenceState = "ready" | "review" | "blocked" | "waiting";
export type PhasePriorityEvidenceId = "phase-1-live-panel" | "phase-2-panel-isolation" | "phase-6-pm-board";

export interface PhasePriorityEvidenceItem {
  id: PhasePriorityEvidenceId;
  label: string;
  state: PhasePriorityEvidenceState;
  readiness: number;
  detail: string;
  nextAction: string;
}

export interface PhasePriorityEvidenceCounts {
  ready: number;
  review: number;
  blocked: number;
  waiting: number;
}

export interface PhasePriorityEvidenceResult {
  state: PhasePriorityEvidenceState;
  readiness: number;
  statusLabel: string;
  detail: string;
  counts: PhasePriorityEvidenceCounts;
  items: PhasePriorityEvidenceItem[];
}

export interface PhasePriorityEvidenceInput {
  liveSmokeProof?: CodexLiveSmokeProof;
  twoPanelSmokeProof?: CodexTwoPanelSmokeProof;
  panelSessionState?: CodexPanelSessionState;
  runtimeStreamIsolationProof?: RuntimeStreamIsolationProof;
  projectManagementTasks?: readonly ProjectManagementTask[];
  project?: {
    id: string;
    name: string;
  };
}

const READINESS_BY_STATE: Record<PhasePriorityEvidenceState, number> = {
  ready: 100,
  review: 65,
  blocked: 15,
  waiting: 35
};

const STATUS_LABELS: Record<PhasePriorityEvidenceState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bool(value: unknown): boolean {
  return value === true;
}

function stateForItems(items: readonly PhasePriorityEvidenceItem[]): PhasePriorityEvidenceState {
  if (items.every((item) => item.state === "ready")) {
    return "ready";
  }

  if (items.some((item) => item.state === "blocked")) {
    return "blocked";
  }

  if (items.some((item) => item.state === "review")) {
    return "review";
  }

  return "waiting";
}

function countItems(items: readonly PhasePriorityEvidenceItem[]): PhasePriorityEvidenceCounts {
  const counts: PhasePriorityEvidenceCounts = {
    ready: 0,
    review: 0,
    blocked: 0,
    waiting: 0
  };

  for (const item of items) {
    counts[item.state] += 1;
  }

  return counts;
}

function item(
  id: PhasePriorityEvidenceId,
  label: string,
  state: PhasePriorityEvidenceState,
  detail: string,
  nextAction: string
): PhasePriorityEvidenceItem {
  return {
    id,
    label,
    state,
    readiness: READINESS_BY_STATE[state],
    detail,
    nextAction
  };
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function stringArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").length : 0;
}

function methodListProof(value: unknown): string {
  if (!Array.isArray(value)) {
    return "none";
  }

  const methods = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .sort((left, right) => left.localeCompare(right));

  return methods.length > 0 ? methods.join("|") : "none";
}

function countReadyPanels(
  panels: readonly unknown[],
  predicate: (panel: Record<string, unknown>) => boolean
): number {
  return panels.filter((panel) => isRecord(panel) && predicate(panel)).length;
}

function sumPanelProofNumbers(panels: readonly unknown[], key: string): number {
  return panels.reduce<number>((total, panel) => {
    if (!isRecord(panel)) {
      return total;
    }

    return total + nonNegativeNumber(panel[key]);
  }, 0);
}

function buildTwoPanelSmokeProofSummary(twoPanelSmokeProof: Record<string, unknown>, panels: readonly unknown[]): string {
  const source =
    typeof twoPanelSmokeProof.source === "string" && twoPanelSmokeProof.source.trim()
      ? twoPanelSmokeProof.source.trim()
      : "unknown";
  const executed = bool(twoPanelSmokeProof.executed);
  const timestamped =
    typeof twoPanelSmokeProof.checkedAt === "string" && twoPanelSmokeProof.checkedAt.trim().length > 0;
  const ok = bool(twoPanelSmokeProof.ok);
  const panelCount = nonNegativeNumber(twoPanelSmokeProof.panelCount);
  const completedPanels = countReadyPanels(panels, (panel) => bool(panel.completed));
  const sessionIdPanels = countReadyPanels(panels, (panel) => bool(panel.sessionIdSeen));
  const threadIdPanels = countReadyPanels(panels, (panel) => bool(panel.threadIdSeen));
  const expectedTokenPanels = countReadyPanels(panels, (panel) => bool(panel.expectedTokenSeen));
  const foreignTokenPanels = countReadyPanels(panels, (panel) => bool(panel.foreignTokenSeen));
  const eventCount = sumPanelProofNumbers(panels, "eventCount");
  const transcriptLength = sumPanelProofNumbers(panels, "transcriptLength");
  const expectedPanels = Math.max(panelCount, panels.length);

  return (
    `smokeProof=source:${source} executed=${executed} timestamped=${timestamped} ok=${ok} ` +
    `distinctSessions=${bool(twoPanelSmokeProof.distinctSessionIds)} ` +
    `distinctThreads=${bool(twoPanelSmokeProof.distinctThreadIds)} ` +
    `bothCompleted=${bool(twoPanelSmokeProof.bothCompleted)} ` +
    `crossTalk=${bool(twoPanelSmokeProof.crossTalkDetected)} ` +
    `panelProof=${completedPanels}/${expectedPanels} ` +
    `sessionIdPanels=${sessionIdPanels}/${expectedPanels} ` +
    `threadIdPanels=${threadIdPanels}/${expectedPanels} ` +
    `eventCount=${eventCount} transcriptLength=${transcriptLength} ` +
    `expectedTokenPanels=${expectedTokenPanels} foreignTokenPanels=${foreignTokenPanels}`
  );
}

function buildReloadProofSummary(proof: Record<string, unknown>): string {
  const source = typeof proof.source === "string" && proof.source.trim() ? proof.source.trim() : "unknown";
  const executed = bool(proof.executed);
  const timestamped = typeof proof.checkedAt === "string" && proof.checkedAt.trim().length > 0;
  const checkedAt = timestamped ? String(proof.checkedAt).trim().replace(/\s+/g, "_") : "none";
  const storageTrusted = source === "desktop" && executed && timestamped;

  return (
    `reloadProof=source:${source} executed=${executed} timestamped=${timestamped} ` +
    `checkedAt=${checkedAt} storageTrusted=${storageTrusted}`
  );
}

function buildPhase1LivePanelItem(liveSmokeProof: unknown): PhasePriorityEvidenceItem {
  if (!isRecord(liveSmokeProof)) {
    return item(
      "phase-1-live-panel",
      "Phase 1 live Arena panel",
      "waiting",
      "No live send/stream proof has been recorded.",
      "Run one live Arena panel smoke from desktop mode and capture stream completion evidence."
    );
  }

  const executed = bool(liveSmokeProof.executed);
  const ok = bool(liveSmokeProof.ok);
  const streamSignalChecks = [
    { key: "ok", label: "desktop smoke result", ready: ok },
    {
      key: "checkedAt",
      label: "reload timestamp",
      ready: typeof liveSmokeProof.checkedAt === "string" && liveSmokeProof.checkedAt.trim().length > 0
    },
    { key: "threadIdSeen", label: "thread id", ready: bool(liveSmokeProof.threadIdSeen) },
    { key: "turnIdSeen", label: "turn id", ready: bool(liveSmokeProof.turnIdSeen) },
    {
      key: "agentDeltaMethodSeen",
      label: "agent delta",
      ready: bool(liveSmokeProof.agentDeltaMethodSeen)
    },
    {
      key: "turnCompletedSeen",
      label: "turn completion",
      ready: bool(liveSmokeProof.turnCompletedSeen)
    },
    {
      key: "expectedTokenSeen",
      label: "expected token",
      ready: bool(liveSmokeProof.expectedTokenSeen)
    }
  ];
  const missingStreamSignals = streamSignalChecks.filter((signal) => !signal.ready);
  const readySignalCount = streamSignalChecks.length - missingStreamSignals.length;
  const streamSignalProof =
    `signalProof=${readySignalCount}/${streamSignalChecks.length} ` +
    `methodCount=${nonNegativeNumber(liveSmokeProof.methodCount)} ` +
    `uniqueMethods=${stringArrayLength(liveSmokeProof.uniqueMethods)} ` +
    `methods=${methodListProof(liveSmokeProof.uniqueMethods)}`;
  const reloadProof = buildReloadProofSummary(liveSmokeProof);
  const ready = executed && missingStreamSignals.length === 0;

  if (ready) {
    return item(
      "phase-1-live-panel",
      "Phase 1 live Arena panel",
      "ready",
      `One live Arena panel has thread, turn, stream delta, completion, and expected-token evidence. ${streamSignalProof}. ${reloadProof}.`,
      "Keep this as the one-panel regression proof before expanding provider work."
    );
  }

  if (!executed) {
    return item(
      "phase-1-live-panel",
      "Phase 1 live Arena panel",
      "waiting",
      "Live panel proof has not been executed in desktop mode yet.",
      "Run live smoke from the connection dialog or Owner Testing action path."
    );
  }

  return item(
    "phase-1-live-panel",
    "Phase 1 live Arena panel",
    "review",
    `Live panel proof ran with ${streamSignalProof} and ${reloadProof}, but missing stream/completion signal${missingStreamSignals.length === 1 ? "" : "s"}: ${missingStreamSignals.map((signal) => signal.label).join(", ")}.`,
    "Review the proof detail, rerun the desktop smoke, and keep browser fallback as waiting."
  );
}

function buildPhase2IsolationItem(
  twoPanelSmokeProof: unknown,
  panelSessionState: CodexPanelSessionState | undefined,
  runtimeStreamIsolationProof: RuntimeStreamIsolationProof | undefined
): PhasePriorityEvidenceItem {
  const hasPanelSessionState = Boolean(panelSessionState);
  const safePanelSessionState = panelSessionState ?? {};
  const identityIssues = findCodexPanelSessionIdentityIssues(safePanelSessionState);
  const restoreProof = buildCodexPanelSessionRestoreProof(safePanelSessionState);

  if (identityIssues.length > 0) {
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "blocked",
      identityIssues[0].detail,
      "Start fresh panel sessions until live session and thread identities are unique."
    );
  }

  if (
    runtimeStreamIsolationProof &&
    (runtimeStreamIsolationProof.crossTalkDetected ||
      runtimeStreamIsolationProof.quarantinedEventCount > 0)
  ) {
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "blocked",
      runtimeStreamIsolationProof.detail,
      "Repair panel-keyed stream routing before trusting two-panel isolation proof."
    );
  }

  if (!isRecord(twoPanelSmokeProof)) {
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "waiting",
      "No two-panel smoke proof has been recorded.",
      "Run the two-panel desktop smoke and confirm no cross-talk."
    );
  }

  const executed = bool(twoPanelSmokeProof.executed);
  const crossTalkDetected = bool(twoPanelSmokeProof.crossTalkDetected);
  const panels = Array.isArray(twoPanelSmokeProof.panels) ? twoPanelSmokeProof.panels : [];
  const panelProofSummary = buildTwoPanelSmokeProofSummary(twoPanelSmokeProof, panels);
  const panelsReady = panels.length >= 2 && panels.every((panel) =>
    isRecord(panel) &&
    bool(panel.completed) &&
    bool(panel.expectedTokenSeen) &&
    !bool(panel.foreignTokenSeen)
  );
  const ready =
    executed &&
    bool(twoPanelSmokeProof.ok) &&
    Number(twoPanelSmokeProof.panelCount) >= 2 &&
    bool(twoPanelSmokeProof.distinctSessionIds) &&
    bool(twoPanelSmokeProof.distinctThreadIds) &&
    bool(twoPanelSmokeProof.bothCompleted) &&
    !crossTalkDetected &&
    panelsReady;

  if (ready) {
    if (hasPanelSessionState && restoreProof.freshPanelCount < 2) {
      return item(
        "phase-2-panel-isolation",
        "Phase 2 multi-panel isolation",
        "review",
        `${restoreProof.detail} Two-panel smoke is ready, but saved panel stack labels need reload proof.`,
        "Reload the app and confirm at least two fresh saved panel session labels restore before trusting Phase 2 persistence."
      );
    }

    const routeProofDetail = runtimeStreamIsolationProof
      ? ` ${runtimeStreamIsolationProof.detail}`
      : "";
    const restoreProofDetail = hasPanelSessionState
      ? ` ${restoreProof.detail}`
      : "";
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "ready",
      `Two live panels completed with distinct session/thread identities and no foreign token evidence. ${panelProofSummary}.${routeProofDetail}${restoreProofDetail}`,
      "Keep two-panel smoke as the isolation regression before worker dispatch work."
    );
  }

  if (!executed) {
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "waiting",
      "Two-panel isolation proof has not been executed in desktop mode yet.",
      "Run the two-panel smoke from the connection dialog."
    );
  }

  if (crossTalkDetected) {
    return item(
      "phase-2-panel-isolation",
      "Phase 2 multi-panel isolation",
      "blocked",
      "Two-panel proof detected cross-talk or foreign token evidence.",
      "Stop provider expansion and repair panel-keyed routing before rerunning isolation proof."
    );
  }

  return item(
    "phase-2-panel-isolation",
    "Phase 2 multi-panel isolation",
    "review",
    `Two-panel proof ran with ${panelProofSummary}, but completion, identity, or expected-token signals are incomplete.`,
    "Review panel proof details and rerun until both panels complete with distinct identities."
  );
}

function findTask(tasks: readonly ProjectManagementTask[], type: ProjectManagementTask["type"]): ProjectManagementTask | undefined {
  return tasks.find((task) => task.type === type && currentProjectManagementPhasePlanTaskIds.has(task.id));
}

function buildProjectManagementSavedStateProofSummary(tasks: readonly ProjectManagementTask[]): string {
  const seenCurrentPlanIds = new Set<string>();
  let duplicateCurrentRows = 0;
  let stagedCurrentRows = 0;
  let collapsedCurrentRows = 0;

  for (const task of tasks) {
    if (!currentProjectManagementPhasePlanTaskIds.has(task.id)) {
      continue;
    }

    if (seenCurrentPlanIds.has(task.id)) {
      duplicateCurrentRows += 1;
    } else {
      seenCurrentPlanIds.add(task.id);
    }

    if (task.runState === "staged") {
      stagedCurrentRows += 1;
    }

    if (task.collapsed) {
      collapsedCurrentRows += 1;
    }
  }

  return (
    `savedStateProof=currentPlanRows=${seenCurrentPlanIds.size}/${currentProjectManagementPhasePlanTaskIds.size} ` +
    `duplicateCurrentRows=${duplicateCurrentRows} stagedCurrentRows=${stagedCurrentRows} ` +
    `collapsedCurrentRows=${collapsedCurrentRows}`
  );
}

function buildPhase6PmBoardItem(
  tasks: readonly ProjectManagementTask[] | undefined,
  project: { id: string; name: string } | undefined
): PhasePriorityEvidenceItem {
  const requiredPhase6AcceptanceChildIds = [
    "phase-06-child-publish-hold-traceability",
    "phase-06-child-publish-hold-blocker-priority"
  ];
  const safeTasks = tasks ?? [];
  const epics = safeTasks.filter((task) => task.type === "epic");
  const parents = safeTasks.filter((task) => task.type === "parent");
  const children = safeTasks.filter((task) => task.type === "child");
  const missingPhaseIds = [...currentProjectManagementPhaseEpicIds].filter(
    (phaseId) => !safeTasks.some((task) => task.id === phaseId)
  );
  const missingPhase6AcceptanceChildIds = requiredPhase6AcceptanceChildIds.filter(
    (taskId) => !safeTasks.some((task) => task.id === taskId)
  );
  const proofProject = project ?? { id: "phase-board-proof", name: "Phase Board Proof" };
  const stageableEpic = findTask(safeTasks, "epic");
  const stageableParent = findTask(safeTasks, "parent");
  const stageableChild = findTask(safeTasks, "child");
  const dispatches = [
    stageableEpic ? buildProjectManagementArenaDispatch(safeTasks, stageableEpic.id, proofProject) : undefined,
    stageableParent ? buildProjectManagementArenaDispatch(safeTasks, stageableParent.id, proofProject) : undefined,
    stageableChild ? buildProjectManagementArenaDispatch(safeTasks, stageableChild.id, proofProject) : undefined
  ];
  const savedStateProof = buildProjectManagementSavedStateProofSummary(safeTasks);
  const allDispatchesStage = dispatches.every((dispatch) => dispatch?.dispatchPackage.status === "staged");
  const hasEnoughHierarchy = epics.length >= 12 && parents.length >= 24 && children.length >= 37;

  if (missingPhaseIds.length > 0) {
    return item(
      "phase-6-pm-board",
      "Phase 6 PM phase board",
      "review",
      `Project Management board is missing ${missingPhaseIds.length} phase Epic row${missingPhaseIds.length === 1 ? "" : "s"}. ${savedStateProof}`,
      "Repair saved PM state so Phase 0 through Phase 11 are present."
    );
  }

  if (missingPhase6AcceptanceChildIds.length > 0) {
    return item(
      "phase-6-pm-board",
      "Phase 6 PM phase board",
      "review",
      `Project Management board is missing Phase 6 acceptance child row${missingPhase6AcceptanceChildIds.length === 1 ? "" : "s"}: ${missingPhase6AcceptanceChildIds.join(", ")}. ${savedStateProof}`,
      "Restore Phase 6 publish-hold traceability and blocker-priority child rows before trusting PM board evidence."
    );
  }

  if (hasEnoughHierarchy && allDispatchesStage) {
    const phaseMapProof =
      `phaseRange=0-11 epics=${epics.length} parents=${parents.length} ` +
      `children=${children.length} staged=epic|parent|child`;

    return item(
      "phase-6-pm-board",
      "Phase 6 PM phase board",
      "ready",
      `Project Management board has ${epics.length} Epics, ${parents.length} Parents, ${children.length} Children, and staged Epic/Parent/Child package coverage. ${phaseMapProof} ${savedStateProof}`,
      "Use row-level Run buttons to stage Arena review packages while keeping execution locked."
    );
  }

  return item(
    "phase-6-pm-board",
    "Phase 6 PM phase board",
    "review",
    `Project Management board has ${epics.length} Epics, ${parents.length} Parents, and ${children.length} Children, but staging coverage is incomplete. ${savedStateProof}`,
    "Verify Epic, Parent, and Child rows can each produce staged Arena packages."
  );
}

export function buildPhasePriorityEvidence(input: PhasePriorityEvidenceInput = {}): PhasePriorityEvidenceResult {
  const items = [
    buildPhase1LivePanelItem(input.liveSmokeProof),
    buildPhase2IsolationItem(
      input.twoPanelSmokeProof,
      input.panelSessionState,
      input.runtimeStreamIsolationProof
    ),
    buildPhase6PmBoardItem(input.projectManagementTasks, input.project)
  ];
  const counts = countItems(items);
  const state = stateForItems(items);
  const readiness = Math.round(items.reduce((total, phaseItem) => total + phaseItem.readiness, 0) / items.length);

  return {
    state,
    readiness,
    statusLabel: STATUS_LABELS[state],
    detail: "Tracks the current Phase 1, Phase 2, and Phase 6 priority slice without running live actions automatically.",
    counts,
    items
  };
}
