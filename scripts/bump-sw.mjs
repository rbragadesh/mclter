// Sets sw.js VERSION to a hash of every cached file, so any change reaches installed iPads.
// Run after editing app files: `npm run bump` (a unit test fails if you forget).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function contentVersion() {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const files = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]);
  const h = createHash('sha256');
  for (const f of files) h.update(f).update(readFileSync(join(ROOT, f)));
  return `mathclimb-${h.digest('hex').slice(0, 10)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = join(ROOT, 'sw.js');
  const v = contentVersion();
  writeFileSync(path, readFileSync(path, 'utf8').replace(/const VERSION = '[^']*';/, `const VERSION = '${v}';`));
  console.log('sw.js VERSION =', v);
}
