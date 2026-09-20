import { confirms } from "@forge/agentkit/tools";

// confirms() fixes effect, approval policy, and idempotency together.
export const sendMessage = confirms({
  name: "send_message",
  label: "Send message",
  description: "Send an approved message to a customer.",
  category: "messaging",
  inputSchema: {
    type: "object",
    properties: { recipient: { type: "string" }, text: { type: "string" } },
    required: ["recipient", "text"],
  },
  execute: async (input: { recipient: string; text: string }) => ({ queuedFor: input.recipient }),
});
