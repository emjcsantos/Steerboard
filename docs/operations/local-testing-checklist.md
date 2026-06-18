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
   - Confirm the Owner Testing Phase 1/2/6 publish-hold traceability rows link `goal-phase-1-2-6-publish`, Phase 1 live proof, Phase 2 isolation proof, Phase 6 PM staging, required PM child rows, and the owner/remote push hold without running smoke, Git, push, release, or packaging actions.
   - Confirm the Owner Testing Phase 1/2/6 blocker-priority queue ranks the owner/remote push hold above ordinary proof review when local proof is already ready.
   - Use the Owner Testing Phase 1 and Phase 2 smoke buttons to rerun live-panel and two-panel proof only after explicitly choosing the action.
   - Reload after successful Phase 1/2 desktop smoke proof and confirm the priority card keeps the desktop-executed proof states without rerunning prompts on startup.
   - Confirm the Environment panel Remaining Goals summary shows all remaining targets, covers Phase 1 through Phase 11, and keeps `Unblock Phase 1/2/6 publishing` blocked until the owner approves pushing.
   - Confirm the Phase 11 Owner Command panel shows checklist coverage, proof freshness, blockers, phase readiness, next action, and fresh-checkout evidence as separate pass/fail gates.
   - Confirm the Phase 11 Proof Freshness panel breaks proof into Phase 1/2/6 priority proof, Phase 3 clearance, desktop smoke, command-plan, CLI validation, and handoff proof rows without running smoke commands or release actions, that the desktop smoke row carries evaluated-at freshness plus storage-proof attested/review counts, and that the handoff row preserves trusted current active goal/PM traceability before provider or release readiness advances.
   - Confirm the Phase 11 Evidence Records panel shows fresh checkout, clean checkout, build/test, and docs/known-limits records with source/timestamp text and missing, stale, malformed, waiting, review, blocked, or ready states without running release actions, supports local metadata-only record/import/clear controls, refreshes freshness while the app remains open, and blocks mismatched gate metadata or future-dated timestamps as malformed evidence.
   - Confirm the Phase 11 Owner Command panel stays in review or blocked while blocked, active, next, planned, or paused remaining goals exist, even if checklist, proof freshness, and fresh-checkout records are otherwise ready.
   - Confirm the Phase 11 command center holds release readiness while the owner-approved push blocker or fresh-checkout evidence is unresolved.
   - Confirm the Phase 11 command center shows prioritized remaining-goal trace rows with critical/current goals first, then high-priority pending goals, including goal IDs, phase counts, PM task link counts, status, and completion.
   - Confirm the Phase 11 owner release traceability rows link the Owner Testing command center, proof freshness depth, evidence records, release readiness, required Project Management rows, and packaging holds without running tests, builds, packaging, Git pushes, or release actions, and that packaging-hold next actions appear ahead of broader release-readiness blockers.
   - Confirm the Phase 11 blocker-priority queue ranks the exact top release blocker across owner proof, evidence freshness, release readiness, PM coverage, and packaging hold state, including desktop-smoke storage review as a Phase 3 proof blocker and final security closure capability holds when the release decision cannot close.
   - Confirm the Phase 11 Release Readiness panel shows clean checkout, build/test, owner smoke proof with desktop-smoke storage attestation detail, packaging lock, docs/known limits, security closure, current active Phase 3 clearance PM traceability with handoff proof, and final release decision as separate gates.
   - Confirm the release readiness decision remains held while clean checkout, build/test, smoke proof, current active Phase 3 clearance PM traceability with handoff proof, docs/known limits, final security closure capability, owner proof, or remaining-goal blockers are unresolved.
   - Confirm the packaging lock row is ready only because packaging and resume controls stay locked; do not run packaging, signing, installer, Git push, or external release actions from this gate.
   - Confirm the Environment panel Phase 4 Provider Readiness card classifies all six provider surfaces without executing commands, skills, plugins, MCP tools, automations, or personalization mutations.
   - Confirm the Phase 4 Provider Readiness card shows catalog-depth rows for command, skill, plugin, MCP, automation, and personalization source labels, totals, evidence expectations, and execution locks.
   - Confirm the Phase 4 Surface Depth panel shows surface coverage, setup blockers, capability gaps, preview review, approval gate, audit gate, rollback gate, permission gate, and the execution lock while remaining metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution.
   - Optionally run `npm run smoke:phase1-2` to execute the opt-in one-panel live smoke and two-panel isolation desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
   - Optionally run `npm run smoke:phase3` to execute the opt-in live-control, active-turn interrupt, and active-turn steer desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
   - Optionally run `npm run smoke:phase3:record` to execute the same Phase 3 smoke command and write `local_private/phase3-command-validation-record.json` plus `local_private/phase3-smoke-proof-bundle.json` for Owner Testing import. The command-validation artifact records CLI validation only; the smoke-proof bundle carries the desktop-executed proof rows that still pass the per-row storage filter.
