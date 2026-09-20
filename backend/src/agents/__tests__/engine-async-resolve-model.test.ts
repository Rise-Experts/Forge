/**
 * `resolveModel` may be asynchronous — Rise-Experts/forge#279.
 *
 * The hook takes an `ExecutionContext`, which is what makes per-tenant model resolution expressible at
 * all: a host serving many tenants can give each its own provider and key. It was called synchronously,
 * so that resolution could not involve I/O — and a tenant's provider config lives in a database or a
 * secrets store in every real deployment. The parameter was passed and could not be acted on.
 *
 * ShareFlow hit it head-on (Rise-Experts/social_share#462): a workspace that configured its own provider
 * was served the deployment's model on every conversational turn, silently, with the cost landing on the
 * platform's account. Its workaround — a lazy model that does the lookup inside the AI SDK's own async
 * middleware — routes the call correctly but cannot fix the *record*: `modelId`, `definition` and `price`
 * are all decided before anybody knows which provider will serve the turn, so the usage ledger labels a
 * tenant's tokens with the deployment's model id.
 *
 * These tests assert the two things that make the change worth having: an async resolver is awaited
 * rather than handed to the engine as a promise, and **the whole `ResolvedModelInfo` it returns is used**
 * — which is the half a lazy model cannot reach.
 */
import { describe, expect, it } from "vitest";
import type { ExecutionContext } from "../../core/context.js";
import { asId } from "../../core/ids.js";
import type { AgentId, ConversationId, RunId } from "../../core/ids.js";
import type { ModelDefinition, NeutralStreamChunk, ResolvedModel } from "../../models/index.js";
import type { EngineEvent, Run } from "../../runtime/index.js";
import { createDefaultEngine } from "../engine.js";
import { defineAgent } from "../define.js";

const RUN = asId<RunId>("r1");
const run: Run = {
  id: RUN,
  tenantId: asId("t1"),
  conversationId: asId<ConversationId>("c1"),
  agentId: asId<AgentId>("a1"),
  agentVersion: 1,
  status: "running",
  createdAt: "t",
};
const context: ExecutionContext = {
  tenantId: asId("t1"),
  principalId: asId("p1"),
  roleIds: [],
  locale: "en",
  timezone: "UTC",
  requestId: asId("req1"),
  conversationId: asId<ConversationId>("c1"),
  runId: RUN,
};
const signal = { isCancelled: () => false };

const agent = defineAgent({ id: "a1", name: "A", instructions: "chat", modelPolicy: { role: "smart" } });

const definition = (modelId: string): ModelDefinition => ({
  provider: "anthropic",
  modelId,
  label: modelId,
  lifecycle: "generally-available",
  inputModalities: ["text"],
  capabilities: { tools: true, structuredOutput: false, reasoning: false, nativeSearch: false },
  limits: { contextTokens: 200_000, maxOutputTokens: 8_192 },
  pricing: { currency: "USD", inputPerMillion: 3_000, outputPerMillion: 15_000 },
  dataResidency: ["us"],
});

async function* oneTurn(): AsyncIterable<NeutralStreamChunk> {
  yield { type: "text-delta", id: "t", text: "hello" };
  yield { type: "finish", usage: { inputTokens: 10, outputTokens: 5, cachedInputTokens: 0 } };
}

const baseDeps = (over: Record<string, unknown>) => ({
  loadManifest: async () => agent,
  loadHistory: async () => [{ role: "user" as const, content: "hi" }],
  streamTurn: oneTurn,
  buildTools: async () => [],
  ...over,
});

const collect = async (engine: ReturnType<typeof createDefaultEngine>): Promise<EngineEvent[]> => {
  const out: EngineEvent[] = [];
  for await (const event of engine.run({ run, context, resume: null, signal })) out.push(event);
  return out;
};

