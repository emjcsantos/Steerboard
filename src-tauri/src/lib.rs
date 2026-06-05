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

mod runtime_bridge {
    use super::{
        CodexAppServerProbe, CodexAppServerProtocolProbe, CodexCliProbe, CodexExecJsonProbe,
        CodexExecutionProbe, CodexHomeProbe, CodexTransportProbe, PermissionApprovalStatus,
        RuntimeBridgeStatus,
    };
    use serde_json::Value;
    use std::fs;
    use std::io::{BufRead, BufReader, Write};
    use std::path::{Path, PathBuf};
    use std::process::{Command, Stdio};
    use std::sync::mpsc;
    use std::thread;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

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

    struct HandshakeProbe {
        success: bool,
        user_agent: Option<String>,
        platform_os: Option<String>,
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

        let initialize = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": "steerboard-transport-spike",
                    "version": "0.1.0"
                },
                "capabilities": {
                    "experimentalApi": true
                }
            }
        });

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
            runtime_bridge::codex_transport_probe
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
}
