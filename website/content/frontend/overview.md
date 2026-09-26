---
title: Frontend
description: Build a Retinue UI with the headless @retinue/react package.
---

# Frontend

`@retinue/react` is a headless React package for turning Retinue transport events into render-ready state. It does not impose a visual design or require one transport implementation.

```mermaid
flowchart TD
  R[Retinue server] --> T[GraphQL or SSE client]
  T --> H[@retinue/react]
  H --> U[Your UI]
```

Wrap your UI in `RetinueProvider`, then use hooks such as `useRunSubscription`, `useConversation`, `useSendMessage`, `usePendingInteraction`, `useAnswerQuestion`, and `useDecideApproval`. The subscription reducer folds ordered run events into parts and can resume from a sequence cursor. Localization helpers map stable status and error codes to your catalog.

```tsx
import { RetinueProvider, useRunSubscription, useSendMessage } from "@retinue/react";
import type { RetinueClient } from "@retinue/react";

function Chat({ client }: { client: RetinueClient }) {
  return <RetinueProvider client={client}><Thread /></RetinueProvider>;
}
function Thread() {
  const { parts } = useRunSubscription({ runId: "run-1", conversationId: "conversation-1" });
  const { send, sending } = useSendMessage({ conversationId: "conversation-1" });
  return <button disabled={sending} onClick={() => void send("Hello")}>{parts.length} parts</button>;
}
```

Next: [GraphQL](../production/graphql), [SSE and streaming](../production/streaming), and the [client API](/api/).

Use it when your application needs a chat UI, streaming state, durable approval and question states, or localized client messages. Start with the [Frontend concept](../concepts/frontend), then use the [client package reference](../reference/client-surface) for setup and public exports.
