import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTombstone } from '../../src/records/tombstones.js';

test('adds a new tombstone', () => {
  const result = addTombstone([], 'a', 'ingredient', '2024-01-01T00:00:00.000Z');
  assert.deepEqual(result, [{ id: 'a', type: 'ingredient', deletedAt: '2024-01-01T00:00:00.000Z' }]);
});

test('replaces an existing tombstone for the same id, without mutating input', () => {
  const stones = [{ id: 'a', type: 'ingredient', deletedAt: '2024-01-01T00:00:00.000Z' }];
  const result = addTombstone(stones, 'a', 'ingredient', '2024-06-01T00:00:00.000Z');
  assert.deepEqual(result, [{ id: 'a', type: 'ingredient', deletedAt: '2024-06-01T00:00:00.000Z' }]);
  assert.equal(stones[0].deletedAt, '2024-01-01T00:00:00.000Z');
});
