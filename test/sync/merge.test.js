import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge } from '../../src/sync/merge.js';

const LAST_SYNC = '2024-01-01T00:00:00.000Z';
const empty = { ingredients: [], fixedCostItems: [], menus: [], tombstones: [] };

test('local-only item survives into the merged result', () => {
  const local = { ...empty, ingredients: [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }] };
  const { merged, conflicts } = merge(local, empty, LAST_SYNC);
  assert.deepEqual(merged.ingredients, local.ingredients);
  assert.deepEqual(conflicts, []);
});

test('remote-only item survives into the merged result', () => {
  const remote = { ...empty, ingredients: [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }] };
  const { merged, conflicts } = merge(empty, remote, LAST_SYNC);
  assert.deepEqual(merged.ingredients, remote.ingredients);
  assert.deepEqual(conflicts, []);
});

test('tombstone wins over both sides when deletion is newer than both updates', () => {
  const local = {
    ...empty,
    ingredients: [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }],
    tombstones: [{ id: 'a', deletedAt: '2024-01-03T00:00:00.000Z' }],
  };
  const remote = { ...empty, ingredients: [{ id: 'a', updatedAt: '2024-01-02T12:00:00.000Z' }] };
  const { merged } = merge(local, remote, LAST_SYNC);
  assert.deepEqual(merged.ingredients, []);
});

test('item re-created after deletion survives despite an older tombstone', () => {
  const local = {
    ...empty,
    ingredients: [{ id: 'a', updatedAt: '2024-01-05T00:00:00.000Z' }],
    tombstones: [{ id: 'a', deletedAt: '2024-01-03T00:00:00.000Z' }],
  };
  const { merged } = merge(local, empty, LAST_SYNC);
  assert.deepEqual(merged.ingredients, local.ingredients);
});

test('no conflict when only the local side changed since lastSyncAt', () => {
  const local = { ...empty, ingredients: [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }] };
  const remote = { ...empty, ingredients: [{ id: 'a', updatedAt: '2023-01-01T00:00:00.000Z' }] };
  const { merged, conflicts } = merge(local, remote, LAST_SYNC);
  assert.deepEqual(conflicts, []);
  assert.deepEqual(merged.ingredients, local.ingredients);
});

test('flags a conflict and tentatively picks local when both sides changed with differing timestamps', () => {
  const local = { ...empty, ingredients: [{ id: 'a', name: 'local', updatedAt: '2024-02-01T00:00:00.000Z' }] };
  const remote = { ...empty, ingredients: [{ id: 'a', name: 'remote', updatedAt: '2024-02-02T00:00:00.000Z' }] };
  const { merged, conflicts } = merge(local, remote, LAST_SYNC);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, 'ingredient');
  assert.deepEqual(conflicts[0].localItem, local.ingredients[0]);
  assert.deepEqual(conflicts[0].remoteItem, remote.ingredients[0]);
  assert.deepEqual(merged.ingredients, local.ingredients);
});

test('merges tombstones from both sides, keeping the newest deletedAt per id', () => {
  const local = { ...empty, tombstones: [{ id: 'a', type: 'ingredient', deletedAt: '2024-01-01T00:00:00.000Z' }] };
  const remote = { ...empty, tombstones: [{ id: 'a', type: 'ingredient', deletedAt: '2024-02-01T00:00:00.000Z' }] };
  const { merged } = merge(local, remote, LAST_SYNC);
  assert.deepEqual(merged.tombstones, [{ id: 'a', type: 'ingredient', deletedAt: '2024-02-01T00:00:00.000Z' }]);
});
