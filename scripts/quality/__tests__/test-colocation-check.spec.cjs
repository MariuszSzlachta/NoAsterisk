const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const run = (files, options = []) => {
  const directory = mkdtempSync(join(tmpdir(), 'test-colocation-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const filename = join(directory, name);
      mkdirSync(join(filename, '..'), { recursive: true });
      writeFileSync(filename, content);
    }
    return spawnSync(
      process.execPath,
      ['scripts/quality/test-colocation-check.cjs', ...options, directory],
      { encoding: 'utf8' },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

test('accepts production files without arrow-function code', () => {
  const result = run({ 'value.ts': 'export const value = 42;\n' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /0 with arrow functions, 0 missing/);
});

test('requires a colocated spec for arrow-function code', () => {
  const result = run({ 'compute.ts': 'export const compute = () => 42;\n' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /compute\.ts:1: missing colocated spec/);
});

test('accepts exact and qualified colocated spec names', () => {
  for (const specName of ['compute.spec.ts', 'compute.integration.spec.ts']) {
    const result = run({
      'compute.ts': 'export const compute = () => 42;\n',
      [specName]: "import { test } from 'node:test';\n",
    });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('does not accept an unrelated colocated spec', () => {
  const result = run({
    'compute.ts': 'export const compute = () => 42;\n',
    'other.spec.ts': "import { test } from 'node:test';\n",
  });
  assert.equal(result.status, 1);
});

test('ignores tests, stories and function type declarations', () => {
  const result = run({
    'component.stories.tsx': 'export const Story = () => null;\n',
    'component.spec.tsx': 'const render = () => null;\n',
    'types.ts': 'export type Handler = () => void;\n',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 with arrow functions, 0 missing/);
});

test('checks index files when they contain implementation', () => {
  const result = run({ 'index.ts': 'export const load = () => 42;\n' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /index\.ts:1: missing colocated spec/);
});

test('detects nested and inline arrow functions', () => {
  const result = run({
    'options.ts': 'export const values = [1].map((value) => value + 1);\n',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /options\.ts:1: missing colocated spec/);
});

test('summary mode reports the count without printing every violation', () => {
  const result = run(
    { 'compute.ts': 'export const compute = () => 42;\n' },
    ['--summary'],
  );
  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /1 missing colocated spec/);
});
