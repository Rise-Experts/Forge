import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const primitives = [
  {
    title: "Agents",
    body: "Declare instructions, model policy, tools, skills, and limits in a versioned manifest. Forge builds context, invokes tools, and records each run.",
    to: "/docs/concepts/agents",
  },
  {
    title: "Flows",
    body: "Build repeatable, durable multi-step processes. Runs checkpoint, resume after failures, and never repeat an approved external write.",
    to: "/docs/getting-started/first-flow",
  },
  {
    title: "Tools",
    body: "Give agents typed capabilities with authorization, validation, idempotency, and approval policy applied at execution time.",
    to: "/docs/concepts/tools",
  },
];

const capabilities = [
  {
    title: "Memory & sessions",
    body: "Carry conversation state forward and retain user facts under an explicit context budget.",
    to: "/docs/concepts/memory",
  },
  {
    title: "Knowledge & retrieval",
    body: "Ground answers in permission-aware sources with cited retrieval results.",
    to: "/docs/concepts/retrieval",
  },
  {
    title: "Safety & approval",
    body: "Pause external actions for a human decision and apply guardrails before data reaches a model.",
    to: "/docs/concepts/human-in-the-loop",
  },
  {
    title: "Durable runtime",
    body: "Run work through queues, checkpoints, recovery, and resumable streaming across worker processes.",
    to: "/docs/concepts/durable-runtime",
  },
  {
    title: "Integrations",
    body: "Connect provider-backed tools for GitHub, Slack, search, and other services without coupling the runtime to them.",
    to: "/docs/integrations/overview",
  },
  {
    title: "API reference",
    body: "Look up the generated public TypeScript surface when you need an exact type or method.",
    to: "/api/",
  },
];

const integrations = ["GitHub", "Google", "Slack", "Jira", "Linear", "Notion", "Discord", "Telegram", "Meta", "Azure", "Email", "Web search"];

const startHere = [
  {
    title: "Build your first agent",
    body: "Install the SDK, define an agent, and run a conversation locally.",
    to: "/docs/getting-started/quick-start",
  },
  {
    title: "Give an agent a tool",
    body: "Add a typed read or approval-gated external action.",
    to: "/docs/getting-started/first-tool",
  },
  {
    title: "Run it in production",
    body: "Configure persistence, queues, workers, and the API host.",
    to: "/docs/getting-started/configuration",
  },
];

export default function Home(): JSX.Element {
  return (
    <Layout title="Build durable agent platforms" description="The Forge TypeScript SDK for durable agents, flows, tools, and production operations.">
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>FORGE SDK</p>
          <h1 className={styles.heroTitle}>Build durable agent platforms.</h1>
          <p className={styles.heroSubtitle}>
            A TypeScript SDK for building agents and flows with safe tools, persistent context,
            and a runtime designed to recover from real-world failures.
          </p>
          <div className={styles.heroButtons}>
            <Link className={styles.buttonPrimary} to="/docs/getting-started/quick-start">
              Build your first agent
            </Link>
            <Link className={styles.buttonSecondary} to="/api/">
              API reference
            </Link>
          </div>
          <div className={styles.install} aria-label="Install Forge AgentKit">
            <code>npm install @forge/agentkit @ai-sdk/anthropic</code>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.section}>
          <h2>Start here</h2>
          <div className={styles.grid}>
            {startHere.map((item) => <Card key={item.title} {...item} />)}
          </div>
        </section>
        <section className={styles.section}>
          <h2>Core primitives</h2>
          <p className={styles.sectionIntro}>Start with one agent. Add tools, then use a flow when the process needs explicit, recoverable steps.</p>
          <div className={styles.grid}>
            {primitives.map((item) => <Card key={item.title} {...item} />)}
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.twoColumn}>
            <div>
              <h2>Your first agent</h2>
              <p className={styles.sectionIntro}>The embedded path runs in one process with in-memory adapters—ideal for learning, scripts, and tests.</p>
              <Link className={styles.inlineLink} to="/docs/getting-started/quick-start">Read the five-minute quickstart →</Link>
            </div>
            <pre className={styles.exampleCode}><code>{`import { createAgent } from "@forge/agentkit/providers";

const agent = createAgent({
  manifest: {
    id: "assistant",
    name: "Assistant",
    instructions: "Be helpful and concise.",
    modelPolicy: { role: "smart" },
  },
});

const result = await agent.run({
  conversationId: "welcome",
  message: "What can you help me with?",
});

console.log(result.text);`}</code></pre>
          </div>
        </section>
        <section className={styles.section}>
          <h2>Build for production</h2>
          <div className={styles.grid}>
            {capabilities.map((item) => <Card key={item.title} {...item} />)}
          </div>
        </section>
        <section className={styles.section}>
          <h2>Choose how to run Forge</h2>
          <div className={styles.grid}>
            <Link className={styles.card} to="/docs/getting-started/quick-start">
              <h3 className={styles.cardTitle}>Embedded</h3>
              <p className={styles.cardBody}>A batteries-included agent facade with in-memory reference adapters. Start here for a first working agent.</p>
              <span className={styles.cardLink}>Start embedded →</span>
            </Link>
            <Link className={styles.card} to="/docs/production/overview">
              <h3 className={styles.cardTitle}>Server</h3>
              <p className={styles.cardBody}>Run durable work across an API host and workers with PostgreSQL/Supabase, Redis/BullMQ, GraphQL, and SSE.</p>
              <span className={styles.cardLink}>Run in production →</span>
            </Link>
          </div>
        </section>
        <section className={styles.section}>
          <h2>Connect the services your work uses</h2>
          <p className={styles.sectionIntro}>Install only the optional integration packages your application needs. Every integration enters through the same authorization and effect-gating path as a custom tool.</p>
          <div className={styles.integrationList}>
            {integrations.map((name) => <span key={name}>{name}</span>)}
          </div>
          <Link className={styles.inlineLink} to="/docs/integrations/overview">Browse all integrations →</Link>
        </section>
        <section className={styles.finalCta}>
          <h2>Ready to build?</h2>
          <p>Start with one embedded agent, then add the capabilities your application needs.</p>
          <Link className={styles.buttonPrimary} to="/docs/getting-started/quick-start">Read the quickstart</Link>
        </section>
      </main>
    </Layout>
  );
}

function Card({ title, body, to }: { title: string; body: string; to: string }): JSX.Element {
  return <Link className={styles.card} to={to}>
    <h3 className={styles.cardTitle}>{title}</h3>
    <p className={styles.cardBody}>{body}</p>
    <span className={styles.cardLink}>Explore →</span>
  </Link>;
}
