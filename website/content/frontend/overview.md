---
title: Frontend
description: Build a Forge UI with the headless @retinue/react package.
---

# Frontend

`@retinue/react` is a headless React package for turning Forge transport events into render-ready state. It does not impose a visual design or require one transport implementation.

```mermaid
flowchart TD
  R[Forge server] --> T[GraphQL or SSE client]
  T --> H[@retinue/react]
  H --> U[Your UI]
```

Wrap your UI in `ForgeProvider`, then use hooks such as `useRunSubscription`, `useConversation`, `useSendMessage`, `usePendingInteraction`, `useAnswerQuestion`, and `useDecideApproval`. The subscription reducer folds ordered run events into parts and can resume from a sequence cursor. Localization helpers map stable status and error codes to your catalog.

```tsx
import { ForgeProvider, useRunSubscription, useSendMessage } from "@retinue/react";
import type { ForgeClient } from "@retinue/react";

function Chat({ client }: { client: ForgeClient }) {
  return <ForgeProvider client={client}><Thread /></ForgeProvider>;
}
function Thread() {
  const { parts } = useRunSubscription({ runId: "run-1", conversationId: "conversation-1" });
  const { send, sending } = useSendMessage({ conversationId: "conversation-1" });
  return <button disabled={sending} onClick={() => void send("Hello")}>{parts.length} parts</button>;
}
```

Next: [GraphQL](../production/graphql), [SSE and streaming](../production/streaming), and the [client API](/api/).

Use it when your application needs a chat UI, streaming state, durable approval and question states, or localized client messages. Start with the [Frontend concept](../concepts/frontend), then use the [client package reference](../reference/client-surface) for setup and public exports.
