import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LiveActionRiskGatePanel } from "./App";
import {
  buildDesktopActionRunnerBrowserFallbackResult,
  summarizeDesktopActionRunnerResult
} from "./desktopActionRunner";
import type { LiveActionRunnerSummary } from "./liveActionRunner";

const runnerSummary: LiveActionRunnerSummary = {
  total: 8,
  ready: 0,
  blocked: 8,
  readiness: 0,
  nextAction: "request-approval"
};

function renderRiskGatePanel(options: {
  phase9CanRequestDesktopProbe?: boolean;
  phase9DesktopProbeHoldReason?: string;
} = {}) {
  return renderToStaticMarkup(
    <LiveActionRiskGatePanel
      auditExportMarkdown=""
      auditHistory={[]}
      desktopActionRunnerBusyProvider={undefined}
      desktopActionRunnerSummary={summarizeDesktopActionRunnerResult(
        buildDesktopActionRunnerBrowserFallbackResult("terminal-permission-1")
      )}
      executableCount={0}
      onApprove={() => undefined}
      onDeny={() => undefined}
      onRequest={() => undefined}
      onReset={() => undefined}
      onRunDesktopProbe={() => undefined}
      onRunDryRun={() => undefined}
      onTimeout={() => undefined}
      phase9CanRequestDesktopProbe={options.phase9CanRequestDesktopProbe ?? false}
      phase9DesktopProbeHoldReason={
        options.phase9DesktopProbeHoldReason ??
        "Request owner approval for the fixed terminal read-only probe."
      }
      requestsByProvider={{}}
      runnerEvaluations={[]}
      runnerSummary={runnerSummary}
      summaries={[]}
    />
  );
}

describe("LiveActionRiskGatePanel", () => {
  it("shows the Phase 9 desktop probe gate hold reason without hover", () => {
    const html = renderRiskGatePanel();

    expect(html).toContain("Phase 9 desktop probe gate");
    expect(html).toContain("Held");
    expect(html).toContain("Request owner approval for the fixed terminal read-only probe.");
    expect(html).toContain(
      'aria-label="Phase 9 desktop probe gate: Held; Request owner approval for the fixed terminal read-only probe."'
    );
  });

  it("shows when the Phase 9 desktop probe gate is ready", () => {
    const html = renderRiskGatePanel({
      phase9CanRequestDesktopProbe: true,
      phase9DesktopProbeHoldReason:
        "Run a fixed read-only terminal probe through the desktop runner."
    });

    expect(html).toContain("Phase 9 desktop probe gate");
    expect(html).toContain("Ready");
    expect(html).toContain("Run a fixed read-only terminal probe through the desktop runner.");
    expect(html).toContain("live-action-desktop-probe-gate-ready");
  });
});
