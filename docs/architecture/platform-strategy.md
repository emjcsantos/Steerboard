# Platform Strategy

Steerboard should be desktop-first.

The product needs privileged local capabilities: project-root file access, Git operations, terminal/process control, local agent runtimes, long-running sessions, notifications, and secure local preferences. A hosted web app cannot safely or reliably own those capabilities without adding a separate local daemon. A browser-only version can become a companion later, but it should not be the primary MVP surface.

## Recommended Shell Direction

Tauri is a framework for building desktop apps. It wraps a web-based UI in a native desktop shell and exposes local capabilities through a native backend.

Use a shell abstraction and keep the first implementation replaceable. Prefer a Tauri-first spike for the clean scaffold, with Electron as the fallback if terminal, editor, webview, or agent-process integration becomes slower than expected.

## Tauri Strengths

- Smaller app bundles and lower idle memory.
- Strong native boundary with explicit command exposure.
- Good fit for an original product with a tight security model.
- Encourages narrow IPC contracts for filesystem, Git, terminal, and agent actions.

## Tauri Risks

- More Rust and native-shell learning curve.
- Terminal, pseudo-terminal, webview, and editor integrations may require extra glue.
- Fewer existing AI-IDE reference implementations to copy patterns from.

## Electron Strengths

- Mature JavaScript and TypeScript desktop ecosystem.
- Strong fit for Monaco, xterm-style terminals, webviews, and Node-based process control.
- Faster path if reference patterns depend heavily on Electron main/preload/renderer boundaries.

## Electron Risks

- Larger app footprint.
- Broader default attack surface.
- Requires strict renderer isolation, preload allowlists, URL handling, and dependency hygiene.

## Decision Rule

Start with a Tauri feasibility spike if the MVP can keep terminal, editor, and agent integration simple. Choose Electron if the spike shows that core IDE surfaces would take materially longer in Tauri.

The first scaffold uses a minimal Tauri shell that loads the Vite cockpit UI during development and keeps privileged desktop capabilities behind future adapter boundaries.

Either way, Steerboard should keep shell-specific code behind an adapter so product work can continue without locking every feature to one desktop framework.

## Deployment Model

- Early public preview: source-first install through git.
- Primary stable channel: signed local desktop app.
- Follow-up stable channels: package-manager distribution.
- Optional later: local web companion connected to the desktop app or local agent service.
- Not recommended for MVP: cloud-hosted control plane that directly manages local projects.

## Adoption Strategy

Use git-based source installation first for developers and security-conscious early users. It lets people inspect the code, scripts, dependencies, and local permission boundaries before running Steerboard against real projects.

Do not rely on git installation as the only long-term distribution path. Many users will want a signed app or trusted package-manager install once the product is stable.
