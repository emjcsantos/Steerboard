# Local Owner Testing Checklist (Phase 11)

This checklist is provider/model agnostic and intended for owner-level local hardening validation.

## How To Use This Checklist

Use this checklist in a local workspace after checkout and dependencies are installed.
Run through each section in order, and record one of four states:

- `ready` - behavior is verified and repeatable.
- `review` - behavior appears acceptable but needs evidence or peer review.
- `blocked` - work cannot continue until the blocker is resolved.
- `waiting` - setup or evidence is incomplete.

Do not proceed to the next section until the current item is at least `review`.

## Phase 11 Owner Test Flow

1. `Launch`
   - Start from a clean workspace state.
   - Verify app launch, local profile load, and startup status messages are deterministic.
2. `Connect`
   - Open a fresh connection.
   - Confirm reconnect/restart behavior does not lose panel scope or pending action context.
   - Run live smoke, control smoke, active-turn interrupt smoke, active-turn steer smoke, and two-panel smoke from the connection dialog when desktop runtime access is available.
   - Confirm the Owner Testing Phase 1/2/6 priority card shows one-panel proof, two-panel isolation, and PM phase-board staging as separate evidence rows.
   - Use the Owner Testing Phase 1 and Phase 2 smoke buttons to rerun live-panel and two-panel proof only after explicitly choosing the action.
   - Reload after successful Phase 1/2 desktop smoke proof and confirm the priority card keeps the desktop-executed proof states without rerunning prompts on startup.
   - Confirm the Environment panel Remaining Goals summary shows all remaining targets, covers Phase 1 through Phase 11, and keeps `Unblock Phase 1/2/6 publishing` blocked until the owner approves pushing.
   - Confirm the Phase 11 Owner Command panel shows checklist coverage, proof freshness, blockers, phase readiness, next action, and fresh-checkout evidence as separate pass/fail gates.
   - Confirm the Phase 11 Proof Freshness panel breaks proof into Phase 1/2/6 priority proof, Phase 3 clearance, desktop smoke, command-plan, and handoff proof rows without running smoke commands or release actions.
   - Confirm the Phase 11 Evidence Records panel shows fresh checkout, clean checkout, build/test, and docs/known-limits records with source/timestamp text and missing, stale, malformed, waiting, review, blocked, or ready states without running release actions.
   - Confirm the Phase 11 command center holds release readiness while the owner-approved push blocker or fresh-checkout evidence is unresolved.
   - Confirm the Phase 11 command center shows prioritized remaining-goal trace rows with critical/current goals first, then high-priority pending goals, including goal IDs, phase counts, PM task link counts, status, and completion.
   - Confirm the Phase 11 Release Readiness panel shows clean checkout, build/test, owner smoke proof, packaging lock, docs/known limits, and final release decision as separate gates.
   - Confirm the release readiness decision remains held while clean checkout, build/test, smoke proof, docs/known limits, owner proof, or remaining-goal blockers are unresolved.
   - Confirm the packaging lock row is ready only because packaging and resume controls stay locked; do not run packaging, signing, installer, Git push, or external release actions from this gate.
   - Confirm the Environment panel Phase 4 Provider Readiness card classifies all six provider surfaces without executing commands, skills, plugins, MCP tools, automations, or personalization mutations.
   - Confirm the Phase 4 Provider Readiness card shows catalog-depth rows for command, skill, plugin, MCP, automation, and personalization source labels, totals, evidence expectations, and execution locks.
   - Confirm the Phase 4 Surface Depth panel shows surface coverage, setup blockers, capability gaps, preview review, and the execution lock while remaining metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution.
   - Optionally run `npm run smoke:phase1-2` to execute the opt-in one-panel live smoke and two-panel isolation desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
   - Optionally run `npm run smoke:phase3` to execute the opt-in live-control, active-turn interrupt, and active-turn steer desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
3. `Chat`
   - Send a test message and verify response capture and interruption controls.
   - Confirm the same session can continue after transient stalls.
