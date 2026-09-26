#!/usr/bin/env node
/**
 * No regex alternation may list the same branch twice.
 *
 * `(?:forge|forge)` is an alternation with one branch wearing the costume of two. It matches exactly what
 * `forge` matches, and it is almost never written on purpose — it is what a find-and-replace leaves behind when
 * it rewrites `(?:retinue|forge)` and catches both sides.
 *
 * ## Why this is worth a gate of its own
 *
 * The Forge rebrand produced **six** of these across the repository, and the damage was not that they were
 * wrong — it was the direction they failed in. Five of the six went *quiet* rather than red:
 *
 * - `check-doc-imports.mjs` scanned for imports of a scope nothing used any more, found none, and printed
 *   "✓ 0 documented imports resolve" — a green tick for having checked nothing. It stayed green across a commit
 *   that shipped a documented export which did not exist.
 * - `check-boundaries.mjs` held two of them, in rule **R1** and the frontend/runtime boundary. Both stopped
 *   matching, so both stopped enforcing, and nothing said so.
 * - `check-optional-peers.mjs` held one against the Dockerfile. It kept passing while silently covering
 *   **one entry point instead of two**.
 *
 * Only `release-target.test.mjs` failed loudly, and only because it asserts a floor — `imported.size >= 15`.
 * That is the difference between a check that notices it has gone blind and one that reports success for it.
 *
 * A reviewer will not spot `(?:forge|forge)` in a diff; the two branches are identical, which is exactly what
 * makes it invisible. A machine spots it in milliseconds, which is the whole argument for this file.
 *
 * ## What counts
 *
 * A group whose branches contain a repeat: `(a|a)`, `(?:a|b|a)`, `(?<x>a|a)`. Groups with no `|`, and an empty
 * branch such as `(a|)` — a deliberate "optionally this" — are left alone.
 *
 * Nested groups are skipped rather than guessed at. `([ab]|(c|d))` needs a parser to split correctly, and a
 * check that splits it wrongly reports a violation against correct code, which is how a check gets loosened
 * until it fires on nothing.
 *
 * ## Only inside a regex, which is not a detail
 *
 * The first version scanned every parenthesised run of text containing a `|`, and reported 37 violations
 * against **markdown tables in string literals** — `expect(md).toContain("| Chrome | 69 | Full support |")`.
 * Those pipes are table cells. A gate that fires on a test fixture is a gate someone switches off, so the scan
 * now extracts regex literals first and looks only inside them. Two real violations survived that change, both
 * introduced minutes earlier by the rename this check exists to police.
 *
 * Exit codes: 0 clean, 1 a violation, 2 the scan could not run. Never zero for "could not tell".
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOTS = ["scripts", "backend/src", "frontend/src", "services", "tools", "examples/src", "evals"];

/**
 * This check's own test fixtures, exempt **by name**.
 *
 * That file plants the violations on purpose — it is how we know the scanner fires at all. It is named
 * individually rather than matched by a `*.test.*` pattern, and the distinction is load-bearing: one of the two
 * real violations this check found on its first run was in `tools/email/src/__tests__/email.test.ts`. A rule
 * that skipped test files would have skipped that, and a check that cannot see the place a defect actually
 * landed is worth very little.
 */
