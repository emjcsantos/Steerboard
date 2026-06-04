# Harnss Reuse Decision

## Decision

Use Harnss as a credited reference first, not as the initial Steerboard codebase.

## Why

Harnss has excellent product overlap with Steerboard:

- multi-agent sessions,
- agent-runtime adapter patterns,
- split-session UI,
- tool rendering,
- git, terminal, browser, file, MCP, and agent panels.

However, the audited commit has dependency vulnerabilities and security hardening gates that make a direct fork too risky for the first public baseline.

Steerboard should remain an original product: its information architecture, orchestration model, cockpit layout behavior, visual language, and implementation should be designed specifically for Steerboard.

## Approved Reuse

Approved now:

- study architecture,
- study agent-runtime adapter patterns,
- study layout patterns,
- study tool-call rendering patterns,
- study encrypted token storage pattern,
- study agent registry concepts.
- credit Harnss as an open-source reference in public notices.

Not approved yet:

- copy source code,
- run install scripts,
- ship Harnss dependency graph,
- inherit analytics defaults,
- inherit broad file IPC behavior,
- inherit auto-install pipeline behavior.
- clone Harnss UI screen-for-screen.

## Conditions To Upgrade To Fork Candidate

Harnss or a Steerboard fork can become a direct base only after:

- production dependency audit has no critical or high advisories,
- postinstall/native dependency behavior is documented and isolated,
- analytics defaults are off,
- file APIs are project-scoped,
- external URL and webview behavior are gated,
- managed binary downloads are opt-in,
- worktree setup commands require confirmation,
- third-party notices are preserved.
- a product originality review confirms Steerboard still has a distinct UI, architecture, and workflow.

## Current Path

Continue with a clean Steerboard scaffold, credit Harnss as research inspiration, then selectively port patterns only after they pass review and fit the Steerboard product direction.
