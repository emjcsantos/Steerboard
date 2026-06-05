import { describe, expect, it } from "vitest";
import { LIVE_ACTION_RUNNER_DEFINITIONS, evaluateLiveActionRunnerExecution, summarizeLiveActionRunnerExecutions } from "./liveActionRunner";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

function buildRequest(overrides: Partial<LiveActionPermissionRequest> = {}): LiveActionPermissionRequest {
  return {
    id: "live-action-1",
    provider: "terminal",
    actionLabel: "Run terminal command",
    state: "requested",
    requestedAt: "2026-06-06T01:00:00.000Z",
    timeoutMs: 15 * 60 * 1000,
    ...overrides
  };
}

describe("live action runner definitions", () => {
  it("defines all required providers", () => {
    expect(LIVE_ACTION_RUNNER_DEFINITIONS.map((definition) => definition.provider)).toEqual([
      "terminal",
      "git",
      "mcp",
      "plugin",
      "automation",
      "external-service",
      "runtime-launch",
      "profile-activation"
    ]);
  });
});

describe("live action runner execution", () => {
  it.each(LIVE_ACTION_RUNNER_DEFINITIONS.map((definition) => [definition.provider, definition]))(
    "returns a dry-run ready result for approved requests on %s",
    (_, definition) => {
      const result = evaluateLiveActionRunnerExecution(
        definition,
        buildRequest({
          provider: definition.provider,
          state: "approved"
        }),
        "2026-06-06T01:10:00.000Z"
      );

      expect(result.status).toBe("ready");
      expect(result.canExecute).toBe(true);
      expect(result.blockReason).toBe("");
      expect(result.nextAction).toBe("run-dry-run");
      expect(result.auditRecord.action).toBe("approved");
      expect(result.auditRecord.resultSummary).toContain("dry-run");
    }
  );

  it("returns blocked for denied requests", () => {
    const definition = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const result = evaluateLiveActionRunnerExecution(
      definition,
      buildRequest({ provider: "terminal", state: "denied" }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(result.status).toBe("blocked");
    expect(result.canExecute).toBe(false);
    expect(result.blockReason).toBe("denied");
    expect(result.nextAction).toBe("resolve-denial");
    expect(result.auditRecord.action).toBe("denied");
  });

  it("returns blocked for requested actions", () => {
    const definition = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const result = evaluateLiveActionRunnerExecution(
      definition,
      buildRequest({ provider: "terminal", state: "requested" }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(result.status).toBe("blocked");
    expect(result.nextAction).toBe("request-approval");
    expect(result.blockReason).toBe("requested");
  });

  it("returns blocked for idle actions", () => {
    const definition = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const result = evaluateLiveActionRunnerExecution(
      definition,
      buildRequest({ provider: "terminal", state: "idle" }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(result.status).toBe("blocked");
    expect(result.blockReason).toBe("idle");
    expect(result.auditRecord.action).toBe("requested");
  });

  it("returns blocked for timed-out and expired actions", () => {
    const timedOut = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      buildRequest({ provider: "terminal", state: "timed-out" }),
      "2026-06-06T01:30:00.000Z"
    );

    const expired = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      buildRequest({
        provider: "terminal",
        state: "approved",
        requestedAt: "2026-06-06T01:00:00.000Z",
        timeoutMs: 60_000
      }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(timedOut.status).toBe("blocked");
    expect(timedOut.blockReason).toBe("timed-out");
    expect(expired.status).toBe("blocked");
    expect(expired.blockReason).toBe("expired");
  });

  it("returns blocked for provider mismatch", () => {
    const terminalDefinition = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const result = evaluateLiveActionRunnerExecution(
      terminalDefinition,
      buildRequest({ provider: "git", state: "approved" }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(result.status).toBe("blocked");
    expect(result.blockReason).toBe("provider-mismatch");
    expect(result.nextAction).toBe("resolve-provider-mismatch");
    expect(result.auditRecord.resultSummary).toContain("provider");
  });

  it("summarizes runner readiness with counts and next action", () => {
    const firstProvider = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const secondProvider = LIVE_ACTION_RUNNER_DEFINITIONS[1];
    const thirdProvider = LIVE_ACTION_RUNNER_DEFINITIONS[2];

    const summary = summarizeLiveActionRunnerExecutions([
      evaluateLiveActionRunnerExecution(
        firstProvider,
        buildRequest({ provider: "terminal", state: "approved" }),
        "2026-06-06T01:05:00.000Z"
      ),
      evaluateLiveActionRunnerExecution(
        secondProvider,
        buildRequest({ provider: "git", state: "approved" }),
        "2026-06-06T01:05:00.000Z"
      ),
      evaluateLiveActionRunnerExecution(
        thirdProvider,
        buildRequest({ provider: "mcp", state: "requested" }),
        "2026-06-06T01:05:00.000Z"
      )
    ]);

    expect(summary).toEqual({
      total: 3,
      ready: 2,
      blocked: 1,
      readiness: 67,
      nextAction: "request-approval"
    });
  });

  it("does not leak secret-like values or private paths", () => {
    const definition = LIVE_ACTION_RUNNER_DEFINITIONS[0];
    const sensitiveResult = evaluateLiveActionRunnerExecution(
      definition,
      buildRequest({
        provider: "terminal",
        state: "denied",
        actionLabel: "Read /tmp/private/token.txt with bearer sk-ABCDEF1234567890",
        id: "/tmp/private/probe"
      }),
      "2026-06-06T01:30:00.000Z"
    );

    expect(sensitiveResult.reason).not.toContain("/tmp/private/token.txt");
    expect(sensitiveResult.reason).not.toContain("sk-ABCDEF1234567890");
    expect(sensitiveResult.reason).not.toContain("bearer");
    expect(sensitiveResult.auditRecord.resultSummary).not.toContain("/tmp/private/token.txt");
    expect(sensitiveResult.auditRecord.resultSummary).not.toContain("sk-ABCDEF1234567890");
    expect(sensitiveResult.auditRecord.id).not.toContain("/tmp/private/probe");
  });

  it("does not mutate the input request object", () => {
    const request = buildRequest({
      provider: "automation",
      state: "approved",
      actionLabel: "Run clean up and push"
    });
    const frozenRequest = Object.freeze({ ...request, id: "immutable-request" }) as LiveActionPermissionRequest;
    const baseline = JSON.stringify(frozenRequest);
    evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[3],
      frozenRequest,
      "2026-06-06T01:30:00.000Z"
    );

    expect(JSON.stringify(frozenRequest)).toBe(baseline);
  });
});
