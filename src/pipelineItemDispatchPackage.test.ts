import { describe, expect, it } from "vitest";
import type { PipelineItem, ProjectSummary } from "./fixtures";
import type { PipelineItemDispatchPreview } from "./pipelineItemDispatchPreview";
import { tryBuildPipelineItemDispatchPackage } from "./pipelineItemDispatchPackage";

const readyItem: PipelineItem = {
  id: "pipe-1",
  projectId: "website-refresh",
  title: "Define workspace registry",
  stage: "ready",
  owner: "Planning",
  risk: "medium",
  readiness: 92
};

const readyProject: ProjectSummary = {
  id: "website-refresh",
  name: "Website Refresh",
  status: "active",
  updated: "8m",
  runs: 4
};

const readyPreview: PipelineItemDispatchPreview = {
  itemId: readyItem.id,
  title: readyItem.title,
  stage: readyItem.stage,
  readiness: readyItem.readiness,
  risk: readyItem.risk,
  owner: readyItem.owner,
  state: "ready",
  canDispatch: true,
  gates: [
    {
      id: "item",
      label: "Pipeline item",
      status: "ready",
      detail: "Item is ready."
    }
  ],
  detail: "Dispatch is ready."
};

describe("pipeline item dispatch package", () => {
  it("returns failure when the selected item preview cannot dispatch", () => {
    const blockedPreview: PipelineItemDispatchPreview = {
      ...readyPreview,
      state: "review",
      canDispatch: false,
      detail: "Dispatch requires review."
    };

    const result = tryBuildPipelineItemDispatchPackage(
      readyItem,
      readyProject,
      blockedPreview,
      {
        createdAt: "2026-06-04T00:00:00.000Z"
      }
    );

    expect(result).toEqual({
      ok: false,
      preview: blockedPreview
    });
  });

  it("builds a deterministic public-safe dispatch package from a ready item", () => {
    const options = {
      createdAt: "2026-06-04T11:00:00.000Z",
      idSeed: "pipeline-seed",
      status: "ready" as const
    };

    const first = tryBuildPipelineItemDispatchPackage(
      readyItem,
      readyProject,
      readyPreview,
      options
    );
    const second = tryBuildPipelineItemDispatchPackage(
      readyItem,
      readyProject,
      readyPreview,
      options
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    if (!first.ok || !second.ok) {
      throw new Error("Expected package creation to succeed");
    }

    expect(first.package).toEqual(second.package);
    expect(first.package.id).toContain("pipeline-seed");
    expect(first.package.id).toContain("website-refresh");
    expect(first.package.id).toContain("pipe-1");
    expect(first.package.targetProject).toEqual({
      id: "website-refresh",
      name: "Website Refresh"
    });
    expect(first.package.sourceDraftTitle).toBe("Define workspace registry");
    expect(first.package.deployMode).toBe("staged");
    expect(first.package.status).toBe("ready");
    expect(first.package.risk).toBe("medium");
    expect(first.package.scope.length).toBeGreaterThanOrEqual(2);
    expect(first.package.fileAreas).toEqual([
      "Pipeline item pipe-1",
      "Project lane website-refresh"
    ]);
  });

  it("defaults createdAt and staged status when options are omitted", () => {
    const result = tryBuildPipelineItemDispatchPackage(
      readyItem,
      readyProject,
      readyPreview
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected package creation to succeed");
    }

    expect(result.package.status).toBe("staged");
    expect(new Date(result.package.createdAt).toString()).not.toBe("Invalid Date");
    expect(result.package.id).toContain("pipeline-dispatch");
  });

  it("uses safe fallback values and strips path-like separators from generated text", () => {
    const unsafeItem: PipelineItem = {
      ...readyItem,
      id: "",
      title: "  Launch / private\\lane  ",
      owner: "  Owner\\One  "
    };
    const unsafeProject: ProjectSummary = {
      ...readyProject,
      id: "",
      name: "  Project / private\\workspace "
    };

    const result = tryBuildPipelineItemDispatchPackage(
      unsafeItem,
      unsafeProject,
      readyPreview,
      {
        createdAt: "2026-06-04T12:00:00.000Z"
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected package creation to succeed");
    }

    const serialized = JSON.stringify(result.package);
    expect(result.package.targetProject).toEqual({
      id: "project",
      name: "Project private workspace"
    });
    expect(result.package.sourceDraftTitle).toBe("Launch private lane");
    expect(result.package.fileAreas).toEqual([
      "Pipeline item pipeline-item",
      "Project lane project"
    ]);
    expect(serialized).not.toMatch(/[\\/]/);
    expect(serialized).not.toContain("C:");
  });
});
