import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  isClassroomModeFeatureEnabled,
  OrchestratorWorkspace
} from "./orchestratorWorkspace";

const professionalContent = <main>Professional workbench</main>;

describe("isClassroomModeFeatureEnabled", () => {
  it.each(["true", "1", "yes", "on", " TRUE ", true])("enables Classroom Mode for %j", (value) => {
    expect(isClassroomModeFeatureEnabled(value)).toBe(true);
  });

  it.each([undefined, null, false, "", "false", "0", "no", "off", 1])(
    "keeps Classroom Mode disabled for %j",
    (value) => {
      expect(isClassroomModeFeatureEnabled(value)).toBe(false);
    }
  );
});

describe("OrchestratorWorkspace", () => {
  it("renders only Professional content while the Classroom feature is disabled", () => {
    const html = renderToStaticMarkup(
      <OrchestratorWorkspace
        classroomModeEnabled={false}
        onPresentationModeChange={() => undefined}
        presentationMode="classroom"
        professionalContent={professionalContent}
      />
    );

    expect(html).toBe("<main>Professional workbench</main>");
    expect(html).not.toContain("Orchestrator presentation");
    expect(html).not.toContain("Classroom");
  });

  it("offers an accessible presentation switch when the feature is enabled", () => {
    const html = renderToStaticMarkup(
      <OrchestratorWorkspace
        classroomModeEnabled
        onPresentationModeChange={() => undefined}
        presentationMode="professional"
        professionalContent={professionalContent}
      />
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Orchestrator presentation"');
    expect(html).toContain('<button aria-pressed="true" type="button">Professional</button>');
    expect(html).toContain('<button aria-pressed="false" type="button">Classroom</button>');
    expect(html).toContain("Professional workbench");
  });

  it("renders the Classroom placeholder without changing the Professional content", () => {
    const html = renderToStaticMarkup(
      <OrchestratorWorkspace
        classroomModeEnabled
        onPresentationModeChange={() => undefined}
        presentationMode="classroom"
        professionalContent={professionalContent}
      />
    );

    expect(html).toContain('aria-label="Classroom presentation"');
    expect(html).toContain("Classroom Mode foundation");
    expect(html).toContain("next implementation slices");
    expect(html).not.toContain("Professional workbench");
  });

  it("accepts Classroom content through the shared presentation seam", () => {
    const html = renderToStaticMarkup(
      <OrchestratorWorkspace
        classroomContent={<main>Live classroom</main>}
        classroomModeEnabled
        onPresentationModeChange={() => undefined}
        presentationMode="classroom"
        professionalContent={professionalContent}
      />
    );

    expect(html).toContain("Live classroom");
    expect(html).not.toContain("Classroom Mode foundation");
  });
});
