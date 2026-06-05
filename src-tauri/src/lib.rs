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
    pub session_id: Option<String>,
    pub thread_id: Option<String>,
    pub turn_id: Option<String>,
    pub interrupted: bool,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexPanelCloseResult {
    pub source: String,
    pub closed: bool,
    pub detail: String,
}

mod runtime_bridge {
    use super::{
        CodexAppServerProbe, CodexAppServerProtocolProbe, CodexCliProbe, CodexExecJsonProbe,
        CodexExecutionProbe, CodexHomeProbe, CodexLiveSmokeProof, CodexPanelCloseResult,
        CodexPanelEvent, CodexPanelInterruptResult, CodexPanelSessionReadiness,
        CodexPanelSessionStart, CodexPanelTurnResult, CodexTransportProbe, PermissionApprovalStatus,
        RuntimeBridgeStatus,
    };
    use serde_json::Value;
    use std::collections::BTreeSet;
    use std::fs;
    use std::io::{BufRead, BufReader, Write};
    use std::path::{Path, PathBuf};
    use std::process::{Command, Stdio};
    use std::sync::atomic::{AtomicI64, Ordering};
    use std::sync::mpsc;
    use std::sync::{Arc, Mutex, OnceLock};
    use std::thread;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    static PANEL_SESSION: OnceLock<Mutex<Option<Arc<CodexPanelSession>>>> = OnceLock::new();

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
            available: app_server_help.contains("app server") || app_server_help.contains("app-server"),
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
                detail: "Read-only transport spike: no prompt was sent and execution remains locked."
                    .to_string(),
            },
        }
    }

    #[tauri::command]
    pub fn codex_transport_live_smoke() -> CodexLiveSmokeProof {
        run_live_smoke()
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

        let initialized = send_json(&mut child, &initialize_request(1, "steerboard-panel-readiness"))
            && wait_for_json_rpc_id(&rx, 1, Duration::from_secs(8)).is_some();
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
    pub fn codex_panel_session_start() -> Result<CodexPanelSessionStart, String> {
        let session = start_panel_session()?;
        replace_panel_session(session.clone());
        Ok(CodexPanelSessionStart {
            source: "desktop".to_string(),
            session_id: session.session_id.clone(),
            thread_id: session.thread_id.clone(),
            started: true,
            detail: "Started one ephemeral read-only Codex panel session.".to_string(),
        })
    }

    #[tauri::command]
    pub fn codex_panel_session_send_turn(prompt: String) -> Result<CodexPanelTurnResult, String> {
        let prompt = prompt.trim().to_string();
        if prompt.is_empty() {
            return Err("Prompt is required to send a live panel turn.".to_string());
        }

        let session = get_panel_session()?.ok_or_else(|| {
            "No Codex panel session is active. Start a session before sending a turn.".to_string()
        })?;

        send_panel_turn(session, prompt)
    }

    #[tauri::command]
    pub fn codex_panel_session_interrupt() -> Result<CodexPanelInterruptResult, String> {
        let Some(session) = get_panel_session()? else {
            return Ok(CodexPanelInterruptResult {
                source: "desktop".to_string(),
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
    pub fn codex_panel_session_close() -> CodexPanelCloseResult {
        let closed = take_panel_session().is_some();
        CodexPanelCloseResult {
            source: "desktop".to_string(),
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
        let temp_dir = std::env::temp_dir().join(format!(
            "steerboard-codex-protocol-{}",
            timestamp_millis()
        ));
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
                turn_interrupt: temp_dir.join("v2").join("TurnInterruptParams.json").is_file(),
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

    fn start_panel_session() -> Result<Arc<CodexPanelSession>, String> {
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

        if !send_json(&mut child, &initialize_request(1, "steerboard-panel-session")) {
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
            session_id: format!("panel-session-{}", timestamp_millis()),
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

        let turn_response = wait_for_session_json_rpc_id(&session, request_id, Duration::from_secs(15))
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
                failed = failed || event.status.as_deref() == Some("failed") || event.event_type == "error";
                events.push(event);
            }

            if completed || interrupted || failed {
                break;
            }
        }

        clear_current_turn(&session);
        Ok(CodexPanelTurnResult {
            source: "desktop".to_string(),
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
            session_id: Some(session.session_id.clone()),
            thread_id: Some(session.thread_id.clone()),
            turn_id: Some(turn_id),
            interrupted: true,
            detail: "Sent turn/interrupt to Codex app-server.".to_string(),
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

    fn panel_session_cell() -> &'static Mutex<Option<Arc<CodexPanelSession>>> {
        PANEL_SESSION.get_or_init(|| Mutex::new(None))
    }

    fn replace_panel_session(session: Arc<CodexPanelSession>) {
        let previous = {
            let mut guard = panel_session_cell()
                .lock()
                .expect("panel session lock should not be poisoned");
            guard.replace(session)
        };
        drop(previous);
    }

    fn get_panel_session() -> Result<Option<Arc<CodexPanelSession>>, String> {
        panel_session_cell()
            .lock()
            .map(|guard| guard.clone())
            .map_err(|_| "Codex panel session lock was poisoned.".to_string())
    }

    fn take_panel_session() -> Option<Arc<CodexPanelSession>> {
        panel_session_cell().lock().ok().and_then(|mut guard| guard.take())
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
            let Some(value) = recv_session_value(session, remaining.min(Duration::from_millis(250)))? else {
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
            runtime_bridge::runtime_bridge_status,
            runtime_bridge::runtime_permission_approval_status,
            runtime_bridge::codex_transport_probe,
            runtime_bridge::codex_transport_live_smoke,
            runtime_bridge::codex_panel_session_readiness,
            runtime_bridge::codex_panel_session_start,
            runtime_bridge::codex_panel_session_send_turn,
            runtime_bridge::codex_panel_session_interrupt,
            runtime_bridge::codex_panel_session_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running Steerboard");
}

#[cfg(test)]
mod tests {
    use super::*;

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

    #[test]
    fn codex_transport_probe_keeps_prompt_execution_locked() {
        let probe = runtime_bridge::codex_transport_probe();
        assert_eq!(probe.source, "desktop");
        assert!(!probe.execution.process_execution_allowed);
        assert!(!probe.execution.prompt_execution_allowed);
        assert!(probe
            .execution
            .detail
            .to_lowercase()
            .contains("no prompt"));
    }

    #[test]
    fn panel_initialize_request_does_not_start_thread_or_prompt() {
        let request = runtime_bridge::initialize_request(7, "unit-test-client");
        assert_eq!(request.get("method").and_then(serde_json::Value::as_str), Some("initialize"));
        assert_eq!(request.get("id").and_then(serde_json::Value::as_i64), Some(7));
        let serialized = request.to_string();
        assert!(!serialized.contains("thread/start"));
        assert!(!serialized.contains("turn/start"));
        assert!(!serialized.contains("input"));
        assert!(!serialized.contains("prompt"));
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
}