4. `Multi-Panel`
   - Open two or more panels and switch focus repeatedly.
   - Verify each panel preserves its own session context and activity state.
   - Confirm corrupted saved panel metadata with duplicate live identities shows a conflict warning and does not send live chat through the duplicated identity.
   - Switch to Adaptive Arena and confirm the Phase 10 Arena Polish panel reports layout regression, density/readability, keyboard controls, focus state, terminology, and acceptance gates separately.
   - Confirm the Phase 10 Arena polish traceability rows link the remaining goal, PM child coverage, Arena polish readiness, layout/density evidence, and acceptance gate before packaging can resume.
   - Confirm the Phase 10 Arena polish blocker-priority queue ranks layout, density, keyboard, focus, terminology, acceptance, PM coverage, and traceability blockers and shows whether Arena review can address the top blocker.
   - Use drag, keyboard arrow movement, shift-arrow resize, hide, reveal, and reset paths on adaptive panels, then confirm no source session or project data is mutated.
5. `Controls`
   - Exercise stop, retry, pause, and route controls.
   - Confirm control actions are deterministic and do not drift between views.
   - Confirm unsupported lifecycle controls show visible unsupported evidence, not only disabled icons.
   - Confirm the Owner Testing controls card lists interrupt, retry, steer, fork, resume, and archive with their current state.
   - Confirm the Owner Testing panel moves control evidence from review to ready only after interrupt, retry, and steer/follow-up transcript proof is present and fork/resume/archive are honestly unsupported or live.
6. `Slash Commands`
   - Type `/` in an Arena panel composer and confirm suggestions are limited to commands scoped to the active panel.
   - Submit one app/global-only command from a panel and confirm it is blocked with explicit unsupported guidance.
   - Submit one provider-routed panel command in live desktop mode and confirm the transcript shows provider-route evidence before the live turn runs.
   - Confirm the Owner Testing panel moves slash execution evidence from review to ready only after provider-route plus live/status transcript proof is present.
   - Confirm the Owner Testing Phase 3 gate remains review or waiting until slash execution, session-control evidence, live-control smoke, active-turn interrupt smoke, and active-turn steer smoke are all proven ready, and that each diagnostic row shows its PM child link and unique evidence key.
   - Confirm the Owner Testing Phase 3 clearance package shows `Exit held` until every gate item is ready, lists exact open blockers, and promotes the next runnable smoke action when one is available.
   - Confirm the Owner Testing Phase 3 blocker-priority queue ranks the top exact blocker, shows whether `npm.cmd run smoke:phase3` can address it, and keeps slash or session-control blockers ahead of unrelated smoke actions.
   - Confirm the Owner Testing Phase 3 traceability rows link `goal-phase-3-proof-clearance`, every required Phase 3 PM child row, clearance evidence, blocker priority, command plan, and handoff boundary before Phase 3 is treated as exit-ready.
   - Confirm the Owner Testing Phase 3 desktop smoke command plan shows `npm.cmd run smoke:phase3`, separate live-control, active-turn interrupt, and active-turn steer proof rows, and a held/runnable state without executing the command automatically.
   - Confirm slash or session-control blockers stay ahead of unrelated runnable smoke actions, while a matching smoke blocker promotes its smoke action and command-plan guidance.
   - Confirm the Owner Testing Phase 3 handoff gate holds provider integration until desktop proof clearance is ready, exact blocker visibility is clear, and an owner handoff record is attached.
   - Confirm `Record handoff` stays disabled until Phase 3 clearance is exit-ready, writes a local owner handoff record when enabled, and `Clear record` removes that local record without changing smoke proof evidence.
   - Confirm the Owner Testing Phase 3 smoke proof rows show browser fallback or non-executed proofs as `waiting`, successful desktop proofs as `ready`, incomplete desktop proofs as `review`, and unsupported-after-execution proofs as `blocked`.
   - Reload after a full desktop smoke bundle and confirm the Phase 3 smoke proof rows keep the last desktop-executed proof states without rerunning prompts on startup.
   - Use the Phase 3 gate diagnostic rows to identify which proof is still waiting, review, or blocked before rerunning desktop smokes.
   - Use the Phase 3 gate action buttons to rerun live-control, active-turn interrupt, and active-turn steer smoke proofs only after explicitly choosing the action.
   - Refresh the command catalog and confirm metadata/status is updated as a safe metadata/status refresh (no side-effectful actions).
