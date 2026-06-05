import { describe, expect, it } from "vitest";
import type {
  LiveActionPermissionRequest,
  LiveActionPermissionRequestSummaryInput,
  LiveActionPermissionState
} from "./liveActionPermission";
import {
  canExecuteLiveAction,
  buildLiveActionPermissionRequestSummary
} from "./liveActionPermission";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS,
  summarizeLiveActionRunnerExecutions
} from "./liveActionRunner";
import {
  buildLiveActionAuditExportMarkdown,
  createLiveActionAuditRecord
} from "./liveActionAudit";
import { createSecurityAcceptanceRepeatedRuns } from "./securityAcceptanceRepeatedRuns";
import type {
  SecurityAcceptanceCoverageSnapshot,
  SecurityAcceptanceCoverageState
} from "./securityAcceptanceCoverage";

function buildRunnerCoverageSnapshot(
  runnerId: string,
  canExecute: boolean
): SecurityAcceptanceCoverageSnapshot {
  const state: SecurityAcceptanceCoverageState = canExecute ? "ready" : "blocked";

  return {
    id: `runner-${runnerId}`,
    label: `Runner ${runnerId}`,
    state,
    statusLabel: canExecute ? "Ready" : "Blocked",
    readiness: canExecute ? 100 : 0,
    detail: `Runner ${runnerId} execution is ${state}.`,
    safety: "No process action is performed.",
    canAdvanceSecurity: canExecute,
    items: [],
    ariaLabel: `runner-${runnerId} ${state}`
  };
}

const baseRequest: LiveActionPermissionRequest = {
  id: "live-action-runner-001",
  provider: "terminal",
  actionLabel: "Run terminal command for live smoke test",
  state: "requested",
  requestedAt: "2026-06-06T00:00:00.000Z",
  timeoutMs: 60000,
  risk: "high"
};

describe("live action runner security gate evaluation", () => {
  it("does not execute when approval is missing in idle/requested/denied/timed-out states", () => {
    const requestStates: Array<LiveActionPermissionState> = [
      "idle",
      "requested",
      "denied",
      "timed-out"
    ];

    for (const state of requestStates) {
      const request: LiveActionPermissionRequest = {
        ...baseRequest,
        state
      };

      expect(canExecuteLiveAction(request, "2026-06-06T00:01:00.000Z")).toBe(false);
      expect(
        evaluateLiveActionRunnerExecution(
          LIVE_ACTION_RUNNER_DEFINITIONS[0],
          request,
          "2026-06-06T00:01:00.000Z"
        ).canExecute
      ).toBe(false);
    }
  });

  it("does not execute expired approved requests", () => {
    const request: LiveActionPermissionRequest = {
      ...baseRequest,
      state: "approved",
      requestedAt: "2026-06-06T00:00:00.000Z",
      timeoutMs: 1000
    };

    expect(canExecuteLiveAction(request, "2026-06-06T00:00:02.000Z")).toBe(false);
    const result = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      request,
      "2026-06-06T00:00:02.000Z"
    );

    expect(result.canExecute).toBe(false);
    expect(result.blockReason).toBe("expired");
  });

  it("prevents execution when the runner provider does not match the approved permission", () => {
    const terminalPermission: LiveActionPermissionRequest = {
      ...baseRequest,
      state: "approved",
      requestedAt: "2026-06-06T00:00:00.000Z",
      timeoutMs: 60000
    };

    const terminalResult = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      terminalPermission,
      "2026-06-06T00:00:10.000Z"
    );
    const pluginResult = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[3],
      terminalPermission,
      "2026-06-06T00:00:10.000Z"
    );

    expect(terminalResult.canExecute).toBe(true);
    expect(pluginResult.canExecute).toBe(false);
    expect(pluginResult.blockReason).toBe("provider-mismatch");
  });
});

