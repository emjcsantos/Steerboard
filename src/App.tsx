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
  canDispatchPipelineItem,
  nextHandoffTask,
  summarizeTasks,
  type OrchestrationTask
} from "./orchestration";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from "./preferences";
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

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
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
  const visibleSessions = useMemo(
    () => [...projectMockSessions, ...basePresetSessions].slice(0, layout.columns * layout.rows),
    [basePresetSessions, layout.columns, layout.rows, projectMockSessions]
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
                  <div className="run-chip">
                    <Play size={14} />
                    {visibleSessions.length} visible
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
                    <SessionCell key={session.id} session={session} />
                  ))}
                </div>
              </>
            ) : view === "pipeline" ? (
              <PipelineView
                items={projectPipelineItems}
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
            mode={mode}
            mockRuns={projectMockRuns}
            onSelectRun={setSelectedRunId}
            onUpdateRunStatus={handleRunStatusChange}
            project={project}
            registryEntry={registryEntry}
            registrySummary={registrySummary}
            runtimeAdapter={runtimeAdapter}
            runtimeSummary={runtimeSummary}
            selectedRun={selectedRun}
            sessions={visibleSessions}
            tasks={projectTasks}
          />
        </div>
      </section>
    </main>
  );
}

function SessionCell({ session }: { session: SessionSummary }) {
  return (
    <article className={classNames("session-cell", `role-${session.role}`)}>
      <header className="cell-header">
        <div>
          <span className="cell-role">{session.role}</span>
          <h3>{session.title}</h3>
        </div>
        <span className={classNames("state-chip", `state-${session.state}`)}>
          {stateIcon[session.state]}
          {session.state}
        </span>
      </header>

      <div className="cell-meta">
        <span title={session.branch}>
          <GitBranch size={14} />
          {session.branch}
        </span>
        <span>{session.runtime}</span>
        <span>Attempt {session.attempt}</span>
      </div>

      <div className="cell-transcript">
        {session.transcript.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <footer className="cell-footer">
        <span className="validation-label">{session.validation}</span>
        <div className="tool-row">
          {session.tools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </div>
      </footer>
    </article>
  );
}

function PipelineView({
  items,
  project,
  registryEntry,
  runtimeAdapter,
  tasks
}: {
  items: PipelineItem[];
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  runtimeAdapter?: RuntimeAdapter;
  tasks: OrchestrationTask[];
}) {
  const dispatchableItemCount = items.filter(canDispatchPipelineItem).length;
  const registryReady = registryEntry ? dispatchableRegistryEntries([registryEntry]).length === 1 : false;
  const runtimeReady = runtimeAdapter ? canRunWithAdapter(runtimeAdapter) : false;
  const dispatchableCount = registryReady && runtimeReady ? dispatchableItemCount : 0;
  const taskSummary = summarizeTasks(tasks);
  const handoffTask = nextHandoffTask(tasks);
  const handoff = handoffTask ? buildHandoffBrief(handoffTask, project) : undefined;

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
        <button disabled={dispatchableCount === 0} title={`${dispatchableCount} ready tasks`} type="button">
          <Play size={16} />
          Dispatch {dispatchableCount}
        </button>
      </div>

      <div className="pipeline-body">
        <div className="pipeline-left">
          <div className="pipeline-table" aria-label="Pipeline readiness">
            {items.map((item) => (
              <article className="pipeline-row" key={item.id}>
                <div>
                  <span className={classNames("pipeline-stage", `stage-${item.stage}`)}>{item.stage}</span>
                  <h4>{item.title}</h4>
                </div>
                <span>{item.owner}</span>
                <span>{item.risk}</span>
                <span>{item.readiness}%</span>
              </article>
            ))}
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

        <aside className="handoff-panel" aria-label="Next handoff preview">
          <header>
            <div>
              <span className="eyebrow">Next Handoff</span>
              <h4>{handoff?.title ?? "No task selected"}</h4>
            </div>
            {handoffTask ? (
              <span className={classNames("task-status", `task-${handoffTask.status}`)}>{handoffTask.status}</span>
            ) : null}
          </header>
          <pre>{handoff?.markdown ?? "No scoped task is ready for handoff."}</pre>
        </aside>
      </div>
    </section>
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
  mode,
  mockRuns,
  onSelectRun,
  onUpdateRunStatus,
  project,
  registryEntry,
  registrySummary,
  runtimeAdapter,
  runtimeSummary,
  selectedRun,
  sessions,
  tasks
}: {
  mode: CockpitMode;
  mockRuns: MockOrchestratorRun[];
  onSelectRun: (runId: string) => void;
  onUpdateRunStatus: (runId: string, nextStatus: MockRunStatus) => void;
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  registrySummary: ReturnType<typeof summarizeRegistry>;
  runtimeAdapter?: RuntimeAdapter;
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
  const blocked = sessions.filter((session) => session.state === "blocked").length;
  const complete = sessions.filter((session) => session.state === "complete").length;
  const taskSummary = summarizeTasks(tasks);
  const runSummary = summarizeRunHistory(mockRuns);
  const latestRun = runSummary.latestRun;
  const selectedTimeline = useMemo(
    () => (selectedRun ? buildRunTimeline(selectedRun) : []),
    [selectedRun]
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
  const runtimeAdapterSessionSnapshot = buildRuntimeAdapterSessionSnapshot(
    runtimeAdapter,
    runtimeStreamSnapshot
  );
  const runtimeEventSourceSnapshot = buildRuntimeEventSourceSnapshot(
    runtimeAdapterSessionSnapshot,
    runtimeStreamSnapshot,
    runtimeIngestionEvents
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
  const canStartStream =
    Boolean(selectedRun) &&
    runtimeIngestionEvents.length > 0 &&
    runtimeAdapterBridgeSnapshot.canStream &&
    runtimeStreamSnapshot.state !== "streaming" &&
    runtimeStreamSnapshot.state !== "complete" &&
    runtimeStreamSnapshot.state !== "blocked";
  const canPauseStream = Boolean(selectedRun) && runtimeStreamSnapshot.state === "streaming";
  const canResetStream =
    Boolean(selectedRun) &&
    (runtimeStreamSnapshot.cursor > 0 || runtimeStreamSnapshot.state !== "idle");

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

      <section className="panel-section">
        <h4>Mode</h4>
        <div className="mode-summary">
          <Workflow size={16} />
          <span>{modeLabels[mode]}</span>
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
          launchRequest={runtimeLaunchRequestSnapshot}
          onAttach={() => updateBridgeIntent("attached")}
          onCancelApproval={() => updateLaunchApprovalIntent("idle")}
          onDetach={() => updateBridgeIntent("detached")}
          onRequestApproval={() => updateLaunchApprovalIntent("requested")}
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
      <RuntimeAdapterBridgeStatus bridge={bridge} onAttach={onAttach} onDetach={onDetach} />
      <RuntimeLaunchRequestStatus
        approval={approval}
        launchRequest={launchRequest}
        onCancelApproval={onCancelApproval}
        onRequestApproval={onRequestApproval}
      />
    </div>
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
  launchRequest,
  onCancelApproval,
  onRequestApproval
}: {
  approval: RuntimeLaunchApprovalSnapshot;
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
    </div>
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
