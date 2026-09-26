/**
 * The duplicate-branch check actually fires — and only on regexes.
 *
 * This file exists because the check it covers was written in response to a gate that passed while checking
 * nothing. Asserting "the repository is clean" would repeat that mistake: a scanner that matched nothing at all
 * would satisfy it. So every case below plants a violation and demands it be found, and the negative cases
 * plant the shapes that must **not** be reported.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { duplicateBranches, EXEMPT, regexLiterals, splitBranches, violationsIn } from "./check-regex-alternations.mjs";

test("the six shapes the rebrand produced are all caught", () => {
  // Each of these was a real line in this repository. `(?:forge|forge)` appeared four times, `(FORGE|FORGE)`
  // once, and one carried a third branch that made it easy to read past.
  const planted = [
    'const IMPORT = /import\\s*\\{([^}]*)\\}\\s*from\\s*"@(?:forge|forge)\\/agentkit"/g;',
    'if (/^@(forge|forge)\\/[^/]+\\/(src|dist)\\//.test(spec)) add("R1");',
    'const appModule = /^ENV (?:FORGE|FORGE)_APP_MODULE=(\\S+)/m.exec(dockerfile);',
    'for (const m of source.matchAll(/from\\s+"(@(forge|forge)\\/[a-z0-9-]+)"/g)) out.add(m[1]);',
    'if (/(^|[/\\\\])(retinue|retinue|bin\\.js)$/.test(process.argv[1])) start();',
    'expect(raw).toMatch(/boundary="=_(?:retinue|retinue)_[0-9a-f]{32}"/);',
  ];
  for (const line of planted) {
    const found = violationsIn(line);
    assert.equal(found.length, 1, `not caught: ${line}`);
  }
});

test("a markdown table in a string is not a regex, and is not reported", () => {
  /**
   * The regression this check nearly shipped with. The first version scanned any parenthesised text containing
   * a `|` and reported 37 of these — pipes that are table cells in a test fixture. A gate that fires on correct
   * code is a gate someone switches off.
   */
  const fixtures = [
    'expect(md).toContain("| Chrome | 69 | Full support |");',
    'expect(md).toContain("| --- | --- | --- |");',
    "const row = `|---|---|---|---|`;",
    'console.log("a | b | a");',
  ];
  for (const line of fixtures) {
    assert.deepEqual(violationsIn(line), [], `false positive on: ${line}`);
  }
});

test("division is not a regex", () => {
  // `(a|a)` here is inside no regex at all — the slashes are arithmetic.
  assert.deepEqual(violationsIn("const ratio = total / count; // (a|a)"), []);
  assert.deepEqual(violationsIn("const x = (width|height) / 2;"), []);
});

test("a comment containing a slash does not start a literal", () => {
  assert.deepEqual(violationsIn("// see https://example.test/(a|a)/docs"), []);
  assert.deepEqual(violationsIn("/* a block comment with /(a|a)/ inside */"), []);
});

test("a distinct alternation is left alone", () => {
  assert.deepEqual(violationsIn("const RE = /(?:retinue|agentkit)_[A-Z]+/;"), []);
  assert.deepEqual(violationsIn("const RE = /^(get|post|put|delete)$/;"), []);
});

test("an empty branch is a deliberate optional, not a duplicate", () => {
  // `(a|)` means "a, or nothing". Reporting it would fire on correct code.
  assert.equal(duplicateBranches("a|"), null);
  assert.equal(duplicateBranches("|"), null);
});

test("a pipe inside a character class is a literal pipe, not a separator", () => {
  // `[a|b]` is one class matching three characters. Splitting inside it would invent branches.
  assert.deepEqual(splitBranches("[a|b]"), null);
  assert.deepEqual(violationsIn("const RE = /^[a|b]+$/;"), []);
});

test("an escaped pipe does not split a branch", () => {
  assert.deepEqual(splitBranches("a\\|b"), null);
});

test("a repeat anywhere in the list is caught, not only an adjacent pair", () => {
  // `(a|b|a)` is the one a reader skims past, because the duplicates are not side by side.
  assert.deepEqual(duplicateBranches("a|b|a"), ["a"]);
  assert.deepEqual(duplicateBranches("a|b|c"), null);
});

test("regex literals are found where they legally start", () => {
  assert.equal(regexLiterals("const RE = /abc/;").length, 1);
  assert.equal(regexLiterals("if (/abc/.test(x)) y();").length, 1);
  assert.equal(regexLiterals("return /abc/;").length, 1);
  assert.equal(regexLiterals("const path = a / b / c;").length, 0);
});

test("a class containing a slash does not end the literal early", () => {
  // `/[a/b]|[a/b]/` closes at the final slash, not the one inside the class. Ending early would hide the
  // duplicate that follows it.
  const [literal] = regexLiterals("const RE = /[a/b]|[a/b]/;");
  assert.equal(literal.body, "[a/b]|[a/b]");
  assert.equal(violationsIn("const RE = /([a/b]|[a/b])/;").length, 1);
});

test("the reported line is the line the regex is on", () => {
  const source = ["const a = 1;", "const b = 2;", "const RE = /(?:x|x)/;"].join("\n");
  assert.deepEqual(
    violationsIn(source).map((v) => v.line),
    [3],
  );
});

test("exactly one file is exempt, and it is this one", () => {
  /**
   * The exemption list is where a gate goes to die. One entry, named, and asserted here so that adding a second
   * is a deliberate act with a test to update rather than a quiet line in a diff. In particular it must never
   * become a `*.test.*` pattern: the first real violation this check found was in a test file.
   */
  assert.deepEqual([...EXEMPT], ["scripts/check-regex-alternations.test.mjs"]);
});