3. `Chat`
   - Send a test message and verify response capture and interruption controls.
   - Confirm the same session can continue after transient stalls.
4. `Multi-Panel`
   - Open two or more panels and switch focus repeatedly.
   - Verify each panel preserves its own session context and activity state.
   - Confirm corrupted saved panel metadata with duplicate live identities shows a conflict warning and does not send live chat through the duplicated identity.
   - Switch to Adaptive Arena and confirm the Phase 10 Arena Polish panel reports layout regression, density/readability, keyboard controls, focus state, terminology, and acceptance gates separately.
   - Confirm the Phase 10 Arena polish traceability rows link the remaining goal, PM child coverage, Arena polish readiness, layout/density evidence, and acceptance gate before packaging can resume.
   - Confirm the Phase 10 Arena polish blocker-priority queue ranks layout, density, keyboard, focus, terminology, acceptance, PM coverage, and traceability blockers and shows whether Arena review can address the top blocker, with PM or remaining-goal link blockers treated as planning metadata repair instead of Arena-review addressable.
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
   - Submit one provider-routed panel command in live desktop mode and confirm the transcript shows provider-route evidence before the live turn runs, then reload and confirm the Owner Testing slash evidence remains attached from local panel evidence storage with fresh source, panel, timestamp, and evidence-fingerprint provenance.
   - Confirm the Owner Testing panel moves slash execution evidence from review to ready only after provider-route plus live/status transcript proof is present.
   - Confirm the Owner Testing Phase 3 gate remains review or waiting until slash execution, session-control evidence, live-control smoke, active-turn interrupt smoke, and active-turn steer smoke are all proven ready, and that each diagnostic row visibly shows its PM child link, unique evidence key, current provenance/detail text, and row-specific top-level next action without relying on hover text.
   - Confirm focusing an Arena panel makes Phase 3 slash/session readiness use that panel's evidence before any other panel's ready proof, that the Phase 3 gate shows the current panel label, and that a focused panel with no proof stays waiting instead of borrowing another panel's proof.
   - Confirm session-control evidence survives reload from local panel evidence storage with fresh source, panel, timestamp, and evidence-fingerprint provenance, without executing session controls automatically.
   - Confirm missing focused-panel context plus legacy, stale, future-dated, wrong-panel, or fingerprint-mismatched slash/session storage proof returns to review and asks for current panel transcript/session refresh before Phase 3 can exit.
   - Confirm the Owner Testing Phase 3 clearance package shows `Exit held` until every gate item is ready, lists exact open blockers, and promotes the next runnable smoke action only when it matches the first open smoke blocker.
   - Confirm the Owner Testing Phase 3 blocker-priority queue ranks the top exact blocker, shows the top blocker evidence key plus whether `npm.cmd run smoke:phase3` can address it, and keeps slash or session-control blockers ahead of unrelated smoke actions.
   - Confirm the Owner Testing Phase 3 traceability rows link current active `goal-phase-3-proof-clearance`, every required Phase 3 PM child row, clearance evidence, blocker priority, command plan, CLI validation freshness, and current-evidence handoff boundary before Phase 3 is treated as exit-ready, with blocked clearance rows carrying the exact blocker-priority next action.
   - Confirm the Owner Testing Phase 3 desktop smoke command plan shows `npm.cmd run smoke:phase3`, separate live-control, active-turn interrupt, and active-turn steer proof rows, exact blocker detail on open command-plan rows, and a held/runnable state without executing the command automatically.
   - After manually running `npm.cmd run smoke:phase3`, use the Phase 3 command validation record to capture the local CLI pass, or import `local_private/phase3-command-validation-record.json` after `npm.cmd run smoke:phase3:record`; then confirm this freshness-reviewed record does not mark persisted desktop UI proof rows ready or unlock handoff by itself.
   - Run `npm.cmd run test:phase3:owner-visible` to verify the Owner Testing panel renders the imported desktop proof, current-panel slash/session provenance, CLI validation provenance, fresh handoff age, clearance snapshot, and current evidence match as visible owner-review text without running live desktop smoke.
   - Confirm Phase 3 CLI validation and desktop smoke proof rows fall back to review when they cannot be checked against the current evaluation timestamp or are dated after it, and that the desktop smoke bundle shows the evaluated-at timestamp plus freshness window used for that decision.
   - After `npm.cmd run smoke:phase3:record`, import `local_private/phase3-smoke-proof-bundle.json` from the Phase 3 desktop smoke readiness rows and confirm only desktop-executed rows are preserved in persisted proof storage with per-row storage proof source, createdAt timestamp, and matching proof fingerprint.
   - Confirm desktop-shaped smoke proof rows that were not loaded from persisted/imported proof storage, or whose storage-proof fingerprint no longer matches the normalized row, remain in review and cannot make Phase 3 exit-ready.
   - Confirm Phase 3 smoke action and import notices distinguish a transient passed run from proof rows that were actually persisted and attested for handoff.
   - Confirm slash or session-control blockers stay ahead of unrelated runnable smoke actions, non-matching smoke action buttons stay held, and only a matching smoke blocker promotes its smoke action plus command-plan guidance.
   - Confirm the Owner Testing Phase 3 handoff gate holds provider integration until desktop proof clearance is ready, exact blocker visibility is clear, current active goal and required PM traceability are trusted, and a non-expired, non-future-dated owner handoff record matching the compact current evidence fingerprint is attached with visible fingerprint, age, clearance snapshot, and row-level next-action validation.
   - Confirm a ready-looking owner handoff record without current fingerprint validation or fresh age metadata returns to review instead of advancing provider integration.
   - Confirm `Record handoff` stays disabled until Phase 3 clearance is exit-ready and current active goal/PM traceability is trusted, writes a local owner handoff record when enabled, and `Clear record` removes that local record without changing smoke proof evidence.
   - Confirm the Owner Testing Phase 3 smoke proof rows show browser fallback or non-executed proofs as `waiting`, successful fresh desktop proofs as `ready`, stale or incomplete desktop proofs as `review`, and unsupported-after-execution proofs as `blocked`, with Phase 11 Proof Freshness carrying the same evaluated-at timestamp and storage-proof attested/review counts into its desktop smoke proof row.
   - Reload after any desktop smoke proof row is captured and confirm that each desktop-executed row is preserved independently without requiring all three smoke rows to be captured in one run.
   - Use the Phase 3 gate diagnostic rows to identify which proof is still waiting, review, or blocked before rerunning desktop smokes, provider-routed slash proof, or session-control proof.
   - Use the Phase 3 gate action buttons to rerun live-control, active-turn interrupt, and active-turn steer smoke proofs only after explicitly choosing the action.
   - Refresh the command catalog and confirm metadata/status is updated as a safe metadata/status refresh (no side-effectful actions).
