import { createPrincipalMemoryProvider } from "@forge/agentkit/context";
import { createMemoryPrincipalMemoryStore } from "@forge/agentkit/persistence";
import { createAgent } from "@forge/agentkit/providers";

const store = createMemoryPrincipalMemoryStore();
const memory = createPrincipalMemoryProvider({ store, maxEntries: 8 });

export const memoryAgent = createAgent({
  manifest: {
    id: "memory-agent",
    name: "Memory agent",
    instructions: "Use relevant saved preferences when they are present.",
    modelPolicy: { role: "smart" },
  },
  contextProviders: [memory],
});
