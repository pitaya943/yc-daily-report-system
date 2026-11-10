#!/usr/bin/env node
/**
 * Traceability gate: all B-001–B-098 + BDD-001–BDD-011 with asserting tests.
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

const pattern = /B-\d{3}/g;
const bddPattern = /BDD-\d{3}/g;

const fileTexts = new Map();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory() && name !== 'node_modules' && name !== 'dist') {
      walk(p);
    } else if (/\.(spec|test)\.(ts|tsx)$/.test(name)) {
      fileTexts.set(p, readFileSync(p, 'utf8'));
    }
  }
}

for (const root of roots) walk(root);

function idsInText(text) {
  const set = new Set();
  for (const m of (text + '').matchAll(pattern)) set.add(m[0]);
  for (const m of (text + '').matchAll(bddPattern)) set.add(m[0]);
  return set;
}

function ruleAsserted(ruleId) {
  for (const [path, text] of fileTexts) {
    if (!text.includes(ruleId) || !text.includes('expect(')) continue;

    const name = path.split('/').pop() ?? '';
    if (name.includes(ruleId)) return { ok: true, file: path };

    const blocks = text.split(/\b(?:it|test)\s*\(/);
    for (const block of blocks) {
      if (block.includes(ruleId) && block.includes('expect(')) {
        return { ok: true, file: path };
      }
    }

    const describes = text.split(/\bdescribe\s*\(/);
    for (const db of describes) {
      if (!db.includes(ruleId)) continue;
      const its = db.split(/\b(?:it|test)\s*\(/);
      for (const block of its) {
        if (block.includes('expect(')) return { ok: true, file: path };
      }
    }
  }
  return { ok: false };
}

const missingB = [];
const missingBdd = [];

for (let n = 1; n <= 98; n++) {
  const id = `B-${String(n).padStart(3, '0')}`;
  if (!ruleAsserted(id).ok) missingB.push(id);
}

for (let n = 1; n <= 11; n++) {
  const id = `BDD-${String(n).padStart(3, '0')}`;
  if (!ruleAsserted(id).ok) missingBdd.push(id);
}

const found = new Set();
for (const text of fileTexts.values()) {
  for (const id of idsInText(text)) found.add(id);
}

console.log(
  `Rules referenced in tests (${found.size}):`,
  [...found].sort().join(', '),
);

if (missingB.length) {
  console.error(`Missing B-rules (${missingB.length}):`, missingB.join(', '));
}
if (missingBdd.length) {
  console.error(`Missing BDD (${missingBdd.length}):`, missingBdd.join(', '));
}

if (missingB.length || missingBdd.length) {
  process.exit(1);
}

console.log('Coverage gate: B-001–B-098 and BDD-001–BDD-011 satisfied.');
