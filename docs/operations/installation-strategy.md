# Installation Strategy

AtlasUI should be easy to inspect before it is trusted with real projects.

## Recommended Adoption Ladder

1. Source-first preview.
2. Signed desktop builds.
3. Package-manager distribution.
4. Managed team or enterprise builds.

## Source-First Preview

The first public adoption path should be a git-based install for developers and early evaluators.

Expected shape:

```text
git clone https://github.com/example/atlasui.git
cd atlasui
pnpm install
pnpm dev
```

Benefits:

- Users can inspect the code before running it.
- Security-conscious developers can review scripts, dependencies, and local permissions.
- Issues and pull requests map directly to the source.
- Early releases avoid the trust problem of an unknown installer.
- The project can keep public setup instructions reproducible.

Requirements before promoting this path:

- Minimal install scripts.
- No postinstall network surprises beyond normal package-manager behavior.
- Clear dependency audit instructions.
- Public-safe fixture data only.
- Explicit permission model for project folders, Git, terminal, local agent runtimes, and notifications.
- One-command development startup.
- One-command local production build.

## Signed Desktop Builds

Signed desktop builds should become the main non-developer path once the app is stable enough for broader use.

Signed builds matter because many users will not run source builds, and operating systems warn heavily against unknown binaries. The app should explain local-first behavior, required permissions, and what never leaves the machine by default.

## Package Managers

Package-manager distribution should follow stable signed builds.

Targets can include:

- Homebrew for macOS and Linux developers,
- Winget for Windows users,
- Scoop or Chocolatey if there is enough demand.

Package managers make install and update flows feel less risky than downloading a random installer.

## Hosted Demo

A hosted demo can be useful, but only as a product walkthrough with mock data. It should not be positioned as the real product because AtlasUI's core value depends on local project access and local runtime control.

## Not Recommended For MVP

- Cloud-hosted control plane for real local projects.
- Installer-only release with no source setup path.
- Auto-updating binary before the security model and signing path are clear.
