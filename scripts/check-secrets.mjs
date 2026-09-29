// Fails if anything that looks like an API key ends up in a built bundle or tracked file.
// Run after `npm run build`. Used by the threat model's "no keys in the browser build" control.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['apps/web/dist', 'apps/web/dist-single', 'packages', 'apps/web/src', 'docs'];
const SKIP = /node_modules|\.png$|\.woff2?$|check-secrets/;
const PATTERNS = [/sk-ant-[A-Za-z0-9_-]{20,}/, /sk-[A-Za-z0-9]{32,}/, /AIza[0-9A-Za-z_-]{35}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

let hits = 0;
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) walk(p);
    else {
      const text = readFileSync(p, 'utf8');
      for (const re of PATTERNS) if (re.test(text)) { console.error(`Possible secret in ${p} (${re})`); hits++; }
    }
  }
}
ROOTS.forEach(walk);
if (hits) process.exit(1);
console.log('check-secrets: no secrets found');
