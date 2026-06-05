import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Folder,
  GitBranch,
  Grid2X2,
  Link2,
  LayoutDashboard,
  Link2Off,
  MessageSquare,
  MoreHorizontal,
  PanelRight,
  Paperclip,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Terminal,
  UserRound,
  Workflow
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  cockpitPresets,
  orchestrationTasks,
  permissionSurfaces,
  planningDrafts,
  pipelineItems,
  projects,
  registryEntries,
  runtimeAdapters,
  type PermissionSurface,
  sessions,
  type PipelineItem,
  type ProjectSummary,
  type SessionState,
  type SessionSummary
} from "./fixtures";
import {
  defaultLayoutByMode,
  getDisplayGrid,
  getLayoutSpec,
  layoutAriaLabel,
  layoutOptions,
  maxVisibleCells,
  type CockpitMode,
  type LayoutId
} from "./layout";
import {
  buildHandoffBrief,
  nextHandoffTask,
  summarizeTasks,
  type OrchestrationTask
} from "./orchestration";
import {
  createOrchestrationDependencyReadiness,
  type OrchestrationDependencyReadiness
} from "./orchestrationDependencyReadiness";
import {
  createOrchestrationDispatchAudit,
  type OrchestrationDispatchAudit
} from "./orchestrationDispatchAudit";
import {
  createOrchestrationResultHandoffEvidence,
  type OrchestrationResultHandoffEvidence
} from "./orchestrationResultHandoffEvidence";
import {
  createOrchestrationAcceptanceCoverage,
  type OrchestrationAcceptanceCoverage
} from "./orchestrationAcceptanceCoverage";
import {
  buildPipelineItemDispatchPreview,
  type PipelineItemDispatchPreview
} from "./pipelineItemDispatchPreview";
import {
  tryBuildPipelineItemDispatchPackage
} from "./pipelineItemDispatchPackage";
import {
  buildPipelineItemRunLinks,
  type PipelineItemRunLink
} from "./pipelineItemRunLink";
import {
  summarizePipelineItemRunStatus,
  type PipelineItemRunStatusSummary
} from "./pipelineItemRunStatus";
import {
  appendPipelineDispatchRequestRecord,
  createPipelineDispatchRequestRecord,
  loadPipelineDispatchRequestHistory,
  savePipelineDispatchRequestHistory,
  type PipelineDispatchRequestAction,
  type PipelineDispatchRequestRecord
} from "./pipelineDispatchRequestHistory";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from "./preferences";
import {
  codexSessionStateToPanelMessages,
  createPanelReplyMessage,
  createPanelLiveErrorMessage,
  createPanelLiveStatusMessage,
  createPanelSlashCommandStatusMessage,
  getPanelSlashCommandDecision,
  getPanelSlashCommandSuggestions,
  loadPanelChatMessages,
  panelSlashCommands,
  savePanelChatMessages,
  type PanelChatMessage
} from "./panelChat";
import {
  normalizeCodexPanelTurnResultEvents,
  reduceCodexSessionEvents,
  type CodexPanelTurnResultPayload
} from "./codexSession";
import {
  buildCodexSessionControls
} from "./codexSessionControls";
import {
  loadPanelSessionState,
  savePanelSessionState,
  upsertPanelSession,
  type CodexPanelSessionState,
  type CodexPanelSessionStateRecord,
  type CodexPanelSessionStatus
} from "./codexPanelSessionState";
import {
  decideCodexTransport,
  getFallbackCodexLiveSmokeProof,
  getFallbackCodexTransportProbe,
  loadCodexLiveSmokeProof,
  loadCodexTransportProbe,
  type CodexLiveSmokeProof,
  type CodexTransportDecision,
  type CodexTransportProbe,
  type CodexTransportState
} from "./codexTransportSpike";
import {
  steerboardMilestoneStatuses,
  summarizeMilestoneStatuses,
  type MilestoneStatus,
  type MilestoneStatusSummary
} from "./milestoneStatus";
import {
  createMilestoneReportRowState
} from "./milestoneReportRowState";
import {
  createMilestoneReportNextDetail
} from "./milestoneReportNextDetail";
import {
  createCockpitPanelPriority,
  type CockpitPanelPriority
} from "./cockpitPanelPriority";
import {
  createCockpitPanelFocusTarget,
  type CockpitPanelFocusTarget
} from "./cockpitPanelFocus";
import {
  createCockpitPanelFocusControls
} from "./cockpitPanelFocusControls";
import {
  createCockpitFocusedPanelStatus,
  type CockpitFocusedPanelStatus
} from "./cockpitFocusedPanelStatus";
import {
  createCockpitToolbarFocusAction
} from "./cockpitToolbarFocusAction";
import {
  createCockpitInteractionReadiness,
  type CockpitInteractionReadiness
} from "./cockpitInteractionReadiness";
import {
  createCockpitAcceptancePass,
  type CockpitAcceptancePass
} from "./cockpitAcceptancePass";
import {
  canDeployPlanningDraft,
  evaluatePlanningReadiness,
  normalizePlanningDraft,
  type PlanningDraft,
  type PlanningDraftRequiredField
} from "./planning";
import {
  loadPlanningDrafts,
  savePlanningDrafts
} from "./planningStorage";
import {
  dispatchableRegistryEntries,
  summarizeRegistry,
  type RegistryEntry
} from "./registry";
import {
  canRunWithAdapter,
  runtimeStateLabel,
  summarizeRuntimeAdapters,
  type RuntimeAdapter
} from "./runtime";
import {
  createBlankRuntimeProfile,
  evaluateRuntimeProfileReadiness,
  type RuntimeTransport,
  type RuntimeProfile,
  type RuntimeProfileReadiness,
  type RuntimeWorkspaceMode
} from "./runtimeProfile";
import {
  runtimeProfiles,
  selectRuntimeProfileForAdapter,
  summarizeRuntimeProfiles
} from "./runtimeProfileCatalog";
import {
  loadRuntimeProfileDraft,
  saveRuntimeProfileDraft
} from "./runtimeProfileDraftStorage";
import {
  buildRuntimeProfileApprovalSnapshot,
  type RuntimeProfileApprovalIntent,
  type RuntimeProfileApprovalSnapshot
} from "./runtimeProfileApproval";
import {
  appendRuntimeProfileApprovalRecord,
  createRuntimeProfileApprovalRecord,
  loadRuntimeProfileApprovalHistory,
  saveRuntimeProfileApprovalHistory,
  type RuntimeProfileApprovalRecord,
  type RuntimeProfileApprovalRecordAction
} from "./runtimeProfileApprovalHistory";
import {
  buildRuntimeProfileActivationSnapshot,
  canActivateRuntimeProfile,
  createRuntimeProfileActivationRecord,
  loadRuntimeProfileActivation,
  saveRuntimeProfileActivation,
  type RuntimeProfileActivationSnapshot
} from "./runtimeProfileActivation";
import {
  buildRuntimeProfilePermissionHandoffSnapshot,
  type RuntimeProfilePermissionHandoffSnapshot
} from "./runtimeProfilePermissionHandoff";
import {
  appendRuntimeProfilePermissionRequestRecord,
  createRuntimeProfilePermissionRequestRecord,
  loadRuntimeProfilePermissionRequestHistory,
  saveRuntimeProfilePermissionRequestHistory,
  type RuntimeProfilePermissionRequestAction,
  type RuntimeProfilePermissionRequestRecord
} from "./runtimeProfilePermissionRequestHistory";
import {
  buildRuntimeProfilePermissionApprovalSnapshot,
  type RuntimeProfilePermissionApprovalSnapshot
} from "./runtimeProfilePermissionApproval";
import {
  buildRuntimeProfilePermissionAuditSnapshot,
  type RuntimeProfilePermissionAuditSnapshot
} from "./runtimeProfilePermissionAudit";
import {
  createSecurityPrivacyThreatModel,
  type SecurityPrivacyThreatModel
} from "./securityPrivacyThreatModel";
import {
  createReleasePrivacyReadiness,
  type ReleasePrivacyReadinessItemStatus,
  type ReleasePrivacyReadinessSnapshot
} from "./releasePrivacyReadiness";
import {
  createSecurityAcceptanceCoverage,
  type SecurityAcceptanceCoverageSnapshot
} from "./securityAcceptanceCoverage";
import {
  createSecurityAcceptanceRepeatedRuns,
  type SecurityAcceptanceRepeatedRunsSnapshot
} from "./securityAcceptanceRepeatedRuns";
import {
  createSecurityFinalReview,
  type SecurityFinalReviewSnapshot
} from "./securityFinalReview";
import {
  renderDispatchPackageMarkdown,
  tryBuildDispatchPackage,
  type DispatchPackage
} from "./dispatch";
import {
  createMockRunFromDispatchPackage,
  runToOrchestrationTasks,
  runToSessionSummaries,
  type MockRunStatus,
  type MockOrchestratorRun
} from "./run";
import {
  filterRunsByProject,
  selectRunById,
  summarizeRunHistory,
  upsertRunHistory
} from "./runHistory";
import {
  loadRunHistory,
  saveRunHistory
} from "./runHistoryStorage";
import {
  transitionMockRunStatus,
  type RunLifecycleStatus
} from "./runLifecycle";
import {
  buildRunTimeline,
  summarizeRunTimeline,
  type RunTimelineEvent
} from "./runEvents";
import {
  buildAdapterContract,
  summarizeAdapterContract,
  type AdapterContractItem
} from "./adapterContract";
import {
  buildRuntimeIngestionPreview,
  summarizeRuntimeIngestion,
  type RuntimeIngestionEvent
} from "./runtimeIngestion";
import {
  buildRuntimeStreamSnapshot,
  nextRuntimeStreamPosition,
  type RuntimeStreamPlaybackState,
  type RuntimeStreamSnapshot
} from "./runtimeStream";
import {
  buildCockpitMonitorSummary,
  type CockpitMonitorSummary
} from "./cockpitMonitorSummary";
import {
  buildCockpitMonitorEventFeed,
  type CockpitMonitorEventFeedItem
} from "./cockpitMonitorEventFeed";
import {
  buildCockpitMonitorNextEventPreview,
  type CockpitMonitorNextEventPreview
} from "./cockpitMonitorNextEvent";
import {
  createCockpitMonitorHealth,
  type CockpitMonitorHealth
} from "./cockpitMonitorHealth";
import {
  createCockpitMonitorAttention,
  type CockpitMonitorAttention
} from "./cockpitMonitorAttention";
import {
  createCockpitMonitorQuality,
  type CockpitMonitorQuality
} from "./cockpitMonitorQuality";
import {
  createCockpitMonitorLoop,
  type CockpitMonitorLoop
} from "./cockpitMonitorLoop";
import {
  createCockpitMonitorDepth,
  type CockpitMonitorDepth
} from "./cockpitMonitorDepth";
import {
  createCockpitModeHandoff,
  type CockpitModeHandoff
} from "./cockpitModeHandoff";
import {
  createCockpitModeHandoffQa,
  type CockpitModeHandoffQa
} from "./cockpitModeHandoffQa";
import {
  createCockpitPanelRoster,
  type CockpitPanelRoster
} from "./cockpitPanelRoster";
import {
  createCockpitPanelOverflow,
  type CockpitPanelOverflow
} from "./cockpitPanelOverflow";
import {
  createCockpitLayoutCapacity,
  type CockpitLayoutCapacity
} from "./cockpitLayoutCapacity";
import {
  createCockpitPanelIdentity,
  type CockpitPanelIdentity
} from "./cockpitPanelIdentity";
import {
  createCockpitPanelFileScope,
  type CockpitPanelFileScope
} from "./cockpitPanelFileScope";
import {
  createCockpitPanelAttempt,
  type CockpitPanelAttempt
} from "./cockpitPanelAttempt";
import {
  createCockpitPanelValidation,
  type CockpitPanelValidation
} from "./cockpitPanelValidation";
import {
  createCockpitPanelBranch,
  type CockpitPanelBranch
} from "./cockpitPanelBranch";
import {
  createCockpitPanelRuntime,
  type CockpitPanelRuntime
} from "./cockpitPanelRuntime";
import {
  createCockpitPanelActivity,
  type CockpitPanelActivity
} from "./cockpitPanelActivity";
import {
  createCockpitPanelToolCoverage,
  type CockpitPanelToolCoverage
} from "./cockpitPanelToolCoverage";
import {
  buildCockpitMonitorControlState,
  type CockpitMonitorControlState
} from "./cockpitMonitorControls";
import {
  buildRuntimeAdapterSessionSnapshot,
  type RuntimeAdapterSessionSnapshot
} from "./runtimeAdapterSession";
import {
  createRuntimeCoreEntryValidation,
  type RuntimeCoreEntryValidation
} from "./runtimeCoreEntryValidation";
import {
  buildRuntimeEventSourceSnapshot,
  type RuntimeEventSourceSnapshot
} from "./runtimeEventSource";
import {
  buildRuntimeSourceConnectionSnapshot,
  type RuntimeSourceConnectionSnapshot
} from "./runtimeSourceConnection";
import {
  buildRuntimeAdapterBridgeSnapshot,
  type RuntimeAdapterBridgeIntent,
  type RuntimeAdapterBridgeSnapshot
} from "./runtimeAdapterBridge";
import {
  buildRuntimeLaunchRequestSnapshot,
  type RuntimeLaunchRequestSnapshot
} from "./runtimeLaunchRequest";
import {
  buildRuntimeLaunchApprovalSnapshot,
  type RuntimeLaunchApprovalIntent,
  type RuntimeLaunchApprovalSnapshot
} from "./runtimeLaunchApproval";
import {
  createRuntimeLaunchHandoffAcceptance,
  type RuntimeLaunchHandoffAcceptance
} from "./runtimeLaunchHandoffAcceptance";
import {
  createRuntimeRecoveryFailureCoverage,
  type RuntimeRecoveryFailureCoverage
} from "./runtimeRecoveryFailureCoverage";
import {
  buildRuntimeExecutionAuditSnapshot,
  type RuntimeExecutionAuditItem,
  type RuntimeExecutionAuditSnapshot
} from "./runtimeExecutionAudit";
import {
  appendRuntimeExecutionAuditRecord,
  createRuntimeExecutionAuditRecord,
  loadRuntimeExecutionAuditHistory,
  saveRuntimeExecutionAuditHistory,
  type RuntimeExecutionAuditRecord,
  type RuntimeExecutionAuditRecordAction
} from "./runtimeExecutionAuditHistory";
import {
  getFallbackDesktopRuntimeBridgeStatus,
  loadDesktopRuntimeBridgeStatus,
  type DesktopRuntimeBridgeStatus
} from "./desktopRuntimeBridge";
import {
  getFallbackDesktopPermissionApprovalStatus,
  loadDesktopPermissionApprovalStatus,
  type DesktopPermissionApprovalStatus
} from "./desktopPermissionApproval";
import {
  buildDesktopPackagingReadinessSnapshot,
  type DesktopPackagingReadinessSnapshot
} from "./desktopPackagingReadiness";
import {
  buildLocalEvidenceReadinessSnapshot,
  type LocalEvidenceReadinessSnapshot
} from "./localEvidenceReadiness";
import {
  buildToolEvidenceReadinessSnapshot,
  type ToolEvidenceReadinessSnapshot
} from "./toolEvidenceReadiness";
import {
  appendToolEvidenceCaptureRecord,
  createToolEvidenceCaptureRecord,
  loadToolEvidenceCaptureHistory,
  saveToolEvidenceCaptureHistory,
  type ToolEvidenceCaptureRecord,
  type ToolEvidenceCaptureRecordAction
} from "./toolEvidenceCaptureHistory";

const modeLabels: Record<CockpitMode, string> = {
  focus: "Focus",
  orchestrator: "Orchestrator",
  monitor: "Monitor"
};

const stateIcon: Record<SessionState, ReactNode> = {
  idle: <CircleDot size={14} />,
  planning: <Workflow size={14} />,
  implementing: <Activity size={14} />,
  validating: <ShieldCheck size={14} />,
  blocked: <AlertTriangle size={14} />,
  failed: <AlertTriangle size={14} />,
  complete: <CheckCircle2 size={14} />
};

const missingFieldLabels: Record<PlanningDraftRequiredField, string> = {
  title: "Title",
  objective: "Objective",
  targetProjectId: "Project",
  scope: "Scope",
  acceptanceCriteria: "Acceptance",
  validationPlan: "Validation",
  rollbackNote: "Rollback"
};

const runLifecycleActions: Array<{
  icon: ReactNode;
  label: string;
  status: RunLifecycleStatus;
}> = [
  { icon: <RotateCcw size={14} />, label: "Queue", status: "queued" },
  { icon: <Play size={14} />, label: "Start", status: "running" },
  { icon: <CheckCircle2 size={14} />, label: "Complete", status: "complete" },
  { icon: <AlertTriangle size={14} />, label: "Block", status: "blocked" },
  { icon: <AlertTriangle size={14} />, label: "Fail", status: "failed" }
];

const streamStateLabels: Record<RuntimeStreamPlaybackState, string> = {
  idle: "Idle",
  streaming: "Streaming",
  paused: "Paused",
  complete: "Complete",
  blocked: "Blocked"
};

const streamIntervalMs = 1100;
const runtimeTransportOptions: RuntimeTransport[] = ["local-process", "remote-endpoint", "mock"];
const runtimeWorkspaceModeOptions: RuntimeWorkspaceMode[] = ["read-only", "read-write", "isolated"];
type ToolEvidenceCaptureIntent = "idle" | "requested";
type RuntimeProfilePermissionRequestIntent = "idle" | "requested";
type PipelineDispatchRequestIntent = "idle" | "requested";
type AppMenuId = "file" | "view" | "connect" | "help";
type AppDialog = "migration" | "connection" | "slash-help";

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function parseRuntimeProfileList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatRuntimeProfileList(values: string[]): string {
  return values.join(", ");
}

function latestPermissionRequestIntent(
  records: RuntimeProfilePermissionRequestRecord[]
): RuntimeProfilePermissionRequestIntent {
  return records[0]?.action === "requested" ? "requested" : "idle";
}

function latestPipelineDispatchRequestIntent(
  records: PipelineDispatchRequestRecord[],
  itemId?: string
): PipelineDispatchRequestIntent {
  if (!itemId) {
    return "idle";
  }

  const record = records.find((entry) => entry.itemId === itemId);
  return record?.action === "requested" ? "requested" : "idle";
}

function formatTimestamp(value: string): string {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return timestamp.toLocaleString([], {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  });
}

function codexNotice(decision: CodexTransportDecision): string {
  if (decision.state === "live") {
    return "Codex live transport enabled";
  }

  if (decision.preferredTransport === "app-server-stdio") {
    return "Codex stdio transport ready";
  }

  if (decision.preferredTransport === "exec-json") {
    return "Codex one-shot fallback available";
  }

  if (decision.canDetectRuntime) {
    return "Codex detected, transport pending";
  }

  return "Local preview mode";
}

function transportStatusLabel(state: CodexTransportState): string {
  switch (state) {
    case "live":
      return "Live";
    case "ready":
      return "Ready";
    case "preview":
      return "Preview";
    case "blocked":
      return "Blocked";
    case "unavailable":
      return "Unavailable";
  }
}

type LivePanelChatStatus =
  | "preview"
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "interrupted"
  | "failed";

interface CodexPanelSessionStartPayload {
  source: string;
  panelId: string;
  sessionId: string;
  threadId: string;
  started: boolean;
  detail: string;
}

interface CodexPanelInterruptResultPayload {
  source: string;
  panelId: string | null;
  sessionId: string | null;
  threadId: string | null;
  turnId: string | null;
  interrupted: boolean;
  detail: string;
}

interface CodexPanelSteerResultPayload {
  source: string;
  panelId: string | null;
  sessionId: string | null;
  threadId: string | null;
  turnId: string | null;
  steered: boolean;
  detail: string;
}

function hasDesktopRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeDesktopCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export function App() {
  const validProjectIds = useMemo(() => projects.map((item) => item.id), []);
  const defaultPlanningDrafts = useMemo(
    () => planningDrafts.map((draft) => normalizePlanningDraft(draft)),
    []
  );
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() =>
    loadWorkspacePreferences(validProjectIds)
  );
  const [drafts, setDrafts] = useState<PlanningDraft[]>(() => loadPlanningDrafts(defaultPlanningDrafts));
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const [mockRuns, setMockRuns] = useState<MockOrchestratorRun[]>(() => loadRunHistory());
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [focusedPanelId, setFocusedPanelId] = useState<string>();
  const [activeAppMenu, setActiveAppMenu] = useState<AppMenuId>();
  const [appDialog, setAppDialog] = useState<AppDialog>();
  const [codexConnectionRequested, setCodexConnectionRequested] = useState(false);
  const [appNotice, setAppNotice] = useState("Local preview mode");
  const [codexTransportProbe, setCodexTransportProbe] = useState<CodexTransportProbe>(() =>
    getFallbackCodexTransportProbe()
  );
  const [codexLiveSmokeProof, setCodexLiveSmokeProof] = useState<CodexLiveSmokeProof>(() =>
    getFallbackCodexLiveSmokeProof()
  );
  const [codexTransportLoading, setCodexTransportLoading] = useState(false);
  const [codexLiveSmokeLoading, setCodexLiveSmokeLoading] = useState(false);
  const [panelSessionState, setPanelSessionState] = useState<CodexPanelSessionState>(() =>
    loadPanelSessionState()
  );
  const { selectedProjectId, mode, layoutId, view } = preferences;
  const codexTransportDecision = useMemo(
    () => decideCodexTransport(codexTransportProbe, codexLiveSmokeProof),
    [codexLiveSmokeProof, codexTransportProbe]
  );

  useEffect(() => {
    saveWorkspacePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    refreshCodexTransportProbe();
  }, []);

  useEffect(() => {
    savePlanningDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveRunHistory(mockRuns);
  }, [mockRuns]);

  useEffect(() => {
    savePanelSessionState(panelSessionState);
  }, [panelSessionState]);

  const preset = cockpitPresets.find((entry) => entry.mode === mode) ?? cockpitPresets[0];
  const layout = getLayoutSpec(layoutId);
  const registryByProject = useMemo(
    () => new Map(registryEntries.map((entry) => [entry.projectId, entry])),
    []
  );
  const projectLabelById = useMemo(
    () => new Map(projects.map((entry) => [entry.id, entry.name])),
    []
  );
  const runtimeByProject = useMemo(
    () => new Map(runtimeAdapters.map((adapter) => [adapter.id, adapter])),
    []
  );

  const basePresetSessions = useMemo(() => {
    return preset.sessionIds
      .map((sessionId) => sessions.find((session) => session.id === sessionId))
      .filter((session): session is SessionSummary => Boolean(session));
  }, [preset.sessionIds]);

  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const registryEntry = registryByProject.get(project.id);
  const runtimeAdapter = runtimeByProject.get(project.id);
  const registrySummary = summarizeRegistry(registryEntries);
  const runtimeSummary = summarizeRuntimeAdapters(runtimeAdapters);
  const runtimeProfileSummary = summarizeRuntimeProfiles(runtimeProfiles);
  const projectMockRuns = useMemo(
    () => filterRunsByProject(mockRuns, project.id),
    [mockRuns, project.id]
  );
  const selectedRun = useMemo(() => {
    if (selectedRunId) {
      return selectRunById(projectMockRuns, selectedRunId) ?? projectMockRuns[0];
    }

    return projectMockRuns[0];
  }, [projectMockRuns, selectedRunId]);
  const projectMockSessions = useMemo(
    () => projectMockRuns.flatMap((run) => runToSessionSummaries(run) as SessionSummary[]),
    [projectMockRuns]
  );
  const projectMockTasks = useMemo(
    () => projectMockRuns.flatMap((run) => runToOrchestrationTasks(run)),
    [projectMockRuns]
  );
  const projectPipelineItems = useMemo(
    () => pipelineItems.filter((item) => item.projectId === project.id),
    [project.id]
  );
  const projectTasks = useMemo(
    () => [
      ...projectMockTasks,
      ...orchestrationTasks.filter((task) => task.projectId === project.id)
    ],
    [project.id, projectMockTasks]
  );
  const cockpitSessions = useMemo(
    () => [...projectMockSessions, ...basePresetSessions],
    [basePresetSessions, projectMockSessions]
  );
  const maxVisibleSessions = maxVisibleCells(layoutId);
  const visibleSessions = useMemo(
    () => cockpitSessions.slice(0, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions]
  );
  const displayGrid = useMemo(
    () => getDisplayGrid(layout, visibleSessions.length),
    [layout, visibleSessions.length]
  );
  useEffect(() => {
    setFocusedPanelId((currentPanelId) =>
      currentPanelId && visibleSessions.some((session) => session.id === currentPanelId)
        ? currentPanelId
        : undefined
    );
  }, [visibleSessions]);
  const cockpitPanelRoster = useMemo(
    () => createCockpitPanelRoster(cockpitSessions, visibleSessions.length, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions, visibleSessions.length]
  );
  const cockpitPanelOverflow = useMemo(
    () => createCockpitPanelOverflow(cockpitSessions, visibleSessions.length, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions, visibleSessions.length]
  );
  const cockpitLayoutCapacity = useMemo(
    () => createCockpitLayoutCapacity(layout, cockpitSessions.length, visibleSessions.length),
    [cockpitSessions.length, layout, visibleSessions.length]
  );
  const cockpitToolbarPanelPriority = useMemo(
    () => createCockpitPanelPriority(visibleSessions),
    [visibleSessions]
  );
  const cockpitToolbarFocusTarget = useMemo(
    () => createCockpitPanelFocusTarget(visibleSessions, cockpitToolbarPanelPriority, focusedPanelId),
    [cockpitToolbarPanelPriority, focusedPanelId, visibleSessions]
  );
  const cockpitFocusedPanelStatus = useMemo(
    () => createCockpitFocusedPanelStatus(visibleSessions, focusedPanelId),
    [focusedPanelId, visibleSessions]
  );
  const cockpitModeHandoff = useMemo(
    () =>
      createCockpitModeHandoff(
        mode,
        layout,
        visibleSessions.length,
        cockpitSessions.length
      ),
    [cockpitSessions.length, layout, mode, visibleSessions.length]
  );
  const cockpitModeHandoffQa = useMemo(
    () =>
      createCockpitModeHandoffQa(
        cockpitModeHandoff,
        cockpitLayoutCapacity,
        cockpitFocusedPanelStatus,
        cockpitPanelOverflow
      ),
    [cockpitFocusedPanelStatus, cockpitLayoutCapacity, cockpitModeHandoff, cockpitPanelOverflow]
  );
  const activeDraftIndex = Math.min(selectedDraftIndex, Math.max(drafts.length - 1, 0));
  const viewLabel = view === "cockpit" ? "Cockpit" : view === "pipeline" ? "Pipeline" : "Planning";

  function updatePreferences(nextPreferences: Partial<WorkspacePreferences>) {
    setPreferences((current) => ({
      ...current,
      ...nextPreferences
    }));
  }

  function handleModeChange(nextMode: CockpitMode) {
    updatePreferences({
      mode: nextMode,
      layoutId: defaultLayoutByMode[nextMode],
      view: "cockpit"
    });
  }

  function handleDraftUpdate(nextDraft: PlanningDraft) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft, index) => (index === activeDraftIndex ? nextDraft : draft))
    );
  }

  function handleAddDraft() {
    const nextDraft = normalizePlanningDraft({
      targetProjectId: project.id,
      risk: "medium",
      deployMode: "dry-run"
    });

    setDrafts((currentDrafts) => [...currentDrafts, nextDraft]);
    setSelectedDraftIndex(drafts.length);
    updatePreferences({ view: "planning" });
  }

  function handleStagePackage(dispatchPackage: DispatchPackage) {
    const nextRun = createMockRunFromDispatchPackage(dispatchPackage, {
      createdAt: new Date().toISOString(),
      idSeed: "steerboard-run"
    });

    setSelectedRunId(nextRun.id);
    setMockRuns((currentRuns) => upsertRunHistory(currentRuns, nextRun));
    updatePreferences({ view: "cockpit" });
  }

  function handleRunStatusChange(runId: string, nextStatus: MockRunStatus) {
    setSelectedRunId(runId);
    setMockRuns((currentRuns) =>
      currentRuns.map((run) => (run.id === runId ? transitionMockRunStatus(run, nextStatus) : run))
    );
    updatePreferences({ view: "cockpit" });
  }

  function toggleAppMenu(menuId: AppMenuId) {
    setActiveAppMenu((currentMenu) => (currentMenu === menuId ? undefined : menuId));
  }

  function openAppDialog(nextDialog: AppDialog) {
    setAppDialog(nextDialog);
    setActiveAppMenu(undefined);
  }

  function handleViewMenuAction(nextView: WorkspacePreferences["view"]) {
    updatePreferences({ view: nextView });
    setActiveAppMenu(undefined);
  }

  function handleAdaptiveViewAction() {
    updatePreferences({ layoutId: "adaptive", view: "cockpit" });
    setActiveAppMenu(undefined);
  }

  function handleStageCodexConnection() {
    setCodexConnectionRequested(true);
    setAppNotice(
      codexTransportDecision.preferredTransport === "app-server-stdio"
        ? "Codex stdio bridge staged"
        : "Codex connection request staged locally"
    );
  }

  async function refreshCodexTransportProbe() {
    setCodexTransportLoading(true);
    const nextProbe = await loadCodexTransportProbe();
    const nextDecision = decideCodexTransport(nextProbe, codexLiveSmokeProof);

    setCodexTransportProbe(nextProbe);
    setCodexTransportLoading(false);
    setAppNotice(codexNotice(nextDecision));
  }

  async function runCodexLiveSmokeProof() {
    setCodexLiveSmokeLoading(true);
    const nextProof = await loadCodexLiveSmokeProof();
    const nextDecision = decideCodexTransport(codexTransportProbe, nextProof);

    setCodexLiveSmokeProof(nextProof);
    setCodexLiveSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(nextProof.ok ? "Codex send/stream smoke passed" : "Codex live smoke did not pass");
    if (nextDecision.state === "live") {
      setAppNotice(codexNotice(nextDecision));
    }
  }

  function recordLivePanelSessionStart(result: CodexPanelSessionStartPayload) {
    setPanelSessionState((currentState) =>
      upsertPanelSession(
        currentState,
        result.panelId,
        {
          provider: "codex",
          sessionId: result.sessionId,
          threadId: result.threadId,
          status: "active",
          stale: false,
          detail: result.detail
        }
      )
    );
  }

  function recordLivePanelSessionStatus(
    panelId: string,
    status: CodexPanelSessionStatus,
    detail: string
  ) {
    setPanelSessionState((currentState) =>
      upsertPanelSession(
        currentState,
        panelId,
        {
          status,
          detail,
          stale: false
        }
      )
    );
  }

  return (
    <main className="app-shell">
      <AppMenuBar
        activeMenu={activeAppMenu}
        appNotice={appNotice}
        codexConnectionRequested={codexConnectionRequested}
        currentView={view}
        onAdaptiveView={handleAdaptiveViewAction}
        onAddDraft={handleAddDraft}
        onOpenDialog={openAppDialog}
        onSwitchView={handleViewMenuAction}
        onToggleMenu={toggleAppMenu}
      />
      <aside className="sidebar" aria-label="Steerboard navigation">
        <nav className="sidebar-command-list" aria-label="Primary actions">
          <button type="button">
            <Plus size={16} />
            <span>New chat</span>
          </button>
          <button type="button">
            <Search size={16} />
            <span>Search</span>
          </button>
          <button type="button">
            <Grid2X2 size={16} />
            <span>Plugins</span>
          </button>
          <button type="button">
            <CircleDot size={16} />
            <span>Automations</span>
          </button>
        </nav>

        <nav className="project-list codex-sidebar-list" aria-label="Pinned chats and projects">
          <span className="sidebar-section-label">Pinned</span>
          <div className="sidebar-workspace-group">
            <div className="sidebar-workspace-heading">
              <span>STEERBOARD</span>
              <small>now</small>
            </div>
            <button
              className="project-folder-button"
              onClick={() => updatePreferences({ selectedProjectId: projects[0].id, view: "cockpit" })}
              type="button"
            >
              <Folder size={16} />
              <span>Steerboard</span>
            </button>
            {projects.slice(0, 3).map((item) => (
              <button
                className={classNames("project-button", selectedProjectId === item.id && "is-selected")}
                key={item.id}
                onClick={() => updatePreferences({ selectedProjectId: item.id, view: "cockpit" })}
                type="button"
              >
                <span className={classNames("project-status", `is-${item.status}`)} />
                <span className="project-copy">
                  <span>{item.name}</span>
                </span>
                <span className="project-time">{item.updated}</span>
              </button>
            ))}
          </div>

          <span className="sidebar-section-label">Projects</span>
          {projects.slice(3).map((item) => (
            <button
              className={classNames("project-button", selectedProjectId === item.id && "is-selected")}
              key={item.id}
              onClick={() => updatePreferences({ selectedProjectId: item.id, view: "cockpit" })}
              type="button"
            >
              <span className={classNames("project-status", `is-${item.status}`)} />
              <span className="project-copy">
                <span>{item.name}</span>
                <small>{registryByProject.get(item.id)?.workspaceLabel ?? `${item.runs} runs`}</small>
              </span>
              <span className="project-time">{item.updated}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button aria-label="Open settings" title="Settings" type="button">
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <button aria-label="Open local terminal" title="Terminal" type="button">
            <Terminal size={18} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="title-block">
            <span className="eyebrow">{project.name}</span>
            <h2>{preset.label}</h2>
          </div>

          <div className="topbar-controls">
            {runtimeAdapter ? (
              <span className={classNames("runtime-pill", `runtime-${runtimeAdapter.state}`)}>
                {runtimeStateLabel(runtimeAdapter.state)}
              </span>
            ) : null}

            <div className="segmented" aria-label="Cockpit mode">
              {cockpitPresets.map((entry) => (
                <button
                  className={classNames(entry.mode === mode && "is-active")}
                  key={entry.mode}
                  onClick={() => handleModeChange(entry.mode)}
                  type="button"
                >
                  {modeLabels[entry.mode]}
                </button>
              ))}
            </div>

            <div className="segmented compact" aria-label="Primary view">
              <button
                className={classNames(view === "cockpit" && "is-active")}
                onClick={() => updatePreferences({ view: "cockpit" })}
                type="button"
              >
                <LayoutDashboard size={15} />
                Cockpit
              </button>
              <button
                className={classNames(view === "pipeline" && "is-active")}
                onClick={() => updatePreferences({ view: "pipeline" })}
                type="button"
              >
                <ClipboardList size={15} />
                Pipeline
              </button>
              <button
                className={classNames(view === "planning" && "is-active")}
                onClick={() => updatePreferences({ view: "planning" })}
                type="button"
              >
                <Workflow size={15} />
                Planning
              </button>
            </div>
          </div>
        </header>

        <div className="content-split">
          <section className="main-surface" aria-label={viewLabel}>
            {view === "cockpit" ? (
              <>
                <div className="surface-toolbar">
                  <label className={classNames("layout-select", layout.kind === "adaptive" && "is-adaptive")}>
                    <span>Layout</span>
                    <select
                      aria-label="Select cockpit layout"
                      onChange={(event) => updatePreferences({ layoutId: event.target.value as LayoutId })}
                      title={layoutAriaLabel(layout)}
                      value={layoutId}
                    >
                      {layoutOptions.map((option) => (
                        <option key={option.id} title={option.description} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="toolbar-status">
                    <LayoutCapacitySignal capacity={cockpitLayoutCapacity} />
                    <FocusedPanelStatusChip
                      focusTarget={cockpitToolbarFocusTarget}
                      onClearFocus={() => setFocusedPanelId(undefined)}
                      onFocus={() => {
                        if (cockpitToolbarFocusTarget.canFocus) {
                          setFocusedPanelId(cockpitToolbarFocusTarget.panelId);
                        }
                      }}
                      status={cockpitFocusedPanelStatus}
                    />
                    <PanelRosterSignal roster={cockpitPanelRoster} />
                    <PanelOverflowSignal overflow={cockpitPanelOverflow} />
                    <div className="run-chip">
                      <Play size={14} />
                      {visibleSessions.length} visible
                    </div>
                  </div>
                </div>

                <div
                  className={classNames("cockpit-grid", layout.kind === "adaptive" && "cockpit-grid-adaptive")}
                  style={{
                    gridTemplateColumns: `repeat(${displayGrid.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${displayGrid.rows}, minmax(190px, 1fr))`
                  }}
                >
                  {visibleSessions.map((session) => (
                    <SessionCell
                      isFocused={session.id === focusedPanelId}
                      key={session.id}
                      liveCodexEnabled={codexTransportDecision.canStartSession}
                      onPanelSessionStart={recordLivePanelSessionStart}
                      onPanelSessionStatus={recordLivePanelSessionStatus}
                      panelSessionRecord={panelSessionState[session.id]}
                      projectLabel={
                        projectLabelById.get(session.projectId) ??
                        registryByProject.get(session.projectId)?.workspaceLabel ??
                        session.projectId
                      }
                      session={session}
                    />
                  ))}
                </div>
              </>
            ) : view === "pipeline" ? (
              <PipelineView
                items={projectPipelineItems}
                mockRuns={projectMockRuns}
                onOpenRun={(runId) => {
                  setSelectedRunId(runId);
                  updatePreferences({ view: "cockpit" });
                }}
                onStagePackage={handleStagePackage}
                project={project}
                registryEntry={registryEntry}
                runtimeAdapter={runtimeAdapter}
                tasks={projectTasks}
              />
            ) : (
              <PlanningView
                activeIndex={activeDraftIndex}
                drafts={drafts}
                onAddDraft={handleAddDraft}
                onSelectDraft={setSelectedDraftIndex}
                onStagePackage={handleStagePackage}
                onUpdateDraft={handleDraftUpdate}
                projects={projects}
              />
            )}
          </section>

          <RightPanel
            layoutCapacity={cockpitLayoutCapacity}
            mode={mode}
            modeHandoff={cockpitModeHandoff}
            modeHandoffQa={cockpitModeHandoffQa}
            mockRuns={projectMockRuns}
            onSelectRun={setSelectedRunId}
            onUpdateRunStatus={handleRunStatusChange}
            project={project}
            registryEntry={registryEntry}
            registrySummary={registrySummary}
            runtimeAdapter={runtimeAdapter}
            runtimeProfileSummary={runtimeProfileSummary}
            runtimeSummary={runtimeSummary}
            selectedRun={selectedRun}
            focusedPanelId={focusedPanelId}
            onFocusPanel={setFocusedPanelId}
            sessions={visibleSessions}
            tasks={projectTasks}
          />
        </div>
      </section>
      {appDialog ? (
        <AppDialogSurface
          codexConnectionRequested={codexConnectionRequested}
          codexLiveSmokeLoading={codexLiveSmokeLoading}
          codexLiveSmokeProof={codexLiveSmokeProof}
          codexTransportDecision={codexTransportDecision}
          codexTransportLoading={codexTransportLoading}
          dialog={appDialog}
          onClose={() => setAppDialog(undefined)}
          onRefreshCodexTransport={refreshCodexTransportProbe}
          onRunCodexLiveSmokeProof={runCodexLiveSmokeProof}
          onStageCodexConnection={handleStageCodexConnection}
        />
      ) : null}
    </main>
  );
}

function AppMenuBar({
  activeMenu,
  appNotice,
  codexConnectionRequested,
  currentView,
  onAdaptiveView,
  onAddDraft,
  onOpenDialog,
  onSwitchView,
  onToggleMenu
}: {
  activeMenu?: AppMenuId;
  appNotice: string;
  codexConnectionRequested: boolean;
  currentView: WorkspacePreferences["view"];
  onAdaptiveView: () => void;
  onAddDraft: () => void;
  onOpenDialog: (dialog: AppDialog) => void;
  onSwitchView: (view: WorkspacePreferences["view"]) => void;
  onToggleMenu: (menuId: AppMenuId) => void;
}) {
  return (
    <header className="app-menu-bar" aria-label="Application menu">
      <div className="app-menu-left">
        <strong className="app-menu-brand">Steerboard</strong>
        <div className="app-menu-items" role="menubar" aria-label="Steerboard menus">
          {(["file", "view", "connect", "help"] as AppMenuId[]).map((menuId) => (
            <div className="app-menu-item" key={menuId}>
              <button
                aria-expanded={activeMenu === menuId}
                aria-haspopup="menu"
                className={classNames(activeMenu === menuId && "is-active")}
                onClick={() => onToggleMenu(menuId)}
                type="button"
              >
                {menuId === "file" ? "File" : menuId === "view" ? "View" : menuId === "connect" ? "Connect" : "Help"}
              </button>
              {activeMenu === menuId ? (
                <div className="app-menu-dropdown" role="menu">
                  {menuId === "file" ? (
                    <>
                      <button
                        onClick={() => {
                          onAddDraft();
                          onToggleMenu("file");
                        }}
                        role="menuitem"
                        type="button"
                      >
                        New planning draft
                      </button>
                      <button onClick={() => onOpenDialog("migration")} role="menuitem" type="button">
                        Migrate settings...
                      </button>
                    </>
                  ) : null}
                  {menuId === "view" ? (
                    <>
                      <button
                        className={classNames(currentView === "cockpit" && "is-selected")}
                        onClick={() => onSwitchView("cockpit")}
                        role="menuitem"
                        type="button"
                      >
                        Cockpit
                      </button>
                      <button
                        className={classNames(currentView === "pipeline" && "is-selected")}
                        onClick={() => onSwitchView("pipeline")}
                        role="menuitem"
                        type="button"
                      >
                        Pipeline
                      </button>
                      <button
                        className={classNames(currentView === "planning" && "is-selected")}
                        onClick={() => onSwitchView("planning")}
                        role="menuitem"
                        type="button"
                      >
                        Planning
                      </button>
                      <button onClick={onAdaptiveView} role="menuitem" type="button">
                        Use Adaptive cockpit
                      </button>
                    </>
                  ) : null}
                  {menuId === "connect" ? (
                    <>
                      <button onClick={() => onOpenDialog("connection")} role="menuitem" type="button">
                        Codex connection...
                      </button>
                      <span className="app-menu-note" role="presentation">
                        {codexConnectionRequested ? "Connection request staged" : "Local preview, execution locked"}
                      </span>
                    </>
                  ) : null}
                  {menuId === "help" ? (
                    <>
                      <button onClick={() => onOpenDialog("slash-help")} role="menuitem" type="button">
                        Slash commands
                      </button>
                      <span className="app-menu-note" role="presentation">
                        Commands are scoped to the active panel.
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="app-menu-status" aria-live="polite">
        {codexConnectionRequested ? <Link2 size={14} /> : <Link2Off size={14} />}
        <span>{appNotice}</span>
      </div>
    </header>
  );
}

function AppDialogSurface({
  codexConnectionRequested,
  codexLiveSmokeLoading,
  codexLiveSmokeProof,
  codexTransportDecision,
  codexTransportLoading,
  dialog,
  onClose,
  onRefreshCodexTransport,
  onRunCodexLiveSmokeProof,
  onStageCodexConnection
}: {
  codexConnectionRequested: boolean;
  codexLiveSmokeLoading: boolean;
  codexLiveSmokeProof: CodexLiveSmokeProof;
  codexTransportDecision: CodexTransportDecision;
  codexTransportLoading: boolean;
  dialog: AppDialog;
  onClose: () => void;
  onRefreshCodexTransport: () => void;
  onRunCodexLiveSmokeProof: () => void;
  onStageCodexConnection: () => void;
}) {
  const title =
    dialog === "connection"
      ? "Codex Connection"
      : dialog === "migration"
        ? "Migration Preview"
        : "Slash Commands";

  return (
    <div className="app-dialog-backdrop" role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="app-dialog"
        role="dialog"
      >
        <header>
          <div>
            <span className="eyebrow">Local setup</span>
            <h3>{title}</h3>
          </div>
          <button aria-label="Close dialog" onClick={onClose} type="button">
            Close
          </button>
        </header>

        {dialog === "connection" ? (
          <div className="app-dialog-body">
            <div className="connection-summary">
              <ShieldCheck size={18} />
              <div>
                <span className={classNames("transport-state-pill", `transport-${codexTransportDecision.state}`)}>
                  {transportStatusLabel(codexTransportDecision.state)}
                </span>
                <strong>{codexConnectionRequested ? "Connection request staged" : "Codex transport spike"}</strong>
                <p>{codexTransportDecision.summary}</p>
              </div>
            </div>
            <div className="transport-proof-grid" aria-label="Codex transport proof">
              <span>Preferred transport</span>
              <strong>{codexTransportDecision.preferredTransport}</strong>
              <span>Proof level</span>
              <strong>{codexTransportDecision.proof}</strong>
              <span>Can start session</span>
              <strong>{codexTransportDecision.canStartSession ? "Yes" : "No"}</strong>
              <span>Can send prompt</span>
              <strong>{codexTransportDecision.canSendPanelMessage ? "Yes" : "Locked"}</strong>
            </div>
            <div className="connection-checks" aria-label="Codex connection readiness">
              {codexTransportDecision.evidence.map((item) => (
                <span className={`is-${item.status}`} key={item.id} title={item.detail}>
                  {item.label}
                </span>
              ))}
            </div>
            <div className="transport-live-proof" aria-label="Codex live smoke proof">
              <span>Live smoke</span>
              <strong>{codexLiveSmokeProof.ok ? "Passed" : codexLiveSmokeProof.executed ? "Failed" : "Not run"}</strong>
              <small>
                {codexLiveSmokeProof.executed
                  ? `${codexLiveSmokeProof.agentDeltaMethodSeen ? "Delta seen" : "No delta"}; ${codexLiveSmokeProof.turnCompletedSeen ? "turn completed" : "turn incomplete"}`
                  : "Runs one tiny explicit Codex turn with read-only sandbox."}
              </small>
            </div>
            <p className="transport-fallback">{codexTransportDecision.fallback}</p>
            <div className="dialog-action-row">
              <button className="dialog-secondary-action" onClick={onRefreshCodexTransport} type="button">
                {codexTransportLoading ? "Checking..." : "Refresh probe"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexLiveSmokeLoading}
                onClick={onRunCodexLiveSmokeProof}
                type="button"
              >
                {codexLiveSmokeLoading ? "Running smoke..." : "Run live smoke"}
              </button>
              <button className="dialog-primary-action" onClick={onStageCodexConnection} type="button">
                {codexConnectionRequested ? "Connection request staged" : "Stage Codex connection request"}
              </button>
            </div>
          </div>
        ) : null}

        {dialog === "migration" ? (
          <div className="app-dialog-body">
            <p>
              Migration will import working setup into Steerboard profiles without mutating the source app.
              The first useful categories are settings, projects, threads, skills, plugins, MCP, and commands.
            </p>
            <div className="migration-grid" aria-label="Migration source preview">
              <span>Codex</span>
              <span>Settings, projects, chats, plugins, skills, MCP, commands</span>
              <span>Claude Code</span>
              <span>Projects, MCP, commands, local prompts</span>
              <span>Manual files</span>
              <span>JSON, TOML, MCP config, skill folders</span>
            </div>
          </div>
        ) : null}

        {dialog === "slash-help" ? (
          <div className="app-dialog-body">
            <p>Slash commands are scoped to the active panel and show whether they can run live, stage locally, or remain unavailable.</p>
            <div className="slash-command-list" aria-label="Available slash commands">
              {panelSlashCommands.map((item) => (
                <span className={`command-state-${item.state}`} key={item.command}>
                  <strong>{item.command}</strong>
                  <b>{item.state}</b>
                  <small>{item.detail} Scope: {item.scopes.join(", ")}</small>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SessionCell({
  isFocused = false,
  liveCodexEnabled = false,
  onPanelSessionStart,
  onPanelSessionStatus,
  panelSessionRecord,
  projectLabel,
  session
}: {
  isFocused?: boolean;
  liveCodexEnabled?: boolean;
  onPanelSessionStart?: (result: CodexPanelSessionStartPayload) => void;
  onPanelSessionStatus?: (
    panelId: string,
    status: CodexPanelSessionStatus,
    detail: string
  ) => void;
  panelSessionRecord?: CodexPanelSessionStateRecord;
  projectLabel?: string;
  session: SessionSummary;
}) {
  const identity = createCockpitPanelIdentity({
    projectId: session.projectId,
    projectLabel,
    role: session.role,
    runtime: session.runtime,
    state: session.state,
    title: session.title
  });
  const fileScope = createCockpitPanelFileScope(session.files);
  const attemptSignal = createCockpitPanelAttempt(session.attempt, session.state);
  const validationSignal = createCockpitPanelValidation(session.validation, session.state);
  const branchSignal = createCockpitPanelBranch(session.branch);
  const runtimeSignal = createCockpitPanelRuntime({
    role: session.role,
    runtime: session.runtime
  });
  const activitySignal = createCockpitPanelActivity({
    state: session.state,
    transcript: session.transcript,
    validation: session.validation
  });
  const toolCoverageSignal = createCockpitPanelToolCoverage(session.tools);
  const [chatMessages, setChatMessages] = useState<PanelChatMessage[]>(() =>
    loadPanelChatMessages(session)
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [lastLivePrompt, setLastLivePrompt] = useState("");
  const restoredSessionAvailable = Boolean(
    liveCodexEnabled &&
      panelSessionRecord &&
      !panelSessionRecord.stale &&
      !["closed", "error"].includes(panelSessionRecord.status)
  );
  const [liveChatStatus, setLiveChatStatus] = useState<LivePanelChatStatus>(
    restoredSessionAvailable || liveCodexEnabled ? "idle" : "preview"
  );
  const [liveSessionStarted, setLiveSessionStarted] = useState(restoredSessionAvailable);
  const [liveChatDetail, setLiveChatDetail] = useState(
    restoredSessionAvailable
      ? panelSessionRecord?.detail ?? "Restored Codex panel session metadata."
      : liveCodexEnabled
        ? "Codex live session ready"
        : "Codex local preview"
  );
  const slashSuggestions = useMemo(
    () => getPanelSlashCommandSuggestions(draftMessage),
    [draftMessage]
  );
  const canUseLiveCodex = liveCodexEnabled && hasDesktopRuntime();
  const liveChatStarting = liveChatStatus === "starting";
  const liveChatRunning = liveChatStatus === "running";
  const liveChatBusy = liveChatStarting || liveChatRunning;
  const liveControlSnapshot = useMemo(
    () =>
      buildCodexSessionControls({
        sessionStatus: liveChatStatus,
        liveTransportAvailable: canUseLiveCodex,
        activeTurn: {
          status: liveChatStarting ? "starting" : liveChatRunning ? "streaming" : liveChatStatus
        },
        lastUserPrompt: lastLivePrompt,
        draftText: draftMessage
      }),
    [canUseLiveCodex, draftMessage, lastLivePrompt, liveChatRunning, liveChatStarting, liveChatStatus]
  );
  const canInterruptLiveTurn = liveControlSnapshot.interrupt.state === "live";
  const canRetryLiveTurn =
    liveControlSnapshot.retry.state === "live" && !liveChatBusy;
  const composerStatusLabel = canUseLiveCodex
    ? liveChatStatus === "idle"
      ? "Codex live ready"
      : liveChatStatus === "starting"
        ? "Starting Codex"
        : liveChatStatus === "running"
          ? "Codex running"
          : liveChatStatus === "completed"
            ? "Codex complete"
            : liveChatStatus === "interrupted"
              ? "Codex interrupted"
              : "Codex failed"
    : "Codex local preview";

  useEffect(() => {
    setChatMessages(loadPanelChatMessages(session));
    setDraftMessage("");
    setLastLivePrompt("");
    const restored = Boolean(
      liveCodexEnabled &&
        panelSessionRecord &&
        !panelSessionRecord.stale &&
        !["closed", "error"].includes(panelSessionRecord.status)
    );
    setLiveSessionStarted(restored);
    setLiveChatStatus(liveCodexEnabled ? "idle" : "preview");
    setLiveChatDetail(
      restored
        ? panelSessionRecord?.detail ?? "Restored Codex panel session metadata."
        : panelSessionRecord?.stale
          ? "Saved Codex session is stale; a new session will start on next message."
          : liveCodexEnabled
            ? "Codex live session ready"
            : "Codex local preview"
    );
  }, [
    liveCodexEnabled,
    panelSessionRecord?.detail,
    panelSessionRecord?.sessionId,
    panelSessionRecord?.stale,
    panelSessionRecord?.status,
    session
  ]);

  useEffect(() => {
    savePanelChatMessages(session.id, chatMessages);
  }, [chatMessages, session.id]);

  async function ensureLivePanelSession() {
    if (liveSessionStarted) {
      return;
    }

    setLiveChatStatus("starting");
    setLiveChatDetail("Starting Codex app-server panel session.");
    const result = await invokeDesktopCommand<CodexPanelSessionStartPayload>(
      "codex_panel_session_start",
      { panelId: session.id }
    );
    setLiveSessionStarted(result.started);
    setLiveChatDetail(result.detail);
    if (result.started) {
      onPanelSessionStart?.(result);
    }
  }

  async function sendLivePanelPrompt(trimmedMessage: string, mode: "send" | "retry" = "send") {
    const sequence = chatMessages.length;
    const pendingMessage = createPanelLiveStatusMessage(
      session,
      sequence + 1,
      mode === "retry" ? "Retrying with live Codex..." : "Sending to live Codex...",
      "running"
    );

    setLastLivePrompt(trimmedMessage);
    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${session.id}:user:${currentMessages.length}`,
        role: "user",
        label: "You",
        body: trimmedMessage,
        meta: mode === "retry" ? "retry" : "live"
      },
      pendingMessage
    ]);
    setDraftMessage("");

    try {
      await ensureLivePanelSession();
      setLiveChatStatus("running");
      setLiveChatDetail("Codex turn is running.");
      const result = await invokeDesktopCommand<CodexPanelTurnResultPayload>(
        mode === "retry" ? "codex_panel_session_retry" : "codex_panel_session_send_turn",
        { panelId: session.id, prompt: trimmedMessage }
      );
      const state = reduceCodexSessionEvents(
        normalizeCodexPanelTurnResultEvents(result, trimmedMessage)
      );
      const nextMessages = codexSessionStateToPanelMessages(session, state, sequence + 2);
      const statusMessages = result.failed || result.interrupted || nextMessages.length === 0
        ? [
            result.failed
              ? createPanelLiveErrorMessage(
                  session,
                  sequence + 2,
                  result.detail || "Codex did not return a live response."
                )
              : createPanelLiveStatusMessage(
                  session,
                  sequence + 2,
                  result.detail || "Codex turn ended without a live response.",
                  result.interrupted ? "interrupted" : "live codex"
                )
          ]
        : [];

      setLiveChatStatus(
        result.failed
          ? "failed"
          : result.interrupted
            ? "interrupted"
            : result.completed
              ? "completed"
              : "failed"
      );
      setLiveChatDetail(result.detail);
      onPanelSessionStatus?.(
        session.id,
        result.failed ? "error" : result.interrupted ? "idle" : "active",
        result.detail
      );
      setChatMessages((currentMessages) => [
        ...currentMessages.filter((message) => message.id !== pendingMessage.id),
        ...nextMessages,
        ...statusMessages
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatStatus("failed");
      setLiveChatDetail(message);
      onPanelSessionStatus?.(session.id, "error", message);
      setChatMessages((currentMessages) => [
        ...currentMessages.filter((item) => item.id !== pendingMessage.id),
        createPanelLiveErrorMessage(session, sequence + 2, message)
      ]);
    }
  }

  async function handleInterruptLiveTurn() {
    if (!canInterruptLiveTurn) {
      return;
    }

    try {
      const result = await invokeDesktopCommand<CodexPanelInterruptResultPayload>(
        "codex_panel_session_interrupt",
        { panelId: session.id }
      );
      setLiveChatDetail(result.detail);
      if (result.interrupted) {
        setLiveChatStatus("interrupted");
        onPanelSessionStatus?.(session.id, "idle", result.detail);
      }
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveStatusMessage(
          session,
          currentMessages.length,
          result.detail,
          result.interrupted ? "interrupted" : "unsupported"
        )
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatStatus("failed");
      setLiveChatDetail(message);
      onPanelSessionStatus?.(session.id, "error", message);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveErrorMessage(session, currentMessages.length, message)
      ]);
    }
  }

  async function handleSteerLiveTurn(trimmedMessage: string) {
    if (!canUseLiveCodex || !liveChatRunning || !trimmedMessage) {
      return;
    }

    try {
      setDraftMessage("");
      const result = await invokeDesktopCommand<CodexPanelSteerResultPayload>(
        "codex_panel_session_steer",
        { panelId: session.id, message: trimmedMessage }
      );
      setLiveChatDetail(result.detail);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${session.id}:user:${currentMessages.length}`,
          role: "user",
          label: "You",
          body: trimmedMessage,
          meta: result.steered ? "steer" : "not steered"
        },
        createPanelLiveStatusMessage(
          session,
          currentMessages.length + 1,
          result.detail,
          result.steered ? "steer" : "unsupported"
        )
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatDetail(message);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveErrorMessage(session, currentMessages.length, message)
      ]);
    }
  }

  async function handleRetryLiveTurn() {
    const prompt = lastLivePrompt.trim();
    if (!canRetryLiveTurn || !prompt) {
      return;
    }

    await sendLivePanelPrompt(prompt, "retry");
  }

  async function handlePanelChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = draftMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    const slashCommandDecision = getPanelSlashCommandDecision(trimmedMessage, canUseLiveCodex);

    if (slashCommandDecision.route === "blocked" || slashCommandDecision.route === "local-preview") {
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${session.id}:user:${currentMessages.length}`,
          role: "user",
          label: "You",
          body: trimmedMessage,
          meta: slashCommandDecision.command?.command ?? "slash command"
        },
        slashCommandDecision.route === "blocked"
          ? createPanelSlashCommandStatusMessage(
              session,
              currentMessages.length + 1,
              slashCommandDecision
            )
          : createPanelReplyMessage(session, currentMessages.length + 1, trimmedMessage)
      ]);
      setDraftMessage("");
      return;
    }

    if (canUseLiveCodex) {
      if (liveChatRunning) {
        await handleSteerLiveTurn(trimmedMessage);
      } else {
        await sendLivePanelPrompt(trimmedMessage);
      }
      return;
    }

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${session.id}:user:${currentMessages.length}`,
        role: "user",
        label: "You",
        body: trimmedMessage,
        meta: "draft"
      },
      createPanelReplyMessage(session, currentMessages.length + 1, trimmedMessage)
    ]);
    setDraftMessage("");
  }

  return (
    <article
      aria-current={isFocused ? "true" : undefined}
      aria-label={isFocused ? `${identity.ariaLabel} - Focused` : identity.ariaLabel}
      className={classNames("session-cell", `role-${session.role}`, isFocused && "is-focused")}
      data-focused={isFocused ? "true" : undefined}
      tabIndex={isFocused ? 0 : undefined}
    >
      <header className="cell-header">
        <div className="cell-title-block">
          <PanelIdentitySignal identity={identity} />
          <h3 title={identity.title}>{identity.title}</h3>
        </div>
        <span className={classNames("state-chip", `state-${session.state}`)}>
          {stateIcon[session.state]}
          {session.state}
        </span>
      </header>

      <div className="cell-meta">
        <PanelBranchSignal branch={branchSignal} />
        <PanelRuntimeSignal runtime={runtimeSignal} />
        <PanelAttemptSignal attempt={attemptSignal} />
      </div>

      <div className="cell-chat" aria-label={`${identity.title} chat lane`}>
        <div className="cell-chat-context" aria-label="Panel context">
          <PanelValidationSignal validation={validationSignal} />
          <PanelActivitySignal activity={activitySignal} />
          <PanelFileScopeSignal scope={fileScope} />
          <PanelToolCoverageSignal coverage={toolCoverageSignal} />
        </div>
        <ol className="cell-chat-thread" aria-label={`${identity.title} messages`}>
          {chatMessages.map((message) => (
            <li
              className={classNames("chat-message", `chat-message-${message.role}`)}
              key={message.id}
              title={message.meta}
            >
              <span className="chat-avatar" aria-hidden="true">
                {message.role === "user" ? (
                  <UserRound size={13} />
                ) : message.role === "tool" ? (
                  <Terminal size={13} />
                ) : (
                  <MessageSquare size={13} />
                )}
              </span>
              <div className="chat-bubble">
                <div className="chat-message-header">
                  <strong>{message.label}</strong>
                  <small>{message.meta}</small>
                </div>
                <p>{message.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <footer className="cell-footer chat-composer-shell">
        <form className="chat-composer" onSubmit={handlePanelChatSubmit}>
          <button aria-label="Attach context" title="Attach context" type="button">
            <Paperclip size={15} />
          </button>
          <textarea
            aria-label={`Message ${identity.title}`}
            disabled={liveChatStarting}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask Codex, or type / for commands"
            rows={1}
            value={draftMessage}
          />
          {slashSuggestions.length > 0 ? (
            <div className="slash-command-menu" aria-label="Panel slash commands">
              {slashSuggestions.map((item) => (
                <button
                  className={`command-state-${item.state}`}
                  key={item.command}
                  onClick={() => setDraftMessage(`${item.command} `)}
                  title={`${item.detail} Scope: ${item.scopes.join(", ")}`}
                  type="button"
                >
                  <strong>{item.command}</strong>
                  <small>{item.label} · {item.scopes.join(", ")}</small>
                  <span>{item.state}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="chat-composer-meta">
            <span className={classNames("composer-status", `composer-status-${liveChatStatus}`)} title={liveChatDetail}>
              {composerStatusLabel}
            </span>
            <button
              aria-label={`Interrupt ${identity.title}`}
              className="session-control-button"
              disabled={!canInterruptLiveTurn}
              onClick={handleInterruptLiveTurn}
              title={liveControlSnapshot.interrupt.reason}
              type="button"
            >
              <Pause size={15} />
            </button>
            <button
              aria-label={`Retry last prompt in ${identity.title}`}
              className="session-control-button"
              disabled={!canRetryLiveTurn}
              onClick={handleRetryLiveTurn}
              title={liveControlSnapshot.retry.reason}
              type="button"
            >
              <RotateCcw size={15} />
            </button>
            <button
              aria-label={`Fork ${identity.title}`}
              className="session-control-button is-unsupported"
              disabled
              title={liveControlSnapshot.fork.reason}
              type="button"
            >
              <GitBranch size={15} />
            </button>
            <button
              aria-label={`Resume ${identity.title}`}
              className="session-control-button is-unsupported"
              disabled
              title={liveControlSnapshot.resume.reason}
              type="button"
            >
              <Play size={15} />
            </button>
            <button
              aria-label={`Archive ${identity.title}`}
              className="session-control-button is-unsupported"
              disabled
              title={liveControlSnapshot.archive.reason}
              type="button"
            >
              <Folder size={15} />
            </button>
            <button aria-label="Open lane options" title="Lane options" type="button">
              <MoreHorizontal size={15} />
            </button>
            <button
              aria-label={`Send message to ${identity.title}`}
              disabled={draftMessage.trim().length === 0 || liveChatStarting}
              title={liveChatRunning ? liveControlSnapshot.steer.reason : "Send"}
              type="submit"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </footer>
    </article>
  );
}

function PanelToolCoverageSignal({ coverage }: { coverage: CockpitPanelToolCoverage }) {
  return (
    <span
      aria-label={`Tool coverage: ${coverage.label}, ${coverage.countLabel}`}
      className={classNames("panel-tool-coverage", `panel-tool-${coverage.tone}`)}
      title={`${coverage.detail} (${coverage.countLabel})`}
    >
      <ClipboardList size={14} />
      <b>{coverage.label}</b>
      <small>{coverage.countLabel}</small>
    </span>
  );
}

function PanelActivitySignal({ activity }: { activity: CockpitPanelActivity }) {
  return (
    <span
      aria-label={`Latest activity: ${activity.label}, ${activity.countLabel}`}
      className={classNames("panel-activity-signal", `panel-activity-${activity.tone}`)}
      title={`${activity.detail} (${activity.countLabel})`}
    >
      <Activity size={14} />
      <b>{activity.label}</b>
      <small>{activity.countLabel}</small>
    </span>
  );
}

function PanelBranchSignal({ branch }: { branch: CockpitPanelBranch }) {
  return (
    <span
      aria-label={`Branch: ${branch.label}`}
      className={classNames("panel-branch-signal", `panel-branch-${branch.tone}`)}
      title={branch.detail}
    >
      <GitBranch size={14} />
      <b>{branch.label}</b>
    </span>
  );
}

function PanelRuntimeSignal({ runtime }: { runtime: CockpitPanelRuntime }) {
  return (
    <span
      aria-label={`Runtime: ${runtime.label}`}
      className={classNames("panel-runtime-signal", `panel-runtime-${runtime.tone}`)}
      title={runtime.detail}
    >
      <Terminal size={14} />
      <b>{runtime.label}</b>
    </span>
  );
}

function PanelValidationSignal({ validation }: { validation: CockpitPanelValidation }) {
  return (
    <span
      aria-label={`Validation status: ${validation.label}`}
      className={classNames("panel-validation-signal", `panel-validation-${validation.tone}`)}
      title={validation.detail}
    >
      {validation.label}
    </span>
  );
}

function PanelAttemptSignal({ attempt }: { attempt: CockpitPanelAttempt }) {
  return (
    <span
      aria-label={`Attempt limit: ${attempt.label}`}
      className={classNames("panel-attempt-signal", `panel-attempt-${attempt.tone}`)}
      title={attempt.detail}
    >
      <small>Attempt </small>
      <b>{attempt.label}</b>
    </span>
  );
}

function PanelFileScopeSignal({ scope }: { scope: CockpitPanelFileScope }) {
  return (
    <span
      aria-label={`File scope: ${scope.label}`}
      className={classNames("panel-file-scope", `panel-file-scope-${scope.tone}`)}
      title={scope.detail}
    >
      {scope.label}
    </span>
  );
}

function PanelIdentitySignal({ identity }: { identity: CockpitPanelIdentity }) {
  return (
    <div
      aria-label={`${identity.roleLabel} for ${identity.projectLabel}`}
      className={classNames("panel-identity-row", `panel-identity-${identity.tone}`)}
      title={identity.detail}
    >
      <span className="cell-role">{identity.roleLabel}</span>
      <span aria-hidden="true" className="panel-identity-divider">
        /
      </span>
      <span className="panel-project-label">{identity.projectLabel}</span>
    </div>
  );
}

function PanelRosterSignal({ roster }: { roster: CockpitPanelRoster }) {
  return (
    <div
      aria-label={`Panel roster: ${roster.label}`}
      className={classNames("panel-roster-chip", `panel-roster-${roster.tone}`)}
      title={roster.detail}
    >
      <div className="panel-roster-copy">
        <strong>{roster.label}</strong>
        <small>
          {roster.visibleLabel} / {roster.hiddenLabel}
        </small>
      </div>
      <div className="panel-roster-metrics" aria-label="Panel roster role counts">
        {roster.metrics.map((metric) => (
          <span
            className={classNames("panel-roster-metric", `panel-roster-metric-${metric.tone}`)}
            key={metric.label}
            title={`${metric.label}: ${metric.value}`}
          >
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function PanelOverflowSignal({ overflow }: { overflow: CockpitPanelOverflow }) {
  const visibleLabel = overflow.tone === "clear" ? "All visible" : "Hidden queue";

  return (
    <div
      aria-label={`Hidden panel queue: ${overflow.label}`}
      className={classNames("panel-overflow-chip", `panel-overflow-${overflow.tone}`)}
      title={overflow.detail}
    >
      <div className="panel-overflow-copy">
        <strong>{visibleLabel}</strong>
        <small>{overflow.hiddenLabel}</small>
      </div>
      <div className="panel-overflow-next">
        <small>Next</small>
        <strong title={overflow.nextLabel}>{overflow.nextLabel}</strong>
      </div>
      <b>{overflow.reviewLabel}</b>
    </div>
  );
}

function LayoutCapacitySignal({ capacity }: { capacity: CockpitLayoutCapacity }) {
  return (
    <div
      aria-label={`Layout capacity: ${capacity.label}`}
      className={classNames("layout-capacity-chip", `layout-capacity-${capacity.tone}`)}
      title={capacity.detail}
    >
      <div>
        <strong>{capacity.layoutLabel}</strong>
        <small>{capacity.capacityLabel}</small>
      </div>
      <b>{capacity.usageLabel}</b>
    </div>
  );
}

function FocusedPanelStatusChip({
  focusTarget,
  onClearFocus,
  onFocus,
  status
}: {
  focusTarget: CockpitPanelFocusTarget;
  onClearFocus: () => void;
  onFocus: () => void;
  status: CockpitFocusedPanelStatus;
}) {
  const controls = createCockpitToolbarFocusAction(focusTarget, status);

  return (
    <div
      aria-label={`Focused panel status: ${status.label}. ${status.detail}`}
      className={classNames("focused-panel-chip", `focused-panel-${status.tone}`)}
      title={controls.statusTitle}
    >
      <CircleDot size={14} />
      <div className="focused-panel-copy">
        <strong>{status.label}</strong>
        <small>{status.detail}</small>
      </div>
      <div className="focused-panel-actions">
        <button
          aria-label={controls.focusAriaLabel}
          disabled={controls.focusDisabled}
          onClick={onFocus}
          title={controls.focusTitle}
          type="button"
        >
          <span>{controls.focusLabel}</span>
        </button>
        <button
          aria-label={controls.clearAriaLabel}
          disabled={controls.clearDisabled}
          onClick={onClearFocus}
          title={controls.clearTitle}
          type="button"
        >
          <span>{controls.clearLabel}</span>
        </button>
      </div>
    </div>
  );
}

function PipelineView({
  items,
  mockRuns,
  onOpenRun,
  onStagePackage,
  project,
  registryEntry,
  runtimeAdapter,
  tasks
}: {
  items: PipelineItem[];
  mockRuns: MockOrchestratorRun[];
  onOpenRun: (runId: string) => void;
  onStagePackage: (dispatchPackage: DispatchPackage) => void;
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  runtimeAdapter?: RuntimeAdapter;
  tasks: OrchestrationTask[];
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(items[0]?.id);
  const [dispatchRequestHistory, setDispatchRequestHistory] = useState<PipelineDispatchRequestRecord[]>(
    () => loadPipelineDispatchRequestHistory()
  );
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];
  const selectedPreview = selectedItem
    ? buildPipelineItemDispatchPreview(selectedItem, registryEntry, runtimeAdapter)
    : undefined;
  const dispatchRequestIntent = latestPipelineDispatchRequestIntent(
    dispatchRequestHistory,
    selectedPreview?.itemId
  );
  const selectedDispatchHistory = selectedPreview
    ? dispatchRequestHistory.filter((record) => record.itemId === selectedPreview.itemId)
    : [];
  const selectedRunLinks = selectedItem ? buildPipelineItemRunLinks(selectedItem, mockRuns) : [];
  const itemRunStatusById = useMemo(
    () => new Map(items.map((item) => [item.id, summarizePipelineItemRunStatus(item, mockRuns)])),
    [items, mockRuns]
  );
  const selectedRunStatus = selectedItem ? itemRunStatusById.get(selectedItem.id) : undefined;
  const canRequestDispatch = Boolean(selectedPreview?.canDispatch) && dispatchRequestIntent !== "requested";
  const canCancelDispatch = dispatchRequestIntent === "requested";
  const dispatchableItemCount = items.filter((item) =>
    buildPipelineItemDispatchPreview(item, registryEntry, runtimeAdapter).canDispatch
  ).length;
  const registryReady = registryEntry ? dispatchableRegistryEntries([registryEntry]).length === 1 : false;
  const runtimeReady = runtimeAdapter ? canRunWithAdapter(runtimeAdapter) : false;
  const dispatchableCount = registryReady && runtimeReady ? dispatchableItemCount : 0;
  const taskSummary = summarizeTasks(tasks);
  const handoffTask = nextHandoffTask(tasks);
  const handoff = handoffTask ? buildHandoffBrief(handoffTask, project) : undefined;

  useEffect(() => {
    savePipelineDispatchRequestHistory(dispatchRequestHistory);
  }, [dispatchRequestHistory]);

  function recordPipelineDispatchAction(action: PipelineDispatchRequestAction) {
    if (!selectedPreview) {
      return;
    }

    const record = createPipelineDispatchRequestRecord(
      selectedPreview,
      action,
      new Date().toISOString()
    );

    setDispatchRequestHistory((current) =>
      appendPipelineDispatchRequestRecord(current, record)
    );
  }

  function createPipelineCockpitRun() {
    if (!selectedItem || !selectedPreview) {
      return;
    }

    const result = tryBuildPipelineItemDispatchPackage(
      selectedItem,
      project,
      selectedPreview,
      {
        createdAt: new Date().toISOString(),
        idSeed: "pipeline-item"
      }
    );

    if (result.ok) {
      onStagePackage(result.package);
    }
  }

  return (
    <section className="pipeline-view">
      <div className="pipeline-header">
        <div>
          <h3>Project Pipeline</h3>
          <p>{project.name} orchestration lane</p>
          <div className="gate-row" aria-label="Dispatch gates">
            <span className={classNames("gate-chip", registryReady ? "gate-ready" : "gate-review")}>
              Registry {registryEntry?.readiness ?? 0}%
            </span>
            <span className={classNames("gate-chip", runtimeReady ? "gate-ready" : "gate-review")}>
              Runtime {runtimeAdapter ? runtimeStateLabel(runtimeAdapter.state) : "Missing"}
            </span>
          </div>
        </div>
        <button
          disabled={!canRequestDispatch}
          onClick={() => recordPipelineDispatchAction("requested")}
          title={selectedPreview?.detail ?? `${dispatchableCount} ready tasks`}
          type="button"
        >
          <Play size={16} />
          Request Dispatch
        </button>
      </div>

      <div className="pipeline-body">
        <div className="pipeline-left">
          <div className="pipeline-table" aria-label="Pipeline readiness">
            {items.map((item) => {
              const runStatus = itemRunStatusById.get(item.id);

              return (
                <button
                  aria-pressed={selectedPreview?.itemId === item.id}
                  className={classNames(
                    "pipeline-row",
                    "pipeline-row-button",
                    selectedPreview?.itemId === item.id && "is-selected"
                  )}
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  type="button"
                >
                  <div>
                    <span className={classNames("pipeline-stage", `stage-${item.stage}`)}>{item.stage}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <span>{item.owner}</span>
                  <span>{item.risk}</span>
                  <span>{item.readiness}%</span>
                  <PipelineRunStatusPill summary={runStatus} />
                </button>
              );
            })}
          </div>

          <section className="task-board" aria-label="Task split">
            <div className="task-board-header">
              <div>
                <h4>Task Split</h4>
                <span>{taskSummary.total} scoped tasks</span>
              </div>
              <div className="summary-chips" aria-label="Task status summary">
                <span>{taskSummary.queued} queued</span>
                <span>{taskSummary.implementing} active</span>
                <span>{taskSummary.validating} validating</span>
                <span>{taskSummary.blocked} blocked</span>
              </div>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div>
                    <span className={classNames("task-status", `task-${task.status}`)}>{task.status}</span>
                    <h5>{task.title}</h5>
                    <p>{task.objective}</p>
                  </div>
                  <span>{task.owner}</span>
                  <span>{task.role}</span>
                  <span>
                    {task.attempt}/{task.attemptLimit}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="handoff-panel pipeline-detail-panel" aria-label="Selected pipeline item dispatch preview">
          {selectedPreview ? (
            <PipelineItemDispatchDetail
              canCancelDispatch={canCancelDispatch}
              canCreateCockpitRun={Boolean(selectedPreview.canDispatch)}
              canRequestDispatch={canRequestDispatch}
              handoff={handoff}
              handoffTask={handoffTask}
              history={selectedDispatchHistory}
              intent={dispatchRequestIntent}
              onCancelDispatch={() => recordPipelineDispatchAction("cancelled")}
              onCreateCockpitRun={createPipelineCockpitRun}
              onOpenRun={onOpenRun}
              onRequestDispatch={() => recordPipelineDispatchAction("requested")}
              preview={selectedPreview}
              runLinks={selectedRunLinks}
              runStatus={selectedRunStatus}
            />
          ) : (
            <p className="empty-preview">Select a pipeline item to inspect dispatch readiness.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function PipelineItemDispatchDetail({
  canCancelDispatch,
  canCreateCockpitRun,
  canRequestDispatch,
  history,
  handoff,
  handoffTask,
  intent,
  onCancelDispatch,
  onCreateCockpitRun,
  onOpenRun,
  onRequestDispatch,
  preview,
  runLinks,
  runStatus
}: {
  canCancelDispatch: boolean;
  canCreateCockpitRun: boolean;
  canRequestDispatch: boolean;
  history: PipelineDispatchRequestRecord[];
  handoff?: ReturnType<typeof buildHandoffBrief>;
  handoffTask?: OrchestrationTask;
  intent: PipelineDispatchRequestIntent;
  onCancelDispatch: () => void;
  onCreateCockpitRun: () => void;
  onOpenRun: (runId: string) => void;
  onRequestDispatch: () => void;
  preview: PipelineItemDispatchPreview;
  runLinks: PipelineItemRunLink[];
  runStatus?: PipelineItemRunStatusSummary;
}) {
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">Selected Item</span>
          <h4>{preview.title}</h4>
        </div>
        <span className={classNames("preview-state", `preview-${preview.state}`)}>{preview.state}</span>
      </header>

      <div className="pipeline-detail-body">
        <section className="pipeline-detail-summary" aria-label="Selected pipeline item summary">
          <p title={preview.detail}>{preview.detail}</p>
          <dl>
            <div>
              <dt>Stage</dt>
              <dd>{preview.stage}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{preview.owner}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{preview.risk}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{preview.readiness}%</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>
                <PipelineRunStatusPill compact summary={runStatus} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="pipeline-gate-section">
          <h5>Dispatch Gates</h5>
          <ol className="dispatch-gate-list" aria-label="Selected item dispatch gates">
            {preview.gates.map((gate) => (
              <li className={`dispatch-gate-${gate.status}`} key={gate.id}>
                <span />
                <div>
                  <strong>{gate.label}</strong>
                  <small title={gate.detail}>{gate.detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pipeline-request-section">
          <div className="pipeline-request-header">
            <div>
              <h5>Dispatch Request</h5>
              <small>{intent === "requested" ? "Request pending" : "No active request"}</small>
            </div>
            <span className={classNames("preview-state", intent === "requested" ? "preview-ready" : "preview-review")}>
              {intent}
            </span>
          </div>
          <div className="pipeline-request-actions">
            <button
              aria-label="Request selected pipeline item dispatch"
              disabled={!canRequestDispatch}
              onClick={onRequestDispatch}
              type="button"
            >
              Request
            </button>
            <button
              aria-label="Cancel selected pipeline item dispatch request"
              disabled={!canCancelDispatch}
              onClick={onCancelDispatch}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="pipeline-cockpit-link">
            <div>
              <strong>Local cockpit run</strong>
              <small>Creates a mock run projection from this pipeline item.</small>
            </div>
            <button
              aria-label="Create local cockpit run from selected pipeline item"
              disabled={!canCreateCockpitRun}
              onClick={onCreateCockpitRun}
              type="button"
            >
              Create Run
            </button>
          </div>
          <PipelineItemRunLinks links={runLinks} onOpenRun={onOpenRun} />
          <ol className="pipeline-request-history" aria-label="Selected pipeline item dispatch request history">
            {history.length > 0 ? (
              history.slice(0, 4).map((record) => (
                <PipelineDispatchRequestRecordRow key={record.id} record={record} />
              ))
            ) : (
              <li className="pipeline-request-empty">Request dispatch to create a local record.</li>
            )}
          </ol>
        </section>

        <section className="pipeline-handoff-section">
          <div className="pipeline-handoff-header">
            <div>
              <span className="eyebrow">Next Handoff</span>
              <h5>{handoff?.title ?? "No task selected"}</h5>
            </div>
            {handoffTask ? (
              <span className={classNames("task-status", `task-${handoffTask.status}`)}>{handoffTask.status}</span>
            ) : null}
          </div>
          <pre>{handoff?.markdown ?? "No scoped task is ready for handoff."}</pre>
        </section>
      </div>
    </>
  );
}

function PipelineItemRunLinks({
  links,
  onOpenRun
}: {
  links: PipelineItemRunLink[];
  onOpenRun: (runId: string) => void;
}) {
  return (
    <section className="pipeline-linked-runs" aria-label="Selected pipeline item linked cockpit runs">
      <div className="pipeline-linked-runs-header">
        <strong>Linked cockpit runs</strong>
        <span>{links.length}</span>
      </div>
      {links.length > 0 ? (
        <ol>
          {links.map((link) => (
            <li className="pipeline-linked-run" key={link.runId}>
              <div>
                <strong title={link.title}>{link.title}</strong>
                <small title={link.sourcePackageId}>
                  {formatShortDate(link.createdAt)} | {link.taskCount} tasks | {link.validationGateCount} gates
                </small>
              </div>
              <span className={classNames("pipeline-linked-status", `run-${link.status}`)}>{link.status}</span>
              <button
                aria-label={`Open linked cockpit run ${link.runId}`}
                onClick={() => onOpenRun(link.runId)}
                type="button"
              >
                Open
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pipeline-linked-empty">Create a local cockpit run to attach a visible trace.</p>
      )}
    </section>
  );
}

function PipelineRunStatusPill({
  compact = false,
  summary
}: {
  compact?: boolean;
  summary?: PipelineItemRunStatusSummary;
}) {
  if (!summary) {
    return null;
  }

  const status = summary.latestStatus ?? "none";
  const countLabel = summary.linkCount > 0 && !compact ? ` (${summary.linkCount})` : "";

  return (
    <span
      className={classNames(
        "pipeline-run-status",
        `run-${status}`,
        summary.activeCount > 0 && "has-active",
        summary.issueCount > 0 && "has-issue"
      )}
      title={summary.detail}
    >
      {summary.label}
      {countLabel}
    </span>
  );
}

function MilestoneStatusPanel({
  milestones,
  summary
}: {
  milestones: readonly MilestoneStatus[];
  summary: MilestoneStatusSummary;
}) {
  const nextDetail = createMilestoneReportNextDetail(milestones, summary);

  return (
    <section className="panel-section milestone-status-panel">
      <div className="milestone-status-header">
        <h4>Milestones</h4>
        <span
          title={`${summary.complete} complete, ${summary.active} in progress, ${summary.planned} planned, ${summary.paused} paused, ${summary.averageCompletionPercent}% overall`}
        >
          {summary.averageCompletionPercent}% overall
        </span>
      </div>
      <div
        aria-label={`Milestone report summary: ${summary.averageCompletionPercent}% overall. Next milestone: ${summary.nextTarget}. Next step: ${summary.nextStep}`}
        className="milestone-report-summary"
      >
        <div className="milestone-report-meter">
          <strong>{summary.averageCompletionPercent}%</strong>
          <span>Overall</span>
          <b aria-hidden="true">
            <i style={{ width: `${summary.averageCompletionPercent}%` }} />
          </b>
        </div>
        <div className="milestone-report-next">
          <small>Next milestone</small>
          <strong title={summary.nextTarget}>{summary.nextTarget}</strong>
          <span title={summary.nextStep}>{summary.nextStep}</span>
        </div>
        <div className="milestone-report-counts">
          <span title={`${summary.complete} complete`}>{summary.complete} complete</span>
          <span title={`${summary.active} in progress`}>{summary.active} active</span>
          <span title={`${summary.paused} paused`}>{summary.paused} paused</span>
        </div>
      </div>
      <div
        aria-label={nextDetail.ariaLabel}
        className={classNames(
          "milestone-next-detail",
          !nextDetail.hasNext && "is-empty"
        )}
        title={nextDetail.title}
      >
        <div className="milestone-next-detail-header">
          <span>Current next</span>
          <strong title={nextDetail.target}>{nextDetail.target}</strong>
          <b>{nextDetail.completionLabel}</b>
        </div>
        <dl>
          <div>
            <dt>Plan</dt>
            <dd title={nextDetail.plan}>{nextDetail.plan}</dd>
          </div>
          <div>
            <dt>Latest</dt>
            <dd title={nextDetail.latestNote}>{nextDetail.latestNote}</dd>
          </div>
          <div>
            <dt>Next</dt>
            <dd title={nextDetail.nextStep}>{nextDetail.nextStep}</dd>
          </div>
        </dl>
      </div>
      <table
        className="milestone-target-table"
        aria-label="Milestone targets, completion, and notes"
      >
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Completion</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => {
            const rowState = createMilestoneReportRowState(milestone, summary);

            return (
              <tr
                aria-current={rowState.isNext ? "step" : undefined}
                aria-label={`${milestone.target}: ${milestone.completion}, ${milestone.latestNote}`}
                className={classNames(rowState.isNext && "is-next-milestone")}
                key={milestone.target}
                title={`${milestone.target} - ${milestone.completion} - ${milestone.latestNote}`}
              >
                <td title={milestone.target}>
                  <span className="milestone-target-cell">
                    <span>{milestone.target}</span>
                    {rowState.isNext ? (
                      <b className="milestone-next-marker">{rowState.markerLabel}</b>
                    ) : null}
                  </span>
                </td>
                <td className="milestone-completion-cell" title={milestone.completion}>
                  <span className={classNames("milestone-state-pill", `milestone-${milestone.tone}`)}>
                    {milestone.completion}
                  </span>
                </td>
                <td title={milestone.latestNote}>{milestone.latestNote}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="milestone-status-table" aria-label="Milestone status table">
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Plan</th>
            <th scope="col">Completion</th>
            <th scope="col">% Completion</th>
            <th scope="col">Latest Note</th>
            <th scope="col">Next Step</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => {
            const rowState = createMilestoneReportRowState(milestone, summary);

            return (
              <tr
                aria-current={rowState.isNext ? "step" : undefined}
                aria-label={rowState.ariaLabel}
                className={classNames(rowState.isNext && "is-next-milestone")}
                key={milestone.target}
                title={rowState.rowTitle}
              >
                <td title={milestone.target}>
                  <span className="milestone-target-cell">
                    <span>{milestone.target}</span>
                    {rowState.isNext ? (
                      <b className="milestone-next-marker">{rowState.markerLabel}</b>
                    ) : null}
                  </span>
                </td>
                <td title={milestone.plan}>{milestone.plan}</td>
                <td className="milestone-completion-cell" title={milestone.completion}>
                  <span className={classNames("milestone-state-pill", `milestone-${milestone.tone}`)}>
                    {milestone.completion}
                  </span>
                </td>
                <td>
                  <div
                    className="milestone-percent-cell"
                    title={`${milestone.completionPercent}% - ${milestone.completion}`}
                  >
                    <span className={classNames("milestone-status-pill", `milestone-${milestone.tone}`)}>
                      {milestone.completionPercent}%
                    </span>
                    <span className="milestone-percent-track" aria-hidden="true">
                      <span
                        className={classNames("milestone-percent-fill", `milestone-${milestone.tone}`)}
                        style={{ width: `${milestone.completionPercent}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td title={milestone.latestNote}>{milestone.latestNote}</td>
                <td title={milestone.nextStep}>{milestone.nextStep}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function PanelPrioritySignal({
  focusTarget,
  onClearFocus,
  onFocus,
  priority
}: {
  focusTarget: CockpitPanelFocusTarget;
  onClearFocus: () => void;
  onFocus: () => void;
  priority: CockpitPanelPriority;
}) {
  const focusControls = createCockpitPanelFocusControls(focusTarget);
  const icon =
    priority.tone === "critical" || priority.tone === "attention" ? (
      <AlertTriangle size={15} />
    ) : (
      <CircleDot size={15} />
    );

  return (
    <section className="panel-section panel-priority-panel" aria-label="Next cockpit panel attention">
      <div className="panel-priority-header">
        <h4>Next Attention</h4>
        <div className="panel-priority-actions">
          <span
            className={classNames("panel-priority-pill", `panel-priority-${priority.tone}`)}
            title={`${priority.priorityLabel}: ${priority.detail}`}
          >
            {priority.priorityLabel}
          </span>
          <button
            aria-label={
              !focusControls.focusDisabled
                ? `Focus ${priority.title}`
                : focusControls.focusTitle
            }
            className="panel-priority-focus-button"
            disabled={focusControls.focusDisabled}
            onClick={onFocus}
            title={focusControls.focusTitle}
            type="button"
          >
            <CircleDot size={13} />
            <span>{focusControls.focusLabel}</span>
          </button>
          <button
            aria-label="Clear cockpit panel focus"
            className="panel-priority-focus-button panel-priority-clear-button"
            disabled={focusControls.clearDisabled}
            onClick={onClearFocus}
            title={focusControls.clearTitle}
            type="button"
          >
            <CircleDot size={13} />
            <span>{focusControls.clearLabel}</span>
          </button>
        </div>
      </div>
      <div className="panel-priority-row">
        <span
          aria-hidden="true"
          className={classNames("panel-priority-icon", `panel-priority-${priority.tone}`)}
        >
          {icon}
        </span>
        <div className="panel-priority-copy">
          <strong title={priority.title}>{priority.title}</strong>
          <small title={priority.detail}>{priority.detail}</small>
        </div>
        <dl className="panel-priority-meta" aria-label="Panel priority metadata">
          <div>
            <dt>Role</dt>
            <dd>{priority.role}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{priority.state}</dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>{focusControls.statusLabel}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function PipelineDispatchRequestRecordRow({ record }: { record: PipelineDispatchRequestRecord }) {
  return (
    <li className={classNames("pipeline-request-record", `pipeline-request-record-${record.action}`)}>
      <span />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.state}>{record.readiness}%</b>
    </li>
  );
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

function linesToList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatShortDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function PlanningView({
  activeIndex,
  drafts,
  onAddDraft,
  onSelectDraft,
  onStagePackage,
  onUpdateDraft,
  projects
}: {
  activeIndex: number;
  drafts: PlanningDraft[];
  onAddDraft: () => void;
  onSelectDraft: (index: number) => void;
  onStagePackage: (dispatchPackage: DispatchPackage) => void;
  onUpdateDraft: (draft: PlanningDraft) => void;
  projects: ProjectSummary[];
}) {
  const draft = drafts[activeIndex] ?? drafts[0] ?? normalizePlanningDraft({});
  const readiness = evaluatePlanningReadiness(draft);
  const canDeploy = canDeployPlanningDraft(draft);
  const targetProject = projects.find((project) => project.id === draft.targetProjectId);
  const [stagedPackage, setStagedPackage] = useState<DispatchPackage | undefined>();
  const stagedMarkdown = stagedPackage ? renderDispatchPackageMarkdown(stagedPackage) : "";

  function handleStageDraft() {
    if (!targetProject) {
      return;
    }

    const result = tryBuildDispatchPackage(
      draft,
      { id: targetProject.id, name: targetProject.name },
      {
        createdAt: new Date().toISOString(),
        idSeed: "steerboard"
      }
    );

    if (result.ok) {
      setStagedPackage(result.package);
      onStagePackage(result.package);
    }
  }

  return (
    <section className="planning-view">
      <header className="planning-header">
        <div>
          <h3>Project Planning</h3>
          <p>Prepare scoped work before dispatching it into the cockpit.</p>
        </div>
        <button disabled={!canDeploy || !targetProject} onClick={handleStageDraft} type="button">
          <Play size={16} />
          Stage Draft
        </button>
      </header>

      <div className="planning-body">
        <aside className="draft-list" aria-label="Planning drafts">
          <div className="draft-list-header">
            <h4>Drafts</h4>
            <button onClick={onAddDraft} type="button">
              New Draft
            </button>
          </div>

          {drafts.map((item, index) => {
            const itemReadiness = evaluatePlanningReadiness(item);
            const targetProject = projects.find((project) => project.id === item.targetProjectId);

            return (
              <button
                className={classNames("draft-button", index === activeIndex && "is-selected")}
                key={`${item.title}-${index}`}
                onClick={() => onSelectDraft(index)}
                type="button"
              >
                <span>{item.title || "Untitled draft"}</span>
                <small>{targetProject?.name ?? "No project selected"}</small>
                <strong>{itemReadiness.readiness}%</strong>
              </button>
            );
          })}
        </aside>

        <form className="draft-editor" aria-label="Draft editor">
          <label>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) => onUpdateDraft({ ...draft, title: event.currentTarget.value })}
            />
          </label>

          <label>
            <span>Target Project</span>
            <select
              value={draft.targetProjectId}
              onChange={(event) => onUpdateDraft({ ...draft, targetProjectId: event.currentTarget.value })}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="wide-field">
            <span>Objective</span>
            <textarea
              rows={3}
              value={draft.objective}
              onChange={(event) => onUpdateDraft({ ...draft, objective: event.currentTarget.value })}
            />
          </label>

          <label>
            <span>Scope</span>
            <textarea
              rows={5}
              value={listToLines(draft.scope)}
              onChange={(event) => onUpdateDraft({ ...draft, scope: linesToList(event.currentTarget.value) })}
            />
          </label>

          <label>
            <span>File Areas</span>
            <textarea
              rows={5}
              value={listToLines(draft.fileAreas)}
              onChange={(event) => onUpdateDraft({ ...draft, fileAreas: linesToList(event.currentTarget.value) })}
            />
          </label>

          <label>
            <span>Acceptance Criteria</span>
            <textarea
              rows={5}
              value={listToLines(draft.acceptanceCriteria)}
              onChange={(event) =>
                onUpdateDraft({ ...draft, acceptanceCriteria: linesToList(event.currentTarget.value) })
              }
            />
          </label>

          <label>
            <span>Validation Plan</span>
            <textarea
              rows={5}
              value={listToLines(draft.validationPlan)}
              onChange={(event) =>
                onUpdateDraft({ ...draft, validationPlan: linesToList(event.currentTarget.value) })
              }
            />
          </label>

          <label>
            <span>Risk</span>
            <select
              value={draft.risk}
              onChange={(event) =>
                onUpdateDraft({ ...draft, risk: event.currentTarget.value as PlanningDraft["risk"] })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            <span>Deploy Mode</span>
            <select
              value={draft.deployMode}
              onChange={(event) =>
                onUpdateDraft({ ...draft, deployMode: event.currentTarget.value as PlanningDraft["deployMode"] })
              }
            >
              <option value="dry-run">Dry run</option>
              <option value="staged">Staged</option>
              <option value="full">Full</option>
            </select>
          </label>

          <label className="wide-field">
            <span>Rollback Note</span>
            <textarea
              rows={3}
              value={draft.rollbackNote}
              onChange={(event) => onUpdateDraft({ ...draft, rollbackNote: event.currentTarget.value })}
            />
          </label>
        </form>

        <aside className="readiness-panel" aria-label="Planning readiness">
          <div className="readiness-score">
            <strong>{readiness.readiness}%</strong>
            <span>Ready</span>
          </div>

          <section>
            <h4>Missing Fields</h4>
            <div className="missing-list">
              {readiness.missingFieldIds.length === 0 ? (
                <span className="gate-chip gate-ready">Complete</span>
              ) : (
                readiness.missingFieldIds.map((fieldId) => (
                  <span className="gate-chip gate-review" key={fieldId}>
                    {missingFieldLabels[fieldId]}
                  </span>
                ))
              )}
            </div>
          </section>

          <section>
            <h4>Dispatch Package</h4>
            <dl className="draft-summary">
              <div>
                <dt>Mode</dt>
                <dd>{draft.deployMode}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{draft.risk}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>{draft.scope.length}</dd>
              </div>
              <div>
                <dt>Validation</dt>
                <dd>{draft.validationPlan.length}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h4>Staged Preview</h4>
            {stagedPackage ? (
              <pre className="dispatch-preview">{stagedMarkdown}</pre>
            ) : (
              <p className="empty-preview">
                Complete the draft, then stage it to generate the local dispatch package.
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function RightPanel({
  layoutCapacity,
  mode,
  modeHandoff,
  modeHandoffQa,
  mockRuns,
  onSelectRun,
  onUpdateRunStatus,
  project,
  registryEntry,
  registrySummary,
  runtimeAdapter,
  runtimeProfileSummary,
  runtimeSummary,
  selectedRun,
  focusedPanelId,
  onFocusPanel,
  sessions,
  tasks
}: {
  focusedPanelId?: string;
  layoutCapacity: CockpitLayoutCapacity;
  mode: CockpitMode;
  modeHandoff: CockpitModeHandoff;
  modeHandoffQa: CockpitModeHandoffQa;
  mockRuns: MockOrchestratorRun[];
  onFocusPanel: (panelId: string | undefined) => void;
  onSelectRun: (runId: string) => void;
  onUpdateRunStatus: (runId: string, nextStatus: MockRunStatus) => void;
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  registrySummary: ReturnType<typeof summarizeRegistry>;
  runtimeAdapter?: RuntimeAdapter;
  runtimeProfileSummary: ReturnType<typeof summarizeRuntimeProfiles>;
  runtimeSummary: ReturnType<typeof summarizeRuntimeAdapters>;
  selectedRun?: MockOrchestratorRun;
  sessions: SessionSummary[];
  tasks: OrchestrationTask[];
}) {
  const [streamPlaybackByRunId, setStreamPlaybackByRunId] = useState<
    Record<string, { cursor: number; state: RuntimeStreamPlaybackState }>
  >({});
  const [bridgeIntentByRunId, setBridgeIntentByRunId] = useState<Record<string, RuntimeAdapterBridgeIntent>>({});
  const [launchApprovalIntentByRunId, setLaunchApprovalIntentByRunId] = useState<
    Record<string, RuntimeLaunchApprovalIntent>
  >({});
  const [executionAuditHistory, setExecutionAuditHistory] = useState<RuntimeExecutionAuditRecord[]>(
    () => loadRuntimeExecutionAuditHistory()
  );
  const [toolEvidenceCaptureHistory, setToolEvidenceCaptureHistory] = useState<
    ToolEvidenceCaptureRecord[]
  >(() => loadToolEvidenceCaptureHistory());
  const [toolEvidenceCaptureIntent, setToolEvidenceCaptureIntent] =
    useState<ToolEvidenceCaptureIntent>("idle");
  const [desktopBridgeStatus, setDesktopBridgeStatus] = useState<DesktopRuntimeBridgeStatus>(
    () => getFallbackDesktopRuntimeBridgeStatus()
  );
  const [desktopPermissionApprovalStatus, setDesktopPermissionApprovalStatus] =
    useState<DesktopPermissionApprovalStatus>(() => getFallbackDesktopPermissionApprovalStatus());
  const [runtimeProfileDraft, setRuntimeProfileDraft] = useState<RuntimeProfile>(() =>
    loadRuntimeProfileDraft(createBlankRuntimeProfile({ adapterId: runtimeAdapter?.id ?? project.id }))
  );
  const [runtimeProfileApprovalIntent, setRuntimeProfileApprovalIntent] =
    useState<RuntimeProfileApprovalIntent>("idle");
  const [runtimeProfileApprovalHistory, setRuntimeProfileApprovalHistory] = useState<
    RuntimeProfileApprovalRecord[]
  >(() => loadRuntimeProfileApprovalHistory());
  const [runtimeProfileActivation, setRuntimeProfileActivation] = useState<
    RuntimeProfileActivationSnapshot | undefined
  >(() => loadRuntimeProfileActivation());
  const [runtimeProfilePermissionRequestHistory, setRuntimeProfilePermissionRequestHistory] =
    useState<RuntimeProfilePermissionRequestRecord[]>(() =>
      loadRuntimeProfilePermissionRequestHistory()
    );
  const [runtimeProfilePermissionRequestIntent, setRuntimeProfilePermissionRequestIntent] =
    useState<RuntimeProfilePermissionRequestIntent>(() =>
      latestPermissionRequestIntent(loadRuntimeProfilePermissionRequestHistory())
    );
  const blocked = sessions.filter((session) => session.state === "blocked").length;
  const complete = sessions.filter((session) => session.state === "complete").length;
  const taskSummary = summarizeTasks(tasks);
  const orchestrationDependencyReadiness: OrchestrationDependencyReadiness = useMemo(
    () => createOrchestrationDependencyReadiness(tasks),
    [tasks]
  );
  const orchestrationDispatchAudit: OrchestrationDispatchAudit = useMemo(
    () => createOrchestrationDispatchAudit(tasks),
    [tasks]
  );
  const orchestrationResultHandoffEvidence: OrchestrationResultHandoffEvidence = useMemo(
    () => createOrchestrationResultHandoffEvidence(tasks, mockRuns),
    [mockRuns, tasks]
  );
  const orchestrationAcceptanceCoverage: OrchestrationAcceptanceCoverage = useMemo(
    () => createOrchestrationAcceptanceCoverage(tasks, mockRuns),
    [mockRuns, tasks]
  );
  const runSummary = summarizeRunHistory(mockRuns);
  const milestoneStatusSummary = useMemo(
    () => summarizeMilestoneStatuses(steerboardMilestoneStatuses),
    []
  );
  const panelPriority = useMemo(
    () => createCockpitPanelPriority(sessions),
    [sessions]
  );
  const panelFocusTarget = useMemo(
    () => createCockpitPanelFocusTarget(sessions, panelPriority, focusedPanelId),
    [focusedPanelId, panelPriority, sessions]
  );
  const focusedStatus = useMemo(
    () => createCockpitFocusedPanelStatus(sessions, focusedPanelId),
    [focusedPanelId, sessions]
  );
  const toolbarFocusAction = useMemo(
    () => createCockpitToolbarFocusAction(panelFocusTarget, focusedStatus),
    [focusedStatus, panelFocusTarget]
  );
  const interactionReadiness: CockpitInteractionReadiness = useMemo(
    () =>
      createCockpitInteractionReadiness({
        focusedStatus,
        focusTarget: panelFocusTarget,
        layoutCapacity,
        modeHandoffQa,
        toolbarFocusAction
      }),
    [focusedStatus, layoutCapacity, modeHandoffQa, panelFocusTarget, toolbarFocusAction]
  );
  const latestRun = runSummary.latestRun;
  const selectedTimeline = useMemo(
    () => (selectedRun ? buildRunTimeline(selectedRun) : []),
    [selectedRun]
  );
  const localEvidenceReadinessSnapshot = useMemo(
    () => buildLocalEvidenceReadinessSnapshot(selectedRun),
    [selectedRun]
  );
  const toolEvidenceReadinessSnapshot = useMemo(
    () =>
      buildToolEvidenceReadinessSnapshot(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus,
        localEvidenceReadinessSnapshot
      ),
    [
      desktopBridgeStatus,
      desktopPermissionApprovalStatus,
      localEvidenceReadinessSnapshot
    ]
  );
  const timelineSummary = useMemo(
    () => summarizeRunTimeline(selectedTimeline),
    [selectedTimeline]
  );
  const adapterContractItems = useMemo(
    () => buildAdapterContract(runtimeAdapter),
    [runtimeAdapter]
  );
  const adapterContractSummary = useMemo(
    () => summarizeAdapterContract(adapterContractItems),
    [adapterContractItems]
  );
  const runtimeIngestionEvents = useMemo(
    () => buildRuntimeIngestionPreview(selectedTimeline, adapterContractItems),
    [adapterContractItems, selectedTimeline]
  );
  const runtimeIngestionSummary = useMemo(
    () => summarizeRuntimeIngestion(runtimeIngestionEvents),
    [runtimeIngestionEvents]
  );
  const streamPlayback = selectedRun ? streamPlaybackByRunId[selectedRun.id] : undefined;
  const runtimeStreamSnapshot = buildRuntimeStreamSnapshot(
    runtimeIngestionEvents,
    streamPlayback?.cursor ?? 0,
    streamPlayback?.state ?? "idle"
  );
  const cockpitMonitorSummary = buildCockpitMonitorSummary(
    selectedRun,
    timelineSummary,
    runtimeStreamSnapshot
  );
  const runtimeAdapterSessionSnapshot = buildRuntimeAdapterSessionSnapshot(
    runtimeAdapter,
    runtimeStreamSnapshot
  );
  const runtimeCoreEntryValidation: RuntimeCoreEntryValidation = useMemo(
    () =>
      createRuntimeCoreEntryValidation(
        runtimeAdapter,
        adapterContractItems,
        runtimeAdapterSessionSnapshot
      ),
    [adapterContractItems, runtimeAdapter, runtimeAdapterSessionSnapshot]
  );
  const runtimeEventSourceSnapshot = buildRuntimeEventSourceSnapshot(
    runtimeAdapterSessionSnapshot,
    runtimeStreamSnapshot,
    runtimeIngestionEvents
  );
  const cockpitMonitorNextEventPreview = useMemo(
    () => buildCockpitMonitorNextEventPreview(runtimeEventSourceSnapshot),
    [runtimeEventSourceSnapshot]
  );
  const cockpitMonitorHealth = useMemo(
    () => createCockpitMonitorHealth(runtimeStreamSnapshot),
    [runtimeStreamSnapshot]
  );
  const cockpitMonitorAttention = useMemo(
    () => createCockpitMonitorAttention(cockpitMonitorSummary, cockpitMonitorHealth),
    [cockpitMonitorHealth, cockpitMonitorSummary]
  );
  const cockpitMonitorQuality = useMemo(
    () => createCockpitMonitorQuality(runtimeStreamSnapshot),
    [runtimeStreamSnapshot]
  );
  const cockpitMonitorLoop = useMemo(
    () => createCockpitMonitorLoop(selectedRun),
    [selectedRun]
  );
  const runtimeSourceConnectionSnapshot = buildRuntimeSourceConnectionSnapshot(
    runtimeAdapter,
    runtimeEventSourceSnapshot
  );
  const bridgeIntent = selectedRun ? bridgeIntentByRunId[selectedRun.id] ?? "detached" : "detached";
  const runtimeAdapterBridgeSnapshot = buildRuntimeAdapterBridgeSnapshot(
    runtimeSourceConnectionSnapshot,
    runtimeStreamSnapshot,
    bridgeIntent
  );
  const runtimeLaunchRequestSnapshot = buildRuntimeLaunchRequestSnapshot(
    runtimeAdapterBridgeSnapshot,
    runtimeSourceConnectionSnapshot,
    runtimeEventSourceSnapshot
  );
  const launchApprovalIntent = selectedRun ? launchApprovalIntentByRunId[selectedRun.id] ?? "idle" : "idle";
  const runtimeLaunchApprovalSnapshot = buildRuntimeLaunchApprovalSnapshot(
    runtimeLaunchRequestSnapshot,
    launchApprovalIntent
  );
  const runtimeLaunchHandoffAcceptance: RuntimeLaunchHandoffAcceptance = useMemo(
    () =>
      createRuntimeLaunchHandoffAcceptance(
        runtimeEventSourceSnapshot,
        runtimeSourceConnectionSnapshot,
        runtimeLaunchRequestSnapshot,
        runtimeLaunchApprovalSnapshot
      ),
    [
      runtimeEventSourceSnapshot,
      runtimeLaunchApprovalSnapshot,
      runtimeLaunchRequestSnapshot,
      runtimeSourceConnectionSnapshot
    ]
  );
  const runtimeRecoveryFailureCoverage: RuntimeRecoveryFailureCoverage = useMemo(
    () =>
      createRuntimeRecoveryFailureCoverage(
        runtimeAdapter,
        runtimeEventSourceSnapshot,
        runtimeSourceConnectionSnapshot,
        runtimeLaunchRequestSnapshot,
        runtimeLaunchApprovalSnapshot,
        runtimeStreamSnapshot
      ),
    [
      runtimeAdapter,
      runtimeEventSourceSnapshot,
      runtimeLaunchApprovalSnapshot,
      runtimeLaunchRequestSnapshot,
      runtimeSourceConnectionSnapshot,
      runtimeStreamSnapshot
    ]
  );
  const runtimeExecutionAuditSnapshot = buildRuntimeExecutionAuditSnapshot(
    runtimeLaunchRequestSnapshot,
    runtimeLaunchApprovalSnapshot
  );
  const selectedRuntimeProfile = useMemo(
    () => selectRuntimeProfileForAdapter(runtimeProfiles, runtimeAdapter?.id ?? project.id),
    [project.id, runtimeAdapter?.id]
  );
  const selectedRuntimeProfileReadiness = useMemo(
    () =>
      selectedRuntimeProfile
        ? evaluateRuntimeProfileReadiness(selectedRuntimeProfile)
        : undefined,
    [selectedRuntimeProfile]
  );
  const runtimeProfileDraftReadiness = useMemo(
    () => evaluateRuntimeProfileReadiness(runtimeProfileDraft),
    [runtimeProfileDraft]
  );
  const runtimeProfileApprovalSnapshot = useMemo(
    () =>
      buildRuntimeProfileApprovalSnapshot(
        runtimeProfileDraft,
        runtimeProfileDraftReadiness,
        runtimeProfileApprovalIntent
      ),
    [runtimeProfileApprovalIntent, runtimeProfileDraft, runtimeProfileDraftReadiness]
  );
  const runtimeProfileActivationSnapshot = useMemo(
    () => buildRuntimeProfileActivationSnapshot(runtimeProfileDraft, runtimeProfileDraftReadiness),
    [runtimeProfileDraft, runtimeProfileDraftReadiness]
  );
  const runtimeProfilePermissionHandoffSnapshot = useMemo(
    () => buildRuntimeProfilePermissionHandoffSnapshot(runtimeProfileActivation, desktopBridgeStatus),
    [desktopBridgeStatus, runtimeProfileActivation]
  );
  const runtimeProfilePermissionApprovalSnapshot = useMemo(
    () =>
      buildRuntimeProfilePermissionApprovalSnapshot(
        runtimeProfilePermissionHandoffSnapshot,
        runtimeProfilePermissionRequestIntent
      ),
    [runtimeProfilePermissionHandoffSnapshot, runtimeProfilePermissionRequestIntent]
  );
  const runtimeProfilePermissionAuditSnapshot = useMemo(
    () =>
      buildRuntimeProfilePermissionAuditSnapshot(
        runtimeProfilePermissionApprovalSnapshot,
        desktopPermissionApprovalStatus,
        runtimeProfilePermissionRequestHistory
      ),
    [
      desktopPermissionApprovalStatus,
      runtimeProfilePermissionApprovalSnapshot,
      runtimeProfilePermissionRequestHistory
    ]
  );
  const securityPrivacyThreatModel = useMemo(
    () =>
      createSecurityPrivacyThreatModel(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus,
        localEvidenceReadinessSnapshot,
        toolEvidenceReadinessSnapshot,
        runtimeProfilePermissionApprovalSnapshot,
        runtimeProfilePermissionAuditSnapshot
      ),
    [
      desktopBridgeStatus,
      desktopPermissionApprovalStatus,
      localEvidenceReadinessSnapshot,
      runtimeProfilePermissionApprovalSnapshot,
      runtimeProfilePermissionAuditSnapshot,
      toolEvidenceReadinessSnapshot
    ]
  );
  const releasePrivacyReadinessSnapshot = useMemo(
    () =>
      createReleasePrivacyReadiness(securityPrivacyThreatModel, {
        localFirstDefaultsReady: true,
        dependencyReviewReady: "ready",
        publicFixtureReady: true,
        realProjectDataReady: "ready",
        runtimeAdapterEdgeCasesReady: "ready",
        auditExportReviewReady: "ready"
      }),
    [securityPrivacyThreatModel]
  );
  const releasePrivacyItemStatus = useMemo(
    () =>
      new Map(
        releasePrivacyReadinessSnapshot.items.map((item) => [
          item.label,
          item.status
        ])
      ),
    [releasePrivacyReadinessSnapshot]
  );
  const securityAcceptanceCoverageSnapshot = useMemo(
    () =>
      createSecurityAcceptanceCoverage({
        hasSelectedRun: Boolean(selectedRun),
        selectedRunStatus: selectedRun?.status,
        releasePrivacyState: releasePrivacyReadinessSnapshot.state,
        releasePrivacyReadiness: releasePrivacyReadinessSnapshot.readiness,
        realProjectDataReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Sensitive data boundary")
        ),
        runtimeAdapterEdgesReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Permission and execution lock")
        ),
        auditReviewReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Audit and export trail")
        )
      }),
    [releasePrivacyItemStatus, releasePrivacyReadinessSnapshot, selectedRun]
  );
  const securityAcceptanceRepeatedRunsSnapshot = useMemo(
    () =>
      createSecurityAcceptanceRepeatedRuns(
        mockRuns.map((run) =>
          createSecurityAcceptanceCoverage({
            hasSelectedRun: true,
            selectedRunStatus: run.status,
            releasePrivacyState: releasePrivacyReadinessSnapshot.state,
            releasePrivacyReadiness: releasePrivacyReadinessSnapshot.readiness,
            realProjectDataReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Sensitive data boundary")
            ),
            runtimeAdapterEdgesReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Permission and execution lock")
            ),
            auditReviewReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Audit and export trail")
            )
          })
        ),
        { requiredRunCount: 3 }
      ),
    [mockRuns, releasePrivacyItemStatus, releasePrivacyReadinessSnapshot]
  );
  const desktopPackagingReadinessSnapshot = useMemo(
    () =>
      buildDesktopPackagingReadinessSnapshot(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus
      ),
    [desktopBridgeStatus, desktopPermissionApprovalStatus]
  );
  const securityFinalReviewSnapshot = useMemo(
    () =>
      createSecurityFinalReview({
        releasePrivacy: releasePrivacyReadinessSnapshot,
        currentAcceptance: securityAcceptanceCoverageSnapshot,
        repeatedRuns: securityAcceptanceRepeatedRunsSnapshot,
        packagingPaused: true,
        packagingLocked: desktopPackagingReadinessSnapshot.packagingLocked
      }),
    [
      desktopPackagingReadinessSnapshot.packagingLocked,
      releasePrivacyReadinessSnapshot,
      securityAcceptanceCoverageSnapshot,
      securityAcceptanceRepeatedRunsSnapshot
    ]
  );
  const canActivateDraftProfile =
    runtimeProfileApprovalSnapshot.state === "requested" &&
    canActivateRuntimeProfile(runtimeProfileDraftReadiness);
  const cockpitMonitorControlState = buildCockpitMonitorControlState({
    canAttachSource: runtimeAdapterBridgeSnapshot.canAttach,
    canStream: runtimeAdapterBridgeSnapshot.canStream,
    cursor: runtimeStreamSnapshot.cursor,
    eventCount: runtimeIngestionEvents.length,
    hasRun: Boolean(selectedRun),
    isSourceAttached: runtimeAdapterBridgeSnapshot.attached,
    streamState: runtimeStreamSnapshot.state
  });
  const canStartStream = cockpitMonitorControlState.canStart;
  const canPauseStream = cockpitMonitorControlState.canPause;
  const canResetStream = cockpitMonitorControlState.canReset;
  const recentEventFeed = buildCockpitMonitorEventFeed(runtimeStreamSnapshot);
  const cockpitMonitorDepth = useMemo(
    () =>
      createCockpitMonitorDepth(
        cockpitMonitorSummary,
        cockpitMonitorQuality,
        cockpitMonitorLoop,
        recentEventFeed
      ),
    [cockpitMonitorLoop, cockpitMonitorQuality, cockpitMonitorSummary, recentEventFeed]
  );
  const cockpitAcceptancePass: CockpitAcceptancePass = useMemo(
    () =>
      createCockpitAcceptancePass({
        interactionReadiness,
        modeHandoffQa,
        monitorDepth: cockpitMonitorDepth
      }),
    [cockpitMonitorDepth, interactionReadiness, modeHandoffQa]
  );

  useEffect(() => {
    if (!selectedRun || runtimeStreamSnapshot.state !== "streaming") {
      return;
    }

    const timer = window.setInterval(() => {
      setStreamPlaybackByRunId((current) => {
        const playback = current[selectedRun.id] ?? { cursor: 0, state: "streaming" };
        const nextPosition = nextRuntimeStreamPosition(playback.cursor, runtimeIngestionEvents.length);
        const nextSnapshot = buildRuntimeStreamSnapshot(
          runtimeIngestionEvents,
          nextPosition,
          "streaming"
        );

        return {
          ...current,
          [selectedRun.id]: {
            cursor: nextPosition,
            state: nextSnapshot.state
          }
        };
      });
    }, streamIntervalMs);

    return () => window.clearInterval(timer);
  }, [runtimeIngestionEvents, runtimeStreamSnapshot.state, selectedRun]);

  useEffect(() => {
    saveRuntimeExecutionAuditHistory(executionAuditHistory);
  }, [executionAuditHistory]);

  useEffect(() => {
    saveToolEvidenceCaptureHistory(toolEvidenceCaptureHistory);
  }, [toolEvidenceCaptureHistory]);

  useEffect(() => {
    saveRuntimeProfileDraft(runtimeProfileDraft);
  }, [runtimeProfileDraft]);

  useEffect(() => {
    saveRuntimeProfileApprovalHistory(runtimeProfileApprovalHistory);
  }, [runtimeProfileApprovalHistory]);

  useEffect(() => {
    saveRuntimeProfileActivation(runtimeProfileActivation);
  }, [runtimeProfileActivation]);

  useEffect(() => {
    saveRuntimeProfilePermissionRequestHistory(runtimeProfilePermissionRequestHistory);
  }, [runtimeProfilePermissionRequestHistory]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadDesktopRuntimeBridgeStatus(),
      loadDesktopPermissionApprovalStatus()
    ]).then(([bridgeStatus, permissionApprovalStatus]) => {
      if (isMounted) {
        setDesktopBridgeStatus(bridgeStatus);
        setDesktopPermissionApprovalStatus(permissionApprovalStatus);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateStreamPlayback(state: RuntimeStreamPlaybackState, cursor = runtimeStreamSnapshot.cursor) {
    if (!selectedRun) {
      return;
    }

    setStreamPlaybackByRunId((current) => ({
      ...current,
      [selectedRun.id]: { cursor, state }
    }));
  }

  function updateBridgeIntent(intent: RuntimeAdapterBridgeIntent) {
    if (!selectedRun) {
      return;
    }

    setBridgeIntentByRunId((current) => ({
      ...current,
      [selectedRun.id]: intent
    }));

    if (intent === "detached" && runtimeStreamSnapshot.state === "streaming") {
      updateStreamPlayback("paused");
    }
  }

  function updateLaunchApprovalIntent(intent: RuntimeLaunchApprovalIntent) {
    if (!selectedRun) {
      return;
    }

    setLaunchApprovalIntentByRunId((current) => ({
      ...current,
      [selectedRun.id]: intent
    }));
  }

  function recordLaunchApprovalAction(
    action: RuntimeExecutionAuditRecordAction,
    nextIntent: RuntimeLaunchApprovalIntent
  ) {
    if (!selectedRun) {
      return;
    }

    const record = createRuntimeExecutionAuditRecord(
      runtimeExecutionAuditSnapshot,
      action,
      new Date().toISOString()
    );

    setExecutionAuditHistory((current) => appendRuntimeExecutionAuditRecord(current, record));
    updateLaunchApprovalIntent(nextIntent);
  }

  function recordToolEvidenceCaptureAction(
    action: ToolEvidenceCaptureRecordAction,
    nextIntent: ToolEvidenceCaptureIntent
  ) {
    const record = createToolEvidenceCaptureRecord(
      toolEvidenceReadinessSnapshot,
      action,
      new Date().toISOString()
    );

    setToolEvidenceCaptureHistory((current) =>
      appendToolEvidenceCaptureRecord(current, record)
    );
    setToolEvidenceCaptureIntent(nextIntent);
  }

  function updateRuntimeProfileDraft(nextDraft: Partial<RuntimeProfile>) {
    setRuntimeProfileDraft((current) => ({
      ...current,
      ...nextDraft
    }));
  }

  function resetRuntimeProfileDraft() {
    setRuntimeProfileApprovalIntent("idle");
    setRuntimeProfileDraft(
      createBlankRuntimeProfile({
        adapterId: runtimeAdapter?.id ?? project.id
      })
    );
  }

  function recordRuntimeProfileApprovalAction(
    action: RuntimeProfileApprovalRecordAction,
    nextIntent: RuntimeProfileApprovalIntent
  ) {
    const record = createRuntimeProfileApprovalRecord(
      runtimeProfileApprovalSnapshot,
      action,
      new Date().toISOString()
    );

    setRuntimeProfileApprovalHistory((current) => appendRuntimeProfileApprovalRecord(current, record));
    setRuntimeProfileApprovalIntent(nextIntent);
  }

  function activateRuntimeProfileDraft() {
    if (!canActivateDraftProfile) {
      return;
    }

    setRuntimeProfileActivation(
      createRuntimeProfileActivationRecord(
        runtimeProfileDraft,
        runtimeProfileDraftReadiness,
        new Date().toISOString()
      )
    );
    setRuntimeProfileApprovalIntent("idle");
  }

  function recordRuntimeProfilePermissionRequestAction(
    action: RuntimeProfilePermissionRequestAction,
    nextIntent: RuntimeProfilePermissionRequestIntent
  ) {
    const record = createRuntimeProfilePermissionRequestRecord(
      runtimeProfilePermissionHandoffSnapshot,
      action,
      new Date().toISOString()
    );

    setRuntimeProfilePermissionRequestHistory((current) =>
      appendRuntimeProfilePermissionRequestRecord(current, record)
    );
    setRuntimeProfilePermissionRequestIntent(nextIntent);
  }

  return (
    <aside className="right-panel" aria-label="Environment">
      <header>
        <div>
          <span className="eyebrow">Environment</span>
          <h3>{project.name}</h3>
        </div>
        <button aria-label="Collapse environment panel" title="Panel" type="button">
          <PanelRight size={17} />
        </button>
      </header>

      <CockpitMonitorStrip
        attention={cockpitMonitorAttention}
        controls={cockpitMonitorControlState}
        depth={cockpitMonitorDepth}
        health={cockpitMonitorHealth}
        loop={cockpitMonitorLoop}
        nextEventPreview={cockpitMonitorNextEventPreview}
        quality={cockpitMonitorQuality}
        recentEventFeed={recentEventFeed}
        onAttach={() => updateBridgeIntent("attached")}
        onPause={() => updateStreamPlayback("paused")}
        onReset={() => updateStreamPlayback("idle", 0)}
        onStart={() => updateStreamPlayback("streaming")}
        summary={cockpitMonitorSummary}
      />

      <section className="panel-section">
        <h4>Progress</h4>
        <div className="metric-grid">
          <div>
            <strong>{sessions.length}</strong>
            <span>Panels</span>
          </div>
          <div>
            <strong>{complete}</strong>
            <span>Done</span>
          </div>
          <div>
            <strong>{blocked}</strong>
            <span>Blocked</span>
          </div>
        </div>
      </section>

      <PanelPrioritySignal
        focusTarget={panelFocusTarget}
        onClearFocus={() => onFocusPanel(undefined)}
        onFocus={() => onFocusPanel(panelFocusTarget.panelId)}
        priority={panelPriority}
      />

      <MilestoneStatusPanel
        milestones={steerboardMilestoneStatuses}
        summary={milestoneStatusSummary}
      />

      <section className="panel-section">
        <h4>Mode</h4>
        <div
          aria-label={modeHandoff.ariaLabel}
          className={classNames("mode-handoff", `mode-handoff-${modeHandoff.tone}`)}
          title={modeHandoff.detail}
        >
          <div className="mode-handoff-route">
            <span>
              <Workflow size={14} />
              {modeHandoff.currentModeLabel}
            </span>
            <b aria-hidden="true">to</b>
            <span>{modeHandoff.nextModeLabel}</span>
          </div>
          <p>{modeHandoff.detail}</p>
          <dl className="mode-handoff-metrics">
            <div>
              <dt>Current</dt>
              <dd>{modeHandoff.currentLayoutLabel}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{modeHandoff.nextLayoutLabel}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd title={modeHandoff.preservedLabel}>{modeHandoff.preservedLabel}</dd>
            </div>
          </dl>
        </div>
        <div
          aria-label={modeHandoffQa.ariaLabel}
          className={classNames("mode-handoff-qa", `mode-handoff-qa-${modeHandoffQa.tone}`)}
          title={modeHandoffQa.detail}
        >
          <div className="mode-handoff-qa-header">
            <strong>{modeHandoffQa.label}</strong>
            <b>{modeHandoffQa.checkLabel}</b>
          </div>
          <p>{modeHandoffQa.detail}</p>
          <div className="mode-handoff-qa-checks" aria-label="Mode handoff QA checks">
            {modeHandoffQa.checks.map((check) => (
              <span
                className={classNames("mode-handoff-qa-check", `mode-handoff-qa-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={interactionReadiness.ariaLabel}
          className={classNames("interaction-readiness", `interaction-readiness-${interactionReadiness.tone}`)}
          title={interactionReadiness.detail}
        >
          <div className="interaction-readiness-header">
            <strong>{interactionReadiness.label}</strong>
            <b>{interactionReadiness.checkLabel}</b>
          </div>
          <p>{interactionReadiness.detail}</p>
          <div className="interaction-readiness-checks" aria-label="Cockpit interaction readiness checks">
            {interactionReadiness.checks.map((check) => (
              <span
                className={classNames("interaction-readiness-check", `interaction-readiness-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={cockpitAcceptancePass.ariaLabel}
          className={classNames("cockpit-acceptance", `cockpit-acceptance-${cockpitAcceptancePass.tone}`)}
          title={cockpitAcceptancePass.detail}
        >
          <div className="cockpit-acceptance-header">
            <strong>{cockpitAcceptancePass.label}</strong>
            <b>{cockpitAcceptancePass.checkLabel}</b>
          </div>
          <p>{cockpitAcceptancePass.detail}</p>
          <div className="cockpit-acceptance-checks" aria-label="Cockpit final acceptance gates">
            {cockpitAcceptancePass.checks.map((check) => (
              <span
                className={classNames("cockpit-acceptance-check", `cockpit-acceptance-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h4>Orchestration</h4>
        <div className="orchestration-summary">
          <span>
            <strong>{taskSummary.total}</strong>
            Tasks
          </span>
          <span>
            <strong>{taskSummary.accepted}</strong>
            Accepted
          </span>
          <span>
            <strong>{taskSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        <div
          aria-label={orchestrationDependencyReadiness.ariaLabel}
          className={classNames(
            "orchestration-readiness",
            `orchestration-readiness-${orchestrationDependencyReadiness.tone}`
          )}
          title={orchestrationDependencyReadiness.detail}
        >
          <div className="orchestration-readiness-header">
            <strong>{orchestrationDependencyReadiness.label}</strong>
            <b>{orchestrationDependencyReadiness.checkLabel}</b>
          </div>
          <p>{orchestrationDependencyReadiness.detail}</p>
          <div className="orchestration-readiness-checks" aria-label="Orchestration dependency readiness checks">
            {orchestrationDependencyReadiness.checks.map((check) => (
              <span
                className={classNames("orchestration-readiness-check", `orchestration-readiness-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationDispatchAudit.ariaLabel}
          className={classNames(
            "orchestration-dispatch-audit",
            `orchestration-dispatch-audit-${orchestrationDispatchAudit.tone}`
          )}
          title={orchestrationDispatchAudit.detail}
        >
          <div className="orchestration-dispatch-audit-header">
            <strong>{orchestrationDispatchAudit.label}</strong>
            <b>{orchestrationDispatchAudit.checkLabel}</b>
          </div>
          <p>{orchestrationDispatchAudit.detail}</p>
          <div
            className="orchestration-dispatch-audit-checks"
            aria-label="Orchestration dispatch audit checks"
          >
            {orchestrationDispatchAudit.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-dispatch-audit-check",
                  `orchestration-dispatch-audit-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationResultHandoffEvidence.ariaLabel}
          className={classNames(
            "orchestration-result-handoff",
            `orchestration-result-handoff-${orchestrationResultHandoffEvidence.tone}`
          )}
          title={orchestrationResultHandoffEvidence.detail}
        >
          <div className="orchestration-result-handoff-header">
            <strong>{orchestrationResultHandoffEvidence.label}</strong>
            <b>{orchestrationResultHandoffEvidence.checkLabel}</b>
          </div>
          <p>{orchestrationResultHandoffEvidence.detail}</p>
          <div
            className="orchestration-result-handoff-checks"
            aria-label="Orchestration result handoff evidence checks"
          >
            {orchestrationResultHandoffEvidence.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-result-handoff-check",
                  `orchestration-result-handoff-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationAcceptanceCoverage.ariaLabel}
          className={classNames(
            "orchestration-acceptance-coverage",
            `orchestration-acceptance-coverage-${orchestrationAcceptanceCoverage.tone}`
          )}
          title={orchestrationAcceptanceCoverage.detail}
        >
          <div className="orchestration-acceptance-coverage-header">
            <strong>{orchestrationAcceptanceCoverage.label}</strong>
            <b>{orchestrationAcceptanceCoverage.checkLabel}</b>
          </div>
          <p>{orchestrationAcceptanceCoverage.detail}</p>
          <div
            className="orchestration-acceptance-coverage-checks"
            aria-label="Orchestration acceptance coverage checks"
          >
            {orchestrationAcceptanceCoverage.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-acceptance-coverage-check",
                  `orchestration-acceptance-coverage-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h4>Mock Runs</h4>
        <div className="registry-detail">
          <span>
            <strong>{runSummary.total}</strong>
            Local staged runs
          </span>
          <span>
            <strong>{latestRun?.status ?? "none"}</strong>
            Latest status
          </span>
          <span>
            <strong>{runSummary.countsByStatus.queued + runSummary.countsByStatus.running}</strong>
            Open runs
          </span>
        </div>

        {mockRuns.length > 0 ? (
          <>
            <div className="run-history-list" aria-label="Local mock run history">
              {mockRuns.slice(0, 4).map((run) => (
                <button
                  aria-pressed={selectedRun?.id === run.id}
                  className={classNames("run-history-button", selectedRun?.id === run.id && "is-selected")}
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  type="button"
                >
                  <span>
                    <strong title={run.title}>{run.title}</strong>
                    <small>{formatShortDate(run.createdAt)}</small>
                  </span>
                  <span className={classNames("run-status", `run-${run.status}`)}>{run.status}</span>
                </button>
              ))}
            </div>

            {selectedRun ? (
              <>
                <div className="run-control-grid" aria-label="Selected mock run lifecycle controls">
                  {runLifecycleActions.map((action) => (
                    <button
                      aria-label={`${action.label} selected mock run`}
                      className={classNames(
                        "run-control-button",
                        `control-${action.status}`,
                        selectedRun.status === action.status && "is-active"
                      )}
                      disabled={selectedRun.status === action.status}
                      key={action.status}
                      onClick={() => onUpdateRunStatus(selectedRun.id, action.status)}
                      title={`${action.label} run`}
                      type="button"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>

                <dl className="run-detail" aria-label="Selected mock run detail">
                  <div>
                    <dt>Source package</dt>
                    <dd title={selectedRun.sourcePackageId}>{selectedRun.sourcePackageId}</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{selectedRun.tasks.length}</dd>
                  </div>
                  <div>
                    <dt>Panels</dt>
                    <dd>{selectedRun.sessions.length}</dd>
                  </div>
                  <div>
                    <dt>Validation gates</dt>
                    <dd>{selectedRun.validationGates.length}</dd>
                  </div>
                </dl>

                <section className="run-timeline" aria-label="Selected mock run event timeline">
                  <div className="timeline-summary" aria-label="Timeline summary">
                    <span>
                      <strong>{timelineSummary.activeCount}</strong>
                      Active
                    </span>
                    <span>
                      <strong>{timelineSummary.issueCount}</strong>
                      Issues
                    </span>
                    <span>
                      <strong>{timelineSummary.completeCount}</strong>
                      Done
                    </span>
                  </div>

                  <ol className="timeline-list">
                    {selectedTimeline.map((event) => (
                      <RunTimelineItem event={event} key={event.id} />
                    ))}
                  </ol>
                </section>
              </>
            ) : null}
          </>
        ) : (
          <p className="empty-preview">Stage a complete planning draft to create a local cockpit run.</p>
        )}
      </section>

      <LocalEvidenceReadinessPanel evidence={localEvidenceReadinessSnapshot} />
      <ToolEvidenceReadinessPanel
        captureHistory={toolEvidenceCaptureHistory}
        captureIntent={toolEvidenceCaptureIntent}
        onCancelCapture={() => recordToolEvidenceCaptureAction("cancelled", "idle")}
        onRequestCapture={() => recordToolEvidenceCaptureAction("requested", "requested")}
        tools={toolEvidenceReadinessSnapshot}
      />
      <SecurityPrivacyThreatModelPanel
        acceptance={securityAcceptanceCoverageSnapshot}
        finalReview={securityFinalReviewSnapshot}
        model={securityPrivacyThreatModel}
        releasePrivacy={releasePrivacyReadinessSnapshot}
        repeatedRuns={securityAcceptanceRepeatedRunsSnapshot}
      />

      <section className="panel-section">
        <h4>Project Registry</h4>
        <div className="registry-detail">
          <span>
            <strong>{registryEntry?.workspaceLabel ?? "Unregistered workspace"}</strong>
            Workspace
          </span>
          <span>
            <strong>{registryEntry?.readiness ?? 0}%</strong>
            Registry readiness
          </span>
          <span>
            <strong>{registrySummary.byStatus.active}/{registrySummary.total}</strong>
            Active projects
          </span>
        </div>
      </section>

      <section className="panel-section">
        <h4>Runtime</h4>
        <div className="runtime-detail">
          <span className={classNames("runtime-pill", runtimeAdapter && `runtime-${runtimeAdapter.state}`)}>
            {runtimeAdapter ? runtimeStateLabel(runtimeAdapter.state) : "Missing"}
          </span>
          <span>{runtimeAdapter?.readiness ?? 0}% readiness</span>
          <span>{runtimeSummary.ready}/{runtimeSummary.total} ready</span>
        </div>
        <div
          aria-label={runtimeCoreEntryValidation.ariaLabel}
          className={classNames(
            "runtime-core-entry-validation",
            `runtime-core-entry-${runtimeCoreEntryValidation.tone}`
          )}
          title={runtimeCoreEntryValidation.detail}
        >
          <div className="runtime-core-entry-header">
            <strong>{runtimeCoreEntryValidation.label}</strong>
            <b>{runtimeCoreEntryValidation.checkLabel}</b>
          </div>
          <p>{runtimeCoreEntryValidation.detail}</p>
          <div className="runtime-core-entry-checks" aria-label="Runtime core entry validation checks">
            {runtimeCoreEntryValidation.checks.map((check) => (
              <span
                className={classNames(
                  "runtime-core-entry-check",
                  `runtime-core-entry-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <DesktopPackagingReadinessPanel packaging={desktopPackagingReadinessSnapshot} />

      <RuntimeProfilePanel
        activation={runtimeProfileActivationSnapshot}
        activeProfile={runtimeProfileActivation}
        approval={runtimeProfileApprovalSnapshot}
        canActivateDraft={canActivateDraftProfile}
        draft={runtimeProfileDraft}
        draftReadiness={runtimeProfileDraftReadiness}
        history={runtimeProfileApprovalHistory}
        onActivateDraftProfile={activateRuntimeProfileDraft}
        onCancelDraftApproval={() => recordRuntimeProfileApprovalAction("cancelled", "idle")}
        onClearActiveProfile={() => setRuntimeProfileActivation(undefined)}
        onDraftChange={updateRuntimeProfileDraft}
        onCancelPermissionRequest={() =>
          recordRuntimeProfilePermissionRequestAction("cancelled", "idle")
        }
        onRequestDraftApproval={() => recordRuntimeProfileApprovalAction("requested", "requested")}
        onRequestPermission={() =>
          recordRuntimeProfilePermissionRequestAction("requested", "requested")
        }
        onResetDraft={resetRuntimeProfileDraft}
        permissionApproval={runtimeProfilePermissionApprovalSnapshot}
        permissionApprovalStatus={desktopPermissionApprovalStatus}
        permissionAudit={runtimeProfilePermissionAuditSnapshot}
        permissionHandoff={runtimeProfilePermissionHandoffSnapshot}
        permissionRequestHistory={runtimeProfilePermissionRequestHistory}
        permissionRequestIntent={runtimeProfilePermissionRequestIntent}
        profile={selectedRuntimeProfile}
        readiness={selectedRuntimeProfileReadiness}
        summary={runtimeProfileSummary}
      />

      <section className="panel-section">
        <h4>Adapter Contract</h4>
        <div className="adapter-contract-summary" aria-label="Adapter contract summary">
          <span>
            <strong>{adapterContractSummary.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{adapterContractSummary.review}</strong>
            Review
          </span>
          <span>
            <strong>{adapterContractSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        <ol className="adapter-contract-list" aria-label="Adapter contract items">
          {adapterContractItems.map((item) => (
            <AdapterContractListItem item={item} key={item.id} />
          ))}
        </ol>
      </section>

      <section className="panel-section">
        <h4>Runtime Ingestion</h4>
        <div className="ingestion-summary" aria-label="Runtime ingestion summary">
          <span>
            <strong>{runtimeIngestionSummary.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{runtimeIngestionSummary.accepted}</strong>
            Accepted
          </span>
          <span>
            <strong>{runtimeIngestionSummary.review}</strong>
            Review
          </span>
          <span>
            <strong>{runtimeIngestionSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        {runtimeIngestionEvents.length > 0 ? (
          <ol className="ingestion-list" aria-label="Runtime ingestion preview">
            {runtimeIngestionEvents.map((event) => (
              <RuntimeIngestionListItem event={event} key={event.id} />
            ))}
          </ol>
        ) : (
          <p className="empty-preview">Select or stage a local run to preview adapter event ingestion.</p>
        )}
      </section>

      <section className="panel-section">
        <h4>Runtime Stream</h4>
        <RuntimeAdapterSessionStatus snapshot={runtimeAdapterSessionSnapshot} />
        <RuntimeEventSourceStatus
          approval={runtimeLaunchApprovalSnapshot}
          bridge={runtimeAdapterBridgeSnapshot}
          connection={runtimeSourceConnectionSnapshot}
          desktopBridge={desktopBridgeStatus}
          executionAudit={runtimeExecutionAuditSnapshot}
          executionAuditHistory={executionAuditHistory}
          handoffAcceptance={runtimeLaunchHandoffAcceptance}
          launchRequest={runtimeLaunchRequestSnapshot}
          onAttach={() => updateBridgeIntent("attached")}
          onCancelApproval={() => recordLaunchApprovalAction("cancelled", "idle")}
          onDetach={() => updateBridgeIntent("detached")}
          onRequestApproval={() => recordLaunchApprovalAction("requested", "requested")}
          recoveryCoverage={runtimeRecoveryFailureCoverage}
          snapshot={runtimeEventSourceSnapshot}
        />
        <div className="stream-status-row">
          <span className={classNames("stream-state", `stream-${runtimeStreamSnapshot.state}`)}>
            <span aria-hidden="true" />
            {streamStateLabels[runtimeStreamSnapshot.state]}
          </span>
          <span>
            {runtimeStreamSnapshot.emitted}/{runtimeStreamSnapshot.total} emitted
          </span>
        </div>
        <div className="stream-summary" aria-label="Runtime stream summary">
          <span>
            <strong>{runtimeStreamSnapshot.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.pending}</strong>
            Pending
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.review}</strong>
            Review
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.blocked}</strong>
            Blocked
          </span>
        </div>
        <div className="stream-control-grid" aria-label="Runtime stream controls">
          <button
            aria-label="Start runtime stream preview"
            disabled={!canStartStream}
            onClick={() => updateStreamPlayback("streaming")}
            title="Start stream"
            type="button"
          >
            <Play size={14} />
            <span>Start</span>
          </button>
          <button
            aria-label="Pause runtime stream preview"
            disabled={!canPauseStream}
            onClick={() => updateStreamPlayback("paused")}
            title="Pause stream"
            type="button"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>
          <button
            aria-label="Reset runtime stream preview"
            disabled={!canResetStream}
            onClick={() => updateStreamPlayback("idle", 0)}
            title="Reset stream"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
        {runtimeStreamSnapshot.latestEvent ? (
          <RuntimeStreamPreview snapshot={runtimeStreamSnapshot} />
        ) : (
          <p className="empty-preview">Start the local stream to watch projected adapter events emit here.</p>
        )}
      </section>

      <section className="panel-section">
        <h4>Local Access</h4>
        <ul className="access-list">
          {permissionSurfaces.map((surface) => (
            <PermissionItem key={surface.id} surface={surface} />
          ))}
        </ul>
      </section>

      <section className="panel-section">
        <h4>Validation</h4>
        <ol className="validation-list">
          {sessions.slice(0, 4).map((session) => (
            <li key={session.id}>
              <span className={classNames("mini-dot", `state-${session.state}`)} />
              <span>{session.validation}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}

function CockpitMonitorStrip({
  attention,
  controls,
  depth,
  health,
  loop,
  nextEventPreview,
  quality,
  recentEventFeed,
  onAttach,
  onPause,
  onReset,
  onStart,
  summary
}: {
  attention: CockpitMonitorAttention;
  controls: CockpitMonitorControlState;
  depth: CockpitMonitorDepth;
  health: CockpitMonitorHealth;
  loop: CockpitMonitorLoop;
  nextEventPreview: CockpitMonitorNextEventPreview;
  quality: CockpitMonitorQuality;
  recentEventFeed: CockpitMonitorEventFeedItem[];
  onAttach: () => void;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
  summary: CockpitMonitorSummary;
}) {
  const latestEventCue = `${summary.latestEventLabel} ${summary.latestEventStatus}`.trim();
  const latestEventDetail = `${latestEventCue}. ${summary.latestEventDetail}`;
  const hasRecentEvents = recentEventFeed.length > 0;
  const streamProgressPercent = Math.max(
    0,
    Math.min(100, Number(summary.streamProgressPercent) || 0)
  );
  const nextEventDetailAriaLabel = nextEventPreview.hasNext
    ? `Next queued local event ${nextEventPreview.sequenceLabel}: ${nextEventPreview.label}`
    : "Next queued local event: none queued";
  const depthSignalValue = depth.signalLabel.replace(/\s+signals$/i, "");
  const depthEventValue = depth.eventLabel.replace(/\s+recent$/i, "");
  const depthGateValue = depth.gateLabel.replace(/\s+gates$/i, "");

  return (
    <section className="monitor-strip" aria-label="Cockpit monitor summary">
      <div className="monitor-strip-header">
        <div>
          <span className="eyebrow">Monitor</span>
          <strong title={summary.runLabel}>{summary.runLabel}</strong>
        </div>
        <span className={classNames("monitor-state", `monitor-${summary.runState}`)}>
          {summary.runState}
        </span>
      </div>
      <p title={summary.detail}>{summary.detail}</p>
      <div
        className={classNames("monitor-health-row", `monitor-health-${health.tone}`)}
        title={health.detail}
      >
        <span aria-hidden="true" />
        <strong>{health.stateLabel}</strong>
        <small>{health.detail}</small>
        <b aria-label={`Stream heartbeat ${health.pulseLabel}`}>{health.pulseLabel}</b>
      </div>
      <div
        aria-label={`Operator attention: ${attention.label}`}
        className={classNames("monitor-attention-row", `monitor-attention-${attention.tone}`)}
        title={attention.detail}
      >
        <strong>{attention.label}</strong>
        <small>{attention.detail}</small>
        <b>{attention.actionLabel}</b>
      </div>
      <div
        aria-label={`Stream quality: ${quality.label}`}
        className={classNames("monitor-quality-row", `monitor-quality-${quality.tone}`)}
        title={quality.detail}
      >
        <div className="monitor-quality-copy">
          <strong>{quality.label}</strong>
          <small>{quality.detail}</small>
        </div>
        <b className="monitor-quality-readiness">{quality.readinessLabel}</b>
        <div className="monitor-quality-metrics" aria-label="Stream quality metrics">
          {quality.metrics.map((metric) => (
            <span
              className={classNames("monitor-quality-metric", `monitor-quality-metric-${metric.tone}`)}
              key={metric.label}
              title={`${metric.label}: ${metric.value}`}
            >
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
            </span>
          ))}
        </div>
      </div>
      <div
        aria-label={`Loop validation: ${loop.label}`}
        className={classNames("monitor-loop-row", `monitor-loop-${loop.tone}`)}
        title={loop.detail}
      >
        <div className="monitor-loop-copy">
          <strong>{loop.label}</strong>
          <small>{loop.detail}</small>
        </div>
        <div className="monitor-loop-metrics" aria-label="Loop validation metrics">
          <span>
            <strong>{loop.attemptLabel}</strong>
            <small>Attempt</small>
          </span>
          <span>
            <strong>{loop.gateLabel}</strong>
            <small>Gates</small>
          </span>
          <span>
            <strong>{loop.workerLabel}</strong>
            <small>Panels</small>
          </span>
        </div>
      </div>
      <div
        aria-label={`Monitoring depth: ${depth.label}, ${depth.scoreValue}`}
        className={classNames("monitor-depth-row", `monitor-depth-${depth.tone}`)}
        title={depth.detail}
      >
        <div className="monitor-depth-copy">
          <strong>{depth.label}</strong>
          <small>{depth.detail}</small>
        </div>
        <b className="monitor-depth-score">{depth.scoreValue}</b>
        <div className="monitor-depth-metrics" aria-label="Monitoring depth metrics">
          <span title={depth.signalLabel}>
            <strong>{depthSignalValue}</strong>
            <small>Signals</small>
          </span>
          <span title={depth.eventLabel}>
            <strong>{depthEventValue}</strong>
            <small>Events</small>
          </span>
          <span title={depth.gateLabel}>
            <strong>{depthGateValue}</strong>
            <small>Gates</small>
          </span>
        </div>
      </div>
      <div className="monitor-strip-grid">
        <span>
          <strong>{summary.activeCount}</strong>
          Active
        </span>
        <span>
          <strong>{summary.issueCount}</strong>
          Issues
        </span>
        <span>
          <strong>{summary.completeCount}</strong>
          Done
        </span>
        <span>
          <strong>{summary.pendingCount}</strong>
          Pending
        </span>
      </div>
      <div className="monitor-stream-row">
        <span className={classNames("stream-state", `stream-${summary.streamState}`)}>
          <span aria-hidden="true" />
          {summary.streamLabel}
        </span>
        <small>{summary.streamProgressLabel}</small>
      </div>
      <div className="monitor-stream-progress" aria-label="Cockpit stream progress">
        <progress
          aria-label="Cockpit stream progress percentage"
          className="monitor-stream-progress-bar"
          max={100}
          value={streamProgressPercent}
        />
        <span className="monitor-stream-progress-value" aria-live="polite">
          {summary.streamProgressValue}
        </span>
      </div>
      <div
        aria-label={nextEventDetailAriaLabel}
        className="monitor-next-event-preview"
        title={`${nextEventPreview.label}. ${nextEventPreview.detail}`}
      >
        <span className="monitor-next-event-seq" title={nextEventPreview.sequenceLabel}>
          {nextEventPreview.sequenceLabel}
        </span>
        <span className="monitor-next-event-label" title={nextEventPreview.label}>
          {nextEventPreview.label}
        </span>
        <span className="monitor-next-event-detail" title={nextEventPreview.detail}>
          {nextEventPreview.detail}
        </span>
      </div>
      <div className="monitor-latest-event" title={latestEventDetail}>
        <strong>Latest:</strong>
        <span>{latestEventCue}</span>
      </div>
      {hasRecentEvents ? (
        <ol className="monitor-recent-events" aria-label="Recent local events">
          {recentEventFeed.map((item) => (
            <li
              className={classNames("monitor-recent-event-row", `event-status-${item.status}`)}
              key={item.id}
              title={`${item.sequenceLabel} ${item.label}. ${item.detail}`}
            >
              <strong>{item.label}</strong>
              <span>{item.sequenceLabel}</span>
              <small>{item.detail}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="monitor-recent-empty">{`Recent local events will appear here.`}</p>
      )}
      <div className="monitor-control-row" aria-label="Cockpit monitor stream controls">
        <button
          aria-label="Attach cockpit monitor event source"
          disabled={!controls.canAttach}
          onClick={onAttach}
          title={controls.attachReason}
          type="button"
        >
          <Link2 size={13} />
        </button>
        <button
          aria-label="Start cockpit monitor stream"
          disabled={!controls.canStart}
          onClick={onStart}
          title={controls.startReason}
          type="button"
        >
          <Play size={13} />
        </button>
        <button
          aria-label="Pause cockpit monitor stream"
          disabled={!controls.canPause}
          onClick={onPause}
          title={controls.pauseReason}
          type="button"
        >
          <Pause size={13} />
        </button>
        <button
          aria-label="Reset cockpit monitor stream"
          disabled={!controls.canReset}
          onClick={onReset}
          title={controls.resetReason}
          type="button"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </section>
  );
}

function RuntimeProfilePanel({
  activation,
  activeProfile,
  approval,
  canActivateDraft,
  draft,
  draftReadiness,
  history,
  onActivateDraftProfile,
  onCancelDraftApproval,
  onClearActiveProfile,
  onDraftChange,
  onCancelPermissionRequest,
  onRequestDraftApproval,
  onRequestPermission,
  onResetDraft,
  permissionApproval,
  permissionApprovalStatus,
  permissionAudit,
  permissionHandoff,
  permissionRequestHistory,
  permissionRequestIntent,
  profile,
  readiness,
  summary
}: {
  activation: RuntimeProfileActivationSnapshot;
  activeProfile?: RuntimeProfileActivationSnapshot;
  approval: RuntimeProfileApprovalSnapshot;
  canActivateDraft: boolean;
  draft: RuntimeProfile;
  draftReadiness: RuntimeProfileReadiness;
  history: RuntimeProfileApprovalRecord[];
  onActivateDraftProfile: () => void;
  onCancelDraftApproval: () => void;
  onClearActiveProfile: () => void;
  onDraftChange: (nextDraft: Partial<RuntimeProfile>) => void;
  onCancelPermissionRequest: () => void;
  onRequestDraftApproval: () => void;
  onRequestPermission: () => void;
  onResetDraft: () => void;
  permissionApproval: RuntimeProfilePermissionApprovalSnapshot;
  permissionApprovalStatus: DesktopPermissionApprovalStatus;
  permissionAudit: RuntimeProfilePermissionAuditSnapshot;
  permissionHandoff: RuntimeProfilePermissionHandoffSnapshot;
  permissionRequestHistory: RuntimeProfilePermissionRequestRecord[];
  permissionRequestIntent: RuntimeProfilePermissionRequestIntent;
  profile?: RuntimeProfile;
  readiness?: RuntimeProfileReadiness;
  summary: ReturnType<typeof summarizeRuntimeProfiles>;
}) {
  const canRequestPermission =
    permissionHandoff.canRequestPermission && permissionRequestIntent !== "requested";
  const canCancelPermission = permissionRequestIntent === "requested";

  return (
    <section className="panel-section">
      <h4>Runtime Profile</h4>
      <div className="runtime-profile-summary" aria-label="Runtime profile summary">
        <span>
          <strong>{summary.readiness}%</strong>
          Ready
        </span>
        <span>
          <strong>{summary.ready}</strong>
          Ready
        </span>
        <span>
          <strong>{summary.review}</strong>
          Review
        </span>
        <span>
          <strong>{summary.blocked}</strong>
          Blocked
        </span>
      </div>

      {profile && readiness ? (
        <div className="runtime-profile-card" aria-label="Selected runtime profile">
          <div className="runtime-profile-header">
            <span className={classNames("runtime-profile-state", `runtime-profile-${readiness.state}`)}>
              <span aria-hidden="true" />
              {readiness.state}
            </span>
            <strong title={profile.label}>{profile.label}</strong>
          </div>

          <dl className="runtime-profile-grid">
            <div>
              <dt>Transport</dt>
              <dd>{profile.transport}</dd>
            </div>
            <div>
              <dt>Workspace</dt>
              <dd>{profile.workspaceMode}</dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd>{profile.capabilities.length}</dd>
            </div>
            <div>
              <dt>Permissions</dt>
              <dd>{profile.requiredPermissions.length}</dd>
            </div>
          </dl>

          {readiness.reasons.length > 0 ? (
            <ul className="runtime-profile-reasons" aria-label="Runtime profile readiness reasons">
              {readiness.reasons.slice(0, 3).map((reason) => (
                <li key={reason} title={reason}>
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="runtime-profile-ready-copy">Profile is ready for a future approval flow.</p>
          )}

          <small title={readiness.safety}>{readiness.safety}</small>
        </div>
      ) : (
        <p className="empty-preview">Add a runtime profile to review setup readiness.</p>
      )}

      <div className="runtime-profile-draft" aria-label="Editable runtime profile draft">
        <div className="runtime-profile-draft-header">
          <span className={classNames("runtime-profile-state", `runtime-profile-${draftReadiness.state}`)}>
            <span aria-hidden="true" />
            {draftReadiness.state}
          </span>
          <strong>Draft</strong>
          <button aria-label="Reset runtime profile draft" onClick={onResetDraft} title="Reset draft" type="button">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="runtime-profile-form">
          <label>
            <span>Label</span>
            <input
              aria-label="Runtime profile draft label"
              onChange={(event) => onDraftChange({ label: event.currentTarget.value })}
              value={draft.label}
            />
          </label>
          <label>
            <span>Adapter</span>
            <input
              aria-label="Runtime profile draft adapter id"
              onChange={(event) => onDraftChange({ adapterId: event.currentTarget.value })}
              value={draft.adapterId}
            />
          </label>
          <label>
            <span>Transport</span>
            <select
              aria-label="Runtime profile draft transport"
              onChange={(event) =>
                onDraftChange({ transport: event.currentTarget.value as RuntimeTransport })
              }
              value={draft.transport}
            >
              {runtimeTransportOptions.map((transport) => (
                <option key={transport} value={transport}>
                  {transport}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Workspace</span>
            <select
              aria-label="Runtime profile draft workspace mode"
              onChange={(event) =>
                onDraftChange({ workspaceMode: event.currentTarget.value as RuntimeWorkspaceMode })
              }
              value={draft.workspaceMode}
            >
              {runtimeWorkspaceModeOptions.map((workspaceMode) => (
                <option key={workspaceMode} value={workspaceMode}>
                  {workspaceMode}
                </option>
              ))}
            </select>
          </label>
          <label className="runtime-profile-form-full">
            <span>Command</span>
            <input
              aria-label="Runtime profile draft command"
              onChange={(event) => onDraftChange({ command: event.currentTarget.value })}
              value={draft.command}
            />
          </label>
          <label className="runtime-profile-form-full">
            <span>Capabilities</span>
            <input
              aria-label="Runtime profile draft capabilities"
              onChange={(event) =>
                onDraftChange({ capabilities: parseRuntimeProfileList(event.currentTarget.value) })
              }
              value={formatRuntimeProfileList(draft.capabilities)}
            />
          </label>
          <label className="runtime-profile-form-full">
            <span>Permissions</span>
            <input
              aria-label="Runtime profile draft required permissions"
              onChange={(event) =>
                onDraftChange({ requiredPermissions: parseRuntimeProfileList(event.currentTarget.value) })
              }
              value={formatRuntimeProfileList(draft.requiredPermissions)}
            />
          </label>
          <label className="runtime-profile-checkbox">
            <input
              aria-label="Enable runtime profile draft"
              checked={draft.enabled}
              onChange={(event) => onDraftChange({ enabled: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>Enabled</span>
          </label>
        </div>

        {draftReadiness.reasons.length > 0 ? (
          <ul className="runtime-profile-reasons" aria-label="Runtime profile draft readiness reasons">
            {draftReadiness.reasons.slice(0, 3).map((reason) => (
              <li key={reason} title={reason}>
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="runtime-profile-ready-copy">Draft is ready for a future approval flow.</p>
        )}

        <div className="runtime-profile-approval" aria-label="Runtime profile approval preview">
          <div className="runtime-profile-approval-header">
            <span className={classNames("runtime-profile-state", `runtime-profile-${approval.state}`)}>
              <span aria-hidden="true" />
              {approval.statusLabel}
            </span>
            <strong title={approval.label}>Approval</strong>
          </div>
          <p title={approval.detail}>{approval.detail}</p>
          <dl className="runtime-profile-approval-grid">
            <div>
              <dt>Ready</dt>
              <dd>{approval.readiness}%</dd>
            </div>
            <div>
              <dt>Intent</dt>
              <dd>{approval.intent}</dd>
            </div>
            <div>
              <dt>Activation</dt>
              <dd>{activeProfile?.state ?? activation.state}</dd>
            </div>
          </dl>
          <div className="runtime-profile-approval-actions">
            <button
              aria-label="Request runtime profile approval"
              disabled={!approval.canRequest}
              onClick={onRequestDraftApproval}
              title={approval.primaryActionLabel}
              type="button"
            >
              <ClipboardList size={14} />
              <span>{approval.primaryActionLabel}</span>
            </button>
            <button
              aria-label="Cancel runtime profile approval request"
              disabled={!approval.canCancel}
              onClick={onCancelDraftApproval}
              title="Cancel request"
              type="button"
            >
              <RotateCcw size={14} />
              <span>Cancel</span>
            </button>
            <button
              aria-label="Activate approved runtime profile draft"
              disabled={!canActivateDraft}
              onClick={onActivateDraftProfile}
              title="Set active"
              type="button"
            >
              <CheckCircle2 size={14} />
              <span>Activate</span>
            </button>
          </div>
          <small title={approval.safety}>{approval.safety}</small>
          <div className="runtime-profile-approval-history" aria-label="Runtime profile approval history">
            <div className="runtime-profile-approval-history-header">
              <strong>Recent approval records</strong>
              <span>{history.length}</span>
            </div>
            {history.length > 0 ? (
              <ol className="runtime-profile-approval-records">
                {history.slice(0, 4).map((record) => (
                  <RuntimeProfileApprovalRecordRow key={record.id} record={record} />
                ))}
              </ol>
            ) : (
              <p className="runtime-profile-approval-empty">
                Request or cancel approval to create a local record.
              </p>
            )}
          </div>
          <div className="runtime-profile-activation" aria-label="Runtime profile activation">
            <div className="runtime-profile-activation-header">
              <strong>Active profile</strong>
              <span>{activeProfile?.state ?? activation.state}</span>
            </div>
            {activeProfile ? (
              <>
                <dl className="runtime-profile-activation-grid">
                  <div>
                    <dt>Profile</dt>
                    <dd title={activeProfile.profileLabel}>{activeProfile.profileLabel}</dd>
                  </div>
                  <div>
                    <dt>Adapter</dt>
                    <dd title={activeProfile.adapterId}>{activeProfile.adapterId}</dd>
                  </div>
                  <div>
                    <dt>Transport</dt>
                    <dd>{activeProfile.transport}</dd>
                  </div>
                  <div>
                    <dt>Workspace</dt>
                    <dd>{activeProfile.workspaceMode}</dd>
                  </div>
                </dl>
                <div className="runtime-profile-activation-footer">
                  <small title={activeProfile.detail}>{activeProfile.detail}</small>
                  <button
                    aria-label="Clear active runtime profile"
                    onClick={onClearActiveProfile}
                    title="Clear active profile"
                    type="button"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </>
            ) : (
              <p title={activation.detail}>{activation.detail}</p>
            )}
            <small title={activation.safety}>{activation.safety}</small>
          </div>
          <div
            className={classNames(
              "runtime-profile-permission-handoff",
              `runtime-profile-permission-${permissionHandoff.state}`
            )}
            aria-label="Runtime profile desktop permission handoff"
          >
            <div className="runtime-profile-permission-header">
              <strong>Desktop permission</strong>
              <span>{permissionHandoff.statusLabel}</span>
            </div>
            <p title={permissionHandoff.detail}>{permissionHandoff.detail}</p>
            <dl className="runtime-profile-permission-grid">
              <div>
                <dt>Ready</dt>
                <dd>{permissionHandoff.readiness}%</dd>
              </div>
              <div>
                <dt>Bridge</dt>
                <dd>{permissionHandoff.bridgeState}</dd>
              </div>
              <div>
                <dt>Process</dt>
                <dd>{permissionHandoff.processExecutionAvailable ? "Ready" : "Locked"}</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{permissionHandoff.workspaceAccessAvailable ? "Ready" : "Locked"}</dd>
              </div>
            </dl>
            <div className="runtime-profile-permission-actions">
              <button
                aria-label="Request runtime profile desktop permission"
                disabled={!canRequestPermission}
                onClick={onRequestPermission}
                title="Request permission"
                type="button"
              >
                <ClipboardList size={14} />
                <span>{permissionRequestIntent === "requested" ? "Requested" : "Request"}</span>
              </button>
              <button
                aria-label="Cancel runtime profile desktop permission request"
                disabled={!canCancelPermission}
                onClick={onCancelPermissionRequest}
                title="Cancel permission request"
                type="button"
              >
                <RotateCcw size={14} />
                <span>Cancel</span>
              </button>
            </div>
            <div
              className="runtime-profile-permission-history"
              aria-label="Runtime profile desktop permission request history"
            >
              <div className="runtime-profile-permission-history-header">
                <strong>Recent permission records</strong>
                <span>{permissionRequestHistory.length}</span>
              </div>
              {permissionRequestHistory.length > 0 ? (
                <ol className="runtime-profile-permission-records">
                  {permissionRequestHistory.slice(0, 4).map((record) => (
                    <RuntimeProfilePermissionRequestRecordRow key={record.id} record={record} />
                  ))}
                </ol>
              ) : (
                <p className="runtime-profile-permission-empty">
                  Request or cancel permission review to create a local record.
                </p>
              )}
            </div>
            <div
              className={classNames(
                "runtime-profile-permission-approval",
                `runtime-profile-approval-${permissionApproval.state}`
              )}
              aria-label="Runtime profile desktop permission approval preview"
            >
              <div className="runtime-profile-permission-approval-header">
                <strong>Permission approval</strong>
                <span>{permissionApproval.statusLabel}</span>
              </div>
              <p title={permissionApproval.detail}>{permissionApproval.detail}</p>
              <dl className="runtime-profile-permission-approval-grid">
                <div>
                  <dt>Intent</dt>
                  <dd>{permissionApproval.intent}</dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>{permissionApproval.approvalRequired ? "Required" : "Held"}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>{permissionApproval.executionLocked ? "Locked" : "Ready"}</dd>
                </div>
              </dl>
              <small title={permissionApproval.safety}>{permissionApproval.safety}</small>
            </div>
            <div
              className={classNames(
                "runtime-profile-shell-approval",
                `runtime-profile-shell-${permissionApprovalStatus.state}`
              )}
              aria-label="Desktop permission approval shell status"
            >
              <div className="runtime-profile-shell-approval-header">
                <strong>Shell approval</strong>
                <span>{permissionApprovalStatus.state}</span>
              </div>
              <p title={permissionApprovalStatus.detail}>{permissionApprovalStatus.detail}</p>
              <dl className="runtime-profile-shell-approval-grid">
                <div>
                  <dt>Command</dt>
                  <dd>{permissionApprovalStatus.approvalCommandAvailable ? "Ready" : "Locked"}</dd>
                </div>
                <div>
                  <dt>Granted</dt>
                  <dd>{permissionApprovalStatus.permissionGranted ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{permissionApprovalStatus.source}</dd>
                </div>
              </dl>
              <small title={permissionApprovalStatus.safety}>{permissionApprovalStatus.safety}</small>
            </div>
            <div
              className={classNames(
                "runtime-profile-permission-audit",
                `runtime-profile-audit-${permissionAudit.state}`
              )}
              aria-label="Runtime profile desktop permission audit preview"
            >
              <div className="runtime-profile-permission-audit-header">
                <strong>Permission audit</strong>
                <span>{permissionAudit.statusLabel}</span>
              </div>
              <p title={permissionAudit.detail}>{permissionAudit.detail}</p>
              <dl className="runtime-profile-permission-audit-grid">
                <div>
                  <dt>Ready</dt>
                  <dd>{permissionAudit.readiness}%</dd>
                </div>
                <div>
                  <dt>Records</dt>
                  <dd>{permissionAudit.recordCount}</dd>
                </div>
                <div>
                  <dt>Export</dt>
                  <dd>{permissionAudit.canExport ? "Ready" : "Held"}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>{permissionAudit.executionLocked ? "Locked" : "Ready"}</dd>
                </div>
              </dl>
              <ol className="runtime-profile-permission-audit-items">
                {permissionAudit.items.slice(0, 4).map((item) => (
                  <li
                    className={`runtime-profile-audit-item-${item.status}`}
                    key={item.id}
                    title={item.detail}
                  >
                    <span>{item.status}</span>
                    <strong>{item.label}</strong>
                  </li>
                ))}
              </ol>
              <pre
                aria-label="Runtime profile permission audit export markdown"
                title={permissionAudit.exportMarkdown}
              >
                {permissionAudit.canExport ? permissionAudit.exportMarkdown : "No export preview yet."}
              </pre>
              <small title={permissionAudit.safety}>{permissionAudit.safety}</small>
            </div>
            <small title={permissionHandoff.safety}>{permissionHandoff.safety}</small>
          </div>
        </div>

        <small title={draftReadiness.safety}>{draftReadiness.safety}</small>
      </div>
    </section>
  );
}

function RuntimeProfilePermissionRequestRecordRow({
  record
}: {
  record: RuntimeProfilePermissionRequestRecord;
}) {
  return (
    <li className={classNames("runtime-profile-permission-record", `runtime-profile-permission-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

function RuntimeProfileApprovalRecordRow({
  record
}: {
  record: RuntimeProfileApprovalRecord;
}) {
  return (
    <li className={classNames("runtime-profile-approval-record", `runtime-profile-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

function AdapterContractListItem({ item }: { item: AdapterContractItem }) {
  return (
    <li className={classNames("adapter-contract-item", `adapter-${item.kind}`, `adapter-${item.status}`)}>
      <span className="adapter-contract-kind">{item.kind}</span>
      <div>
        <strong title={item.detail}>{item.detail || item.label}</strong>
        <small>{item.label}</small>
      </div>
      <span className="adapter-contract-status">{item.status}</span>
    </li>
  );
}

function RuntimeIngestionListItem({ event }: { event: RuntimeIngestionEvent }) {
  return (
    <li className={classNames("ingestion-item", `ingestion-${event.eventKind}`, `ingestion-${event.adapterStatus}`)}>
      <span className="ingestion-sequence">{event.sequence + 1}</span>
      <div>
        <span className="ingestion-kicker">
          {event.eventKind} / {event.adapterStatus}
        </span>
        <strong title={event.label}>{event.label}</strong>
        <small title={`${event.detail}. ${event.reason}`}>{event.reason}</small>
      </div>
      <span className="ingestion-status">{event.adapterStatus}</span>
    </li>
  );
}

function RuntimeEventSourceStatus({
  approval,
  bridge,
  connection,
  desktopBridge,
  executionAudit,
  executionAuditHistory,
  handoffAcceptance,
  launchRequest,
  onAttach,
  onCancelApproval,
  onDetach,
  onRequestApproval,
  recoveryCoverage,
  snapshot
}: {
  approval: RuntimeLaunchApprovalSnapshot;
  bridge: RuntimeAdapterBridgeSnapshot;
  connection: RuntimeSourceConnectionSnapshot;
  desktopBridge: DesktopRuntimeBridgeStatus;
  executionAudit: RuntimeExecutionAuditSnapshot;
  executionAuditHistory: RuntimeExecutionAuditRecord[];
  handoffAcceptance: RuntimeLaunchHandoffAcceptance;
  launchRequest: RuntimeLaunchRequestSnapshot;
  onAttach: () => void;
  onCancelApproval: () => void;
  onDetach: () => void;
  onRequestApproval: () => void;
  recoveryCoverage: RuntimeRecoveryFailureCoverage;
  snapshot: RuntimeEventSourceSnapshot;
}) {
  return (
    <div className="event-source" aria-label="Runtime event source">
      <div className="event-source-header">
        <span className={classNames("event-source-state", `event-source-${snapshot.state}`)}>
          <span aria-hidden="true" />
          {snapshot.state}
        </span>
        <strong title={snapshot.label}>{snapshot.mode} source</strong>
      </div>
      <p title={snapshot.detail}>{snapshot.detail}</p>
      <dl className="event-source-grid">
        <div>
          <dt>Queued</dt>
          <dd>{snapshot.available}</dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>{snapshot.accepted}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{snapshot.review}</dd>
        </div>
        <div>
          <dt>Blocked</dt>
          <dd>{snapshot.blocked}</dd>
        </div>
      </dl>
      <small title={snapshot.nextEventLabel}>Next: {snapshot.nextEventLabel}</small>
      <div className="source-connection" aria-label="Runtime source connection">
        <div className="source-connection-header">
          <span className={classNames("source-connection-state", `source-connection-${connection.state}`)}>
            <span aria-hidden="true" />
            {connection.state}
          </span>
          <strong title={connection.detail}>{connection.canAttach ? "Attach ready" : "Attach waiting"}</strong>
        </div>
        <p title={connection.detail}>{connection.detail}</p>
        <dl className="source-connection-grid">
          <div>
            <dt>Capabilities</dt>
            <dd>
              {connection.requiredCapabilities.length - connection.missingCapabilities.length}/
              {connection.requiredCapabilities.length}
            </dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd>
              {connection.enabledPermissions}/{connection.requiredPermissions}
            </dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{connection.readiness}%</dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd title={connection.transport}>{connection.transport}</dd>
          </div>
        </dl>
      </div>
      <DesktopRuntimeBridgeStatusBlock bridge={desktopBridge} />
      <RuntimeAdapterBridgeStatus bridge={bridge} onAttach={onAttach} onDetach={onDetach} />
      <RuntimeLaunchRequestStatus
        approval={approval}
        executionAudit={executionAudit}
        executionAuditHistory={executionAuditHistory}
        launchRequest={launchRequest}
        onCancelApproval={onCancelApproval}
        onRequestApproval={onRequestApproval}
      />
      <div
        aria-label={handoffAcceptance.ariaLabel}
        className={classNames(
          "runtime-handoff-acceptance",
          `runtime-handoff-acceptance-${handoffAcceptance.tone}`
        )}
        title={handoffAcceptance.detail}
      >
        <div className="runtime-handoff-acceptance-header">
          <strong>{handoffAcceptance.label}</strong>
          <b>{handoffAcceptance.checkLabel}</b>
        </div>
        <p>{handoffAcceptance.detail}</p>
        <div
          className="runtime-handoff-acceptance-checks"
          aria-label="Runtime launch handoff acceptance checks"
        >
          {handoffAcceptance.checks.map((check) => (
            <span
              className={classNames(
                "runtime-handoff-acceptance-check",
                `runtime-handoff-acceptance-check-${check.tone}`
              )}
              key={check.label}
              title={`${check.label}: ${check.value}`}
            >
              <strong>{check.value}</strong>
              <small>{check.label}</small>
            </span>
          ))}
        </div>
      </div>
      <div
        aria-label={recoveryCoverage.ariaLabel}
        className={classNames(
          "runtime-recovery-coverage",
          `runtime-recovery-coverage-${recoveryCoverage.tone}`
        )}
        title={recoveryCoverage.detail}
      >
        <div className="runtime-recovery-coverage-header">
          <strong>{recoveryCoverage.label}</strong>
          <b>{recoveryCoverage.checkLabel}</b>
        </div>
        <p>{recoveryCoverage.detail}</p>
        <div
          className="runtime-recovery-coverage-checks"
          aria-label="Runtime adapter recovery and failure-state coverage checks"
        >
          {recoveryCoverage.checks.map((check) => (
            <span
              className={classNames(
                "runtime-recovery-coverage-check",
                `runtime-recovery-coverage-check-${check.tone}`
              )}
              key={check.label}
              title={`${check.label}: ${check.value}`}
            >
              <strong>{check.value}</strong>
              <small>{check.label}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopRuntimeBridgeStatusBlock({
  bridge
}: {
  bridge: DesktopRuntimeBridgeStatus;
}) {
  return (
    <div className="desktop-bridge" aria-label="Desktop runtime bridge status">
      <div className="desktop-bridge-header">
        <span className={classNames("desktop-bridge-state", `desktop-bridge-${bridge.state}`)}>
          <span aria-hidden="true" />
          {bridge.state}
        </span>
        <strong title={bridge.label}>{bridge.source === "desktop" ? "Desktop bridge" : "Browser preview"}</strong>
      </div>
      <p title={bridge.detail}>{bridge.detail}</p>
      <dl className="desktop-bridge-grid">
        <div>
          <dt>Process</dt>
          <dd>{bridge.processExecutionAvailable ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Workspace</dt>
          <dd>{bridge.workspaceAccessAvailable ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{bridge.source}</dd>
        </div>
      </dl>
      <small title={bridge.safety}>{bridge.safety}</small>
    </div>
  );
}

function DesktopPackagingReadinessPanel({
  packaging
}: {
  packaging: DesktopPackagingReadinessSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Desktop App</h4>
      <div
        className={classNames(
          "desktop-packaging",
          `desktop-packaging-${packaging.state}`
        )}
        aria-label="Desktop packaging readiness preview"
      >
        <div className="desktop-packaging-header">
          <span className="desktop-packaging-state">
            <span aria-hidden="true" />
            {packaging.statusLabel}
          </span>
          <strong title={packaging.label}>Package readiness</strong>
        </div>
        <p title={packaging.detail}>{packaging.detail}</p>
        <dl className="desktop-packaging-grid">
          <div>
            <dt>Ready</dt>
            <dd>{packaging.readiness}%</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{packaging.canPackage ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Lock</dt>
            <dd>{packaging.packagingLocked ? "Locked" : "Open"}</dd>
          </div>
        </dl>
        <ol className="desktop-packaging-items">
          {packaging.items.map((item) => (
            <li
              className={`desktop-packaging-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <small title={packaging.safety}>{packaging.safety}</small>
      </div>
    </section>
  );
}

function LocalEvidenceReadinessPanel({
  evidence
}: {
  evidence: LocalEvidenceReadinessSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Evidence</h4>
      <div
        className={classNames("local-evidence", `local-evidence-${evidence.state}`)}
        aria-label="Local validation evidence readiness preview"
      >
        <div className="local-evidence-header">
          <span className="local-evidence-state">
            <span aria-hidden="true" />
            {evidence.statusLabel}
          </span>
          <strong title={evidence.label}>Validation evidence</strong>
        </div>
        <p title={evidence.detail}>{evidence.detail}</p>
        <dl className="local-evidence-grid">
          <div>
            <dt>Ready</dt>
            <dd>{evidence.readiness}%</dd>
          </div>
          <div>
            <dt>Gates</dt>
            <dd>
              {evidence.passedGateCount}/{evidence.gateCount}
            </dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{evidence.evidenceCount}</dd>
          </div>
          <div>
            <dt>Finalize</dt>
            <dd>{evidence.canFinalize ? "Ready" : "Held"}</dd>
          </div>
        </dl>
        <ol className="local-evidence-items">
          {evidence.items.map((item) => (
            <li
              className={`local-evidence-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <small title={evidence.safety}>{evidence.safety}</small>
      </div>
    </section>
  );
}

function ToolEvidenceReadinessPanel({
  captureHistory,
  captureIntent,
  onCancelCapture,
  onRequestCapture,
  tools
}: {
  captureHistory: ToolEvidenceCaptureRecord[];
  captureIntent: ToolEvidenceCaptureIntent;
  onCancelCapture: () => void;
  onRequestCapture: () => void;
  tools: ToolEvidenceReadinessSnapshot;
}) {
  const canRequestCapture = captureIntent !== "requested";
  const canCancelCapture = captureIntent === "requested";

  return (
    <section className="panel-section">
      <h4>Terminal & Git</h4>
      <div
        className={classNames("tool-evidence", `tool-evidence-${tools.state}`)}
        aria-label="Terminal and Git evidence readiness preview"
      >
        <div className="tool-evidence-header">
          <span className="tool-evidence-state">
            <span aria-hidden="true" />
            {tools.statusLabel}
          </span>
          <strong title={tools.label}>Capture readiness</strong>
        </div>
        <p title={tools.detail}>{tools.detail}</p>
        <dl className="tool-evidence-grid">
          <div>
            <dt>Ready</dt>
            <dd>{tools.readiness}%</dd>
          </div>
          <div>
            <dt>Terminal</dt>
            <dd>{tools.terminalLocked ? "Locked" : "Ready"}</dd>
          </div>
          <div>
            <dt>Git</dt>
            <dd>{tools.gitLocked ? "Locked" : "Ready"}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{tools.canCapture ? "Ready" : "Held"}</dd>
          </div>
        </dl>
        <ol className="tool-evidence-items">
          {tools.items.map((item) => (
            <li
              className={`tool-evidence-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <div className="tool-evidence-actions">
          <button
            aria-label="Request terminal and Git evidence capture"
            disabled={!canRequestCapture}
            onClick={onRequestCapture}
            title="Request capture preview"
            type="button"
          >
            <ClipboardList size={14} />
            <span>{captureIntent === "requested" ? "Requested" : "Request"}</span>
          </button>
          <button
            aria-label="Cancel terminal and Git evidence capture request"
            disabled={!canCancelCapture}
            onClick={onCancelCapture}
            title="Cancel capture request"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Cancel</span>
          </button>
        </div>
        <div className="tool-evidence-history" aria-label="Terminal and Git evidence capture history">
          <div className="tool-evidence-history-header">
            <strong>Recent capture records</strong>
            <span>{captureHistory.length}</span>
          </div>
          {captureHistory.length > 0 ? (
            <ol className="tool-evidence-records">
              {captureHistory.slice(0, 4).map((record) => (
                <ToolEvidenceCaptureRecordRow key={record.id} record={record} />
              ))}
            </ol>
          ) : (
            <p className="tool-evidence-empty">
              Request or cancel capture review to create a local record.
            </p>
          )}
        </div>
        <small title={tools.safety}>{tools.safety}</small>
      </div>
    </section>
  );
}

function SecurityPrivacyThreatModelPanel({
  acceptance,
  finalReview,
  model,
  releasePrivacy,
  repeatedRuns
}: {
  acceptance: SecurityAcceptanceCoverageSnapshot;
  finalReview: SecurityFinalReviewSnapshot;
  model: SecurityPrivacyThreatModel;
  releasePrivacy: ReleasePrivacyReadinessSnapshot;
  repeatedRuns: SecurityAcceptanceRepeatedRunsSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Security & Privacy</h4>
      <div
        aria-label={model.ariaLabel}
        className={classNames(
          "security-privacy-model",
          `security-privacy-${model.tone}`
        )}
      >
        <div className="security-privacy-header">
          <span className="security-privacy-state">
            <span aria-hidden="true" />
            {model.tone}
          </span>
          <strong title={model.label}>{model.label}</strong>
          <b>{model.checkLabel}</b>
        </div>
        <p title={model.detail}>{model.detail}</p>
        <ol className="security-privacy-checks">
          {model.checks.map((check) => (
            <li
              className={`security-privacy-check-${check.tone}`}
              key={check.label}
              title={check.value}
            >
              <span>{check.tone}</span>
              <strong>{check.label}</strong>
              <small>{check.value}</small>
            </li>
          ))}
        </ol>
        <div
          aria-label={releasePrivacy.ariaLabel}
          className={classNames(
            "release-privacy-readiness",
            `release-privacy-${releasePrivacy.state}`
          )}
        >
          <div className="release-privacy-header">
            <span className="release-privacy-state">
              <span aria-hidden="true" />
              {releasePrivacy.statusLabel}
            </span>
            <strong title={releasePrivacy.label}>Release privacy</strong>
            <b>{releasePrivacy.readiness}%</b>
          </div>
          <p title={releasePrivacy.detail}>{releasePrivacy.detail}</p>
          <ol className="release-privacy-items">
            {releasePrivacy.items.map((item) => (
              <li
                className={`release-privacy-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={releasePrivacy.safety}>{releasePrivacy.safety}</small>
        </div>
        <div
          aria-label={acceptance.ariaLabel}
          className={classNames(
            "security-acceptance-coverage",
            `security-acceptance-${acceptance.state}`
          )}
        >
          <div className="security-acceptance-header">
            <span className="security-acceptance-state">
              <span aria-hidden="true" />
              {acceptance.statusLabel}
            </span>
            <strong title={acceptance.label}>Security acceptance</strong>
            <b>{acceptance.readiness}%</b>
          </div>
          <p title={acceptance.detail}>{acceptance.detail}</p>
          <ol className="security-acceptance-items">
            {acceptance.items.map((item) => (
              <li
                className={`security-acceptance-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={acceptance.safety}>{acceptance.safety}</small>
        </div>
        <div
          aria-label={repeatedRuns.ariaLabel}
          className={classNames(
            "security-repeated-runs",
            `security-repeated-${repeatedRuns.state}`
          )}
        >
          <div className="security-repeated-header">
            <span className="security-repeated-state">
              <span aria-hidden="true" />
              {repeatedRuns.statusLabel}
            </span>
            <strong title={repeatedRuns.label}>Repeated evidence</strong>
            <b>{repeatedRuns.readiness}%</b>
          </div>
          <p title={repeatedRuns.detail}>{repeatedRuns.detail}</p>
          <dl className="security-repeated-grid" aria-label="Repeated security evidence counts">
            <div>
              <dt>Reviewed</dt>
              <dd>{repeatedRuns.reviewedRunCount}/{repeatedRuns.requiredRunCount}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{repeatedRuns.readyRunCount}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{repeatedRuns.reviewRunCount}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{repeatedRuns.blockedRunCount}</dd>
            </div>
          </dl>
          <ol className="security-repeated-items">
            {repeatedRuns.items.map((item) => (
              <li
                className={`security-repeated-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={repeatedRuns.safety}>{repeatedRuns.safety}</small>
        </div>
        <div
          aria-label={finalReview.ariaLabel}
          className={classNames(
            "security-final-review",
            `security-final-state-${finalReview.state}`
          )}
        >
          <div className="security-final-header">
            <span className="security-final-state">
              <span aria-hidden="true" />
              {finalReview.statusLabel}
            </span>
            <strong title={finalReview.label}>Final review</strong>
            <b>{finalReview.readiness}%</b>
          </div>
          <p title={finalReview.detail}>{finalReview.detail}</p>
          <dl className="security-final-grid" aria-label="Final security review readiness">
            <div>
              <dt>Close</dt>
              <dd>{finalReview.canCloseSecurity ? "Ready" : "Held"}</dd>
            </div>
            <div>
              <dt>Package</dt>
              <dd>{finalReview.canResumePackaging ? "Ready" : "Paused"}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{finalReview.state}</dd>
            </div>
          </dl>
          <ol className="security-final-items">
            {finalReview.items.map((item) => (
              <li
                className={`security-final-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={finalReview.safety}>{finalReview.safety}</small>
        </div>
      </div>
    </section>
  );
}

function toSecurityAcceptanceEvidenceState(
  status?: ReleasePrivacyReadinessItemStatus
): "ready" | "review" | "blocked" | undefined {
  if (status === "waiting" || status === undefined) {
    return undefined;
  }

  return status;
}

function ToolEvidenceCaptureRecordRow({
  record
}: {
  record: ToolEvidenceCaptureRecord;
}) {
  return (
    <li className={classNames("tool-evidence-record", `tool-evidence-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

function RuntimeAdapterBridgeStatus({
  bridge,
  onAttach,
  onDetach
}: {
  bridge: RuntimeAdapterBridgeSnapshot;
  onAttach: () => void;
  onDetach: () => void;
}) {
  return (
    <div className="adapter-bridge" aria-label="Runtime adapter bridge">
      <div className="adapter-bridge-header">
        <span className={classNames("adapter-bridge-state", `adapter-bridge-${bridge.state}`)}>
          <span aria-hidden="true" />
          {bridge.state}
        </span>
        <strong title={bridge.detail}>{bridge.attached ? "Bridge attached" : "Bridge detached"}</strong>
      </div>
      <p title={bridge.detail}>{bridge.detail}</p>
      <div className="adapter-bridge-actions" aria-label="Runtime adapter bridge controls">
        <button
          aria-label="Attach runtime adapter bridge"
          disabled={!bridge.canAttach}
          onClick={onAttach}
          title="Attach bridge"
          type="button"
        >
          <Link2 size={14} />
          <span>Attach</span>
        </button>
        <button
          aria-label="Detach runtime adapter bridge"
          disabled={!bridge.canDetach}
          onClick={onDetach}
          title="Detach bridge"
          type="button"
        >
          <Link2Off size={14} />
          <span>Detach</span>
        </button>
      </div>
    </div>
  );
}

function RuntimeLaunchRequestStatus({
  approval,
  executionAudit,
  executionAuditHistory,
  launchRequest,
  onCancelApproval,
  onRequestApproval
}: {
  approval: RuntimeLaunchApprovalSnapshot;
  executionAudit: RuntimeExecutionAuditSnapshot;
  executionAuditHistory: RuntimeExecutionAuditRecord[];
  launchRequest: RuntimeLaunchRequestSnapshot;
  onCancelApproval: () => void;
  onRequestApproval: () => void;
}) {
  return (
    <div className="launch-request" aria-label="Runtime launch request preview">
      <div className="launch-request-header">
        <span className={classNames("launch-request-state", `launch-request-${launchRequest.state}`)}>
          <span aria-hidden="true" />
          {launchRequest.state}
        </span>
        <strong title={launchRequest.label}>
          {launchRequest.canRequest ? "Request ready" : "Request preview"}
        </strong>
      </div>
      <p title={launchRequest.detail}>{launchRequest.detail}</p>
      <dl className="launch-request-grid">
        <div>
          <dt>Events</dt>
          <dd>{launchRequest.eventCount}</dd>
        </div>
        <div>
          <dt>Ready</dt>
          <dd>{launchRequest.readiness}%</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{launchRequest.requiresApproval ? "Required" : "Held"}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd title={launchRequest.transport}>{launchRequest.transport}</dd>
        </div>
      </dl>
      <small title={launchRequest.safety}>{launchRequest.safety}</small>
      <div className="launch-approval" aria-label="Runtime launch approval request">
        <div className="launch-approval-header">
          <span className={classNames("launch-approval-state", `launch-approval-${approval.state}`)}>
            <span aria-hidden="true" />
            {approval.statusLabel}
          </span>
          <strong title={approval.label}>Approval request</strong>
        </div>
        <p title={approval.detail}>{approval.detail}</p>
        <div className="launch-approval-actions">
          <button
            aria-label="Request runtime launch approval"
            disabled={!approval.canRequest}
            onClick={onRequestApproval}
            title={approval.primaryActionLabel}
            type="button"
          >
            <ClipboardList size={14} />
            <span>{approval.primaryActionLabel}</span>
          </button>
          <button
            aria-label="Cancel runtime launch approval request"
            disabled={!approval.canCancel}
            onClick={onCancelApproval}
            title="Cancel request"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Cancel</span>
          </button>
        </div>
        <small title={approval.safety}>{approval.safety}</small>
      </div>
      <RuntimeExecutionAuditStatus audit={executionAudit} history={executionAuditHistory} />
    </div>
  );
}

function RuntimeExecutionAuditStatus({
  audit,
  history
}: {
  audit: RuntimeExecutionAuditSnapshot;
  history: RuntimeExecutionAuditRecord[];
}) {
  return (
    <div className="execution-audit" aria-label="Runtime execution audit preview">
      <div className="execution-audit-header">
        <span className={classNames("execution-audit-state", `execution-audit-${audit.state}`)}>
          <span aria-hidden="true" />
          {audit.statusLabel}
        </span>
        <strong title={audit.label}>Execution audit</strong>
      </div>
      <p title={audit.detail}>{audit.detail}</p>
      <dl className="execution-audit-grid">
        <div>
          <dt>Events</dt>
          <dd>{audit.eventCount}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{audit.requiresDesktopApproval ? "Needed" : "Held"}</dd>
        </div>
        <div>
          <dt>Execute</dt>
          <dd>{audit.canExecute ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd title={audit.transport}>{audit.transport}</dd>
        </div>
      </dl>
      <ol className="execution-audit-list" aria-label="Runtime execution audit checklist">
        {audit.items.map((item) => (
          <RuntimeExecutionAuditItemRow item={item} key={item.id} />
        ))}
      </ol>
      <small title={audit.safety}>{audit.safety}</small>
      <div className="execution-audit-history" aria-label="Runtime execution audit history">
        <div className="execution-audit-history-header">
          <strong>Recent audit records</strong>
          <span>{history.length}</span>
        </div>
        {history.length > 0 ? (
          <ol className="execution-audit-records">
            {history.slice(0, 4).map((record) => (
              <RuntimeExecutionAuditRecordRow key={record.id} record={record} />
            ))}
          </ol>
        ) : (
          <p className="execution-audit-empty">Request or cancel approval to create a local record.</p>
        )}
      </div>
    </div>
  );
}

function RuntimeExecutionAuditItemRow({ item }: { item: RuntimeExecutionAuditItem }) {
  return (
    <li className={classNames("execution-audit-item", `execution-audit-item-${item.status}`)}>
      <span aria-hidden="true" />
      <div>
        <strong title={item.label}>{item.label}</strong>
        <small title={item.detail}>{item.detail}</small>
      </div>
      <b>{item.status}</b>
    </li>
  );
}

function RuntimeExecutionAuditRecordRow({ record }: { record: RuntimeExecutionAuditRecord }) {
  return (
    <li className={classNames("execution-audit-record", `execution-audit-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong title={record.detail}>{record.action}</strong>
        <small title={record.createdAt}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b>{record.executionLocked ? "Locked" : record.statusLabel}</b>
    </li>
  );
}

function RuntimeAdapterSessionStatus({ snapshot }: { snapshot: RuntimeAdapterSessionSnapshot }) {
  return (
    <div className="adapter-session" aria-label="Runtime adapter session">
      <div className="adapter-session-header">
        <span className={classNames("adapter-session-state", `adapter-session-${snapshot.state}`)}>
          <span aria-hidden="true" />
          {snapshot.state}
        </span>
        <strong title={snapshot.label}>{snapshot.label}</strong>
      </div>
      <p title={snapshot.heartbeat}>{snapshot.heartbeat}</p>
      <dl className="adapter-session-grid">
        <div>
          <dt>Transport</dt>
          <dd title={snapshot.transport}>{snapshot.transport}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{snapshot.health}</dd>
        </div>
        <div>
          <dt>Ready</dt>
          <dd>{snapshot.readiness}%</dd>
        </div>
        <div>
          <dt>Permissions</dt>
          <dd>
            {snapshot.enabledPermissions}/{snapshot.requiredPermissions}
          </dd>
        </div>
      </dl>
      <small title={snapshot.latestEventLabel}>Latest: {snapshot.latestEventLabel}</small>
    </div>
  );
}

function RuntimeStreamPreview({ snapshot }: { snapshot: RuntimeStreamSnapshot }) {
  const visibleEvents = snapshot.emittedEvents.slice(-5);

  return (
    <div className="stream-preview">
      <div className="stream-latest">
        <span>Latest</span>
        <strong title={snapshot.latestEvent?.label}>{snapshot.latestEvent?.label}</strong>
        <small title={snapshot.latestEvent?.reason}>{snapshot.latestEvent?.reason}</small>
      </div>
      <ol className="stream-event-list" aria-label="Emitted runtime stream events">
        {visibleEvents.map((event) => (
          <li className={classNames("stream-event", `stream-event-${event.adapterStatus}`)} key={event.id}>
            <span>{event.sequence + 1}</span>
            <strong title={event.label}>{event.label}</strong>
            <small>{event.adapterStatus}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RunTimelineItem({ event }: { event: RunTimelineEvent }) {
  return (
    <li className={classNames("timeline-item", `timeline-${event.kind}`)}>
      <span className="timeline-marker" aria-hidden="true" />
      <div>
        <span className="timeline-kicker">
          {event.actor} / {event.kind}
        </span>
        <strong title={event.label}>{event.label}</strong>
        <small title={event.detail}>{event.detail}</small>
      </div>
      <span className={classNames("timeline-status", `timeline-status-${event.status}`)}>
        {event.status}
      </span>
    </li>
  );
}

function PermissionItem({ surface }: { surface: PermissionSurface }) {
  const icon =
    surface.status === "enabled" ? (
      <CheckCircle2 size={15} />
    ) : surface.status === "review" ? (
      <CircleDot size={15} />
    ) : (
      <AlertTriangle size={15} />
    );

  return (
    <li className={classNames("permission-item", `permission-${surface.status}`)}>
      {icon}
      <span>
        <strong>{surface.label}</strong>
        <small>{surface.detail}</small>
      </span>
    </li>
  );
}
