# Harnss Reuse Decision

## Decision

Use Harnss as a reference first, not as the initial AtlasUI codebase.

## Why

Harnss has excellent product overlap with AtlasUI:

- multi-agent sessions,
- Codex app-server integration,
- split-session UI,
- tool rendering,
- git, terminal, browser, file, MCP, and agent panels.

However, the audited commit has dependency vulnerabilities and security hardening gates that make a direct fork too risky for the first public baseline.

## Approved Reuse

Approved now:

- study architecture,
- study Codex app-server adapter,
- study layout patterns,
- study tool-call rendering patterns,
- study encrypted token storage pattern,
- study agent registry concepts.

Not approved yet:

- copy source code,
- run install scripts,
- ship Harnss dependency graph,
- inherit analytics defaults,
- inherit broad file IPC behavior,
- inherit auto-install pipeline behavior.

## Conditions To Upgrade To Fork Candidate

Harnss or an AtlasUI fork can become a direct base only after:

- production dependency audit has no critical or high advisories,
- postinstall/native dependency behavior is documented and isolated,
- analytics defaults are off,
- file APIs are project-scoped,
- external URL and webview behavior are gated,
- managed binary downloads are opt-in,
- worktree setup commands require confirmation,
- third-party notices are preserved.

## Current Path

Continue with a clean AtlasUI scaffold, then selectively port patterns after they pass review.