7. `Catalogs`
   - Open command, skill, plugin, MCP, automation, and personalization catalogs.
   - Verify stable ordering and filtering output across repeated reloads.
   - Confirm the Owner Testing panel shows six catalog refresh validation rows and a metadata-only safety note.
   - Confirm the Phase 4 Provider Readiness card updates from the same catalog snapshots and shows ready, preview, setup-required, unsupported, unavailable, or blocked labels with an exact next action.
   - Confirm the Phase 4 Provider Readiness catalog-depth rows keep all six provider surfaces visible with source labels, totals, evidence expectations, and locked execution posture.
   - Confirm the Phase 4 Surface Depth panel uses those metadata snapshots to expose surface coverage, setup blockers, capability gaps, preview review, approval gate, audit gate, rollback gate, permission gate, and the execution lock without running provider actions.
   - Run `npm.cmd run test:phase4:owner-visible` to verify the Phase 4 Provider Readiness panel renders catalog source labels, totals, evidence expectations, execution-lock guidance, and surface next actions as visible owner-review text without running provider actions.
   - Confirm all-ready metadata still leaves the Phase 4 approval, audit, rollback, and permission rows in review while the execution-lock row stays attached, keeps Provider Blocker Priority open, and does not report provider execution as ready until those gates exist.
   - Confirm the Phase 4 Provider Traceability rows link `goal-phase-4-provider-surfaces`, all required Phase 4 PM child rows including `phase-04-child-blocker-priority`, catalog-depth evidence, fresh fingerprint-matched refresh-safety evidence, surface-depth evidence, provider execution locks, and current-active Phase 4 goal state, and block when a required row is missing from either the board plan or the remaining-goal links.
   - Confirm the Phase 4 Provider Blocker Priority rows rank the exact top provider blocker, show whether catalog smoke can address it, and keep setup-required or unavailable provider blockers ahead of preview-only refresh proof.
   - Open the connection dialog and run the catalog smoke to refresh all six catalog metadata/status surfaces together without execution.
   - Confirm the Connection Dialog Refresh Safety depth rows show refresh run state, six-surface order, validation result, proof freshness, catalog fingerprint match, metadata-only contract, and provider execution lock.
   - Reload after a passed catalog smoke and confirm the Phase 4 catalog smoke proof and refresh-safety depth rows keep the last metadata-only six-surface result without running provider actions on startup, while stale checkedAt values or mismatched catalog fingerprints return to preview.
   - Confirm Owner Testing validation rows, Connection Dialog catalog smoke rows, Provider Readiness catalog-depth rows, Refresh Safety depth rows, Surface Depth rows, Provider Traceability rows, and Provider Blocker Priority rows report the same six provider surfaces as one linked metadata-only safety chain, with approval, audit, rollback, and permission still visible as separate execution holds.
   - Refresh the command catalog as a safe metadata/status refresh and confirm source/state changes are visible without side effects.
   - Refresh the skill catalog as a safe metadata/status refresh and confirm source/state changes are visible without executing skills.
   - Refresh the plugin catalog as a safe metadata/status refresh and confirm source/state changes are visible without invoking plugin actions.
   - Refresh the MCP catalog as a safe metadata/status refresh and confirm source/state changes are visible without running MCP tools.
   - Refresh the automation catalog as a safe metadata/status refresh and confirm source/state changes are visible without scheduling or running automations.
   - Refresh the personalization catalog as a safe metadata/status refresh and confirm source/state changes are visible without mutating profile or instruction sources.
