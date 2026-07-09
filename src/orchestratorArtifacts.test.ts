import { describe, expect, it } from "vitest";
import {
  artifactsReferencedByAcceptedEvidence,
  buildArtifactPath,
  canCleanupArtifact,
  createArtifactMetadataFromText,
  createArtifactMetadataFromStoredFile,
  criterionEvidenceRequirementsFromTask,
  linkEvidenceToAcceptanceResults,
  serializeArtifactsForSqlite,
  sha256Hex,
  type ValidationEvidence
} from "./orchestratorArtifacts";
import type { ValidatorReport } from "./orchestratorValidatorLoop";

const createdAt = "2026-07-09T08:00:00.000Z";

function report(): ValidatorReport {
  return {
    id: "report-1",
    runId: "run-123",
    taskId: "task-1",
    workerJobId: "worker-1",
    validatorJobId: "validator-1",
    attempt: 1,
    verdict: "pass",
    findings: [],
    commandsRun: [
      {
        command: "npm.cmd run test -- src/example.test.ts",
        status: "passed",
        detail: "Passed"
      }
    ],
    acceptanceResults: [
      {
        criterion: "Unit test proves behavior.",
        status: "pass",
        evidence: ["evidence-test"]
      },
      {
        criterion: "Screenshot proves layout.",
        status: "pass",
        evidence: ["evidence-note"]
      }
    ],
    changedFiles: ["src/example.ts"],
    evidenceReferences: ["artifact-1"],
    nextAction: "accept",
    createdAt
  };
}

describe("orchestrator artifacts and validation evidence", () => {
  it("builds stable project-local artifact paths", () => {
    expect(
      buildArtifactPath({
        artifactRoot: ".steerboard/artifacts",
        runId: "Run 123",
        taskId: "Task 1",
        artifactId: "Validator Report",
        kind: "validator-report"
      })
    ).toBe(".steerboard/artifacts/run-123/task-1/validator-report.md");
  });

  it("computes real SHA-256 metadata and SQLite rows for text artifacts", async () => {
    const artifact = await createArtifactMetadataFromText({
      artifactRoot: ".steerboard/artifacts",
      id: "artifact-1",
      runId: "run-123",
      taskId: "task-1",
      jobId: "validator-1",
      attempt: 1,
      kind: "validator-report",
      content: "validator report",
      createdAt
    });

    expect(artifact.sha256).toHaveLength(64);
    expect(artifact.sha256).toBe(await sha256Hex(new TextEncoder().encode("validator report")));
    expect(serializeArtifactsForSqlite([artifact])[0]).toMatchObject({
      id: "artifact-1",
      run_id: "run-123",
      task_id: "task-1",
      job_id: "validator-1",
      attempt: 1,
      kind: "validator-report",
      size_bytes: 16
    });
  });

  it("computes metadata from existing project-local artifact files", async () => {
    const path = ".steerboard/artifacts/run-123/task-1/validator.log";
    const artifact = await createArtifactMetadataFromStoredFile({
      id: "artifact-file",
      runId: "run-123",
      taskId: "task-1",
      jobId: "validator-1",
      attempt: 2,
      kind: "validation-output",
      path,
      artifactRoot: ".steerboard/artifacts",
      createdAt,
      readFile: async (requestedPath) => {
        expect(requestedPath).toBe(path);
        return "validator stdout";
      }
    });

    expect(artifact).toMatchObject({
      id: "artifact-file",
      runId: "run-123",
      taskId: "task-1",
      jobId: "validator-1",
      attempt: 2,
      kind: "validation-output",
      path,
      sizeBytes: 16
    });
    expect(artifact.sha256).toBe(await sha256Hex(new TextEncoder().encode("validator stdout")));
  });

  it("rejects missing files and artifacts outside the project-local artifact root", async () => {
    await expect(
      createArtifactMetadataFromStoredFile({
        id: "missing",
        runId: "run-123",
        kind: "log",
        path: ".steerboard/artifacts/run-123/missing.log",
        artifactRoot: ".steerboard/artifacts",
        createdAt,
        readFile: async () => {
          throw new Error("ENOENT");
        }
      })
    ).rejects.toThrow("orchestrator_artifact_file_missing:.steerboard/artifacts/run-123/missing.log");

    await expect(
      createArtifactMetadataFromStoredFile({
        id: "outside",
        runId: "run-123",
        kind: "log",
        path: "C:\\tmp\\outside.log",
        artifactRoot: ".steerboard/artifacts",
        createdAt,
        readFile: async () => "not reached"
      })
    ).rejects.toThrow("orchestrator_artifact_outside_root:C:\\tmp\\outside.log");
  });

  it("derives per-criterion evidence requirements from PM task evidence kinds", () => {
    expect(
      criterionEvidenceRequirementsFromTask({
        acceptanceCriteria: ["Tests pass.", "Build passes."],
        evidenceKinds: ["test", "build"]
      })
    ).toEqual([
      {
        criterion: "Tests pass.",
        acceptedKinds: ["test", "build"]
      },
      {
        criterion: "Build passes.",
        acceptedKinds: ["test", "build"]
      }
    ]);
  });

  it("links evidence to acceptance criteria and detects unacceptable evidence kinds", () => {
    const evidence: ValidationEvidence[] = [
      {
        id: "evidence-test",
        kind: "unit-test",
        artifactId: "artifact-test",
        summary: "Vitest passed.",
        createdAt
      },
      {
        id: "evidence-note",
        kind: "manual-note",
        artifactId: "artifact-note",
        summary: "Looks fine.",
        createdAt
      }
    ];
    const links = linkEvidenceToAcceptanceResults({
      report: report(),
      evidence,
      requirements: [
        {
          criterion: "Unit test proves behavior.",
          acceptedKinds: ["unit-test"]
        },
        {
          criterion: "Screenshot proves layout.",
          acceptedKinds: ["screenshot", "rendered-inspection"]
        }
      ]
    });

    expect(links).toEqual([
      {
        criterion: "Unit test proves behavior.",
        status: "pass",
        evidenceIds: ["evidence-test"],
        artifactIds: ["artifact-test"],
        missingAcceptedEvidence: false
      },
      {
        criterion: "Screenshot proves layout.",
        status: "pass",
        evidenceIds: ["evidence-note"],
        artifactIds: ["artifact-note"],
        missingAcceptedEvidence: true
      }
    ]);
  });

  it("protects artifacts referenced by accepted validation evidence from cleanup", async () => {
    const artifact = await createArtifactMetadataFromText({
      artifactRoot: ".steerboard/artifacts",
      id: "artifact-test",
      runId: "run-123",
      kind: "validation-output",
      content: "passed",
      createdAt
    });
    const acceptedIds = artifactsReferencedByAcceptedEvidence([
      {
        criterion: "Unit test proves behavior.",
        status: "pass",
        evidenceIds: ["evidence-test"],
        artifactIds: ["artifact-test"],
        missingAcceptedEvidence: false
      }
    ]);

    expect(canCleanupArtifact(artifact, acceptedIds)).toBe(false);
    expect(canCleanupArtifact(artifact, acceptedIds, true)).toBe(true);
  });
});
