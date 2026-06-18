import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OwnerTestingReadinessPanel } from "./App";
import { buildCatalogRefreshOwnerValidation } from "./catalogRefreshOwnerValidation";
import { buildFailureStateFixtures, summarizeFailureStateFixtures } from "./failureStateFixtures";
import { buildOwnerTestingChecklist } from "./ownerTestingChecklist";
import { buildPhase3ClearanceBlockerPriority } from "./phase3ClearanceBlockerPriority";
import { buildPhase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import { buildPhase3ClearancePackage } from "./phase3ClearancePackage";
import {
  buildPhase3ClearanceTraceability,
  buildPhase3ClearanceTraceabilityPrecondition
} from "./phase3ClearanceTraceability";
import {
  createPhase3CommandValidationRecord,
  derivePhase3CommandValidationRecordValidation
} from "./phase3CommandValidationRecord";
import { buildPhase3ExitGateEvidence } from "./phase3ExitGateEvidence";
import { buildPhase3HandoffGate } from "./phase3HandoffGate";
import {
  buildPhase3HandoffEvidenceFingerprint,
  createPhase3OwnerHandoffRecord,
  derivePhase3HandoffRecordValidation
} from "./phase3HandoffRecord";
import {
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  savePhase3SessionControlEvidenceByPanel,
  savePhase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";
import {
  buildPhase3OwnerTestingActions,
  gatePhase3OwnerTestingActionsToPrimary
} from "./phase3OwnerTestingActions";
import { buildPhase3SmokeProofReadiness } from "./phase3SmokeProofReadiness";
import {
  createPhase3SmokeProofFingerprint,
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE
} from "./phase3SmokeProofStorage";
import { buildPhasePriorityEvidence } from "./phasePriorityEvidence";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

const evaluatedAt = "2026-06-18T07:58:00.000Z";
const panelProofCreatedAt = "2026-06-18T07:57:40.000Z";
const currentPanelId = "panel-phase3-owner-visible";

const liveControlSmoke = {
  source: "desktop",
  checkedAt: "1781769450476",
  executed: true,
  ok: true,
  completed: true,
  unsupported: false,
  detail: "Live-control proof passed.",
  sourceDetected: true,
  appServerReady: true,
  protocolReady: true,
  requiredMethods: [
    {
      method: "thread/start",
      supported: true,
      state: "supported",
      detail: "Thread creation protocol schema is present."
    }
  ],
  supportedMethodCount: 1,
  unsupportedMethodCount: 0,
  totalMethodCount: 1
};

const activeTurnInterruptSmoke = {
  source: "desktop",
  checkedAt: "1781769429511",
  completed: true,
  controls: [
    {
      attempted: true,
      control: "turn/interrupt",
      detail: "Sent turn/interrupt request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn interrupt command was sent.",
  eventCount: 23,
  executed: true,
  failed: false,
  interruptObserved: false,
  interruptSent: true,
  ok: true,
  sessionStarted: true,
  transcriptLength: 33,
  turnIdSeen: true,
  unsupported: false
};

const activeTurnSteerSmoke = {
  source: "desktop",
  checkedAt: "1781769438295",
  completed: false,
  controls: [
    {
      attempted: true,
      control: "turn/steer",
      detail: "Sent turn/steer request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn steer command was sent.",
  eventCount: 12,
  executed: true,
  expectedTokenSeen: false,
  failed: false,
  ok: true,
  sessionStarted: true,
  steerObserved: false,
  steerSent: true,
  transcriptLength: 0,
  turnIdSeen: true,
  unsupported: false
};

function createStore() {
  const store = new Map<string, string>();

  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      })
    }
  });
}

function rawBundle() {
  return {
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  };
}

function smokeBundleProvenance() {
  const bundle = rawBundle();

  return {
    source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
    command: "npm.cmd run smoke:phase3",
    runId: "phase3-smoke-record:2026-06-18T07:57:30.551Z",
    artifactPath: "local_private/phase3-smoke-proof-bundle.json",
    rowFingerprints: {
      liveControlSmoke: createPhase3SmokeProofFingerprint(bundle.liveControlSmoke),
      activeTurnInterruptSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnSteerSmoke)
    }
  } as const;
}

