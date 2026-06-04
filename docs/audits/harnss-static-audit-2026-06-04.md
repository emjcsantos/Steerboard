# Harnss Static Audit

Date: 2026-06-04

## Source

- Repository: https://github.com/OpenSource03/harnss
- Audited commit: `fffd46b3da457c65ebdd5a479e4350eb1c1cbe36`
- Branch: `master`
- License: MIT
- Package version: `0.22.0-beta.2`
- File count reviewed by map: 957
- Runtime shape: Electron, Vite, React, TypeScript, pnpm

## Audit Method

Performed:

- shallow clone of the audited commit,
- license review,
- README and feature review,
- package script review,
- lockfile and dependency surface review,
- Electron main/preload review,
- Codex app-server integration review,
- storage and OAuth review,
- git, file, terminal, browser, and updater IPC review,
- static secret-pattern scan,
- production dependency audit via `pnpm audit --prod --json` using `pnpm@10.26.0`.

Not performed:

- no dependency install,
- no app execution,
- no postinstall execution,
- no release binary execution,
- no dynamic sandbox run.

## License Result

MIT license permits use, copy, modification, distribution, sublicensing, and sale, provided the copyright and permission notice are preserved.

License result: pass.

## Positive Findings

- Strong product fit for a multi-agent desktop IDE.
- Mature feature map: Codex, Claude, ACP, MCP, git, terminal, browser, file panels, spaces, split views, background agents, and tool visualization.
- Electron main renderer uses `contextIsolation: true` and `nodeIntegration: false`.
- Codex integration uses JSON-RPC `codex app-server` process ownership.
- OAuth stores use Electron `safeStorage` where available.
- Logger includes redaction patterns for tokens, API keys, cookies, passwords, and authorization headers.
- Git commands use `execFile` with argument arrays for most git actions.
- README clearly labels the project as early development.

## Blocking Findings For Direct Adoption

### Dependency Audit

Production audit result:

- critical: 1
- high: 21
- moderate: 55
- low: 4
- production dependency graph: 504 packages

Representative high-impact advisories:

- `protobufjs`: arbitrary code execution and denial-of-service advisories.
- `axios`: multiple prototype-pollution gadget advisories affecting request routing and credential exposure.
- `tar`: hardlink and symlink path traversal advisories.
- `hono` and `@hono/node-server`: static path authorization and file access advisories.
- `lodash-es`: template code-injection advisory.
- `path-to-regexp`: denial-of-service advisory.

Dependency result: fail for direct unmodified fork, pass for reference-only review.

### Install And Native Build Scripts

`package.json` includes a `postinstall` script that runs `electron-rebuild`.

This is normal for Electron native modules, but it means dependency installation must happen only after dependency review and in an isolated environment.

Script result: gated.

### GitHub Tarball Dependency

`electron-liquid-glass` is pinned to a GitHub tarball commit.

This needs separate review or removal before AtlasUI adopts Harnss code.

Third-party dependency result: gated.

### Managed Binary Download

Harnss can auto-download Codex using `npm pack @openai/codex@<platform-tag>`.

This should be opt-in in AtlasUI and should verify source, version, and destination.

Managed binary result: gated.

### Claude Auto-Install

Harnss includes Claude CLI installation paths that run platform installers such as PowerShell, cmd, or shell curl pipelines.

AtlasUI should not include auto-install-by-pipeline behavior in MVP.

Auto-install result: gated.

### IPC Path Boundaries

Several exposed file APIs accept absolute paths, including read, rename, trash, open in editor, and folder operations.

AtlasUI should scope file operations to project roots by default.

IPC path result: gated.

### External URL And Webview Surface

Harnss enables `webviewTag` and has browser/webview features, including webview JavaScript injection for element inspection.

AtlasUI can reuse the product idea, but browser/webview execution should be isolated and optional.

Browser surface result: gated.

### Analytics

Harnss defaults main-process analytics to enabled. Renderer analytics starts opted out until settings sync, but the app setting default is true.

AtlasUI should default analytics off.

Analytics result: gated.

### Worktree Setup Command Execution

Harnss can execute setup commands from `.harnss/worktree.json` after creating a worktree.

AtlasUI should require explicit user confirmation before running project-provided commands.

Worktree setup result: gated.

## Secret Scan Result

No obvious private keys, raw credentials, or token dumps were found in the reviewed source tree.

The scan found expected credential-related code paths for:

- Codex API key login,
- Jira API-token login,
- MCP OAuth,
- MCP environment variables,
- logger redaction tests,
- UI password fields.

Secret scan result: pass with expected credential-handling surfaces.

## Verdict

Harnss is not clean enough for direct unmodified adoption today.

Harnss is clean enough to use as:

- architecture reference,
- UI reference,
- Codex app-server integration reference,
- selective fork candidate after hardening.

Do not import Harnss code into AtlasUI until the dependency audit and security gates above are resolved.