8. `Migration`
   - Validate migration plan preview and reviewed-draft staging flow.
   - Confirm the Migration review gate reports preview selection, apply intent, rollback evidence, fingerprint-matched audit consistency, and complete sensitive exclusions before any apply path, and keeps apply-review staging disabled when secret/auth, raw transcript, or source mutation/browser exclusions are incomplete.
   - Confirm the Migration review depth records show apply-intent lock, local apply-review-staged audit proof, rollback evidence, fingerprint-matched audit consistency, sensitive exclusions, and profile activation lock as separate owner-review rows with PM row links and unique evidence keys.
   - Run `npm.cmd run test:phase5:owner-visible` to verify the Migration review gate renders the local apply-review-staged audit proof, evidence key, source-data lock, active-profile lock, traceability, and blocker-priority text as visible owner-review text without applying a migration.
   - Confirm the Migration traceability rows link the Phase 5 remaining goal, PM child coverage, review-depth evidence, sensitive exclusion boundary, draft/audit fingerprint coverage, profile activation lock, and current-active Phase 5 goal state before apply review can be trusted, and block when a required PM row is missing from either the board plan or the remaining-goal links.
   - Confirm the Migration blocker-priority queue ranks the exact top blocker, shows whether metadata review can address it, and keeps blocked audit/apply-intent blockers ahead of waiting or review-only evidence before any migration apply path.
   - Confirm `Stage apply review` creates only an owner-visible intent notice plus a local `apply-review-staged` audit history event, survives reload, appears as its own Migration review-depth row, and does not change the active profile, source platform, files, commands, plugins, MCP tools, automations, or personalization state.
   - Confirm migration audit summary exists locally and includes accepted, review-required, unsupported, and excluded counts.
   - Confirm rollback metadata includes prior profile pointer, rollback audit note, checksumable manifest references, and no source mutation.
   - Confirm secrets, tokens, auth caches/files/state, browser state, source artifacts, raw transcripts, and source mutation remain excluded from persisted migration metadata.
