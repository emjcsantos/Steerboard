import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanningView } from "./App";

const project = {
  id: "classroom-seam-project",
  name: "Classroom Seam Project",
  status: "queued" as const,
  updated: "now",
  runs: 0
};

describe("Classroom presentation integration seam", () => {
  it("keeps the PM table as the first and default Project Management surface", () => {
    const html = renderToStaticMarkup(
      <PlanningView
        chatMessages={[]}
        dispatchReviewRecords={[]}
        onChatMessagesChange={() => undefined}
        onStagePackage={() => undefined}
        onTasksChange={() => undefined}
        project={project}
        projects={[project]}
        tasks={[]}
      />
    );

    expect(html).toContain('aria-label="Project Management surfaces"');
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain("PM Table");
    expect(html.match(/aria-selected="false"/g)).toHaveLength(1);
    expect(html).toContain("Orchestrator Preview");
    expect(html).toContain('aria-label="Project Management hierarchy table"');
    expect(html).not.toContain("pm-orchestrator-workbench-preview");
  });
});
