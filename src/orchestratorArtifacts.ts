import type { AcceptanceCriterionResult, ValidatorReport } from "./orchestratorValidatorLoop";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";
import type { PmWorkerReadyTask, ValidationEvidenceKind } from "./pmLaneWorkerReady";

export type OrchestratorArtifactKind =
  | "screenshot"
  | "log"
  | "report"
  | "diff"
  | "validation-output"
  | "worker-handoff"
  | "validator-report";

export interface OrchestratorArtifact {
  id: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  attempt?: number;
  kind: OrchestratorArtifactKind;
  path: string;
  sha256: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ValidationEvidence {
  id: string;
  kind: ValidationEvidenceKind;
  artifactId?: string;
  summary: string;
  createdAt: string;
}

export interface CriterionEvidenceRequirement {
  criterion: string;
  acceptedKinds: ValidationEvidenceKind[];
}

export interface CriterionEvidenceLink {
  criterion: string;
  status: AcceptanceCriterionResult["status"];
  evidenceIds: string[];
  artifactIds: string[];
  missingAcceptedEvidence: boolean;
}

export interface OrchestratorArtifactSqliteRow {
  id: string;
  run_id: string;
  task_id: string | null;
  job_id: string | null;
  attempt: number | null;
  kind: OrchestratorArtifactKind;
  path: string;
  sha256: string;
  size_bytes: number;
  created_at: string;
}

function normalizeSegment(value: string, fallback: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 80) || fallback;
}

function extensionForKind(kind: OrchestratorArtifactKind): string {
  switch (kind) {
    case "screenshot":
      return "png";
    case "diff":
      return "diff";
    case "log":
    case "validation-output":
      return "log";
    default:
      return "md";
  }
}

function joinArtifactPath(parts: string[]): string {
  return parts
    .map((part, index) => (index === 0 ? part.replace(/[\\/]+$/, "") : part.replace(/^[\\/]+|[\\/]+$/g, "")))
    .filter((part) => part.length > 0)
    .join("/");
}

function normalizePathForComparison(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/g, "");
}

function bytesFromText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesFromStoredContent(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? bytesFromText(content) : content;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error("sha256_unavailable");
  }

  const stableBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return bytesToHex(await subtle.digest("SHA-256", stableBuffer));
}

export function buildArtifactPath(input: {
  artifactRoot: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  artifactId: string;
  kind: OrchestratorArtifactKind;
}): string {
  return joinArtifactPath([
    input.artifactRoot,
    normalizeSegment(input.runId, "run"),
    normalizeSegment(input.taskId ?? "run", "task"),
    input.jobId ? normalizeSegment(input.jobId, "job") : "",
    `${normalizeSegment(input.artifactId, "artifact")}.${extensionForKind(input.kind)}`
  ]);
}

export async function createArtifactMetadataFromText(input: {
  artifactRoot: string;
  id: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  attempt?: number;
  kind: OrchestratorArtifactKind;
  content: string;
  createdAt: string;
}): Promise<OrchestratorArtifact> {
  const bytes = bytesFromText(input.content);

  return {
    id: input.id,
    runId: input.runId,
    taskId: input.taskId,
    jobId: input.jobId,
    attempt: input.attempt,
    kind: input.kind,
    path: buildArtifactPath({
      artifactRoot: input.artifactRoot,
      runId: input.runId,
      taskId: input.taskId,
      jobId: input.jobId,
      artifactId: input.id,
      kind: input.kind
    }),
    sha256: await sha256Hex(bytes),
    sizeBytes: bytes.byteLength,
    createdAt: input.createdAt
  };
}

export async function createArtifactMetadataFromStoredFile(input: {
  id: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  attempt?: number;
  kind: OrchestratorArtifactKind;
  path: string;
  artifactRoot?: string;
  createdAt: string;
  readFile: (path: string) => Promise<string | Uint8Array>;
}): Promise<OrchestratorArtifact> {
  if (input.artifactRoot) {
    const root = normalizePathForComparison(input.artifactRoot);
    const artifactPath = normalizePathForComparison(input.path);

    if (artifactPath !== root && !artifactPath.startsWith(`${root}/`)) {
      throw new Error(`orchestrator_artifact_outside_root:${input.path}`);
    }
  }

  let bytes: Uint8Array;

  try {
    bytes = bytesFromStoredContent(await input.readFile(input.path));
  } catch {
    throw new Error(`orchestrator_artifact_file_missing:${input.path}`);
  }

  return {
    id: input.id,
    runId: input.runId,
    taskId: input.taskId,
    jobId: input.jobId,
    attempt: input.attempt,
    kind: input.kind,
    path: input.path,
    sha256: await sha256Hex(bytes),
    sizeBytes: bytes.byteLength,
    createdAt: input.createdAt
  };
}