9. `Planning`
   - Create or update a plan item and confirm expected persistence updates.
   - Confirm planning metadata remains readable after a refresh.
   - Confirm the Project Management board contains Phase 0 through Phase 11 as Epics and that representative Epic, Parent, and Child rows each stage an Arena review package through `Run`.
   - Confirm Phase 6 includes publish-hold traceability and blocker-priority child rows linked to the Phase 1/2/6 publish-hold goal.
10. `Dispatch`
    - Dispatch a staged pipeline item through the standard lane.
    - Confirm role-panel plan generation, route details, and log records are consistent.
    - Confirm the selected local run shows a dispatch review record with role counts, max attempt limit, handoff task count, handoff packet count, validation gate count, and a no-runtime-execution note.
    - Confirm the dispatch review depth checks show role coverage, attempt limits, handoff tasks, handoff packet integrity, evidence freshness, validation gates, and the live worker lock as separate rows, and that the newest review record is selected when no explicit record is chosen.
    - Run `npm.cmd run test:phase7:owner-visible` to verify the dispatch review card renders every Phase 7 review-depth row, integration ownership row, traceability row, blocker-priority row, evidence fingerprint, and local metadata-only live-worker lock as visible owner-review text without spawning workers.
    - Confirm the integration ownership rows show Main Codex as the final integration, validation, commit, push approval, reporting, traceability, and closure-boundary owner.
    - Confirm the Phase 7 dispatch traceability rows link the remaining goal, PM child coverage, dispatch review depth, evidence freshness, integration ownership depth, live-worker lock, and current-active Phase 7 goal state before dispatch review can be trusted.
    - Confirm the Phase 7 dispatch blocker-priority queue ranks role coverage, attempt limits, handoff tasks, handoff packet integrity, evidence freshness, validation gates, integration ownership, traceability, closure boundary, and live-worker lock blockers and shows whether dispatch review can address the top blocker.
    - Confirm missing role coverage, missing validation gates, oversized attempt limits, or a missing no-runtime-execution note keep dispatch in waiting, review, or blocked state.
    - Confirm a PM row staged through `Run` creates the same local review trace before any live worker session spawning.
    - Verify the result is a local review artifact only (no runtime worker launch or external session execution).