export const EXEMPT = new Set(["scripts/check-regex-alternations.test.mjs"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", ".claude", ".docusaurus", "coverage", "worktrees"]);
const EXTENSIONS = [".mjs", ".js", ".ts", ".tsx"];

/**
 * A group with at least one `|` and no nested parentheses.
 *
 * The leading `(?:`, `(?<name>`, `(?=` and `(?!` forms are recognised so the branches are split on the right
 * text rather than on the group's own prefix.
 */
const GROUP = /\((\?:|\?<[A-Za-z_][A-Za-z0-9_]*>|\?=|\?!|\?<=|\?<!)?([^()]*\|[^()]*)\)/g;

/** The branches a group lists, or `null` when it is not ours to judge. */
export const duplicateBranches = (inner) => {
  const branches = splitBranches(inner);
  if (branches === null) return null;
  // An empty branch is a deliberate "optionally this", not a duplicate to report.
  if (branches.some((b) => b.length === 0)) return null;
  const seen = new Set();
  const repeated = new Set();
  for (const branch of branches) {
    if (seen.has(branch)) repeated.add(branch);
    seen.add(branch);
  }
  return repeated.size === 0 ? null : [...repeated];
};

/**
 * Split on `|`, respecting escapes and character classes.
 *
 * `[a|b]` is a class containing a literal pipe, not an alternation, and splitting inside one would invent
 * branches that do not exist. `\|` is a literal pipe for the same reason.
 */
export const splitBranches = (inner) => {
  const out = [];
  let current = "";
  let inClass = false;
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i];
    if (char === "\\") {
      current += char + (inner[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    if (char === "|" && !inClass) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out.length < 2 ? null : out;
};

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
};

/**
 * The regex literals in a source file, as `{ index, body }`.
 *
 * Detected rather than parsed, and the heuristic is the usual one: a `/` that *follows* a position where a
 * regex may legally start (an operator, an opening bracket, a comma, `return`, the start of a line) begins one;
 * anything else is division or a path. Character classes are consumed whole, because `/[a/b]/` contains a
 * slash that does not close it.
 *
 * Deliberately conservative. Missing a literal costs one unchecked pattern; inventing one costs a violation
 * reported against a string, and this check earns its place only by being quiet when the code is right.
 */
export const regexLiterals = (source) => {
  const out = [];
  const PRECEDES = new Set(["=", "(", ",", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "*", "~", "^", "%", ">", "<"]);
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== "/") continue;
    // Comments are not regexes.
    if (source[i + 1] === "/" || source[i + 1] === "*") {
      const end = source[i + 1] === "/" ? source.indexOf("\n", i) : source.indexOf("*/", i) + 1;
      i = end === -1 || end === 0 ? source.length : end;
      continue;
    }
    let back = i - 1;
    while (back >= 0 && (source[back] === " " || source[back] === "\t")) back -= 1;
    const prev = back < 0 ? "\n" : source[back];
    const isStart = prev === "\n" || PRECEDES.has(prev) || /\breturn$/.test(source.slice(Math.max(0, back - 6), back + 1));
    if (!isStart) continue;
    let j = i + 1;
    let inClass = false;
    let body = "";
    let closed = false;
    for (; j < source.length; j += 1) {
      const char = source[j];
      if (char === "\\") {
        body += char + (source[j + 1] ?? "");
        j += 1;
        continue;
      }
      if (char === "\n") break;
      if (char === "[") inClass = true;
      else if (char === "]") inClass = false;
      else if (char === "/" && !inClass) {
        closed = true;
        break;
      }
      body += char;
    }
    if (!closed || body.length === 0) continue;
    out.push({ index: i, body });
    i = j;
  }
  return out;
};

/** Every violation in one file's text, with the line each sits on. */
export const violationsIn = (source) => {
  const found = [];
  for (const { index, body } of regexLiterals(source)) {
    for (const match of body.matchAll(GROUP)) {
      const repeated = duplicateBranches(match[2]);
      if (repeated === null) continue;
      const line = source.slice(0, index).split("\n").length;
      found.push({ line, group: match[0], repeated });
    }
  }
  return found;
};

const main = () => {
  const files = ROOTS.flatMap((root) => {
    try {
      return walk(resolve(root));
    } catch {
      return [];
    }
  });

  /**
   * A floor, for the reason this check exists.
   *
   * Scanning nothing and reporting success is the exact failure this gate was written to prevent, and it would
   * be absurd for the gate to commit it. If the roots move, this goes red rather than quiet.
   */
  if (files.length === 0) {
    console.error("✗ found no source to scan — the roots moved, so this check is checking nothing");
    process.exit(2);
  }

  const violations = [];
  for (const file of files) {
    if (EXEMPT.has(relative(process.cwd(), file))) continue;
    for (const { line, group, repeated } of violationsIn(readFileSync(file, "utf8"))) {
      violations.push(
        `${file}:${line}: ${group} lists ${repeated.map((r) => `"${r}"`).join(", ")} more than once — ` +
          "an alternation with one branch, which matches less than it appears to",
      );
    }
  }

  if (violations.length > 0) {
    for (const violation of violations) console.error(`✗ ${violation}`);
    console.error(
      `\n${violations.length} duplicated alternation branch(es). This is what a find-and-replace leaves when it\n` +
        "rewrites both sides of a `(?:old|new)` pair. Check what the pattern is supposed to match now — the\n" +
        "usual damage is a scan that quietly matches nothing and reports success.",
    );
    process.exit(1);
  }

  console.log(`✓ no alternation lists the same branch twice, across ${files.length} files`);
};

if (process.argv[1] === resolve(import.meta.dirname, "check-regex-alternations.mjs")) main();
