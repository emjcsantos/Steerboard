#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeBridgeStatus {
    pub id: String,
    pub label: String,
    pub state: String,
    pub process_execution_available: bool,
    pub workspace_access_available: bool,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionApprovalStatus {
    pub id: String,
    pub label: String,
    pub state: String,
    pub approval_command_available: bool,
    pub permission_granted: bool,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexCliProbe {
    pub available: bool,
    pub version: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexHomeProbe {
    pub present: bool,
    pub config_present: bool,
    pub auth_present: bool,
    pub auth_mode: String,
    pub auth_billing: String,
    pub auth_detail: String,
    pub skills_count: usize,
    pub plugins_present: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerProtocolProbe {
    pub thread_start: bool,
    pub turn_start: bool,
    pub turn_interrupt: bool,
    pub turn_steer: bool,
    pub agent_message_delta: bool,
    pub plugin_list: bool,
    pub mcp_status: bool,
    pub skills_list: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerProbe {
    pub available: bool,
    pub stdio_handshake: bool,
    pub daemon_lifecycle: String,
    pub user_agent: Option<String>,
    pub platform_os: Option<String>,
    pub protocol: CodexAppServerProtocolProbe,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexExecJsonProbe {
    pub available: bool,
    pub can_stream_events: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexExecutionProbe {
    pub process_execution_allowed: bool,
    pub prompt_execution_allowed: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexTransportProbe {
    pub source: String,
    pub checked_at: Option<String>,
    pub cli: CodexCliProbe,
    pub codex_home: CodexHomeProbe,
    pub app_server: CodexAppServerProbe,
    pub exec_json: CodexExecJsonProbe,
    pub execution: CodexExecutionProbe,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexLiveSmokeProof {
    pub source: String,
    pub checked_at: Option<String>,
    pub executed: bool,
    pub ok: bool,
    pub detail: String,
    pub thread_id_seen: bool,
    pub turn_id_seen: bool,
    pub agent_delta_method_seen: bool,
    pub turn_completed_seen: bool,
    pub failed_seen: bool,
    pub expected_token_seen: bool,
    pub method_count: usize,
    pub unique_methods: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexLiveControlSmokeMethodProof {
    pub method: String,
    pub supported: bool,
    pub state: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexLiveControlSmokeProof {
    pub source: String,
    pub checked_at: Option<String>,
    pub executed: bool,
    pub ok: bool,
    pub unsupported: bool,
    pub detail: String,
    pub source_detected: bool,
    pub app_server_ready: bool,
    pub protocol_ready: bool,
    pub required_methods: Vec<CodexLiveControlSmokeMethodProof>,
    pub supported_method_count: usize,
    pub unsupported_method_count: usize,
    pub total_method_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexActiveTurnControlSmokeControlProof {
    pub control: String,
    pub attempted: bool,
    pub sent: bool,
    pub observed: bool,
    pub supported: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexActiveTurnControlSmokeProof {
    pub source: String,
    pub checked_at: Option<String>,
    pub executed: bool,
    pub ok: bool,
    pub unsupported: bool,
    pub detail: String,
    pub session_started: bool,
    pub turn_id_seen: bool,
    pub interrupt_sent: bool,
    pub interrupt_observed: bool,
    pub completed: bool,
    pub failed: bool,
    pub event_count: usize,
    pub transcript_length: usize,
    pub controls: Vec<CodexActiveTurnControlSmokeControlProof>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexActiveTurnSteerSmokeProof {
    pub source: String,
    pub checked_at: Option<String>,
    pub executed: bool,
    pub ok: bool,
    pub unsupported: bool,
    pub detail: String,
    pub session_started: bool,
    pub turn_id_seen: bool,
    pub steer_sent: bool,
    pub steer_observed: bool,
    pub expected_token_seen: bool,
    pub completed: bool,
    pub failed: bool,
    pub event_count: usize,
    pub transcript_length: usize,
    pub controls: Vec<CodexActiveTurnControlSmokeControlProof>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexTwoPanelSmokePanelProof {
    pub panel_id: String,
    pub session_id: Option<String>,
    pub thread_id: Option<String>,
    pub session_id_seen: bool,
    pub thread_id_seen: bool,
    pub completed: bool,
    pub failed: bool,
    pub expected_token_seen: bool,
    pub foreign_token_seen: bool,
    pub event_count: usize,
    pub transcript_length: usize,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexTwoPanelSmokeProof {
    pub source: String,
    pub checked_at: Option<String>,
    pub executed: bool,
    pub ok: bool,
    pub detail: String,
    pub panel_count: usize,
    pub distinct_session_ids: bool,
    pub distinct_thread_ids: bool,
    pub both_completed: bool,
    pub cross_talk_detected: bool,
    pub panels: Vec<CodexTwoPanelSmokePanelProof>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelSessionReadiness {
    pub source: String,
    pub checked_at: Option<String>,
    pub available: bool,
    pub initialized: bool,
    pub detail: String,
    pub prompt_sent: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelSessionStart {
    pub source: String,
    pub panel_id: String,
    pub session_id: String,
    pub thread_id: String,
    pub started: bool,
    pub auth_status: CodexPanelAuthStatus,
    pub model_catalog: Vec<CodexPanelModelCatalogEntry>,
    pub model_catalog_state: String,
    pub selected_model: Option<String>,
    pub selected_reasoning: String,
    pub permission_mode: String,
    pub sandbox_policy: String,
    pub approval_policy: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelAuthStatus {
    pub state: String,
    pub auth_mode: Option<String>,
    pub plan_type: Option<String>,
    pub requires_openai_auth: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelModelReasoningOption {
    pub reasoning_effort: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelModelCatalogEntry {
    pub id: String,
    pub model: String,
    pub label: String,
    pub hidden: bool,
    pub is_default: bool,
    pub default_reasoning_effort: Option<String>,
    pub supported_reasoning_efforts: Vec<CodexPanelModelReasoningOption>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelProviderSnapshot {
    pub source: String,
    pub checked_at: Option<String>,
    pub auth_status: CodexPanelAuthStatus,
    pub model_catalog: Vec<CodexPanelModelCatalogEntry>,
    pub model_catalog_state: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelThreadSummary {
    pub id: String,
    pub name: Option<String>,
    pub preview: String,
    pub status: String,
    pub model_provider: Option<String>,
    pub created_at: Option<u64>,
    pub updated_at: Option<u64>,
    pub cwd_label: Option<String>,
    pub turn_count: usize,
    pub item_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelThreadListResult {
    pub source: String,
    pub checked_at: Option<String>,
    pub available: bool,
    pub threads: Vec<CodexPanelThreadSummary>,
    pub next_cursor: Option<String>,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelThreadReadResult {
    pub source: String,
    pub checked_at: Option<String>,
    pub available: bool,
    pub thread: Option<CodexPanelThreadSummary>,
    pub transcript_preview: Vec<String>,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelThreadResumeResult {
    pub source: String,
    pub panel_id: String,
    pub session_id: String,
    pub thread_id: String,
    pub resumed: bool,
    pub thread: CodexPanelThreadSummary,
    pub transcript_preview: Vec<String>,
    pub auth_status: CodexPanelAuthStatus,
    pub model_catalog: Vec<CodexPanelModelCatalogEntry>,
    pub model_catalog_state: String,
    pub selected_model: Option<String>,
    pub selected_reasoning: String,
    pub permission_mode: String,
    pub sandbox_policy: String,
    pub approval_policy: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelEvent {
    pub method: String,
    pub event_type: String,
    pub request_id: Option<String>,
    pub thread_id: Option<String>,
    pub turn_id: Option<String>,
    pub item_id: Option<String>,
    pub status: Option<String>,
    pub delta: Option<String>,
    pub message: Option<String>,
    pub summary: Option<String>,
    pub item_type: Option<String>,
    pub item_status: Option<String>,
    pub item_title: Option<String>,
    pub item_detail: Option<String>,
    pub provider_timestamp: Option<String>,
    pub usage_input_tokens: Option<u64>,
    pub usage_output_tokens: Option<u64>,
    pub usage_total_tokens: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelStreamEvent {
    pub source: String,
    pub panel_id: String,
    pub session_id: String,
    pub thread_id: String,
    pub turn_id: Option<String>,
    pub event: CodexPanelEvent,
    pub transcript: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CodexPanelTurnSettings {
    pub(crate) model: Option<String>,
    pub(crate) reasoning_effort: String,
    pub(crate) permission_mode: String,
    pub(crate) sandbox_policy: String,
    pub(crate) approval_policy: String,
    pub(crate) plan_mode: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelTurnResult {
    pub source: String,
    pub panel_id: String,
    pub session_id: String,
    pub thread_id: String,
    pub turn_id: Option<String>,
    pub completed: bool,
    pub interrupted: bool,
    pub failed: bool,
    pub events: Vec<CodexPanelEvent>,
    pub transcript: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelApprovalResponseResult {
    pub source: String,
    pub panel_id: String,
    pub session_id: String,
    pub thread_id: String,
    pub request_id: String,
    pub decision: String,
    pub responded: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelInterruptResult {
    pub source: String,
    pub panel_id: Option<String>,
    pub session_id: Option<String>,
    pub thread_id: Option<String>,
    pub turn_id: Option<String>,
    pub interrupted: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelSteerResult {
    pub source: String,
    pub panel_id: Option<String>,
    pub session_id: Option<String>,
    pub thread_id: Option<String>,
    pub turn_id: Option<String>,
    pub steered: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelCloseResult {
    pub source: String,
    pub panel_id: Option<String>,
    pub closed: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCommandCatalogEntry {
    pub command: String,
    pub label: String,
    pub detail: String,
    pub state: String,
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCommandCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub entries: Vec<ProviderCommandCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSkillCatalogEntry {
    pub id: String,
    pub label: String,
    pub source: String,
    pub trigger: String,
    pub invocation_label: String,
    pub state: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSkillCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub entries: Vec<ProviderSkillCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPluginCatalogEntry {
    pub id: String,
    pub label: String,
    pub source: String,
    pub state: String,
    pub capability: String,
    pub count: usize,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPluginCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub entries: Vec<ProviderPluginCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderMcpCatalogEntry {
    pub id: String,
    pub label: String,
    pub source: String,
    pub state: String,
    pub capability: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderMcpCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub entries: Vec<ProviderMcpCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderAutomationCatalogEntry {
    pub id: String,
    pub label: String,
    pub lifecycle: String,
    pub trigger: String,
    pub approval_posture: String,
    pub state: String,
    pub readiness: String,
    pub setup: bool,
    pub unsupported: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderAutomationCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub provider_state: String,
    pub readiness: String,
    pub setup: bool,
    pub unsupported: bool,
    pub entries: Vec<ProviderAutomationCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPersonalizationCatalogEntry {
    pub id: String,
    pub label: String,
    pub layer: String,
    pub source: String,
    pub privacy_posture: String,
    pub state: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPersonalizationCatalogPreview {
    pub source: String,
    pub checked_at: Option<String>,
    pub provider_state: String,
    pub readiness: String,
    pub setup: bool,
    pub unsupported: bool,
    pub instruction_source_posture: String,
    pub config_source_posture: String,
    pub layer: String,
    pub privacy_posture: String,
    pub entries: Vec<ProviderPersonalizationCatalogEntry>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveActionRunnerRequest {
    pub provider: String,
    pub state: String,
    pub action_label: String,
    pub request_id: String,
    pub requested_timestamp: String,
    pub timeout: Option<u128>,
    pub expiry: Option<String>,
    pub intent: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveActionRunnerResult {
    pub provider: String,
    pub intent: String,
    pub executed: bool,
    pub blocked: bool,
    pub action_label: String,
    pub result_summary: String,
    pub timestamp: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationSourceCategoryPreview {
    pub id: String,
    pub label: String,
    pub status: String,
    pub count: usize,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationSourcePreviewCounts {
    pub accepted: usize,
    pub review_required: usize,
    pub unsupported: usize,
    pub excluded: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationSourcePreview {
    pub source_id: String,
    pub source_label: String,
    pub detected: bool,
    pub safe_location_label: String,
    pub categories: Vec<MigrationSourceCategoryPreview>,
    pub counts: MigrationSourcePreviewCounts,
    pub excluded_secrets_summary: Vec<String>,
    pub safety_note: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitWorkbenchBranchState {
    pub branch: String,
    pub upstream: String,
    pub ahead: usize,
    pub behind: usize,
    pub detached: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitWorkbenchFileChange {
    pub path: String,
    pub original_path: Option<String>,
    pub index_status: String,
    pub worktree_status: String,
    pub groups: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitWorkbenchStatus {
    pub source: String,
    pub checked_at: String,
    pub available: bool,
    pub workspace_path: String,
    pub repository_path: String,
    pub branch: GitWorkbenchBranchState,
    pub files: Vec<GitWorkbenchFileChange>,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitWorkbenchDiff {
    pub source: String,
    pub checked_at: String,
    pub available: bool,
    pub staged: bool,
    pub file_path: String,
    pub diff: String,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitWorkbenchActionResult {
    pub source: String,
    pub checked_at: String,
    pub action: String,
    pub executed: bool,
    pub blocked: bool,
    pub detail: String,
    pub safety: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalPaneTab {
    pub id: String,
    pub title: String,
    pub status: String,
    pub workspace_path: String,
    pub cols: u16,
    pub rows: u16,
    pub output: String,
    pub exit_code: Option<i32>,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalPaneActionResult {
    pub source: String,
    pub checked_at: String,
    pub action: String,
    pub tab: Option<TerminalPaneTab>,
    pub executed: bool,
    pub blocked: bool,
    pub detail: String,
    pub safety: String,
}

mod runtime_bridge {
    const MIGRATION_STATUS_ACCEPTED: &str = "accepted";
    const MIGRATION_STATUS_REVIEW_REQUIRED: &str = "review-required";
    const MIGRATION_STATUS_UNSUPPORTED: &str = "unsupported";
    const MIGRATION_STATUS_EXCLUDED: &str = "excluded";
    const LIVE_ACTION_PROBE_PROVIDER: &str = "terminal";
    const LIVE_ACTION_PROBE_STATE_APPROVED: &str = "approved";
    const LIVE_ACTION_PROBE_INTENT: &str = "terminal-readonly-probe";
    const LIVE_ACTION_PROBE_TOKEN: &str = "STEERBOARD_LIVE_ACTION_PROBE_TOKEN";

    use super::{
        CodexAppServerProbe, CodexAppServerProtocolProbe, CodexCliProbe, CodexExecJsonProbe,
        CodexExecutionProbe, CodexHomeProbe, CodexLiveSmokeProof, CodexPanelCloseResult,
        CodexActiveTurnControlSmokeControlProof, CodexActiveTurnControlSmokeProof,
        CodexActiveTurnSteerSmokeProof,
        CodexLiveControlSmokeMethodProof, CodexLiveControlSmokeProof,
        CodexPanelApprovalResponseResult, CodexPanelAuthStatus, CodexPanelEvent,
        CodexPanelInterruptResult,
        CodexPanelModelCatalogEntry, CodexPanelModelReasoningOption,
        CodexPanelProviderSnapshot, CodexPanelSessionReadiness, CodexPanelSessionStart,
        CodexPanelSteerResult, CodexPanelStreamEvent, CodexPanelThreadListResult,
        CodexPanelThreadReadResult, CodexPanelThreadResumeResult, CodexPanelThreadSummary,
        CodexPanelTurnResult, CodexPanelTurnSettings, CodexTransportProbe,
        CodexTwoPanelSmokePanelProof, CodexTwoPanelSmokeProof,
        LiveActionRunnerRequest, LiveActionRunnerResult, MigrationSourceCategoryPreview,
        MigrationSourcePreview, MigrationSourcePreviewCounts, PermissionApprovalStatus,
        ProviderCommandCatalogEntry, ProviderCommandCatalogPreview, ProviderPluginCatalogEntry,
        ProviderPluginCatalogPreview, ProviderMcpCatalogEntry, ProviderMcpCatalogPreview,
        ProviderSkillCatalogEntry, ProviderSkillCatalogPreview, ProviderAutomationCatalogEntry,
        ProviderAutomationCatalogPreview, ProviderPersonalizationCatalogEntry,
        GitWorkbenchActionResult, GitWorkbenchBranchState, GitWorkbenchDiff,
        GitWorkbenchFileChange, GitWorkbenchStatus, ProviderPersonalizationCatalogPreview,
        RuntimeBridgeStatus, TerminalPaneActionResult, TerminalPaneTab,
    };
    use serde_json::Value;
    use std::collections::{BTreeMap, BTreeSet};
    use std::fs;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::path::{Path, PathBuf};
    use std::process::{Command, Stdio};
    use std::sync::atomic::{AtomicI64, Ordering};
    use std::sync::mpsc;
    use std::sync::{Arc, Mutex, OnceLock};
    use std::thread;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    use tauri::Emitter;

    static PANEL_SESSIONS: OnceLock<Mutex<BTreeMap<String, Arc<CodexPanelSession>>>> =
        OnceLock::new();
    static TERMINAL_SESSIONS: OnceLock<Mutex<BTreeMap<String, Arc<Mutex<TerminalPaneSession>>>>> =
        OnceLock::new();
    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    const PANEL_TURN_TIMEOUT_SECS: u64 = 60;
    const TERMINAL_OUTPUT_LIMIT: usize = 30_000;

    struct TerminalPaneSession {
        id: String,
        title: String,
        workspace_path: PathBuf,
        child: Option<std::process::Child>,
        stdin: Option<std::process::ChildStdin>,
        output: Arc<Mutex<String>>,
        status: String,
        exit_code: Option<i32>,
        cols: u16,
        rows: u16,
        updated_at: String,
    }

    fn migration_category(
        id: &str,
        label: &str,
        status: &str,
        count: usize,
        reason: &str,
    ) -> MigrationSourceCategoryPreview {
        MigrationSourceCategoryPreview {
            id: id.to_string(),
            label: label.to_string(),
            status: status.to_string(),
            count,
            reason: reason.to_string(),
        }
    }

    fn migration_counts(
        categories: &[MigrationSourceCategoryPreview],
    ) -> MigrationSourcePreviewCounts {
        let mut counts = MigrationSourcePreviewCounts {
            accepted: 0,
            review_required: 0,
            unsupported: 0,
            excluded: 0,
        };

        for category in categories {
            match category.status.as_str() {
                MIGRATION_STATUS_ACCEPTED => counts.accepted += 1,
                MIGRATION_STATUS_REVIEW_REQUIRED => counts.review_required += 1,
                MIGRATION_STATUS_UNSUPPORTED => counts.unsupported += 1,
                MIGRATION_STATUS_EXCLUDED => counts.excluded += 1,
                _ => {}
            }
        }

        counts
    }

    fn parse_millis_timestamp(raw: &str) -> Option<u128> {
        raw.trim().parse::<u128>().ok()
    }

    fn blocked_live_action_result(
        request: &LiveActionRunnerRequest,
        reason: &str,
    ) -> LiveActionRunnerResult {
        LiveActionRunnerResult {
            provider: request.provider.clone(),
            intent: request.intent.clone(),
            executed: false,
            blocked: true,
            action_label: request.action_label.clone(),
            result_summary: reason.to_string(),
            timestamp: current_timestamp(),
            safety: "Action blocked by policy: process execution was not started.".to_string(),
        }
    }

    fn execute_readonly_probe_command() -> Result<String, String> {
        #[cfg(windows)]
        let output = {
            let mut command = Command::new("cmd");
            hide_command_window(&mut command);
            command.args(["/C", "echo", LIVE_ACTION_PROBE_TOKEN]).output()
        };

        #[cfg(not(windows))]
        let output = Command::new("printf").arg(LIVE_ACTION_PROBE_TOKEN).output();

        let output = output.map_err(|error| error.to_string())?;
        if !output.status.success() {
            return Err(format!(
                "terminal probe exited with status: {}",
                output.status.code().unwrap_or(-1)
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(stdout)
    }

    #[cfg(windows)]
    fn hide_command_window(command: &mut Command) {
        command.creation_flags(CREATE_NO_WINDOW);
    }

    struct GitRepositoryBoundary {
        workspace_path: PathBuf,
        repository_path: PathBuf,
    }

    fn resolve_git_repository(workspace_path: Option<String>) -> Result<GitRepositoryBoundary, String> {
        let enforce_workspace_boundary = workspace_path
            .as_ref()
            .map(|raw| !raw.trim().is_empty())
            .unwrap_or(false);
        let workspace = match workspace_path {
            Some(raw) if !raw.trim().is_empty() => PathBuf::from(raw.trim()),
            _ => std::env::current_dir().map_err(|error| format!("git_workbench_cwd_failed:{error}"))?,
        };
        let workspace_path = workspace
            .canonicalize()
            .map_err(|error| format!("git_workbench_workspace_unavailable:{}", error.kind()))?;
        let output = run_git_command(&workspace_path, &["rev-parse", "--show-toplevel"])?;
        let repository_path = PathBuf::from(output.trim())
            .canonicalize()
            .map_err(|error| format!("git_workbench_repository_unavailable:{}", error.kind()))?;

        if enforce_workspace_boundary
            && !repository_path.starts_with(&workspace_path)
            && repository_path != workspace_path
        {
            return Err("blocked_repository_outside_workspace_boundary".to_string());
        }

        Ok(GitRepositoryBoundary {
            workspace_path,
            repository_path,
        })
    }

    fn run_git_command(cwd: &Path, args: &[&str]) -> Result<String, String> {
        let mut command = Command::new("git");
        command.current_dir(cwd);
        command.args(args);
        #[cfg(windows)]
        hide_command_window(&mut command);
        let output = command
            .output()
            .map_err(|error| format!("git_workbench_command_failed:{error}"))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let detail = if !stderr.is_empty() { stderr } else { stdout };
            return Err(format!(
                "git_exited_{}:{}",
                output.status.code().unwrap_or(-1),
                compact_git_output(&detail, "Git command failed.")
            ));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    fn parse_git_porcelain_status(
        output: &str,
    ) -> (GitWorkbenchBranchState, Vec<GitWorkbenchFileChange>) {
        let mut branch = GitWorkbenchBranchState {
            branch: "unknown".to_string(),
            upstream: "".to_string(),
            ahead: 0,
            behind: 0,
            detached: false,
        };
        let mut files = Vec::new();

        for line in output.lines() {
            if let Some(head) = line.strip_prefix("# branch.head ") {
                let head = head.trim();
                branch.detached = head == "(detached)";
                branch.branch = if branch.detached {
                    "detached".to_string()
                } else {
                    head.to_string()
                };
            } else if let Some(upstream) = line.strip_prefix("# branch.upstream ") {
                branch.upstream = upstream.trim().to_string();
            } else if let Some(ab) = line.strip_prefix("# branch.ab ") {
                let mut parts = ab.split_whitespace();
                branch.ahead = parts
                    .next()
                    .and_then(|value| value.strip_prefix('+'))
                    .and_then(|value| value.parse::<usize>().ok())
                    .unwrap_or(0);
                branch.behind = parts
                    .next()
                    .and_then(|value| value.strip_prefix('-'))
                    .and_then(|value| value.parse::<usize>().ok())
                    .unwrap_or(0);
            } else if let Some(file) = parse_git_porcelain_file(line) {
                files.push(file);
            }
        }

        (branch, files)
    }

    fn parse_git_porcelain_file(line: &str) -> Option<GitWorkbenchFileChange> {
        if let Some(path) = line.strip_prefix("? ") {
            return Some(GitWorkbenchFileChange {
                path: path.trim().to_string(),
                original_path: None,
                index_status: "?".to_string(),
                worktree_status: "?".to_string(),
                groups: vec!["untracked".to_string()],
            });
        }

        if !line.starts_with("1 ") && !line.starts_with("2 ") {
            return None;
        }

        let parts: Vec<&str> = line.split(' ').collect();
        let status = parts.get(1).copied().unwrap_or("..");
        let index_status = status.chars().next().unwrap_or('.').to_string();
        let worktree_status = status.chars().nth(1).unwrap_or('.').to_string();
        let path_field = if line.starts_with("2 ") {
            parts.get(9..).unwrap_or(&[]).join(" ")
        } else {
            parts.get(8..).unwrap_or(&[]).join(" ")
        };
        let mut path_parts = path_field.split('\t');
        let original_path = if line.starts_with("2 ") {
            path_parts.next().map(|value| value.trim().to_string())
        } else {
            None
        };
        let path = if line.starts_with("2 ") {
            path_parts.next().unwrap_or("").trim().to_string()
        } else {
            path_field.trim().to_string()
        };
        let mut groups = Vec::new();
        if index_status != "." && index_status != "?" {
            groups.push("staged".to_string());
        }
        if worktree_status != "." && worktree_status != "?" {
            groups.push("unstaged".to_string());
        }

        Some(GitWorkbenchFileChange {
            path,
            original_path: original_path.filter(|value| !value.is_empty()),
            index_status,
            worktree_status,
            groups,
        })
    }

    fn sanitize_git_relative_path(path: &str) -> Result<String, String> {
        let trimmed = path.trim();
        if trimmed.is_empty()
            || trimmed.contains('\0')
            || trimmed.starts_with('/')
            || trimmed.starts_with('\\')
            || trimmed.contains("..")
            || Path::new(trimmed).is_absolute()
        {
            return Err("blocked_invalid_git_path".to_string());
        }

        Ok(trimmed.replace('\\', "/"))
    }

    fn sanitize_git_commit_message(message: &str) -> Result<String, String> {
        let trimmed = message.trim();
        if trimmed.is_empty() {
            return Err("blocked_empty_commit_message".to_string());
        }
        if trimmed.contains('\0') {
            return Err("blocked_invalid_commit_message".to_string());
        }

        Ok(trimmed.lines().next().unwrap_or(trimmed).chars().take(200).collect())
    }

    fn compact_git_output(output: &str, fallback: &str) -> String {
        let compacted = output
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ");
        if compacted.is_empty() {
            fallback.to_string()
        } else {
            compacted.chars().take(500).collect()
        }
    }

    fn blocked_git_workbench_action(action: &str, detail: &str) -> GitWorkbenchActionResult {
        GitWorkbenchActionResult {
            source: "desktop".to_string(),
            checked_at: current_timestamp(),
            action: action.to_string(),
            executed: false,
            blocked: true,
            detail: detail.to_string(),
            safety: "Git mutation was blocked before any Git process was started.".to_string(),
        }
    }

    fn terminal_sessions(
    ) -> &'static Mutex<BTreeMap<String, Arc<Mutex<TerminalPaneSession>>>> {
        TERMINAL_SESSIONS.get_or_init(|| Mutex::new(BTreeMap::new()))
    }

    fn create_terminal_pane(cols: u16, rows: u16) -> Result<TerminalPaneActionResult, String> {
        let workspace_path = std::env::current_dir()
            .map_err(|error| format!("terminal_pane_cwd_failed:{error}"))?
            .canonicalize()
            .map_err(|error| format!("terminal_pane_workspace_unavailable:{}", error.kind()))?;
        let id = format!("terminal-{}", timestamp_millis());
        let output_buffer = Arc::new(Mutex::new(String::new()));

        #[cfg(windows)]
        let mut command = {
            let mut command = Command::new("cmd.exe");
            hide_command_window(&mut command);
            command.args(["/Q", "/K"]);
            command
        };

        #[cfg(not(windows))]
        let mut command = Command::new(std::env::var("SHELL").unwrap_or_else(|_| "sh".to_string()));

        command.current_dir(&workspace_path);
        command.stdin(Stdio::piped());
        command.stdout(Stdio::piped());
        command.stderr(Stdio::piped());

        let mut child = command
            .spawn()
            .map_err(|error| format!("terminal_spawn_failed:{error}"))?;
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let stdin = child.stdin.take();

        if let Some(stdout) = stdout {
            spawn_terminal_reader(stdout, Arc::clone(&output_buffer));
        }
        if let Some(stderr) = stderr {
            spawn_terminal_reader(stderr, Arc::clone(&output_buffer));
        }

        let mut session = TerminalPaneSession {
            id: id.clone(),
            title: format!("Terminal {}", terminal_sessions().lock().unwrap().len() + 1),
            workspace_path,
            child: Some(child),
            stdin,
            output: output_buffer,
            status: "running".to_string(),
            exit_code: None,
            cols: cols.clamp(20, 300),
            rows: rows.clamp(5, 120),
            updated_at: current_timestamp(),
        };
        let tab = terminal_tab_snapshot(&mut session);
        terminal_sessions()
            .lock()
            .unwrap()
            .insert(id, Arc::new(Mutex::new(session)));

        Ok(terminal_action_result(
            "create",
            Some(tab),
            true,
            false,
            "Terminal created.",
            "Local shell process started after visible approval posture was supplied.",
        ))
    }

    fn spawn_terminal_reader<R: Read + Send + 'static>(reader: R, output: Arc<Mutex<String>>) {
        thread::spawn(move || {
            let mut reader = BufReader::new(reader);
            let mut buffer = [0_u8; 1024];
            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => break,
                    Ok(count) => append_terminal_output(
                        &output,
                        &String::from_utf8_lossy(&buffer[..count]),
                    ),
                    Err(_) => break,
                }
            }
        });
    }

    fn append_terminal_output(output: &Arc<Mutex<String>>, chunk: &str) {
        let mut buffer = output.lock().unwrap();
        buffer.push_str(chunk);
        if buffer.len() > TERMINAL_OUTPUT_LIMIT {
            let keep_from = buffer.len().saturating_sub(TERMINAL_OUTPUT_LIMIT);
            *buffer = buffer[keep_from..].to_string();
        }
    }

    fn require_terminal_tab_id(tab_id: Option<String>) -> Result<String, String> {
        let tab_id = tab_id.unwrap_or_default();
        if tab_id.trim().is_empty() {
            return Err("missing_terminal_id".to_string());
        }

        Ok(tab_id.trim().to_string())
    }

    fn with_terminal_session<F>(tab_id: &str, callback: F) -> Result<TerminalPaneActionResult, String>
    where
        F: FnOnce(&mut TerminalPaneSession) -> TerminalPaneActionResult,
    {
        let sessions = terminal_sessions();
        let session = sessions
            .lock()
            .unwrap()
            .get(tab_id)
            .cloned()
            .ok_or_else(|| "missing_terminal_id".to_string())?;
        let mut session = session.lock().unwrap();
        Ok(callback(&mut session))
    }

    fn destroy_terminal_pane(tab_id: &str) -> Result<TerminalPaneActionResult, String> {
        let session = terminal_sessions()
            .lock()
            .unwrap()
            .remove(tab_id)
            .ok_or_else(|| "missing_terminal_id".to_string())?;
        let mut session = session.lock().unwrap();
        if let Some(child) = session.child.as_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }
        session.status = "destroyed".to_string();
        session.stdin = None;
        session.child = None;
        session.updated_at = current_timestamp();
        Ok(terminal_action_result(
            "destroy",
            Some(terminal_tab_snapshot(&mut session)),
            true,
            false,
            "Terminal destroyed.",
            "Shell process was stopped and removed after approval.",
        ))
    }

    fn refresh_terminal_exit(session: &mut TerminalPaneSession) {
        if session.status != "running" {
            return;
        }

        if let Some(child) = session.child.as_mut() {
            if let Ok(Some(status)) = child.try_wait() {
                session.status = "exited".to_string();
                session.exit_code = status.code();
                session.stdin = None;
                session.updated_at = current_timestamp();
            }
        }
    }

    fn terminal_tab_snapshot(session: &mut TerminalPaneSession) -> TerminalPaneTab {
        refresh_terminal_exit(session);
        TerminalPaneTab {
            id: session.id.clone(),
            title: session.title.clone(),
            status: session.status.clone(),
            workspace_path: session.workspace_path.display().to_string(),
            cols: session.cols,
            rows: session.rows,
            output: session.output.lock().unwrap().clone(),
            exit_code: session.exit_code,
            updated_at: session.updated_at.clone(),
        }
    }

    fn terminal_action_result(
        action: &str,
        tab: Option<TerminalPaneTab>,
        executed: bool,
        blocked: bool,
        detail: &str,
        safety: &str,
    ) -> TerminalPaneActionResult {
        TerminalPaneActionResult {
            source: "desktop".to_string(),
            checked_at: current_timestamp(),
            action: action.to_string(),
            tab,
            executed,
            blocked,
            detail: detail.to_string(),
            safety: safety.to_string(),
        }
    }

    fn blocked_terminal_pane_action(action: &str, detail: &str) -> TerminalPaneActionResult {
        terminal_action_result(
            action,
            None,
            false,
            true,
            detail,
            "Terminal action was blocked before any shell process was started or written.",
        )
    }

    pub(crate) fn read_phase3_local_artifact_from(
        base_dir: &std::path::Path,
        artifact_name: &str,
    ) -> Result<String, String> {
        if artifact_name.contains('/')
            || artifact_name.contains('\\')
            || artifact_name.contains("..")
            || !artifact_name.ends_with(".json")
        {
            return Err("blocked_invalid_phase3_artifact_name".to_string());
        }

        let artifact_path = base_dir.join("local_private").join(artifact_name);
        std::fs::read_to_string(&artifact_path).map_err(|error| {
            format!(
                "phase3_artifact_read_failed:{}:{}",
                artifact_name,
                error.kind()
            )
        })
    }

    fn read_phase3_local_artifact(artifact_name: &str) -> Result<String, String> {
        let base_dir = std::env::current_dir()
            .map_err(|error| format!("phase3_artifact_cwd_failed:{error}"))?;
        read_phase3_local_artifact_from(&base_dir, artifact_name)
    }

    #[tauri::command]
    pub fn phase3_command_validation_artifact_read() -> Result<String, String> {
        read_phase3_local_artifact("phase3-command-validation-record.json")
    }

    #[tauri::command]
    pub fn phase3_smoke_proof_bundle_artifact_read() -> Result<String, String> {
        read_phase3_local_artifact("phase3-smoke-proof-bundle.json")
    }

    #[tauri::command]
    pub fn phase3_panel_evidence_artifact_read() -> Result<String, String> {
        read_phase3_local_artifact("phase3-panel-evidence-record.json")
    }

    #[tauri::command]
    pub fn phase4_provider_review_artifact_read() -> Result<String, String> {
        read_phase3_local_artifact("phase4-provider-review-artifact.json")
    }

    #[tauri::command]
    pub fn live_action_runner_execute(request: LiveActionRunnerRequest) -> LiveActionRunnerResult {
        let requested_timestamp = match parse_millis_timestamp(&request.requested_timestamp) {
            Some(value) => value,
            None => {
                return blocked_live_action_result(&request, "blocked_invalid_requested_timestamp");
            }
        };

        let provider = request.provider.trim().to_lowercase();
        if provider != LIVE_ACTION_PROBE_PROVIDER {
            return blocked_live_action_result(&request, "blocked_unsupported_provider");
        }

        let state = request.state.trim().to_lowercase();
        if state != LIVE_ACTION_PROBE_STATE_APPROVED {
            return blocked_live_action_result(&request, "blocked_request_state_not_approved");
        }

        let intent = request.intent.trim().to_lowercase();
        if intent != LIVE_ACTION_PROBE_INTENT {
            return blocked_live_action_result(&request, "blocked_unsupported_intent");
        }

        let expiry_timestamp = match request.expiry.as_deref() {
            Some(raw) => match parse_millis_timestamp(raw) {
                Some(value) => Some(value),
                None => {
                    return blocked_live_action_result(&request, "blocked_invalid_expiry_timestamp")
                }
            },
            None => request
                .timeout
                .and_then(|timeout| requested_timestamp.checked_add(timeout)),
        };

        let Some(expiry_timestamp) = expiry_timestamp else {
            return blocked_live_action_result(&request, "blocked_missing_expiry");
        };

        if timestamp_millis() >= expiry_timestamp {
            return blocked_live_action_result(&request, "blocked_expired");
        }

        let result_summary = match execute_readonly_probe_command() {
            Ok(value) => value,
            Err(error) => {
                return LiveActionRunnerResult {
                    provider,
                    intent: request.intent,
                    executed: false,
                    blocked: true,
                    action_label: request.action_label,
                    result_summary: format!("blocked_probe_execution_error:{error}"),
                    timestamp: current_timestamp(),
                    safety: "Terminal command execution failed; no arbitrary command was used."
                        .to_string(),
                };
            }
        };

        LiveActionRunnerResult {
            provider,
            intent,
            executed: true,
            blocked: false,
            action_label: request.action_label,
            result_summary,
            timestamp: current_timestamp(),
            safety: "Executed fixed terminal read-only probe command for audit trail.".to_string(),
        }
    }

    #[tauri::command]
    pub fn git_workbench_status(workspace_path: Option<String>) -> Result<GitWorkbenchStatus, String> {
        let repository = resolve_git_repository(workspace_path)?;
        let output = run_git_command(
            &repository.repository_path,
            &["status", "--porcelain=v2", "--branch"],
        )?;
        let (branch, files) = parse_git_porcelain_status(&output);
        let changed_count = files.len();

        Ok(GitWorkbenchStatus {
            source: "desktop".to_string(),
            checked_at: current_timestamp(),
            available: true,
            workspace_path: repository.workspace_path.display().to_string(),
            repository_path: repository.repository_path.display().to_string(),
            branch,
            files,
            detail: format!("{changed_count} changed files detected."),
            safety: "Read-only Git status; repository discovery stayed within the selected workspace boundary.".to_string(),
        })
    }

    #[tauri::command]
    pub fn git_workbench_diff(
        workspace_path: Option<String>,
        file_path: String,
        staged: bool,
    ) -> Result<GitWorkbenchDiff, String> {
        let repository = resolve_git_repository(workspace_path)?;
        let safe_file_path = sanitize_git_relative_path(&file_path)?;
        let mut args = vec!["diff"];
        if staged {
            args.push("--cached");
        }
        args.push("--");
        args.push(safe_file_path.as_str());
        let diff = run_git_command(&repository.repository_path, &args)?;

        Ok(GitWorkbenchDiff {
            source: "desktop".to_string(),
            checked_at: current_timestamp(),
            available: true,
            staged,
            file_path: safe_file_path,
            diff,
            detail: if staged {
                "Loaded staged diff.".to_string()
            } else {
                "Loaded unstaged diff.".to_string()
            },
            safety: "Read-only Git diff; no repository mutation was attempted.".to_string(),
        })
    }

    #[tauri::command]
    pub fn git_workbench_action(
        workspace_path: Option<String>,
        action: String,
        file_path: Option<String>,
        message: Option<String>,
        approval_state: String,
    ) -> Result<GitWorkbenchActionResult, String> {
        let action = action.trim().to_lowercase();
        if approval_state.trim().to_lowercase() != "approved" {
            return Ok(blocked_git_workbench_action(
                &action,
                "blocked_git_approval_required",
            ));
        }

        let repository = resolve_git_repository(workspace_path)?;
        let mut owned_args: Vec<String> = Vec::new();
        match action.as_str() {
            "stage" => {
                owned_args.push("add".to_string());
                owned_args.push("--".to_string());
                owned_args.push(sanitize_git_relative_path(file_path.as_deref().unwrap_or(""))?);
            }
            "unstage" => {
                owned_args.push("restore".to_string());
                owned_args.push("--staged".to_string());
                owned_args.push("--".to_string());
                owned_args.push(sanitize_git_relative_path(file_path.as_deref().unwrap_or(""))?);
            }
            "stage-all" => {
                owned_args.push("add".to_string());
                owned_args.push("-A".to_string());
            }
            "unstage-all" => {
                owned_args.push("restore".to_string());
                owned_args.push("--staged".to_string());
                owned_args.push(".".to_string());
            }
            "commit" => {
                let safe_message = sanitize_git_commit_message(message.as_deref().unwrap_or(""))?;
                owned_args.push("commit".to_string());
                owned_args.push("-m".to_string());
                owned_args.push(safe_message);
            }
            "push" => {
                owned_args.push("push".to_string());
            }
            _ => return Ok(blocked_git_workbench_action(&action, "blocked_unsupported_git_action")),
        }

        let args: Vec<&str> = owned_args.iter().map(String::as_str).collect();
        match run_git_command(&repository.repository_path, &args) {
            Ok(output) => Ok(GitWorkbenchActionResult {
                source: "desktop".to_string(),
                checked_at: current_timestamp(),
                action,
                executed: true,
                blocked: false,
                detail: compact_git_output(&output, "Git action completed."),
                safety: "Git action executed after visible approval posture was supplied.".to_string(),
            }),
            Err(error) => Ok(GitWorkbenchActionResult {
                source: "desktop".to_string(),
                checked_at: current_timestamp(),
                action,
                executed: false,
                blocked: false,
                detail: error,
                safety: "Git returned an error; success was not assumed.".to_string(),
            }),
        }
    }

    #[tauri::command]
    pub fn terminal_pane_action(
        action: String,
        tab_id: Option<String>,
        input: Option<String>,
        cols: Option<u16>,
        rows: Option<u16>,
        approval_state: String,
    ) -> Result<TerminalPaneActionResult, String> {
        let action = action.trim().to_lowercase();
        if action != "snapshot" && approval_state.trim().to_lowercase() != "approved" {
            return Ok(blocked_terminal_pane_action(
                &action,
                "blocked_terminal_approval_required",
            ));
        }

        match action.as_str() {
            "create" => create_terminal_pane(cols.unwrap_or(100), rows.unwrap_or(30)),
            "write" => {
                let tab_id = require_terminal_tab_id(tab_id)?;
                let input = input.unwrap_or_default();
                with_terminal_session(&tab_id, |session| {
                    refresh_terminal_exit(session);
                    if session.status != "running" {
                        return terminal_action_result(
                            "write",
                            Some(terminal_tab_snapshot(session)),
                            false,
                            true,
                            "blocked_terminal_not_running",
                            "Exited terminals do not accept writes.",
                        );
                    }
                    if let Some(stdin) = session.stdin.as_mut() {
                        if let Err(error) = writeln!(stdin, "{input}") {
                            session.status = "exited".to_string();
                            session.updated_at = current_timestamp();
                            return terminal_action_result(
                                "write",
                                Some(terminal_tab_snapshot(session)),
                                false,
                                true,
                                &format!("terminal_write_failed:{error}"),
                                "Terminal write failed; no success was assumed.",
                            );
                        }
                        let _ = stdin.flush();
                    }
                    session.updated_at = current_timestamp();
                    terminal_action_result(
                        "write",
                        Some(terminal_tab_snapshot(session)),
                        true,
                        false,
                        "Terminal input sent.",
                        "Terminal input was sent after visible approval posture was supplied.",
                    )
                })
            }
            "resize" => {
                let tab_id = require_terminal_tab_id(tab_id)?;
                with_terminal_session(&tab_id, |session| {
                    refresh_terminal_exit(session);
                    if session.status != "running" {
                        return terminal_action_result(
                            "resize",
                            Some(terminal_tab_snapshot(session)),
                            false,
                            true,
                            "blocked_terminal_not_running",
                            "Exited terminals do not accept resize updates.",
                        );
                    }
                    session.cols = cols.unwrap_or(session.cols).clamp(20, 300);
                    session.rows = rows.unwrap_or(session.rows).clamp(5, 120);
                    session.updated_at = current_timestamp();
                    terminal_action_result(
                        "resize",
                        Some(terminal_tab_snapshot(session)),
                        true,
                        false,
                        "Terminal resize metadata updated.",
                        "Resize was recorded for the running shell session.",
                    )
                })
            }
            "snapshot" => {
                let tab_id = require_terminal_tab_id(tab_id)?;
                with_terminal_session(&tab_id, |session| {
                    refresh_terminal_exit(session);
                    terminal_action_result(
                        "snapshot",
                        Some(terminal_tab_snapshot(session)),
                        true,
                        false,
                        "Terminal snapshot loaded.",
                        "Snapshot read buffered terminal output only.",
                    )
                })
            }
            "exit" => {
                let tab_id = require_terminal_tab_id(tab_id)?;
                with_terminal_session(&tab_id, |session| {
                    refresh_terminal_exit(session);
                    if session.status == "running" {
                        if let Some(stdin) = session.stdin.as_mut() {
                            let _ = writeln!(stdin, "exit");
                            let _ = stdin.flush();
                        }
                        session.status = "exited".to_string();
                        session.updated_at = current_timestamp();
                    }
                    terminal_action_result(
                        "exit",
                        Some(terminal_tab_snapshot(session)),
                        true,
                        false,
                        "Terminal exit requested.",
                        "Exit request was sent after approval; tab snapshot remains available.",
                    )
                })
            }
            "destroy" => {
                let tab_id = require_terminal_tab_id(tab_id)?;
                destroy_terminal_pane(&tab_id)
            }
            _ => Ok(blocked_terminal_pane_action(&action, "blocked_unsupported_terminal_action")),
        }
    }

    fn codex_safe_location_label() -> String {
        "Default Codex home".to_string()
    }

    fn codex_migration_preview_from_probe(probe: &CodexTransportProbe) -> MigrationSourcePreview {
        let detected =
            probe.cli.available || probe.codex_home.present || probe.app_server.available;

        let categories = vec![
            migration_category(
                "cli",
                "Codex CLI",
                if probe.cli.available {
                    MIGRATION_STATUS_ACCEPTED
                } else {
                    MIGRATION_STATUS_UNSUPPORTED
                },
                if probe.cli.available { 1 } else { 0 },
                if probe.cli.available {
                    "CLI binary was detected on PATH."
                } else {
                    "CLI was not detected; migration will remain metadata-only for unavailable CLI paths."
                },
            ),
            migration_category(
                "config",
                "Codex configuration",
                if probe.codex_home.config_present {
                    MIGRATION_STATUS_ACCEPTED
                } else if detected {
                    MIGRATION_STATUS_REVIEW_REQUIRED
                } else {
                    MIGRATION_STATUS_UNSUPPORTED
                },
                if probe.codex_home.config_present {
                    1
                } else {
                    0
                },
                if probe.codex_home.config_present {
                    "A Codex config file location is present."
                } else {
                    "No config file was detected in metadata scan."
                },
            ),
            migration_category(
                "skills",
                "Skills",
                if probe.codex_home.skills_count > 0 {
                    MIGRATION_STATUS_ACCEPTED
                } else {
                    MIGRATION_STATUS_EXCLUDED
                },
                probe.codex_home.skills_count,
                if probe.codex_home.skills_count > 0 {
                    "Skill metadata can be migrated after review."
                } else {
                    "No metadata-visible skill entries were found."
                },
            ),
            migration_category(
                "plugins",
                "Plugins",
                if probe.codex_home.plugins_present {
                    MIGRATION_STATUS_REVIEW_REQUIRED
                } else {
                    MIGRATION_STATUS_EXCLUDED
                },
                if probe.codex_home.plugins_present {
                    1
                } else {
                    0
                },
                if probe.codex_home.plugins_present {
                    "Plugin manifests are detected and require review before import."
                } else {
                    "No metadata-visible plugin manifests were found."
                },
            ),
            migration_category(
                "app-server",
                "App-server capability",
                if probe.app_server.stdio_handshake {
                    MIGRATION_STATUS_ACCEPTED
                } else if probe.app_server.available {
                    MIGRATION_STATUS_REVIEW_REQUIRED
                } else {
                    MIGRATION_STATUS_UNSUPPORTED
                },
                if probe.app_server.stdio_handshake || probe.app_server.available {
                    1
                } else {
                    0
                },
                if probe.app_server.stdio_handshake {
                    "The app-server stdio handshake is available for adapter-style scanning."
                } else if probe.app_server.available {
                    "App-server help surface is present, but handshake could not be confirmed."
                } else {
                    "App-server capability was not detected in metadata probes."
                },
            ),
            migration_category(
                "mcp",
                "MCP definitions",
                if probe.app_server.protocol.mcp_status {
                    MIGRATION_STATUS_REVIEW_REQUIRED
                } else {
                    MIGRATION_STATUS_UNSUPPORTED
                },
                if probe.app_server.protocol.mcp_status {
                    1
                } else {
                    0
                },
                if probe.app_server.protocol.mcp_status {
                    "MCP capability signatures are available and require review."
                } else {
                    "No MCP definitions were detected in metadata."
                },
            ),
            migration_category(
                "commands",
                "Commands and hooks",
                MIGRATION_STATUS_REVIEW_REQUIRED,
                0,
                "Command-capable features are marked review-required until enabled in Steerboard.",
            ),
            migration_category(
                "secrets",
                "Auth and secrets",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Auth stores are never copied during preview.",
            ),
            migration_category(
                "transcripts",
                "Raw transcripts",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Thread transcripts are excluded from preview payloads by design.",
            ),
            migration_category(
                "browser-state",
                "Browser and cookie state",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Browser state is intentionally excluded from metadata import.",
            ),
        ];

        let counts = migration_counts(&categories);

        MigrationSourcePreview {
            source_id: "codex".to_string(),
            source_label: "Codex".to_string(),
            detected,
            safe_location_label: codex_safe_location_label(),
            counts,
            categories,
            excluded_secrets_summary: vec![
                "Authentication token stores are excluded.".to_string(),
                "Cookies and browser profile state are excluded.".to_string(),
                "Raw transcript data is excluded.".to_string(),
            ],
            safety_note: "Metadata-only preview: this command reads CLI presence, config markers, plugin/signature counts, and capability flags only. No auth files, cookie stores, private transcripts, token files, raw exports, or private source paths are returned.".to_string(),
        }
    }

    fn unsupported_migration_preview(source_id: &str) -> MigrationSourcePreview {
        let categories = vec![
            migration_category(
                "source",
                "Source adapter",
                MIGRATION_STATUS_UNSUPPORTED,
                0,
                "This source type is not supported by the current migration adapter set.",
            ),
            migration_category(
                "projects",
                "Projects and workspaces",
                MIGRATION_STATUS_UNSUPPORTED,
                0,
                "This category has no adapter implementation yet.",
            ),
            migration_category(
                "skills",
                "Skills and prompts",
                MIGRATION_STATUS_UNSUPPORTED,
                0,
                "No parser is available for this source type.",
            ),
            migration_category(
                "plugins",
                "Plugins",
                MIGRATION_STATUS_UNSUPPORTED,
                0,
                "No plugin importer exists for this source type.",
            ),
            migration_category(
                "secrets",
                "Auth and secrets",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Auth stores are excluded from migration previews.",
            ),
            migration_category(
                "transcripts",
                "Raw transcripts",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Raw transcripts are excluded from migration previews.",
            ),
            migration_category(
                "browser-state",
                "Browser and cookie state",
                MIGRATION_STATUS_EXCLUDED,
                0,
                "Browser state is excluded from migration previews.",
            ),
        ];
        let counts = migration_counts(&categories);

        MigrationSourcePreview {
            source_id: source_id.to_string(),
            source_label: if source_id == "auto" {
                "No detected source".to_string()
            } else {
                format!("Unsupported: {}", source_id)
            },
            detected: false,
            safe_location_label: "No local source location detected".to_string(),
            categories,
            counts,
            excluded_secrets_summary: vec![
                "Authentication token stores are excluded.".to_string(),
                "Cookies and browser profile state are excluded.".to_string(),
                "Raw transcript data is excluded.".to_string(),
            ],
            safety_note: "No filesystem reads or process execution occurred for this source in preview mode. Only adapter metadata policy is shown."
                .to_string(),
        }
    }

    fn normalize_source_id(source_id: Option<String>) -> String {
        source_id
            .unwrap_or_else(|| "auto".to_string())
            .trim()
            .to_lowercase()
    }

    pub(crate) fn migration_source_preview_from_probe(
        source_id: Option<String>,
        transport_probe: Option<CodexTransportProbe>,
    ) -> MigrationSourcePreview {
        match normalize_source_id(source_id) {
            source_id if source_id == "codex" || source_id == "auto" || source_id.is_empty() => {
                let transport_probe = transport_probe.unwrap_or_else(codex_transport_probe);
                codex_migration_preview_from_probe(&transport_probe)
            }
            source_id => unsupported_migration_preview(&source_id),
        }
    }

    #[tauri::command]
    pub fn migration_source_preview(source_id: Option<String>) -> MigrationSourcePreview {
        migration_source_preview_from_probe(source_id, Some(codex_transport_probe()))
    }

    #[tauri::command]
    pub fn runtime_bridge_status() -> RuntimeBridgeStatus {
        RuntimeBridgeStatus {
            id: "desktop-runtime-bridge".to_string(),
            label: "Desktop runtime bridge".to_string(),
            state: "locked".to_string(),
            process_execution_available: false,
            workspace_access_available: false,
            detail: "Desktop bridge is reachable; runtime execution is not enabled.".to_string(),
            safety: "No process execution, filesystem access, or network action was performed."
                .to_string(),
        }
    }

    #[tauri::command]
    pub fn runtime_permission_approval_status() -> PermissionApprovalStatus {
        PermissionApprovalStatus {
            id: "desktop-permission-approval".to_string(),
            label: "Desktop permission approval".to_string(),
            state: "locked".to_string(),
            approval_command_available: false,
            permission_granted: false,
            detail: "Desktop permission approval is reachable; permission grants are not enabled."
                .to_string(),
            safety: "No process execution, filesystem access, or network action was performed."
                .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_transport_probe() -> CodexTransportProbe {
        let version_output = run_codex_output(&["--version"]);
        let cli = CodexCliProbe {
            available: version_output.is_some(),
            version: version_output.and_then(|output| first_non_empty_line(&output)),
        };
        let codex_home = read_codex_home_probe();
        let app_server_help = run_codex_output(&["app-server", "--help"]).unwrap_or_default();
        let exec_help = run_codex_output(&["exec", "--help"]).unwrap_or_default();
        let protocol = generate_protocol_probe();
        let handshake = probe_app_server_initialize();
        let app_server = CodexAppServerProbe {
            available: app_server_help.contains("app server")
                || app_server_help.contains("app-server"),
            stdio_handshake: handshake.success,
            daemon_lifecycle: daemon_lifecycle(),
            user_agent: handshake.user_agent,
            platform_os: handshake.platform_os,
            protocol,
        };

        CodexTransportProbe {
            source: "desktop".to_string(),
            checked_at: Some(current_timestamp()),
            cli,
            codex_home,
            app_server,
            exec_json: CodexExecJsonProbe {
                available: exec_help.contains("--json"),
                can_stream_events: exec_help.contains("--json"),
                detail: if exec_help.contains("--json") {
                    "Codex exec JSONL is available for one-shot non-interactive runs.".to_string()
                } else {
                    "Codex exec JSONL was not detected.".to_string()
                },
            },
            execution: CodexExecutionProbe {
                process_execution_allowed: false,
                prompt_execution_allowed: false,
                detail: "Read-only Codex app-server probe: no prompt was sent and execution remains locked."
                    .to_string(),
            },
        }
    }

    fn command_catalog_entry(
        command: &str,
        label: &str,
        detail: &str,
        state: &str,
        scopes: &[&str],
    ) -> ProviderCommandCatalogEntry {
        ProviderCommandCatalogEntry {
            command: command.to_string(),
            label: label.to_string(),
            detail: detail.to_string(),
            state: state.to_string(),
            scopes: scopes.iter().map(|scope| scope.to_string()).collect(),
        }
    }

    pub(crate) fn codex_command_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderCommandCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.app_server.available
            || probe.app_server.stdio_handshake
            || probe.exec_json.available;

        if !provider_detected {
            return ProviderCommandCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                entries: Vec::new(),
                detail: "No provider command capability was detected.".to_string(),
                safety: "Capability refresh did not send prompts, copy credentials, or read raw transcripts."
                    .to_string(),
            };
        }

        let source = if app_server_ready {
            "provider-live"
        } else {
            "provider-preview"
        };
        let live_or_preview = if app_server_ready { "live" } else { "preview" };
        let mcp_state = if probe.app_server.protocol.mcp_status {
            "preview"
        } else {
            "unsupported"
        };

        ProviderCommandCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            entries: vec![
                command_catalog_entry(
                    "/plan",
                    "Plan",
                    if app_server_ready {
                        "Plan against the connected provider session."
                    } else {
                        "Stage a provider-ready plan while live session startup is unavailable."
                    },
                    live_or_preview,
                    &["panel", "app"],
                ),
                command_catalog_entry(
                    "/handoff",
                    "Handoff",
                    if app_server_ready {
                        "Create a scoped handoff for the connected provider runtime."
                    } else {
                        "Draft a handoff locally for review before provider execution."
                    },
                    live_or_preview,
                    &["panel", "global"],
                ),
                command_catalog_entry(
                    "/validate",
                    "Validate",
                    "Prepare validation steps and evidence without running unsafe actions.",
                    "preview",
                    &["panel"],
                ),
                command_catalog_entry(
                    "/summarize",
                    "Summarize",
                    "Summarize the active context without exposing raw transcripts.",
                    "preview",
                    &["panel", "global"],
                ),
                command_catalog_entry(
                    "/status",
                    "Status",
                    if probe.cli.available {
                        "Report provider connection and cockpit readiness from safe metadata."
                    } else {
                        "Status requires a detectable provider runtime."
                    },
                    if probe.cli.available {
                        live_or_preview
                    } else {
                        "unavailable"
                    },
                    &["app", "global"],
                ),
                command_catalog_entry(
                    "/review",
                    "Review",
                    "Collect review signals and keep execution behind approval gates.",
                    "preview",
                    &["panel", "app"],
                ),
                command_catalog_entry(
                    "/mcp",
                    "MCP",
                    if probe.app_server.protocol.mcp_status {
                        "Inspect MCP capability metadata where the provider exposes it."
                    } else {
                        "MCP command metadata is not exposed by this provider capability probe."
                    },
                    mcp_state,
                    &["app", "global"],
                ),
            ],
            detail: if app_server_ready {
                "Provider command catalog refreshed from safe app-server capability metadata."
                    .to_string()
            } else {
                "Provider command catalog refreshed in preview mode from safe runtime metadata."
                    .to_string()
            },
            safety: "Capability refresh did not send prompts, copy credentials, or read raw transcripts."
                .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_command_catalog_preview() -> ProviderCommandCatalogPreview {
        codex_command_catalog_preview_from_probe(codex_transport_probe())
    }

    fn skill_catalog_entry(
        id: &str,
        label: &str,
        source: &str,
        trigger: &str,
        invocation_label: &str,
        state: &str,
        detail: &str,
    ) -> ProviderSkillCatalogEntry {
        ProviderSkillCatalogEntry {
            id: id.to_string(),
            label: label.to_string(),
            source: source.to_string(),
            trigger: trigger.to_string(),
            invocation_label: invocation_label.to_string(),
            state: state.to_string(),
            detail: detail.to_string(),
        }
    }

    pub(crate) fn codex_skill_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderSkillCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.codex_home.present
            || probe.app_server.available
            || probe.exec_json.available;
        let skills_detected = probe.codex_home.skills_count > 0;
        let skills_schema_detected = probe.app_server.protocol.skills_list;

        if !provider_detected {
            return ProviderSkillCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                entries: Vec::new(),
                detail: "No provider skill capability was detected.".to_string(),
                safety:
                    "Skill refresh did not read skill bodies, copy credentials, or expose local paths."
                        .to_string(),
            };
        }

        let source = if app_server_ready && (skills_detected || skills_schema_detected) {
            "provider-live"
        } else {
            "provider-preview"
        };
        let runnable_state = if source == "provider-live" {
            "live"
        } else if skills_detected || skills_schema_detected {
            "preview"
        } else if probe.codex_home.present {
            "setup-required"
        } else {
            "unavailable"
        };

        let mut entries = Vec::new();
        if skills_detected {
            entries.push(skill_catalog_entry(
                "provider-local-skills",
                "Local Skills",
                "builtin",
                "command",
                "Open Skills",
                runnable_state,
                &format!(
                    "{} metadata-visible skill {} detected.",
                    probe.codex_home.skills_count,
                    if probe.codex_home.skills_count == 1 {
                        "entry was"
                    } else {
                        "entries were"
                    }
                ),
            ));
        }

        if skills_schema_detected {
            entries.push(skill_catalog_entry(
                "provider-skills-schema",
                "Provider Skills Schema",
                "api",
                "menu",
                "Inspect Skills",
                if app_server_ready { "preview" } else { "disconnected" },
                "Provider app-server exposes skill-list capability metadata.",
            ));
        }

        if entries.is_empty() && probe.codex_home.present {
            entries.push(skill_catalog_entry(
                "provider-skills-setup",
                "Skills Setup",
                "builtin",
                "menu",
                "Review Setup",
                "setup-required",
                "Provider profile is present, but no metadata-visible skills were detected.",
            ));
        }

        ProviderSkillCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            entries,
            detail: if skills_detected || skills_schema_detected {
                "Provider skill catalog refreshed from safe capability metadata.".to_string()
            } else {
                "Provider skill catalog refreshed in setup mode from safe profile metadata."
                    .to_string()
            },
            safety:
                "Skill refresh did not read skill bodies, copy credentials, or expose local paths."
                    .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_skill_catalog_preview() -> ProviderSkillCatalogPreview {
        codex_skill_catalog_preview_from_probe(codex_transport_probe())
    }

    fn plugin_catalog_entry(
        id: &str,
        label: &str,
        source: &str,
        state: &str,
        capability: &str,
        count: usize,
        detail: &str,
    ) -> ProviderPluginCatalogEntry {
        ProviderPluginCatalogEntry {
            id: id.to_string(),
            label: label.to_string(),
            source: source.to_string(),
            state: state.to_string(),
            capability: capability.to_string(),
            count,
            detail: detail.to_string(),
        }
    }

    pub(crate) fn codex_plugin_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderPluginCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.codex_home.present
            || probe.app_server.available
            || probe.exec_json.available;
        let local_plugins_detected = probe.codex_home.plugins_present;
        let plugin_schema_detected = probe.app_server.protocol.plugin_list;

        if !provider_detected {
            return ProviderPluginCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                entries: Vec::new(),
                detail: "No provider plugin capability was detected.".to_string(),
                safety:
                    "Plugin refresh did not read plugin bodies, copy credentials, or expose local paths."
                        .to_string(),
            };
        }

        let metadata_detected = local_plugins_detected || plugin_schema_detected;
        let source = if app_server_ready && plugin_schema_detected {
            "provider-live"
        } else {
            "provider-preview"
        };
        let runnable_state = if source == "provider-live" {
            "live"
        } else if metadata_detected {
            "preview"
        } else {
            "setup-required"
        };

        let mut entries = Vec::new();
        if local_plugins_detected {
            entries.push(plugin_catalog_entry(
                "provider-local-plugins",
                "Local Plugins",
                "builtin",
                runnable_state,
                "plugin-metadata",
                1,
                "Provider profile reports metadata-visible plugin availability.",
            ));
        }

        if plugin_schema_detected {
            entries.push(plugin_catalog_entry(
                "provider-plugin-schema",
                "Provider Plugin Schema",
                "api",
                if app_server_ready { "live" } else { "preview" },
                "plugin-list",
                1,
                "Provider app-server exposes plugin-list capability metadata.",
            ));
        }

        if entries.is_empty() {
            entries.push(plugin_catalog_entry(
                "provider-plugin-setup",
                "Plugin Setup",
                "builtin",
                "setup-required",
                "provider-profile",
                0,
                "Provider profile is present, but no metadata-visible plugins were detected.",
            ));
        }

        ProviderPluginCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            entries,
            detail: if metadata_detected {
                "Provider plugin catalog refreshed from safe capability metadata.".to_string()
            } else {
                "Provider plugin catalog refreshed in setup mode from safe profile metadata."
                    .to_string()
            },
            safety:
                "Plugin refresh did not read plugin bodies, copy credentials, or expose local paths."
                    .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_plugin_catalog_preview() -> ProviderPluginCatalogPreview {
        codex_plugin_catalog_preview_from_probe(codex_transport_probe())
    }

    fn mcp_catalog_entry(
        id: &str,
        label: &str,
        source: &str,
        state: &str,
        capability: &str,
        detail: &str,
    ) -> ProviderMcpCatalogEntry {
        ProviderMcpCatalogEntry {
            id: id.to_string(),
            label: label.to_string(),
            source: source.to_string(),
            state: state.to_string(),
            capability: capability.to_string(),
            detail: detail.to_string(),
        }
    }

    pub(crate) fn codex_mcp_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderMcpCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.codex_home.present
            || probe.app_server.available
            || probe.exec_json.available;
        let mcp_status_detected = probe.app_server.protocol.mcp_status;

        if !provider_detected {
            return ProviderMcpCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                entries: Vec::new(),
                detail: "No provider MCP capability was detected.".to_string(),
                safety:
                    "MCP refresh did not read MCP config bodies, copy credentials, or expose local paths."
                        .to_string(),
            };
        }

        let source = if app_server_ready && mcp_status_detected {
            "provider-live"
        } else {
            "provider-preview"
        };
        let runnable_state = if source == "provider-live" {
            "live"
        } else if mcp_status_detected {
            "preview"
        } else {
            "setup-required"
        };

        let mut entries = Vec::new();
        if mcp_status_detected {
            entries.push(mcp_catalog_entry(
                "provider-mcp-status",
                "Provider MCP Status",
                "api",
                runnable_state,
                "mcp-status",
                "Provider app-server exposes MCP status capability metadata.",
            ));
        }

        if entries.is_empty() && probe.codex_home.present {
            entries.push(mcp_catalog_entry(
                "provider-mcp-setup",
                "MCP Setup",
                "builtin",
                "setup-required",
                "provider-profile",
                "Provider profile is present, but no metadata-visible MCP status capability was detected.",
            ));
        }

        ProviderMcpCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            entries,
            detail: if mcp_status_detected {
                "Provider MCP catalog refreshed from safe capability metadata.".to_string()
            } else {
                "Provider MCP catalog refreshed in setup mode from safe profile metadata."
                    .to_string()
            },
            safety:
                "MCP refresh did not read MCP config bodies, copy credentials, auth files, raw transcripts, or expose local paths."
                    .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_mcp_catalog_preview() -> ProviderMcpCatalogPreview {
        codex_mcp_catalog_preview_from_probe(codex_transport_probe())
    }

    fn automation_catalog_entry(
        id: &str,
        label: &str,
        lifecycle: &str,
        trigger: &str,
        approval_posture: &str,
        state: &str,
        readiness: &str,
        setup: bool,
        unsupported: bool,
        detail: &str,
    ) -> ProviderAutomationCatalogEntry {
        ProviderAutomationCatalogEntry {
            id: id.to_string(),
            label: label.to_string(),
            lifecycle: lifecycle.to_string(),
            trigger: trigger.to_string(),
            approval_posture: approval_posture.to_string(),
            state: state.to_string(),
            readiness: readiness.to_string(),
            setup,
            unsupported,
            detail: detail.to_string(),
        }
    }

    pub(crate) fn codex_automation_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderAutomationCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.codex_home.present
            || probe.app_server.available
            || probe.exec_json.available;
        let automation_api_detected = probe.app_server.protocol.mcp_status
            || probe.app_server.protocol.skills_list
            || probe.app_server.protocol.plugin_list;

        if !provider_detected {
            return ProviderAutomationCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                provider_state: "absent".to_string(),
                readiness: "unavailable".to_string(),
                setup: false,
                unsupported: true,
                entries: Vec::new(),
                detail: "No provider automation capability was detected.".to_string(),
                safety:
                    "Automation catalog refresh did not read sensitive metadata, tool bodies, transcript content, or private paths."
                        .to_string(),
            };
        }

        let readiness = if app_server_ready && automation_api_detected {
            "ready"
        } else if automation_api_detected {
            "preview"
        } else {
            "setup-required"
        };
        let source = if app_server_ready && automation_api_detected {
            "provider-live"
        } else {
            "provider-preview"
        };
        let setup = readiness == "setup-required";
        let unsupported = readiness == "setup-required";
        let entry_state = if app_server_ready && automation_api_detected {
            "live"
        } else if automation_api_detected {
            "preview"
        } else {
            "setup-required"
        };
        let mut entries = Vec::new();

        if automation_api_detected {
            entries.push(automation_catalog_entry(
                "provider-automation-actions",
                "Automation Actions",
                "active",
                "event",
                "approval-required",
                if setup {
                    "setup-required"
                } else {
                    entry_state
                },
                readiness,
                setup,
                false,
                if app_server_ready {
                    "Automation action catalog metadata is available in this provider session."
                } else {
                    "Automation action capability metadata is present in preview mode."
                },
            ));
        } else {
            entries.push(automation_catalog_entry(
                "provider-automation-setup",
                "Automation Setup",
                "idle",
                "manual",
                "approval-required",
                "setup-required",
                readiness,
                true,
                true,
                "No explicit provider automation API was exposed during metadata probe.",
            ));
        }

        ProviderAutomationCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            provider_state: "present".to_string(),
            readiness: readiness.to_string(),
            setup,
            unsupported,
            entries,
            detail: if automation_api_detected {
                if app_server_ready {
                    "Provider automation catalog refreshed from safe app-server capability metadata."
                        .to_string()
                } else {
                    "Provider automation catalog refreshed in preview mode from safe metadata."
                        .to_string()
                }
            } else {
                "Provider automation API is not explicitly exposed; setup metadata-only snapshot is available."
                    .to_string()
            },
            safety:
                "Automation catalog refresh did not read sensitive metadata, tool bodies, transcript content, or private paths."
                    .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_automation_catalog_preview() -> ProviderAutomationCatalogPreview {
        codex_automation_catalog_preview_from_probe(codex_transport_probe())
    }

    fn personalization_posture_from_config(present: bool) -> (&'static str, &'static str) {
        if present {
            ("local-config", "local-config-file")
        } else {
            ("builtin", "provider-default")
        }
    }

    fn personalization_layer() -> &'static str {
        "governance"
    }

    fn personalization_privacy_posture(auth_present: bool) -> &'static str {
        if auth_present {
            "local-process-only"
        } else {
            "device-only"
        }
    }

    fn personalization_catalog_entry(
        id: &str,
        label: &str,
        layer: &str,
        source: &str,
        privacy_posture: &str,
        state: &str,
        detail: &str,
    ) -> ProviderPersonalizationCatalogEntry {
        ProviderPersonalizationCatalogEntry {
            id: id.to_string(),
            label: label.to_string(),
            layer: layer.to_string(),
            source: source.to_string(),
            privacy_posture: privacy_posture.to_string(),
            state: state.to_string(),
            detail: detail.to_string(),
        }
    }

    pub(crate) fn codex_personalization_catalog_preview_from_probe(
        probe: CodexTransportProbe,
    ) -> ProviderPersonalizationCatalogPreview {
        let panel_protocol_ready = probe.app_server.protocol.thread_start
            && probe.app_server.protocol.turn_start
            && probe.app_server.protocol.agent_message_delta;
        let app_server_ready = probe.app_server.available
            && probe.app_server.stdio_handshake
            && panel_protocol_ready;
        let provider_detected = probe.cli.available
            || probe.codex_home.present
            || probe.app_server.available
            || probe.exec_json.available;
        let personalization_api_detected = probe.app_server.protocol.skills_list
            || probe.app_server.protocol.plugin_list
            || probe.app_server.protocol.mcp_status;

        if !provider_detected {
            return ProviderPersonalizationCatalogPreview {
                source: "unavailable".to_string(),
                checked_at: probe.checked_at,
                provider_state: "absent".to_string(),
                readiness: "unavailable".to_string(),
                setup: false,
                unsupported: true,
                instruction_source_posture: "builtin".to_string(),
                config_source_posture: "provider-default".to_string(),
                layer: personalization_layer().to_string(),
                privacy_posture: "device-only".to_string(),
                entries: Vec::new(),
                detail: "No provider personalization capability was detected.".to_string(),
                safety:
                    "Personalization catalog preview did not read skill bodies, auth files, config bodies, transcript data, or private paths."
                        .to_string(),
            };
        }

        let readiness = if app_server_ready && personalization_api_detected {
            "ready"
        } else if personalization_api_detected {
            "preview"
        } else {
            "setup-required"
        };
        let source = if app_server_ready && personalization_api_detected {
            "provider-live"
        } else {
            "provider-preview"
        };
        let setup = readiness == "setup-required";
        let unsupported = readiness == "setup-required";
        let (instruction_source_posture, config_source_posture) =
            personalization_posture_from_config(probe.codex_home.config_present);
        let entry_state = if app_server_ready && personalization_api_detected {
            "live"
        } else if personalization_api_detected {
            "preview"
        } else {
            "setup-required"
        };
        let entry_source = if probe.codex_home.config_present {
            "user-config"
        } else {
            "builtin"
        };
        let privacy_posture = personalization_privacy_posture(probe.codex_home.auth_present);
        let mut entries = Vec::new();

        if personalization_api_detected {
            entries.push(personalization_catalog_entry(
                "provider-personalization-sources",
                "Provider Personalization Sources",
                personalization_layer(),
                entry_source,
                privacy_posture,
                entry_state,
                if app_server_ready {
                    "Provider exposes safe personalization capability metadata for this session."
                } else {
                    "Provider exposes safe personalization capability metadata in preview mode."
                },
            ));
        } else {
            entries.push(personalization_catalog_entry(
                "provider-personalization-setup",
                "Personalization Setup",
                personalization_layer(),
                entry_source,
                privacy_posture,
                "setup-required",
                "No explicit provider personalization API was exposed during metadata probe.",
            ));
        }

        ProviderPersonalizationCatalogPreview {
            source: source.to_string(),
            checked_at: probe.checked_at,
            provider_state: "present".to_string(),
            readiness: readiness.to_string(),
            setup,
            unsupported,
            instruction_source_posture: instruction_source_posture.to_string(),
            config_source_posture: config_source_posture.to_string(),
            layer: personalization_layer().to_string(),
            privacy_posture: privacy_posture.to_string(),
            entries,
            detail: if personalization_api_detected {
                if app_server_ready {
                    "Provider personalization catalog refreshed from safe metadata in live mode."
                        .to_string()
                } else {
                    "Provider personalization catalog refreshed from safe metadata in preview mode."
                        .to_string()
                }
            } else {
                "No explicit provider personalization API was exposed; preview includes safe provider metadata only."
                    .to_string()
            },
            safety:
                "Personalization catalog preview did not read skill bodies, config bodies, auth content, transcript data, or private paths."
                    .to_string(),
        }
    }

    #[tauri::command]
    pub fn codex_personalization_catalog_preview() -> ProviderPersonalizationCatalogPreview {
        codex_personalization_catalog_preview_from_probe(codex_transport_probe())
    }

    #[tauri::command]
    pub fn codex_transport_live_smoke() -> CodexLiveSmokeProof {
        run_live_smoke()
    }

    #[tauri::command]
    pub fn codex_transport_live_control_smoke() -> CodexLiveControlSmokeProof {
        codex_transport_live_control_smoke_from_probe(codex_transport_probe())
    }

    #[tauri::command]
    pub fn codex_transport_active_turn_control_smoke() -> CodexActiveTurnControlSmokeProof {
        run_active_turn_control_smoke()
    }

    #[tauri::command]
    pub fn codex_transport_active_turn_steer_smoke() -> CodexActiveTurnSteerSmokeProof {
        run_active_turn_steer_smoke()
    }

    #[tauri::command]
    pub fn codex_transport_two_panel_smoke() -> CodexTwoPanelSmokeProof {
        run_two_panel_smoke()
    }

    #[tauri::command]
    pub fn codex_panel_session_readiness() -> CodexPanelSessionReadiness {
        let checked_at = Some(current_timestamp());
        let Ok(mut child) = spawn_codex(&["app-server", "--listen", "stdio://"]) else {
            return CodexPanelSessionReadiness {
                source: "desktop".to_string(),
                checked_at,
                available: false,
                initialized: false,
                detail: "Unable to launch Codex app-server stdio.".to_string(),
                prompt_sent: false,
            };
        };

        let (tx, rx) = mpsc::channel();
        if let Some(stdout) = child.stdout.take() {
            thread::spawn(move || {
                let mut reader = BufReader::new(stdout);
                let mut line = String::new();
                let _ = reader.read_line(&mut line);
                let _ = tx.send(line);
            });
        }
        drain_stderr(&mut child);

        let initialized = send_json(
            &mut child,
            &initialize_request(1, "steerboard-panel-readiness"),
        ) && wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_some();
        cleanup_child(&mut child);

        CodexPanelSessionReadiness {
            source: "desktop".to_string(),
            checked_at,
            available: initialized,
            initialized,
            detail: if initialized {
                "Codex app-server initialized without starting a thread or sending a prompt."
                    .to_string()
            } else {
                "Codex app-server did not complete initialize handshake.".to_string()
            },
            prompt_sent: false,
        }
    }

    #[tauri::command]
    pub fn codex_panel_session_start(
        panel_id: Option<String>,
        model: Option<String>,
        reasoning_effort: Option<String>,
        permission_mode: Option<String>,
    ) -> Result<CodexPanelSessionStart, String> {
        let panel_id = panel_session_key(panel_id);
        let settings = panel_turn_settings(model, reasoning_effort, permission_mode);
        let provider_snapshot = codex_panel_provider_discovery()
            .unwrap_or_else(|detail| fallback_provider_snapshot(Some(detail)));
        if let Some(session) = get_panel_session(&panel_id)? {
            return Ok(CodexPanelSessionStart {
                source: "desktop".to_string(),
                panel_id,
                session_id: session.session_id.clone(),
                thread_id: session.thread_id.clone(),
                started: true,
                auth_status: provider_snapshot.auth_status,
                model_catalog: provider_snapshot.model_catalog,
                model_catalog_state: provider_snapshot.model_catalog_state,
                selected_model: settings.model,
                selected_reasoning: settings.reasoning_effort,
                permission_mode: settings.permission_mode,
                sandbox_policy: settings.sandbox_policy,
                approval_policy: settings.approval_policy,
                detail: "Reused existing Codex panel session for this cockpit panel.".to_string(),
            });
        }

        let session = start_panel_session(&panel_id, &settings)?;
        replace_panel_session(&panel_id, session.clone())?;
        Ok(CodexPanelSessionStart {
            source: "desktop".to_string(),
            panel_id,
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            started: true,
            auth_status: provider_snapshot.auth_status,
            model_catalog: provider_snapshot.model_catalog,
            model_catalog_state: provider_snapshot.model_catalog_state,
            selected_model: settings.model,
            selected_reasoning: settings.reasoning_effort,
            permission_mode: settings.permission_mode,
            sandbox_policy: settings.sandbox_policy,
            approval_policy: settings.approval_policy,
            detail: "Started one ephemeral Codex panel agent session.".to_string(),
        })
    }

    #[tauri::command]
    pub fn codex_panel_provider_discovery() -> Result<CodexPanelProviderSnapshot, String> {
        discover_panel_provider()
    }

    #[tauri::command]
    pub fn codex_panel_thread_list(
        limit: Option<u64>,
        cursor: Option<String>,
        search_term: Option<String>,
    ) -> Result<CodexPanelThreadListResult, String> {
        list_panel_threads(limit, cursor, search_term)
    }

    #[tauri::command]
    pub fn codex_panel_thread_read(thread_id: String) -> Result<CodexPanelThreadReadResult, String> {
        read_panel_thread(thread_id)
    }

    #[tauri::command]
    pub fn codex_panel_thread_resume(
        panel_id: Option<String>,
        thread_id: String,
        model: Option<String>,
        reasoning_effort: Option<String>,
        permission_mode: Option<String>,
    ) -> Result<CodexPanelThreadResumeResult, String> {
        let panel_id = panel_session_key(panel_id);
        let thread_id = thread_id.trim().to_string();
        if thread_id.is_empty() {
            return Err("Thread id is required to resume Codex history.".to_string());
        }
        let settings = panel_turn_settings(model, reasoning_effort, permission_mode);
        let provider_snapshot = codex_panel_provider_discovery()
            .unwrap_or_else(|detail| fallback_provider_snapshot(Some(detail)));
        let (session, thread, transcript_preview) =
            resume_panel_thread_session(&panel_id, &thread_id, &settings)?;
        replace_panel_session(&panel_id, session.clone())?;

        Ok(CodexPanelThreadResumeResult {
            source: "desktop".to_string(),
            panel_id,
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            resumed: true,
            thread,
            transcript_preview,
            auth_status: provider_snapshot.auth_status,
            model_catalog: provider_snapshot.model_catalog,
            model_catalog_state: provider_snapshot.model_catalog_state,
            selected_model: settings.model,
            selected_reasoning: settings.reasoning_effort,
            permission_mode: settings.permission_mode,
            sandbox_policy: settings.sandbox_policy,
            approval_policy: settings.approval_policy,
            detail: "Resumed Codex thread from provider history without replaying local prompts.".to_string(),
        })
    }

    #[tauri::command]
    pub async fn codex_panel_session_send_turn(
        window: tauri::Window,
        panel_id: Option<String>,
        prompt: String,
        model: Option<String>,
        reasoning_effort: Option<String>,
        permission_mode: Option<String>,
        plan_mode: Option<bool>,
    ) -> Result<CodexPanelTurnResult, String> {
        let panel_id = panel_session_key(panel_id);
        let prompt = prompt.trim().to_string();
        if prompt.is_empty() {
            return Err("Prompt is required to send a live panel turn.".to_string());
        }

        let session = get_panel_session(&panel_id)?.ok_or_else(|| {
            "No Codex panel session is active. Start a session before sending a turn.".to_string()
        })?;

        let mut settings = panel_turn_settings(model, reasoning_effort, permission_mode);
        settings.plan_mode = plan_mode.unwrap_or(false);
        tauri::async_runtime::spawn_blocking(move || {
            send_panel_turn(session, prompt, Some(window), settings)
        })
        .await
        .map_err(|error| format!("Codex panel turn worker failed: {error}"))?
    }

    #[tauri::command]
    pub async fn codex_panel_session_retry(
        window: tauri::Window,
        panel_id: Option<String>,
        prompt: String,
        model: Option<String>,
        reasoning_effort: Option<String>,
        permission_mode: Option<String>,
        plan_mode: Option<bool>,
    ) -> Result<CodexPanelTurnResult, String> {
        codex_panel_session_send_turn(
            window,
            panel_id,
            prompt,
            model,
            reasoning_effort,
            permission_mode,
            plan_mode,
        )
        .await
    }

    #[tauri::command]
    pub fn codex_panel_session_interrupt(
        panel_id: Option<String>,
    ) -> Result<CodexPanelInterruptResult, String> {
        let panel_id = panel_session_key(panel_id);
        let Some(session) = get_panel_session(&panel_id)? else {
            return Ok(CodexPanelInterruptResult {
                source: "desktop".to_string(),
                panel_id: Some(panel_id),
                session_id: None,
                thread_id: None,
                turn_id: None,
                interrupted: false,
                detail: "No Codex panel session is active.".to_string(),
            });
        };

        interrupt_panel_turn(&session)
    }

    #[tauri::command]
    pub fn codex_panel_session_steer(
        panel_id: Option<String>,
        message: String,
    ) -> Result<CodexPanelSteerResult, String> {
        let panel_id = panel_session_key(panel_id);
        let message = message.trim().to_string();
        if message.is_empty() {
            return Err("Steer message is required.".to_string());
        }

        let Some(session) = get_panel_session(&panel_id)? else {
            return Ok(CodexPanelSteerResult {
                source: "desktop".to_string(),
                panel_id: Some(panel_id),
                session_id: None,
                thread_id: None,
                turn_id: None,
                steered: false,
                detail: "No Codex panel session is active.".to_string(),
            });
        };

        steer_panel_turn(&session, message)
    }

    #[tauri::command]
    pub fn codex_panel_session_approval_response(
        panel_id: Option<String>,
        request_id: String,
        decision: String,
        approve_for_session: Option<bool>,
    ) -> Result<CodexPanelApprovalResponseResult, String> {
        let panel_id = panel_session_key(panel_id);
        let request_id = request_id.trim().to_string();
        if request_id.is_empty() {
            return Err("Approval request id is required.".to_string());
        }
        let decision = normalize_approval_decision(&decision, approve_for_session.unwrap_or(false))?;
        let Some(session) = get_panel_session(&panel_id)? else {
            return Err("No Codex panel session is active.".to_string());
        };
        let response = approval_response_message(&request_id, &decision);
        if !session.send(&response)? {
            return Err("Unable to write approval response to Codex app-server.".to_string());
        }

        Ok(CodexPanelApprovalResponseResult {
            source: "desktop".to_string(),
            panel_id: session.panel_id.clone(),
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            request_id,
            decision,
            responded: true,
            detail: "Approval response sent to Codex app-server.".to_string(),
        })
    }

    #[tauri::command]
    pub fn codex_panel_session_close(panel_id: Option<String>) -> CodexPanelCloseResult {
        let panel_id = panel_session_key(panel_id);
        let closed = take_panel_session(&panel_id).is_some();
        CodexPanelCloseResult {
            source: "desktop".to_string(),
            panel_id: Some(panel_id),
            closed,
            detail: if closed {
                "Closed Codex panel session and cleaned up the app-server process.".to_string()
            } else {
                "No Codex panel session was active.".to_string()
            },
        }
    }

    struct HandshakeProbe {
        success: bool,
        user_agent: Option<String>,
        platform_os: Option<String>,
    }

    #[derive(Debug, Clone)]
    struct LiveSmokeState {
        thread_id_seen: bool,
        turn_id_seen: bool,
        agent_delta_method_seen: bool,
        turn_completed_seen: bool,
        failed_seen: bool,
        expected_token_seen: bool,
        method_count: usize,
        unique_methods: BTreeSet<String>,
        answer: String,
        detail: String,
    }

    struct CodexPanelSession {
        panel_id: String,
        session_id: String,
        thread_id: String,
        child: Mutex<std::process::Child>,
        rx: Mutex<mpsc::Receiver<String>>,
        next_id: AtomicI64,
        current_turn_id: Mutex<Option<String>>,
    }

    impl Drop for CodexPanelSession {
        fn drop(&mut self) {
            if let Ok(mut child) = self.child.lock() {
                cleanup_child(&mut child);
            }
        }
    }

    impl Default for LiveSmokeState {
        fn default() -> Self {
            Self {
                thread_id_seen: false,
                turn_id_seen: false,
                agent_delta_method_seen: false,
                turn_completed_seen: false,
                failed_seen: false,
                expected_token_seen: false,
                method_count: 0,
                unique_methods: BTreeSet::new(),
                answer: String::new(),
                detail: "Live smoke did not complete.".to_string(),
            }
        }
    }

    fn run_codex_output(args: &[&str]) -> Option<String> {
        #[cfg(windows)]
        let output = {
            let mut command = Command::new("cmd");
            hide_command_window(&mut command);
            command.arg("/C").arg("codex").args(args).output().ok()?
        };

        #[cfg(not(windows))]
        let output = Command::new("codex").args(args).output().ok()?;

        if !output.status.success() {
            return None;
        }

        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    fn spawn_codex(args: &[&str]) -> std::io::Result<std::process::Child> {
        #[cfg(windows)]
        {
            let mut command = Command::new("cmd");
            hide_command_window(&mut command);
            command.arg("/C").arg("codex").args(args);
            command
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
        }

        #[cfg(not(windows))]
        {
            Command::new("codex")
                .args(args)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
        }
    }

    pub(crate) fn initialize_request(id: i64, client_name: &str) -> Value {
        serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": client_name,
                    "version": "0.1.0"
                },
                "capabilities": {
                    "experimentalApi": true
                }
            }
        })
    }

    fn first_non_empty_line(output: &str) -> Option<String> {
        output
            .lines()
            .map(str::trim)
            .find(|line| !line.is_empty())
            .map(ToOwned::to_owned)
    }

    fn codex_home_path() -> PathBuf {
        if let Some(value) = std::env::var_os("CODEX_HOME") {
            return PathBuf::from(value);
        }

        let home = std::env::var_os("USERPROFILE")
            .or_else(|| std::env::var_os("HOME"))
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("."));
        home.join(".codex")
    }

    fn read_codex_home_probe() -> CodexHomeProbe {
        let codex_home = codex_home_path();
        let auth_path = codex_home.join("auth.json");
        let auth_present = auth_path.is_file();
        let auth_contents = if auth_present {
            fs::read_to_string(&auth_path).ok()
        } else {
            None
        };
        let api_key_env_present = std::env::var_os("OPENAI_API_KEY").is_some();
        let (auth_mode, auth_billing, auth_detail) =
            classify_codex_auth(auth_present, auth_contents.as_deref(), api_key_env_present);

        CodexHomeProbe {
            present: codex_home.is_dir(),
            config_present: codex_home.join("config.toml").is_file(),
            auth_present,
            auth_mode,
            auth_billing,
            auth_detail,
            skills_count: count_skill_manifests(&codex_home.join("skills"), 0),
            plugins_present: codex_home.join("plugins").is_dir(),
        }
    }

    pub(super) fn classify_codex_auth(
        auth_present: bool,
        auth_contents: Option<&str>,
        api_key_env_present: bool,
    ) -> (String, String, String) {
        if !auth_present && api_key_env_present {
            return (
                "api-key".to_string(),
                "api-billing".to_string(),
                "API key environment detected; Steerboard will not display or store the key."
                    .to_string(),
            );
        }

        if !auth_present {
            return (
                "missing".to_string(),
                "not-connected".to_string(),
                "No Codex sign-in was detected. Sign in with Codex, then refresh.".to_string(),
            );
        }

        let parsed_auth = auth_contents.and_then(|content| serde_json::from_str::<Value>(content).ok());
        let api_key_marker = parsed_auth.as_ref().is_some_and(|value| {
            json_has_auth_marker(value, &["openaiapikey", "apikey"])
        });
        let chatgpt_marker = parsed_auth.as_ref().is_some_and(|value| {
            json_has_auth_marker(
                value,
                &[
                    "tokens",
                    "accesstoken",
                    "refreshtoken",
                    "idtoken",
                    "accountid",
                    "chatgptaccountid",
                ],
            )
        });

        match (api_key_marker, chatgpt_marker) {
            (true, false) => (
                "api-key".to_string(),
                "api-billing".to_string(),
                "API key sign-in detected; API billing may apply.".to_string(),
            ),
            (false, true) => (
                "chatgpt".to_string(),
                "chatgpt-entitlement".to_string(),
                "ChatGPT/Codex sign-in detected; usage should follow that entitlement."
                    .to_string(),
            ),
            _ => (
                "present-unknown".to_string(),
                "unknown".to_string(),
                "Codex auth is present; sign-in type could not be classified safely.".to_string(),
            ),
        }
    }

    fn json_has_auth_marker(value: &Value, markers: &[&str]) -> bool {
        match value {
            Value::Object(object) => object.iter().any(|(key, child)| {
                let normalized_key = key
                    .chars()
                    .filter(|character| character.is_ascii_alphanumeric())
                    .collect::<String>()
                    .to_ascii_lowercase();
                markers.contains(&normalized_key.as_str()) || json_has_auth_marker(child, markers)
            }),
            Value::Array(items) => items.iter().any(|item| json_has_auth_marker(item, markers)),
            _ => false,
        }
    }

    fn count_skill_manifests(path: &Path, depth: usize) -> usize {
        if depth > 4 || !path.is_dir() {
            return 0;
        }

        let Ok(entries) = fs::read_dir(path) else {
            return 0;
        };

        entries
            .filter_map(Result::ok)
            .map(|entry| {
                let path = entry.path();
                if path.is_file() && path.file_name().is_some_and(|name| name == "SKILL.md") {
                    1
                } else if path.is_dir() {
                    count_skill_manifests(&path, depth + 1)
                } else {
                    0
                }
            })
            .sum()
    }

    fn daemon_lifecycle() -> String {
        #[cfg(windows)]
        {
            "unsupported".to_string()
        }

        #[cfg(not(windows))]
        {
            "available".to_string()
        }
    }

    fn generate_protocol_probe() -> CodexAppServerProtocolProbe {
        let temp_dir =
            std::env::temp_dir().join(format!("steerboard-codex-protocol-{}", timestamp_millis()));
        let _ = fs::create_dir_all(&temp_dir);
        let out_arg = temp_dir.to_string_lossy().to_string();
        let generated = run_codex_output(&[
            "app-server",
            "generate-json-schema",
            "--experimental",
            "--out",
            &out_arg,
        ])
        .is_some();

        let probe = if generated {
            CodexAppServerProtocolProbe {
                thread_start: temp_dir.join("v2").join("ThreadStartParams.json").is_file(),
                turn_start: temp_dir.join("v2").join("TurnStartParams.json").is_file(),
                turn_interrupt: temp_dir
                    .join("v2")
                    .join("TurnInterruptParams.json")
                    .is_file(),
                turn_steer: temp_dir.join("v2").join("TurnSteerParams.json").is_file(),
                agent_message_delta: temp_dir
                    .join("v2")
                    .join("AgentMessageDeltaNotification.json")
                    .is_file(),
                plugin_list: temp_dir.join("v2").join("PluginListParams.json").is_file(),
                mcp_status: temp_dir
                    .join("v2")
                    .join("ListMcpServerStatusResponse.json")
                    .is_file(),
                skills_list: temp_dir.join("v2").join("SkillsListParams.json").is_file(),
            }
        } else {
            CodexAppServerProtocolProbe {
                thread_start: false,
                turn_start: false,
                turn_interrupt: false,
                turn_steer: false,
                agent_message_delta: false,
                plugin_list: false,
                mcp_status: false,
                skills_list: false,
            }
        };

        let _ = fs::remove_dir_all(&temp_dir);
        probe
    }

    fn probe_app_server_initialize() -> HandshakeProbe {
        let Ok(mut child) = spawn_codex(&["app-server", "--listen", "stdio://"]) else {
            return HandshakeProbe {
                success: false,
                user_agent: None,
                platform_os: None,
            };
        };

        let initialize = initialize_request(1, "steerboard-transport-spike");

        if let Some(stdin) = child.stdin.as_mut() {
            let _ = writeln!(stdin, "{initialize}");
        }

        let (tx, rx) = mpsc::channel();
        if let Some(stdout) = child.stdout.take() {
            thread::spawn(move || {
                let mut reader = BufReader::new(stdout);
                let mut line = String::new();
                let _ = reader.read_line(&mut line);
                let _ = tx.send(line);
            });
        }

        let line = rx.recv_timeout(Duration::from_secs(4)).unwrap_or_default();
        let _ = child.kill();
        let _ = child.wait();

        let Ok(value) = serde_json::from_str::<Value>(&line) else {
            return HandshakeProbe {
                success: false,
                user_agent: None,
                platform_os: None,
            };
        };

        let result = value.get("result").and_then(Value::as_object);
        HandshakeProbe {
            success: result.is_some(),
            user_agent: result
                .and_then(|object| object.get("userAgent"))
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
            platform_os: result
                .and_then(|object| object.get("platformOs"))
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
        }
    }

    fn run_live_smoke() -> CodexLiveSmokeProof {
        const EXPECTED_TOKEN: &str = "STEERBOARD_TRANSPORT_OK";
        let checked_at = Some(current_timestamp());
        let Ok(mut child) = spawn_codex(&["app-server", "--listen", "stdio://"]) else {
            return live_smoke_result(
                checked_at,
                false,
                LiveSmokeState {
                    detail: "Unable to launch Codex app-server stdio.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        };

        let (tx, rx) = mpsc::channel();
        if let Some(stdout) = child.stdout.take() {
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines().map_while(Result::ok) {
                    let _ = tx.send(line);
                }
            });
        }

        let initialize = initialize_request(1, "steerboard-live-smoke");

        if !send_json(&mut child, &initialize) {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                false,
                LiveSmokeState {
                    detail: "Unable to write initialize request to Codex app-server.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        }

        if wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_none() {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "Codex app-server did not return initialize response.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        }

        let cwd = std::env::current_dir()
            .ok()
            .map(|path| path.to_string_lossy().to_string());
        let thread_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "thread/start",
            "params": {
                "cwd": cwd,
                "ephemeral": true,
                "approvalPolicy": "never",
                "sandbox": "read-only",
                "baseInstructions": "You are validating a Steerboard transport smoke test. Do not use tools. Answer the user's exact request only.",
                "threadSource": "user"
            }
        });

        if !send_json(&mut child, &thread_start) {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "Unable to write thread/start request.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        }

        let Some(thread_response) = wait_for_json_rpc_id(&rx, 2, Duration::from_secs(12)) else {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "Codex app-server did not return thread/start response.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        };

        let thread_id = thread_response
            .get("result")
            .and_then(|result| result.get("thread"))
            .and_then(|thread| thread.get("id"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);

        let Some(thread_id) = thread_id else {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "thread/start response did not include a thread id.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        };

        let prompt = format!("Reply with exactly this token and nothing else: {EXPECTED_TOKEN}");
        let turn_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "turn/start",
            "params": {
                "threadId": thread_id,
                "input": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ],
                "approvalPolicy": "never",
                "sandboxPolicy": {
                    "type": "readOnly",
                    "networkAccess": false
                },
                "effort": "low"
            }
        });

        if !send_json(&mut child, &turn_start) {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "Unable to write turn/start request.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        }

        let Some(turn_response) = wait_for_json_rpc_id(&rx, 3, Duration::from_secs(15)) else {
            cleanup_child(&mut child);
            return live_smoke_result(
                checked_at,
                true,
                LiveSmokeState {
                    detail: "Codex app-server did not return turn/start response.".to_string(),
                    ..LiveSmokeState::default()
                },
            );
        };

        let mut state = LiveSmokeState {
            thread_id_seen: true,
            turn_id_seen: turn_response
                .get("result")
                .and_then(|result| result.get("turn"))
                .and_then(|turn| turn.get("id"))
                .and_then(Value::as_str)
                .is_some(),
            detail: "Live smoke turn started; waiting for agent delta.".to_string(),
            ..LiveSmokeState::default()
        };

        let deadline = std::time::Instant::now() + Duration::from_secs(90);
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let timeout = remaining.min(Duration::from_millis(500));
            let Ok(line) = rx.recv_timeout(timeout) else {
                continue;
            };
            let Ok(value) = serde_json::from_str::<Value>(&line) else {
                continue;
            };

            observe_live_smoke_event(&mut state, &value, EXPECTED_TOKEN);

            if state.turn_completed_seen || state.failed_seen {
                break;
            }
        }

        state.expected_token_seen = state.answer.contains(EXPECTED_TOKEN);
        state.detail = if state.turn_completed_seen
            && state.agent_delta_method_seen
            && state.expected_token_seen
            && !state.failed_seen
        {
            "Live app-server stdio send/stream smoke passed.".to_string()
        } else if state.failed_seen {
            "Live app-server stdio smoke failed during the turn.".to_string()
        } else {
            "Live app-server stdio smoke timed out before proof completed.".to_string()
        };

        cleanup_child(&mut child);
        live_smoke_result(checked_at, true, state)
    }

    fn codex_control_smoke_method(
        method: &str,
        supported: bool,
        detail: &str,
    ) -> CodexLiveControlSmokeMethodProof {
        CodexLiveControlSmokeMethodProof {
            method: method.to_string(),
            supported,
            state: if supported {
                "supported".to_string()
            } else {
                "unsupported".to_string()
            },
            detail: detail.to_string(),
        }
    }

    fn build_codex_transport_live_control_smoke_from_probe(
        probe: CodexTransportProbe,
    ) -> CodexLiveControlSmokeProof {
        let checked_at = probe.checked_at.clone();
        let source_detected = probe.cli.available
            || probe.codex_home.present
            || probe.codex_home.config_present
            || probe.app_server.available
            || probe.app_server.stdio_handshake
            || probe.exec_json.available;

        let mut required_methods = vec![
            codex_control_smoke_method(
                "thread/start",
                probe.app_server.protocol.thread_start,
                "Thread creation protocol schema is present for control smoke readiness.",
            ),
            codex_control_smoke_method(
                "turn/start",
                probe.app_server.protocol.turn_start,
                "Turn start protocol schema is present for control smoke readiness.",
            ),
            codex_control_smoke_method(
                "turn/interrupt",
                probe.app_server.protocol.turn_interrupt,
                "Turn interrupt protocol schema is present for control smoke readiness.",
            ),
            codex_control_smoke_method(
                "turn/steer",
                probe.app_server.protocol.turn_steer,
                "Turn steer protocol schema is present for control smoke readiness.",
            ),
            codex_control_smoke_method(
                "item/agentMessage/delta",
                probe.app_server.protocol.agent_message_delta,
                "Agent-message delta protocol schema is present for control smoke readiness.",
            ),
        ];

        let total_method_count = required_methods.len();
        let supported_method_count = required_methods
            .iter()
            .filter(|item| item.supported)
            .count();
        let unsupported_method_count = total_method_count - supported_method_count;
        let protocol_ready = unsupported_method_count == 0;
        let app_server_ready = probe.app_server.available && probe.app_server.stdio_handshake;
        let unsupported = !source_detected || !protocol_ready || !app_server_ready;
        let ok = source_detected && app_server_ready && protocol_ready;
        let detail = if !source_detected {
            "No Codex provider control capability was detected.".to_string()
        } else if unsupported {
            if unsupported_method_count == 0 {
                "Codex app-server is not ready for safe control smoke proof in this environment."
                    .to_string()
            } else {
                let unsupported_methods: Vec<&str> = required_methods
                    .iter()
                    .filter(|method| !method.supported)
                    .map(|method| method.method.as_str())
                    .collect();
                format!(
                    "Control smoke proof is unsupported for methods: {}",
                    unsupported_methods.join(", ")
                )
            }
        } else {
            "Codex control protocol metadata is present and consistent with safe control handling."
                .to_string()
        };

        CodexLiveControlSmokeProof {
            source: "desktop".to_string(),
            checked_at,
            executed: true,
            ok,
            unsupported,
            detail,
            source_detected,
            app_server_ready,
            protocol_ready,
            required_methods: {
                required_methods.sort_by_key(|method| method.method.clone());
                required_methods
            },
            supported_method_count,
            unsupported_method_count,
            total_method_count,
        }
    }

    pub(crate) fn codex_transport_live_control_smoke_from_probe(
        probe: CodexTransportProbe,
    ) -> CodexLiveControlSmokeProof {
        build_codex_transport_live_control_smoke_from_probe(probe)
    }

    const ACTIVE_TURN_CONTROL_SMOKE_PANEL_ID: &str = "smoke-active-turn-control";
    const ACTIVE_TURN_CONTROL_SMOKE_PROMPT: &str = "This is a Steerboard active-turn interrupt smoke. Do not use tools. Start a numbered list from 1 to 200, one short neutral word per line.";
    const ACTIVE_TURN_STEER_SMOKE_PANEL_ID: &str = "smoke-active-turn-steer";
    const ACTIVE_TURN_STEER_SMOKE_TOKEN: &str = "STEERBOARD_ACTIVE_TURN_STEER_OK";
    const ACTIVE_TURN_STEER_SMOKE_PROMPT: &str = "This is a Steerboard active-turn steer smoke. Do not use tools. Start a numbered list from 1 to 200, one short neutral word per line. Do not include STEERBOARD_ACTIVE_TURN_STEER_OK unless a later steering instruction asks for it.";
    const ACTIVE_TURN_STEER_SMOKE_MESSAGE: &str =
        "Include exactly this token in your next sentence, then stop: STEERBOARD_ACTIVE_TURN_STEER_OK";

    fn run_active_turn_control_smoke() -> CodexActiveTurnControlSmokeProof {
        let checked_at = Some(current_timestamp());
        let settings = panel_turn_settings(None, None, Some("read-only-agent".to_string()));
        let session = match start_panel_session(ACTIVE_TURN_CONTROL_SMOKE_PANEL_ID, &settings) {
            Ok(session) => session,
            Err(error) => {
                return codex_transport_active_turn_control_smoke_from_values(
                    checked_at,
                    false,
                    false,
                    false,
                    false,
                    vec![CodexActiveTurnControlSmokeControlProof {
                        control: "thread/start".to_string(),
                        attempted: true,
                        sent: false,
                        observed: false,
                        supported: false,
                        detail: error,
                    }],
                    &[],
                );
            }
        };

        let proof = run_active_turn_control_smoke_from_session(session, checked_at);
        proof
    }

    fn run_active_turn_control_smoke_from_session(
        session: Arc<CodexPanelSession>,
        checked_at: Option<String>,
    ) -> CodexActiveTurnControlSmokeProof {
        let mut controls = vec![
            CodexActiveTurnControlSmokeControlProof {
                control: "thread/start".to_string(),
                attempted: true,
                sent: true,
                observed: true,
                supported: true,
                detail: "Started one ephemeral read-only Codex panel session.".to_string(),
            },
            CodexActiveTurnControlSmokeControlProof {
                control: "turn/start".to_string(),
                attempted: true,
                sent: false,
                observed: false,
                supported: false,
                detail: "Preparing to start turn.".to_string(),
            },
            CodexActiveTurnControlSmokeControlProof {
                control: "turn/interrupt".to_string(),
                attempted: false,
                sent: false,
                observed: false,
                supported: false,
                detail: "Preparing to send turn/interrupt.".to_string(),
            },
        ];

        let mut interrupt_sent = false;
        let turn_start_id = session.next_request_id();
        let turn_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": turn_start_id,
            "method": "turn/start",
            "params": {
                "threadId": session.thread_id,
                "input": [
                    {
                        "type": "text",
                        "text": ACTIVE_TURN_CONTROL_SMOKE_PROMPT
                    }
                ],
                "approvalPolicy": "never",
                "sandboxPolicy": {
                    "type": "readOnly",
                    "networkAccess": false
                },
                "effort": "low"
            }
        });

        match session.send(&turn_start) {
            Ok(true) => controls[1].sent = true,
            Ok(false) => {
                controls[1].detail = "Unable to write turn/start request.".to_string();
                return codex_transport_active_turn_control_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
            Err(error) => {
                controls[1].detail = error;
                return codex_transport_active_turn_control_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
        };

        let turn_response = match wait_for_session_json_rpc_id(
            &session,
            turn_start_id,
            Duration::from_secs(12),
        ) {
            Ok(Some(response)) => response,
            Ok(None) => {
                controls[1].detail = "No turn/start response was received.".to_string();
                return codex_transport_active_turn_control_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
            Err(error) => {
                controls[1].detail = error;
                return codex_transport_active_turn_control_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
        };

        let turn_id = extract_turn_id(&turn_response);
        let turn_id_seen = turn_id.is_some();
        controls[1].observed = turn_id_seen;
        controls[1].supported = turn_id_seen;
        controls[1].detail = if turn_id_seen {
            "Received turn id from turn/start response.".to_string()
        } else {
            "turn/start response did not include a turn id.".to_string()
        };
        set_current_turn(&session, turn_id.clone());

        let active_turn_id = turn_id.clone();
        let mut events =
            wait_for_active_turn_stream(&session, active_turn_id.as_deref(), Duration::from_secs(8))
                .unwrap_or_default();
        if let Some(turn_id) = turn_id {
            let interrupt_request_id = session.next_request_id();
            let interrupt = serde_json::json!({
                "jsonrpc": "2.0",
                "id": interrupt_request_id,
                "method": "turn/interrupt",
                "params": {
                    "threadId": session.thread_id,
                    "turnId": turn_id
                }
            });

            controls[2].attempted = true;
            match session.send(&interrupt) {
                Ok(sent) => {
                    controls[2].sent = sent;
                    controls[2].observed = false;
                    controls[2].supported = sent;
                    controls[2].detail = if sent {
                        "Sent turn/interrupt request while turn was active.".to_string()
                    } else {
                        "Unable to write turn/interrupt request.".to_string()
                    };
                    interrupt_sent = sent;
                }
                Err(error) => {
                    controls[2].detail = error;
                    set_current_turn(&session, None);
                    return codex_transport_active_turn_control_smoke_from_values(
                        checked_at,
                        true,
                        true,
                        true,
                        false,
                        controls,
                        &[],
                    );
                }
            };
        }

        let deadline = std::time::Instant::now() + Duration::from_secs(8);
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let value = match recv_session_value(&session, remaining.min(Duration::from_millis(250))) {
                Ok(Some(value)) => value,
                Ok(None) => continue,
                Err(_) => {
                    break;
                }
            };
            let Some(event) = normalize_panel_event(&value) else {
                continue;
            };
            if !event_belongs_to_turn(active_turn_id.as_deref(), &event) {
                continue;
            }
            let terminal_status = event
                .status
                .as_deref()
                .is_some_and(|status| {
                    matches!(status, "completed" | "interrupted" | "failed")
                });
            events.push(value.clone());
            if terminal_status {
                break;
            }
        }
        set_current_turn(&session, None);

        codex_transport_active_turn_control_smoke_from_values(
            checked_at,
            true,
            true,
            turn_id_seen,
            interrupt_sent,
            controls,
            &events,
        )
    }

    fn wait_for_active_turn_stream(
        session: &Arc<CodexPanelSession>,
        active_turn_id: Option<&str>,
        timeout: Duration,
    ) -> Result<Vec<Value>, String> {
        let mut events = Vec::new();
        let deadline = std::time::Instant::now() + timeout;
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let Some(value) =
                recv_session_value(session, remaining.min(Duration::from_millis(250)))?
            else {
                continue;
            };
            let Some(event) = normalize_panel_event(&value) else {
                continue;
            };
            if !event_belongs_to_turn(active_turn_id, &event) {
                continue;
            }
            let stream_ready = event.delta.as_deref().is_some_and(|delta| !delta.is_empty())
                || event.status.as_deref().is_some_and(|status| {
                    matches!(status, "completed" | "interrupted" | "failed")
                });
            events.push(value);
            if stream_ready {
                break;
            }
        }
        Ok(events)
    }

    pub(crate) fn codex_transport_active_turn_control_smoke_from_values(
        checked_at: Option<String>,
        executed: bool,
        session_started: bool,
        turn_id_seen: bool,
        interrupt_sent: bool,
        mut controls: Vec<CodexActiveTurnControlSmokeControlProof>,
        values: &[Value],
    ) -> CodexActiveTurnControlSmokeProof {
        let events: Vec<CodexPanelEvent> = values
            .iter()
            .filter_map(normalize_panel_event)
            .collect();

        let mut completed = false;
        let mut failed = false;
        let mut interrupt_observed = false;
        let mut transcript_length = 0usize;

        for event in &events {
            transcript_length += event.delta.as_ref().map_or(0, |delta| delta.chars().count());
            match event.status.as_deref() {
                Some("completed") => completed = true,
                Some("failed") => failed = true,
                Some("interrupted") => interrupt_observed = true,
                _ => {}
            }
            if panel_event_is_failure(event) {
                failed = true;
            }
        }
        let failure_message = first_failure_message(&events);

        for control in &mut controls {
            match control.control.as_str() {
                "thread/start" => {
                    control.observed = session_started;
                    control.supported = session_started;
                }
                "turn/start" => {
                    control.observed = turn_id_seen;
                    control.supported = turn_id_seen;
                }
                "turn/interrupt" => {
                    control.attempted = control.attempted || interrupt_sent;
                    control.sent = control.sent || interrupt_sent;
                    control.supported = interrupt_sent;
                    control.observed = interrupt_observed;
                }
                _ => {}
            }
        }

        let unsupported = !executed || controls.iter().any(|control| !control.supported);
        let ok = executed && session_started && turn_id_seen && interrupt_sent && !failed;
        let detail = if !executed {
            "Active-turn control smoke could not execute the command."
                .to_string()
        } else if !session_started {
            "No Codex panel session could be started.".to_string()
        } else if !turn_id_seen {
            "Started a Codex session but did not receive a turn id.".to_string()
        } else if !interrupt_sent {
            "Failed to send turn/interrupt while turn was active.".to_string()
        } else if unsupported {
            "Active-turn control smoke was unable to complete required controls.".to_string()
        } else if failed {
            match failure_message {
                Some(message) => format!(
                    "Active-turn control smoke observed a failed event during the turn: {message}"
                ),
                None => "Active-turn control smoke observed a failed event during the turn."
                    .to_string(),
            }
        } else if completed {
            "Active-turn control smoke completed; turn/interrupt did not return an interrupted event.".to_string()
        } else {
            "Active-turn control smoke sent interrupt while monitoring turn lifecycle.".to_string()
        };

        CodexActiveTurnControlSmokeProof {
            source: "desktop".to_string(),
            checked_at,
            executed,
            ok,
            unsupported,
            detail,
            session_started,
            turn_id_seen,
            interrupt_sent,
            interrupt_observed,
            completed,
            failed,
            event_count: events.len(),
            transcript_length,
            controls,
        }
    }

    fn run_active_turn_steer_smoke() -> CodexActiveTurnSteerSmokeProof {
        let checked_at = Some(current_timestamp());
        let settings = panel_turn_settings(None, None, Some("read-only-agent".to_string()));
        let session = match start_panel_session(ACTIVE_TURN_STEER_SMOKE_PANEL_ID, &settings) {
            Ok(session) => session,
            Err(error) => {
                return codex_transport_active_turn_steer_smoke_from_values(
                    checked_at,
                    false,
                    false,
                    false,
                    false,
                    vec![CodexActiveTurnControlSmokeControlProof {
                        control: "thread/start".to_string(),
                        attempted: true,
                        sent: false,
                        observed: false,
                        supported: false,
                        detail: error,
                    }],
                    &[],
                );
            }
        };

        run_active_turn_steer_smoke_from_session(session, checked_at)
    }

    fn run_active_turn_steer_smoke_from_session(
        session: Arc<CodexPanelSession>,
        checked_at: Option<String>,
    ) -> CodexActiveTurnSteerSmokeProof {
        let mut controls = vec![
            CodexActiveTurnControlSmokeControlProof {
                control: "thread/start".to_string(),
                attempted: true,
                sent: true,
                observed: true,
                supported: true,
                detail: "Started one ephemeral read-only Codex panel session.".to_string(),
            },
            CodexActiveTurnControlSmokeControlProof {
                control: "turn/start".to_string(),
                attempted: true,
                sent: false,
                observed: false,
                supported: false,
                detail: "Preparing to start steer smoke turn.".to_string(),
            },
            CodexActiveTurnControlSmokeControlProof {
                control: "turn/steer".to_string(),
                attempted: false,
                sent: false,
                observed: false,
                supported: false,
                detail: "Preparing to send turn/steer.".to_string(),
            },
        ];

        let mut steer_sent = false;
        let turn_start_id = session.next_request_id();
        let turn_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": turn_start_id,
            "method": "turn/start",
            "params": {
                "threadId": session.thread_id,
                "input": [
                    {
                        "type": "text",
                        "text": ACTIVE_TURN_STEER_SMOKE_PROMPT
                    }
                ],
                "approvalPolicy": "never",
                "sandboxPolicy": {
                    "type": "readOnly",
                    "networkAccess": false
                },
                "effort": "low"
            }
        });

        match session.send(&turn_start) {
            Ok(true) => controls[1].sent = true,
            Ok(false) => {
                controls[1].detail = "Unable to write turn/start request.".to_string();
                return codex_transport_active_turn_steer_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
            Err(error) => {
                controls[1].detail = error;
                return codex_transport_active_turn_steer_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
        };

        let turn_response = match wait_for_session_json_rpc_id(
            &session,
            turn_start_id,
            Duration::from_secs(12),
        ) {
            Ok(Some(response)) => response,
            Ok(None) => {
                controls[1].detail = "No turn/start response was received.".to_string();
                return codex_transport_active_turn_steer_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
            Err(error) => {
                controls[1].detail = error;
                return codex_transport_active_turn_steer_smoke_from_values(
                    checked_at,
                    true,
                    true,
                    false,
                    false,
                    controls,
                    &[],
                );
            }
        };

        let turn_id = extract_turn_id(&turn_response);
        let turn_id_seen = turn_id.is_some();
        controls[1].observed = turn_id_seen;
        controls[1].supported = turn_id_seen;
        controls[1].detail = if turn_id_seen {
            "Received turn id from turn/start response.".to_string()
        } else {
            "turn/start response did not include a turn id.".to_string()
        };
        set_current_turn(&session, turn_id.clone());

        let active_turn_id = turn_id.clone();
        let mut events =
            wait_for_active_turn_stream(&session, active_turn_id.as_deref(), Duration::from_secs(8))
                .unwrap_or_default();
        if let Some(turn_id) = turn_id {
            let steer_request_id = session.next_request_id();
            let steer = steer_request(
                steer_request_id,
                &session.thread_id,
                &turn_id,
                ACTIVE_TURN_STEER_SMOKE_MESSAGE,
            );

            controls[2].attempted = true;
            match session.send(&steer) {
                Ok(sent) => {
                    controls[2].sent = sent;
                    controls[2].supported = sent;
                    controls[2].detail = if sent {
                        "Sent turn/steer request while turn was active.".to_string()
                    } else {
                        "Unable to write turn/steer request.".to_string()
                    };
                    steer_sent = sent;
                }
                Err(error) => {
                    controls[2].detail = error;
                    set_current_turn(&session, None);
                    return codex_transport_active_turn_steer_smoke_from_values(
                        checked_at,
                        true,
                        true,
                        true,
                        false,
                        controls,
                        &[],
                    );
                }
            };
        }

        let deadline = std::time::Instant::now() + Duration::from_secs(10);
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let value = match recv_session_value(&session, remaining.min(Duration::from_millis(250))) {
                Ok(Some(value)) => value,
                Ok(None) => continue,
                Err(_) => break,
            };
            let event = normalize_panel_event(&value);
            if event
                .as_ref()
                .is_some_and(|event| !event_belongs_to_turn(active_turn_id.as_deref(), event))
            {
                continue;
            }
            let terminal_status = event
                .as_ref()
                .and_then(|event| event.status.as_deref())
                .is_some_and(|status| matches!(status, "completed" | "interrupted" | "failed"));
            let token_seen = event
                .as_ref()
                .and_then(|event| event.delta.as_deref().or(event.message.as_deref()))
                .is_some_and(|text| text.contains(ACTIVE_TURN_STEER_SMOKE_TOKEN));
            events.push(value);
            if terminal_status || token_seen {
                break;
            }
        }
        set_current_turn(&session, None);

        codex_transport_active_turn_steer_smoke_from_values(
            checked_at,
            true,
            true,
            turn_id_seen,
            steer_sent,
            controls,
            &events,
        )
    }

    pub(crate) fn codex_transport_active_turn_steer_smoke_from_values(
        checked_at: Option<String>,
        executed: bool,
        session_started: bool,
        turn_id_seen: bool,
        steer_sent: bool,
        mut controls: Vec<CodexActiveTurnControlSmokeControlProof>,
        values: &[Value],
    ) -> CodexActiveTurnSteerSmokeProof {
        let events: Vec<CodexPanelEvent> = values
            .iter()
            .filter_map(normalize_panel_event)
            .collect();

        let mut completed = false;
        let mut failed = false;
        let mut expected_token_seen = false;
        let mut transcript_length = 0usize;

        for event in &events {
            if let Some(delta) = event.delta.as_deref() {
                transcript_length += delta.chars().count();
                expected_token_seen =
                    expected_token_seen || delta.contains(ACTIVE_TURN_STEER_SMOKE_TOKEN);
            }
            if let Some(message) = event.message.as_deref() {
                expected_token_seen =
                    expected_token_seen || message.contains(ACTIVE_TURN_STEER_SMOKE_TOKEN);
            }
            match event.status.as_deref() {
                Some("completed") => completed = true,
                Some("failed") => failed = true,
                _ => {}
            }
            if panel_event_is_failure(event) {
                failed = true;
            }
        }
        let failure_message = first_failure_message(&events);

        let steer_observed = expected_token_seen;
        for control in &mut controls {
            match control.control.as_str() {
                "thread/start" => {
                    control.observed = session_started;
                    control.supported = session_started;
                }
                "turn/start" => {
                    control.observed = turn_id_seen;
                    control.supported = turn_id_seen;
                }
                "turn/steer" => {
                    control.attempted = control.attempted || steer_sent;
                    control.sent = control.sent || steer_sent;
                    control.supported = steer_sent;
                    control.observed = steer_observed;
                }
                _ => {}
            }
        }

        let unsupported = !executed || controls.iter().any(|control| !control.supported);
        let ok = executed && session_started && turn_id_seen && steer_sent && !failed;
        let detail = if !executed {
            "Active-turn steer smoke could not execute the command.".to_string()
        } else if !session_started {
            "No Codex panel session could be started.".to_string()
        } else if !turn_id_seen {
            "Started a Codex session but did not receive a turn id.".to_string()
        } else if !steer_sent {
            "Failed to send turn/steer while turn was active.".to_string()
        } else if unsupported {
            "Active-turn steer smoke was unable to complete required controls.".to_string()
        } else if failed {
            match failure_message {
                Some(message) => format!(
                    "Active-turn steer smoke observed a failed event during the turn: {message}"
                ),
                None => "Active-turn steer smoke observed a failed event during the turn.".to_string(),
            }
        } else if steer_observed {
            "Active-turn steer smoke sent steer request and observed the expected token.".to_string()
        } else if completed {
            "Active-turn steer smoke completed before the expected steer token was observed.".to_string()
        } else {
            "Active-turn steer smoke sent steer request while monitoring turn lifecycle.".to_string()
        };

        CodexActiveTurnSteerSmokeProof {
            source: "desktop".to_string(),
            checked_at,
            executed,
            ok,
            unsupported,
            detail,
            session_started,
            turn_id_seen,
            steer_sent,
            steer_observed,
            expected_token_seen,
            completed,
            failed,
            event_count: events.len(),
            transcript_length,
            controls,
        }
    }

    fn run_two_panel_smoke() -> CodexTwoPanelSmokeProof {
        const PANEL_A_ID: &str = "smoke-panel-a";
        const PANEL_A_TOKEN: &str = "STEERBOARD_PANEL_A_OK";
        const PANEL_B_ID: &str = "smoke-panel-b";
        const PANEL_B_TOKEN: &str = "STEERBOARD_PANEL_B_OK";

        let checked_at = Some(current_timestamp());
        let mut panels = Vec::new();

        panels.push(run_two_panel_smoke_panel(
            PANEL_A_ID,
            PANEL_A_TOKEN,
            PANEL_B_TOKEN,
        ));
        panels.push(run_two_panel_smoke_panel(
            PANEL_B_ID,
            PANEL_B_TOKEN,
            PANEL_A_TOKEN,
        ));

        two_panel_smoke_result(checked_at, panels)
    }

    fn run_two_panel_smoke_panel(
        panel_id: &str,
        expected_token: &str,
        foreign_token: &str,
    ) -> CodexTwoPanelSmokePanelProof {
        let settings = panel_turn_settings(None, None, Some("read-only-agent".to_string()));
        let session = match start_panel_session(panel_id, &settings) {
            Ok(session) => session,
            Err(error) => {
                return CodexTwoPanelSmokePanelProof {
                    panel_id: panel_id.to_string(),
                    session_id: None,
                    thread_id: None,
                    session_id_seen: false,
                    thread_id_seen: false,
                    completed: false,
                    failed: true,
                    expected_token_seen: false,
                    foreign_token_seen: false,
                    event_count: 0,
                    transcript_length: 0,
                    detail: error,
                };
            }
        };

        let prompt = format!("Reply with exactly this token and nothing else: {expected_token}");
        match send_panel_turn(session, prompt, None, settings) {
            Ok(result) => two_panel_panel_proof_from_turn(&result, expected_token, foreign_token),
            Err(error) => CodexTwoPanelSmokePanelProof {
                panel_id: panel_id.to_string(),
                session_id: None,
                thread_id: None,
                session_id_seen: false,
                thread_id_seen: false,
                completed: false,
                failed: true,
                expected_token_seen: false,
                foreign_token_seen: false,
                event_count: 0,
                transcript_length: 0,
                detail: error,
            },
        }
    }

    fn two_panel_panel_proof_from_turn(
        result: &CodexPanelTurnResult,
        expected_token: &str,
        foreign_token: &str,
    ) -> CodexTwoPanelSmokePanelProof {
        CodexTwoPanelSmokePanelProof {
            panel_id: result.panel_id.clone(),
            session_id: Some(result.session_id.clone()),
            thread_id: Some(result.thread_id.clone()),
            session_id_seen: !result.session_id.trim().is_empty(),
            thread_id_seen: !result.thread_id.trim().is_empty(),
            completed: result.completed,
            failed: result.failed,
            expected_token_seen: result.transcript.contains(expected_token),
            foreign_token_seen: result.transcript.contains(foreign_token),
            event_count: result.events.len(),
            transcript_length: result.transcript.chars().count(),
            detail: result.detail.clone(),
        }
    }

    pub(crate) fn two_panel_smoke_result(
        checked_at: Option<String>,
        panels: Vec<CodexTwoPanelSmokePanelProof>,
    ) -> CodexTwoPanelSmokeProof {
        let panel_count = panels.len();
        let session_ids: BTreeSet<String> = panels
            .iter()
            .filter_map(|panel| panel.session_id.as_ref())
            .filter(|value| !value.trim().is_empty())
            .cloned()
            .collect();
        let thread_ids: BTreeSet<String> = panels
            .iter()
            .filter_map(|panel| panel.thread_id.as_ref())
            .filter(|value| !value.trim().is_empty())
            .cloned()
            .collect();
        let distinct_session_ids = panel_count == 2 && session_ids.len() == panel_count;
        let distinct_thread_ids = panel_count == 2 && thread_ids.len() == panel_count;
        let both_completed = panel_count == 2 && panels.iter().all(|panel| panel.completed);
        let cross_talk_detected = panels.iter().any(|panel| panel.foreign_token_seen);
        let expected_tokens_seen = panel_count == 2
            && panels.iter().all(|panel| panel.expected_token_seen);
        let failed = panels.iter().any(|panel| panel.failed);
        let ok = panel_count == 2
            && distinct_session_ids
            && distinct_thread_ids
            && both_completed
            && expected_tokens_seen
            && !cross_talk_detected
            && !failed;
        let detail = if ok {
            "Two-panel live smoke passed: both panels completed, saw their own token, and no cross-panel token leak was detected.".to_string()
        } else if cross_talk_detected {
            "Two-panel live smoke failed: cross-panel token leakage was detected.".to_string()
        } else if failed {
            "Two-panel live smoke failed: at least one panel reported a failed turn.".to_string()
        } else {
            "Two-panel live smoke did not prove independent completed panel turns.".to_string()
        };

        CodexTwoPanelSmokeProof {
            source: "desktop".to_string(),
            checked_at,
            executed: panel_count > 0,
            ok,
            detail,
            panel_count,
            distinct_session_ids,
            distinct_thread_ids,
            both_completed,
            cross_talk_detected,
            panels,
        }
    }

    fn start_panel_session(
        panel_id: &str,
        settings: &CodexPanelTurnSettings,
    ) -> Result<Arc<CodexPanelSession>, String> {
        let mut child = spawn_codex(&["app-server", "--listen", "stdio://"])
            .map_err(|_| "Unable to launch Codex app-server stdio.".to_string())?;

        let (tx, rx) = mpsc::channel();
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Codex app-server stdout was not available.".to_string())?;
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                let _ = tx.send(line);
            }
        });
        drain_stderr(&mut child);

        if !send_json(
            &mut child,
            &initialize_request(1, "steerboard-panel-session"),
        ) {
            cleanup_child(&mut child);
            return Err("Unable to write initialize request to Codex app-server.".to_string());
        }

        if wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_none() {
            cleanup_child(&mut child);
            return Err("Codex app-server did not return initialize response.".to_string());
        }

        let cwd = std::env::current_dir()
            .ok()
            .map(|path| path.to_string_lossy().to_string());
        let thread_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "thread/start",
            "params": {
                "cwd": cwd,
                "ephemeral": true,
                "approvalPolicy": settings.approval_policy,
                "sandbox": thread_sandbox_mode(&settings.permission_mode),
                "baseInstructions": panel_permission_base_instructions(&settings.permission_mode),
                "threadSource": "user"
            }
        });

        if !send_json(&mut child, &thread_start) {
            cleanup_child(&mut child);
            return Err("Unable to write thread/start request.".to_string());
        }

        let thread_response = wait_for_json_rpc_id(&rx, 2, Duration::from_secs(12))
            .ok_or_else(|| "Codex app-server did not return thread/start response.".to_string())?;
        let thread_id = extract_thread_id(&thread_response)
            .ok_or_else(|| "thread/start response did not include a thread id.".to_string())?;

        Ok(Arc::new(CodexPanelSession {
            panel_id: panel_id.to_string(),
            session_id: format!("panel-session-{panel_id}-{}", timestamp_millis()),
            thread_id,
            child: Mutex::new(child),
            rx: Mutex::new(rx),
            next_id: AtomicI64::new(3),
            current_turn_id: Mutex::new(None),
        }))
    }

    fn initialized_codex_app_server(
        client_name: &str,
    ) -> Result<(std::process::Child, mpsc::Receiver<String>), String> {
        let mut child = spawn_codex(&["app-server", "--listen", "stdio://"])
            .map_err(|_| "Unable to launch Codex app-server stdio.".to_string())?;

        let (tx, rx) = mpsc::channel();
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Codex app-server stdout was not available.".to_string())?;
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                let _ = tx.send(line);
            }
        });
        drain_stderr(&mut child);

        if !send_json(&mut child, &initialize_request(1, client_name)) {
            cleanup_child(&mut child);
            return Err("Unable to write initialize request to Codex app-server.".to_string());
        }
        if wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_none() {
            cleanup_child(&mut child);
            return Err("Codex app-server did not return initialize response.".to_string());
        }

        Ok((child, rx))
    }

    fn request_initialized_app_server(
        method: &str,
        params: Value,
        client_name: &str,
    ) -> Result<Value, String> {
        let (mut child, rx) = initialized_codex_app_server(client_name)?;
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": method,
            "params": params
        });

        if !send_json(&mut child, &request) {
            cleanup_child(&mut child);
            return Err(format!("Unable to write {method} request."));
        }
        let response = wait_for_json_rpc_id(&rx, 2, Duration::from_secs(15))
            .ok_or_else(|| format!("Codex app-server did not return {method} response."))?;
        cleanup_child(&mut child);
        if let Some(error_message) = json_rpc_error_message(&response) {
            return Err(format!("Codex app-server rejected {method}: {error_message}"));
        }
        Ok(response)
    }

    fn list_panel_threads(
        limit: Option<u64>,
        cursor: Option<String>,
        search_term: Option<String>,
    ) -> Result<CodexPanelThreadListResult, String> {
        let checked_at = Some(current_timestamp());
        let safe_limit = limit.unwrap_or(20).clamp(1, 50);
        let mut params = serde_json::json!({
            "limit": safe_limit,
            "archived": false
        });
        if let Some(cursor) = cursor.map(|value| value.trim().to_string()).filter(|value| !value.is_empty()) {
            params["cursor"] = Value::String(cursor);
        }
        if let Some(search_term) = search_term.map(|value| value.trim().to_string()).filter(|value| !value.is_empty()) {
            params["searchTerm"] = Value::String(search_term);
        }

        let response = request_initialized_app_server(
            "thread/list",
            params,
            "steerboard-panel-thread-list",
        )?;
        let result = response.get("result").unwrap_or(&Value::Null);
        let threads = result
            .get("data")
            .and_then(Value::as_array)
            .map(|items| items.iter().map(sanitize_thread_summary).collect::<Vec<_>>())
            .unwrap_or_default();
        let next_cursor = result
            .get("nextCursor")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);

        Ok(CodexPanelThreadListResult {
            source: "desktop".to_string(),
            checked_at,
            available: true,
            detail: format!(
                "Loaded {} Codex thread{} from provider history.",
                threads.len(),
                if threads.len() == 1 { "" } else { "s" }
            ),
            threads,
            next_cursor,
        })
    }

    fn read_panel_thread(thread_id: String) -> Result<CodexPanelThreadReadResult, String> {
        let checked_at = Some(current_timestamp());
        let thread_id = thread_id.trim().to_string();
        if thread_id.is_empty() {
            return Err("Thread id is required to read Codex history.".to_string());
        }
        let response = request_initialized_app_server(
            "thread/read",
            serde_json::json!({
                "threadId": thread_id,
                "includeTurns": true
            }),
            "steerboard-panel-thread-read",
        )?;
        let thread_value = response
            .get("result")
            .and_then(|result| result.get("thread"))
            .ok_or_else(|| "thread/read response did not include a thread.".to_string())?;
        let thread = sanitize_thread_summary(thread_value);
        let transcript_preview = sanitize_thread_transcript_preview(thread_value);
        Ok(CodexPanelThreadReadResult {
            source: "desktop".to_string(),
            checked_at,
            available: true,
            detail: format!(
                "Read Codex thread {} from provider history; {} turn{} available.",
                thread.id,
                thread.turn_count,
                if thread.turn_count == 1 { "" } else { "s" }
            ),
            thread: Some(thread),
            transcript_preview,
        })
    }

    fn resume_panel_thread_session(
        panel_id: &str,
        thread_id: &str,
        settings: &CodexPanelTurnSettings,
    ) -> Result<(Arc<CodexPanelSession>, CodexPanelThreadSummary, Vec<String>), String> {
        let (mut child, rx) = initialized_codex_app_server("steerboard-panel-thread-resume")?;
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "thread/resume",
            "params": {
                "threadId": thread_id,
                "persistExtendedHistory": false,
                "approvalPolicy": settings.approval_policy,
                "sandbox": thread_sandbox_mode(&settings.permission_mode),
                "baseInstructions": panel_permission_base_instructions(&settings.permission_mode)
            }
        });

        if !send_json(&mut child, &request) {
            cleanup_child(&mut child);
            return Err("Unable to write thread/resume request.".to_string());
        }
        let response = wait_for_json_rpc_id(&rx, 2, Duration::from_secs(15))
            .ok_or_else(|| "Codex app-server did not return thread/resume response.".to_string())?;
        if let Some(error_message) = json_rpc_error_message(&response) {
            cleanup_child(&mut child);
            return Err(format!("Codex app-server rejected thread/resume: {error_message}"));
        }
        let thread_value = response
            .get("result")
            .and_then(|result| result.get("thread"))
            .ok_or_else(|| "thread/resume response did not include a thread.".to_string())?;
        let resumed_thread_id = thread_value
            .get("id")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| "thread/resume response did not include a thread id.".to_string())?;
        let thread = sanitize_thread_summary(thread_value);
        let transcript_preview = sanitize_thread_transcript_preview(thread_value);

        Ok((
            Arc::new(CodexPanelSession {
                panel_id: panel_id.to_string(),
                session_id: format!("panel-session-{panel_id}-{}", timestamp_millis()),
                thread_id: resumed_thread_id,
                child: Mutex::new(child),
                rx: Mutex::new(rx),
                next_id: AtomicI64::new(3),
                current_turn_id: Mutex::new(None),
            }),
            thread,
            transcript_preview,
        ))
    }

    pub(crate) fn redact_thread_text(value: &str) -> String {
        value
            .split_whitespace()
            .map(|part| {
                let lower = part.to_ascii_lowercase();
                if lower.starts_with("sk-")
                    || lower.contains("api_key")
                    || lower.contains("access_token")
                    || lower.contains("refresh_token")
                    || lower.contains("secret")
                {
                    "[redacted]"
                } else {
                    part
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
            .chars()
            .take(240)
            .collect()
    }

    fn safe_cwd_label(value: Option<&str>) -> Option<String> {
        let value = value?.trim();
        if value.is_empty() {
            return None;
        }
        Path::new(value)
            .file_name()
            .and_then(|name| name.to_str())
            .map(redact_thread_text)
            .or_else(|| Some("workspace".to_string()))
    }

    fn thread_turns(thread: &Value) -> &[Value] {
        thread
            .get("turns")
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or(&[])
    }

    fn thread_item_count(thread: &Value) -> usize {
        thread_turns(thread)
            .iter()
            .filter_map(|turn| turn.get("items").and_then(Value::as_array))
            .map(Vec::len)
            .sum()
    }

    pub(crate) fn sanitize_thread_summary(thread: &Value) -> CodexPanelThreadSummary {
        let id = thread
            .get("id")
            .and_then(Value::as_str)
            .map(redact_thread_text)
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| "thread:unknown".to_string());
        let turns = thread_turns(thread);
        CodexPanelThreadSummary {
            id,
            name: thread
                .get("name")
                .and_then(Value::as_str)
                .map(redact_thread_text)
                .filter(|value| !value.trim().is_empty()),
            preview: thread
                .get("preview")
                .and_then(Value::as_str)
                .map(redact_thread_text)
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| "No preview available.".to_string()),
            status: thread
                .get("status")
                .and_then(Value::as_str)
                .map(redact_thread_text)
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| "unknown".to_string()),
            model_provider: thread
                .get("modelProvider")
                .and_then(Value::as_str)
                .map(redact_thread_text),
            created_at: thread.get("createdAt").and_then(Value::as_u64),
            updated_at: thread.get("updatedAt").and_then(Value::as_u64),
            cwd_label: safe_cwd_label(thread.get("cwd").and_then(Value::as_str)),
            turn_count: turns.len(),
            item_count: thread_item_count(thread),
        }
    }

    fn first_item_text(item: &Value) -> Option<String> {
        let item_type = item.get("type").and_then(Value::as_str).unwrap_or("item");
        let text = item
            .get("text")
            .and_then(Value::as_str)
            .or_else(|| item.get("command").and_then(Value::as_str))
            .or_else(|| item.get("aggregatedOutput").and_then(Value::as_str))
            .or_else(|| {
                item.get("summary")
                    .and_then(Value::as_array)
                    .and_then(|items| items.iter().find_map(Value::as_str))
            })
            .or_else(|| {
                item.get("content")
                    .and_then(Value::as_array)
                    .and_then(|items| {
                        items.iter().find_map(|content| {
                            content
                                .get("text")
                                .and_then(Value::as_str)
                                .or_else(|| content.get("content").and_then(Value::as_str))
                        })
                    })
            })?;
        Some(format!("{item_type}: {}", redact_thread_text(text)))
    }

    pub(crate) fn sanitize_thread_transcript_preview(thread: &Value) -> Vec<String> {
        thread_turns(thread)
            .iter()
            .flat_map(|turn| {
                turn.get("items")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .filter_map(first_item_text)
                    .collect::<Vec<_>>()
            })
            .take(8)
            .collect()
    }

    fn send_panel_turn(
        session: Arc<CodexPanelSession>,
        prompt: String,
        stream_window: Option<tauri::Window>,
        settings: CodexPanelTurnSettings,
    ) -> Result<CodexPanelTurnResult, String> {
        mark_turn_starting(&session)?;
        let request_id = session.next_request_id();
        let mut params = serde_json::json!({
            "threadId": session.thread_id,
            "input": [
                {
                    "type": "text",
                    "text": prompt
                }
            ],
            "approvalPolicy": settings.approval_policy,
            "sandboxPolicy": turn_sandbox_policy(&settings.permission_mode),
            "effort": settings.reasoning_effort
        });
        if let Some(model) = settings.model {
            if let Some(object) = params.as_object_mut() {
                object.insert("model".to_string(), Value::String(model));
            }
        }
        if settings.plan_mode {
            let plan_model = params
                .get("model")
                .and_then(Value::as_str)
                .unwrap_or("gpt-5.5")
                .to_string();
            if let Some(object) = params.as_object_mut() {
                object.insert(
                    "collaborationMode".to_string(),
                    serde_json::json!({
                        "mode": "plan",
                        "settings": {
                            "model": plan_model,
                            "reasoning_effort": settings.reasoning_effort,
                            "developer_instructions": "Use Codex plan mode. Ask one to three concise clarification questions only when the plan target, scope, constraints, or success criteria are missing. Keep final plan output separate from progress, commands, and tool logs."
                        }
                    }),
                );
            }
        }
        let turn_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "turn/start",
            "params": params
        });

        if !session.send(&turn_start)? {
            clear_current_turn(&session);
            return Err("Unable to write turn/start request.".to_string());
        }

        let turn_response =
            wait_for_session_json_rpc_id(&session, request_id, Duration::from_secs(15))
                .map_err(|error| {
                    clear_current_turn(&session);
                    error
                })?
                .ok_or_else(|| {
                    clear_current_turn(&session);
                    "Codex app-server did not return turn/start response.".to_string()
                })?;
        if let Some(error_message) = json_rpc_error_message(&turn_response) {
            clear_current_turn(&session);
            return Ok(CodexPanelTurnResult {
                source: "desktop".to_string(),
                panel_id: session.panel_id.clone(),
                session_id: session.session_id.clone(),
                thread_id: session.thread_id.clone(),
                turn_id: None,
                completed: false,
                interrupted: false,
                failed: true,
                events: Vec::new(),
                transcript: String::new(),
                detail: format!("Codex app-server rejected turn/start: {error_message}"),
            });
        }
        let turn_id = extract_turn_id(&turn_response);
        set_current_turn(&session, turn_id.clone());

        let mut events = Vec::new();
        let mut transcript = String::new();
        let mut completed = false;
        let mut interrupted = false;
        let mut failed = false;
        let deadline = std::time::Instant::now() + Duration::from_secs(PANEL_TURN_TIMEOUT_SECS);

        while std::time::Instant::now() < deadline {
            let Some(value) = recv_session_value(&session, Duration::from_millis(500))? else {
                continue;
            };
            if let Some(event) = normalize_panel_event(&value) {
                if let Some(delta) = event.delta.as_deref() {
                    transcript.push_str(delta);
                }
                let unsupported_approval =
                    event.event_type == "approval_request" && !panel_approval_request_is_supported(&event);
                completed = completed || event.status.as_deref() == Some("completed");
                interrupted = interrupted || event.status.as_deref() == Some("interrupted");
                failed = failed
                    || event.status.as_deref() == Some("failed")
                    || event.event_type == "error"
                    || unsupported_approval;
                emit_panel_stream_event(
                    stream_window.as_ref(),
                    &session,
                    turn_id.as_deref(),
                    &event,
                    &transcript,
                );
                events.push(event);
            }

            if completed || interrupted || failed {
                break;
            }
        }

        clear_current_turn(&session);
        let timed_out = !completed && !interrupted && !failed;
        failed = failed || timed_out;
        let detail = if completed {
            "Codex panel turn completed.".to_string()
        } else if interrupted {
            "Codex panel turn was interrupted.".to_string()
        } else if timed_out {
            format!(
                "Codex panel turn timed out after {PANEL_TURN_TIMEOUT_SECS}s before completion. Try again or refresh the Codex connection."
            )
        } else if failed {
            first_failure_message(&events)
                .unwrap_or_else(|| "Codex panel turn blocked by an unsupported approval request or failed.".to_string())
        } else {
            "Codex panel turn timed out before completion.".to_string()
        };
        Ok(CodexPanelTurnResult {
            source: "desktop".to_string(),
            panel_id: session.panel_id.clone(),
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            turn_id,
            completed,
            interrupted,
            failed,
            events,
            transcript,
            detail,
        })
    }

    fn interrupt_panel_turn(
        session: &Arc<CodexPanelSession>,
    ) -> Result<CodexPanelInterruptResult, String> {
        let turn_id = session
            .current_turn_id
            .lock()
            .map_err(|_| "Codex panel turn state lock was poisoned.".to_string())?
            .clone();
        let Some(turn_id) = turn_id.filter(|value| value != "starting") else {
            return Ok(CodexPanelInterruptResult {
                source: "desktop".to_string(),
                panel_id: Some(session.panel_id.clone()),
                session_id: Some(session.session_id.clone()),
                thread_id: Some(session.thread_id.clone()),
                turn_id: None,
                interrupted: false,
                detail: "No active Codex panel turn is interruptible.".to_string(),
            });
        };

        let request_id = session.next_request_id();
        let interrupt = serde_json::json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "turn/interrupt",
            "params": {
                "threadId": session.thread_id,
                "turnId": turn_id
            }
        });
        if !session.send(&interrupt)? {
            return Err("Unable to write turn/interrupt request.".to_string());
        }

        Ok(CodexPanelInterruptResult {
            source: "desktop".to_string(),
            panel_id: Some(session.panel_id.clone()),
            session_id: Some(session.session_id.clone()),
            thread_id: Some(session.thread_id.clone()),
            turn_id: Some(turn_id),
            interrupted: true,
            detail: "Sent turn/interrupt to Codex app-server.".to_string(),
        })
    }

    fn steer_panel_turn(
        session: &Arc<CodexPanelSession>,
        message: String,
    ) -> Result<CodexPanelSteerResult, String> {
        let turn_id = session
            .current_turn_id
            .lock()
            .map_err(|_| "Codex panel turn state lock was poisoned.".to_string())?
            .clone();
        let Some(turn_id) = turn_id.filter(|value| value != "starting") else {
            return Ok(CodexPanelSteerResult {
                source: "desktop".to_string(),
                panel_id: Some(session.panel_id.clone()),
                session_id: Some(session.session_id.clone()),
                thread_id: Some(session.thread_id.clone()),
                turn_id: None,
                steered: false,
                detail: "No active Codex panel turn is steerable.".to_string(),
            });
        };

        let request_id = session.next_request_id();
        let steer = steer_request(request_id, &session.thread_id, &turn_id, &message);
        if !session.send(&steer)? {
            return Err("Unable to write turn/steer request.".to_string());
        }

        Ok(CodexPanelSteerResult {
            source: "desktop".to_string(),
            panel_id: Some(session.panel_id.clone()),
            session_id: Some(session.session_id.clone()),
            thread_id: Some(session.thread_id.clone()),
            turn_id: Some(turn_id),
            steered: true,
            detail: "Sent turn/steer to Codex app-server.".to_string(),
        })
    }

    pub(crate) fn steer_request(id: i64, thread_id: &str, turn_id: &str, message: &str) -> Value {
        serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "turn/steer",
            "params": {
                "threadId": thread_id,
                "expectedTurnId": turn_id,
                "input": [
                    {
                        "type": "text",
                        "text": message
                    }
                ]
            }
        })
    }

    pub(crate) fn normalize_approval_decision(
        decision: &str,
        approve_for_session: bool,
    ) -> Result<String, String> {
        match decision.trim().to_ascii_lowercase().replace('_', "-").as_str() {
            "accept" | "approve" | "approved" if approve_for_session => {
                Ok("acceptForSession".to_string())
            }
            "accept" | "approve" | "approved" => Ok("accept".to_string()),
            "accept-for-session" | "acceptforsession" | "approve-session" | "approve-for-session" => {
                Ok("acceptForSession".to_string())
            }
            "decline" | "declined" | "reject" | "rejected" => Ok("decline".to_string()),
            "cancel" | "canceled" | "cancelled" => Ok("cancel".to_string()),
            _ => Err("Unsupported approval decision.".to_string()),
        }
    }

    pub(crate) fn approval_response_message(request_id: &str, decision: &str) -> Value {
        let id = request_id
            .parse::<i64>()
            .map(Value::from)
            .unwrap_or_else(|_| Value::String(request_id.to_string()));
        serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": {
                "decision": decision
            }
        })
    }

    impl CodexPanelSession {
        fn next_request_id(&self) -> i64 {
            self.next_id.fetch_add(1, Ordering::SeqCst)
        }

        fn send(&self, value: &Value) -> Result<bool, String> {
            let mut child = self
                .child
                .lock()
                .map_err(|_| "Codex app-server process lock was poisoned.".to_string())?;
            Ok(send_json(&mut child, value))
        }
    }

    pub(crate) fn panel_session_key(panel_id: Option<String>) -> String {
        panel_id
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "default".to_string())
    }

    pub(crate) fn panel_turn_settings(
        model: Option<String>,
        reasoning_effort: Option<String>,
        permission_mode: Option<String>,
    ) -> CodexPanelTurnSettings {
        let permission_mode = normalize_panel_permission_mode(permission_mode);
        CodexPanelTurnSettings {
            model: normalize_panel_model(model),
            reasoning_effort: normalize_panel_reasoning(reasoning_effort),
            sandbox_policy: panel_sandbox_policy_label(&permission_mode).to_string(),
            approval_policy: panel_approval_policy(&permission_mode).to_string(),
            permission_mode,
            plan_mode: false,
        }
    }

    fn normalize_panel_model(model: Option<String>) -> Option<String> {
        let value = model?.trim().to_ascii_lowercase();
        match value.as_str() {
            "provider-default" => None,
            "codex-agent" => Some("gpt-5.5".to_string()),
            _ if is_safe_model_id(&value) => Some(value),
            _ => None,
        }
    }

    fn normalize_panel_reasoning(reasoning_effort: Option<String>) -> String {
        let value = reasoning_effort
            .unwrap_or_else(|| "low".to_string())
            .trim()
            .to_ascii_lowercase()
            .replace('_', "-");
        match value.as_str() {
            "minimal" | "low" | "medium" | "high" => value,
            "extra-high" => "xhigh".to_string(),
            "xhigh" => value,
            _ => "low".to_string(),
        }
    }

    fn normalize_panel_permission_mode(permission_mode: Option<String>) -> String {
        let value = permission_mode
            .unwrap_or_else(|| "full-agent".to_string())
            .trim()
            .to_ascii_lowercase()
            .replace('_', "-");
        match value.as_str() {
            "full-agent" | "workspace-agent" | "read-only-agent" | "chat-only" => value,
            "full" | "danger-full-access" => "full-agent".to_string(),
            "workspace" | "workspace-write" => "workspace-agent".to_string(),
            "read-only" | "readonly" => "read-only-agent".to_string(),
            "chat" => "chat-only".to_string(),
            _ => "full-agent".to_string(),
        }
    }

    fn is_safe_model_id(value: &str) -> bool {
        let mut chars = value.chars();
        matches!(chars.next(), Some(first) if first.is_ascii_lowercase() || first.is_ascii_digit())
            && value.len() <= 100
            && value
                .chars()
                .all(|character| character.is_ascii_lowercase() || character.is_ascii_digit() || matches!(character, '.' | '_' | '-'))
    }

    fn panel_approval_policy(permission_mode: &str) -> &'static str {
        match permission_mode {
            "workspace-agent" | "read-only-agent" => "on-request",
            "full-agent" | "chat-only" => "never",
            _ => "never",
        }
    }

    fn panel_sandbox_policy_label(permission_mode: &str) -> &'static str {
        match permission_mode {
            "full-agent" => "dangerFullAccess",
            "workspace-agent" => "workspaceWrite(network:false)",
            "read-only-agent" | "chat-only" => "readOnly(workspace)",
            _ => "dangerFullAccess",
        }
    }

    fn thread_sandbox_mode(permission_mode: &str) -> &'static str {
        match permission_mode {
            "full-agent" => "danger-full-access",
            "workspace-agent" => "workspace-write",
            "read-only-agent" | "chat-only" => "read-only",
            _ => "danger-full-access",
        }
    }

    pub(crate) fn turn_sandbox_policy(permission_mode: &str) -> Value {
        match permission_mode {
            "full-agent" => serde_json::json!({ "type": "dangerFullAccess" }),
            "workspace-agent" => serde_json::json!({
                "type": "workspaceWrite",
                "writableRoots": [],
                "readOnlyAccess": "workspace",
                "networkAccess": false,
                "excludeTmpdirEnvVar": false,
                "excludeSlashTmp": false
            }),
            "read-only-agent" | "chat-only" => {
                serde_json::json!({ "type": "readOnly", "access": "workspace" })
            }
            _ => serde_json::json!({ "type": "dangerFullAccess" }),
        }
    }

    fn panel_permission_base_instructions(permission_mode: &str) -> &'static str {
        match permission_mode {
            "full-agent" => {
                "You are connected to one Steerboard live panel session. Behave like a Codex Desktop full agent with local filesystem and process access. Keep responses concise, act carefully, and surface blockers instead of pretending unsupported actions succeeded."
            }
            "workspace-agent" => {
                "You are connected to one Steerboard live panel session. Work inside the workspace-write sandbox with network disabled. Ask for approval when the Codex runtime requires it and surface unsupported approval requests as blocked."
            }
            "read-only-agent" => {
                "You are connected to one Steerboard live panel session. Respect the read-only sandbox: inspect and explain, but do not write files or make system changes."
            }
            "chat-only" => {
                "You are connected to one Steerboard live panel session in Chat Only mode. Answer through provider chat and avoid tool, filesystem, and process execution intent unless the user changes permissions."
            }
            _ => {
                "You are connected to one Steerboard live panel session. Keep responses concise and surface blockers clearly."
            }
        }
    }

    fn discover_panel_provider() -> Result<CodexPanelProviderSnapshot, String> {
        let checked_at = Some(current_timestamp());
        let mut child = spawn_codex(&["app-server", "--listen", "stdio://"])
            .map_err(|_| "Unable to launch Codex app-server stdio.".to_string())?;

        let (tx, rx) = mpsc::channel();
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Codex app-server stdout was not available.".to_string())?;
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                let _ = tx.send(line);
            }
        });
        drain_stderr(&mut child);

        if !send_json(
            &mut child,
            &initialize_request(1, "steerboard-panel-provider-discovery"),
        ) {
            cleanup_child(&mut child);
            return Err("Unable to write initialize request to Codex app-server.".to_string());
        }

        if wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_none() {
            cleanup_child(&mut child);
            return Err("Codex app-server did not return initialize response.".to_string());
        }

        let account_request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "account/read",
            "params": {}
        });
        let model_request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "model/list",
            "params": {}
        });

        let account_written = send_json(&mut child, &account_request);
        let model_written = send_json(&mut child, &model_request);
        let account_response = if account_written {
            wait_for_json_rpc_id(&rx, 2, Duration::from_secs(8))
        } else {
            None
        };
        let model_response = if model_written {
            wait_for_json_rpc_id(&rx, 3, Duration::from_secs(8))
        } else {
            None
        };
        cleanup_child(&mut child);

        let auth_status = sanitize_panel_auth_status(account_response.as_ref());
        let model_catalog = sanitize_panel_model_catalog(model_response.as_ref());
        let model_catalog_state = if model_catalog.is_empty() {
            "fallback".to_string()
        } else {
            "live".to_string()
        };
        let detail = if account_response.is_none() && model_response.is_none() {
            "Codex provider discovery initialized, but account/read and model/list did not return usable responses."
        } else if model_catalog.is_empty() {
            "Codex provider auth was discovered; model catalog is using static fallback options."
        } else {
            "Codex provider auth and model catalog discovered through app-server."
        }
        .to_string();

        Ok(CodexPanelProviderSnapshot {
            source: "desktop".to_string(),
            checked_at,
            auth_status,
            model_catalog,
            model_catalog_state,
            detail,
        })
    }

    fn fallback_provider_snapshot(detail: Option<String>) -> CodexPanelProviderSnapshot {
        CodexPanelProviderSnapshot {
            source: "desktop".to_string(),
            checked_at: Some(current_timestamp()),
            auth_status: CodexPanelAuthStatus {
                state: "unknown".to_string(),
                auth_mode: None,
                plan_type: None,
                requires_openai_auth: false,
                detail: detail.unwrap_or_else(|| "Codex provider discovery was unavailable.".to_string()),
            },
            model_catalog: Vec::new(),
            model_catalog_state: "fallback".to_string(),
            detail: "Using static panel model fallback options.".to_string(),
        }
    }

    pub(crate) fn sanitize_panel_auth_status(value: Option<&Value>) -> CodexPanelAuthStatus {
        let Some(value) = value else {
            return CodexPanelAuthStatus {
                state: "unknown".to_string(),
                auth_mode: None,
                plan_type: None,
                requires_openai_auth: false,
                detail: "account/read did not return a response.".to_string(),
            };
        };

        if let Some(error) = json_rpc_error_message(value) {
            return CodexPanelAuthStatus {
                state: "error".to_string(),
                auth_mode: None,
                plan_type: None,
                requires_openai_auth: false,
                detail: format!("account/read failed: {error}"),
            };
        }

        let result = value.get("result");
        let account = result
            .and_then(|result| result.get("account"))
            .or_else(|| result.and_then(|result| result.get("auth")));
        let auth_mode = account
            .and_then(|account| {
                account
                    .get("type")
                    .or_else(|| account.get("authMode"))
                    .or_else(|| account.get("mode"))
            })
            .and_then(Value::as_str)
            .map(str::to_string);
        let plan_type = account
            .and_then(|account| {
                account
                    .get("planType")
                    .or_else(|| account.get("plan"))
                    .or_else(|| account.get("subscription"))
            })
            .and_then(Value::as_str)
            .map(str::to_string);
        let requires_openai_auth = result
            .and_then(|result| result.get("requiresOpenaiAuth"))
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let state = if requires_openai_auth {
            "needs-auth"
        } else if auth_mode.is_some() || plan_type.is_some() || account.is_some() {
            "available"
        } else {
            "unknown"
        };

        CodexPanelAuthStatus {
            state: state.to_string(),
            auth_mode,
            plan_type,
            requires_openai_auth,
            detail: if state == "available" {
                "Codex account access is available."
            } else if state == "needs-auth" {
                "Codex account access requires OpenAI authentication."
            } else {
                "Codex account response did not include sanitized auth metadata."
            }
            .to_string(),
        }
    }

    pub(crate) fn sanitize_panel_model_catalog(value: Option<&Value>) -> Vec<CodexPanelModelCatalogEntry> {
        let Some(value) = value else {
            return Vec::new();
        };
        if json_rpc_error_message(value).is_some() {
            return Vec::new();
        }

        let data = value
            .get("result")
            .and_then(|result| result.get("data").or_else(|| result.get("models")))
            .and_then(Value::as_array);
        let Some(data) = data else {
            return Vec::new();
        };

        data.iter()
            .filter_map(|entry| {
                let id = entry
                    .get("id")
                    .or_else(|| entry.get("model"))
                    .and_then(Value::as_str)?
                    .trim()
                    .to_ascii_lowercase();
                if !is_safe_model_id(&id) {
                    return None;
                }
                let model = entry
                    .get("model")
                    .and_then(Value::as_str)
                    .map(|value| value.trim().to_ascii_lowercase())
                    .filter(|value| is_safe_model_id(value))
                    .unwrap_or_else(|| id.clone());
                let label = entry
                    .get("displayName")
                    .or_else(|| entry.get("label"))
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(str::to_string)
                    .unwrap_or_else(|| id.clone());
                let supported_reasoning_efforts = entry
                    .get("supportedReasoningEfforts")
                    .and_then(Value::as_array)
                    .map(|efforts| {
                        efforts
                            .iter()
                            .filter_map(|effort| {
                                let reasoning_effort = effort
                                    .get("reasoningEffort")
                                    .or_else(|| effort.get("value"))
                                    .and_then(Value::as_str)
                                    .map(|value| normalize_panel_reasoning(Some(value.to_string())))?;
                                Some(CodexPanelModelReasoningOption {
                                    reasoning_effort,
                                    description: effort
                                        .get("description")
                                        .and_then(Value::as_str)
                                        .map(str::to_string),
                                })
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                Some(CodexPanelModelCatalogEntry {
                    id,
                    model,
                    label,
                    hidden: entry.get("hidden").and_then(Value::as_bool).unwrap_or(false),
                    is_default: entry
                        .get("isDefault")
                        .and_then(Value::as_bool)
                        .unwrap_or(false),
                    default_reasoning_effort: entry
                        .get("defaultReasoningEffort")
                        .and_then(Value::as_str)
                        .map(|value| normalize_panel_reasoning(Some(value.to_string()))),
                    supported_reasoning_efforts,
                })
            })
            .collect()
    }

    fn panel_session_registry() -> &'static Mutex<BTreeMap<String, Arc<CodexPanelSession>>> {
        PANEL_SESSIONS.get_or_init(|| Mutex::new(BTreeMap::new()))
    }

    fn replace_panel_session(
        panel_id: &str,
        session: Arc<CodexPanelSession>,
    ) -> Result<(), String> {
        let previous = panel_session_registry()
            .lock()
            .map_err(|_| "Codex panel session registry lock was poisoned.".to_string())?
            .insert(panel_id.to_string(), session);
        drop(previous);
        Ok(())
    }

    fn get_panel_session(panel_id: &str) -> Result<Option<Arc<CodexPanelSession>>, String> {
        panel_session_registry()
            .lock()
            .map(|guard| guard.get(panel_id).cloned())
            .map_err(|_| "Codex panel session registry lock was poisoned.".to_string())
    }

    fn take_panel_session(panel_id: &str) -> Option<Arc<CodexPanelSession>> {
        panel_session_registry()
            .lock()
            .ok()
            .and_then(|mut guard| guard.remove(panel_id))
    }

    fn mark_turn_starting(session: &Arc<CodexPanelSession>) -> Result<(), String> {
        let mut current = session
            .current_turn_id
            .lock()
            .map_err(|_| "Codex panel turn state lock was poisoned.".to_string())?;
        if current.is_some() {
            return Err("A Codex panel turn is already active.".to_string());
        }
        *current = Some("starting".to_string());
        Ok(())
    }

    fn set_current_turn(session: &Arc<CodexPanelSession>, turn_id: Option<String>) {
        if let Ok(mut current) = session.current_turn_id.lock() {
            *current = turn_id;
        }
    }

    fn clear_current_turn(session: &Arc<CodexPanelSession>) {
        set_current_turn(session, None);
    }

    fn wait_for_session_json_rpc_id(
        session: &Arc<CodexPanelSession>,
        id: i64,
        timeout: Duration,
    ) -> Result<Option<Value>, String> {
        let deadline = std::time::Instant::now() + timeout;
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let Some(value) =
                recv_session_value(session, remaining.min(Duration::from_millis(250)))?
            else {
                continue;
            };
            if value.get("id").and_then(Value::as_i64) == Some(id) {
                return Ok(Some(value));
            }
        }
        Ok(None)
    }

    fn recv_session_value(
        session: &Arc<CodexPanelSession>,
        timeout: Duration,
    ) -> Result<Option<Value>, String> {
        let line = {
            let rx = session
                .rx
                .lock()
                .map_err(|_| "Codex app-server event stream lock was poisoned.".to_string())?;
            rx.recv_timeout(timeout).ok()
        };
        let Some(line) = line else {
            return Ok(None);
        };
        Ok(serde_json::from_str::<Value>(&line).ok())
    }

    fn extract_thread_id(value: &Value) -> Option<String> {
        value
            .get("result")
            .and_then(|result| result.get("thread"))
            .and_then(|thread| thread.get("id"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
    }

    fn extract_turn_id(value: &Value) -> Option<String> {
        value
            .get("result")
            .and_then(|result| result.get("turn"))
            .and_then(|turn| turn.get("id"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
    }

    fn json_rpc_error_message(value: &Value) -> Option<String> {
        value
            .get("error")
            .and_then(|error| {
                error
                    .get("message")
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
                    .or_else(|| Some(error.to_string()))
            })
            .map(|message| message.trim().to_string())
            .filter(|message| !message.is_empty())
    }

    fn emit_panel_stream_event(
        window: Option<&tauri::Window>,
        session: &Arc<CodexPanelSession>,
        fallback_turn_id: Option<&str>,
        event: &CodexPanelEvent,
        transcript: &str,
    ) {
        let Some(window) = window else {
            return;
        };
        let payload = CodexPanelStreamEvent {
            source: "desktop".to_string(),
            panel_id: session.panel_id.clone(),
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            turn_id: event
                .turn_id
                .clone()
                .or_else(|| fallback_turn_id.map(ToOwned::to_owned)),
            event: event.clone(),
            transcript: transcript.to_string(),
        };
        let _ = window.emit("codex-panel-session-event", payload);
    }

    pub(crate) fn normalize_panel_event(value: &Value) -> Option<CodexPanelEvent> {
        let method = value.get("method").and_then(Value::as_str)?.to_string();
        let request_id = value
            .get("id")
            .and_then(|id| {
                id.as_str()
                    .map(ToOwned::to_owned)
                    .or_else(|| id.as_i64().map(|value| value.to_string()))
            });
        let params = value.get("params").and_then(Value::as_object);
        let turn = params
            .and_then(|object| object.get("turn"))
            .and_then(Value::as_object);
        let item = params
            .and_then(|object| object.get("item"))
            .and_then(Value::as_object);
        let status = turn
            .and_then(|object| object.get("status"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| method_status(&method).map(ToOwned::to_owned));
        let turn_id = params
            .and_then(|object| object.get("turnId"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                turn.and_then(|object| object.get("id"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            });
        let delta = params
            .and_then(|object| object.get("delta"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);
        let message = params
            .and_then(|object| object.get("message"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                params
                    .and_then(|object| object.get("error"))
                    .and_then(|error| error.get("message"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            })
            .or_else(|| value.get("error").map(|error| error.to_string()));
        let summary = params
            .and_then(|object| object.get("summary"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                item.and_then(|object| object.get("summary"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            });
        let thread = params
            .and_then(|object| object.get("thread"))
            .and_then(Value::as_object);
        let thread_id = params
            .and_then(|object| object.get("threadId"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                thread
                    .and_then(|object| object.get("id"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            });
        let item_id = params
            .and_then(|object| object.get("itemId"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                item.and_then(|object| object.get("id"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            });
        let item_type = item
            .and_then(|object| object.get("type"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);
        let item_status = item
            .and_then(|object| object.get("status"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);
        let item_title = item
            .and_then(|object| {
                object
                    .get("title")
                    .or_else(|| object.get("name"))
                    .or_else(|| object.get("command"))
            })
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);
        let item_detail = item
            .and_then(|object| {
                object
                    .get("command")
                    .or_else(|| object.get("cmd"))
                    .or_else(|| object.get("input"))
                    .or_else(|| object.get("text"))
                    .or_else(|| object.get("args"))
            })
            .map(compact_panel_event_value);
        let provider_timestamp = params
            .and_then(|object| {
                object
                    .get("timestamp")
                    .or_else(|| object.get("createdAt"))
                    .or_else(|| object.get("created_at"))
                    .or_else(|| object.get("time"))
            })
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| {
                value
                    .get("timestamp")
                    .or_else(|| value.get("createdAt"))
                    .or_else(|| value.get("created_at"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
            });
        let usage = params
            .and_then(|object| object.get("usage"))
            .and_then(Value::as_object);
        let usage_input_tokens =
            usage_token_value(usage, &["inputTokens", "input_tokens", "prompt_tokens"]);
        let usage_output_tokens =
            usage_token_value(usage, &["outputTokens", "output_tokens", "completion_tokens"]);
        let usage_total_tokens = usage_token_value(usage, &["totalTokens", "total_tokens"]);

        Some(CodexPanelEvent {
            event_type: panel_event_type(&method).to_string(),
            method,
            request_id,
            thread_id,
            turn_id,
            item_id,
            status,
            delta,
            message,
            summary,
            item_type,
            item_status,
            item_title,
            item_detail,
            provider_timestamp,
            usage_input_tokens,
            usage_output_tokens,
            usage_total_tokens,
        })
    }

    fn usage_token_value(
        usage: Option<&serde_json::Map<String, Value>>,
        keys: &[&str],
    ) -> Option<u64> {
        keys.iter()
            .find_map(|key| usage.and_then(|object| object.get(*key)).and_then(Value::as_u64))
    }

    fn compact_panel_event_value(value: &Value) -> String {
        match value {
            Value::String(value) => value.trim().to_string(),
            _ => value.to_string(),
        }
    }

    fn first_failure_message(events: &[CodexPanelEvent]) -> Option<String> {
        events
            .iter()
            .find(|event| panel_event_is_failure(event))
            .and_then(|event| event.message.as_deref())
            .map(str::trim)
            .filter(|message| !message.is_empty())
            .map(ToOwned::to_owned)
    }

    fn panel_event_is_failure(event: &CodexPanelEvent) -> bool {
        event.status.as_deref() == Some("failed")
            || (event.event_type == "approval_request" && !panel_approval_request_is_supported(event))
            || (event.event_type == "error" && !panel_event_is_transient_reconnect(event))
    }

    pub(crate) fn panel_approval_request_is_supported(event: &CodexPanelEvent) -> bool {
        event.event_type == "approval_request"
            && event.request_id.as_deref().is_some_and(|value| !value.trim().is_empty())
            && matches!(
                event.method.as_str(),
                "item/commandExecution/requestApproval" | "item/fileChange/requestApproval"
            )
    }

    fn panel_event_is_transient_reconnect(event: &CodexPanelEvent) -> bool {
        event
            .message
            .as_deref()
            .map(str::trim)
            .is_some_and(|message| {
                message.starts_with("Reconnecting...")
                    && message
                        .rsplit_once('/')
                        .and_then(|(_, total)| total.parse::<u8>().ok())
                        .is_some()
            })
    }

    pub(crate) fn event_belongs_to_turn(turn_id: Option<&str>, event: &CodexPanelEvent) -> bool {
        match (turn_id, event.turn_id.as_deref()) {
            (Some(expected), Some(actual)) => expected == actual,
            (None, _) => true,
            (Some(_), None) => false,
        }
    }

    fn panel_event_type(method: &str) -> &str {
        if method.to_ascii_lowercase().contains("approval") {
            return "approval_request";
        }

        match method {
            "item/agentMessage/delta" => "agent_delta",
            "turn/completed" => "turn_status",
            "turn/failed" | "error" => "error",
            "turn/interrupted" => "turn_status",
            _ => "event",
        }
    }

    fn method_status(method: &str) -> Option<&str> {
        match method {
            "turn/completed" => Some("completed"),
            "turn/failed" => Some("failed"),
            "turn/interrupted" => Some("interrupted"),
            _ => None,
        }
    }

    fn drain_stderr(child: &mut std::process::Child) {
        if let Some(stderr) = child.stderr.take() {
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for _ in reader.lines().map_while(Result::ok) {}
            });
        }
    }

    fn send_json(child: &mut std::process::Child, value: &Value) -> bool {
        let Some(stdin) = child.stdin.as_mut() else {
            return false;
        };

        writeln!(stdin, "{value}").is_ok()
    }

    fn wait_for_json_rpc_id(
        rx: &mpsc::Receiver<String>,
        id: i64,
        timeout: Duration,
    ) -> Option<Value> {
        let deadline = std::time::Instant::now() + timeout;
        while std::time::Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            let Ok(line) = rx.recv_timeout(remaining.min(Duration::from_millis(250))) else {
                continue;
            };
            let Ok(value) = serde_json::from_str::<Value>(&line) else {
                continue;
            };
            if value.get("id").and_then(Value::as_i64) == Some(id) {
                return Some(value);
            }
        }

        None
    }

    fn observe_live_smoke_event(state: &mut LiveSmokeState, value: &Value, expected_token: &str) {
        let Some(method) = value.get("method").and_then(Value::as_str) else {
            return;
        };

        state.method_count += 1;
        state.unique_methods.insert(method.to_string());

        let params = value.get("params").and_then(Value::as_object);
        if method == "item/agentMessage/delta" {
            state.agent_delta_method_seen = true;
            if let Some(delta) = params
                .and_then(|object| object.get("delta"))
                .and_then(Value::as_str)
            {
                state.answer.push_str(delta);
            }
        }

        if method == "error" {
            state.failed_seen = true;
        }

        if let Some(turn) = params
            .and_then(|object| object.get("turn"))
            .and_then(Value::as_object)
        {
            match turn.get("status").and_then(Value::as_str) {
                Some("completed") => state.turn_completed_seen = true,
                Some("failed") => state.failed_seen = true,
                _ => {}
            }
        }

        if method == "turn/completed" && !state.failed_seen {
            state.turn_completed_seen = true;
        }

        state.expected_token_seen = state.answer.contains(expected_token);
    }

    fn live_smoke_result(
        checked_at: Option<String>,
        executed: bool,
        state: LiveSmokeState,
    ) -> CodexLiveSmokeProof {
        let ok = executed
            && state.thread_id_seen
            && state.turn_id_seen
            && state.agent_delta_method_seen
            && state.turn_completed_seen
            && state.expected_token_seen
            && !state.failed_seen;

        CodexLiveSmokeProof {
            source: "desktop".to_string(),
            checked_at,
            executed,
            ok,
            detail: state.detail,
            thread_id_seen: state.thread_id_seen,
            turn_id_seen: state.turn_id_seen,
            agent_delta_method_seen: state.agent_delta_method_seen,
            turn_completed_seen: state.turn_completed_seen,
            failed_seen: state.failed_seen,
            expected_token_seen: state.expected_token_seen,
            method_count: state.method_count,
            unique_methods: state.unique_methods.into_iter().collect(),
        }
    }

    fn cleanup_child(child: &mut std::process::Child) {
        let _ = child.kill();
        let _ = child.wait();
    }

    fn timestamp_millis() -> u128 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    }

    fn current_timestamp() -> String {
        format!("{}", timestamp_millis())
    }
}

mod orchestrator_sqlite {
    use rusqlite::{params, Connection};
    use serde::{Deserialize, Serialize};
    use std::path::PathBuf;

    #[derive(Debug, Clone, Deserialize, Serialize)]
    #[serde(rename_all = "snake_case")]
    pub struct OrchestratorRunSqliteRow {
        pub id: String,
        pub project_id: String,
        pub scope_json: String,
        pub base_branch: String,
        pub integration_branch: String,
        pub status: String,
        pub phase: String,
        pub created_at: String,
        pub updated_at: String,
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    #[serde(rename_all = "snake_case")]
    pub struct OrchestratorQueueSqliteRow {
        pub id: String,
        pub run_id: String,
        pub queue_name: String,
        pub sequence: i64,
        pub kind: String,
        pub payload_json: String,
        pub dedupe_key: Option<String>,
        pub status: String,
        pub enqueued_at: String,
        pub processed_at: Option<String>,
        pub ignored_reason: Option<String>,
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    #[serde(rename_all = "snake_case")]
    pub struct OrchestratorLedgerSqliteRow {
        pub id: String,
        pub run_id: String,
        pub sequence: i64,
        pub event_id: Option<String>,
        pub kind: String,
        pub severity: String,
        pub message: String,
        pub payload_json: String,
        pub created_at: String,
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    #[serde(rename_all = "snake_case")]
    pub struct OrchestratorArtifactSqliteRow {
        pub id: String,
        pub run_id: String,
        pub task_id: Option<String>,
        pub job_id: Option<String>,
        pub attempt: Option<i64>,
        pub kind: String,
        pub path: String,
        pub sha256: String,
        pub size_bytes: i64,
        pub created_at: String,
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct OrchestratorSqliteSnapshot {
        pub runs: Vec<OrchestratorRunSqliteRow>,
        pub events: Vec<OrchestratorQueueSqliteRow>,
        pub commands: Vec<OrchestratorQueueSqliteRow>,
        pub ledger: Vec<OrchestratorLedgerSqliteRow>,
        pub artifacts: Vec<OrchestratorArtifactSqliteRow>,
    }

    #[derive(Debug, Clone, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct OrchestratorSqliteApplyResult {
        pub database_path: String,
        pub runs_written: usize,
        pub queue_rows_written: usize,
        pub ledger_rows_written: usize,
        pub artifacts_written: usize,
        pub detail: String,
    }

    fn database_path() -> Result<PathBuf, String> {
        let root = std::env::current_dir()
            .map_err(|error| format!("orchestrator_sqlite_current_dir_failed:{error}"))?;
        let dir = root.join(".steerboard");
        std::fs::create_dir_all(&dir)
            .map_err(|error| format!("orchestrator_sqlite_create_dir_failed:{error}"))?;
        Ok(dir.join("orchestrator.sqlite"))
    }

    fn initialize_schema(connection: &Connection) -> Result<(), String> {
        connection
            .execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS orchestrator_runs (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    scope_json TEXT NOT NULL,
                    base_branch TEXT NOT NULL,
                    integration_branch TEXT NOT NULL,
                    status TEXT NOT NULL,
                    phase TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS orchestrator_queue (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    queue_name TEXT NOT NULL,
                    sequence INTEGER NOT NULL,
                    kind TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    dedupe_key TEXT,
                    status TEXT NOT NULL,
                    enqueued_at TEXT NOT NULL,
                    processed_at TEXT,
                    ignored_reason TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_run_status
                    ON orchestrator_queue(run_id, queue_name, status, sequence);

                CREATE TABLE IF NOT EXISTS orchestrator_ledger (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    sequence INTEGER NOT NULL,
                    event_id TEXT,
                    kind TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_orchestrator_ledger_run_sequence
                    ON orchestrator_ledger(run_id, sequence);

                CREATE TABLE IF NOT EXISTS orchestrator_artifacts (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    task_id TEXT,
                    job_id TEXT,
                    attempt INTEGER,
                    kind TEXT NOT NULL,
                    path TEXT NOT NULL,
                    sha256 TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_orchestrator_artifacts_run_task
                    ON orchestrator_artifacts(run_id, task_id, job_id);
                "#,
            )
            .map_err(|error| format!("orchestrator_sqlite_schema_failed:{error}"))
    }

    fn write_run(tx: &rusqlite::Transaction<'_>, row: &OrchestratorRunSqliteRow) -> Result<(), String> {
        tx.execute(
            r#"
            INSERT OR REPLACE INTO orchestrator_runs (
                id, project_id, scope_json, base_branch, integration_branch,
                status, phase, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                row.id,
                row.project_id,
                row.scope_json,
                row.base_branch,
                row.integration_branch,
                row.status,
                row.phase,
                row.created_at,
                row.updated_at
            ],
        )
        .map_err(|error| format!("orchestrator_sqlite_write_run_failed:{error}"))?;
        Ok(())
    }

    fn write_queue(tx: &rusqlite::Transaction<'_>, row: &OrchestratorQueueSqliteRow) -> Result<(), String> {
        tx.execute(
            r#"
            INSERT OR REPLACE INTO orchestrator_queue (
                id, run_id, queue_name, sequence, kind, payload_json, dedupe_key,
                status, enqueued_at, processed_at, ignored_reason
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            "#,
            params![
                row.id,
                row.run_id,
                row.queue_name,
                row.sequence,
                row.kind,
                row.payload_json,
                row.dedupe_key,
                row.status,
                row.enqueued_at,
                row.processed_at,
                row.ignored_reason
            ],
        )
        .map_err(|error| format!("orchestrator_sqlite_write_queue_failed:{error}"))?;
        Ok(())
    }

    fn write_ledger(tx: &rusqlite::Transaction<'_>, row: &OrchestratorLedgerSqliteRow) -> Result<(), String> {
        tx.execute(
            r#"
            INSERT OR REPLACE INTO orchestrator_ledger (
                id, run_id, sequence, event_id, kind, severity, message, payload_json, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                row.id,
                row.run_id,
                row.sequence,
                row.event_id,
                row.kind,
                row.severity,
                row.message,
                row.payload_json,
                row.created_at
            ],
        )
        .map_err(|error| format!("orchestrator_sqlite_write_ledger_failed:{error}"))?;
        Ok(())
    }

    fn write_artifact(tx: &rusqlite::Transaction<'_>, row: &OrchestratorArtifactSqliteRow) -> Result<(), String> {
        tx.execute(
            r#"
            INSERT OR REPLACE INTO orchestrator_artifacts (
                id, run_id, task_id, job_id, attempt, kind, path, sha256, size_bytes, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            "#,
            params![
                row.id,
                row.run_id,
                row.task_id,
                row.job_id,
                row.attempt,
                row.kind,
                row.path,
                row.sha256,
                row.size_bytes,
                row.created_at
            ],
        )
        .map_err(|error| format!("orchestrator_sqlite_write_artifact_failed:{error}"))?;
        Ok(())
    }

    fn read_runs(connection: &Connection) -> Result<Vec<OrchestratorRunSqliteRow>, String> {
        let mut statement = connection
            .prepare(
                "SELECT id, project_id, scope_json, base_branch, integration_branch, status, phase, created_at, updated_at
                 FROM orchestrator_runs
                 ORDER BY updated_at ASC, id ASC",
            )
            .map_err(|error| format!("orchestrator_sqlite_read_runs_prepare_failed:{error}"))?;
        let rows = statement
            .query_map([], |row| {
                Ok(OrchestratorRunSqliteRow {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    scope_json: row.get(2)?,
                    base_branch: row.get(3)?,
                    integration_branch: row.get(4)?,
                    status: row.get(5)?,
                    phase: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })
            .map_err(|error| format!("orchestrator_sqlite_read_runs_failed:{error}"))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("orchestrator_sqlite_read_runs_collect_failed:{error}"))
    }

    fn read_queue(connection: &Connection, queue_name: &str) -> Result<Vec<OrchestratorQueueSqliteRow>, String> {
        let mut statement = connection
            .prepare(
                "SELECT id, run_id, queue_name, sequence, kind, payload_json, dedupe_key, status, enqueued_at, processed_at, ignored_reason
                 FROM orchestrator_queue
                 WHERE queue_name = ?1
                 ORDER BY sequence ASC, id ASC",
            )
            .map_err(|error| format!("orchestrator_sqlite_read_queue_prepare_failed:{error}"))?;
        let rows = statement
            .query_map([queue_name], |row| {
                Ok(OrchestratorQueueSqliteRow {
                    id: row.get(0)?,
                    run_id: row.get(1)?,
                    queue_name: row.get(2)?,
                    sequence: row.get(3)?,
                    kind: row.get(4)?,
                    payload_json: row.get(5)?,
                    dedupe_key: row.get(6)?,
                    status: row.get(7)?,
                    enqueued_at: row.get(8)?,
                    processed_at: row.get(9)?,
                    ignored_reason: row.get(10)?,
                })
            })
            .map_err(|error| format!("orchestrator_sqlite_read_queue_failed:{error}"))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("orchestrator_sqlite_read_queue_collect_failed:{error}"))
    }

    fn read_ledger(connection: &Connection) -> Result<Vec<OrchestratorLedgerSqliteRow>, String> {
        let mut statement = connection
            .prepare(
                "SELECT id, run_id, sequence, event_id, kind, severity, message, payload_json, created_at
                 FROM orchestrator_ledger
                 ORDER BY sequence ASC, id ASC",
            )
            .map_err(|error| format!("orchestrator_sqlite_read_ledger_prepare_failed:{error}"))?;
        let rows = statement
            .query_map([], |row| {
                Ok(OrchestratorLedgerSqliteRow {
                    id: row.get(0)?,
                    run_id: row.get(1)?,
                    sequence: row.get(2)?,
                    event_id: row.get(3)?,
                    kind: row.get(4)?,
                    severity: row.get(5)?,
                    message: row.get(6)?,
                    payload_json: row.get(7)?,
                    created_at: row.get(8)?,
                })
            })
            .map_err(|error| format!("orchestrator_sqlite_read_ledger_failed:{error}"))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("orchestrator_sqlite_read_ledger_collect_failed:{error}"))
    }

    fn read_artifacts(connection: &Connection) -> Result<Vec<OrchestratorArtifactSqliteRow>, String> {
        let mut statement = connection
            .prepare(
                "SELECT id, run_id, task_id, job_id, attempt, kind, path, sha256, size_bytes, created_at
                 FROM orchestrator_artifacts
                 ORDER BY created_at ASC, id ASC",
            )
            .map_err(|error| format!("orchestrator_sqlite_read_artifacts_prepare_failed:{error}"))?;
        let rows = statement
            .query_map([], |row| {
                Ok(OrchestratorArtifactSqliteRow {
                    id: row.get(0)?,
                    run_id: row.get(1)?,
                    task_id: row.get(2)?,
                    job_id: row.get(3)?,
                    attempt: row.get(4)?,
                    kind: row.get(5)?,
                    path: row.get(6)?,
                    sha256: row.get(7)?,
                    size_bytes: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|error| format!("orchestrator_sqlite_read_artifacts_failed:{error}"))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("orchestrator_sqlite_read_artifacts_collect_failed:{error}"))
    }

    #[tauri::command]
    pub fn orchestrator_sqlite_apply_snapshot(
        snapshot: OrchestratorSqliteSnapshot,
    ) -> Result<OrchestratorSqliteApplyResult, String> {
        let path = database_path()?;
        let mut connection = Connection::open(&path)
            .map_err(|error| format!("orchestrator_sqlite_open_failed:{error}"))?;
        initialize_schema(&connection)?;
        let tx = connection
            .transaction()
            .map_err(|error| format!("orchestrator_sqlite_transaction_failed:{error}"))?;

        for row in &snapshot.runs {
            write_run(&tx, row)?;
        }

        for row in snapshot.events.iter().chain(snapshot.commands.iter()) {
            write_queue(&tx, row)?;
        }

        for row in &snapshot.ledger {
            write_ledger(&tx, row)?;
        }

        for row in &snapshot.artifacts {
            write_artifact(&tx, row)?;
        }

        tx.commit()
            .map_err(|error| format!("orchestrator_sqlite_commit_failed:{error}"))?;

        Ok(OrchestratorSqliteApplyResult {
            database_path: path.to_string_lossy().to_string(),
            runs_written: snapshot.runs.len(),
            queue_rows_written: snapshot.events.len() + snapshot.commands.len(),
            ledger_rows_written: snapshot.ledger.len(),
            artifacts_written: snapshot.artifacts.len(),
            detail: "Orchestrator SQLite snapshot applied.".to_string(),
        })
    }

    #[tauri::command]
    pub fn orchestrator_sqlite_read_snapshot() -> Result<OrchestratorSqliteSnapshot, String> {
        let path = database_path()?;
        let connection = Connection::open(&path)
            .map_err(|error| format!("orchestrator_sqlite_open_failed:{error}"))?;
        initialize_schema(&connection)?;

        Ok(OrchestratorSqliteSnapshot {
            runs: read_runs(&connection)?,
            events: read_queue(&connection, "event")?,
            commands: read_queue(&connection, "command")?,
            ledger: read_ledger(&connection)?,
            artifacts: read_artifacts(&connection)?,
        })
    }
}

mod orchestrator_runtime_executor {
    use serde::{Deserialize, Serialize};
    use serde_json::Value;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::process::Command;

    #[cfg(windows)]
    use std::os::windows::process::CommandExt;

    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    #[derive(Debug, Clone, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct OrchestratorRuntimeCommandRequest {
        pub command_id: String,
        pub run_id: String,
        pub kind: String,
        pub repository_root: String,
        pub payload: Value,
    }

    #[derive(Debug, Clone, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct OrchestratorRuntimeCommandStep {
        pub label: String,
        pub command: String,
        pub status: String,
        pub detail: String,
    }

    #[derive(Debug, Clone, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct OrchestratorRuntimeCommandResult {
        pub command_id: String,
        pub run_id: String,
        pub kind: String,
        pub executed: bool,
        pub blocked: bool,
        pub artifact_paths: Vec<String>,
        pub steps: Vec<OrchestratorRuntimeCommandStep>,
        pub detail: String,
    }

    fn hide_command_window(command: &mut Command) {
        #[cfg(windows)]
        command.creation_flags(CREATE_NO_WINDOW);
    }

    fn step(label: &str, command: &str, status: &str, detail: String) -> OrchestratorRuntimeCommandStep {
        OrchestratorRuntimeCommandStep {
            label: label.to_string(),
            command: command.to_string(),
            status: status.to_string(),
            detail,
        }
    }

    fn value_string(payload: &Value, key: &str) -> Result<String, String> {
        payload
            .get(key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .ok_or_else(|| format!("orchestrator_runtime_missing_payload:{key}"))
    }

    fn optional_value_string(payload: &Value, key: &str) -> Option<String> {
        payload
            .get(key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
    }

    fn value_string_array(payload: &Value, key: &str) -> Result<Vec<String>, String> {
        let values = payload
            .get(key)
            .and_then(Value::as_array)
            .ok_or_else(|| format!("orchestrator_runtime_missing_payload:{key}"))?;
        let items = values
            .iter()
            .filter_map(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .collect::<Vec<_>>();

        if items.is_empty() {
            return Err(format!("orchestrator_runtime_empty_payload:{key}"));
        }

        Ok(items)
    }

    fn run_command(cwd: &Path, program: &str, args: &[&str]) -> Result<String, String> {
        let mut command = Command::new(program);
        command.current_dir(cwd);
        command.args(args);
        hide_command_window(&mut command);
        let output = command
            .output()
            .map_err(|error| format!("orchestrator_runtime_command_failed:{program}:{error}"))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let detail = if stderr.is_empty() { stdout } else { stderr };
            return Err(format!(
                "orchestrator_runtime_command_exited_{}:{}",
                output.status.code().unwrap_or(-1),
                detail
            ));
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    fn run_git(cwd: &Path, args: &[&str]) -> Result<String, String> {
        run_command(cwd, "git", args)
    }

    fn resolve_repository(path: &str) -> Result<PathBuf, String> {
        let root = PathBuf::from(path.trim())
            .canonicalize()
            .map_err(|error| format!("orchestrator_runtime_repository_unavailable:{}", error.kind()))?;
        let toplevel = run_git(&root, &["rev-parse", "--show-toplevel"])?;
        let git_root = PathBuf::from(toplevel.trim())
            .canonicalize()
            .map_err(|error| format!("orchestrator_runtime_git_root_unavailable:{}", error.kind()))?;

        if git_root != root {
            return Err("orchestrator_runtime_repository_root_mismatch".to_string());
        }

        Ok(root)
    }

    fn ensure_safe_branch(branch: &str) -> Result<(), String> {
        let safe = branch.starts_with("codex/orch/")
            && !branch.contains("..")
            && !branch.contains('\\')
            && !branch.chars().any(char::is_whitespace)
            && branch.len() <= 160;
        if safe {
            Ok(())
        } else {
            Err("orchestrator_runtime_unsafe_branch".to_string())
        }
    }

    fn resolve_repo_child(repo: &Path, raw_path: &str, required_prefix: &str) -> Result<PathBuf, String> {
        let raw = PathBuf::from(raw_path.trim());
        let path = if raw.is_absolute() { raw } else { repo.join(raw) };
        let parent = path
            .parent()
            .ok_or_else(|| "orchestrator_runtime_missing_target_parent".to_string())?;
        fs::create_dir_all(parent)
            .map_err(|error| format!("orchestrator_runtime_create_parent_failed:{error}"))?;
        let parent = parent
            .canonicalize()
            .map_err(|error| format!("orchestrator_runtime_parent_unavailable:{}", error.kind()))?;
        let required = repo
            .join(required_prefix)
            .canonicalize()
            .or_else(|_| {
                fs::create_dir_all(repo.join(required_prefix))
                    .map_err(|error| format!("orchestrator_runtime_create_required_root_failed:{error}"))?;
                repo.join(required_prefix)
                    .canonicalize()
                    .map_err(|error| format!("orchestrator_runtime_required_root_unavailable:{}", error.kind()))
            })?;

        if !parent.starts_with(&required) && parent != required {
            return Err("orchestrator_runtime_target_outside_allowed_root".to_string());
        }

        Ok(path)
    }

    fn artifact_path(repo: &Path, run_id: &str, command_id: &str, name: &str) -> Result<PathBuf, String> {
        let safe_run = run_id.replace(|character: char| !character.is_ascii_alphanumeric() && character != '-', "-");
        let safe_command = command_id
            .replace(|character: char| !character.is_ascii_alphanumeric() && character != '-', "-");
        let dir = repo
            .join(".steerboard")
            .join("orchestrator-artifacts")
            .join(safe_run);
        fs::create_dir_all(&dir)
            .map_err(|error| format!("orchestrator_runtime_artifact_dir_failed:{error}"))?;
        Ok(dir.join(format!("{safe_command}-{name}")))
    }

    fn worktree_for_branch(repo: &Path, branch: &str) -> Result<PathBuf, String> {
        let output = run_git(repo, &["worktree", "list", "--porcelain"])?;
        let mut current_worktree: Option<PathBuf> = None;
        let expected = format!("branch refs/heads/{branch}");

        for line in output.lines() {
            if let Some(path) = line.strip_prefix("worktree ") {
                current_worktree = Some(PathBuf::from(path.trim()));
            } else if line.trim() == expected {
                if let Some(path) = current_worktree {
                    return Ok(path);
                }
            }
        }

        Err("orchestrator_runtime_worktree_not_found_for_branch".to_string())
    }

    fn run_codex_exec(
        worktree: &Path,
        prompt: &str,
        stdout_path: &Path,
        stderr_path: &Path,
        sandbox: &str,
    ) -> Result<(), String> {
        #[cfg(windows)]
        let mut command = {
            let mut command = Command::new("cmd");
            command.arg("/C").arg("codex");
            command
        };

        #[cfg(not(windows))]
        let mut command = Command::new("codex");

        command
            .arg("exec")
            .arg("--json")
            .arg("-m")
            .arg("gpt-5.3-spark")
            .arg("-c")
            .arg("model_reasoning_effort=\"extra-high\"")
            .arg("-s")
            .arg(sandbox)
            .arg("-a")
            .arg("never")
            .arg("-C")
            .arg(worktree)
            .arg(prompt);
        hide_command_window(&mut command);
        let output = command
            .output()
            .map_err(|error| format!("orchestrator_runtime_codex_launch_failed:{error}"))?;
        fs::write(stdout_path, &output.stdout)
            .map_err(|error| format!("orchestrator_runtime_codex_stdout_write_failed:{error}"))?;
        fs::write(stderr_path, &output.stderr)
            .map_err(|error| format!("orchestrator_runtime_codex_stderr_write_failed:{error}"))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(format!(
                "orchestrator_runtime_codex_exited_{}",
                output.status.code().unwrap_or(-1)
            ))
        }
    }

    fn execute_worker_start(
        request: &OrchestratorRuntimeCommandRequest,
        repo: &Path,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        let branch = value_string(&request.payload, "branch")?;
        let worktree_path = value_string(&request.payload, "worktreePath")?;
        let task_id = value_string(&request.payload, "taskId")?;
        ensure_safe_branch(&branch)?;
        let worktree = resolve_repo_child(repo, &worktree_path, ".steerboard/worktrees")?;
        let mut steps = Vec::new();
        let mut artifacts = Vec::new();

        if worktree.join(".git").exists() {
            steps.push(step(
                "Create worker worktree",
                "git worktree add",
                "skipped",
                "Worker worktree already exists.".to_string(),
            ));
        } else {
            run_git(
                repo,
                &[
                    "worktree",
                    "add",
                    "-b",
                    branch.as_str(),
                    worktree.to_string_lossy().as_ref(),
                    "HEAD",
                ],
            )?;
            steps.push(step(
                "Create worker worktree",
                "git worktree add -b <branch> <path> HEAD",
                "passed",
                format!("Created {branch} at {}.", worktree.display()),
            ));
        }

        let prompt_path = artifact_path(repo, &request.run_id, &request.command_id, "worker-prompt.md")?;
        let stdout_path = artifact_path(repo, &request.run_id, &request.command_id, "codex-stdout.jsonl")?;
        let stderr_path = artifact_path(repo, &request.run_id, &request.command_id, "codex-stderr.log")?;
        let prompt = format!(
            "You are an orchestrator worker for run `{}` task `{}`.\n\nWork only in `{}` on branch `{}`.\nUse the task packet from the orchestrator payload. Commit nothing unless validation passes.\n\nPayload JSON:\n{}\n",
            request.run_id,
            task_id,
            worktree.display(),
            branch,
            request.payload
        );
        fs::write(&prompt_path, &prompt)
            .map_err(|error| format!("orchestrator_runtime_prompt_write_failed:{error}"))?;
        artifacts.push(prompt_path.to_string_lossy().to_string());

        run_codex_exec(&worktree, &prompt, &stdout_path, &stderr_path, "workspace-write")?;
        artifacts.push(stdout_path.to_string_lossy().to_string());
        artifacts.push(stderr_path.to_string_lossy().to_string());
        steps.push(step(
            "Launch Codex worker",
            "codex exec --json -m gpt-5.3-spark -s workspace-write -a never",
            "passed",
            "Codex worker completed and wrote stdout/stderr artifacts.".to_string(),
        ));

        Ok(OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: true,
            blocked: false,
            artifact_paths: artifacts,
            steps,
            detail: "Worker worktree was created and Codex worker execution completed.".to_string(),
        })
    }

    fn execute_validator_start(
        request: &OrchestratorRuntimeCommandRequest,
        repo: &Path,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        let job_id = value_string(&request.payload, "jobId")?;
        let worker_job_id = value_string(&request.payload, "workerJobId")?;
        let task_id = value_string(&request.payload, "taskId")?;
        let worktree_path = value_string(&request.payload, "worktreePath")?;
        let capability_profile = value_string(&request.payload, "capabilityProfile")?;
        if capability_profile != "read-only" {
            return Err("orchestrator_runtime_validator_requires_read_only".to_string());
        }
        let worktree = resolve_repo_child(repo, &worktree_path, ".steerboard/worktrees")?;
        let validation_commands = value_string_array(&request.payload, "validationCommands").unwrap_or_default();
        let prompt_path = artifact_path(repo, &request.run_id, &request.command_id, "validator-prompt.md")?;
        let stdout_path = artifact_path(repo, &request.run_id, &request.command_id, "validator-stdout.jsonl")?;
        let stderr_path = artifact_path(repo, &request.run_id, &request.command_id, "validator-stderr.log")?;
        let prompt = format!(
            "You are a read-only validator for run `{}` task `{}`.\n\nValidate worker job `{}` from worktree `{}`.\nDo not modify files. Do not commit. Inspect the worker result, run only read-safe checks, and return a concise verdict with findings, changed files, commands reviewed, evidence paths, and next action.\n\nValidator job: `{}`\nValidation command hints:\n{}\n\nPayload JSON:\n{}\n",
            request.run_id,
            task_id,
            worker_job_id,
            worktree.display(),
            job_id,
            validation_commands.join("\n"),
            request.payload
        );
        fs::write(&prompt_path, &prompt)
            .map_err(|error| format!("orchestrator_runtime_validator_prompt_write_failed:{error}"))?;
        run_codex_exec(&worktree, &prompt, &stdout_path, &stderr_path, "read-only")?;

        Ok(OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: true,
            blocked: false,
            artifact_paths: vec![
                prompt_path.to_string_lossy().to_string(),
                stdout_path.to_string_lossy().to_string(),
                stderr_path.to_string_lossy().to_string(),
            ],
            steps: vec![step(
                "Launch read-only validator",
                "codex exec --json -m gpt-5.3-spark -s read-only -a never",
                "passed",
                "Codex validator completed and wrote stdout/stderr artifacts.".to_string(),
            )],
            detail: "Read-only validator execution completed.".to_string(),
        })
    }

    fn execute_worker_commit(
        request: &OrchestratorRuntimeCommandRequest,
        repo: &Path,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        let branch = value_string(&request.payload, "branch")?;
        let task_id = value_string(&request.payload, "taskId")?;
        ensure_safe_branch(&branch)?;
        let worktree = optional_value_string(&request.payload, "worktreePath")
            .map(|path| resolve_repo_child(repo, &path, ".steerboard/worktrees"))
            .transpose()?
            .unwrap_or(worktree_for_branch(repo, &branch)?);
        let status = run_git(&worktree, &["status", "--porcelain"])?;
        let mut steps = Vec::new();

        if status.trim().is_empty() {
            return Ok(OrchestratorRuntimeCommandResult {
                command_id: request.command_id.clone(),
                run_id: request.run_id.clone(),
                kind: request.kind.clone(),
                executed: false,
                blocked: true,
                artifact_paths: Vec::new(),
                steps: vec![step(
                    "Commit accepted worker output",
                    "git status --porcelain",
                    "blocked",
                    "Worker branch has no changes to commit.".to_string(),
                )],
                detail: "Worker commit blocked because there were no changed files.".to_string(),
            });
        }

        run_git(&worktree, &["add", "--all"])?;
        steps.push(step(
            "Stage worker output",
            "git add --all",
            "passed",
            "Worker changes staged.".to_string(),
        ));
        let message = format!("orchestrator: accept {task_id}");
        run_git(&worktree, &["commit", "-m", message.as_str()])?;
        let commit_sha = run_git(&worktree, &["rev-parse", "HEAD"])?;
        steps.push(step(
            "Commit accepted worker output",
            "git commit -m <message>",
            "passed",
            format!("Committed {}.", commit_sha.trim()),
        ));

        Ok(OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: true,
            blocked: false,
            artifact_paths: Vec::new(),
            steps,
            detail: format!("Accepted worker output committed on {branch}."),
        })
    }

    fn execute_integration_start(
        request: &OrchestratorRuntimeCommandRequest,
        repo: &Path,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        let integration_branch = value_string(&request.payload, "integrationBranch")?;
        let base_branch = value_string(&request.payload, "baseBranch")?;
        let commit_shas = value_string_array(&request.payload, "commitShas")?;
        ensure_safe_branch(&integration_branch)?;
        let integration_slug = integration_branch.replace('/', "-");
        let integration_path = repo
            .join(".steerboard")
            .join("integration")
            .join(integration_slug);
        let integration_path = resolve_repo_child(
            repo,
            integration_path.to_string_lossy().as_ref(),
            ".steerboard/integration",
        )?;
        let mut steps = Vec::new();

        if integration_path.join(".git").exists() {
            steps.push(step(
                "Create integration worktree",
                "git worktree add -B <branch> <path> <base>",
                "skipped",
                "Integration worktree already exists.".to_string(),
            ));
        } else {
            run_git(
                repo,
                &[
                    "worktree",
                    "add",
                    "-B",
                    integration_branch.as_str(),
                    integration_path.to_string_lossy().as_ref(),
                    base_branch.as_str(),
                ],
            )?;
            steps.push(step(
                "Create integration worktree",
                "git worktree add -B <branch> <path> <base>",
                "passed",
                format!("Created integration worktree at {}.", integration_path.display()),
            ));
        }

        for commit in &commit_shas {
            run_git(&integration_path, &["cherry-pick", commit.as_str()])?;
        }
        steps.push(step(
            "Apply accepted commits",
            "git cherry-pick <accepted-commits>",
            "passed",
            format!("Applied {} accepted commit(s).", commit_shas.len()),
        ));

        Ok(OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: true,
            blocked: false,
            artifact_paths: Vec::new(),
            steps,
            detail: format!("Integrated accepted commits into {integration_branch}."),
        })
    }

    fn execute_cleanup_start(
        request: &OrchestratorRuntimeCommandRequest,
        repo: &Path,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        let worktree_path = value_string(&request.payload, "worktreePath")?;
        let worktree = resolve_repo_child(repo, &worktree_path, ".steerboard/worktrees")?;
        run_git(repo, &["worktree", "remove", worktree.to_string_lossy().as_ref()])?;

        Ok(OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: true,
            blocked: false,
            artifact_paths: Vec::new(),
            steps: vec![step(
                "Remove worker worktree",
                "git worktree remove <path>",
                "passed",
                format!("Removed {}.", worktree.display()),
            )],
            detail: "Worker worktree cleanup completed.".to_string(),
        })
    }

    fn blocked_result(request: &OrchestratorRuntimeCommandRequest, detail: String) -> OrchestratorRuntimeCommandResult {
        OrchestratorRuntimeCommandResult {
            command_id: request.command_id.clone(),
            run_id: request.run_id.clone(),
            kind: request.kind.clone(),
            executed: false,
            blocked: true,
            artifact_paths: Vec::new(),
            steps: vec![step("Preflight", "orchestrator runtime executor", "blocked", detail.clone())],
            detail,
        }
    }

    fn execute(request: OrchestratorRuntimeCommandRequest) -> OrchestratorRuntimeCommandResult {
        let repo = match resolve_repository(&request.repository_root) {
            Ok(repo) => repo,
            Err(error) => return blocked_result(&request, error),
        };
        let result = match request.kind.as_str() {
            "worker.start" => execute_worker_start(&request, &repo),
            "worker.commit" => execute_worker_commit(&request, &repo),
            "validator.start" => execute_validator_start(&request, &repo),
            "integration.start" => execute_integration_start(&request, &repo),
            "cleanup.start" => execute_cleanup_start(&request, &repo),
            _ => Err(format!("orchestrator_runtime_unsupported_command:{}", request.kind)),
        };

        result.unwrap_or_else(|error| blocked_result(&request, error))
    }

    #[tauri::command]
    pub async fn orchestrator_execute_command(
        request: OrchestratorRuntimeCommandRequest,
    ) -> Result<OrchestratorRuntimeCommandResult, String> {
        tauri::async_runtime::spawn_blocking(move || execute(request))
            .await
            .map_err(|error| format!("orchestrator_runtime_worker_failed:{error}"))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            runtime_bridge::live_action_runner_execute,
            runtime_bridge::runtime_bridge_status,
            runtime_bridge::runtime_permission_approval_status,
            runtime_bridge::migration_source_preview,
            runtime_bridge::codex_transport_probe,
            runtime_bridge::codex_command_catalog_preview,
            runtime_bridge::codex_automation_catalog_preview,
            runtime_bridge::codex_skill_catalog_preview,
            runtime_bridge::codex_plugin_catalog_preview,
            runtime_bridge::codex_mcp_catalog_preview,
            runtime_bridge::codex_personalization_catalog_preview,
            runtime_bridge::codex_transport_active_turn_control_smoke,
            runtime_bridge::codex_transport_active_turn_steer_smoke,
            runtime_bridge::codex_transport_live_smoke,
            runtime_bridge::codex_transport_live_control_smoke,
            runtime_bridge::codex_transport_two_panel_smoke,
            runtime_bridge::codex_panel_session_readiness,
            runtime_bridge::codex_panel_provider_discovery,
            runtime_bridge::codex_panel_thread_list,
            runtime_bridge::codex_panel_thread_read,
            runtime_bridge::codex_panel_thread_resume,
            runtime_bridge::codex_panel_session_start,
            runtime_bridge::codex_panel_session_send_turn,
            runtime_bridge::codex_panel_session_retry,
            runtime_bridge::codex_panel_session_interrupt,
            runtime_bridge::codex_panel_session_steer,
            runtime_bridge::codex_panel_session_approval_response,
            runtime_bridge::codex_panel_session_close,
            runtime_bridge::git_workbench_status,
            runtime_bridge::git_workbench_diff,
            runtime_bridge::git_workbench_action,
            runtime_bridge::terminal_pane_action,
            orchestrator_sqlite::orchestrator_sqlite_apply_snapshot,
            orchestrator_sqlite::orchestrator_sqlite_read_snapshot,
            orchestrator_runtime_executor::orchestrator_execute_command,
            runtime_bridge::phase3_command_validation_artifact_read,
            runtime_bridge::phase3_smoke_proof_bundle_artifact_read,
            runtime_bridge::phase3_panel_evidence_artifact_read,
            runtime_bridge::phase4_provider_review_artifact_read
        ])
        .run(tauri::generate_context!())
        .expect("error while running Steerboard");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn runtime_bridge_status_returns_locked_state() {
        let status = runtime_bridge::runtime_bridge_status();
        assert_eq!(status.id, "desktop-runtime-bridge");
        assert_eq!(status.label, "Desktop runtime bridge");
        assert_eq!(status.state, "locked");
    }

    #[test]
    fn runtime_bridge_status_marks_execution_and_workspace_unavailable() {
        let status = runtime_bridge::runtime_bridge_status();
        assert!(!status.process_execution_available);
        assert!(!status.workspace_access_available);
    }

    #[test]
    fn runtime_bridge_status_safety_explains_non_execution() {
        let status = runtime_bridge::runtime_bridge_status();
        assert!(!status.safety.trim().is_empty());
        assert!(status
            .safety
            .to_lowercase()
            .contains("no process execution"));
    }

    #[test]
    fn runtime_permission_approval_status_returns_locked_state() {
        let status = runtime_bridge::runtime_permission_approval_status();
        assert_eq!(status.id, "desktop-permission-approval");
        assert_eq!(status.label, "Desktop permission approval");
        assert_eq!(status.state, "locked");
    }

    #[test]
    fn runtime_permission_approval_status_does_not_grant_permission() {
        let status = runtime_bridge::runtime_permission_approval_status();
        assert!(!status.approval_command_available);
        assert!(!status.permission_granted);
    }

    #[test]
    fn runtime_permission_approval_status_safety_explains_non_execution() {
        let status = runtime_bridge::runtime_permission_approval_status();
        assert!(!status.safety.trim().is_empty());
        assert!(status
            .safety
            .to_lowercase()
            .contains("no process execution"));
    }

    fn now_timestamp() -> String {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after UNIX epoch")
            .as_millis()
            .to_string()
    }

    fn live_action_request(
        state: &str,
        provider: &str,
        intent: &str,
        requested_timestamp: String,
        expiry_timestamp: Option<String>,
    ) -> LiveActionRunnerRequest {
        LiveActionRunnerRequest {
            provider: provider.to_string(),
            state: state.to_string(),
            action_label: "Terminal Readonly Probe".to_string(),
            request_id: "req-live-action".to_string(),
            requested_timestamp,
            timeout: None,
            expiry: expiry_timestamp,
            intent: intent.to_string(),
        }
    }

    fn now_plus_millis(base: &str, add_millis: u128) -> Option<String> {
        base.parse::<u128>()
            .ok()
            .and_then(|value| value.checked_add(add_millis))
            .map(|value| value.to_string())
    }

    #[test]
    fn live_action_runner_approved_request_executes_fixed_probe() {
        let requested_timestamp = now_timestamp();
        let request = live_action_request(
            "approved",
            "terminal",
            "terminal-readonly-probe",
            requested_timestamp.clone(),
            now_plus_millis(&requested_timestamp, 5000),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert_eq!(result.provider, "terminal");
        assert_eq!(result.intent, "terminal-readonly-probe");
        assert_eq!(result.action_label, "Terminal Readonly Probe");
        assert!(result.executed);
        assert!(!result.blocked);
        assert!(!result.result_summary.contains("blocked_"));
    }

    #[test]
    fn live_action_runner_non_approved_state_is_blocked() {
        let requested_timestamp = now_timestamp();
        let request = live_action_request(
            "requested",
            "terminal",
            "terminal-readonly-probe",
            requested_timestamp,
            Some(now_timestamp()),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_request_state_not_approved");
    }

    #[test]
    fn live_action_runner_expired_request_is_blocked() {
        let requested_timestamp = now_timestamp();
        let request = live_action_request(
            "approved",
            "terminal",
            "terminal-readonly-probe",
            requested_timestamp,
            Some("0".to_string()),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_expired");
    }

    #[test]
    fn live_action_runner_missing_expiry_is_blocked() {
        let request = live_action_request(
            "approved",
            "terminal",
            "terminal-readonly-probe",
            now_timestamp(),
            None,
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_missing_expiry");
    }

    #[test]
    fn live_action_runner_unsupported_provider_is_blocked() {
        let requested_timestamp = now_timestamp();
        let request = live_action_request(
            "approved",
            "filesystem",
            "terminal-readonly-probe",
            requested_timestamp.clone(),
            now_plus_millis(&requested_timestamp, 5000),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_unsupported_provider");
    }

    #[test]
    fn live_action_runner_unsupported_intent_is_blocked() {
        let requested_timestamp = now_timestamp();
        let request = live_action_request(
            "approved",
            "terminal",
            "unsafe-command",
            requested_timestamp.clone(),
            now_plus_millis(&requested_timestamp, 5000),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_unsupported_intent");
    }

    #[test]
    fn live_action_runner_rejects_invalid_timestamps() {
        let request = live_action_request(
            "approved",
            "terminal",
            "terminal-readonly-probe",
            "not-a-timestamp".to_string(),
            Some("not-a-timestamp".to_string()),
        );
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.executed);
        assert!(result.blocked);
        assert_eq!(result.result_summary, "blocked_invalid_requested_timestamp");
    }

    #[test]
    fn live_action_runner_request_does_not_execute_arbitrary_fields() {
        let requested_timestamp = now_timestamp();
        let request = LiveActionRunnerRequest {
            provider: "terminal".to_string(),
            state: "approved".to_string(),
            action_label: "terminal; rm -rf /".to_string(),
            request_id: "unsafe-request-id-$(whoami)".to_string(),
            requested_timestamp: requested_timestamp.clone(),
            timeout: None,
            expiry: now_plus_millis(&requested_timestamp, 5000),
            intent: "terminal-readonly-probe".to_string(),
        };
        let result = runtime_bridge::live_action_runner_execute(request);

        assert!(!result.blocked);
        assert!(!result.result_summary.contains("terminal; rm -rf /"));
        assert!(!result
            .result_summary
            .contains("unsafe-request-id-$(whoami)"));
    }

    #[test]
    fn phase3_local_artifact_reader_reads_only_local_private_json() {
        let base_dir = std::env::temp_dir().join(format!(
            "steerboard-phase3-artifact-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        ));
        let local_private_dir = base_dir.join("local_private");
        std::fs::create_dir_all(&local_private_dir).unwrap();
        std::fs::write(
            local_private_dir.join("phase3-smoke-proof-bundle.json"),
            "{\"source\":\"steerboard.phase3.smoke-record.v1\"}\n",
        )
        .unwrap();

        let artifact = runtime_bridge::read_phase3_local_artifact_from(
            &base_dir,
            "phase3-smoke-proof-bundle.json",
        )
        .unwrap();

        assert!(artifact.contains("steerboard.phase3.smoke-record.v1"));
        assert!(
            runtime_bridge::read_phase3_local_artifact_from(&base_dir, "../secret.json").is_err()
        );

        let _ = std::fs::remove_dir_all(base_dir);
    }

    #[test]
    fn codex_transport_live_control_smoke_passes_with_full_protocol_support() {
        let proof = runtime_bridge::codex_transport_live_control_smoke_from_probe(
            fake_codex_transport_probe(),
        );

        assert!(proof.executed);
        assert!(proof.ok);
        assert!(!proof.unsupported);
        assert!(proof.app_server_ready);
        assert!(proof.protocol_ready);
        assert!(proof.source_detected);
        assert_eq!(proof.supported_method_count, proof.total_method_count);
        assert_eq!(proof.unsupported_method_count, 0);
        assert!(
            proof
                .required_methods
                .iter()
                .all(|method| method.state == "supported")
        );
    }

    #[test]
    fn codex_transport_live_control_smoke_marks_partial_protocol_as_unsupported() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.turn_interrupt = false;
        probe.app_server.protocol.turn_steer = false;

        let proof = runtime_bridge::codex_transport_live_control_smoke_from_probe(probe);

        assert!(proof.executed);
        assert!(!proof.ok);
        assert!(proof.unsupported);
        assert_eq!(proof.supported_method_count, 3);
        assert_eq!(proof.unsupported_method_count, 2);
        assert!(proof
            .required_methods
            .iter()
            .any(|method| method.method == "turn/interrupt" && method.state == "unsupported"));
        assert!(proof
            .required_methods
            .iter()
            .any(|method| method.method == "turn/steer" && method.state == "unsupported"));
        assert!(proof
            .detail
            .to_lowercase()
            .contains("control smoke proof is unsupported"));
    }

    #[test]
    fn codex_transport_live_control_smoke_marks_unsupported_when_provider_not_detected() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.codex_home.present = false;
        probe.codex_home.config_present = false;
        probe.app_server.available = false;
        probe.app_server.stdio_handshake = false;
        probe.exec_json.available = false;

        let proof = runtime_bridge::codex_transport_live_control_smoke_from_probe(probe);

        assert!(proof.executed);
        assert!(!proof.ok);
        assert!(proof.unsupported);
        assert!(!proof.source_detected);
        assert!(!proof.app_server_ready);
        assert!(proof.supported_method_count > 0);
        assert_eq!(proof.unsupported_method_count, 0);
    }

    #[test]
    fn codex_transport_active_turn_control_smoke_marks_ok_with_interrupt_status() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/interrupt", true, true, ""),
            ],
            &[
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "item/agentMessage/delta",
                    "params": {
                        "turnId": "turn-1",
                        "delta": "safe"
                    }
                }),
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "turn/interrupted",
                    "params": {
                        "turn": {
                            "id": "turn-1",
                            "status": "interrupted"
                        }
                    }
                }),
            ],
        );

        assert!(proof.executed);
        assert!(proof.ok);
        assert!(!proof.unsupported);
        assert!(proof.interrupt_observed);
        assert_eq!(proof.event_count, 2);
        assert_eq!(proof.transcript_length, 4);
    }

    #[test]
    fn codex_transport_active_turn_control_smoke_distinguishes_completed_without_interrupt_status() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/interrupt", true, true, ""),
            ],
            &[
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "turn/completed",
                    "params": {
                        "turn": {
                            "id": "turn-2",
                            "status": "completed"
                        }
                    }
                })
            ],
        );

        assert!(proof.executed);
        assert!(proof.ok);
        assert!(proof.completed);
        assert!(!proof.interrupt_observed);
        assert_eq!(proof.detail, "Active-turn control smoke completed; turn/interrupt did not return an interrupted event.");
    }

    #[test]
    fn codex_transport_active_turn_control_smoke_marks_unsupported_when_session_not_started() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke_from_values(
            Some("1700000000000".to_string()),
            false,
            false,
            false,
            false,
            vec![active_turn_control_smoke_control(
                "thread/start",
                true,
                false,
                "session failed to start",
            )],
            &[],
        );

        assert!(!proof.executed);
        assert!(!proof.ok);
        assert!(proof.unsupported);
        assert!(!proof.session_started);
    }

    #[test]
    fn codex_transport_active_turn_control_smoke_includes_failure_message() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/interrupt", true, true, ""),
            ],
            &[serde_json::json!({
                "jsonrpc": "2.0",
                "method": "turn/failed",
                "params": {
                    "turn": {
                        "id": "turn-3",
                        "status": "failed"
                    },
                    "error": {
                        "message": "provider rejected interrupt"
                    }
                }
            })],
        );

        assert!(!proof.ok);
        assert!(proof.failed);
        assert!(proof.detail.contains("provider rejected interrupt"));
    }

    #[test]
    fn codex_transport_active_turn_control_smoke_ignores_transient_reconnect_before_interrupt() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/interrupt", true, true, ""),
            ],
            &[
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "error",
                    "params": {
                        "turnId": "turn-3",
                        "message": "Reconnecting... 2/5"
                    }
                }),
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "turn/interrupted",
                    "params": {
                        "turn": {
                            "id": "turn-3",
                            "status": "interrupted"
                        }
                    }
                }),
            ],
        );

        assert!(proof.ok);
        assert!(!proof.failed);
        assert!(proof.interrupt_observed);
        assert_eq!(proof.event_count, 2);
    }

    #[test]
    fn codex_transport_active_turn_steer_smoke_marks_ok_when_token_is_observed() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/steer", true, true, ""),
            ],
            &[
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "item/agentMessage/delta",
                    "params": {
                        "turnId": "turn-1",
                        "delta": "STEERBOARD_ACTIVE_TURN_STEER_OK"
                    }
                }),
                serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "turn/completed",
                    "params": {
                        "turn": {
                            "id": "turn-1",
                            "status": "completed"
                        }
                    }
                }),
            ],
        );

        assert!(proof.executed);
        assert!(proof.ok);
        assert!(!proof.unsupported);
        assert!(proof.steer_sent);
        assert!(proof.steer_observed);
        assert!(proof.expected_token_seen);
        assert_eq!(proof.event_count, 2);
        assert_eq!(proof.transcript_length, 31);
    }

    #[test]
    fn codex_transport_active_turn_steer_smoke_distinguishes_completed_without_token() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/steer", true, true, ""),
            ],
            &[serde_json::json!({
                "jsonrpc": "2.0",
                "method": "turn/completed",
                "params": {
                    "turn": {
                        "id": "turn-2",
                        "status": "completed"
                    }
                }
            })],
        );

        assert!(proof.executed);
        assert!(proof.ok);
        assert!(proof.completed);
        assert!(!proof.steer_observed);
        assert!(!proof.expected_token_seen);
        assert_eq!(
            proof.detail,
            "Active-turn steer smoke completed before the expected steer token was observed."
        );
    }

    #[test]
    fn codex_transport_active_turn_steer_smoke_marks_unsupported_when_session_not_started() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke_from_values(
            Some("1700000000000".to_string()),
            false,
            false,
            false,
            false,
            vec![active_turn_control_smoke_control(
                "thread/start",
                true,
                false,
                "session failed to start",
            )],
            &[],
        );

        assert!(!proof.executed);
        assert!(!proof.ok);
        assert!(proof.unsupported);
        assert!(!proof.session_started);
    }

    #[test]
    fn codex_transport_active_turn_steer_smoke_includes_failure_message() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/steer", true, true, ""),
            ],
            &[serde_json::json!({
                "jsonrpc": "2.0",
                "method": "turn/failed",
                "params": {
                    "turn": {
                        "id": "turn-4",
                        "status": "failed"
                    },
                    "error": {
                        "message": "provider rejected steer"
                    }
                }
            })],
        );

        assert!(!proof.ok);
        assert!(proof.failed);
        assert!(proof.detail.contains("provider rejected steer"));
    }

    #[test]
    fn codex_transport_active_turn_steer_smoke_ignores_transient_reconnect() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke_from_values(
            Some("1700000000000".to_string()),
            true,
            true,
            true,
            true,
            vec![
                active_turn_control_smoke_control("thread/start", true, true, ""),
                active_turn_control_smoke_control("turn/start", true, true, ""),
                active_turn_control_smoke_control("turn/steer", true, true, ""),
            ],
            &[serde_json::json!({
                "jsonrpc": "2.0",
                "method": "error",
                "params": {
                    "turnId": "turn-4",
                    "message": "Reconnecting... 2/5"
                }
            })],
        );

        assert!(proof.ok);
        assert!(!proof.failed);
        assert!(proof.steer_sent);
        assert!(!proof.steer_observed);
    }

    #[test]
    fn codex_transport_probe_keeps_prompt_execution_locked() {
        let probe = runtime_bridge::codex_transport_probe();
        assert_eq!(probe.source, "desktop");
        assert!(!probe.execution.process_execution_allowed);
        assert!(!probe.execution.prompt_execution_allowed);
        assert!(probe.execution.detail.to_lowercase().contains("no prompt"));
    }

    #[test]
    fn codex_auth_classifier_detects_chatgpt_without_leaking_tokens() {
        let (mode, billing, detail) = runtime_bridge::classify_codex_auth(
            true,
            Some(r#"{"tokens":{"access_token":"sk-secret-chatgpt-token"}}"#),
            false,
        );

        assert_eq!(mode, "chatgpt");
        assert_eq!(billing, "chatgpt-entitlement");
        assert!(detail.contains("ChatGPT"));
        assert!(!detail.contains("sk-secret-chatgpt-token"));
    }

    #[test]
    fn codex_auth_classifier_detects_api_key_without_leaking_key() {
        let (mode, billing, detail) = runtime_bridge::classify_codex_auth(
            true,
            Some(r#"{"OPENAI_API_KEY":"sk-secret-api-key"}"#),
            false,
        );

        assert_eq!(mode, "api-key");
        assert_eq!(billing, "api-billing");
        assert!(detail.contains("API key"));
        assert!(!detail.contains("sk-secret-api-key"));
    }

    #[test]
    fn codex_auth_classifier_marks_missing_auth_as_not_connected() {
        let (mode, billing, detail) = runtime_bridge::classify_codex_auth(false, None, false);

        assert_eq!(mode, "missing");
        assert_eq!(billing, "not-connected");
        assert!(detail.contains("No Codex sign-in"));
    }

    #[test]
    fn codex_auth_classifier_keeps_malformed_auth_unknown() {
        let (mode, billing, detail) =
            runtime_bridge::classify_codex_auth(true, Some("{not-json"), false);

        assert_eq!(mode, "present-unknown");
        assert_eq!(billing, "unknown");
        assert!(detail.contains("could not be classified safely"));
    }

    #[test]
    fn codex_home_probe_serialization_omits_auth_paths_and_secrets() {
        let (auth_mode, auth_billing, auth_detail) = runtime_bridge::classify_codex_auth(
            true,
            Some(r#"{"OPENAI_API_KEY":"sk-secret-serialized"}"#),
            false,
        );
        let probe = CodexHomeProbe {
            present: true,
            config_present: true,
            auth_present: true,
            auth_mode,
            auth_billing,
            auth_detail,
            skills_count: 2,
            plugins_present: true,
        };
        let serialized = serde_json::to_string(&probe).expect("home probe should serialize");

        assert!(serialized.contains("api-key"));
        assert!(!serialized.contains("sk-secret-serialized"));
        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("config.toml"));
        assert!(!serialized.contains("OPENAI_API_KEY"));
        assert!(!serialized.contains("token"));
    }

    #[test]
    fn panel_initialize_request_does_not_start_thread_or_prompt() {
        let request = runtime_bridge::initialize_request(7, "unit-test-client");
        assert_eq!(
            request.get("method").and_then(serde_json::Value::as_str),
            Some("initialize")
        );
        assert_eq!(
            request.get("id").and_then(serde_json::Value::as_i64),
            Some(7)
        );
        let serialized = request.to_string();
        assert!(!serialized.contains("thread/start"));
        assert!(!serialized.contains("turn/start"));
        assert!(!serialized.contains("input"));
        assert!(!serialized.contains("prompt"));
    }

    #[test]
    fn panel_session_key_preserves_panel_identity_with_default_fallback() {
        assert_eq!(runtime_bridge::panel_session_key(None), "default");
        assert_eq!(
            runtime_bridge::panel_session_key(Some("  cockpit-panel-a  ".to_string())),
            "cockpit-panel-a"
        );
        assert_eq!(
            runtime_bridge::panel_session_key(Some("   ".to_string())),
            "default"
        );
    }

    #[test]
    fn panel_turn_settings_preserve_supported_model_and_reasoning() {
        let settings = runtime_bridge::panel_turn_settings(
            Some(" GPT-5.5 ".to_string()),
            Some("extra_high".to_string()),
            Some("workspace".to_string()),
        );

        assert_eq!(settings.model.as_deref(), Some("gpt-5.5"));
        assert_eq!(settings.reasoning_effort, "xhigh");
        assert_eq!(settings.permission_mode, "workspace-agent");
        assert_eq!(settings.approval_policy, "on-request");

        let legacy = runtime_bridge::panel_turn_settings(Some("Codex-Agent".to_string()), None, None);
        assert_eq!(legacy.model.as_deref(), Some("gpt-5.5"));
        assert_eq!(legacy.reasoning_effort, "low");
        assert_eq!(legacy.permission_mode, "full-agent");

        let spark = runtime_bridge::panel_turn_settings(
            Some("GPT-5.3-Codex-Spark".to_string()),
            Some("high".to_string()),
            Some("read-only-agent".to_string()),
        );
        assert_eq!(spark.model.as_deref(), Some("gpt-5.3-codex-spark"));
        assert_eq!(spark.reasoning_effort, "high");
        assert_eq!(spark.sandbox_policy, "readOnly(workspace)");

        let fallback = runtime_bridge::panel_turn_settings(
            Some("unknown model".to_string()),
            Some("unknown-effort".to_string()),
            Some("sideways".to_string()),
        );
        assert_eq!(fallback.model, None);
        assert_eq!(fallback.reasoning_effort, "low");
        assert_eq!(fallback.permission_mode, "full-agent");
        assert_eq!(
            runtime_bridge::turn_sandbox_policy("full-agent")
                .get("type")
                .and_then(serde_json::Value::as_str),
            Some("dangerFullAccess")
        );
        assert_eq!(
            runtime_bridge::turn_sandbox_policy("workspace-agent")
                .get("networkAccess")
                .and_then(serde_json::Value::as_bool),
            Some(false)
        );
    }

    #[test]
    fn panel_auth_status_serializes_without_secret_fields() {
        let response = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "result": {
                "requiresOpenaiAuth": false,
                "account": {
                    "type": "chatgpt",
                    "planType": "plus",
                    "email": "person@example.com",
                    "apiKey": "sk-secret-value",
                    "token": "private-token"
                }
            }
        });
        let status = runtime_bridge::sanitize_panel_auth_status(Some(&response));
        let serialized = serde_json::to_string(&status).expect("auth status should serialize");

        assert_eq!(status.state, "available");
        assert_eq!(status.auth_mode.as_deref(), Some("chatgpt"));
        assert_eq!(status.plan_type.as_deref(), Some("plus"));
        assert!(!serialized.contains("person@example.com"));
        assert!(!serialized.contains("sk-secret-value"));
        assert!(!serialized.contains("private-token"));
    }

    #[test]
    fn panel_model_catalog_parses_supported_reasoning() {
        let response = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 3,
            "result": {
                "data": [
                    {
                        "id": "gpt-5.5",
                        "model": "gpt-5.5",
                        "displayName": "GPT-5.5",
                        "isDefault": true,
                        "defaultReasoningEffort": "medium",
                        "supportedReasoningEfforts": [
                            { "reasoningEffort": "minimal", "description": "Fastest" },
                            { "reasoningEffort": "extra-high", "description": "Deepest" }
                        ]
                    },
                    {
                        "id": "bad model id",
                        "displayName": "Bad"
                    }
                ]
            }
        });
        let catalog = runtime_bridge::sanitize_panel_model_catalog(Some(&response));

        assert_eq!(catalog.len(), 1);
        assert_eq!(catalog[0].id, "gpt-5.5");
        assert_eq!(catalog[0].default_reasoning_effort.as_deref(), Some("medium"));
        assert_eq!(
            catalog[0]
                .supported_reasoning_efforts
                .iter()
                .map(|option| option.reasoning_effort.as_str())
                .collect::<Vec<_>>(),
            vec!["minimal", "xhigh"]
        );
    }

    #[test]
    fn panel_steer_request_uses_expected_turn_id_precondition() {
        let request = runtime_bridge::steer_request(9, "thread-a", "turn-a", "Narrow the answer.");
        assert_eq!(
            request.get("method").and_then(serde_json::Value::as_str),
            Some("turn/steer")
        );
        assert_eq!(
            request.get("id").and_then(serde_json::Value::as_i64),
            Some(9)
        );
        let params = request
            .get("params")
            .and_then(serde_json::Value::as_object)
            .expect("params should be present");
        assert_eq!(
            params.get("threadId").and_then(serde_json::Value::as_str),
            Some("thread-a")
        );
        assert_eq!(
            params
                .get("expectedTurnId")
                .and_then(serde_json::Value::as_str),
            Some("turn-a")
        );
        assert!(params.get("turnId").is_none());
        assert!(request.to_string().contains("Narrow the answer."));
    }

    fn active_turn_control_smoke_control(
        control: &str,
        attempted: bool,
        sent: bool,
        detail: &str,
    ) -> CodexActiveTurnControlSmokeControlProof {
        CodexActiveTurnControlSmokeControlProof {
            control: control.to_string(),
            attempted,
            sent,
            observed: false,
            supported: false,
            detail: detail.to_string(),
        }
    }

    fn two_panel_smoke_panel(
        panel_id: &str,
        session_id: &str,
        thread_id: &str,
        expected_token_seen: bool,
        foreign_token_seen: bool,
    ) -> CodexTwoPanelSmokePanelProof {
        CodexTwoPanelSmokePanelProof {
            panel_id: panel_id.to_string(),
            session_id: Some(session_id.to_string()),
            thread_id: Some(thread_id.to_string()),
            session_id_seen: true,
            thread_id_seen: true,
            completed: true,
            failed: false,
            expected_token_seen,
            foreign_token_seen,
            event_count: 4,
            transcript_length: 24,
            detail: "Codex panel turn completed.".to_string(),
        }
    }

    #[test]
    fn two_panel_smoke_result_passes_only_with_distinct_clean_panels() {
        let result = runtime_bridge::two_panel_smoke_result(
            Some("2026-06-06T00:00:00.000Z".to_string()),
            vec![
                two_panel_smoke_panel("panel-a", "session-a", "thread-a", true, false),
                two_panel_smoke_panel("panel-b", "session-b", "thread-b", true, false),
            ],
        );

        assert!(result.ok);
        assert!(result.executed);
        assert!(result.distinct_session_ids);
        assert!(result.distinct_thread_ids);
        assert!(result.both_completed);
        assert!(!result.cross_talk_detected);
    }

    #[test]
    fn two_panel_smoke_result_blocks_shared_thread_or_crosstalk() {
        let shared_thread = runtime_bridge::two_panel_smoke_result(
            None,
            vec![
                two_panel_smoke_panel("panel-a", "session-a", "thread-shared", true, false),
                two_panel_smoke_panel("panel-b", "session-b", "thread-shared", true, false),
            ],
        );
        assert!(!shared_thread.ok);
        assert!(!shared_thread.distinct_thread_ids);

        let crosstalk = runtime_bridge::two_panel_smoke_result(
            None,
            vec![
                two_panel_smoke_panel("panel-a", "session-a", "thread-a", true, true),
                two_panel_smoke_panel("panel-b", "session-b", "thread-b", true, false),
            ],
        );
        assert!(!crosstalk.ok);
        assert!(crosstalk.cross_talk_detected);
        assert!(crosstalk.detail.contains("cross-panel token leakage"));
    }

    #[test]
    fn panel_event_normalizes_agent_delta() {
        let value = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "item/agentMessage/delta",
            "params": {
                "turnId": "turn-1",
                "delta": "hello"
            }
        });

        let event = runtime_bridge::normalize_panel_event(&value).expect("event should normalize");
        assert_eq!(event.method, "item/agentMessage/delta");
        assert_eq!(event.event_type, "agent_delta");
        assert_eq!(event.turn_id.as_deref(), Some("turn-1"));
        assert_eq!(event.delta.as_deref(), Some("hello"));
    }

    #[test]
    fn panel_event_normalizes_supported_approval_request_id() {
        let value = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 42,
            "method": "item/commandExecution/requestApproval",
            "params": {
                "threadId": "thread-1",
                "turnId": "turn-1",
                "itemId": "item-1",
                "command": "npm.cmd run test",
                "reason": "Command needs approval."
            }
        });

        let event = runtime_bridge::normalize_panel_event(&value).expect("event should normalize");
        assert_eq!(event.event_type, "approval_request");
        assert_eq!(event.request_id.as_deref(), Some("42"));
        assert_eq!(event.thread_id.as_deref(), Some("thread-1"));
        assert_eq!(event.turn_id.as_deref(), Some("turn-1"));
        assert_eq!(event.item_id.as_deref(), Some("item-1"));
        assert!(runtime_bridge::panel_approval_request_is_supported(&event));
    }

    #[test]
    fn approval_response_message_matches_codex_rpc_shape() {
        let accept = runtime_bridge::normalize_approval_decision("approve", false)
            .expect("approve should normalize");
        let request = runtime_bridge::approval_response_message("42", &accept);
        assert_eq!(request.get("id").and_then(serde_json::Value::as_i64), Some(42));
        assert_eq!(
            request
                .get("result")
                .and_then(|result| result.get("decision"))
                .and_then(serde_json::Value::as_str),
            Some("accept")
        );

        let session_accept = runtime_bridge::normalize_approval_decision("approve", true)
            .expect("approve for session should normalize");
        assert_eq!(session_accept, "acceptForSession");
        let uuid_request = runtime_bridge::approval_response_message("approval-id", "decline");
        assert_eq!(
            uuid_request.get("id").and_then(serde_json::Value::as_str),
            Some("approval-id")
        );
        assert!(!uuid_request.to_string().contains("sk-secret"));
    }

    #[test]
    fn thread_summary_sanitizes_paths_and_secret_like_values() {
        let thread = serde_json::json!({
            "id": "thread-1",
            "name": "sk-secret-name",
            "preview": "Use OPENAI_API_KEY=sk-secret-value here",
            "status": "completed",
            "modelProvider": "openai",
            "createdAt": 1710000000_u64,
            "updatedAt": 1710000100_u64,
            "cwd": "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard",
            "turns": [
                {
                    "id": "turn-1",
                    "items": [
                        { "type": "userMessage", "id": "u1", "content": [{ "type": "input_text", "text": "hello sk-secret-token" }] },
                        { "type": "agentMessage", "id": "a1", "text": "done" }
                    ]
                }
            ]
        });

        let summary = runtime_bridge::sanitize_thread_summary(&thread);
        let transcript = runtime_bridge::sanitize_thread_transcript_preview(&thread);
        let serialized = serde_json::to_string(&summary).expect("summary should serialize");

        assert_eq!(summary.id, "thread-1");
        assert_eq!(summary.cwd_label.as_deref(), Some("Steerboard"));
        assert_eq!(summary.turn_count, 1);
        assert_eq!(summary.item_count, 2);
        assert!(serialized.contains("[redacted]"));
        assert!(!serialized.contains("sk-secret-value"));
        assert!(!serialized.contains("C:\\Users\\MJ"));
        assert!(transcript.iter().any(|line| line.contains("[redacted]")));
    }

    #[test]
    fn panel_event_normalizes_completed_turn_status() {
        let value = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "turn/completed",
            "params": {
                "turn": {
                    "id": "turn-2",
                    "status": "completed"
                }
            }
        });

        let event = runtime_bridge::normalize_panel_event(&value).expect("event should normalize");
        assert_eq!(event.event_type, "turn_status");
        assert_eq!(event.turn_id.as_deref(), Some("turn-2"));
        assert_eq!(event.status.as_deref(), Some("completed"));
    }

    #[test]
    fn panel_event_normalizes_nested_error_message() {
        let value = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "error",
            "params": {
                "turnId": "turn-3",
                "error": {
                    "message": "provider failed"
                }
            }
        });

        let event = runtime_bridge::normalize_panel_event(&value).expect("event should normalize");
        assert_eq!(event.event_type, "error");
        assert_eq!(event.turn_id.as_deref(), Some("turn-3"));
        assert_eq!(event.message.as_deref(), Some("provider failed"));
    }

    #[test]
    fn panel_event_turn_filter_excludes_unrelated_reconnect_events() {
        let reconnect = CodexPanelEvent {
            method: "turn/failed".to_string(),
            event_type: "error".to_string(),
            request_id: None,
            thread_id: None,
            turn_id: None,
            item_id: None,
            status: Some("failed".to_string()),
            delta: None,
            message: Some("Reconnecting... 2/5".to_string()),
            summary: None,
            item_type: None,
            item_status: None,
            item_title: None,
            item_detail: None,
            provider_timestamp: None,
            usage_input_tokens: None,
            usage_output_tokens: None,
            usage_total_tokens: None,
        };
        let matching = CodexPanelEvent {
            method: "turn/completed".to_string(),
            event_type: "turn_status".to_string(),
            request_id: None,
            thread_id: None,
            turn_id: Some("turn-1".to_string()),
            item_id: None,
            status: Some("completed".to_string()),
            delta: None,
            message: None,
            summary: None,
            item_type: None,
            item_status: None,
            item_title: None,
            item_detail: None,
            provider_timestamp: None,
            usage_input_tokens: None,
            usage_output_tokens: None,
            usage_total_tokens: None,
        };
        let other_turn = CodexPanelEvent {
            turn_id: Some("turn-2".to_string()),
            ..matching.clone()
        };

        assert!(!runtime_bridge::event_belongs_to_turn(Some("turn-1"), &reconnect));
        assert!(runtime_bridge::event_belongs_to_turn(Some("turn-1"), &matching));
        assert!(!runtime_bridge::event_belongs_to_turn(Some("turn-1"), &other_turn));
        assert!(runtime_bridge::event_belongs_to_turn(None, &reconnect));
    }

    fn fake_codex_transport_probe() -> CodexTransportProbe {
        CodexTransportProbe {
            source: "desktop".to_string(),
            checked_at: Some("1700000000000".to_string()),
            cli: CodexCliProbe {
                available: true,
                version: Some("1.2.3".to_string()),
            },
            codex_home: CodexHomeProbe {
                present: true,
                config_present: true,
                auth_present: true,
                auth_mode: "chatgpt".to_string(),
                auth_billing: "chatgpt-entitlement".to_string(),
                auth_detail: "ChatGPT/Codex sign-in detected; usage should follow that entitlement."
                    .to_string(),
                skills_count: 4,
                plugins_present: true,
            },
            app_server: CodexAppServerProbe {
                available: true,
                stdio_handshake: true,
                daemon_lifecycle: "unsupported".to_string(),
                user_agent: Some("unit-test-agent".to_string()),
                platform_os: Some("test-os".to_string()),
                protocol: CodexAppServerProtocolProbe {
                    thread_start: true,
                    turn_start: true,
                    turn_interrupt: true,
                    turn_steer: true,
                    agent_message_delta: true,
                    plugin_list: true,
                    mcp_status: false,
                    skills_list: true,
                },
            },
            exec_json: CodexExecJsonProbe {
                available: true,
                can_stream_events: true,
                detail: "fake".to_string(),
            },
            execution: CodexExecutionProbe {
                process_execution_allowed: false,
                prompt_execution_allowed: false,
                detail: "fake".to_string(),
            },
        }
    }

    #[test]
    fn codex_command_catalog_preview_marks_app_server_commands_live_from_safe_metadata() {
        let preview =
            runtime_bridge::codex_command_catalog_preview_from_probe(fake_codex_transport_probe());

        assert_eq!(preview.source, "provider-live");
        assert!(preview
            .detail
            .to_lowercase()
            .contains("capability metadata"));
        assert!(preview.safety.to_lowercase().contains("did not send prompts"));
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.command == "/plan" && entry.state == "live"));
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.command == "/mcp" && entry.state == "unsupported"));
    }

    #[test]
    fn codex_command_catalog_preview_uses_preview_when_live_session_is_not_ready() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.stdio_handshake = false;
        probe.app_server.protocol.agent_message_delta = false;

        let preview = runtime_bridge::codex_command_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.command == "/plan" && entry.state == "preview"));
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.command == "/status" && entry.state == "preview"));
    }

    #[test]
    fn codex_command_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.app_server.available = false;
        probe.app_server.stdio_handshake = false;
        probe.exec_json.available = false;

        let preview = runtime_bridge::codex_command_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert!(preview.entries.is_empty());
        assert!(preview
            .detail
            .to_lowercase()
            .contains("no provider command capability"));
    }

    #[test]
    fn codex_command_catalog_preview_excludes_secret_and_path_details() {
        let preview =
            runtime_bridge::codex_command_catalog_preview_from_probe(fake_codex_transport_probe());
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("raw transcript:"));
        assert!(serialized.contains("capability"));
        assert!(serialized.contains("raw transcripts"));
    }

    #[test]
    fn codex_skill_catalog_preview_marks_skills_live_from_safe_metadata() {
        let preview =
            runtime_bridge::codex_skill_catalog_preview_from_probe(fake_codex_transport_probe());

        assert_eq!(preview.source, "provider-live");
        assert!(preview.safety.to_lowercase().contains("did not read skill bodies"));
        assert!(preview.entries.iter().any(|entry| {
            entry.id == "provider-local-skills"
                && entry.state == "live"
                && entry.detail.contains("4 metadata-visible")
        }));
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.id == "provider-skills-schema"));
    }

    #[test]
    fn codex_skill_catalog_preview_uses_setup_required_when_profile_has_no_skills() {
        let mut probe = fake_codex_transport_probe();
        probe.codex_home.skills_count = 0;
        probe.app_server.protocol.skills_list = false;

        let preview = runtime_bridge::codex_skill_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-skills-setup");
        assert_eq!(preview.entries[0].state, "setup-required");
    }

    #[test]
    fn codex_skill_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.codex_home.present = false;
        probe.codex_home.skills_count = 0;
        probe.app_server.available = false;
        probe.exec_json.available = false;

        let preview = runtime_bridge::codex_skill_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert!(preview.entries.is_empty());
        assert!(preview
            .detail
            .to_lowercase()
            .contains("no provider skill capability"));
    }

    #[test]
    fn codex_skill_catalog_preview_excludes_secret_bodies_and_path_details() {
        let preview =
            runtime_bridge::codex_skill_catalog_preview_from_probe(fake_codex_transport_probe());
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("skill.md"));
        assert!(serialized.contains("metadata"));
    }

    #[test]
    fn codex_plugin_catalog_preview_marks_plugins_live_from_safe_metadata() {
        let preview =
            runtime_bridge::codex_plugin_catalog_preview_from_probe(fake_codex_transport_probe());

        assert_eq!(preview.source, "provider-live");
        assert!(preview.safety.to_lowercase().contains("did not read plugin bodies"));
        assert!(preview
            .detail
            .to_lowercase()
            .contains("capability metadata"));
        assert!(preview.entries.iter().any(|entry| {
            entry.id == "provider-local-plugins"
                && entry.state == "live"
                && entry.capability == "plugin-metadata"
        }));
        assert!(preview.entries.iter().any(|entry| {
            entry.id == "provider-plugin-schema"
                && entry.state == "live"
                && entry.capability == "plugin-list"
        }));
    }

    #[test]
    fn codex_plugin_catalog_preview_uses_setup_required_when_profile_has_no_plugins() {
        let mut probe = fake_codex_transport_probe();
        probe.codex_home.plugins_present = false;
        probe.app_server.protocol.plugin_list = false;

        let preview = runtime_bridge::codex_plugin_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-plugin-setup");
        assert_eq!(preview.entries[0].state, "setup-required");
        assert_eq!(preview.entries[0].count, 0);
    }

    #[test]
    fn codex_plugin_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.codex_home.present = false;
        probe.codex_home.plugins_present = false;
        probe.app_server.available = false;
        probe.exec_json.available = false;

        let preview = runtime_bridge::codex_plugin_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert!(preview.entries.is_empty());
        assert!(preview
            .detail
            .to_lowercase()
            .contains("no provider plugin capability"));
    }

    #[test]
    fn codex_plugin_catalog_preview_excludes_secret_bodies_and_path_details() {
        let preview =
            runtime_bridge::codex_plugin_catalog_preview_from_probe(fake_codex_transport_probe());
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("plugin.json"));
        assert!(!serialized.contains("plugin.md"));
        assert!(!serialized.contains("manifest"));
        assert!(serialized.contains("metadata"));
    }

    #[test]
    fn codex_mcp_catalog_preview_marks_mcp_live_from_safe_metadata() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = true;

        let preview = runtime_bridge::codex_mcp_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-live");
        assert!(preview.safety.to_lowercase().contains("did not read mcp config bodies"));
        assert!(preview
            .detail
            .to_lowercase()
            .contains("capability metadata"));
        assert!(preview.entries.iter().any(|entry| {
            entry.id == "provider-mcp-status"
                && entry.state == "live"
                && entry.capability == "mcp-status"
        }));
    }

    #[test]
    fn codex_mcp_catalog_preview_uses_preview_when_live_session_is_not_ready() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = true;
        probe.app_server.stdio_handshake = false;
        probe.app_server.protocol.agent_message_delta = false;

        let preview = runtime_bridge::codex_mcp_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-mcp-status");
        assert_eq!(preview.entries[0].state, "preview");
    }

    #[test]
    fn codex_mcp_catalog_preview_uses_setup_required_when_profile_has_no_mcp_status() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = false;

        let preview = runtime_bridge::codex_mcp_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-mcp-setup");
        assert_eq!(preview.entries[0].state, "setup-required");
    }

    #[test]
    fn codex_mcp_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.codex_home.present = false;
        probe.app_server.available = false;
        probe.app_server.protocol.mcp_status = false;
        probe.exec_json.available = false;

        let preview = runtime_bridge::codex_mcp_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert!(preview.entries.is_empty());
        assert!(preview
            .detail
            .to_lowercase()
            .contains("no provider mcp capability"));
    }

    #[test]
    fn codex_mcp_catalog_preview_excludes_config_secrets_transcripts_and_path_details() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = true;

        let preview = runtime_bridge::codex_mcp_catalog_preview_from_probe(probe);
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("config.toml"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("secret"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("raw transcript:"));
        assert!(serialized.contains("metadata"));
        assert!(serialized.contains("raw transcripts"));
    }

    #[test]
    fn codex_automation_catalog_preview_marks_automation_live_from_safe_metadata() {
        let preview = runtime_bridge::codex_automation_catalog_preview_from_probe(
            fake_codex_transport_probe(),
        );

        assert_eq!(preview.source, "provider-live");
        assert_eq!(preview.provider_state, "present");
        assert_eq!(preview.readiness, "ready");
        assert!(!preview.setup);
        assert!(!preview.unsupported);
        assert!(!preview.entries.is_empty());
        assert!(preview
            .entries
            .iter()
            .any(|entry| entry.id == "provider-automation-actions" && entry.state == "live"));
        assert_eq!(
            preview.entries[0].setup,
            false,
            "setup-required should be false when automation is exposed."
        );
        assert!(preview.safety.to_lowercase().contains("private paths"));
    }

    #[test]
    fn codex_automation_catalog_preview_uses_setup_required_when_provider_has_no_exposed_api() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = false;
        probe.app_server.protocol.skills_list = false;
        probe.app_server.protocol.plugin_list = false;

        let preview = runtime_bridge::codex_automation_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.readiness, "setup-required");
        assert!(preview.setup);
        assert!(preview.unsupported);
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-automation-setup");
        assert_eq!(preview.entries[0].state, "setup-required");
    }

    #[test]
    fn codex_automation_catalog_preview_uses_preview_when_live_session_is_not_ready() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.stdio_handshake = false;
        probe.app_server.protocol.agent_message_delta = false;

        let preview = runtime_bridge::codex_automation_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.readiness, "preview");
        assert!(!preview.setup);
        assert!(!preview.unsupported);
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].state, "preview");
    }

    #[test]
    fn codex_automation_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.app_server.available = false;
        probe.app_server.stdio_handshake = false;
        probe.exec_json.available = false;
        probe.codex_home.present = false;
        probe.app_server.protocol.mcp_status = false;
        probe.app_server.protocol.skills_list = false;
        probe.app_server.protocol.plugin_list = false;

        let preview = runtime_bridge::codex_automation_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert_eq!(preview.entries.len(), 0);
        assert_eq!(preview.readiness, "unavailable");
        assert!(preview.detail.to_lowercase().contains("no provider automation capability"));
    }

    #[test]
    fn codex_automation_catalog_preview_excludes_secrets_auth_paths_and_transcripts() {
        let preview = runtime_bridge::codex_automation_catalog_preview_from_probe(
            fake_codex_transport_probe(),
        );
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("raw transcript"));
        assert!(!serialized.contains("secret"));
    }

    #[test]
    fn codex_personalization_catalog_preview_marks_provider_live_from_safe_metadata() {
        let preview = runtime_bridge::codex_personalization_catalog_preview_from_probe(
            fake_codex_transport_probe(),
        );

        assert_eq!(preview.source, "provider-live");
        assert_eq!(preview.readiness, "ready");
        assert!(!preview.setup);
        assert!(!preview.unsupported);
        assert_eq!(preview.provider_state, "present");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-personalization-sources");
        assert_eq!(preview.entries[0].state, "live");
        assert_eq!(preview.entries[0].source, "user-config");
        assert_eq!(preview.entries[0].privacy_posture, "local-process-only");
    }

    #[test]
    fn codex_personalization_catalog_preview_marks_provider_preview_from_safe_metadata() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.stdio_handshake = false;
        probe.app_server.protocol.agent_message_delta = false;

        let preview = runtime_bridge::codex_personalization_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.readiness, "preview");
        assert!(!preview.setup);
        assert!(!preview.unsupported);
        assert_eq!(preview.provider_state, "present");
        assert_eq!(preview.instruction_source_posture, "local-config");
        assert_eq!(preview.config_source_posture, "local-config-file");
        assert_eq!(preview.layer, "governance");
        assert_eq!(preview.privacy_posture, "local-process-only");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-personalization-sources");
        assert_eq!(preview.entries[0].state, "preview");
        assert!(preview
            .detail
            .to_lowercase()
            .contains("safe metadata"));
    }

    #[test]
    fn codex_personalization_catalog_preview_uses_setup_required_when_no_api_exposed() {
        let mut probe = fake_codex_transport_probe();
        probe.app_server.protocol.mcp_status = false;
        probe.app_server.protocol.skills_list = false;
        probe.app_server.protocol.plugin_list = false;

        let preview = runtime_bridge::codex_personalization_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "provider-preview");
        assert_eq!(preview.readiness, "setup-required");
        assert!(preview.setup);
        assert!(preview.unsupported);
        assert_eq!(preview.config_source_posture, "local-config-file");
        assert_eq!(preview.entries.len(), 1);
        assert_eq!(preview.entries[0].id, "provider-personalization-setup");
        assert_eq!(preview.entries[0].state, "setup-required");
    }

    #[test]
    fn codex_personalization_catalog_preview_reports_unavailable_without_provider_detection() {
        let mut probe = fake_codex_transport_probe();
        probe.cli.available = false;
        probe.app_server.available = false;
        probe.app_server.stdio_handshake = false;
        probe.exec_json.available = false;
        probe.codex_home.present = false;

        let preview = runtime_bridge::codex_personalization_catalog_preview_from_probe(probe);

        assert_eq!(preview.source, "unavailable");
        assert_eq!(preview.readiness, "unavailable");
        assert!(preview.entries.is_empty());
        assert!(preview
            .detail
            .to_lowercase()
            .contains("no provider personalization capability"));
    }

    #[test]
    fn codex_personalization_catalog_preview_excludes_secrets_auth_paths_and_config_bodies() {
        let preview = runtime_bridge::codex_personalization_catalog_preview_from_probe(
            fake_codex_transport_probe(),
        );
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();

        assert!(!serialized.contains("auth.json"));
        assert!(!serialized.contains("config.toml"));
        assert!(!serialized.contains("token"));
        assert!(!serialized.contains("secret"));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("raw transcript"));
        assert!(!serialized.contains("skill.md"));
        assert!(serialized.contains("provider"));
        assert!(serialized.contains("metadata"));
    }

    #[test]
    fn migration_source_preview_marks_auth_and_transcripts_as_excluded_for_codex() {
        let probe = fake_codex_transport_probe();
        let preview = runtime_bridge::migration_source_preview_from_probe(
            Some("codex".to_string()),
            Some(probe),
        );
        let serialized = serde_json::to_string(&preview)
            .unwrap_or_default()
            .to_lowercase();
        assert_eq!(preview.source_id, "codex");
        assert_eq!(preview.source_label, "Codex");
        assert!(preview.detected);
        assert!(preview
            .categories
            .iter()
            .any(|category| category.id == "secrets" && category.status == "excluded"));
        assert!(preview
            .categories
            .iter()
            .any(|category| category.id == "transcripts" && category.status == "excluded"));
        assert!(preview
            .excluded_secrets_summary
            .iter()
            .any(|item| item.to_lowercase().contains("authentication")));
        assert!(!serialized.contains("c:\\"));
        assert!(!serialized.contains("/home/"));
        assert!(!serialized.contains("auth.json"));
        assert!(preview.excluded_secrets_summary.len() >= 3);
        assert!(preview.safety_note.to_lowercase().contains("metadata-only"));
        assert!(!preview.safe_location_label.contains('/'));
        assert!(!preview.safe_location_label.contains('\\'));
        let total_counts = preview.counts.accepted
            + preview.counts.review_required
            + preview.counts.unsupported
            + preview.counts.excluded;
        assert_eq!(total_counts, preview.categories.len());
    }

    #[test]
    fn migration_source_preview_unsupported_source_is_marked_reviewable_without_probe_dependency() {
        let preview = runtime_bridge::migration_source_preview_from_probe(
            Some("antigravity".to_string()),
            None,
        );
        assert_eq!(preview.source_id, "antigravity");
        assert!(!preview.detected);
        assert!(preview.source_label.contains("Unsupported"));
        assert_eq!(
            preview
                .categories
                .iter()
                .filter(|category| category.status == "accepted")
                .count(),
            0
        );
        assert!(preview.counts.unsupported >= 3);
        assert!(preview.safety_note.to_lowercase().contains("no filesystem"));
        assert!(preview
            .safe_location_label
            .contains("No local source location"));
    }

    fn assert_phase3_smoke_supported_or_unsupported(
        source: &str,
        executed: bool,
        unsupported: bool,
        detail: &str,
    ) {
        assert_eq!(
            source, "desktop",
            "phase3 desktop smoke tests should remain provider-scoped to desktop"
        );
        assert!(!detail.trim().is_empty(), "phase3 smoke result must include detail");
        assert!(
            executed || unsupported,
            "phase3 smoke result must either execute or be explicitly unsupported"
        );
        if unsupported {
            let detail = detail.to_lowercase();
            assert!(
                detail.contains("unsupported")
                    || detail.contains("could not")
                    || detail.contains("unable"),
                "unsupported phase3 smoke should include an explicit reason: {detail}"
            );
        }
    }

    fn record_phase3_smoke_artifact<T: serde::Serialize>(key: &str, proof: &T) {
        let Some(path) = std::env::var_os("STEERBOARD_PHASE3_SMOKE_PROOF_BUNDLE_PATH") else {
            return;
        };
        let path = std::path::PathBuf::from(path);
        let mut payload = std::fs::read_to_string(&path)
            .ok()
            .and_then(|serialized| serde_json::from_str::<serde_json::Value>(&serialized).ok())
            .and_then(|value| value.as_object().cloned())
            .unwrap_or_default();

        let Ok(value) = serde_json::to_value(proof) else {
            return;
        };

        payload.insert(key.to_string(), value);

        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(serialized) = serde_json::to_string_pretty(&payload) {
            let _ = std::fs::write(path, format!("{serialized}\n"));
        }
    }

    #[test]
    #[ignore = "phase1-phase2-live-desktop-smoke"]
    fn phase1_phase2_live_desktop_smoke_live_panel_command() {
        let proof = runtime_bridge::codex_transport_live_smoke();
        assert_eq!(
            proof.source, "desktop",
            "phase1 live smoke should remain provider-scoped to desktop"
        );
        assert!(
            proof.executed,
            "phase1 live smoke must execute against the desktop app-server path: {}",
            proof.detail
        );
        assert!(
            proof.ok,
            "phase1 live smoke must pass one send/stream turn: {:?}",
            proof
        );
        assert!(
            proof.thread_id_seen
                && proof.turn_id_seen
                && proof.agent_delta_method_seen
                && proof.turn_completed_seen
                && proof.expected_token_seen
                && !proof.failed_seen,
            "phase1 live smoke proof is incomplete: {:?}",
            proof
        );
    }

    #[test]
    #[ignore = "phase1-phase2-live-desktop-smoke"]
    fn phase1_phase2_live_desktop_smoke_two_panel_command() {
        let proof = runtime_bridge::codex_transport_two_panel_smoke();
        assert_eq!(
            proof.source, "desktop",
            "phase2 two-panel smoke should remain provider-scoped to desktop"
        );
        assert!(
            proof.executed,
            "phase2 two-panel smoke must execute against the desktop app-server path: {}",
            proof.detail
        );
        assert!(
            proof.ok,
            "phase2 two-panel smoke must prove independent completed panel turns: {:?}",
            proof
        );
        assert_eq!(proof.panel_count, 2, "phase2 smoke should cover exactly two panels");
        assert!(
            proof.distinct_session_ids
                && proof.distinct_thread_ids
                && proof.both_completed
                && !proof.cross_talk_detected
                && proof.panels.iter().all(|panel| {
                    panel.session_id_seen
                        && panel.thread_id_seen
                        && panel.completed
                        && panel.expected_token_seen
                        && !panel.foreign_token_seen
                        && !panel.failed
                }),
            "phase2 two-panel smoke proof is incomplete: {:?}",
            proof
        );
    }

    #[test]
    #[ignore = "phase3-live-desktop-smoke"]
    fn phase3_live_desktop_smoke_live_control_command() {
        let proof = runtime_bridge::codex_transport_live_control_smoke();
        record_phase3_smoke_artifact("liveControlSmoke", &proof);
        assert_phase3_smoke_supported_or_unsupported(
            &proof.source,
            proof.executed,
            proof.unsupported,
            &proof.detail,
        );
    }

    #[test]
    #[ignore = "phase3-live-desktop-smoke"]
    fn phase3_live_desktop_smoke_active_turn_control_command() {
        let proof = runtime_bridge::codex_transport_active_turn_control_smoke();
        record_phase3_smoke_artifact("activeTurnInterruptSmoke", &proof);
        assert_phase3_smoke_supported_or_unsupported(
            &proof.source,
            proof.executed,
            proof.unsupported,
            &proof.detail,
        );
        if proof.executed {
            assert!(
                proof.ok,
                "active-turn control smoke must produce a ready proof row: {:?}",
                proof
            );
            assert!(
                !proof.controls.is_empty(),
                "active-turn control smoke should report control probes when attempted"
            );
            assert!(
                proof.controls.iter().any(|control| control.control == "turn/interrupt"),
                "active-turn control smoke should include turn/interrupt control proof"
            );
        }
    }

    #[test]
    #[ignore = "phase3-live-desktop-smoke"]
    fn phase3_live_desktop_smoke_active_turn_steer_command() {
        let proof = runtime_bridge::codex_transport_active_turn_steer_smoke();
        record_phase3_smoke_artifact("activeTurnSteerSmoke", &proof);
        assert_phase3_smoke_supported_or_unsupported(
            &proof.source,
            proof.executed,
            proof.unsupported,
            &proof.detail,
        );
        if proof.executed {
            assert!(
                proof.ok,
                "active-turn steer smoke must produce a ready proof row: {:?}",
                proof
            );
            assert!(
                !proof.controls.is_empty(),
                "active-turn steer smoke should report control probes when attempted"
            );
            assert!(
                proof.controls.iter().any(|control| control.control == "turn/steer"),
                "active-turn steer smoke should include turn/steer control proof"
            );
        }
    }
}