7. `Catalogs`
   - Open command, skill, plugin, MCP, automation, and personalization catalogs.
   - Verify stable ordering and filtering output across repeated reloads.
   - Confirm the Owner Testing panel shows six catalog refresh validation rows and a metadata-only safety note.
   - Confirm the Phase 4 Provider Readiness card updates from the same catalog snapshots and shows ready, preview, setup-required, unsupported, unavailable, or blocked labels with an exact next action.
   - Confirm the Phase 4 Provider Readiness catalog-depth rows keep all six provider surfaces visible with source labels, totals, evidence expectations, and locked execution posture.
   - Confirm the Phase 4 Surface Depth panel uses those metadata snapshots to expose surface coverage, setup blockers, capability gaps, preview review, and the execution lock without running provider actions.
   - Confirm the Phase 4 Provider Traceability rows link `goal-phase-4-provider-surfaces`, all required Phase 4 PM child rows, catalog-depth evidence, refresh-safety evidence, surface-depth evidence, and provider execution locks.
   - Confirm the Phase 4 Provider Blocker Priority rows rank the exact top provider blocker, show whether catalog smoke can address it, and keep setup-required or unavailable provider blockers ahead of preview-only refresh proof.
   - Open the connection dialog and run the catalog smoke to refresh all six catalog metadata/status surfaces together without execution.
   - Confirm the Connection Dialog Refresh Safety depth rows show refresh run state, six-surface order, validation result, metadata-only contract, and provider execution lock.
   - Confirm Owner Testing validation rows, Connection Dialog catalog smoke rows, Provider Readiness catalog-depth rows, Refresh Safety depth rows, Surface Depth rows, Provider Traceability rows, and Provider Blocker Priority rows report the same six provider surfaces as one linked metadata-only safety chain.
   - Refresh the command catalog as a safe metadata/status refresh and confirm source/state changes are visible without side effects.
   - Refresh the skill catalog as a safe metadata/status refresh and confirm source/state changes are visible without executing skills.
   - Refresh the plugin catalog as a safe metadata/status refresh and confirm source/state changes are visible without invoking plugin actions.
   - Refresh the MCP catalog as a safe metadata/status refresh and confirm source/state changes are visible without running MCP tools.
   - Refresh the automation catalog as a safe metadata/status refresh and confirm source/state changes are visible without scheduling or running automations.
   - Refresh the personalization catalog as a safe metadata/status refresh and confirm source/state changes are visible without mutating profile or instruction sources.
8. `Migration`
   - Validate migration plan preview and reviewed-draft staging flow.
   - Confirm the Migration review gate reports preview selection, apply intent, rollback evidence, audit consistency, and sensitive exclusions before any apply path.
   - Confirm the Migration review depth records show apply-intent lock, rollback evidence, audit consistency, sensitive exclusions, and profile activation lock as separate owner-review rows with PM row links and unique evidence keys.
   - Confirm the Migration traceability rows link the Phase 5 remaining goal, PM child coverage, review-depth evidence, sensitive exclusion boundary, and profile activation lock before apply review can be trusted.
   - Confirm the Migration blocker-priority queue ranks the exact top blocker, shows whether metadata review can address it, and keeps blocked audit/apply-intent blockers ahead of waiting or review-only evidence before any migration apply path.
   - Confirm `Stage apply review` only creates an owner-visible intent notice and does not change the active profile, source platform, files, commands, plugins, MCP tools, automations, or personalization state.
   - Confirm migration audit summary exists locally and includes accepted, review-required, unsupported, and excluded counts.
   - Confirm rollback metadata includes prior profile pointer, rollback audit note, checksumable manifest references, and no source mutation.
   - Confirm secrets, tokens, auth caches/files/state, browser state, source artifacts, raw transcripts, and source mutation remain excluded from persisted migration metadata.
