import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overLimit, clientIp } from '../lib/rate-limit-core.ts';
test('sliding window counts the remaining share of last minute', () => {
  assert.equal(overLimit(5, 0, 0.5, 6), false);
  assert.equal(overLimit(7, 0, 0.5, 6), true);
  assert.equal(overLimit(3, 10, 0.5, 6), true);   // 3 + 10*0.5 = 8
  assert.equal(overLimit(3, 10, 0.9, 6), false);  // 3 + 10*0.1 = 4
  assert.equal(overLimit(1, 100, 1.5, 6), false); // fraction clamped
});
test('client ip prefers the proxy headers', () => {
  const r = (h) => new Request('https://x.test', { headers: h });
  assert.equal(clientIp(r({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' })), '1.2.3.4');
  assert.equal(clientIp(r({ 'cf-connecting-ip': '5.6.7.8', 'x-forwarded-for': '1.2.3.4' })), '5.6.7.8');
  assert.equal(clientIp(r({})), 'anon');
});
