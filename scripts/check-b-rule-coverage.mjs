#!/usr/bin/env node
/**
 * Traceability gate: B-001–B-050 enforced; B-051–B-098 report-only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  'apps/api',
  'packages/validation',
  'packages/allocation',
  'packages/payroll',
  'packages/bank-crypto',
  'e2e',
];
const found = new Set();
const pattern = /B-\d{3}/g;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory() && name !== 'node_modules' && name !== 'dist') {
      walk(p);
    } else if (/\.(spec|test)\.(ts|tsx)$/.test(name)) {
      const text = readFileSync(p, 'utf8');
      for (const m of (name + text).matchAll(pattern)) {
        found.add(m[0]);
      }
    }
  }
}

for (const root of roots) {
  walk(root);
}

const enforced = [];
const reportOnly = [];
for (let n = 1; n <= 98; n++) {
  const id = `B-${String(n).padStart(3, '0')}`;
  if (!found.has(id)) {
    if (n <= 50) enforced.push(id);
    else reportOnly.push(id);
  }
}

console.log(`B-rules referenced in tests (${found.size}):`, [...found].sort().join(', '));

if (reportOnly.length) {
  console.warn(
    `S6b report-only missing (${reportOnly.length}):`,
    reportOnly.join(', '),
  );
}

if (enforced.length) {
  console.error(
    `S6a enforced missing (${enforced.length}):`,
    enforced.join(', '),
  );
  process.exit(1);
}

console.log('S6a coverage gate: B-001–B-050 satisfied.');
