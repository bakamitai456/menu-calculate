import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, fmtPct } from '../../src/domain/format.js';

test('fmt renders 2 decimal places', () => {
  assert.equal(fmt(1), '1.00');
  assert.equal(fmt(1.005), '1.00');
});

test('fmt renders NaN as an em dash', () => {
  assert.equal(fmt(NaN), '—');
});

test('fmtPct renders 1 decimal place with a percent sign', () => {
  assert.equal(fmtPct(12.34), '12.3%');
});
