# Security And Privacy Model

## Defaults

- Analytics off by default.
- Renderer has no Node integration.
- Preload exposes narrow, typed APIs only.
- File operations are project-root scoped.
- External URL opening is allowlisted or user-confirmed.
- Terminal and git destructive actions require confirmation.
- Worker commands run with the least capability needed for the task.
- Runtime adapters start disabled until configured and explicitly enabled.
- Approved requests execute through a dry-run runner path by default, with redacted summaries only.
- Real desktop-backed mutation is a deferred phase and is not part of the default runner contract.

## Sensitive Data Rules

Never commit:

- credentials,
- API keys,
- cookies,
- browser/session state,
- OAuth tokens,
- customer records,
- private application records,
- local machine paths,
- screenshots exposing private navigation or account state.

## Threat Model

- Private data leakage: risk of accidental export of sensitive files, logs, or pasted snippets through broad shares or outputs.
- Overbroad local permissions: risk of exposing unnecessary filesystem or command capabilities for a given task.
- Unsafe external execution: risk of running unreviewed or unsandboxed commands and scripts from untrusted sources.
- Unreviewed dependency adoption: risk of security gaps entering through unchecked third-party code.
- Missing audit trail: risk of operators lacking a visible history of who changed what and why.

## Release Privacy Readiness Gates

Before release promotion, the following five gates are visible checks only (no environment mutation, network operations, or artifact writes during evaluation).

- Local-first defaults
- Sensitive data boundary
- Permission and execution lock
- Dependency and fixture safety
- Audit and export trail

Release privacy readiness gates are intended to be explicit controls for pre-release visibility and decision support. They are checks only; they do not execute distribution actions, environment mutation, or outbound release actions.

## Real Project Data And Runtime Adapter Edge Hardening

This section tracks visible runtime and project-data readiness checks only. These are manual/automated review gates and must not trigger installation actions, artifact output, environment mutation, or real-time side effects.

- Real project data boundary
  - Verify that real data examples use redacted identifiers and minimal fields.
  - Confirm no direct raw file path disclosure in public outputs.
  - Confirm no private credential-like material appears in review artifacts.
- Runner contract behavior
  - Confirm approved actions are routed to dry-run execution outcomes and not to immediate mutation.
  - Confirm redacted summary output is always available for approved and blocked runner outcomes.
  - Confirm desktop-backed mutation remains explicitly deferred until a future phase.
- Runtime adapter fallback states
  - Confirm documented behavior for missing data, partial data, malformed adapter payloads, and transient unavailability.
  - Confirm fallback state appears as a reviewed decision before runtime status is advanced.
  - Confirm no silent downgrade of critical checks through automatic recovery.
- Permission lock edge cases
  - Confirm permission gates are visible for each high-risk action.
  - Confirm lock exceptions are explicit, minimal, and auditable.
  - Confirm lock re-check behavior when task context changes.
- Audit export review
  - Confirm audit and export outputs are reviewed before any publication step.
  - Confirm outputs remain metadata-aware and redacted for sensitive context.
  - Confirm review history includes what changed and why.
- Fixture and dependency review
  - Confirm fixtures are sanitized and limited to non-sensitive exemplars.
  - Confirm dependency additions are reviewed for update safety and least privilege.
  - Confirm fixture/dependency reviews are captured as explicit readiness items.

## Live Cockpit Security Acceptance

The cockpit presents a visible security acceptance coverage check before packaging work resumes. The check connects five read-only signals:

- Live cockpit run selected
- Release privacy readiness
- Real project data boundary
- Runtime adapter edge evidence
- Audit review trail

Security acceptance coverage is a monitoring and decision-support surface only. It must not start a process, mutate files, call a network endpoint, build release artifacts, or trigger installation or packaging actions.

## Repeated Live Run Evidence

Before packaging resumes, the cockpit should make repeated live-run evidence visible across multiple local runs. The repeated evidence view tracks:

- reviewed run sample coverage,
- ready run count,
- review run count,
- blocked run count,
- whether evidence can be closed.

Repeated live-run evidence is a status summary only. It must not start packaging, install dependencies, export artifacts, mutate runtime state, or perform external actions.

## Final Security Review Gate

The final security review gate combines the visible release privacy check, current-run security acceptance, repeated evidence closure, packaging pause lock, and close-security decision into one reviewable status.

- The final gate explicitly includes dry-run runner audit behavior and requires that mutation-capable execution is not claimed while this phase remains deferred.

This gate is decision support only. It must not resume packaging, build installers, mutate files, mutate runtime state, call a network endpoint, start a process, or perform release actions. Packaging remains paused until core development is complete and a separate release decision explicitly resumes it.

Browser-preview safety locks can satisfy the security closure posture when execution remains locked and no desktop action is available. Desktop runtime errors, unlocked execution, missing packaging locks, or blocked validation evidence still prevent closure.

## Implementation Controls

- Root-scoped file access: keep reads/writes constrained to project roots with explicit path allowlists.
- Explicit permission review: surface concrete permissions before enabling new actions.
- Locked execution preview: gate risky commands behind explicit review before run.
- Audit/export preview: require diff-like review before exporting logs, snapshots, or checkpoints.
- Runner output redaction: apply redaction to action labels, details, and result summaries before they enter the public audit stream.
- Public-safe fixtures: sanitize fixtures and redact sensitive fields before publishing examples.
- No secrets in docs: never include secrets, private credentials, or sensitive identifiers in documentation.

## Third-Party Adoption Gates

Before importing third-party code:

1. Confirm license and attribution.
2. Review lifecycle scripts.
3. Review native dependencies.
4. Run dependency audit.
5. Review Electron webPreferences and preload API.
6. Review IPC handlers for path and command boundaries.
7. Review storage and credential handling.
8. Review network endpoints and analytics.
9. Confirm no private data is bundled.
10. Record an explicit reuse decision.

## Runtime Adapter Safety

Each runtime, model, or provider adapter must declare:

- required local permissions,
- supported actions,
- configuration fields,
- secret storage needs,
- network behavior,
- mock mode,
- disable and rollback path.

- Approved-action behavior
  - Approved action path defaults to dry-run execution.
  - Redacted audit evidence records every ready/blocked action outcome.
  - Real desktop-backed actions require an explicit phase transition.

Adapter configuration must be testable without real project data or real credentials whenever possible.