function saveReadyPanelEvidence() {
  const slashEvidence = buildSlashCommandExecutionEvidence({
    submittedMessage: "/plan Phase 3 owner visible proof",
    liveTransportAvailable: true,
    transcriptMessages: [
      { role: "user", body: "/plan Phase 3 owner visible proof", meta: "slash command" },
      { role: "system", body: "/plan routed through provider", meta: "slash command provider route" },
      { role: "system", body: "Live command completed", meta: "live codex" }
    ]
  });
  const sessionControlEvidence = buildSessionControlReadinessEvidence({
    interrupt: { state: "live" },
    retry: { state: "live" },
    steer: { state: "live" },
    fork: { state: "unsupported" },
    resume: { state: "unsupported" },
    archive: { state: "unsupported" }
  });

  savePhase3SlashEvidenceByPanel(
    { [currentPanelId]: slashEvidence },
    { createdAt: panelProofCreatedAt }
  );
  savePhase3SessionControlEvidenceByPanel(
    { [currentPanelId]: sessionControlEvidence },
    { createdAt: panelProofCreatedAt }
  );

  return {
    slashEvidence,
    sessionControlEvidence
  };
}

function buildReadyPhase3Props() {
  createStore();
  const { slashEvidence, sessionControlEvidence } = saveReadyPanelEvidence();
  const bundle = rawBundle();
  const persistedDesktopProofs = {
    liveControlSmoke: true,
    activeTurnInterruptSmoke: true,
    activeTurnSteerSmoke: true
  };
  const phase3SmokeProofReadiness = buildPhase3SmokeProofReadiness({
    liveControlSmoke: bundle.liveControlSmoke,
    activeTurnInterruptSmoke: bundle.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: bundle.activeTurnSteerSmoke,
    persistedDesktopProofs,
    evaluatedAt
  });
  const phase3ExitGateEvidence = buildPhase3ExitGateEvidence({
    slashEvidence: loadPhase3SlashEvidenceByPanel()[currentPanelId],
    sessionControlEvidence: loadPhase3SessionControlEvidenceByPanel()[currentPanelId],
    liveControlSmoke: bundle.liveControlSmoke,
    activeTurnInterruptSmoke: bundle.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: bundle.activeTurnSteerSmoke,
    persistedDesktopProofs,
    evaluatedAt,
    currentPanelId
  });
  const phase3OwnerTestingActions = buildPhase3OwnerTestingActions({
    canStartSession: true,
    liveControlSmokeGate: phase3ExitGateEvidence.items.find(
      (item) => item.id === "phase3-exit-gate:live-control-smoke"
    ),
    activeTurnInterruptSmokeGate: phase3ExitGateEvidence.items.find(
      (item) => item.id === "phase3-exit-gate:active-turn-interrupt-smoke"
    ),
    activeTurnSteerSmokeGate: phase3ExitGateEvidence.items.find(
      (item) => item.id === "phase3-exit-gate:active-turn-steer-smoke"
    )
  });
  const phase3ClearancePackage = buildPhase3ClearancePackage({
    exitGate: phase3ExitGateEvidence,
    actions: phase3OwnerTestingActions
  });
  const phase3OwnerTestingDisplayActions = gatePhase3OwnerTestingActionsToPrimary({
    actions: phase3OwnerTestingActions,
    primaryActionId: phase3ClearancePackage.primaryActionId,
    holdDetail: phase3ClearancePackage.nextAction
  });
  const phase3ClearanceCommandPlan = buildPhase3ClearanceCommandPlan({
    clearancePackage: phase3ClearancePackage,
    actions: phase3OwnerTestingDisplayActions
  });
  const phase3ClearanceBlockerPriority = buildPhase3ClearanceBlockerPriority({
    clearancePackage: phase3ClearancePackage,
    commandPlan: phase3ClearanceCommandPlan
  });
  const phase3ClearanceTraceabilityPrecondition =
    buildPhase3ClearanceTraceabilityPrecondition();
  const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
    clearancePackage: phase3ClearancePackage,
    exitGate: phase3ExitGateEvidence,
    commandPlanId: phase3ClearanceCommandPlan.id
  });
  const phase3OwnerHandoffRecord = createPhase3OwnerHandoffRecord(
    phase3ClearancePackage,
    "2026-06-18T07:58:05.000Z",
    expectedFingerprint
  );
  const phase3HandoffRecordValidation = derivePhase3HandoffRecordValidation(
    phase3OwnerHandoffRecord,
    phase3ClearancePackage,
    expectedFingerprint,
    { evaluatedAt: "2026-06-18T07:58:30.000Z" }
  );
  const phase3HandoffGate = buildPhase3HandoffGate({
    clearancePackage: phase3ClearancePackage,
    traceabilityPrecondition: phase3ClearanceTraceabilityPrecondition,
    handoffRecordValidation: phase3HandoffRecordValidation
  });
  const phase3CommandValidationRecord = {
    ...createPhase3CommandValidationRecord(
      phase3ClearanceCommandPlan.command,
      "2026-06-18T07:57:30.551Z"
    ),
    smokeBundle: smokeBundleProvenance()
  };
  const phase3CommandValidationRecordValidation =
    derivePhase3CommandValidationRecordValidation(phase3CommandValidationRecord, {
      evaluatedAt,
      expectedCommand: phase3ClearanceCommandPlan.command
    });
  const phase3ClearanceTraceability = buildPhase3ClearanceTraceability({
    clearancePackage: phase3ClearancePackage,
    commandPlan: phase3ClearanceCommandPlan,
    commandValidation: phase3CommandValidationRecordValidation,
    blockerPriority: phase3ClearanceBlockerPriority,
    handoffGate: phase3HandoffGate
  });
  const failureFixtures = buildFailureStateFixtures();

  return {
    catalogRefreshOwnerValidation: buildCatalogRefreshOwnerValidation(),
    checklist: buildOwnerTestingChecklist(),
    failureFixtures,
    failureSummary: summarizeFailureStateFixtures(failureFixtures),
    phasePriorityEvidence: buildPhasePriorityEvidence(),
    phase3ClearanceBlockerPriority,
    phase3ClearanceTraceability,
    phase3ClearanceTraceabilityPrecondition,
    phase3ClearanceCommandPlan,
    phase3ClearancePackage,
    phase3ExitGateEvidence,
    phase3HandoffGate,
    phase3CommandValidationRecord,
    phase3CommandValidationRecordValidation,
    phase3OwnerHandoffRecord,
    phase3OwnerTestingActions: phase3OwnerTestingDisplayActions,
    phase3SmokeProofReadiness,
    sessionControlReadinessEvidence: sessionControlEvidence,
    slashCommandExecutionEvidence: slashEvidence
  };
}

