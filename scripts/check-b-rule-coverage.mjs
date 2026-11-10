#!/usr/bin/env node
/**
 * S2: scan test file names for B-rule IDs (traceability stub).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps/api', 'packages/validation', 'e2e'];
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
      const base = name + text;
      for (const m of base.matchAll(pattern)) {
        found.add(m[0]);
      }
    }
  }
}

for (const root of roots) {
  walk(root);
}

console.log(`B-rules referenced in tests (${found.size}):`, [...found].sort().join(', '));
