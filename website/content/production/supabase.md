---
title: Supabase
---
# Supabase

Forge's Supabase adapter uses the PostgreSQL persistence contracts with Supabase row-level security. Use it when Supabase is already your managed Postgres environment and you want database-enforced tenant boundaries.

Use the normal database URL and schema/migration flow. A service role is infrastructure authority, not an end-user identity: the application must still construct an `ExecutionContext` for the authenticated tenant and principal.

| Choose | When |
|---|---|
| PostgreSQL | You manage a standard PostgreSQL deployment or need direct database control. |
| Supabase | You use Supabase Postgres and want its RLS deployment model. |

The adapter is not a separate runtime; it implements the same stores. See [PostgreSQL](postgres) and the [authorization specification](/specifications/authorization).