describe("an asynchronous resolveModel", () => {
  it("is awaited, so a host can read a tenant's provider from a store", async () => {
    /**
     * The test that would have failed before the change: returning a promise handed the engine a
     * `ResolvedModelInfo` whose every field was `undefined`, so the run died inside the model layer
     * rather than resolving a model.
     */
    let resolvedFor: string | undefined;
    const engine = createDefaultEngine(
      baseDeps({
        resolveModel: async (_manifest: unknown, ctx: ExecutionContext) => {
          // A real host does I/O here. The await is the whole point.
          await Promise.resolve();
          resolvedFor = String(ctx.tenantId);
          return {
            model: {} as ResolvedModel,
            modelId: "tenant-model",
            currency: "USD",
            price: () => 0,
            definition: definition("tenant-model"),
          };
        },
      }) as never,
    );

    const events = await collect(engine);
    expect(resolvedFor, "the resolver never saw the calling tenant").toBe("t1");
    /**
     * The engine emits the turn's own events and leaves run lifecycle to its caller, so "it worked"
     * is a turn that produced content and reported usage — not a `run.completed` this layer never
     * sends.
     */
    expect(events.map((e) => e.type)).toContain("part.added");
    expect(events.map((e) => e.type)).toContain("usage.updated");
  });

  it("uses the modelId the resolver chose, which is the half a lazy model cannot fix", async () => {
    /**
     * The reason this change is worth making rather than working around. A host can already redirect
     * the *call* by returning a lazily-resolving model, but `modelId` is read off the object the hook
     * returned — so the usage row names the deployment's model while a tenant's provider did the work.
     *
     * Measured in production before this: a turn served by `qwen3.8-max` reported
     * `modelId: "gemini-2.5-flash"`.
     */
    const engine = createDefaultEngine(
      baseDeps({
        resolveModel: async () => ({
          model: {} as ResolvedModel,
          modelId: "qwen3.8-max",
          currency: "USD",
          price: () => 0,
          definition: definition("qwen3.8-max"),
        }),
      }) as never,
    );

    const events = await collect(engine);
    const usage = events.find((e) => e.type === "usage.updated") as { modelId?: string } | undefined;
    expect(usage, "no usage event was emitted").toBeDefined();
    expect(usage?.modelId, "the usage row named the deployment's model, not the tenant's").toBe("qwen3.8-max");
  });

  it("still accepts a synchronous resolver unchanged", async () => {
    /**
     * The compatibility guarantee, asserted rather than assumed: every existing host returns a plain
     * object, and `await` on a non-promise yields the value. A change that quietly required a promise
     * would break every caller of a published package.
     */
    const engine = createDefaultEngine(
      baseDeps({
        resolveModel: () => ({
          model: {} as ResolvedModel,
          modelId: "sync-model",
          currency: "USD",
          price: () => 0,
          definition: definition("sync-model"),
        }),
      }) as never,
    );

    const events = await collect(engine);
    expect(events.some((e) => e.type === "run.failed")).toBe(false);
    const usage = events.find((e) => e.type === "usage.updated") as { modelId?: string } | undefined;
    expect(usage?.modelId).toBe("sync-model");
  });

  it("propagates a rejecting resolver rather than swallowing it", async () => {
    /**
     * Async resolution introduces a failure mode synchronous resolution did not have: the store is
     * unreachable. It has to surface with its reason intact, not become a turn that quietly answers on
     * some other model — the silent-fallback defect this whole change exists to end.
     *
     * The engine throws out of the run generator rather than emitting a failure event; run lifecycle
     * belongs to its caller, which catches this and records the failed run. Asserted as a rejection
     * for that reason, and the message has to survive: "the model could not be resolved" with no cause
     * would send somebody looking in the wrong service.
     */
    const engine = createDefaultEngine(
      baseDeps({
        resolveModel: async () => {
          throw new Error("tenant provider store unreachable");
        },
      }) as never,
    );

    await expect(collect(engine), "a rejecting resolver was swallowed").rejects.toThrow(
      /tenant provider store unreachable/,
    );
  });
});
