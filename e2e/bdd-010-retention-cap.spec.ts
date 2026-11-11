import { test, expect } from '@playwright/test';

function periodRetention(periodRaw: number, ytdBefore: number, cap: number) {
  const room = Math.max(0, cap - ytdBefore);
  return Math.max(0, Math.min(periodRaw, room));
}

test('BDD-010 PROVISIONAL(Q-060) cap change clamp', () => {
  expect(periodRetention(1000, 59000, 60000)).toBe(1000);
  expect(periodRetention(5000, 58000, 60000)).toBe(2000);
});
