# Worker Task Rules

## Orchestrator Role

The main orchestrator owns:

- architecture,
- task splitting,
- worker dispatch,
- final validation,
- integration,
- commit,
- push,
- reporting.

## Worker Role

Worker agents own:

- small implementation tasks,
- small validation tasks,
- self-contained handoff summaries,
- up to three failed attempts before returning control.

Model and provider selection is runtime configuration. Worker task rules must describe roles, file ownership, validation requirements, and handoff contracts without requiring a specific model name.

## Task Size Rules

A worker task should usually touch one small file group:

- one component,
- one data model,
- one test file,
- one utility,
- one markdown brief,
- or one adapter method cluster.

Avoid worker tasks that mix UI, persistence, agent execution, security policy, and tests at the same time.

## File Ownership Rules

- Parallel workers must have non-overlapping file ownership.
- Shared files require sequential tasks.
- Schema files should be owned by one worker at a time.
- The main orchestrator integrates cross-cutting changes after workers return.

## Validation Loop

```text
loop_count = 0

while loop_count < 3:
  result = worker_run()
  validation = validator_run(result)
  if validation.pass:
    break
  loop_count += 1

main_orchestrator_validate_integrate_revise()
```

## Handoff Format

Each worker must return:

- task id,
- files changed,
- behavior changed,
- validation command,
- validation result,
- known risks,
- next recommended action.

## Stop Conditions

Return to the main orchestrator immediately if:

- file ownership overlaps,
- required secret or external account access is missing,
- a destructive action would be needed,
- validation fails three times,
- task scope proves too large.
