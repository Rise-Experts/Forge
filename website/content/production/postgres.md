---
title: PostgreSQL
---
# PostgreSQL

PostgreSQL is Retinue's durable state store. It holds conversations, messages, runs, checkpoints, approvals, memory, and other tenant-scoped records that must survive a process restart.

Configure `RETINUE_DATABASE_URL` with a PostgreSQL connection URL. `RETINUE_DATABASE_SCHEMA` is optional when Retinue shares a database; use the same value for the API, worker, and migration command. Run migrations before serving traffic (`retinue migrate` or the Compose `migrate` service).

If PostgreSQL is unavailable, the server is not ready and workers cannot safely persist run progress. Back up the database as application data: durable runs and approvals are part of the recovery story.

Next: [Supabase](supabase), [Redis and BullMQ](redis-bullmq), and the [persistence specification](/specifications/core-and-persistence).
