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
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelEvent {
    pub method: String,
    pub event_type: String,
    pub turn_id: Option<String>,
    pub status: Option<String>,
    pub delta: Option<String>,
    pub message: Option<String>,
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
        CodexPanelEvent, CodexPanelInterruptResult, CodexPanelSessionReadiness,
        CodexPanelSessionStart, CodexPanelSteerResult, CodexPanelTurnResult, CodexTransportProbe,
        CodexTwoPanelSmokePanelProof, CodexTwoPanelSmokeProof,
        LiveActionRunnerRequest, LiveActionRunnerResult, MigrationSourceCategoryPreview,
        MigrationSourcePreview, MigrationSourcePreviewCounts, PermissionApprovalStatus,
        ProviderCommandCatalogEntry, ProviderCommandCatalogPreview, ProviderPluginCatalogEntry,
        ProviderPluginCatalogPreview, ProviderMcpCatalogEntry, ProviderMcpCatalogPreview,
        ProviderSkillCatalogEntry, ProviderSkillCatalogPreview, ProviderAutomationCatalogEntry,
        ProviderAutomationCatalogPreview, ProviderPersonalizationCatalogEntry,
        ProviderPersonalizationCatalogPreview, RuntimeBridgeStatus,
    };
    use serde_json::Value;
    use std::collections::{BTreeMap, BTreeSet};
    use std::fs;
    use std::io::{BufRead, BufReader, Write};
    use std::path::{Path, PathBuf};
    use std::process::{Command, Stdio};
    use std::sync::atomic::{AtomicI64, Ordering};
    use std::sync::mpsc;
    use std::sync::{Arc, Mutex, OnceLock};
    use std::thread;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    static PANEL_SESSIONS: OnceLock<Mutex<BTreeMap<String, Arc<CodexPanelSession>>>> =
        OnceLock::new();

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
        let output = Command::new("cmd")
            .args(["/C", "echo", LIVE_ACTION_PROBE_TOKEN])
            .output();

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
                detail:
                    "Read-only transport spike: no prompt was sent and execution remains locked."
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
    ) -> Result<CodexPanelSessionStart, String> {
        let panel_id = panel_session_key(panel_id);
        if let Some(session) = get_panel_session(&panel_id)? {
            return Ok(CodexPanelSessionStart {
                source: "desktop".to_string(),
                panel_id,
                session_id: session.session_id.clone(),
                thread_id: session.thread_id.clone(),
                started: true,
                detail: "Reused existing Codex panel session for this cockpit panel.".to_string(),
            });
        }

        let session = start_panel_session(&panel_id)?;
        replace_panel_session(&panel_id, session.clone())?;
        Ok(CodexPanelSessionStart {
            source: "desktop".to_string(),
            panel_id,
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            started: true,
            detail: "Started one ephemeral read-only Codex panel session.".to_string(),
        })
    }

    #[tauri::command]
    pub fn codex_panel_session_send_turn(
        panel_id: Option<String>,
        prompt: String,
    ) -> Result<CodexPanelTurnResult, String> {
        let panel_id = panel_session_key(panel_id);
        let prompt = prompt.trim().to_string();
        if prompt.is_empty() {
            return Err("Prompt is required to send a live panel turn.".to_string());
        }

        let session = get_panel_session(&panel_id)?.ok_or_else(|| {
            "No Codex panel session is active. Start a session before sending a turn.".to_string()
        })?;

        send_panel_turn(session, prompt)
    }

    #[tauri::command]
    pub fn codex_panel_session_retry(
        panel_id: Option<String>,
        prompt: String,
    ) -> Result<CodexPanelTurnResult, String> {
        codex_panel_session_send_turn(panel_id, prompt)
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
        let output = Command::new("cmd")
            .arg("/C")
            .arg("codex")
            .args(args)
            .output()
            .ok()?;

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
        CodexHomeProbe {
            present: codex_home.is_dir(),
            config_present: codex_home.join("config.toml").is_file(),
            auth_present: codex_home.join("auth.json").is_file(),
            skills_count: count_skill_manifests(&codex_home.join("skills"), 0),
            plugins_present: codex_home.join("plugins").is_dir(),
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
        let session = match start_panel_session(panel_id) {
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
        match send_panel_turn(session, prompt) {
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

    fn start_panel_session(panel_id: &str) -> Result<Arc<CodexPanelSession>, String> {
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
                "approvalPolicy": "never",
                "sandbox": "read-only",
                "baseInstructions": "You are connected to one Steerboard live panel session. Keep responses concise, avoid tool use unless explicitly requested, and respect the read-only sandbox.",
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

    fn send_panel_turn(
        session: Arc<CodexPanelSession>,
        prompt: String,
    ) -> Result<CodexPanelTurnResult, String> {
        mark_turn_starting(&session)?;
        let request_id = session.next_request_id();
        let turn_start = serde_json::json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "turn/start",
            "params": {
                "threadId": session.thread_id,
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
        let turn_id = extract_turn_id(&turn_response);
        set_current_turn(&session, turn_id.clone());

        let mut events = Vec::new();
        let mut transcript = String::new();
        let mut completed = false;
        let mut interrupted = false;
        let mut failed = false;
        let deadline = std::time::Instant::now() + Duration::from_secs(120);

        while std::time::Instant::now() < deadline {
            let Some(value) = recv_session_value(&session, Duration::from_millis(500))? else {
                continue;
            };
            if let Some(event) = normalize_panel_event(&value) {
                if let Some(delta) = event.delta.as_deref() {
                    transcript.push_str(delta);
                }
                completed = completed || event.status.as_deref() == Some("completed");
                interrupted = interrupted || event.status.as_deref() == Some("interrupted");
                failed = failed
                    || event.status.as_deref() == Some("failed")
                    || event.event_type == "error";
                events.push(event);
            }

            if completed || interrupted || failed {
                break;
            }
        }

        clear_current_turn(&session);
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
            detail: if completed {
                "Codex panel turn completed.".to_string()
            } else if interrupted {
                "Codex panel turn was interrupted.".to_string()
            } else if failed {
                "Codex panel turn failed.".to_string()
            } else {
                "Codex panel turn timed out before completion.".to_string()
            },
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

    pub(crate) fn normalize_panel_event(value: &Value) -> Option<CodexPanelEvent> {
        let method = value.get("method").and_then(Value::as_str)?.to_string();
        let params = value.get("params").and_then(Value::as_object);
        let turn = params
            .and_then(|object| object.get("turn"))
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

        Some(CodexPanelEvent {
            event_type: panel_event_type(&method).to_string(),
            method,
            turn_id,
            status,
            delta,
            message,
        })
    }

    fn panel_event_type(method: &str) -> &str {
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
            runtime_bridge::codex_transport_live_smoke,
            runtime_bridge::codex_transport_two_panel_smoke,
            runtime_bridge::codex_panel_session_readiness,
            runtime_bridge::codex_panel_session_start,
            runtime_bridge::codex_panel_session_send_turn,
            runtime_bridge::codex_panel_session_retry,
            runtime_bridge::codex_panel_session_interrupt,
            runtime_bridge::codex_panel_session_steer,
            runtime_bridge::codex_panel_session_close
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
    fn codex_transport_probe_keeps_prompt_execution_locked() {
        let probe = runtime_bridge::codex_transport_probe();
        assert_eq!(probe.source, "desktop");
        assert!(!probe.execution.process_execution_allowed);
        assert!(!probe.execution.prompt_execution_allowed);
        assert!(probe.execution.detail.to_lowercase().contains("no prompt"));
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
}
