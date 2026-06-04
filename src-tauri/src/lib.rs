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

mod runtime_bridge {
    use super::{PermissionApprovalStatus, RuntimeBridgeStatus};

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
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            runtime_bridge::runtime_bridge_status,
            runtime_bridge::runtime_permission_approval_status
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
}
