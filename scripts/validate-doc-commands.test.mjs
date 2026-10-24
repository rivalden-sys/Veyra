import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const validatorSource = join(dirname(fileURLToPath(import.meta.url)), 'validate-doc-commands.mjs');

function makeFixture(t, overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'veyra-doc-commands-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'docs'));
  copyFileSync(validatorSource, join(root, 'scripts', 'validate-doc-commands.mjs'));
  writeFileSync(join(root, 'scripts', 'validate-example.mjs'), 'console.log("ok");\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { dev: 'next dev', lint: 'eslint .' } }));
  const docs = {
    'README.md': 'Run `npm run dev` and `node scripts/validate-example.mjs`.\n',
    'CONTRIBUTING.md': 'Run `npm run lint`.\n',
    'docs/TESTING.md': 'Run `node ./scripts/validate-example.mjs`.\n',
    ...overrides,
  };
  for (const [path, text] of Object.entries(docs)) {
    if (text !== null) writeFileSync(join(root, path), text);
  }
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [join(root, 'scripts', 'validate-doc-commands.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('passes for documented commands that exist', (t) => {
  const result = run(makeFixture(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /passed \(4 commands checked\)/);
});

test('rejects an undefined npm run command with source location', (t) => {
  const result = run(makeFixture(t, { 'README.md': 'Try npm run nonexistent\n' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /README\.md:1: npm script "nonexistent" is not defined/);
});

test('rejects a missing node script with source location', (t) => {
  const result = run(makeFixture(t, { 'README.md': 'Try node scripts/unknown.mjs\n' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /README\.md:1: script "scripts\/unknown\.mjs" is missing/);
});

test('reports a missing required documentation file', (t) => {
  const result = run(makeFixture(t, { 'docs/TESTING.md': null }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /docs\/TESTING\.md: document is missing/);
});

test('rejects a documentation set without any commands', (t) => {
  const result = run(makeFixture(t, {
    'README.md': 'Hello.\n',
    'CONTRIBUTING.md': 'Welcome.\n',
    'docs/TESTING.md': 'Testing.\n',
  }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No documented commands were found/);
});
