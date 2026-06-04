# Platform Strategy

AtlasUI should be desktop-first.

The product needs privileged local capabilities: project-root file access, Git operations, terminal/process control, local agent runtimes, long-running sessions, notifications, and secure local preferences. A hosted web app cannot safely or reliably own those capabilities without adding a separate local daemon. A browser-only version can become a companion later, but it should not be the primary MVP surface.

## Recommended Shell Direction

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

Either way, AtlasUI should keep shell-specific code behind an adapter so product work can continue without locking every feature to one desktop framework.

## Deployment Model

- Primary: signed local desktop app.
- Optional later: local web companion connected to the desktop app or local agent service.
- Not recommended for MVP: cloud-hosted control plane that directly manages local projects.
