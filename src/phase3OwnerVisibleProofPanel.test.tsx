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
  derivePhase3HandoffRecordValidation,
  type Phase3OwnerHandoffRecord
} from "./phase3HandoffRecord";
import {
  buildPhase3ProofExportArtifact,
  verifyPhase3ProofExportArtifact,
  verifySerializedPhase3ProofExportArtifact
} from "./phase3ProofExport";
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
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
  type Phase3SmokeProofBundle
} from "./phase3SmokeProofStorage";
import { buildPhasePriorityEvidence } from "./phasePriorityEvidence";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

const evaluatedAt = "2026-06-18T07:58:00.000Z";
const panelProofCreatedAt = "2026-06-18T07:57:40.000Z";
const phase3ProofExportedAt = "2026-06-18T07:58:30.000Z";
const currentPanelId = "panel-phase3-owner-visible";
const otherPanelId = "panel-phase3-other";

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

function saveReadyPanelEvidence(panelId = currentPanelId) {
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
    { [panelId]: slashEvidence },
    { createdAt: panelProofCreatedAt }
  );
  savePhase3SessionControlEvidenceByPanel(
    { [panelId]: sessionControlEvidence },
    { createdAt: panelProofCreatedAt }
  );

  return {
    slashEvidence,
    sessionControlEvidence
  };
}

function buildReadyPhase3Props(input: {
  readonly evidencePanelId?: string;
  readonly focusedPanelId?: string;
} = {}) {
  createStore();
  const focusedPanelId = input.focusedPanelId ?? currentPanelId;
  const { slashEvidence, sessionControlEvidence } = saveReadyPanelEvidence(
    input.evidencePanelId ?? focusedPanelId
  );
  const loadedSlashEvidenceByPanel = loadPhase3SlashEvidenceByPanel();
  const loadedSessionControlEvidenceByPanel = loadPhase3SessionControlEvidenceByPanel();
  const focusedSlashEvidence = loadedSlashEvidenceByPanel[focusedPanelId];
  const focusedSessionControlEvidence = loadedSessionControlEvidenceByPanel[focusedPanelId];
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
    slashEvidence: focusedSlashEvidence,
    sessionControlEvidence: focusedSessionControlEvidence,
    liveControlSmoke: bundle.liveControlSmoke,
    activeTurnInterruptSmoke: bundle.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: bundle.activeTurnSteerSmoke,
    persistedDesktopProofs,
    evaluatedAt,
    currentPanelId: focusedPanelId
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
  const phase3ProofExportVerification = verifyPhase3ProofExportArtifact(
    buildPhase3ProofExportArtifact({
      currentPanelId: focusedPanelId,
      evaluatedAt,
      exportedAt: phase3ProofExportedAt,
      handoffEvidenceFingerprint: expectedFingerprint,
      slashEvidenceByPanel: loadedSlashEvidenceByPanel,
      sessionControlEvidenceByPanel: loadedSessionControlEvidenceByPanel,
      smokeProofBundle: bundle as Phase3SmokeProofBundle,
      persistedDesktopProofs,
      commandValidationRecord: phase3CommandValidationRecord,
      ownerHandoffRecord: phase3OwnerHandoffRecord
    }),
    { verifiedAt: phase3ProofExportedAt }
  );
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
    phase3ProofExportVerification,
    phase3OwnerTestingActions: phase3OwnerTestingDisplayActions,
    phase3SmokeProofReadiness,
    sessionControlReadinessEvidence:
      focusedSessionControlEvidence ?? sessionControlEvidence,
    slashCommandExecutionEvidence: focusedSlashEvidence ?? slashEvidence
  };
}

type OwnerVisiblePhase3Props = Omit<
  ReturnType<typeof buildReadyPhase3Props>,
  "phase3OwnerHandoffRecord"
> & {
  readonly phase3OwnerHandoffRecord?: Phase3OwnerHandoffRecord;
  readonly importedPhase3ProofExportVerification?: ReturnType<
    typeof verifySerializedPhase3ProofExportArtifact
  >;
};

function renderOwnerTestingReadinessPanel(props: OwnerVisiblePhase3Props) {
  return renderToStaticMarkup(
    <OwnerTestingReadinessPanel
      {...props}
      codexCanStartSession={true}
      codexLiveSmokeLoading={false}
      codexTwoPanelSmokeLoading={false}
      phase3RecordedArtifactLoadAvailable={true}
      onClearPhase3CommandValidation={() => undefined}
      onClearPhase3OwnerHandoff={() => undefined}
      onExportPhase3ProofArtifact={() => undefined}
      onImportPhase3CommandValidation={() => undefined}
      onImportPhase3SmokeProofBundle={() => undefined}
      onLoadRecordedPhase3CommandValidation={() => undefined}
      onLoadRecordedPhase3SmokeProofBundle={() => undefined}
      onVerifyImportedPhase3ProofArtifact={() => undefined}
      onRecordPhase3CommandValidation={() => undefined}
      onRecordPhase3OwnerHandoff={() => undefined}
      onRunCodexActiveTurnControlSmokeProof={() => undefined}
      onRunCodexActiveTurnSteerSmokeProof={() => undefined}
      onRunCodexLiveControlSmokeProof={() => undefined}
      onRunCodexLiveSmokeProof={() => undefined}
      onRunCodexTwoPanelSmokeProof={() => undefined}
    />
  );
}

