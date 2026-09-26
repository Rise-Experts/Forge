import { MCP_TRANSPORTS, classifyMcpTool, mcpToolName } from "@retinue/agentkit/mcp";

export const supportedTransports = MCP_TRANSPORTS;
export const remoteToolName = mcpToolName("docs-server", "search");

// Remote hints do not grant read-only access. Unclassified remote tools default
// to the approval-protected external-write effect.
export const unclassifiedRemoteTool = classifyMcpTool({ readOnlyHint: true });
