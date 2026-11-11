import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Noto Sans TC (OFL) via @fontsource — Traditional Chinese subset. */
export function resolveNotoSansTcFont(): string {
  const candidates = [
    join(
      process.cwd(),
      'node_modules/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff',
    ),
    join(
      __dirname,
      '../../node_modules/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff',
    ),
    join(__dirname, '../assets/fonts/NotoSansTC-Regular.otf'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error('Noto Sans TC font file not found (install @fontsource/noto-sans-tc)');
}
