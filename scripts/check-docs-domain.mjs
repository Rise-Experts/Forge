#!/usr/bin/env node
/**
 * The documentation site is on the hostname it says it is — REQ-035 (#184), SPEC #203.
 *
 * The site claims `docs.retinue.riseexperts.de`. It has had four hostnames — `agentkit.rise-experts.dev`,
 * `docs.agentkit.riseexperts.de`, `docs.forge.riseexperts.de` and now this one — and the three it left are
 * retired: DNS removed, nothing answering, no redirect. Moving it is a cutover with a live site on the other
 * end — a DNS record, a custom domain, and only then a rebuild — and the parts needing the Cloudflare account
 * cannot be done from this repository at all. So what this repository owns is the *verification*.
 *
 * ## Why the config is the single source of truth
 *
 * `website/docusaurus.config.ts`'s `url` is baked into every built page's canonical link, its `og:url` and every
 * entry of `sitemap.xml`. So the check does not take the target hostname as an argument — it reads what the site
 * *claims to be*, and holds reality to it. A hostname passed on the command line would be a second place the
 * answer lives, which is the shape this repository keeps finding defects in.
 *
 * ## There is deliberately no redirect assertion
 *
 * There was one, against a single `LEGACY_URL`. See `RETIRED_HOSTS` for why it went: it named a host two moves
 * behind, and the records were removed rather than left redirecting, so it could only ever be red. The cost is
 * real and worth stating once — **deep links to any retired host are dead and stay dead.**
 *
 * ## What it asserts
 *
 * 1. The intended host serves the site, and the config does not name a host we have retired.
 * 2. Both wrangler configs deploy to one Worker name, and attach the claimed hostname as a **custom domain**.
 * 3. `sitemap.xml` and the canonical/`og:url` tags name the intended host and none of the retired ones.
 * 4. The *built output on disk* agrees with the config — the offline half.
 *
 * Usage: node scripts/check-docs-domain.mjs [--offline]
 * Exit codes: 0 holds, 1 a violation, 2 the check could not tell.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = "website/docusaurus.config.ts";
const BUILD = "website/build";

/**
 * Two copies of one Worker name, which is the pair that drifts.
 *
 * Checked because it *had* drifted from reality: both said `agentkit-docs` and no Worker by that name existed —
 * the site is served by `agentkit`, redeployed by Cloudflare's Git integration on every push. The documented
 * `npx wrangler deploy` would therefore have created a third Worker and published the site to it: the deploy
 * succeeds, and what is deployed is not what is served. Nothing local could have noticed, because the name is
 * only wrong in comparison with an account this check cannot see. What it *can* see is the two files agreeing,
 * which is the half that catches the next drift.
 */
const WRANGLER = ["wrangler.jsonc", "website/wrangler.jsonc"];

/**
 * Every host the site *was* served from. All of them are **retired** — no DNS, nothing answering.
 *
 * This was a single `LEGACY_URL` asserting that one host still answered **301** to the same path. Two things
 * went wrong with it. The site moved twice more after it was written and the constant was not updated either
 * time, so it named a host two moves behind — the redirect verified was never the one a reader following a
 * recent link would take. And the records were removed rather than left redirecting, so the assertion could not
 * pass at all. A check that can only ever be red is one people learn to skip, and then it is not there on the
 * day it matters.
 *
 * What the list is still for is staleness — a canonical link, an `og:url` or a sitemap entry naming one of these
 * means the build predates the config. It is the whole set rather than the most recent, because a stale artefact
 * can name any of them.
 *
 * Restoring a redirect is a Cloudflare change, not a change here. `redirectVerdict` below is kept as the
 * standard to hold one to, and because it encodes the three ways a redirect goes wrong while looking right.
 */
export const RETIRED_HOSTS = [
  "https://agentkit.rise-experts.dev",
  "https://docs.agentkit.riseexperts.de",
  "https://docs.forge.riseexperts.de",
];

/** The Worker name a wrangler config declares. */
export const wranglerName = (source) => {
  const match = /^\s*"name":\s*"([^"]+)"/m.exec(source);
  return match ? match[1] : null;
};

/**
 * The hostnames a wrangler config attaches as **custom domains**.
 *
 * Only `custom_domain: true` entries count, and the distinction is the whole point. A plain route matches
 * traffic for a hostname that must already resolve and already have a certificate; a custom domain *creates*
 * the DNS record and provisions an Advanced Certificate for the exact hostname. For a second-level subdomain
 * like `docs.retinue.riseexperts.de` — which Cloudflare's universal certificate does not cover — a route leaves
 * the site answering over plain HTTP and failing the TLS handshake. That is not a hypothetical: it is what the
 * hostname did for several hours on 27 Aug 2026.
 */
