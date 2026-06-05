import { describe, expect, it } from "vitest";
import type { LiveActionProvider } from "./liveActionPermission";
import {
  applyLiveActionPermissionDecision,
  buildLiveActionPermissionRequestSummary,
  canExecuteLiveAction,
  isLiveActionPermissionExpired,
  isLiveActionPermissionStateTerminal,
  type LiveActionPermissionRequest
} from "./liveActionPermission";

const baseRequest: LiveActionPermissionRequest = {
  id: "runtime-launch-1",
  provider: "terminal" as LiveActionProvider,
  actionLabel: "Run package manager script",
  state: "requested",
  requestedAt: "2026-06-06T01:00:00.000Z",
  timeoutMs: 10 * 60 * 1000
};

describe("live action permissions", () => {
  it("allows execution only when state is approved and the request is risk-gated", () => {
    const request: LiveActionPermissionRequest = {
      ...baseRequest,
      state: "approved"
    };

    expect(canExecuteLiveAction(request, "2026-06-06T01:01:00.000Z")).toBe(true);
  });

  it("denies execution when a request is denied", () => {
    const denied = applyLiveActionPermissionDecision(
      baseRequest.state,
      "deny"
    ) as LiveActionPermissionRequest["state"];

    const request: LiveActionPermissionRequest = {
      ...baseRequest,
      state: denied
    };

    expect(canExecuteLiveAction(request, "2026-06-06T01:01:00.000Z")).toBe(false);
  });

  it("keeps timed-out actions non-executable", () => {
    const timedOut = applyLiveActionPermissionDecision(
      baseRequest.state,
      "timeout"
    ) as LiveActionPermissionRequest["state"];

    expect(isLiveActionPermissionStateTerminal(timedOut)).toBe(true);
    expect(canExecuteLiveAction({ ...baseRequest, state: timedOut }, "2026-06-06T01:20:00.000Z")).toBe(false);
  });

  it("returns false for approved requests that have expired", () => {
    const request: LiveActionPermissionRequest = {
      ...baseRequest,
      state: "approved",
      requestedAt: "2026-06-06T01:00:00.000Z",
      timeoutMs: 60000
    };

    expect(isLiveActionPermissionExpired(request, "2026-06-06T01:01:30.000Z")).toBe(true);
    expect(canExecuteLiveAction(request, "2026-06-06T01:01:30.000Z")).toBe(false);
  });

  it("sanitizes request summaries to remove raw transcript and secrets/path-like content", () => {
    const summary = buildLiveActionPermissionRequestSummary({
      id: "terminal-1",
      provider: "terminal",
      actionLabel: "Run /tmp/private/deploy.sh from D:\\Sensitive\\secrets",
      state: "approved",
      requestedAt: "2026-06-06T01:00:00.000Z",
      timeoutMs: 60000,
      requestedBy: "operator-bearer sk-supersecret123",
      transcript: [
        "Loaded D:\\Sensitive\\workspace\\creds.json",
        "api key abcdefghijklmnopqrstuvwxyz0123456789"
      ],
      detail:
        "Read /tmp/token.txt and apply deploy with token=ABC123 and bearer sk-1234567890abcdef"
    });

    expect(summary.transcriptLineCount).toBe(2);
    expect(summary.actionLabel).toContain("[redacted path]");
    expect(summary.actionLabel).not.toContain("/tmp/private/deploy.sh");
    expect(summary.actionLabel).not.toContain("D:\\\\Sensitive\\\\secrets");
    expect(summary.requestedBy).not.toContain("bearer");
    expect(summary.requestedBy).not.toContain("supersecret123");
    expect(summary.detail).not.toContain("/tmp/token.txt");
    expect(summary.detail).not.toContain("sk-1234567890abcdef");
    expect(summary.detail).toContain("[redacted");
  });
});
