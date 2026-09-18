import { createRuntime } from "@retinue/agentkit";
import type { Runtime } from "@retinue/agentkit";

// Server deployments compose this public runtime factory with persistent adapters.
// The exact adapter wiring belongs in the server/runtime guide because it depends on
// the host's PostgreSQL, Redis, worker, and credential configuration.
export const runtimeFactory: typeof createRuntime = createRuntime;
export type ServerRuntime = Runtime;
