import { test } from 'node:test';
import assert from 'node:assert/strict';
import { upsertById, removeById } from '../../src/records/listOps.js';

test('upsertById appends a new item', () => {
  const list = [{ id: 'a', v: 1 }];
  const result = upsertById(list, { id: 'b', v: 2 });
  assert.deepEqual(result, [{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
  assert.deepEqual(list, [{ id: 'a', v: 1 }]); // original untouched
});

test('upsertById replaces an existing item in place, preserving order', () => {
  const list = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }];
  const result = upsertById(list, { id: 'a', v: 99 });
  assert.deepEqual(result, [{ id: 'a', v: 99 }, { id: 'b', v: 2 }]);
});

test('removeById filters out the matching id without mutating the input', () => {
  const list = [{ id: 'a' }, { id: 'b' }];
  const result = removeById(list, 'a');
  assert.deepEqual(result, [{ id: 'b' }]);
  assert.equal(list.length, 2);
});
