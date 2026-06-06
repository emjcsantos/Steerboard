import { describe, expect, it } from "vitest";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

describe("slash command execution evidence", () => {
  it("passes ready for live provider route when route and live/status evidence are present", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/plan now",
      liveTransportAvailable: true,
      transcriptMessages: [
        { role: "system", body: "/plan routed through provider", meta: "slash command provider route" },
        { role: "system", body: "Live command completed", meta: "live codex" }
      ]
    });

    expect(evidence).toMatchObject({
      route: "provider",
      state: "ready",
      executable: true,
      command: "/plan",
      pass: true,
      readiness: 100,
      status: "Ready"
    });
    expect(evidence.evidence).toEqual({
      providerRoute: 1,
      status: 0,
      live: 1,
      error: 0
    });
    expect(evidence.detail).toContain("provider-route and live/status evidence");
    expect(evidence.safety).toContain("No command execution");
  });

  it("returns review when provider route evidence is missing result confirmation", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/plan now",
      liveTransportAvailable: true,
      transcriptMessages: [{ role: "system", body: "/plan routed through provider", meta: "slash command provider route" }]
    });

    expect(evidence).toMatchObject({
      route: "provider",
      state: "review",
      executable: true,
      command: "/plan",
      pass: false,
      readiness: 40,
      status: "Review"
    });
    expect(evidence.evidence.providerRoute).toBe(1);
  });

  it("ignores stale live evidence before the submitted slash command", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/plan now",
      liveTransportAvailable: true,
      transcriptMessages: [
        { role: "system", body: "Live command completed", meta: "live codex" },
        { role: "user", body: "/plan now", meta: "/plan" },
        { role: "system", body: "/plan routed through provider", meta: "slash command provider route" }
      ]
    });

    expect(evidence).toMatchObject({
      route: "provider",
      state: "review",
      pass: false,
      readiness: 40
    });
    expect(evidence.evidence).toEqual({
      providerRoute: 1,
      status: 0,
      live: 0,
      error: 0
    });
  });

  it("returns blocked for panel-incompatible app/global commands", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/status now",
      liveTransportAvailable: true
    });

    expect(evidence).toMatchObject({
      route: "blocked",
      state: "blocked",
      executable: false,
      command: "/status",
      pass: false,
      readiness: 0,
      status: "Blocked"
    });
    expect(evidence.detail).toContain("No command execution");
  });

  it("returns review for preview/local-preview commands", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/validate now",
      liveTransportAvailable: true
    });

    expect(evidence).toMatchObject({
      route: "local-preview",
      state: "review",
      executable: true,
      command: "/validate",
      pass: false,
      status: "Review"
    });
    expect(evidence.detail).toContain("local-preview");
  });

  it("returns blocked for unknown commands with no execution detail", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: "/unknown",
      liveTransportAvailable: true
    });

    expect(evidence).toMatchObject({
      route: "blocked",
      state: "blocked",
      executable: false,
      pass: false,
      command: undefined,
      status: "Blocked"
    });
    expect(evidence.detail).toContain("Unknown slash command");
  });

  it("handles malformed input and transcript payloads without throwing", () => {
    const evidence = buildSlashCommandExecutionEvidence({
      submittedMessage: 123 as unknown as string,
      liveTransportAvailable: "true" as unknown as boolean,
      commandCatalog: "malformed-catalog" as unknown,
      transcriptMessages: [{ role: "user", body: 1 }, "bad", null, { bad: true }]
    });

    expect(evidence.route).toBe("none");
    expect(evidence.state).toBe("waiting");
    expect(evidence.pass).toBe(false);
    expect(evidence.evidence).toEqual({
      providerRoute: 0,
      status: 0,
      live: 0,
      error: 0
    });
  });
});
