/**
 * The service's own guarantees — REQ-044 (#201).
 *
 * Everything here runs without a database, deliberately: the properties under test are about *composition* —
 * what refuses to start, what closes on shutdown, what a probe reports — and a test that needed Postgres to
 * check "this refuses to start without an authenticator" would be a test nobody runs.
 */

import { describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { DevAuthNotEnabled, PRINCIPAL_HEADER, ROLES_HEADER, TENANT_HEADER, createDevAuthenticate } from "../auth/dev-auth.js";
import { HealthController } from "../health/health.controller.js";
import { ForgeConnections } from "../forge/forge.module.js";
import { FORGE_POOL, FORGE_PROBES, FORGE_REDIS } from "../forge/tokens.js";
import { loadServiceConfig } from "../forge/config.js";

describe("authentication has no default", () => {
  it("refuses to build without the acknowledgement", () => {
    // A service that starts with a permissive fallback serves an open API to whoever forgot to configure one.
    // Refusing at construction means one clear message at boot, not a 401 per request and a guess.
    expect(() => createDevAuthenticate({})).toThrow(DevAuthNotEnabled);
    expect(() => createDevAuthenticate({ FORGE_DEV_AUTH: "0" })).toThrow(DevAuthNotEnabled);
    expect(() => createDevAuthenticate({ FORGE_DEV_AUTH: "true" })).toThrow(DevAuthNotEnabled);
    expect(() => createDevAuthenticate({ RETINUE_DEV_AUTH: "0" })).toThrow(DevAuthNotEnabled);
  });

  it("reads a tenant and a principal, and refuses a request carrying only one", () => {
    const authenticate = createDevAuthenticate({ FORGE_DEV_AUTH: "1" });
    const request = (headers: Record<string, string>) => new Request("http://localhost/graphql", { headers });

    expect(authenticate(request({ [TENANT_HEADER]: "t1", [PRINCIPAL_HEADER]: "p1" }))).toMatchObject({
      tenantId: "t1",
      principalId: "p1",
    });
    // Not "partially authenticated": a tenant with no principal is an unauthenticated request, and treating it
    // otherwise is how a principal-scoped store ends up keyed on undefined.
    expect(authenticate(request({ [TENANT_HEADER]: "t1" }))).toBeNull();
    expect(authenticate(request({ [PRINCIPAL_HEADER]: "p1" }))).toBeNull();
    expect(authenticate(request({}))).toBeNull();
    // Whitespace is not an identity.
    expect(authenticate(request({ [TENANT_HEADER]: "  ", [PRINCIPAL_HEADER]: "p1" }))).toBeNull();
  });

  it("splits roles, and gives none where none were sent", async () => {
    const authenticate = createDevAuthenticate({ FORGE_DEV_AUTH: "1" });
    const headers = { [TENANT_HEADER]: "t1", [PRINCIPAL_HEADER]: "p1", [ROLES_HEADER]: "editor, viewer ,," };
    expect((await authenticate(new Request("http://localhost/", { headers })))?.roleIds).toEqual(["editor", "viewer"]);
    expect(
      (await authenticate(new Request("http://localhost/", { headers: { [TENANT_HEADER]: "t", [PRINCIPAL_HEADER]: "p" } })))
        ?.roleIds,
    ).toEqual([]);
  });

  it("gives each request its own id", async () => {
    const authenticate = createDevAuthenticate({ FORGE_DEV_AUTH: "1" });
    const headers = { [TENANT_HEADER]: "t1", [PRINCIPAL_HEADER]: "p1" };
    const first = (await authenticate(new Request("http://localhost/", { headers })))?.requestId;
    const second = (await authenticate(new Request("http://localhost/", { headers })))?.requestId;
    // A repeating request id makes two requests indistinguishable in a trace — and a module-level counter is
    // how #166's duplicate primary key happened.
    expect(first).not.toBe(second);
  });
});

describe("configuration", () => {
  const base = {
    FORGE_DATABASE_URL: "postgres://user@localhost:5432/db",
    FORGE_REDIS_URL: "redis://localhost:6379",
  };

  it("folds the schema into the connection string", () => {
    // The platform builds its pool from `databaseUrl` alone and cannot be told about a schema separately, so a
    // deployment whose tables are not in the default schema has to carry it in the URL.
    const config = loadServiceConfig({ ...base, FORGE_SCHEMA: "app" });
    expect(config.databaseUrl).toContain("search_path%3Dapp%2Cpublic");
    expect(config.schema).toBe("app");
  });

  it("leaves an explicit options parameter alone", () => {
    // An operator who wrote their own `options` was being specific. Overwriting it is this service quietly
    // disagreeing with them.
    const url = "postgres://user@localhost:5432/db?options=-c%20statement_timeout%3D5000";
    const config = loadServiceConfig({ ...base, FORGE_DATABASE_URL: url, FORGE_SCHEMA: "app" });
    expect(config.databaseUrl).toContain("statement_timeout");
    expect(config.databaseUrl).not.toContain("search_path");
  });

  it("changes nothing when no schema is named", () => {
    expect(loadServiceConfig(base).databaseUrl).toBe(base.FORGE_DATABASE_URL);
  });
});

describe("readiness", () => {
  const controllerWith = async (probes: readonly { name: string; check(): Promise<void> }[]) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: FORGE_PROBES, useValue: probes }],
    }).compile();
    return moduleRef.get(HealthController);
  };

  const response = () => {
    const state: { code?: number; body?: unknown } = {};
    return {
      state,
      res: {
        status(code: number) {
          state.code = code;
          return this;
        },
        json(body: unknown) {
          state.body = body;
        },
      } as never,
    };
  };

  it("is 200 with every probe passing", async () => {
    const controller = await controllerWith([{ name: "postgres", check: async () => undefined }]);
    const { state, res } = response();
    await controller.readiness(res);
    expect(state.code).toBe(200);
    expect(state.body).toMatchObject({ status: "ready" });
  });

  it("is 503 and names every failing probe, not just the first", async () => {
    const controller = await controllerWith([
      { name: "postgres", check: async () => undefined },
      { name: "schema", check: async () => { throw new Error("schema at version 0, expected 25"); } },
      { name: "redis", check: async () => { throw new Error("ECONNREFUSED"); } },
    ]);
    const { state, res } = response();
    await controller.readiness(res);
    expect(state.code).toBe(503);
    // Every probe runs even after one fails: "postgres down" plus "redis down" is a different incident from
    // either alone, and an operator wants the whole picture.
    const probes = (state.body as { probes: { name: string; ok: boolean; error?: string }[] }).probes;
    expect(probes.filter((p) => !p.ok).map((p) => p.name)).toEqual(["schema", "redis"]);
    expect(probes.find((p) => p.name === "schema")?.error).toContain("expected 25");
  });

  it("keeps liveness answering while everything else is failing", async () => {
    const controller = await controllerWith([
      { name: "postgres", check: async () => { throw new Error("down"); } },
    ]);
    // 200 even while the database is down. Restarting a process because a dependency is unavailable turns a
    // blip into a restart storm, and the restarted process still cannot reach the database.
    expect(controller.liveness()).toEqual({ status: "ok" });
  });
});