9. `Planning`
   - Create or update a plan item and confirm expected persistence updates.
   - Confirm planning metadata remains readable after a refresh.
   - Confirm the Project Management board contains Phase 0 through Phase 11 as Epics and that representative Epic, Parent, and Child rows each stage an Arena review package through `Run`.
10. `Dispatch`
    - Dispatch a staged pipeline item through the standard lane.
    - Confirm role-panel plan generation, route details, and log records are consistent.
    - Confirm the selected local run shows a dispatch review record with role counts, max attempt limit, handoff task count, validation gate count, and a no-runtime-execution note.
    - Confirm the dispatch review depth checks show role coverage, attempt limits, handoff tasks, validation gates, and the live worker lock as separate rows.
    - Confirm the integration ownership rows show Main Codex as the final integration, validation, commit, push approval, reporting, traceability, and closure-boundary owner.
    - Confirm the Phase 7 dispatch traceability rows link the remaining goal, PM child coverage, dispatch review depth, integration ownership depth, and live-worker lock before dispatch review can be trusted.
    - Confirm the Phase 7 dispatch blocker-priority queue ranks role coverage, attempt limits, handoff tasks, validation gates, integration ownership, traceability, closure boundary, and live-worker lock blockers and shows whether dispatch review can address the top blocker.
    - Confirm missing role coverage, missing validation gates, oversized attempt limits, or a missing no-runtime-execution note keep dispatch in waiting, review, or blocked state.
    - Confirm a PM row staged through `Run` creates the same local review trace before any live worker session spawning.
    - Verify the result is a local review artifact only (no runtime worker launch or external session execution).
11. `Permissions`
    - Trigger at least one sensitive action.
    - Verify approval and block branches are explicit and safe.
    - Confirm the Phase 8 Audit Depth panel lists missing permission, approval, evidence, audit persistence, and rollback requirements for risky or blocked actions.
    - Confirm at least one Phase 8 risk exception explains why the path is exceptional, what evidence is required, and which audit source owns the proof.
    - Confirm Phase 8 audit-depth rows and disabled-path exceptions show linked PM child rows and unique evidence keys.
    - Confirm the Phase 8 risk traceability rows link the remaining goal, PM child coverage, audit-depth evidence, risk exception register, and disabled-path lock before permission audit can be trusted.
    - Confirm the Phase 8 risk blocker-priority queue ranks the exact top permission, approval, evidence, audit, rollback, disabled-path, or traceability blocker and shows whether audit review can address it before mutation paths grow.
    - Confirm at least one disabled mutation path explains what remains locked before terminal, Git, MCP, plugin, automation, runtime, profile, or external-service actions can proceed.
    - Confirm rollback expectations are visible separately from audit evidence so approval alone never implies mutation readiness.
    - Confirm the panel keeps runtime/profile execution locked while audit and rollback requirements are reviewed.
    - Confirm the Phase 9 Runner Approval panel keeps `terminal-readonly-probe` as the only selected desktop-backed action.
    - Confirm Phase 9 shows owner permission, approval window, request preview, validation output, approval/result audit, and rollback evidence as separate targets.
    - Confirm the Phase 9 runner approval depth records separately list fixed probe selection, owner approval, request preview, validation output, audit record, rollback evidence, and desktop execution lock, each with a unique evidence key and linked Phase 9 PM child or parent row.
    - Confirm the Phase 9 runner traceability rows link the remaining goal, PM child coverage, Phase 8 audit gate, runner approval depth, and mutation lock before the fixed desktop probe can be trusted.
    - Confirm the Phase 9 runner blocker-priority queue ranks the Phase 8 gate, owner permission, approval preview, validation output, audit record, rollback evidence, traceability, and mutation lock blockers and shows whether runner review can address the top blocker.
    - Confirm the desktop probe request remains held until owner approval is ready, and broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths remain locked.
12. `Reload`
    - Reload during an in-progress run and resume from persisted context.
    - Confirm unsaved owner state is surfaced before continuing.
13. `Recovery`
    - Induce one recoverable failure path.
    - Verify recovery evidence and handoff route are visible and deterministic.

## Repeatability Note

Record state for each item at every run and compare across runs. If state changes only because of environment fluctuations, file the variance and rerun after a clean refresh.
