import { asId } from "@retinue/agentkit";
import type { AgentId, FlowDefinition } from "@retinue/agentkit";

export const outreachFlow: FlowDefinition = {
  id: "lead-outreach",
  version: 1,
  name: "Lead outreach",
  start: "research",
  budget: { maxSteps: 5 },
  steps: [
    {
      name: "research",
      kind: "agent",
      agentId: asId<AgentId>("researcher"),
      prompt: "Research {{company}} and summarize the public information.",
      next: "approval",
    },
    {
      name: "approval",
      kind: "checkpoint",
      question: "Approve the generated outreach?",
      options: ["Approve", "Reject"],
      next: "done",
    },
    { name: "done", kind: "done", outcome: "complete" },
  ],
};
