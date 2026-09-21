---
sidebar_position: 2
---

# Quickstart: build your first agent

In about five minutes, you will run an agent locally using Forge's **embedded** mode. It needs no
database, queue, or server. `createAgent` wires the reference in-memory adapters, model registry,
tool registry, and default engine for you.

## 1. Prerequisites

- Node.js 20 or later
- An Anthropic API key

## 2. Install

```bash
npm install @retinue/agentkit @ai-sdk/anthropic
```

`@ai-sdk/anthropic` is an optional peer dependency because Forge supports more than one provider. The default embedded catalog uses Anthropic models.

## 3. Configure your model credential

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

In Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your-api-key"
```

## 4. Create `agent.ts`

```ts
import { createAgent } from "@retinue/agentkit/providers";

const agent = createAgent({
  manifest: {
    id: "assistant",
    name: "Assistant",
    instructions: "You are a helpful assistant. Be concise.",
    modelPolicy: { role: "smart" }, // resolved by capability, never a hardcoded model id
  },
});
```

The default catalog maps `role: "smart"` and `role: "fast"` to Claude models, using the
`ANTHROPIC_API_KEY` from your environment. Pass `models` / `roleAssignments` / `providerCredentials`
to use your own catalog or a different provider.

## 5. Run a turn

```ts
const result = await agent.run({
  conversationId: "conv-1",
  message: "Draft a one-line launch tweet for our analytics dashboard.",
});

console.log(result.text); // the assistant's reply
```

Each `run` executes the turn to completion through the durable worker and returns once the run
reaches a terminal state. Token/cost usage is recorded as the turn streams.

You should see a one-line launch post. The exact wording varies because a model generated it.

## What you just built

| Part | What it does |
|---|---|
| **Model** | Forge resolves the `smart` role to a configured Anthropic model. |
| **Instructions** | The stable behavior you give the agent. |
| **Conversation** | `conversationId` groups messages and lets the next run load earlier turns. |
| **Run** | One durable execution of the agent for a message. |
| **Output** | `result.text` is the convenience text response; `result.parts` contains typed output and tool events. |

## 6. Continue the conversation

```ts
await agent.run({ conversationId: "conv-1", message: "Make it more playful." });
```

Because the conversation carries its own history, you don't re-send prior context — Forge loads the
conversation's messages and assembles the prompt under the model's token budget for you. State
persists across turns on the same `conversationId`.

## Next

- Give the agent a tool it can call → **[Your first tool](first-tool)**
- Remember facts about a user across conversations → **[Persistent memory](../guides/persistent-memory)**
- Run a multi-step process → **[Your first flow](first-flow)**
- Go durable/multi-user (server profile) → **[Run in production](../production/overview)**
