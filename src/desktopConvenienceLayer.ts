import type { CodexProtocolLedgerEntry } from "./codexSession";
import type { PanelChatMessage } from "./panelChat";
import type { SessionSummary } from "./fixtures";

export type AttachmentValidationState = "accepted" | "blocked";
export type NotificationKind = "turn-complete" | "approval-request" | "blocked" | "background-complete";

export interface ImageAttachmentDraft {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  annotation: string;
  state: AttachmentValidationState;
  reason: string;
}

export interface ProviderImageInput {
  type: "input_image";
  imageUrl: string;
  annotation?: string;
}

export interface NotificationPreference {
  enabled: boolean;
  kinds: NotificationKind[];
}

export interface NotificationRecord {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  dedupeKey: string;
  createdAt: string;
}

export interface SessionSearchDocument {
  id: string;
  sessionId: string;
  title: string;
  safeText: string;
}

const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function validateImageAttachment(input: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
}): ImageAttachmentDraft {
  const supported = SUPPORTED_IMAGE_TYPES.has(input.mimeType);
  const sizeOk = Number.isFinite(input.sizeBytes) && input.sizeBytes > 0 && input.sizeBytes <= MAX_IMAGE_BYTES;

  return {
    id: input.id,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    dataUrl: input.dataUrl,
    annotation: "",
    state: supported && sizeOk ? "accepted" : "blocked",
    reason: supported
      ? sizeOk
        ? "Image attachment accepted."
        : "Image attachment exceeds the supported size limit."
      : "Unsupported attachment type."
  };
}

export function annotateImageAttachment(
  attachment: ImageAttachmentDraft,
  annotation: string
): ImageAttachmentDraft {
  return {
    ...attachment,
    annotation: sanitizeText(annotation, 500)
  };
}

export function mapAttachmentToProviderImageInput(
  attachment: ImageAttachmentDraft,
  providerAcceptsImages: boolean
): ProviderImageInput | undefined {
  if (!providerAcceptsImages || attachment.state !== "accepted" || !attachment.dataUrl) {
    return undefined;
  }

  return {
    type: "input_image",
    imageUrl: attachment.dataUrl,
    annotation: attachment.annotation || undefined
  };
}

export function createNotificationRecord(
  preference: NotificationPreference,
  existing: readonly NotificationRecord[],
  input: Omit<NotificationRecord, "id" | "createdAt">,
  now = new Date().toISOString()
): NotificationRecord | undefined {
  if (!preference.enabled || !preference.kinds.includes(input.kind)) {
    return undefined;
  }

  if (existing.some((record) => record.dedupeKey === input.dedupeKey)) {
    return undefined;
  }

  return {
    ...input,
    id: `notification-${Date.parse(now) || Date.now()}-${existing.length + 1}`,
    createdAt: now
  };
}

export function buildSessionSearchDocuments(input: {
  sessions: readonly SessionSummary[];
  messagesBySession: Readonly<Record<string, readonly PanelChatMessage[]>>;
  ledgersBySession?: Readonly<Record<string, readonly CodexProtocolLedgerEntry[]>>;
}): SessionSearchDocument[] {
  return input.sessions.map((session) => {
    const messages = input.messagesBySession[session.id] ?? [];
    const ledger = input.ledgersBySession?.[session.id] ?? [];
    const safeText = sanitizeText(
      [
        session.title,
        session.role,
        session.state,
        session.branch,
        ...messages.map((message) => `${message.label} ${message.body} ${message.meta}`),
        ...ledger.map((entry) => `${entry.kind} ${entry.title ?? ""} ${entry.summary ?? ""} ${entry.status ?? ""}`)
      ].join(" "),
      5000
    );

    return {
      id: `session-search-${session.id}`,
      sessionId: session.id,
      title: session.title,
      safeText
    };
  });
}

export function searchSessionDocuments(
  documents: readonly SessionSearchDocument[],
  query: string
): SessionSearchDocument[] {
  const needle = sanitizeText(query, 200).toLowerCase();
  if (!needle) {
    return documents.slice(0, 20);
  }

  return documents
    .filter((document) => `${document.title} ${document.safeText}`.toLowerCase().includes(needle))
    .slice(0, 20);
}

function sanitizeText(value: string, limit: number): string {
  return value
    .replace(
      /\b(api[_-]?key|auth[_-]?token|access[_-]?token|bearer|secret|password|code)\b\s*[:=]?\s*[^\s"'`]+/gi,
      "[redacted secret]"
    )
    .replace(/\bsk-[A-Za-z0-9]{8,}\b/g, "[redacted secret]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{10,}\b/g, "[redacted secret]")
    .slice(0, limit)
    .trim();
}

