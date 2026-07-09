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
  details: OrchestratorLedgerUiDetail[];
  entries: OrchestratorLedgerEntry[];
}

export interface OrchestratorLedgerUiDetail {
  label: string;
  value: string;
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

export interface OrchestratorRunReportUiSummary {
  id: string;
  runId: string;
  generatedAt: string;
  title: string;
  markdown: string;
  recommendedNextAction?: string;
  finalizationStatus?: string;
  cleanupStatus?: string;
  acceptedCommitCount: number;
  validationEvidenceCount: number;
  exportFormats: string[];
}

export interface OrchestratorCleanupQueueUiSummary {
  total: number;
  scheduled: number;
  retentionActive: number;
  ready: number;
  running: number;
  blocked: number;
  completed: number;
  failed: number;
  cancelled: number;
  label: string;
  detail: string;
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

function payloadRecord(entry: OrchestratorLedgerEntry, key: string): Record<string, unknown> | undefined {
  const value = entry.payload[key];

  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function payloadRecordList(entry: OrchestratorLedgerEntry, key: string): Record<string, unknown>[] {
  const value = entry.payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
      )
    : [];
}

function recordString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function recordStringList(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function recordNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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

function compactList(values: readonly string[], max = 3): string {
  const unique = [...new Set(values.filter((value) => value.trim().length > 0))];
  const visible = unique.slice(0, max);
  const hiddenCount = Math.max(unique.length - visible.length, 0);

  return hiddenCount > 0 ? `${visible.join(", ")} +${hiddenCount}` : visible.join(", ");
}

function commandLabels(entries: readonly OrchestratorLedgerEntry[]): string[] {
  return entries.flatMap((entry) => {
    const stepCommands = payloadRecordList(entry, "steps").map((step) => {
      const command = recordString(step, "command");
      const status = recordString(step, "status");

      return command ? `${command}${status ? ` (${status})` : ""}` : undefined;
    });
    const reportCommands = payloadRecordList(entry, "commandsRun").map((commandResult) => {
      const command = recordString(commandResult, "command");
      const status = recordString(commandResult, "status");

      return command ? `${command}${status ? ` (${status})` : ""}` : undefined;
    });

    return [
      ...stepCommands,
      ...reportCommands,
      ...payloadStringList(entry, "validationCommands")
    ].filter((value): value is string => Boolean(value));
  });
}

function acceptanceLabels(entries: readonly OrchestratorLedgerEntry[]): string[] {
  return entries.flatMap((entry) =>
    payloadRecordList(entry, "acceptanceResults").map((result) => {
      const criterion = recordString(result, "criterion");
      const status = recordString(result, "status");

      return criterion ? `${criterion}${status ? ` (${status})` : ""}` : undefined;
    }).filter((value): value is string => Boolean(value))
  );
}

function findingLabels(entries: readonly OrchestratorLedgerEntry[]): string[] {
  return entries.flatMap((entry) =>
    payloadRecordList(entry, "findings").map((finding) => {
      const message = recordString(finding, "message");
      const severity = recordString(finding, "severity");

      return message ? `${message}${severity ? ` (${severity})` : ""}` : undefined;
    }).filter((value): value is string => Boolean(value))
  );
}

function budgetLabels(entries: readonly OrchestratorLedgerEntry[]): string[] {
  return entries.flatMap((entry) => {
    const budget = payloadRecord(entry, "budget");

    if (!budget) {
      return [];
    }

    const attempts = recordNumber(budget, "maxWorkerAttempts");
    const minutes = recordNumber(budget, "maxRuntimeMinutes");
    const tokens = recordNumber(budget, "maxTokens");
    const parts = [
      attempts > 0 ? `${attempts} attempts` : undefined,
      minutes > 0 ? `${minutes} min` : undefined,
      tokens > 0 ? `${tokens} tokens` : undefined
    ].filter(Boolean);

    return parts.length > 0 ? [parts.join(" / ")] : [];
  });
}

function buildSectionDetails(entries: readonly OrchestratorLedgerEntry[]): OrchestratorLedgerUiDetail[] {
  const latest = entries.at(-1);
  const changedFiles = entries.flatMap((entry) => payloadStringList(entry, "changedFiles"));
  const ownedFiles = entries.flatMap((entry) => payloadStringList(entry, "ownedFiles"));
  const evidence = entries.flatMap((entry) => [
    ...payloadStringList(entry, "evidenceReferences"),
    ...payloadStringList(entry, "artifactPaths")
  ]);
  const commands = commandLabels(entries);
  const acceptance = acceptanceLabels(entries);
  const findings = findingLabels(entries);
  const budgets = budgetLabels(entries);
  const verdict = latest ? payloadText(latest, "verdict") : undefined;
  const nextAction = latest ? payloadText(latest, "nextAction") : undefined;
  const cleanupStatus = latest ? payloadText(latest, "cleanupStatus") : undefined;
  const commandKind = latest ? payloadText(latest, "commandKind") : undefined;
  const details: OrchestratorLedgerUiDetail[] = [];

  if (commands.length > 0) {
    details.push({ label: "Commands", value: compactList(commands) });
  }

  if (changedFiles.length > 0 || ownedFiles.length > 0) {
    details.push({ label: changedFiles.length > 0 ? "Changed files" : "Owned files", value: compactList(changedFiles.length > 0 ? changedFiles : ownedFiles) });
  }

  if (budgets.length > 0) {
    details.push({ label: "Budget", value: compactList(budgets) });
  }

  if (findings.length > 0) {
    details.push({ label: "Findings", value: compactList(findings) });
  }

  if (acceptance.length > 0) {
    details.push({ label: "Acceptance", value: compactList(acceptance) });
  }

  if (evidence.length > 0) {
    details.push({ label: "Evidence", value: compactList(evidence) });
  }

  if (verdict || nextAction) {
    details.push({ label: "Verdict", value: [verdict, nextAction].filter(Boolean).join(" -> ") });
  }

  if (cleanupStatus || commandKind) {
    details.push({ label: cleanupStatus ? "Cleanup" : "Command", value: cleanupStatus ?? commandKind ?? "" });
  }

  return details;
}

function cleanupStatusFromEntry(entry: OrchestratorLedgerEntry): string | undefined {
  const status = payloadText(entry, "cleanupStatus");

  return status === "scheduled" ||
    status === "retention-active" ||
    status === "ready" ||
    status === "running" ||
    status === "blocked" ||
    status === "completed" ||
    status === "failed" ||
    status === "cancelled"
    ? status
    : undefined;
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
      details: buildSectionDetails(sectionEntries),
      entries: sectionEntries
    };
  });
}

