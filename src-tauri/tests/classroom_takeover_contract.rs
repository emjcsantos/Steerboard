#[test]
fn classroom_takeover_keeps_ownership_and_profile_preflight_guards() {
    let source = include_str!("../src/lib.rs");

    for required_guard in [
        "orchestrator_takeover_missing_ownership_handoff",
        "orchestrator_takeover_worker_ownership_not_released",
        "orchestrator_takeover_missing_transfer_target",
        "orchestrator_takeover_missing_mutable_scope",
        "orchestrator_takeover_invalid_ownership_transfer",
        "orchestrator_takeover_missing_orchestrator_profile",
        "orchestrator_takeover_invalid_orchestrator_profile",
        "orchestrator_takeover_invalid_model",
        "orchestrator_takeover_invalid_reasoning_effort",
    ] {
        assert!(source.contains(required_guard), "missing takeover guard: {required_guard}");
    }

    assert!(source.contains("\"worker.start\" | \"orchestrator.takeover\" => execute_worker_start"));
    assert!(source.contains("matches!(*value, \"low\" | \"medium\" | \"high\" | \"extra-high\")"));
    assert!(source.contains("Audited orchestrator takeover completed with transferred ownership."));
}

#[test]
fn classroom_takeover_does_not_share_the_default_worker_model_path() {
    let source = include_str!("../src/lib.rs");
    let takeover_branch = source
        .split("let takeover = request.kind == \"orchestrator.takeover\";")
        .nth(1)
        .expect("takeover execution branch");

    assert!(takeover_branch.contains("if takeover"));
    assert!(takeover_branch.contains("profile.get(\"role\").and_then(Value::as_str) != Some(\"orchestrator\")"));
    assert!(takeover_branch.contains("profile.get(\"provider\").and_then(Value::as_str) != Some(\"codex\")"));
}
