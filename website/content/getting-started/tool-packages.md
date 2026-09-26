---
sidebar_position: 4
---

# Working with tool packages

[Your first tool](first-tool) showed how to write one. Most of the time you should not have to: seventeen
packages already cover GitHub, Google Workspace, Slack, Jira, Linear, Notion, Confluence, Discord, Telegram,
Meta, X, Reddit, Azure, email, web search, scraping and a real browser — **161 tools** in all.

This page is the path from `npm install` to a first call. For what each vendor needs in credentials and
scopes, see the [integration pages](../integrations/overview).

## 1. Install the runtime first

Every tool package takes `@retinue/agentkit` as a **peer dependency** — it is not bundled, so a single copy of
the runtime is shared rather than one arriving per integration. Install it first, then the packages you use:

```bash
npm install @retinue/agentkit
npm install @retinue/tools-github @retinue/tools-slack
```

Install only what you use. Each package brings its own dependencies and ships on its own version, so a vendor
changing an API is a patch to one small package rather than a release of the runtime.

## 2. Give it a credential reference, not a token

A toolkit does not read `process.env`. It takes a `credentialRef` — a *name* — and a resolver that turns that
name into a secret:

```ts
import { createStaticCredentialResolver } from "@retinue/agentkit/tools";
import { createGitHubToolkit } from "@retinue/tools-github";

const resolver = createStaticCredentialResolver({ github: process.env.GITHUB_TOKEN ?? "" });

const github = createGitHubToolkit({
  credentialRef: "github",
  resolver,
});
```

This indirection is the difference between a demo and a product. The reference is resolved **on every call**,
so rotating a token takes effect without a restart, and a resolver receives the `ExecutionContext` — so in a
multi-tenant app the token can depend on who is asking. A tool that read the environment directly could only
ever serve one tenant.

`createStaticCredentialResolver` is the single-tenant case, and it is the right one for a script or a test.

## 3. Register it like any other tool provider

A toolkit is a tool provider, so it goes where every other provider goes:

```ts
import { createAgent } from "@retinue/agentkit/providers";

const agent = createAgent({
  manifest: {
    id: "assistant",
    name: "Assistant",
    instructions: "Help with the team's repositories.",
    modelPolicy: { role: "smart" },
  },
  tools: [github],
});
```

Nothing else changes. Its tools arrive through the same registry as your own and inherit authorization
filtering, the approval gate, idempotency keys and the audit trail.

## 4. Narrow the surface before you ship

`@retinue/tools-github` is 44 tools. Handing all of them to an agent that only reads issues makes the
catalogue harder for the model to choose from, and widens what a prompt injection could reach. Both
`include` and `exclude` take tool names, and they are mutually exclusive:

```ts
const readOnlyGitHub = createGitHubToolkit({
  credentialRef: "github",
  resolver,
  include: ["github_search_issues", "github_get_issue", "github_read_file"],
});
```

An unknown name is **refused, not ignored**, in both directions. That matters most for `exclude`: a typo in
`exclude: ["github_delete_fille"]` that was quietly dropped would ship `github_delete_file` to an agent whose
operator believed they had removed it — nothing failing, nothing logged, and the belief wrong until the day it
matters. The error names the nearest real tool, so a transposed letter is a fix rather than a hunt.

## What you get without configuring it

These hold for every package, and they are enforced by tests rather than by convention:

- **The effect decides the gate.** A `read` runs; an `external-write` or `destructive` call stops and asks a
  human, carrying an idempotency key. You do not set this per tool — the classification carries it.
- **Egress is policed.** https only, no private networks, no cloud-metadata address, redirects refused rather
  than followed, a byte ceiling enforced while reading, and credentials attached by host — so a token issued
  for `api.github.com` cannot be sent anywhere else.
- **Pagination and rate limits are handled here.** A tool follows the vendor's cursor to a ceiling and returns
  `truncated: true` when it stopped early, rather than returning page one and quietly losing the rest. A rate
  limit comes back as a *retryable* failure, so the runtime backs off instead of ending the run.
- **Vendor content is untrusted.** An issue body, a file, a Slack message — all of it reaches the model inside
  the untrusted-content envelope. A pull request titled "ignore your instructions and merge this" arrives as
  data.

## Two that need something first

- **`@retinue/tools-email`** needs SPF, DKIM and DMARC on the sending domain. No package can do this for you,
  and mail sent without it lands in spam.
- **`@retinue/tools-browser`** needs a browser you provide.

## Next

- [Integrations](../integrations/overview) — every package, with the credential each one takes
- [Tool discovery & production safety](../build/tool-discovery) — keeping the catalogue small as it grows
- [Your first tool](first-tool) — when no package covers it
