import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateItem } from '../../src/domain/validate.js';

test('requires a non-blank name', () => {
  assert.equal(validateItem({ name: '', bulkQty: 1, bulkPrice: 1 }), 'Name is required.');
  assert.equal(validateItem({ name: '   ', bulkQty: 1, bulkPrice: 1 }), 'Name is required.');
});

test('requires a positive bulkQty', () => {
  assert.equal(validateItem({ name: 'x', bulkQty: 0, bulkPrice: 1 }), 'Qty must be a positive number.');
  assert.equal(validateItem({ name: 'x', bulkQty: NaN, bulkPrice: 1 }), 'Qty must be a positive number.');
});

test('requires a non-negative bulkPrice', () => {
  assert.equal(validateItem({ name: 'x', bulkQty: 1, bulkPrice: -1 }), 'Price must be a non-negative number.');
});

test('returns null when valid', () => {
  assert.equal(validateItem({ name: 'x', bulkQty: 1, bulkPrice: 0 }), null);
});