describe("live action runner dry-run/audit redaction", () => {
  it("redacts transcript and sensitive tokens in permission summaries used for preview", () => {
    const summaryInput: LiveActionPermissionRequestSummaryInput = {
      id: "preview-1",
      provider: "terminal",
      actionLabel: "Run /tmp/private/deploy.sh for operator-bearer sk-abc123xyz987654321",
      state: "approved",
      requestedAt: "2026-06-06T00:00:00.000Z",
      timeoutMs: 60000,
      requestedBy: "agent-token sk-9876543210abcdef",
      transcript: [
        "Reading /var/ci/private/token.txt",
        "authorization=Bearer superSecretTokenValue"
      ],
      detail:
        "command detail for /etc/secrets and bearer abcdefghijklmnopqrstuvwxyz token payload",
      risk: "high"
    };

    const summary = buildLiveActionPermissionRequestSummary(summaryInput);

    expect(summary.actionLabel).toContain("[redacted path]");
    expect(summary.actionLabel).not.toContain("/tmp/private/deploy.sh");
    expect(summary.requestedBy).not.toContain("sk-9876543210abcdef");
    expect(summary.requestedBy).not.toContain("superSecretTokenValue");
    expect(summary.detail).not.toContain("/etc/secrets");
    expect(summary.detail).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(summary.transcriptLineCount).toBe(2);
  });

  it("omits raw transcript lines and redacts secrets/paths from audit markdown output", () => {
    const record = createLiveActionAuditRecord(
      {
        what: "Run /var/ci/private/secrets.sh",
        why: "Manual run for terminal smoke coverage.",
        provider: "terminal",
        workspace: "D:\\Users\\ProjectAtlas\\Workspace\\Secret\\Path",
        service: "terminal-service",
        resultSummary:
          "authorization=Bearer sk-abcdef1234567890 and api_key=supersecret-rotation-token",
        risk: "high"
      },
      "requested",
      "2026-06-06T00:00:00.000Z",
      [
        "transcript output contains /tmp/private/key.txt",
        "raw token=sk-abcdef1234567890"
      ]
    );

    const markdown = buildLiveActionAuditExportMarkdown([record]);

    expect(markdown).toContain("## Entries");
    expect(markdown).not.toContain("/var/ci/private/secrets.sh");
    expect(markdown).not.toContain("D:\\Users\\ProjectAtlas\\Workspace\\Secret\\Path");
    expect(markdown).not.toContain("raw token=sk-abcdef1234567890");
    expect(markdown).not.toContain("/tmp/private/key.txt");
    expect(markdown).not.toContain("authorization=Bearer");
    expect(markdown).not.toContain("api_key=supersecret-rotation-token");
    expect(markdown).not.toContain("sk-abcdef");
  });
});

describe("live action runner milestone summary safety", () => {
  it("keeps milestone state blocked when any runner cannot execute", () => {
    const approvedAndExecutable = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      {
        ...baseRequest,
        provider: "terminal",
        state: "approved",
        requestedAt: "2026-06-06T00:00:00.000Z",
        timeoutMs: 60000
      },
      "2026-06-06T00:00:10.000Z"
    ).canExecute;

    const deniedRunner = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[1],
      {
        ...baseRequest,
        provider: "git",
        state: "denied",
        requestedAt: "2026-06-06T00:00:00.000Z",
        timeoutMs: 60000
      },
      "2026-06-06T00:00:10.000Z"
    ).canExecute;

    const runnerSummary = summarizeLiveActionRunnerExecutions([
      evaluateLiveActionRunnerExecution(
        LIVE_ACTION_RUNNER_DEFINITIONS[0],
        {
          ...baseRequest,
          state: "approved",
          requestedAt: "2026-06-06T00:00:00.000Z",
          timeoutMs: 60000
        },
        "2026-06-06T00:00:10.000Z"
      ),
      evaluateLiveActionRunnerExecution(
        LIVE_ACTION_RUNNER_DEFINITIONS[1],
        {
          ...baseRequest,
          provider: "git",
          state: "denied",
          requestedAt: "2026-06-06T00:00:00.000Z",
          timeoutMs: 60000
        },
        "2026-06-06T00:00:10.000Z"
      )
    ]);

    const summary = createSecurityAcceptanceRepeatedRuns([
      buildRunnerCoverageSnapshot("terminal", approvedAndExecutable),
      buildRunnerCoverageSnapshot("git-denied", deniedRunner)
    ]);

    expect(runnerSummary.blocked).toBe(1);
    expect(runnerSummary.nextAction).toBe("resolve-denial");
    expect(summary.state).toBe("blocked");
    expect(summary.blockedRunCount).toBe(1);
    expect(summary.canCloseEvidence).toBe(false);
    expect(summary.items[3].label).toBe("Blocked run coverage");
    expect(summary.items[3].status).toBe("blocked");
  });
});
