import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Columns3,
  GitBranch,
  Grid2X2,
  LayoutDashboard,
  PanelRight,
  Play,
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

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function App() {
  const validProjectIds = useMemo(() => projects.map((item) => item.id), []);
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() =>
    loadWorkspacePreferences(validProjectIds)
  );
  const { selectedProjectId, mode, layoutId, view } = preferences;

  useEffect(() => {
    saveWorkspacePreferences(preferences);
  }, [preferences]);

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

  const visibleSessions = useMemo(() => {
    const presetSessions = preset.sessionIds
      .map((sessionId) => sessions.find((session) => session.id === sessionId))
      .filter((session): session is SessionSummary => Boolean(session));

    return presetSessions.slice(0, layout.columns * layout.rows);
  }, [layout.columns, layout.rows, preset.sessionIds]);

  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const registryEntry = registryByProject.get(project.id);
  const runtimeAdapter = runtimeByProject.get(project.id);
  const registrySummary = summarizeRegistry(registryEntries);
  const runtimeSummary = summarizeRuntimeAdapters(runtimeAdapters);
  const projectPipelineItems = useMemo(
    () => pipelineItems.filter((item) => item.projectId === project.id),
    [project.id]
  );
  const projectTasks = useMemo(
    () => orchestrationTasks.filter((task) => task.projectId === project.id),
    [project.id]
  );

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
            </div>
          </div>
        </header>

        <div className="content-split">
          <section className="main-surface" aria-label={view === "cockpit" ? "Cockpit" : "Pipeline"}>
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
            ) : (
              <PipelineView
                items={projectPipelineItems}
                project={project}
                registryEntry={registryEntry}
                runtimeAdapter={runtimeAdapter}
                tasks={projectTasks}
              />
            )}
          </section>

          <RightPanel
            mode={mode}
            project={project}
            registryEntry={registryEntry}
            registrySummary={registrySummary}
            runtimeAdapter={runtimeAdapter}
            runtimeSummary={runtimeSummary}
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

function RightPanel({
  mode,
  project,
  registryEntry,
  registrySummary,
  runtimeAdapter,
  runtimeSummary,
  sessions,
  tasks
}: {
  mode: CockpitMode;
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  registrySummary: ReturnType<typeof summarizeRegistry>;
  runtimeAdapter?: RuntimeAdapter;
  runtimeSummary: ReturnType<typeof summarizeRuntimeAdapters>;
  sessions: SessionSummary[];
  tasks: OrchestrationTask[];
}) {
  const blocked = sessions.filter((session) => session.state === "blocked").length;
  const complete = sessions.filter((session) => session.state === "complete").length;
  const taskSummary = summarizeTasks(tasks);

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
