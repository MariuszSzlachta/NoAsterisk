const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const run = (content, name = "fixture.spec.ts") => {
  const directory = mkdtempSync(join(tmpdir(), "vault-strict-"));
  const file = join(directory, name);
  try {
    writeFileSync(file, content);
    return spawnSync(
      process.execPath,
      ["scripts/quality/ts-strict-ast-check.cjs", "all", file],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};
test("rejects assertions including as const in tests", () => {
  for (const source of [
    "const x = [] as const;",
    "const x = value as string;",
    "const x = <string>value;",
  ]) {
    const result = run(source);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /type assertion/);
  }
});
test("rejects any, nonnull and real suppression comments", () => {
  const result = run("// @ts-expect-error\nconst x: any = value!;");
  assert.equal(result.status, 1);
  for (const rule of ["any", "non-null assertion", "suppression directive"])
    assert.ok(result.stderr.includes(rule));
});
test("accepts import aliases and literal suppression descriptions", () => {
  assert.equal(
    run(
      'import { value as renamed } from "module"; const description = "@ts-ignore";',
    ).status,
    0,
  );
});
