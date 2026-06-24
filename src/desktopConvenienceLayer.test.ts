import { describe, expect, it } from "vitest";
import {
  annotateImageAttachment,
  buildSessionSearchDocuments,
  createNotificationRecord,
  mapAttachmentToProviderImageInput,
  searchSessionDocuments,
  validateImageAttachment
} from "./desktopConvenienceLayer";
import type { SessionSummary } from "./fixtures";
import type { PanelChatMessage } from "./panelChat";

const session: SessionSummary = {
  id: "s1",
  projectId: "p1",
  title: "Crawler work",
  role: "implementer",
  state: "idle",
  branch: "codex/task",
  runtime: "codex",
  attempt: 1,
  validation: "pending",
  files: [],
  transcript: [],
  tools: []
};

describe("image attachments", () => {
  it("accepts supported image types and blocks unsupported files", () => {
    expect(validateImageAttachment({
      id: "a1",
      fileName: "screen.png",
      mimeType: "image/png",
      sizeBytes: 100
    }).state).toBe("accepted");

    expect(validateImageAttachment({
      id: "a2",
      fileName: "notes.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100
    })).toMatchObject({
      state: "blocked",
      reason: "Unsupported attachment type."
    });
  });

  it("saves annotations and maps accepted images to provider input", () => {
    const attachment = annotateImageAttachment(
      validateImageAttachment({
        id: "a1",
        fileName: "screen.webp",
        mimeType: "image/webp",
        sizeBytes: 100,
        dataUrl: "data:image/webp;base64,abc"
      }),
      "Focus on the error banner."
    );

    expect(attachment.annotation).toBe("Focus on the error banner.");
    expect(mapAttachmentToProviderImageInput(attachment, true)).toEqual({
      type: "input_image",
      imageUrl: "data:image/webp;base64,abc",
      annotation: "Focus on the error banner."
    });
    expect(mapAttachmentToProviderImageInput(attachment, false)).toBeUndefined();
  });
});

describe("notifications", () => {
  it("dedupes notification records and respects preferences", () => {
    const preference = { enabled: true, kinds: ["turn-complete" as const] };
    const first = createNotificationRecord(preference, [], {
      kind: "turn-complete",
      title: "Done",
      body: "Turn completed.",
      dedupeKey: "turn-1"
    }, "2026-06-24T00:00:00.000Z");
    const duplicate = createNotificationRecord(preference, first ? [first] : [], {
      kind: "turn-complete",
      title: "Done",
      body: "Turn completed.",
      dedupeKey: "turn-1"
    });
    const blocked = createNotificationRecord({ enabled: false, kinds: ["turn-complete"] }, [], {
      kind: "turn-complete",
      title: "Done",
      body: "Turn completed.",
      dedupeKey: "turn-2"
    });

    expect(first?.id).toContain("notification");
    expect(duplicate).toBeUndefined();
    expect(blocked).toBeUndefined();
  });
});

describe("session search", () => {
  it("indexes title, chat messages, and protocol summaries", () => {
    const messages: PanelChatMessage[] = [{
      id: "m1",
      role: "codex",
      label: "Codex",
      body: "Crawler finished matching Lazada rows.",
      meta: "complete"
    }];
    const docs = buildSessionSearchDocuments({
      sessions: [session],
      messagesBySession: { s1: messages },
      ledgersBySession: {
        s1: [{
          id: "l1",
          kind: "web_search",
          method: "web/search",
          title: "Search",
          summary: "Lazada API docs",
          status: "completed"
        }]
      }
    });

    expect(searchSessionDocuments(docs, "lazada api")).toHaveLength(1);
  });

  it("redacts secrets from search payloads", () => {
    const docs = buildSessionSearchDocuments({
      sessions: [session],
      messagesBySession: {
        s1: [{
          id: "m1",
          role: "user",
          label: "You",
          body: "api_key=super-secret-value",
          meta: "live"
        }]
      }
    });

    expect(docs[0].safeText).not.toContain("super-secret-value");
    expect(docs[0].safeText).toContain("[redacted secret]");
  });
});