describe("shutdown", () => {
  it("closes the pool and Redis", async () => {
    const pool = { end: vi.fn(async () => undefined) };
    const redis = { quit: vi.fn(async () => "OK") };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForgeConnections,
        { provide: FORGE_POOL, useValue: pool },
        { provide: FORGE_REDIS, useValue: redis },
      ],
    }).compile();

    await moduleRef.get(ForgeConnections).onApplicationShutdown("SIGTERM");

    // A pool that outlives its process is a service that fails its *next* deploy: the new instance cannot get
    // the connections the old one still holds, and the error arrives minutes later as a connection limit.
    expect(pool.end).toHaveBeenCalledOnce();
    expect(redis.quit).toHaveBeenCalledOnce();
  });

  it("still closes the pool when Redis is already gone", async () => {
    const pool = { end: vi.fn(async () => undefined) };
    const redis = { quit: vi.fn(async () => { throw new Error("connection is closed"); }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForgeConnections,
        { provide: FORGE_POOL, useValue: pool },
        { provide: FORGE_REDIS, useValue: redis },
      ],
    }).compile();

    // `allSettled`, not `all`: with `all` a Redis that has already dropped would reject first and leave the
    // pool open — the failure mode this test exists for.
    await expect(moduleRef.get(ForgeConnections).onApplicationShutdown("SIGTERM")).resolves.toBeUndefined();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});
