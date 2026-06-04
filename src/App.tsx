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
  permissionSurfaces,
  pipelineItems,
  projects,
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
  loadWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from "./preferences";

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

  const visibleSessions = useMemo(() => {
    const presetSessions = preset.sessionIds
      .map((sessionId) => sessions.find((session) => session.id === sessionId))
      .filter((session): session is SessionSummary => Boolean(session));

    return presetSessions.slice(0, layout.columns * layout.rows);
  }, [layout.columns, layout.rows, preset.sessionIds]);

  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];

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
                <small>{item.runs} runs</small>
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
              <PipelineView items={pipelineItems} />
            )}
          </section>

          <RightPanel mode={mode} project={project} sessions={visibleSessions} />
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

function PipelineView({ items }: { items: PipelineItem[] }) {
  return (
    <section className="pipeline-view">
      <div className="pipeline-header">
        <h3>Project Pipeline</h3>
        <button disabled={items.some((item) => item.readiness < 80)} type="button">
          <Play size={16} />
          Dispatch
        </button>
      </div>

      <div className="pipeline-table">
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
    </section>
  );
}

function RightPanel({
  mode,
  project,
  sessions
}: {
  mode: CockpitMode;
  project: ProjectSummary;
  sessions: SessionSummary[];
}) {
  const blocked = sessions.filter((session) => session.state === "blocked").length;
  const complete = sessions.filter((session) => session.state === "complete").length;

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
