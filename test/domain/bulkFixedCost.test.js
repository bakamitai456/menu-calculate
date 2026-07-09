import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFixedCostToAllMenus, removeFixedCostFromAllMenus } from '../../src/domain/bulkFixedCost.js';

const NOW = '2026-07-09T00:00:00.000Z';

test('applyFixedCostToAllMenus adds the item only to menus missing it', () => {
  const menus = [
    { id: 'm1', fixedCostItems: [], updatedAt: '2020-01-01T00:00:00.000Z' },
    { id: 'm2', fixedCostItems: [{ fixedCostItemId: 'fc1', qty: 5 }], updatedAt: '2020-01-01T00:00:00.000Z' },
  ];
  const result = applyFixedCostToAllMenus(menus, 'fc1', 2, NOW);
  assert.deepEqual(result[0].fixedCostItems, [{ fixedCostItemId: 'fc1', qty: 2 }]);
  assert.equal(result[0].updatedAt, NOW);
  assert.deepEqual(result[1].fixedCostItems, [{ fixedCostItemId: 'fc1', qty: 5 }]);
  assert.equal(result[1].updatedAt, '2020-01-01T00:00:00.000Z');
});

test('applyFixedCostToAllMenus is a no-op when every menu already has the item', () => {
  const menus = [{ id: 'm1', fixedCostItems: [{ fixedCostItemId: 'fc1', qty: 1 }], updatedAt: '2020-01-01T00:00:00.000Z' }];
  const result = applyFixedCostToAllMenus(menus, 'fc1', 2, NOW);
  assert.equal(result[0], menus[0]);
});

test('applyFixedCostToAllMenus does not mutate the input menus', () => {
  const menus = [{ id: 'm1', fixedCostItems: [], updatedAt: '2020-01-01T00:00:00.000Z' }];
  applyFixedCostToAllMenus(menus, 'fc1', 2, NOW);
  assert.deepEqual(menus[0].fixedCostItems, []);
});

test('removeFixedCostFromAllMenus strips the item only from menus that have it', () => {
  const menus = [
    { id: 'm1', fixedCostItems: [{ fixedCostItemId: 'fc1', qty: 2 }, { fixedCostItemId: 'fc2', qty: 1 }], updatedAt: '2020-01-01T00:00:00.000Z' },
    { id: 'm2', fixedCostItems: [{ fixedCostItemId: 'fc2', qty: 1 }], updatedAt: '2020-01-01T00:00:00.000Z' },
  ];
  const result = removeFixedCostFromAllMenus(menus, 'fc1', NOW);
  assert.deepEqual(result[0].fixedCostItems, [{ fixedCostItemId: 'fc2', qty: 1 }]);
  assert.equal(result[0].updatedAt, NOW);
  assert.equal(result[1], menus[1]);
});

test('removeFixedCostFromAllMenus is a no-op when no menu references the item', () => {
  const menus = [{ id: 'm1', fixedCostItems: [{ fixedCostItemId: 'fc2', qty: 1 }], updatedAt: '2020-01-01T00:00:00.000Z' }];
  const result = removeFixedCostFromAllMenus(menus, 'fc1', NOW);
  assert.equal(result[0], menus[0]);
});