export const customDomains = (source) => {
  const out = [];
  // Tolerant of key order and of formatting, because a jsonc file is hand-edited and a stricter parse would
  // silently find nothing — which here means silently reporting no problem.
  for (const [, block] of source.matchAll(/\{([^{}]*)\}/g)) {
    if (!/"custom_domain"\s*:\s*true/.test(block)) continue;
    const pattern = /"pattern"\s*:\s*"([^"]+)"/.exec(block);
    if (pattern) out.push(pattern[1]);
  }
  return out;
};

/** The `url` the site claims. Parsed rather than imported, because the config is TypeScript with plugins. */
export const configuredUrl = (source) => {
  const match = /^\s*url:\s*"([^"]+)"/m.exec(source);
  return match ? match[1].replace(/\/$/, "") : null;
};

/** The first non-root path in a sitemap, so the deep-link check uses a page that actually exists. */
export const deepPathFrom = (xml, origin) => {
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!loc.startsWith(origin)) continue;
    const path = loc.slice(origin.length);
    if (path.length > 1) return path;
  }
  return null;
};

/**
 * Whether the legacy host's answer is the redirect the cutover promised.
 *
 * Three separate ways this goes wrong, and only one of them looks wrong: a 302 (which tells caches and search
 * engines the move is temporary), a redirect to the *root* (which loses every deep link in existence, and passes
 * any check that asks only "did it redirect"), and a redirect to the wrong host.
 */
export const redirectVerdict = ({ status, location }, { intended, path }) => {
  if (status !== 301) {
    return status >= 300 && status < 400
      ? `answered ${status} rather than 301 — a temporary redirect tells caches and search engines the move is not real`
      : `answered ${status}, not a redirect`;
  }
  if (!location) return "answered 301 with no location header";
  const expected = `${intended}${path}`;
  if (location.replace(/\/$/, "") === intended) {
    return `redirects to the root, losing the path ${path} — every deep link that exists today points at a path`;
  }
  if (location !== expected) return `redirects to ${location}, expected ${expected}`;
  return null;
};

/**
 * The path a host actually serves, after one hop of its own normalisation.
 *
 * The normalising redirect's `location` is **relative** (`/search/`) — found by checking, after a first version
 * that only handled an absolute one and silently kept the unnormalised path. Both forms are accepted; anything
 * pointing off-origin is not a normalisation and is left alone.
 */
export const settledPath = (path, { status, location }, origin) => {
  if (status < 300 || status >= 400 || !location) return path;
  if (location.startsWith("/")) return location;
  if (location.startsWith(origin)) return location.slice(origin.length);
  return path;
};

/** Absolute origins on our own domain that a document mentions, so a stale canonical is visible. */
export const originsIn = (text) =>
  new Set([...text.matchAll(/https:\/\/[a-z0-9.-]*riseexperts\.de/g)].map((match) => match[0]));

const die = (message, detail) => {
  console.error(`✗ ${message}`);
  if (detail) console.error(detail.replace(/^/gm, "  "));
  process.exit(2);
};

