# Forge documentation site

Docusaurus site that renders **everything we build**:
- the narrative specs (`../docs/01–30` + `../docs/extraction`) — auto sidebar, mermaid, versioning-ready;
- the **API reference** auto-generated from the `@forge/*` TypeScript types (TypeDoc → `/api`);
- `llms.txt` + `llms-full.txt` for AI editors and a docs MCP server.

Standalone app — **not** an npm workspace member, so it never affects package typecheck/boundaries.

## Develop
```bash
cd website
npm install
npm run docs:api     # generate the TypeDoc API reference into ./api
npm start            # dev server (also runs specs)
npm run build        # prebuild regenerates api + llms.txt, then docusaurus build
```

## AI search
The theme is ready for an AI answer/search widget. Add one at deploy via env — supported options:
- **kapa.ai** or **Inkeep** (AI answers over the docs), or **Algolia DocSearch/AskAI** (index + AI).
Wire the widget in `docusaurus.config.ts` `themeConfig` and pass keys via environment variables;
no keys are committed.

## MCP for code editors
`npm run docs:llms` writes `static/llms.txt` (index) and `static/llms-full.txt` (whole corpus),
served at `/llms.txt` and `/llms-full.txt`. Editors that read `llms.txt` (Cursor, Claude Code)
can consume these directly. A docs **MCP server** can serve the same corpus:
- **Hosted:** Inkeep/kapa expose an MCP endpoint from the indexed docs.
- **Self-hosted:** a small MCP server that returns sections of `llms-full.txt` by query.

## Deployment (Cloudflare Workers Static Assets → docs.forge.riseexperts.de)

The checked-in configuration targets the `forge-docs` Worker at
`https://docs.forge.riseexperts.de`. Keep the Worker name, the configured URL, and the custom domain in
both `wrangler.jsonc` files aligned: a changed Worker name creates a new Worker rather than renaming the old one.

Deployed via **Cloudflare's Git build** (Workers Builds) using `wrangler.jsonc` — no API-token
secret needed, Cloudflare builds from the connected repo on each push. One-time setup — **these
steps need your Cloudflare/DNS access; the config is already in the repo:**

1. In the Cloudflare project (Workers & Pages → your `forge-docs` project) → **Settings →
   Build**, set — these work from the **repo root**, so the "Root directory" setting no longer
   matters (a root `wrangler.jsonc` and `website/wrangler.jsonc` both exist):
   - **Root directory:** leave as repo root (default).
   - **Build command:** `npm run docs:build`
     — installs the site, whose `prebuild` installs the workspace so TypeDoc resolves backend
     deps (`zod`); produces `website/build`.
   - **Deploy command:** `npx wrangler deploy`  ← change from `npx wrangler versions upload`
     (`versions upload` stages a version without publishing to the live URL). From the repo root
     this reads the root `wrangler.jsonc`, whose `assets.directory` is `./website/build`.
2. **Custom domain**: project → **Custom domains** → add **`docs.forge.riseexperts.de`**. It has to be a
   *custom domain* rather than a route: a third-level hostname is not covered by Cloudflare's universal
   certificate, and a custom domain is what provisions one for it. Without that the host serves over plain HTTP
   and fails the TLS handshake.
   - If `riseexperts.de` DNS is **on Cloudflare**, the record is created automatically.
   - Otherwise add a DNS **CNAME**: `docs.forge` → `<worker>.workers.dev` (as shown in the
     Custom domains dialog).

`wrangler.jsonc` declares `assets.directory: ./build`, so `wrangler deploy` uploads the
Docusaurus output as static assets (no Worker script). After setup, pushing docs changes builds
and publishes automatically.

## Known follow-up
- AI search widget (kapa/Inkeep/Algolia AskAI) — wire in `themeConfig`, keys via env at deploy.
- The `onBrokenMarkdownLinks` deprecation warning migrates to `markdown.hooks` in Docusaurus v4.

## Why the API reference covers two packages and not three

`typedoc.json`'s `entryPoints` are `backend` and `frontend`. **`shareflow` was there and was removed**, and
JSON takes no comments, so the reason is here.

This site is public, and TypeDoc published `shareflow`'s whole exported surface under `/api/shareflow/src/` —
404 URLs in the sitemap, every function and type with the docstrings attached. Those docstrings are where the
integration's reasoning lives: ShareFlow's table names, its schema quirks, which platform refuses what. None
of it is a credential and all of it is Chorus's product design, so it is documented in the
`social-integration` repository instead.

The rule this follows: **this site documents the platform, not its consumers.** A second consumer added to
`entryPoints` would publish that consumer's internals the same way, and would do it silently — nothing about
adding a path to a JSON array looks like publishing a customer's design. So
`scripts/check-api-reference.test.mjs` refuses an entry point in any package this repository does not publish,
derived from `private: true` rather than from a name match: a published package's API is public by definition,
so documenting it adds no exposure.