describe("phase 3 owner-visible proof panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders imported desktop proof, panel provenance, and fresh handoff details for owner review", () => {
    const props = buildReadyPhase3Props();
    const html = renderToStaticMarkup(
      <OwnerTestingReadinessPanel
        {...props}
        codexCanStartSession={true}
        codexLiveSmokeLoading={false}
        codexTwoPanelSmokeLoading={false}
        onClearPhase3CommandValidation={() => undefined}
        onClearPhase3OwnerHandoff={() => undefined}
        onImportPhase3CommandValidation={() => undefined}
        onImportPhase3SmokeProofBundle={() => undefined}
        onRecordPhase3CommandValidation={() => undefined}
        onRecordPhase3OwnerHandoff={() => undefined}
        onRunCodexActiveTurnControlSmokeProof={() => undefined}
        onRunCodexActiveTurnSteerSmokeProof={() => undefined}
        onRunCodexLiveControlSmokeProof={() => undefined}
        onRunCodexLiveSmokeProof={() => undefined}
        onRunCodexTwoPanelSmokeProof={() => undefined}
      />
    );

    expect(html).toContain("Phase 3 gate");
    expect(html).toContain("Clearance package");
    expect(html).toContain("Exit ready");
    expect(html).toContain("Storage 3/");
    expect(html).toContain("storage attested");
    expect(html).toContain("current-panel storage provenance");
    expect(html).toContain("fingerprint phase3-panel-");
    expect(html).toContain("Expected");
    expect(html).toContain("Record");
    expect(html).toContain("Fresh 25000ms");
    expect(html).toContain("Current evidence match 100%");
    expect(html).toContain("Advance ready");
    expect(html).toContain("phase3-smoke-record:2026-06-18T07:57:30.551Z");
    expect(html).toContain("local_private/phase3-smoke-proof-bundle.json");
  });
});
