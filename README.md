<img src="https://raw.githubusercontent.com/Rise-Experts/retinue/main/brand/retinue-mark.svg" alt="Retinue" width="72" />

# Retinue

Build reliable AI agents and automations in TypeScript.

Retinue is a provider-neutral platform for agents that need more than a single model call: typed tools, persistent context, human approval for consequential actions, and a runtime that can recover work across processes.

## Start here

The full developer documentation is at **[docs.retinue.riseexperts.de](https://docs.retinue.riseexperts.de)**.

- [Quickstart](https://docs.retinue.riseexperts.de/docs/getting-started/quick-start)
- [Agents](https://docs.retinue.riseexperts.de/docs/concepts/agents)
- [Tools and integrations](https://docs.retinue.riseexperts.de/docs/integrations/overview)
- [Run in production](https://docs.retinue.riseexperts.de/docs/production/overview)
- [API reference](https://docs.retinue.riseexperts.de/api/)

## Install

```bash
npm install @retinue/agentkit @ai-sdk/anthropic
```

`@retinue/agentkit` is the primary SDK and runtime package. Model-provider SDKs are optional peers; the embedded quickstart uses Anthropic.

## Your first agent

Set `ANTHROPIC_API_KEY`, then create `agent.ts`:

```ts
import { createAgent } from "@retinue/agentkit/providers";

const agent = createAgent({
  manifest: {
    id: "assistant",
    name: "Assistant",
    instructions: "Be helpful and concise.",
    modelPolicy: { role: "smart" },
  },
});

const result = await agent.run({
  conversationId: "welcome",
  message: "What can you help me with?",
});

console.log(result.text);
```

This is Retinue's embedded mode: it uses in-memory reference adapters and needs no database or queue. Move to the [server runtime](https://docs.retinue.riseexperts.de/docs/production/overview) when your application needs persistence, workers, recovery, realtime streaming, or multi-user hosting.

## What you can build

| Capability | What it provides |
|---|---|
| Agents | Model-driven programs with instructions, context, tools, and execution limits |
| Tools | Typed reads and writes with authorization, effect classification, approval, and idempotency |
| Flows | Versioned, recoverable processes with steps, branches, and human checkpoints |
| Context | Conversations, sessions, principal memory, and permission-aware document retrieval |
| Human-in-the-loop | Durable questions and approvals that pause and resume work |
| Integrations | Optional packages for GitHub, Google, Slack, Jira, Linear, Notion, Azure, email, search, and more |
| Production runtime | PostgreSQL/Supabase, Redis/BullMQ, GraphQL, SSE, workers, telemetry, and usage accounting |

## Packages

| Package | Purpose |
|---|---|
| `@retinue/agentkit` | Core runtime, server surface, tools, flows, persistence, knowledge, HITL, and adapters |
| `@retinue/react` | Headless React client state for Retinue events and transport |
| `@retinue/tools-*` | Optional integration packages that register tool providers |

The [package reference](https://docs.retinue.riseexperts.de/docs/reference/overview) explains supported subpaths and optional peers.

## Run the repository

```bash
npm install
npm run build
npm test
```

For the full reference application with PostgreSQL and Redis, set `RETINUE_MODEL_API_KEY` and run:

```bash
docker compose up
```

## Contributing

Retinue keeps public learning guides, generated API reference, and deeper implementation specifications separate. Start with the [developer docs](https://docs.retinue.riseexperts.de/docs/overview); use [Specifications](https://docs.retinue.riseexperts.de/specifications/) when you need the design rationale.

## License

[MIT](LICENSE) © Rise Experts.
