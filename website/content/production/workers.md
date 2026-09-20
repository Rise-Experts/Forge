---
title: Workers
---
# Workers

A worker executes queued runs. It claims work, drives the agent runtime, appends durable events, and releases capacity when a run pauses or finishes.

Scale workers horizontally when provider latency or queue depth grows. Forge serializes work per conversation and uses durable claims/checkpoints so a crash can be recovered without replaying an already-recorded external write. External and destructive effects require idempotency keys.

Set `FORGE_WORKER_CONCURRENCY` to control per-worker parallelism. Run workers separately from API hosts in production; stop accepting new work before shutdown and let in-flight claims be recovered if a process exits unexpectedly.

Next: [Redis and BullMQ](redis-bullmq), [Streaming](streaming), and [durable runtime](../concepts/durable-runtime).
