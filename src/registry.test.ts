import { describe, expect, it } from "vitest";
import {
  dispatchableRegistryEntries,
  normalizeRegistryEntry,
  summarizeRegistry,
  type RegistryEntry
} from "./registry";

describe("registry normalization", () => {
  it("repairs invalid status, runtime state, and readiness values", () => {
    const repaired = normalizeRegistryEntry({
      projectId: "",
      projectName: "Workspace Hub",
      status: "offline",
      workspaceLabel: "<Team/Workspace>\nControl",
      runtimeState: "crashed",
      permissionState: "missing",
      readiness: "100%"
    });

    expect(repaired).toEqual({
      projectId: "project-unknown",
      projectName: "Workspace Hub",
      status: "queued",
      workspaceLabel: "Team Workspace Control",
      runtimeState: "stopped",
      permissionState: "review",
      readiness: 0
    });
  });
});

describe("dispatch gating", () => {
  it("keeps only active entries that are runtime-ready and sufficiently prepared", () => {
    const entries: RegistryEntry[] = [
      {
        projectId: "project-1",
        projectName: "Project 1",
        status: "active",
        workspaceLabel: "Project 1",
        runtimeState: "ready",
        permissionState: "allowed",
        readiness: 82
      },
      {
        projectId: "project-2",
        projectName: "Project 2",
        status: "active",
        workspaceLabel: "Project 2",
        runtimeState: "starting",
        permissionState: "allowed",
        readiness: 98
      },
      {
        projectId: "project-3",
        projectName: "Project 3",
        status: "queued",
        workspaceLabel: "Project 3",
        runtimeState: "ready",
        permissionState: "allowed",
        readiness: 99
      },
      {
        projectId: "project-4",
        projectName: "Project 4",
        status: "active",
        workspaceLabel: "Project 4",
        runtimeState: "ready",
        permissionState: "review",
        readiness: 79
      }
    ];

    expect(dispatchableRegistryEntries(entries).map((entry) => entry.projectId)).toEqual(["project-1"]);
  });
});

describe("registry summary", () => {
  it("counts by status, runtime state, and total entries", () => {
    const entries: RegistryEntry[] = [
      {
        projectId: "project-a",
        projectName: "Alpha",
        status: "active",
        workspaceLabel: "Alpha workspace",
        runtimeState: "ready",
        permissionState: "allowed",
        readiness: 84
      },
      {
        projectId: "project-b",
        projectName: "Beta",
        status: "blocked",
        workspaceLabel: "Beta workspace",
        runtimeState: "error",
        permissionState: "blocked",
        readiness: 12
      },
      {
        projectId: "project-c",
        projectName: "Gamma",
        status: "queued",
        workspaceLabel: "Gamma workspace",
        runtimeState: "starting",
        permissionState: "review",
        readiness: 66
      },
      {
        projectId: "project-d",
        projectName: "Delta",
        status: "active",
        workspaceLabel: "Delta workspace",
        runtimeState: "ready",
        permissionState: "review",
        readiness: 74
      }
    ];

    expect(summarizeRegistry(entries)).toEqual({
      total: 4,
      byStatus: {
        active: 2,
        queued: 1,
        blocked: 1
      },
      byRuntimeState: {
        ready: 2,
        starting: 1,
        stopped: 0,
        error: 1
      }
    });
  });
});
