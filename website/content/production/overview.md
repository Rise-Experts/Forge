---
title: Run Retinue in production
description: Move from an embedded agent to the Retinue server and worker runtime.
---

# Run Retinue in production

The embedded facade is intentionally simple. Production deployments use the same engine with durable stores, a queue, an API host, and workers.

```mermaid
flowchart LR
  U[Client] --> A[API host]
  A --> P[(PostgreSQL / Supabase)]
  A --> Q[(Redis / BullMQ)]
  Q --> W[Worker]
  W --> P
  W --> M[Model provider]
  A --> S[SSE / GraphQL]
```

| Choose | When |
|---|---|
| **Embedded** | You are learning, writing a script, testing, or can accept in-process state. |
| **Server** | You need multi-process work, persistent state, recovery, realtime clients, or tenant-aware hosting. |

The repository's `compose.yaml` starts PostgreSQL with pgvector, Redis, migrations, the reference app, API host, and worker. See [Configuration](../getting-started/configuration), [Durable runtime](../concepts/durable-runtime), and [Troubleshooting](../troubleshooting).
