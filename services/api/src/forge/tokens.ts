/**
 * Injection tokens — REQ-044 (#201).
 *
 * Symbols rather than strings, so two modules cannot collide on a token by choosing the same name, and rather
 * than classes, because everything the platform provides is a structural type built by a factory. There is no
 * `PostgresRunStore` class to inject; there is a `RunStore` that some adapter returns.
 */

export const FORGE_CONFIG = Symbol("FORGE_CONFIG");
export const FORGE_SQL = Symbol("FORGE_SQL");
export const FORGE_POOL = Symbol("FORGE_POOL");
export const FORGE_REDIS = Symbol("FORGE_REDIS");
export const FORGE_STORES = Symbol("FORGE_STORES");
export const FORGE_ENGINE = Symbol("FORGE_ENGINE");
export const FORGE_REGISTRY = Symbol("FORGE_REGISTRY");
export const FORGE_RESOLVER_DEPS = Symbol("FORGE_RESOLVER_DEPS");
export const FORGE_PROBES = Symbol("FORGE_PROBES");
export const FORGE_MESSAGES = Symbol("FORGE_MESSAGES");
export const FORGE_AGENT = Symbol("FORGE_AGENT");

/**
 * How a request becomes an `ExecutionContext`.
 *
 * **No default, deliberately** — the same rule as `ForgeApp.authenticate`. A permissive fallback would serve
 * an open API to anyone who forgot to provide one, and a service that refuses to start is a much better failure
 * than one that starts and trusts everybody. `ForgeModule.forRoot` requires it, so "forgot to provide one" is
 * a type error rather than a security incident.
 */
export const FORGE_AUTHENTICATE = Symbol("FORGE_AUTHENTICATE");

// Deprecated aliases for backwards compatibility
export const RETINUE_CONFIG = FORGE_CONFIG;
export const RETINUE_SQL = FORGE_SQL;
export const RETINUE_POOL = FORGE_POOL;
export const RETINUE_REDIS = FORGE_REDIS;
export const RETINUE_STORES = FORGE_STORES;
export const RETINUE_ENGINE = FORGE_ENGINE;
export const RETINUE_REGISTRY = FORGE_REGISTRY;
export const RETINUE_RESOLVER_DEPS = FORGE_RESOLVER_DEPS;
export const RETINUE_PROBES = FORGE_PROBES;
export const RETINUE_MESSAGES = FORGE_MESSAGES;
export const RETINUE_AGENT = FORGE_AGENT;
export const RETINUE_AUTHENTICATE = FORGE_AUTHENTICATE;
