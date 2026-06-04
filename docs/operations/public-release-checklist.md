# Public Release Checklist

Use this checklist before pushing docs, code, screenshots, fixtures, or demo data to a public remote.

## Required Checks

- No local machine paths.
- No personal names or local usernames.
- No private project, customer, sensitive business, personal-record, career, or portfolio labels.
- No raw chat logs or transcripts.
- No API keys, credentials, cookies, tokens, or browser/session state.
- No screenshots exposing private navigation labels, accounts, branches, or workspace names.
- Demo data uses generic project names only.
- Third-party references are credited without copying unapproved code or assets.
- New docs are linked from `README.md` when they are product-source material.
- Source-first install instructions are reproducible from a clean clone.
- Install scripts and package-manager hooks are reviewed for unexpected network, file, or shell side effects.

## Suggested Text Scan

Search for:

- local path fragments,
- usernames,
- private project labels,
- account or organization names,
- raw transcript markers,
- secrets and token patterns.

Any match must be removed, sanitized, or explicitly documented as a safe public product name before push.
