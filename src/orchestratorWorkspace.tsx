import type { ReactNode } from "react";
import type { OrchestratorPresentationMode } from "./preferences";

const enabledClassroomModeFeatureValues = new Set(["true", "1", "yes", "on"]);

export function isClassroomModeFeatureEnabled(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  return typeof value === "string" && enabledClassroomModeFeatureValues.has(value.trim().toLowerCase());
}

export interface PresentationSwitchProps {
  mode: OrchestratorPresentationMode;
  onModeChange: (mode: OrchestratorPresentationMode) => void;
}

export function PresentationSwitch({ mode, onModeChange }: PresentationSwitchProps) {
  return (
    <div
      aria-label="Orchestrator presentation"
      className="orchestrator-presentation-switch"
      role="group"
    >
      <button
        aria-pressed={mode === "professional"}
        onClick={() => onModeChange("professional")}
        type="button"
      >
        Professional
      </button>
      <button
        aria-pressed={mode === "classroom"}
        onClick={() => onModeChange("classroom")}
        type="button"
      >
        Classroom
      </button>
    </div>
  );
}

export interface OrchestratorWorkspaceProps {
  classroomModeEnabled: boolean;
  presentationMode: OrchestratorPresentationMode;
  onPresentationModeChange: (mode: OrchestratorPresentationMode) => void;
  professionalContent: ReactNode;
  classroomContent?: ReactNode;
}

export function OrchestratorWorkspace({
  classroomModeEnabled,
  presentationMode,
  onPresentationModeChange,
  professionalContent,
  classroomContent
}: OrchestratorWorkspaceProps) {
  if (!classroomModeEnabled) {
    return <>{professionalContent}</>;
  }

  return (
    <section
      aria-label="Orchestrator workspace"
      className="orchestrator-workspace"
      data-orchestrator-presentation={presentationMode}
    >
      <PresentationSwitch mode={presentationMode} onModeChange={onPresentationModeChange} />
      <div className="orchestrator-presentation-content">
        {presentationMode === "classroom" ? (
          classroomContent ?? (
            <div
              aria-label="Classroom presentation"
              className="orchestrator-classroom-placeholder"
              role="region"
            >
              <strong>Classroom Mode foundation</strong>
              <span>The durable Classroom presentation will be added in the next implementation slices.</span>
            </div>
          )
        ) : (
          professionalContent
        )}
      </div>
    </section>
  );
}
