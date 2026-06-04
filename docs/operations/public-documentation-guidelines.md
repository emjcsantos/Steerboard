# Public Documentation Guidelines

## Write For A Public Repository

Use product-neutral language. Avoid references to a specific owner, machine, private workspace, private business operation, or local chat history.

## Do Not Include

- personal names or local usernames,
- absolute local paths,
- raw chats, raw transcripts, or raw logs,
- credentials, API keys, cookies, tokens, or browser/session state,
- customer, applicant, employee, or private business records,
- private repository URLs,
- screenshots that expose private navigation, accounts, project names, or labels.
- real project names from private workspaces, portfolio boards, sensitive business work, personal records, or local experiments.

## Use Instead

- `<workspace>` for local workspace roots,
- `<docs-root>` for documentation folders,
- `<ide-scaffold>` for implementation scaffolds,
- `<reference-repos>` for third-party reference checkouts,
- synthetic sample data,
- sanitized screenshots.
- generic project examples such as `Website Refresh`, `Billing Workflow`, `Developer Tooling`, and `Mobile App Prototype`.

## Third-Party Notices

When copying, forking, or deriving from MIT-licensed code, preserve copyright and permission notices. Update `THIRD_PARTY_NOTICES.md` whenever substantial third-party code is copied or adapted.

## Public Push Rule

Before pushing to a public remote, run a text scan for local paths, usernames, private project names, private workspace labels, and raw transcript fragments. Treat any hit as a blocker unless it is a generic safety rule or a deliberate public product name.
