---
title: MCP
description: Connect external MCP servers or expose a Forge deployment through MCP.
---

# MCP

Forge can import tools from an outbound Model Context Protocol server and can expose a configured deployment to MCP clients. Imported tools remain subject to Forge authorization and effect classification; connecting a server does not grant a model unrestricted access.

Outbound connections support `stdio`, `streamable-http`, and `sse`; credentials are references, never prompt content. Unclassified remote tools default to `external-write`, so an untrusted server cannot claim its way to read access. Inbound MCP exposes local registered tools through the ordinary registry, using an authenticated `ExecutionContext`.

| Choose | When |
|---|---|
| Native integration | Forge ships a maintained provider package with known effects and vendor behavior. |
| MCP | A tenant needs tools from an external MCP server or you expose your own registry to MCP clients. |

Next: [Tools](../concepts/tools), [Integrations](../integrations/overview), and the [MCP specification](/specifications/mcp-integration).

Use [Expose this deployment over MCP](../integrations/mcp-server) for the server-facing integration. The deeper decisions are in the [MCP specification](/specifications/mcp-integration).
