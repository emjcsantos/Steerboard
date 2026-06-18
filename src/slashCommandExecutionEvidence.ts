import {
  getPanelSlashCommandDecision,
  type PanelSlashCommand,
  type PanelSlashCommandDecision
} from "./panelChat";

export interface SlashCommandExecutionEvidenceInput {
  readonly submittedMessage?: unknown;
  readonly liveTransportAvailable?: unknown;
  readonly commandCatalog?: unknown;
  readonly transcriptMessages?: unknown;
}

export interface SlashCommandExecutionEvidenceCounts {
  readonly providerRoute: number;
  readonly status: number;
  readonly live: number;
  readonly error: number;
}

export interface SlashCommandExecutionStorageProof {
  readonly source: string;
  readonly panelId: string;
  readonly createdAt: string;
  readonly evidenceFingerprint: string;
}

export interface SlashCommandExecutionEvidence {
  readonly route: PanelSlashCommandDecision["route"];
  readonly state: "ready" | "review" | "blocked" | "waiting";
  readonly executable: boolean;
  readonly command?: string;
  readonly status: string;
  readonly readiness: number;
  readonly pass: boolean;
  readonly detail: string;
  readonly safety: string;
  readonly evidence: SlashCommandExecutionEvidenceCounts;
  readonly phase3StorageProof?: SlashCommandExecutionStorageProof;
}

const NO_EXECUTION_SAFETY =
  "No command execution is performed by this evidence builder; it only evaluates route classification and transcript evidence.";

const READY_STATE_LABELS = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
} as const;

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeCommandCatalog(
  catalog: unknown
): readonly PanelSlashCommand[] | undefined {
  if (!Array.isArray(catalog)) {
    return undefined;
  }

  return catalog as readonly PanelSlashCommand[];
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

function safeMessageArray(value: unknown): ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> => {
    return typeof item === "object" && item !== null && !Array.isArray(item);
  });
}

function scopeMessagesToSubmittedSlashCommand(
  messages: ReadonlyArray<Record<string, unknown>>,
  submittedMessage: string
): ReadonlyArray<Record<string, unknown>> {
  const normalizedSubmittedMessage = submittedMessage.trim();

  if (!normalizedSubmittedMessage.startsWith("/")) {
    return messages;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    const role = normalizeText((item as { role?: unknown }).role);
    const body = safeString((item as { body?: unknown }).body).trim();

    if (role === "user" && body === normalizedSubmittedMessage) {
      return messages.slice(index + 1);
    }
  }

  return messages;
}

function isProviderRouteEvidence(meta: string, body: string): boolean {
  return (
    meta.includes("slash command provider route") ||
    body.includes("routed through provider") ||
    body.includes("provider route")
  );
}

function isStatusEvidence(meta: string, body: string): boolean {
  return (
    (meta.includes("slash command") && !meta.includes("provider route")) ||
    (body.includes("slash command") && !body.includes("provider route"))
  );
}

function isLiveEvidence(meta: string, body: string, role: string): boolean {
  return (
    (meta.includes("live") || (role === "system" && body.includes("live"))) &&
    body !== "" &&
    !meta.includes("live error") &&
    !meta.includes("slash command")
  );
}

function isErrorEvidence(meta: string, body: string): boolean {
  return meta.includes("live error") || body.includes("error");
}

function countEvidence(
  transcriptMessages: unknown,
  submittedMessage: string
): SlashCommandExecutionEvidenceCounts {
  let providerRoute = 0;
  let status = 0;
  let live = 0;
  let error = 0;

  const scopedMessages = scopeMessagesToSubmittedSlashCommand(
    safeMessageArray(transcriptMessages),
    submittedMessage
  );

  for (const item of scopedMessages) {
    const meta = normalizeText((item as { meta?: unknown }).meta);
    const body = normalizeText((item as { body?: unknown }).body);
    const role = normalizeText((item as { role?: unknown }).role);

    if (isProviderRouteEvidence(meta, body)) {
      providerRoute += 1;
      continue;
    }

    if (isErrorEvidence(meta, body)) {
      error += 1;
      continue;
    }

    if (isStatusEvidence(meta, body)) {
      status += 1;
      continue;
    }

    if (isLiveEvidence(meta, body, role)) {
      live += 1;
    }
  }

  return {
    providerRoute,
    status,
    live,
    error
  };
}

function buildResult(
  decision: PanelSlashCommandDecision,
  evidence: SlashCommandExecutionEvidenceCounts
): SlashCommandExecutionEvidence {
  const hasProviderRouteEvidence = evidence.providerRoute > 0;
  const hasResultEvidence = evidence.status > 0 || evidence.live > 0;

  if (decision.route === "provider" && decision.state === "live") {
    if (decision.executable && hasProviderRouteEvidence && hasResultEvidence) {
      const detail = `${decision.reason} ${decision.feedback.nextAction} ${
        decision.feedback.statusLabel
      } signal has provider-route and live/status evidence in transcript.`;

      return {
        route: decision.route,
        executable: decision.executable,
        command: decision.command?.command,
        readiness: 100,
        state: "ready",
        pass: true,
        status: READY_STATE_LABELS.ready,
        detail,
        safety: NO_EXECUTION_SAFETY,
        evidence
      };
    }

    return {
      route: decision.route,
      executable: decision.executable,
      command: decision.command?.command,
      readiness: 40,
      state: "review",
      pass: false,
      status: READY_STATE_LABELS.review,
      detail: `${decision.reason} ${decision.feedback.nextAction} Live/provider execution readiness is incomplete until a provider-route message and at least one live/status transcript result are present.`,
      safety: NO_EXECUTION_SAFETY,
      evidence
    };
  }

  if (decision.route === "local-preview") {
    return {
      route: decision.route,
      executable: decision.executable,
      command: decision.command?.command,
      readiness: 35,
      state: "review",
      pass: false,
      status: READY_STATE_LABELS.review,
      detail: `${decision.reason} ${decision.feedback.nextAction} This command remains in local-preview review mode only.`,
      safety: NO_EXECUTION_SAFETY,
      evidence
    };
  }

  if (decision.route === "blocked") {
    return {
      route: decision.route,
      executable: decision.executable,
      command: decision.command?.command,
      readiness: 0,
      state: "blocked",
      pass: false,
      status: READY_STATE_LABELS.blocked,
      detail: `${decision.reason} ${decision.feedback.nextAction} No command execution is safe to proceed until routing and catalog policy allow it.`,
      safety: NO_EXECUTION_SAFETY,
      evidence
    };
  }

  return {
    route: decision.route,
    executable: decision.executable,
    command: decision.command?.command,
    readiness: 0,
    state: "waiting",
    pass: false,
    status: READY_STATE_LABELS.waiting,
    detail:
      decision.executable === false
        ? `${decision.reason} ${decision.feedback.nextAction}`
        : "No slash-command execution route was requested by the submitted message.",
    safety: NO_EXECUTION_SAFETY,
    evidence
  };
}

export function buildSlashCommandExecutionEvidence(
  input: SlashCommandExecutionEvidenceInput = {}
): SlashCommandExecutionEvidence {
  const submittedMessage = safeString(input.submittedMessage);
  const liveTransportAvailable = safeBoolean(input.liveTransportAvailable);
  const catalog = safeCommandCatalog(input.commandCatalog);
  const evidence = countEvidence(input.transcriptMessages, submittedMessage);

  const decision = catalog
    ? getPanelSlashCommandDecision(submittedMessage, liveTransportAvailable, catalog)
    : getPanelSlashCommandDecision(submittedMessage, liveTransportAvailable);

  return buildResult(decision, evidence);
}
