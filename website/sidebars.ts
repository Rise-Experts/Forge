import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// The public learning path is deliberately separate from the implementation
// specifications at /specifications. Start with a working embedded agent, then
// reveal composition and production concerns as the reader needs them.
const sidebars: SidebarsConfig = {
  docs: [
    "overview",
    {
      type: "category",
      label: "Start Here",
      collapsed: false,
      items: [
        "getting-started/installation",
        "getting-started/quick-start",
        "getting-started/mental-model",
        "getting-started/first-tool",
        "getting-started/first-flow",
        "getting-started/configuration",
        "getting-started/testing",
      ],
    },
    {
      type: "category",
      label: "Build",
      items: [
        "concepts/architecture",
        "concepts/agents",
        "concepts/tools",
        "guides/build-an-agent",
        "guides/tools",
        "build/models",
        "build/flows",
      ],
    },
    {
      type: "category",
      label: "Context & Knowledge",
      items: [
        "context/overview",
        "concepts/memory",
        "concepts/sessions",
        "guides/persistent-memory",
        "concepts/retrieval",
      ],
    },
    {
      type: "category",
      label: "Safety & Operations",
      items: [
        "safety/overview",
        "concepts/durable-runtime",
        "concepts/human-in-the-loop",
        "concepts/guardrails",
        "concepts/frontend",
        "guides/approvals-and-safety",
      ],
    },
    {
      type: "category",
      label: "Integrations",
      items: [
        "integrations/overview",
        "integrations/github",
        "integrations/google",
        "integrations/slack",
        "integrations/jira",
        "integrations/linear",
        "integrations/notion",
        "integrations/confluence",
        "integrations/discord",
        "integrations/telegram",
        "integrations/meta",
        "integrations/x",
        "integrations/reddit",
        "integrations/azure",
        "integrations/email",
        "integrations/web-search",
        "integrations/scrape",
        "integrations/browser",
        "integrations/oauth",
      ],
    },
    {
      type: "category",
      label: "Run in Production",
      items: ["production/overview", "production/postgres", "production/supabase", "production/redis-bullmq", "production/workers", "production/graphql", "production/streaming", "production/observability", "production/deployment"],
    },
    {
      type: "category",
      label: "Frontend",
      items: ["frontend/overview", "concepts/frontend"],
    },
    { type: "category", label: "MCP", items: ["mcp/overview", "integrations/mcp-server"] },
    { type: "category", label: "Examples", items: ["examples/overview", "examples/simple-agent", "examples/persistent-memory"] },
    { type: "category", label: "Reference", items: ["reference/overview", "reference/package-surface", "reference/client-surface"] },
    { type: "category", label: "Operations", items: ["operations/overview", "troubleshooting"] },
    { type: "category", label: "Advanced", items: ["advanced/overview", "concepts/architecture"] },
  ],
};

export default sidebars;
