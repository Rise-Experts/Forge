---
slug: overview
sidebar_position: 1
---

# Welcome to Retinue

Build, run, and operate durable agent platforms in TypeScript.

Retinue is a provider-neutral SDK for applications that need more than a one-off model call. Define
agents and flows, attach typed tools and context, then run them through an embedded library or a
durable server runtime.

## Choose the right primitive

| Primitive | Use it when | Retinue handles |
|---|---|---|
| **Agent** | One model-driven program can own the task | Context assembly, model calls, tool execution, session state, memory, and guardrails |
| **Flow** | The work needs fixed steps, recovery, or explicit approvals | Queuing, checkpoints, retries, resumable streaming, and idempotent external writes |
| **Tool** | An agent needs a capability outside the model | Typed inputs, authorization, validation, effect classification, and approval policy |

Start with an agent. Add a tool when it needs to act or retrieve information. Use a flow when the
process needs repeatable, durable control.

## What you can add

| Capability | What it adds |
|---|---|
| **Memory and sessions** | Conversation history plus user and tenant facts, assembled within a context budget |
| **Knowledge and retrieval** | Permission-aware search with exact source citations |
| **Human-in-the-loop** | A durable approval gate before an external action executes |
| **Guardrails** | Input, context, and output controls for model-facing data |
| **Integrations** | Optional tool packages for GitHub, Slack, search, and other external services |
| **Operations** | Worker processes, queues, persistence adapters, tracing, usage, and cost accounting |

## Find your way by what you are trying to do

Nobody arrives at documentation wanting section four. Start from the question:

| What you want | Where to go |
|---|---|
| Get something running in five minutes | **[Installation](getting-started/installation)** → **[Quick start](getting-started/quick-start)** |
| Let the agent *do* something, not just talk | **[Your first tool](getting-started/first-tool)** |
| Stop it doing something irreversible without a human | **[Human-in-the-loop](concepts/human-in-the-loop)**, and `confirms()` in **[Your first tool](getting-started/first-tool)** |
| Stop it saying something, or seeing something | **[Guardrails](concepts/guardrails)** |
| Have it remember a person between conversations | **[Persistent memory](guides/persistent-memory)** → **[Memory](concepts/memory)** |
| Answer from my documents, with citations | **[Retrieval](concepts/retrieval)** |
| Connect GitHub, Slack, or web search | **[Integrations](integrations/overview)** |
| Run a multi-step process that survives a restart | **[Your first flow](getting-started/first-flow)** → **[Durable runtime](concepts/durable-runtime)** |
| Serve many users, with a queue and a database | **[Configuration](getting-started/configuration)** |
| Know what a turn cost | **[Usage and accounting](/specifications/usage-and-accounting)** |
| Build the UI | **[Frontend](concepts/frontend)** |
| Understand why something behaves as it does | **[Specifications](/specifications/)** — the design decisions and what was rejected |
| Look up a type or a function | **[API reference](/api/)** — generated from the source |

## How the docs are organized

| Section | For |
|---|---|
| **Getting Started** | Install → first agent → first tool → first flow. Every sample on these pages is typechecked against the published package on every build |
| **Build** | Agent manifests, tools, and the practical guides for composing them |
| **Context & Knowledge** | Memory, sessions, and retrieval |
| **Safety & Operations** | Durable execution, approval gates, guardrails, frontend integration, and deployment configuration |
| **Integrations** | The shipped toolkits, all on one page template |
| **Examples** | Copy-paste starting points |
| **[API Reference](/api/)** | Generated from the TypeScript types |
| **[Specifications](/specifications/)** | The internal design specs — decisions, reasoning, and rejected alternatives |

:::note Status
Retinue is under active development. Concept docs describe the settled design; code examples
show the intended public API as it comes online.
:::