export function selectCleanupQueueSummaryForUi(
  entries: readonly OrchestratorLedgerEntry[],
  runId?: string
): OrchestratorCleanupQueueUiSummary {
  const latestByJob = new Map<string, OrchestratorLedgerEntry>();

  for (const entry of entries) {
    if (entry.kind !== "cleanup.updated" || (runId && entry.runId !== runId) || !cleanupStatusFromEntry(entry)) {
      continue;
    }

    const jobId = payloadText(entry, "cleanupJobId") ?? entry.id;
    const previous = latestByJob.get(jobId);

    if (!previous || previous.createdAt <= entry.createdAt) {
      latestByJob.set(jobId, entry);
    }
  }

  const summary = [...latestByJob.values()].reduce(
    (acc, entry) => {
      const status = cleanupStatusFromEntry(entry);

      return {
        ...acc,
        total: acc.total + 1,
        scheduled: acc.scheduled + (status === "scheduled" ? 1 : 0),
        retentionActive: acc.retentionActive + (status === "retention-active" ? 1 : 0),
        ready: acc.ready + (status === "ready" ? 1 : 0),
        running: acc.running + (status === "running" ? 1 : 0),
        blocked: acc.blocked + (status === "blocked" ? 1 : 0),
        completed: acc.completed + (status === "completed" ? 1 : 0),
        failed: acc.failed + (status === "failed" ? 1 : 0),
        cancelled: acc.cancelled + (status === "cancelled" ? 1 : 0)
      };
    },
    {
      total: 0,
      scheduled: 0,
      retentionActive: 0,
      ready: 0,
      running: 0,
      blocked: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }
  );

  const label = summary.total === 0
    ? "No cleanup"
    : `${summary.total} cleanup job${summary.total === 1 ? "" : "s"}`;

  return {
    ...summary,
    label,
    detail:
      `${label}; ${summary.ready} ready; ${summary.running} running; ` +
      `${summary.blocked} blocked; ${summary.retentionActive} in retention.`
  };
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

export function selectLatestOrchestratorRunReportForUi(
  entries: readonly OrchestratorLedgerEntry[],
  runId?: string
): OrchestratorRunReportUiSummary | undefined {
  const reportEntry = [...entries]
    .filter((entry) =>
      (!runId || entry.runId === runId) &&
      typeof entry.payload.reportMarkdown === "string" &&
      typeof entry.payload.reportId === "string"
    )
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    .at(-1);

  if (!reportEntry) {
    return undefined;
  }

  const summaryJson = payloadRecord(reportEntry, "summaryJson") ?? {};
  const reportId = payloadText(reportEntry, "reportId") ?? reportEntry.id;

  return {
    id: reportId,
    runId: reportEntry.runId,
    generatedAt: reportEntry.createdAt,
    title: `Run report ${reportEntry.runId}`,
    markdown: payloadText(reportEntry, "reportMarkdown") ?? "",
    recommendedNextAction: payloadText(reportEntry, "recommendedNextAction") ?? recordString(summaryJson, "recommendedNextAction"),
    finalizationStatus: recordString(summaryJson, "finalizationStatus"),
    cleanupStatus: recordString(summaryJson, "cleanupStatus"),
    acceptedCommitCount: recordStringList(summaryJson, "acceptedCommitShas").length,
    validationEvidenceCount: recordNumber(summaryJson, "validationEvidenceCount"),
    exportFormats: payloadStringList(reportEntry, "exportFormats")
  };
}

export function isProgressKind(kind: OrchestratorEventKind | "event.ignored"): boolean {
  return kind === "worker.progress" || kind === "validator.reported" || kind === "integration.updated";
}
