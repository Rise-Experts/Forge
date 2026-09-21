import { createAgent } from "@retinue/agentkit/providers";

// Mirrors Getting started → Quickstart. A model provider is selected by the
// runtime configuration; this declaration remains provider-neutral.
export const helloAgent = createAgent({
  manifest: {
    id: "hello-agent",
    name: "Hello agent",
    instructions: "Answer clearly and briefly.",
    modelPolicy: { role: "smart" },
  },
});

export const hello = () => helloAgent.run({ conversationId: "getting-started", message: "Hello, Forge." });