function artifactKindFromPath(path: string): OrchestratorArtifactKind {
  const lower = path.toLowerCase();

  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
    return "screenshot";
  }

  if (lower.endsWith(".diff") || lower.endsWith(".patch")) {
    return "diff";
  }

  if (lower.includes("validator") && (lower.includes("report") || lower.endsWith(".md"))) {
    return "validator-report";
  }

  if (lower.includes("stdout") || lower.includes("stderr") || lower.includes("validation")) {
    return "validation-output";
  }

  if (lower.endsWith(".log") || lower.endsWith(".jsonl")) {
    return "log";
  }

  return "report";
}

export async function createArtifactMetadataFromRuntimeResult(input: {
  result: OrchestratorRuntimeCommandResult;
  artifactRoot: string;
  taskId?: string;
  jobId?: string;
  attempt?: number;
  createdAt: string;
  readFile: (path: string) => Promise<string | Uint8Array>;
}): Promise<OrchestratorArtifact[]> {
  return Promise.all(
    input.result.artifactPaths.map((path, index) =>
      createArtifactMetadataFromStoredFile({
        id: `${input.result.commandId}:artifact:${index + 1}`,
        runId: input.result.runId,
        taskId: input.taskId,
        jobId: input.jobId,
        attempt: input.attempt,
        kind: artifactKindFromPath(path),
        path,
        artifactRoot: input.artifactRoot,
        createdAt: input.createdAt,
        readFile: input.readFile
      })
    )
  );
}

export function serializeArtifactsForSqlite(
  artifacts: readonly OrchestratorArtifact[]
): OrchestratorArtifactSqliteRow[] {
  return artifacts.map((artifact) => ({
    id: artifact.id,
    run_id: artifact.runId,
    task_id: artifact.taskId ?? null,
    job_id: artifact.jobId ?? null,
    attempt: artifact.attempt ?? null,
    kind: artifact.kind,
    path: artifact.path,
    sha256: artifact.sha256,
    size_bytes: artifact.sizeBytes,
    created_at: artifact.createdAt
  }));
}

function normalizeArtifactKind(value: string): OrchestratorArtifactKind {
  return value === "screenshot" ||
    value === "log" ||
    value === "report" ||
    value === "diff" ||
    value === "validation-output" ||
    value === "worker-handoff" ||
    value === "validator-report"
    ? value
    : "report";
}

export function hydrateArtifactsFromSqlite(
  artifacts: readonly OrchestratorArtifactSqliteRow[]
): OrchestratorArtifact[] {
  return artifacts.map((artifact) => ({
    id: artifact.id,
    runId: artifact.run_id,
    taskId: artifact.task_id ?? undefined,
    jobId: artifact.job_id ?? undefined,
    attempt: artifact.attempt ?? undefined,
    kind: normalizeArtifactKind(artifact.kind),
    path: artifact.path,
    sha256: artifact.sha256,
    sizeBytes: artifact.size_bytes,
    createdAt: artifact.created_at
  }));
}

export function linkEvidenceToAcceptanceResults(input: {
  report: ValidatorReport;
  evidence: readonly ValidationEvidence[];
  requirements: readonly CriterionEvidenceRequirement[];
}): CriterionEvidenceLink[] {
  return input.report.acceptanceResults.map((result) => {
    const requirement = input.requirements.find((item) => item.criterion === result.criterion);
    const matchedEvidence = input.evidence.filter((item) => result.evidence.includes(item.id));
    const acceptedKinds = requirement?.acceptedKinds ?? [];
    const hasAcceptedEvidence =
      acceptedKinds.length === 0 || matchedEvidence.some((item) => acceptedKinds.includes(item.kind));

    return {
      criterion: result.criterion,
      status: result.status,
      evidenceIds: matchedEvidence.map((item) => item.id),
      artifactIds: matchedEvidence
        .map((item) => item.artifactId)
        .filter((artifactId): artifactId is string => Boolean(artifactId)),
      missingAcceptedEvidence: result.status === "pass" && !hasAcceptedEvidence
    };
  });
}

export function criterionEvidenceRequirementsFromTask(
  task: Pick<PmWorkerReadyTask, "acceptanceCriteria" | "evidenceKinds">
): CriterionEvidenceRequirement[] {
  return task.acceptanceCriteria.map((criterion) => ({
    criterion,
    acceptedKinds: [...task.evidenceKinds]
  }));
}

export function artifactsReferencedByAcceptedEvidence(
  links: readonly CriterionEvidenceLink[]
): Set<string> {
  return new Set(
    links
      .filter((link) => link.status === "pass" && !link.missingAcceptedEvidence)
      .flatMap((link) => link.artifactIds)
  );
}

export function canCleanupArtifact(
  artifact: OrchestratorArtifact,
  acceptedEvidenceArtifactIds: ReadonlySet<string>,
  retentionAllowsAcceptedEvidenceRemoval = false
): boolean {
  return retentionAllowsAcceptedEvidenceRemoval || !acceptedEvidenceArtifactIds.has(artifact.id);
}
