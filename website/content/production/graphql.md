---
title: GraphQL
---
# GraphQL

The server subpath exposes Retinue's reference GraphQL schema for applications that want an API boundary around conversations and runs. Your host supplies authentication and builds the tenant/principal context; Retinue does not infer identity from model input.

GraphQL operations cover conversation and run lifecycle work, while SSE and subscriptions deliver durable run events to clients. Use the generated API/schema for exact operations and fields because the host is designed to be composed by an application.

One representative mutation is:

```graphql
mutation SendMessage($conversationId: ID!, $runId: ID!) {
  sendMessage(conversationId: $conversationId, runId: $runId) { id }
}
```

It admits an already-created run for a conversation; authentication and tenant context are built by the host before its resolver runs.

Next: [SSE and streaming](streaming), [Frontend](../frontend/overview), and the [GraphQL specification](/specifications/graphql-and-frontend).