function buildPhase3PropsWithSmokeProofs(input: {
  readonly liveControlSmoke?: unknown;
  readonly activeTurnInterruptSmoke?: unknown;
  readonly activeTurnSteerSmoke?: unknown;
  readonly persistedDesktopProofs?: {
    readonly liveControlSmoke?: boolean;
    readonly activeTurnInterruptSmoke?: boolean;
    readonly activeTurnSteerSmoke?: boolean;
  };
  readonly evaluatedAt?: string;
  readonly maxProofAgeMs?: number;
}) {
  const props = buildReadyPhase3Props();
  const phase3SmokeProofReadiness = buildPhase3SmokeProofReadiness({
    liveControlSmoke: input.liveControlSmoke,
    activeTurnInterruptSmoke: input.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: input.activeTurnSteerSmoke,
    persistedDesktopProofs: input.persistedDesktopProofs,
    evaluatedAt: input.evaluatedAt ?? evaluatedAt,
    maxProofAgeMs: input.maxProofAgeMs
  });
  const phase3ExitGateEvidence = buildPhase3ExitGateEvidence({
    slashEvidence: props.slashCommandExecutionEvidence,
    sessionControlEvidence: props.sessionControlReadinessEvidence,
    liveControlSmoke: input.liveControlSmoke,
    activeTurnInterruptSmoke: input.activeTurnInterruptSmoke,
    activeTurnSteerSmoke: input.activeTurnSteerSmoke,
    persistedDesktopProofs: input.persistedDesktopProofs,
    evaluatedAt: input.evaluatedAt ?? evaluatedAt,
    maxProofAgeMs: input.maxProofAgeMs,
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
  const phase3HandoffGate = buildPhase3HandoffGate({
    clearancePackage: phase3ClearancePackage,
    traceabilityPrecondition: phase3ClearanceTraceabilityPrecondition
  });
  const phase3CommandValidationRecordValidation =
    derivePhase3CommandValidationRecordValidation(props.phase3CommandValidationRecord, {
      evaluatedAt: input.evaluatedAt ?? evaluatedAt,
      expectedCommand: phase3ClearanceCommandPlan.command
    });
  const phase3ClearanceTraceability = buildPhase3ClearanceTraceability({
    clearancePackage: phase3ClearancePackage,
    commandPlan: phase3ClearanceCommandPlan,
    commandValidation: phase3CommandValidationRecordValidation,
    blockerPriority: phase3ClearanceBlockerPriority,
    handoffGate: phase3HandoffGate
  });

  return {
    ...props,
    phase3ClearanceBlockerPriority,
    phase3ClearanceTraceability,
    phase3ClearanceTraceabilityPrecondition,
    phase3ClearanceCommandPlan,
    phase3ClearancePackage,
    phase3ExitGateEvidence,
    phase3HandoffGate,
    phase3OwnerHandoffRecord: undefined,
    phase3OwnerTestingActions: phase3OwnerTestingDisplayActions,
    phase3SmokeProofReadiness
  };
}

function buildPhase3PropsWithForeignPanelProvenance() {
  const props = buildReadyPhase3Props({
    evidencePanelId: otherPanelId,
    focusedPanelId: otherPanelId
  });
  const bundle = rawBundle();
  const persistedDesktopProofs = {
    liveControlSmoke: true,
    activeTurnInterruptSmoke: true,
    activeTurnSteerSmoke: true
  };
  const phase3ExitGateEvidence = buildPhase3ExitGateEvidence({
    slashEvidence: props.slashCommandExecutionEvidence,
    sessionControlEvidence: props.sessionControlReadinessEvidence,
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
  const phase3HandoffGate = buildPhase3HandoffGate({
    clearancePackage: phase3ClearancePackage,
    traceabilityPrecondition: phase3ClearanceTraceabilityPrecondition
  });
  const phase3CommandValidationRecordValidation =
    derivePhase3CommandValidationRecordValidation(props.phase3CommandValidationRecord, {
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

  return {
    ...props,
    phase3ClearanceBlockerPriority,
    phase3ClearanceTraceability,
    phase3ClearanceTraceabilityPrecondition,
    phase3ClearanceCommandPlan,
    phase3ClearancePackage,
    phase3ExitGateEvidence,
    phase3HandoffGate,
    phase3OwnerHandoffRecord: undefined,
    phase3OwnerTestingActions: phase3OwnerTestingDisplayActions
  };
}

function buildPhase3PropsWithCommandValidationRecord(input: {
  readonly createdAt?: string;
  readonly command?: string;
  readonly evaluatedAt?: string;
  readonly maxRecordAgeMs?: number;
}) {
  const props = buildReadyPhase3Props();
  const phase3CommandValidationRecord = {
    ...createPhase3CommandValidationRecord(
      input.command ?? props.phase3ClearanceCommandPlan.command,
      input.createdAt ?? "2026-06-18T07:57:30.551Z"
    ),
    smokeBundle: smokeBundleProvenance()
  };
  const phase3CommandValidationRecordValidation =
    derivePhase3CommandValidationRecordValidation(phase3CommandValidationRecord, {
      evaluatedAt: input.evaluatedAt ?? evaluatedAt,
      expectedCommand: props.phase3ClearanceCommandPlan.command,
      maxRecordAgeMs: input.maxRecordAgeMs
    });
  const phase3ClearanceTraceability = buildPhase3ClearanceTraceability({
    clearancePackage: props.phase3ClearancePackage,
    commandPlan: props.phase3ClearanceCommandPlan,
    commandValidation: phase3CommandValidationRecordValidation,
    blockerPriority: props.phase3ClearanceBlockerPriority,
    handoffGate: props.phase3HandoffGate
  });

  return {
    ...props,
    phase3ClearanceTraceability,
    phase3CommandValidationRecord,
    phase3CommandValidationRecordValidation
  };
}

describe("phase 3 owner-visible proof panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders imported desktop proof, panel provenance, and fresh handoff details for owner review", () => {
    const props = buildReadyPhase3Props();
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("Phase 3 gate");
    expect(html).toContain(
      'aria-label="Owner testing readiness Waiting; 25% ready; 0 ready, 0 review, 0 blocked, 19 waiting"'
    );
    expect(html).toContain(
      'aria-label="Phase 1 2 6 priority evidence Needs review; 45% ready"'
    );
    expect(html).toContain(
      'aria-label="Phase 1 2 6 priority evidence counts"><div><dt>Ready</dt><dd>0</dd></div><div><dt>Review</dt><dd>1</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Waiting</dt><dd>2</dd></div></dl>'
    );
    expect(html).toContain(
      'aria-label="Phase 1 2 6 publish hold traceability counts"><div><dt>Phases</dt><dd>3</dd></div><div><dt>PM</dt><dd>20</dd></div><div><dt>Hold</dt><dd>blocked</dd></div></dl>'
    );
    expect(html).toContain(
      'aria-label="Phase 1 2 6 publish hold blocker priority counts"><div><dt>Open</dt><dd>8</dd></div><div><dt>Review</dt><dd>8</dd></div><div><dt>Status</dt><dd>Blocked</dd></div></dl>'
    );
    expect(html).toContain(
      'aria-label="Session control readiness evidence Ready; 100% ready"'
    );
    expect(html).toContain(
      'aria-label="Slash command execution evidence Ready; 100% ready"'
    );
    expect(html).toContain("Clearance package");
    expect(html).toContain("Exit ready");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate Ready; 100% ready; current panel panel-phase3-owner-visible; 3 PM links; 5 evidence keys"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package Ready; 100% ready; 0 open blockers"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package counts"><div><dt>Ready</dt><dd>5</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Action</dt><dd>Review</dd></div></dl>'
    );
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke proof readiness 100% ready; 3 storage-proof attested; 0 storage review"'
    );
    expect(html).toContain("Storage 3/3 attested");
    expect(html).toContain("storage attested");
    expect(html).toContain("current-panel storage provenance");
    expect(html).toContain("fingerprint phase3-panel-");
    expect(html).toContain("Expected");
    expect(html).toContain("Record");
    expect(html).toContain("Fresh 25000ms");
    expect(html).toContain("Current evidence match 100%");
    expect(html).toContain("Advance ready");
    expect(html).toContain("Owner handoff current");
    expect(html).toContain("Phase 3 handoff gate");
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate: Ready; 100% ready; 5 ready, 0 review, 0 blocked, 0 waiting; 0 exact blockers; owner review: Owner handoff current: fingerprint, clearance snapshot, and age metadata match; Phase 4 remains behind owner review.; next action:'
    );
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate counts"><div><dt>Ready</dt><dd>5</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>State</dt><dd>Ready</dd></div></dl>'
    );
    expect(html).toContain("PM Links");
    expect(html).toContain("<dt>PM Links</dt><dd>3</dd>");
    expect(html).toContain("Evidence Keys");
    expect(html).toContain("<dt>Evidence Keys</dt><dd>5</dd>");
    expect(html).toContain("Desktop proof clearance");
    expect(html).toContain("Exact blocker visibility");
    expect(html).toContain(
      'aria-label="Phase 3 blocker priority: Ready; 0 open blockers; top priority No open Phase 3 blocker; evidence phase3.clearance.none; command addressable no; next action: No Phase 3 blockers remain; record the owner-reviewed handoff before provider integration advances."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 blocker priority counts"><div><dt>Open</dt><dd>0</dd></div><div><dt>Command</dt><dd>0</dd></div><div><dt>State</dt><dd>Ready</dd></div><div><dt>Ready</dt><dd>100%</dd></div></dl>'
    );
    expect(html).toContain("Traceability boundary");
    expect(html).toContain("goal-phase-3-proof-clearance");
    expect(html).toContain(
      'aria-label="Phase 3 clearance traceability: Ready; 100% ready; 11/11 PM rows linked; 0 open trace rows; next action: Keep the current active Phase 3 goal, PM rows, clearance evidence, and owner handoff trace linked until Phase 3 exits."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance traceability counts"><div><dt>PM Rows</dt><dd>11/11</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>State</dt><dd>Ready</dd></div><div><dt>Ready</dt><dd>100%</dd></div></dl>'
    );
    expect(html).toContain("npm.cmd run smoke:phase3");
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke command plan: Ready; command held; 3/3 smoke proofs ready; next action: Desktop smoke command is no longer needed; record Phase 3 handoff after owner review."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 command plan smoke counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>Covers</dt><dd>3</dd></div><div><dt>State</dt><dd>Ready</dd></div></dl>'
    );
    expect(html).toContain(
      "All required Phase 3 Epic, Parent, and Child rows are linked to the current active goal."
    );
    expect(html).toContain(
      "Keep all required Phase 3 PM rows linked to the current active goal."
    );
    expect(html).toContain("Owner handoff record");
    expect(html).toContain("Provider boundary");
    expect(html).toContain("Phase 3 proof export");
    expect(html).toContain(
      'aria-label="Phase 3 proof export verifier Ready; 100% ready; next action: Keep the exported Phase 3 proof package attached while Phase 4 remains gated by owner review."'
    );
    expect(html).toContain("Export proof");
    expect(html).toContain("Import proof");
    expect(html).toContain("Load recorded");
    expect(html).toContain("Panel proof 2/2");
    expect(html).toContain("Desktop 3/3");
    expect(html).toContain("CLI attached");
    expect(html).toContain("Handoff attached");
    expect(html).toContain(
      "Keep the exported Phase 3 proof package attached while Phase 4 remains gated by owner review."
    );
    expect(html).toContain("Record handoff");
    expect(html).toContain("Clear record");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate counts"><div><dt>Ready</dt><dd>5</dd></div><div><dt>Review</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Waiting</dt><dd>0</dd></div><div><dt>Panel</dt><dd title="panel-phase3-owner-visible">panel-phase3-owner-visible</dd></div><div><dt>PM Links</dt><dd>3</dd></div><div><dt>Evidence Keys</dt><dd>5</dd></div></dl>'
    );
    expect(html).toContain("phase3-smoke-record:2026-06-18T07:57:30.551Z");
    expect(html).toContain("local_private/phase3-smoke-proof-bundle.json");
    expect(html).toContain(
      'aria-label="Catalog refresh owner testing Waiting; 25% ready"'
    );
    expect(html).toContain(
      'aria-label="Catalog refresh owner validation ready; 100% ready"'
    );
  });

  it("renders imported Phase 3 proof artifact verification without replacing local proof state", () => {
    const props = buildReadyPhase3Props();
    const importedPhase3ProofExportVerification = verifySerializedPhase3ProofExportArtifact(
      JSON.stringify(
        buildPhase3ProofExportArtifact({
          currentPanelId,
          evaluatedAt,
          exportedAt: phase3ProofExportedAt,
          handoffEvidenceFingerprint: props.phase3HandoffGate.handoffEvidenceReview.expectedFingerprint,
          slashEvidenceByPanel: loadPhase3SlashEvidenceByPanel(),
          sessionControlEvidenceByPanel: loadPhase3SessionControlEvidenceByPanel(),
          smokeProofBundle: {
            liveControlSmoke,
            activeTurnInterruptSmoke,
            activeTurnSteerSmoke
          } as Phase3SmokeProofBundle,
          persistedDesktopProofs: {
            liveControlSmoke: true,
            activeTurnInterruptSmoke: true,
            activeTurnSteerSmoke: true
          },
          commandValidationRecord: props.phase3CommandValidationRecord,
          ownerHandoffRecord: props.phase3OwnerHandoffRecord
        })
      ),
      { verifiedAt: "2026-06-18T07:58:30.000Z" }
    );
    const html = renderOwnerTestingReadinessPanel({
      ...props,
      importedPhase3ProofExportVerification
    });

    expect(html).toContain("Imported proof artifact");
    expect(html).toContain(
      'aria-label="Imported Phase 3 proof artifact verifier Ready; 100% ready; next action: Keep the exported Phase 3 proof package attached while Phase 4 remains gated by owner review."'
    );
    expect(html).toContain("Phase 3 proof export artifact contains current-panel panel proof");
    expect(html).toContain("Panel proof 2/2");
    expect(html).toContain("Desktop 3/3");
    expect(html).toContain("CLI attached");
    expect(html).toContain("Handoff attached");
    expect(html).toContain("Phase 3 proof export");
  });

  it("renders malformed imported Phase 3 proof artifact verification as waiting", () => {
    const props = buildReadyPhase3Props();
    const html = renderOwnerTestingReadinessPanel({
      ...props,
      importedPhase3ProofExportVerification: verifySerializedPhase3ProofExportArtifact("{", {
        verifiedAt: evaluatedAt
      })
    });

    expect(html).toContain("Imported proof artifact");
    expect(html).toContain(
      'aria-label="Imported Phase 3 proof artifact verifier Waiting; 35% ready; next action: Export or import a Phase 3 proof package before offline verification."'
    );
    expect(html).toContain("Waiting");
    expect(html).toContain("Phase 3 proof export artifact is missing or malformed");
    expect(html).toContain("Panel proof 0/2");
    expect(html).toContain("Desktop 0/3");
    expect(html).toContain("CLI missing");
    expect(html).toContain("Handoff missing");
  });

  it("does not run proof persistence or live-action callbacks while rendering imported proof verification", () => {
    const props = buildReadyPhase3Props();
    const callbacks = {
      onClearPhase3CommandValidation: vi.fn(),
      onClearPhase3OwnerHandoff: vi.fn(),
      onExportPhase3ProofArtifact: vi.fn(),
      onImportPhase3CommandValidation: vi.fn(),
      onImportPhase3SmokeProofBundle: vi.fn(),
      onLoadRecordedPhase3CommandValidation: vi.fn(),
      onLoadRecordedPhase3SmokeProofBundle: vi.fn(),
      onRecordPhase3CommandValidation: vi.fn(),
      onRecordPhase3OwnerHandoff: vi.fn(),
      onRunCodexActiveTurnControlSmokeProof: vi.fn(),
      onRunCodexActiveTurnSteerSmokeProof: vi.fn(),
      onRunCodexLiveControlSmokeProof: vi.fn(),
      onRunCodexLiveSmokeProof: vi.fn(),
      onRunCodexTwoPanelSmokeProof: vi.fn(),
      onVerifyImportedPhase3ProofArtifact: vi.fn()
    };

    renderToStaticMarkup(
      <OwnerTestingReadinessPanel
        {...props}
        importedPhase3ProofExportVerification={verifySerializedPhase3ProofExportArtifact("{}", {
          verifiedAt: evaluatedAt
        })}
        codexCanStartSession={true}
        codexLiveSmokeLoading={false}
        codexTwoPanelSmokeLoading={false}
        phase3RecordedArtifactLoadAvailable={true}
        {...callbacks}
      />
    );

    for (const callback of Object.values(callbacks)) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("keeps recorded proof loading desktop-gated while file imports remain visible", () => {
    const props = buildReadyPhase3Props();
    const html = renderToStaticMarkup(
      <OwnerTestingReadinessPanel
        {...props}
        codexCanStartSession={true}
        codexLiveSmokeLoading={false}
        codexTwoPanelSmokeLoading={false}
        phase3RecordedArtifactLoadAvailable={false}
        onClearPhase3CommandValidation={() => undefined}
        onClearPhase3OwnerHandoff={() => undefined}
        onExportPhase3ProofArtifact={() => undefined}
        onImportPhase3CommandValidation={() => undefined}
        onImportPhase3SmokeProofBundle={() => undefined}
        onLoadRecordedPhase3CommandValidation={() => undefined}
        onLoadRecordedPhase3SmokeProofBundle={() => undefined}
        onVerifyImportedPhase3ProofArtifact={() => undefined}
        onRecordPhase3CommandValidation={() => undefined}
        onRecordPhase3OwnerHandoff={() => undefined}
        onRunCodexActiveTurnControlSmokeProof={() => undefined}
        onRunCodexActiveTurnSteerSmokeProof={() => undefined}
        onRunCodexLiveControlSmokeProof={() => undefined}
        onRunCodexLiveSmokeProof={() => undefined}
        onRunCodexTwoPanelSmokeProof={() => undefined}
      />
    );

    expect(html).toContain("Import desktop proof");
    expect(html).toContain("Load recorded");
    expect(html).toContain('aria-label="Import Phase 3 CLI smoke validation artifact"');
    expect(html).toContain(
      'aria-label="Import Phase 3 proof export artifact for verification"'
    );
    expect(html).toContain('aria-label="Import Phase 3 desktop smoke proof bundle"');
    expect(html).toContain("Open Steerboard in desktop mode or use Import");
    expect(html).toContain(
      '<button disabled="" title="Open Steerboard in desktop mode or use Import to attach this local artifact." type="button">'
    );
  });

  it("does not borrow another panel's slash or session-control proof for Phase 3 exit", () => {
    const props = buildReadyPhase3Props({
      evidencePanelId: otherPanelId,
      focusedPanelId: currentPanelId
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("Phase 3 gate");
    expect(html).toContain(currentPanelId);
    expect(html).toContain("Phase 3 clearance package Waiting");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate Waiting; 35% ready; current panel panel-phase3-owner-visible; 3 PM links; 5 evidence keys"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package Waiting; 35% ready; 2 open blockers"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Open</dt><dd>2</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Action</dt><dd>Review</dd></div></dl>'
    );
    expect(html).toContain("Slash execution");
    expect(html).toContain("Session controls");
    expect(html).toContain("Submit a provider-routed slash command from an Arena panel");
    expect(html).toContain("Collect Arena session-control evidence");
    expect(html).toContain("Advance held");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Review</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Waiting</dt><dd>2</dd></div><div><dt>Panel</dt><dd title="panel-phase3-owner-visible">panel-phase3-owner-visible</dd></div><div><dt>PM Links</dt><dd>3</dd></div><div><dt>Evidence Keys</dt><dd>5</dd></div></dl>'
    );
    expect(html).not.toContain("Current evidence match 100%");
    expect(html).not.toContain(`panel ${otherPanelId}`);
  });

  it("shows foreign-panel slash and session-control provenance as owner review", () => {
    const props = buildPhase3PropsWithForeignPanelProvenance();
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("Phase 3 gate");
    expect(html).toContain("Needs review");
    expect(html).toContain("Exit held");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate Review; 65% ready; current panel panel-phase3-owner-visible; 3 PM links; 5 evidence keys"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package Needs review; 65% ready; 2 open blockers"'
    );
    expect(html).toContain(
      'aria-label="Phase 3 clearance package counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Open</dt><dd>2</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Action</dt><dd>Review</dd></div></dl>'
    );
    expect(html).toContain("storage provenance belongs to another panel");
    expect(html).toContain(
      "Refresh slash execution evidence from the current Arena panel transcript"
    );
    expect(html).toContain(
      "Refresh session-control evidence from the current Arena panel/session"
    );
    expect(html).toContain("Advance held");
    expect(html).toContain(
      'aria-label="Phase 3 exit gate counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Review</dt><dd>2</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>Waiting</dt><dd>0</dd></div><div><dt>Panel</dt><dd title="panel-phase3-owner-visible">panel-phase3-owner-visible</dd></div><div><dt>PM Links</dt><dd>3</dd></div><div><dt>Evidence Keys</dt><dd>5</dd></div></dl>'
    );
    expect(html).not.toContain("Current evidence match 100%");
  });

  it("holds handoff recording when desktop proof is ready but Phase 3 traceability is untrusted", () => {
    const props = buildReadyPhase3Props();
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: props.phase3ClearancePackage,
      exitGate: props.phase3ExitGateEvidence,
      commandPlanId: props.phase3ClearanceCommandPlan.id
    });
    const handoffValidation = derivePhase3HandoffRecordValidation(
      props.phase3OwnerHandoffRecord!,
      props.phase3ClearancePackage,
      expectedFingerprint,
      { evaluatedAt: "2026-06-18T07:58:30.000Z" }
    );
    const untrustedTraceability = {
      state: "review" as const,
      canTrustTrace: false,
      detail: "2 current active remaining goals are set.",
      nextAction:
        "Keep exactly one current active remaining goal before Phase 3 handoff can advance."
    };
    const heldHandoffGate = buildPhase3HandoffGate({
      clearancePackage: props.phase3ClearancePackage,
      traceabilityPrecondition: untrustedTraceability,
      handoffRecordState: "ready",
      handoffRecordValidation: handoffValidation
    });
    const html = renderOwnerTestingReadinessPanel({
      ...props,
      phase3ClearanceTraceabilityPrecondition: untrustedTraceability,
      phase3HandoffGate: heldHandoffGate
    });

    expect(html).toContain("Advance held");
    expect(html).toContain("Traceability boundary");
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate: Review; 86% ready; 3 ready, 2 review, 0 blocked, 0 waiting; 0 exact blockers; owner review: Owner handoff held: 2 current active remaining goals are set.; next action: Keep exactly one current active remaining goal before Phase 3 handoff can advance."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>State</dt><dd>Review</dd></div></dl>'
    );
    expect(html).toContain(
      "Keep exactly one current active remaining goal before Phase 3 handoff can advance."
    );
    expect(html).toContain("Provider integration remains held because");
    expect(html).toContain("Owner handoff held");
    expect(html).toContain("Record handoff");
    expect(html).toContain(
      "Record gate: Keep exactly one current active remaining goal before Phase 3 handoff can advance."
    );
    expect(html).not.toContain("Advance ready");
  });

  it("keeps stale CLI smoke validation visible without replacing desktop proof or handoff evidence", () => {
    const props = buildPhase3PropsWithCommandValidationRecord({
      createdAt: "2026-06-17T07:57:30.551Z",
      evaluatedAt,
      maxRecordAgeMs: 60_000
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("CLI smoke validation recorded");
    expect(html).toContain(
      'aria-label="Phase 3 CLI smoke validation Review; 3 passed, 0 failed"'
    );
    expect(html).toContain("Review; Jun 17");
    expect(html).toContain("Phase 3 CLI smoke validation record is stale");
    expect(html).toContain("Rerun npm.cmd run smoke:phase3 manually");
    expect(html).toContain("Smoke bundle provenance is linked");
    expect(html).toContain("local_private/phase3-smoke-proof-bundle.json");
    expect(html).toContain("CLI validation trace");
    expect(html).toContain("Storage 3/3 attested");
    expect(html).toContain("Advance ready");
    expect(html).toContain("Owner handoff current");
  });

  it("keeps future-dated CLI smoke validation visible as review-only provenance", () => {
    const props = buildPhase3PropsWithCommandValidationRecord({
      createdAt: "2026-06-18T08:30:00.000Z",
      evaluatedAt
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("CLI smoke validation recorded");
    expect(html).toContain(
      'aria-label="Phase 3 CLI smoke validation Review; 3 passed, 0 failed"'
    );
    expect(html).toContain("Review; Jun 18");
    expect(html).toContain("Phase 3 CLI smoke validation record is stale");
    expect(html).toContain("Rerun npm.cmd run smoke:phase3 manually");
    expect(html).toContain("CLI validation trace");
    expect(html).toContain("Storage 3/3 attested");
    expect(html).toContain("Advance ready");
  });

  it("keeps mismatched CLI smoke validation in review with current command-plan text", () => {
    const props = buildPhase3PropsWithCommandValidationRecord({
      command: "npm.cmd run smoke:phase3 --old",
      evaluatedAt
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("CLI smoke validation recorded");
    expect(html).toContain(
      'aria-label="Phase 3 CLI smoke validation Review; 3 passed, 0 failed"'
    );
    expect(html).toContain("Phase 3 CLI smoke validation record was captured for a different command");
    expect(html).toContain(
      "Clear and record the Phase 3 CLI smoke validation again with the current command plan."
    );
    expect(html).toContain("npm.cmd run smoke:phase3");
    expect(html).toContain("CLI validation trace");
    expect(html).toContain("Advance ready");
  });

  it("keeps stale Phase 3 handoff records visibly in review", () => {
    const props = buildReadyPhase3Props();
    const staleRecord = createPhase3OwnerHandoffRecord(
      props.phase3ClearancePackage,
      "2026-06-18T07:58:05.000Z",
      "phase3-handoff-stale"
    );
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: props.phase3ClearancePackage,
      exitGate: props.phase3ExitGateEvidence,
      commandPlanId: props.phase3ClearanceCommandPlan.id
    });
    const staleValidation = derivePhase3HandoffRecordValidation(
      staleRecord,
      props.phase3ClearancePackage,
      expectedFingerprint,
      { evaluatedAt: "2026-06-18T07:58:30.000Z" }
    );
    const staleGate = buildPhase3HandoffGate({
      clearancePackage: props.phase3ClearancePackage,
      traceabilityPrecondition: props.phase3ClearanceTraceabilityPrecondition,
      handoffRecordValidation: staleValidation
    });
    const html = renderOwnerTestingReadinessPanel({
      ...props,
      phase3HandoffGate: staleGate,
      phase3OwnerHandoffRecord: staleRecord
    });

    expect(html).toContain("Advance held");
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate: Review; 86% ready; 3 ready, 2 review, 0 blocked, 0 waiting; 0 exact blockers; owner review: Owner handoff review: Owner handoff record no longer matches'
    );
    expect(html).toContain(
      'aria-label="Phase 3 handoff gate counts"><div><dt>Ready</dt><dd>3</dd></div><div><dt>Open</dt><dd>0</dd></div><div><dt>Blocked</dt><dd>0</dd></div><div><dt>State</dt><dd>Review</dd></div></dl>'
    );
    expect(html).toContain("Current evidence review 100%");
    expect(html).toContain(expectedFingerprint);
    expect(html).toContain("phase3-handoff-stale");
    expect(html).toContain("Owner handoff record no longer matches");
    expect(html).toContain("Owner handoff review");
    expect(html).toContain("Clear and record the Phase 3 handoff again");
    expect(html).toContain("Provider integration remains held");
    expect(html).toContain("Recorded");
  });

  it("renders stale, waiting, and storage-review smoke proof rows for owner review", () => {
    const props = buildPhase3PropsWithSmokeProofs({
      evaluatedAt: "2026-06-18T07:58:00.000Z",
      maxProofAgeMs: 60_000,
      persistedDesktopProofs: {
        liveControlSmoke: true,
        activeTurnInterruptSmoke: false,
        activeTurnSteerSmoke: false
      },
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-18T07:50:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 1,
        totalMethodCount: 1
      },
      activeTurnInterruptSmoke: {
        source: "browser",
        checkedAt: "2026-06-18T07:57:00.000Z",
        executed: false,
        unsupported: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-18T07:57:30.000Z",
        executed: true,
        ok: true,
        completed: true,
        steerObserved: true
      }
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("Desktop smoke bundle");
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke proof readiness 35% ready; 1 storage-proof attested; 2 storage review"'
    );
    expect(html).toContain("Storage 1/");
    expect(html).toContain("Transient 2 review");
    expect(html).toContain("Transient passed smoke runs stay in review");
    expect(html).toContain("Live-control desktop smoke proof");
    expect(html).toContain("stale; rerun the desktop smoke proof");
    expect(html).toContain("Active-turn interrupt desktop smoke proof");
    expect(html).toContain("browser | 2026-06-18T07:57:00.000Z | storage review");
    expect(html).toContain("Active-turn steer desktop smoke proof");
    expect(html).toContain("must be loaded from persisted/imported desktop proof storage");
    expect(html).toContain(
      'aria-label="Phase 3 blocker priority: Waiting; 3 open blockers; top priority Live control smoke; evidence phase3.live-control-smoke; command addressable yes; next action: Run npm.cmd run smoke:phase3 locally when desktop session start is available."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke command plan: Review; command available; 0/3 smoke proofs ready; next action: Run npm.cmd run smoke:phase3 locally to refresh live-control, active-turn interrupt, and active-turn steer proofs."'
    );
    expect(html).toContain("Advance held");
    expect(html).toContain("Record gate: Run Live-control smoke from Owner Testing.");
    expect(html).toContain("Record handoff");
  });

  it("keeps transient passed desktop smoke rows in review until storage proof is attached", () => {
    const props = buildPhase3PropsWithSmokeProofs({
      evaluatedAt: "2026-06-18T07:58:00.000Z",
      persistedDesktopProofs: {
        liveControlSmoke: false,
        activeTurnInterruptSmoke: false,
        activeTurnSteerSmoke: false
      },
      liveControlSmoke,
      activeTurnInterruptSmoke,
      activeTurnSteerSmoke
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain("Desktop smoke bundle");
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke proof readiness 65% ready; 0 storage-proof attested; 3 storage review"'
    );
    expect(html).toContain("Storage 0/3 attested");
    expect(html).toContain("Transient 3 review");
    expect(html).toContain("storage review");
    expect(html).toContain("must be loaded from persisted/imported desktop proof storage");
    expect(html).toContain("Phase 3 blocker priority");
    expect(html).toContain(
      'aria-label="Phase 3 blocker priority: Review; 3 open blockers; top priority Live control smoke; evidence phase3.live-control-smoke; command addressable yes; next action: Run npm.cmd run smoke:phase3 locally when desktop session start is available."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke command plan: Review; command available; 0/3 smoke proofs ready; next action: Run npm.cmd run smoke:phase3 locally to refresh live-control, active-turn interrupt, and active-turn steer proofs."'
    );
    expect(html).toContain("Live control smoke is the next desktop smoke proof blocker in review state.");
    expect(html).toContain("npm.cmd run smoke:phase3 can refresh this blocker.");
    expect(html).toContain("Run npm.cmd run smoke:phase3 locally when desktop session start is available.");
    expect(html).toContain("Record gate: Run Live-control smoke from Owner Testing.");
    expect(html).toContain("Advance held");
    expect(html).not.toContain("Storage 3/3 attested");
    expect(html).not.toContain("Smoke verified");
  });

  it("keeps future-dated desktop smoke proof visibly in review", () => {
    const props = buildPhase3PropsWithSmokeProofs({
      evaluatedAt: "2026-06-18T07:58:00.000Z",
      persistedDesktopProofs: {
        liveControlSmoke: true,
        activeTurnInterruptSmoke: true,
        activeTurnSteerSmoke: true
      },
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-18T07:59:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 1,
        totalMethodCount: 1
      },
      activeTurnInterruptSmoke,
      activeTurnSteerSmoke
    });
    const html = renderOwnerTestingReadinessPanel(props);

    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke proof readiness 65% ready; 3 storage-proof attested; 0 storage review"'
    );
    expect(html).toContain("Live-control desktop smoke proof");
    expect(html).toContain("dated after the current evaluation timestamp");
    expect(html).toContain(
      'aria-label="Phase 3 blocker priority: Review; 1 open blockers; top priority Live control smoke; evidence phase3.live-control-smoke; command addressable yes; next action: Run npm.cmd run smoke:phase3 locally when desktop session start is available."'
    );
    expect(html).toContain(
      'aria-label="Phase 3 desktop smoke command plan: Review; command available; 2/3 smoke proofs ready; next action: Run npm.cmd run smoke:phase3 locally to refresh live-control, active-turn interrupt, and active-turn steer proofs."'
    );
    expect(html).toContain("Current evidence review");
    expect(html).toContain("Advance held");
  });
});
