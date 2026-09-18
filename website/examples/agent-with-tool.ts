import { createAgent } from "@retinue/agentkit/providers";
import { confirms, defineTool } from "@retinue/agentkit/tools";

const inventory = new Map([["SKU-1", { name: "Blue mug", inStock: 14 }]]);

export const checkStock = defineTool({
  name: "check_stock",
  label: "Check stock",
  description: "Look up stock by SKU.",
  category: "inventory",
  effect: "read",
  inputSchema: {
    type: "object",
    properties: { sku: { type: "string" } },
    required: ["sku"],
  },
  execute: async (input: { sku: string }) => inventory.get(input.sku) ?? { error: "Unknown SKU" },
});

export const reorderStock = confirms({
  name: "reorder_stock",
  label: "Reorder stock",
  description: "Place an approved restock order for a SKU and quantity.",
  category: "inventory",
  inputSchema: {
    type: "object",
    properties: { sku: { type: "string" }, quantity: { type: "number" } },
    required: ["sku", "quantity"],
  },
  execute: async (input: { sku: string; quantity: number }) => ({ ordered: input.quantity, sku: input.sku }),
});

export const stockAgent = createAgent({
  manifest: {
    id: "stock-agent",
    name: "Stock agent",
    instructions: "Use the inventory tool before answering stock questions.",
    modelPolicy: { role: "smart" },
  },
  tools: [{ id: "inventory", listTools: async () => [checkStock, reorderStock] }],
});
