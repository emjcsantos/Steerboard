import type {
  OrchestratorEventKind,
  OrchestratorLedgerEntry
} from "./orchestratorBackend";

export type OrchestratorLedgerSectionKind =
  | "run"
  | "worker"
  | "validator"
  | "approval"
  | "integration"
  | "cleanup"
  | "other";

export interface OrchestratorLedgerFilter {
  runId?: string;
  taskId?: string;
  jobId?: string;
  attempt?: number;
  eventKind?: OrchestratorLedgerEntry["kind"];
  severity?: OrchestratorLedgerEntry["severity"];
  since?: string;
  until?: string;
}

export interface OrchestratorLedgerUiSection {
  id: string;
  kind: OrchestratorLedgerSectionKind;
  title: string;
  summary: string;
  collapsible: true;
  entries: OrchestratorLedgerEntry[];
}

export interface OrchestratorContextCheckpoint {
  runId: string;
  generatedAt: string;
  latestVerdict?: string;
  unresolvedFindingCount: number;
  changedFiles: string[];
  nextActions: string[];
  summaryLines: string[];
  excludedRawEventCount: number;
}

function payloadText(entry: OrchestratorLedgerEntry, key: string): string | undefined {
  const value = entry.payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function payloadNumber(entry: OrchestratorLedgerEntry, key: string): number | undefined {
  const value = entry.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function payloadStringList(entry: OrchestratorLedgerEntry, key: string): string[] {
  const value = entry.payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function sectionKindForEntry(entry: OrchestratorLedgerEntry): OrchestratorLedgerSectionKind {
  if (entry.kind === "run.created" || entry.kind === "run.phase.changed") {
    return "run";
  }

  if (entry.kind === "worker.progress") {
    return "worker";
  }

  if (entry.kind === "validator.reported") {
    return "validator";
  }

  if (entry.kind === "approval.requested") {
    return "approval";
  }

  if (entry.kind === "integration.updated") {
    return "integration";
  }

  if (entry.kind === "cleanup.updated") {
    return "cleanup";
  }

  return "other";
}

function sectionTitle(kind: OrchestratorLedgerSectionKind, entry: OrchestratorLedgerEntry): string {
  const taskId = payloadText(entry, "taskId");
  const attempt = payloadNumber(entry, "attempt");
  const suffix = [taskId, attempt ? `attempt ${attempt}` : undefined].filter(Boolean).join(" | ");

  switch (kind) {
    case "run":
      return suffix ? `Run | ${suffix}` : "Run";
    case "worker":
      return suffix ? `Worker | ${suffix}` : "Worker";
    case "validator":
      return suffix ? `Validator | ${suffix}` : "Validator";
    case "approval":
      return suffix ? `Approval | ${suffix}` : "Approval";
    case "integration":
      return suffix ? `Integration | ${suffix}` : "Integration";
    case "cleanup":
      return suffix ? `Cleanup | ${suffix}` : "Cleanup";
    case "other":
      return suffix ? `Other | ${suffix}` : "Other";
  }
}

function sectionKey(kind: OrchestratorLedgerSectionKind, entry: OrchestratorLedgerEntry): string {
  return [
    kind,
    entry.runId,
    payloadText(entry, "taskId") ?? "run",
    payloadText(entry, "jobId") ?? payloadText(entry, "workerJobId") ?? payloadText(entry, "validatorJobId") ?? "job",
    payloadNumber(entry, "attempt") ?? 0
  ].join(":");
}

function summarizeEntries(entries: readonly OrchestratorLedgerEntry[]): string {
  const last = entries.at(-1);

  if (!last) {
    return "No ledger entries.";
  }

  return `${entries.length} event${entries.length === 1 ? "" : "s"} | latest: ${last.message}`;
}

export function filterOrchestratorLedgerEntries(
  entries: readonly OrchestratorLedgerEntry[],
  filter: OrchestratorLedgerFilter
): OrchestratorLedgerEntry[] {
  return entries.filter((entry) => {
    if (filter.runId && entry.runId !== filter.runId) {
      return false;
    }

    if (filter.eventKind && entry.kind !== filter.eventKind) {
      return false;
    }

    if (filter.severity && entry.severity !== filter.severity) {
      return false;
    }

    if (filter.taskId && payloadText(entry, "taskId") !== filter.taskId) {
      return false;
    }

    if (filter.jobId) {
      const jobIds = [
        payloadText(entry, "jobId"),
        payloadText(entry, "workerJobId"),
        payloadText(entry, "validatorJobId")
      ];

      if (!jobIds.includes(filter.jobId)) {
        return false;
      }
    }

    if (filter.attempt !== undefined && payloadNumber(entry, "attempt") !== filter.attempt) {
      return false;
    }

    if (filter.since && entry.createdAt < filter.since) {
      return false;
    }

    if (filter.until && entry.createdAt > filter.until) {
      return false;
    }

    return true;
  });
}

export function groupOrchestratorLedgerForUi(
  entries: readonly OrchestratorLedgerEntry[],
  filter: OrchestratorLedgerFilter = {}
): OrchestratorLedgerUiSection[] {
  const filtered = filterOrchestratorLedgerEntries(entries, filter);
  const groups = new Map<string, OrchestratorLedgerEntry[]>();
  const titles = new Map<string, { kind: OrchestratorLedgerSectionKind; title: string }>();

  for (const entry of filtered) {
    const kind = sectionKindForEntry(entry);
    const key = sectionKey(kind, entry);

    groups.set(key, [...(groups.get(key) ?? []), entry]);
    titles.set(key, {
      kind,
      title: sectionTitle(kind, entry)
    });
  }

  return [...groups.entries()].map(([id, sectionEntries]) => {
    const title = titles.get(id);

    return {
      id,
      kind: title?.kind ?? "other",
      title: title?.title ?? "Other",
      summary: summarizeEntries(sectionEntries),
      collapsible: true,
      entries: sectionEntries
    };
  });
}

export function createOrchestratorContextCheckpoint(input: {
  runId: string;
  entries: readonly OrchestratorLedgerEntry[];
  generatedAt: string;
}): OrchestratorContextCheckpoint {
  const runEntries = filterOrchestratorLedgerEntries(input.entries, { runId: input.runId });
  const validatorEntries = runEntries.filter((entry) => entry.kind === "validator.reported");
  const latestValidator = validatorEntries.at(-1);
  const latestVerdict = payloadText(latestValidator ?? runEntries.at(-1) ?? {
    payload: {}
  } as OrchestratorLedgerEntry, "verdict") ?? payloadText(latestValidator ?? {
    payload: {}
  } as OrchestratorLedgerEntry, "nextAction");
  const changedFiles = [...new Set(runEntries.flatMap((entry) => payloadStringList(entry, "changedFiles")))];
  const nextActions = [
    ...new Set(
      runEntries
        .map((entry) => payloadText(entry, "nextAction"))
        .filter((value): value is string => Boolean(value))
    )
  ];
  const unresolvedFindingCount = runEntries.reduce((count, entry) => {
    const explicitCount = payloadNumber(entry, "findingCount");

    if (explicitCount !== undefined && explicitCount > 0 && payloadText(entry, "nextAction") !== "accept") {
      return count + explicitCount;
    }

    return count;
  }, 0);
  const summaryLines = [
    latestVerdict ? `Latest validator signal: ${latestVerdict}.` : undefined,
    unresolvedFindingCount > 0 ? `Unresolved findings: ${unresolvedFindingCount}.` : undefined,
    changedFiles.length > 0 ? `Changed files: ${changedFiles.join(", ")}.` : undefined,
    nextActions.length > 0 ? `Next actions: ${nextActions.join(", ")}.` : undefined
  ].filter((line): line is string => Boolean(line));

  return {
    runId: input.runId,
    generatedAt: input.generatedAt,
    latestVerdict,
    unresolvedFindingCount,
    changedFiles,
    nextActions,
    summaryLines,
    excludedRawEventCount: runEntries.length
  };
}

export function isProgressKind(kind: OrchestratorEventKind | "event.ignored"): boolean {
  return kind === "worker.progress" || kind === "validator.reported" || kind === "integration.updated";
}
