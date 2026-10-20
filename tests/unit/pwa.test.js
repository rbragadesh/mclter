import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentVersion } from '../../scripts/bump-sw.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((f) => (statSync(join(ROOT, dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

test('service worker caches every app file (so the iPad works offline)', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));
  const onDisk = ['index.html', 'manifest.webmanifest', ...walk('js'), ...walk('css'), ...walk('icons')];
  for (const f of onDisk) assert.ok(listed.has(f), `${f} is missing from sw.js ASSETS`);
  for (const f of listed) assert.ok(existsSync(join(ROOT, f)), `sw.js lists ${f} but it does not exist`);
});

test('manifest and iOS tags point at real files', () => {
  const m = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  for (const i of m.icons) assert.ok(existsSync(join(ROOT, i.src)), i.src);
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /viewport-fit=cover/);
  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) assert.ok(existsSync(join(ROOT, href)), href);
});

test('every relative import resolves', () => {
  for (const f of walk('js')) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for (const [, spec] of src.matchAll(/from '(\.[^']+)'/g)) {
      const target = join(ROOT, f, '..', spec);
      assert.ok(existsSync(target), `${f} imports missing ${spec}`);
    }
  }
});

test('sw.js VERSION matches the files (run `npm run bump` after any change)', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const v = sw.match(/const VERSION = '([^']*)'/)[1];
  assert.equal(v, contentVersion(), 'cache version is stale: installed iPads would keep the old app');
});
