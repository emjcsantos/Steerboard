# Security And Privacy Model

## Defaults

- Analytics off by default.
- Renderer has no Node integration.
- Preload exposes narrow, typed APIs only.
- File operations are project-root scoped.
- External URL opening is allowlisted or user-confirmed.
- Terminal and git destructive actions require confirmation.
- Worker commands run with the least capability needed for the task.

## Sensitive Data Rules

Never commit:

- credentials,
- API keys,
- cookies,
- browser/session state,
- OAuth tokens,
- raw private transcripts,
- customer records,
- private application records,
- local machine paths,
- screenshots exposing private navigation or account state.

## Third-Party Adoption Gates

Before importing third-party code:

1. Confirm license and attribution.
2. Review package scripts.
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
