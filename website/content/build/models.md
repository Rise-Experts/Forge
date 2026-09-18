---
title: Models
description: Configure model providers and model roles for a Retinue agent.
---

# Models

An agent asks for a model **role** such as `fast` or `smart`; Retinue resolves that role to a configured provider model. This keeps agent behavior independent of one provider or model identifier.

The embedded facade includes a small Anthropic-oriented default catalog. Install the provider package you use and set its credential, or pass your own `models`, `roleAssignments`, and `providerCredentials` to `createAgent`.

## Why roles matter

An agent declaration expresses what it needs. The host decides the concrete model after considering provider availability, capabilities, and deployment policy. That distinction lets an application change provider configuration without rewriting every agent manifest.

```ts
import { createAgent } from "@retinue/agentkit/providers";

const agent = createAgent({
  manifest: {
    id: "support",
    name: "Support",
    instructions: "Answer clearly and briefly.",
    modelPolicy: { role: "fast" },
  },
});
```

For the provider setup required by this example, see the [Quickstart](../getting-started/quick-start). For the complete public surface, see the [API reference](/api/).
