import type { AcceptanceCriterionResult, ValidatorReport } from "./orchestratorValidatorLoop";
import type { ValidationEvidenceKind } from "./pmLaneWorkerReady";

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

function bytesFromText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
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
  artifactId: string;
  kind: OrchestratorArtifactKind;
}): string {
  return joinArtifactPath([
    input.artifactRoot,
    normalizeSegment(input.runId, "run"),
    normalizeSegment(input.taskId ?? "run", "task"),
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
      artifactId: input.id,
      kind: input.kind
    }),
    sha256: await sha256Hex(bytes),
    sizeBytes: bytes.byteLength,
    createdAt: input.createdAt
  };
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