11. `Permissions`
    - Trigger at least one sensitive action.
    - Verify approval and block branches are explicit and safe.
    - Confirm the Phase 8 Audit Depth panel lists missing permission, approval, evidence, audit persistence, and rollback requirements for risky or blocked actions.
    - Confirm at least one Phase 8 risk exception explains why the path is exceptional, what evidence is required, and which audit source owns the proof.
    - Confirm executed or failed audit records keep Rollback requirement in review until each record carries rollback owner, rollback path, or rollback review notes.
    - Confirm Phase 8 audit-depth rows and disabled-path exceptions show linked PM child rows and unique evidence keys.
    - Confirm stale owner audit-review records fall back to review when their saved audit evidence fingerprint no longer matches current Phase 8 evidence.
    - Confirm the Phase 8 risk traceability rows link the remaining goal, PM child coverage, audit-depth evidence, risk exception register, disabled-path lock, and current-active Phase 8 goal state before permission audit can be trusted, and block when a required PM row is missing from either the board plan or the remaining-goal links.
    - Confirm the Phase 8 risk blocker-priority queue ranks the exact top permission, approval, evidence, audit, rollback, disabled-path, or traceability blocker and shows whether audit review can address it before mutation paths grow.
    - Confirm the Phase 8 owner audit review can be recorded locally, survives refresh, carries rollback evidence, and never unlocks runtime, profile, terminal, Git, MCP, plugin, automation, or external-service mutation paths by itself.
    - Confirm at least one disabled mutation path explains what remains locked before terminal, Git, MCP, plugin, automation, runtime, profile, or external-service actions can proceed.
    - Confirm rollback expectations are visible separately from audit evidence so approval alone never implies mutation readiness.
    - Confirm the panel keeps runtime/profile execution locked while audit and rollback requirements are reviewed.
    - Confirm the Phase 9 Runner Approval panel keeps `terminal-readonly-probe` as the only selected desktop-backed action.
    - Confirm Phase 9 shows owner permission, approval window, request preview, validation output, approval/result audit, and rollback evidence as separate targets.
    - Confirm the Phase 9 runner approval depth records separately list fixed probe selection, owner approval, request preview, validation output, audit record, local runner-review record, rollback evidence, and desktop execution lock, each with a unique evidence key and linked Phase 9 PM child or parent row.
    - Confirm the Phase 9 local runner-review record can be recorded, survives refresh, carries rollback evidence, matches the current runner evidence fingerprint, links to the current Phase 8 owner audit review record, and never unlocks broad terminal, Git, MCP, plugin, automation, runtime, profile, or external-service mutation paths by itself.
    - Confirm the Phase 9 runner traceability rows link the remaining goal, PM child coverage, Phase 8 audit gate, runner approval depth, local runner-review record, mutation lock, and current-active Phase 9 goal state before the fixed desktop probe can be trusted, block when a required PM row is missing from either the board plan or remaining-goal links, and return stale persisted runner-review records to review when the owner-review fingerprint or Phase 8 review link no longer matches current evidence.
    - Confirm the Phase 9 runner blocker-priority queue ranks the Phase 8 gate, owner permission, approval preview, validation output, audit record, local runner-review record, rollback evidence, traceability, and mutation lock blockers and shows whether runner review can address the top blocker.
    - Confirm the desktop probe request remains held until owner approval is ready, and broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths remain locked.
12. `Reload`
    - Reload during an in-progress run and resume from persisted context.
    - Confirm unsaved owner state is surfaced before continuing.
13. `Recovery`
    - Induce one recoverable failure path.
    - Verify recovery evidence and handoff route are visible and deterministic.

## Repeatability Note

Record state for each item at every run and compare across runs. If state changes only because of environment fluctuations, file the variance and rerun after a clean refresh.