const main = async () => {
  if (!existsSync(CONFIG)) die(`cannot read ${CONFIG}`);
  const intended = configuredUrl(readFileSync(CONFIG, "utf8"));
  if (!intended) {
    die(
      `no \`url:\` in ${CONFIG}`,
      "the config is this check's only source of truth for the hostname; without it there is nothing to hold\n" +
        "reality to, and passing would mean reporting success having checked nothing",
    );
  }

  const problems = [];
  // The config naming a host we have retired is a misconfiguration, not a "not cut over yet" state: those
  // hosts have no DNS, so the site would claim an address nothing can serve.
  if (RETIRED_HOSTS.includes(intended)) {
    problems.push(`${CONFIG} claims ${intended}, which is retired and has no DNS — the site would serve nowhere`);
  }

  // ── the deploy target: one name, in two files ─────────────────────────────────────────────────────────────
  const names = WRANGLER.map((path) => (existsSync(path) ? wranglerName(readFileSync(path, "utf8")) : null));
  if (names.some((name) => name === null)) {
    problems.push(`a wrangler config is missing or declares no \`name\`: ${WRANGLER.join(", ")}`);
  } else if (names[0] !== names[1]) {
    problems.push(
      `${WRANGLER[0]} deploys to "${names[0]}" and ${WRANGLER[1]} to "${names[1]}" — one of them publishes the` +
        ` site to a Worker nobody serves from, and the deploy succeeds either way`,
    );
  }

  /**
   * ── the hostname is actually attached ──────────────────────────────────────────────────────────────────────
   *
   * The site's `url` is a claim about where it is served. Nothing made the *deploy* agree with that claim, and
   * on 27 Aug 2026 they disagreed for hours: the config named a hostname that no Worker attached, so the host
   * served a 530 and then stopped resolving. A canonical link pointing at a hostname nothing serves is worse
   * than a wrong one — it looks deliberate.
   */
  const intendedHost = new URL(intended).hostname;
  WRANGLER.forEach((path, at) => {
    if (!existsSync(path)) return;
    const attached = customDomains(readFileSync(path, "utf8"));
    if (attached.length === 0) {
      problems.push(
        `${path} attaches no custom domain, so a deploy from it serves the site nowhere — ` +
          `add { "pattern": "${intendedHost}", "custom_domain": true } to \`routes\``,
      );
    } else if (!attached.includes(intendedHost)) {
      problems.push(
        `${path} attaches ${attached.join(", ")} but the site claims ${intendedHost} — the canonical links point` +
          ` at a hostname this deploy does not serve`,
      );
    }
    void at;
  });

  // ── the offline half: the build on disk agrees with the config ─────────────────────────────────────────────
  const sitemapPath = join(BUILD, "sitemap.xml");
  let sitemap = null;
  if (existsSync(sitemapPath)) {
    sitemap = readFileSync(sitemapPath, "utf8");
    const origins = originsIn(sitemap);
    if (!origins.has(intended)) problems.push(`the built sitemap does not use ${intended} — rebuild the site`);
    for (const retired of RETIRED_HOSTS) {
      if (!origins.has(retired)) continue;
      problems.push(`the built sitemap still contains ${retired}, so the build predates the config change`);
    }
    const indexPath = join(BUILD, "index.html");
    if (existsSync(indexPath)) {
      const origins = originsIn(readFileSync(indexPath, "utf8"));
      for (const retired of RETIRED_HOSTS) {
        if (!origins.has(retired)) continue;
        problems.push(
          `the built home page's canonical/og:url still name ${retired} — a canonical pointing at a host that` +
            ` no longer resolves is worse than a wrong one, because it looks deliberate`,
        );
      }
    }
  } else {
    console.log(`  · no ${sitemapPath}; run \`npm run docs:build\` to include the offline half`);
  }

  if (process.argv.includes("--offline")) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    if (problems.length > 0) return 1;
    console.log(`✓ the built output agrees with ${CONFIG} (${intended})`);
    return 0;
  }

  // ── the network half ──────────────────────────────────────────────────────────────────────────────────────
  const get = async (url) => {
    try {
      const response = await fetch(url, { redirect: "manual" });
      return { status: response.status, location: response.headers.get("location"), response };
    } catch (error) {
      /**
       * The intended host failing to resolve is a *different* problem from a flaky network, and saying "DNS is
       * slow" sends the reader to the wrong place. It is the expected state mid-cutover: the config names the
       * new hostname before anyone has attached it, and nothing here can attach it.
       */
      const detail = url.startsWith(intended)
        ? `${intendedHost} does not resolve. If a cutover is in progress this is expected until the hostname is\n` +
          "attached as a **custom domain** in Cloudflare — a plain route will not provision a certificate for a\n" +
          "second-level subdomain, and the handshake fails instead. That step is not in this repository.\n" +
          "Until then, `--offline` checks the half that does not need the network."
        : "this check needs the network. It is not in `npm test` for that reason — a gate that fails when DNS is\n" +
          "slow is a gate people learn to skip. Use --offline for the half that does not.";
      die(`cannot reach ${url}: ${error.message}`, detail);
    }
  };

  const live = await get(`${intended}/`);
  if (live.status !== 200) problems.push(`${intended}/ answered ${live.status}`);

  const map = await get(`${intended}/sitemap.xml`);
  if (map.status !== 200) {
    problems.push(`${intended}/sitemap.xml answered ${map.status}`);
  } else {
    const origins = originsIn(await map.response.text());
    if (!origins.has(intended)) problems.push(`the served sitemap does not use ${intended}`);
    for (const retired of RETIRED_HOSTS) {
      if (origins.has(retired)) problems.push(`the served sitemap still contains ${retired}`);
    }
  }

  const home = await get(`${intended}/`);
  if (home.status === 200) {
    const origins = originsIn(await home.response.text());
    for (const retired of RETIRED_HOSTS) {
      if (!origins.has(retired)) continue;
      problems.push(`the served home page still names ${retired} in its canonical or og:url`);
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    console.error(`\n  ${problems.length} problem(s). See #203 for the order these steps have to happen in.`);
    return 1;
  }

  console.log(
    `✓ ${intended} serves the site, and the sitemap and canonical tags name it and none of the` +
      ` ${RETIRED_HOSTS.length} retired hosts`,
  );
  return 0;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(await main());
