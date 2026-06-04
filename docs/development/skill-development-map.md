# Skill Development Map

Use skills and tools deliberately. They should speed development, validation, and design quality without expanding the MVP scope.

## Primary Skills For MVP

| Skill Or Tool | Use When | Why It Matters |
|---|---|---|
| `define-goal` | Finalizing goals, phase gates, and acceptance criteria | Keeps work measurable and prevents vague progress loops |
| `product-design:get-context` | Starting a UI/design workflow or replaying a product brief | Keeps the cockpit experience grounded before visual work |
| `ui-ux-pro-max` | Reviewing cockpit layout, accessibility, states, and dense desktop UI | Helps avoid dashboard clutter and weak interaction states |
| `playwright-interactive` | Iterating on local desktop or browser-rendered UI checks | Supports screenshot and interaction validation |
| `browser:control-in-app-browser` | Opening and checking local preview targets | Useful for fast visual smoke checks when a web preview exists |
| `node_repl` tools | Driving scripted local UI checks with Browser or Playwright | Helps automate repeatable renderer checks without manual clicking |
| `openai-docs` | Checking current official Codex/OpenAI integration docs | Prevents stale assumptions about supported Codex surfaces |
| `github` and `yeet` | Publishing branches, PRs, and reviewing repository state | Keeps public collaboration traceable |
| `multi_agent_v1` tools | Splitting independent work into agents or validators | Speeds development when file ownership does not overlap |
| Codex app thread/worktree tools | Creating background threads or worktrees for isolated tasks | Supports the orchestrator-worker development workflow |

## Later Skills

| Skill Or Tool | Use When | Why It Matters |
|---|---|---|
| `figma-generate-design` and `figma-use` | Creating or syncing a polished cockpit design in Figma | Helpful once core UI direction is stable |
| `figma-generate-library` | Formalizing components, tokens, and variants | Useful before broader design-system work |
| `product-design:ideate` | Exploring visual alternatives | Use after the product brief is stable and before a major visual direction decision |
| `product-design:prototype` | Building a clickable cockpit prototype from a confirmed brief | Useful when validating the product flow before deeper desktop integration |
| `product-design:image-to-code` | Implementing a selected visual target | Useful after a concrete screenshot, Figma frame, or generated mock is chosen |
| `product-design:design-qa` | Comparing implementation against a selected visual target | Useful before UI handoff once screenshots or Figma frames exist |
| `product-design:audit` | Reviewing a working Steerboard flow from captured evidence | Useful after a real flow exists, not before MVP scaffolding |
| `gh-fix-ci` and `gh-address-comments` | Handling CI failures or PR review comments | Useful after CI and PR workflows exist |

## Avoid For MVP Unless Explicitly Needed

- Resume and career-specific skills.
- Creative production ad, logo, offer, and moodboard skills.
- Presentation, spreadsheet, and document-generation skills.
- Figma file creation unless the user asks for an external design artifact.

## Usage Rule

Before using a skill, confirm it maps to the current phase's validator. If it does not help launch, verify, design, or safely publish the scaffold, leave it out of MVP work.
