#!/usr/bin/env node
/**
 * Build docs/design/permission-matrix-cases.json from permission-matrix.md §2 table.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const md = readFileSync('docs/design/permission-matrix.md', 'utf8');
const tableStart = md.indexOf('| Action / 操作 |');
const tableEnd = md.indexOf('---\n\n## 3.', tableStart);
const chunk = md.slice(tableStart, tableEnd);
const lines = chunk.split('\n').filter((l) => l.startsWith('|') && !l.includes('---'));

const cases = [];
let rowIndex = 0;
for (const line of lines.slice(1)) {
  const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
  if (cols.length < 4) continue;
  const [action, user, admin, owner] = cols;
  rowIndex++;
  cases.push({
    id: `row-${rowIndex}`,
    action,
    user: user.slice(0, 80),
    admin: admin.slice(0, 80),
    owner: owner.slice(0, 80),
  });
}

writeFileSync(
  'docs/design/permission-matrix-cases.json',
  JSON.stringify({ source: 'docs/design/permission-matrix.md', cases }, null, 2),
);
console.log(`Wrote ${cases.length} matrix rows to permission-matrix-cases.json`);
