import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  EyeOff,
  Folder,
  GitBranch,
  Grid2X2,
  Link2,
  LayoutDashboard,
  Link2Off,
  Maximize2,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  Move,
  PanelRight,
  Paperclip,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronRight,
  UserRound,
  Workflow
} from "lucide-react";
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADAPTIVE_COCKPIT_DROP_JSON_MIME,
  ADAPTIVE_COCKPIT_DROP_PANEL_ID_MIME,
  buildProjectDropPayload,
  buildSessionDropPayload,
  parseAdaptiveCockpitDropPayload,
  resolveAdaptiveDropPanelId,
  type AdaptiveCockpitDropPayload
} from "./adaptiveCockpitDrop";
import {
  createAdaptiveCockpitDropPreview,
  type AdaptiveCockpitDropPreview
} from "./adaptiveCockpitDropPreview";
import {
  createAdaptiveProjectPanelStack,
  type AdaptiveCockpitProjectStackRequestedTemplateId
} from "./adaptiveCockpitProjectStack";
import {
  ADAPTIVE_LAYOUT_MAX_PANELS,
  createAdaptiveCockpitLayoutForPanelIds,
  hiddenAdaptiveCockpitPanels,
  hideAdaptiveCockpitPanel,
  moveAdaptiveCockpitPanel,
  nudgeAdaptiveCockpitPanel,
  revealAdaptiveCockpitPanel,
  resizeAdaptiveCockpitPanel,
  resizeAdaptiveCockpitPanelByDelta,
  syncAdaptiveCockpitLayoutToPanelIds,
  visibleAdaptiveCockpitPanels,
  type AdaptiveCockpitLayout,
  type AdaptiveCockpitPanel
} from "./adaptiveCockpitLayout";
import {
  loadAdaptiveCockpitLayout,
  saveAdaptiveCockpitLayout
} from "./adaptiveCockpitLayoutStorage";
import {
  buildAutomationCatalogSnapshot,
  defaultAutomationCatalog,
  type AutomationCatalogRefreshSource,
  type AutomationCatalogSnapshot,
  type AutomationCatalogEntry
} from "./automationCatalog";
import { loadProviderAutomationCatalogSnapshot } from "./providerAutomationCatalog";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult
} from "./catalogRefreshOwnerValidation";
import {
  buildProviderIntegrationReadiness,
  type ProviderIntegrationReadiness
} from "./providerIntegrationReadiness";
import {
  buildProviderExecutionGate,
  type ProviderExecutionGate
} from "./providerExecutionGate";
import {
  buildPhase4ProviderSurfaceDepth,
  type Phase4ProviderSurfaceDepthSnapshot
} from "./phase4ProviderSurfaceDepth";
import {
  clearPhase4ProviderApprovalRecord,
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation,
  loadPhase4ProviderApprovalRecord,
  savePhase4ProviderApprovalRecord,
  type Phase4ProviderApprovalRecord,
  type Phase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  buildPhase4ProviderAuditEvidenceFingerprint,
  clearPhase4ProviderAuditRecord,
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation,
  loadPhase4ProviderAuditRecord,
  savePhase4ProviderAuditRecord,
  type Phase4ProviderAuditRecord,
  type Phase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import {
  buildPhase4ProviderRollbackEvidenceFingerprint,
  clearPhase4ProviderRollbackRecord,
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation,
  loadPhase4ProviderRollbackRecord,
  savePhase4ProviderRollbackRecord,
  type Phase4ProviderRollbackRecord,
  type Phase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import {
  buildPhase4ProviderPermissionEvidenceFingerprint,
  clearPhase4ProviderPermissionRecord,
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  loadPhase4ProviderPermissionRecord,
  savePhase4ProviderPermissionRecord,
  type Phase4ProviderPermissionRecord,
  type Phase4ProviderPermissionRecordValidation
} from "./phase4ProviderPermissionRecord";
import {
  buildPhase4ProviderCatalogDepth,
  type Phase4ProviderCatalogDepthSummary
} from "./phase4ProviderCatalogDepth";
import {
  buildCatalogRefreshProviderFingerprint,
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW,
  type CatalogRefreshProviderSmokeResult
} from "./catalogRefreshProviderSmoke";
import {
  loadPhase4CatalogSmokeProof,
  savePhase4CatalogSmokeProof
} from "./phase4CatalogSmokeProofStorage";
import {
  buildPhase4RefreshSafetyDepth
} from "./phase4RefreshSafetyDepth";
import {
  buildPhase4ProviderTraceabilitySummary,
  type Phase4ProviderTraceabilitySummary
} from "./phase4ProviderTraceability";
import {
  buildPhase4ProviderBlockerPriority,
  type Phase4ProviderBlockerPrioritySummary
} from "./phase4ProviderBlockerPriority";
import {
  buildPhase4ProviderCompletionStatus,
  type Phase4ProviderCompletionStatus
} from "./phase4ProviderCompletionStatus";
import {
  buildPhase4ProviderReviewArtifact,
  verifyRecordedPhase4ProviderReviewArtifact,
  serializePhase4ProviderReviewArtifact,
  verifyPhase4ProviderReviewArtifact,
  verifySerializedPhase4ProviderReviewArtifact,
  type Phase4ProviderReviewArtifactVerification
} from "./phase4ProviderReviewArtifact";
import {
  buildSlashCommandExecutionEvidence,
  type SlashCommandExecutionEvidence
} from "./slashCommandExecutionEvidence";
import {
  selectPhase3SessionControlEvidence,
  selectPhase3SlashCommandEvidence
} from "./phase3PanelEvidenceSelection";
import {
  buildCommandCatalogSnapshot,
  type CommandCatalogRefreshSource,
  type CommandCatalogSnapshot
} from "./commandCatalog";
import { loadProviderCommandCatalogSnapshot } from "./providerCommandCatalog";
import {
  cockpitPresets,
  orchestrationTasks,
  permissionSurfaces,
  planningDrafts,
  pipelineItems,
  projects,
  registryEntries,
  runtimeAdapters,
  type PermissionSurface,
  sessions,
  type PipelineItem,
  type ProjectSummary,
  type SessionState,
  type SessionSummary
} from "./fixtures";
import {
  defaultLayoutByMode,
  getDisplayGrid,
  getLayoutSpec,
  layoutAriaLabel,
  layoutOptions,
  maxVisibleCells,
  type CockpitMode,
  type LayoutId
} from "./layout";
import {
  buildHandoffBrief,
  nextHandoffTask,
  summarizeWorkerHandoff,
  summarizeTasks,
  type OrchestrationTask
} from "./orchestration";
import {
  createOrchestrationDependencyReadiness,
  type OrchestrationDependencyReadiness
} from "./orchestrationDependencyReadiness";
import {
  createOrchestrationDispatchAudit,
  type OrchestrationDispatchAudit
} from "./orchestrationDispatchAudit";
import {
  createOrchestrationResultHandoffEvidence,
  type OrchestrationResultHandoffEvidence
} from "./orchestrationResultHandoffEvidence";
import {
  createOrchestrationAcceptanceCoverage,
  type OrchestrationAcceptanceCoverage
} from "./orchestrationAcceptanceCoverage";
import {
  buildPipelineItemDispatchPreview,
  type PipelineItemDispatchPreview
} from "./pipelineItemDispatchPreview";
import {
  tryBuildPipelineItemDispatchPackage
} from "./pipelineItemDispatchPackage";
import {
  createDispatchRolePanelPlan,
  type DispatchRolePanelPlan
} from "./dispatchRolePanelPlan";
import {
  appendDispatchReviewRecord,
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord,
  loadDispatchReviewRecords,
  saveDispatchReviewRecords,
  type DispatchReviewRecord
} from "./dispatchReviewRecord";
import {
  buildPhase7DispatchReviewDepth,
  type Phase7DispatchReviewDepthSnapshot
} from "./phase7DispatchReviewDepth";
import { buildPhase7IntegrationOwnershipDepth } from "./phase7IntegrationOwnershipDepth";
import { buildPhase7DispatchTraceability } from "./phase7DispatchTraceability";
import { buildPhase7DispatchBlockerPriority } from "./phase7DispatchBlockerPriority";
import {
  buildPhase7DispatchReviewArtifact,
  verifyPhase7DispatchReviewArtifact,
  type Phase7DispatchReviewArtifactVerification
} from "./phase7DispatchReviewArtifact";
import {
  buildPhase7LiveWorkerLaunchGate,
  type Phase7LiveWorkerLaunchGate
} from "./phase7LiveWorkerLaunchGate";
import {
  buildPhase7DispatchClosureGate,
  type Phase7DispatchClosureGate
} from "./phase7DispatchClosureGate";
import {
  buildPhase7DispatchCloseoutProof,
  type Phase7DispatchCloseoutProof
} from "./phase7DispatchCloseoutProof";
import {
  buildPhase7DispatchOwnerHandoffReport,
  type Phase7DispatchOwnerHandoffReport
} from "./phase7DispatchOwnerHandoffReport";
import {
  buildPhase7DispatchCompletionGate,
  type Phase7DispatchCompletionGate
} from "./phase7DispatchCompletionGate";
import {
  buildPhase7WorkerSessionCreationGate,
  type Phase7WorkerSessionCreationGate
} from "./phase7WorkerSessionCreationGate";
import {
  buildPipelineItemRunLinks,
  type PipelineItemRunLink
} from "./pipelineItemRunLink";
import {
  summarizePipelineItemRunStatus,
  type PipelineItemRunStatusSummary
} from "./pipelineItemRunStatus";
import {
  appendPipelineDispatchRequestRecord,
  createPipelineDispatchRequestRecord,
  loadPipelineDispatchRequestHistory,
  savePipelineDispatchRequestHistory,
  type PipelineDispatchRequestAction,
  type PipelineDispatchRequestRecord
} from "./pipelineDispatchRequestHistory";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from "./preferences";
import {
  buildProjectManagementArenaDispatch,
  createProjectManagementChatReply,
  flattenProjectManagementRows,
  projectManagementComplexityLabels,
  projectManagementStatusLabels,
  projectManagementTypeLabels,
  toggleProjectManagementTaskCollapsed,
  type ProjectManagementArenaDispatchResult,
  type ProjectManagementChatMessage,
  type ProjectManagementTask
} from "./projectManagementHierarchy";
import {
  loadProjectManagementChat,
  loadProjectManagementTasks,
  saveProjectManagementChat,
  saveProjectManagementTasks
} from "./projectManagementHierarchyStorage";
import {
  codexSessionStateToPanelMessages,
  createPanelReplyMessage,
  createPanelLiveErrorMessage,
  createPanelLiveStatusMessage,
  createPanelProviderSlashCommandStatusMessage,
  createPanelSlashCommandStatusMessage,
  getPanelSlashCommandDecision,
  getPanelSlashCommandSuggestions,
  buildPanelLiveTurnEvidence,
  loadPanelChatMessages,
  panelSlashCommands,
  savePanelChatMessages,
  createPanelLiveRecoveryMessage,
  createPanelLiveTurnEvidenceMessage,
  type PanelChatMessage,
  type PanelSlashCommandDecision,
  type PanelSlashCommand
} from "./panelChat";
import {
  buildMcpCatalogSnapshot,
  defaultMcpCatalog,
  type McpCatalogEntry,
  type McpCatalogRefreshSource,
  type McpCatalogSnapshot
} from "./mcpCatalog";
import { loadProviderMcpCatalogSnapshot } from "./providerMcpCatalog";
import {
  buildDefaultMigrationPreview,
  buildMigrationPreviewCounts,
  appendMigrationProfileDraftHistory,
  defaultMigrationSource,
  defaultMigrationSources,
  createMigrationProfileDraft,
  loadMigrationProfileDraftHistory,
  MIGRATION_DRAFT_HISTORY_LIMIT,
  redactMigrationPreviewDetail,
  rollbackMigrationProfileDraftHistory,
  saveMigrationProfileDraftHistory,
  summarizeMigrationProfileDrafts,
  toggleMigrationCategory,
  type MigrationProfileDraft,
  type MigrationProfileDraftHistoryRecord,
  type MigrationProfileDraftHistorySummary,
  type MigrationCategoryId,
  type MigrationCategoryState,
  type MigrationPreview,
  type MigrationPreviewCounts,
  type MigrationSourceId
} from "./migrationModel";
import {
  buildMigrationHardeningReadiness,
  createMigrationApplyIntentNotice,
  type MigrationHardeningReadiness
} from "./migrationHardeningReadiness";
import {
  buildMigrationBlockerPriority
} from "./migrationBlockerPriority";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import {
  buildMigrationOwnerApprovalHandoff,
  clearMigrationOwnerApprovalRecord,
  createMigrationOwnerApprovalRecord,
  loadMigrationOwnerApprovalRecord,
  saveMigrationOwnerApprovalRecord,
  type MigrationOwnerApprovalRecord
} from "./migrationOwnerApprovalHandoff";
import { buildMigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
import { buildMigrationTraceabilitySummary } from "./migrationTraceability";
import { buildPhase5MigrationCompletionGate } from "./phase5MigrationCompletionGate";
import {
  buildPhase5ProfileActivationGate,
  type Phase5ProfileActivationGate
} from "./phase5ProfileActivationGate";
import {
  buildPersonalizationCatalogSnapshot,
  defaultPersonalizationCatalog,
  type PersonalizationCatalogRefreshSource,
  type PersonalizationCatalogSnapshot,
  type PersonalizationCatalogEntry
} from "./personalizationCatalog";
import { loadProviderPersonalizationCatalogSnapshot } from "./providerPersonalizationCatalog";
import {
  buildPluginCatalogSnapshot,
  defaultPluginCatalog,
  type PluginCatalogEntry,
  type PluginCatalogRefreshSource,
  type PluginCatalogSnapshot
} from "./pluginCatalog";
import { loadProviderPluginCatalogSnapshot } from "./providerPluginCatalog";
import {
  defaultSkillCatalog,
  buildSkillCatalogSnapshot,
  summarizeSkillCatalog,
  type SkillCatalogEntry,
  type SkillCatalogRefreshSource,
  type SkillCatalogSnapshot
} from "./skillCatalog";
import { loadProviderSkillCatalogSnapshot } from "./providerSkillCatalog";
import {
  normalizeCodexPanelTurnResultEvents,
  reduceCodexSessionEvents,
  type CodexPanelTurnResultPayload
} from "./codexSession";
import {
  buildCodexSessionLifecycleControlsGate,
  buildCodexSessionControls,
  summarizeUnsupportedSessionControls
} from "./codexSessionControls";
import {
  buildSessionControlReadinessEvidence,
  type SessionControlReadinessEvidence
} from "./sessionControlReadinessEvidence";
import {
  buildPhase3ExitGateEvidence,
  type Phase3ExitGateEvidence
} from "./phase3ExitGateEvidence";
import {
  buildPhase3ClearancePackage,
  type Phase3ClearancePackage
} from "./phase3ClearancePackage";
import {
  buildPhase3ClearanceCommandPlan,
  type Phase3ClearanceCommandPlan
} from "./phase3ClearanceCommandPlan";
import {
  buildPhase3ClearanceBlockerPriority,
  type Phase3ClearanceBlockerPrioritySnapshot
} from "./phase3ClearanceBlockerPriority";
import {
  buildPhase3ClearanceTraceabilityPrecondition,
  buildPhase3ClearanceTraceability,
  type Phase3ClearanceTraceabilityPrecondition,
  type Phase3ClearanceTraceabilitySnapshot
} from "./phase3ClearanceTraceability";
import {
  buildPhase3ClearanceCompletionStatus,
  type Phase3ClearanceCompletionStatus
} from "./phase3ClearanceCompletionStatus";
import {
  buildPhase3HandoffGate,
  type Phase3HandoffGate
} from "./phase3HandoffGate";
import {
  buildPhase3HandoffEvidenceFingerprint,
  derivePhase3HandoffRecordValidation,
  derivePhase3HandoffRecordState,
  loadPhase3OwnerHandoffRecord,
  type Phase3HandoffRecordValidation,
  type Phase3OwnerHandoffRecord
} from "./phase3HandoffRecord";
import {
  canRecordPhase3OwnerHandoffWithProofExport,
  runPhase3OwnerHandoffClearAction,
  runPhase3OwnerHandoffRecordAction,
  runPhase3SmokeProofBundleImportAction
} from "./phase3OwnerProofActionFlow";
import {
  clearPhase3CommandValidationRecord,
  createPhase3CommandValidationRecord,
  derivePhase3CommandValidationRecordValidation,
  loadPhase3CommandValidationRecord,
  savePhase3CommandValidationRecord,
  type Phase3CommandValidationRecordValidation,
  type Phase3CommandValidationRecord
} from "./phase3CommandValidationRecord";
import { runPhase3CommandValidationImportAction } from "./phase3CommandValidationImport";
import { runPhase3PanelEvidenceImportAction } from "./phase3PanelEvidenceImport";
import {
  buildPhase3RecordedArtifactLoadNotice,
  type Phase3RecordedArtifactLoadState
} from "./phase3ProofArtifactLoadNotice";
import {
  buildPhase3OwnerTestingActions,
  gatePhase3OwnerTestingActionsToPrimary,
  type Phase3OwnerTestingAction
} from "./phase3OwnerTestingActions";
import {
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  savePhase3SessionControlEvidenceByPanel,
  savePhase3SlashEvidenceByPanel,
  shouldSavePhase3PanelEvidence
} from "./phase3PanelEvidenceStorage";
import {
  buildPhase3ProofExportArtifact,
  preparePhase3ProofExportDownload,
  verifyPhase3ProofExportArtifact,
  verifySerializedPhase3ProofExportArtifact,
  type Phase3ProofExportVerification
} from "./phase3ProofExport";
import {
  buildPhase3SmokeProofReadiness,
  type Phase3SmokeProofReadinessResult
} from "./phase3SmokeProofReadiness";
import {
  buildPhasePriorityEvidence,
  type PhasePriorityEvidenceResult
} from "./phasePriorityEvidence";
import { buildPhase126PublishHoldTraceability } from "./phase126PublishHoldTraceability";
import { buildPhase126PublishHoldBlockerPriority } from "./phase126PublishHoldBlockerPriority";
import {
  buildPhase126PublishHoldCloseoutStatus,
  type Phase126PublishHoldCloseoutStatus
} from "./phase126PublishHoldCloseoutStatus";
import {
  buildPhase126PublishExecutionGate,
  type Phase126PublishExecutionGate
} from "./phase126PublishExecutionGate";
import {
  loadPhase3SmokeProofBundleWithStorageProof,
  savePhase3SmokeProofBundle
} from "./phase3SmokeProofStorage";
import {
  buildPhase3SmokeProofNotice,
  countPersistedPhase3SmokeProofRows
} from "./phase3SmokeProofNotice";
import {
  loadPhasePrioritySmokeProofBundle,
  savePhasePrioritySmokeProofBundle
} from "./phasePrioritySmokeProofStorage";
import {
  findCodexPanelSessionIdentityIssues,
  loadPanelSessionState,
  savePanelSessionState,
  upsertPanelSession,
  type CodexPanelSessionIdentityIssue,
  type CodexPanelSessionState,
  type CodexPanelSessionStateRecord,
  type CodexPanelSessionStatus
} from "./codexPanelSessionState";
import {
  decideCodexTransport,
  getFallbackCodexTransportProbe,
  loadCodexActiveTurnControlSmokeProof,
  loadCodexActiveTurnSteerSmokeProof,
  loadCodexLiveSmokeProof,
  loadCodexLiveControlSmokeProof,
  loadCodexTwoPanelSmokeProof,
  loadCodexTransportProbe,
  type CodexActiveTurnControlSmokeProof,
  type CodexActiveTurnSteerSmokeProof,
  type CodexLiveSmokeProof,
  type CodexLiveControlSmokeProof,
  type CodexTwoPanelSmokeProof,
  type CodexTransportDecision,
  type CodexTransportProbe,
  type CodexTransportState
} from "./codexTransportSpike";
import {
  steerboardMilestoneStatuses,
  summarizeMilestoneStatuses,
  type MilestoneStatus,
  type MilestoneStatusSummary
} from "./milestoneStatus";
import {
  buildRemainingGoalPriorityQueue,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  summarizeRemainingGoalPlan,
  type RemainingGoalPlanItem,
  type RemainingGoalPlanSummary
} from "./remainingGoalPlan";
import {
  createMilestoneReportRowState
} from "./milestoneReportRowState";
import {
  createMilestoneReportNextDetail
} from "./milestoneReportNextDetail";
import {
  createCockpitPanelPriority,
  type CockpitPanelPriority
} from "./cockpitPanelPriority";
import {
  createCockpitPanelFocusTarget,
  type CockpitPanelFocusTarget
} from "./cockpitPanelFocus";
import {
  createCockpitPanelFocusControls
} from "./cockpitPanelFocusControls";
import {
  createCockpitFocusedPanelStatus,
  type CockpitFocusedPanelStatus
} from "./cockpitFocusedPanelStatus";
import {
  createCockpitToolbarFocusAction
} from "./cockpitToolbarFocusAction";
import {
  createCockpitInteractionReadiness,
  type CockpitInteractionReadiness
} from "./cockpitInteractionReadiness";
import {
  createCockpitAcceptancePass,
  type CockpitAcceptancePass
} from "./cockpitAcceptancePass";
import {
  canDeployPlanningDraft,
  evaluatePlanningReadiness,
  normalizePlanningDraft,
  type PlanningDraft,
  type PlanningDraftRequiredField
} from "./planning";
import {
  loadPlanningDrafts,
  savePlanningDrafts
} from "./planningStorage";
import {
  dispatchableRegistryEntries,
  summarizeRegistry,
  type RegistryEntry
} from "./registry";
import {
  canRunWithAdapter,
  runtimeStateLabel,
  summarizeRuntimeAdapters,
  type RuntimeAdapter
} from "./runtime";
import {
  createBlankRuntimeProfile,
  evaluateRuntimeProfileReadiness,
  type RuntimeTransport,
  type RuntimeProfile,
  type RuntimeProfileReadiness,
  type RuntimeWorkspaceMode
} from "./runtimeProfile";
import {
  runtimeProfiles,
  selectRuntimeProfileForAdapter,
  summarizeRuntimeProfiles
} from "./runtimeProfileCatalog";
import {
  loadRuntimeProfileDraft,
  saveRuntimeProfileDraft
} from "./runtimeProfileDraftStorage";
import {
  buildRuntimeProfileApprovalSnapshot,
  type RuntimeProfileApprovalIntent,
  type RuntimeProfileApprovalSnapshot
} from "./runtimeProfileApproval";
import {
  appendRuntimeProfileApprovalRecord,
  createRuntimeProfileApprovalRecord,
  loadRuntimeProfileApprovalHistory,
  saveRuntimeProfileApprovalHistory,
  type RuntimeProfileApprovalRecord,
  type RuntimeProfileApprovalRecordAction
} from "./runtimeProfileApprovalHistory";
import {
  buildRuntimeProfileActivationSnapshot,
  canActivateRuntimeProfile,
  createRuntimeProfileActivationRecord,
  loadRuntimeProfileActivation,
  saveRuntimeProfileActivation,
  type RuntimeProfileActivationSnapshot
} from "./runtimeProfileActivation";
import {
  buildRuntimeProfilePermissionHandoffSnapshot,
  type RuntimeProfilePermissionHandoffSnapshot
} from "./runtimeProfilePermissionHandoff";
import {
  appendRuntimeProfilePermissionRequestRecord,
  createRuntimeProfilePermissionRequestRecord,
  loadRuntimeProfilePermissionRequestHistory,
  saveRuntimeProfilePermissionRequestHistory,
  type RuntimeProfilePermissionRequestAction,
  type RuntimeProfilePermissionRequestRecord
} from "./runtimeProfilePermissionRequestHistory";
import {
  buildRuntimeProfilePermissionApprovalSnapshot,
  type RuntimeProfilePermissionApprovalSnapshot
} from "./runtimeProfilePermissionApproval";
import {
  buildRuntimeProfilePermissionAuditSnapshot,
  type RuntimeProfilePermissionAuditSnapshot
} from "./runtimeProfilePermissionAudit";
import {
  createSecurityPrivacyThreatModel,
  type SecurityPrivacyThreatModel
} from "./securityPrivacyThreatModel";
import {
  buildPhase8PermissionAuditDepth,
  type Phase8PermissionAuditDepthSnapshot
} from "./phase8PermissionAuditDepth";
import { buildPhase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import { buildPhase8ClosureAuditStatus } from "./phase8ClosureAuditStatus";
import { buildPhase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";
import {
  clearPhase8AuditReviewRecord,
  createPhase8AuditReviewRecord,
  loadPhase8AuditReviewRecord,
  savePhase8AuditReviewRecord,
  type Phase8AuditReviewRecord
} from "./phase8AuditReviewRecord";
import {
  buildPhase8AuditReviewArtifact,
  serializePhase8AuditReviewArtifact,
  verifyPhase8AuditReviewArtifact,
  verifySerializedPhase8AuditReviewArtifact,
  type Phase8AuditReviewArtifactVerification
} from "./phase8AuditReviewArtifact";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskClosure } from "./phase8RiskClosure";
import { buildPhase8AuditReviewBlockerHandoff } from "./phase8AuditReviewBlockerHandoff";
import { buildPhase8CloseoutStatus } from "./phase8CloseoutStatus";
import { buildPhase8FinalCompletionHandoff } from "./phase8FinalCompletionHandoff";
import { buildPhase8MutationExpansionGate } from "./phase8MutationExpansionGate";
import { buildPhase8OwnerActionHandoff } from "./phase8OwnerActionHandoff";
import { buildPhase8OwnerReviewClosureReadiness } from "./phase8OwnerReviewClosureReadiness";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";
import {
  buildPhase9RunnerApprovalSnapshot,
  type Phase9RunnerApprovalSnapshot
} from "./phase9RunnerApproval";
import { buildPhase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import { buildPhase9RunnerBlockerPriority } from "./phase9RunnerBlockerPriority";
import { buildPhase9RunnerCompletionGate } from "./phase9RunnerCompletionGate";
import {
  buildPhase9RunnerCloseoutStatus,
  type Phase9RunnerCloseoutStatus
} from "./phase9RunnerCloseoutStatus";
import {
  buildPermissionedToolEvidenceGate,
  type PermissionedToolEvidenceGate
} from "./permissionedToolEvidenceGate";
import {
  buildPhase9DesktopProbeGate,
  buildPhase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";
import {
  clearPhase9RunnerApprovalRecord,
  createPhase9RunnerApprovalRecord,
  loadPhase9RunnerApprovalRecord,
  savePhase9RunnerApprovalRecord,
  type Phase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";
import {
  buildPhase10ArenaPolishSnapshot,
  type Phase10ArenaPolishSnapshot
} from "./phase10ArenaPolish";
import { buildPhase10FlexLayoutSpikeSummary } from "./phase10FlexLayoutSpike";
import { buildPhase10ArenaPolishTraceability } from "./phase10ArenaPolishTraceability";
import { buildPhase10ArenaPolishBlockerPriority } from "./phase10ArenaPolishBlockerPriority";
import {
  buildPhase10ArenaPolishCloseoutStatus,
  type Phase10ArenaPolishCloseoutStatus
} from "./phase10ArenaPolishCloseoutStatus";
import {
  buildPhase10ArenaReviewAddressabilityGate,
  type Phase10ArenaReviewAddressabilityGate
} from "./phase10ArenaReviewAddressabilityGate";
import {
  buildPhase10PackagingResumeGate,
  type Phase10PackagingResumeGate
} from "./phase10PackagingResumeGate";
import {
  buildPhase11OwnerCommandCenterSnapshot,
  type Phase11OwnerCommandCenterSnapshot
} from "./phase11OwnerCommandCenter";
import {
  buildPhase11EvidenceRecords,
  phase11EvidenceGateCoverageCopy,
  type Phase11EvidenceGate,
  type Phase11EvidenceRecordInput,
  type Phase11EvidenceRecordsSnapshot
} from "./phase11EvidenceRecords";
import {
  clearPhase11EvidenceRecordInput,
  createPhase11EvidenceRecordInput,
  loadPhase11EvidenceRecordInputs,
  parsePhase11EvidenceRecordInputs,
  savePhase11EvidenceRecordInputs,
  type Phase11EvidenceRecordInputMap
} from "./phase11EvidenceRecordStorage";
import {
  buildPhase11ProofFreshnessDepth,
  type Phase11ProofFreshnessDepthSnapshot
} from "./phase11ProofFreshnessDepth";
import {
  buildPhase11ReleaseReadinessSnapshot,
  type Phase11ReleaseReadinessSnapshot
} from "./phase11ReleaseReadiness";
import {
  buildPhase11SignedAuditExportArtifact,
  serializePhase11SignedAuditExportArtifact,
  verifyPhase11SignedAuditExportArtifact,
  type Phase11SignedAuditExportArtifactVerification
} from "./phase11SignedAuditExportArtifact";
import { buildPhase11OwnerReleaseTraceability } from "./phase11OwnerReleaseTraceability";
import { buildPhase11OwnerReleaseBlockerPriority } from "./phase11OwnerReleaseBlockerPriority";
import {
  buildPhase11PriorityTraceGate,
  type Phase11PriorityTraceGate
} from "./phase11PriorityTraceGate";
import {
  buildPhase11ReleaseCloseoutStatus,
  type Phase11ReleaseCloseoutStatus
} from "./phase11ReleaseCloseoutStatus";
import {
  buildPhase11ExternalDeliveryGate,
  type Phase11ExternalDeliveryGate
} from "./phase11ExternalDeliveryGate";
import {
  buildPhase11CleanInstallPackagingGate,
  type Phase11CleanInstallPackagingGate
} from "./phase11CleanInstallPackagingGate";
import {
  buildPhase11OwnerCommandCloseoutStatus,
  type Phase11OwnerCommandCloseoutStatus
} from "./phase11OwnerCommandCloseoutStatus";
import {
  createReleasePrivacyReadiness,
  type ReleasePrivacyReadinessItemStatus,
  type ReleasePrivacyReadinessSnapshot
} from "./releasePrivacyReadiness";
import {
  createSecurityAcceptanceCoverage,
  type SecurityAcceptanceCoverageSnapshot
} from "./securityAcceptanceCoverage";
import {
  createSecurityAcceptanceRepeatedRuns,
  type SecurityAcceptanceRepeatedRunsSnapshot
} from "./securityAcceptanceRepeatedRuns";
import {
  createSecurityFinalReview,
  type SecurityFinalReviewSnapshot
} from "./securityFinalReview";
import {
  renderDispatchPackageMarkdown,
  tryBuildDispatchPackage,
  type DispatchPackage
} from "./dispatch";
import {
  createMockRunFromDispatchPackage,
  runToOrchestrationTasks,
  runToSessionSummaries,
  type MockRunStatus,
  type MockOrchestratorRun
} from "./run";
import {
  filterRunsByProject,
  selectRunById,
  summarizeRunHistory,
  upsertRunHistory
} from "./runHistory";
import {
  loadRunHistory,
  saveRunHistory
} from "./runHistoryStorage";
import {
  recordWorkerValidationAttemptResult,
  transitionMockRunStatus,
  type RunLifecycleStatus
} from "./runLifecycle";
import {
  buildRunTimeline,
  summarizeRunTimeline,
  type RunTimelineEvent
} from "./runEvents";
import {
  buildAdapterContract,
  summarizeAdapterContract,
  type AdapterContractItem
} from "./adapterContract";
import {
  buildRuntimeIngestionPreview,
  summarizeRuntimeIngestion,
  type RuntimeIngestionEvent
} from "./runtimeIngestion";
import {
  buildRuntimeStreamSnapshot,
  nextRuntimeStreamPosition,
  type RuntimeStreamPlaybackState,
  type RuntimeStreamSnapshot
} from "./runtimeStream";
import {
  buildCockpitMonitorSummary,
  type CockpitMonitorSummary
} from "./cockpitMonitorSummary";
import {
  buildCockpitMonitorEventFeed,
  type CockpitMonitorEventFeedItem
} from "./cockpitMonitorEventFeed";
import {
  buildCockpitMonitorNextEventPreview,
  type CockpitMonitorNextEventPreview
} from "./cockpitMonitorNextEvent";
import {
  createCockpitMonitorHealth,
  type CockpitMonitorHealth
} from "./cockpitMonitorHealth";
import {
  createCockpitMonitorAttention,
  type CockpitMonitorAttention
} from "./cockpitMonitorAttention";
import {
  createCockpitMonitorQuality,
  type CockpitMonitorQuality
} from "./cockpitMonitorQuality";
import {
  createCockpitMonitorLoop,
  type CockpitMonitorLoop
} from "./cockpitMonitorLoop";
import {
  createCockpitMonitorDepth,
  type CockpitMonitorDepth
} from "./cockpitMonitorDepth";
import {
  createCockpitModeHandoff,
  type CockpitModeHandoff
} from "./cockpitModeHandoff";
import {
  createCockpitModeHandoffQa,
  type CockpitModeHandoffQa
} from "./cockpitModeHandoffQa";
import {
  createCockpitPanelRoster,
  type CockpitPanelRoster
} from "./cockpitPanelRoster";
import {
  createCockpitPanelOverflow,
  type CockpitPanelOverflow
} from "./cockpitPanelOverflow";
import {
  createCockpitLayoutCapacity,
  type CockpitLayoutCapacity
} from "./cockpitLayoutCapacity";
import {
  createCockpitPanelIdentity,
  type CockpitPanelIdentity
} from "./cockpitPanelIdentity";
import {
  createCockpitPanelFileScope,
  type CockpitPanelFileScope
} from "./cockpitPanelFileScope";
import {
  createCockpitPanelAttempt,
  type CockpitPanelAttempt
} from "./cockpitPanelAttempt";
import {
  createCockpitPanelValidation,
  type CockpitPanelValidation
} from "./cockpitPanelValidation";
import {
  createCockpitPanelBranch,
  type CockpitPanelBranch
} from "./cockpitPanelBranch";
import {
  createCockpitPanelRuntime,
  type CockpitPanelRuntime
} from "./cockpitPanelRuntime";
import {
  createCockpitPanelActivity,
  type CockpitPanelActivity
} from "./cockpitPanelActivity";
import {
  createCockpitPanelToolCoverage,
  type CockpitPanelToolCoverage
} from "./cockpitPanelToolCoverage";
import {
  buildCockpitMonitorControlState,
  type CockpitMonitorControlState
} from "./cockpitMonitorControls";
import {
  buildRuntimeAdapterSessionSnapshot,
  type RuntimeAdapterSessionSnapshot
} from "./runtimeAdapterSession";
import {
  createRuntimeCoreEntryValidation,
  type RuntimeCoreEntryValidation
} from "./runtimeCoreEntryValidation";
import {
  buildRuntimeEventSourceSnapshot,
  type RuntimeEventSourceSnapshot
} from "./runtimeEventSource";
import {
  buildRuntimeSourceConnectionSnapshot,
  type RuntimeSourceConnectionSnapshot
} from "./runtimeSourceConnection";
import {
  buildRuntimeAdapterBridgeSnapshot,
  type RuntimeAdapterBridgeIntent,
  type RuntimeAdapterBridgeSnapshot
} from "./runtimeAdapterBridge";
import {
  buildRuntimeLaunchRequestSnapshot,
  type RuntimeLaunchRequestSnapshot
} from "./runtimeLaunchRequest";
import {
  buildRuntimeLaunchApprovalSnapshot,
  type RuntimeLaunchApprovalIntent,
  type RuntimeLaunchApprovalSnapshot
} from "./runtimeLaunchApproval";
import {
  createRuntimeLaunchHandoffAcceptance,
  type RuntimeLaunchHandoffAcceptance
} from "./runtimeLaunchHandoffAcceptance";
import {
  createRuntimeRecoveryFailureCoverage,
  type RuntimeRecoveryFailureCoverage
} from "./runtimeRecoveryFailureCoverage";
import {
  buildFailureStateFixtures,
  summarizeFailureStateFixtures,
  type FailureStateFixture,
  type FailureStateFixtureSummary
} from "./failureStateFixtures";
import {
  buildOwnerTestingChecklist,
  type OwnerTestingChecklist,
  type OwnerTestingReadinessState
} from "./ownerTestingChecklist";
import {
  appendLiveActionAuditRecord,
  buildLiveActionAuditExportMarkdown,
  createLiveActionAuditRecord,
  loadLiveActionAuditRecords,
  saveLiveActionAuditRecords,
  type LiveActionAuditAction,
  type LiveActionAuditRecord
} from "./liveActionAudit";
import {
  applyLiveActionPermissionDecision,
  buildLiveActionPermissionRequestSummary,
  canExecuteLiveAction,
  type LiveActionPermissionDecision,
  type LiveActionPermissionRequest,
  type LiveActionPermissionRequestSummary,
  type LiveActionProvider,
  type LiveActionRiskLevel
} from "./liveActionPermission";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS,
  summarizeLiveActionRunnerExecutions,
  type LiveActionRunnerExecutionResult,
  type LiveActionRunnerNextAction,
  type LiveActionRunnerSummary
} from "./liveActionRunner";
import {
  buildDesktopActionRunnerBrowserFallbackResult,
  buildDesktopActionRunnerBuildFailureResult,
  buildTerminalReadonlyProbeRequest,
  normalizeDesktopActionRunnerBackendResult,
  summarizeDesktopActionRunnerResult,
  type DesktopActionRunnerBackendResult,
  type DesktopActionRunnerExecuteResult,
  type DesktopActionRunnerResultSummary
} from "./desktopActionRunner";
import {
  buildRuntimeExecutionAuditSnapshot,
  type RuntimeExecutionAuditItem,
  type RuntimeExecutionAuditSnapshot
} from "./runtimeExecutionAudit";
import {
  appendRuntimeExecutionAuditRecord,
  createRuntimeExecutionAuditRecord,
  loadRuntimeExecutionAuditHistory,
  saveRuntimeExecutionAuditHistory,
  type RuntimeExecutionAuditRecord,
  type RuntimeExecutionAuditRecordAction
} from "./runtimeExecutionAuditHistory";
import {
  getFallbackDesktopRuntimeBridgeStatus,
  loadDesktopRuntimeBridgeStatus,
  type DesktopRuntimeBridgeStatus
} from "./desktopRuntimeBridge";
import {
  getFallbackDesktopPermissionApprovalStatus,
  loadDesktopPermissionApprovalStatus,
  type DesktopPermissionApprovalStatus
} from "./desktopPermissionApproval";
import {
  buildDesktopPackagingReadinessSnapshot,
  type DesktopPackagingReadinessSnapshot
} from "./desktopPackagingReadiness";
import {
  buildLocalEvidenceReadinessSnapshot,
  type LocalEvidenceReadinessSnapshot
} from "./localEvidenceReadiness";
import {
  buildToolEvidenceReadinessSnapshot,
  type ToolEvidenceReadinessSnapshot
} from "./toolEvidenceReadiness";
import {
  appendToolEvidenceCaptureRecord,
  createToolEvidenceCaptureRecord,
  loadToolEvidenceCaptureHistory,
  saveToolEvidenceCaptureHistory,
  type ToolEvidenceCaptureRecord,
  type ToolEvidenceCaptureRecordAction
} from "./toolEvidenceCaptureHistory";

const modeLabels: Record<CockpitMode, string> = {
  focus: "Focus",
  orchestrator: "Orchestrator",
  monitor: "Monitor"
};

const stateIcon: Record<SessionState, ReactNode> = {
  idle: <CircleDot size={14} />,
  planning: <Workflow size={14} />,
  implementing: <Activity size={14} />,
  validating: <ShieldCheck size={14} />,
  blocked: <AlertTriangle size={14} />,
  failed: <AlertTriangle size={14} />,
  complete: <CheckCircle2 size={14} />
};

const missingFieldLabels: Record<PlanningDraftRequiredField, string> = {
  title: "Title",
  objective: "Objective",
  targetProjectId: "Project",
  scope: "Scope",
  acceptanceCriteria: "Acceptance",
  validationPlan: "Validation",
  rollbackNote: "Rollback"
};

const runLifecycleActions: Array<{
  icon: ReactNode;
  label: string;
  status: RunLifecycleStatus;
}> = [
  { icon: <RotateCcw size={14} />, label: "Queue", status: "queued" },
  { icon: <Play size={14} />, label: "Start", status: "running" },
  { icon: <CheckCircle2 size={14} />, label: "Complete", status: "complete" },
  { icon: <AlertTriangle size={14} />, label: "Block", status: "blocked" },
  { icon: <AlertTriangle size={14} />, label: "Fail", status: "failed" }
];

const streamStateLabels: Record<RuntimeStreamPlaybackState, string> = {
  idle: "Idle",
  streaming: "Streaming",
  paused: "Paused",
  complete: "Complete",
  blocked: "Blocked"
};

const streamIntervalMs = 1100;
const liveActionPermissionTimeoutMs = 15 * 60 * 1000;
const runtimeTransportOptions: RuntimeTransport[] = ["local-process", "remote-endpoint", "mock"];
const runtimeWorkspaceModeOptions: RuntimeWorkspaceMode[] = ["read-only", "read-write", "isolated"];

interface LiveActionGateDefinition {
  provider: LiveActionProvider;
  actionLabel: string;
  why: string;
  workspace: string;
  service: string;
  risk: LiveActionRiskLevel;
  detail: string;
}

const liveActionGateDefinitions: LiveActionGateDefinition[] = [
  {
    provider: "terminal",
    actionLabel: "Run terminal command",
    why: "Terminal commands can mutate the workspace or host environment.",
    workspace: "current workspace",
    service: "local shell",
    risk: "high",
    detail: "Terminal actions require explicit approval before any command can run."
  },
  {
    provider: "git",
    actionLabel: "Run Git operation",
    why: "Git operations can stage, commit, push, or alter repository state.",
    workspace: "current repository",
    service: "git",
    risk: "high",
    detail: "Git actions require a visible approval and audit record."
  },
  {
    provider: "mcp",
    actionLabel: "Invoke MCP tool",
    why: "MCP tools can reach local or external systems depending on the server.",
    workspace: "configured MCP server",
    service: "mcp",
    risk: "high",
    detail: "MCP tool use is locked until the action is approved."
  },
  {
    provider: "plugin",
    actionLabel: "Run plugin action",
    why: "Plugin actions can call service integrations or generate artifacts.",
    workspace: "active plugin",
    service: "plugin",
    risk: "medium",
    detail: "Plugin execution requires approval when it can mutate data or call a service."
  },
  {
    provider: "automation",
    actionLabel: "Start automation",
    why: "Automations can continue running after the immediate user turn.",
    workspace: "automation scheduler",
    service: "automation",
    risk: "high",
    detail: "Automations require approval before scheduling or recurring execution."
  },
  {
    provider: "external-service",
    actionLabel: "Send external request",
    why: "External services can receive data or change account state.",
    workspace: "external account",
    service: "external service",
    risk: "high",
    detail: "Outbound external actions stay locked until reviewed."
  },
  {
    provider: "runtime-launch",
    actionLabel: "Launch runtime worker",
    why: "Runtime launch can start a live worker process or endpoint session.",
    workspace: "runtime profile",
    service: "runtime",
    risk: "high",
    detail: "Worker launch must be approved before live execution."
  },
  {
    provider: "profile-activation",
    actionLabel: "Activate runtime profile",
    why: "Profiles can grant permissions and change the working execution mode.",
    workspace: "runtime profile",
    service: "profile",
    risk: "high",
    detail: "Profile activation requires approval before it changes live capability."
  }
];

type ToolEvidenceCaptureIntent = "idle" | "requested";
type RuntimeProfilePermissionRequestIntent = "idle" | "requested";
type PipelineDispatchRequestIntent = "idle" | "requested";
type AppMenuId = "file" | "view" | "connect" | "help";
type PlatformCatalogDialog = "plugins" | "skills" | "mcp" | "automations" | "personalization";
type AppDialog = "migration" | "connection" | "slash-help" | PlatformCatalogDialog;

type PlatformCatalogState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

type PlatformCatalogSummary = {
  total: number;
  live: number;
  preview: number;
  disconnected: number;
  setupRequired: number;
  unsupported: number;
  unavailable: number;
  availability: number;
};

type PlatformCatalogRow = {
  id: string;
  label: string;
  detail: string;
  state: PlatformCatalogState;
  meta: string[];
};

type PlatformCatalogView = {
  title: string;
  eyebrow: string;
  lead: string;
  rows: PlatformCatalogRow[];
  summary: PlatformCatalogSummary;
  sourceLabel?: string;
};

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function slashCommandExecutionEvidenceEqual(
  current: SlashCommandExecutionEvidence | undefined,
  next: SlashCommandExecutionEvidence
): boolean {
  if (!current) {
    return false;
  }

  return (
    current.route === next.route &&
    current.state === next.state &&
    current.executable === next.executable &&
    current.command === next.command &&
    current.status === next.status &&
    current.readiness === next.readiness &&
    current.pass === next.pass &&
    current.detail === next.detail &&
    current.safety === next.safety &&
    current.evidence.providerRoute === next.evidence.providerRoute &&
    current.evidence.status === next.evidence.status &&
    current.evidence.live === next.evidence.live &&
    current.evidence.error === next.evidence.error
  );
}

function sessionControlReadinessEvidenceEqual(
  current: SessionControlReadinessEvidence | undefined,
  next: SessionControlReadinessEvidence
): boolean {
  if (!current) {
    return false;
  }

  return (
    current.state === next.state &&
    current.readiness === next.readiness &&
    current.pass === next.pass &&
    current.statusLabel === next.statusLabel &&
    current.detail === next.detail &&
    current.safety === next.safety &&
    current.counts.live === next.counts.live &&
    current.counts.review === next.counts.review &&
    current.counts.unsupported === next.counts.unsupported &&
    current.counts.blocked === next.counts.blocked &&
    current.controlStates.interrupt === next.controlStates.interrupt &&
    current.controlStates.retry === next.controlStates.retry &&
    current.controlStates.steer === next.controlStates.steer &&
    current.controlStates.fork === next.controlStates.fork &&
    current.controlStates.resume === next.controlStates.resume &&
    current.controlStates.archive === next.controlStates.archive
  );
}

function parseRuntimeProfileList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatRuntimeProfileList(values: string[]): string {
  return values.join(", ");
}

function latestPermissionRequestIntent(
  records: RuntimeProfilePermissionRequestRecord[]
): RuntimeProfilePermissionRequestIntent {
  return records[0]?.action === "requested" ? "requested" : "idle";
}

function createLiveActionPermissionRequest(
  definition: LiveActionGateDefinition,
  state: LiveActionPermissionRequest["state"],
  requestedAt: string
): LiveActionPermissionRequest {
  const request: LiveActionPermissionRequest = {
    id: `${definition.provider}:live-action-permission`,
    provider: definition.provider,
    actionLabel: definition.actionLabel,
    state,
    requestedAt,
    risk: definition.risk
  };

  if (state === "idle") {
    return request;
  }

  return {
    ...request,
    timeoutMs: liveActionPermissionTimeoutMs,
    expiresAt: new Date(Date.parse(requestedAt) + liveActionPermissionTimeoutMs).toISOString()
  };
}

function createInitialLiveActionRequests(): Record<string, LiveActionPermissionRequest> {
  const createdAt = "1970-01-01T00:00:00.000Z";

  return Object.fromEntries(
    liveActionGateDefinitions.map((definition) => [
      definition.provider,
      createLiveActionPermissionRequest(definition, "idle", createdAt)
    ])
  );
}

function buildLiveActionAuditInput(
  definition: LiveActionGateDefinition,
  resultSummary: string
) {
  return {
    what: definition.actionLabel,
    why: definition.why,
    provider: definition.provider,
    workspace: definition.workspace,
    service: definition.service,
    resultSummary,
    risk: definition.risk
  };
}

function latestPipelineDispatchRequestIntent(
  records: PipelineDispatchRequestRecord[],
  itemId?: string
): PipelineDispatchRequestIntent {
  if (!itemId) {
    return "idle";
  }

  const record = records.find((entry) => entry.itemId === itemId);
  return record?.action === "requested" ? "requested" : "idle";
}

function formatTimestamp(value: string): string {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return timestamp.toLocaleString([], {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  });
}

function phase9RunnerReviewAction(snapshot: Phase9RunnerApprovalSnapshot): {
  readonly canRecord: boolean;
  readonly title: string;
} {
  const ownerReviewItem = snapshot.items.find(
    (item) => item.id === "phase-09-desktop-runner-approval:owner-review"
  );
  const ownerReviewNextAction = ownerReviewItem?.nextAction.toLowerCase() ?? "";
  const ownerReviewCanBeRecorded =
    ownerReviewNextAction.includes("local owner review") ||
    ownerReviewNextAction.includes("phase 9 runner approval review");
  const ownerReviewOnlyRemaining =
    ownerReviewItem !== undefined &&
    ownerReviewCanBeRecorded &&
    (ownerReviewItem.status === "waiting" || ownerReviewItem.status === "review") &&
    snapshot.blockedCount === 0 &&
    snapshot.reviewCount + snapshot.waitingCount === 1;

  if (ownerReviewOnlyRemaining) {
    return {
      canRecord: true,
      title: "Record a local owner review of the current Phase 9 runner approval evidence."
    };
  }

  return {
    canRecord: false,
    title: `Phase 9 runner review recording is held: ${snapshot.nextAction}`
  };
}

function formatProofFreshnessWindow(valueMs: number): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = valueMs / dayMs;

  if (Number.isInteger(days)) {
    return `${days}d`;
  }

  return `${Math.round(valueMs / (60 * 60 * 1000))}h`;
}

function formatPhase3HandoffAge(valueMs: number | undefined): string {
  if (valueMs === undefined) {
    return "Unchecked";
  }

  if (valueMs < 0) {
    return `Future ${Math.abs(valueMs)}ms`;
  }

  return `${valueMs}ms`;
}

function codexNotice(decision: CodexTransportDecision): string {
  if (decision.state === "live") {
    return "Codex live transport enabled";
  }

  if (decision.preferredTransport === "app-server-stdio") {
    return "Codex stdio transport ready";
  }

  if (decision.preferredTransport === "exec-json") {
    return "Codex one-shot fallback available";
  }

  if (decision.canDetectRuntime) {
    return "Codex detected, transport pending";
  }

  return "Local preview mode";
}

function transportStatusLabel(state: CodexTransportState): string {
  switch (state) {
    case "live":
      return "Live";
    case "ready":
      return "Ready";
    case "preview":
      return "Preview";
    case "blocked":
      return "Blocked";
    case "unavailable":
      return "Unavailable";
  }
}

function formatCatalogState(state: PlatformCatalogState): string {
  return state.replace("-", " ");
}

function formatCatalogAvailability(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatCommandCatalogSource(source: CommandCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function formatSkillCatalogSource(source: SkillCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function formatPluginCatalogSource(source: PluginCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function formatMcpCatalogSource(source: McpCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function formatAutomationCatalogSource(source: AutomationCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function formatPersonalizationCatalogSource(source: PersonalizationCatalogRefreshSource): string {
  switch (source) {
    case "provider-live":
      return "Provider live";
    case "provider-preview":
      return "Provider preview";
    case "default-fallback":
      return "Default fallback";
    case "empty-refresh":
      return "Empty refresh";
    case "unavailable":
      return "Unavailable";
  }
}

function buildPluginCatalogRows(catalog: readonly PluginCatalogEntry[]): PlatformCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    state: entry.state,
    meta: ["plugin", entry.id]
  }));
}

function buildSkillCatalogRows(catalog: readonly SkillCatalogEntry[]): PlatformCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail ?? "No provider detail is available for this skill yet.",
    state: entry.state,
    meta: [entry.source, entry.trigger, entry.invocationLabel]
  }));
}

function buildMcpCatalogRows(catalog: readonly McpCatalogEntry[]): PlatformCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail ?? "No server health signal is available yet.",
    state: entry.state,
    meta: [entry.transport, entry.toolPolicy]
  }));
}

function buildAutomationCatalogRows(catalog: readonly AutomationCatalogEntry[]): PlatformCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail ?? "No automation detail is available yet.",
    state: entry.state,
    meta: [entry.lifecycle, entry.trigger, entry.approvalPosture]
  }));
}

function buildPersonalizationCatalogRows(
  catalog: readonly PersonalizationCatalogEntry[]
): PlatformCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail ?? "No personalization detail is available yet.",
    state: entry.state,
    meta: [entry.layer, entry.source, entry.privacyPosture]
  }));
}

function getPlatformCatalogView(
  dialog: AppDialog,
  automationCatalogSnapshot: AutomationCatalogSnapshot,
  mcpCatalogSnapshot: McpCatalogSnapshot,
  personalizationCatalogSnapshot: PersonalizationCatalogSnapshot,
  pluginCatalogSnapshot: PluginCatalogSnapshot,
  skillCatalogSnapshot: SkillCatalogSnapshot
): PlatformCatalogView | undefined {
  if (dialog === "plugins") {
    return {
      title: "Plugins",
      eyebrow: "Platform catalog",
      lead: "Plugin entries show setup posture and safe provider refresh state before runtime-backed plugin actions are enabled.",
      rows: buildPluginCatalogRows(pluginCatalogSnapshot.catalog),
      summary: pluginCatalogSnapshot.summary,
      sourceLabel: formatPluginCatalogSource(pluginCatalogSnapshot.source)
    };
  }

  if (dialog === "skills") {
    return {
      title: "Skills",
      eyebrow: "Platform catalog",
      lead: "Skill entries show source, trigger, invocation posture, and safe provider refresh state before runtime-backed execution is enabled.",
      rows: buildSkillCatalogRows(skillCatalogSnapshot.catalog),
      summary: skillCatalogSnapshot.summary,
      sourceLabel: formatSkillCatalogSource(skillCatalogSnapshot.source)
    };
  }

  if (dialog === "mcp") {
    return {
      title: "MCP Servers",
      eyebrow: "Platform catalog",
      lead: "MCP entries show transport, tool policy posture, and safe provider refresh state without starting or mutating any server.",
      rows: buildMcpCatalogRows(mcpCatalogSnapshot.catalog),
      summary: mcpCatalogSnapshot.summary,
      sourceLabel: formatMcpCatalogSource(mcpCatalogSnapshot.source)
    };
  }

  if (dialog === "automations") {
    return {
      title: "Automations",
      eyebrow: "Platform catalog",
      lead: "Automation entries show lifecycle, trigger, approval posture, and safe provider refresh state. Nothing is scheduled or run from this catalog.",
      rows: buildAutomationCatalogRows(automationCatalogSnapshot.catalog),
      summary: automationCatalogSnapshot.summary,
      sourceLabel: formatAutomationCatalogSource(automationCatalogSnapshot.source)
    };
  }

  if (dialog === "personalization") {
    return {
      title: "Personalization",
      eyebrow: "Platform catalog",
      lead: "Personalization entries describe instruction and configuration layers with safe provider refresh state, without exposing private paths or raw profile data.",
      rows: buildPersonalizationCatalogRows(personalizationCatalogSnapshot.catalog),
      summary: personalizationCatalogSnapshot.summary,
      sourceLabel: formatPersonalizationCatalogSource(personalizationCatalogSnapshot.source)
    };
  }

  return undefined;
}

function fallbackMigrationSourcePreview(sourceId: MigrationSourceId): MigrationSourcePreviewPayload {
  const source = defaultMigrationSources.find((item) => item.id === sourceId) ?? defaultMigrationSources[0];
  return {
    sourceId: source.id,
    sourceLabel: source.label,
    detected: false,
    safeLocationLabel: "Browser preview; desktop metadata scan is unavailable",
    categories: [
      {
        id: "source",
        label: "Source metadata",
        status: "review-required",
        count: 0,
        reason: "Open the desktop app to scan local source metadata."
      },
      {
        id: "secrets",
        label: "Auth and secrets",
        status: "excluded",
        count: 0,
        reason: "Credentials, tokens, cookies, and raw transcript bodies are never imported."
      }
    ],
    counts: {
      accepted: 0,
      reviewRequired: 1,
      unsupported: 0,
      excluded: 1
    },
    excludedSecretsSummary: [
      "Authentication token stores are excluded.",
      "Cookies and browser profile state are excluded.",
      "Raw transcript data is excluded."
    ],
    safetyNote:
      "Browser preview mode shows migration policy only. Desktop mode can scan metadata without copying secrets or mutating the source."
  };
}

function formatMigrationState(state: MigrationCategoryState): string {
  return state.replace("-", " ");
}

type LivePanelChatStatus =
  | "preview"
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "interrupted"
  | "failed";

interface CodexPanelSessionStartPayload {
  source: string;
  panelId: string;
  sessionId: string;
  threadId: string;
  started: boolean;
  detail: string;
}

interface CodexPanelInterruptResultPayload {
  source: string;
  panelId: string | null;
  sessionId: string | null;
  threadId: string | null;
  turnId: string | null;
  interrupted: boolean;
  detail: string;
}

interface CodexPanelSteerResultPayload {
  source: string;
  panelId: string | null;
  sessionId: string | null;
  threadId: string | null;
  turnId: string | null;
  steered: boolean;
  detail: string;
}

interface MigrationSourceCategoryPreviewPayload {
  id: string;
  label: string;
  status: MigrationCategoryState;
  count: number;
  reason: string;
}

interface MigrationSourcePreviewPayload {
  sourceId: string;
  sourceLabel: string;
  detected: boolean;
  safeLocationLabel: string;
  categories: MigrationSourceCategoryPreviewPayload[];
  counts: MigrationPreviewCounts;
  excludedSecretsSummary: string[];
  safetyNote: string;
}

function hasDesktopRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function hasLocalDevArtifactAccess(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  return (
    import.meta.env.DEV &&
    window.location.protocol === "http:" &&
    (hostname === "127.0.0.1" || hostname === "localhost")
  );
}

function hasPhase3RecordedArtifactLoadAccess(): boolean {
  return hasDesktopRuntime() || hasLocalDevArtifactAccess();
}

const PHASE3_PROOF_EVALUATION_REFRESH_MS = 60 * 1000;

async function invokeDesktopCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

async function readPhase3RecordedArtifact(
  artifactName:
    | "phase3-command-validation-record.json"
    | "phase3-smoke-proof-bundle.json"
    | "phase3-panel-evidence-record.json",
  desktopCommand: string
): Promise<string> {
  if (hasDesktopRuntime()) {
    return invokeDesktopCommand<string>(desktopCommand);
  }

  if (!hasLocalDevArtifactAccess()) {
    throw new Error("phase3_recorded_artifact_load_unavailable");
  }

  const response = await fetch(`/local_private/${artifactName}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`phase3_recorded_artifact_fetch_failed:${artifactName}:${response.status}`);
  }

  return response.text();
}

async function readPhase4RecordedArtifact(
  artifactName: "phase4-provider-review-artifact.json",
  desktopCommand: string
): Promise<string> {
  if (hasDesktopRuntime()) {
    return invokeDesktopCommand<string>(desktopCommand);
  }

  if (!hasPhase3RecordedArtifactLoadAccess()) {
    throw new Error("phase4_recorded_artifact_load_unavailable");
  }

  const response = await fetch(`/local_private/${artifactName}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`phase4_recorded_artifact_fetch_failed:${artifactName}:${response.status}`);
  }

  return response.text();
}

const adaptiveProjectTemplateOptions: Array<{
  id: AdaptiveCockpitProjectStackRequestedTemplateId;
  label: string;
  description: string;
}> = [
  {
    id: "auto-stack",
    label: "Auto",
    description: "Use the best project stack, then monitor fallbacks."
  },
  {
    id: "project-focus",
    label: "Focus",
    description: "Drop one project panel plus one monitor fallback."
  },
  {
    id: "project-monitor",
    label: "Monitor",
    description: "Fill the Arena with project panels and monitor fallbacks."
  },
  {
    id: "project-orchestrator",
    label: "Orchestrator",
    description: "Prioritize orchestrator, implementer, validator, and integration panels."
  }
];

export function App() {
  const validProjectIds = useMemo(() => projects.map((item) => item.id), []);
  const defaultPlanningDrafts = useMemo(
    () => planningDrafts.map((draft) => normalizePlanningDraft(draft)),
    []
  );
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() =>
    loadWorkspacePreferences(validProjectIds)
  );
  const [adaptiveCockpitLayout, setAdaptiveCockpitLayout] = useState<AdaptiveCockpitLayout>(() =>
    loadAdaptiveCockpitLayout()
  );
  const [drafts, setDrafts] = useState<PlanningDraft[]>(() => loadPlanningDrafts(defaultPlanningDrafts));
  const [projectManagementTasks, setProjectManagementTasks] = useState<ProjectManagementTask[]>(() =>
    loadProjectManagementTasks()
  );
  const [projectManagementChat, setProjectManagementChat] = useState<ProjectManagementChatMessage[]>(() =>
    loadProjectManagementChat()
  );
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const [mockRuns, setMockRuns] = useState<MockOrchestratorRun[]>(() => loadRunHistory());
  const [dispatchReviewRecords, setDispatchReviewRecords] = useState<DispatchReviewRecord[]>(() =>
    loadDispatchReviewRecords()
  );
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [focusedPanelId, setFocusedPanelId] = useState<string>();
  const [slashCommandExecutionEvidenceByPanel, setSlashCommandExecutionEvidenceByPanel] =
    useState<Record<string, SlashCommandExecutionEvidence>>(() => loadPhase3SlashEvidenceByPanel());
  const [sessionControlReadinessEvidenceByPanel, setSessionControlReadinessEvidenceByPanel] =
    useState<Record<string, SessionControlReadinessEvidence>>(() => loadPhase3SessionControlEvidenceByPanel());
  const [adaptiveDraggingPanelId, setAdaptiveDraggingPanelId] = useState<string>();
  const [adaptiveDraggingProjectId, setAdaptiveDraggingProjectId] = useState<string>();
  const [adaptiveDropPreview, setAdaptiveDropPreview] = useState<AdaptiveCockpitDropPreview | null>(null);
  const [activeAppMenu, setActiveAppMenu] = useState<AppMenuId>();
  const [appDialog, setAppDialog] = useState<AppDialog>();
  const [codexConnectionRequested, setCodexConnectionRequested] = useState(false);
  const [appNotice, setAppNotice] = useState("Local preview mode");
  const [codexTransportProbe, setCodexTransportProbe] = useState<CodexTransportProbe>(() =>
    getFallbackCodexTransportProbe()
  );
  const [phasePrioritySmokeProofInitialBundle] = useState(() =>
    loadPhasePrioritySmokeProofBundle()
  );
  const [codexLiveSmokeProof, setCodexLiveSmokeProof] = useState<CodexLiveSmokeProof>(() =>
    phasePrioritySmokeProofInitialBundle.liveSmoke
  );
  const [phase3SmokeProofInitialLoad] = useState(() =>
    loadPhase3SmokeProofBundleWithStorageProof()
  );
  const [phase3ProofEvaluationTime, setPhase3ProofEvaluationTime] = useState(() =>
    new Date().toISOString()
  );
  const [phase11EvidenceEvaluationTime, setPhase11EvidenceEvaluationTime] = useState(() =>
    new Date().toISOString()
  );
  const [phase11EvidenceRecordInputs, setPhase11EvidenceRecordInputs] =
    useState<Phase11EvidenceRecordInputMap>(() => loadPhase11EvidenceRecordInputs());
  const [phase3OwnerHandoffRecord, setPhase3OwnerHandoffRecord] =
    useState<Phase3OwnerHandoffRecord | undefined>(() => loadPhase3OwnerHandoffRecord());
  const [phase3CommandValidationRecord, setPhase3CommandValidationRecord] =
    useState<Phase3CommandValidationRecord | undefined>(() => loadPhase3CommandValidationRecord());
  const [importedPhase3ProofExportVerification, setImportedPhase3ProofExportVerification] =
    useState<Phase3ProofExportVerification | undefined>();
  const [codexActiveTurnControlSmokeProof, setCodexActiveTurnControlSmokeProof] =
    useState<CodexActiveTurnControlSmokeProof>(() =>
      phase3SmokeProofInitialLoad.bundle.activeTurnInterruptSmoke
    );
  const [codexActiveTurnSteerSmokeProof, setCodexActiveTurnSteerSmokeProof] =
    useState<CodexActiveTurnSteerSmokeProof>(() =>
      phase3SmokeProofInitialLoad.bundle.activeTurnSteerSmoke
    );
  const [codexLiveControlSmokeProof, setCodexLiveControlSmokeProof] =
    useState<CodexLiveControlSmokeProof>(() => phase3SmokeProofInitialLoad.bundle.liveControlSmoke);
  const [phase3PersistedDesktopProofs, setPhase3PersistedDesktopProofs] =
    useState(() => phase3SmokeProofInitialLoad.persistedDesktopProofs);
  const [phase3SmokeProofStorageReviewReasons, setPhase3SmokeProofStorageReviewReasons] =
    useState(() => phase3SmokeProofInitialLoad.storageReviewReasons);
  const [codexTwoPanelSmokeProof, setCodexTwoPanelSmokeProof] = useState<CodexTwoPanelSmokeProof>(() =>
    phasePrioritySmokeProofInitialBundle.twoPanelSmoke
  );
  const [catalogRefreshProviderSmokeProof, setCatalogRefreshProviderSmokeProof] =
    useState<CatalogRefreshProviderSmokeResult>(() => loadPhase4CatalogSmokeProof());
  const [phase4CatalogProofEvaluationTime, setPhase4CatalogProofEvaluationTime] =
    useState(() => new Date().toISOString());
  const [phase4ProviderApprovalRecord, setPhase4ProviderApprovalRecord] =
    useState<Phase4ProviderApprovalRecord | undefined>(() =>
      loadPhase4ProviderApprovalRecord()
    );
  const [phase4ProviderAuditRecord, setPhase4ProviderAuditRecord] =
    useState<Phase4ProviderAuditRecord | undefined>(() => loadPhase4ProviderAuditRecord());
  const [phase4ProviderRollbackRecord, setPhase4ProviderRollbackRecord] =
    useState<Phase4ProviderRollbackRecord | undefined>(() =>
      loadPhase4ProviderRollbackRecord()
    );
  const [phase4ProviderPermissionRecord, setPhase4ProviderPermissionRecord] =
    useState<Phase4ProviderPermissionRecord | undefined>(() =>
      loadPhase4ProviderPermissionRecord()
    );
  const [
    importedPhase4ProviderReviewArtifactVerification,
    setImportedPhase4ProviderReviewArtifactVerification
  ] = useState<Phase4ProviderReviewArtifactVerification | undefined>();
  const [commandCatalogSnapshot, setCommandCatalogSnapshot] = useState<CommandCatalogSnapshot>(() =>
    buildCommandCatalogSnapshot(panelSlashCommands, "default-fallback", panelSlashCommands)
  );
  const [automationCatalogSnapshot, setAutomationCatalogSnapshot] = useState<AutomationCatalogSnapshot>(() =>
    buildAutomationCatalogSnapshot(defaultAutomationCatalog, "default-fallback", defaultAutomationCatalog)
  );
  const [personalizationCatalogSnapshot, setPersonalizationCatalogSnapshot] = useState<PersonalizationCatalogSnapshot>(() =>
    buildPersonalizationCatalogSnapshot(
      defaultPersonalizationCatalog,
      "default-fallback",
      defaultPersonalizationCatalog
    )
  );
  const [mcpCatalogSnapshot, setMcpCatalogSnapshot] = useState<McpCatalogSnapshot>(() =>
    buildMcpCatalogSnapshot(defaultMcpCatalog, "default-fallback", defaultMcpCatalog)
  );
  const [pluginCatalogSnapshot, setPluginCatalogSnapshot] = useState<PluginCatalogSnapshot>(() =>
    buildPluginCatalogSnapshot(defaultPluginCatalog, "default-fallback", defaultPluginCatalog)
  );
  const [skillCatalogSnapshot, setSkillCatalogSnapshot] = useState<SkillCatalogSnapshot>(() =>
    buildSkillCatalogSnapshot(defaultSkillCatalog, "default-fallback", defaultSkillCatalog)
  );
  const [codexTransportLoading, setCodexTransportLoading] = useState(false);
  const [codexLiveSmokeLoading, setCodexLiveSmokeLoading] = useState(false);
  const [codexActiveTurnControlSmokeLoading, setCodexActiveTurnControlSmokeLoading] = useState(false);
  const [codexActiveTurnSteerSmokeLoading, setCodexActiveTurnSteerSmokeLoading] = useState(false);
  const [codexLiveControlSmokeLoading, setCodexLiveControlSmokeLoading] = useState(false);
  const [codexTwoPanelSmokeLoading, setCodexTwoPanelSmokeLoading] = useState(false);
  const [catalogRefreshProviderSmokeLoading, setCatalogRefreshProviderSmokeLoading] = useState(false);
  const [automationCatalogLoading, setAutomationCatalogLoading] = useState(false);
  const [personalizationCatalogLoading, setPersonalizationCatalogLoading] = useState(false);
  const [mcpCatalogLoading, setMcpCatalogLoading] = useState(false);
  const [pluginCatalogLoading, setPluginCatalogLoading] = useState(false);
  const [skillCatalogLoading, setSkillCatalogLoading] = useState(false);
  const [panelSessionState, setPanelSessionState] = useState<CodexPanelSessionState>(() =>
    loadPanelSessionState()
  );
  const [migrationSourceId, setMigrationSourceId] = useState<MigrationSourceId>(defaultMigrationSource);
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreview>(() =>
    buildDefaultMigrationPreview(defaultMigrationSource)
  );
  const [migrationSourcePreview, setMigrationSourcePreview] = useState<MigrationSourcePreviewPayload>(() =>
    fallbackMigrationSourcePreview(defaultMigrationSource)
  );
  const [migrationPreviewLoading, setMigrationPreviewLoading] = useState(false);
  const [migrationProfileDraftHistory, setMigrationProfileDraftHistory] = useState<MigrationProfileDraftHistoryRecord[]>(() =>
    loadMigrationProfileDraftHistory([], MIGRATION_DRAFT_HISTORY_LIMIT)
  );
  const [migrationOwnerApprovalRecord, setMigrationOwnerApprovalRecord] =
    useState<MigrationOwnerApprovalRecord | undefined>(() =>
      loadMigrationOwnerApprovalRecord()
    );
  const [migrationProfileDraftActionNotice, setMigrationProfileDraftActionNotice] = useState("");
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const refreshProofEvaluationTime = () => {
      const now = new Date().toISOString();
      setPhase3ProofEvaluationTime(now);
      setPhase11EvidenceEvaluationTime(now);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshProofEvaluationTime();
      }
    };
    const intervalId = window.setInterval(
      refreshProofEvaluationTime,
      PHASE3_PROOF_EVALUATION_REFRESH_MS
    );

    window.addEventListener("focus", refreshProofEvaluationTime);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshProofEvaluationTime);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
  const { selectedProjectId, mode, layoutId, view, adaptiveProjectTemplateId } = preferences;
  const codexTransportDecision = useMemo(
    () => decideCodexTransport(codexTransportProbe, codexLiveSmokeProof),
    [codexLiveSmokeProof, codexTransportProbe]
  );
  const catalogRefreshOwnerValidation = useMemo(
    () =>
      buildCatalogRefreshOwnerValidation({
        commandPayload: {
          source: commandCatalogSnapshot.source,
          entries: commandCatalogSnapshot.catalog
        },
        skillPayload: {
          source: skillCatalogSnapshot.source,
          entries: skillCatalogSnapshot.catalog
        },
        pluginPayload: {
          source: pluginCatalogSnapshot.source,
          entries: pluginCatalogSnapshot.catalog
        },
        mcpPayload: {
          source: mcpCatalogSnapshot.source,
          entries: mcpCatalogSnapshot.catalog
        },
        automationPayload: {
          source: automationCatalogSnapshot.source,
          entries: automationCatalogSnapshot.catalog
        },
        personalizationPayload: {
          source: personalizationCatalogSnapshot.source,
          entries: personalizationCatalogSnapshot.catalog
        }
      }),
    [
      automationCatalogSnapshot,
      commandCatalogSnapshot,
      mcpCatalogSnapshot,
      personalizationCatalogSnapshot,
      pluginCatalogSnapshot,
      skillCatalogSnapshot
    ]
  );
  const providerIntegrationReadiness = useMemo(
    () => buildProviderIntegrationReadiness(catalogRefreshOwnerValidation),
    [catalogRefreshOwnerValidation]
  );
  const providerExecutionGate = useMemo(
    () => buildProviderExecutionGate(providerIntegrationReadiness),
    [providerIntegrationReadiness]
  );
  const phase4ProviderCatalogDepth = useMemo(
    () => buildPhase4ProviderCatalogDepth(providerIntegrationReadiness),
    [providerIntegrationReadiness]
  );
  const phase4CurrentCatalogFingerprint = useMemo(
    () =>
      buildCatalogRefreshProviderFingerprint({
        commandCatalogSnapshot: {
          source: commandCatalogSnapshot.source,
          entries: commandCatalogSnapshot.catalog
        },
        skillCatalogSnapshot: {
          source: skillCatalogSnapshot.source,
          entries: skillCatalogSnapshot.catalog
        },
        pluginCatalogSnapshot: {
          source: pluginCatalogSnapshot.source,
          entries: pluginCatalogSnapshot.catalog
        },
        mcpCatalogSnapshot: {
          source: mcpCatalogSnapshot.source,
          entries: mcpCatalogSnapshot.catalog
        },
        automationCatalogSnapshot: {
          source: automationCatalogSnapshot.source,
          entries: automationCatalogSnapshot.catalog
        },
        personalizationCatalogSnapshot: {
          source: personalizationCatalogSnapshot.source,
          entries: personalizationCatalogSnapshot.catalog
        }
      }),
    [
      automationCatalogSnapshot,
      commandCatalogSnapshot,
      mcpCatalogSnapshot,
      personalizationCatalogSnapshot,
      pluginCatalogSnapshot,
      skillCatalogSnapshot
    ]
  );
  const phase4RefreshSafetyDepth = useMemo(
    () =>
      buildPhase4RefreshSafetyDepth(catalogRefreshProviderSmokeProof, {
        evaluatedAt: phase4CatalogProofEvaluationTime,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint
      }),
    [
      catalogRefreshProviderSmokeProof,
      phase4CatalogProofEvaluationTime,
      phase4CurrentCatalogFingerprint
    ]
  );
  const phase4ProviderApprovalValidation = useMemo(
    () =>
      derivePhase4ProviderApprovalRecordValidation({
        record: phase4ProviderApprovalRecord,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint,
        refreshSafety: phase4RefreshSafetyDepth,
        options: { evaluatedAt: phase4CatalogProofEvaluationTime }
      }),
    [
      phase4CatalogProofEvaluationTime,
      phase4CurrentCatalogFingerprint,
      phase4ProviderApprovalRecord,
      phase4RefreshSafetyDepth
    ]
  );
  const phase4ProviderApprovalSurfaceDepth = useMemo(
    () =>
      buildPhase4ProviderSurfaceDepth(
        providerIntegrationReadiness,
        phase4ProviderApprovalValidation
      ),
    [phase4ProviderApprovalValidation, providerIntegrationReadiness]
  );
  const phase4ProviderAuditEvidenceFingerprint = useMemo(
    () => buildPhase4ProviderAuditEvidenceFingerprint(phase4ProviderApprovalSurfaceDepth),
    [phase4ProviderApprovalSurfaceDepth]
  );
  const phase4ProviderAuditValidation = useMemo(
    () =>
      derivePhase4ProviderAuditRecordValidation({
        record: phase4ProviderAuditRecord,
        approvalRecord: phase4ProviderApprovalRecord,
        approvalValidation: phase4ProviderApprovalValidation,
        expectedAuditEvidenceFingerprint: phase4ProviderAuditEvidenceFingerprint,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint,
        options: { evaluatedAt: phase4CatalogProofEvaluationTime }
      }),
    [
      phase4CatalogProofEvaluationTime,
      phase4CurrentCatalogFingerprint,
      phase4ProviderApprovalRecord,
      phase4ProviderApprovalValidation,
      phase4ProviderAuditEvidenceFingerprint,
      phase4ProviderAuditRecord
    ]
  );
  const phase4ProviderAuditSurfaceDepth = useMemo(
    () =>
      buildPhase4ProviderSurfaceDepth(
        providerIntegrationReadiness,
        phase4ProviderApprovalValidation,
        phase4ProviderAuditValidation
      ),
    [
      phase4ProviderApprovalValidation,
      phase4ProviderAuditValidation,
      providerIntegrationReadiness
    ]
  );
  const phase4ProviderRollbackEvidenceFingerprint = useMemo(
    () => buildPhase4ProviderRollbackEvidenceFingerprint(phase4ProviderAuditSurfaceDepth),
    [phase4ProviderAuditSurfaceDepth]
  );
  const phase4ProviderRollbackValidation = useMemo(
    () =>
      derivePhase4ProviderRollbackRecordValidation({
        record: phase4ProviderRollbackRecord,
        approvalRecord: phase4ProviderApprovalRecord,
        auditRecord: phase4ProviderAuditRecord,
        auditValidation: phase4ProviderAuditValidation,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint,
        expectedSurfaceDepthEvidenceFingerprint: phase4ProviderRollbackEvidenceFingerprint,
        options: { evaluatedAt: phase4CatalogProofEvaluationTime }
      }),
    [
      phase4CatalogProofEvaluationTime,
      phase4CurrentCatalogFingerprint,
      phase4ProviderApprovalRecord,
      phase4ProviderAuditRecord,
      phase4ProviderAuditValidation,
      phase4ProviderRollbackEvidenceFingerprint,
      phase4ProviderRollbackRecord
    ]
  );
  const phase4ProviderRollbackSurfaceDepth = useMemo(
    () =>
      buildPhase4ProviderSurfaceDepth(
        providerIntegrationReadiness,
        phase4ProviderApprovalValidation,
        phase4ProviderAuditValidation,
        phase4ProviderRollbackValidation
      ),
    [
      phase4ProviderApprovalValidation,
      phase4ProviderAuditValidation,
      phase4ProviderRollbackValidation,
      providerIntegrationReadiness
    ]
  );
  const phase4ProviderPermissionEvidenceFingerprint = useMemo(
    () =>
      buildPhase4ProviderPermissionEvidenceFingerprint(
        phase4ProviderRollbackSurfaceDepth
      ),
    [phase4ProviderRollbackSurfaceDepth]
  );
  const phase4ProviderPermissionValidation = useMemo(
    () =>
      derivePhase4ProviderPermissionRecordValidation({
        record: phase4ProviderPermissionRecord,
        approvalRecord: phase4ProviderApprovalRecord,
        auditRecord: phase4ProviderAuditRecord,
        rollbackRecord: phase4ProviderRollbackRecord,
        rollbackValidation: phase4ProviderRollbackValidation,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint,
        expectedSurfaceDepthEvidenceFingerprint:
          phase4ProviderRollbackEvidenceFingerprint,
        expectedPermissionEvidenceFingerprint:
          phase4ProviderPermissionEvidenceFingerprint,
        options: { evaluatedAt: phase4CatalogProofEvaluationTime }
      }),
    [
      phase4CatalogProofEvaluationTime,
      phase4CurrentCatalogFingerprint,
      phase4ProviderApprovalRecord,
      phase4ProviderAuditRecord,
      phase4ProviderPermissionEvidenceFingerprint,
      phase4ProviderPermissionRecord,
      phase4ProviderRollbackEvidenceFingerprint,
      phase4ProviderRollbackRecord,
      phase4ProviderRollbackValidation
    ]
  );
  const phase4ProviderSurfaceDepth = useMemo(
    () =>
      buildPhase4ProviderSurfaceDepth(
        providerIntegrationReadiness,
        phase4ProviderApprovalValidation,
        phase4ProviderAuditValidation,
        phase4ProviderRollbackValidation,
        phase4ProviderPermissionValidation
      ),
    [
      phase4ProviderApprovalValidation,
      phase4ProviderAuditValidation,
      phase4ProviderPermissionValidation,
      phase4ProviderRollbackValidation,
      providerIntegrationReadiness
    ]
  );
  const phase4ProviderTraceability = useMemo(
    () =>
      buildPhase4ProviderTraceabilitySummary({
        catalogDepth: phase4ProviderCatalogDepth,
        refreshSafety: phase4RefreshSafetyDepth,
        surfaceDepth: phase4ProviderSurfaceDepth
      }),
    [phase4ProviderCatalogDepth, phase4ProviderSurfaceDepth, phase4RefreshSafetyDepth]
  );
  const phase4ProviderBlockerPriority = useMemo(
    () =>
      buildPhase4ProviderBlockerPriority({
        catalogDepth: phase4ProviderCatalogDepth,
        refreshSafety: phase4RefreshSafetyDepth,
        surfaceDepth: phase4ProviderSurfaceDepth,
        traceability: phase4ProviderTraceability
      }),
    [
      phase4ProviderCatalogDepth,
      phase4ProviderSurfaceDepth,
      phase4ProviderTraceability,
      phase4RefreshSafetyDepth
    ]
  );
  const phase4ProviderCompletionStatus = useMemo(
    () =>
      buildPhase4ProviderCompletionStatus({
        catalogDepth: phase4ProviderCatalogDepth,
        refreshSafety: phase4RefreshSafetyDepth,
        surfaceDepth: phase4ProviderSurfaceDepth,
        traceability: phase4ProviderTraceability,
        blockerPriority: phase4ProviderBlockerPriority
      }),
    [
      phase4ProviderBlockerPriority,
      phase4ProviderCatalogDepth,
      phase4ProviderSurfaceDepth,
      phase4ProviderTraceability,
      phase4RefreshSafetyDepth
    ]
  );
  const phase4ProviderReviewArtifactVerification = useMemo(() => {
    const artifact = buildPhase4ProviderReviewArtifact({
      evaluatedAt: phase4CatalogProofEvaluationTime,
      exportedAt: phase4CatalogProofEvaluationTime,
      currentCatalogFingerprint: phase4CurrentCatalogFingerprint,
      catalogDepth: phase4ProviderCatalogDepth,
      refreshSafety: phase4RefreshSafetyDepth,
      surfaceDepth: phase4ProviderSurfaceDepth,
      traceability: phase4ProviderTraceability,
      blockerPriority: phase4ProviderBlockerPriority,
      approvalRecord: phase4ProviderApprovalRecord,
      approvalValidation: phase4ProviderApprovalValidation,
      auditRecord: phase4ProviderAuditRecord,
      auditValidation: phase4ProviderAuditValidation,
      rollbackRecord: phase4ProviderRollbackRecord,
      rollbackValidation: phase4ProviderRollbackValidation,
      permissionRecord: phase4ProviderPermissionRecord,
      permissionValidation: phase4ProviderPermissionValidation
    });

    return verifyPhase4ProviderReviewArtifact(artifact, {
      verifiedAt: phase4CatalogProofEvaluationTime,
      expectedCatalogFingerprint: phase4CurrentCatalogFingerprint
    });
  }, [
    phase4CatalogProofEvaluationTime,
    phase4CurrentCatalogFingerprint,
    phase4ProviderApprovalRecord,
    phase4ProviderApprovalValidation,
    phase4ProviderAuditRecord,
    phase4ProviderAuditValidation,
    phase4ProviderBlockerPriority,
    phase4ProviderCatalogDepth,
    phase4ProviderPermissionRecord,
    phase4ProviderPermissionValidation,
    phase4ProviderRollbackRecord,
    phase4ProviderRollbackValidation,
    phase4ProviderSurfaceDepth,
    phase4ProviderTraceability,
    phase4RefreshSafetyDepth
  ]);
  const recordPhase4ProviderApproval = useCallback(() => {
    if (phase4RefreshSafetyDepth.blockedCount > 0 || phase4RefreshSafetyDepth.previewCount > 0) {
      setAppNotice(phase4RefreshSafetyDepth.nextAction);
      return;
    }

    const createdAt = new Date().toISOString();
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: phase4CurrentCatalogFingerprint,
      createdAt
    });

    setPhase4CatalogProofEvaluationTime(createdAt);
    savePhase4ProviderApprovalRecord(record);
    setPhase4ProviderApprovalRecord(record);
    setAppNotice("Phase 4 provider approval recorded locally");
  }, [phase4CurrentCatalogFingerprint, phase4RefreshSafetyDepth]);
  const clearPhase4ProviderApproval = useCallback(() => {
    clearPhase4ProviderApprovalRecord();
    clearPhase4ProviderAuditRecord();
    clearPhase4ProviderRollbackRecord();
    clearPhase4ProviderPermissionRecord();
    setPhase4ProviderApprovalRecord(undefined);
    setPhase4ProviderAuditRecord(undefined);
    setPhase4ProviderRollbackRecord(undefined);
    setPhase4ProviderPermissionRecord(undefined);
    setAppNotice("Phase 4 provider approval record cleared");
  }, []);
  const recordPhase4ProviderAudit = useCallback(() => {
    if (phase4ProviderApprovalValidation.state !== "ready" || !phase4ProviderApprovalRecord) {
      setAppNotice(phase4ProviderApprovalValidation.nextAction);
      return;
    }

    const createdAt = new Date().toISOString();
    const record = createPhase4ProviderAuditRecord({
      approvalRecord: phase4ProviderApprovalRecord,
      auditEvidenceFingerprint: phase4ProviderAuditEvidenceFingerprint,
      catalogFingerprint: phase4CurrentCatalogFingerprint,
      createdAt
    });

    setPhase4CatalogProofEvaluationTime(createdAt);
    savePhase4ProviderAuditRecord(record);
    setPhase4ProviderAuditRecord(record);
    setAppNotice("Phase 4 provider audit review recorded locally");
  }, [
    phase4CurrentCatalogFingerprint,
    phase4ProviderApprovalRecord,
    phase4ProviderApprovalValidation,
    phase4ProviderAuditEvidenceFingerprint
  ]);
  const clearPhase4ProviderAudit = useCallback(() => {
    clearPhase4ProviderAuditRecord();
    clearPhase4ProviderRollbackRecord();
    clearPhase4ProviderPermissionRecord();
    setPhase4ProviderAuditRecord(undefined);
    setPhase4ProviderRollbackRecord(undefined);
    setPhase4ProviderPermissionRecord(undefined);
    setAppNotice("Phase 4 provider audit record cleared");
  }, []);
  const recordPhase4ProviderRollback = useCallback(() => {
    if (
      phase4ProviderAuditValidation.state !== "ready" ||
      !phase4ProviderAuditRecord ||
      !phase4ProviderApprovalRecord
    ) {
      setAppNotice(phase4ProviderAuditValidation.nextAction);
      return;
    }

    const createdAt = new Date().toISOString();
    const record = createPhase4ProviderRollbackRecord({
      approvalRecord: phase4ProviderApprovalRecord,
      auditRecord: phase4ProviderAuditRecord,
      catalogFingerprint: phase4CurrentCatalogFingerprint,
      createdAt,
      surfaceDepthEvidenceFingerprint: phase4ProviderRollbackEvidenceFingerprint
    });

    setPhase4CatalogProofEvaluationTime(createdAt);
    savePhase4ProviderRollbackRecord(record);
    setPhase4ProviderRollbackRecord(record);
    setAppNotice("Phase 4 provider rollback review recorded locally");
  }, [
    phase4CurrentCatalogFingerprint,
    phase4ProviderApprovalRecord,
    phase4ProviderAuditRecord,
    phase4ProviderAuditValidation,
    phase4ProviderRollbackEvidenceFingerprint
  ]);
  const clearPhase4ProviderRollback = useCallback(() => {
    clearPhase4ProviderRollbackRecord();
    clearPhase4ProviderPermissionRecord();
    setPhase4ProviderRollbackRecord(undefined);
    setPhase4ProviderPermissionRecord(undefined);
    setAppNotice("Phase 4 provider rollback record cleared");
  }, []);
  const recordPhase4ProviderPermission = useCallback(() => {
    if (
      phase4ProviderRollbackValidation.state !== "ready" ||
      !phase4ProviderRollbackRecord ||
      !phase4ProviderAuditRecord ||
      !phase4ProviderApprovalRecord
    ) {
      setAppNotice(phase4ProviderRollbackValidation.nextAction);
      return;
    }

    const createdAt = new Date().toISOString();
    const record = createPhase4ProviderPermissionRecord({
      approvalRecord: phase4ProviderApprovalRecord,
      auditRecord: phase4ProviderAuditRecord,
      rollbackRecord: phase4ProviderRollbackRecord,
      catalogFingerprint: phase4CurrentCatalogFingerprint,
      createdAt,
      surfaceDepthEvidenceFingerprint: phase4ProviderRollbackEvidenceFingerprint,
      permissionEvidenceFingerprint: phase4ProviderPermissionEvidenceFingerprint,
      providerSurfaceScopes: providerIntegrationReadiness.surfaces.map(
        (surface) => surface.surface
      )
    });

    setPhase4CatalogProofEvaluationTime(createdAt);
    savePhase4ProviderPermissionRecord(record);
    setPhase4ProviderPermissionRecord(record);
    setAppNotice("Phase 4 provider permission review recorded locally");
  }, [
    phase4CurrentCatalogFingerprint,
    phase4ProviderApprovalRecord,
    phase4ProviderAuditRecord,
    phase4ProviderPermissionEvidenceFingerprint,
    phase4ProviderRollbackEvidenceFingerprint,
    phase4ProviderRollbackRecord,
    phase4ProviderRollbackValidation,
    providerIntegrationReadiness.surfaces
  ]);
  const clearPhase4ProviderPermission = useCallback(() => {
    clearPhase4ProviderPermissionRecord();
    setPhase4ProviderPermissionRecord(undefined);
    setAppNotice("Phase 4 provider permission record cleared");
  }, []);
  const slashCommandExecutionEvidence = useMemo(() => {
    return selectPhase3SlashCommandEvidence(
      slashCommandExecutionEvidenceByPanel,
      focusedPanelId,
      buildSlashCommandExecutionEvidence({
        submittedMessage: "",
        liveTransportAvailable: false,
        commandCatalog: commandCatalogSnapshot.catalog
      })
    );
  }, [commandCatalogSnapshot.catalog, focusedPanelId, slashCommandExecutionEvidenceByPanel]);
  const slashCommandOwnerTestingState =
    slashCommandExecutionEvidence.state === "ready"
      ? "ready"
      : slashCommandExecutionEvidence.state === "blocked"
        ? "blocked"
        : "review";
  const sessionControlReadinessEvidence = useMemo(() => {
    return selectPhase3SessionControlEvidence(
      sessionControlReadinessEvidenceByPanel,
      focusedPanelId,
      buildSessionControlReadinessEvidence(undefined)
    );
  }, [focusedPanelId, sessionControlReadinessEvidenceByPanel]);
  const sessionControlOwnerTestingState: OwnerTestingReadinessState =
    sessionControlReadinessEvidence.state === "ready"
      ? "ready"
      : sessionControlReadinessEvidence.state === "blocked"
        ? "blocked"
        : sessionControlReadinessEvidence.state === "waiting"
          ? "waiting"
          : "review";
  const phase3SmokeProofReadiness = useMemo(
    () =>
      buildPhase3SmokeProofReadiness({
        liveControlSmoke: codexLiveControlSmokeProof,
        activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
        activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof,
        persistedDesktopProofs: phase3PersistedDesktopProofs,
        storageReviewReasons: phase3SmokeProofStorageReviewReasons,
        evaluatedAt: phase3ProofEvaluationTime
      }),
    [
      codexLiveControlSmokeProof,
      codexActiveTurnControlSmokeProof,
      codexActiveTurnSteerSmokeProof,
      phase3PersistedDesktopProofs,
      phase3SmokeProofStorageReviewReasons,
      phase3ProofEvaluationTime
    ]
  );
  const phase3ExitGateEvidence = useMemo(
    () =>
      buildPhase3ExitGateEvidence({
        slashEvidence: slashCommandExecutionEvidence,
        sessionControlEvidence: sessionControlReadinessEvidence,
        liveControlSmoke: codexLiveControlSmokeProof,
        activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
        activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof,
        persistedDesktopProofs: phase3PersistedDesktopProofs,
        storageReviewReasons: phase3SmokeProofStorageReviewReasons,
        evaluatedAt: phase3ProofEvaluationTime,
        currentPanelId: focusedPanelId
      }),
    [
      slashCommandExecutionEvidence,
      sessionControlReadinessEvidence,
      codexLiveControlSmokeProof,
      codexActiveTurnControlSmokeProof,
      codexActiveTurnSteerSmokeProof,
      phase3PersistedDesktopProofs,
      phase3SmokeProofStorageReviewReasons,
      phase3ProofEvaluationTime,
      focusedPanelId
    ]
  );
  const phase3OwnerTestingActions = useMemo(() => {
    const itemById = new Map(
      phase3ExitGateEvidence.items.map((item) => [item.id, item])
    );

    return buildPhase3OwnerTestingActions({
      canStartSession: codexTransportDecision.canStartSession,
      liveControlSmokeGate: itemById.get("phase3-exit-gate:live-control-smoke"),
      activeTurnInterruptSmokeGate: itemById.get("phase3-exit-gate:active-turn-interrupt-smoke"),
      activeTurnSteerSmokeGate: itemById.get("phase3-exit-gate:active-turn-steer-smoke"),
      loading: {
        liveControlSmoke: codexLiveControlSmokeLoading,
        activeTurnInterruptSmoke: codexActiveTurnControlSmokeLoading,
        activeTurnSteerSmoke: codexActiveTurnSteerSmokeLoading
      }
    });
  }, [
    phase3ExitGateEvidence,
    codexTransportDecision.canStartSession,
    codexLiveControlSmokeLoading,
    codexActiveTurnControlSmokeLoading,
    codexActiveTurnSteerSmokeLoading
  ]);
  const phase3ClearancePackage = useMemo(
    () =>
      buildPhase3ClearancePackage({
        exitGate: phase3ExitGateEvidence,
        actions: phase3OwnerTestingActions
      }),
    [phase3ExitGateEvidence, phase3OwnerTestingActions]
  );
  const phase3OwnerTestingDisplayActions = useMemo(
    () =>
      gatePhase3OwnerTestingActionsToPrimary({
        actions: phase3OwnerTestingActions,
        primaryActionId: phase3ClearancePackage.primaryActionId,
        holdDetail: phase3ClearancePackage.primaryActionId
          ? undefined
          : phase3ClearancePackage.nextAction
      }),
    [phase3ClearancePackage, phase3OwnerTestingActions]
  );
  const phase3ClearanceCommandPlan = useMemo(
    () =>
      buildPhase3ClearanceCommandPlan({
        clearancePackage: phase3ClearancePackage,
        actions: phase3OwnerTestingDisplayActions
      }),
    [phase3ClearancePackage, phase3OwnerTestingDisplayActions]
  );
  const phase3CommandValidationRecordValidation: Phase3CommandValidationRecordValidation = useMemo(
    () =>
      derivePhase3CommandValidationRecordValidation(
        phase3CommandValidationRecord,
        {
          evaluatedAt: phase3ProofEvaluationTime,
          expectedCommand: phase3ClearanceCommandPlan.command,
          currentSmokeProofBundle: {
            liveControlSmoke: codexLiveControlSmokeProof,
            activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
            activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof
          }
        }
      ),
    [
      codexActiveTurnControlSmokeProof,
      codexActiveTurnSteerSmokeProof,
      codexLiveControlSmokeProof,
      phase3ClearanceCommandPlan.command,
      phase3CommandValidationRecord,
      phase3ProofEvaluationTime
    ]
  );
  const phase3ClearanceBlockerPriority = useMemo(
    () =>
      buildPhase3ClearanceBlockerPriority({
        clearancePackage: phase3ClearancePackage,
        commandPlan: phase3ClearanceCommandPlan
      }),
    [phase3ClearanceCommandPlan, phase3ClearancePackage]
  );
  const phase3HandoffEvidenceFingerprint = useMemo(
    () =>
      buildPhase3HandoffEvidenceFingerprint({
        clearancePackage: phase3ClearancePackage,
        exitGate: phase3ExitGateEvidence,
        commandPlanId: phase3ClearanceCommandPlan.id
      }),
    [
      phase3ClearanceCommandPlan.id,
      phase3ClearancePackage,
      phase3ExitGateEvidence
    ]
  );
  const phase3HandoffRecordValidation: Phase3HandoffRecordValidation = useMemo(
    () =>
      derivePhase3HandoffRecordValidation(
        phase3OwnerHandoffRecord,
        phase3ClearancePackage,
        phase3HandoffEvidenceFingerprint,
        { evaluatedAt: phase3ProofEvaluationTime }
      ),
    [
      phase3ClearancePackage,
      phase3HandoffEvidenceFingerprint,
      phase3OwnerHandoffRecord,
      phase3ProofEvaluationTime
    ]
  );
  const phase3ProofExportArtifact = useMemo(
    () =>
      buildPhase3ProofExportArtifact({
        currentPanelId: focusedPanelId,
        evaluatedAt: phase3ProofEvaluationTime,
        exportedAt: phase3ProofEvaluationTime,
        handoffEvidenceFingerprint: phase3HandoffEvidenceFingerprint,
        slashEvidenceByPanel: slashCommandExecutionEvidenceByPanel,
        sessionControlEvidenceByPanel: sessionControlReadinessEvidenceByPanel,
        smokeProofBundle: {
          liveControlSmoke: codexLiveControlSmokeProof,
          activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
          activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof
        },
        persistedDesktopProofs: phase3PersistedDesktopProofs,
        storageReviewReasons: phase3SmokeProofStorageReviewReasons,
        commandValidationRecord: phase3CommandValidationRecord,
        ownerHandoffRecord: phase3OwnerHandoffRecord
      }),
    [
      codexActiveTurnControlSmokeProof,
      codexActiveTurnSteerSmokeProof,
      codexLiveControlSmokeProof,
      focusedPanelId,
      phase3CommandValidationRecord,
      phase3HandoffEvidenceFingerprint,
      phase3OwnerHandoffRecord,
      phase3PersistedDesktopProofs,
      phase3SmokeProofStorageReviewReasons,
      phase3ProofEvaluationTime,
      sessionControlReadinessEvidenceByPanel,
      slashCommandExecutionEvidenceByPanel
    ]
  );
  const phase3ProofExportVerification = useMemo(
    () =>
      verifyPhase3ProofExportArtifact(phase3ProofExportArtifact, {
        verifiedAt: phase3ProofEvaluationTime,
        expectedCurrentPanelId: focusedPanelId,
        expectedHandoffEvidenceFingerprint: phase3HandoffEvidenceFingerprint
      }),
    [
      focusedPanelId,
      phase3HandoffEvidenceFingerprint,
      phase3ProofEvaluationTime,
      phase3ProofExportArtifact
    ]
  );
  const phase3HandoffRecordState = useMemo(
    () =>
      derivePhase3HandoffRecordState(
        phase3OwnerHandoffRecord,
        phase3ClearancePackage,
        phase3HandoffEvidenceFingerprint,
        { evaluatedAt: phase3ProofEvaluationTime }
      ),
    [
      phase3ClearancePackage,
      phase3HandoffEvidenceFingerprint,
      phase3OwnerHandoffRecord,
      phase3ProofEvaluationTime
    ]
  );
  const phase3ClearanceTraceabilityPrecondition = useMemo(
    () =>
      buildPhase3ClearanceTraceabilityPrecondition({
        pmTasks: projectManagementTasks
      }),
    [projectManagementTasks]
  );
  const phase3HandoffGate = useMemo(
    () =>
      buildPhase3HandoffGate({
        clearancePackage: phase3ClearancePackage,
        traceabilityPrecondition: phase3ClearanceTraceabilityPrecondition,
        commandValidation: phase3CommandValidationRecordValidation,
        proofExportVerification: phase3ProofExportVerification,
        handoffRecordState: phase3HandoffRecordState,
        handoffRecordValidation: phase3HandoffRecordValidation
      }),
    [
      phase3ClearanceTraceabilityPrecondition,
      phase3CommandValidationRecordValidation,
      phase3ClearancePackage,
      phase3ProofExportVerification,
      phase3HandoffRecordState,
      phase3HandoffRecordValidation
    ]
  );
  const phase3ClearanceTraceability = useMemo(
    () =>
      buildPhase3ClearanceTraceability({
        pmTasks: projectManagementTasks,
        clearancePackage: phase3ClearancePackage,
        commandPlan: phase3ClearanceCommandPlan,
        commandValidation: phase3CommandValidationRecordValidation,
        blockerPriority: phase3ClearanceBlockerPriority,
        handoffGate: phase3HandoffGate
      }),
    [
      phase3ClearanceBlockerPriority,
      phase3ClearanceCommandPlan,
      phase3CommandValidationRecordValidation,
      phase3ClearancePackage,
      phase3HandoffGate,
      projectManagementTasks
    ]
  );
  const phase3ClearanceCompletionStatus = useMemo(
    () =>
      buildPhase3ClearanceCompletionStatus({
        smokeReadiness: phase3SmokeProofReadiness,
        exitGate: phase3ExitGateEvidence,
        clearancePackage: phase3ClearancePackage,
        commandPlan: phase3ClearanceCommandPlan,
        commandValidation: phase3CommandValidationRecordValidation,
        blockerPriority: phase3ClearanceBlockerPriority,
        traceability: phase3ClearanceTraceability,
        proofExport: phase3ProofExportVerification,
        handoffGate: phase3HandoffGate
      }),
    [
      phase3ClearanceBlockerPriority,
      phase3ClearanceCommandPlan,
      phase3ClearancePackage,
      phase3ClearanceTraceability,
      phase3CommandValidationRecordValidation,
      phase3ExitGateEvidence,
      phase3HandoffGate,
      phase3ProofExportVerification,
      phase3SmokeProofReadiness
    ]
  );
  const recordPhase3OwnerHandoff = useCallback(() => {
    runPhase3OwnerHandoffRecordAction({
      clearancePackage: phase3ClearancePackage,
      traceabilityPrecondition: phase3ClearanceTraceabilityPrecondition,
      commandValidation: phase3CommandValidationRecordValidation,
      proofExportVerification: phase3ProofExportVerification,
      evidenceFingerprint: phase3HandoffEvidenceFingerprint,
      setRecord: setPhase3OwnerHandoffRecord,
      setProofEvaluationTime: setPhase3ProofEvaluationTime,
      setAppNotice
    });
  }, [
    phase3ClearancePackage,
    phase3ClearanceTraceabilityPrecondition,
    phase3CommandValidationRecordValidation,
    phase3HandoffEvidenceFingerprint,
    phase3ProofExportVerification
  ]);
  const clearPhase3OwnerHandoff = useCallback(() => {
    runPhase3OwnerHandoffClearAction({
      setRecord: setPhase3OwnerHandoffRecord,
      setProofEvaluationTime: setPhase3ProofEvaluationTime,
      setAppNotice
    });
  }, []);
  const recordPhase3CommandValidation = useCallback(() => {
    const now = new Date().toISOString();
    const record = createPhase3CommandValidationRecord(
      phase3ClearanceCommandPlan.command,
      now
    );

    savePhase3CommandValidationRecord(record);
    setPhase3CommandValidationRecord(record);
    setPhase3ProofEvaluationTime(now);
    setAppNotice("Phase 3 CLI smoke validation recorded locally");
  }, [phase3ClearanceCommandPlan.command]);
  const importPhase3CommandValidation = useCallback((serializedRecord: string) => {
    return runPhase3CommandValidationImportAction(serializedRecord, {
      setRecord: setPhase3CommandValidationRecord,
      setProofEvaluationTime: setPhase3ProofEvaluationTime,
      setAppNotice
    });
  }, []);
  const importPhase3SmokeProofBundle = useCallback((serializedBundle: string) => {
    return runPhase3SmokeProofBundleImportAction(serializedBundle, {
      setLiveControlSmokeProof: setCodexLiveControlSmokeProof,
      setActiveTurnInterruptSmokeProof: setCodexActiveTurnControlSmokeProof,
      setActiveTurnSteerSmokeProof: setCodexActiveTurnSteerSmokeProof,
      setPersistedDesktopProofs: setPhase3PersistedDesktopProofs,
      setStorageReviewReasons: setPhase3SmokeProofStorageReviewReasons,
      setProofEvaluationTime: setPhase3ProofEvaluationTime,
      setAppNotice
    });
  }, []);
  const importPhase3PanelEvidence = useCallback((serializedRecord: string) => {
    return runPhase3PanelEvidenceImportAction(serializedRecord, {
      currentPanelId: focusedPanelId,
      setSlashEvidenceByPanel: setSlashCommandExecutionEvidenceByPanel,
      setSessionControlEvidenceByPanel: setSessionControlReadinessEvidenceByPanel,
      setProofEvaluationTime: setPhase3ProofEvaluationTime
    });
  }, [focusedPanelId]);
  const loadRecordedPhase3CommandValidation = useCallback(async () => {
    try {
      const serializedRecord = await readPhase3RecordedArtifact(
        "phase3-command-validation-record.json",
        "phase3_command_validation_artifact_read"
      );
      importPhase3CommandValidation(serializedRecord);
    } catch {
      setAppNotice(
        "Recorded Phase 3 CLI smoke validation artifact is unavailable; run npm.cmd run smoke:phase3:record first"
      );
    }
  }, [importPhase3CommandValidation]);
  const loadRecordedPhase3SmokeProofBundle = useCallback(async () => {
    try {
      const serializedBundle = await readPhase3RecordedArtifact(
        "phase3-smoke-proof-bundle.json",
        "phase3_smoke_proof_bundle_artifact_read"
      );
      importPhase3SmokeProofBundle(serializedBundle);
    } catch {
      setAppNotice(
        "Recorded Phase 3 desktop smoke proof bundle is unavailable; run npm.cmd run smoke:phase3:record first"
      );
    }
  }, [importPhase3SmokeProofBundle]);
  const loadRecordedPhase3ProofArtifacts = useCallback(async () => {
    let commandState: Phase3RecordedArtifactLoadState = "unavailable";
    let smokeState: Phase3RecordedArtifactLoadState = "unavailable";
    let panelState: Phase3RecordedArtifactLoadState = "unavailable";

    try {
      const serializedRecord = await readPhase3RecordedArtifact(
        "phase3-command-validation-record.json",
        "phase3_command_validation_artifact_read"
      );
      commandState = importPhase3CommandValidation(serializedRecord).imported
        ? "loaded"
        : "rejected";
    } catch {
      commandState = "unavailable";
    }

    try {
      const serializedBundle = await readPhase3RecordedArtifact(
        "phase3-smoke-proof-bundle.json",
        "phase3_smoke_proof_bundle_artifact_read"
      );
      smokeState = importPhase3SmokeProofBundle(serializedBundle).imported
        ? "loaded"
        : "rejected";
    } catch {
      smokeState = "unavailable";
    }

    try {
      const serializedPanelEvidence = await readPhase3RecordedArtifact(
        "phase3-panel-evidence-record.json",
        "phase3_panel_evidence_artifact_read"
      );
      panelState = importPhase3PanelEvidence(serializedPanelEvidence).imported
        ? "loaded"
        : "rejected";
    } catch {
      panelState = "unavailable";
    }

    setAppNotice(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: commandState,
        smokeProofBundle: smokeState,
        panelEvidence: panelState
      })
    );
  }, [importPhase3CommandValidation, importPhase3PanelEvidence, importPhase3SmokeProofBundle]);
  const exportPhase3ProofArtifact = useCallback(() => {
    const now = new Date().toISOString();
    const artifact = buildPhase3ProofExportArtifact({
      currentPanelId: focusedPanelId,
      evaluatedAt: phase3ProofEvaluationTime,
      exportedAt: now,
      handoffEvidenceFingerprint: phase3HandoffEvidenceFingerprint,
      slashEvidenceByPanel: slashCommandExecutionEvidenceByPanel,
      sessionControlEvidenceByPanel: sessionControlReadinessEvidenceByPanel,
      smokeProofBundle: {
        liveControlSmoke: codexLiveControlSmokeProof,
        activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
        activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof
      },
      persistedDesktopProofs: phase3PersistedDesktopProofs,
      storageReviewReasons: phase3SmokeProofStorageReviewReasons,
      commandValidationRecord: phase3CommandValidationRecord,
      ownerHandoffRecord: phase3OwnerHandoffRecord
    });
    const { verification, serializedArtifact } = preparePhase3ProofExportDownload(artifact, {
      verifiedAt: now,
      expectedCurrentPanelId: focusedPanelId,
      expectedHandoffEvidenceFingerprint: phase3HandoffEvidenceFingerprint
    });
    if (!serializedArtifact) {
      setAppNotice(`Phase 3 proof export ${verification.statusLabel}: ${verification.detail}`);
      return;
    }

    if (typeof document !== "undefined" && typeof URL !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob([serializedArtifact], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `phase3-proof-export-${now.replace(/[:.]/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    setAppNotice(`Phase 3 proof export ${verification.statusLabel}: ${verification.detail}`);
  }, [
    codexActiveTurnControlSmokeProof,
    codexActiveTurnSteerSmokeProof,
    codexLiveControlSmokeProof,
    focusedPanelId,
    phase3CommandValidationRecord,
    phase3HandoffEvidenceFingerprint,
    phase3OwnerHandoffRecord,
    phase3PersistedDesktopProofs,
    phase3SmokeProofStorageReviewReasons,
    phase3ProofEvaluationTime,
    sessionControlReadinessEvidenceByPanel,
    slashCommandExecutionEvidenceByPanel
  ]);
  const verifyImportedPhase3ProofArtifact = useCallback((serializedArtifact: string) => {
    const now = new Date().toISOString();
    const verification = verifySerializedPhase3ProofExportArtifact(serializedArtifact, {
      verifiedAt: now,
      expectedCurrentPanelId: focusedPanelId,
      expectedHandoffEvidenceFingerprint: phase3HandoffEvidenceFingerprint
    });

    setImportedPhase3ProofExportVerification(verification);
    setAppNotice(`Imported Phase 3 proof ${verification.statusLabel}: ${verification.detail}`);
  }, [focusedPanelId, phase3HandoffEvidenceFingerprint]);
  const exportPhase4ProviderReviewArtifact = useCallback(() => {
    const now = new Date().toISOString();
    const artifact = buildPhase4ProviderReviewArtifact({
      exportedAt: now,
      evaluatedAt: phase4CatalogProofEvaluationTime,
      currentCatalogFingerprint: phase4CurrentCatalogFingerprint,
      catalogDepth: phase4ProviderCatalogDepth,
      refreshSafety: phase4RefreshSafetyDepth,
      surfaceDepth: phase4ProviderSurfaceDepth,
      traceability: phase4ProviderTraceability,
      blockerPriority: phase4ProviderBlockerPriority,
      approvalRecord: phase4ProviderApprovalRecord,
      approvalValidation: phase4ProviderApprovalValidation,
      auditRecord: phase4ProviderAuditRecord,
      auditValidation: phase4ProviderAuditValidation,
      rollbackRecord: phase4ProviderRollbackRecord,
      rollbackValidation: phase4ProviderRollbackValidation,
      permissionRecord: phase4ProviderPermissionRecord,
      permissionValidation: phase4ProviderPermissionValidation
    });
    const serializedArtifact = serializePhase4ProviderReviewArtifact(artifact);
    const verification = verifyPhase4ProviderReviewArtifact(artifact, {
      verifiedAt: now,
      expectedCatalogFingerprint: phase4CurrentCatalogFingerprint
    });

    if (typeof document !== "undefined" && typeof URL !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob([serializedArtifact], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `phase4-provider-review-${now.replace(/[:.]/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    setAppNotice(
      `Phase 4 provider review export ${verification.statusLabel}: ${verification.detail}`
    );
  }, [
    phase4CatalogProofEvaluationTime,
    phase4CurrentCatalogFingerprint,
    phase4ProviderApprovalRecord,
    phase4ProviderApprovalValidation,
    phase4ProviderAuditRecord,
    phase4ProviderAuditValidation,
    phase4ProviderBlockerPriority,
    phase4ProviderCatalogDepth,
    phase4ProviderPermissionRecord,
    phase4ProviderPermissionValidation,
    phase4ProviderRollbackRecord,
    phase4ProviderRollbackValidation,
    phase4ProviderSurfaceDepth,
    phase4ProviderTraceability,
    phase4RefreshSafetyDepth
  ]);
  const verifyImportedPhase4ProviderReviewArtifact = useCallback(
    (serializedArtifact: string) => {
      const now = new Date().toISOString();
      const verification = verifySerializedPhase4ProviderReviewArtifact(serializedArtifact, {
        verifiedAt: now,
        expectedCatalogFingerprint: phase4CurrentCatalogFingerprint
      });

      setImportedPhase4ProviderReviewArtifactVerification(verification);
      setAppNotice(
        `Imported Phase 4 provider review ${verification.statusLabel}: ${verification.detail}`
      );
    },
    [phase4CurrentCatalogFingerprint]
  );
  const loadRecordedPhase4ProviderReviewArtifact = useCallback(async () => {
    try {
      const serializedArtifact = await readPhase4RecordedArtifact(
        "phase4-provider-review-artifact.json",
        "phase4_provider_review_artifact_read"
      );

      const now = new Date().toISOString();
      const verification = verifyRecordedPhase4ProviderReviewArtifact(serializedArtifact, {
        verifiedAt: now
      });

      setImportedPhase4ProviderReviewArtifactVerification(verification);
      setAppNotice(
        `Loaded recorded Phase 4 provider review ${verification.statusLabel}: ${verification.detail}`
      );
    } catch {
      setAppNotice(
        "Recorded Phase 4 provider review artifact is unavailable; run npm.cmd run smoke:phase4:record first"
      );
    }
  }, []);
  const clearPhase3CommandValidation = useCallback(() => {
    const now = new Date().toISOString();

    clearPhase3CommandValidationRecord();
    setPhase3CommandValidationRecord(undefined);
    setPhase3ProofEvaluationTime(now);
    setAppNotice("Phase 3 CLI smoke validation record cleared");
  }, []);
  const recordPhase11Evidence = useCallback((gate: Phase11EvidenceGate) => {
    const now = new Date().toISOString();
    const record = createPhase11EvidenceRecordInput(gate, now);

    setPhase11EvidenceEvaluationTime(now);
    setPhase11EvidenceRecordInputs((currentInputs) => {
      const nextInputs = { ...currentInputs, [gate]: record };
      savePhase11EvidenceRecordInputs(nextInputs);
      return nextInputs;
    });
    setAppNotice("Phase 11 evidence record attached locally");
  }, []);
  const importPhase11EvidenceRecords = useCallback((serializedRecords: string) => {
    const importedInputs = parsePhase11EvidenceRecordInputs(serializedRecords);
    const importedEntries = Object.entries(importedInputs) as Array<
      [Phase11EvidenceGate, Phase11EvidenceRecordInput]
    >;

    if (importedEntries.length === 0) {
      setAppNotice("Phase 11 evidence record artifact could not be imported");
      return;
    }

    setPhase11EvidenceEvaluationTime(new Date().toISOString());
    setPhase11EvidenceRecordInputs((currentInputs) => {
      const nextInputs = { ...currentInputs, ...importedInputs };
      savePhase11EvidenceRecordInputs(nextInputs);
      return nextInputs;
    });
    setAppNotice(
      `Phase 11 evidence record artifact imported (${importedEntries.length} gate${
        importedEntries.length === 1 ? "" : "s"
      })`
    );
  }, []);
  const clearPhase11EvidenceRecord = useCallback((gate: Phase11EvidenceGate) => {
    setPhase11EvidenceEvaluationTime(new Date().toISOString());
    setPhase11EvidenceRecordInputs((currentInputs) => {
      const nextInputs = clearPhase11EvidenceRecordInput(gate, currentInputs);
      savePhase11EvidenceRecordInputs(nextInputs);
      return nextInputs;
    });
    setAppNotice("Phase 11 evidence record cleared");
  }, []);

  useEffect(() => {
    saveWorkspacePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    saveAdaptiveCockpitLayout(adaptiveCockpitLayout);
  }, [adaptiveCockpitLayout]);

  useEffect(() => {
    refreshCodexTransportProbe();
  }, []);

  useEffect(() => {
    savePlanningDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveProjectManagementTasks(projectManagementTasks);
  }, [projectManagementTasks]);

  useEffect(() => {
    saveProjectManagementChat(projectManagementChat);
  }, [projectManagementChat]);

  useEffect(() => {
    saveRunHistory(mockRuns);
  }, [mockRuns]);

  useEffect(() => {
    saveDispatchReviewRecords(dispatchReviewRecords);
  }, [dispatchReviewRecords]);

  useEffect(() => {
    savePanelSessionState(panelSessionState);
  }, [panelSessionState]);

  const panelSessionIdentityIssues = useMemo(
    () => findCodexPanelSessionIdentityIssues(panelSessionState),
    [panelSessionState]
  );
  const panelSessionIdentityIssueByPanel = useMemo(() => {
    const next = new Map<string, CodexPanelSessionIdentityIssue>();
    for (const issue of panelSessionIdentityIssues) {
      for (const panelId of issue.panelIds) {
        if (!next.has(panelId)) {
          next.set(panelId, issue);
        }
      }
    }

    return next;
  }, [panelSessionIdentityIssues]);

  useEffect(() => {
    saveMigrationProfileDraftHistory(migrationProfileDraftHistory);
  }, [migrationProfileDraftHistory]);

  useEffect(() => {
    if (appDialog === "migration") {
      refreshMigrationSourcePreview();
    }
  }, [appDialog]);

  const preset = cockpitPresets.find((entry) => entry.mode === mode) ?? cockpitPresets[0];
  const layout = getLayoutSpec(layoutId);
  const registryByProject = useMemo(
    () => new Map(registryEntries.map((entry) => [entry.projectId, entry])),
    []
  );
  const projectLabelById = useMemo(
    () => new Map(projects.map((entry) => [entry.id, entry.name])),
    []
  );
  const runtimeByProject = useMemo(
    () => new Map(runtimeAdapters.map((adapter) => [adapter.id, adapter])),
    []
  );

  const basePresetSessions = useMemo(() => {
    return preset.sessionIds
      .map((sessionId) => sessions.find((session) => session.id === sessionId))
      .filter((session): session is SessionSummary => Boolean(session));
  }, [preset.sessionIds]);

  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const registryEntry = registryByProject.get(project.id);
  const runtimeAdapter = runtimeByProject.get(project.id);
  const registrySummary = summarizeRegistry(registryEntries);
  const runtimeSummary = summarizeRuntimeAdapters(runtimeAdapters);
  const runtimeProfileSummary = summarizeRuntimeProfiles(runtimeProfiles);
  const phasePriorityEvidence = useMemo(
    () =>
      buildPhasePriorityEvidence({
        liveSmokeProof: codexLiveSmokeProof,
        twoPanelSmokeProof: codexTwoPanelSmokeProof,
        panelSessionState,
        projectManagementTasks,
        project: {
          id: project.id,
          name: project.name
        }
      }),
    [
      codexLiveSmokeProof,
      codexTwoPanelSmokeProof,
      panelSessionState,
      projectManagementTasks,
      project.id,
      project.name
    ]
  );
  const migrationProfileDraftHistorySummary: MigrationProfileDraftHistorySummary = useMemo(
    () => summarizeMigrationProfileDrafts(migrationProfileDraftHistory),
    [migrationProfileDraftHistory]
  );
  const migrationHardeningReadiness = useMemo(
    () =>
      buildMigrationHardeningReadiness({
        preview: migrationPreview,
        draftHistory: migrationProfileDraftHistory,
        excludedSecretsSummary: migrationSourcePreview.excludedSecretsSummary
      }),
    [migrationPreview, migrationProfileDraftHistory, migrationSourcePreview.excludedSecretsSummary]
  );
  const latestMigrationProfileDraftRecord = migrationProfileDraftHistory[0];
  const migrationProfileDraft = latestMigrationProfileDraftRecord?.draft;
  const projectMockRuns = useMemo(
    () => filterRunsByProject(mockRuns, project.id),
    [mockRuns, project.id]
  );
  const projectDispatchReviewRecords = useMemo(
    () => dispatchReviewRecords.filter((record) => record.projectId === project.id),
    [dispatchReviewRecords, project.id]
  );
  const selectedRun = useMemo(() => {
    if (selectedRunId) {
      return selectRunById(projectMockRuns, selectedRunId) ?? projectMockRuns[0];
    }

    return projectMockRuns[0];
  }, [projectMockRuns, selectedRunId]);
  const selectedDispatchReviewRecord = useMemo(
    () =>
      selectedRun
        ? dispatchReviewRecords.find((record) => record.runId === selectedRun.id)
        : undefined,
    [dispatchReviewRecords, selectedRun]
  );
  const allMockSessions = useMemo(
    () => mockRuns.flatMap((run) => runToSessionSummaries(run) as SessionSummary[]),
    [mockRuns]
  );
  const projectMockSessions = useMemo(
    () => allMockSessions.filter((session) => session.projectId === project.id),
    [allMockSessions, project.id]
  );
  const adaptiveDropSessionIdsByProject = useMemo(() => {
    const nextMap: Record<string, string[]> = {};
    for (const session of [...sessions, ...allMockSessions]) {
      nextMap[session.projectId] = nextMap[session.projectId] ?? [];
      if (!nextMap[session.projectId].includes(session.id)) {
        nextMap[session.projectId].push(session.id);
      }
    }

    return nextMap;
  }, [allMockSessions]);
  const projectMockTasks = useMemo(
    () => projectMockRuns.flatMap((run) => runToOrchestrationTasks(run)),
    [projectMockRuns]
  );
  const projectPipelineItems = useMemo(
    () => pipelineItems.filter((item) => item.projectId === project.id),
    [project.id]
  );
  const projectTasks = useMemo(
    () => [
      ...projectMockTasks,
      ...orchestrationTasks.filter((task) => task.projectId === project.id)
    ],
    [project.id, projectMockTasks]
  );
  const cockpitSessions = useMemo(
    () => [...projectMockSessions, ...basePresetSessions],
    [basePresetSessions, projectMockSessions]
  );
  const allKnownSessions = useMemo(() => {
    const nextMap = new Map<string, SessionSummary>();
    for (const session of [...sessions, ...allMockSessions, ...cockpitSessions]) {
      if (!nextMap.has(session.id)) {
        nextMap.set(session.id, session);
      }
    }

    return [...nextMap.values()];
  }, [allMockSessions, cockpitSessions]);
  const sessionById = useMemo(
    () => new Map(cockpitSessions.map((session) => [session.id, session])),
    [cockpitSessions]
  );
  const allKnownSessionById = useMemo(
    () => new Map(allKnownSessions.map((session) => [session.id, session])),
    [allKnownSessions]
  );
  const sidebarSessions = useMemo(() => {
    const seenSessionIds = new Set<string>();
    const nextSessions: SessionSummary[] = [];

    for (const session of [...cockpitSessions, ...sessions]) {
      if (seenSessionIds.has(session.id)) {
        continue;
      }

      seenSessionIds.add(session.id);
      nextSessions.push(session);
    }

    return nextSessions.slice(0, 6);
  }, [cockpitSessions]);
  const adaptivePanelIds = useMemo(
    () => cockpitSessions.slice(0, ADAPTIVE_LAYOUT_MAX_PANELS).map((session) => session.id),
    [cockpitSessions]
  );
  const syncedAdaptiveLayout = useMemo(
    () => syncAdaptiveCockpitLayoutToPanelIds(adaptiveCockpitLayout, adaptivePanelIds),
    [adaptiveCockpitLayout, adaptivePanelIds]
  );
  const visibleAdaptivePanels = useMemo(
    () =>
      visibleAdaptiveCockpitPanels(syncedAdaptiveLayout).filter((panel) =>
        sessionById.has(panel.id)
      ),
    [sessionById, syncedAdaptiveLayout]
  );
  const hiddenAdaptivePanels = useMemo(
    () =>
      hiddenAdaptiveCockpitPanels(syncedAdaptiveLayout).filter((panel) =>
        sessionById.has(panel.id)
      ),
    [sessionById, syncedAdaptiveLayout]
  );
  const adaptiveVisibleSessions = useMemo(
    () =>
      visibleAdaptivePanels
        .map((panel) => sessionById.get(panel.id))
        .filter((session): session is SessionSummary => Boolean(session)),
    [sessionById, visibleAdaptivePanels]
  );
  const maxVisibleSessions = layout.kind === "adaptive"
    ? ADAPTIVE_LAYOUT_MAX_PANELS
    : maxVisibleCells(layoutId);
  const visibleSessions = useMemo(
    () =>
      layout.kind === "adaptive"
        ? adaptiveVisibleSessions
        : cockpitSessions.slice(0, maxVisibleSessions),
    [adaptiveVisibleSessions, cockpitSessions, layout.kind, maxVisibleSessions]
  );
  const displayGrid = useMemo(
    () =>
      layout.kind === "adaptive"
        ? { columns: syncedAdaptiveLayout.columns, rows: syncedAdaptiveLayout.rows }
        : getDisplayGrid(layout, visibleSessions.length),
    [layout, syncedAdaptiveLayout.columns, syncedAdaptiveLayout.rows, visibleSessions.length]
  );
  useEffect(() => {
    setAdaptiveCockpitLayout((currentLayout) => {
      const nextLayout = syncAdaptiveCockpitLayoutToPanelIds(currentLayout, adaptivePanelIds);
      return JSON.stringify(nextLayout) === JSON.stringify(currentLayout) ? currentLayout : nextLayout;
    });
  }, [adaptivePanelIds]);
  useEffect(() => {
    setFocusedPanelId((currentPanelId) =>
      currentPanelId && visibleSessions.some((session) => session.id === currentPanelId)
        ? currentPanelId
        : undefined
    );
  }, [visibleSessions]);
  const cockpitPanelRoster = useMemo(
    () => createCockpitPanelRoster(cockpitSessions, visibleSessions.length, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions, visibleSessions.length]
  );
  const cockpitPanelOverflow = useMemo(
    () => createCockpitPanelOverflow(cockpitSessions, visibleSessions.length, maxVisibleSessions),
    [cockpitSessions, maxVisibleSessions, visibleSessions.length]
  );
  const cockpitLayoutCapacity = useMemo(
    () => createCockpitLayoutCapacity(layout, cockpitSessions.length, visibleSessions.length),
    [cockpitSessions.length, layout, visibleSessions.length]
  );
  const cockpitToolbarPanelPriority = useMemo(
    () => createCockpitPanelPriority(visibleSessions),
    [visibleSessions]
  );
  const cockpitToolbarFocusTarget = useMemo(
    () => createCockpitPanelFocusTarget(visibleSessions, cockpitToolbarPanelPriority, focusedPanelId),
    [cockpitToolbarPanelPriority, focusedPanelId, visibleSessions]
  );
  const cockpitFocusedPanelStatus = useMemo(
    () => createCockpitFocusedPanelStatus(visibleSessions, focusedPanelId),
    [focusedPanelId, visibleSessions]
  );
  const cockpitModeHandoff = useMemo(
    () =>
      createCockpitModeHandoff(
        mode,
        layout,
        visibleSessions.length,
        cockpitSessions.length
      ),
    [cockpitSessions.length, layout, mode, visibleSessions.length]
  );
  const cockpitModeHandoffQa = useMemo(
    () =>
      createCockpitModeHandoffQa(
        cockpitModeHandoff,
        cockpitLayoutCapacity,
        cockpitFocusedPanelStatus,
        cockpitPanelOverflow
      ),
    [cockpitFocusedPanelStatus, cockpitLayoutCapacity, cockpitModeHandoff, cockpitPanelOverflow]
  );
  const activeDraftIndex = Math.min(selectedDraftIndex, Math.max(drafts.length - 1, 0));
  const viewLabel = view === "cockpit" ? "Arena" : view === "pipeline" ? "Pipeline" : "Planning";

  function updatePreferences(nextPreferences: Partial<WorkspacePreferences>) {
    setPreferences((current) => ({
      ...current,
      ...nextPreferences
    }));
  }

  function handleModeChange(nextMode: CockpitMode) {
    updatePreferences({
      mode: nextMode,
      layoutId: defaultLayoutByMode[nextMode],
      view: "cockpit"
    });
  }

  function handleDraftUpdate(nextDraft: PlanningDraft) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft, index) => (index === activeDraftIndex ? nextDraft : draft))
    );
  }

  function handleAddDraft() {
    const nextDraft = normalizePlanningDraft({
      targetProjectId: project.id,
      risk: "medium",
      deployMode: "dry-run"
    });

    setDrafts((currentDrafts) => [...currentDrafts, nextDraft]);
    setSelectedDraftIndex(drafts.length);
    updatePreferences({ view: "planning" });
  }

  function handleStagePackage(dispatchPackage: DispatchPackage) {
    const createdAt = new Date().toISOString();
    const nextRun = createMockRunFromDispatchPackage(dispatchPackage, {
      createdAt,
      idSeed: "steerboard-run"
    });
    const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, nextRun);
    const reviewRecord = createDispatchReviewRecord(dispatchPackage, rolePanelPlan, nextRun, {
      createdAt
    });

    setSelectedRunId(nextRun.id);
    setMockRuns((currentRuns) => upsertRunHistory(currentRuns, nextRun));
    setDispatchReviewRecords((currentRecords) =>
      appendDispatchReviewRecord(currentRecords, reviewRecord)
    );
    updatePreferences({ view: "cockpit" });
  }

  function handleRunStatusChange(runId: string, nextStatus: MockRunStatus) {
    setSelectedRunId(runId);
    setMockRuns((currentRuns) =>
      currentRuns.map((run) => (run.id === runId ? transitionMockRunStatus(run, nextStatus) : run))
    );
    updatePreferences({ view: "cockpit" });
  }

  function handleWorkerValidationAttempt(
    runId: string,
    taskId: string,
    outcome: "pass" | "fail"
  ) {
    setSelectedRunId(runId);
    setMockRuns((currentRuns) =>
      currentRuns.map((run) =>
        run.id === runId
          ? recordWorkerValidationAttemptResult(run, {
              taskId,
              sessionId: `${run.id}:${taskId}`,
              outcome
            })
          : run
      )
    );
    updatePreferences({ view: "cockpit" });
  }

  function toggleAppMenu(menuId: AppMenuId) {
    setActiveAppMenu((currentMenu) => (currentMenu === menuId ? undefined : menuId));
  }

  function openAppDialog(nextDialog: AppDialog) {
    setAppDialog(nextDialog);
    setActiveAppMenu(undefined);
  }

  function handleViewMenuAction(nextView: WorkspacePreferences["view"]) {
    updatePreferences({ view: nextView });
    setActiveAppMenu(undefined);
  }

  function handleAdaptiveViewAction() {
    updatePreferences({ layoutId: "adaptive", view: "cockpit" });
    setActiveAppMenu(undefined);
  }

  function handleAddAdaptivePanel() {
    const nextHiddenPanel = hiddenAdaptivePanels[0];
    if (!nextHiddenPanel) {
      return;
    }

    setAdaptiveCockpitLayout((currentLayout) =>
      revealAdaptiveCockpitPanel(currentLayout, nextHiddenPanel.id)
    );
    setFocusedPanelId(nextHiddenPanel.id);
  }

  function handleResetAdaptiveLayout() {
    setAdaptiveCockpitLayout(createAdaptiveCockpitLayoutForPanelIds(adaptivePanelIds));
    setFocusedPanelId(adaptivePanelIds[0]);
  }

  function handleHideAdaptivePanel(panelId: string) {
    setAdaptiveCockpitLayout((currentLayout) => hideAdaptiveCockpitPanel(currentLayout, panelId));
    setFocusedPanelId((currentPanelId) => (currentPanelId === panelId ? undefined : currentPanelId));
  }

  function handleResizeAdaptivePanel(
    panelId: string,
    nextSize: { w?: number; h?: number }
  ) {
    setAdaptiveCockpitLayout((currentLayout) =>
      resizeAdaptiveCockpitPanel(currentLayout, panelId, nextSize)
    );
    setFocusedPanelId(panelId);
  }

  function previewAdaptiveDrop(payload: AdaptiveCockpitDropPayload | null) {
    const resolvedPanelId = resolveAdaptiveDropPanelId(payload, adaptiveDropSessionIdsByProject);
    setAdaptiveDropPreview(
      createAdaptiveCockpitDropPreview(payload, resolvedPanelId, {
        isAdaptiveMode: layout.kind === "adaptive"
      })
    );
  }

  function readAdaptiveDropPayload(event: DragEvent<HTMLDivElement>) {
    return parseAdaptiveCockpitDropPayload(
      event.dataTransfer.getData(ADAPTIVE_COCKPIT_DROP_JSON_MIME)
    );
  }

  function clearAdaptiveDragState() {
    setAdaptiveDraggingPanelId(undefined);
    setAdaptiveDraggingProjectId(undefined);
    setAdaptiveDropPreview(null);
  }

  function handleAdaptiveProjectDragStart(
    event: DragEvent<HTMLButtonElement>,
    item: ProjectSummary
  ) {
    const payload = buildProjectDropPayload(item.id, item.name);
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(ADAPTIVE_COCKPIT_DROP_JSON_MIME, JSON.stringify(payload));
    previewAdaptiveDrop(payload);
    setAppNotice(`${item.name} ready for Adaptive Arena drop`);
  }

  function handleAdaptiveSessionDragStart(
    event: DragEvent<HTMLButtonElement>,
    session: SessionSummary
  ) {
    const payload = buildSessionDropPayload(session.id, session.title);
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(ADAPTIVE_COCKPIT_DROP_JSON_MIME, JSON.stringify(payload));
    event.dataTransfer.setData(ADAPTIVE_COCKPIT_DROP_PANEL_ID_MIME, session.id);
    previewAdaptiveDrop(payload);
    setAppNotice(`${session.title} ready for Adaptive Arena drop`);
  }

  function handleAdaptiveProjectPointerStart(
    event: PointerEvent<HTMLButtonElement>,
    projectId: string
  ) {
    if (event.button !== 0) {
      return;
    }

    setAdaptiveDraggingProjectId(projectId);
  }

  function monitorFallbackSessionIds() {
    return cockpitPresets.find((entry) => entry.mode === "monitor")?.sessionIds ?? adaptivePanelIds;
  }

  function openProjectInAdaptiveCockpit(item: ProjectSummary) {
    const projectStack = createAdaptiveProjectPanelStack({
      projectId: item.id,
      sessions: allKnownSessions,
      fallbackSessionIds: monitorFallbackSessionIds(),
      maxPanelCount: ADAPTIVE_LAYOUT_MAX_PANELS,
      templateId: adaptiveProjectTemplateId
    });

    updatePreferences({
      selectedProjectId: item.id,
      mode: "monitor",
      layoutId: "adaptive",
      view: "cockpit"
    });

    if (projectStack.panelIds.length > 0) {
      setAdaptiveCockpitLayout(
        createAdaptiveCockpitLayoutForPanelIds(
          projectStack.panelIds,
          Math.min(4, projectStack.panelIds.length)
        )
      );
      setFocusedPanelId(projectStack.primaryPanelId);
      setAppNotice(`${item.name} opened as ${projectStack.label.toLowerCase()}`);
      return;
    }

    setAppNotice(`${item.name} has no available Adaptive Arena panels`);
  }

  function panelIdsForSessionDrop(session: SessionSummary) {
    if (adaptivePanelIds.includes(session.id)) {
      return adaptivePanelIds;
    }

    const monitorPreset = cockpitPresets.find((entry) => entry.mode === "monitor");
    const monitorPanelIds = monitorPreset?.sessionIds.filter((sessionId) =>
      allKnownSessionById.has(sessionId)
    ) ?? [];
    const nextPanelIds = [session.id, ...monitorPanelIds].filter(
      (sessionId, index, panelIds) => panelIds.indexOf(sessionId) === index
    );

    return nextPanelIds.slice(0, ADAPTIVE_LAYOUT_MAX_PANELS);
  }

  function openSessionInAdaptiveCockpit(
    session: SessionSummary,
    event?: DragEvent<HTMLDivElement>
  ) {
    const nextPanelIds = panelIdsForSessionDrop(session);
    const nextMode = adaptivePanelIds.includes(session.id) ? mode : "monitor";

    updatePreferences({
      selectedProjectId: session.projectId,
      mode: nextMode,
      layoutId: "adaptive",
      view: "cockpit"
    });

    if (event) {
      revealAndPlaceAdaptivePanel(session.id, event, nextPanelIds);
    } else {
      setAdaptiveCockpitLayout((currentLayout) =>
        revealAdaptiveCockpitPanel(
          syncAdaptiveCockpitLayoutToPanelIds(currentLayout, nextPanelIds),
          session.id
        )
      );
    }

    setFocusedPanelId(session.id);
    setAppNotice(`${session.title} opened in Adaptive arena`);
  }

  function handleAdaptivePanelDragStart(
    event: DragEvent<HTMLDivElement>,
    panelId: string,
    panelTitle: string
  ) {
    const payload = buildSessionDropPayload(panelId, panelTitle);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(ADAPTIVE_COCKPIT_DROP_JSON_MIME, JSON.stringify(payload));
    event.dataTransfer.setData(ADAPTIVE_COCKPIT_DROP_PANEL_ID_MIME, panelId);
    previewAdaptiveDrop(payload);
  }

  function handleAdaptivePanelPointerStart(
    event: PointerEvent<HTMLDivElement>,
    panelId: string
  ) {
    if (event.button !== 0) {
      return;
    }

    setAdaptiveDraggingPanelId(panelId);
  }

  function moveAdaptivePanelToPointer(panelId: string, event: Pick<DragEvent<HTMLDivElement>, "clientX" | "clientY" | "currentTarget">) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * syncedAdaptiveLayout.columns
    );
    const y = Math.floor(
      ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * syncedAdaptiveLayout.rows
    );

    setAdaptiveCockpitLayout((currentLayout) =>
      moveAdaptiveCockpitPanel(currentLayout, panelId, { x, y })
    );
    setFocusedPanelId(panelId);
  }

  function revealAndPlaceAdaptivePanel(
    panelId: string,
    event: DragEvent<HTMLDivElement>,
    panelIds = adaptivePanelIds
  ) {
    setAdaptiveCockpitLayout((currentLayout) => {
      const syncedLayout = syncAdaptiveCockpitLayoutToPanelIds(currentLayout, panelIds);
      const withPanelVisible = revealAdaptiveCockpitPanel(syncedLayout, panelId);
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = Math.floor(
        ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * syncedAdaptiveLayout.columns
      );
      const y = Math.floor(
        ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * syncedAdaptiveLayout.rows
      );

      return moveAdaptiveCockpitPanel(withPanelVisible, panelId, { x, y });
    });
    setFocusedPanelId(panelId);
  }

  function handleAdaptivePanelKeyboard(
    event: KeyboardEvent<HTMLDivElement>,
    panelId: string
  ) {
    const keyDeltas: Record<string, { dx: number; dy: number }> = {
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 }
    };
    const delta = keyDeltas[event.key];
    if (!delta) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setAdaptiveCockpitLayout((currentLayout) =>
      event.shiftKey
        ? resizeAdaptiveCockpitPanelByDelta(currentLayout, panelId, {
            dw: delta.dx,
            dh: delta.dy
          })
        : nudgeAdaptiveCockpitPanel(currentLayout, panelId, delta)
    );
    setFocusedPanelId(panelId);
  }

  function handleAdaptiveGridPointerDrop(event: PointerEvent<HTMLDivElement>) {
    if (adaptiveDraggingPanelId) {
      event.preventDefault();
      moveAdaptivePanelToPointer(adaptiveDraggingPanelId, event);
      clearAdaptiveDragState();
      return;
    }

    if (adaptiveDraggingProjectId) {
      const draggedProject = projects.find((item) => item.id === adaptiveDraggingProjectId);
      if (draggedProject) {
        event.preventDefault();
        openProjectInAdaptiveCockpit(draggedProject);
      }
    }

    clearAdaptiveDragState();
  }

  function handleAdaptiveGridDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const payload = readAdaptiveDropPayload(event);
    if (payload) {
      previewAdaptiveDrop(payload);
    }
  }

  function handleAdaptiveGridDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setAdaptiveDropPreview(null);
  }

  function handleAdaptivePanelDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const payload = readAdaptiveDropPayload(event);
    const resolvedPanelId = resolveAdaptiveDropPanelId(payload, adaptiveDropSessionIdsByProject);
    const fallbackPanelId = event.dataTransfer.getData(ADAPTIVE_COCKPIT_DROP_PANEL_ID_MIME);
    const panelId = resolvedPanelId ?? fallbackPanelId;
    if (!panelId) {
      previewAdaptiveDrop(payload);
      return;
    }

    if (payload?.source === "project") {
      const draggedProject = projects.find((item) => item.id === payload.projectId);
      if (draggedProject) {
        openProjectInAdaptiveCockpit(draggedProject);
      }
    } else if (payload?.source === "session") {
      const draggedSession = allKnownSessionById.get(panelId);
      if (draggedSession) {
        openSessionInAdaptiveCockpit(draggedSession, event);
      } else {
        revealAndPlaceAdaptivePanel(panelId, event);
        setAppNotice("Panel moved in Adaptive arena");
      }
    } else {
      revealAndPlaceAdaptivePanel(panelId, event);
      setAppNotice("Panel moved in Adaptive arena");
    }

    clearAdaptiveDragState();
  }

  function handleStageCodexConnection() {
    setCodexConnectionRequested(true);
    setAppNotice(
      codexTransportDecision.preferredTransport === "app-server-stdio"
        ? "Codex stdio bridge staged"
        : "Codex connection request staged locally"
    );
  }

  async function refreshCodexTransportProbe() {
    setCodexTransportLoading(true);
    const nextProbe = await loadCodexTransportProbe();
    const nextDecision = decideCodexTransport(nextProbe, codexLiveSmokeProof);

    setCodexTransportProbe(nextProbe);
    setCodexTransportLoading(false);
    setAppNotice(codexNotice(nextDecision));
  }

  async function refreshMigrationSourcePreview(nextSourceId = migrationSourceId) {
    setMigrationPreviewLoading(true);

    if (!hasDesktopRuntime()) {
      setMigrationSourcePreview(fallbackMigrationSourcePreview(nextSourceId));
      setMigrationPreviewLoading(false);
      return;
    }

    try {
      const result = await invokeDesktopCommand<MigrationSourcePreviewPayload>(
        "migration_source_preview",
        { sourceId: nextSourceId }
      );
      setMigrationSourcePreview({
        ...result,
        safetyNote: redactMigrationPreviewDetail(result.safetyNote),
        categories: result.categories.map((category) => ({
          ...category,
          reason: redactMigrationPreviewDetail(category.reason)
        })),
        excludedSecretsSummary: result.excludedSecretsSummary.map((item) =>
          redactMigrationPreviewDetail(item)
        )
      });
    } catch (error) {
      setMigrationSourcePreview({
        ...fallbackMigrationSourcePreview(nextSourceId),
        safeLocationLabel: "Desktop metadata scan failed",
        safetyNote:
          error instanceof Error
            ? redactMigrationPreviewDetail(error.message)
            : "Desktop metadata scan failed without returning details."
      });
    } finally {
      setMigrationPreviewLoading(false);
    }
  }

  function handleMigrationSourceChange(nextSourceId: MigrationSourceId) {
    setMigrationSourceId(nextSourceId);
    setMigrationPreview(buildDefaultMigrationPreview(nextSourceId));
    setMigrationProfileDraftActionNotice("");
    refreshMigrationSourcePreview(nextSourceId);
  }

  function handleMigrationCategoryChange(categoryId: MigrationCategoryId, selected: boolean) {
    setMigrationPreview((current) => toggleMigrationCategory(current, categoryId, selected));
    setMigrationProfileDraftActionNotice("");
  }

  function handleSelectReviewableMigrationCategories() {
    setMigrationPreview((current) =>
      current.categories.reduce(
        (nextPreview, category) =>
          category.baseState === "unsupported"
            ? nextPreview
            : toggleMigrationCategory(nextPreview, category.id, true),
        buildDefaultMigrationPreview(current.source)
      )
    );
    setMigrationProfileDraftActionNotice("");
  }

  function handleCreateMigrationProfileDraft() {
    const draft = createMigrationProfileDraft(migrationPreview, {
      sourceLabel: migrationSourcePreview.sourceLabel,
      safetyNote: migrationSourcePreview.safetyNote,
      createdAt: new Date().toISOString()
    });
    setMigrationProfileDraftHistory((current) => {
      const nextHistory = appendMigrationProfileDraftHistory(
        current,
        draft,
        "created",
        MIGRATION_DRAFT_HISTORY_LIMIT,
        draft.createdAt
      );
      setMigrationProfileDraftActionNotice(nextHistory[0]?.audit.detail ?? `Created migration draft for ${draft.sourceLabel}`);
      return nextHistory;
    });
  }

  function handleRollbackLatestMigrationProfileDraft() {
    if (migrationProfileDraftHistory.length === 0) {
      setMigrationProfileDraftActionNotice("No migration draft history to roll back.");
      return;
    }

    setMigrationProfileDraftHistory((current) => {
      const rollbackResult = rollbackMigrationProfileDraftHistory(
        current,
        new Date().toISOString()
      );
      setMigrationProfileDraftActionNotice(
        rollbackResult.rollbackAudit?.detail ?? "Rolled back latest migration draft."
      );
      return rollbackResult.history;
    });
  }

  function handleStageMigrationApplyIntent() {
    if (!migrationHardeningReadiness.canStageApplyIntent || !migrationProfileDraftHistory[0]) {
      setMigrationProfileDraftActionNotice(migrationHardeningReadiness.nextAction);
      return;
    }

    setMigrationProfileDraftHistory((current) => {
      const latestDraft = current[0]?.draft;
      if (!latestDraft) {
        setMigrationProfileDraftActionNotice("No migration draft is ready for apply review staging.");
        return current;
      }

      const nextHistory = appendMigrationProfileDraftHistory(
        current,
        latestDraft,
        "apply-review-staged",
        MIGRATION_DRAFT_HISTORY_LIMIT,
        new Date().toISOString()
      );
      setMigrationProfileDraftActionNotice(
        createMigrationApplyIntentNotice(migrationHardeningReadiness)
      );
      return nextHistory;
    });
  }

  function handleRecordMigrationOwnerApproval() {
    const traceability = buildMigrationTraceabilitySummary({
      readiness: migrationHardeningReadiness
    });
    const blockerPriority = buildMigrationBlockerPriority({
      readiness: migrationHardeningReadiness,
      traceability
    });
    const applyDecisionGate = buildMigrationApplyDecisionGate({
      readiness: migrationHardeningReadiness,
      traceability,
      blockerPriority
    });
    const approvalHandoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate
    });

    if (!approvalHandoff.canRequestOwnerApproval) {
      setMigrationProfileDraftActionNotice(approvalHandoff.nextAction);
      return;
    }

    const record = createMigrationOwnerApprovalRecord({
      handoff: approvalHandoff,
      createdAt: new Date().toISOString()
    });

    saveMigrationOwnerApprovalRecord(record);
    setMigrationOwnerApprovalRecord(record);
    setMigrationProfileDraftActionNotice(record.detail);
  }

  function handleClearMigrationOwnerApproval() {
    clearMigrationOwnerApprovalRecord();
    setMigrationOwnerApprovalRecord(undefined);
    setMigrationProfileDraftActionNotice("Phase 5 migration owner approval record cleared locally.");
  }

  async function runCodexLiveSmokeProof() {
    setCodexLiveSmokeLoading(true);
    const nextProof = await loadCodexLiveSmokeProof();
    const nextDecision = decideCodexTransport(codexTransportProbe, nextProof);
    savePhasePrioritySmokeProofBundle({
      liveSmoke: nextProof,
      twoPanelSmoke: codexTwoPanelSmokeProof
    });

    setCodexLiveSmokeProof(nextProof);
    setCodexLiveSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(nextProof.ok ? "Codex send/stream smoke passed" : "Codex live smoke did not pass");
    if (nextDecision.state === "live") {
      setAppNotice(codexNotice(nextDecision));
    }
  }

  async function runCodexActiveTurnControlSmokeProof() {
    setCodexActiveTurnControlSmokeLoading(true);
    const nextProof = await loadCodexActiveTurnControlSmokeProof();
    savePhase3SmokeProofBundle({
      liveControlSmoke: codexLiveControlSmokeProof,
      activeTurnInterruptSmoke: nextProof,
      activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof
    });
    const persistedLoad = loadPhase3SmokeProofBundleWithStorageProof();
    const persistedBundle = persistedLoad.bundle;

    setCodexLiveControlSmokeProof(persistedBundle.liveControlSmoke);
    setCodexActiveTurnControlSmokeProof(persistedBundle.activeTurnInterruptSmoke);
    setCodexActiveTurnSteerSmokeProof(persistedBundle.activeTurnSteerSmoke);
    setPhase3PersistedDesktopProofs(persistedLoad.persistedDesktopProofs);
    setPhase3SmokeProofStorageReviewReasons(persistedLoad.storageReviewReasons);
    setCodexActiveTurnControlSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(
      buildPhase3SmokeProofNotice({
        label: "Codex active-turn interrupt",
        passed: nextProof.ok,
        persisted: persistedLoad.persistedDesktopProofs.activeTurnInterruptSmoke
      })
    );
  }

  async function runCodexActiveTurnSteerSmokeProof() {
    setCodexActiveTurnSteerSmokeLoading(true);
    const nextProof = await loadCodexActiveTurnSteerSmokeProof();
    savePhase3SmokeProofBundle({
      liveControlSmoke: codexLiveControlSmokeProof,
      activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
      activeTurnSteerSmoke: nextProof
    });
    const persistedLoad = loadPhase3SmokeProofBundleWithStorageProof();
    const persistedBundle = persistedLoad.bundle;

    setCodexLiveControlSmokeProof(persistedBundle.liveControlSmoke);
    setCodexActiveTurnControlSmokeProof(persistedBundle.activeTurnInterruptSmoke);
    setCodexActiveTurnSteerSmokeProof(persistedBundle.activeTurnSteerSmoke);
    setPhase3PersistedDesktopProofs(persistedLoad.persistedDesktopProofs);
    setPhase3SmokeProofStorageReviewReasons(persistedLoad.storageReviewReasons);
    setCodexActiveTurnSteerSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(
      buildPhase3SmokeProofNotice({
        label: "Codex active-turn steer",
        passed: nextProof.ok,
        persisted: persistedLoad.persistedDesktopProofs.activeTurnSteerSmoke
      })
    );
  }

  async function runCodexLiveControlSmokeProof() {
    setCodexLiveControlSmokeLoading(true);
    const nextProof = await loadCodexLiveControlSmokeProof();
    savePhase3SmokeProofBundle({
      liveControlSmoke: nextProof,
      activeTurnInterruptSmoke: codexActiveTurnControlSmokeProof,
      activeTurnSteerSmoke: codexActiveTurnSteerSmokeProof
    });
    const persistedLoad = loadPhase3SmokeProofBundleWithStorageProof();
    const persistedBundle = persistedLoad.bundle;

    setCodexLiveControlSmokeProof(persistedBundle.liveControlSmoke);
    setCodexActiveTurnControlSmokeProof(persistedBundle.activeTurnInterruptSmoke);
    setCodexActiveTurnSteerSmokeProof(persistedBundle.activeTurnSteerSmoke);
    setPhase3PersistedDesktopProofs(persistedLoad.persistedDesktopProofs);
    setPhase3SmokeProofStorageReviewReasons(persistedLoad.storageReviewReasons);
    setCodexLiveControlSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(
      buildPhase3SmokeProofNotice({
        label: "Codex live-control",
        passed: nextProof.ok,
        persisted: persistedLoad.persistedDesktopProofs.liveControlSmoke
      })
    );
  }

  async function runCodexTwoPanelSmokeProof() {
    setCodexTwoPanelSmokeLoading(true);
    const nextProof = await loadCodexTwoPanelSmokeProof();
    savePhasePrioritySmokeProofBundle({
      liveSmoke: codexLiveSmokeProof,
      twoPanelSmoke: nextProof
    });

    setCodexTwoPanelSmokeProof(nextProof);
    setCodexTwoPanelSmokeLoading(false);
    setCodexConnectionRequested(true);
    setAppNotice(
      nextProof.ok
        ? "Codex two-panel smoke passed"
        : "Codex two-panel smoke did not pass"
    );
  }

  async function refreshCommandCatalogSnapshot() {
    setAppNotice("Refreshing provider command catalog");
    const nextSnapshot = await loadProviderCommandCatalogSnapshot(undefined, panelSlashCommands);
    setCommandCatalogSnapshot(nextSnapshot);
    setAppNotice(`${formatCommandCatalogSource(nextSnapshot.source)} command catalog refreshed`);
  }

  async function refreshPluginCatalogSnapshot() {
    setPluginCatalogLoading(true);
    setAppNotice("Refreshing provider plugin catalog");
    try {
      const nextSnapshot = await loadProviderPluginCatalogSnapshot(undefined, defaultPluginCatalog);
      setPluginCatalogSnapshot(nextSnapshot);
      setAppNotice(`${formatPluginCatalogSource(nextSnapshot.source)} plugin catalog refreshed`);
    } finally {
      setPluginCatalogLoading(false);
    }
  }

  async function refreshMcpCatalogSnapshot() {
    setMcpCatalogLoading(true);
    setAppNotice("Refreshing provider MCP catalog");
    try {
      const nextSnapshot = await loadProviderMcpCatalogSnapshot(undefined, defaultMcpCatalog);
      setMcpCatalogSnapshot(nextSnapshot);
      setAppNotice(`${formatMcpCatalogSource(nextSnapshot.source)} MCP catalog refreshed`);
    } finally {
      setMcpCatalogLoading(false);
    }
  }

  async function refreshSkillCatalogSnapshot() {
    setSkillCatalogLoading(true);
    setAppNotice("Refreshing provider skill catalog");
    try {
      const nextSnapshot = await loadProviderSkillCatalogSnapshot(undefined, defaultSkillCatalog);
      setSkillCatalogSnapshot(nextSnapshot);
      setAppNotice(`${formatSkillCatalogSource(nextSnapshot.source)} skill catalog refreshed`);
    } finally {
      setSkillCatalogLoading(false);
    }
  }

  async function refreshAutomationCatalogSnapshot() {
    setAutomationCatalogLoading(true);
    setAppNotice("Refreshing provider automation catalog");
    try {
      const nextSnapshot = await loadProviderAutomationCatalogSnapshot(
        undefined,
        defaultAutomationCatalog
      );
      setAutomationCatalogSnapshot(nextSnapshot);
      setAppNotice(`${formatAutomationCatalogSource(nextSnapshot.source)} automation catalog refreshed`);
    } finally {
      setAutomationCatalogLoading(false);
    }
  }

  async function refreshPersonalizationCatalogSnapshot() {
    setPersonalizationCatalogLoading(true);
    setAppNotice("Refreshing provider personalization catalog");
    try {
      const nextSnapshot = await loadProviderPersonalizationCatalogSnapshot(
        undefined,
        defaultPersonalizationCatalog
      );
      setPersonalizationCatalogSnapshot(nextSnapshot);
      setAppNotice(`${formatPersonalizationCatalogSource(nextSnapshot.source)} personalization catalog refreshed`);
    } finally {
      setPersonalizationCatalogLoading(false);
    }
  }

  async function runCatalogRefreshProviderSmokeProof() {
    setCatalogRefreshProviderSmokeLoading(true);
    setAppNotice("Refreshing provider catalogs for smoke proof");

    try {
      const [
        nextCommandSnapshot,
        nextSkillSnapshot,
        nextPluginSnapshot,
        nextMcpSnapshot,
        nextAutomationSnapshot,
        nextPersonalizationSnapshot
      ] = await Promise.all([
        loadProviderCommandCatalogSnapshot(undefined, panelSlashCommands),
        loadProviderSkillCatalogSnapshot(undefined, defaultSkillCatalog),
        loadProviderPluginCatalogSnapshot(undefined, defaultPluginCatalog),
        loadProviderMcpCatalogSnapshot(undefined, defaultMcpCatalog),
        loadProviderAutomationCatalogSnapshot(undefined, defaultAutomationCatalog),
        loadProviderPersonalizationCatalogSnapshot(undefined, defaultPersonalizationCatalog)
      ]);

      setCommandCatalogSnapshot(nextCommandSnapshot);
      setSkillCatalogSnapshot(nextSkillSnapshot);
      setPluginCatalogSnapshot(nextPluginSnapshot);
      setMcpCatalogSnapshot(nextMcpSnapshot);
      setAutomationCatalogSnapshot(nextAutomationSnapshot);
      setPersonalizationCatalogSnapshot(nextPersonalizationSnapshot);

      const nextProof = buildCatalogRefreshProviderSmoke(
        {
          commandCatalogSnapshot: {
            source: nextCommandSnapshot.source,
            entries: nextCommandSnapshot.catalog
          },
          skillCatalogSnapshot: {
            source: nextSkillSnapshot.source,
            entries: nextSkillSnapshot.catalog
          },
          pluginCatalogSnapshot: {
            source: nextPluginSnapshot.source,
            entries: nextPluginSnapshot.catalog
          },
          mcpCatalogSnapshot: {
            source: nextMcpSnapshot.source,
            entries: nextMcpSnapshot.catalog
          },
          automationCatalogSnapshot: {
            source: nextAutomationSnapshot.source,
            entries: nextAutomationSnapshot.catalog
          },
          personalizationCatalogSnapshot: {
            source: nextPersonalizationSnapshot.source,
            entries: nextPersonalizationSnapshot.catalog
          }
        },
        {
          checkedAt: new Date().toISOString()
        }
      );

      setCatalogRefreshProviderSmokeProof(nextProof);
      savePhase4CatalogSmokeProof(nextProof);
      setCodexConnectionRequested(true);
      setAppNotice(
        nextProof.ok
          ? "Provider catalog refresh smoke passed"
          : "Provider catalog refresh smoke needs review"
      );
    } catch {
      setCatalogRefreshProviderSmokeProof(
        buildCatalogRefreshProviderSmoke({}, { notRunPreview: true })
      );
      setAppNotice("Provider catalog refresh smoke is unavailable");
    } finally {
      setCatalogRefreshProviderSmokeLoading(false);
    }
  }

  function recordLivePanelSessionStart(result: CodexPanelSessionStartPayload) {
    setPanelSessionState((currentState) =>
      upsertPanelSession(
        currentState,
        result.panelId,
        {
          provider: "codex",
          sessionId: result.sessionId,
          threadId: result.threadId,
          status: "active",
          stale: false,
          detail: result.detail
        }
      )
    );
  }

  function recordLivePanelSessionStatus(
    panelId: string,
    status: CodexPanelSessionStatus,
    detail: string
  ) {
    setPanelSessionState((currentState) =>
      upsertPanelSession(
        currentState,
        panelId,
        {
          status,
          detail,
          stale: false
        }
      )
    );
  }

  const recordSlashCommandExecutionEvidence = useCallback(
    (panelId: string, evidence: SlashCommandExecutionEvidence) => {
      setSlashCommandExecutionEvidenceByPanel((currentEvidenceByPanel) => {
        const currentEvidence = currentEvidenceByPanel[panelId];
        if (!shouldSavePhase3PanelEvidence(
          panelId,
          currentEvidence,
          evidence,
          slashCommandExecutionEvidenceEqual(currentEvidence, evidence)
        )) {
          return currentEvidenceByPanel;
        }

        const nextEvidenceByPanel = {
          ...currentEvidenceByPanel,
          [panelId]: evidence
        };

        return savePhase3SlashEvidenceByPanel(nextEvidenceByPanel, {
          refreshPanelIds: [panelId]
        });
      });
    },
    []
  );

  const recordSessionControlReadinessEvidence = useCallback(
    (panelId: string, evidence: SessionControlReadinessEvidence) => {
      setSessionControlReadinessEvidenceByPanel((currentEvidenceByPanel) => {
        const currentEvidence = currentEvidenceByPanel[panelId];
        if (!shouldSavePhase3PanelEvidence(
          panelId,
          currentEvidence,
          evidence,
          sessionControlReadinessEvidenceEqual(currentEvidence, evidence)
        )) {
          return currentEvidenceByPanel;
        }

        const nextEvidenceByPanel = {
          ...currentEvidenceByPanel,
          [panelId]: evidence
        };

        return savePhase3SessionControlEvidenceByPanel(nextEvidenceByPanel, {
          refreshPanelIds: [panelId]
        });
      });
    },
    []
  );

  return (
    <main className="app-shell">
      <AppMenuBar
        activeMenu={activeAppMenu}
        appNotice={appNotice}
        codexConnectionRequested={codexConnectionRequested}
        currentView={view}
        onAdaptiveView={handleAdaptiveViewAction}
        onAddDraft={handleAddDraft}
        onOpenDialog={openAppDialog}
        onSwitchView={handleViewMenuAction}
        onToggleMenu={toggleAppMenu}
      />
      <aside className="sidebar" aria-label="Steerboard navigation">
        <nav className="sidebar-command-list" aria-label="Primary actions">
          <button type="button">
            <Plus size={16} />
            <span>New chat</span>
          </button>
          <button type="button">
            <Search size={16} />
            <span>Search</span>
          </button>
          <button onClick={() => openAppDialog("plugins")} type="button">
            <Grid2X2 size={16} />
            <span>Plugins</span>
          </button>
          <button onClick={() => openAppDialog("automations")} type="button">
            <CircleDot size={16} />
            <span>Automations</span>
          </button>
        </nav>

        <nav className="project-list codex-sidebar-list" aria-label="Pinned chats and projects">
          <span className="sidebar-section-label">Pinned</span>
          <div className="sidebar-workspace-group">
            <div className="sidebar-workspace-heading">
              <span>STEERBOARD</span>
              <small>now</small>
            </div>
            <button
              className="project-folder-button"
              data-adaptive-drop-source={projects[0].id}
              draggable
              onDragEnd={clearAdaptiveDragState}
              onDragStart={(event) => handleAdaptiveProjectDragStart(event, projects[0])}
              onClick={() => {
                setAdaptiveDraggingProjectId(undefined);
                updatePreferences({ selectedProjectId: projects[0].id, view: "cockpit" });
              }}
              onPointerDown={(event) => handleAdaptiveProjectPointerStart(event, projects[0].id)}
              title="Drag project into Adaptive arena"
              type="button"
            >
              <Folder size={16} />
              <span>Steerboard</span>
            </button>
            {projects.slice(0, 3).map((item) => (
              <button
                className={classNames("project-button", selectedProjectId === item.id && "is-selected")}
                data-adaptive-drop-source={item.id}
                draggable
                key={item.id}
                onDragEnd={clearAdaptiveDragState}
                onDragStart={(event) => handleAdaptiveProjectDragStart(event, item)}
                onClick={() => {
                  setAdaptiveDraggingProjectId(undefined);
                  updatePreferences({ selectedProjectId: item.id, view: "cockpit" });
                }}
                onPointerDown={(event) => handleAdaptiveProjectPointerStart(event, item.id)}
                title="Drag project into Adaptive arena"
                type="button"
              >
                <span className={classNames("project-status", `is-${item.status}`)} />
                <span className="project-copy">
                  <span>{item.name}</span>
                </span>
                <span className="project-time">{item.updated}</span>
              </button>
            ))}
          </div>

          <span className="sidebar-section-label">Chats</span>
          {sidebarSessions.map((session) => (
            <button
              className={classNames(
                "project-button",
                "sidebar-session-button",
                focusedPanelId === session.id && "is-selected"
              )}
              data-adaptive-session-source={session.id}
              draggable
              key={session.id}
              onClick={() => openSessionInAdaptiveCockpit(session)}
              onDragEnd={clearAdaptiveDragState}
              onDragStart={(event) => handleAdaptiveSessionDragStart(event, session)}
              title="Drag chat into Adaptive arena"
              type="button"
            >
              <MessageSquare size={14} />
              <span className="project-copy">
                <span>{session.title}</span>
                <small>{projectLabelById.get(session.projectId) ?? session.role}</small>
              </span>
              <span className="project-time">{session.state}</span>
            </button>
          ))}

          <span className="sidebar-section-label">Projects</span>
          {projects.slice(3).map((item) => (
            <button
              className={classNames("project-button", selectedProjectId === item.id && "is-selected")}
              data-adaptive-drop-source={item.id}
              draggable
              key={item.id}
              onDragEnd={clearAdaptiveDragState}
              onDragStart={(event) => handleAdaptiveProjectDragStart(event, item)}
              onClick={() => {
                setAdaptiveDraggingProjectId(undefined);
                updatePreferences({ selectedProjectId: item.id, view: "cockpit" });
              }}
              onPointerDown={(event) => handleAdaptiveProjectPointerStart(event, item.id)}
              title="Drag project into Adaptive arena"
              type="button"
            >
              <span className={classNames("project-status", `is-${item.status}`)} />
              <span className="project-copy">
                <span>{item.name}</span>
                <small>{registryByProject.get(item.id)?.workspaceLabel ?? `${item.runs} runs`}</small>
              </span>
              <span className="project-time">{item.updated}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            aria-label="Open personalization settings"
            onClick={() => openAppDialog("personalization")}
            title="Personalization"
            type="button"
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <button aria-label="Open local terminal" title="Terminal" type="button">
            <Terminal size={18} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="title-block">
            <span className="eyebrow">{project.name}</span>
            <h2>{preset.label}</h2>
          </div>

          <div className="topbar-controls">
            {runtimeAdapter ? (
              <span className={classNames("runtime-pill", `runtime-${runtimeAdapter.state}`)}>
                {runtimeStateLabel(runtimeAdapter.state)}
              </span>
            ) : null}

            <div className="segmented" aria-label="Arena mode">
              {cockpitPresets.map((entry) => (
                <button
                  className={classNames(entry.mode === mode && "is-active")}
                  key={entry.mode}
                  onClick={() => handleModeChange(entry.mode)}
                  type="button"
                >
                  {modeLabels[entry.mode]}
                </button>
              ))}
            </div>

            <div className="segmented compact" aria-label="Primary view">
              <button
                className={classNames(view === "cockpit" && "is-active")}
                onClick={() => updatePreferences({ view: "cockpit" })}
                type="button"
              >
                <LayoutDashboard size={15} />
                Arena
              </button>
              <button
                className={classNames(view === "pipeline" && "is-active")}
                onClick={() => updatePreferences({ view: "pipeline" })}
                type="button"
              >
                <ClipboardList size={15} />
                Pipeline
              </button>
              <button
                className={classNames(view === "planning" && "is-active")}
                onClick={() => updatePreferences({ view: "planning" })}
                type="button"
              >
                <Workflow size={15} />
                Planning
              </button>
            </div>
          </div>
        </header>

        <div className="content-split">
          <section className="main-surface" aria-label={viewLabel}>
            {view === "cockpit" ? (
              <>
                <div className="surface-toolbar">
                  <label className={classNames("layout-select", layout.kind === "adaptive" && "is-adaptive")}>
                    <span>Layout</span>
                    <select
                      aria-label="Select Arena layout"
                      onChange={(event) => updatePreferences({ layoutId: event.target.value as LayoutId })}
                      title={layoutAriaLabel(layout)}
                      value={layoutId}
                    >
                      {layoutOptions.map((option) => (
                        <option key={option.id} title={option.description} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {layout.kind === "adaptive" ? (
                    <div className="adaptive-toolbar" aria-label="Adaptive Arena controls">
                      <label className="adaptive-template-select">
                        <span>Project</span>
                        <select
                          aria-label="Select project drop template"
                          onChange={(event) =>
                            updatePreferences({
                              adaptiveProjectTemplateId:
                                event.target.value as AdaptiveCockpitProjectStackRequestedTemplateId
                            })
                          }
                          title={
                            adaptiveProjectTemplateOptions.find(
                              (option) => option.id === adaptiveProjectTemplateId
                            )?.description
                          }
                          value={adaptiveProjectTemplateId}
                        >
                          {adaptiveProjectTemplateOptions.map((option) => (
                            <option key={option.id} title={option.description} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        disabled={hiddenAdaptivePanels.length === 0}
                        onClick={handleAddAdaptivePanel}
                        title={
                          hiddenAdaptivePanels.length > 0
                            ? `Reveal ${sessionById.get(hiddenAdaptivePanels[0].id)?.title ?? "next panel"}`
                            : "All available panels are visible."
                        }
                        type="button"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={handleResetAdaptiveLayout}
                        title="Reset adaptive panel positions"
                        type="button"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <span title="Hidden adaptive panels">
                        {hiddenAdaptivePanels.length} hidden
                      </span>
                    </div>
                  ) : null}
                  <div className="toolbar-status">
                    <LayoutCapacitySignal capacity={cockpitLayoutCapacity} />
                    <FocusedPanelStatusChip
                      focusTarget={cockpitToolbarFocusTarget}
                      onClearFocus={() => setFocusedPanelId(undefined)}
                      onFocus={() => {
                        if (cockpitToolbarFocusTarget.canFocus) {
                          setFocusedPanelId(cockpitToolbarFocusTarget.panelId);
                        }
                      }}
                      status={cockpitFocusedPanelStatus}
                    />
                    <PanelRosterSignal roster={cockpitPanelRoster} />
                    <PanelOverflowSignal overflow={cockpitPanelOverflow} />
                    <div className="run-chip">
                      <Play size={14} />
                      {visibleSessions.length} visible
                    </div>
                  </div>
                </div>

                <div
                  className={classNames(
                    "cockpit-grid",
                    layout.kind === "adaptive" && "cockpit-grid-adaptive",
                    adaptiveDropPreview ? `is-drop-${adaptiveDropPreview.status}` : undefined
                  )}
                  onDragLeave={layout.kind === "adaptive" ? handleAdaptiveGridDragLeave : undefined}
                  onDragOver={layout.kind === "adaptive" ? handleAdaptiveGridDragOver : undefined}
                  onDrop={layout.kind === "adaptive" ? handleAdaptivePanelDrop : undefined}
                  onPointerCancel={
                    layout.kind === "adaptive"
                      ? () => {
                          clearAdaptiveDragState();
                        }
                      : undefined
                  }
                  onPointerUp={layout.kind === "adaptive" ? handleAdaptiveGridPointerDrop : undefined}
                  style={{
                    gridTemplateColumns: `repeat(${displayGrid.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${displayGrid.rows}, minmax(190px, 1fr))`
                  }}
                >
                  {layout.kind === "adaptive" && adaptiveDropPreview ? (
                    <div
                      aria-live="polite"
                      className={classNames(
                        "adaptive-drop-preview",
                        `is-${adaptiveDropPreview.tone}`
                      )}
                      data-adaptive-drop-preview={adaptiveDropPreview.status}
                    >
                      <strong>{adaptiveDropPreview.label}</strong>
                      <span>{adaptiveDropPreview.detail}</span>
                    </div>
                  ) : null}
                  {layout.kind === "adaptive"
                    ? visibleAdaptivePanels.map((panel) => {
                        const session = sessionById.get(panel.id);
                        return session ? (
                          <AdaptivePanelFrame
                            columns={syncedAdaptiveLayout.columns}
                            key={panel.id}
                            onDragStart={handleAdaptivePanelDragStart}
                            onHide={handleHideAdaptivePanel}
                            onKeyboardAdjust={handleAdaptivePanelKeyboard}
                            onPointerStart={handleAdaptivePanelPointerStart}
                            onResize={handleResizeAdaptivePanel}
                            panel={panel}
                            rows={syncedAdaptiveLayout.rows}
                            title={session.title}
                          >
                            <SessionCell
                              commandCatalog={commandCatalogSnapshot.catalog}
                              isFocused={session.id === focusedPanelId}
                              liveCodexEnabled={codexTransportDecision.canStartSession}
                              onPanelSessionStart={recordLivePanelSessionStart}
                              onPanelSessionStatus={recordLivePanelSessionStatus}
                              onSessionControlReadinessEvidence={recordSessionControlReadinessEvidence}
                              onSlashCommandExecutionEvidence={recordSlashCommandExecutionEvidence}
                              panelSessionIssue={panelSessionIdentityIssueByPanel.get(session.id)}
                              panelSessionRecord={panelSessionState[session.id]}
                              projectLabel={
                                projectLabelById.get(session.projectId) ??
                                registryByProject.get(session.projectId)?.workspaceLabel ??
                                session.projectId
                              }
                              session={session}
                            />
                          </AdaptivePanelFrame>
                        ) : null;
                      })
                    : visibleSessions.map((session) => (
                        <SessionCell
                          commandCatalog={commandCatalogSnapshot.catalog}
                          isFocused={session.id === focusedPanelId}
                          key={session.id}
                          liveCodexEnabled={codexTransportDecision.canStartSession}
                          onPanelSessionStart={recordLivePanelSessionStart}
                          onPanelSessionStatus={recordLivePanelSessionStatus}
                          onSessionControlReadinessEvidence={recordSessionControlReadinessEvidence}
                          onSlashCommandExecutionEvidence={recordSlashCommandExecutionEvidence}
                          panelSessionIssue={panelSessionIdentityIssueByPanel.get(session.id)}
                          panelSessionRecord={panelSessionState[session.id]}
                          projectLabel={
                            projectLabelById.get(session.projectId) ??
                            registryByProject.get(session.projectId)?.workspaceLabel ??
                            session.projectId
                          }
                          session={session}
                        />
                      ))}
                </div>
              </>
            ) : view === "pipeline" ? (
              <PipelineView
                items={projectPipelineItems}
                mockRuns={projectMockRuns}
                onOpenRun={(runId) => {
                  setSelectedRunId(runId);
                  updatePreferences({ view: "cockpit" });
                }}
                onStagePackage={handleStagePackage}
                project={project}
                registryEntry={registryEntry}
                runtimeAdapter={runtimeAdapter}
                tasks={projectTasks}
              />
            ) : (
              <PlanningView
                chatMessages={projectManagementChat}
                dispatchReviewRecords={projectDispatchReviewRecords}
                onChatMessagesChange={setProjectManagementChat}
                onStagePackage={handleStagePackage}
                onTasksChange={setProjectManagementTasks}
                project={project}
                projects={projects}
                tasks={projectManagementTasks}
              />
            )}
          </section>

          <RightPanel
            adaptiveHiddenPanelCount={hiddenAdaptivePanels.length}
            adaptivePanelCount={syncedAdaptiveLayout.panels.length}
            adaptiveVisiblePanelCount={visibleAdaptivePanels.length}
            catalogRefreshOwnerValidation={catalogRefreshOwnerValidation}
            isAdaptiveLayout={layout.kind === "adaptive"}
            layoutCapacity={cockpitLayoutCapacity}
            mode={mode}
            modeHandoff={cockpitModeHandoff}
            modeHandoffQa={cockpitModeHandoffQa}
            mockRuns={projectMockRuns}
            onAppNotice={setAppNotice}
            onRecordWorkerValidationAttempt={handleWorkerValidationAttempt}
            onExportPhase3ProofArtifact={exportPhase3ProofArtifact}
            onVerifyImportedPhase3ProofArtifact={verifyImportedPhase3ProofArtifact}
            onRecordPhase3OwnerHandoff={recordPhase3OwnerHandoff}
            onClearPhase3OwnerHandoff={clearPhase3OwnerHandoff}
            onRecordPhase3CommandValidation={recordPhase3CommandValidation}
            onImportPhase3CommandValidation={importPhase3CommandValidation}
            onImportPhase3SmokeProofBundle={importPhase3SmokeProofBundle}
            onLoadRecordedPhase3CommandValidation={loadRecordedPhase3CommandValidation}
            onLoadRecordedPhase3SmokeProofBundle={loadRecordedPhase3SmokeProofBundle}
            onLoadRecordedPhase3ProofArtifacts={loadRecordedPhase3ProofArtifacts}
            onClearPhase3CommandValidation={clearPhase3CommandValidation}
            onClearPhase11EvidenceRecord={clearPhase11EvidenceRecord}
            onImportPhase11EvidenceRecords={importPhase11EvidenceRecords}
            onRecordPhase11Evidence={recordPhase11Evidence}
            onSelectRun={setSelectedRunId}
            onUpdateRunStatus={handleRunStatusChange}
            project={project}
            phase4ProviderBlockerPriority={phase4ProviderBlockerPriority}
            phase4ProviderCatalogDepth={phase4ProviderCatalogDepth}
            phase4ProviderCompletionStatus={phase4ProviderCompletionStatus}
            phase4ProviderApprovalRecord={phase4ProviderApprovalRecord}
            phase4ProviderApprovalRecordEnabled={
              phase4RefreshSafetyDepth.blockedCount === 0 &&
              phase4RefreshSafetyDepth.previewCount === 0
            }
            phase4ProviderApprovalValidation={phase4ProviderApprovalValidation}
            phase4ProviderAuditRecord={phase4ProviderAuditRecord}
            phase4ProviderAuditRecordEnabled={
              phase4ProviderApprovalValidation.state === "ready" &&
              Boolean(phase4ProviderApprovalRecord)
            }
            phase4ProviderAuditValidation={phase4ProviderAuditValidation}
            phase4ProviderRollbackRecord={phase4ProviderRollbackRecord}
            phase4ProviderRollbackRecordEnabled={
              phase4ProviderAuditValidation.state === "ready" &&
              Boolean(phase4ProviderAuditRecord) &&
              Boolean(phase4ProviderApprovalRecord)
            }
            phase4ProviderRollbackValidation={phase4ProviderRollbackValidation}
            phase4ProviderPermissionRecord={phase4ProviderPermissionRecord}
            phase4ProviderPermissionRecordEnabled={
              phase4ProviderRollbackValidation.state === "ready" &&
              Boolean(phase4ProviderRollbackRecord) &&
              Boolean(phase4ProviderAuditRecord) &&
              Boolean(phase4ProviderApprovalRecord)
            }
            phase4ProviderPermissionValidation={phase4ProviderPermissionValidation}
            phase4ProviderReviewArtifactVerification={phase4ProviderReviewArtifactVerification}
            phase4RecordedArtifactLoadAvailable={hasPhase3RecordedArtifactLoadAccess()}
            phase4ProviderTraceability={phase4ProviderTraceability}
            phase4ProviderSurfaceDepth={phase4ProviderSurfaceDepth}
            importedPhase4ProviderReviewArtifactVerification={
              importedPhase4ProviderReviewArtifactVerification
            }
            providerIntegrationReadiness={providerIntegrationReadiness}
            registryEntry={registryEntry}
            registrySummary={registrySummary}
            runtimeAdapter={runtimeAdapter}
            runtimeProfileSummary={runtimeProfileSummary}
            runtimeSummary={runtimeSummary}
            selectedDispatchReviewRecord={selectedDispatchReviewRecord}
            selectedRun={selectedRun}
            phasePriorityEvidence={phasePriorityEvidence}
            phase3ClearanceBlockerPriority={phase3ClearanceBlockerPriority}
            phase3ClearanceCompletionStatus={phase3ClearanceCompletionStatus}
            phase3ClearanceTraceability={phase3ClearanceTraceability}
            phase3ClearanceTraceabilityPrecondition={phase3ClearanceTraceabilityPrecondition}
            phase3ClearanceCommandPlan={phase3ClearanceCommandPlan}
            phase3ClearancePackage={phase3ClearancePackage}
            phase3ExitGateEvidence={phase3ExitGateEvidence}
            phase3HandoffGate={phase3HandoffGate}
            phase3OwnerHandoffRecord={phase3OwnerHandoffRecord}
            phase3CommandValidationRecord={phase3CommandValidationRecord}
            phase3CommandValidationRecordValidation={phase3CommandValidationRecordValidation}
            importedPhase3ProofExportVerification={importedPhase3ProofExportVerification}
            phase3ProofExportVerification={phase3ProofExportVerification}
            phase3OwnerTestingActions={phase3OwnerTestingDisplayActions}
            phase3SmokeProofReadiness={phase3SmokeProofReadiness}
            phase3RecordedArtifactLoadAvailable={hasPhase3RecordedArtifactLoadAccess()}
            phase11EvidenceEvaluationTime={phase11EvidenceEvaluationTime}
            phase11EvidenceRecordInputs={phase11EvidenceRecordInputs}
            projectManagementTasks={projectManagementTasks}
            sessionControlOwnerTestingState={sessionControlOwnerTestingState}
            sessionControlReadinessEvidence={sessionControlReadinessEvidence}
            slashCommandExecutionEvidence={slashCommandExecutionEvidence}
            slashCommandOwnerTestingState={slashCommandOwnerTestingState}
            focusedPanelId={focusedPanelId}
            onFocusPanel={setFocusedPanelId}
            onRunCodexActiveTurnControlSmokeProof={runCodexActiveTurnControlSmokeProof}
            onRunCodexActiveTurnSteerSmokeProof={runCodexActiveTurnSteerSmokeProof}
            onRunCodexLiveSmokeProof={runCodexLiveSmokeProof}
            onRunCodexLiveControlSmokeProof={runCodexLiveControlSmokeProof}
            onRunCodexTwoPanelSmokeProof={runCodexTwoPanelSmokeProof}
            onRecordPhase4ProviderApproval={recordPhase4ProviderApproval}
            onClearPhase4ProviderApproval={clearPhase4ProviderApproval}
            onRecordPhase4ProviderAudit={recordPhase4ProviderAudit}
            onClearPhase4ProviderAudit={clearPhase4ProviderAudit}
            onRecordPhase4ProviderRollback={recordPhase4ProviderRollback}
            onClearPhase4ProviderRollback={clearPhase4ProviderRollback}
            onRecordPhase4ProviderPermission={recordPhase4ProviderPermission}
            onClearPhase4ProviderPermission={clearPhase4ProviderPermission}
            onExportPhase4ProviderReviewArtifact={exportPhase4ProviderReviewArtifact}
            onLoadRecordedPhase4ProviderReviewArtifact={
              loadRecordedPhase4ProviderReviewArtifact
            }
            onVerifyImportedPhase4ProviderReviewArtifact={
              verifyImportedPhase4ProviderReviewArtifact
            }
            codexCanStartSession={codexTransportDecision.canStartSession}
            codexLiveSmokeLoading={codexLiveSmokeLoading}
            codexTwoPanelSmokeLoading={codexTwoPanelSmokeLoading}
            sessions={visibleSessions}
            tasks={projectTasks}
          />
        </div>
      </section>
      {appDialog ? (
        <AppDialogSurface
          commandCatalogSnapshot={commandCatalogSnapshot}
          automationCatalogLoading={automationCatalogLoading}
          automationCatalogSnapshot={automationCatalogSnapshot}
          personalizationCatalogLoading={personalizationCatalogLoading}
          personalizationCatalogSnapshot={personalizationCatalogSnapshot}
          codexConnectionRequested={codexConnectionRequested}
          codexLiveSmokeLoading={codexLiveSmokeLoading}
          codexLiveSmokeProof={codexLiveSmokeProof}
          codexActiveTurnControlSmokeLoading={codexActiveTurnControlSmokeLoading}
          codexActiveTurnControlSmokeProof={codexActiveTurnControlSmokeProof}
          codexActiveTurnSteerSmokeLoading={codexActiveTurnSteerSmokeLoading}
          codexActiveTurnSteerSmokeProof={codexActiveTurnSteerSmokeProof}
          codexLiveControlSmokeLoading={codexLiveControlSmokeLoading}
          codexLiveControlSmokeProof={codexLiveControlSmokeProof}
          codexTwoPanelSmokeLoading={codexTwoPanelSmokeLoading}
          codexTwoPanelSmokeProof={codexTwoPanelSmokeProof}
          catalogRefreshProviderSmokeLoading={catalogRefreshProviderSmokeLoading}
          catalogRefreshProviderSmokeProof={catalogRefreshProviderSmokeProof}
          phase4CatalogProofEvaluationTime={phase4CatalogProofEvaluationTime}
          phase4CurrentCatalogFingerprint={phase4CurrentCatalogFingerprint}
          codexTransportDecision={codexTransportDecision}
          codexTransportLoading={codexTransportLoading}
          dialog={appDialog}
          migrationHardeningReadiness={migrationHardeningReadiness}
          migrationPreview={migrationPreview}
          migrationPreviewLoading={migrationPreviewLoading}
          migrationProfileDraft={migrationProfileDraft}
          migrationProfileDraftHistory={migrationProfileDraftHistory}
          migrationProfileDraftHistorySummary={migrationProfileDraftHistorySummary}
          migrationOwnerApprovalRecord={migrationOwnerApprovalRecord}
          migrationDraftActionNotice={migrationProfileDraftActionNotice}
          migrationSourceId={migrationSourceId}
          migrationSourcePreview={migrationSourcePreview}
          mcpCatalogLoading={mcpCatalogLoading}
          mcpCatalogSnapshot={mcpCatalogSnapshot}
          onCreateMigrationProfileDraft={handleCreateMigrationProfileDraft}
          onClearMigrationOwnerApproval={handleClearMigrationOwnerApproval}
          onRecordMigrationOwnerApproval={handleRecordMigrationOwnerApproval}
          onRollbackLatestMigrationProfileDraft={handleRollbackLatestMigrationProfileDraft}
          onStageMigrationApplyIntent={handleStageMigrationApplyIntent}
          onMigrationCategoryChange={handleMigrationCategoryChange}
          onMigrationSourceChange={handleMigrationSourceChange}
          onClose={() => setAppDialog(undefined)}
          onRefreshCommandCatalog={refreshCommandCatalogSnapshot}
          onRefreshAutomationCatalog={refreshAutomationCatalogSnapshot}
          onRefreshCodexTransport={refreshCodexTransportProbe}
          onRefreshMcpCatalog={refreshMcpCatalogSnapshot}
          onRefreshMigrationPreview={() => refreshMigrationSourcePreview()}
          onRefreshPluginCatalog={refreshPluginCatalogSnapshot}
          onRefreshPersonalizationCatalog={refreshPersonalizationCatalogSnapshot}
          onRefreshSkillCatalog={refreshSkillCatalogSnapshot}
          onRunCodexLiveSmokeProof={runCodexLiveSmokeProof}
          onRunCodexActiveTurnControlSmokeProof={runCodexActiveTurnControlSmokeProof}
          onRunCodexActiveTurnSteerSmokeProof={runCodexActiveTurnSteerSmokeProof}
          onRunCodexLiveControlSmokeProof={runCodexLiveControlSmokeProof}
          onRunCodexTwoPanelSmokeProof={runCodexTwoPanelSmokeProof}
          onRunCatalogRefreshProviderSmokeProof={runCatalogRefreshProviderSmokeProof}
          onSelectReviewableMigrationCategories={handleSelectReviewableMigrationCategories}
          onStageCodexConnection={handleStageCodexConnection}
          pluginCatalogLoading={pluginCatalogLoading}
          pluginCatalogSnapshot={pluginCatalogSnapshot}
          skillCatalogLoading={skillCatalogLoading}
          skillCatalogSnapshot={skillCatalogSnapshot}
        />
      ) : null}
    </main>
  );
}

function AppMenuBar({
  activeMenu,
  appNotice,
  codexConnectionRequested,
  currentView,
  onAdaptiveView,
  onAddDraft,
  onOpenDialog,
  onSwitchView,
  onToggleMenu
}: {
  activeMenu?: AppMenuId;
  appNotice: string;
  codexConnectionRequested: boolean;
  currentView: WorkspacePreferences["view"];
  onAdaptiveView: () => void;
  onAddDraft: () => void;
  onOpenDialog: (dialog: AppDialog) => void;
  onSwitchView: (view: WorkspacePreferences["view"]) => void;
  onToggleMenu: (menuId: AppMenuId) => void;
}) {
  return (
    <header className="app-menu-bar" aria-label="Application menu">
      <div className="app-menu-left">
        <strong className="app-menu-brand">Steerboard</strong>
        <div className="app-menu-items" role="menubar" aria-label="Steerboard menus">
          {(["file", "view", "connect", "help"] as AppMenuId[]).map((menuId) => (
            <div className="app-menu-item" key={menuId}>
              <button
                aria-expanded={activeMenu === menuId}
                aria-haspopup="menu"
                className={classNames(activeMenu === menuId && "is-active")}
                onClick={() => onToggleMenu(menuId)}
                type="button"
              >
                {menuId === "file" ? "File" : menuId === "view" ? "View" : menuId === "connect" ? "Connect" : "Help"}
              </button>
              {activeMenu === menuId ? (
                <div className="app-menu-dropdown" role="menu">
                  {menuId === "file" ? (
                    <>
                      <button
                        onClick={() => {
                          onAddDraft();
                          onToggleMenu("file");
                        }}
                        role="menuitem"
                        type="button"
                      >
                        New planning draft
                      </button>
                      <button onClick={() => onOpenDialog("migration")} role="menuitem" type="button">
                        Migrate settings...
                      </button>
                    </>
                  ) : null}
                  {menuId === "view" ? (
                    <>
                      <button
                        className={classNames(currentView === "cockpit" && "is-selected")}
                        onClick={() => onSwitchView("cockpit")}
                        role="menuitem"
                        type="button"
                      >
                        Arena
                      </button>
                      <button
                        className={classNames(currentView === "pipeline" && "is-selected")}
                        onClick={() => onSwitchView("pipeline")}
                        role="menuitem"
                        type="button"
                      >
                        Pipeline
                      </button>
                      <button
                        className={classNames(currentView === "planning" && "is-selected")}
                        onClick={() => onSwitchView("planning")}
                        role="menuitem"
                        type="button"
                      >
                        Planning
                      </button>
                      <button onClick={onAdaptiveView} role="menuitem" type="button">
                        Use Adaptive Arena
                      </button>
                    </>
                  ) : null}
                  {menuId === "connect" ? (
                    <>
                      <button onClick={() => onOpenDialog("connection")} role="menuitem" type="button">
                        Codex connection...
                      </button>
                      <button onClick={() => onOpenDialog("plugins")} role="menuitem" type="button">
                        Plugins
                      </button>
                      <button onClick={() => onOpenDialog("mcp")} role="menuitem" type="button">
                        MCP servers
                      </button>
                      <button onClick={() => onOpenDialog("personalization")} role="menuitem" type="button">
                        Personalization
                      </button>
                      <span className="app-menu-note" role="presentation">
                        {codexConnectionRequested ? "Connection request staged" : "Local preview, execution locked"}
                      </span>
                    </>
                  ) : null}
                  {menuId === "help" ? (
                    <>
                      <button onClick={() => onOpenDialog("slash-help")} role="menuitem" type="button">
                        Slash commands
                      </button>
                      <button onClick={() => onOpenDialog("skills")} role="menuitem" type="button">
                        Skills
                      </button>
                      <span className="app-menu-note" role="presentation">
                        Commands are scoped to the active panel.
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="app-menu-status" aria-live="polite">
        {codexConnectionRequested ? <Link2 size={14} /> : <Link2Off size={14} />}
        <span>{appNotice}</span>
      </div>
    </header>
  );
}

export function MigrationReviewGatePanel({
  migrationHardeningReadiness,
  migrationOwnerApprovalRecord
}: {
  migrationHardeningReadiness: MigrationHardeningReadiness;
  migrationOwnerApprovalRecord?: MigrationOwnerApprovalRecord;
}) {
  const migrationTraceability = buildMigrationTraceabilitySummary({
    readiness: migrationHardeningReadiness
  });
  const migrationBlockerPriority = buildMigrationBlockerPriority({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability
  });
  const migrationApplyDecisionGate = buildMigrationApplyDecisionGate({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability,
    blockerPriority: migrationBlockerPriority
  });
  const migrationOwnerApprovalHandoff = buildMigrationOwnerApprovalHandoff({
    applyDecisionGate: migrationApplyDecisionGate,
    ownerApprovalRecord: migrationOwnerApprovalRecord
  });
  const migrationApplyImplementationBoundary = buildMigrationApplyImplementationBoundary({
    ownerApprovalHandoff: migrationOwnerApprovalHandoff,
    ownerApprovalRecord: migrationOwnerApprovalRecord
  });
  const phase5MigrationCompletionGate = buildPhase5MigrationCompletionGate({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability,
    blockerPriority: migrationBlockerPriority,
    applyDecision: migrationApplyDecisionGate,
    ownerApprovalHandoff: migrationOwnerApprovalHandoff,
    applyImplementationBoundary: migrationApplyImplementationBoundary
  });
  const phase5ProfileActivationGate = buildPhase5ProfileActivationGate(
    phase5MigrationCompletionGate,
    migrationApplyImplementationBoundary
  );

  return (
    <div
      aria-label={`Migration hardening gate ${migrationHardeningReadiness.statusLabel}; ${migrationHardeningReadiness.readiness}% ready. ${migrationHardeningReadiness.nextAction}`}
      className={classNames(
        "migration-review-gate",
        `migration-review-gate-${migrationHardeningReadiness.state}`
      )}
      title={migrationHardeningReadiness.safety}
    >
      <div className="migration-review-gate-header">
        <strong>Migration review gate</strong>
        <span>{migrationHardeningReadiness.statusLabel}</span>
      </div>
      <div className="migration-review-gate-summary">
        <span>
          <strong>{migrationHardeningReadiness.readiness}%</strong>
          Ready
        </span>
        <span>
          <strong>{migrationHardeningReadiness.applyIntentLabel}</strong>
          Apply intent
        </span>
        <span>
          <strong>{migrationHardeningReadiness.canRollback ? "Ready" : "Waiting"}</strong>
          Rollback
        </span>
        <span>
          <strong>{migrationHardeningReadiness.openReviewRecordCount}</strong>
          Open review
        </span>
      </div>
      <p>{migrationHardeningReadiness.nextAction}</p>
      <small>{migrationHardeningReadiness.migrationReviewDepthProof}</small>
      <ol className="migration-review-depth-list" aria-label="Migration review depth records">
        {migrationHardeningReadiness.reviewDepthItems.map((item) => (
          <li className={`migration-review-depth-${item.status}`} key={item.id} title={`${item.detail} ${item.evidence} ${item.nextAction}`}>
            <span>{item.kind}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.pmTaskId} / {item.evidenceKey}</small>
              <em>{item.evidence}</em>
              <small>{item.nextAction}</small>
            </div>
            <b>{item.status}</b>
          </li>
        ))}
      </ol>
      <div className="migration-traceability" aria-label={migrationTraceability.ariaLabel}>
        <div className="migration-traceability-header">
          <strong>{migrationTraceability.label}</strong>
          <span>
            {migrationTraceability.statusLabel} / {migrationTraceability.readiness}%
          </span>
        </div>
        <ol className="migration-traceability-list" aria-label="Migration traceability records">
          {migrationTraceability.items.map((item) => (
            <li
              className={`migration-traceability-${item.status}`}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.status}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.kind}</b>
            </li>
          ))}
        </ol>
        <small>{migrationTraceability.migrationTraceabilityProof}</small>
      </div>
      <div
        aria-label={migrationBlockerPriority.ariaLabel}
        className={classNames(
          "migration-blocker-priority",
          `migration-blocker-priority-${migrationBlockerPriority.state}`
        )}
        title={migrationBlockerPriority.safety}
      >
        <div className="migration-blocker-priority-header">
          <strong>{migrationBlockerPriority.label}</strong>
          <span>
            {migrationBlockerPriority.metadataReviewCanAddressTopBlocker
              ? "Metadata review"
              : migrationBlockerPriority.openBlockerCount > 0
                ? "Owner action"
                : "Ready"}
          </span>
        </div>
        <p title={migrationBlockerPriority.topPriorityAction}>
          {migrationBlockerPriority.topPriorityLabel}
        </p>
        <dl
          aria-label="Migration blocker priority counts"
          className="migration-blocker-priority-grid"
        >
          <div>
            <dt>Open</dt>
            <dd>{migrationBlockerPriority.openBlockerCount}</dd>
          </div>
          <div>
            <dt>Reviewable</dt>
            <dd>{migrationBlockerPriority.metadataReviewAddressableCount}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{migrationBlockerPriority.statusLabel}</dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{migrationBlockerPriority.readiness}%</dd>
          </div>
        </dl>
        <ol
          aria-label="Migration blocker priority rows"
          className="migration-blocker-priority-list"
        >
          {migrationBlockerPriority.items.length > 0 ? (
            migrationBlockerPriority.items.map((item) => (
              <li
                className={`migration-blocker-priority-item-${item.status}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>#{item.priority}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.nextAction}</small>
                </div>
                <b>{item.kind}</b>
              </li>
            ))
          ) : (
            <li className="migration-blocker-priority-item-ready">
              <span>OK</span>
              <div>
                <strong>No open migration blocker</strong>
                <small>{migrationBlockerPriority.nextAction}</small>
              </div>
              <b>ready</b>
            </li>
          )}
        </ol>
        <small>{migrationBlockerPriority.migrationBlockerPriorityProof}</small>
      </div>
      <div
        aria-label={migrationApplyDecisionGate.ariaLabel}
        className={classNames(
          "migration-apply-decision",
          `migration-apply-decision-${migrationApplyDecisionGate.state}`
        )}
        title={migrationApplyDecisionGate.safety}
      >
        <div className="migration-apply-decision-header">
          <strong>{migrationApplyDecisionGate.label}</strong>
          <span>{migrationApplyDecisionGate.statusLabel}</span>
        </div>
        <dl
          aria-label="Migration apply decision locks"
          className="migration-apply-decision-grid"
        >
          <div>
            <dt>Stage review</dt>
            <dd>{migrationApplyDecisionGate.canStageApplyReview ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Apply</dt>
            <dd>{migrationApplyDecisionGate.canApplyMigration ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Profile</dt>
            <dd>{migrationApplyDecisionGate.profileActivationLocked ? "Locked" : "Open"}</dd>
          </div>
          <div>
            <dt>Approval</dt>
            <dd>{migrationApplyDecisionGate.ownerApprovalRequired ? "Required" : "Clear"}</dd>
          </div>
        </dl>
        <p>{migrationApplyDecisionGate.nextAction}</p>
        <small>{migrationApplyDecisionGate.migrationApplyDecisionProof}</small>
      </div>
      <div
        aria-label={migrationOwnerApprovalHandoff.ariaLabel}
        className={classNames(
          "migration-owner-approval-handoff",
          `migration-owner-approval-handoff-${migrationOwnerApprovalHandoff.state}`
        )}
        title={migrationOwnerApprovalHandoff.safety}
      >
        <div className="migration-owner-approval-handoff-header">
          <strong>{migrationOwnerApprovalHandoff.label}</strong>
          <span>{migrationOwnerApprovalHandoff.statusLabel}</span>
        </div>
        <dl
          aria-label="Migration owner approval handoff locks"
          className="migration-owner-approval-handoff-grid"
        >
          <div>
            <dt>Request</dt>
            <dd>{migrationOwnerApprovalHandoff.canRequestOwnerApproval ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Recorded</dt>
            <dd>{migrationOwnerApprovalHandoff.ownerApprovalRecorded ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Apply</dt>
            <dd>{migrationOwnerApprovalHandoff.canApplyMigration ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Profile</dt>
            <dd>{migrationOwnerApprovalHandoff.profileActivationLocked ? "Locked" : "Open"}</dd>
          </div>
        </dl>
        <p>{migrationOwnerApprovalHandoff.nextAction}</p>
        <small>{migrationOwnerApprovalHandoff.migrationOwnerApprovalHandoffProof}</small>
      </div>
      <div
        aria-label={migrationApplyImplementationBoundary.ariaLabel}
        className={classNames(
          "migration-apply-implementation-boundary",
          `migration-apply-implementation-boundary-${migrationApplyImplementationBoundary.state}`
        )}
        title={migrationApplyImplementationBoundary.safety}
      >
        <div className="migration-apply-implementation-boundary-header">
          <strong>{migrationApplyImplementationBoundary.label}</strong>
          <span>{migrationApplyImplementationBoundary.statusLabel}</span>
        </div>
        <dl
          aria-label="Migration apply implementation boundary locks"
          className="migration-apply-implementation-boundary-grid"
        >
          <div>
            <dt>Enter</dt>
            <dd>{migrationApplyImplementationBoundary.canEnterApplyImplementation ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Executor</dt>
            <dd>{migrationApplyImplementationBoundary.executorAvailable ? "Ready" : "Missing"}</dd>
          </div>
          <div>
            <dt>Apply</dt>
            <dd>{migrationApplyImplementationBoundary.canApplyMigration ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Mutation</dt>
            <dd>{migrationApplyImplementationBoundary.sourceMutationLocked ? "Locked" : "Open"}</dd>
          </div>
        </dl>
        <p>{migrationApplyImplementationBoundary.nextAction}</p>
        <small>{migrationApplyImplementationBoundary.applyImplementationBoundaryProof}</small>
      </div>
      <div
        aria-label={phase5MigrationCompletionGate.ariaLabel}
        className={classNames(
          "migration-completion-gate",
          `migration-completion-gate-${phase5MigrationCompletionGate.state}`
        )}
        title={phase5MigrationCompletionGate.detail}
      >
        <div className="migration-completion-gate-header">
          <strong>Phase 5 migration completion gate</strong>
          <span>{phase5MigrationCompletionGate.statusLabel}</span>
        </div>
        <dl className="migration-completion-gate-grid" aria-label="Phase 5 migration completion gate counts">
          <div>
            <dt>Complete</dt>
            <dd>{phase5MigrationCompletionGate.phaseComplete ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Review-only</dt>
            <dd>{phase5MigrationCompletionGate.reviewOnlyComplete ? "Done" : "Held"}</dd>
          </div>
          <div>
            <dt>Apply</dt>
            <dd>{phase5MigrationCompletionGate.canApplyMigration ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Executor</dt>
            <dd>{phase5MigrationCompletionGate.executorAvailable ? "Ready" : "Missing"}</dd>
          </div>
        </dl>
        <p>{phase5MigrationCompletionGate.nextAction}</p>
        <small>{phase5MigrationCompletionGate.completionGateProof}</small>
      </div>
      <MigrationProfileActivationGateSummary gate={phase5ProfileActivationGate} />
      <ol className="migration-review-gate-list" aria-label="Migration hardening evidence">
        {migrationHardeningReadiness.items.map((item) => (
          <li className={`migration-review-item-${item.status}`} key={item.id} title={item.detail}>
            <strong>{item.label}</strong>
            <span>{item.status}</span>
            <small>{item.detail}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MigrationProfileActivationGateSummary({
  gate
}: {
  gate: Phase5ProfileActivationGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "migration-profile-activation-gate",
        `migration-profile-activation-gate-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="migration-profile-activation-gate-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
      </div>
      <dl
        aria-label="Phase 5 profile activation gate locks"
        className="migration-profile-activation-gate-grid"
      >
        <div>
          <dt>Activate</dt>
          <dd>{gate.canActivateProfile ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{gate.ownerActivationApprovalRecorded ? "Recorded" : "Required"}</dd>
        </div>
        <div>
          <dt>Handler</dt>
          <dd>{gate.profileActivationHandlerReady ? "Ready" : "Missing"}</dd>
        </div>
        <div>
          <dt>Apply</dt>
          <dd>{gate.applyMigrationLocked ? "Locked" : "Open"}</dd>
        </div>
      </dl>
      <p>{gate.nextAction}</p>
      <small>{gate.profileActivationGateProof}</small>
    </div>
  );
}

function AppDialogSurface({
  commandCatalogSnapshot,
  automationCatalogLoading,
  automationCatalogSnapshot,
  personalizationCatalogLoading,
  personalizationCatalogSnapshot,
  codexConnectionRequested,
  codexLiveSmokeLoading,
  codexLiveSmokeProof,
  codexActiveTurnControlSmokeLoading,
  codexActiveTurnControlSmokeProof,
  codexActiveTurnSteerSmokeLoading,
  codexActiveTurnSteerSmokeProof,
  codexLiveControlSmokeLoading,
  codexLiveControlSmokeProof,
  codexTwoPanelSmokeLoading,
  codexTwoPanelSmokeProof,
  catalogRefreshProviderSmokeLoading,
  catalogRefreshProviderSmokeProof,
  phase4CatalogProofEvaluationTime,
  phase4CurrentCatalogFingerprint,
  codexTransportDecision,
  codexTransportLoading,
  dialog,
  migrationPreview,
  migrationPreviewLoading,
  migrationHardeningReadiness,
  migrationProfileDraft,
  migrationProfileDraftHistory,
  migrationProfileDraftHistorySummary,
  migrationOwnerApprovalRecord,
  migrationDraftActionNotice,
  migrationSourceId,
  migrationSourcePreview,
  mcpCatalogLoading,
  mcpCatalogSnapshot,
  onCreateMigrationProfileDraft,
  onClearMigrationOwnerApproval,
  onRecordMigrationOwnerApproval,
  onRollbackLatestMigrationProfileDraft,
  onStageMigrationApplyIntent,
  onMigrationCategoryChange,
  onMigrationSourceChange,
  onClose,
  onRefreshCommandCatalog,
  onRefreshAutomationCatalog,
  onRefreshCodexTransport,
  onRefreshMcpCatalog,
  onRefreshMigrationPreview,
  onRefreshPluginCatalog,
  onRefreshPersonalizationCatalog,
  onRefreshSkillCatalog,
  onRunCodexLiveSmokeProof,
  onRunCodexActiveTurnControlSmokeProof,
  onRunCodexActiveTurnSteerSmokeProof,
  onRunCodexLiveControlSmokeProof,
  onRunCodexTwoPanelSmokeProof,
  onRunCatalogRefreshProviderSmokeProof,
  onSelectReviewableMigrationCategories,
  onStageCodexConnection,
  pluginCatalogLoading,
  pluginCatalogSnapshot,
  skillCatalogLoading,
  skillCatalogSnapshot
}: {
  commandCatalogSnapshot: CommandCatalogSnapshot;
  automationCatalogLoading: boolean;
  automationCatalogSnapshot: AutomationCatalogSnapshot;
  personalizationCatalogLoading: boolean;
  personalizationCatalogSnapshot: PersonalizationCatalogSnapshot;
  codexConnectionRequested: boolean;
  codexLiveSmokeLoading: boolean;
  codexLiveSmokeProof: CodexLiveSmokeProof;
  codexActiveTurnControlSmokeLoading: boolean;
  codexActiveTurnControlSmokeProof: CodexActiveTurnControlSmokeProof;
  codexActiveTurnSteerSmokeLoading: boolean;
  codexActiveTurnSteerSmokeProof: CodexActiveTurnSteerSmokeProof;
  codexLiveControlSmokeLoading: boolean;
  codexLiveControlSmokeProof: CodexLiveControlSmokeProof;
  codexTwoPanelSmokeLoading: boolean;
  codexTwoPanelSmokeProof: CodexTwoPanelSmokeProof;
  catalogRefreshProviderSmokeLoading: boolean;
  catalogRefreshProviderSmokeProof: CatalogRefreshProviderSmokeResult;
  phase4CatalogProofEvaluationTime: string;
  phase4CurrentCatalogFingerprint: string;
  codexTransportDecision: CodexTransportDecision;
  codexTransportLoading: boolean;
  dialog: AppDialog;
  migrationPreview: MigrationPreview;
  migrationPreviewLoading: boolean;
  migrationHardeningReadiness: MigrationHardeningReadiness;
  migrationProfileDraft?: MigrationProfileDraft;
  migrationProfileDraftHistory: MigrationProfileDraftHistoryRecord[];
  migrationProfileDraftHistorySummary: MigrationProfileDraftHistorySummary;
  migrationOwnerApprovalRecord?: MigrationOwnerApprovalRecord;
  migrationDraftActionNotice?: string;
  migrationSourceId: MigrationSourceId;
  migrationSourcePreview: MigrationSourcePreviewPayload;
  mcpCatalogLoading: boolean;
  mcpCatalogSnapshot: McpCatalogSnapshot;
  onCreateMigrationProfileDraft: () => void;
  onClearMigrationOwnerApproval: () => void;
  onRecordMigrationOwnerApproval: () => void;
  onRollbackLatestMigrationProfileDraft: () => void;
  onStageMigrationApplyIntent: () => void;
  onMigrationCategoryChange: (categoryId: MigrationCategoryId, selected: boolean) => void;
  onMigrationSourceChange: (sourceId: MigrationSourceId) => void;
  onClose: () => void;
  onRefreshCommandCatalog: () => void;
  onRefreshAutomationCatalog: () => void;
  onRefreshCodexTransport: () => void;
  onRefreshMcpCatalog: () => void;
  onRefreshMigrationPreview: () => void;
  onRefreshPluginCatalog: () => void;
  onRefreshPersonalizationCatalog: () => void;
  onRefreshSkillCatalog: () => void;
  onRunCodexLiveSmokeProof: () => void;
  onRunCodexActiveTurnControlSmokeProof: () => void;
  onRunCodexActiveTurnSteerSmokeProof: () => void;
  onRunCodexLiveControlSmokeProof: () => void;
  onRunCodexTwoPanelSmokeProof: () => void;
  onRunCatalogRefreshProviderSmokeProof: () => void;
  onSelectReviewableMigrationCategories: () => void;
  onStageCodexConnection: () => void;
  pluginCatalogLoading: boolean;
  pluginCatalogSnapshot: PluginCatalogSnapshot;
  skillCatalogLoading: boolean;
  skillCatalogSnapshot: SkillCatalogSnapshot;
}) {
  const platformCatalogView = getPlatformCatalogView(
    dialog,
    automationCatalogSnapshot,
    mcpCatalogSnapshot,
    personalizationCatalogSnapshot,
    pluginCatalogSnapshot,
    skillCatalogSnapshot
  );
  const migrationCounts = buildMigrationPreviewCounts(migrationPreview);
  const selectedCategoryCount = migrationPreview.categories.filter((category) => category.selected).length;
  const migrationProfileDraftHistoryLatestAudit = migrationProfileDraftHistory[0]?.audit;
  const migrationTraceability = buildMigrationTraceabilitySummary({
    readiness: migrationHardeningReadiness
  });
  const migrationBlockerPriority = buildMigrationBlockerPriority({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability
  });
  const migrationApplyDecisionGate = buildMigrationApplyDecisionGate({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability,
    blockerPriority: migrationBlockerPriority
  });
  const migrationOwnerApprovalHandoff = buildMigrationOwnerApprovalHandoff({
    applyDecisionGate: migrationApplyDecisionGate,
    ownerApprovalRecord: migrationOwnerApprovalRecord
  });
  const migrationApplyImplementationBoundary = buildMigrationApplyImplementationBoundary({
    ownerApprovalHandoff: migrationOwnerApprovalHandoff,
    ownerApprovalRecord: migrationOwnerApprovalRecord
  });
  const phase5MigrationCompletionGate = buildPhase5MigrationCompletionGate({
    readiness: migrationHardeningReadiness,
    traceability: migrationTraceability,
    blockerPriority: migrationBlockerPriority,
    applyDecision: migrationApplyDecisionGate,
    ownerApprovalHandoff: migrationOwnerApprovalHandoff,
    applyImplementationBoundary: migrationApplyImplementationBoundary
  });
  const phase5ProfileActivationGate = buildPhase5ProfileActivationGate(
    phase5MigrationCompletionGate,
    migrationApplyImplementationBoundary
  );
  const catalogRefreshSafetyDepth = buildPhase4RefreshSafetyDepth(
    catalogRefreshProviderSmokeProof,
    {
      evaluatedAt: phase4CatalogProofEvaluationTime,
      expectedCatalogFingerprint: phase4CurrentCatalogFingerprint
    }
  );
  const title =
    dialog === "connection"
      ? "Codex Connection"
      : dialog === "migration"
        ? "Migration Preview"
        : dialog === "slash-help"
          ? "Slash Commands"
          : platformCatalogView?.title ?? "Platform Catalog";

  return (
    <div className="app-dialog-backdrop" role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="app-dialog"
        role="dialog"
      >
        <header>
          <div>
            <span className="eyebrow">{platformCatalogView?.eyebrow ?? "Local setup"}</span>
            <h3>{title}</h3>
          </div>
          <button aria-label="Close dialog" onClick={onClose} type="button">
            Close
          </button>
        </header>

        {dialog === "connection" ? (
          <div className="app-dialog-body">
            <div className="connection-summary">
              <ShieldCheck size={18} />
              <div>
                <span className={classNames("transport-state-pill", `transport-${codexTransportDecision.state}`)}>
                  {transportStatusLabel(codexTransportDecision.state)}
                </span>
                <strong>{codexConnectionRequested ? "Connection request staged" : "Codex transport spike"}</strong>
                <p>{codexTransportDecision.summary}</p>
              </div>
            </div>
            <div className="transport-proof-grid" aria-label="Codex transport proof">
              <span>Preferred transport</span>
              <strong>{codexTransportDecision.preferredTransport}</strong>
              <span>Proof level</span>
              <strong>{codexTransportDecision.proof}</strong>
              <span>Can start session</span>
              <strong>{codexTransportDecision.canStartSession ? "Yes" : "No"}</strong>
              <span>Can send prompt</span>
              <strong>{codexTransportDecision.canSendPanelMessage ? "Yes" : "Locked"}</strong>
            </div>
            <div className="connection-checks" aria-label="Codex connection readiness">
              {codexTransportDecision.evidence.map((item) => (
                <span className={`is-${item.status}`} key={item.id} title={item.detail}>
                  {item.label}
                </span>
              ))}
            </div>
            <div className="transport-live-proof" aria-label="Codex live smoke proof">
              <span>Live smoke</span>
              <strong>{codexLiveSmokeProof.ok ? "Passed" : codexLiveSmokeProof.executed ? "Failed" : "Not run"}</strong>
              <small>
                {codexLiveSmokeProof.executed
                  ? `${codexLiveSmokeProof.agentDeltaMethodSeen ? "Delta seen" : "No delta"}; ${codexLiveSmokeProof.turnCompletedSeen ? "turn completed" : "turn incomplete"}`
                  : "Runs one tiny explicit Codex turn with read-only sandbox."}
              </small>
            </div>
            <div className="transport-live-proof" aria-label="Codex control smoke proof">
              <span>Control smoke</span>
              <strong>
                {codexLiveControlSmokeProof.ok
                  ? "Passed"
                  : codexLiveControlSmokeProof.unsupported
                    ? "Unsupported"
                    : codexLiveControlSmokeProof.executed
                    ? "Failed"
                    : "Not run"}
              </strong>
              <small>
                {codexLiveControlSmokeProof.executed
                  ? `${codexLiveControlSmokeProof.supportedMethodCount}/${codexLiveControlSmokeProof.totalMethodCount} controls; ${codexLiveControlSmokeProof.protocolReady ? "protocol ready" : codexLiveControlSmokeProof.appServerReady ? "protocol issue" : "app-server not ready"}`
                  : "Checks live control protocol readiness without workspace mutation."}
              </small>
            </div>
            <div className="transport-live-proof" aria-label="Codex active-turn control smoke proof">
              <span>Active-turn interrupt</span>
              <strong>
                {codexActiveTurnControlSmokeProof.ok
                  ? "Passed"
                  : codexActiveTurnControlSmokeProof.unsupported
                    ? "Unsupported"
                    : codexActiveTurnControlSmokeProof.executed
                    ? "Failed"
                    : "Not run"}
              </strong>
              <small>
                {codexActiveTurnControlSmokeProof.executed
                  ? `${codexActiveTurnControlSmokeProof.completed ? "Completed" : "Incomplete"}; ${codexActiveTurnControlSmokeProof.interruptObserved ? "interrupt observed" : codexActiveTurnControlSmokeProof.interruptSent ? "interrupt sent" : "interrupt not observed"}; ${codexActiveTurnControlSmokeProof.controls.length} controls`
                  : "Checks active-turn interrupt and completion flow for an explicit read-only run."}
              </small>
            </div>
            <div className="transport-live-proof" aria-label="Codex active-turn steer smoke proof">
              <span>Active-turn steer</span>
              <strong>
                {codexActiveTurnSteerSmokeProof.ok
                  ? "Passed"
                  : codexActiveTurnSteerSmokeProof.unsupported
                    ? "Unsupported"
                    : codexActiveTurnSteerSmokeProof.executed
                    ? "Failed"
                    : "Not run"}
              </strong>
              <small>
                {codexActiveTurnSteerSmokeProof.executed
                  ? `${codexActiveTurnSteerSmokeProof.completed ? "Completed" : "Incomplete"}; ${codexActiveTurnSteerSmokeProof.steerObserved ? "steer observed" : codexActiveTurnSteerSmokeProof.steerSent ? "steer sent" : "steer not observed"}; ${codexActiveTurnSteerSmokeProof.controls.length} controls`
                  : "Checks active-turn steering for an explicit read-only run."}
              </small>
            </div>
            <div className="transport-live-proof" aria-label="Codex two-panel live smoke proof">
              <span>Two-panel smoke</span>
              <strong>
                {codexTwoPanelSmokeProof.ok
                  ? "Passed"
                  : codexTwoPanelSmokeProof.executed
                    ? "Failed"
                    : "Not run"}
              </strong>
              <small>
                {codexTwoPanelSmokeProof.executed
                  ? `${codexTwoPanelSmokeProof.distinctThreadIds ? "Distinct threads" : "Thread issue"}; ${codexTwoPanelSmokeProof.crossTalkDetected ? "crosstalk detected" : "no crosstalk"}`
                  : "Runs two explicit read-only Codex panel turns and checks identity isolation."}
              </small>
            </div>
            <div
              className="transport-live-proof transport-catalog-proof"
              aria-label="Provider catalog refresh smoke proof"
              title={catalogRefreshProviderSmokeProof.safety}
            >
              <span>Catalog smoke</span>
              <strong>
                {catalogRefreshProviderSmokeProof.ok
                  ? "Passed"
                  : catalogRefreshProviderSmokeProof.executed
                    ? "Failed"
                    : "Not run"}
              </strong>
              <small>
                {catalogRefreshProviderSmokeProof.executed
                  ? `${catalogRefreshProviderSmokeProof.surfaces.filter((surface) => surface.pass).length}/${catalogRefreshProviderSmokeProof.surfaces.length} surfaces; ${catalogRefreshProviderSmokeProof.detail}`
                  : "Refreshes all catalog metadata/status surfaces without running commands, tools, automations, or mutations."}
              </small>
              <ul className="transport-catalog-sources" aria-label="Catalog smoke surface sources">
                {catalogRefreshProviderSmokeProof.surfaces.map((surface) => (
                  <li className={classNames(`catalog-smoke-${surface.state}`)} key={surface.surface}>
                    <span>{surface.surface}</span>
                    <b>{surface.source}</b>
                  </li>
                ))}
              </ul>
              <div className="transport-catalog-safety" aria-label={catalogRefreshSafetyDepth.ariaLabel}>
                <div className="transport-catalog-safety-header">
                  <strong>{catalogRefreshSafetyDepth.label}</strong>
                  <b>
                    {catalogRefreshSafetyDepth.readyCount} ready / {catalogRefreshSafetyDepth.previewCount} preview
                  </b>
                </div>
                <small>{catalogRefreshSafetyDepth.refreshSmokeProof}</small>
                <small>{catalogRefreshSafetyDepth.refreshSafetyDepthProof}</small>
                <ol className="transport-catalog-safety-list">
                  {catalogRefreshSafetyDepth.records.map((record) => (
                    <li
                      className={classNames(
                        "transport-catalog-safety-item",
                        `catalog-safety-${record.status}`
                      )}
                      key={record.id}
                      title={`${record.evidence} ${record.nextAction}`}
                    >
                      <span>{record.statusLabel}</span>
                      <strong>{record.label}</strong>
                      <small>{record.nextAction}</small>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <p className="transport-fallback">{codexTransportDecision.fallback}</p>
            <div className="dialog-action-row">
              <button className="dialog-secondary-action" onClick={onRefreshCodexTransport} type="button">
                {codexTransportLoading ? "Checking..." : "Refresh probe"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexLiveSmokeLoading}
                onClick={onRunCodexLiveSmokeProof}
                type="button"
              >
                {codexLiveSmokeLoading ? "Running smoke..." : "Run live smoke"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexLiveControlSmokeLoading}
                onClick={onRunCodexLiveControlSmokeProof}
                type="button"
              >
                {codexLiveControlSmokeLoading ? "Running control smoke..." : "Run control smoke"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexActiveTurnControlSmokeLoading}
                onClick={onRunCodexActiveTurnControlSmokeProof}
                type="button"
              >
                {codexActiveTurnControlSmokeLoading ? "Running interrupt smoke..." : "Run interrupt smoke"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexActiveTurnSteerSmokeLoading}
                onClick={onRunCodexActiveTurnSteerSmokeProof}
                type="button"
              >
                {codexActiveTurnSteerSmokeLoading ? "Running steer smoke..." : "Run steer smoke"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!codexTransportDecision.canStartSession || codexTwoPanelSmokeLoading}
                onClick={onRunCodexTwoPanelSmokeProof}
                type="button"
              >
                {codexTwoPanelSmokeLoading ? "Running panels..." : "Run two-panel smoke"}
              </button>
              <button
                className="dialog-secondary-action"
                disabled={catalogRefreshProviderSmokeLoading}
                onClick={onRunCatalogRefreshProviderSmokeProof}
                type="button"
              >
                {catalogRefreshProviderSmokeLoading ? "Refreshing catalogs..." : "Run catalog smoke"}
              </button>
              <button className="dialog-primary-action" onClick={onStageCodexConnection} type="button">
                {codexConnectionRequested ? "Connection request staged" : "Stage Codex connection request"}
              </button>
            </div>
          </div>
        ) : null}

        {dialog === "migration" ? (
          <div className="app-dialog-body">
            <p>
              Migration previews local source metadata, lets you stage a reviewed snapshot, and keeps
              credentials, browser state, and raw transcripts excluded.
            </p>
            <div className="migration-controls" aria-label="Migration controls">
              <label>
                <span>Source</span>
                <select
                  aria-label="Migration source platform"
                  onChange={(event) => onMigrationSourceChange(event.currentTarget.value as MigrationSourceId)}
                  value={migrationSourceId}
                >
                  {defaultMigrationSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="dialog-secondary-action" onClick={onRefreshMigrationPreview} type="button">
                {migrationPreviewLoading ? "Scanning..." : "Refresh metadata"}
              </button>
              <button className="dialog-secondary-action" onClick={onSelectReviewableMigrationCategories} type="button">
                Select safe metadata
              </button>
            </div>
            <div className="migration-summary-strip" aria-label="Migration preview counts">
              <span>
                <strong>{migrationCounts.accepted}</strong>
                Accepted
              </span>
              <span>
                <strong>{migrationCounts.reviewRequired}</strong>
                Review
              </span>
              <span>
                <strong>{migrationCounts.unsupported}</strong>
                Unsupported
              </span>
              <span>
                <strong>{migrationCounts.excluded}</strong>
                Excluded
              </span>
              <span>
                <strong>{selectedCategoryCount}</strong>
                Selected
              </span>
            </div>
            <div className="migration-source-card" aria-label="Migration source metadata scan">
              <div>
                <span className={classNames("migration-source-state", migrationSourcePreview.detected ? "is-detected" : "is-preview")}>
                  {migrationSourcePreview.detected ? "Detected" : "Preview"}
                </span>
                <strong>{migrationSourcePreview.sourceLabel}</strong>
                <p>{migrationSourcePreview.safeLocationLabel}</p>
              </div>
              <small title={migrationSourcePreview.safetyNote}>{migrationSourcePreview.safetyNote}</small>
            </div>
            <div className="migration-scan-list" aria-label="Migration source scan categories">
              {migrationSourcePreview.categories.map((category) => (
                <span className={`migration-state-${category.status}`} key={category.id} title={category.reason}>
                  <strong>{category.label}</strong>
                  <b>{formatMigrationState(category.status)}</b>
                  <small>{category.count} found; {category.reason}</small>
                </span>
              ))}
            </div>
            <div className="migration-category-list" aria-label="Migration category checklist">
              {migrationPreview.categories.map((category) => (
                <label className="migration-category-row" key={category.id}>
                  <input
                    checked={category.selected}
                    disabled={category.baseState === "unsupported"}
                    onChange={(event) => onMigrationCategoryChange(category.id, event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{category.label}</strong>
                    <small>{category.detail}</small>
                  </span>
                  <b className={`migration-state-${category.state}`}>
                    {formatMigrationState(category.state)}
                  </b>
                </label>
              ))}
            </div>
            <div className="migration-exclusions" aria-label="Migration excluded sensitive data">
              {migrationSourcePreview.excludedSecretsSummary.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div
              aria-label={`Migration hardening gate ${migrationHardeningReadiness.statusLabel}; ${migrationHardeningReadiness.readiness}% ready. ${migrationHardeningReadiness.nextAction}`}
              className={classNames(
                "migration-review-gate",
                `migration-review-gate-${migrationHardeningReadiness.state}`
              )}
              title={migrationHardeningReadiness.safety}
            >
              <div className="migration-review-gate-header">
                <strong>Migration review gate</strong>
                <span>{migrationHardeningReadiness.statusLabel}</span>
              </div>
              <div className="migration-review-gate-summary">
                <span>
                  <strong>{migrationHardeningReadiness.readiness}%</strong>
                  Ready
                </span>
                <span>
                  <strong>{migrationHardeningReadiness.applyIntentLabel}</strong>
                  Apply intent
                </span>
                <span>
                  <strong>{migrationHardeningReadiness.canRollback ? "Ready" : "Waiting"}</strong>
                  Rollback
                </span>
                <span>
                  <strong>{migrationHardeningReadiness.openReviewRecordCount}</strong>
                  Open review
                </span>
              </div>
              <p>{migrationHardeningReadiness.nextAction}</p>
              <small>{migrationHardeningReadiness.migrationReviewDepthProof}</small>
              <ol className="migration-review-depth-list" aria-label="Migration review depth records">
                {migrationHardeningReadiness.reviewDepthItems.map((item) => (
                  <li className={`migration-review-depth-${item.status}`} key={item.id} title={`${item.detail} ${item.evidence} ${item.nextAction}`}>
                    <span>{item.kind}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.pmTaskId} / {item.evidenceKey}</small>
                      <em>{item.evidence}</em>
                      <small>{item.nextAction}</small>
                    </div>
                    <b>{item.status}</b>
                  </li>
                ))}
              </ol>
              <div className="migration-traceability" aria-label={migrationTraceability.ariaLabel}>
                <div className="migration-traceability-header">
                  <strong>{migrationTraceability.label}</strong>
                  <span>
                    {migrationTraceability.statusLabel} / {migrationTraceability.readiness}%
                  </span>
                </div>
                <ol className="migration-traceability-list" aria-label="Migration traceability records">
                  {migrationTraceability.items.map((item) => (
                    <li
                      className={`migration-traceability-${item.status}`}
                      key={item.id}
                      title={`${item.detail} ${item.nextAction}`}
                    >
                      <span>{item.status}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.nextAction}</small>
                      </div>
                      <b>{item.kind}</b>
                    </li>
                  ))}
                </ol>
                <small>{migrationTraceability.migrationTraceabilityProof}</small>
              </div>
              <div
                aria-label={migrationBlockerPriority.ariaLabel}
                className={classNames(
                  "migration-blocker-priority",
                  `migration-blocker-priority-${migrationBlockerPriority.state}`
                )}
                title={migrationBlockerPriority.safety}
              >
                <div className="migration-blocker-priority-header">
                  <strong>{migrationBlockerPriority.label}</strong>
                  <span>
                    {migrationBlockerPriority.metadataReviewCanAddressTopBlocker
                      ? "Metadata review"
                      : migrationBlockerPriority.openBlockerCount > 0
                        ? "Owner action"
                        : "Ready"}
                  </span>
                </div>
                <p title={migrationBlockerPriority.topPriorityAction}>
                  {migrationBlockerPriority.topPriorityLabel}
                </p>
                <dl
                  aria-label="Migration blocker priority counts"
                  className="migration-blocker-priority-grid"
                >
                  <div>
                    <dt>Open</dt>
                    <dd>{migrationBlockerPriority.openBlockerCount}</dd>
                  </div>
                  <div>
                    <dt>Reviewable</dt>
                    <dd>{migrationBlockerPriority.metadataReviewAddressableCount}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{migrationBlockerPriority.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>Ready</dt>
                    <dd>{migrationBlockerPriority.readiness}%</dd>
                  </div>
                </dl>
                <ol
                  aria-label="Migration blocker priority rows"
                  className="migration-blocker-priority-list"
                >
                  {migrationBlockerPriority.items.length > 0 ? (
                    migrationBlockerPriority.items.map((item) => (
                      <li
                        className={`migration-blocker-priority-item-${item.status}`}
                        key={item.id}
                        title={`${item.detail} ${item.nextAction}`}
                      >
                        <span>#{item.priority}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.nextAction}</small>
                        </div>
                        <b>{item.kind}</b>
                      </li>
                    ))
                  ) : (
                    <li className="migration-blocker-priority-item-ready">
                      <span>OK</span>
                      <div>
                        <strong>No open migration blocker</strong>
                        <small>{migrationBlockerPriority.nextAction}</small>
                      </div>
                      <b>ready</b>
                    </li>
                  )}
                </ol>
                <small>{migrationBlockerPriority.migrationBlockerPriorityProof}</small>
              </div>
              <div
                aria-label={migrationApplyDecisionGate.ariaLabel}
                className={classNames(
                  "migration-apply-decision",
                  `migration-apply-decision-${migrationApplyDecisionGate.state}`
                )}
                title={migrationApplyDecisionGate.safety}
              >
                <div className="migration-apply-decision-header">
                  <strong>{migrationApplyDecisionGate.label}</strong>
                  <span>{migrationApplyDecisionGate.statusLabel}</span>
                </div>
                <dl
                  aria-label="Migration apply decision locks"
                  className="migration-apply-decision-grid"
                >
                  <div>
                    <dt>Stage review</dt>
                    <dd>{migrationApplyDecisionGate.canStageApplyReview ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Apply</dt>
                    <dd>{migrationApplyDecisionGate.canApplyMigration ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Profile</dt>
                    <dd>{migrationApplyDecisionGate.profileActivationLocked ? "Locked" : "Open"}</dd>
                  </div>
                  <div>
                    <dt>Approval</dt>
                    <dd>{migrationApplyDecisionGate.ownerApprovalRequired ? "Required" : "Clear"}</dd>
                  </div>
                </dl>
                <p>{migrationApplyDecisionGate.nextAction}</p>
                <small>{migrationApplyDecisionGate.migrationApplyDecisionProof}</small>
              </div>
              <div
                aria-label={migrationOwnerApprovalHandoff.ariaLabel}
                className={classNames(
                  "migration-owner-approval-handoff",
                  `migration-owner-approval-handoff-${migrationOwnerApprovalHandoff.state}`
                )}
                title={migrationOwnerApprovalHandoff.safety}
              >
                <div className="migration-owner-approval-handoff-header">
                  <strong>{migrationOwnerApprovalHandoff.label}</strong>
                  <span>{migrationOwnerApprovalHandoff.statusLabel}</span>
                </div>
                <dl
                  aria-label="Migration owner approval handoff locks"
                  className="migration-owner-approval-handoff-grid"
                >
                  <div>
                    <dt>Request</dt>
                    <dd>{migrationOwnerApprovalHandoff.canRequestOwnerApproval ? "Ready" : "Held"}</dd>
                  </div>
                  <div>
                    <dt>Recorded</dt>
                    <dd>{migrationOwnerApprovalHandoff.ownerApprovalRecorded ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Apply</dt>
                    <dd>{migrationOwnerApprovalHandoff.canApplyMigration ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Profile</dt>
                    <dd>{migrationOwnerApprovalHandoff.profileActivationLocked ? "Locked" : "Open"}</dd>
                  </div>
                </dl>
                <p>{migrationOwnerApprovalHandoff.nextAction}</p>
                <small>{migrationOwnerApprovalHandoff.migrationOwnerApprovalHandoffProof}</small>
              </div>
              <div
                aria-label={migrationApplyImplementationBoundary.ariaLabel}
                className={classNames(
                  "migration-apply-implementation-boundary",
                  `migration-apply-implementation-boundary-${migrationApplyImplementationBoundary.state}`
                )}
                title={migrationApplyImplementationBoundary.safety}
              >
                <div className="migration-apply-implementation-boundary-header">
                  <strong>{migrationApplyImplementationBoundary.label}</strong>
                  <span>{migrationApplyImplementationBoundary.statusLabel}</span>
                </div>
                <dl
                  aria-label="Migration apply implementation boundary locks"
                  className="migration-apply-implementation-boundary-grid"
                >
                  <div>
                    <dt>Enter</dt>
                    <dd>{migrationApplyImplementationBoundary.canEnterApplyImplementation ? "Ready" : "Held"}</dd>
                  </div>
                  <div>
                    <dt>Executor</dt>
                    <dd>{migrationApplyImplementationBoundary.executorAvailable ? "Ready" : "Missing"}</dd>
                  </div>
                  <div>
                    <dt>Apply</dt>
                    <dd>{migrationApplyImplementationBoundary.canApplyMigration ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Mutation</dt>
                    <dd>{migrationApplyImplementationBoundary.sourceMutationLocked ? "Locked" : "Open"}</dd>
                  </div>
                </dl>
                <p>{migrationApplyImplementationBoundary.nextAction}</p>
                <small>{migrationApplyImplementationBoundary.applyImplementationBoundaryProof}</small>
              </div>
              <div
                aria-label={phase5MigrationCompletionGate.ariaLabel}
                className={classNames(
                  "migration-completion-gate",
                  `migration-completion-gate-${phase5MigrationCompletionGate.state}`
                )}
                title={phase5MigrationCompletionGate.detail}
              >
                <div className="migration-completion-gate-header">
                  <strong>Phase 5 migration completion gate</strong>
                  <span>{phase5MigrationCompletionGate.statusLabel}</span>
                </div>
                <dl className="migration-completion-gate-grid" aria-label="Phase 5 migration completion gate counts">
                  <div>
                    <dt>Complete</dt>
                    <dd>{phase5MigrationCompletionGate.phaseComplete ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Review-only</dt>
                    <dd>{phase5MigrationCompletionGate.reviewOnlyComplete ? "Done" : "Held"}</dd>
                  </div>
                  <div>
                    <dt>Apply</dt>
                    <dd>{phase5MigrationCompletionGate.canApplyMigration ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Executor</dt>
                    <dd>{phase5MigrationCompletionGate.executorAvailable ? "Ready" : "Missing"}</dd>
                  </div>
                </dl>
                <p>{phase5MigrationCompletionGate.nextAction}</p>
                <small>{phase5MigrationCompletionGate.completionGateProof}</small>
              </div>
              <MigrationProfileActivationGateSummary gate={phase5ProfileActivationGate} />
              <ol className="migration-review-gate-list" aria-label="Migration hardening evidence">
                {migrationHardeningReadiness.items.map((item) => (
                  <li className={`migration-review-item-${item.status}`} key={item.id} title={item.detail}>
                    <strong>{item.label}</strong>
                    <span>{item.status}</span>
                    <small>{item.detail}</small>
                  </li>
                ))}
              </ol>
            </div>
            <div className="dialog-action-row">
              <button
                className="dialog-primary-action"
                disabled={!migrationHardeningReadiness.canCreateDraft}
                onClick={onCreateMigrationProfileDraft}
                type="button"
              >
                Create profile draft
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!migrationHardeningReadiness.canStageApplyIntent}
                onClick={onStageMigrationApplyIntent}
                title={migrationHardeningReadiness.nextAction}
                type="button"
              >
                Stage apply review
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!migrationHardeningReadiness.canRollback}
                onClick={onRollbackLatestMigrationProfileDraft}
                type="button"
              >
                Roll back latest draft
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!migrationOwnerApprovalHandoff.canRequestOwnerApproval}
                onClick={onRecordMigrationOwnerApproval}
                title={migrationOwnerApprovalHandoff.nextAction}
                type="button"
              >
                Record owner approval
              </button>
              <button
                className="dialog-secondary-action"
                disabled={!migrationOwnerApprovalRecord}
                onClick={onClearMigrationOwnerApproval}
                type="button"
              >
                Clear owner approval
              </button>
            </div>
            {migrationProfileDraft ? (
              <div className="migration-draft" aria-label="Migration profile draft">
                <strong>Latest reviewed draft</strong>
                <span>{migrationProfileDraft.sourceLabel}</span>
                <small>{migrationProfileDraft.selectedCategories.map((category) => category.label).join(", ") || "No categories selected."}</small>
                <small>{`State: ${migrationProfileDraft.importState} - Readiness: ${migrationProfileDraft.readiness}%`}</small>
                <small>{`Selected: ${migrationProfileDraft.selectedCategories.length} - Accepted: ${migrationProfileDraft.counts.accepted}, Review: ${migrationProfileDraft.counts.reviewRequired}, Unsupported: ${migrationProfileDraft.counts.unsupported}, Excluded: ${migrationProfileDraft.counts.excluded}`}</small>
                <small>{migrationProfileDraft.summary}</small>
                <small>{migrationProfileDraft.safetyNote}</small>
                {migrationProfileDraftHistoryLatestAudit?.detail ? (
                  <small>{migrationProfileDraftHistoryLatestAudit.detail}</small>
                ) : null}
              </div>
            ) : null}
            {migrationDraftActionNotice ? <small className="migration-draft-audit">{migrationDraftActionNotice}</small> : null}
            <div className="migration-history-strip" aria-label="Migration draft history summary">
              <span>
                <strong>{migrationProfileDraftHistorySummary.total}</strong>
                Total
              </span>
              <span>
                <strong>{migrationProfileDraftHistorySummary.ready}</strong>
                Ready
              </span>
              <span>
                <strong>{migrationProfileDraftHistorySummary.review}</strong>
                Review
              </span>
              <span>
                <strong>{migrationProfileDraftHistorySummary.waiting}</strong>
                Waiting
              </span>
              <span>
                <strong>{migrationProfileDraftHistorySummary.blocked}</strong>
                Blocked
              </span>
              <span>
                <strong>{migrationProfileDraftHistorySummary.applied}</strong>
                Applied
              </span>
            </div>
          </div>
        ) : null}

        {dialog === "slash-help" ? (
          <div className="app-dialog-body">
            <p>Slash commands are scoped to the active panel and show whether they can run live, stage locally, or remain unavailable.</p>
            <div className="catalog-summary-strip command-catalog-summary" aria-label="Slash command catalog summary">
              <span>
                <strong>{commandCatalogSnapshot.summary.total}</strong>
                Total
              </span>
              <span>
                <strong>{commandCatalogSnapshot.summary.live}</strong>
                Live
              </span>
              <span>
                <strong>{commandCatalogSnapshot.summary.preview}</strong>
                Preview
              </span>
              <span>
                <strong>{commandCatalogSnapshot.summary.blocked}</strong>
                Blocked
              </span>
              <span>
                <strong>{formatCatalogAvailability(commandCatalogSnapshot.summary.availability)}</strong>
                Ready
              </span>
              <span>
                <strong>{formatCommandCatalogSource(commandCatalogSnapshot.source)}</strong>
                Source
              </span>
            </div>
            <div className="dialog-action-row">
              <button className="dialog-secondary-action" onClick={onRefreshCommandCatalog} type="button">
                Refresh command catalog
              </button>
            </div>
            <div className="slash-command-list" aria-label="Available slash commands">
              {commandCatalogSnapshot.catalog.map((item) => (
                <span className={`command-state-${item.state}`} key={item.command}>
                  <strong>{item.command}</strong>
                  <b>{item.state}</b>
                  <small>{item.detail} Scope: {item.scopes.join(", ")}</small>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {platformCatalogView ? (
          <div className="app-dialog-body">
            <p>{platformCatalogView.lead}</p>
            <div className="catalog-summary-strip" aria-label={`${platformCatalogView.title} summary`}>
              <span>
                <strong>{platformCatalogView.summary.total}</strong>
                Total
              </span>
              <span>
                <strong>{platformCatalogView.summary.live}</strong>
                Live
              </span>
              <span>
                <strong>{platformCatalogView.summary.preview}</strong>
                Preview
              </span>
              <span>
                <strong>{platformCatalogView.summary.setupRequired}</strong>
                Setup
              </span>
              <span>
                <strong>{platformCatalogView.summary.disconnected}</strong>
                Disconnected
              </span>
              <span>
                <strong>{formatCatalogAvailability(platformCatalogView.summary.availability)}</strong>
                Ready
              </span>
              {platformCatalogView.sourceLabel ? (
                <span>
                  <strong>{platformCatalogView.sourceLabel}</strong>
                  Source
                </span>
              ) : null}
            </div>
            {dialog === "plugins" ? (
              <div className="dialog-action-row">
                <button className="dialog-secondary-action" onClick={onRefreshPluginCatalog} type="button">
                  {pluginCatalogLoading ? "Refreshing..." : "Refresh plugins catalog"}
                </button>
              </div>
            ) : null}
            {dialog === "mcp" ? (
              <div className="dialog-action-row">
                <button className="dialog-secondary-action" onClick={onRefreshMcpCatalog} type="button">
                  {mcpCatalogLoading ? "Refreshing..." : "Refresh MCP catalog"}
                </button>
              </div>
            ) : null}
            {dialog === "skills" ? (
              <div className="dialog-action-row">
                <button className="dialog-secondary-action" onClick={onRefreshSkillCatalog} type="button">
                  {skillCatalogLoading ? "Refreshing..." : "Refresh skills catalog"}
                </button>
              </div>
            ) : null}
            {dialog === "automations" ? (
              <div className="dialog-action-row">
                <button className="dialog-secondary-action" onClick={onRefreshAutomationCatalog} type="button">
                  {automationCatalogLoading ? "Refreshing..." : "Refresh automations catalog"}
                </button>
              </div>
            ) : null}
            {dialog === "personalization" ? (
              <div className="dialog-action-row">
                <button className="dialog-secondary-action" onClick={onRefreshPersonalizationCatalog} type="button">
                  {personalizationCatalogLoading ? "Refreshing..." : "Refresh personalization catalog"}
                </button>
              </div>
            ) : null}
            <div className="catalog-list" aria-label={`${platformCatalogView.title} catalog`}>
              {platformCatalogView.rows.map((item) => (
                <article className="catalog-row" key={item.id}>
                  <div className="catalog-row-main">
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                    <div className="catalog-meta-row">
                      {item.meta.map((meta) => (
                        <span key={`${item.id}-${meta}`}>{meta}</span>
                      ))}
                    </div>
                  </div>
                  <span className={classNames("catalog-state-pill", `catalog-state-${item.state}`)}>
                    {formatCatalogState(item.state)}
                  </span>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AdaptivePanelFrame({
  children,
  columns,
  onDragStart,
  onHide,
  onKeyboardAdjust,
  onPointerStart,
  onResize,
  panel,
  rows,
  title
}: {
  children: ReactNode;
  columns: number;
  onDragStart: (event: DragEvent<HTMLDivElement>, panelId: string, panelTitle: string) => void;
  onHide: (panelId: string) => void;
  onKeyboardAdjust: (event: KeyboardEvent<HTMLDivElement>, panelId: string) => void;
  onPointerStart: (event: PointerEvent<HTMLDivElement>, panelId: string) => void;
  onResize: (panelId: string, nextSize: { w?: number; h?: number }) => void;
  panel: AdaptiveCockpitPanel;
  rows: number;
  title: string;
}) {
  const canGrowWide = panel.x + panel.w < columns;
  const canGrowTall = panel.y + panel.h < rows;
  const canShrinkWide = panel.w > 1;
  const canShrinkTall = panel.h > 1;

  return (
    <div
      className="adaptive-panel-frame"
      data-panel-id={panel.id}
      style={{
        gridColumn: `${panel.x + 1} / span ${panel.w}`,
        gridRow: `${panel.y + 1} / span ${panel.h}`
      }}
    >
      <div className="adaptive-panel-controls" aria-label={`Adaptive controls for ${panel.id}`}>
        <div
          aria-label={`Move ${title}`}
          className="adaptive-panel-drag-handle"
          draggable
          onDragStart={(event) => onDragStart(event, panel.id, title)}
          onKeyDown={(event) => onKeyboardAdjust(event, panel.id)}
          onPointerDown={(event) => onPointerStart(event, panel.id)}
          role="button"
          tabIndex={0}
          title="Drag panel"
        >
          <Move size={13} />
        </div>
        <button
          disabled={!canShrinkWide}
          onClick={() => onResize(panel.id, { w: panel.w - 1 })}
          title="Narrow panel"
          type="button"
        >
          <Minimize2 size={13} />
        </button>
        <button
          disabled={!canGrowWide}
          onClick={() => onResize(panel.id, { w: panel.w + 1 })}
          title="Widen panel"
          type="button"
        >
          <Maximize2 size={13} />
        </button>
        <button
          disabled={!canShrinkTall}
          onClick={() => onResize(panel.id, { h: panel.h - 1 })}
          title="Shorten panel"
          type="button"
        >
          <Minimize2 size={13} />
        </button>
        <button
          disabled={!canGrowTall}
          onClick={() => onResize(panel.id, { h: panel.h + 1 })}
          title="Heighten panel"
          type="button"
        >
          <Maximize2 size={13} />
        </button>
        <button onClick={() => onHide(panel.id)} title="Hide panel" type="button">
          <EyeOff size={13} />
        </button>
      </div>
      {children}
    </div>
  );
}

function SessionCell({
  commandCatalog = panelSlashCommands,
  isFocused = false,
  liveCodexEnabled = false,
  onPanelSessionStart,
  onPanelSessionStatus,
  onSessionControlReadinessEvidence,
  onSlashCommandExecutionEvidence,
  panelSessionIssue,
  panelSessionRecord,
  projectLabel,
  session
}: {
  commandCatalog?: readonly PanelSlashCommand[];
  isFocused?: boolean;
  liveCodexEnabled?: boolean;
  onPanelSessionStart?: (result: CodexPanelSessionStartPayload) => void;
  onPanelSessionStatus?: (
    panelId: string,
    status: CodexPanelSessionStatus,
    detail: string
  ) => void;
  onSessionControlReadinessEvidence?: (
    panelId: string,
    evidence: SessionControlReadinessEvidence
  ) => void;
  onSlashCommandExecutionEvidence?: (
    panelId: string,
    evidence: SlashCommandExecutionEvidence
  ) => void;
  panelSessionIssue?: CodexPanelSessionIdentityIssue;
  panelSessionRecord?: CodexPanelSessionStateRecord;
  projectLabel?: string;
  session: SessionSummary;
}) {
  const identity = createCockpitPanelIdentity({
    projectId: session.projectId,
    projectLabel,
    role: session.role,
    runtime: session.runtime,
    state: session.state,
    title: session.title
  });
  const fileScope = createCockpitPanelFileScope(session.files);
  const attemptSignal = createCockpitPanelAttempt(session.attempt, session.state);
  const validationSignal = createCockpitPanelValidation(session.validation, session.state);
  const branchSignal = createCockpitPanelBranch(session.branch);
  const runtimeSignal = createCockpitPanelRuntime({
    role: session.role,
    runtime: session.runtime
  });
  const activitySignal = createCockpitPanelActivity({
    state: session.state,
    transcript: session.transcript,
    validation: session.validation
  });
  const toolCoverageSignal = createCockpitPanelToolCoverage(session.tools);
  const [chatMessages, setChatMessages] = useState<PanelChatMessage[]>(() =>
    loadPanelChatMessages(session)
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [lastLivePrompt, setLastLivePrompt] = useState("");
  const sessionIdentityBlocked = Boolean(panelSessionIssue);
  const restoredSessionAvailable = Boolean(
    liveCodexEnabled &&
      panelSessionRecord &&
      !sessionIdentityBlocked &&
      !panelSessionRecord.stale &&
      !["closed", "error"].includes(panelSessionRecord.status)
  );
  const [liveChatStatus, setLiveChatStatus] = useState<LivePanelChatStatus>(
    sessionIdentityBlocked ? "failed" : restoredSessionAvailable || liveCodexEnabled ? "idle" : "preview"
  );
  const [liveSessionStarted, setLiveSessionStarted] = useState(restoredSessionAvailable);
  const [liveChatDetail, setLiveChatDetail] = useState(
    sessionIdentityBlocked
      ? panelSessionIssue?.detail ?? "Duplicate live session identity detected."
      : restoredSessionAvailable
      ? panelSessionRecord?.detail ?? "Restored Codex panel session metadata."
      : liveCodexEnabled
        ? "Codex live session ready"
        : "Codex local preview"
  );
  const canUseLiveCodex = liveCodexEnabled && hasDesktopRuntime() && !sessionIdentityBlocked;
  const slashSuggestions = useMemo(
    () => getPanelSlashCommandSuggestions(draftMessage, commandCatalog),
    [commandCatalog, draftMessage]
  );
  const activeSlashCommandDecision = useMemo(() => {
    const trimmedDraft = draftMessage.trimStart();
    return trimmedDraft.startsWith("/")
      ? getPanelSlashCommandDecision(trimmedDraft, canUseLiveCodex, commandCatalog)
      : undefined;
  }, [canUseLiveCodex, commandCatalog, draftMessage]);
  const latestSlashCommandMessage = useMemo(() => {
    for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
      const message = chatMessages[index];

      if (message.role === "user" && message.body.trimStart().startsWith("/")) {
        return message;
      }
    }

    return undefined;
  }, [chatMessages]);
  const slashCommandExecutionEvidence = useMemo(
    () =>
      buildSlashCommandExecutionEvidence({
        submittedMessage: latestSlashCommandMessage?.body ?? "",
        liveTransportAvailable: canUseLiveCodex,
        commandCatalog,
        transcriptMessages: chatMessages
      }),
    [canUseLiveCodex, chatMessages, commandCatalog, latestSlashCommandMessage?.body]
  );
  const liveChatStarting = liveChatStatus === "starting";
  const liveChatRunning = liveChatStatus === "running";
  const liveChatBusy = liveChatStarting || liveChatRunning;
  const liveProviderLifecycleCapabilities = useMemo(
    () => ({
      fork: false,
      resume: false,
      archive: false
    }),
    []
  );
  const liveControlSnapshot = useMemo(
    () =>
      buildCodexSessionControls({
        sessionStatus: liveChatStatus,
        liveTransportAvailable: canUseLiveCodex,
        activeTurn: {
          status: liveChatStarting ? "starting" : liveChatRunning ? "streaming" : liveChatStatus
        },
        lastUserPrompt: lastLivePrompt,
        draftText: draftMessage,
        providerCapabilities: liveProviderLifecycleCapabilities
      }),
    [
      canUseLiveCodex,
      draftMessage,
      lastLivePrompt,
      liveChatRunning,
      liveChatStarting,
      liveChatStatus,
      liveProviderLifecycleCapabilities
    ]
  );
  const unsupportedControlSummary = useMemo(
    () => summarizeUnsupportedSessionControls(liveControlSnapshot),
    [liveControlSnapshot]
  );
  const lifecycleControlGate = useMemo(
    () => buildCodexSessionLifecycleControlsGate(liveControlSnapshot),
    [liveControlSnapshot]
  );
  const sessionControlReadinessEvidence = useMemo(
    () =>
      buildSessionControlReadinessEvidence(liveControlSnapshot, {
        transcriptMessages: chatMessages
      }),
    [chatMessages, liveControlSnapshot]
  );
  const canInterruptLiveTurn = liveControlSnapshot.interrupt.state === "live";
  const canRetryLiveTurn =
    liveControlSnapshot.retry.state === "live" && !liveChatBusy;
  const composerStatusLabel = canUseLiveCodex
    ? liveChatStatus === "idle"
      ? "Codex live ready"
      : liveChatStatus === "starting"
        ? "Starting Codex"
        : liveChatStatus === "running"
          ? "Codex running"
          : liveChatStatus === "completed"
            ? "Codex complete"
            : liveChatStatus === "interrupted"
              ? "Codex interrupted"
            : "Codex failed"
    : sessionIdentityBlocked
      ? "Session conflict"
      : "Codex local preview";

  useEffect(() => {
    setChatMessages(loadPanelChatMessages(session));
    setDraftMessage("");
    setLastLivePrompt("");
    const restored = Boolean(
      liveCodexEnabled &&
        panelSessionRecord &&
        !panelSessionIssue &&
        !panelSessionRecord.stale &&
        !["closed", "error"].includes(panelSessionRecord.status)
    );
    setLiveSessionStarted(restored);
    setLiveChatStatus(panelSessionIssue ? "failed" : liveCodexEnabled ? "idle" : "preview");
    setLiveChatDetail(
      panelSessionIssue
        ? panelSessionIssue.detail
        : restored
        ? panelSessionRecord?.detail ?? "Restored Codex panel session metadata."
        : panelSessionRecord?.stale
          ? "Saved Codex session is stale; a new session will start on next message."
          : liveCodexEnabled
            ? "Codex live session ready"
            : "Codex local preview"
    );
  }, [
    liveCodexEnabled,
    panelSessionRecord?.detail,
    panelSessionRecord?.sessionId,
    panelSessionRecord?.stale,
    panelSessionRecord?.status,
    panelSessionIssue?.detail,
    panelSessionIssue?.identity,
    panelSessionIssue?.type,
    session
  ]);

  useEffect(() => {
    savePanelChatMessages(session.id, chatMessages);
  }, [chatMessages, session.id]);

  useEffect(() => {
    onSlashCommandExecutionEvidence?.(session.id, slashCommandExecutionEvidence);
  }, [onSlashCommandExecutionEvidence, session.id, slashCommandExecutionEvidence]);

  useEffect(() => {
    onSessionControlReadinessEvidence?.(session.id, sessionControlReadinessEvidence);
  }, [onSessionControlReadinessEvidence, session.id, sessionControlReadinessEvidence]);

  async function ensureLivePanelSession() {
    if (liveSessionStarted) {
      return;
    }

    setLiveChatStatus("starting");
    setLiveChatDetail("Starting Codex app-server panel session.");
    const result = await invokeDesktopCommand<CodexPanelSessionStartPayload>(
      "codex_panel_session_start",
      { panelId: session.id }
    );
    setLiveSessionStarted(result.started);
    setLiveChatDetail(result.detail);
    if (result.started) {
      onPanelSessionStart?.(result);
    }
  }

  async function sendLivePanelPrompt(
    trimmedMessage: string,
    mode: "send" | "retry" = "send",
    providerSlashCommandDecision?: PanelSlashCommandDecision
  ) {
    const sequence = chatMessages.length;
    const providerSlashStatusMessage =
      providerSlashCommandDecision?.route === "provider"
        ? createPanelProviderSlashCommandStatusMessage(
            session,
            sequence + 1,
            providerSlashCommandDecision
          )
        : undefined;
    const pendingMessage = createPanelLiveStatusMessage(
      session,
      sequence + (providerSlashStatusMessage ? 2 : 1),
      providerSlashCommandDecision?.route === "provider"
        ? `Running ${providerSlashCommandDecision.command?.command ?? "slash command"} through live Codex...`
        : mode === "retry"
          ? "Retrying with live Codex..."
          : "Sending to live Codex...",
      "running"
    );
    const liveMessageSequenceStart = sequence + (providerSlashStatusMessage ? 3 : 2);

    setLastLivePrompt(trimmedMessage);
    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${session.id}:user:${currentMessages.length}`,
        role: "user",
        label: "You",
        body: trimmedMessage,
        meta: providerSlashCommandDecision?.command?.command ?? (mode === "retry" ? "retry" : "live")
      },
      ...(providerSlashStatusMessage ? [providerSlashStatusMessage] : []),
      pendingMessage
    ]);
    setDraftMessage("");

    try {
      await ensureLivePanelSession();
      setLiveChatStatus("running");
      setLiveChatDetail("Codex turn is running.");
      const result = await invokeDesktopCommand<CodexPanelTurnResultPayload>(
        mode === "retry" ? "codex_panel_session_retry" : "codex_panel_session_send_turn",
        { panelId: session.id, prompt: trimmedMessage }
      );
      const state = reduceCodexSessionEvents(
        normalizeCodexPanelTurnResultEvents(result, trimmedMessage)
      );
      const nextMessages = codexSessionStateToPanelMessages(session, state, liveMessageSequenceStart);
      const turnEvidence = buildPanelLiveTurnEvidence(result);
      const turnEvidenceMessage = createPanelLiveTurnEvidenceMessage(
        session,
        liveMessageSequenceStart + nextMessages.length,
        turnEvidence
      );
      const statusMessages = result.failed || result.interrupted || nextMessages.length === 0
        ? [
            result.failed
              ? createPanelLiveErrorMessage(
                  session,
                  liveMessageSequenceStart,
                  result.detail || "Codex did not return a live response."
                )
              : createPanelLiveStatusMessage(
                  session,
                  liveMessageSequenceStart,
                  result.detail || "Codex turn ended without a live response.",
                  result.interrupted ? "interrupted" : "live codex"
                )
          ]
        : [];

      setLiveChatStatus(
        result.failed
          ? "failed"
          : result.interrupted
            ? "interrupted"
            : result.completed
              ? "completed"
              : "failed"
      );
      setLiveChatDetail(result.detail);
      onPanelSessionStatus?.(
        session.id,
        result.failed ? "error" : result.interrupted ? "idle" : "active",
        result.detail
      );
      setChatMessages((currentMessages) => [
        ...currentMessages.filter((message) => message.id !== pendingMessage.id),
        ...nextMessages,
        turnEvidenceMessage,
        ...statusMessages
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatStatus("failed");
      setLiveChatDetail(message);
      onPanelSessionStatus?.(session.id, "error", message);
      setChatMessages((currentMessages) => [
        ...currentMessages.filter((item) => item.id !== pendingMessage.id),
        createPanelLiveErrorMessage(session, liveMessageSequenceStart, message),
        createPanelLiveRecoveryMessage(
          session,
          liveMessageSequenceStart + 1,
          message,
          trimmedMessage
        )
      ]);
    }
  }

  async function handleInterruptLiveTurn() {
    if (!canInterruptLiveTurn) {
      return;
    }

    try {
      const result = await invokeDesktopCommand<CodexPanelInterruptResultPayload>(
        "codex_panel_session_interrupt",
        { panelId: session.id }
      );
      setLiveChatDetail(result.detail);
      if (result.interrupted) {
        setLiveChatStatus("interrupted");
        onPanelSessionStatus?.(session.id, "idle", result.detail);
      }
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveStatusMessage(
          session,
          currentMessages.length,
          result.detail,
          result.interrupted ? "interrupted" : "unsupported"
        )
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatStatus("failed");
      setLiveChatDetail(message);
      onPanelSessionStatus?.(session.id, "error", message);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveErrorMessage(session, currentMessages.length, message)
      ]);
    }
  }

  async function handleSteerLiveTurn(trimmedMessage: string) {
    if (!canUseLiveCodex || !liveChatRunning || !trimmedMessage) {
      return;
    }

    try {
      setDraftMessage("");
      const result = await invokeDesktopCommand<CodexPanelSteerResultPayload>(
        "codex_panel_session_steer",
        { panelId: session.id, message: trimmedMessage }
      );
      setLiveChatDetail(result.detail);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${session.id}:user:${currentMessages.length}`,
          role: "user",
          label: "You",
          body: trimmedMessage,
          meta: result.steered ? "steer" : "not steered"
        },
        createPanelLiveStatusMessage(
          session,
          currentMessages.length + 1,
          result.detail,
          result.steered ? "steer" : "unsupported"
        )
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLiveChatDetail(message);
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createPanelLiveErrorMessage(session, currentMessages.length, message)
      ]);
    }
  }

  async function handleRetryLiveTurn() {
    const prompt = lastLivePrompt.trim();
    if (!canRetryLiveTurn || !prompt) {
      return;
    }

    await sendLivePanelPrompt(prompt, "retry");
  }

  async function handlePanelChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = draftMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    const slashCommandDecision = getPanelSlashCommandDecision(
      trimmedMessage,
      canUseLiveCodex,
      commandCatalog
    );

    if (slashCommandDecision.route === "blocked" || slashCommandDecision.route === "local-preview") {
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${session.id}:user:${currentMessages.length}`,
          role: "user",
          label: "You",
          body: trimmedMessage,
          meta: slashCommandDecision.command?.command ?? "slash command"
        },
        slashCommandDecision.route === "blocked"
          ? createPanelSlashCommandStatusMessage(
              session,
              currentMessages.length + 1,
              slashCommandDecision
            )
          : createPanelReplyMessage(session, currentMessages.length + 1, trimmedMessage, commandCatalog)
      ]);
      setDraftMessage("");
      return;
    }

    if (canUseLiveCodex) {
      if (liveChatRunning) {
        await handleSteerLiveTurn(trimmedMessage);
      } else {
        await sendLivePanelPrompt(
          trimmedMessage,
          "send",
          slashCommandDecision.route === "provider" ? slashCommandDecision : undefined
        );
      }
      return;
    }

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${session.id}:user:${currentMessages.length}`,
        role: "user",
        label: "You",
        body: trimmedMessage,
        meta: "draft"
      },
      createPanelReplyMessage(session, currentMessages.length + 1, trimmedMessage, commandCatalog)
    ]);
    setDraftMessage("");
  }

  return (
    <article
      aria-current={isFocused ? "true" : undefined}
      aria-label={isFocused ? `${identity.ariaLabel} - Focused` : identity.ariaLabel}
      className={classNames("session-cell", `role-${session.role}`, isFocused && "is-focused")}
      data-focused={isFocused ? "true" : undefined}
      tabIndex={isFocused ? 0 : undefined}
    >
      <header className="cell-header">
        <div className="cell-title-block">
          <PanelIdentitySignal identity={identity} />
          <h3 title={identity.title}>{identity.title}</h3>
        </div>
        <span className={classNames("state-chip", `state-${session.state}`)}>
          {stateIcon[session.state]}
          {session.state}
        </span>
      </header>

      <div className="cell-meta">
        <PanelBranchSignal branch={branchSignal} />
        <PanelRuntimeSignal runtime={runtimeSignal} />
        <PanelAttemptSignal attempt={attemptSignal} />
      </div>

      <div className="cell-chat" aria-label={`${identity.title} chat lane`}>
        <div className="cell-chat-context" aria-label="Panel context">
          <PanelValidationSignal validation={validationSignal} />
          <PanelActivitySignal activity={activitySignal} />
          <PanelFileScopeSignal scope={fileScope} />
          <PanelToolCoverageSignal coverage={toolCoverageSignal} />
        </div>
        <ol className="cell-chat-thread" aria-label={`${identity.title} messages`}>
          {chatMessages.map((message) => (
            <li
              className={classNames("chat-message", `chat-message-${message.role}`)}
              key={message.id}
              title={message.meta}
            >
              <span className="chat-avatar" aria-hidden="true">
                {message.role === "user" ? (
                  <UserRound size={13} />
                ) : message.role === "tool" ? (
                  <Terminal size={13} />
                ) : (
                  <MessageSquare size={13} />
                )}
              </span>
              <div className="chat-bubble">
                <div className="chat-message-header">
                  <strong>{message.label}</strong>
                  <small>{message.meta}</small>
                </div>
                <p>{message.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <footer className="cell-footer chat-composer-shell">
        <form className="chat-composer" onSubmit={handlePanelChatSubmit}>
          <button aria-label="Attach context" title="Attach context" type="button">
            <Paperclip size={15} />
          </button>
          <textarea
            aria-label={`Message ${identity.title}`}
            disabled={liveChatStarting}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask Codex, or type / for commands"
            rows={1}
            value={draftMessage}
          />
          {slashSuggestions.length > 0 ? (
            <div className="slash-command-menu" aria-label="Panel slash commands">
              {slashSuggestions.map((item) => (
                <button
                  className={`command-state-${item.state}`}
                  key={item.command}
                  onClick={() => setDraftMessage(`${item.command} `)}
                  title={`${item.detail} Scope: ${item.scopes.join(", ")}`}
                  type="button"
                >
                  <strong>{item.command}</strong>
                  <small>{item.label} · {item.scopes.join(", ")}</small>
                  <span>{item.state}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="chat-composer-meta">
            <span className={classNames("composer-status", `composer-status-${liveChatStatus}`)} title={liveChatDetail}>
              {composerStatusLabel}
            </span>
            {panelSessionIssue ? (
              <span
                className="session-identity-conflict"
                title={panelSessionIssue.detail}
              >
                Identity conflict
              </span>
            ) : null}
            {activeSlashCommandDecision ? (
              <span
                className={classNames(
                  "slash-feedback-pill",
                  `slash-feedback-${activeSlashCommandDecision.feedback.severity}`
                )}
                title={`${activeSlashCommandDecision.reason} ${activeSlashCommandDecision.feedback.nextAction}`}
              >
                {activeSlashCommandDecision.command?.command ?? "/"} {activeSlashCommandDecision.feedback.statusLabel}
              </span>
            ) : null}
            {unsupportedControlSummary.count > 0 ? (
              <span
                className="session-unsupported-summary"
                title={unsupportedControlSummary.detail}
              >
                {unsupportedControlSummary.label}
              </span>
            ) : null}
            <span
              className={classNames(
                "session-unsupported-summary",
                `session-lifecycle-${lifecycleControlGate.state}`
              )}
              title={`${lifecycleControlGate.detail} ${lifecycleControlGate.proof}`}
            >
              {lifecycleControlGate.statusLabel}
            </span>
            <button
              aria-label={`Interrupt ${identity.title}`}
              className="session-control-button"
              disabled={!canInterruptLiveTurn}
              onClick={handleInterruptLiveTurn}
              title={liveControlSnapshot.interrupt.reason}
              type="button"
            >
              <Pause size={15} />
            </button>
            <button
              aria-label={`Retry last prompt in ${identity.title}`}
              className="session-control-button"
              disabled={!canRetryLiveTurn}
              onClick={handleRetryLiveTurn}
              title={liveControlSnapshot.retry.reason}
              type="button"
            >
              <RotateCcw size={15} />
            </button>
            <button
              aria-label={`Fork ${identity.title}`}
              className={classNames(
                "session-control-button",
                `is-${liveControlSnapshot.fork.state}`
              )}
              disabled
              title={liveControlSnapshot.fork.reason}
              type="button"
            >
              <GitBranch size={15} />
            </button>
            <button
              aria-label={`Resume ${identity.title}`}
              className={classNames(
                "session-control-button",
                `is-${liveControlSnapshot.resume.state}`
              )}
              disabled
              title={liveControlSnapshot.resume.reason}
              type="button"
            >
              <Play size={15} />
            </button>
            <button
              aria-label={`Archive ${identity.title}`}
              className={classNames(
                "session-control-button",
                `is-${liveControlSnapshot.archive.state}`
              )}
              disabled
              title={liveControlSnapshot.archive.reason}
              type="button"
            >
              <Folder size={15} />
            </button>
            <button aria-label="Open lane options" title="Lane options" type="button">
              <MoreHorizontal size={15} />
            </button>
            <button
              aria-label={`Send message to ${identity.title}`}
              disabled={draftMessage.trim().length === 0 || liveChatStarting}
              title={liveChatRunning ? liveControlSnapshot.steer.reason : "Send"}
              type="submit"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </footer>
    </article>
  );
}

function PanelToolCoverageSignal({ coverage }: { coverage: CockpitPanelToolCoverage }) {
  return (
    <span
      aria-label={`Tool coverage: ${coverage.label}, ${coverage.countLabel}`}
      className={classNames("panel-tool-coverage", `panel-tool-${coverage.tone}`)}
      title={`${coverage.detail} (${coverage.countLabel})`}
    >
      <ClipboardList size={14} />
      <b>{coverage.label}</b>
      <small>{coverage.countLabel}</small>
    </span>
  );
}

function PanelActivitySignal({ activity }: { activity: CockpitPanelActivity }) {
  return (
    <span
      aria-label={`Latest activity: ${activity.label}, ${activity.countLabel}`}
      className={classNames("panel-activity-signal", `panel-activity-${activity.tone}`)}
      title={`${activity.detail} (${activity.countLabel})`}
    >
      <Activity size={14} />
      <b>{activity.label}</b>
      <small>{activity.countLabel}</small>
    </span>
  );
}

function PanelBranchSignal({ branch }: { branch: CockpitPanelBranch }) {
  return (
    <span
      aria-label={`Branch: ${branch.label}`}
      className={classNames("panel-branch-signal", `panel-branch-${branch.tone}`)}
      title={branch.detail}
    >
      <GitBranch size={14} />
      <b>{branch.label}</b>
    </span>
  );
}

function PanelRuntimeSignal({ runtime }: { runtime: CockpitPanelRuntime }) {
  return (
    <span
      aria-label={`Runtime: ${runtime.label}`}
      className={classNames("panel-runtime-signal", `panel-runtime-${runtime.tone}`)}
      title={runtime.detail}
    >
      <Terminal size={14} />
      <b>{runtime.label}</b>
    </span>
  );
}

function PanelValidationSignal({ validation }: { validation: CockpitPanelValidation }) {
  return (
    <span
      aria-label={`Validation status: ${validation.label}`}
      className={classNames("panel-validation-signal", `panel-validation-${validation.tone}`)}
      title={validation.detail}
    >
      {validation.label}
    </span>
  );
}

function PanelAttemptSignal({ attempt }: { attempt: CockpitPanelAttempt }) {
  return (
    <span
      aria-label={`Attempt limit: ${attempt.label}`}
      className={classNames("panel-attempt-signal", `panel-attempt-${attempt.tone}`)}
      title={attempt.detail}
    >
      <small>Attempt </small>
      <b>{attempt.label}</b>
    </span>
  );
}

function PanelFileScopeSignal({ scope }: { scope: CockpitPanelFileScope }) {
  return (
    <span
      aria-label={`File scope: ${scope.label}`}
      className={classNames("panel-file-scope", `panel-file-scope-${scope.tone}`)}
      title={scope.detail}
    >
      {scope.label}
    </span>
  );
}

function PanelIdentitySignal({ identity }: { identity: CockpitPanelIdentity }) {
  return (
    <div
      aria-label={`${identity.roleLabel} for ${identity.projectLabel}`}
      className={classNames("panel-identity-row", `panel-identity-${identity.tone}`)}
      title={identity.detail}
    >
      <span className="cell-role">{identity.roleLabel}</span>
      <span aria-hidden="true" className="panel-identity-divider">
        /
      </span>
      <span className="panel-project-label">{identity.projectLabel}</span>
    </div>
  );
}

function PanelRosterSignal({ roster }: { roster: CockpitPanelRoster }) {
  return (
    <div
      aria-label={`Panel roster: ${roster.label}`}
      className={classNames("panel-roster-chip", `panel-roster-${roster.tone}`)}
      title={roster.detail}
    >
      <div className="panel-roster-copy">
        <strong>{roster.label}</strong>
        <small>
          {roster.visibleLabel} / {roster.hiddenLabel}
        </small>
      </div>
      <div className="panel-roster-metrics" aria-label="Panel roster role counts">
        {roster.metrics.map((metric) => (
          <span
            className={classNames("panel-roster-metric", `panel-roster-metric-${metric.tone}`)}
            key={metric.label}
            title={`${metric.label}: ${metric.value}`}
          >
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function PanelOverflowSignal({ overflow }: { overflow: CockpitPanelOverflow }) {
  const visibleLabel = overflow.tone === "clear" ? "All visible" : "Hidden queue";

  return (
    <div
      aria-label={`Hidden panel queue: ${overflow.label}`}
      className={classNames("panel-overflow-chip", `panel-overflow-${overflow.tone}`)}
      title={overflow.detail}
    >
      <div className="panel-overflow-copy">
        <strong>{visibleLabel}</strong>
        <small>{overflow.hiddenLabel}</small>
      </div>
      <div className="panel-overflow-next">
        <small>Next</small>
        <strong title={overflow.nextLabel}>{overflow.nextLabel}</strong>
      </div>
      <b>{overflow.reviewLabel}</b>
    </div>
  );
}

function LayoutCapacitySignal({ capacity }: { capacity: CockpitLayoutCapacity }) {
  return (
    <div
      aria-label={`Layout capacity: ${capacity.label}`}
      className={classNames("layout-capacity-chip", `layout-capacity-${capacity.tone}`)}
      title={capacity.detail}
    >
      <div>
        <strong>{capacity.layoutLabel}</strong>
        <small>{capacity.capacityLabel}</small>
      </div>
      <b>{capacity.usageLabel}</b>
    </div>
  );
}

function FocusedPanelStatusChip({
  focusTarget,
  onClearFocus,
  onFocus,
  status
}: {
  focusTarget: CockpitPanelFocusTarget;
  onClearFocus: () => void;
  onFocus: () => void;
  status: CockpitFocusedPanelStatus;
}) {
  const controls = createCockpitToolbarFocusAction(focusTarget, status);

  return (
    <div
      aria-label={`Focused panel status: ${status.label}. ${status.detail}`}
      className={classNames("focused-panel-chip", `focused-panel-${status.tone}`)}
      title={controls.statusTitle}
    >
      <CircleDot size={14} />
      <div className="focused-panel-copy">
        <strong>{status.label}</strong>
        <small>{status.detail}</small>
      </div>
      <div className="focused-panel-actions">
        <button
          aria-label={controls.focusAriaLabel}
          disabled={controls.focusDisabled}
          onClick={onFocus}
          title={controls.focusTitle}
          type="button"
        >
          <span>{controls.focusLabel}</span>
        </button>
        <button
          aria-label={controls.clearAriaLabel}
          disabled={controls.clearDisabled}
          onClick={onClearFocus}
          title={controls.clearTitle}
          type="button"
        >
          <span>{controls.clearLabel}</span>
        </button>
      </div>
    </div>
  );
}

export function DispatchReviewRecordCard({
  record,
  run
}: {
  record: DispatchReviewRecord;
  run?: MockOrchestratorRun;
}) {
  const currentEvidenceFingerprint = run
    ? buildCurrentDispatchReviewEvidenceFingerprint(record, run)
    : undefined;
  const depth = buildPhase7DispatchReviewDepth({
    records: [record],
    selectedRecord: record,
    currentEvidenceFingerprint
  });
  const ownershipDepth = buildPhase7IntegrationOwnershipDepth(record);
  const traceability = buildPhase7DispatchTraceability({
    record,
    depth,
    ownership: ownershipDepth
  });
  const blockerPriority = buildPhase7DispatchBlockerPriority({
    depth,
    ownership: ownershipDepth,
    traceability
  });
  const artifact = buildPhase7DispatchReviewArtifact({
    exportedAt: record.createdAt,
    evaluatedAt: record.createdAt,
    record,
    depth,
    ownership: ownershipDepth,
    traceability,
    blockerPriority
  });
  const artifactVerification = verifyPhase7DispatchReviewArtifact(artifact, {
    expectedEvidenceFingerprint: record.reviewEvidenceFingerprint,
    verifiedAt: record.createdAt
  });
  const liveWorkerLaunchGate = buildPhase7LiveWorkerLaunchGate(artifactVerification);
  const dispatchClosureGate = buildPhase7DispatchClosureGate({
    record,
    artifactVerification,
    launchGate: liveWorkerLaunchGate
  });
  const dispatchCloseoutProof = buildPhase7DispatchCloseoutProof({
    artifactVerification,
    launchGate: liveWorkerLaunchGate,
    closureGate: dispatchClosureGate
  });
  const ownerHandoffReport = buildPhase7DispatchOwnerHandoffReport({
    record,
    closeout: dispatchCloseoutProof
  });
  const dispatchCompletionGate = buildPhase7DispatchCompletionGate(ownerHandoffReport);
  const workerSessionCreationGate = buildPhase7WorkerSessionCreationGate(
    dispatchCompletionGate,
    liveWorkerLaunchGate
  );

  return (
    <article
      aria-label={`Dispatch review record for ${record.title}`}
      className={classNames("dispatch-review-record", `dispatch-review-${record.readinessState}`)}
      title={record.detail}
    >
      <div className="dispatch-review-record-header">
        <div>
          <strong>{record.title}</strong>
          <small>{formatTimestamp(record.createdAt)}</small>
        </div>
        <span>{record.readinessState}</span>
      </div>
      <dl className="dispatch-review-record-metrics">
        <div>
          <dt>Panels</dt>
          <dd>{record.panelCount}</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{record.handoffTaskCount}</dd>
        </div>
        <div>
          <dt>Gates</dt>
          <dd>{record.validationGateCount}</dd>
        </div>
        <div>
          <dt>Packets</dt>
          <dd>{Array.isArray(record.handoffPackets) ? record.handoffPackets.length : 0}</dd>
        </div>
        <div>
          <dt>Max Try</dt>
          <dd>{record.maxAttemptLimit}</dd>
        </div>
      </dl>
      <div className="dispatch-review-role-counts" aria-label="Dispatch review role counts">
        <span>Orch {record.roleCounts.orchestrator}</span>
        <span>Impl {record.roleCounts.implementer}</span>
        <span>Val {record.roleCounts.validator}</span>
        <span>Int {record.roleCounts.integration}</span>
      </div>
      <p>{record.nextAction}</p>
      <DispatchReviewDepthSummary snapshot={depth} />
      <div
        aria-label={ownershipDepth.ariaLabel}
        className={classNames(
          "dispatch-integration-depth",
          `dispatch-integration-depth-${ownershipDepth.state}`
        )}
        title={ownershipDepth.nextAction}
      >
        <div className="dispatch-integration-depth-header">
          <strong>Integration ownership</strong>
          <span>{ownershipDepth.statusLabel}</span>
          <b>{ownershipDepth.readiness}%</b>
        </div>
        <ol className="dispatch-integration-depth-list" aria-label="Phase 7 integration ownership checks">
          {ownershipDepth.items.map((item) => (
            <li
              className={`dispatch-integration-depth-item-${item.status}`}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <small>{ownershipDepth.integrationOwnershipProof}</small>
      </div>
      <div
        aria-label={traceability.ariaLabel}
        className={classNames(
          "dispatch-traceability",
          `dispatch-traceability-${traceability.state}`
        )}
        title={traceability.safety}
      >
        <div className="dispatch-traceability-header">
          <strong>{traceability.label}</strong>
          <span>{traceability.statusLabel}</span>
          <b>{traceability.readiness}%</b>
        </div>
        <dl className="dispatch-traceability-grid" aria-label="Phase 7 dispatch traceability counts">
          <div>
            <dt>PM</dt>
            <dd>{traceability.linkedPmTaskCount}</dd>
          </div>
          <div>
            <dt>Locks</dt>
            <dd>{traceability.liveWorkerLockCount}</dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd>{traceability.blockedCount + traceability.waitingCount + traceability.reviewCount}</dd>
          </div>
        </dl>
        <ol className="dispatch-traceability-list" aria-label="Phase 7 dispatch traceability rows">
          {traceability.items.map((item) => (
            <li
              className={`dispatch-traceability-item-${item.status}`}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <small>{traceability.dispatchTraceabilityProof}</small>
      </div>
      <div
        aria-label={blockerPriority.ariaLabel}
        className={classNames(
          "dispatch-blocker-priority",
          `dispatch-blocker-priority-${blockerPriority.state}`
        )}
        title={blockerPriority.safety}
      >
        <div className="dispatch-blocker-priority-header">
          <strong>{blockerPriority.label}</strong>
          <span>
            {blockerPriority.dispatchReviewCanAddressTopBlocker
              ? "Reviewable"
              : blockerPriority.openBlockerCount > 0
                ? "Owner action"
                : "Ready"}
          </span>
          <b>{blockerPriority.readiness}%</b>
        </div>
        <p title={blockerPriority.topPriorityAction}>{blockerPriority.topPriorityLabel}</p>
        <dl className="dispatch-blocker-priority-grid" aria-label="Phase 7 dispatch blocker priority counts">
          <div>
            <dt>Open</dt>
            <dd>{blockerPriority.openBlockerCount}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>{blockerPriority.dispatchReviewAddressableCount}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{blockerPriority.statusLabel}</dd>
          </div>
        </dl>
        <ol className="dispatch-blocker-priority-list" aria-label="Phase 7 dispatch blocker priority rows">
          {blockerPriority.items.length > 0 ? (
            blockerPriority.items.slice(0, 5).map((item) => (
              <li
                className={`dispatch-blocker-priority-item-${item.status}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>#{item.priority}</span>
                <div>
                  <strong>{item.label}</strong>
                  <em>{item.detail}</em>
                  <small>{item.nextAction}</small>
                </div>
                <b>{item.kind}</b>
              </li>
            ))
          ) : (
            <li className="dispatch-blocker-priority-item-ready">
              <span>OK</span>
              <strong>No open Phase 7 blocker</strong>
              <b>ready</b>
            </li>
          )}
        </ol>
        <small>{blockerPriority.dispatchBlockerPriorityProof}</small>
      </div>
      <DispatchReviewArtifactVerificationSummary verification={artifactVerification} />
      <DispatchLiveWorkerLaunchGateSummary gate={liveWorkerLaunchGate} />
      <DispatchClosureGateSummary gate={dispatchClosureGate} />
      <DispatchCloseoutProofSummary closeout={dispatchCloseoutProof} />
      <DispatchOwnerHandoffReportSummary report={ownerHandoffReport} />
      <DispatchCompletionGateSummary gate={dispatchCompletionGate} />
      <WorkerSessionCreationGateSummary gate={workerSessionCreationGate} />
      <small>{record.noRuntimeExecutionNote}</small>
    </article>
  );
}

function WorkerSessionCreationGateSummary({
  gate
}: {
  gate: Phase7WorkerSessionCreationGate;
}) {
  return (
    <div
      aria-label={`Phase 7 worker session creation gate: ${gate.statusLabel}; can create ${gate.canCreateWorkerSession ? "yes" : "no"}; owner approval ${gate.ownerApprovalRecorded ? "recorded" : "required"}; next action: ${gate.nextAction}`}
      className={classNames(
        "worker-session-creation-gate",
        `worker-session-creation-gate-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="worker-session-creation-gate-header">
        <strong>Worker session creation gate</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl
        className="worker-session-creation-gate-grid"
        aria-label="Phase 7 worker session creation gate counts"
      >
        <div>
          <dt>Create</dt>
          <dd>{gate.canCreateWorkerSession ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Preflight</dt>
          <dd>{gate.preflightState}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{gate.ownerApprovalRecorded ? "Recorded" : "Required"}</dd>
        </div>
        <div>
          <dt>Handler</dt>
          <dd>{gate.liveSessionHandlerReady ? "Ready" : "Missing"}</dd>
        </div>
      </dl>
      <p>{gate.detail}</p>
      <small>{gate.nextAction}</small>
      <small>{gate.sessionCreationProof}</small>
    </div>
  );
}

function DispatchCompletionGateSummary({
  gate
}: {
  gate: Phase7DispatchCompletionGate;
}) {
  return (
    <div
      aria-label={`Phase 7 dispatch completion gate: ${gate.statusLabel}; phase complete ${gate.phaseComplete ? "yes" : "no"}; can spawn ${gate.canSpawnLiveWorker ? "yes" : "no"}; next action: ${gate.nextAction}`}
      className={classNames(
        "dispatch-completion-gate",
        `dispatch-completion-gate-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="dispatch-completion-gate-header">
        <strong>Dispatch completion gate</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="dispatch-completion-gate-grid" aria-label="Phase 7 dispatch completion gate counts">
        <div>
          <dt>Phase</dt>
          <dd>{gate.phaseComplete ? "Complete" : "Open"}</dd>
        </div>
        <div>
          <dt>Spawn</dt>
          <dd>{gate.canSpawnLiveWorker ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{gate.ownerHandoffState}</dd>
        </div>
        <div>
          <dt>Push</dt>
          <dd>{gate.pushApprovalRequired ? "Required" : "Recorded"}</dd>
        </div>
      </dl>
      <p>{gate.detail}</p>
      <small>{gate.nextAction}</small>
      <small>{gate.completionGateProof}</small>
    </div>
  );
}

function DispatchOwnerHandoffReportSummary({
  report
}: {
  report: Phase7DispatchOwnerHandoffReport;
}) {
  return (
    <div
      aria-label={`Phase 7 dispatch owner handoff report: ${report.statusLabel}; final validation owner ${report.finalValidationOwner}; commit push reporting owner ${report.commitPushReportingOwner}; can spawn ${report.canSpawnLiveWorker ? "yes" : "no"}; next action: ${report.nextAction}`}
      className={classNames(
        "dispatch-owner-handoff-report",
        `dispatch-owner-handoff-report-${report.state}`
      )}
      title={report.detail}
    >
      <div className="dispatch-owner-handoff-report-header">
        <strong>Owner handoff report</strong>
        <span>{report.statusLabel}</span>
        <b>{report.readiness}%</b>
      </div>
      <dl className="dispatch-owner-handoff-report-grid" aria-label="Phase 7 dispatch owner handoff report counts">
        <div>
          <dt>Final</dt>
          <dd>{report.finalValidationOwner}</dd>
        </div>
        <div>
          <dt>Push</dt>
          <dd>{report.pushApprovalRequired ? "Required" : "Recorded"}</dd>
        </div>
        <div>
          <dt>Packets</dt>
          <dd>{report.handoffPacketCount}</dd>
        </div>
        <div>
          <dt>Spawn</dt>
          <dd>{report.canSpawnLiveWorker ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p>{report.detail}</p>
      <small>{report.nextAction}</small>
      <small>{report.ownerHandoffProof}</small>
    </div>
  );
}

function DispatchCloseoutProofSummary({
  closeout
}: {
  closeout: Phase7DispatchCloseoutProof;
}) {
  return (
    <div
      aria-label={`Phase 7 dispatch closeout proof: ${closeout.statusLabel}; can close ${closeout.canCloseDispatchReview ? "yes" : "no"}; can spawn ${closeout.canSpawnLiveWorker ? "yes" : "no"}; next action: ${closeout.nextAction}`}
      className={classNames(
        "dispatch-closeout-proof",
        `dispatch-closeout-proof-${closeout.state}`
      )}
      title={closeout.detail}
    >
      <div className="dispatch-closeout-proof-header">
        <strong>Dispatch closeout proof</strong>
        <span>{closeout.statusLabel}</span>
        <b>{closeout.readiness}%</b>
      </div>
      <dl className="dispatch-closeout-proof-grid" aria-label="Phase 7 dispatch closeout proof counts">
        <div>
          <dt>Close</dt>
          <dd>{closeout.canCloseDispatchReview ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Spawn</dt>
          <dd>{closeout.canSpawnLiveWorker ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Gates</dt>
          <dd>
            {closeout.artifactVerificationState}/{closeout.launchGateState}/
            {closeout.closureGateState}
          </dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{closeout.openBlockerCount}</dd>
        </div>
      </dl>
      <p>{closeout.detail}</p>
      <small>{closeout.nextAction}</small>
      <small>{closeout.closeoutProof}</small>
    </div>
  );
}

function DispatchClosureGateSummary({
  gate
}: {
  gate: Phase7DispatchClosureGate;
}) {
  return (
    <div
      aria-label={`Phase 7 dispatch closure gate: ${gate.statusLabel}; can close ${gate.canCloseDispatchReview ? "yes" : "no"}; can spawn ${gate.canSpawnLiveWorker ? "yes" : "no"}; approval ${gate.approvalRequired ? "required" : "recorded"}; next action: ${gate.nextAction}`}
      className={classNames(
        "dispatch-closure-gate",
        `dispatch-closure-gate-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="dispatch-closure-gate-header">
        <strong>Dispatch closure gate</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="dispatch-closure-gate-grid" aria-label="Phase 7 dispatch closure gate counts">
        <div>
          <dt>Close</dt>
          <dd>{gate.canCloseDispatchReview ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Spawn</dt>
          <dd>{gate.canSpawnLiveWorker ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Links</dt>
          <dd>{gate.traceabilityLinkCount}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{gate.openBlockerCount}</dd>
        </div>
      </dl>
      <p>{gate.detail}</p>
      <small>{gate.nextAction}</small>
      <small>{gate.closureGateProof}</small>
    </div>
  );
}

function DispatchLiveWorkerLaunchGateSummary({
  gate
}: {
  gate: Phase7LiveWorkerLaunchGate;
}) {
  return (
    <div
      aria-label={`Phase 7 live worker launch gate: ${gate.statusLabel}; can spawn ${gate.canSpawnLiveWorker ? "yes" : "no"}; approval ${gate.approvalRequired ? "required" : "recorded"}; next action: ${gate.nextAction}`}
      className={classNames(
        "dispatch-live-worker-launch-gate",
        `dispatch-live-worker-launch-gate-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="dispatch-live-worker-launch-gate-header">
        <strong>Live worker launch gate</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="dispatch-live-worker-launch-gate-grid" aria-label="Phase 7 live worker launch gate counts">
        <div>
          <dt>Spawn</dt>
          <dd>{gate.canSpawnLiveWorker ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{gate.approvalRequired ? "Required" : "Recorded"}</dd>
        </div>
        <div>
          <dt>Locks</dt>
          <dd>{gate.liveWorkerLockCount}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{gate.openBlockerCount}</dd>
        </div>
      </dl>
      <p>{gate.detail}</p>
      <small>{gate.nextAction}</small>
      <small>{gate.launchGateProof}</small>
    </div>
  );
}

function DispatchReviewArtifactVerificationSummary({
  verification
}: {
  verification: Phase7DispatchReviewArtifactVerification;
}) {
  return (
    <div
      aria-label={`Phase 7 dispatch artifact verification: ${verification.statusLabel}; ${verification.readiness}% ready; ${verification.openBlockerCount} open blockers; execution ${verification.executionLocked ? "locked" : "unlocked"}; next action: ${verification.nextAction}`}
      className={classNames(
        "dispatch-artifact-verification",
        `dispatch-artifact-verification-${verification.state}`
      )}
      title={verification.detail}
    >
      <div className="dispatch-artifact-verification-header">
        <strong>Dispatch artifact verification</strong>
        <span>{verification.statusLabel}</span>
        <b>{verification.readiness}%</b>
      </div>
      <dl className="dispatch-artifact-verification-grid" aria-label="Phase 7 dispatch artifact verification counts">
        <div>
          <dt>Packets</dt>
          <dd>{verification.handoffPacketCount}</dd>
        </div>
        <div>
          <dt>PM</dt>
          <dd>{verification.linkedPmTaskCount}</dd>
        </div>
        <div>
          <dt>Locks</dt>
          <dd>{verification.liveWorkerLockCount}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{verification.openBlockerCount}</dd>
        </div>
      </dl>
      <p>{verification.detail}</p>
      <small>{verification.nextAction}</small>
      <small>
        artifactVerification={verification.state} fingerprint=
        {verification.recordEvidenceFingerprint ?? "missing"} expected=
        {verification.expectedEvidenceFingerprint ?? "missing"} match=
        {verification.matchesExpectedEvidence === false ? "review" : "ready"} execution=
        {verification.executionLocked ? "locked" : "unlocked"}
      </small>
    </div>
  );
}

function DispatchReviewDepthSummary({
  snapshot
}: {
  snapshot: Phase7DispatchReviewDepthSnapshot;
}) {
  return (
    <div
      aria-label={snapshot.ariaLabel}
      className={classNames(
        "dispatch-review-depth",
        `dispatch-review-depth-${snapshot.state}`
      )}
      title={snapshot.nextAction}
    >
      <div className="dispatch-review-depth-header">
        <strong>Review depth</strong>
        <span>{snapshot.statusLabel}</span>
        <b>{snapshot.readiness}%</b>
      </div>
      <dl className="dispatch-review-depth-grid">
        <div>
          <dt>Open</dt>
          <dd>{snapshot.openDepthCount}</dd>
        </div>
        <div>
          <dt>Roles</dt>
          <dd>{snapshot.roleCoverageCount}/4</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{snapshot.handoffTaskCount}</dd>
        </div>
        <div>
          <dt>Gates</dt>
          <dd>{snapshot.validationGateCount}</dd>
        </div>
      </dl>
      <ol className="dispatch-review-depth-list" aria-label="Phase 7 dispatch review depth checks">
        {snapshot.items.map((item) => (
          <li
            className={`dispatch-review-depth-item-${item.status}`}
            key={item.id}
            title={`${item.detail} ${item.nextAction}`}
          >
            <span>{item.kind}</span>
            <div>
              <strong>{item.label}</strong>
              <em>{item.detail}</em>
              <small>{item.nextAction}</small>
            </div>
            <b>{item.status}</b>
          </li>
        ))}
      </ol>
      <small>{snapshot.dispatchReviewDepthProof}</small>
    </div>
  );
}

function PipelineView({
  items,
  mockRuns,
  onOpenRun,
  onStagePackage,
  project,
  registryEntry,
  runtimeAdapter,
  tasks
}: {
  items: PipelineItem[];
  mockRuns: MockOrchestratorRun[];
  onOpenRun: (runId: string) => void;
  onStagePackage: (dispatchPackage: DispatchPackage) => void;
  project: ProjectSummary;
  registryEntry?: RegistryEntry;
  runtimeAdapter?: RuntimeAdapter;
  tasks: OrchestrationTask[];
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(items[0]?.id);
  const [dispatchRequestHistory, setDispatchRequestHistory] = useState<PipelineDispatchRequestRecord[]>(
    () => loadPipelineDispatchRequestHistory()
  );
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];
  const selectedPreview = selectedItem
    ? buildPipelineItemDispatchPreview(selectedItem, registryEntry, runtimeAdapter)
    : undefined;
  const dispatchRequestIntent = latestPipelineDispatchRequestIntent(
    dispatchRequestHistory,
    selectedPreview?.itemId
  );
  const selectedDispatchHistory = selectedPreview
    ? dispatchRequestHistory.filter((record) => record.itemId === selectedPreview.itemId)
    : [];
  const selectedRunLinks = selectedItem ? buildPipelineItemRunLinks(selectedItem, mockRuns) : [];
  const itemRunStatusById = useMemo(
    () => new Map(items.map((item) => [item.id, summarizePipelineItemRunStatus(item, mockRuns)])),
    [items, mockRuns]
  );
  const selectedRunStatus = selectedItem ? itemRunStatusById.get(selectedItem.id) : undefined;
  const selectedRolePanelPlan = useMemo(() => {
    if (!selectedItem || !selectedPreview) {
      return undefined;
    }

    const packageResult = tryBuildPipelineItemDispatchPackage(
      selectedItem,
      project,
      selectedPreview,
      {
        createdAt: "1970-01-01T00:00:00.000Z",
        idSeed: "pipeline-role-panel-preview",
        status: "ready"
      }
    );

    if (!packageResult.ok) {
      return undefined;
    }

    const linkedRunId = selectedRunStatus?.latestRunId;
    const linkedRun = linkedRunId ? mockRuns.find((run) => run.id === linkedRunId) : undefined;
    const previewRun = linkedRun ?? createMockRunFromDispatchPackage(packageResult.package, {
      createdAt: packageResult.package.createdAt,
      idSeed: "pipeline-role-panel-preview",
      status: "queued"
    });

    return createDispatchRolePanelPlan(packageResult.package, previewRun);
  }, [mockRuns, project, selectedItem, selectedPreview, selectedRunStatus?.latestRunId]);
  const canRequestDispatch = Boolean(selectedPreview?.canDispatch) && dispatchRequestIntent !== "requested";
  const canCancelDispatch = dispatchRequestIntent === "requested";
  const dispatchableItemCount = items.filter((item) =>
    buildPipelineItemDispatchPreview(item, registryEntry, runtimeAdapter).canDispatch
  ).length;
  const registryReady = registryEntry ? dispatchableRegistryEntries([registryEntry]).length === 1 : false;
  const runtimeReady = runtimeAdapter ? canRunWithAdapter(runtimeAdapter) : false;
  const dispatchableCount = registryReady && runtimeReady ? dispatchableItemCount : 0;
  const taskSummary = summarizeTasks(tasks);
  const handoffTask = nextHandoffTask(tasks);
  const handoff = handoffTask ? buildHandoffBrief(handoffTask, project) : undefined;

  useEffect(() => {
    savePipelineDispatchRequestHistory(dispatchRequestHistory);
  }, [dispatchRequestHistory]);

  function recordPipelineDispatchAction(action: PipelineDispatchRequestAction) {
    if (!selectedPreview) {
      return;
    }

    const record = createPipelineDispatchRequestRecord(
      selectedPreview,
      action,
      new Date().toISOString()
    );

    setDispatchRequestHistory((current) =>
      appendPipelineDispatchRequestRecord(current, record)
    );
  }

  function createPipelineCockpitRun() {
    if (!selectedItem || !selectedPreview) {
      return;
    }

    const result = tryBuildPipelineItemDispatchPackage(
      selectedItem,
      project,
      selectedPreview,
      {
        createdAt: new Date().toISOString(),
        idSeed: "pipeline-item"
      }
    );

    if (result.ok) {
      onStagePackage(result.package);
    }
  }

  return (
    <section className="pipeline-view">
      <div className="pipeline-header">
        <div>
          <h3>Project Pipeline</h3>
          <p>{project.name} orchestration lane</p>
          <div className="gate-row" aria-label="Dispatch gates">
            <span className={classNames("gate-chip", registryReady ? "gate-ready" : "gate-review")}>
              Registry {registryEntry?.readiness ?? 0}%
            </span>
            <span className={classNames("gate-chip", runtimeReady ? "gate-ready" : "gate-review")}>
              Runtime {runtimeAdapter ? runtimeStateLabel(runtimeAdapter.state) : "Missing"}
            </span>
          </div>
        </div>
        <button
          disabled={!canRequestDispatch}
          onClick={() => recordPipelineDispatchAction("requested")}
          title={selectedPreview?.detail ?? `${dispatchableCount} ready tasks`}
          type="button"
        >
          <Play size={16} />
          Request Dispatch
        </button>
      </div>

      <div className="pipeline-body">
        <div className="pipeline-left">
          <div className="pipeline-table" aria-label="Pipeline readiness">
            {items.map((item) => {
              const runStatus = itemRunStatusById.get(item.id);

              return (
                <button
                  aria-pressed={selectedPreview?.itemId === item.id}
                  className={classNames(
                    "pipeline-row",
                    "pipeline-row-button",
                    selectedPreview?.itemId === item.id && "is-selected"
                  )}
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  type="button"
                >
                  <div>
                    <span className={classNames("pipeline-stage", `stage-${item.stage}`)}>{item.stage}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <span>{item.owner}</span>
                  <span>{item.risk}</span>
                  <span>{item.readiness}%</span>
                  <PipelineRunStatusPill summary={runStatus} />
                </button>
              );
            })}
          </div>

          <section className="task-board" aria-label="Task split">
            <div className="task-board-header">
              <div>
                <h4>Task Split</h4>
                <span>{taskSummary.total} scoped tasks</span>
              </div>
              <div className="summary-chips" aria-label="Task status summary">
                <span>{taskSummary.queued} queued</span>
                <span>{taskSummary.implementing} active</span>
                <span>{taskSummary.validating} validating</span>
                <span>{taskSummary.blocked} blocked</span>
              </div>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div>
                    <span className={classNames("task-status", `task-${task.status}`)}>{task.status}</span>
                    <h5>{task.title}</h5>
                    <p>{task.objective}</p>
                  </div>
                  <span>{task.owner}</span>
                  <span>{task.role}</span>
                  <span>
                    {task.attempt}/{task.attemptLimit}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="handoff-panel pipeline-detail-panel" aria-label="Selected pipeline item dispatch preview">
          {selectedPreview ? (
            <PipelineItemDispatchDetail
              canCancelDispatch={canCancelDispatch}
              canCreateCockpitRun={Boolean(selectedPreview.canDispatch)}
              canRequestDispatch={canRequestDispatch}
              handoff={handoff}
              handoffTask={handoffTask}
              history={selectedDispatchHistory}
              intent={dispatchRequestIntent}
              onCancelDispatch={() => recordPipelineDispatchAction("cancelled")}
              onCreateCockpitRun={createPipelineCockpitRun}
              onOpenRun={onOpenRun}
              onRequestDispatch={() => recordPipelineDispatchAction("requested")}
              preview={selectedPreview}
              rolePanelPlan={selectedRolePanelPlan}
              runLinks={selectedRunLinks}
              runStatus={selectedRunStatus}
            />
          ) : (
            <p className="empty-preview">Select a pipeline item to inspect dispatch readiness.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function PipelineItemDispatchDetail({
  canCancelDispatch,
  canCreateCockpitRun,
  canRequestDispatch,
  history,
  handoff,
  handoffTask,
  intent,
  onCancelDispatch,
  onCreateCockpitRun,
  onOpenRun,
  onRequestDispatch,
  preview,
  rolePanelPlan,
  runLinks,
  runStatus
}: {
  canCancelDispatch: boolean;
  canCreateCockpitRun: boolean;
  canRequestDispatch: boolean;
  history: PipelineDispatchRequestRecord[];
  handoff?: ReturnType<typeof buildHandoffBrief>;
  handoffTask?: OrchestrationTask;
  intent: PipelineDispatchRequestIntent;
  onCancelDispatch: () => void;
  onCreateCockpitRun: () => void;
  onOpenRun: (runId: string) => void;
  onRequestDispatch: () => void;
  preview: PipelineItemDispatchPreview;
  rolePanelPlan?: DispatchRolePanelPlan;
  runLinks: PipelineItemRunLink[];
  runStatus?: PipelineItemRunStatusSummary;
}) {
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">Selected Item</span>
          <h4>{preview.title}</h4>
        </div>
        <span className={classNames("preview-state", `preview-${preview.state}`)}>{preview.state}</span>
      </header>

      <div className="pipeline-detail-body">
        <section className="pipeline-detail-summary" aria-label="Selected pipeline item summary">
          <p title={preview.detail}>{preview.detail}</p>
          <dl>
            <div>
              <dt>Stage</dt>
              <dd>{preview.stage}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{preview.owner}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{preview.risk}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{preview.readiness}%</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>
                <PipelineRunStatusPill compact summary={runStatus} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="pipeline-gate-section">
          <h5>Dispatch Gates</h5>
          <ol className="dispatch-gate-list" aria-label="Selected item dispatch gates">
            {preview.gates.map((gate) => (
              <li className={`dispatch-gate-${gate.status}`} key={gate.id}>
                <span />
                <div>
                  <strong>{gate.label}</strong>
                  <small title={gate.detail}>{gate.detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pipeline-role-plan-section" aria-label="Dispatch role panel plan">
          <div className="pipeline-role-plan-header">
            <div>
              <h5>Role Panel Plan</h5>
              <small>
                {rolePanelPlan
                  ? `${rolePanelPlan.totalPanelCount} panels prepared for Arena review`
                  : "Dispatch gates must be ready before panel planning."}
              </small>
            </div>
            <span className={classNames("preview-state", rolePanelPlan ? "preview-ready" : "preview-review")}>
              {rolePanelPlan?.readinessState ?? "waiting"}
            </span>
          </div>
          {rolePanelPlan ? (
            <>
              <div className="pipeline-role-counts" aria-label="Role panel counts">
                <span>Orch {rolePanelPlan.roleCounts.orchestrator}</span>
                <span>Impl {rolePanelPlan.roleCounts.implementer}</span>
                <span>Val {rolePanelPlan.roleCounts.validator}</span>
                <span>Int {rolePanelPlan.roleCounts.integration}</span>
              </div>
              <ol className="pipeline-role-panel-list">
                {rolePanelPlan.panels.map((panel) => (
                  <li className={`pipeline-role-panel-card role-${panel.role}`} key={panel.panelId}>
                    <div className="pipeline-role-panel-card-header">
                      <div>
                        <strong title={panel.title}>{panel.title}</strong>
                        <small>{panel.role}</small>
                      </div>
                      <span>{panel.state}</span>
                    </div>
                    <div className="pipeline-role-panel-meta">
                      <span title={panel.attemptLabel}>{panel.attemptLabel}</span>
                      <span title={panel.validationLabel}>{panel.validationLabel}</span>
                    </div>
                    <p title={panel.acceptanceSummary}>{panel.acceptanceSummary}</p>
                    <small title={panel.files.join(" | ")}>{panel.files.slice(0, 2).join(" | ")}</small>
                    <em>{panel.noRuntimeExecutionNote}</em>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="pipeline-role-plan-empty">
              Resolve dispatch gates to generate orchestrator, implementer, validator, and integration panel plans.
            </p>
          )}
        </section>

        <section className="pipeline-request-section">
          <div className="pipeline-request-header">
            <div>
              <h5>Dispatch Request</h5>
              <small>{intent === "requested" ? "Request pending" : "No active request"}</small>
            </div>
            <span className={classNames("preview-state", intent === "requested" ? "preview-ready" : "preview-review")}>
              {intent}
            </span>
          </div>
          <div className="pipeline-request-actions">
            <button
              aria-label="Request selected pipeline item dispatch"
              disabled={!canRequestDispatch}
              onClick={onRequestDispatch}
              type="button"
            >
              Request
            </button>
            <button
              aria-label="Cancel selected pipeline item dispatch request"
              disabled={!canCancelDispatch}
              onClick={onCancelDispatch}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="pipeline-cockpit-link">
            <div>
              <strong>Local Arena run</strong>
              <small>Creates a local run projection from this pipeline item.</small>
            </div>
            <button
              aria-label="Create local Arena run from selected pipeline item"
              disabled={!canCreateCockpitRun}
              onClick={onCreateCockpitRun}
              type="button"
            >
              Create Run
            </button>
          </div>
          <PipelineItemRunLinks links={runLinks} onOpenRun={onOpenRun} />
          <ol className="pipeline-request-history" aria-label="Selected pipeline item dispatch request history">
            {history.length > 0 ? (
              history.slice(0, 4).map((record) => (
                <PipelineDispatchRequestRecordRow key={record.id} record={record} />
              ))
            ) : (
              <li className="pipeline-request-empty">Request dispatch to create a local record.</li>
            )}
          </ol>
        </section>

        <section className="pipeline-handoff-section">
          <div className="pipeline-handoff-header">
            <div>
              <span className="eyebrow">Next Handoff</span>
              <h5>{handoff?.title ?? "No task selected"}</h5>
            </div>
            {handoffTask ? (
              <span className={classNames("task-status", `task-${handoffTask.status}`)}>{handoffTask.status}</span>
            ) : null}
          </div>
          <pre>{handoff?.markdown ?? "No scoped task is ready for handoff."}</pre>
        </section>
      </div>
    </>
  );
}

function PipelineItemRunLinks({
  links,
  onOpenRun
}: {
  links: PipelineItemRunLink[];
  onOpenRun: (runId: string) => void;
}) {
  return (
    <section className="pipeline-linked-runs" aria-label="Selected pipeline item linked Arena runs">
      <div className="pipeline-linked-runs-header">
        <strong>Linked Arena runs</strong>
        <span>{links.length}</span>
      </div>
      {links.length > 0 ? (
        <ol>
          {links.map((link) => (
            <li className="pipeline-linked-run" key={link.runId}>
              <div>
                <strong title={link.title}>{link.title}</strong>
                <small title={link.sourcePackageId}>
                  {formatShortDate(link.createdAt)} | {link.taskCount} tasks | {link.validationGateCount} gates
                </small>
              </div>
              <span className={classNames("pipeline-linked-status", `run-${link.status}`)}>{link.status}</span>
              <button
                aria-label={`Open linked Arena run ${link.runId}`}
                onClick={() => onOpenRun(link.runId)}
                type="button"
              >
                Open
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pipeline-linked-empty">Create a local Arena run to attach a visible trace.</p>
      )}
    </section>
  );
}

function PipelineRunStatusPill({
  compact = false,
  summary
}: {
  compact?: boolean;
  summary?: PipelineItemRunStatusSummary;
}) {
  if (!summary) {
    return null;
  }

  const status = summary.latestStatus ?? "none";
  const countLabel = summary.linkCount > 0 && !compact ? ` (${summary.linkCount})` : "";

  return (
    <span
      className={classNames(
        "pipeline-run-status",
        `run-${status}`,
        summary.activeCount > 0 && "has-active",
        summary.issueCount > 0 && "has-issue"
      )}
      title={summary.detail}
    >
      {summary.label}
      {countLabel}
    </span>
  );
}

function MilestoneStatusPanel({
  milestones,
  summary
}: {
  milestones: readonly MilestoneStatus[];
  summary: MilestoneStatusSummary;
}) {
  const nextDetail = createMilestoneReportNextDetail(milestones, summary);

  return (
    <section className="panel-section milestone-status-panel">
      <div className="milestone-status-header">
        <h4>Milestones</h4>
        <span
          title={`${summary.complete} complete, ${summary.active} in progress, ${summary.planned} planned, ${summary.paused} paused, ${summary.averageCompletionPercent}% overall`}
        >
          {summary.averageCompletionPercent}% overall
        </span>
      </div>
      <div
        aria-label={`Milestone report summary: ${summary.averageCompletionPercent}% overall. Current milestone focus: ${summary.nextTarget}. Next step: ${summary.nextStep}`}
        className="milestone-report-summary"
      >
        <div className="milestone-report-meter">
          <strong>{summary.averageCompletionPercent}%</strong>
          <span>Overall</span>
          <b aria-hidden="true">
            <i style={{ width: `${summary.averageCompletionPercent}%` }} />
          </b>
        </div>
        <div className="milestone-report-next">
          <small>Current milestone focus</small>
          <strong title={summary.nextTarget}>{summary.nextTarget}</strong>
          <span title={summary.nextStep}>{summary.nextStep}</span>
        </div>
        <div className="milestone-report-counts">
          <span title={`${summary.complete} complete`}>{summary.complete} complete</span>
          <span title={`${summary.active} in progress`}>{summary.active} active</span>
          <span title={`${summary.paused} paused`}>{summary.paused} paused</span>
        </div>
      </div>
      <div
        aria-label={nextDetail.ariaLabel}
        className={classNames(
          "milestone-next-detail",
          !nextDetail.hasNext && "is-empty"
        )}
        title={nextDetail.title}
      >
        <div className="milestone-next-detail-header">
          <span>Current next</span>
          <strong title={nextDetail.target}>{nextDetail.target}</strong>
          <b>{nextDetail.completionLabel}</b>
        </div>
        <dl>
          <div>
            <dt>Plan</dt>
            <dd title={nextDetail.plan}>{nextDetail.plan}</dd>
          </div>
          <div>
            <dt>Latest</dt>
            <dd title={nextDetail.latestNote}>{nextDetail.latestNote}</dd>
          </div>
          <div>
            <dt>Next</dt>
            <dd title={nextDetail.nextStep}>{nextDetail.nextStep}</dd>
          </div>
        </dl>
      </div>
      <table
        className="milestone-target-table"
        aria-label="Milestone targets, completion, and notes"
      >
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Completion</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => {
            const rowState = createMilestoneReportRowState(milestone, summary);

            return (
              <tr
                aria-current={rowState.isNext ? "step" : undefined}
                aria-label={`${milestone.target}: ${milestone.completion}, ${milestone.latestNote}`}
                className={classNames(rowState.isNext && "is-next-milestone")}
                key={milestone.target}
                title={`${milestone.target} - ${milestone.completion} - ${milestone.latestNote}`}
              >
                <td title={milestone.target}>
                  <span className="milestone-target-cell">
                    <span>{milestone.target}</span>
                    {rowState.isNext ? (
                      <b className="milestone-next-marker">{rowState.markerLabel}</b>
                    ) : null}
                  </span>
                </td>
                <td className="milestone-completion-cell" title={milestone.completion}>
                  <span className={classNames("milestone-state-pill", `milestone-${milestone.tone}`)}>
                    {milestone.completion}
                  </span>
                </td>
                <td title={milestone.latestNote}>{milestone.latestNote}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="milestone-status-table" aria-label="Milestone status table">
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Plan</th>
            <th scope="col">Completion</th>
            <th scope="col">% Completion</th>
            <th scope="col">Latest Note</th>
            <th scope="col">Next Step</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => {
            const rowState = createMilestoneReportRowState(milestone, summary);

            return (
              <tr
                aria-current={rowState.isNext ? "step" : undefined}
                aria-label={rowState.ariaLabel}
                className={classNames(rowState.isNext && "is-next-milestone")}
                key={milestone.target}
                title={rowState.rowTitle}
              >
                <td title={milestone.target}>
                  <span className="milestone-target-cell">
                    <span>{milestone.target}</span>
                    {rowState.isNext ? (
                      <b className="milestone-next-marker">{rowState.markerLabel}</b>
                    ) : null}
                  </span>
                </td>
                <td title={milestone.plan}>{milestone.plan}</td>
                <td className="milestone-completion-cell" title={milestone.completion}>
                  <span className={classNames("milestone-state-pill", `milestone-${milestone.tone}`)}>
                    {milestone.completion}
                  </span>
                </td>
                <td>
                  <div
                    className="milestone-percent-cell"
                    title={`${milestone.completionPercent}% - ${milestone.completion}`}
                  >
                    <span className={classNames("milestone-status-pill", `milestone-${milestone.tone}`)}>
                      {milestone.completionPercent}%
                    </span>
                    <span className="milestone-percent-track" aria-hidden="true">
                      <span
                        className={classNames("milestone-percent-fill", `milestone-${milestone.tone}`)}
                        style={{ width: `${milestone.completionPercent}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td title={milestone.latestNote}>{milestone.latestNote}</td>
                <td title={milestone.nextStep}>{milestone.nextStep}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function RemainingGoalsPanel({
  goals,
  summary
}: {
  goals: readonly RemainingGoalPlanItem[];
  summary: RemainingGoalPlanSummary;
}) {
  return (
    <section className="panel-section remaining-goals-panel">
      <div className="remaining-goals-header">
        <h4>Remaining Goals</h4>
        <span title={`${summary.coveredPhaseCount} of ${summary.remainingPhaseCount} remaining phases covered`}>
          {summary.averageCompletionPercent}% overall
        </span>
      </div>
      <div
        aria-label={`Remaining goals summary: ${summary.total} goals across ${summary.coveredPhaseCount} remaining phases. Current implementation target: ${summary.currentTarget}. Next action: ${summary.currentNextAction} Owner hold: ${summary.ownerHoldTarget}. Owner hold action: ${summary.ownerHoldNextAction}`}
        className="remaining-goals-summary"
      >
        <div>
          <strong>{summary.total}</strong>
          <span>Goals</span>
        </div>
        <div>
          <strong>{summary.blocked}</strong>
          <span>Blocked</span>
        </div>
        <div>
          <strong>{summary.active + summary.next}</strong>
          <span>Active/Next</span>
        </div>
        <div>
          <strong>{summary.coveredPhaseCount}/{summary.remainingPhaseCount}</strong>
          <span>Phases</span>
        </div>
      </div>
      <div className="remaining-goals-current" title={summary.currentNextAction}>
        <small>Current implementation</small>
        <strong>{summary.currentTarget}</strong>
        <span>{summary.currentNextAction}</span>
      </div>
      {summary.ownerHoldTarget !== "No owner hold" ? (
        <div className="remaining-goals-current remaining-goals-owner-hold" title={summary.ownerHoldNextAction}>
          <small>Owner hold</small>
          <strong>{summary.ownerHoldTarget}</strong>
          <span>{summary.ownerHoldNextAction}</span>
        </div>
      ) : null}
      <ol className="remaining-goals-list" aria-label="Remaining targets, phases, and goals">
        {goals.map((goal) => (
          <li
            aria-label={`${goal.target}: ${goal.status}, ${goal.completionPercent}% complete. ${goal.nextAction}`}
            className={classNames(
              "remaining-goal-card",
              `remaining-goal-${goal.status}`,
              isCurrentActiveRemainingGoal(goal) && "is-current"
            )}
            key={goal.id}
            title={`${goal.target} - ${goal.phases.join(", ")}`}
          >
            <div className="remaining-goal-topline">
              <span className={classNames("remaining-goal-priority", `remaining-goal-priority-${goal.priority}`)}>
                {goal.priority}
              </span>
              <b>{goal.completionPercent}%</b>
            </div>
            <strong>{goal.target}</strong>
            <small>{goal.phases.join(", ")}</small>
            <p>{goal.goal}</p>
            <span className="remaining-goal-next-action">{goal.nextAction}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ProviderIntegrationReadinessPanel({
  catalogDepth,
  executionGate,
  readiness
}: {
  catalogDepth: Phase4ProviderCatalogDepthSummary;
  executionGate?: ProviderExecutionGate;
  readiness: ProviderIntegrationReadiness;
}) {
  return (
    <section
      aria-label={`Phase 4 provider integration readiness ${readiness.statusLabel}; ${readiness.readiness}% ready. ${readiness.nextAction}`}
      className={classNames(
        "panel-section",
        "provider-readiness-panel",
        `provider-readiness-${readiness.state}`
      )}
    >
      <div className="provider-readiness-header">
        <h4>Phase 4 Provider Readiness</h4>
        <span title={readiness.nextAction}>{readiness.statusLabel}</span>
      </div>
      <div className="provider-readiness-summary" title={readiness.safety}>
        <div>
          <strong>{readiness.readiness}%</strong>
          <span>Ready</span>
        </div>
        <div>
          <strong>{readiness.counts.ready + readiness.counts.preview}</strong>
          <span>Usable</span>
        </div>
        <div>
          <strong>{readiness.counts.setupRequired}</strong>
          <span>Setup</span>
        </div>
        <div>
          <strong>{readiness.counts.unsupported + readiness.counts.unavailable + readiness.counts.blocked}</strong>
          <span>Held</span>
        </div>
      </div>
      <p className="provider-readiness-next">{readiness.nextAction}</p>
      {executionGate ? (
        <div
          className={classNames(
            "provider-catalog-depth",
            `provider-readiness-surface-${executionGate.state}`
          )}
          title={`${executionGate.detail} ${executionGate.nextAction} ${executionGate.safety}`}
        >
          <div className="provider-catalog-depth-header">
            <strong>{executionGate.label}</strong>
            <span>
              {executionGate.statusLabel} / {executionGate.readiness}%
            </span>
          </div>
          <small>{executionGate.detail}</small>
          <small>{executionGate.executionGateProof}</small>
          <ol className="provider-catalog-depth-list" aria-label="Provider execution gates">
            {executionGate.items.map((item) => (
              <li
                className={classNames(
                  "provider-catalog-depth-item",
                  `provider-catalog-depth-item-${item.state}`
                )}
                key={item.surface}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>{item.statusLabel}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.sourceLabel}</small>
                  <em>{item.detail}</em>
                  <small>{item.nextAction}</small>
                </div>
                <b>{item.canRequestExecution ? "Ready" : "Held"}</b>
              </li>
            ))}
          </ol>
          <small>{executionGate.safety}</small>
        </div>
      ) : null}
      <div className="provider-catalog-depth" aria-label={catalogDepth.ariaLabel}>
        <div className="provider-catalog-depth-header">
          <strong>{catalogDepth.label}</strong>
          <span>
            {catalogDepth.readyCount} ready / {catalogDepth.executionLockCount} locks
          </span>
        </div>
        <small>{catalogDepth.catalogDepthProof}</small>
        <small>{catalogDepth.commandSkillProof}</small>
        <small>{catalogDepth.pluginMcpProof}</small>
        <ol className="provider-catalog-depth-list">
          {catalogDepth.records.map((record) => (
            <li
              className={classNames(
                "provider-catalog-depth-item",
                `provider-catalog-depth-item-${record.status}`
              )}
              key={record.id}
              title={`${record.evidenceKey} ${record.ownerSafeProof} ${record.evidence} ${record.metadataProof.join("; ")} ${record.nextAction} ${record.safety}`}
            >
              <span>{record.statusLabel}</span>
              <div>
                <strong>{record.label}</strong>
                <small>{record.sourceLabel} / {record.evidenceKey}</small>
                <em>{record.evidence}</em>
                <small>{record.metadataProof.slice(0, 2).join("; ") || "No metadata proof attached"}</small>
                <small>{record.scopedExecutionProof}</small>
                <small>{record.ownerSafeProof}</small>
                <small>{record.safety}</small>
                <small>{record.nextAction}</small>
              </div>
              <b>{record.total}</b>
            </li>
          ))}
        </ol>
      </div>
      <ol className="provider-readiness-list" aria-label="Provider readiness by catalog surface">
        {readiness.surfaces.map((surface) => (
          <li
            aria-label={`${surface.label}: ${surface.statusLabel}; ${surface.readiness}% ready; ${surface.detail}`}
            className={classNames(
              "provider-readiness-surface",
              `provider-readiness-surface-${surface.state}`
            )}
            key={surface.surface}
            title={surface.nextAction}
          >
            <div>
              <strong>{surface.label}</strong>
              <small>{surface.sourceLabel}</small>
            </div>
            <span>{surface.statusLabel}</span>
            <p>{surface.detail}</p>
            <small>{surface.nextAction}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Phase4ProviderSurfaceDepthPanel({
  approvalValidation,
  auditRecord,
  auditValidation,
  onClearApproval,
  onClearAudit,
  onClearPermission,
  onClearRollback,
  onExportReviewArtifact,
  onLoadRecordedReviewArtifact,
  onRecordApproval,
  onRecordAudit,
  onRecordPermission,
  onRecordRollback,
  recordApprovalEnabled = false,
  recordAuditEnabled = false,
  recordPermissionEnabled = false,
  recordRollbackEnabled = false,
  onVerifyImportedReviewArtifact,
  importedReviewArtifactVerification,
  permissionRecord,
  permissionValidation,
  record,
  recordedArtifactLoadAvailable,
  reviewArtifactVerification,
  rollbackRecord,
  rollbackValidation,
  snapshot
}: {
  approvalValidation?: Phase4ProviderApprovalRecordValidation;
  auditRecord?: Phase4ProviderAuditRecord;
  auditValidation?: Phase4ProviderAuditRecordValidation;
  onClearApproval?: () => void;
  onClearAudit?: () => void;
  onClearPermission?: () => void;
  onClearRollback?: () => void;
  onExportReviewArtifact?: () => void;
  onLoadRecordedReviewArtifact?: () => void;
  onRecordApproval?: () => void;
  onRecordAudit?: () => void;
  onRecordPermission?: () => void;
  onRecordRollback?: () => void;
  recordApprovalEnabled?: boolean;
  recordAuditEnabled?: boolean;
  recordPermissionEnabled?: boolean;
  recordRollbackEnabled?: boolean;
  onVerifyImportedReviewArtifact?: (serializedArtifact: string) => void;
  importedReviewArtifactVerification?: Phase4ProviderReviewArtifactVerification;
  permissionRecord?: Phase4ProviderPermissionRecord;
  permissionValidation?: Phase4ProviderPermissionRecordValidation;
  record?: Phase4ProviderApprovalRecord;
  recordedArtifactLoadAvailable?: boolean;
  reviewArtifactVerification?: Phase4ProviderReviewArtifactVerification;
  rollbackRecord?: Phase4ProviderRollbackRecord;
  rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  snapshot: Phase4ProviderSurfaceDepthSnapshot;
}) {
  const reviewArtifactImportInputRef = useRef<HTMLInputElement | null>(null);
  const handleReviewArtifactImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onVerifyImportedReviewArtifact?.(await file.text());
    },
    [onVerifyImportedReviewArtifact]
  );

  return (
    <section className="panel-section">
      <h4>Phase 4 Surface Depth</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase4-provider-depth",
          `phase4-provider-depth-${snapshot.state}`
        )}
        title={snapshot.safety}
      >
        <div className="phase4-provider-depth-header">
          <span className={classNames("phase4-provider-depth-state", `phase4-provider-depth-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <div
          aria-label="Phase 4 provider approval actions"
          className="phase4-provider-depth-actions"
        >
          <div>
            <strong>Approval record</strong>
            <small>
              {approvalValidation?.state ?? "preview"} / {record?.createdAt ?? "not recorded"}
            </small>
            <small>
              Catalog {approvalValidation?.recordCatalogFingerprint ?? "missing"} / expected{" "}
              {approvalValidation?.expectedCatalogFingerprint ?? "missing"}
            </small>
            <small>
              {approvalValidation?.refreshSafetyProof ?? "refreshSafety=review ready=0 preview=1 blocked=0"}
            </small>
            <small>
              {approvalValidation?.approvalChainProof ??
                "catalog=missing expectedCatalog=missing catalogMatch=review refreshSafety=review owner=missing mutation=locked execution=locked"}
            </small>
          </div>
          <button
            disabled={!recordApprovalEnabled || !onRecordApproval}
            title={
              recordApprovalEnabled
                ? "Record local Phase 4 approval evidence."
                : approvalValidation?.nextAction ?? "Refresh safety proof must be ready before approval can be recorded."
            }
            type="button"
            onClick={onRecordApproval}
          >
            Record approval
          </button>
          <button type="button" disabled={!record} onClick={onClearApproval}>
            Clear approval
          </button>
        </div>
        <div
          aria-label="Phase 4 provider audit actions"
          className="phase4-provider-depth-actions"
        >
          <div>
            <strong>Audit record</strong>
            <small>
              {auditValidation?.state ?? "preview"} / {auditRecord?.createdAt ?? "not recorded"}
            </small>
            <small>
              Approval {auditValidation?.recordApprovalRecordId ?? "missing"} / expected{" "}
              {auditValidation?.expectedApprovalRecordId ?? "missing"}
            </small>
            <small>
              {auditValidation?.auditChainProof ?? "approval=missing catalog=missing auditEvidence=missing mutation=review execution=locked"}
            </small>
          </div>
          <button
            disabled={!recordAuditEnabled || !onRecordAudit}
            title={
              recordAuditEnabled
                ? "Record local Phase 4 audit evidence."
                : auditValidation?.nextAction ?? "Approval evidence must be ready before audit can be recorded."
            }
            type="button"
            onClick={onRecordAudit}
          >
            Record audit
          </button>
          <button type="button" disabled={!auditRecord} onClick={onClearAudit}>
            Clear audit
          </button>
        </div>
        <div
          aria-label="Phase 4 provider rollback actions"
          className="phase4-provider-depth-actions"
        >
          <div>
            <strong>Rollback record</strong>
            <small>
              {rollbackValidation?.state ?? "preview"} /{" "}
              {rollbackRecord?.createdAt ?? "not recorded"}
            </small>
            <small>
              Audit {rollbackValidation?.recordAuditRecordId ?? "missing"} / expected{" "}
              {rollbackValidation?.expectedAuditRecordId ?? "missing"}
            </small>
          </div>
          <button
            disabled={!recordRollbackEnabled || !onRecordRollback}
            title={
              recordRollbackEnabled
                ? "Record local Phase 4 rollback evidence."
                : rollbackValidation?.nextAction ?? "Audit evidence must be ready before rollback can be recorded."
            }
            type="button"
            onClick={onRecordRollback}
          >
            Record rollback
          </button>
          <button type="button" disabled={!rollbackRecord} onClick={onClearRollback}>
            Clear rollback
          </button>
        </div>
        <div
          aria-label="Phase 4 provider permission actions"
          className="phase4-provider-depth-actions"
        >
          <div>
            <strong>Permission record</strong>
            <small>
              {permissionValidation?.state ?? "preview"} /{" "}
              {permissionRecord?.createdAt ?? "not recorded"}
            </small>
            <small>
              Permission {permissionValidation?.recordPermissionEvidenceFingerprint ?? "missing"} /
              expected{" "}
              {permissionValidation?.expectedPermissionEvidenceFingerprint ?? "missing"}
            </small>
          </div>
          <button
            disabled={!recordPermissionEnabled || !onRecordPermission}
            title={
              recordPermissionEnabled
                ? "Record local Phase 4 permission evidence."
                : permissionValidation?.nextAction ?? "Rollback evidence must be ready before permission can be recorded."
            }
            type="button"
            onClick={onRecordPermission}
          >
            Record permission
          </button>
          <button type="button" disabled={!permissionRecord} onClick={onClearPermission}>
            Clear permission
          </button>
        </div>
        {reviewArtifactVerification ? (
          <div
            aria-label={`Phase 4 provider review artifact verifier ${reviewArtifactVerification.statusLabel}; ${reviewArtifactVerification.readiness}% ready`}
            className={classNames(
              "phase4-provider-depth-actions",
              `phase4-provider-depth-artifact-${reviewArtifactVerification.state}`
            )}
            title={reviewArtifactVerification.detail}
          >
            <div>
              <strong>Provider review artifact</strong>
              <small>
                {reviewArtifactVerification.statusLabel} / blockers{" "}
                {reviewArtifactVerification.openBlockerCount}
              </small>
              <small>
                Catalog {reviewArtifactVerification.catalogDepthRecordCount} | Refresh{" "}
                {reviewArtifactVerification.refreshSafetyRecordCount} | Surface{" "}
                {reviewArtifactVerification.surfaceDepthItemCount} | Trace{" "}
                {reviewArtifactVerification.traceabilityItemCount} | Execution{" "}
                {reviewArtifactVerification.executionLocked ? "locked" : "unlocked"}
              </small>
              <small>
                Catalog fingerprint{" "}
                {reviewArtifactVerification.currentCatalogFingerprint ?? "missing"} / expected{" "}
                {reviewArtifactVerification.expectedCatalogFingerprint ?? "missing"} /{" "}
                {reviewArtifactVerification.matchesExpectedCatalog === false
                  ? "mismatch"
                  : reviewArtifactVerification.matchesExpectedCatalog === true
                    ? "matched"
                    : "unverified"}
              </small>
              <small>{reviewArtifactVerification.detail}</small>
              <small>{reviewArtifactVerification.nextAction}</small>
            </div>
            <button
              onClick={onExportReviewArtifact}
              title="Export Phase 4 provider review evidence for offline owner review without running provider actions."
              type="button"
            >
              Export review
            </button>
            <button
              onClick={() => reviewArtifactImportInputRef.current?.click()}
              title="Verify a Phase 4 provider review artifact without changing local provider records."
              type="button"
            >
              Import review
            </button>
            <button
              disabled={!recordedArtifactLoadAvailable || !onLoadRecordedReviewArtifact}
              onClick={onLoadRecordedReviewArtifact}
              title={
                recordedArtifactLoadAvailable
                  ? "Load local_private/phase4-provider-review-artifact.json from the desktop workspace or local dev server."
                  : "Open Steerboard in desktop mode or use Import review to attach this local artifact."
              }
              type="button"
            >
              Load recorded
            </button>
            <input
              accept="application/json,.json"
              aria-label="Import Phase 4 provider review artifact for verification"
              onChange={handleReviewArtifactImport}
              ref={reviewArtifactImportInputRef}
              type="file"
            />
          </div>
        ) : null}
        {importedReviewArtifactVerification ? (
          <div
            aria-label={`Imported Phase 4 provider review artifact verifier ${importedReviewArtifactVerification.statusLabel}; ${importedReviewArtifactVerification.readiness}% ready`}
            className={classNames(
              "phase4-provider-depth-actions",
              `phase4-provider-depth-artifact-${importedReviewArtifactVerification.state}`
            )}
            title={importedReviewArtifactVerification.detail}
          >
            <div>
              <strong>Imported provider review</strong>
              <small>{importedReviewArtifactVerification.detail}</small>
              <small>{importedReviewArtifactVerification.nextAction}</small>
              <small>
                Approval {importedReviewArtifactVerification.hasApprovalRecord ? "attached" : "missing"} |
                Audit {importedReviewArtifactVerification.hasAuditRecord ? "attached" : "missing"} |
                Rollback {importedReviewArtifactVerification.hasRollbackRecord ? "attached" : "missing"} |
                Permission {importedReviewArtifactVerification.hasPermissionRecord ? "attached" : "missing"}
              </small>
              <small>
                Catalog fingerprint{" "}
                {importedReviewArtifactVerification.currentCatalogFingerprint ?? "missing"} / expected{" "}
                {importedReviewArtifactVerification.expectedCatalogFingerprint ?? "missing"} /{" "}
                {importedReviewArtifactVerification.matchesExpectedCatalog === false
                  ? "mismatch"
                  : importedReviewArtifactVerification.matchesExpectedCatalog === true
                    ? "matched"
                    : "unverified"}
              </small>
            </div>
          </div>
        ) : null}
        <dl className="phase4-provider-depth-grid" aria-label="Phase 4 provider surface depth counts">
          <div>
            <dt>Execution</dt>
            <dd>{snapshot.canEnableExecution ? "Enabled" : "Locked"}</dd>
          </div>
          <div>
            <dt>Attention</dt>
            <dd>{snapshot.attentionCount}</dd>
          </div>
          <div>
            <dt>Preview</dt>
            <dd>{snapshot.previewCount}</dd>
          </div>
          <div>
            <dt>Held</dt>
            <dd>{snapshot.heldCount}</dd>
          </div>
        </dl>
        <ol className="phase4-provider-depth-list" aria-label="Phase 4 provider surface depth gates">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase4-provider-depth-item", `phase4-provider-depth-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
                {item.ownerBoundaryProof ? (
                  <small>{item.ownerBoundaryProof}</small>
                ) : null}
                <small>
                  {item.evidenceKey} / {item.nextAction}
                </small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <small title={snapshot.safety}>{snapshot.safety}</small>
        <small>{snapshot.surfaceDepthProof}</small>
        <small>{snapshot.localRecordValidationProof}</small>
      </div>
    </section>
  );
}

export function Phase4ProviderTraceabilityPanel({
  summary
}: {
  summary: Phase4ProviderTraceabilitySummary;
}) {
  return (
    <section className="panel-section">
      <h4>Phase 4 Traceability</h4>
      <div
        aria-label={summary.ariaLabel}
        className={classNames(
          "phase4-provider-traceability",
          `phase4-provider-traceability-${summary.state}`
        )}
        title={summary.safety}
      >
        <div className="phase4-provider-traceability-header">
          <strong>{summary.label}</strong>
          <span>
            {summary.statusLabel} / {summary.readiness}%
          </span>
        </div>
        <dl className="phase4-provider-traceability-grid" aria-label="Phase 4 provider traceability counts">
          <div>
            <dt>PM Links</dt>
            <dd>{summary.linkedPmTaskCount}</dd>
          </div>
          <div>
            <dt>Catalog</dt>
            <dd>{summary.catalogDepthRecordCount}</dd>
          </div>
          <div>
            <dt>Refresh</dt>
            <dd>{summary.refreshSafetyRecordCount}</dd>
          </div>
          <div>
            <dt>Locks</dt>
            <dd>{summary.executionLockCount}</dd>
          </div>
        </dl>
        <ol className="phase4-provider-traceability-list" aria-label="Phase 4 provider traceability rows">
          {summary.items.map((item) => (
            <li
              className={classNames(
                "phase4-provider-traceability-item",
                `phase4-provider-traceability-item-${item.status}`
              )}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.status}</span>
              <div>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.kind}</b>
            </li>
          ))}
        </ol>
        <small>{summary.traceabilityProof}</small>
        <small title={summary.nextAction}>{summary.nextAction}</small>
      </div>
    </section>
  );
}

export function Phase4ProviderBlockerPriorityPanel({
  summary
}: {
  summary: Phase4ProviderBlockerPrioritySummary;
}) {
  const visibleItems = summary.items.slice(0, 6);

  return (
    <section className="panel-section">
      <h4>Phase 4 Blocker Priority</h4>
      <div
        aria-label={summary.ariaLabel}
        className={classNames(
          "phase4-provider-blocker-priority",
          `phase4-provider-blocker-priority-${summary.state}`
        )}
        title={summary.safety}
      >
        <div className="phase4-provider-blocker-priority-header">
          <strong>{summary.label}</strong>
          <span>
            {summary.statusLabel} / {summary.openBlockerCount} open
          </span>
        </div>
        <small
          className="phase4-provider-blocker-priority-source"
          title={`${summary.topPrioritySourceId} / ${summary.topPriorityKind} / ${summary.topPriorityStatus} / ${summary.topPriorityEvidenceKey}`}
        >
          {summary.topPrioritySourceId} / {summary.topPriorityKind} /{" "}
          {summary.topPriorityStatus} / {summary.topPriorityEvidenceKey}
        </small>
        <dl
          className="phase4-provider-blocker-priority-grid"
          aria-label="Phase 4 provider blocker priority counts"
        >
          <div>
            <dt>Top</dt>
            <dd>{summary.topPriorityLabel}</dd>
          </div>
          <div>
            <dt>Smoke</dt>
            <dd>{summary.catalogSmokeAddressableCount}</dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{summary.readiness}%</dd>
          </div>
        </dl>
        <ol
          className="phase4-provider-blocker-priority-list"
          aria-label="Phase 4 provider blocker priority rows"
        >
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <li
                className={classNames(
                  "phase4-provider-blocker-priority-item",
                  `phase4-provider-blocker-priority-item-${item.status}`
                )}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>#{item.priority}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>
                    {item.evidenceKey} / {item.nextAction}
                  </small>
                </div>
                <b>{item.severity}</b>
              </li>
            ))
          ) : (
            <li className="phase4-provider-blocker-priority-item phase4-provider-blocker-priority-item-ready">
              <span>OK</span>
              <div>
                <strong>No open Phase 4 provider blocker</strong>
                <small>{summary.nextAction}</small>
              </div>
              <b>ready</b>
            </li>
          )}
        </ol>
        <small>{summary.blockerPriorityProof}</small>
        <small title={summary.nextAction}>{summary.nextAction}</small>
      </div>
    </section>
  );
}

export function Phase4ProviderCompletionStatusPanel({
  status
}: {
  status: Phase4ProviderCompletionStatus;
}) {
  return (
    <section className="panel-section">
      <h4>Phase 4 Completion</h4>
      <div
        aria-label={status.ariaLabel}
        className={classNames(
          "phase4-provider-completion-status",
          `phase4-provider-completion-status-${status.state}`
        )}
        title={status.safety}
      >
        <div className="phase4-provider-blocker-priority-header">
          <strong>{status.label}</strong>
          <span>
            {status.statusLabel} / {status.readiness}%
          </span>
        </div>
        <dl
          className="phase4-provider-blocker-priority-grid"
          aria-label="Phase 4 provider completion status counts"
        >
          <div>
            <dt>PM Links</dt>
            <dd>
              {status.linkedPmTaskCount}/{status.requiredPmTaskCount}
            </dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd>{status.openBlockerCount}</dd>
          </div>
          <div>
            <dt>Lock</dt>
            <dd>{status.providerExecutionLocked ? "On" : "Review"}</dd>
          </div>
        </dl>
        <small>{status.phase4ProviderCompletionStatusProof}</small>
        <small title={status.nextAction}>{status.nextAction}</small>
      </div>
    </section>
  );
}

function PanelPrioritySignal({
  focusTarget,
  onClearFocus,
  onFocus,
  priority
}: {
  focusTarget: CockpitPanelFocusTarget;
  onClearFocus: () => void;
  onFocus: () => void;
  priority: CockpitPanelPriority;
}) {
  const focusControls = createCockpitPanelFocusControls(focusTarget);
  const icon =
    priority.tone === "critical" || priority.tone === "attention" ? (
      <AlertTriangle size={15} />
    ) : (
      <CircleDot size={15} />
    );

  return (
    <section className="panel-section panel-priority-panel" aria-label="Next Arena panel attention">
      <div className="panel-priority-header">
        <h4>Next Attention</h4>
        <div className="panel-priority-actions">
          <span
            className={classNames("panel-priority-pill", `panel-priority-${priority.tone}`)}
            title={`${priority.priorityLabel}: ${priority.detail}`}
          >
            {priority.priorityLabel}
          </span>
          <button
            aria-label={
              !focusControls.focusDisabled
                ? `Focus ${priority.title}`
                : focusControls.focusTitle
            }
            className="panel-priority-focus-button"
            disabled={focusControls.focusDisabled}
            onClick={onFocus}
            title={focusControls.focusTitle}
            type="button"
          >
            <CircleDot size={13} />
            <span>{focusControls.focusLabel}</span>
          </button>
          <button
            aria-label="Clear Arena panel focus"
            className="panel-priority-focus-button panel-priority-clear-button"
            disabled={focusControls.clearDisabled}
            onClick={onClearFocus}
            title={focusControls.clearTitle}
            type="button"
          >
            <CircleDot size={13} />
            <span>{focusControls.clearLabel}</span>
          </button>
        </div>
      </div>
      <div className="panel-priority-row">
        <span
          aria-hidden="true"
          className={classNames("panel-priority-icon", `panel-priority-${priority.tone}`)}
        >
          {icon}
        </span>
        <div className="panel-priority-copy">
          <strong title={priority.title}>{priority.title}</strong>
          <small title={priority.detail}>{priority.detail}</small>
        </div>
        <dl className="panel-priority-meta" aria-label="Panel priority metadata">
          <div>
            <dt>Role</dt>
            <dd>{priority.role}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{priority.state}</dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>{focusControls.statusLabel}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function PipelineDispatchRequestRecordRow({ record }: { record: PipelineDispatchRequestRecord }) {
  return (
    <li className={classNames("pipeline-request-record", `pipeline-request-record-${record.action}`)}>
      <span />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.state}>{record.readiness}%</b>
    </li>
  );
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

function linesToList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatShortDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function PlanningView({
  chatMessages,
  dispatchReviewRecords,
  onChatMessagesChange,
  onStagePackage,
  onTasksChange,
  project,
  projects,
  tasks
}: {
  chatMessages: ProjectManagementChatMessage[];
  dispatchReviewRecords: DispatchReviewRecord[];
  onChatMessagesChange: (messages: ProjectManagementChatMessage[]) => void;
  onStagePackage: (dispatchPackage: DispatchPackage) => void;
  onTasksChange: (tasks: ProjectManagementTask[]) => void;
  project: ProjectSummary;
  projects: ProjectSummary[];
  tasks: ProjectManagementTask[];
}) {
  const rows = useMemo(() => flattenProjectManagementRows(tasks), [tasks]);
  const visibleRows = rows.filter((row) => !row.hiddenByAncestor);
  const [stagedResult, setStagedResult] = useState<ProjectManagementArenaDispatchResult>();
  const [chatInput, setChatInput] = useState("");
  const stagedMarkdown = stagedResult ? renderDispatchPackageMarkdown(stagedResult.dispatchPackage) : "";
  const stagedReviewRecord = stagedResult
    ? dispatchReviewRecords.find(
        (record) => record.sourcePackageId === stagedResult.dispatchPackage.id
      )
    : undefined;
  const recentReviewRecords = dispatchReviewRecords.slice(0, 3);

  function handleToggleTask(taskId: string) {
    onTasksChange(toggleProjectManagementTaskCollapsed(tasks, taskId));
  }

  function handleRunTask(taskId: string) {
    const result = buildProjectManagementArenaDispatch(tasks, taskId, project);

    if (!result) {
      return;
    }

    setStagedResult(result);
    onTasksChange(tasks.map((task) => (task.id === taskId ? { ...task, runState: "staged" } : task)));
    onStagePackage(result.dispatchPackage);
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = chatInput.trim();

    if (text.length === 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const userMessage: ProjectManagementChatMessage = {
      id: `pm-user-${createdAt}`,
      role: "user",
      text,
      createdAt
    };
    const shouldMarkValidationTodo =
      text.toLowerCase().includes("mark") &&
      text.toLowerCase().includes("validation") &&
      text.toLowerCase().includes("todo");
    const updatedTasks = shouldMarkValidationTodo
      ? tasks.map((task) =>
          `${task.title} ${task.description} ${task.sourceDocument}`.toLowerCase().includes("validation")
            ? { ...task, status: "todo" as const }
            : task
        )
      : tasks;
    const changedTaskCount = updatedTasks.filter((task, index) => task.status !== tasks[index]?.status).length;
    const reply: ProjectManagementChatMessage = {
      id: `pm-assistant-${createdAt}`,
      role: "assistant",
      text: changedTaskCount > 0
        ? `Updated ${changedTaskCount} validation ${changedTaskCount === 1 ? "task" : "tasks"} to TO DO in the Project Management table.`
        : createProjectManagementChatReply(text),
      createdAt
    };

    if (changedTaskCount > 0) {
      onTasksChange(updatedTasks);
    }

    onChatMessagesChange([...chatMessages, userMessage, reply].slice(-40));
    setChatInput("");
  }

  return (
    <section className="planning-view">
      <header className="planning-header">
        <div>
          <h3>Project Management</h3>
          <p>Organize Epics, Parents, and Children before staging selected work for Arena review.</p>
        </div>
        <span className="pm-execution-lock">Review-only dispatch</span>
      </header>

      <div className="planning-body">
        <div className="pm-table-wrap" aria-label="Project Management hierarchy table">
          <table className="pm-hierarchy-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Description</th>
                <th>Status</th>
                <th>Completion</th>
                <th>Complexity</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ depth, hasChildren, task }) => (
                <tr className={classNames("pm-row", `pm-row-${task.type}`)} key={task.id}>
                  <td>
                    <div className="pm-task-cell" style={{ paddingLeft: `${depth * 18}px` }}>
                      {hasChildren ? (
                        <button
                          aria-label={`${task.collapsed ? "Expand" : "Collapse"} ${task.title}`}
                          className="pm-chevron"
                          onClick={() => handleToggleTask(task.id)}
                          type="button"
                        >
                          {task.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </button>
                      ) : (
                        <span className="pm-chevron-spacer" />
                      )}
                      <span className={classNames("pm-task-type", `pm-task-type-${task.type}`)}>
                        {projectManagementTypeLabels[task.type]}
                      </span>
                      <strong title={task.title}>{task.title}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="pm-description" title={task.description}>
                      {task.description}
                    </span>
                  </td>
                  <td>
                    <span className={classNames("pm-status-pill", `pm-status-${task.status}`)}>
                      {projectManagementStatusLabels[task.status]}
                    </span>
                  </td>
                  <td>
                    <div className="pm-completion">
                      <span>{task.completionPercent}%</span>
                      <b style={{ width: `${task.completionPercent}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={classNames("pm-complexity-pill", `pm-complexity-${task.complexity}`)}>
                      {projectManagementComplexityLabels[task.complexity]}
                    </span>
                  </td>
                  <td>
                    <span className="pm-source" title={task.sourceDocument}>
                      {task.sourceDocument}
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`Stage ${projectManagementTypeLabels[task.type]} ${task.title} for Arena review`}
                      className="pm-run-button"
                      data-testid={`pm-run-${task.type}-${task.id}`}
                      onClick={() => handleRunTask(task.id)}
                      type="button"
                    >
                      <Play size={13} />
                      Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="pm-bottom-panel" aria-label="Project Management alignment chat">
          <div className="pm-chat-panel">
            <div className="pm-chat-header">
              <strong>PM Alignment</strong>
              <span>Scoped to dashboard updates</span>
            </div>
            <div className="pm-chat-transcript" aria-label="Project Management dashboard transcript">
              {chatMessages.length === 0 ? (
                <p className="pm-chat-empty">Ask for hierarchy, completion, status, or Arena-run preparation updates.</p>
              ) : (
                chatMessages.map((message) => (
                  <article className={classNames("pm-chat-message", `pm-chat-${message.role}`)} key={message.id}>
                    <strong>{message.role === "user" ? "You" : "Steerboard"}</strong>
                    <p>{message.text}</p>
                  </article>
                ))
              )}
            </div>
            <form className="pm-chat-composer" onSubmit={handleChatSubmit}>
              <Terminal size={15} />
              <input
                aria-label="Project Management dashboard instruction"
                onChange={(event) => setChatInput(event.currentTarget.value)}
                placeholder="Update the PM dashboard..."
                value={chatInput}
              />
              <button type="submit">
                <Send size={14} />
              </button>
            </form>
          </div>

          <aside className="pm-staged-panel" aria-label="Staged Arena dispatch preview">
            <div className="pm-staged-header">
              <strong>Staged Arena Review</strong>
              <span>{projects.length} sources available</span>
            </div>
            {stagedResult ? (
              <>
                <dl className="pm-staged-summary">
                  <div>
                    <dt>Task</dt>
                    <dd>{stagedResult.payload.title}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{stagedResult.payload.taskType}</dd>
                  </div>
                  <div>
                    <dt>Children</dt>
                    <dd>{stagedResult.payload.children.length}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>Review-only</dd>
                  </div>
                </dl>
                <section className="pm-dispatch-records" aria-label="Project Management dispatch review records">
                  <div className="pm-dispatch-records-header">
                    <strong>Dispatch Review Record</strong>
                    <span>{stagedReviewRecord ? "Recorded" : "Pending"}</span>
                  </div>
                  {stagedReviewRecord ? (
                    <DispatchReviewRecordCard record={stagedReviewRecord} />
                  ) : recentReviewRecords.length > 0 ? (
                    <DispatchReviewRecordCard record={recentReviewRecords[0]} />
                  ) : (
                    <p className="empty-preview">
                      Staging a PM row creates a local record that ties role panels, attempts, validation gates, and handoff tasks together before live worker launch.
                    </p>
                  )}
                </section>
                <pre className="dispatch-preview">{stagedMarkdown}</pre>
              </>
            ) : (
              <>
                {recentReviewRecords.length > 0 ? (
                  <section className="pm-dispatch-records" aria-label="Recent Project Management dispatch review records">
                    <div className="pm-dispatch-records-header">
                      <strong>Latest Dispatch Review</strong>
                      <span>{recentReviewRecords.length} saved</span>
                    </div>
                    <DispatchReviewRecordCard record={recentReviewRecords[0]} />
                  </section>
                ) : null}
                <p className="empty-preview">
                  Click Run on any Epic, Parent, or Child to create a staged Arena review package. Runtime execution stays locked until approval gates allow it.
                </p>
              </>
            )}
          </aside>
        </section>
      </div>
    </section>
  );
}

function RightPanel({
  adaptiveHiddenPanelCount,
  adaptivePanelCount,
  adaptiveVisiblePanelCount,
  catalogRefreshOwnerValidation,
  isAdaptiveLayout,
  layoutCapacity,
  mode,
  modeHandoff,
  modeHandoffQa,
  mockRuns,
  onAppNotice,
  onClearPhase3CommandValidation,
  onClearPhase3OwnerHandoff,
  onClearPhase11EvidenceRecord,
  onExportPhase3ProofArtifact,
  onExportPhase4ProviderReviewArtifact,
  onLoadRecordedPhase4ProviderReviewArtifact,
  onImportPhase3CommandValidation,
  onImportPhase3SmokeProofBundle,
  onLoadRecordedPhase3CommandValidation,
  onLoadRecordedPhase3SmokeProofBundle,
  onLoadRecordedPhase3ProofArtifacts,
  onImportPhase11EvidenceRecords,
  onRecordPhase3CommandValidation,
  onRecordPhase3OwnerHandoff,
  onRecordPhase11Evidence,
  onRecordPhase4ProviderApproval,
  onRecordPhase4ProviderAudit,
  onRecordPhase4ProviderPermission,
  onRecordPhase4ProviderRollback,
  onRecordWorkerValidationAttempt,
  onVerifyImportedPhase3ProofArtifact,
  onVerifyImportedPhase4ProviderReviewArtifact,
  onSelectRun,
  onUpdateRunStatus,
  project,
  phase4ProviderBlockerPriority,
  phase4ProviderCatalogDepth,
  phase4ProviderCompletionStatus,
  phase4ProviderApprovalRecord,
  phase4ProviderApprovalRecordEnabled,
  phase4ProviderApprovalValidation,
  phase4ProviderAuditRecord,
  phase4ProviderAuditRecordEnabled,
  phase4ProviderAuditValidation,
  phase4ProviderPermissionRecord,
  phase4ProviderPermissionRecordEnabled,
  phase4ProviderPermissionValidation,
  phase4ProviderReviewArtifactVerification,
  phase4RecordedArtifactLoadAvailable,
  phase4ProviderRollbackRecord,
  phase4ProviderRollbackRecordEnabled,
  phase4ProviderRollbackValidation,
  phase4ProviderTraceability,
  phase4ProviderSurfaceDepth,
  importedPhase4ProviderReviewArtifactVerification,
  providerIntegrationReadiness,
  registryEntry,
  registrySummary,
  runtimeAdapter,
  runtimeProfileSummary,
  runtimeSummary,
  selectedDispatchReviewRecord,
  selectedRun,
  phasePriorityEvidence,
  phase3ClearanceBlockerPriority,
  phase3ClearanceCompletionStatus,
  phase3ClearanceTraceability,
  phase3ClearanceTraceabilityPrecondition,
  phase3ClearanceCommandPlan,
  phase3ClearancePackage,
  phase3ExitGateEvidence,
  phase3HandoffGate,
  phase3CommandValidationRecord,
  phase3CommandValidationRecordValidation,
  phase3OwnerHandoffRecord,
  importedPhase3ProofExportVerification,
  phase3ProofExportVerification,
  phase3OwnerTestingActions,
  phase3SmokeProofReadiness,
  phase3RecordedArtifactLoadAvailable,
  phase11EvidenceEvaluationTime,
  phase11EvidenceRecordInputs,
  projectManagementTasks,
  sessionControlOwnerTestingState,
  sessionControlReadinessEvidence,
  slashCommandExecutionEvidence,
  slashCommandOwnerTestingState,
  focusedPanelId,
  onFocusPanel,
  onRunCodexActiveTurnControlSmokeProof,
  onRunCodexActiveTurnSteerSmokeProof,
  onRunCodexLiveSmokeProof,
  onRunCodexLiveControlSmokeProof,
  onRunCodexTwoPanelSmokeProof,
  onClearPhase4ProviderApproval,
  onClearPhase4ProviderAudit,
  onClearPhase4ProviderPermission,
  onClearPhase4ProviderRollback,
  codexCanStartSession,
  codexLiveSmokeLoading,
  codexTwoPanelSmokeLoading,
  sessions,
  tasks
}: {
  adaptiveHiddenPanelCount: number;
  adaptivePanelCount: number;
  adaptiveVisiblePanelCount: number;
  catalogRefreshOwnerValidation: CatalogRefreshOwnerValidationResult;
  focusedPanelId?: string;
  isAdaptiveLayout: boolean;
  layoutCapacity: CockpitLayoutCapacity;
  mode: CockpitMode;
  modeHandoff: CockpitModeHandoff;
  modeHandoffQa: CockpitModeHandoffQa;
  mockRuns: MockOrchestratorRun[];
  onAppNotice: (notice: string) => void;
  onFocusPanel: (panelId: string | undefined) => void;
  onClearPhase3CommandValidation: () => void;
  onClearPhase3OwnerHandoff: () => void;
  onClearPhase11EvidenceRecord: (gate: Phase11EvidenceGate) => void;
  onExportPhase3ProofArtifact: () => void;
  onExportPhase4ProviderReviewArtifact: () => void;
  onLoadRecordedPhase4ProviderReviewArtifact: () => void;
  onImportPhase3CommandValidation: (serializedRecord: string) => void;
  onImportPhase3SmokeProofBundle: (serializedBundle: string) => void;
  onLoadRecordedPhase3CommandValidation: () => void;
  onLoadRecordedPhase3SmokeProofBundle: () => void;
  onLoadRecordedPhase3ProofArtifacts: () => void;
  onImportPhase11EvidenceRecords: (serializedRecords: string) => void;
  onRecordPhase3CommandValidation: () => void;
  onRecordPhase3OwnerHandoff: () => void;
  onRecordPhase11Evidence: (gate: Phase11EvidenceGate) => void;
  onRecordPhase4ProviderApproval: () => void;
  onRecordPhase4ProviderAudit: () => void;
  onRecordPhase4ProviderPermission: () => void;
  onRecordPhase4ProviderRollback: () => void;
  onRecordWorkerValidationAttempt: (
    runId: string,
    taskId: string,
    outcome: "pass" | "fail"
  ) => void;
  onVerifyImportedPhase3ProofArtifact: (serializedArtifact: string) => void;
  onVerifyImportedPhase4ProviderReviewArtifact: (serializedArtifact: string) => void;
  onSelectRun: (runId: string) => void;
  onUpdateRunStatus: (runId: string, nextStatus: MockRunStatus) => void;
  project: ProjectSummary;
  phase4ProviderBlockerPriority: Phase4ProviderBlockerPrioritySummary;
  phase4ProviderCatalogDepth: Phase4ProviderCatalogDepthSummary;
  phase4ProviderCompletionStatus: Phase4ProviderCompletionStatus;
  phase4ProviderApprovalRecord?: Phase4ProviderApprovalRecord;
  phase4ProviderApprovalRecordEnabled: boolean;
  phase4ProviderApprovalValidation: Phase4ProviderApprovalRecordValidation;
  phase4ProviderAuditRecord?: Phase4ProviderAuditRecord;
  phase4ProviderAuditRecordEnabled: boolean;
  phase4ProviderAuditValidation: Phase4ProviderAuditRecordValidation;
  phase4ProviderPermissionRecord?: Phase4ProviderPermissionRecord;
  phase4ProviderPermissionRecordEnabled: boolean;
  phase4ProviderPermissionValidation: Phase4ProviderPermissionRecordValidation;
  phase4ProviderReviewArtifactVerification: Phase4ProviderReviewArtifactVerification;
  phase4RecordedArtifactLoadAvailable: boolean;
  phase4ProviderRollbackRecord?: Phase4ProviderRollbackRecord;
  phase4ProviderRollbackRecordEnabled: boolean;
  phase4ProviderRollbackValidation: Phase4ProviderRollbackRecordValidation;
  phase4ProviderTraceability: Phase4ProviderTraceabilitySummary;
  phase4ProviderSurfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  importedPhase4ProviderReviewArtifactVerification?: Phase4ProviderReviewArtifactVerification;
  providerIntegrationReadiness: ProviderIntegrationReadiness;
  registryEntry?: RegistryEntry;
  registrySummary: ReturnType<typeof summarizeRegistry>;
  runtimeAdapter?: RuntimeAdapter;
  runtimeProfileSummary: ReturnType<typeof summarizeRuntimeProfiles>;
  runtimeSummary: ReturnType<typeof summarizeRuntimeAdapters>;
  selectedDispatchReviewRecord?: DispatchReviewRecord;
  selectedRun?: MockOrchestratorRun;
  phasePriorityEvidence: PhasePriorityEvidenceResult;
  phase3ClearanceBlockerPriority: Phase3ClearanceBlockerPrioritySnapshot;
  phase3ClearanceCompletionStatus: Phase3ClearanceCompletionStatus;
  phase3ClearanceTraceability: Phase3ClearanceTraceabilitySnapshot;
  phase3ClearanceTraceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition;
  phase3ClearanceCommandPlan: Phase3ClearanceCommandPlan;
  phase3ClearancePackage: Phase3ClearancePackage;
  phase3ExitGateEvidence: Phase3ExitGateEvidence;
  phase3HandoffGate: Phase3HandoffGate;
  phase3CommandValidationRecord?: Phase3CommandValidationRecord;
  phase3CommandValidationRecordValidation: Phase3CommandValidationRecordValidation;
  phase3OwnerHandoffRecord?: Phase3OwnerHandoffRecord;
  importedPhase3ProofExportVerification?: Phase3ProofExportVerification;
  phase3ProofExportVerification: Phase3ProofExportVerification;
  phase3OwnerTestingActions: readonly Phase3OwnerTestingAction[];
  phase3SmokeProofReadiness: Phase3SmokeProofReadinessResult;
  phase3RecordedArtifactLoadAvailable: boolean;
  phase11EvidenceEvaluationTime: string;
  phase11EvidenceRecordInputs: Phase11EvidenceRecordInputMap;
  projectManagementTasks: ProjectManagementTask[];
  sessionControlOwnerTestingState: OwnerTestingReadinessState;
  sessionControlReadinessEvidence: SessionControlReadinessEvidence;
  slashCommandExecutionEvidence: SlashCommandExecutionEvidence;
  slashCommandOwnerTestingState: OwnerTestingReadinessState;
  sessions: SessionSummary[];
  tasks: OrchestrationTask[];
  onRunCodexActiveTurnControlSmokeProof: () => void;
  onRunCodexActiveTurnSteerSmokeProof: () => void;
  onRunCodexLiveSmokeProof: () => void;
  onRunCodexLiveControlSmokeProof: () => void;
  onRunCodexTwoPanelSmokeProof: () => void;
  onClearPhase4ProviderApproval: () => void;
  onClearPhase4ProviderAudit: () => void;
  onClearPhase4ProviderPermission: () => void;
  onClearPhase4ProviderRollback: () => void;
  codexCanStartSession: boolean;
  codexLiveSmokeLoading: boolean;
  codexTwoPanelSmokeLoading: boolean;
}) {
  const [streamPlaybackByRunId, setStreamPlaybackByRunId] = useState<
    Record<string, { cursor: number; state: RuntimeStreamPlaybackState }>
  >({});
  const [bridgeIntentByRunId, setBridgeIntentByRunId] = useState<Record<string, RuntimeAdapterBridgeIntent>>({});
  const [launchApprovalIntentByRunId, setLaunchApprovalIntentByRunId] = useState<
    Record<string, RuntimeLaunchApprovalIntent>
  >({});
  const [executionAuditHistory, setExecutionAuditHistory] = useState<RuntimeExecutionAuditRecord[]>(
    () => loadRuntimeExecutionAuditHistory()
  );
  const [liveActionRequestsByProvider, setLiveActionRequestsByProvider] = useState<
    Record<string, LiveActionPermissionRequest>
  >(() => createInitialLiveActionRequests());
  const [liveActionAuditHistory, setLiveActionAuditHistory] = useState<LiveActionAuditRecord[]>(
    () => loadLiveActionAuditRecords()
  );
  const [desktopActionRunnerResult, setDesktopActionRunnerResult] =
    useState<DesktopActionRunnerExecuteResult>(() =>
      buildDesktopActionRunnerBrowserFallbackResult(
        "desktop-action-runner-initial",
        "1970-01-01T00:00:00.000Z"
      )
    );
  const [desktopActionRunnerBusyProvider, setDesktopActionRunnerBusyProvider] =
    useState<string>();
  const [toolEvidenceCaptureHistory, setToolEvidenceCaptureHistory] = useState<
    ToolEvidenceCaptureRecord[]
  >(() => loadToolEvidenceCaptureHistory());
  const [toolEvidenceCaptureIntent, setToolEvidenceCaptureIntent] =
    useState<ToolEvidenceCaptureIntent>("idle");
  const [desktopBridgeStatus, setDesktopBridgeStatus] = useState<DesktopRuntimeBridgeStatus>(
    () => getFallbackDesktopRuntimeBridgeStatus()
  );
  const [desktopPermissionApprovalStatus, setDesktopPermissionApprovalStatus] =
    useState<DesktopPermissionApprovalStatus>(() => getFallbackDesktopPermissionApprovalStatus());
  const [runtimeProfileDraft, setRuntimeProfileDraft] = useState<RuntimeProfile>(() =>
    loadRuntimeProfileDraft(createBlankRuntimeProfile({ adapterId: runtimeAdapter?.id ?? project.id }))
  );
  const [runtimeProfileApprovalIntent, setRuntimeProfileApprovalIntent] =
    useState<RuntimeProfileApprovalIntent>("idle");
  const [runtimeProfileApprovalHistory, setRuntimeProfileApprovalHistory] = useState<
    RuntimeProfileApprovalRecord[]
  >(() => loadRuntimeProfileApprovalHistory());
  const [runtimeProfileActivation, setRuntimeProfileActivation] = useState<
    RuntimeProfileActivationSnapshot | undefined
  >(() => loadRuntimeProfileActivation());
  const [runtimeProfilePermissionRequestHistory, setRuntimeProfilePermissionRequestHistory] =
    useState<RuntimeProfilePermissionRequestRecord[]>(() =>
      loadRuntimeProfilePermissionRequestHistory()
    );
  const [runtimeProfilePermissionRequestIntent, setRuntimeProfilePermissionRequestIntent] =
    useState<RuntimeProfilePermissionRequestIntent>(() =>
      latestPermissionRequestIntent(loadRuntimeProfilePermissionRequestHistory())
    );
  const [phase8AuditReviewRecord, setPhase8AuditReviewRecord] =
    useState<Phase8AuditReviewRecord | undefined>(() => loadPhase8AuditReviewRecord());
  const [
    importedPhase8AuditReviewArtifactVerification,
    setImportedPhase8AuditReviewArtifactVerification
  ] = useState<Phase8AuditReviewArtifactVerification | undefined>();
  const [phase9RunnerApprovalRecord, setPhase9RunnerApprovalRecord] =
    useState<Phase9RunnerApprovalRecord | undefined>(() => loadPhase9RunnerApprovalRecord());
  const blocked = sessions.filter((session) => session.state === "blocked").length;
  const complete = sessions.filter((session) => session.state === "complete").length;
  const taskSummary = summarizeTasks(tasks);
  const providerExecutionGate = useMemo(
    () => buildProviderExecutionGate(providerIntegrationReadiness),
    [providerIntegrationReadiness]
  );
  const selectedRunTasks = selectedRun?.tasks ?? [];
  const workerHandoffSummary = useMemo(
    () => summarizeWorkerHandoff(selectedRunTasks),
    [selectedRunTasks]
  );
  const selectedRunHandoffTask = useMemo(
    () => nextHandoffTask(selectedRunTasks),
    [selectedRunTasks]
  );
  const selectedRunHandoffBrief = useMemo(
    () => (selectedRunHandoffTask ? buildHandoffBrief(selectedRunHandoffTask, project) : undefined),
    [project, selectedRunHandoffTask]
  );
  const nextValidationTask = useMemo(
    () =>
      selectedRunTasks.find(
        (task) =>
          task.role === "validation" &&
          task.status !== "accepted" &&
          task.status !== "blocked"
      ) ?? selectedRunTasks.find((task) => task.role === "validation"),
    [selectedRunTasks]
  );
  const canRecordValidationAttempt =
    Boolean(selectedRun) &&
    Boolean(nextValidationTask) &&
    nextValidationTask?.status !== "accepted" &&
    nextValidationTask?.status !== "blocked" &&
    selectedRun?.status !== "complete" &&
    selectedRun?.status !== "failed" &&
    selectedRun?.status !== "blocked";
  const orchestrationDependencyReadiness: OrchestrationDependencyReadiness = useMemo(
    () => createOrchestrationDependencyReadiness(tasks),
    [tasks]
  );
  const orchestrationDispatchAudit: OrchestrationDispatchAudit = useMemo(
    () => createOrchestrationDispatchAudit(tasks),
    [tasks]
  );
  const orchestrationResultHandoffEvidence: OrchestrationResultHandoffEvidence = useMemo(
    () => createOrchestrationResultHandoffEvidence(tasks, mockRuns),
    [mockRuns, tasks]
  );
  const orchestrationAcceptanceCoverage: OrchestrationAcceptanceCoverage = useMemo(
    () => createOrchestrationAcceptanceCoverage(tasks, mockRuns),
    [mockRuns, tasks]
  );
  const runSummary = summarizeRunHistory(mockRuns);
  const milestoneStatusSummary = useMemo(
    () => summarizeMilestoneStatuses(steerboardMilestoneStatuses),
    []
  );
  const remainingGoalSummary = useMemo(
    () => summarizeRemainingGoalPlan(remainingGoalPlan),
    []
  );
  const remainingGoalPriorityQueue = useMemo(
    () => buildRemainingGoalPriorityQueue(remainingGoalPlan),
    []
  );
  const panelPriority = useMemo(
    () => createCockpitPanelPriority(sessions),
    [sessions]
  );
  const panelFocusTarget = useMemo(
    () => createCockpitPanelFocusTarget(sessions, panelPriority, focusedPanelId),
    [focusedPanelId, panelPriority, sessions]
  );
  const focusedStatus = useMemo(
    () => createCockpitFocusedPanelStatus(sessions, focusedPanelId),
    [focusedPanelId, sessions]
  );
  const toolbarFocusAction = useMemo(
    () => createCockpitToolbarFocusAction(panelFocusTarget, focusedStatus),
    [focusedStatus, panelFocusTarget]
  );
  const interactionReadiness: CockpitInteractionReadiness = useMemo(
    () =>
      createCockpitInteractionReadiness({
        focusedStatus,
        focusTarget: panelFocusTarget,
        layoutCapacity,
        modeHandoffQa,
        toolbarFocusAction
      }),
    [focusedStatus, layoutCapacity, modeHandoffQa, panelFocusTarget, toolbarFocusAction]
  );
  const latestRun = runSummary.latestRun;
  const selectedTimeline = useMemo(
    () => (selectedRun ? buildRunTimeline(selectedRun) : []),
    [selectedRun]
  );
  const localEvidenceReadinessSnapshot = useMemo(
    () => buildLocalEvidenceReadinessSnapshot(selectedRun),
    [selectedRun]
  );
  const toolEvidenceReadinessSnapshot = useMemo(
    () =>
      buildToolEvidenceReadinessSnapshot(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus,
        localEvidenceReadinessSnapshot
      ),
    [
      desktopBridgeStatus,
      desktopPermissionApprovalStatus,
      localEvidenceReadinessSnapshot
    ]
  );
  const timelineSummary = useMemo(
    () => summarizeRunTimeline(selectedTimeline),
    [selectedTimeline]
  );
  const adapterContractItems = useMemo(
    () => buildAdapterContract(runtimeAdapter),
    [runtimeAdapter]
  );
  const adapterContractSummary = useMemo(
    () => summarizeAdapterContract(adapterContractItems),
    [adapterContractItems]
  );
  const runtimeIngestionEvents = useMemo(
    () => buildRuntimeIngestionPreview(selectedTimeline, adapterContractItems),
    [adapterContractItems, selectedTimeline]
  );
  const runtimeIngestionSummary = useMemo(
    () => summarizeRuntimeIngestion(runtimeIngestionEvents),
    [runtimeIngestionEvents]
  );
  const streamPlayback = selectedRun ? streamPlaybackByRunId[selectedRun.id] : undefined;
  const runtimeStreamSnapshot = buildRuntimeStreamSnapshot(
    runtimeIngestionEvents,
    streamPlayback?.cursor ?? 0,
    streamPlayback?.state ?? "idle"
  );
  const cockpitMonitorSummary = buildCockpitMonitorSummary(
    selectedRun,
    timelineSummary,
    runtimeStreamSnapshot
  );
  const runtimeAdapterSessionSnapshot = buildRuntimeAdapterSessionSnapshot(
    runtimeAdapter,
    runtimeStreamSnapshot
  );
  const runtimeCoreEntryValidation: RuntimeCoreEntryValidation = useMemo(
    () =>
      createRuntimeCoreEntryValidation(
        runtimeAdapter,
        adapterContractItems,
        runtimeAdapterSessionSnapshot
      ),
    [adapterContractItems, runtimeAdapter, runtimeAdapterSessionSnapshot]
  );
  const runtimeEventSourceSnapshot = buildRuntimeEventSourceSnapshot(
    runtimeAdapterSessionSnapshot,
    runtimeStreamSnapshot,
    runtimeIngestionEvents
  );
  const cockpitMonitorNextEventPreview = useMemo(
    () => buildCockpitMonitorNextEventPreview(runtimeEventSourceSnapshot),
    [runtimeEventSourceSnapshot]
  );
  const cockpitMonitorHealth = useMemo(
    () => createCockpitMonitorHealth(runtimeStreamSnapshot),
    [runtimeStreamSnapshot]
  );
  const cockpitMonitorAttention = useMemo(
    () => createCockpitMonitorAttention(cockpitMonitorSummary, cockpitMonitorHealth),
    [cockpitMonitorHealth, cockpitMonitorSummary]
  );
  const cockpitMonitorQuality = useMemo(
    () => createCockpitMonitorQuality(runtimeStreamSnapshot),
    [runtimeStreamSnapshot]
  );
  const cockpitMonitorLoop = useMemo(
    () => createCockpitMonitorLoop(selectedRun),
    [selectedRun]
  );
  const runtimeSourceConnectionSnapshot = buildRuntimeSourceConnectionSnapshot(
    runtimeAdapter,
    runtimeEventSourceSnapshot
  );
  const bridgeIntent = selectedRun ? bridgeIntentByRunId[selectedRun.id] ?? "detached" : "detached";
  const runtimeAdapterBridgeSnapshot = buildRuntimeAdapterBridgeSnapshot(
    runtimeSourceConnectionSnapshot,
    runtimeStreamSnapshot,
    bridgeIntent
  );
  const runtimeLaunchRequestSnapshot = buildRuntimeLaunchRequestSnapshot(
    runtimeAdapterBridgeSnapshot,
    runtimeSourceConnectionSnapshot,
    runtimeEventSourceSnapshot
  );
  const launchApprovalIntent = selectedRun ? launchApprovalIntentByRunId[selectedRun.id] ?? "idle" : "idle";
  const runtimeLaunchApprovalSnapshot = buildRuntimeLaunchApprovalSnapshot(
    runtimeLaunchRequestSnapshot,
    launchApprovalIntent
  );
  const runtimeLaunchHandoffAcceptance: RuntimeLaunchHandoffAcceptance = useMemo(
    () =>
      createRuntimeLaunchHandoffAcceptance(
        runtimeEventSourceSnapshot,
        runtimeSourceConnectionSnapshot,
        runtimeLaunchRequestSnapshot,
        runtimeLaunchApprovalSnapshot
      ),
    [
      runtimeEventSourceSnapshot,
      runtimeLaunchApprovalSnapshot,
      runtimeLaunchRequestSnapshot,
      runtimeSourceConnectionSnapshot
    ]
  );
  const runtimeRecoveryFailureCoverage: RuntimeRecoveryFailureCoverage = useMemo(
    () =>
      createRuntimeRecoveryFailureCoverage(
        runtimeAdapter,
        runtimeEventSourceSnapshot,
        runtimeSourceConnectionSnapshot,
        runtimeLaunchRequestSnapshot,
        runtimeLaunchApprovalSnapshot,
        runtimeStreamSnapshot
      ),
    [
      runtimeAdapter,
      runtimeEventSourceSnapshot,
      runtimeLaunchApprovalSnapshot,
      runtimeLaunchRequestSnapshot,
      runtimeSourceConnectionSnapshot,
      runtimeStreamSnapshot
    ]
  );
  const runtimeExecutionAuditSnapshot = buildRuntimeExecutionAuditSnapshot(
    runtimeLaunchRequestSnapshot,
    runtimeLaunchApprovalSnapshot
  );
  const liveActionPermissionSummaries = useMemo(
    () =>
      liveActionGateDefinitions.map((definition) => {
        const request =
          liveActionRequestsByProvider[definition.provider] ??
          createLiveActionPermissionRequest(definition, "idle", "1970-01-01T00:00:00.000Z");

        return buildLiveActionPermissionRequestSummary({
          ...request,
          detail: definition.detail,
          requestedBy: "operator"
        });
      }),
    [liveActionRequestsByProvider]
  );
  const liveActionExecutableCount = useMemo(
    () =>
      liveActionGateDefinitions.filter((definition) =>
        canExecuteLiveAction(
          liveActionRequestsByProvider[definition.provider] ??
            createLiveActionPermissionRequest(definition, "idle", "1970-01-01T00:00:00.000Z")
        )
      ).length,
    [liveActionRequestsByProvider]
  );
  const liveActionRunnerEvaluations = useMemo(
    () =>
      LIVE_ACTION_RUNNER_DEFINITIONS.map((runnerDefinition) => {
        const gateDefinition = liveActionGateDefinitions.find(
          (definition) => definition.provider === runnerDefinition.provider
        );
        const fallbackRequest: LiveActionPermissionRequest = gateDefinition
          ? createLiveActionPermissionRequest(
              gateDefinition,
              "idle",
              "1970-01-01T00:00:00.000Z"
            )
          : {
              id: `${runnerDefinition.provider}:live-action-permission`,
              provider: runnerDefinition.provider,
              actionLabel: runnerDefinition.actionLabel,
              state: "idle",
              requestedAt: "1970-01-01T00:00:00.000Z",
              risk: runnerDefinition.risk
            };

        return evaluateLiveActionRunnerExecution(
          runnerDefinition,
          liveActionRequestsByProvider[runnerDefinition.provider] ?? fallbackRequest
        );
      }),
    [liveActionRequestsByProvider]
  );
  const liveActionRunnerSummary = useMemo(
    () => summarizeLiveActionRunnerExecutions(liveActionRunnerEvaluations),
    [liveActionRunnerEvaluations]
  );
  const catalogRefreshOwnerStateBySurface = useMemo(
    () =>
      new Map(
        catalogRefreshOwnerValidation.surfaces.map((surface) => [
          surface.surface,
          surface.pass ? "ready" : "blocked"
        ] as const)
      ),
    [catalogRefreshOwnerValidation]
  );
  const ownerTestingChecklist: OwnerTestingChecklist = useMemo(
    () =>
      buildOwnerTestingChecklist({
        launch: "ready",
        connect: runtimeAdapter?.state === "blocked" ? "blocked" : "review",
        chat: "review",
        "multi-panel": "review",
        controls: sessionControlOwnerTestingState,
        "slash-commands": slashCommandOwnerTestingState,
        catalogs: "review",
        "catalog-command-refresh": catalogRefreshOwnerStateBySurface.get("command") ?? "review",
        "catalog-skill-refresh": catalogRefreshOwnerStateBySurface.get("skill") ?? "review",
        "catalog-plugin-refresh": catalogRefreshOwnerStateBySurface.get("plugin") ?? "review",
        "catalog-mcp-refresh": catalogRefreshOwnerStateBySurface.get("mcp") ?? "review",
        "catalog-automation-refresh": catalogRefreshOwnerStateBySurface.get("automation") ?? "review",
        "catalog-personalization-refresh": catalogRefreshOwnerStateBySurface.get("personalization") ?? "review",
        migration: "ready",
        planning: "ready",
        dispatch: "ready",
        permissions: liveActionExecutableCount > 0 ? "ready" : "review",
        reload: "review",
        recovery: runtimeRecoveryFailureCoverage.tone === "blocked" ? "blocked" : "review"
      }),
    [
      catalogRefreshOwnerStateBySurface,
      liveActionExecutableCount,
      runtimeAdapter?.state,
      runtimeRecoveryFailureCoverage.tone,
      sessionControlOwnerTestingState,
      slashCommandOwnerTestingState
    ]
  );
  const failureStateFixtures: readonly FailureStateFixture[] = useMemo(
    () => buildFailureStateFixtures(),
    []
  );
  const failureStateFixtureSummary: FailureStateFixtureSummary = useMemo(
    () => summarizeFailureStateFixtures(failureStateFixtures),
    [failureStateFixtures]
  );
  const phase11EvidenceRecords = useMemo(
    () =>
      buildPhase11EvidenceRecords(
        phase11EvidenceRecordInputs,
        phase11EvidenceEvaluationTime
      ),
    [phase11EvidenceEvaluationTime, phase11EvidenceRecordInputs]
  );
  const phase11ProofFreshnessDepth = useMemo(
    () =>
      buildPhase11ProofFreshnessDepth({
        phasePriorityEvidence,
        phase3ClearancePackage,
        phase3SmokeProofReadiness,
        phase3ClearanceCommandPlan,
        phase3CommandValidationRecordValidation,
        phase3ProofExportVerification,
        phase3HandoffGate
      }),
    [
      phase3ClearanceCommandPlan,
      phase3ClearancePackage,
      phase3CommandValidationRecordValidation,
      phase3ProofExportVerification,
      phase3HandoffGate,
      phase3SmokeProofReadiness,
      phasePriorityEvidence
    ]
  );
  const phase11OwnerCommandCenter = useMemo(
    () =>
      buildPhase11OwnerCommandCenterSnapshot({
        checklist: ownerTestingChecklist,
        phasePriorityEvidence,
        phase3ClearancePackage,
        phase3SmokeProofReadiness,
        proofFreshnessDepth: phase11ProofFreshnessDepth,
        failureSummary: failureStateFixtureSummary,
        remainingGoalSummary,
        freshCheckoutEvidence: phase11EvidenceRecords.records["fresh-checkout"]
      }),
    [
      failureStateFixtureSummary,
      ownerTestingChecklist,
      phase3ClearancePackage,
      phase3SmokeProofReadiness,
      phase11EvidenceRecords,
      phase11ProofFreshnessDepth,
      phasePriorityEvidence,
      remainingGoalSummary
    ]
  );
  const liveActionAuditMarkdown = useMemo(
    () => buildLiveActionAuditExportMarkdown(liveActionAuditHistory),
    [liveActionAuditHistory]
  );
  const desktopActionRunnerSummary = useMemo(
    () => summarizeDesktopActionRunnerResult(desktopActionRunnerResult),
    [desktopActionRunnerResult]
  );
  const terminalLiveActionRequest = useMemo(
    () =>
      liveActionRequestsByProvider.terminal ??
      createLiveActionPermissionRequest(
        liveActionGateDefinitions[0],
        "idle",
        "1970-01-01T00:00:00.000Z"
      ),
    [liveActionRequestsByProvider]
  );
  const terminalLiveActionRunnerEvaluation = useMemo(
    () => liveActionRunnerEvaluations.find((evaluation) => evaluation.provider === "terminal"),
    [liveActionRunnerEvaluations]
  );
  const phase9RunnerApproval = useMemo(
    () =>
      buildPhase9RunnerApprovalSnapshot({
        permissionRequest: terminalLiveActionRequest,
        runnerEvaluation: terminalLiveActionRunnerEvaluation,
        desktopRunnerResult: desktopActionRunnerResult,
        auditRecords: liveActionAuditHistory,
        phase8AuditReviewRecord,
        runnerApprovalRecord: phase9RunnerApprovalRecord
      }),
    [
      desktopActionRunnerResult,
      phase8AuditReviewRecord,
      phase9RunnerApprovalRecord,
      liveActionAuditHistory,
      terminalLiveActionRequest,
      terminalLiveActionRunnerEvaluation
    ]
  );
  const recordPhase9RunnerApprovalReview = useCallback(() => {
    if (!phase9RunnerReviewAction(phase9RunnerApproval).canRecord) {
      return;
    }

    const record = createPhase9RunnerApprovalRecord(
      phase9RunnerApproval,
      phase8AuditReviewRecord,
      new Date().toISOString()
    );

    savePhase9RunnerApprovalRecord(record);
    setPhase9RunnerApprovalRecord(record);
  }, [phase8AuditReviewRecord, phase9RunnerApproval]);
  const clearPhase9RunnerApprovalReview = useCallback(() => {
    clearPhase9RunnerApprovalRecord();
    setPhase9RunnerApprovalRecord(undefined);
  }, []);
  const selectedRuntimeProfile = useMemo(
    () => selectRuntimeProfileForAdapter(runtimeProfiles, runtimeAdapter?.id ?? project.id),
    [project.id, runtimeAdapter?.id]
  );
  const selectedRuntimeProfileReadiness = useMemo(
    () =>
      selectedRuntimeProfile
        ? evaluateRuntimeProfileReadiness(selectedRuntimeProfile)
        : undefined,
    [selectedRuntimeProfile]
  );
  const runtimeProfileDraftReadiness = useMemo(
    () => evaluateRuntimeProfileReadiness(runtimeProfileDraft),
    [runtimeProfileDraft]
  );
  const runtimeProfileApprovalSnapshot = useMemo(
    () =>
      buildRuntimeProfileApprovalSnapshot(
        runtimeProfileDraft,
        runtimeProfileDraftReadiness,
        runtimeProfileApprovalIntent
      ),
    [runtimeProfileApprovalIntent, runtimeProfileDraft, runtimeProfileDraftReadiness]
  );
  const runtimeProfileActivationSnapshot = useMemo(
    () => buildRuntimeProfileActivationSnapshot(runtimeProfileDraft, runtimeProfileDraftReadiness),
    [runtimeProfileDraft, runtimeProfileDraftReadiness]
  );
  const runtimeProfilePermissionHandoffSnapshot = useMemo(
    () => buildRuntimeProfilePermissionHandoffSnapshot(runtimeProfileActivation, desktopBridgeStatus),
    [desktopBridgeStatus, runtimeProfileActivation]
  );
  const runtimeProfilePermissionApprovalSnapshot = useMemo(
    () =>
      buildRuntimeProfilePermissionApprovalSnapshot(
        runtimeProfilePermissionHandoffSnapshot,
        runtimeProfilePermissionRequestIntent
      ),
    [runtimeProfilePermissionHandoffSnapshot, runtimeProfilePermissionRequestIntent]
  );
  const runtimeProfilePermissionAuditSnapshot = useMemo(
    () =>
      buildRuntimeProfilePermissionAuditSnapshot(
        runtimeProfilePermissionApprovalSnapshot,
        desktopPermissionApprovalStatus,
        runtimeProfilePermissionRequestHistory
      ),
    [
      desktopPermissionApprovalStatus,
      runtimeProfilePermissionApprovalSnapshot,
      runtimeProfilePermissionRequestHistory
    ]
  );
  const phase8PermissionAuditDepth = useMemo(
    () =>
      buildPhase8PermissionAuditDepth({
        liveActionSummaries: liveActionPermissionSummaries,
        liveActionAuditRecords: liveActionAuditHistory,
        runtimeExecutionAudit: runtimeExecutionAuditSnapshot,
        runtimeExecutionAuditHistory: executionAuditHistory,
        runtimeProfilePermissionApproval: runtimeProfilePermissionApprovalSnapshot,
        runtimeProfilePermissionAudit: runtimeProfilePermissionAuditSnapshot,
        runtimeProfilePermissionRequestHistory,
        ownerAuditReviewRecord: phase8AuditReviewRecord
      }),
    [
      executionAuditHistory,
      liveActionAuditHistory,
      liveActionPermissionSummaries,
      phase8AuditReviewRecord,
      runtimeExecutionAuditSnapshot,
      runtimeProfilePermissionApprovalSnapshot,
      runtimeProfilePermissionAuditSnapshot,
      runtimeProfilePermissionRequestHistory
    ]
  );
  const phase9RunnerApprovalDepth = useMemo(
    () => buildPhase9RunnerApprovalDepthSummary(phase9RunnerApproval),
    [phase9RunnerApproval]
  );
  const phase9RunnerTraceability = useMemo(
    () =>
      buildPhase9RunnerTraceabilitySummary({
        approval: phase9RunnerApproval,
        depth: phase9RunnerApprovalDepth,
        phase8: phase8PermissionAuditDepth,
        runnerReviewRecord: phase9RunnerApprovalRecord
      }),
    [
      phase8PermissionAuditDepth,
      phase9RunnerApproval,
      phase9RunnerApprovalDepth,
      phase9RunnerApprovalRecord
    ]
  );
  const phase9DesktopProbeGate = useMemo(
    () => buildPhase9DesktopProbeGate(phase9RunnerApproval, phase9RunnerTraceability),
    [phase9RunnerApproval, phase9RunnerTraceability]
  );
  const phase8RiskTraceability = useMemo(
    () => buildPhase8RiskTraceabilitySummary({ snapshot: phase8PermissionAuditDepth }),
    [phase8PermissionAuditDepth]
  );
  const phase8RiskBlockerPriority = useMemo(
    () =>
      buildPhase8RiskBlockerPriority({
        snapshot: phase8PermissionAuditDepth,
        traceability: phase8RiskTraceability
      }),
    [phase8PermissionAuditDepth, phase8RiskTraceability]
  );
  const phase8AuditReviewArtifactVerification = useMemo(() => {
    const artifact = buildPhase8AuditReviewArtifact({
      exportedAt: phase11EvidenceEvaluationTime,
      evaluatedAt: phase11EvidenceEvaluationTime,
      snapshot: phase8PermissionAuditDepth,
      traceability: phase8RiskTraceability,
      blockerPriority: phase8RiskBlockerPriority,
      reviewRecord: phase8AuditReviewRecord
    });

    return verifyPhase8AuditReviewArtifact(artifact, {
      verifiedAt: phase11EvidenceEvaluationTime
    });
  }, [
    phase11EvidenceEvaluationTime,
    phase8AuditReviewRecord,
    phase8PermissionAuditDepth,
    phase8RiskBlockerPriority,
    phase8RiskTraceability
  ]);
  const exportPhase8AuditReviewArtifact = useCallback(() => {
    const now = new Date().toISOString();
    const artifact = buildPhase8AuditReviewArtifact({
      exportedAt: now,
      evaluatedAt: phase11EvidenceEvaluationTime,
      snapshot: phase8PermissionAuditDepth,
      traceability: phase8RiskTraceability,
      blockerPriority: phase8RiskBlockerPriority,
      reviewRecord: phase8AuditReviewRecord
    });
    const serializedArtifact = serializePhase8AuditReviewArtifact(artifact);
    const verification = verifyPhase8AuditReviewArtifact(artifact, { verifiedAt: now });

    if (typeof document !== "undefined" && typeof URL !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob([serializedArtifact], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `phase8-audit-review-${now.replace(/[:.]/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    onAppNotice(
      `Phase 8 audit review export ${verification.statusLabel}: ${verification.detail}`
    );
  }, [
    onAppNotice,
    phase11EvidenceEvaluationTime,
    phase8AuditReviewRecord,
    phase8PermissionAuditDepth,
    phase8RiskBlockerPriority,
    phase8RiskTraceability
  ]);
  const verifyImportedPhase8AuditReviewArtifact = useCallback((serializedArtifact: string) => {
    const now = new Date().toISOString();
    const verification = verifySerializedPhase8AuditReviewArtifact(serializedArtifact, {
      verifiedAt: now
    });

    setImportedPhase8AuditReviewArtifactVerification(verification);
    onAppNotice(`Imported Phase 8 audit review ${verification.statusLabel}: ${verification.detail}`);
  }, [onAppNotice]);
  const recordPhase8AuditReview = useCallback(() => {
    const record = createPhase8AuditReviewRecord(
      phase8PermissionAuditDepth,
      new Date().toISOString(),
      phase8RiskBlockerPriority
    );

    savePhase8AuditReviewRecord(record);
    setPhase8AuditReviewRecord(record);
  }, [phase8PermissionAuditDepth, phase8RiskBlockerPriority]);
  const clearPhase8AuditReview = useCallback(() => {
    clearPhase8AuditReviewRecord();
    setPhase8AuditReviewRecord(undefined);
  }, []);
  const securityPrivacyThreatModel = useMemo(
    () =>
      createSecurityPrivacyThreatModel(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus,
        localEvidenceReadinessSnapshot,
        toolEvidenceReadinessSnapshot,
        runtimeProfilePermissionApprovalSnapshot,
        runtimeProfilePermissionAuditSnapshot
      ),
    [
      desktopBridgeStatus,
      desktopPermissionApprovalStatus,
      localEvidenceReadinessSnapshot,
      runtimeProfilePermissionApprovalSnapshot,
      runtimeProfilePermissionAuditSnapshot,
      toolEvidenceReadinessSnapshot
    ]
  );
  const releasePrivacyReadinessSnapshot = useMemo(
    () =>
      createReleasePrivacyReadiness(securityPrivacyThreatModel, {
        localFirstDefaultsReady: true,
        dependencyReviewReady: "ready",
        publicFixtureReady: true,
        realProjectDataReady: "ready",
        runtimeAdapterEdgeCasesReady: "ready",
        auditExportReviewReady: "ready"
      }),
    [securityPrivacyThreatModel]
  );
  const releasePrivacyItemStatus = useMemo(
    () =>
      new Map(
        releasePrivacyReadinessSnapshot.items.map((item) => [
          item.label,
          item.status
        ])
      ),
    [releasePrivacyReadinessSnapshot]
  );
  const securityAcceptanceCoverageSnapshot = useMemo(
    () =>
      createSecurityAcceptanceCoverage({
        hasSelectedRun: Boolean(selectedRun),
        selectedRunStatus: selectedRun?.status,
        releasePrivacyState: releasePrivacyReadinessSnapshot.state,
        releasePrivacyReadiness: releasePrivacyReadinessSnapshot.readiness,
        realProjectDataReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Sensitive data boundary")
        ),
        runtimeAdapterEdgesReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Permission and execution lock")
        ),
        auditReviewReady: toSecurityAcceptanceEvidenceState(
          releasePrivacyItemStatus.get("Audit and export trail")
        )
      }),
    [releasePrivacyItemStatus, releasePrivacyReadinessSnapshot, selectedRun]
  );
  const securityAcceptanceRepeatedRunsSnapshot = useMemo(
    () =>
      createSecurityAcceptanceRepeatedRuns(
        mockRuns.map((run) =>
          createSecurityAcceptanceCoverage({
            hasSelectedRun: true,
            selectedRunStatus: run.status,
            releasePrivacyState: releasePrivacyReadinessSnapshot.state,
            releasePrivacyReadiness: releasePrivacyReadinessSnapshot.readiness,
            realProjectDataReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Sensitive data boundary")
            ),
            runtimeAdapterEdgesReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Permission and execution lock")
            ),
            auditReviewReady: toSecurityAcceptanceEvidenceState(
              releasePrivacyItemStatus.get("Audit and export trail")
            )
          })
        ),
        { requiredRunCount: 3 }
      ),
    [mockRuns, releasePrivacyItemStatus, releasePrivacyReadinessSnapshot]
  );
  const desktopPackagingReadinessSnapshot = useMemo(
    () =>
      buildDesktopPackagingReadinessSnapshot(
        desktopBridgeStatus,
        desktopPermissionApprovalStatus
      ),
    [desktopBridgeStatus, desktopPermissionApprovalStatus]
  );
  const securityFinalReviewSnapshot = useMemo(
    () =>
      createSecurityFinalReview({
        releasePrivacy: releasePrivacyReadinessSnapshot,
        currentAcceptance: securityAcceptanceCoverageSnapshot,
        repeatedRuns: securityAcceptanceRepeatedRunsSnapshot,
        packagingPaused: true,
        packagingLocked: desktopPackagingReadinessSnapshot.packagingLocked
      }),
    [
      desktopPackagingReadinessSnapshot.packagingLocked,
      releasePrivacyReadinessSnapshot,
      securityAcceptanceCoverageSnapshot,
      securityAcceptanceRepeatedRunsSnapshot
    ]
  );
  const phase11ReleaseReadiness = useMemo(
    () =>
      buildPhase11ReleaseReadinessSnapshot({
        ownerCommandCenter: phase11OwnerCommandCenter,
        proofFreshnessDepth: phase11ProofFreshnessDepth,
        desktopPackaging: desktopPackagingReadinessSnapshot,
        securityFinalReview: securityFinalReviewSnapshot,
        remainingGoalSummary,
        projectManagementTasks,
        cleanCheckoutEvidence: phase11EvidenceRecords.records["clean-checkout"],
        buildTestEvidence: phase11EvidenceRecords.records["build-test"],
        docsKnownLimitsEvidence: phase11EvidenceRecords.records["docs-known-limits"],
        signedAuditExportEvidence: phase11EvidenceRecords.records["signed-audit-export"],
        releaseDecisionEvidence: phase11EvidenceRecords.records["release-decision"]
      }),
    [
      desktopPackagingReadinessSnapshot,
      phase11OwnerCommandCenter,
      phase11ProofFreshnessDepth,
      phase11EvidenceRecords,
      projectManagementTasks,
      remainingGoalSummary,
      securityFinalReviewSnapshot
    ]
  );
  const phase11SignedAuditExportArtifactVerification = useMemo(() => {
    const artifact = buildPhase11SignedAuditExportArtifact({
      exportedAt: phase11EvidenceEvaluationTime,
      evaluatedAt: phase11EvidenceEvaluationTime,
      evidenceRecords: phase11EvidenceRecords,
      releaseReadiness: phase11ReleaseReadiness,
      releasePrivacy: releasePrivacyReadinessSnapshot,
      securityFinalReview: securityFinalReviewSnapshot,
      packagingPaused:
        desktopPackagingReadinessSnapshot.packagingLocked &&
        !desktopPackagingReadinessSnapshot.canPackage
    });

    return verifyPhase11SignedAuditExportArtifact(artifact);
  }, [
    desktopPackagingReadinessSnapshot.canPackage,
    desktopPackagingReadinessSnapshot.packagingLocked,
    phase11EvidenceEvaluationTime,
    phase11EvidenceRecords,
    phase11ReleaseReadiness,
    releasePrivacyReadinessSnapshot,
    securityFinalReviewSnapshot
  ]);
  const exportPhase11SignedAuditArtifact = useCallback(() => {
    const now = new Date().toISOString();
    const artifact = buildPhase11SignedAuditExportArtifact({
      exportedAt: now,
      evaluatedAt: phase11EvidenceEvaluationTime,
      evidenceRecords: phase11EvidenceRecords,
      releaseReadiness: phase11ReleaseReadiness,
      releasePrivacy: releasePrivacyReadinessSnapshot,
      securityFinalReview: securityFinalReviewSnapshot,
      packagingPaused:
        desktopPackagingReadinessSnapshot.packagingLocked &&
        !desktopPackagingReadinessSnapshot.canPackage
    });
    const serializedArtifact = serializePhase11SignedAuditExportArtifact(artifact);
    const verification = verifyPhase11SignedAuditExportArtifact(artifact);

    if (typeof document !== "undefined" && typeof URL !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob([serializedArtifact], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `phase11-signed-audit-export-${now.replace(/[:.]/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    onAppNotice(`Phase 11 signed audit export ${verification.statusLabel}: ${verification.detail}`);
  }, [
    desktopPackagingReadinessSnapshot.canPackage,
    desktopPackagingReadinessSnapshot.packagingLocked,
    onAppNotice,
    phase11EvidenceEvaluationTime,
    phase11EvidenceRecords,
    phase11ReleaseReadiness,
    releasePrivacyReadinessSnapshot,
    securityFinalReviewSnapshot
  ]);
  const canActivateDraftProfile =
    runtimeProfileApprovalSnapshot.state === "requested" &&
    canActivateRuntimeProfile(runtimeProfileDraftReadiness);
  const cockpitMonitorControlState = buildCockpitMonitorControlState({
    canAttachSource: runtimeAdapterBridgeSnapshot.canAttach,
    canStream: runtimeAdapterBridgeSnapshot.canStream,
    cursor: runtimeStreamSnapshot.cursor,
    eventCount: runtimeIngestionEvents.length,
    hasRun: Boolean(selectedRun),
    isSourceAttached: runtimeAdapterBridgeSnapshot.attached,
    streamState: runtimeStreamSnapshot.state
  });
  const canStartStream = cockpitMonitorControlState.canStart;
  const canPauseStream = cockpitMonitorControlState.canPause;
  const canResetStream = cockpitMonitorControlState.canReset;
  const recentEventFeed = buildCockpitMonitorEventFeed(runtimeStreamSnapshot);
  const cockpitMonitorDepth = useMemo(
    () =>
      createCockpitMonitorDepth(
        cockpitMonitorSummary,
        cockpitMonitorQuality,
        cockpitMonitorLoop,
        recentEventFeed
      ),
    [cockpitMonitorLoop, cockpitMonitorQuality, cockpitMonitorSummary, recentEventFeed]
  );
  const cockpitAcceptancePass: CockpitAcceptancePass = useMemo(
    () =>
      createCockpitAcceptancePass({
        interactionReadiness,
        modeHandoffQa,
        monitorDepth: cockpitMonitorDepth
      }),
    [cockpitMonitorDepth, interactionReadiness, modeHandoffQa]
  );
  const phase10ArenaPolish = useMemo(
    () =>
      buildPhase10ArenaPolishSnapshot({
        isAdaptiveLayout,
        adaptivePanelCount,
        visiblePanelCount: adaptiveVisiblePanelCount,
        hiddenPanelCount: adaptiveHiddenPanelCount,
        layoutCapacity,
        interactionReadiness,
        acceptancePass: cockpitAcceptancePass,
        hasKeyboardAdjustment: true,
        hasDropPreview: true,
        hasSavedLayoutRepair: true,
        flexLayoutSpike: buildPhase10FlexLayoutSpikeSummary({
          repositoryName: "caplin/FlexLayout",
          expectedLicense: "MIT",
          hasMitLicenseNotice: true,
          supportsTabsets: true,
          supportsSplitters: true,
          supportsSavedLayoutJson: true,
          supportsDockablePanels: true,
          dependencyInstalled: false,
          preservesCustomLayoutFallback: true,
          ownerApprovedDependency: false
        }),
        terminologyIssues: []
      }),
    [
      adaptiveHiddenPanelCount,
      adaptivePanelCount,
      adaptiveVisiblePanelCount,
      cockpitAcceptancePass,
      interactionReadiness,
      isAdaptiveLayout,
      layoutCapacity
    ]
  );

  useEffect(() => {
    if (!selectedRun || runtimeStreamSnapshot.state !== "streaming") {
      return;
    }

    const timer = window.setInterval(() => {
      setStreamPlaybackByRunId((current) => {
        const playback = current[selectedRun.id] ?? { cursor: 0, state: "streaming" };
        const nextPosition = nextRuntimeStreamPosition(playback.cursor, runtimeIngestionEvents.length);
        const nextSnapshot = buildRuntimeStreamSnapshot(
          runtimeIngestionEvents,
          nextPosition,
          "streaming"
        );

        return {
          ...current,
          [selectedRun.id]: {
            cursor: nextPosition,
            state: nextSnapshot.state
          }
        };
      });
    }, streamIntervalMs);

    return () => window.clearInterval(timer);
  }, [runtimeIngestionEvents, runtimeStreamSnapshot.state, selectedRun]);

  useEffect(() => {
    saveRuntimeExecutionAuditHistory(executionAuditHistory);
  }, [executionAuditHistory]);

  useEffect(() => {
    saveLiveActionAuditRecords(liveActionAuditHistory);
  }, [liveActionAuditHistory]);

  useEffect(() => {
    saveToolEvidenceCaptureHistory(toolEvidenceCaptureHistory);
  }, [toolEvidenceCaptureHistory]);

  useEffect(() => {
    saveRuntimeProfileDraft(runtimeProfileDraft);
  }, [runtimeProfileDraft]);

  useEffect(() => {
    saveRuntimeProfileApprovalHistory(runtimeProfileApprovalHistory);
  }, [runtimeProfileApprovalHistory]);

  useEffect(() => {
    saveRuntimeProfileActivation(runtimeProfileActivation);
  }, [runtimeProfileActivation]);

  useEffect(() => {
    saveRuntimeProfilePermissionRequestHistory(runtimeProfilePermissionRequestHistory);
  }, [runtimeProfilePermissionRequestHistory]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadDesktopRuntimeBridgeStatus(),
      loadDesktopPermissionApprovalStatus()
    ]).then(([bridgeStatus, permissionApprovalStatus]) => {
      if (isMounted) {
        setDesktopBridgeStatus(bridgeStatus);
        setDesktopPermissionApprovalStatus(permissionApprovalStatus);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateStreamPlayback(state: RuntimeStreamPlaybackState, cursor = runtimeStreamSnapshot.cursor) {
    if (!selectedRun) {
      return;
    }

    setStreamPlaybackByRunId((current) => ({
      ...current,
      [selectedRun.id]: { cursor, state }
    }));
  }

  function updateBridgeIntent(intent: RuntimeAdapterBridgeIntent) {
    if (!selectedRun) {
      return;
    }

    setBridgeIntentByRunId((current) => ({
      ...current,
      [selectedRun.id]: intent
    }));

    if (intent === "detached" && runtimeStreamSnapshot.state === "streaming") {
      updateStreamPlayback("paused");
    }
  }

  function updateLaunchApprovalIntent(intent: RuntimeLaunchApprovalIntent) {
    if (!selectedRun) {
      return;
    }

    setLaunchApprovalIntentByRunId((current) => ({
      ...current,
      [selectedRun.id]: intent
    }));
  }

  function recordLaunchApprovalAction(
    action: RuntimeExecutionAuditRecordAction,
    nextIntent: RuntimeLaunchApprovalIntent
  ) {
    if (!selectedRun) {
      return;
    }

    const record = createRuntimeExecutionAuditRecord(
      runtimeExecutionAuditSnapshot,
      action,
      new Date().toISOString()
    );

    setExecutionAuditHistory((current) => appendRuntimeExecutionAuditRecord(current, record));
    updateLaunchApprovalIntent(nextIntent);
  }

  function recordToolEvidenceCaptureAction(
    action: ToolEvidenceCaptureRecordAction,
    nextIntent: ToolEvidenceCaptureIntent
  ) {
    const record = createToolEvidenceCaptureRecord(
      toolEvidenceReadinessSnapshot,
      action,
      new Date().toISOString()
    );

    setToolEvidenceCaptureHistory((current) =>
      appendToolEvidenceCaptureRecord(current, record)
    );
    setToolEvidenceCaptureIntent(nextIntent);
  }

  function recordLiveActionPermissionDecision(
    definition: LiveActionGateDefinition,
    decision: LiveActionPermissionDecision,
    auditAction: LiveActionAuditAction,
    resultSummary: string
  ) {
    const timestamp = new Date().toISOString();

    setLiveActionRequestsByProvider((current) => {
      const existing =
        current[definition.provider] ??
        createLiveActionPermissionRequest(definition, "idle", timestamp);
      const requestedAt = decision === "request" || decision === "reset" ? timestamp : existing.requestedAt;
      const expiresAt =
        decision === "request"
          ? new Date(Date.parse(timestamp) + liveActionPermissionTimeoutMs).toISOString()
          : decision === "reset"
            ? undefined
            : existing.expiresAt;
      const timeoutMs =
        decision === "request"
          ? liveActionPermissionTimeoutMs
          : decision === "reset"
            ? undefined
            : existing.timeoutMs;

      return {
        ...current,
        [definition.provider]: {
          ...existing,
          state: applyLiveActionPermissionDecision(existing.state, decision),
          requestedAt,
          timeoutMs,
          expiresAt
        }
      };
    });

    const record = createLiveActionAuditRecord(
      buildLiveActionAuditInput(definition, resultSummary),
      auditAction,
      timestamp
    );

    setLiveActionAuditHistory((current) => appendLiveActionAuditRecord(current, record));
  }

  function recordLiveActionRunnerDryRun(definition: LiveActionGateDefinition) {
    const runnerDefinition = LIVE_ACTION_RUNNER_DEFINITIONS.find(
      (runner) => runner.provider === definition.provider
    );

    if (!runnerDefinition) {
      return;
    }

    const timestamp = new Date().toISOString();
    const request =
      liveActionRequestsByProvider[definition.provider] ??
      createLiveActionPermissionRequest(definition, "idle", timestamp);
    const evaluation = evaluateLiveActionRunnerExecution(
      runnerDefinition,
      request,
      timestamp,
      timestamp
    );
    const record = createLiveActionAuditRecord(
      buildLiveActionAuditInput(
        definition,
        evaluation.canExecute
          ? `Dry-run completed with no live side effects. Rollback: fixed no-mutation contract remains attached. ${evaluation.reason}`
          : `Dry-run blocked. Rollback: fixed no-mutation contract remains attached. ${evaluation.reason}`
      ),
      evaluation.canExecute ? "executed" : "failed",
      timestamp
    );

    setLiveActionAuditHistory((current) => appendLiveActionAuditRecord(current, record));
  }

  async function recordDesktopActionRunnerProbe(definition: LiveActionGateDefinition) {
    const runnerDefinition = LIVE_ACTION_RUNNER_DEFINITIONS.find(
      (runner) => runner.provider === definition.provider
    );

    if (!runnerDefinition || definition.provider !== "terminal") {
      return;
    }

    const timestamp = new Date().toISOString();
    const request =
      liveActionRequestsByProvider[definition.provider] ??
      createLiveActionPermissionRequest(definition, "idle", timestamp);

    if (!phase9DesktopProbeGate.canRun) {
      const result = buildDesktopActionRunnerBuildFailureResult(
        request.id,
        "execution-blocked",
        `Phase 9 desktop probe is held: ${phase9DesktopProbeGate.holdReason}`,
        timestamp
      );
      setDesktopActionRunnerResult(result);
      const resultSummary = summarizeDesktopActionRunnerResult(result);
      const record = createLiveActionAuditRecord(
        buildLiveActionAuditInput(
          definition,
          `${resultSummary.statusLabel}: ${resultSummary.auditText}. ${resultSummary.detail} Rollback: fixed no-mutation contract remains attached.`
        ),
        "failed",
        timestamp
      );

      setLiveActionAuditHistory((current) => appendLiveActionAuditRecord(current, record));
      return;
    }

    setDesktopActionRunnerBusyProvider(definition.provider);

    try {
      const evaluation = evaluateLiveActionRunnerExecution(
        runnerDefinition,
        request,
        timestamp,
        timestamp
      );
      const builtRequest = buildTerminalReadonlyProbeRequest(evaluation, request, timestamp);

      let result: DesktopActionRunnerExecuteResult;
      if (!builtRequest.ok) {
        result = buildDesktopActionRunnerBuildFailureResult(
          request.id,
          builtRequest.reason,
          builtRequest.message,
          timestamp
        );
      } else if (!hasDesktopRuntime()) {
        result = buildDesktopActionRunnerBrowserFallbackResult(request.id, timestamp);
      } else {
        try {
          const backendResult = await invokeDesktopCommand<DesktopActionRunnerBackendResult>(
            "live_action_runner_execute",
            { request: builtRequest.request }
          );
          result = normalizeDesktopActionRunnerBackendResult(backendResult, request.id);
        } catch (error) {
          result = {
            provider: "terminal",
            intent: "terminal-readonly-probe",
            requestId: request.id,
            status: "failed",
            code: "execution-failed",
            canExecute: false,
            summary: "Desktop terminal read-only probe failed before completion.",
            detail: error instanceof Error ? error.message : "Desktop runner command failed.",
            evaluatedAt: timestamp
          };
        }
      }

      setDesktopActionRunnerResult(result);
      const resultSummary = summarizeDesktopActionRunnerResult(result);
      const record = createLiveActionAuditRecord(
        buildLiveActionAuditInput(
          definition,
          `${resultSummary.statusLabel}: ${resultSummary.auditText}. ${resultSummary.detail} Rollback: fixed no-mutation contract remains attached.`
        ),
        result.status === "executed" ? "executed" : "failed",
        timestamp
      );

      setLiveActionAuditHistory((current) => appendLiveActionAuditRecord(current, record));
    } finally {
      setDesktopActionRunnerBusyProvider(undefined);
    }
  }

  function updateRuntimeProfileDraft(nextDraft: Partial<RuntimeProfile>) {
    setRuntimeProfileDraft((current) => ({
      ...current,
      ...nextDraft
    }));
  }

  function resetRuntimeProfileDraft() {
    setRuntimeProfileApprovalIntent("idle");
    setRuntimeProfileDraft(
      createBlankRuntimeProfile({
        adapterId: runtimeAdapter?.id ?? project.id
      })
    );
  }

  function recordRuntimeProfileApprovalAction(
    action: RuntimeProfileApprovalRecordAction,
    nextIntent: RuntimeProfileApprovalIntent
  ) {
    const record = createRuntimeProfileApprovalRecord(
      runtimeProfileApprovalSnapshot,
      action,
      new Date().toISOString()
    );

    setRuntimeProfileApprovalHistory((current) => appendRuntimeProfileApprovalRecord(current, record));
    setRuntimeProfileApprovalIntent(nextIntent);
  }

  function activateRuntimeProfileDraft() {
    if (!canActivateDraftProfile) {
      return;
    }

    setRuntimeProfileActivation(
      createRuntimeProfileActivationRecord(
        runtimeProfileDraft,
        runtimeProfileDraftReadiness,
        new Date().toISOString()
      )
    );
    setRuntimeProfileApprovalIntent("idle");
  }

  function recordRuntimeProfilePermissionRequestAction(
    action: RuntimeProfilePermissionRequestAction,
    nextIntent: RuntimeProfilePermissionRequestIntent
  ) {
    const record = createRuntimeProfilePermissionRequestRecord(
      runtimeProfilePermissionHandoffSnapshot,
      action,
      new Date().toISOString()
    );

    setRuntimeProfilePermissionRequestHistory((current) =>
      appendRuntimeProfilePermissionRequestRecord(current, record)
    );
    setRuntimeProfilePermissionRequestIntent(nextIntent);
  }

  return (
    <aside className="right-panel" aria-label="Environment">
      <header>
        <div>
          <span className="eyebrow">Environment</span>
          <h3>{project.name}</h3>
        </div>
        <button aria-label="Collapse environment panel" title="Panel" type="button">
          <PanelRight size={17} />
        </button>
      </header>

      <CockpitMonitorStrip
        attention={cockpitMonitorAttention}
        controls={cockpitMonitorControlState}
        depth={cockpitMonitorDepth}
        health={cockpitMonitorHealth}
        loop={cockpitMonitorLoop}
        nextEventPreview={cockpitMonitorNextEventPreview}
        quality={cockpitMonitorQuality}
        recentEventFeed={recentEventFeed}
        onAttach={() => updateBridgeIntent("attached")}
        onPause={() => updateStreamPlayback("paused")}
        onReset={() => updateStreamPlayback("idle", 0)}
        onStart={() => updateStreamPlayback("streaming")}
        summary={cockpitMonitorSummary}
      />

      <section className="panel-section">
        <h4>Progress</h4>
        <div className="metric-grid">
          <div>
            <strong>{sessions.length}</strong>
            <span>Panels</span>
          </div>
          <div>
            <strong>{complete}</strong>
            <span>Done</span>
          </div>
          <div>
            <strong>{blocked}</strong>
            <span>Blocked</span>
          </div>
        </div>
      </section>

      <PanelPrioritySignal
        focusTarget={panelFocusTarget}
        onClearFocus={() => onFocusPanel(undefined)}
        onFocus={() => onFocusPanel(panelFocusTarget.panelId)}
        priority={panelPriority}
      />

      <MilestoneStatusPanel
        milestones={steerboardMilestoneStatuses}
        summary={milestoneStatusSummary}
      />

      <RemainingGoalsPanel
        goals={remainingGoalPriorityQueue}
        summary={remainingGoalSummary}
      />

      <ProviderIntegrationReadinessPanel
        catalogDepth={phase4ProviderCatalogDepth}
        executionGate={providerExecutionGate}
        readiness={providerIntegrationReadiness}
      />

      <Phase4ProviderSurfaceDepthPanel
        approvalValidation={phase4ProviderApprovalValidation}
        auditRecord={phase4ProviderAuditRecord}
        auditValidation={phase4ProviderAuditValidation}
        onClearApproval={onClearPhase4ProviderApproval}
        onClearAudit={onClearPhase4ProviderAudit}
        onClearPermission={onClearPhase4ProviderPermission}
        onClearRollback={onClearPhase4ProviderRollback}
        onExportReviewArtifact={onExportPhase4ProviderReviewArtifact}
        onLoadRecordedReviewArtifact={onLoadRecordedPhase4ProviderReviewArtifact}
        onRecordApproval={onRecordPhase4ProviderApproval}
        onRecordAudit={onRecordPhase4ProviderAudit}
        onRecordPermission={onRecordPhase4ProviderPermission}
        onRecordRollback={onRecordPhase4ProviderRollback}
        recordApprovalEnabled={phase4ProviderApprovalRecordEnabled}
        recordAuditEnabled={phase4ProviderAuditRecordEnabled}
        recordPermissionEnabled={phase4ProviderPermissionRecordEnabled}
        recordRollbackEnabled={phase4ProviderRollbackRecordEnabled}
        onVerifyImportedReviewArtifact={onVerifyImportedPhase4ProviderReviewArtifact}
        importedReviewArtifactVerification={importedPhase4ProviderReviewArtifactVerification}
        permissionRecord={phase4ProviderPermissionRecord}
        permissionValidation={phase4ProviderPermissionValidation}
        record={phase4ProviderApprovalRecord}
        recordedArtifactLoadAvailable={phase4RecordedArtifactLoadAvailable}
        reviewArtifactVerification={phase4ProviderReviewArtifactVerification}
        rollbackRecord={phase4ProviderRollbackRecord}
        rollbackValidation={phase4ProviderRollbackValidation}
        snapshot={phase4ProviderSurfaceDepth}
      />

      <Phase4ProviderTraceabilityPanel summary={phase4ProviderTraceability} />

      <Phase4ProviderBlockerPriorityPanel summary={phase4ProviderBlockerPriority} />

      <Phase4ProviderCompletionStatusPanel status={phase4ProviderCompletionStatus} />

      <OwnerTestingReadinessPanel
        catalogRefreshOwnerValidation={catalogRefreshOwnerValidation}
        checklist={ownerTestingChecklist}
        failureFixtures={failureStateFixtures}
        failureSummary={failureStateFixtureSummary}
        phasePriorityEvidence={phasePriorityEvidence}
        phase3ClearanceBlockerPriority={phase3ClearanceBlockerPriority}
        phase3ClearanceCompletionStatus={phase3ClearanceCompletionStatus}
        phase3ClearanceTraceability={phase3ClearanceTraceability}
        phase3ClearanceTraceabilityPrecondition={phase3ClearanceTraceabilityPrecondition}
        phase3ClearanceCommandPlan={phase3ClearanceCommandPlan}
        phase3ClearancePackage={phase3ClearancePackage}
        phase3ExitGateEvidence={phase3ExitGateEvidence}
        phase3HandoffGate={phase3HandoffGate}
        phase3CommandValidationRecord={phase3CommandValidationRecord}
        phase3CommandValidationRecordValidation={phase3CommandValidationRecordValidation}
        phase3OwnerHandoffRecord={phase3OwnerHandoffRecord}
        importedPhase3ProofExportVerification={importedPhase3ProofExportVerification}
        phase3ProofExportVerification={phase3ProofExportVerification}
        phase3OwnerTestingActions={phase3OwnerTestingActions}
        phase3SmokeProofReadiness={phase3SmokeProofReadiness}
        phase3RecordedArtifactLoadAvailable={phase3RecordedArtifactLoadAvailable}
        onExportPhase3ProofArtifact={onExportPhase3ProofArtifact}
        onVerifyImportedPhase3ProofArtifact={onVerifyImportedPhase3ProofArtifact}
        onRecordPhase3CommandValidation={onRecordPhase3CommandValidation}
        onImportPhase3CommandValidation={onImportPhase3CommandValidation}
        onImportPhase3SmokeProofBundle={onImportPhase3SmokeProofBundle}
        onLoadRecordedPhase3CommandValidation={onLoadRecordedPhase3CommandValidation}
        onLoadRecordedPhase3SmokeProofBundle={onLoadRecordedPhase3SmokeProofBundle}
        onLoadRecordedPhase3ProofArtifacts={onLoadRecordedPhase3ProofArtifacts}
        onClearPhase3CommandValidation={onClearPhase3CommandValidation}
        onRecordPhase3OwnerHandoff={onRecordPhase3OwnerHandoff}
        onClearPhase3OwnerHandoff={onClearPhase3OwnerHandoff}
        onRunCodexActiveTurnControlSmokeProof={onRunCodexActiveTurnControlSmokeProof}
        onRunCodexActiveTurnSteerSmokeProof={onRunCodexActiveTurnSteerSmokeProof}
        onRunCodexLiveSmokeProof={onRunCodexLiveSmokeProof}
        onRunCodexLiveControlSmokeProof={onRunCodexLiveControlSmokeProof}
        onRunCodexTwoPanelSmokeProof={onRunCodexTwoPanelSmokeProof}
        codexCanStartSession={codexCanStartSession}
        codexLiveSmokeLoading={codexLiveSmokeLoading}
        codexTwoPanelSmokeLoading={codexTwoPanelSmokeLoading}
        sessionControlReadinessEvidence={sessionControlReadinessEvidence}
        slashCommandExecutionEvidence={slashCommandExecutionEvidence}
      />

      <Phase11OwnerCommandCenterPanel
        evidenceRecords={phase11EvidenceRecords}
        proofFreshnessDepth={phase11ProofFreshnessDepth}
        projectManagementTasks={projectManagementTasks}
        releaseReadiness={phase11ReleaseReadiness}
        snapshot={phase11OwnerCommandCenter}
      />

      <Phase11ProofFreshnessDepthPanel snapshot={phase11ProofFreshnessDepth} />

      <Phase11EvidenceRecordsPanel
        onClearRecord={onClearPhase11EvidenceRecord}
        onExportSignedAuditArtifact={exportPhase11SignedAuditArtifact}
        onImportRecords={onImportPhase11EvidenceRecords}
        onRecord={onRecordPhase11Evidence}
        signedAuditExportVerification={phase11SignedAuditExportArtifactVerification}
        snapshot={phase11EvidenceRecords}
      />

      <Phase11ReleaseReadinessPanel snapshot={phase11ReleaseReadiness} />

      <Phase10ArenaPolishPanel snapshot={phase10ArenaPolish} />

      <section className="panel-section">
        <h4>Mode</h4>
        <div
          aria-label={modeHandoff.ariaLabel}
          className={classNames("mode-handoff", `mode-handoff-${modeHandoff.tone}`)}
          title={modeHandoff.detail}
        >
          <div className="mode-handoff-route">
            <span>
              <Workflow size={14} />
              {modeHandoff.currentModeLabel}
            </span>
            <b aria-hidden="true">to</b>
            <span>{modeHandoff.nextModeLabel}</span>
          </div>
          <p>{modeHandoff.detail}</p>
          <dl className="mode-handoff-metrics">
            <div>
              <dt>Current</dt>
              <dd>{modeHandoff.currentLayoutLabel}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{modeHandoff.nextLayoutLabel}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd title={modeHandoff.preservedLabel}>{modeHandoff.preservedLabel}</dd>
            </div>
          </dl>
        </div>
        <div
          aria-label={modeHandoffQa.ariaLabel}
          className={classNames("mode-handoff-qa", `mode-handoff-qa-${modeHandoffQa.tone}`)}
          title={modeHandoffQa.detail}
        >
          <div className="mode-handoff-qa-header">
            <strong>{modeHandoffQa.label}</strong>
            <b>{modeHandoffQa.checkLabel}</b>
          </div>
          <p>{modeHandoffQa.detail}</p>
          <div className="mode-handoff-qa-checks" aria-label="Mode handoff QA checks">
            {modeHandoffQa.checks.map((check) => (
              <span
                className={classNames("mode-handoff-qa-check", `mode-handoff-qa-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={interactionReadiness.ariaLabel}
          className={classNames("interaction-readiness", `interaction-readiness-${interactionReadiness.tone}`)}
          title={interactionReadiness.detail}
        >
          <div className="interaction-readiness-header">
            <strong>{interactionReadiness.label}</strong>
            <b>{interactionReadiness.checkLabel}</b>
          </div>
          <p>{interactionReadiness.detail}</p>
          <div className="interaction-readiness-checks" aria-label="Arena interaction readiness checks">
            {interactionReadiness.checks.map((check) => (
              <span
                className={classNames("interaction-readiness-check", `interaction-readiness-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={cockpitAcceptancePass.ariaLabel}
          className={classNames("cockpit-acceptance", `cockpit-acceptance-${cockpitAcceptancePass.tone}`)}
          title={cockpitAcceptancePass.detail}
        >
          <div className="cockpit-acceptance-header">
            <strong>{cockpitAcceptancePass.label}</strong>
            <b>{cockpitAcceptancePass.checkLabel}</b>
          </div>
          <p>{cockpitAcceptancePass.detail}</p>
          <div className="cockpit-acceptance-checks" aria-label="Arena final acceptance gates">
            {cockpitAcceptancePass.checks.map((check) => (
              <span
                className={classNames("cockpit-acceptance-check", `cockpit-acceptance-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h4>Orchestration</h4>
        <div className="orchestration-summary">
          <span>
            <strong>{taskSummary.total}</strong>
            Tasks
          </span>
          <span>
            <strong>{taskSummary.accepted}</strong>
            Accepted
          </span>
          <span>
            <strong>{taskSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        <div
          aria-label={orchestrationDependencyReadiness.ariaLabel}
          className={classNames(
            "orchestration-readiness",
            `orchestration-readiness-${orchestrationDependencyReadiness.tone}`
          )}
          title={orchestrationDependencyReadiness.detail}
        >
          <div className="orchestration-readiness-header">
            <strong>{orchestrationDependencyReadiness.label}</strong>
            <b>{orchestrationDependencyReadiness.checkLabel}</b>
          </div>
          <p>{orchestrationDependencyReadiness.detail}</p>
          <div className="orchestration-readiness-checks" aria-label="Orchestration dependency readiness checks">
            {orchestrationDependencyReadiness.checks.map((check) => (
              <span
                className={classNames("orchestration-readiness-check", `orchestration-readiness-check-${check.tone}`)}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationDispatchAudit.ariaLabel}
          className={classNames(
            "orchestration-dispatch-audit",
            `orchestration-dispatch-audit-${orchestrationDispatchAudit.tone}`
          )}
          title={orchestrationDispatchAudit.detail}
        >
          <div className="orchestration-dispatch-audit-header">
            <strong>{orchestrationDispatchAudit.label}</strong>
            <b>{orchestrationDispatchAudit.checkLabel}</b>
          </div>
          <p>{orchestrationDispatchAudit.detail}</p>
          <div
            className="orchestration-dispatch-audit-checks"
            aria-label="Orchestration dispatch audit checks"
          >
            {orchestrationDispatchAudit.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-dispatch-audit-check",
                  `orchestration-dispatch-audit-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationResultHandoffEvidence.ariaLabel}
          className={classNames(
            "orchestration-result-handoff",
            `orchestration-result-handoff-${orchestrationResultHandoffEvidence.tone}`
          )}
          title={orchestrationResultHandoffEvidence.detail}
        >
          <div className="orchestration-result-handoff-header">
            <strong>{orchestrationResultHandoffEvidence.label}</strong>
            <b>{orchestrationResultHandoffEvidence.checkLabel}</b>
          </div>
          <p>{orchestrationResultHandoffEvidence.detail}</p>
          <div
            className="orchestration-result-handoff-checks"
            aria-label="Orchestration result handoff evidence checks"
          >
            {orchestrationResultHandoffEvidence.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-result-handoff-check",
                  `orchestration-result-handoff-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
        <div
          aria-label={orchestrationAcceptanceCoverage.ariaLabel}
          className={classNames(
            "orchestration-acceptance-coverage",
            `orchestration-acceptance-coverage-${orchestrationAcceptanceCoverage.tone}`
          )}
          title={orchestrationAcceptanceCoverage.detail}
        >
          <div className="orchestration-acceptance-coverage-header">
            <strong>{orchestrationAcceptanceCoverage.label}</strong>
            <b>{orchestrationAcceptanceCoverage.checkLabel}</b>
          </div>
          <p>{orchestrationAcceptanceCoverage.detail}</p>
          <div
            className="orchestration-acceptance-coverage-checks"
            aria-label="Orchestration acceptance coverage checks"
          >
            {orchestrationAcceptanceCoverage.checks.map((check) => (
              <span
                className={classNames(
                  "orchestration-acceptance-coverage-check",
                  `orchestration-acceptance-coverage-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h4>Local Runs</h4>
        <div className="registry-detail">
          <span>
            <strong>{runSummary.total}</strong>
            Local staged runs
          </span>
          <span>
            <strong>{latestRun?.status ?? "none"}</strong>
            Latest status
          </span>
          <span>
            <strong>{runSummary.countsByStatus.queued + runSummary.countsByStatus.running}</strong>
            Open runs
          </span>
        </div>

        {mockRuns.length > 0 ? (
          <>
            <div className="run-history-list" aria-label="Local staged run history">
              {mockRuns.slice(0, 4).map((run) => (
                <button
                  aria-pressed={selectedRun?.id === run.id}
                  className={classNames("run-history-button", selectedRun?.id === run.id && "is-selected")}
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  type="button"
                >
                  <span>
                    <strong title={run.title}>{run.title}</strong>
                    <small>{formatShortDate(run.createdAt)}</small>
                  </span>
                  <span className={classNames("run-status", `run-${run.status}`)}>{run.status}</span>
                </button>
              ))}
            </div>

            {selectedRun ? (
              <>
                <div className="run-control-grid" aria-label="Selected local run lifecycle controls">
                  {runLifecycleActions.map((action) => (
                    <button
                      aria-label={`${action.label} selected local run`}
                      className={classNames(
                        "run-control-button",
                        `control-${action.status}`,
                        selectedRun.status === action.status && "is-active"
                      )}
                      disabled={selectedRun.status === action.status}
                      key={action.status}
                      onClick={() => onUpdateRunStatus(selectedRun.id, action.status)}
                      title={`${action.label} run`}
                      type="button"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>

                <dl className="run-detail" aria-label="Selected local run detail">
                  <div>
                    <dt>Source package</dt>
                    <dd title={selectedRun.sourcePackageId}>{selectedRun.sourcePackageId}</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{selectedRun.tasks.length}</dd>
                  </div>
                  <div>
                    <dt>Panels</dt>
                    <dd>{selectedRun.sessions.length}</dd>
                  </div>
                  <div>
                    <dt>Validation gates</dt>
                    <dd>{selectedRun.validationGates.length}</dd>
                  </div>
                </dl>

                {selectedDispatchReviewRecord ? (
                  <section className="selected-dispatch-review" aria-label="Selected run dispatch review record">
                    <DispatchReviewRecordCard record={selectedDispatchReviewRecord} run={selectedRun} />
                  </section>
                ) : (
                  <section className="selected-dispatch-review" aria-label="Selected run dispatch review record">
                    <p className="empty-preview">
                      No dispatch review record is linked to this run yet. Stage a PM row or pipeline item to create a local review trace before live worker spawning.
                    </p>
                  </section>
                )}

                <section className="worker-handoff-monitor" aria-label="Selected run worker handoff loop">
                  <div className="worker-handoff-header">
                    <div>
                      <span className="eyebrow">Worker Handoff</span>
                      <strong>{selectedRunHandoffBrief?.title ?? "No scoped task"}</strong>
                    </div>
                    <span className={classNames("task-status", selectedRunHandoffTask && `task-${selectedRunHandoffTask.status}`)}>
                      {selectedRunHandoffTask?.status ?? "idle"}
                    </span>
                  </div>
                  <div className="worker-handoff-summary" aria-label="Selected run worker summary">
                    <span>
                      <strong>{workerHandoffSummary.totalWorkerTasks}</strong>
                      Workers
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.implementerCount}</strong>
                      Implement
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.validatorCount}</strong>
                      Validate
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.integrationCount}</strong>
                      Integrate
                    </span>
                  </div>
                  <div className="worker-handoff-summary" aria-label="Selected run handoff state">
                    <span>
                      <strong>{workerHandoffSummary.maxAttempts}</strong>
                      Max attempts
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.readyCount}</strong>
                      Ready
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.acceptedCount}</strong>
                      Accepted
                    </span>
                    <span>
                      <strong>{workerHandoffSummary.blockedCount}</strong>
                      Blocked
                    </span>
                  </div>
                  <div className="worker-validation-card" aria-label="Selected validation worker attempt">
                    <div>
                      <strong title={nextValidationTask?.title}>{nextValidationTask?.title ?? "No validation worker"}</strong>
                      <small>
                        {nextValidationTask
                          ? `Attempt ${nextValidationTask.attempt}/${nextValidationTask.attemptLimit}`
                          : "No validation task staged"}
                      </small>
                    </div>
                    <div className="worker-validation-actions">
                      <button
                        aria-label="Mark selected validation worker attempt passed"
                        disabled={!canRecordValidationAttempt || !nextValidationTask}
                        onClick={() => {
                          if (nextValidationTask) {
                            onRecordWorkerValidationAttempt(selectedRun.id, nextValidationTask.id, "pass");
                          }
                        }}
                        type="button"
                      >
                        Pass
                      </button>
                      <button
                        aria-label="Mark selected validation worker attempt failed"
                        disabled={!canRecordValidationAttempt || !nextValidationTask}
                        onClick={() => {
                          if (nextValidationTask) {
                            onRecordWorkerValidationAttempt(selectedRun.id, nextValidationTask.id, "fail");
                          }
                        }}
                        type="button"
                      >
                        Fail
                      </button>
                    </div>
                  </div>
                  <p title={selectedRunHandoffBrief?.markdown}>
                    {selectedRunHandoffBrief
                      ? `Next: ${selectedRunHandoffBrief.title}`
                      : "No selected run task is ready for handoff."}
                  </p>
                </section>

                <section className="run-timeline" aria-label="Selected local run event timeline">
                  <div className="timeline-summary" aria-label="Timeline summary">
                    <span>
                      <strong>{timelineSummary.activeCount}</strong>
                      Active
                    </span>
                    <span>
                      <strong>{timelineSummary.issueCount}</strong>
                      Issues
                    </span>
                    <span>
                      <strong>{timelineSummary.completeCount}</strong>
                      Done
                    </span>
                  </div>

                  <ol className="timeline-list">
                    {selectedTimeline.map((event) => (
                      <RunTimelineItem event={event} key={event.id} />
                    ))}
                  </ol>
                </section>
              </>
            ) : null}
          </>
        ) : (
          <p className="empty-preview">Stage a complete planning draft to create a local Arena run.</p>
        )}
      </section>

      <LocalEvidenceReadinessPanel evidence={localEvidenceReadinessSnapshot} />
      <ToolEvidenceReadinessPanel
        captureHistory={toolEvidenceCaptureHistory}
        captureIntent={toolEvidenceCaptureIntent}
        onCancelCapture={() => recordToolEvidenceCaptureAction("cancelled", "idle")}
        onRequestCapture={() => recordToolEvidenceCaptureAction("requested", "requested")}
        tools={toolEvidenceReadinessSnapshot}
      />
      <SecurityPrivacyThreatModelPanel
        acceptance={securityAcceptanceCoverageSnapshot}
        finalReview={securityFinalReviewSnapshot}
        model={securityPrivacyThreatModel}
        releasePrivacy={releasePrivacyReadinessSnapshot}
        repeatedRuns={securityAcceptanceRepeatedRunsSnapshot}
      />
      <Phase8PermissionAuditDepthPanel
        artifactVerification={phase8AuditReviewArtifactVerification}
        importedArtifactVerification={importedPhase8AuditReviewArtifactVerification}
        onClearAuditReview={clearPhase8AuditReview}
        onExportAuditReviewArtifact={exportPhase8AuditReviewArtifact}
        onRecordAuditReview={recordPhase8AuditReview}
        onVerifyImportedAuditReviewArtifact={verifyImportedPhase8AuditReviewArtifact}
        reviewRecord={phase8AuditReviewRecord}
        snapshot={phase8PermissionAuditDepth}
      />

      <section className="panel-section">
        <h4>Project Registry</h4>
        <div className="registry-detail">
          <span>
            <strong>{registryEntry?.workspaceLabel ?? "Unregistered workspace"}</strong>
            Workspace
          </span>
          <span>
            <strong>{registryEntry?.readiness ?? 0}%</strong>
            Registry readiness
          </span>
          <span>
            <strong>{registrySummary.byStatus.active}/{registrySummary.total}</strong>
            Active projects
          </span>
        </div>
      </section>

      <section className="panel-section">
        <h4>Runtime</h4>
        <div className="runtime-detail">
          <span className={classNames("runtime-pill", runtimeAdapter && `runtime-${runtimeAdapter.state}`)}>
            {runtimeAdapter ? runtimeStateLabel(runtimeAdapter.state) : "Missing"}
          </span>
          <span>{runtimeAdapter?.readiness ?? 0}% readiness</span>
          <span>{runtimeSummary.ready}/{runtimeSummary.total} ready</span>
        </div>
        <div
          aria-label={runtimeCoreEntryValidation.ariaLabel}
          className={classNames(
            "runtime-core-entry-validation",
            `runtime-core-entry-${runtimeCoreEntryValidation.tone}`
          )}
          title={runtimeCoreEntryValidation.detail}
        >
          <div className="runtime-core-entry-header">
            <strong>{runtimeCoreEntryValidation.label}</strong>
            <b>{runtimeCoreEntryValidation.checkLabel}</b>
          </div>
          <p>{runtimeCoreEntryValidation.detail}</p>
          <div className="runtime-core-entry-checks" aria-label="Runtime core entry validation checks">
            {runtimeCoreEntryValidation.checks.map((check) => (
              <span
                className={classNames(
                  "runtime-core-entry-check",
                  `runtime-core-entry-check-${check.tone}`
                )}
                key={check.label}
                title={`${check.label}: ${check.value}`}
              >
                <strong>{check.value}</strong>
                <small>{check.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <DesktopPackagingReadinessPanel packaging={desktopPackagingReadinessSnapshot} />

      <RuntimeProfilePanel
        activation={runtimeProfileActivationSnapshot}
        activeProfile={runtimeProfileActivation}
        approval={runtimeProfileApprovalSnapshot}
        canActivateDraft={canActivateDraftProfile}
        draft={runtimeProfileDraft}
        draftReadiness={runtimeProfileDraftReadiness}
        history={runtimeProfileApprovalHistory}
        onActivateDraftProfile={activateRuntimeProfileDraft}
        onCancelDraftApproval={() => recordRuntimeProfileApprovalAction("cancelled", "idle")}
        onClearActiveProfile={() => setRuntimeProfileActivation(undefined)}
        onDraftChange={updateRuntimeProfileDraft}
        onCancelPermissionRequest={() =>
          recordRuntimeProfilePermissionRequestAction("cancelled", "idle")
        }
        onRequestDraftApproval={() => recordRuntimeProfileApprovalAction("requested", "requested")}
        onRequestPermission={() =>
          recordRuntimeProfilePermissionRequestAction("requested", "requested")
        }
        onResetDraft={resetRuntimeProfileDraft}
        permissionApproval={runtimeProfilePermissionApprovalSnapshot}
        permissionApprovalStatus={desktopPermissionApprovalStatus}
        permissionAudit={runtimeProfilePermissionAuditSnapshot}
        permissionHandoff={runtimeProfilePermissionHandoffSnapshot}
        permissionRequestHistory={runtimeProfilePermissionRequestHistory}
        permissionRequestIntent={runtimeProfilePermissionRequestIntent}
        profile={selectedRuntimeProfile}
        readiness={selectedRuntimeProfileReadiness}
        summary={runtimeProfileSummary}
      />

      <Phase9RunnerApprovalPanel
        onClearRunnerReview={clearPhase9RunnerApprovalReview}
        onRecordRunnerReview={recordPhase9RunnerApprovalReview}
        phase8PermissionAuditDepth={phase8PermissionAuditDepth}
        reviewRecord={phase9RunnerApprovalRecord}
        snapshot={phase9RunnerApproval}
      />

      <LiveActionRiskGatePanel
        auditExportMarkdown={liveActionAuditMarkdown}
        auditHistory={liveActionAuditHistory}
        executableCount={liveActionExecutableCount}
        onApprove={(definition) =>
          recordLiveActionPermissionDecision(
            definition,
            "approve",
            "approved",
            "Approved locally; live execution remains tied to the specific action runner."
          )
        }
        onDeny={(definition) =>
          recordLiveActionPermissionDecision(
            definition,
            "deny",
            "denied",
            "Denied locally; action remains locked."
          )
        }
        onRequest={(definition) =>
          recordLiveActionPermissionDecision(
            definition,
            "request",
            "requested",
            "Permission requested locally; action remains locked until approval."
          )
        }
        onReset={(definition) =>
          recordLiveActionPermissionDecision(
            definition,
            "reset",
            "cancelled",
            "Permission state reset locally; action is locked."
          )
        }
        onTimeout={(definition) =>
          recordLiveActionPermissionDecision(
            definition,
            "timeout",
            "timed-out",
            "Permission request timed out locally; action remains locked."
          )
        }
        onRunDryRun={recordLiveActionRunnerDryRun}
        onRunDesktopProbe={recordDesktopActionRunnerProbe}
        desktopActionRunnerBusyProvider={desktopActionRunnerBusyProvider}
        desktopActionRunnerSummary={desktopActionRunnerSummary}
        phase9CanRequestDesktopProbe={phase9DesktopProbeGate.canRun}
        phase9DesktopProbeHoldReason={phase9DesktopProbeGate.holdReason}
        requestsByProvider={liveActionRequestsByProvider}
        runnerEvaluations={liveActionRunnerEvaluations}
        runnerSummary={liveActionRunnerSummary}
        summaries={liveActionPermissionSummaries}
      />

      <section className="panel-section">
        <h4>Adapter Contract</h4>
        <div className="adapter-contract-summary" aria-label="Adapter contract summary">
          <span>
            <strong>{adapterContractSummary.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{adapterContractSummary.review}</strong>
            Review
          </span>
          <span>
            <strong>{adapterContractSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        <ol className="adapter-contract-list" aria-label="Adapter contract items">
          {adapterContractItems.map((item) => (
            <AdapterContractListItem item={item} key={item.id} />
          ))}
        </ol>
      </section>

      <section className="panel-section">
        <h4>Runtime Ingestion</h4>
        <div className="ingestion-summary" aria-label="Runtime ingestion summary">
          <span>
            <strong>{runtimeIngestionSummary.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{runtimeIngestionSummary.accepted}</strong>
            Accepted
          </span>
          <span>
            <strong>{runtimeIngestionSummary.review}</strong>
            Review
          </span>
          <span>
            <strong>{runtimeIngestionSummary.blocked}</strong>
            Blocked
          </span>
        </div>
        {runtimeIngestionEvents.length > 0 ? (
          <ol className="ingestion-list" aria-label="Runtime ingestion preview">
            {runtimeIngestionEvents.map((event) => (
              <RuntimeIngestionListItem event={event} key={event.id} />
            ))}
          </ol>
        ) : (
          <p className="empty-preview">Select or stage a local run to preview adapter event ingestion.</p>
        )}
      </section>

      <section className="panel-section">
        <h4>Runtime Stream</h4>
        <RuntimeAdapterSessionStatus snapshot={runtimeAdapterSessionSnapshot} />
        <RuntimeEventSourceStatus
          approval={runtimeLaunchApprovalSnapshot}
          bridge={runtimeAdapterBridgeSnapshot}
          connection={runtimeSourceConnectionSnapshot}
          desktopBridge={desktopBridgeStatus}
          executionAudit={runtimeExecutionAuditSnapshot}
          executionAuditHistory={executionAuditHistory}
          handoffAcceptance={runtimeLaunchHandoffAcceptance}
          launchRequest={runtimeLaunchRequestSnapshot}
          onAttach={() => updateBridgeIntent("attached")}
          onCancelApproval={() => recordLaunchApprovalAction("cancelled", "idle")}
          onDetach={() => updateBridgeIntent("detached")}
          onRequestApproval={() => recordLaunchApprovalAction("requested", "requested")}
          recoveryCoverage={runtimeRecoveryFailureCoverage}
          snapshot={runtimeEventSourceSnapshot}
        />
        <div className="stream-status-row">
          <span className={classNames("stream-state", `stream-${runtimeStreamSnapshot.state}`)}>
            <span aria-hidden="true" />
            {streamStateLabels[runtimeStreamSnapshot.state]}
          </span>
          <span>
            {runtimeStreamSnapshot.emitted}/{runtimeStreamSnapshot.total} emitted
          </span>
        </div>
        <div className="stream-summary" aria-label="Runtime stream summary">
          <span>
            <strong>{runtimeStreamSnapshot.readiness}%</strong>
            Ready
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.pending}</strong>
            Pending
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.review}</strong>
            Review
          </span>
          <span>
            <strong>{runtimeStreamSnapshot.blocked}</strong>
            Blocked
          </span>
        </div>
        <div className="stream-control-grid" aria-label="Runtime stream controls">
          <button
            aria-label="Start runtime stream preview"
            disabled={!canStartStream}
            onClick={() => updateStreamPlayback("streaming")}
            title="Start stream"
            type="button"
          >
            <Play size={14} />
            <span>Start</span>
          </button>
          <button
            aria-label="Pause runtime stream preview"
            disabled={!canPauseStream}
            onClick={() => updateStreamPlayback("paused")}
            title="Pause stream"
            type="button"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>
          <button
            aria-label="Reset runtime stream preview"
            disabled={!canResetStream}
            onClick={() => updateStreamPlayback("idle", 0)}
            title="Reset stream"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
        {runtimeStreamSnapshot.latestEvent ? (
          <RuntimeStreamPreview snapshot={runtimeStreamSnapshot} />
        ) : (
          <p className="empty-preview">Start the local stream to watch projected adapter events emit here.</p>
        )}
      </section>

      <section className="panel-section">
        <h4>Local Access</h4>
        <ul className="access-list">
          {permissionSurfaces.map((surface) => (
            <PermissionItem key={surface.id} surface={surface} />
          ))}
        </ul>
      </section>

      <section className="panel-section">
        <h4>Validation</h4>
        <ol className="validation-list">
          {sessions.slice(0, 4).map((session) => (
            <li key={session.id}>
              <span className={classNames("mini-dot", `state-${session.state}`)} />
              <span>{session.validation}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}

function CockpitMonitorStrip({
  attention,
  controls,
  depth,
  health,
  loop,
  nextEventPreview,
  quality,
  recentEventFeed,
  onAttach,
  onPause,
  onReset,
  onStart,
  summary
}: {
  attention: CockpitMonitorAttention;
  controls: CockpitMonitorControlState;
  depth: CockpitMonitorDepth;
  health: CockpitMonitorHealth;
  loop: CockpitMonitorLoop;
  nextEventPreview: CockpitMonitorNextEventPreview;
  quality: CockpitMonitorQuality;
  recentEventFeed: CockpitMonitorEventFeedItem[];
  onAttach: () => void;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
  summary: CockpitMonitorSummary;
}) {
  const latestEventCue = `${summary.latestEventLabel} ${summary.latestEventStatus}`.trim();
  const latestEventDetail = `${latestEventCue}. ${summary.latestEventDetail}`;
  const hasRecentEvents = recentEventFeed.length > 0;
  const streamProgressPercent = Math.max(
    0,
    Math.min(100, Number(summary.streamProgressPercent) || 0)
  );
  const nextEventDetailAriaLabel = nextEventPreview.hasNext
    ? `Next queued local event ${nextEventPreview.sequenceLabel}: ${nextEventPreview.label}`
    : "Next queued local event: none queued";
  const depthSignalValue = depth.signalLabel.replace(/\s+signals$/i, "");
  const depthEventValue = depth.eventLabel.replace(/\s+recent$/i, "");
  const depthGateValue = depth.gateLabel.replace(/\s+gates$/i, "");

  return (
    <section className="monitor-strip" aria-label="Arena monitor summary">
      <div className="monitor-strip-header">
        <div>
          <span className="eyebrow">Monitor</span>
          <strong title={summary.runLabel}>{summary.runLabel}</strong>
        </div>
        <span className={classNames("monitor-state", `monitor-${summary.runState}`)}>
          {summary.runState}
        </span>
      </div>
      <p title={summary.detail}>{summary.detail}</p>
      <div
        className={classNames("monitor-health-row", `monitor-health-${health.tone}`)}
        title={health.detail}
      >
        <span aria-hidden="true" />
        <strong>{health.stateLabel}</strong>
        <small>{health.detail}</small>
        <b aria-label={`Stream heartbeat ${health.pulseLabel}`}>{health.pulseLabel}</b>
      </div>
      <div
        aria-label={`Operator attention: ${attention.label}`}
        className={classNames("monitor-attention-row", `monitor-attention-${attention.tone}`)}
        title={attention.detail}
      >
        <strong>{attention.label}</strong>
        <small>{attention.detail}</small>
        <b>{attention.actionLabel}</b>
      </div>
      <div
        aria-label={`Stream quality: ${quality.label}`}
        className={classNames("monitor-quality-row", `monitor-quality-${quality.tone}`)}
        title={quality.detail}
      >
        <div className="monitor-quality-copy">
          <strong>{quality.label}</strong>
          <small>{quality.detail}</small>
        </div>
        <b className="monitor-quality-readiness">{quality.readinessLabel}</b>
        <div className="monitor-quality-metrics" aria-label="Stream quality metrics">
          {quality.metrics.map((metric) => (
            <span
              className={classNames("monitor-quality-metric", `monitor-quality-metric-${metric.tone}`)}
              key={metric.label}
              title={`${metric.label}: ${metric.value}`}
            >
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
            </span>
          ))}
        </div>
      </div>
      <div
        aria-label={`Loop validation: ${loop.label}`}
        className={classNames("monitor-loop-row", `monitor-loop-${loop.tone}`)}
        title={loop.detail}
      >
        <div className="monitor-loop-copy">
          <strong>{loop.label}</strong>
          <small>{loop.detail}</small>
        </div>
        <div className="monitor-loop-metrics" aria-label="Loop validation metrics">
          <span>
            <strong>{loop.attemptLabel}</strong>
            <small>Attempt</small>
          </span>
          <span>
            <strong>{loop.gateLabel}</strong>
            <small>Gates</small>
          </span>
          <span>
            <strong>{loop.workerLabel}</strong>
            <small>Panels</small>
          </span>
        </div>
      </div>
      <div
        aria-label={`Monitoring depth: ${depth.label}, ${depth.scoreValue}`}
        className={classNames("monitor-depth-row", `monitor-depth-${depth.tone}`)}
        title={depth.detail}
      >
        <div className="monitor-depth-copy">
          <strong>{depth.label}</strong>
          <small>{depth.detail}</small>
        </div>
        <b className="monitor-depth-score">{depth.scoreValue}</b>
        <div className="monitor-depth-metrics" aria-label="Monitoring depth metrics">
          <span title={depth.signalLabel}>
            <strong>{depthSignalValue}</strong>
            <small>Signals</small>
          </span>
          <span title={depth.eventLabel}>
            <strong>{depthEventValue}</strong>
            <small>Events</small>
          </span>
          <span title={depth.gateLabel}>
            <strong>{depthGateValue}</strong>
            <small>Gates</small>
          </span>
        </div>
      </div>
      <div className="monitor-strip-grid">
        <span>
          <strong>{summary.activeCount}</strong>
          Active
        </span>
        <span>
          <strong>{summary.issueCount}</strong>
          Issues
        </span>
        <span>
          <strong>{summary.completeCount}</strong>
          Done
        </span>
        <span>
          <strong>{summary.pendingCount}</strong>
          Pending
        </span>
      </div>
      <div className="monitor-stream-row">
        <span className={classNames("stream-state", `stream-${summary.streamState}`)}>
          <span aria-hidden="true" />
          {summary.streamLabel}
        </span>
        <small>{summary.streamProgressLabel}</small>
      </div>
      <div className="monitor-stream-progress" aria-label="Arena stream progress">
        <progress
          aria-label="Arena stream progress percentage"
          className="monitor-stream-progress-bar"
          max={100}
          value={streamProgressPercent}
        />
        <span className="monitor-stream-progress-value" aria-live="polite">
          {summary.streamProgressValue}
        </span>
      </div>
      <div
        aria-label={nextEventDetailAriaLabel}
        className="monitor-next-event-preview"
        title={`${nextEventPreview.label}. ${nextEventPreview.detail}`}
      >
        <span className="monitor-next-event-seq" title={nextEventPreview.sequenceLabel}>
          {nextEventPreview.sequenceLabel}
        </span>
        <span className="monitor-next-event-label" title={nextEventPreview.label}>
          {nextEventPreview.label}
        </span>
        <span className="monitor-next-event-detail" title={nextEventPreview.detail}>
          {nextEventPreview.detail}
        </span>
      </div>
      <div className="monitor-latest-event" title={latestEventDetail}>
        <strong>Latest:</strong>
        <span>{latestEventCue}</span>
      </div>
      {hasRecentEvents ? (
        <ol className="monitor-recent-events" aria-label="Recent local events">
          {recentEventFeed.map((item) => (
            <li
              className={classNames("monitor-recent-event-row", `event-status-${item.status}`)}
              key={item.id}
              title={`${item.sequenceLabel} ${item.label}. ${item.detail}`}
            >
              <strong>{item.label}</strong>
              <span>{item.sequenceLabel}</span>
              <small>{item.detail}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="monitor-recent-empty">{`Recent local events will appear here.`}</p>
      )}
      <div className="monitor-control-row" aria-label="Arena monitor stream controls">
        <button
          aria-label="Attach Arena monitor event source"
          disabled={!controls.canAttach}
          onClick={onAttach}
          title={controls.attachReason}
          type="button"
        >
          <Link2 size={13} />
        </button>
        <button
          aria-label="Start Arena monitor stream"
          disabled={!controls.canStart}
          onClick={onStart}
          title={controls.startReason}
          type="button"
        >
          <Play size={13} />
        </button>
        <button
          aria-label="Pause Arena monitor stream"
          disabled={!controls.canPause}
          onClick={onPause}
          title={controls.pauseReason}
          type="button"
        >
          <Pause size={13} />
        </button>
        <button
          aria-label="Reset Arena monitor stream"
          disabled={!controls.canReset}
          onClick={onReset}
          title={controls.resetReason}
          type="button"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </section>
  );
}

function RuntimeProfilePanel({
  activation,
  activeProfile,
  approval,
  canActivateDraft,
  draft,
  draftReadiness,
  history,
  onActivateDraftProfile,
  onCancelDraftApproval,
  onClearActiveProfile,
  onDraftChange,
  onCancelPermissionRequest,
  onRequestDraftApproval,
  onRequestPermission,
  onResetDraft,
  permissionApproval,
  permissionApprovalStatus,
  permissionAudit,
  permissionHandoff,
  permissionRequestHistory,
  permissionRequestIntent,
  profile,
  readiness,
  summary
}: {
  activation: RuntimeProfileActivationSnapshot;
  activeProfile?: RuntimeProfileActivationSnapshot;
  approval: RuntimeProfileApprovalSnapshot;
  canActivateDraft: boolean;
  draft: RuntimeProfile;
  draftReadiness: RuntimeProfileReadiness;
  history: RuntimeProfileApprovalRecord[];
  onActivateDraftProfile: () => void;
  onCancelDraftApproval: () => void;
  onClearActiveProfile: () => void;
  onDraftChange: (nextDraft: Partial<RuntimeProfile>) => void;
  onCancelPermissionRequest: () => void;
  onRequestDraftApproval: () => void;
  onRequestPermission: () => void;
  onResetDraft: () => void;
  permissionApproval: RuntimeProfilePermissionApprovalSnapshot;
  permissionApprovalStatus: DesktopPermissionApprovalStatus;
  permissionAudit: RuntimeProfilePermissionAuditSnapshot;
  permissionHandoff: RuntimeProfilePermissionHandoffSnapshot;
  permissionRequestHistory: RuntimeProfilePermissionRequestRecord[];
  permissionRequestIntent: RuntimeProfilePermissionRequestIntent;
  profile?: RuntimeProfile;
  readiness?: RuntimeProfileReadiness;
  summary: ReturnType<typeof summarizeRuntimeProfiles>;
}) {
  const canRequestPermission =
    permissionHandoff.canRequestPermission && permissionRequestIntent !== "requested";
  const canCancelPermission = permissionRequestIntent === "requested";

  return (
    <section className="panel-section">
      <h4>Runtime Profile</h4>
      <div className="runtime-profile-summary" aria-label="Runtime profile summary">
        <span>
          <strong>{summary.readiness}%</strong>
          Ready
        </span>
        <span>
          <strong>{summary.ready}</strong>
          Ready
        </span>
        <span>
          <strong>{summary.review}</strong>
          Review
        </span>
        <span>
          <strong>{summary.blocked}</strong>
          Blocked
        </span>
      </div>

      {profile && readiness ? (
        <div className="runtime-profile-card" aria-label="Selected runtime profile">
          <div className="runtime-profile-header">
            <span className={classNames("runtime-profile-state", `runtime-profile-${readiness.state}`)}>
              <span aria-hidden="true" />
              {readiness.state}
            </span>
            <strong title={profile.label}>{profile.label}</strong>
          </div>

          <dl className="runtime-profile-grid">
            <div>
              <dt>Transport</dt>
              <dd>{profile.transport}</dd>
            </div>
            <div>
              <dt>Workspace</dt>
              <dd>{profile.workspaceMode}</dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd>{profile.capabilities.length}</dd>
            </div>
            <div>
              <dt>Permissions</dt>
              <dd>{profile.requiredPermissions.length}</dd>
            </div>
          </dl>

          {readiness.reasons.length > 0 ? (
            <ul className="runtime-profile-reasons" aria-label="Runtime profile readiness reasons">
              {readiness.reasons.slice(0, 3).map((reason) => (
                <li key={reason} title={reason}>
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="runtime-profile-ready-copy">Profile is ready for a future approval flow.</p>
          )}

          <small title={readiness.safety}>{readiness.safety}</small>
        </div>
      ) : (
        <p className="empty-preview">Add a runtime profile to review setup readiness.</p>
      )}

      <div className="runtime-profile-draft" aria-label="Editable runtime profile draft">
        <div className="runtime-profile-draft-header">
          <span className={classNames("runtime-profile-state", `runtime-profile-${draftReadiness.state}`)}>
            <span aria-hidden="true" />
            {draftReadiness.state}
          </span>
          <strong>Draft</strong>
          <button aria-label="Reset runtime profile draft" onClick={onResetDraft} title="Reset draft" type="button">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="runtime-profile-form">
          <label>
            <span>Label</span>
            <input
              aria-label="Runtime profile draft label"
              onChange={(event) => onDraftChange({ label: event.currentTarget.value })}
              value={draft.label}
            />
          </label>
          <label>
            <span>Adapter</span>
            <input
              aria-label="Runtime profile draft adapter id"
              onChange={(event) => onDraftChange({ adapterId: event.currentTarget.value })}
              value={draft.adapterId}
            />
          </label>
          <label>
            <span>Transport</span>
            <select
              aria-label="Runtime profile draft transport"
              onChange={(event) =>
                onDraftChange({ transport: event.currentTarget.value as RuntimeTransport })
              }
              value={draft.transport}
            >
              {runtimeTransportOptions.map((transport) => (
                <option key={transport} value={transport}>
                  {transport}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Workspace</span>
            <select
              aria-label="Runtime profile draft workspace mode"
              onChange={(event) =>
                onDraftChange({ workspaceMode: event.currentTarget.value as RuntimeWorkspaceMode })
              }
              value={draft.workspaceMode}
            >
              {runtimeWorkspaceModeOptions.map((workspaceMode) => (
                <option key={workspaceMode} value={workspaceMode}>
                  {workspaceMode}
                </option>
              ))}
            </select>
          </label>
          <label className="runtime-profile-form-full">
            <span>Command</span>
            <input
              aria-label="Runtime profile draft command"
              onChange={(event) => onDraftChange({ command: event.currentTarget.value })}
              value={draft.command}
            />
          </label>
          <label className="runtime-profile-form-full">
            <span>Capabilities</span>
            <input
              aria-label="Runtime profile draft capabilities"
              onChange={(event) =>
                onDraftChange({ capabilities: parseRuntimeProfileList(event.currentTarget.value) })
              }
              value={formatRuntimeProfileList(draft.capabilities)}
            />
          </label>
          <label className="runtime-profile-form-full">
            <span>Permissions</span>
            <input
              aria-label="Runtime profile draft required permissions"
              onChange={(event) =>
                onDraftChange({ requiredPermissions: parseRuntimeProfileList(event.currentTarget.value) })
              }
              value={formatRuntimeProfileList(draft.requiredPermissions)}
            />
          </label>
          <label className="runtime-profile-checkbox">
            <input
              aria-label="Enable runtime profile draft"
              checked={draft.enabled}
              onChange={(event) => onDraftChange({ enabled: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>Enabled</span>
          </label>
        </div>

        {draftReadiness.reasons.length > 0 ? (
          <ul className="runtime-profile-reasons" aria-label="Runtime profile draft readiness reasons">
            {draftReadiness.reasons.slice(0, 3).map((reason) => (
              <li key={reason} title={reason}>
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="runtime-profile-ready-copy">Draft is ready for a future approval flow.</p>
        )}

        <div className="runtime-profile-approval" aria-label="Runtime profile approval preview">
          <div className="runtime-profile-approval-header">
            <span className={classNames("runtime-profile-state", `runtime-profile-${approval.state}`)}>
              <span aria-hidden="true" />
              {approval.statusLabel}
            </span>
            <strong title={approval.label}>Approval</strong>
          </div>
          <p title={approval.detail}>{approval.detail}</p>
          <dl className="runtime-profile-approval-grid">
            <div>
              <dt>Ready</dt>
              <dd>{approval.readiness}%</dd>
            </div>
            <div>
              <dt>Intent</dt>
              <dd>{approval.intent}</dd>
            </div>
            <div>
              <dt>Activation</dt>
              <dd>{activeProfile?.state ?? activation.state}</dd>
            </div>
          </dl>
          <div className="runtime-profile-approval-actions">
            <button
              aria-label="Request runtime profile approval"
              disabled={!approval.canRequest}
              onClick={onRequestDraftApproval}
              title={approval.primaryActionLabel}
              type="button"
            >
              <ClipboardList size={14} />
              <span>{approval.primaryActionLabel}</span>
            </button>
            <button
              aria-label="Cancel runtime profile approval request"
              disabled={!approval.canCancel}
              onClick={onCancelDraftApproval}
              title="Cancel request"
              type="button"
            >
              <RotateCcw size={14} />
              <span>Cancel</span>
            </button>
            <button
              aria-label="Activate approved runtime profile draft"
              disabled={!canActivateDraft}
              onClick={onActivateDraftProfile}
              title="Set active"
              type="button"
            >
              <CheckCircle2 size={14} />
              <span>Activate</span>
            </button>
          </div>
          <small title={approval.safety}>{approval.safety}</small>
          <div className="runtime-profile-approval-history" aria-label="Runtime profile approval history">
            <div className="runtime-profile-approval-history-header">
              <strong>Recent approval records</strong>
              <span>{history.length}</span>
            </div>
            {history.length > 0 ? (
              <ol className="runtime-profile-approval-records">
                {history.slice(0, 4).map((record) => (
                  <RuntimeProfileApprovalRecordRow key={record.id} record={record} />
                ))}
              </ol>
            ) : (
              <p className="runtime-profile-approval-empty">
                Request or cancel approval to create a local record.
              </p>
            )}
          </div>
          <div className="runtime-profile-activation" aria-label="Runtime profile activation">
            <div className="runtime-profile-activation-header">
              <strong>Active profile</strong>
              <span>{activeProfile?.state ?? activation.state}</span>
            </div>
            {activeProfile ? (
              <>
                <dl className="runtime-profile-activation-grid">
                  <div>
                    <dt>Profile</dt>
                    <dd title={activeProfile.profileLabel}>{activeProfile.profileLabel}</dd>
                  </div>
                  <div>
                    <dt>Adapter</dt>
                    <dd title={activeProfile.adapterId}>{activeProfile.adapterId}</dd>
                  </div>
                  <div>
                    <dt>Transport</dt>
                    <dd>{activeProfile.transport}</dd>
                  </div>
                  <div>
                    <dt>Workspace</dt>
                    <dd>{activeProfile.workspaceMode}</dd>
                  </div>
                </dl>
                <div className="runtime-profile-activation-footer">
                  <small title={activeProfile.detail}>{activeProfile.detail}</small>
                  <button
                    aria-label="Clear active runtime profile"
                    onClick={onClearActiveProfile}
                    title="Clear active profile"
                    type="button"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </>
            ) : (
              <p title={activation.detail}>{activation.detail}</p>
            )}
            <small title={activation.safety}>{activation.safety}</small>
          </div>
          <div
            className={classNames(
              "runtime-profile-permission-handoff",
              `runtime-profile-permission-${permissionHandoff.state}`
            )}
            aria-label="Runtime profile desktop permission handoff"
          >
            <div className="runtime-profile-permission-header">
              <strong>Desktop permission</strong>
              <span>{permissionHandoff.statusLabel}</span>
            </div>
            <p title={permissionHandoff.detail}>{permissionHandoff.detail}</p>
            <dl className="runtime-profile-permission-grid">
              <div>
                <dt>Ready</dt>
                <dd>{permissionHandoff.readiness}%</dd>
              </div>
              <div>
                <dt>Bridge</dt>
                <dd>{permissionHandoff.bridgeState}</dd>
              </div>
              <div>
                <dt>Process</dt>
                <dd>{permissionHandoff.processExecutionAvailable ? "Ready" : "Locked"}</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{permissionHandoff.workspaceAccessAvailable ? "Ready" : "Locked"}</dd>
              </div>
            </dl>
            <div className="runtime-profile-permission-actions">
              <button
                aria-label="Request runtime profile desktop permission"
                disabled={!canRequestPermission}
                onClick={onRequestPermission}
                title="Request permission"
                type="button"
              >
                <ClipboardList size={14} />
                <span>{permissionRequestIntent === "requested" ? "Requested" : "Request"}</span>
              </button>
              <button
                aria-label="Cancel runtime profile desktop permission request"
                disabled={!canCancelPermission}
                onClick={onCancelPermissionRequest}
                title="Cancel permission request"
                type="button"
              >
                <RotateCcw size={14} />
                <span>Cancel</span>
              </button>
            </div>
            <div
              className="runtime-profile-permission-history"
              aria-label="Runtime profile desktop permission request history"
            >
              <div className="runtime-profile-permission-history-header">
                <strong>Recent permission records</strong>
                <span>{permissionRequestHistory.length}</span>
              </div>
              {permissionRequestHistory.length > 0 ? (
                <ol className="runtime-profile-permission-records">
                  {permissionRequestHistory.slice(0, 4).map((record) => (
                    <RuntimeProfilePermissionRequestRecordRow key={record.id} record={record} />
                  ))}
                </ol>
              ) : (
                <p className="runtime-profile-permission-empty">
                  Request or cancel permission review to create a local record.
                </p>
              )}
            </div>
            <div
              className={classNames(
                "runtime-profile-permission-approval",
                `runtime-profile-approval-${permissionApproval.state}`
              )}
              aria-label="Runtime profile desktop permission approval preview"
            >
              <div className="runtime-profile-permission-approval-header">
                <strong>Permission approval</strong>
                <span>{permissionApproval.statusLabel}</span>
              </div>
              <p title={permissionApproval.detail}>{permissionApproval.detail}</p>
              <dl className="runtime-profile-permission-approval-grid">
                <div>
                  <dt>Intent</dt>
                  <dd>{permissionApproval.intent}</dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>{permissionApproval.approvalRequired ? "Required" : "Held"}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>{permissionApproval.executionLocked ? "Locked" : "Ready"}</dd>
                </div>
              </dl>
              <small title={permissionApproval.safety}>{permissionApproval.safety}</small>
            </div>
            <div
              className={classNames(
                "runtime-profile-shell-approval",
                `runtime-profile-shell-${permissionApprovalStatus.state}`
              )}
              aria-label="Desktop permission approval shell status"
            >
              <div className="runtime-profile-shell-approval-header">
                <strong>Shell approval</strong>
                <span>{permissionApprovalStatus.state}</span>
              </div>
              <p title={permissionApprovalStatus.detail}>{permissionApprovalStatus.detail}</p>
              <dl className="runtime-profile-shell-approval-grid">
                <div>
                  <dt>Command</dt>
                  <dd>{permissionApprovalStatus.approvalCommandAvailable ? "Ready" : "Locked"}</dd>
                </div>
                <div>
                  <dt>Granted</dt>
                  <dd>{permissionApprovalStatus.permissionGranted ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{permissionApprovalStatus.source}</dd>
                </div>
              </dl>
              <small title={permissionApprovalStatus.safety}>{permissionApprovalStatus.safety}</small>
            </div>
            <div
              className={classNames(
                "runtime-profile-permission-audit",
                `runtime-profile-audit-${permissionAudit.state}`
              )}
              aria-label="Runtime profile desktop permission audit preview"
            >
              <div className="runtime-profile-permission-audit-header">
                <strong>Permission audit</strong>
                <span>{permissionAudit.statusLabel}</span>
              </div>
              <p title={permissionAudit.detail}>{permissionAudit.detail}</p>
              <dl className="runtime-profile-permission-audit-grid">
                <div>
                  <dt>Ready</dt>
                  <dd>{permissionAudit.readiness}%</dd>
                </div>
                <div>
                  <dt>Records</dt>
                  <dd>{permissionAudit.recordCount}</dd>
                </div>
                <div>
                  <dt>Export</dt>
                  <dd>{permissionAudit.canExport ? "Ready" : "Held"}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>{permissionAudit.executionLocked ? "Locked" : "Ready"}</dd>
                </div>
              </dl>
              <ol className="runtime-profile-permission-audit-items">
                {permissionAudit.items.slice(0, 4).map((item) => (
                  <li
                    className={`runtime-profile-audit-item-${item.status}`}
                    key={item.id}
                    title={item.detail}
                  >
                    <span>{item.status}</span>
                    <strong>{item.label}</strong>
                  </li>
                ))}
              </ol>
              <pre
                aria-label="Runtime profile permission audit export markdown"
                title={permissionAudit.exportMarkdown}
              >
                {permissionAudit.canExport ? permissionAudit.exportMarkdown : "No export preview yet."}
              </pre>
              <small title={permissionAudit.safety}>{permissionAudit.safety}</small>
            </div>
            <small title={permissionHandoff.safety}>{permissionHandoff.safety}</small>
          </div>
        </div>

        <small title={draftReadiness.safety}>{draftReadiness.safety}</small>
      </div>
    </section>
  );
}

function RuntimeProfilePermissionRequestRecordRow({
  record
}: {
  record: RuntimeProfilePermissionRequestRecord;
}) {
  return (
    <li className={classNames("runtime-profile-permission-record", `runtime-profile-permission-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

const liveActionRunnerNextActionLabels: Record<LiveActionRunnerNextAction, string> = {
  "run-dry-run": "Dry-run ready",
  "resolve-provider-mismatch": "Fix provider",
  "request-approval": "Request approval",
  "re-request-approval": "Re-approve",
  "resolve-denial": "Review denial",
  "review-risk-policy": "Review risk"
};

export function LiveActionRiskGatePanel({
  auditExportMarkdown,
  auditHistory,
  executableCount,
  onApprove,
  onDeny,
  onRequest,
  onReset,
  onTimeout,
  onRunDryRun,
  onRunDesktopProbe,
  desktopActionRunnerBusyProvider,
  desktopActionRunnerSummary,
  phase9CanRequestDesktopProbe,
  phase9DesktopProbeHoldReason,
  requestsByProvider,
  runnerEvaluations,
  runnerSummary,
  summaries
}: {
  auditExportMarkdown: string;
  auditHistory: LiveActionAuditRecord[];
  executableCount: number;
  onApprove: (definition: LiveActionGateDefinition) => void;
  onDeny: (definition: LiveActionGateDefinition) => void;
  onRequest: (definition: LiveActionGateDefinition) => void;
  onReset: (definition: LiveActionGateDefinition) => void;
  onTimeout: (definition: LiveActionGateDefinition) => void;
  onRunDryRun: (definition: LiveActionGateDefinition) => void;
  onRunDesktopProbe: (definition: LiveActionGateDefinition) => void;
  desktopActionRunnerBusyProvider?: string;
  desktopActionRunnerSummary: DesktopActionRunnerResultSummary;
  phase9CanRequestDesktopProbe: boolean;
  phase9DesktopProbeHoldReason: string;
  requestsByProvider: Record<string, LiveActionPermissionRequest>;
  runnerEvaluations: LiveActionRunnerExecutionResult[];
  runnerSummary: LiveActionRunnerSummary;
  summaries: LiveActionPermissionRequestSummary[];
}) {
  const summaryByProvider = new Map(summaries.map((summary) => [summary.provider, summary]));
  const runnerByProvider = new Map<string, LiveActionRunnerExecutionResult>(
    runnerEvaluations.map((runner) => [runner.provider, runner])
  );
  const requestedCount = summaries.filter((summary) => summary.state === "requested").length;
  const approvedCount = summaries.filter((summary) => summary.state === "approved").length;
  const blockedCount = summaries.filter((summary) => summary.state === "denied" || summary.state === "timed-out").length;

  return (
    <section className="panel-section">
      <h4>Risk Gates</h4>
      <div
        className={classNames(
          "live-action-gates",
          executableCount > 0 ? "live-action-gates-ready" : "live-action-gates-locked"
        )}
        aria-label="Risky live action permission gates"
      >
        <div className="live-action-gates-header">
          <span>
            <ShieldCheck size={14} />
            {executableCount > 0 ? "Approved" : "Locked"}
          </span>
          <strong>Live action approval</strong>
          <b>{executableCount}/{liveActionGateDefinitions.length}</b>
        </div>
        <p>
          Terminal, Git, MCP, plugin, automation, external service, runtime, and profile actions require visible approval before execution.
        </p>
        <dl className="live-action-gates-grid">
          <div>
            <dt>Requested</dt>
            <dd>{requestedCount}</dd>
          </div>
          <div>
            <dt>Approved</dt>
            <dd>{approvedCount}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{blockedCount}</dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>{auditHistory.length}</dd>
          </div>
        </dl>
        <div className="live-action-runner-summary" aria-label="Live action runner readiness">
          <span>
            <strong>{runnerSummary.ready}/{runnerSummary.total}</strong>
            Runner ready
          </span>
          <span>
            <strong>{runnerSummary.readiness}%</strong>
            Dry-run readiness
          </span>
          <span>
            <strong>{liveActionRunnerNextActionLabels[runnerSummary.nextAction]}</strong>
            Next runner action
          </span>
        </div>
        <div
          className={classNames(
            "live-action-desktop-runner",
            `live-action-desktop-runner-${desktopActionRunnerSummary.statusLabel.toLowerCase()}`
          )}
          aria-label="Desktop action runner result"
          title={desktopActionRunnerSummary.detail}
        >
          <span>{desktopActionRunnerSummary.statusLabel}</span>
          <strong>{desktopActionRunnerSummary.auditText}</strong>
        </div>
        <div
          className={classNames(
            "live-action-desktop-probe-gate",
            phase9CanRequestDesktopProbe
              ? "live-action-desktop-probe-gate-ready"
              : "live-action-desktop-probe-gate-held"
          )}
          aria-label={`Phase 9 desktop probe gate: ${phase9CanRequestDesktopProbe ? "Ready" : "Held"}; ${phase9DesktopProbeHoldReason}`}
          title={phase9DesktopProbeHoldReason}
        >
          <span>{phase9CanRequestDesktopProbe ? "Ready" : "Held"}</span>
          <strong>Phase 9 desktop probe gate</strong>
          <small>{phase9DesktopProbeHoldReason}</small>
        </div>
        <ol className="live-action-gate-list">
          {liveActionGateDefinitions.map((definition) => {
            const request =
              requestsByProvider[definition.provider] ??
              createLiveActionPermissionRequest(definition, "idle", "1970-01-01T00:00:00.000Z");
            const summary =
              summaryByProvider.get(definition.provider) ??
              buildLiveActionPermissionRequestSummary({
                ...request,
                detail: definition.detail,
                requestedBy: "operator"
              });
            const canExecute = canExecuteLiveAction(request);
            const runner = runnerByProvider.get(definition.provider);
            const canRequest = summary.state === "idle";
            const canReview = summary.state === "requested";
            const canReset = summary.state !== "idle";
            const canRunDesktopProbe =
              definition.provider === "terminal" &&
              Boolean(runner?.canExecute) &&
              phase9CanRequestDesktopProbe;
            const isDesktopProbeBusy = desktopActionRunnerBusyProvider === definition.provider;
            const runnerLabel =
              runner?.status === "ready"
                ? "Runner ready"
                : runner?.blockReason
                  ? `Runner ${runner.blockReason}`
                  : "Runner locked";

            return (
              <li
                className={classNames("live-action-gate-row", `live-action-gate-${summary.state}`)}
                key={definition.provider}
              >
                <div className="live-action-gate-copy">
                  <span>{summary.state}</span>
                  <strong title={summary.actionLabel}>{summary.actionLabel}</strong>
                  <small title={summary.detail}>
                    {canExecute ? "Execution path approved for this action." : summary.detail}
                  </small>
                </div>
                <div className="live-action-gate-meta">
                  <span>{summary.risk}</span>
                  <span>{canExecute ? "Execute ready" : "Locked"}</span>
                  <span title={summary.expiresAt}>Expires {summary.expiresAt === "none" ? "none" : formatShortDate(summary.expiresAt)}</span>
                  <span title={runner?.reason ?? "Runner contract has not evaluated this action yet."}>{runnerLabel}</span>
                </div>
                <div className="live-action-gate-actions">
                  <button
                    aria-label={`Request ${definition.actionLabel} approval`}
                    disabled={!canRequest}
                    onClick={() => onRequest(definition)}
                    type="button"
                  >
                    Request
                  </button>
                  <button
                    aria-label={`Approve ${definition.actionLabel}`}
                    disabled={!canReview}
                    onClick={() => onApprove(definition)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    aria-label={`Deny ${definition.actionLabel}`}
                    disabled={!canReview}
                    onClick={() => onDeny(definition)}
                    type="button"
                  >
                    Deny
                  </button>
                  <button
                    aria-label={`Timeout ${definition.actionLabel}`}
                    disabled={!canReview}
                    onClick={() => onTimeout(definition)}
                    type="button"
                  >
                    Timeout
                  </button>
                  <button
                    aria-label={`Reset ${definition.actionLabel} gate`}
                    disabled={!canReset}
                    onClick={() => onReset(definition)}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    aria-label={`Dry-run ${definition.actionLabel}`}
                    disabled={!runner?.canExecute}
                    onClick={() => onRunDryRun(definition)}
                    title={runner?.reason ?? "Runner is locked."}
                    type="button"
                  >
                    Dry run
                  </button>
                  <button
                    aria-label={`Probe ${definition.actionLabel}`}
                    disabled={!canRunDesktopProbe || isDesktopProbeBusy}
                    onClick={() => onRunDesktopProbe(definition)}
                    title={
                      definition.provider !== "terminal"
                        ? "Desktop probe is not enabled for this provider yet."
                        : phase9CanRequestDesktopProbe
                          ? "Run a fixed read-only terminal probe through the desktop runner."
                          : `Phase 9 desktop probe is held: ${phase9DesktopProbeHoldReason}`
                    }
                    type="button"
                  >
                    {isDesktopProbeBusy ? "..." : "Probe"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="live-action-audit-history" aria-label="Live action audit history">
          <div className="live-action-audit-header">
            <strong>Recent risk records</strong>
            <span>{auditHistory.length}</span>
          </div>
          {auditHistory.length > 0 ? (
            <ol>
              {auditHistory.slice(0, 4).map((record) => (
                <LiveActionAuditRecordRow key={record.id} record={record} />
              ))}
            </ol>
          ) : (
            <p>No risk records yet.</p>
          )}
          <pre title={auditExportMarkdown}>{auditExportMarkdown}</pre>
        </div>
      </div>
    </section>
  );
}

function LiveActionAuditRecordRow({ record }: { record: LiveActionAuditRecord }) {
  return (
    <li className={classNames("live-action-audit-record", `live-action-audit-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong title={record.what}>{record.action}</strong>
        <small title={record.timestamp}>{formatTimestamp(record.timestamp)}</small>
      </div>
      <b title={record.resultSummary}>{record.risk}</b>
    </li>
  );
}

function RuntimeProfileApprovalRecordRow({
  record
}: {
  record: RuntimeProfileApprovalRecord;
}) {
  return (
    <li className={classNames("runtime-profile-approval-record", `runtime-profile-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

function AdapterContractListItem({ item }: { item: AdapterContractItem }) {
  return (
    <li className={classNames("adapter-contract-item", `adapter-${item.kind}`, `adapter-${item.status}`)}>
      <span className="adapter-contract-kind">{item.kind}</span>
      <div>
        <strong title={item.detail}>{item.detail || item.label}</strong>
        <small>{item.label}</small>
      </div>
      <span className="adapter-contract-status">{item.status}</span>
    </li>
  );
}

function RuntimeIngestionListItem({ event }: { event: RuntimeIngestionEvent }) {
  return (
    <li className={classNames("ingestion-item", `ingestion-${event.eventKind}`, `ingestion-${event.adapterStatus}`)}>
      <span className="ingestion-sequence">{event.sequence + 1}</span>
      <div>
        <span className="ingestion-kicker">
          {event.eventKind} / {event.adapterStatus}
        </span>
        <strong title={event.label}>{event.label}</strong>
        <small title={`${event.detail}. ${event.reason}`}>{event.reason}</small>
      </div>
      <span className="ingestion-status">{event.adapterStatus}</span>
    </li>
  );
}

function RuntimeEventSourceStatus({
  approval,
  bridge,
  connection,
  desktopBridge,
  executionAudit,
  executionAuditHistory,
  handoffAcceptance,
  launchRequest,
  onAttach,
  onCancelApproval,
  onDetach,
  onRequestApproval,
  recoveryCoverage,
  snapshot
}: {
  approval: RuntimeLaunchApprovalSnapshot;
  bridge: RuntimeAdapterBridgeSnapshot;
  connection: RuntimeSourceConnectionSnapshot;
  desktopBridge: DesktopRuntimeBridgeStatus;
  executionAudit: RuntimeExecutionAuditSnapshot;
  executionAuditHistory: RuntimeExecutionAuditRecord[];
  handoffAcceptance: RuntimeLaunchHandoffAcceptance;
  launchRequest: RuntimeLaunchRequestSnapshot;
  onAttach: () => void;
  onCancelApproval: () => void;
  onDetach: () => void;
  onRequestApproval: () => void;
  recoveryCoverage: RuntimeRecoveryFailureCoverage;
  snapshot: RuntimeEventSourceSnapshot;
}) {
  return (
    <div className="event-source" aria-label="Runtime event source">
      <div className="event-source-header">
        <span className={classNames("event-source-state", `event-source-${snapshot.state}`)}>
          <span aria-hidden="true" />
          {snapshot.state}
        </span>
        <strong title={snapshot.label}>{snapshot.mode} source</strong>
      </div>
      <p title={snapshot.detail}>{snapshot.detail}</p>
      <dl className="event-source-grid">
        <div>
          <dt>Queued</dt>
          <dd>{snapshot.available}</dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>{snapshot.accepted}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{snapshot.review}</dd>
        </div>
        <div>
          <dt>Blocked</dt>
          <dd>{snapshot.blocked}</dd>
        </div>
      </dl>
      <small title={snapshot.nextEventLabel}>Next: {snapshot.nextEventLabel}</small>
      <div className="source-connection" aria-label="Runtime source connection">
        <div className="source-connection-header">
          <span className={classNames("source-connection-state", `source-connection-${connection.state}`)}>
            <span aria-hidden="true" />
            {connection.state}
          </span>
          <strong title={connection.detail}>{connection.canAttach ? "Attach ready" : "Attach waiting"}</strong>
        </div>
        <p title={connection.detail}>{connection.detail}</p>
        <dl className="source-connection-grid">
          <div>
            <dt>Capabilities</dt>
            <dd>
              {connection.requiredCapabilities.length - connection.missingCapabilities.length}/
              {connection.requiredCapabilities.length}
            </dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd>
              {connection.enabledPermissions}/{connection.requiredPermissions}
            </dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{connection.readiness}%</dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd title={connection.transport}>{connection.transport}</dd>
          </div>
        </dl>
      </div>
      <DesktopRuntimeBridgeStatusBlock bridge={desktopBridge} />
      <RuntimeAdapterBridgeStatus bridge={bridge} onAttach={onAttach} onDetach={onDetach} />
      <RuntimeLaunchRequestStatus
        approval={approval}
        executionAudit={executionAudit}
        executionAuditHistory={executionAuditHistory}
        launchRequest={launchRequest}
        onCancelApproval={onCancelApproval}
        onRequestApproval={onRequestApproval}
      />
      <div
        aria-label={handoffAcceptance.ariaLabel}
        className={classNames(
          "runtime-handoff-acceptance",
          `runtime-handoff-acceptance-${handoffAcceptance.tone}`
        )}
        title={handoffAcceptance.detail}
      >
        <div className="runtime-handoff-acceptance-header">
          <strong>{handoffAcceptance.label}</strong>
          <b>{handoffAcceptance.checkLabel}</b>
        </div>
        <p>{handoffAcceptance.detail}</p>
        <div
          className="runtime-handoff-acceptance-checks"
          aria-label="Runtime launch handoff acceptance checks"
        >
          {handoffAcceptance.checks.map((check) => (
            <span
              className={classNames(
                "runtime-handoff-acceptance-check",
                `runtime-handoff-acceptance-check-${check.tone}`
              )}
              key={check.label}
              title={`${check.label}: ${check.value}`}
            >
              <strong>{check.value}</strong>
              <small>{check.label}</small>
            </span>
          ))}
        </div>
      </div>
      <div
        aria-label={recoveryCoverage.ariaLabel}
        className={classNames(
          "runtime-recovery-coverage",
          `runtime-recovery-coverage-${recoveryCoverage.tone}`
        )}
        title={recoveryCoverage.detail}
      >
        <div className="runtime-recovery-coverage-header">
          <strong>{recoveryCoverage.label}</strong>
          <b>{recoveryCoverage.checkLabel}</b>
        </div>
        <p>{recoveryCoverage.detail}</p>
        <div
          className="runtime-recovery-coverage-checks"
          aria-label="Runtime adapter recovery and failure-state coverage checks"
        >
          {recoveryCoverage.checks.map((check) => (
            <span
              className={classNames(
                "runtime-recovery-coverage-check",
                `runtime-recovery-coverage-check-${check.tone}`
              )}
              key={check.label}
              title={`${check.label}: ${check.value}`}
            >
              <strong>{check.value}</strong>
              <small>{check.label}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopRuntimeBridgeStatusBlock({
  bridge
}: {
  bridge: DesktopRuntimeBridgeStatus;
}) {
  return (
    <div className="desktop-bridge" aria-label="Desktop runtime bridge status">
      <div className="desktop-bridge-header">
        <span className={classNames("desktop-bridge-state", `desktop-bridge-${bridge.state}`)}>
          <span aria-hidden="true" />
          {bridge.state}
        </span>
        <strong title={bridge.label}>{bridge.source === "desktop" ? "Desktop bridge" : "Browser preview"}</strong>
      </div>
      <p title={bridge.detail}>{bridge.detail}</p>
      <dl className="desktop-bridge-grid">
        <div>
          <dt>Process</dt>
          <dd>{bridge.processExecutionAvailable ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Workspace</dt>
          <dd>{bridge.workspaceAccessAvailable ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{bridge.source}</dd>
        </div>
      </dl>
      <small title={bridge.safety}>{bridge.safety}</small>
    </div>
  );
}

function DesktopPackagingReadinessPanel({
  packaging
}: {
  packaging: DesktopPackagingReadinessSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Desktop App</h4>
      <div
        className={classNames(
          "desktop-packaging",
          `desktop-packaging-${packaging.state}`
        )}
        aria-label="Desktop packaging readiness preview"
      >
        <div className="desktop-packaging-header">
          <span className="desktop-packaging-state">
            <span aria-hidden="true" />
            {packaging.statusLabel}
          </span>
          <strong title={packaging.label}>Package readiness</strong>
        </div>
        <p title={packaging.detail}>{packaging.detail}</p>
        <dl className="desktop-packaging-grid">
          <div>
            <dt>Ready</dt>
            <dd>{packaging.readiness}%</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{packaging.canPackage ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Lock</dt>
            <dd>{packaging.packagingLocked ? "Locked" : "Open"}</dd>
          </div>
        </dl>
        <ol className="desktop-packaging-items">
          {packaging.items.map((item) => (
            <li
              className={`desktop-packaging-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <small title={packaging.safety}>{packaging.safety}</small>
      </div>
    </section>
  );
}

function LocalEvidenceReadinessPanel({
  evidence
}: {
  evidence: LocalEvidenceReadinessSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Evidence</h4>
      <div
        className={classNames("local-evidence", `local-evidence-${evidence.state}`)}
        aria-label="Local validation evidence readiness preview"
      >
        <div className="local-evidence-header">
          <span className="local-evidence-state">
            <span aria-hidden="true" />
            {evidence.statusLabel}
          </span>
          <strong title={evidence.label}>Validation evidence</strong>
        </div>
        <p title={evidence.detail}>{evidence.detail}</p>
        <dl className="local-evidence-grid">
          <div>
            <dt>Ready</dt>
            <dd>{evidence.readiness}%</dd>
          </div>
          <div>
            <dt>Gates</dt>
            <dd>
              {evidence.passedGateCount}/{evidence.gateCount}
            </dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{evidence.evidenceCount}</dd>
          </div>
          <div>
            <dt>Finalize</dt>
            <dd>{evidence.canFinalize ? "Ready" : "Held"}</dd>
          </div>
        </dl>
        <ol className="local-evidence-items">
          {evidence.items.map((item) => (
            <li
              className={`local-evidence-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <small title={evidence.safety}>{evidence.safety}</small>
      </div>
    </section>
  );
}

function ToolEvidenceReadinessPanel({
  captureHistory,
  captureIntent,
  onCancelCapture,
  onRequestCapture,
  tools
}: {
  captureHistory: ToolEvidenceCaptureRecord[];
  captureIntent: ToolEvidenceCaptureIntent;
  onCancelCapture: () => void;
  onRequestCapture: () => void;
  tools: ToolEvidenceReadinessSnapshot;
}) {
  const canRequestCapture = captureIntent !== "requested";
  const canCancelCapture = captureIntent === "requested";

  return (
    <section className="panel-section">
      <h4>Terminal & Git</h4>
      <div
        className={classNames("tool-evidence", `tool-evidence-${tools.state}`)}
        aria-label="Terminal and Git evidence readiness preview"
      >
        <div className="tool-evidence-header">
          <span className="tool-evidence-state">
            <span aria-hidden="true" />
            {tools.statusLabel}
          </span>
          <strong title={tools.label}>Capture readiness</strong>
        </div>
        <p title={tools.detail}>{tools.detail}</p>
        <dl className="tool-evidence-grid">
          <div>
            <dt>Ready</dt>
            <dd>{tools.readiness}%</dd>
          </div>
          <div>
            <dt>Terminal</dt>
            <dd>{tools.terminalLocked ? "Locked" : "Ready"}</dd>
          </div>
          <div>
            <dt>Git</dt>
            <dd>{tools.gitLocked ? "Locked" : "Ready"}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{tools.canCapture ? "Ready" : "Held"}</dd>
          </div>
        </dl>
        <ol className="tool-evidence-items">
          {tools.items.map((item) => (
            <li
              className={`tool-evidence-item-${item.status}`}
              key={item.id}
              title={item.detail}
            >
              <span>{item.status}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
        <div className="tool-evidence-actions">
          <button
            aria-label="Request terminal and Git evidence capture"
            disabled={!canRequestCapture}
            onClick={onRequestCapture}
            title="Request capture preview"
            type="button"
          >
            <ClipboardList size={14} />
            <span>{captureIntent === "requested" ? "Requested" : "Request"}</span>
          </button>
          <button
            aria-label="Cancel terminal and Git evidence capture request"
            disabled={!canCancelCapture}
            onClick={onCancelCapture}
            title="Cancel capture request"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Cancel</span>
          </button>
        </div>
        <div className="tool-evidence-history" aria-label="Terminal and Git evidence capture history">
          <div className="tool-evidence-history-header">
            <strong>Recent capture records</strong>
            <span>{captureHistory.length}</span>
          </div>
          {captureHistory.length > 0 ? (
            <ol className="tool-evidence-records">
              {captureHistory.slice(0, 4).map((record) => (
                <ToolEvidenceCaptureRecordRow key={record.id} record={record} />
              ))}
            </ol>
          ) : (
            <p className="tool-evidence-empty">
              Request or cancel capture review to create a local record.
            </p>
          )}
        </div>
        <small title={tools.safety}>{tools.safety}</small>
      </div>
    </section>
  );
}

function phase3ProofExportHandoffSummary(
  verification: Phase3ProofExportVerification
): string {
  return [
    `Expected fingerprint ${verification.handoffEvidenceFingerprint ?? "missing"}`,
    `Record fingerprint ${verification.ownerHandoffRecordFingerprint ?? "missing"}`,
    `Handoff snapshot ${verification.ownerHandoffClearanceReadiness ?? 0}% / ${
      verification.ownerHandoffExactBlockerCount ?? 0
    } open`
  ].join(" | ");
}

export function OwnerTestingReadinessPanel({
  catalogRefreshOwnerValidation,
  checklist,
  failureFixtures,
  failureSummary,
  phasePriorityEvidence,
  phase3ClearanceBlockerPriority,
  phase3ClearanceCompletionStatus,
  phase3ClearanceTraceability,
  phase3ClearanceTraceabilityPrecondition,
  phase3ClearanceCommandPlan,
  phase3ClearancePackage,
  phase3ExitGateEvidence,
  phase3HandoffGate,
  phase3CommandValidationRecord,
  phase3CommandValidationRecordValidation,
  phase3OwnerHandoffRecord,
  importedPhase3ProofExportVerification,
  phase3ProofExportVerification,
  phase3OwnerTestingActions,
  phase3SmokeProofReadiness,
  phase3RecordedArtifactLoadAvailable,
  onExportPhase3ProofArtifact,
  onVerifyImportedPhase3ProofArtifact,
  onRecordPhase3CommandValidation,
  onClearPhase3CommandValidation,
  onImportPhase3CommandValidation,
  onImportPhase3SmokeProofBundle,
  onLoadRecordedPhase3CommandValidation,
  onLoadRecordedPhase3SmokeProofBundle,
  onLoadRecordedPhase3ProofArtifacts,
  onRecordPhase3OwnerHandoff,
  onClearPhase3OwnerHandoff,
  onRunCodexActiveTurnControlSmokeProof,
  onRunCodexActiveTurnSteerSmokeProof,
  onRunCodexLiveSmokeProof,
  onRunCodexLiveControlSmokeProof,
  onRunCodexTwoPanelSmokeProof,
  codexCanStartSession,
  codexLiveSmokeLoading,
  codexTwoPanelSmokeLoading,
  sessionControlReadinessEvidence,
  slashCommandExecutionEvidence
}: {
  catalogRefreshOwnerValidation: CatalogRefreshOwnerValidationResult;
  checklist: OwnerTestingChecklist;
  failureFixtures: readonly FailureStateFixture[];
  failureSummary: FailureStateFixtureSummary;
  phasePriorityEvidence: PhasePriorityEvidenceResult;
  phase3ClearanceBlockerPriority: Phase3ClearanceBlockerPrioritySnapshot;
  phase3ClearanceCompletionStatus: Phase3ClearanceCompletionStatus;
  phase3ClearanceTraceability: Phase3ClearanceTraceabilitySnapshot;
  phase3ClearanceTraceabilityPrecondition: Phase3ClearanceTraceabilityPrecondition;
  phase3ClearanceCommandPlan: Phase3ClearanceCommandPlan;
  phase3ClearancePackage: Phase3ClearancePackage;
  phase3ExitGateEvidence: Phase3ExitGateEvidence;
  phase3HandoffGate: Phase3HandoffGate;
  phase3CommandValidationRecord?: Phase3CommandValidationRecord;
  phase3CommandValidationRecordValidation: Phase3CommandValidationRecordValidation;
  phase3OwnerHandoffRecord?: Phase3OwnerHandoffRecord;
  importedPhase3ProofExportVerification?: Phase3ProofExportVerification;
  phase3ProofExportVerification: Phase3ProofExportVerification;
  phase3OwnerTestingActions: readonly Phase3OwnerTestingAction[];
  phase3SmokeProofReadiness: Phase3SmokeProofReadinessResult;
  phase3RecordedArtifactLoadAvailable: boolean;
  onExportPhase3ProofArtifact: () => void;
  onVerifyImportedPhase3ProofArtifact: (serializedArtifact: string) => void;
  onRecordPhase3CommandValidation: () => void;
  onImportPhase3CommandValidation: (serializedRecord: string) => void;
  onImportPhase3SmokeProofBundle: (serializedBundle: string) => void;
  onLoadRecordedPhase3CommandValidation: () => void;
  onLoadRecordedPhase3SmokeProofBundle: () => void;
  onLoadRecordedPhase3ProofArtifacts: () => void;
  onClearPhase3CommandValidation: () => void;
  onRecordPhase3OwnerHandoff: () => void;
  onClearPhase3OwnerHandoff: () => void;
  onRunCodexActiveTurnControlSmokeProof: () => void;
  onRunCodexActiveTurnSteerSmokeProof: () => void;
  onRunCodexLiveSmokeProof: () => void;
  onRunCodexLiveControlSmokeProof: () => void;
  onRunCodexTwoPanelSmokeProof: () => void;
  codexCanStartSession: boolean;
  codexLiveSmokeLoading: boolean;
  codexTwoPanelSmokeLoading: boolean;
  sessionControlReadinessEvidence: SessionControlReadinessEvidence;
  slashCommandExecutionEvidence: SlashCommandExecutionEvidence;
}) {
  const phase3CommandValidationImportInputRef = useRef<HTMLInputElement | null>(null);
  const phase3ProofExportImportInputRef = useRef<HTMLInputElement | null>(null);
  const phase3SmokeProofBundleImportInputRef = useRef<HTMLInputElement | null>(null);
  const visibleChecklistItems = checklist.items.slice(0, 6);
  const catalogRefreshItems = checklist.items.filter((item) => item.id.startsWith("catalog-"));
  const visibleFailureFixtures = failureFixtures.slice(0, 4);
  const phase3OwnerHandoffRecordGateMessage =
    phase3ClearancePackage.canExit &&
    phase3ClearanceTraceabilityPrecondition.canTrustTrace &&
    phase3CommandValidationRecordValidation.state === "ready" &&
    canRecordPhase3OwnerHandoffWithProofExport(phase3ProofExportVerification)
      ? "Record owner-reviewed Phase 3 handoff locally."
      : phase3ClearancePackage.canExit &&
          phase3ClearanceTraceabilityPrecondition.canTrustTrace &&
          phase3CommandValidationRecordValidation.state === "ready"
        ? phase3ProofExportVerification.nextAction
        : phase3ClearancePackage.canExit && phase3ClearanceTraceabilityPrecondition.canTrustTrace
        ? phase3CommandValidationRecordValidation.nextAction
        : phase3ClearancePackage.canExit
          ? phase3ClearanceTraceabilityPrecondition.nextAction
        : phase3ClearancePackage.nextAction;
  const handlePhase3CommandValidationImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onImportPhase3CommandValidation(await file.text());
    },
    [onImportPhase3CommandValidation]
  );
  const handlePhase3SmokeProofBundleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onImportPhase3SmokeProofBundle(await file.text());
    },
    [onImportPhase3SmokeProofBundle]
  );
  const handlePhase3ProofExportImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onVerifyImportedPhase3ProofArtifact(await file.text());
    },
    [onVerifyImportedPhase3ProofArtifact]
  );
  const phase126PublishHoldTraceability = buildPhase126PublishHoldTraceability({
    phasePriorityEvidence
  });
  const phase126PublishHoldBlockerPriority = buildPhase126PublishHoldBlockerPriority({
    phasePriorityEvidence,
    traceability: phase126PublishHoldTraceability
  });
  const phase126PublishHoldCloseoutStatus = buildPhase126PublishHoldCloseoutStatus({
    phasePriorityEvidence,
    traceability: phase126PublishHoldTraceability,
    blockerPriority: phase126PublishHoldBlockerPriority
  });
  const phase126PublishExecutionGate = buildPhase126PublishExecutionGate({
    closeoutStatus: phase126PublishHoldCloseoutStatus
  });
  const phase6PmBoardEvidence = phasePriorityEvidence.items.find((item) => item.id === "phase-6-pm-board");
  const handleReviewPhase6PmBoard = () => {
    const target =
      document.querySelector('[data-testid="pm-run-parent-phase-06-parent-phase-board"]') ??
      document.querySelector('[data-testid="pm-run-epic-phase-06-planning-lane"]');

    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: "center", inline: "nearest" });
      target.focus();
    }
  };
  const runPhase3Action = (actionId: string) => {
    if (actionId === "phase3-owner-testing:live-control-smoke") {
      onRunCodexLiveControlSmokeProof();
      return;
    }

    if (actionId === "phase3-owner-testing:active-turn-interrupt-smoke") {
      onRunCodexActiveTurnControlSmokeProof();
      return;
    }

    if (actionId === "phase3-owner-testing:active-turn-steer-smoke") {
      onRunCodexActiveTurnSteerSmokeProof();
    }
  };

  return (
    <section className="panel-section">
      <h4>Owner Testing</h4>
      <div
        aria-label={`Owner testing readiness ${checklist.summary.statusLabel}; ${checklist.summary.readiness}% ready; ${checklist.summary.ready} ready, ${checklist.summary.review} review, ${checklist.summary.blocked} blocked, ${checklist.summary.waiting} waiting`}
        className={classNames(
          "owner-testing-readiness",
          `owner-testing-${checklist.summary.state}`
        )}
      >
        <div className="owner-testing-header">
          <span className="owner-testing-state">
            <span aria-hidden="true" />
            {checklist.summary.statusLabel}
          </span>
          <strong title={checklist.label}>Daily checklist</strong>
          <b>{checklist.summary.readiness}%</b>
        </div>
        <dl className="owner-testing-grid" aria-label="Owner testing checklist counts">
          <div>
            <dt>Ready</dt>
            <dd>{checklist.summary.ready}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>{checklist.summary.review}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{checklist.summary.blocked}</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd>{checklist.summary.waiting}</dd>
          </div>
        </dl>
        <div
          aria-label={`Phase 1 2 6 priority evidence ${phasePriorityEvidence.statusLabel}; ${phasePriorityEvidence.readiness}% ready`}
          className={classNames(
            "owner-testing-priority-evidence",
            `owner-testing-priority-${phasePriorityEvidence.state}`
          )}
          title={phasePriorityEvidence.detail}
        >
          <div className="owner-testing-priority-header">
            <span className="owner-testing-state">
              <span aria-hidden="true" />
              {phasePriorityEvidence.statusLabel}
            </span>
            <strong>Phase 1/2/6 priorities</strong>
            <b>{phasePriorityEvidence.readiness}%</b>
          </div>
          <dl
            className="owner-testing-priority-grid"
            aria-label="Phase 1 2 6 priority evidence counts"
          >
            <div>
              <dt>Ready</dt>
              <dd>{phasePriorityEvidence.counts.ready}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{phasePriorityEvidence.counts.review}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{phasePriorityEvidence.counts.blocked}</dd>
            </div>
            <div>
              <dt>Waiting</dt>
              <dd>{phasePriorityEvidence.counts.waiting}</dd>
            </div>
          </dl>
          <ol
            className="owner-testing-priority-items"
            aria-label="Phase 1 2 6 priority evidence details"
          >
            {phasePriorityEvidence.items.map((item) => (
              <li
                className={`owner-testing-priority-item-${item.state}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <strong>{item.label}</strong>
                <span>{item.state}</span>
                <small>{item.nextAction}</small>
              </li>
            ))}
          </ol>
          <div className="owner-testing-priority-actions">
            <button
              className="owner-testing-priority-action"
              disabled={!codexCanStartSession || codexLiveSmokeLoading}
              onClick={onRunCodexLiveSmokeProof}
              title="Run Phase 1 live panel smoke proof"
              type="button"
            >
              <span>{codexLiveSmokeLoading ? "Running live..." : "Run live smoke"}</span>
              <strong>Phase 1</strong>
            </button>
            <button
              className="owner-testing-priority-action"
              disabled={!codexCanStartSession || codexTwoPanelSmokeLoading}
              onClick={onRunCodexTwoPanelSmokeProof}
              title="Run Phase 2 two-panel isolation smoke proof"
              type="button"
            >
              <span>{codexTwoPanelSmokeLoading ? "Running panels..." : "Run two-panel smoke"}</span>
              <strong>Phase 2</strong>
            </button>
            <button
              className="owner-testing-priority-action"
              onClick={handleReviewPhase6PmBoard}
              title={`${phase6PmBoardEvidence?.detail ?? "Review Phase 6 PM phase board evidence."} ${phase6PmBoardEvidence?.nextAction ?? "Use row-level Run buttons to stage Arena review packages while keeping execution locked."}`}
              type="button"
            >
              <span>Review PM board</span>
              <strong>Phase 6</strong>
            </button>
          </div>
          <div
            aria-label={phase126PublishHoldTraceability.ariaLabel}
            className={classNames(
              "owner-testing-publish-hold-traceability",
              `owner-testing-publish-hold-traceability-${phase126PublishHoldTraceability.state}`
            )}
            title={phase126PublishHoldTraceability.safety}
          >
            <div className="owner-testing-publish-hold-traceability-header">
              <strong>{phase126PublishHoldTraceability.label}</strong>
              <span>{phase126PublishHoldTraceability.statusLabel}</span>
              <b>{phase126PublishHoldTraceability.readiness}%</b>
            </div>
            <dl
              className="owner-testing-publish-hold-traceability-grid"
              aria-label="Phase 1 2 6 publish hold traceability counts"
            >
              <div>
                <dt>Phases</dt>
                <dd>{phase126PublishHoldTraceability.linkedPhaseCount}</dd>
              </div>
              <div title={phase126PublishHoldTraceability.localHoldEvidenceKey}>
                <dt>PM</dt>
                <dd>
                  {phase126PublishHoldTraceability.linkedRequiredPmTaskCount}/
                  {phase126PublishHoldTraceability.requiredPmTaskCount}
                </dd>
              </div>
              <div title={phase126PublishHoldTraceability.localHoldEvidenceKey}>
                <dt>Proof</dt>
                <dd>
                  {phase126PublishHoldTraceability.readyPriorityEvidenceCount}/
                  {phase126PublishHoldTraceability.requiredPriorityEvidenceCount}
                </dd>
              </div>
              <div>
                <dt>Hold</dt>
                <dd>{phase126PublishHoldTraceability.publishHoldStatus}</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-publish-hold-traceability-list"
              aria-label="Phase 1 2 6 publish hold traceability rows"
            >
              {phase126PublishHoldTraceability.items.map((item) => (
                <li
                  className={`owner-testing-publish-hold-traceability-item-${item.status}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <span>{item.kind}</span>
                  <strong>{item.label}</strong>
                  <b>{item.status}</b>
                </li>
              ))}
            </ol>
          </div>
          <div
            aria-label={phase126PublishHoldBlockerPriority.ariaLabel}
            className={classNames(
              "owner-testing-publish-hold-blocker-priority",
              `owner-testing-publish-hold-blocker-priority-${phase126PublishHoldBlockerPriority.state}`
            )}
            title={phase126PublishHoldBlockerPriority.safety}
          >
            <div className="owner-testing-publish-hold-blocker-priority-header">
              <strong>{phase126PublishHoldBlockerPriority.label}</strong>
              <span>
                {phase126PublishHoldBlockerPriority.ownerReviewCanAddressTopBlocker
                  ? "Owner review"
                  : phase126PublishHoldBlockerPriority.openBlockerCount > 0
                    ? "Owner action"
                    : "Ready"}
              </span>
              <b>{phase126PublishHoldBlockerPriority.readiness}%</b>
            </div>
            <p title={phase126PublishHoldBlockerPriority.topPriorityAction}>
              {phase126PublishHoldBlockerPriority.topPriorityLabel}
            </p>
            <dl
              className="owner-testing-publish-hold-blocker-priority-grid"
              aria-label="Phase 1 2 6 publish hold blocker priority counts"
            >
              <div>
                <dt>Open</dt>
                <dd>{phase126PublishHoldBlockerPriority.openBlockerCount}</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>{phase126PublishHoldBlockerPriority.ownerReviewAddressableCount}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{phase126PublishHoldBlockerPriority.statusLabel}</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-publish-hold-blocker-priority-list"
              aria-label="Phase 1 2 6 publish hold blocker priority rows"
            >
              {phase126PublishHoldBlockerPriority.items.length > 0 ? (
                phase126PublishHoldBlockerPriority.items.slice(0, 6).map((item) => (
                  <li
                    className={`owner-testing-publish-hold-blocker-priority-item-${item.status}`}
                    key={item.id}
                    title={`${item.detail} ${item.nextAction}`}
                  >
                    <span>#{item.priority}</span>
                    <strong>{item.label}</strong>
                    <b>{item.kind}</b>
                  </li>
                ))
              ) : (
                <li className="owner-testing-publish-hold-blocker-priority-item-ready">
                  <span>OK</span>
                  <strong>No open Phase 1/2/6 publish-hold blocker</strong>
                  <b>ready</b>
                </li>
              )}
            </ol>
          </div>
          <Phase126PublishHoldCloseoutStatusPanel status={phase126PublishHoldCloseoutStatus} />
          <Phase126PublishExecutionGatePanel gate={phase126PublishExecutionGate} />
        </div>
        <div
          aria-label={`Session control readiness evidence ${sessionControlReadinessEvidence.statusLabel}; ${sessionControlReadinessEvidence.readiness}% ready`}
          className={classNames(
            "owner-testing-control-evidence",
            `owner-testing-control-${sessionControlReadinessEvidence.state}`
          )}
          title={sessionControlReadinessEvidence.safety}
        >
          <div className="owner-testing-control-header">
            <span className="owner-testing-state">
              <span aria-hidden="true" />
              {sessionControlReadinessEvidence.statusLabel}
            </span>
            <strong>Controls</strong>
            <b>{sessionControlReadinessEvidence.readiness}%</b>
          </div>
          <p title={sessionControlReadinessEvidence.detail}>
            {sessionControlReadinessEvidence.detail}
          </p>
          <dl
            className="owner-testing-control-grid"
            aria-label="Session control readiness evidence counts"
          >
            <div>
              <dt>Live</dt>
              <dd>{sessionControlReadinessEvidence.counts.live}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{sessionControlReadinessEvidence.counts.review}</dd>
            </div>
            <div>
              <dt>Unsupported</dt>
              <dd>{sessionControlReadinessEvidence.counts.unsupported}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{sessionControlReadinessEvidence.counts.blocked}</dd>
            </div>
          </dl>
          <ol
            className="owner-testing-control-states"
            aria-label="Session control state details"
          >
            {Object.entries(sessionControlReadinessEvidence.controlStates).map(
              ([control, state]) => (
                <li className={`owner-testing-control-state-${state}`} key={control}>
                  <strong>{control}</strong>
                  <span>{state}</span>
                </li>
              )
            )}
          </ol>
        </div>
        <div
          aria-label={`Slash command execution evidence ${slashCommandExecutionEvidence.status}; ${slashCommandExecutionEvidence.readiness}% ready`}
          className={classNames(
            "owner-testing-slash-execution",
            `owner-testing-slash-${slashCommandExecutionEvidence.state}`
          )}
          title={slashCommandExecutionEvidence.safety}
        >
          <div className="owner-testing-slash-header">
            <span className="owner-testing-state">
              <span aria-hidden="true" />
              {slashCommandExecutionEvidence.status}
            </span>
            <strong>Slash execution</strong>
            <b>{slashCommandExecutionEvidence.readiness}%</b>
          </div>
          <p title={slashCommandExecutionEvidence.detail}>
            {slashCommandExecutionEvidence.detail}
          </p>
          <dl
            className="owner-testing-slash-grid"
            aria-label="Slash command execution evidence counts"
          >
            <div>
              <dt>Route</dt>
              <dd>{slashCommandExecutionEvidence.route}</dd>
            </div>
            <div>
              <dt>Command</dt>
              <dd>{slashCommandExecutionEvidence.command ?? "None"}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{slashCommandExecutionEvidence.evidence.providerRoute}</dd>
            </div>
            <div>
              <dt>Live</dt>
              <dd>
                {slashCommandExecutionEvidence.evidence.live +
                  slashCommandExecutionEvidence.evidence.status}
              </dd>
            </div>
          </dl>
        </div>
        <div
          aria-label={`Phase 3 exit gate ${phase3ExitGateEvidence.statusLabel}; ${phase3ExitGateEvidence.readiness}% ready; current panel ${phase3ExitGateEvidence.currentPanelLabel}; ${phase3ExitGateEvidence.pmTaskLinkCount} PM links; ${phase3ExitGateEvidence.evidenceKeyCount} evidence keys`}
          className={classNames(
            "owner-testing-phase3-gate",
            `owner-testing-phase3-${phase3ExitGateEvidence.state}`
          )}
          title={phase3ExitGateEvidence.safety}
        >
          <div className="owner-testing-phase3-header">
            <span className="owner-testing-state">
              <span aria-hidden="true" />
              {phase3ExitGateEvidence.statusLabel}
            </span>
            <strong>Phase 3 gate</strong>
            <b>{phase3ExitGateEvidence.readiness}%</b>
          </div>
          <p title={phase3ExitGateEvidence.detail}>
            {phase3ExitGateEvidence.nextAction}
          </p>
          <div
            aria-label={`Phase 3 clearance package ${phase3ClearancePackage.statusLabel}; ${phase3ClearancePackage.readiness}% ready; ${phase3ClearancePackage.openCount} open blockers`}
            className={classNames(
              "owner-testing-phase3-clearance",
              `owner-testing-phase3-clearance-${phase3ClearancePackage.state}`
            )}
            title={phase3ClearancePackage.safety}
          >
            <div className="owner-testing-phase3-clearance-header">
              <strong>Clearance package</strong>
              <span>{phase3ClearancePackage.canExit ? "Exit ready" : "Exit held"}</span>
            </div>
            <p title={phase3ClearancePackage.detail}>{phase3ClearancePackage.detail}</p>
            <dl
              className="owner-testing-phase3-clearance-grid"
              aria-label="Phase 3 clearance package counts"
            >
              <div>
                <dt>Ready</dt>
                <dd>{phase3ClearancePackage.readyCount}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{phase3ClearancePackage.openCount}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{phase3ClearancePackage.blockerCount}</dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>{phase3ClearancePackage.primaryActionLabel ?? "Review"}</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-phase3-clearance-list"
              aria-label="Phase 3 clearance blockers"
            >
              {phase3ClearancePackage.blockers.length > 0 ? (
                phase3ClearancePackage.blockers.map((blocker) => (
                  <li
                    className={`owner-testing-phase3-clearance-item-${blocker.state}`}
                    key={blocker.id}
                    title={blocker.nextAction}
                  >
                    <strong>{blocker.label}</strong>
                    <span>{blocker.state}</span>
                    <small>{blocker.pmTaskId} / {blocker.evidenceKey}</small>
                  </li>
                ))
              ) : (
                <li className="owner-testing-phase3-clearance-item-ready">
                  <strong>Phase 3 handoff</strong>
                  <span>ready</span>
                </li>
              )}
            </ol>
            <small title={phase3ClearancePackage.nextAction}>
              {phase3ClearancePackage.nextAction}
            </small>
          </div>
          <div
            aria-label={phase3ClearanceBlockerPriority.ariaLabel}
            className={classNames(
              "owner-testing-phase3-blocker-priority",
              `owner-testing-phase3-blocker-priority-${phase3ClearanceBlockerPriority.state}`
            )}
            title={phase3ClearanceBlockerPriority.safety}
          >
            <div className="owner-testing-phase3-blocker-priority-header">
              <strong>{phase3ClearanceBlockerPriority.label}</strong>
              <span>
                {phase3ClearanceBlockerPriority.commandCanAddressTopBlocker
                  ? "Command match"
                  : phase3ClearanceBlockerPriority.openBlockerCount > 0
                    ? "Manual first"
                    : "Clear"}
              </span>
            </div>
            <p title={phase3ClearanceBlockerPriority.topPriorityAction}>
              {phase3ClearanceBlockerPriority.topPriorityLabel}
            </p>
            <small
              title={`${phase3ClearanceBlockerPriority.topPriorityPmTaskId} / ${phase3ClearanceBlockerPriority.topPriorityEvidenceKey}`}
            >
              {phase3ClearanceBlockerPriority.topPriorityEvidenceKey} /{" "}
              {phase3ClearanceBlockerPriority.commandCanAddressTopBlocker
                ? "smoke command can address"
                : phase3ClearanceBlockerPriority.openBlockerCount > 0
                  ? "manual evidence required"
                  : "handoff ready"}
            </small>
            <dl
              className="owner-testing-phase3-blocker-priority-grid"
              aria-label="Phase 3 blocker priority counts"
            >
              <div>
                <dt>Open</dt>
                <dd>{phase3ClearanceBlockerPriority.openBlockerCount}</dd>
              </div>
              <div>
                <dt>Command</dt>
                <dd>{phase3ClearanceBlockerPriority.commandAddressableCount}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{phase3ClearanceBlockerPriority.statusLabel}</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>{phase3ClearanceBlockerPriority.readiness}%</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-phase3-blocker-priority-list"
              aria-label="Phase 3 prioritized blocker queue"
            >
              {phase3ClearanceBlockerPriority.items.length > 0 ? (
                phase3ClearanceBlockerPriority.items.map((item) => (
                  <li
                    className={`owner-testing-phase3-blocker-priority-item-${item.status}`}
                    key={item.id}
                    title={`${item.detail} ${item.nextAction}`}
                  >
                    <strong>{item.priority}. {item.label}</strong>
                    <span>{item.canUseSmokeCommand ? "command" : item.severity}</span>
                    <small>{item.pmTaskId} / {item.evidenceKey}</small>
                    <small>{item.detail}</small>
                    <small>{item.nextAction}</small>
                  </li>
                ))
              ) : (
                <li className="owner-testing-phase3-blocker-priority-item-ready">
                  <strong>No open blockers</strong>
                  <span>ready</span>
                </li>
              )}
            </ol>
            <small title={phase3ClearanceBlockerPriority.safety}>
              {phase3ClearanceBlockerPriority.nextAction}
            </small>
          </div>
          <div
            aria-label={phase3ClearanceTraceability.ariaLabel}
            className={classNames(
              "owner-testing-phase3-traceability",
              `owner-testing-phase3-traceability-${phase3ClearanceTraceability.state}`
            )}
            title={phase3ClearanceTraceability.safety}
          >
            <div className="owner-testing-phase3-traceability-header">
              <strong>{phase3ClearanceTraceability.label}</strong>
              <span>{phase3ClearanceTraceability.canTrustTrace ? "Trusted" : "Open"}</span>
            </div>
            <p title={phase3ClearanceTraceability.nextAction}>
              {phase3ClearanceTraceability.linkedGoalId}
            </p>
            <dl
              className="owner-testing-phase3-traceability-grid"
              aria-label="Phase 3 clearance traceability counts"
            >
              <div>
                <dt>PM Rows</dt>
                <dd>
                  {phase3ClearanceTraceability.linkedPmTaskCount}/
                  {phase3ClearanceTraceability.requiredPmTaskCount}
                </dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{phase3ClearanceTraceability.openTraceCount}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{phase3ClearanceTraceability.statusLabel}</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>{phase3ClearanceTraceability.readiness}%</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-phase3-traceability-list"
              aria-label="Phase 3 clearance traceability rows"
            >
              {phase3ClearanceTraceability.items.map((item) => (
                <li
                  className={`owner-testing-phase3-traceability-item-${item.status}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                  {item.pmTaskId && item.evidenceKey ? (
                    <small>{item.pmTaskId} / {item.evidenceKey}</small>
                  ) : null}
                  <small>{item.detail}</small>
                  <small>{item.nextAction}</small>
                </li>
              ))}
            </ol>
            <small title={phase3ClearanceTraceability.safety}>
              {phase3ClearanceTraceability.nextAction}
            </small>
          </div>
          <div
            aria-label={phase3ClearanceCommandPlan.ariaLabel}
            className={classNames(
              "owner-testing-phase3-command-plan",
              `owner-testing-phase3-command-plan-${phase3ClearanceCommandPlan.state}`
            )}
            title={phase3ClearanceCommandPlan.safety}
          >
            <div className="owner-testing-phase3-command-plan-header">
              <strong>{phase3ClearanceCommandPlan.label}</strong>
              <span>{phase3ClearanceCommandPlan.canRunCommand ? "Runnable" : "Held"}</span>
            </div>
            <code title={phase3ClearanceCommandPlan.nextAction}>
              {phase3ClearanceCommandPlan.command}
            </code>
            <dl
              className="owner-testing-phase3-command-plan-grid"
              aria-label="Phase 3 command plan smoke counts"
            >
              <div>
                <dt>Ready</dt>
                <dd>{phase3ClearanceCommandPlan.readySmokeCount}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{phase3ClearanceCommandPlan.openSmokeCount}</dd>
              </div>
              <div>
                <dt>Covers</dt>
                <dd>{phase3ClearanceCommandPlan.coveredSmokeCount}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{phase3ClearanceCommandPlan.statusLabel}</dd>
              </div>
            </dl>
            <ol
              className="owner-testing-phase3-command-plan-list"
              aria-label="Phase 3 command plan rows"
            >
              {phase3ClearanceCommandPlan.items.map((item) => (
                <li
                  className={`owner-testing-phase3-command-plan-item-${item.state}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <strong>{item.label}</strong>
                  <span>{item.state}</span>
                </li>
              ))}
            </ol>
            <small title={phase3ClearanceCommandPlan.safety}>
              {phase3ClearanceCommandPlan.nextAction}
            </small>
            <div
              className={classNames(
                "owner-testing-phase3-command-validation",
                `owner-testing-phase3-command-validation-${phase3CommandValidationRecordValidation.state}`
              )}
              aria-label={
                phase3CommandValidationRecord
                  ? `Phase 3 CLI smoke validation ${phase3CommandValidationRecordValidation.statusLabel}; ${phase3CommandValidationRecord.passedTestCount} passed, ${phase3CommandValidationRecord.failedTestCount} failed`
                  : "Phase 3 CLI smoke validation missing"
              }
            >
              <div>
                <strong>
                  {phase3CommandValidationRecord
                    ? "CLI smoke validation recorded"
                    : "No CLI smoke validation record"}
                </strong>
                <span
                  title={
                    phase3CommandValidationRecordValidation.detail ??
                    "Run npm.cmd run smoke:phase3, then record the local pass without changing desktop proof rows."
                  }
                >
                  {phase3CommandValidationRecord
                    ? `${phase3CommandValidationRecordValidation.statusLabel}; ${formatTimestamp(
                        phase3CommandValidationRecord.createdAt
                      )}`
                    : "Desktop proof rows remain the source of exit readiness"}
                </span>
                <small
                  className="owner-testing-phase3-command-validation-note"
                  title={phase3CommandValidationRecordValidation.detail}
                >
                  {phase3CommandValidationRecordValidation.nextAction}
                </small>
              </div>
              <div
                className="owner-testing-phase3-command-validation-actions"
                aria-label="Phase 3 CLI smoke validation record actions"
              >
                <button
                  onClick={onRecordPhase3CommandValidation}
                  title="Record that the local Phase 3 CLI smoke command passed. This does not mark persisted desktop UI proof rows ready."
                  type="button"
                >
                  <CheckCircle2 size={13} />
                  <span>
                    {phase3CommandValidationRecord ? "Record again" : "Record pass"}
                  </span>
                </button>
                <button
                  onClick={() => phase3CommandValidationImportInputRef.current?.click()}
                  title="Import local_private/phase3-command-validation-record.json after running npm.cmd run smoke:phase3:record."
                  type="button"
                >
                  <Paperclip size={13} />
                  <span>Import</span>
                </button>
                <button
                  disabled={!phase3RecordedArtifactLoadAvailable}
                  onClick={onLoadRecordedPhase3CommandValidation}
                  title={
                    phase3RecordedArtifactLoadAvailable
                      ? "Load local_private/phase3-command-validation-record.json from the desktop workspace or local dev server."
                      : "Open Steerboard in desktop mode or use Import to attach this local artifact."
                  }
                  type="button"
                >
                  <Paperclip size={13} />
                  <span>Load recorded</span>
                </button>
                <button
                  disabled={!phase3RecordedArtifactLoadAvailable}
                  onClick={onLoadRecordedPhase3ProofArtifacts}
                  title={
                    phase3RecordedArtifactLoadAvailable
                      ? "Load local_private/phase3-command-validation-record.json, local_private/phase3-smoke-proof-bundle.json, and local_private/phase3-panel-evidence-record.json from the desktop workspace or local dev server."
                      : "Open Steerboard in desktop mode or use the Import buttons to attach both local Phase 3 artifacts."
                  }
                  type="button"
                >
                  <ClipboardList size={13} />
                  <span>Load proof artifacts</span>
                </button>
                <input
                  accept="application/json,.json"
                  aria-label="Import Phase 3 CLI smoke validation artifact"
                  onChange={handlePhase3CommandValidationImport}
                  ref={phase3CommandValidationImportInputRef}
                  type="file"
                />
                <button
                  disabled={!phase3CommandValidationRecord}
                  onClick={onClearPhase3CommandValidation}
                  title={
                    phase3CommandValidationRecord
                      ? "Clear the local Phase 3 CLI smoke validation record."
                      : "No local Phase 3 CLI smoke validation record is attached."
                  }
                  type="button"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
          <div
            aria-label={phase3HandoffGate.ariaLabel}
            className={classNames(
              "owner-testing-phase3-handoff",
              `owner-testing-phase3-handoff-${phase3HandoffGate.state}`
            )}
            title={phase3HandoffGate.safety}
          >
            <div className="owner-testing-phase3-handoff-header">
              <strong>{phase3HandoffGate.label}</strong>
              <span>{phase3HandoffGate.canAdvanceProviderIntegration ? "Handoff ready" : "Handoff held"}</span>
            </div>
            <p title={phase3HandoffGate.nextAction}>{phase3HandoffGate.nextAction}</p>
            <small
              className="owner-testing-phase3-handoff-summary"
              title={phase3HandoffGate.ownerReviewSummary}
            >
              {phase3HandoffGate.ownerReviewSummary}
            </small>
            <dl
              className="owner-testing-phase3-handoff-grid"
              aria-label="Phase 3 handoff gate counts"
            >
              <div>
                <dt>Ready</dt>
                <dd>{phase3HandoffGate.readyCount}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{phase3HandoffGate.exactBlockerCount}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{phase3HandoffGate.blockedCount}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{phase3HandoffGate.statusLabel}</dd>
              </div>
            </dl>
            <dl
              className="owner-testing-phase3-handoff-evidence"
              aria-label="Phase 3 handoff evidence review"
            >
              <div>
                <dt>Expected</dt>
                <dd title={phase3HandoffGate.handoffEvidenceReview.expectedFingerprint ?? "No expected fingerprint attached"}>
                  {phase3HandoffGate.handoffEvidenceReview.expectedFingerprint ?? "Missing"}
                </dd>
              </div>
              <div>
                <dt>Record</dt>
                <dd title={phase3HandoffGate.handoffEvidenceReview.recordFingerprint ?? "No record fingerprint attached"}>
                  {phase3HandoffGate.handoffEvidenceReview.recordFingerprint ?? "Missing"}
                </dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd
                  title={
                    phase3HandoffGate.handoffEvidenceReview.maxRecordAgeMs === undefined
                      ? "No handoff age window attached"
                      : `${formatPhase3HandoffAge(
                          phase3HandoffGate.handoffEvidenceReview.recordAgeMs
                        )} of ${phase3HandoffGate.handoffEvidenceReview.maxRecordAgeMs}ms window`
                  }
                >
                  {phase3HandoffGate.handoffEvidenceReview.hasFreshAgeMetadata
                    ? `Fresh ${formatPhase3HandoffAge(
                        phase3HandoffGate.handoffEvidenceReview.recordAgeMs
                      )}`
                    : formatPhase3HandoffAge(
                        phase3HandoffGate.handoffEvidenceReview.recordAgeMs
                      )}
                </dd>
              </div>
              <div>
                <dt>Snapshot</dt>
                <dd
                  title={`${phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.readyCount} ready, ${phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.exactBlockerCount} open, ${phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.reviewCount} review, ${phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.blockedCount} blocked, ${phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.waitingCount} waiting`}
                >
                  {phase3HandoffGate.handoffEvidenceReview.matchesCurrentEvidence
                    ? "Current evidence match"
                    : "Current evidence review"}{" "}
                  {phase3HandoffGate.handoffEvidenceReview.clearanceSnapshot.readiness}%
                </dd>
              </div>
            </dl>
            <div
              className="owner-testing-phase3-handoff-actions"
              aria-label="Phase 3 owner handoff record actions"
            >
              <button
                disabled={
                  !phase3ClearancePackage.canExit ||
                  !phase3ClearanceTraceabilityPrecondition.canTrustTrace ||
                  phase3CommandValidationRecordValidation.state !== "ready" ||
                  !canRecordPhase3OwnerHandoffWithProofExport(phase3ProofExportVerification)
                }
                onClick={onRecordPhase3OwnerHandoff}
                title={phase3OwnerHandoffRecordGateMessage}
                type="button"
              >
                Record handoff
              </button>
              <button
                disabled={!phase3OwnerHandoffRecord}
                onClick={onClearPhase3OwnerHandoff}
                title={
                  phase3OwnerHandoffRecord
                    ? "Clear the local Phase 3 owner handoff record."
                    : "No local Phase 3 owner handoff record is attached."
                }
                type="button"
              >
                Clear record
              </button>
              <span title={phase3OwnerHandoffRecord?.detail ?? "No local owner handoff record is attached."}>
                {phase3OwnerHandoffRecord
                  ? `Recorded ${formatTimestamp(phase3OwnerHandoffRecord.createdAt)}`
                  : "No handoff record"}
              </span>
              <small title={phase3OwnerHandoffRecordGateMessage}>
                Record gate: {phase3OwnerHandoffRecordGateMessage}
              </small>
            </div>
            <div
              className={`owner-testing-phase3-proof-export owner-testing-phase3-proof-export-${phase3ProofExportVerification.state}`}
              aria-label={`Phase 3 proof export verifier ${phase3ProofExportVerification.statusLabel}; ${phase3ProofExportVerification.readiness}% ready; PM trace ${phase3ProofExportVerification.pmTaskId} / ${phase3ProofExportVerification.evidenceKey}; next action: ${phase3ProofExportVerification.nextAction}`}
              title={phase3ProofExportVerification.detail}
            >
              <strong>Phase 3 proof export</strong>
              <span>{phase3ProofExportVerification.statusLabel}</span>
              <small>{phase3ProofExportVerification.detail}</small>
              <small>{phase3ProofExportVerification.nextAction}</small>
              <small>
                {phase3ProofExportVerification.pmTaskId} / {phase3ProofExportVerification.evidenceKey}
              </small>
              <small>
                Panel proof {phase3ProofExportVerification.readyPanelEvidenceCount}/2 | Desktop{" "}
                {phase3ProofExportVerification.storageAttestedDesktopProofCount}/3 | CLI{" "}
                {phase3ProofExportVerification.hasCommandValidationRecord ? "attached" : "missing"} | Handoff{" "}
                {phase3ProofExportVerification.hasOwnerHandoffRecord ? "attached" : "missing"}
              </small>
              <small title={phase3ProofExportHandoffSummary(phase3ProofExportVerification)}>
                {phase3ProofExportHandoffSummary(phase3ProofExportVerification)}
              </small>
              <button
                disabled={!phase3ProofExportVerification.canVerifyOffline}
                onClick={onExportPhase3ProofArtifact}
                title={
                  phase3ProofExportVerification.canVerifyOffline
                    ? "Export a Phase 3 proof package for offline owner review without running live actions."
                    : `Export held: ${phase3ProofExportVerification.nextAction}`
                }
                type="button"
              >
                <ClipboardList size={12} />
                <span>Export proof</span>
              </button>
              <button
                onClick={() => phase3ProofExportImportInputRef.current?.click()}
                title="Verify an exported Phase 3 proof artifact without changing local proof state."
                type="button"
              >
                <Paperclip size={12} />
                <span>Import proof</span>
              </button>
              <input
                accept="application/json,.json"
                aria-label="Import Phase 3 proof export artifact for verification"
                onChange={handlePhase3ProofExportImport}
                ref={phase3ProofExportImportInputRef}
                type="file"
              />
            </div>
            {importedPhase3ProofExportVerification ? (
              <div
                className={`owner-testing-phase3-proof-export owner-testing-phase3-proof-export-${importedPhase3ProofExportVerification.state}`}
                aria-label={`Imported Phase 3 proof artifact verifier ${importedPhase3ProofExportVerification.statusLabel}; ${importedPhase3ProofExportVerification.readiness}% ready; PM trace ${importedPhase3ProofExportVerification.pmTaskId} / ${importedPhase3ProofExportVerification.evidenceKey}; next action: ${importedPhase3ProofExportVerification.nextAction}`}
                title={importedPhase3ProofExportVerification.detail}
              >
                <strong>Imported proof artifact</strong>
                <span>{importedPhase3ProofExportVerification.statusLabel}</span>
                <small>{importedPhase3ProofExportVerification.detail}</small>
                <small>{importedPhase3ProofExportVerification.nextAction}</small>
                <small>
                  {importedPhase3ProofExportVerification.pmTaskId} / {importedPhase3ProofExportVerification.evidenceKey}
                </small>
                <small>
                  Panel proof {importedPhase3ProofExportVerification.readyPanelEvidenceCount}/2 | Desktop{" "}
                  {importedPhase3ProofExportVerification.storageAttestedDesktopProofCount}/3 | CLI{" "}
                  {importedPhase3ProofExportVerification.hasCommandValidationRecord ? "attached" : "missing"} | Handoff{" "}
                  {importedPhase3ProofExportVerification.hasOwnerHandoffRecord ? "attached" : "missing"}
                </small>
                <small title={phase3ProofExportHandoffSummary(importedPhase3ProofExportVerification)}>
                  {phase3ProofExportHandoffSummary(importedPhase3ProofExportVerification)}
                </small>
              </div>
            ) : null}
            <div
              className={`owner-testing-phase3-proof-export owner-testing-phase3-proof-export-${phase3ClearanceCompletionStatus.state}`}
              aria-label={phase3ClearanceCompletionStatus.ariaLabel}
              title={phase3ClearanceCompletionStatus.safety}
            >
              <strong>{phase3ClearanceCompletionStatus.label}</strong>
              <span>
                {phase3ClearanceCompletionStatus.statusLabel} / Phase 4{" "}
                {phase3ClearanceCompletionStatus.canAdvancePhase4Review ? "ready" : "held"}
              </span>
              <small>{phase3ClearanceCompletionStatus.nextAction}</small>
              <small>{phase3ClearanceCompletionStatus.phase3ClearanceCompletionStatusProof}</small>
            </div>
            <ol
              className="owner-testing-phase3-handoff-list"
              aria-label="Phase 3 handoff gate rows"
            >
              {phase3HandoffGate.items.map((item) => (
                <li
                  className={`owner-testing-phase3-handoff-item-${item.status}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                  {item.pmTaskId && item.evidenceKey ? (
                    <small>
                      {item.pmTaskId} / {item.evidenceKey}
                    </small>
                  ) : null}
                  <small>{item.detail}</small>
                  <small>{item.nextAction}</small>
                </li>
              ))}
            </ol>
            <small title={phase3HandoffGate.safety}>
              {phase3HandoffGate.safety}
            </small>
          </div>
          <dl
            className="owner-testing-phase3-grid"
            aria-label="Phase 3 exit gate counts"
          >
            <div>
              <dt>Ready</dt>
              <dd>{phase3ExitGateEvidence.counts.ready}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{phase3ExitGateEvidence.counts.review}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{phase3ExitGateEvidence.counts.blocked}</dd>
            </div>
            <div>
              <dt>Waiting</dt>
              <dd>{phase3ExitGateEvidence.counts.waiting}</dd>
            </div>
            <div>
              <dt>Panel</dt>
              <dd title={phase3ExitGateEvidence.currentPanelLabel}>
                {phase3ExitGateEvidence.currentPanelLabel}
              </dd>
            </div>
            <div>
              <dt>PM Links</dt>
              <dd>{phase3ExitGateEvidence.pmTaskLinkCount}</dd>
            </div>
            <div>
              <dt>Evidence Keys</dt>
              <dd>{phase3ExitGateEvidence.evidenceKeyCount}</dd>
            </div>
          </dl>
          <ol
            className="owner-testing-phase3-smoke-readiness"
            aria-label={`Phase 3 desktop smoke proof readiness ${phase3SmokeProofReadiness.readiness}% ready; ${phase3SmokeProofReadiness.storageAttestedCount} storage-proof attested; ${phase3SmokeProofReadiness.storageReviewCount} storage review`}
          >
            <li className={`owner-testing-phase3-smoke-${phase3SmokeProofReadiness.state}`}>
              <strong>Desktop smoke bundle</strong>
              <span>{phase3SmokeProofReadiness.state}</span>
              <small title="Current evaluation timestamp and maximum accepted desktop proof age">
                Evaluated {formatTimestamp(phase3SmokeProofReadiness.evaluatedAt)} | window{" "}
                {formatProofFreshnessWindow(phase3SmokeProofReadiness.maxProofAgeMs)}
              </small>
              <small title="Only storage-proof-attested desktop rows can satisfy Phase 3 exit readiness">
                Storage {phase3SmokeProofReadiness.storageAttestedCount}/
                {phase3SmokeProofReadiness.items.length} attested
              </small>
              <small title="Transient passed smoke runs stay in review until their desktop rows are persisted with storage proof.">
                Transient {phase3SmokeProofReadiness.storageReviewCount} review
              </small>
              <small>
                <button
                  onClick={() => phase3SmokeProofBundleImportInputRef.current?.click()}
                  title="Import local_private/phase3-smoke-proof-bundle.json after running npm.cmd run smoke:phase3:record."
                  type="button"
                >
                  <Paperclip size={12} />
                  <span>Import desktop proof</span>
                </button>
                <button
                  disabled={!phase3RecordedArtifactLoadAvailable}
                  onClick={onLoadRecordedPhase3SmokeProofBundle}
                  title={
                    phase3RecordedArtifactLoadAvailable
                      ? "Load local_private/phase3-smoke-proof-bundle.json from the desktop workspace or local dev server."
                      : "Open Steerboard in desktop mode or use Import to attach this local artifact."
                  }
                  type="button"
                >
                  <Paperclip size={12} />
                  <span>Load recorded</span>
                </button>
                <input
                  accept="application/json,.json"
                  aria-label="Import Phase 3 desktop smoke proof bundle"
                  onChange={handlePhase3SmokeProofBundleImport}
                  ref={phase3SmokeProofBundleImportInputRef}
                  type="file"
                />
              </small>
            </li>
            {phase3SmokeProofReadiness.items.map((item) => (
              <li
                className={`owner-testing-phase3-smoke-${item.state}`}
                key={item.proof}
                title={item.detail}
              >
                <strong>{item.label}</strong>
                <span>{item.state}</span>
                <small>
                  {item.source} | {item.checkedAt} |{" "}
                  {item.persisted ? "storage attested" : "storage review"}
                </small>
              </li>
            ))}
          </ol>
          <ol
            className="owner-testing-phase3-diagnostics"
            aria-label="Phase 3 exit gate diagnostics"
          >
            {phase3ExitGateEvidence.items.map((item) => (
              <li
                className={`owner-testing-phase3-diagnostic-${item.state}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <strong>{item.label}</strong>
                <span>{item.state}</span>
                <small>{item.pmTaskId} / {item.evidenceKey}</small>
                <small>{item.detail}</small>
                <small>{item.nextAction}</small>
              </li>
            ))}
          </ol>
          <div
            className="owner-testing-phase3-actions"
            aria-label="Phase 3 owner testing actions"
          >
            {phase3OwnerTestingActions.map((action) => (
              <button
                className={classNames(
                  "owner-testing-phase3-action",
                  `owner-testing-phase3-action-${action.state}`
                )}
                disabled={action.disabled}
                key={action.id}
                onClick={() => runPhase3Action(action.id)}
                title={action.detail}
                type="button"
              >
                <span>{action.label}</span>
                <strong>{action.buttonLabel}</strong>
              </button>
            ))}
          </div>
        </div>
        <div
          aria-label={`Catalog refresh owner testing ${checklist.summary.catalogRefresh.statusLabel}; ${checklist.summary.catalogRefresh.readiness}% ready`}
          className={classNames(
            "owner-testing-catalog-refresh",
            `owner-testing-catalog-${checklist.summary.catalogRefresh.state}`
          )}
        >
          <div className="owner-testing-catalog-header">
            <span className="owner-testing-state">
              <span aria-hidden="true" />
              {checklist.summary.catalogRefresh.statusLabel}
            </span>
            <strong>Catalog refreshes</strong>
            <b>{checklist.summary.catalogRefresh.readiness}%</b>
          </div>
          <p
            className="owner-testing-catalog-safety"
            title={checklist.summary.catalogRefresh.evidenceSafetyDetail}
          >
            {checklist.summary.catalogRefresh.evidenceSafetyLabel}
          </p>
          <div
            aria-label={`Catalog refresh owner validation ${catalogRefreshOwnerValidation.state}; ${catalogRefreshOwnerValidation.readiness}% ready`}
            className={classNames(
              "owner-testing-catalog-validation",
              `owner-testing-catalog-validation-${catalogRefreshOwnerValidation.state}`
            )}
            title={catalogRefreshOwnerValidation.safety}
          >
            <strong>Owner validation</strong>
            <span>{catalogRefreshOwnerValidation.readiness}%</span>
            <small>{catalogRefreshOwnerValidation.pass ? "All metadata checks passed" : "Review blocked checks"}</small>
          </div>
          <ol
            className="owner-testing-catalog-validation-list"
            aria-label="Catalog refresh metadata validation results"
          >
            {catalogRefreshOwnerValidation.surfaces.map((surface) => (
              <li
                className={`owner-testing-catalog-validation-item-${surface.state}`}
                key={surface.surface}
                title={`${surface.safety} Source: ${surface.source}. Items: ${surface.total}.`}
              >
                <strong>{surface.surface}</strong>
                <span>{surface.source}</span>
                <small>{surface.pass ? "pass" : "blocked"}</small>
              </li>
            ))}
          </ol>
          <div className="owner-testing-catalog-grid" aria-label="Catalog refresh checklist counts">
            <span>
              <strong>{checklist.summary.catalogRefresh.ready}</strong>
              Ready
            </span>
            <span>
              <strong>{checklist.summary.catalogRefresh.review}</strong>
              Review
            </span>
            <span>
              <strong>{checklist.summary.catalogRefresh.blocked}</strong>
              Blocked
            </span>
            <span>
              <strong>{checklist.summary.catalogRefresh.waiting}</strong>
              Waiting
            </span>
          </div>
          <ol className="owner-testing-catalog-list" aria-label="Catalog refresh owner test items">
            {catalogRefreshItems.map((item) => (
              <li
                className={`owner-testing-catalog-item-${item.state}`}
                key={item.id}
                title={item.checks}
              >
                <strong>{item.name}</strong>
                <span>{item.state}</span>
              </li>
            ))}
          </ol>
        </div>
        <ol className="owner-testing-list" aria-label="Owner testing checklist preview">
          {visibleChecklistItems.map((item) => (
            <li
              className={`owner-testing-item-${item.state}`}
              key={item.id}
              title={item.checks}
            >
              <span>{item.state}</span>
              <strong>{item.name}</strong>
              <small>{item.focus}</small>
            </li>
          ))}
        </ol>
        <div
          aria-label={`Failure fixture coverage ${failureSummary.statusLabel}; ${failureSummary.blocked} blocked, ${failureSummary.review} review, ${failureSummary.ready} ready`}
          className={classNames(
            "failure-fixture-coverage",
            `failure-fixture-${failureSummary.state}`
          )}
        >
          <div className="failure-fixture-header">
            <span className="failure-fixture-state">
              <span aria-hidden="true" />
              {failureSummary.statusLabel}
            </span>
            <strong>Failure fixtures</strong>
            <b>{failureSummary.total}</b>
          </div>
          <p title={failureSummary.nextAction.label}>{failureSummary.nextAction.label}</p>
          <ol className="failure-fixture-list" aria-label="Owner testing failure fixtures">
            {visibleFailureFixtures.map((fixture) => (
              <li
                className={`failure-fixture-item-${fixture.state}`}
                key={fixture.id}
                title={`${fixture.detail} ${fixture.safety}`}
              >
                <span>{fixture.severity}</span>
                <strong>{fixture.label}</strong>
                <small>{fixture.state}</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function SecurityPrivacyThreatModelPanel({
  acceptance,
  finalReview,
  model,
  releasePrivacy,
  repeatedRuns
}: {
  acceptance: SecurityAcceptanceCoverageSnapshot;
  finalReview: SecurityFinalReviewSnapshot;
  model: SecurityPrivacyThreatModel;
  releasePrivacy: ReleasePrivacyReadinessSnapshot;
  repeatedRuns: SecurityAcceptanceRepeatedRunsSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Security & Privacy</h4>
      <div
        aria-label={model.ariaLabel}
        className={classNames(
          "security-privacy-model",
          `security-privacy-${model.tone}`
        )}
      >
        <div className="security-privacy-header">
          <span className="security-privacy-state">
            <span aria-hidden="true" />
            {model.tone}
          </span>
          <strong title={model.label}>{model.label}</strong>
          <b>{model.checkLabel}</b>
        </div>
        <p title={model.detail}>{model.detail}</p>
        <ol className="security-privacy-checks">
          {model.checks.map((check) => (
            <li
              className={`security-privacy-check-${check.tone}`}
              key={check.label}
              title={check.value}
            >
              <span>{check.tone}</span>
              <strong>{check.label}</strong>
              <small>{check.value}</small>
            </li>
          ))}
        </ol>
        <div
          aria-label={releasePrivacy.ariaLabel}
          className={classNames(
            "release-privacy-readiness",
            `release-privacy-${releasePrivacy.state}`
          )}
        >
          <div className="release-privacy-header">
            <span className="release-privacy-state">
              <span aria-hidden="true" />
              {releasePrivacy.statusLabel}
            </span>
            <strong title={releasePrivacy.label}>Release privacy</strong>
            <b>{releasePrivacy.readiness}%</b>
          </div>
          <p title={releasePrivacy.detail}>{releasePrivacy.detail}</p>
          <ol className="release-privacy-items">
            {releasePrivacy.items.map((item) => (
              <li
                className={`release-privacy-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={releasePrivacy.safety}>{releasePrivacy.safety}</small>
        </div>
        <div
          aria-label={acceptance.ariaLabel}
          className={classNames(
            "security-acceptance-coverage",
            `security-acceptance-${acceptance.state}`
          )}
        >
          <div className="security-acceptance-header">
            <span className="security-acceptance-state">
              <span aria-hidden="true" />
              {acceptance.statusLabel}
            </span>
            <strong title={acceptance.label}>Security acceptance</strong>
            <b>{acceptance.readiness}%</b>
          </div>
          <p title={acceptance.detail}>{acceptance.detail}</p>
          <ol className="security-acceptance-items">
            {acceptance.items.map((item) => (
              <li
                className={`security-acceptance-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={acceptance.safety}>{acceptance.safety}</small>
        </div>
        <div
          aria-label={repeatedRuns.ariaLabel}
          className={classNames(
            "security-repeated-runs",
            `security-repeated-${repeatedRuns.state}`
          )}
        >
          <div className="security-repeated-header">
            <span className="security-repeated-state">
              <span aria-hidden="true" />
              {repeatedRuns.statusLabel}
            </span>
            <strong title={repeatedRuns.label}>Repeated evidence</strong>
            <b>{repeatedRuns.readiness}%</b>
          </div>
          <p title={repeatedRuns.detail}>{repeatedRuns.detail}</p>
          <dl className="security-repeated-grid" aria-label="Repeated security evidence counts">
            <div>
              <dt>Reviewed</dt>
              <dd>{repeatedRuns.reviewedRunCount}/{repeatedRuns.requiredRunCount}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{repeatedRuns.readyRunCount}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{repeatedRuns.reviewRunCount}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{repeatedRuns.blockedRunCount}</dd>
            </div>
          </dl>
          <ol className="security-repeated-items">
            {repeatedRuns.items.map((item) => (
              <li
                className={`security-repeated-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={repeatedRuns.safety}>{repeatedRuns.safety}</small>
        </div>
        <div
          aria-label={finalReview.ariaLabel}
          className={classNames(
            "security-final-review",
            `security-final-state-${finalReview.state}`
          )}
        >
          <div className="security-final-header">
            <span className="security-final-state">
              <span aria-hidden="true" />
              {finalReview.statusLabel}
            </span>
            <strong title={finalReview.label}>Final review</strong>
            <b>{finalReview.readiness}%</b>
          </div>
          <p title={finalReview.detail}>{finalReview.detail}</p>
          <dl className="security-final-grid" aria-label="Final security review readiness">
            <div>
              <dt>Close</dt>
              <dd>{finalReview.canCloseSecurity ? "Ready" : "Held"}</dd>
            </div>
            <div>
              <dt>Package</dt>
              <dd>{finalReview.canResumePackaging ? "Ready" : "Paused"}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{finalReview.state}</dd>
            </div>
          </dl>
          <ol className="security-final-items">
            {finalReview.items.map((item) => (
              <li
                className={`security-final-item-${item.status}`}
                key={item.id}
                title={item.detail}
              >
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ol>
          <small title={finalReview.safety}>{finalReview.safety}</small>
        </div>
      </div>
    </section>
  );
}

function Phase126PublishHoldCloseoutStatusPanel({
  status
}: {
  status: Phase126PublishHoldCloseoutStatus;
}) {
  return (
    <div
      aria-label={status.ariaLabel}
      className={classNames(
        "owner-testing-publish-hold-blocker-priority",
        `owner-testing-publish-hold-blocker-priority-${status.state}`
      )}
      title={status.safety}
    >
      <div className="owner-testing-publish-hold-blocker-priority-header">
        <strong>{status.label}</strong>
        <span>{status.statusLabel}</span>
        <b>{status.readiness}%</b>
      </div>
      <dl
        className="owner-testing-publish-hold-blocker-priority-grid"
        aria-label="Phase 1 2 6 publish hold closeout status counts"
      >
        <div>
          <dt>PM</dt>
          <dd>{status.linkedPmTaskCount}/{status.requiredPmTaskCount}</dd>
        </div>
        <div>
          <dt>Proof</dt>
          <dd>{status.readyPriorityEvidenceCount}/{status.requiredPriorityEvidenceCount}</dd>
        </div>
        <div>
          <dt>Push</dt>
          <dd>{status.pushPaused ? "Paused" : "Review"}</dd>
        </div>
      </dl>
      <small>{status.phase126PublishHoldCloseoutStatusProof}</small>
      <small title={status.nextAction}>{status.nextAction}</small>
    </div>
  );
}

function Phase126PublishExecutionGatePanel({
  gate
}: {
  gate: Phase126PublishExecutionGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "owner-testing-publish-hold-blocker-priority",
        `owner-testing-publish-hold-blocker-priority-${gate.state}`
      )}
      title={gate.safety}
    >
      <div className="owner-testing-publish-hold-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl
        className="owner-testing-publish-hold-blocker-priority-grid"
        aria-label="Phase 1 2 6 publish execution gate counts"
      >
        <div>
          <dt>Remote</dt>
          <dd>{gate.publicRemoteRestored ? "Ready" : "Missing"}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{gate.ownerPushApprovalRecorded ? "Ready" : "Missing"}</dd>
        </div>
        <div>
          <dt>Push</dt>
          <dd>{gate.canPush ? "Ready" : "Held"}</dd>
        </div>
      </dl>
      <small>{gate.phase126PublishExecutionGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

function toSecurityAcceptanceEvidenceState(
  status?: ReleasePrivacyReadinessItemStatus
): "ready" | "review" | "blocked" | undefined {
  if (status === "waiting" || status === undefined) {
    return undefined;
  }

  return status;
}

export function Phase8PermissionAuditDepthPanel({
  artifactVerification,
  importedArtifactVerification,
  onClearAuditReview,
  onExportAuditReviewArtifact,
  onRecordAuditReview,
  onVerifyImportedAuditReviewArtifact,
  reviewRecord,
  snapshot
}: {
  artifactVerification?: Phase8AuditReviewArtifactVerification;
  importedArtifactVerification?: Phase8AuditReviewArtifactVerification;
  onClearAuditReview: () => void;
  onExportAuditReviewArtifact?: () => void;
  onRecordAuditReview: () => void;
  onVerifyImportedAuditReviewArtifact?: (serializedArtifact: string) => void;
  reviewRecord?: Phase8AuditReviewRecord;
  snapshot: Phase8PermissionAuditDepthSnapshot;
}) {
  const auditReviewArtifactImportInputRef = useRef<HTMLInputElement | null>(null);
  const visibleItems = snapshot.items.slice(0, 8);
  const visibleExceptions = snapshot.exceptions.slice(0, 5);
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });
  const blockerPriority = buildPhase8RiskBlockerPriority({
    snapshot,
    traceability
  });
  const auditReviewHandoff = buildPhase8AuditReviewHandoff({
    snapshot,
    traceability,
    blockerPriority,
    artifactVerification,
    reviewRecord
  });
  const riskClosure = buildPhase8RiskClosure({
    snapshot,
    traceability,
    blockerPriority
  });
  const completionGate = buildPhase8PermissionAuditCompletionGate({
    snapshot,
    traceability,
    blockerPriority,
    auditReviewHandoff,
    artifactVerification,
    reviewRecord
  });
  const closureAuditStatus = buildPhase8ClosureAuditStatus({
    riskClosure,
    auditReviewHandoff,
    completionGate
  });
  const ownerActionHandoff = buildPhase8OwnerActionHandoff({
    riskClosure,
    blockerPriority,
    closureAuditStatus
  });
  const auditReviewBlockerHandoff = buildPhase8AuditReviewBlockerHandoff({
    riskClosure,
    blockerPriority,
    closureAuditStatus,
    ownerActionHandoff
  });
  const ownerReviewClosureReadiness = buildPhase8OwnerReviewClosureReadiness({
    riskClosure,
    auditReviewHandoff,
    auditReviewBlockerHandoff,
    completionGate
  });
  const finalCompletionHandoff = buildPhase8FinalCompletionHandoff({
    riskClosure,
    closureAuditStatus,
    ownerReviewClosureReadiness,
    completionGate
  });
  const closeoutStatus = buildPhase8CloseoutStatus({
    ownerReviewClosureReadiness,
    finalCompletionHandoff
  });
  const mutationExpansionGate = buildPhase8MutationExpansionGate(
    completionGate,
    closeoutStatus
  );
  const handleAuditReviewArtifactImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onVerifyImportedAuditReviewArtifact?.(await file.text());
    },
    [onVerifyImportedAuditReviewArtifact]
  );

  return (
    <section className="panel-section">
      <h4>Phase 8 Audit Depth</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase8-audit-depth",
          `phase8-audit-${snapshot.state}`
        )}
        title={snapshot.nextAction}
      >
        <div className="phase8-audit-header">
          <span className={classNames("phase8-audit-state", `phase8-audit-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <div
          className={classNames(
            "phase8-audit-review-record",
            reviewRecord
              ? `phase8-audit-review-record-${reviewRecord.state}`
              : "phase8-audit-review-record-missing"
          )}
          aria-label={
            reviewRecord
              ? `Phase 8 audit review record ${reviewRecord.state}; ${reviewRecord.readiness}% ready; ${reviewRecord.openExceptionCount} open exceptions`
              : "Phase 8 audit review record missing"
          }
        >
          <div>
            <strong>
              {reviewRecord
                ? "Audit review recorded"
                : "No local audit review record"}
            </strong>
            <span
              title={
                reviewRecord
                  ? `${reviewRecord.detail} ${reviewRecord.rollbackEvidence}`
                  : "Record an owner review of Phase 8 audit depth without requesting approval, exporting audit records, or unlocking mutation paths."
              }
            >
              {reviewRecord
                ? `${formatTimestamp(reviewRecord.createdAt)}; ${reviewRecord.openExceptionCount} open exceptions`
                : "Mutation paths remain locked"}
            </span>
            {reviewRecord?.topBlockerSourceId ? (
              <small title={reviewRecord.topBlockerAction ?? "No recorded blocker action."}>
                Reviewed blocker {reviewRecord.topBlockerSourceId} /{" "}
                {reviewRecord.topBlockerKind ?? "none"} /{" "}
                {reviewRecord.topBlockerStatus ?? "ready"}
              </small>
            ) : null}
          </div>
          <div
            className="phase8-audit-review-record-actions"
            aria-label="Phase 8 audit review record actions"
          >
            <button
              onClick={onRecordAuditReview}
              title="Record a local owner review of the current Phase 8 audit-depth evidence."
              type="button"
            >
              <ClipboardList size={13} />
              <span>Record review</span>
            </button>
            <button
              disabled={!reviewRecord}
              onClick={onClearAuditReview}
              title={
                reviewRecord
                  ? "Clear the local Phase 8 audit review record."
                  : "No local Phase 8 audit review record is attached."
              }
              type="button"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>
        {artifactVerification ? (
          <div
            aria-label={`Phase 8 audit review artifact verifier ${artifactVerification.statusLabel}; ${artifactVerification.readiness}% ready`}
            className={classNames(
              "phase8-audit-review-record",
              `phase8-audit-review-record-${artifactVerification.state}`
            )}
            title={artifactVerification.detail}
          >
            <div>
              <strong>Audit review artifact</strong>
              <span>
                {artifactVerification.statusLabel} / blockers{" "}
                {artifactVerification.openBlockerCount}
              </span>
              <small>
                Depth {artifactVerification.auditDepthItemCount} | Exceptions{" "}
                {artifactVerification.exceptionCount} | Keys{" "}
                {artifactVerification.evidenceKeyCount} | Mutation{" "}
                {artifactVerification.mutationLocked ? "locked" : "unlocked"}
              </small>
              <small>
                Review record {artifactVerification.hasReviewRecord ? "attached" : "missing"} |
                Open exceptions {artifactVerification.openExceptionCount}
              </small>
            </div>
            <div
              className="phase8-audit-review-record-actions"
              aria-label="Phase 8 audit review artifact actions"
            >
              <button
                onClick={onExportAuditReviewArtifact}
                title="Export Phase 8 audit review evidence without requesting approval, exporting audit records, running actions, or unlocking mutation paths."
                type="button"
              >
                <ClipboardList size={13} />
                <span>Export review</span>
              </button>
              <button
                onClick={() => auditReviewArtifactImportInputRef.current?.click()}
                title="Verify a Phase 8 audit review artifact without changing local review records."
                type="button"
              >
                <Paperclip size={13} />
                <span>Import review</span>
              </button>
              <input
                accept="application/json,.json"
                aria-label="Import Phase 8 audit review artifact for verification"
                onChange={handleAuditReviewArtifactImport}
                ref={auditReviewArtifactImportInputRef}
                type="file"
              />
            </div>
          </div>
        ) : null}
        <div
          aria-label={auditReviewHandoff.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${auditReviewHandoff.state}`
          )}
          title={auditReviewHandoff.safety}
        >
          <div>
            <strong>{auditReviewHandoff.label}</strong>
            <span>
              {auditReviewHandoff.statusLabel} / recordable{" "}
              {auditReviewHandoff.canRecordOwnerReview ? "yes" : "no"}
            </span>
            <small>{auditReviewHandoff.nextAction}</small>
            <small>{auditReviewHandoff.phase8AuditReviewHandoffProof}</small>
          </div>
        </div>
        <div
          aria-label={riskClosure.ariaLabel}
          className={classNames(
            "phase8-blocker-priority",
            `phase8-blocker-priority-${riskClosure.state}`
          )}
          title={riskClosure.safety}
        >
          <div className="phase8-blocker-priority-header">
            <strong>{riskClosure.label}</strong>
            <span>
              {riskClosure.canCloseBlockers
                ? "Closure ready"
                : `${riskClosure.openBlockerCount} open`}
            </span>
          </div>
          <dl className="phase8-blocker-priority-grid" aria-label="Phase 8 risk closure counts">
            <div>
              <dt>Audit Review</dt>
              <dd>{riskClosure.auditReviewAddressableCount}</dd>
            </div>
            <div>
              <dt>Owner Action</dt>
              <dd>{riskClosure.ownerActionBlockerCount}</dd>
            </div>
            <div>
              <dt>Exceptions</dt>
              <dd>{riskClosure.openExceptionCount}</dd>
            </div>
            <div>
              <dt>Closure</dt>
              <dd>{riskClosure.canCloseBlockers ? "Ready" : "Held"}</dd>
            </div>
          </dl>
          <p title={riskClosure.nextAction}>{riskClosure.nextAction}</p>
          <small>{riskClosure.phase8RiskClosureProof}</small>
        </div>
        {importedArtifactVerification ? (
          <div
            aria-label={`Imported Phase 8 audit review artifact verifier ${importedArtifactVerification.statusLabel}; ${importedArtifactVerification.readiness}% ready`}
            className={classNames(
              "phase8-audit-review-record",
              `phase8-audit-review-record-${importedArtifactVerification.state}`
            )}
            title={importedArtifactVerification.detail}
          >
            <div>
              <strong>Imported audit review</strong>
              <span>{importedArtifactVerification.detail}</span>
              <small>{importedArtifactVerification.nextAction}</small>
              <small>
                Review record {importedArtifactVerification.hasReviewRecord ? "attached" : "missing"} |
                Mutation {importedArtifactVerification.mutationLocked ? "locked" : "unlocked"} |
                Open exceptions {importedArtifactVerification.openExceptionCount}
              </small>
            </div>
          </div>
        ) : null}
        <dl className="phase8-audit-grid" aria-label="Phase 8 permission and audit counts">
          <div>
            <dt>Risky</dt>
            <dd>{snapshot.riskyActionCount}</dd>
          </div>
          <div>
            <dt>Records</dt>
            <dd>{snapshot.auditRecordCount}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>{snapshot.reviewCount}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{snapshot.blockedCount}</dd>
          </div>
          <div>
            <dt>Open Exceptions</dt>
            <dd>{snapshot.openExceptionCount}</dd>
          </div>
        </dl>
        <div className="phase8-traceability" aria-label={traceability.ariaLabel}>
          <div className="phase8-traceability-header">
            <strong>{traceability.label}</strong>
            <span>
              {traceability.statusLabel} / {traceability.readiness}%
            </span>
          </div>
          <ol className="phase8-traceability-list" aria-label="Phase 8 risk traceability records">
            {traceability.items.map((item) => (
              <li
                className={classNames(
                  "phase8-traceability-item",
                  `phase8-traceability-${item.status}`
                )}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>{item.status}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.nextAction}</small>
                </div>
                <b>{item.kind}</b>
              </li>
            ))}
          </ol>
        </div>
        <div
          aria-label={blockerPriority.ariaLabel}
          className={classNames(
            "phase8-blocker-priority",
            `phase8-blocker-priority-${blockerPriority.state}`
          )}
          title={blockerPriority.safety}
        >
          <div className="phase8-blocker-priority-header">
            <strong>{blockerPriority.label}</strong>
            <span>
              {blockerPriority.auditReviewCanAddressTopBlocker
                ? "Audit review"
                : blockerPriority.openBlockerCount > 0
                  ? "Owner action"
                  : "Ready"}
            </span>
          </div>
          <p title={blockerPriority.topPriorityAction}>{blockerPriority.topPriorityLabel}</p>
          <small
            className="phase8-blocker-priority-source"
            title={`${blockerPriority.topPrioritySourceId} / ${blockerPriority.topPriorityKind} / ${blockerPriority.topPriorityStatus} / ${blockerPriority.topBlockerProof}`}
          >
            {blockerPriority.topPrioritySourceId} / {blockerPriority.topPriorityKind} /{" "}
            {blockerPriority.topPriorityStatus}
          </small>
          <dl className="phase8-blocker-priority-grid" aria-label="Phase 8 blocker priority counts">
            <div>
              <dt>Open</dt>
              <dd>{blockerPriority.openBlockerCount}</dd>
            </div>
            <div>
              <dt>Reviewable</dt>
              <dd>{blockerPriority.auditReviewAddressableCount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{blockerPriority.statusLabel}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{blockerPriority.readiness}%</dd>
            </div>
          </dl>
          <ol className="phase8-blocker-priority-list" aria-label="Phase 8 blocker priority rows">
            {blockerPriority.items.length > 0 ? (
              blockerPriority.items.slice(0, 8).map((item) => (
                <li
                  className={classNames(
                    "phase8-blocker-priority-item",
                    `phase8-blocker-priority-item-${item.status}`
                  )}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <span>#{item.priority}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.nextAction}</small>
                  </div>
                  <b>{item.kind}</b>
                </li>
              ))
            ) : (
              <li className="phase8-blocker-priority-item phase8-blocker-priority-item-ready">
                <span>OK</span>
                <div>
                  <strong>No open Phase 8 blocker</strong>
                  <small>{blockerPriority.nextAction}</small>
                </div>
                <b>ready</b>
              </li>
            )}
          </ol>
        </div>
        <div
          aria-label={completionGate.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${completionGate.state}`
          )}
          title={completionGate.detail}
        >
          <div>
            <strong>Phase 8 permission audit completion gate</strong>
            <span>
              {completionGate.statusLabel} / phase{" "}
              {completionGate.phaseComplete ? "complete" : "held"}
            </span>
            <small>{completionGate.nextAction}</small>
            <small>{completionGate.completionGateProof}</small>
          </div>
        </div>
        <div
          aria-label={closureAuditStatus.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${closureAuditStatus.state}`
          )}
          title={closureAuditStatus.safety}
        >
          <div>
            <strong>{closureAuditStatus.label}</strong>
            <span>
              {closureAuditStatus.statusLabel} / blocked categories{" "}
              {closureAuditStatus.blockedCategoryCount}
            </span>
            <small>{closureAuditStatus.nextAction}</small>
            <small>{closureAuditStatus.phase8ClosureAuditStatusProof}</small>
          </div>
        </div>
        <div
          aria-label={ownerActionHandoff.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${ownerActionHandoff.state}`
          )}
          title={ownerActionHandoff.safety}
        >
          <div>
            <strong>{ownerActionHandoff.label}</strong>
            <span>
              {ownerActionHandoff.statusLabel} / owner action{" "}
              {ownerActionHandoff.ownerActionBlockerCount}
            </span>
            <small>{ownerActionHandoff.nextAction}</small>
            <small>{ownerActionHandoff.phase8OwnerActionHandoffProof}</small>
          </div>
        </div>
        <div
          aria-label={auditReviewBlockerHandoff.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${auditReviewBlockerHandoff.state}`
          )}
          title={auditReviewBlockerHandoff.safety}
        >
          <div>
            <strong>{auditReviewBlockerHandoff.label}</strong>
            <span>
              {auditReviewBlockerHandoff.statusLabel} / audit review{" "}
              {auditReviewBlockerHandoff.auditReviewBlockerCount}
            </span>
            <small>{auditReviewBlockerHandoff.nextAction}</small>
            <small>{auditReviewBlockerHandoff.phase8AuditReviewBlockerHandoffProof}</small>
          </div>
        </div>
        <div
          aria-label={ownerReviewClosureReadiness.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${ownerReviewClosureReadiness.state}`
          )}
          title={ownerReviewClosureReadiness.safety}
        >
          <div>
            <strong>{ownerReviewClosureReadiness.label}</strong>
            <span>
              {ownerReviewClosureReadiness.statusLabel} / owner review{" "}
              {ownerReviewClosureReadiness.ownerReviewRecorded ? "recorded" : "held"}
            </span>
            <small>{ownerReviewClosureReadiness.nextAction}</small>
            <small>{ownerReviewClosureReadiness.phase8OwnerReviewClosureReadinessProof}</small>
          </div>
        </div>
        <div
          aria-label={finalCompletionHandoff.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${finalCompletionHandoff.state}`
          )}
          title={finalCompletionHandoff.safety}
        >
          <div>
            <strong>{finalCompletionHandoff.label}</strong>
            <span>
              {finalCompletionHandoff.statusLabel} / Phase 9{" "}
              {finalCompletionHandoff.canAdvancePhase9 ? "ready" : "held"}
            </span>
            <small>{finalCompletionHandoff.nextAction}</small>
            <small>{finalCompletionHandoff.phase8FinalCompletionHandoffProof}</small>
          </div>
        </div>
        <div
          aria-label={closeoutStatus.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${closeoutStatus.state}`
          )}
          title={closeoutStatus.safety}
        >
          <div>
            <strong>{closeoutStatus.label}</strong>
            <span>
              {closeoutStatus.statusLabel} / Phase 9 dependency{" "}
              {closeoutStatus.phase9DependencyReady ? "ready" : "held"}
            </span>
            <small>{closeoutStatus.nextAction}</small>
            <small>{closeoutStatus.phase8CloseoutStatusProof}</small>
          </div>
        </div>
        <div
          aria-label={mutationExpansionGate.ariaLabel}
          className={classNames(
            "phase8-audit-review-record",
            `phase8-audit-review-record-${mutationExpansionGate.state}`
          )}
          title={mutationExpansionGate.detail}
        >
          <div>
            <strong>{mutationExpansionGate.label}</strong>
            <span>
              {mutationExpansionGate.statusLabel} / approvals{" "}
              {mutationExpansionGate.approvedSurfaceCount}/
              {mutationExpansionGate.requiredSurfaceCount}
            </span>
            <small>{mutationExpansionGate.nextAction}</small>
            <small>{mutationExpansionGate.mutationExpansionGateProof}</small>
          </div>
        </div>
        <ol className="phase8-audit-items" aria-label="Phase 8 missing requirement explanations">
          {visibleItems.map((item) => (
            <li
              className={classNames("phase8-audit-item", `phase8-audit-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.pmTaskId} / {item.evidenceKey}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <ol className="phase8-exception-list" aria-label="Phase 8 disabled path exceptions">
          {visibleExceptions.map((exception) => (
            <li
              className={classNames(
                "phase8-exception-item",
                `phase8-exception-${exception.status}`
              )}
              key={exception.id}
              title={`${exception.disabledPath} ${exception.evidenceRequired} ${exception.rollbackExpectation} ${exception.riskExceptionProof ?? ""}`}
            >
              <span>{exception.severity}</span>
              <div>
                <strong>{exception.label}</strong>
                <small>{exception.disabledPath}</small>
                <em>{exception.pmTaskId} / {exception.evidenceKey}</em>
              </div>
              <b>{exception.auditSource}</b>
            </li>
          ))}
        </ol>
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

export function Phase9RunnerApprovalPanel({
  onClearRunnerReview,
  onRecordRunnerReview,
  phase8PermissionAuditDepth,
  reviewRecord,
  snapshot
}: {
  onClearRunnerReview: () => void;
  onRecordRunnerReview: () => void;
  phase8PermissionAuditDepth: Phase8PermissionAuditDepthSnapshot;
  reviewRecord?: Phase9RunnerApprovalRecord;
  snapshot: Phase9RunnerApprovalSnapshot;
}) {
  const runnerReviewAction = phase9RunnerReviewAction(snapshot);
  const depth = buildPhase9RunnerApprovalDepthSummary(snapshot);
  const traceability = buildPhase9RunnerTraceabilitySummary({
    approval: snapshot,
    depth,
    phase8: phase8PermissionAuditDepth,
    runnerReviewRecord: reviewRecord
  });
  const desktopProbeGate = buildPhase9DesktopProbeGate(snapshot, traceability);
  const blockerPriority = buildPhase9RunnerBlockerPriority({
    approval: snapshot,
    depth,
    phase8: phase8PermissionAuditDepth,
    traceability
  });
  const completionGate = buildPhase9RunnerCompletionGate({
    approval: snapshot,
    traceability,
    blockerPriority,
    requestGate: desktopProbeGate
  });
  const closeoutStatus = buildPhase9RunnerCloseoutStatus({
    approval: snapshot,
    approvalDepth: depth,
    traceability,
    blockerPriority,
    requestGate: desktopProbeGate,
    completionGate
  });
  const permissionedToolEvidenceGate = buildPermissionedToolEvidenceGate(closeoutStatus);

  return (
    <section className="panel-section">
      <h4>Phase 9 Runner Approval</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase9-runner-approval",
          `phase9-runner-${snapshot.state}`
        )}
        title={snapshot.nextAction}
      >
        <div className="phase9-runner-header">
          <span className={classNames("phase9-runner-state", `phase9-runner-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <small>{snapshot.runnerApprovalProof}</small>
        <div
          className={classNames(
            "phase9-runner-review-record",
            reviewRecord
              ? `phase9-runner-review-record-${reviewRecord.state}`
              : "phase9-runner-review-record-missing"
          )}
          aria-label={
            reviewRecord
              ? `Phase 9 runner review record ${reviewRecord.state}; ${reviewRecord.readiness}% ready; ${reviewRecord.auditRecordCount} audit records`
              : "Phase 9 runner review record missing"
          }
        >
          <div>
            <strong>
              {reviewRecord ? "Runner review recorded" : "No local runner review record"}
            </strong>
            <span
              title={
                reviewRecord
                  ? `${reviewRecord.detail} ${reviewRecord.rollbackEvidence}`
                  : "Record a local owner review after checking Phase 9 approval, preview, validation, audit, rollback, and mutation-lock evidence."
              }
            >
              {reviewRecord
                ? `${formatTimestamp(reviewRecord.createdAt)}; ${reviewRecord.auditRecordCount} audit records`
                : "Fixed probe remains held"}
            </span>
            {reviewRecord?.phase8ReviewFingerprint ? (
              <small title={reviewRecord.phase8ReviewedBlockerAction ?? reviewRecord.phase8ReviewRecordId}>
                Phase 8 proof {reviewRecord.phase8ReviewFingerprint}
                {reviewRecord.phase8ReviewedBlockerSourceId
                  ? ` / ${reviewRecord.phase8ReviewedBlockerSourceId} / ${reviewRecord.phase8ReviewedBlockerKind ?? "none"} / ${reviewRecord.phase8ReviewedBlockerStatus ?? "ready"}`
                  : ""}
              </small>
            ) : null}
          </div>
          <div
            className="phase9-runner-review-record-actions"
            aria-label="Phase 9 runner review record actions"
          >
            <button
              disabled={!runnerReviewAction.canRecord}
              onClick={onRecordRunnerReview}
              title={runnerReviewAction.title}
              type="button"
            >
              <ClipboardList size={13} />
              Record review
            </button>
            <button
              disabled={!reviewRecord}
              onClick={onClearRunnerReview}
              title={
                reviewRecord
                  ? "Clear the local Phase 9 runner review record."
                  : "No local Phase 9 runner review record is attached."
              }
              type="button"
            >
              <RotateCcw size={13} />
              Clear
            </button>
          </div>
        </div>
        <dl className="phase9-runner-grid" aria-label="Phase 9 desktop runner approval counts">
          <div>
            <dt>Request</dt>
            <dd title={desktopProbeGate.holdReason}>
              {desktopProbeGate.canRun ? "Ready" : "Held"}
            </dd>
          </div>
          <div>
            <dt>Records</dt>
            <dd>{snapshot.auditRecordCount}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>{snapshot.reviewCount}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{snapshot.blockedCount}</dd>
          </div>
        </dl>
        <div
          aria-label={desktopProbeGate.ariaLabel}
          className={classNames(
            "phase9-desktop-probe-gate",
            `phase9-desktop-probe-gate-${desktopProbeGate.state}`,
            desktopProbeGate.canRun
              ? "phase9-desktop-probe-gate-ready"
              : "phase9-desktop-probe-gate-held"
          )}
          title={desktopProbeGate.safety}
        >
          <strong>Phase 9 request gate</strong>
          <span>{desktopProbeGate.statusLabel} / {desktopProbeGate.readiness}%</span>
          <small>{desktopProbeGate.holdReason}</small>
          <small>{desktopProbeGate.phase9RequestGateProof}</small>
        </div>
        <div
          aria-label={completionGate.ariaLabel}
          className={classNames(
            "phase9-desktop-probe-gate",
            `phase9-desktop-probe-gate-${completionGate.state}`,
            completionGate.phaseComplete
              ? "phase9-desktop-probe-gate-ready"
              : "phase9-desktop-probe-gate-held"
          )}
          title={completionGate.safety}
        >
          <strong>{completionGate.label}</strong>
          <span>{completionGate.statusLabel} / {completionGate.readiness}%</span>
          <small>{completionGate.nextAction}</small>
          <small>{completionGate.completionGateProof}</small>
        </div>
        <Phase9RunnerCloseoutStatusPanel status={closeoutStatus} />
        <PermissionedToolEvidenceGatePanel gate={permissionedToolEvidenceGate} />
        <ol className="phase9-runner-items" aria-label="Phase 9 runner approval targets">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase9-runner-item", `phase9-runner-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <div className="phase9-runner-depth" aria-label={depth.ariaLabel}>
          <div className="phase9-runner-depth-header">
            <strong>{depth.label}</strong>
            <span>
              {depth.readyCount} ready / {depth.mutationLockCount} locks
            </span>
          </div>
          <ol className="phase9-runner-depth-records">
            {depth.records.map((record) => (
              <li
                className={classNames(
                  "phase9-runner-depth-record",
                  `phase9-runner-depth-${record.status}`
                )}
                key={record.id}
                title={`${record.evidence} ${record.nextAction}`}
              >
                <span>{record.statusLabel}</span>
                <div>
                  <strong>{record.label}</strong>
                <small>{record.pmTaskId} / {record.evidenceKey}</small>
              </div>
              <b>{record.locksMutation ? "locked" : "proof"}</b>
            </li>
          ))}
        </ol>
        <small>{depth.runnerApprovalDepthProof}</small>
      </div>
        <div className="phase9-runner-traceability" aria-label={traceability.ariaLabel}>
          <div className="phase9-runner-traceability-header">
            <strong>{traceability.label}</strong>
            <span>
              {traceability.statusLabel} / {traceability.readiness}%
            </span>
          </div>
          <ol className="phase9-runner-traceability-records">
            {traceability.items.map((item) => (
              <li
                className={classNames(
                  "phase9-runner-traceability-record",
                  `phase9-runner-traceability-${item.status}`
                )}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>{item.status}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.nextAction}</small>
                </div>
                <b>{item.kind}</b>
              </li>
            ))}
          </ol>
          <small>{traceability.runnerTraceabilityProof}</small>
        </div>
        <div
          aria-label={blockerPriority.ariaLabel}
          className={classNames(
            "phase9-runner-blocker-priority",
            `phase9-runner-blocker-priority-${blockerPriority.state}`
          )}
          title={blockerPriority.safety}
        >
          <div className="phase9-runner-blocker-priority-header">
            <strong>{blockerPriority.label}</strong>
            <span>
              {blockerPriority.runnerReviewCanAddressTopBlocker
                ? "Runner review"
                : blockerPriority.openBlockerCount > 0
                  ? "Owner action"
                  : "Ready"}
            </span>
          </div>
          <p title={blockerPriority.topPriorityAction}>{blockerPriority.topPriorityLabel}</p>
          <small className="phase9-runner-blocker-priority-source">
            {blockerPriority.topPrioritySourceId} / {blockerPriority.topPriorityKind} /{" "}
            {blockerPriority.topPriorityStatus}
          </small>
          <dl className="phase9-runner-blocker-priority-grid" aria-label="Phase 9 runner blocker priority counts">
            <div>
              <dt>Open</dt>
              <dd>{blockerPriority.openBlockerCount}</dd>
            </div>
            <div>
              <dt>Reviewable</dt>
              <dd>{blockerPriority.runnerReviewAddressableCount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{blockerPriority.statusLabel}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{blockerPriority.readiness}%</dd>
            </div>
          </dl>
          <ol className="phase9-runner-blocker-priority-list" aria-label="Phase 9 runner blocker priority rows">
            {blockerPriority.items.length > 0 ? (
              blockerPriority.items.slice(0, 8).map((item) => (
                <li
                  className={classNames(
                    "phase9-runner-blocker-priority-item",
                    `phase9-runner-blocker-priority-item-${item.status}`
                  )}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <span>#{item.priority}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.nextAction}</small>
                  </div>
                  <b>{item.kind}</b>
                </li>
              ))
            ) : (
              <li className="phase9-runner-blocker-priority-item phase9-runner-blocker-priority-item-ready">
                <span>OK</span>
                <div>
                  <strong>No open Phase 9 blocker</strong>
                  <small>{blockerPriority.nextAction}</small>
                </div>
                <b>ready</b>
              </li>
            )}
          </ol>
          <small>{blockerPriority.runnerBlockerPriorityProof}</small>
        </div>
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

export function Phase9RunnerCloseoutStatusPanel({
  status
}: {
  status: Phase9RunnerCloseoutStatus;
}) {
  return (
    <div
      aria-label={status.ariaLabel}
      className={classNames(
        "phase9-desktop-probe-gate",
        `phase9-desktop-probe-gate-${status.state}`,
        status.fixedProbeReady
          ? "phase9-desktop-probe-gate-ready"
          : "phase9-desktop-probe-gate-held"
      )}
      title={status.safety}
    >
      <strong>{status.label}</strong>
      <span>{status.statusLabel} / {status.readiness}%</span>
      <small>{status.nextAction}</small>
      <small>{status.phase9RunnerCloseoutStatusProof}</small>
    </div>
  );
}

export function PermissionedToolEvidenceGatePanel({
  gate
}: {
  gate: PermissionedToolEvidenceGate;
}) {
  return (
    <div
      aria-label={`${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; capture ${
        gate.canRequestCapture ? "ready" : "held"
      }; ${gate.nextAction}`}
      className={classNames(
        "phase9-desktop-probe-gate",
        `phase9-desktop-probe-gate-${gate.state}`,
        gate.canRequestCapture
          ? "phase9-desktop-probe-gate-ready"
          : "phase9-desktop-probe-gate-held"
      )}
      title={gate.safety}
    >
      <strong>{gate.label}</strong>
      <span>
        {gate.statusLabel} / Capture {gate.canRequestCapture ? "ready" : "held"}
      </span>
      <small>{gate.detail}</small>
      <small>{gate.permissionedToolEvidenceGateProof}</small>
      <ol className="phase9-runner-items" aria-label="Permissioned Terminal and Git evidence gates">
        {gate.items.map((item) => (
          <li
            className={classNames("phase9-runner-item", `phase9-runner-item-${item.state}`)}
            key={item.id}
            title={`${item.detail} ${item.nextAction}`}
          >
            <span>{item.surface}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.nextAction}</small>
            </div>
            <b>{item.state}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Phase10ArenaPolishPanel({
  snapshot
}: {
  snapshot: Phase10ArenaPolishSnapshot;
}) {
  const traceability = buildPhase10ArenaPolishTraceability({ snapshot });
  const blockerPriority = buildPhase10ArenaPolishBlockerPriority({
    snapshot,
    traceability
  });
  const closeoutStatus = buildPhase10ArenaPolishCloseoutStatus({
    snapshot,
    traceability,
    blockerPriority
  });
  const arenaReviewAddressabilityGate = buildPhase10ArenaReviewAddressabilityGate(
    blockerPriority,
    closeoutStatus
  );
  const packagingResumeGate = buildPhase10PackagingResumeGate(closeoutStatus);

  return (
    <section className="panel-section">
      <h4>Phase 10 Arena Polish</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase10-arena-polish",
          `phase10-arena-${snapshot.state}`
        )}
        title={snapshot.nextAction}
      >
        <div className="phase10-arena-header">
          <span className={classNames("phase10-arena-state", `phase10-arena-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <dl className="phase10-arena-grid" aria-label="Phase 10 adaptive Arena polish counts">
          <div>
            <dt>Visible</dt>
            <dd>{snapshot.visiblePanelCount}/{snapshot.adaptivePanelCount}</dd>
          </div>
          <div>
            <dt>Hidden</dt>
            <dd>{snapshot.hiddenPanelCount}</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>{snapshot.reviewCount}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{snapshot.blockedCount}</dd>
          </div>
        </dl>
        <ol className="phase10-arena-items" aria-label="Phase 10 Arena polish targets">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase10-arena-item", `phase10-arena-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <div
          aria-label={traceability.ariaLabel}
          className={classNames(
            "phase10-arena-traceability",
            `phase10-arena-traceability-${traceability.state}`
          )}
          title={traceability.safety}
        >
          <div className="phase10-arena-traceability-header">
            <strong>{traceability.label}</strong>
            <span>{traceability.statusLabel}</span>
            <b>{traceability.readiness}%</b>
          </div>
          <dl className="phase10-arena-traceability-grid" aria-label="Phase 10 Arena polish traceability counts">
            <div>
              <dt>PM</dt>
              <dd>{traceability.linkedPmTaskCount}</dd>
            </div>
            <div>
              <dt>Accept</dt>
              <dd>{traceability.acceptanceGateStatus}</dd>
            </div>
            <div>
              <dt>Open</dt>
              <dd>{traceability.blockedCount + traceability.waitingCount + traceability.reviewCount}</dd>
            </div>
          </dl>
          <ol className="phase10-arena-traceability-list" aria-label="Phase 10 Arena polish traceability rows">
            {traceability.items.map((item) => (
              <li
                className={`phase10-arena-traceability-item-${item.status}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>{item.kind}</span>
                <strong>{item.label}</strong>
                <b>{item.status}</b>
              </li>
            ))}
          </ol>
        </div>
        <div
          aria-label={blockerPriority.ariaLabel}
          className={classNames(
            "phase10-arena-blocker-priority",
            `phase10-arena-blocker-priority-${blockerPriority.state}`
          )}
          title={blockerPriority.safety}
        >
          <div className="phase10-arena-blocker-priority-header">
            <strong>{blockerPriority.label}</strong>
            <span>
              {blockerPriority.arenaReviewCanAddressTopBlocker
                ? "Arena review"
                : blockerPriority.openBlockerCount > 0
                  ? "Owner action"
                  : "Ready"}
            </span>
            <b>{blockerPriority.readiness}%</b>
          </div>
          <p title={blockerPriority.topPriorityAction}>{blockerPriority.topPriorityLabel}</p>
          <dl className="phase10-arena-blocker-priority-grid" aria-label="Phase 10 Arena polish blocker priority counts">
            <div>
              <dt>Open</dt>
              <dd>{blockerPriority.openBlockerCount}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{blockerPriority.arenaReviewAddressableCount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{blockerPriority.statusLabel}</dd>
            </div>
          </dl>
          <ol className="phase10-arena-blocker-priority-list" aria-label="Phase 10 Arena polish blocker priority rows">
            {blockerPriority.items.length > 0 ? (
              blockerPriority.items.slice(0, 6).map((item) => (
                <li
                  className={`phase10-arena-blocker-priority-item-${item.status}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <span>#{item.priority}</span>
                  <strong>{item.label}</strong>
                  <b>{item.kind}</b>
                </li>
              ))
            ) : (
              <li className="phase10-arena-blocker-priority-item-ready">
                <span>OK</span>
                <strong>No open Phase 10 blocker</strong>
                <b>ready</b>
              </li>
            )}
          </ol>
        </div>
        <Phase10ArenaPolishCloseoutStatusPanel status={closeoutStatus} />
        <Phase10ArenaReviewAddressabilityGatePanel gate={arenaReviewAddressabilityGate} />
        <Phase10PackagingResumeGatePanel gate={packagingResumeGate} />
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

export function Phase10ArenaPolishCloseoutStatusPanel({
  status
}: {
  status: Phase10ArenaPolishCloseoutStatus;
}) {
  return (
    <div
      aria-label={status.ariaLabel}
      className={classNames(
        "phase10-arena-blocker-priority",
        `phase10-arena-blocker-priority-${status.state}`
      )}
      title={status.safety}
    >
      <div className="phase10-arena-blocker-priority-header">
        <strong>{status.label}</strong>
        <span>{status.statusLabel}</span>
        <b>{status.readiness}%</b>
      </div>
      <dl className="phase10-arena-blocker-priority-grid" aria-label="Phase 10 Arena polish closeout status counts">
        <div>
          <dt>PM</dt>
          <dd>{status.linkedPmTaskCount}/{status.requiredPmTaskCount}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{status.arenaReviewAddressableCount}</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>{status.packagingPaused ? "Paused" : "Review"}</dd>
        </div>
      </dl>
      <small>{status.phase10ArenaPolishCloseoutStatusProof}</small>
      <small title={status.nextAction}>{status.nextAction}</small>
    </div>
  );
}

export function Phase10ArenaReviewAddressabilityGatePanel({
  gate
}: {
  gate: Phase10ArenaReviewAddressabilityGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "phase10-arena-blocker-priority",
        `phase10-arena-blocker-priority-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="phase10-arena-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl
        className="phase10-arena-blocker-priority-grid"
        aria-label="Phase 10 Arena review addressability gate counts"
      >
        <div>
          <dt>Addressable</dt>
          <dd>{gate.addressableSourceCount}</dd>
        </div>
        <div>
          <dt>Request</dt>
          <dd>{gate.canRequestArenaReview ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Packaging</dt>
          <dd>{gate.packagingPaused ? "Paused" : "Review"}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{gate.ownerArenaReviewApprovalRecorded ? "Recorded" : "Required"}</dd>
        </div>
      </dl>
      <small>{gate.arenaReviewAddressabilityGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

export function Phase10PackagingResumeGatePanel({
  gate
}: {
  gate: Phase10PackagingResumeGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "phase10-arena-blocker-priority",
        `phase10-arena-blocker-priority-${gate.state}`
      )}
      title={gate.safety}
    >
      <div className="phase10-arena-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="phase10-arena-blocker-priority-grid" aria-label="Phase 10 packaging resume gate counts">
        <div>
          <dt>Resume</dt>
          <dd>{gate.canResumePackaging ? "Ready" : "Held"}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{gate.ownerResumeApproved ? "Approved" : "Missing"}</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>{gate.desktopPackagingLocked ? "Locked" : "Review"}</dd>
        </div>
      </dl>
      <small>{gate.detail}</small>
      <small>{gate.phase10PackagingResumeGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

export function Phase11OwnerCommandCenterPanel({
  evidenceRecords,
  goals,
  proofFreshnessDepth,
  projectManagementTasks,
  releaseReadiness,
  snapshot
}: {
  evidenceRecords: Phase11EvidenceRecordsSnapshot;
  goals?: readonly RemainingGoalPlanItem[];
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot;
  projectManagementTasks: readonly ProjectManagementTask[];
  releaseReadiness: Phase11ReleaseReadinessSnapshot;
  snapshot: Phase11OwnerCommandCenterSnapshot;
}) {
  const traceability = buildPhase11OwnerReleaseTraceability({
    ownerCommandCenter: snapshot,
    proofFreshnessDepth,
    evidenceRecords,
    releaseReadiness,
    goals,
    projectManagementTasks
  });
  const priorityTraceGate = buildPhase11PriorityTraceGate(snapshot, traceability);
  const blockerPriority = buildPhase11OwnerReleaseBlockerPriority({
    ownerCommandCenter: snapshot,
    proofFreshnessDepth,
    evidenceRecords,
    releaseReadiness,
    traceability
  });
  const ownerCommandCloseoutStatus = buildPhase11OwnerCommandCloseoutStatus({
    ownerCommandCenter: snapshot,
    proofFreshnessDepth,
    evidenceRecords,
    releaseReadiness,
    traceability,
    blockerPriority
  });
  const closeoutStatus = buildPhase11ReleaseCloseoutStatus({
    ownerCommandCenter: snapshot,
    proofFreshnessDepth,
    evidenceRecords,
    releaseReadiness,
    traceability,
    blockerPriority
  });
  const externalDeliveryGate = buildPhase11ExternalDeliveryGate(
    closeoutStatus,
    evidenceRecords
  );
  const cleanInstallPackagingGate = buildPhase11CleanInstallPackagingGate(
    closeoutStatus,
    releaseReadiness
  );

  return (
    <section className="panel-section">
      <h4>Phase 11 Owner Command</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase11-owner-command",
          `phase11-owner-${snapshot.state}`
        )}
        title={snapshot.nextAction}
      >
        <div className="phase11-owner-header">
          <span className={classNames("phase11-owner-state", `phase11-owner-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <dl className="phase11-owner-grid" aria-label="Phase 11 Owner Testing command center counts">
          <div>
            <dt>Release</dt>
            <dd>{snapshot.canRelease ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Checklist</dt>
            <dd>{snapshot.checklistReadiness}%</dd>
          </div>
          <div>
            <dt>Phases</dt>
            <dd>{snapshot.phaseReadiness}%</dd>
          </div>
          <div>
            <dt>Blockers</dt>
            <dd>{snapshot.blockerCount}</dd>
          </div>
        </dl>
        <ol className="phase11-owner-items" aria-label="Phase 11 Owner Testing command center gates">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase11-owner-item", `phase11-owner-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <ol className="phase11-owner-goal-traces" aria-label="Prioritized remaining goal traces">
          {snapshot.priorityGoalTraces.map((trace) => (
            <li
              className={classNames(
                "phase11-owner-goal-trace",
                `phase11-owner-goal-trace-${trace.priority}`,
                trace.current && "phase11-owner-goal-trace-current"
              )}
              key={trace.goalId}
              title={`${trace.goalId}; phases: ${trace.phaseIds.join(", ")}; PM tasks: ${trace.pmTaskIds.join(", ")}; ${trace.nextAction}`}
            >
              <span>{trace.priority}</span>
              <div>
                <strong>{trace.target}</strong>
                <small>{trace.goalId} - {trace.phaseIds.length} phases - {trace.pmTaskIds.length} PM links</small>
              </div>
              <b>{trace.status} - {trace.completionPercent}%</b>
            </li>
          ))}
        </ol>
        <Phase11PriorityTraceGatePanel gate={priorityTraceGate} />
        <div
          aria-label={traceability.ariaLabel}
          className={classNames(
            "phase11-owner-traceability",
            `phase11-owner-traceability-${traceability.state}`
          )}
          title={traceability.safety}
        >
          <div className="phase11-owner-traceability-header">
            <strong>{traceability.label}</strong>
            <span>{traceability.statusLabel}</span>
            <b>{traceability.readiness}%</b>
          </div>
          <dl className="phase11-owner-traceability-grid" aria-label="Phase 11 owner release traceability counts">
            <div>
              <dt>Goals</dt>
              <dd>{traceability.linkedGoalIds.length}</dd>
            </div>
            <div>
              <dt>PM</dt>
              <dd>{traceability.linkedPmTaskCount}</dd>
            </div>
            <div>
              <dt>Hold</dt>
              <dd>{traceability.releaseHoldStatus}</dd>
            </div>
          </dl>
          <ol className="phase11-owner-traceability-list" aria-label="Phase 11 owner release traceability rows">
            {traceability.items.map((item) => (
              <li
                className={`phase11-owner-traceability-item-${item.status}`}
                key={item.id}
                title={`${item.detail} ${item.nextAction}`}
              >
                <span>{item.kind}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </div>
                <b>{item.status}</b>
              </li>
            ))}
          </ol>
        </div>
        <div
          aria-label={blockerPriority.ariaLabel}
          className={classNames(
            "phase11-owner-blocker-priority",
            `phase11-owner-blocker-priority-${blockerPriority.state}`
          )}
          title={blockerPriority.safety}
        >
          <div className="phase11-owner-blocker-priority-header">
            <strong>{blockerPriority.label}</strong>
            <span>
              {blockerPriority.ownerReviewCanAddressTopBlocker
                ? "Owner review"
                : blockerPriority.openBlockerCount > 0
                  ? "Owner action"
                  : "Ready"}
            </span>
            <b>{blockerPriority.readiness}%</b>
          </div>
          <p title={blockerPriority.topPriorityAction}>{blockerPriority.topPriorityLabel}</p>
          <dl className="phase11-owner-blocker-priority-grid" aria-label="Phase 11 owner release blocker priority counts">
            <div>
              <dt>Open</dt>
              <dd>{blockerPriority.openBlockerCount}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{blockerPriority.ownerReviewAddressableCount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{blockerPriority.statusLabel}</dd>
            </div>
          </dl>
          <ol className="phase11-owner-blocker-priority-list" aria-label="Phase 11 owner release blocker priority rows">
            {blockerPriority.items.length > 0 ? (
              blockerPriority.items.slice(0, 8).map((item) => (
                <li
                  className={`phase11-owner-blocker-priority-item-${item.status}`}
                  key={item.id}
                  title={`${item.detail} ${item.nextAction}`}
                >
                  <span>#{item.priority}</span>
                  <strong>{item.label}</strong>
                  <b>{item.kind}</b>
                </li>
              ))
            ) : (
              <li className="phase11-owner-blocker-priority-item-ready">
                <span>OK</span>
                <strong>No open Phase 11 blocker</strong>
                <b>ready</b>
              </li>
            )}
          </ol>
        </div>
        <Phase11OwnerCommandCloseoutStatusPanel status={ownerCommandCloseoutStatus} />
        <Phase11ReleaseCloseoutStatusPanel status={closeoutStatus} />
        <Phase11CleanInstallPackagingGatePanel gate={cleanInstallPackagingGate} />
        <Phase11ExternalDeliveryGatePanel gate={externalDeliveryGate} />
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

export function Phase11PriorityTraceGatePanel({
  gate
}: {
  gate: Phase11PriorityTraceGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "phase11-owner-blocker-priority",
        `phase11-owner-blocker-priority-${gate.state}`
      )}
      title={gate.detail}
    >
      <div className="phase11-owner-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl
        className="phase11-owner-blocker-priority-grid"
        aria-label="Phase 11 priority trace gate counts"
      >
        <div>
          <dt>Traces</dt>
          <dd>{gate.priorityGoalTraceCount}</dd>
        </div>
        <div>
          <dt>Current</dt>
          <dd>{gate.currentActiveTraceCount}</dd>
        </div>
        <div>
          <dt>Missing PM</dt>
          <dd>{gate.missingPmTaskCount}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{gate.canTrustPriorityTrace ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <small>{gate.priorityTraceGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

export function Phase11OwnerCommandCloseoutStatusPanel({
  status
}: {
  status: Phase11OwnerCommandCloseoutStatus;
}) {
  return (
    <div
      aria-label={status.ariaLabel}
      className={classNames(
        "phase11-owner-blocker-priority",
        `phase11-owner-blocker-priority-${status.state}`
      )}
      title={status.safety}
    >
      <div className="phase11-owner-blocker-priority-header">
        <strong>{status.label}</strong>
        <span>{status.statusLabel}</span>
        <b>{status.readiness}%</b>
      </div>
      <dl className="phase11-owner-blocker-priority-grid" aria-label="Phase 11 owner command closeout status counts">
        <div>
          <dt>PM</dt>
          <dd>{status.linkedPmTaskCount}/{status.requiredPmTaskCount}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{status.ownerReviewAddressableCount}</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>{status.packagingPaused ? "Paused" : "Review"}</dd>
        </div>
      </dl>
      <small>{status.phase11OwnerCommandCloseoutStatusProof}</small>
      <small title={status.nextAction}>{status.nextAction}</small>
    </div>
  );
}

export function Phase11ReleaseCloseoutStatusPanel({
  status
}: {
  status: Phase11ReleaseCloseoutStatus;
}) {
  return (
    <div
      aria-label={status.ariaLabel}
      className={classNames(
        "phase11-owner-blocker-priority",
        `phase11-owner-blocker-priority-${status.state}`
      )}
      title={status.safety}
    >
      <div className="phase11-owner-blocker-priority-header">
        <strong>{status.label}</strong>
        <span>{status.statusLabel}</span>
        <b>{status.readiness}%</b>
      </div>
      <dl className="phase11-owner-blocker-priority-grid" aria-label="Phase 11 release closeout status counts">
        <div>
          <dt>PM</dt>
          <dd>{status.linkedPmTaskCount}/{status.requiredPmTaskCount}</dd>
        </div>
        <div>
          <dt>Holds</dt>
          <dd>{status.releaseHoldCount}</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>{status.packagingPaused ? "Paused" : "Review"}</dd>
        </div>
      </dl>
      <small>{status.phase11ReleaseCloseoutStatusProof}</small>
      <small title={status.nextAction}>{status.nextAction}</small>
    </div>
  );
}

export function Phase11ProofFreshnessDepthPanel({
  snapshot
}: {
  snapshot: Phase11ProofFreshnessDepthSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Phase 11 Proof Freshness</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase11-proof-depth",
          `phase11-proof-depth-${snapshot.state}`
        )}
        title={snapshot.safety}
      >
        <div className="phase11-proof-depth-header">
          <span className={classNames("phase11-proof-depth-state", `phase11-proof-depth-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <dl className="phase11-proof-depth-grid" aria-label="Phase 11 proof freshness counts">
          <div>
            <dt>Trust</dt>
            <dd>{snapshot.canTrustOwnerProof ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{snapshot.readyCount}</dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd>{snapshot.openProofCount}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{snapshot.blockedCount}</dd>
          </div>
        </dl>
        <ol className="phase11-proof-depth-items" aria-label="Phase 11 proof freshness gates">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase11-proof-depth-item", `phase11-proof-depth-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

export function Phase11EvidenceRecordsPanel({
  onClearRecord,
  onExportSignedAuditArtifact,
  onImportRecords,
  onRecord,
  signedAuditExportVerification,
  snapshot
}: {
  onClearRecord: (gate: Phase11EvidenceGate) => void;
  onExportSignedAuditArtifact?: () => void;
  onImportRecords: (serializedRecords: string) => void;
  onRecord: (gate: Phase11EvidenceGate) => void;
  signedAuditExportVerification?: Phase11SignedAuditExportArtifactVerification;
  snapshot: Phase11EvidenceRecordsSnapshot;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const records = Object.values(snapshot.records);
  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      onImportRecords(await file.text());
    },
    [onImportRecords]
  );

  return (
    <section className="panel-section">
      <h4>Phase 11 Evidence Records</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className="phase11-evidence-records"
        title={snapshot.nextAction}
      >
        <div className="phase11-evidence-records-header">
          <span>{snapshot.statusLabel}</span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <div className="phase11-evidence-record-actions" aria-label="Phase 11 evidence record actions">
          <button
            onClick={() => importInputRef.current?.click()}
            title="Import a local Phase 11 evidence record JSON artifact."
            type="button"
          >
            <Paperclip size={13} />
            <span>Import JSON</span>
          </button>
          <input
            accept="application/json,.json"
            aria-label="Import Phase 11 evidence record artifact"
            onChange={handleImport}
            ref={importInputRef}
            type="file"
          />
          <button
            disabled={!onExportSignedAuditArtifact}
            onClick={onExportSignedAuditArtifact}
            title="Export a local Phase 11 signed audit JSON artifact with offline verification metadata."
            type="button"
          >
            <ShieldCheck size={13} />
            <span>Export signed audit</span>
          </button>
        </div>
        <dl className="phase11-evidence-records-grid" aria-label="Phase 11 evidence record counts">
          <div>
            <dt>Open</dt>
            <dd>{snapshot.openGateCount}</dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd>{snapshot.readyCount}</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd>{snapshot.waitingCount}</dd>
          </div>
          <div>
            <dt>Stale</dt>
            <dd>{snapshot.staleCount}</dd>
          </div>
          <div>
            <dt>Malformed</dt>
            <dd>{snapshot.malformedCount}</dd>
          </div>
        </dl>
        {signedAuditExportVerification ? (
          <div
            className={classNames(
              "phase11-evidence-record",
              `phase11-evidence-record-${signedAuditExportVerification.state}`
            )}
            title={`${signedAuditExportVerification.detail} ${signedAuditExportVerification.nextAction}`}
          >
            <span>{signedAuditExportVerification.statusLabel}</span>
            <div>
              <strong>Signed audit export</strong>
              <small>
                {signedAuditExportVerification.signature || "signature pending"} / rollback{" "}
                {signedAuditExportVerification.rollbackReferenceCount} / no mutation{" "}
                {signedAuditExportVerification.noMutationScopeCount}
              </small>
              <small>{signedAuditExportVerification.nextAction}</small>
            </div>
            <b>{signedAuditExportVerification.readiness}%</b>
          </div>
        ) : null}
        <ol className="phase11-evidence-record-list" aria-label="Phase 11 evidence records">
          {records.map((record) => (
            <li
              className={classNames("phase11-evidence-record", `phase11-evidence-record-${record.state}`)}
              key={record.gate}
              title={`${record.detail} ${record.nextAction}`}
            >
              <span>{record.freshness}</span>
              <div>
                <strong>{record.label}</strong>
                <small>{record.source} / {record.recordedAt}</small>
                <small>{record.nextAction}</small>
              </div>
              <div className="phase11-evidence-record-row-actions">
                <button
                  onClick={() => onRecord(record.gate)}
                  title={`Attach owner-local ${record.label.toLowerCase()} metadata covering ${phase11EvidenceGateCoverageCopy(record.gate)}.`}
                  type="button"
                >
                  <CheckCircle2 size={13} />
                  <span>{record.state === "ready" ? "Record again" : "Record"}</span>
                </button>
                <button
                  disabled={record.freshness === "missing"}
                  onClick={() => onClearRecord(record.gate)}
                  title={
                    record.freshness === "missing"
                      ? "No local Phase 11 evidence record is attached."
                      : `Clear local ${record.label.toLowerCase()} evidence metadata.`
                  }
                  type="button"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
              <b>{record.state}</b>
            </li>
          ))}
        </ol>
        <small>{records[0]?.safety}</small>
      </div>
    </section>
  );
}

export function Phase11CleanInstallPackagingGatePanel({
  gate
}: {
  gate: Phase11CleanInstallPackagingGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "phase11-owner-release-blocker-priority",
        `phase11-owner-release-blocker-priority-${gate.state}`
      )}
      title={gate.safety}
    >
      <div className="phase11-owner-release-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="phase11-owner-release-blocker-priority-grid" aria-label="Phase 11 clean install packaging gate counts">
        <div>
          <dt>Prepare</dt>
          <dd>{gate.canPrepareInstallPackage ? "Ready" : "Held"}</dd>
        </div>
        <div>
          <dt>Install</dt>
          <dd>{gate.cleanInstallEvidenceReady ? "Ready" : "Held"}</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>{gate.desktopPackagingLocked ? "Locked" : "Review"}</dd>
        </div>
      </dl>
      <small>{gate.detail}</small>
      <small>{gate.phase11CleanInstallPackagingGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

export function Phase11ExternalDeliveryGatePanel({
  gate
}: {
  gate: Phase11ExternalDeliveryGate;
}) {
  return (
    <div
      aria-label={gate.ariaLabel}
      className={classNames(
        "phase11-owner-release-blocker-priority",
        `phase11-owner-release-blocker-priority-${gate.state}`
      )}
      title={gate.safety}
    >
      <div className="phase11-owner-release-blocker-priority-header">
        <strong>{gate.label}</strong>
        <span>{gate.statusLabel}</span>
        <b>{gate.readiness}%</b>
      </div>
      <dl className="phase11-owner-release-blocker-priority-grid" aria-label="Phase 11 external delivery gate counts">
        <div>
          <dt>Deliver</dt>
          <dd>{gate.canDeliverExternally ? "Ready" : "Held"}</dd>
        </div>
        <div>
          <dt>Audit</dt>
          <dd>{gate.signedAuditReady ? "Ready" : "Held"}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{gate.ownerDeliveryApproved ? "Approved" : "Missing"}</dd>
        </div>
      </dl>
      <small>{gate.detail}</small>
      <small>{gate.phase11ExternalDeliveryGateProof}</small>
      <small title={gate.nextAction}>{gate.nextAction}</small>
    </div>
  );
}

export function Phase11ReleaseReadinessPanel({
  snapshot
}: {
  snapshot: Phase11ReleaseReadinessSnapshot;
}) {
  return (
    <section className="panel-section">
      <h4>Phase 11 Release Readiness</h4>
      <div
        aria-label={snapshot.ariaLabel}
        className={classNames(
          "phase11-release-readiness",
          `phase11-release-${snapshot.state}`
        )}
        title={snapshot.nextAction}
      >
        <div className="phase11-release-header">
          <span className={classNames("phase11-release-state", `phase11-release-state-${snapshot.state}`)}>
            <span aria-hidden="true" />
            {snapshot.statusLabel}
          </span>
          <strong>{snapshot.label}</strong>
          <b>{snapshot.readiness}%</b>
        </div>
        <p title={snapshot.nextAction}>{snapshot.nextAction}</p>
        <dl className="phase11-release-grid" aria-label="Phase 11 release readiness counts">
          <div>
            <dt>Decision</dt>
            <dd>{snapshot.canRecommendRelease ? "Ready" : "Held"}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{snapshot.ownerReadiness}%</dd>
          </div>
          <div>
            <dt>Security</dt>
            <dd>{snapshot.securityReadiness}%</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{snapshot.packagingReadiness}%</dd>
          </div>
          <div>
            <dt>Holds</dt>
            <dd>{snapshot.releaseHoldCount}</dd>
          </div>
        </dl>
        <ol className="phase11-release-items" aria-label="Phase 11 release readiness gates">
          {snapshot.items.map((item) => (
            <li
              className={classNames("phase11-release-item", `phase11-release-item-${item.status}`)}
              key={item.id}
              title={`${item.detail} ${item.nextAction}`}
            >
              <span>{item.kind}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
                <small>{item.nextAction}</small>
              </div>
              <b>{item.status}</b>
            </li>
          ))}
        </ol>
        <small title={snapshot.safety}>{snapshot.safety}</small>
      </div>
    </section>
  );
}

function ToolEvidenceCaptureRecordRow({
  record
}: {
  record: ToolEvidenceCaptureRecord;
}) {
  return (
    <li className={classNames("tool-evidence-record", `tool-evidence-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong>{record.action}</strong>
        <small title={record.detail}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b title={record.statusLabel}>{record.readiness}%</b>
    </li>
  );
}

function RuntimeAdapterBridgeStatus({
  bridge,
  onAttach,
  onDetach
}: {
  bridge: RuntimeAdapterBridgeSnapshot;
  onAttach: () => void;
  onDetach: () => void;
}) {
  return (
    <div className="adapter-bridge" aria-label="Runtime adapter bridge">
      <div className="adapter-bridge-header">
        <span className={classNames("adapter-bridge-state", `adapter-bridge-${bridge.state}`)}>
          <span aria-hidden="true" />
          {bridge.state}
        </span>
        <strong title={bridge.detail}>{bridge.attached ? "Bridge attached" : "Bridge detached"}</strong>
      </div>
      <p title={bridge.detail}>{bridge.detail}</p>
      <div className="adapter-bridge-actions" aria-label="Runtime adapter bridge controls">
        <button
          aria-label="Attach runtime adapter bridge"
          disabled={!bridge.canAttach}
          onClick={onAttach}
          title="Attach bridge"
          type="button"
        >
          <Link2 size={14} />
          <span>Attach</span>
        </button>
        <button
          aria-label="Detach runtime adapter bridge"
          disabled={!bridge.canDetach}
          onClick={onDetach}
          title="Detach bridge"
          type="button"
        >
          <Link2Off size={14} />
          <span>Detach</span>
        </button>
      </div>
    </div>
  );
}

function RuntimeLaunchRequestStatus({
  approval,
  executionAudit,
  executionAuditHistory,
  launchRequest,
  onCancelApproval,
  onRequestApproval
}: {
  approval: RuntimeLaunchApprovalSnapshot;
  executionAudit: RuntimeExecutionAuditSnapshot;
  executionAuditHistory: RuntimeExecutionAuditRecord[];
  launchRequest: RuntimeLaunchRequestSnapshot;
  onCancelApproval: () => void;
  onRequestApproval: () => void;
}) {
  return (
    <div className="launch-request" aria-label="Runtime launch request preview">
      <div className="launch-request-header">
        <span className={classNames("launch-request-state", `launch-request-${launchRequest.state}`)}>
          <span aria-hidden="true" />
          {launchRequest.state}
        </span>
        <strong title={launchRequest.label}>
          {launchRequest.canRequest ? "Request ready" : "Request preview"}
        </strong>
      </div>
      <p title={launchRequest.detail}>{launchRequest.detail}</p>
      <dl className="launch-request-grid">
        <div>
          <dt>Events</dt>
          <dd>{launchRequest.eventCount}</dd>
        </div>
        <div>
          <dt>Ready</dt>
          <dd>{launchRequest.readiness}%</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{launchRequest.requiresApproval ? "Required" : "Held"}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd title={launchRequest.transport}>{launchRequest.transport}</dd>
        </div>
      </dl>
      <small title={launchRequest.safety}>{launchRequest.safety}</small>
      <div className="launch-approval" aria-label="Runtime launch approval request">
        <div className="launch-approval-header">
          <span className={classNames("launch-approval-state", `launch-approval-${approval.state}`)}>
            <span aria-hidden="true" />
            {approval.statusLabel}
          </span>
          <strong title={approval.label}>Approval request</strong>
        </div>
        <p title={approval.detail}>{approval.detail}</p>
        <div className="launch-approval-actions">
          <button
            aria-label="Request runtime launch approval"
            disabled={!approval.canRequest}
            onClick={onRequestApproval}
            title={approval.primaryActionLabel}
            type="button"
          >
            <ClipboardList size={14} />
            <span>{approval.primaryActionLabel}</span>
          </button>
          <button
            aria-label="Cancel runtime launch approval request"
            disabled={!approval.canCancel}
            onClick={onCancelApproval}
            title="Cancel request"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Cancel</span>
          </button>
        </div>
        <small title={approval.safety}>{approval.safety}</small>
      </div>
      <RuntimeExecutionAuditStatus audit={executionAudit} history={executionAuditHistory} />
    </div>
  );
}

function RuntimeExecutionAuditStatus({
  audit,
  history
}: {
  audit: RuntimeExecutionAuditSnapshot;
  history: RuntimeExecutionAuditRecord[];
}) {
  return (
    <div className="execution-audit" aria-label="Runtime execution audit preview">
      <div className="execution-audit-header">
        <span className={classNames("execution-audit-state", `execution-audit-${audit.state}`)}>
          <span aria-hidden="true" />
          {audit.statusLabel}
        </span>
        <strong title={audit.label}>Execution audit</strong>
      </div>
      <p title={audit.detail}>{audit.detail}</p>
      <dl className="execution-audit-grid">
        <div>
          <dt>Events</dt>
          <dd>{audit.eventCount}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{audit.requiresDesktopApproval ? "Needed" : "Held"}</dd>
        </div>
        <div>
          <dt>Execute</dt>
          <dd>{audit.canExecute ? "Ready" : "Locked"}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd title={audit.transport}>{audit.transport}</dd>
        </div>
      </dl>
      <ol className="execution-audit-list" aria-label="Runtime execution audit checklist">
        {audit.items.map((item) => (
          <RuntimeExecutionAuditItemRow item={item} key={item.id} />
        ))}
      </ol>
      <small title={audit.safety}>{audit.safety}</small>
      <div className="execution-audit-history" aria-label="Runtime execution audit history">
        <div className="execution-audit-history-header">
          <strong>Recent audit records</strong>
          <span>{history.length}</span>
        </div>
        {history.length > 0 ? (
          <ol className="execution-audit-records">
            {history.slice(0, 4).map((record) => (
              <RuntimeExecutionAuditRecordRow key={record.id} record={record} />
            ))}
          </ol>
        ) : (
          <p className="execution-audit-empty">Request or cancel approval to create a local record.</p>
        )}
      </div>
    </div>
  );
}

function RuntimeExecutionAuditItemRow({ item }: { item: RuntimeExecutionAuditItem }) {
  return (
    <li className={classNames("execution-audit-item", `execution-audit-item-${item.status}`)}>
      <span aria-hidden="true" />
      <div>
        <strong title={item.label}>{item.label}</strong>
        <small title={item.detail}>{item.detail}</small>
      </div>
      <b>{item.status}</b>
    </li>
  );
}

function RuntimeExecutionAuditRecordRow({ record }: { record: RuntimeExecutionAuditRecord }) {
  return (
    <li className={classNames("execution-audit-record", `execution-audit-record-${record.action}`)}>
      <span aria-hidden="true" />
      <div>
        <strong title={record.detail}>{record.action}</strong>
        <small title={record.createdAt}>{formatTimestamp(record.createdAt)}</small>
      </div>
      <b>{record.executionLocked ? "Locked" : record.statusLabel}</b>
    </li>
  );
}

function RuntimeAdapterSessionStatus({ snapshot }: { snapshot: RuntimeAdapterSessionSnapshot }) {
  return (
    <div className="adapter-session" aria-label="Runtime adapter session">
      <div className="adapter-session-header">
        <span className={classNames("adapter-session-state", `adapter-session-${snapshot.state}`)}>
          <span aria-hidden="true" />
          {snapshot.state}
        </span>
        <strong title={snapshot.label}>{snapshot.label}</strong>
      </div>
      <p title={snapshot.heartbeat}>{snapshot.heartbeat}</p>
      <dl className="adapter-session-grid">
        <div>
          <dt>Transport</dt>
          <dd title={snapshot.transport}>{snapshot.transport}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{snapshot.health}</dd>
        </div>
        <div>
          <dt>Ready</dt>
          <dd>{snapshot.readiness}%</dd>
        </div>
        <div>
          <dt>Permissions</dt>
          <dd>
            {snapshot.enabledPermissions}/{snapshot.requiredPermissions}
          </dd>
        </div>
      </dl>
      <small title={snapshot.latestEventLabel}>Latest: {snapshot.latestEventLabel}</small>
    </div>
  );
}

function RuntimeStreamPreview({ snapshot }: { snapshot: RuntimeStreamSnapshot }) {
  const visibleEvents = snapshot.emittedEvents.slice(-5);

  return (
    <div className="stream-preview">
      <div className="stream-latest">
        <span>Latest</span>
        <strong title={snapshot.latestEvent?.label}>{snapshot.latestEvent?.label}</strong>
        <small title={snapshot.latestEvent?.reason}>{snapshot.latestEvent?.reason}</small>
      </div>
      <ol className="stream-event-list" aria-label="Emitted runtime stream events">
        {visibleEvents.map((event) => (
          <li className={classNames("stream-event", `stream-event-${event.adapterStatus}`)} key={event.id}>
            <span>{event.sequence + 1}</span>
            <strong title={event.label}>{event.label}</strong>
            <small>{event.adapterStatus}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RunTimelineItem({ event }: { event: RunTimelineEvent }) {
  return (
    <li className={classNames("timeline-item", `timeline-${event.kind}`)}>
      <span className="timeline-marker" aria-hidden="true" />
      <div>
        <span className="timeline-kicker">
          {event.actor} / {event.kind}
        </span>
        <strong title={event.label}>{event.label}</strong>
        <small title={event.detail}>{event.detail}</small>
      </div>
      <span className={classNames("timeline-status", `timeline-status-${event.status}`)}>
        {event.status}
      </span>
    </li>
  );
}

function PermissionItem({ surface }: { surface: PermissionSurface }) {
  const icon =
    surface.status === "enabled" ? (
      <CheckCircle2 size={15} />
    ) : surface.status === "review" ? (
      <CircleDot size={15} />
    ) : (
      <AlertTriangle size={15} />
    );

  return (
    <li className={classNames("permission-item", `permission-${surface.status}`)}>
      {icon}
      <span>
        <strong>{surface.label}</strong>
        <small>{surface.detail}</small>
      </span>
    </li>
  );
}
