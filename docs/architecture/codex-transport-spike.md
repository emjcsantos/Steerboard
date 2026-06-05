# Codex Transport Spike

This note records the first Steerboard transport target for Codex integration.

## Findings

- Codex exposes an experimental `app-server` command with `stdio://`, Unix socket, and WebSocket transport options.
- The generated app-server protocol includes the panel primitives Steerboard needs: `thread/start`, `turn/start`, `turn/steer`, `turn/interrupt`, `item/agentMessage/delta`, plugin listing, MCP status, skills listing, and approval-related events.
- A no-prompt `initialize` handshake over `app-server --listen stdio://` is enough to prove local transport reachability without sending a model prompt.
- An explicit live smoke can start an ephemeral read-only thread, send one tiny text turn, observe `item/agentMessage/delta`, and complete the turn without storing the transcript.
- Managed app-server daemon lifecycle is not the safest first Windows path because daemon lifecycle support can be platform-limited.
- `codex exec --json` is useful as a one-shot fallback, but it is not a full cockpit session transport because it does not provide the same multi-panel thread lifecycle.

## Selected Transport Direction

Use a desktop-gated, supervised `app-server stdio` bridge as the first live Codex session transport.

The bridge should remain locked until Steerboard has:

- explicit user approval to launch the local process,
- visible workspace and sandbox posture,
- normalized session event handling,
- approval and audit recording,
- fallback behavior when the app-server handshake fails.

Readiness detection must remain no-prompt. Live send/stream proof is a separate user-triggered smoke action that spends model tokens only after the user asks for it.

## Proven Send/Stream Path

The working spike proves this path:

1. launch `codex app-server --listen stdio://`,
2. send JSON-RPC `initialize`,
3. send `thread/start` with `ephemeral: true`, `approvalPolicy: "never"`, and read-only sandbox,
4. send `turn/start` with one text input and low reasoning effort,
5. observe `item/agentMessage/delta`,
6. observe `turn/completed`,
7. record only normalized proof fields such as method names, completion state, and expected-token presence.

The app exposes this as an explicit live smoke action from the Codex connection dialog. It should not run on app startup or during passive readiness refresh.

## Fallback Behavior

If app-server stdio is unavailable or the handshake fails:

- keep cockpit panels in local preview mode,
- show detected Codex CLI readiness if available,
- allow `codex exec --json` only as an explicit one-shot task option later,
- do not silently switch panel chat to a non-session transport,
- keep prompt execution locked and explain the missing transport evidence.

## Non-Goals For This Spike

- Do not store Codex credentials in Steerboard.
- Do not read or copy auth caches, cookies, tokens, raw transcripts, or private browser state.
- Do not start a long-running daemon automatically.
- Do not send prompts or spend model tokens during readiness detection.
- Do not expose terminal, Git, plugin, MCP, or automation mutation before approval and audit gates exist.
