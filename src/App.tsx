import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Columns3,
  GitBranch,
  Grid2X2,
  Link2,
  LayoutDashboard,
  Link2Off,
  PanelRight,
  Pause,
  Play,
  RotateCcw,
  Rows3,
  Search,
  Settings2,
  ShieldCheck,
  Terminal,
  Workflow
} from "lucide-react";
import type { ReactNode } from "react";
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
  getLayoutSpec,
  layoutOptions,
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
  const { selectedProjectId, mode, layoutId, view } = preferences;

  useEffect(() => {
    saveWorkspacePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    savePlanningDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveRunHistory(mockRuns);
  }, [mockRuns]);

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
  const maxVisibleSessions = layout.columns * layout.rows;
  const visibleSessions = useMemo(
    () => cockpitSessions.slice(0, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions]
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

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Projects">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <div>
            <h1>Steerboard</h1>
            <p>Local cockpit</p>
          </div>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input aria-label="Search projects" placeholder="Search" />
        </label>

        <nav className="project-list">
          {projects.map((item) => (
            <button
              className={classNames("project-button", selectedProjectId === item.id && "is-selected")}
              key={item.id}
              onClick={() => updatePreferences({ selectedProjectId: item.id })}
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
          <button aria-label="Open runtime settings" title="Runtime settings" type="button">
            <Settings2 size={18} />
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
                  <div className="layout-buttons" aria-label="Layout">
                    {layoutOptions.map((option) => (
                      <button
                        aria-label={`Use ${option.id} layout`}
                        className={classNames(option.id === layoutId && "is-active")}
                        key={option.id}
                        onClick={() => updatePreferences({ layoutId: option.id })}
                        title={option.id}
                        type="button"
                      >
                        {option.columns === option.rows ? (
                          <Grid2X2 size={15} />
                        ) : option.columns > option.rows ? (
                          <Columns3 size={15} />
                        ) : (
                          <Rows3 size={15} />
                        )}
                        <span>{option.id}</span>
                      </button>
                    ))}
                  </div>
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
                  className="cockpit-grid"
                  style={{
                    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${layout.rows}, minmax(190px, 1fr))`
                  }}
                >
                  {visibleSessions.map((session) => (
                    <SessionCell
                      isFocused={session.id === focusedPanelId}
                      key={session.id}
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
    </main>
  );
}

function SessionCell({
  isFocused = false,
  projectLabel,
  session
}: {
  isFocused?: boolean;
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

      <div className="cell-transcript">
        {session.transcript.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <footer className="cell-footer">
        <PanelValidationSignal validation={validationSignal} />
        <div className="cell-footer-actions">
          <PanelActivitySignal activity={activitySignal} />
          <PanelFileScopeSignal scope={fileScope} />
          <PanelToolCoverageSignal coverage={toolCoverageSignal} />
        </div>
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
  return (
    <div
      aria-label={`Hidden panel queue: ${overflow.label}`}
      className={classNames("panel-overflow-chip", `panel-overflow-${overflow.tone}`)}
      title={overflow.detail}
    >
      <div className="panel-overflow-copy">
        <strong>{overflow.label}</strong>
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
          {controls.focusLabel}
        </button>
        <button
          aria-label={controls.clearAriaLabel}
          disabled={controls.clearDisabled}
          onClick={onClearFocus}
          title={controls.clearTitle}
          type="button"
        >
          {controls.clearLabel}
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
  const desktopPackagingReadinessSnapshot = useMemo(
    () =>
      buildDesktopPackagingReadinessSnapshot(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus
      ),
    [desktopBridgeStatus, desktopPermissionApprovalStatus]
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
          launchRequest={runtimeLaunchRequestSnapshot}
          onAttach={() => updateBridgeIntent("attached")}
          onCancelApproval={() => recordLaunchApprovalAction("cancelled", "idle")}
          onDetach={() => updateBridgeIntent("detached")}
          onRequestApproval={() => recordLaunchApprovalAction("requested", "requested")}
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
  launchRequest,
  onAttach,
  onCancelApproval,
  onDetach,
  onRequestApproval,
  snapshot
}: {
  approval: RuntimeLaunchApprovalSnapshot;
  bridge: RuntimeAdapterBridgeSnapshot;
  connection: RuntimeSourceConnectionSnapshot;
  desktopBridge: DesktopRuntimeBridgeStatus;
  executionAudit: RuntimeExecutionAuditSnapshot;
  executionAuditHistory: RuntimeExecutionAuditRecord[];
  launchRequest: RuntimeLaunchRequestSnapshot;
  onAttach: () => void;
  onCancelApproval: () => void;
  onDetach: () => void;
  onRequestApproval: () => void;
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
