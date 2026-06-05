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

Before release promotion, the following five gates are visible checks only (no install actions, network operations, or artifact writes during evaluation).

- Local-first defaults
- Sensitive data boundary
- Permission and execution lock
- Dependency and fixture safety
- Audit and export trail

Release privacy readiness gates are intended to be explicit controls for pre-release visibility and decision support. They are checks only; they do not execute distribution actions, environment mutation, or outbound release actions.

## Implementation Controls

- Root-scoped file access: keep reads/writes constrained to project roots with explicit path allowlists.
- Explicit permission review: surface concrete permissions before enabling new actions.
- Locked execution preview: gate risky commands behind explicit review before run.
- Audit/export preview: require diff-like review before exporting logs, snapshots, or checkpoints.
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

## Worker Safety

Worker task briefs must include:

- exact files allowed,
- exact files forbidden,
- acceptance criteria,
- validation command,
- max three implementation attempts,
- required handoff summary,
- rollback note.

The main orchestrator must run final validation after worker completion.

## Runtime Adapter Safety

Each runtime, model, or provider adapter must declare:

- required local permissions,
- supported actions,
- configuration fields,
- secret storage needs,
- network behavior,
- mock mode,
- disable and rollback path.

Adapter configuration must be testable without real project data or real credentials whenever possible.
